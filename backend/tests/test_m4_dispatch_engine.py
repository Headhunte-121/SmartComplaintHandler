"""
Unit & Integration Tests for Module M4: Workload-Balanced Dispatch Engine
Blueprint Reference: V1/M4/backend/01_dispatch_engine.md
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.models.department import Department
from app.models.team import MaintenanceTeam
from app.models.ticket import Ticket
from app.services.dispatch_engine import (
    EMERGENCY_SQUAD_MAP,
    ZONE_AFFINITY_MAP,
    select_optimal_team,
    generate_dispatch_reason,
)

# In-memory SQLite engine with StaticPool
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        # Seed Department 1: Electrical Services
        dept_elec = Department(id=1, name="Electrical Services", description="Power maintenance")
        # Seed Department 2: Plumbing Services
        dept_plumb = Department(id=2, name="Plumbing Services", description="Water maintenance")
        session.add_all([dept_elec, dept_plumb])
        session.commit()

        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def test_maps_and_dictionaries():
    assert 1 in EMERGENCY_SQUAD_MAP
    assert EMERGENCY_SQUAD_MAP[1] == "Substation High-Voltage Team"
    assert EMERGENCY_SQUAD_MAP[2] == "Water Supply Emergency Team"
    assert "Hostel" in ZONE_AFFINITY_MAP
    assert "Academic" in ZONE_AFFINITY_MAP


def test_emergency_critical_short_circuit(db):
    # Squad 1: Routine wiring squad (0 active tickets)
    squad_routine = MaintenanceTeam(
        id=101,
        name="Hostel Wiring Squad",
        department_id=1,
        is_active=True,
    )
    # Squad 2: Designated emergency squad (has 5 active tickets)
    squad_emergency = MaintenanceTeam(
        id=102,
        name="Substation High-Voltage Team",
        department_id=1,
        is_active=True,
    )
    db.add_all([squad_routine, squad_emergency])
    db.commit()

    # Assign 5 tickets to emergency squad
    for i in range(5):
        t = Ticket(
            tracking_code=f"TICK-EM-{i}",
            title="Sparks",
            description="High voltage spark",
            location="Substation",
            priority="CRITICAL",
            status="IN_PROGRESS",
            department_id=1,
            assigned_team_id=squad_emergency.id,
        )
        db.add(t)
    db.commit()

    # CRITICAL priority must short-circuit directly to Substation High-Voltage Team despite higher queue
    selected = select_optimal_team(db, department_id=1, priority="CRITICAL", location="Anywhere")
    assert selected is not None
    assert selected.id == squad_emergency.id
    assert selected.name == "Substation High-Voltage Team"


def test_inactive_squad_exclusion(db):
    # Squad 1: Inactive squad with 0 tickets
    squad_inactive = MaintenanceTeam(
        id=201,
        name="Plumbing Squad A",
        department_id=2,
        is_active=False,
    )
    # Squad 2: Active squad with 3 tickets
    squad_active = MaintenanceTeam(
        id=202,
        name="Plumbing Squad B",
        department_id=2,
        is_active=True,
    )
    db.add_all([squad_inactive, squad_active])
    db.commit()

    # Assign 3 tickets to active squad
    for i in range(3):
        t = Ticket(
            tracking_code=f"TICK-PL-{i}",
            title="Leak",
            description="Pipe leak",
            location="Room",
            priority="MEDIUM",
            status="IN_PROGRESS",
            department_id=2,
            assigned_team_id=squad_active.id,
        )
        db.add(t)
    db.commit()

    # Inactive squad must be skipped; only active squad can be selected
    selected = select_optimal_team(db, department_id=2, priority="MEDIUM", location="Room 101")
    assert selected is not None
    assert selected.id == squad_active.id


def test_least_loaded_queue_balancing(db):
    squad_a = MaintenanceTeam(id=301, name="Electricians North", department_id=1, is_active=True)
    squad_b = MaintenanceTeam(id=302, name="Electricians South", department_id=1, is_active=True)
    db.add_all([squad_a, squad_b])
    db.commit()

    # Give squad_a 3 open tickets, squad_b 1 open ticket
    for i in range(3):
        db.add(Ticket(
            tracking_code=f"TICK-NA-{i}",
            title="Issue",
            description="Details",
            location="North",
            priority="MEDIUM",
            status="IN_PROGRESS",
            department_id=1,
            assigned_team_id=squad_a.id,
        ))
    db.add(Ticket(
        tracking_code="TICK-SB-1",
        title="Issue",
        description="Details",
        location="South",
        priority="MEDIUM",
        status="IN_PROGRESS",
        department_id=1,
        assigned_team_id=squad_b.id,
    ))
    db.commit()

    selected = select_optimal_team(db, department_id=1, priority="MEDIUM", location="Common Area")
    assert selected is not None
    assert selected.id == squad_b.id  # squad_b has lower queue (1 vs 3)


def test_zone_affinity_heuristic(db):
    # Both squads have exactly 2 active tickets
    squad_hostel = MaintenanceTeam(id=401, name="Hostel Plumbing Squad", department_id=2, is_active=True)
    squad_academic = MaintenanceTeam(id=402, name="Academic Plumbing Unit", department_id=2, is_active=True)
    db.add_all([squad_hostel, squad_academic])
    db.commit()

    for sq in [squad_hostel, squad_academic]:
        for i in range(2):
            db.add(Ticket(
                tracking_code=f"TICK-ZONE-{sq.id}-{i}",
                title="Tap broken",
                description="Water drip",
                location="Somewhere",
                priority="LOW",
                status="IN_PROGRESS",
                department_id=2,
                assigned_team_id=sq.id,
            ))
    db.commit()

    # Location in Hostel Block C -> Hostel Plumbing Squad should get zone preference
    selected_hostel = select_optimal_team(
        db, department_id=2, priority="LOW", location="Hostel Block C, Room 102"
    )
    assert selected_hostel is not None
    assert selected_hostel.id == squad_hostel.id

    # Location in Chemistry Lab -> Academic Plumbing Unit should get zone preference
    selected_academic = select_optimal_team(
        db, department_id=2, priority="LOW", location="Science Block, Chemistry Lab 4"
    )
    assert selected_academic is not None
    assert selected_academic.id == squad_academic.id


def test_deterministic_tie_breaking(db):
    # Two neutral squads with identical 0 tickets and neutral location
    squad_x = MaintenanceTeam(id=505, name="General Squad Beta", department_id=1, is_active=True)
    squad_y = MaintenanceTeam(id=502, name="General Squad Alpha", department_id=1, is_active=True)
    db.add_all([squad_x, squad_y])
    db.commit()

    # Tied on queue depth (0) and no zone bonus -> lowest id (502) must win deterministically
    selected = select_optimal_team(db, department_id=1, priority="MEDIUM", location="Outer Lawn")
    assert selected is not None
    assert selected.id == 502


def test_generate_dispatch_reason():
    reason_normal = generate_dispatch_reason(team_name="Hostel Wiring Squad", queue_depth=2, is_emergency=False)
    assert "Dispatched to 'Hostel Wiring Squad'" in reason_normal
    assert "Queue depth: 2 active tickets" in reason_normal

    reason_emergency = generate_dispatch_reason(team_name="Substation High-Voltage Team", queue_depth=10, is_emergency=True)
    assert "Emergency Short-Circuit Dispatch" in reason_emergency
    assert "Substation High-Voltage Team" in reason_emergency
