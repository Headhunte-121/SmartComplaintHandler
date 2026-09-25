"""
Integration tests for Module M5: REST API Endpoints & Service Integration
Blueprint Reference: V1/M5/backend/05_sla_endpoints.md
"""
from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.api.deps import get_db
from app.db.base import Base
from app.models.department import Department
from app.models.team import MaintenanceTeam
from app.models.ticket import Ticket
from app.services.ticket_service import create_ticket

# Setup in-memory SQLite for testing
from sqlalchemy.pool import StaticPool

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        # Seed test department and team
        dept = Department(name="Electrical Services", description="Campus electrical")
        db.add(dept)
        db.commit()
        db.refresh(dept)

        team = MaintenanceTeam(name="Electrical Squad A", department_id=dept.id, active_ticket_count=1)
        db.add(team)
        db.commit()
        db.refresh(team)

        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_status_update_success_and_validation(client, db_session):
    ticket = create_ticket(
        db=db_session,
        tracking_code="TICK-TEST-1",
        title="Flickering lights in lab",
        description="Lights are flickering",
        location="Lab 101",
        priority="HIGH",
    )

    # 1. Valid transition: SUBMITTED -> IN_PROGRESS
    res = client.patch(
        f"/api/v1/tickets/{ticket.id}/status",
        json={"status": "IN_PROGRESS", "notes": "Staff dispatched to site", "actor": "Field Tech A"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "IN_PROGRESS"
    assert "Staff dispatched to site" in data["resolution_notes"]

    # 2. Illegal jump: IN_PROGRESS -> SUBMITTED (not allowed in FSA)
    res_bad = client.patch(
        f"/api/v1/tickets/{ticket.id}/status",
        json={"status": "SUBMITTED", "notes": "Rollback attempt"}
    )
    assert res_bad.status_code == 400
    assert "Invalid transition" in res_bad.json()["detail"]


def test_ticket_resolve_endpoint(client, db_session):
    ticket = create_ticket(
        db=db_session,
        tracking_code="TICK-TEST-2",
        title="Broken water pipe",
        description="Water gushing",
        location="Hostel 3",
        priority="CRITICAL",
    )

    # Move to IN_PROGRESS first
    client.patch(
        f"/api/v1/tickets/{ticket.id}/status",
        json={"status": "IN_PROGRESS", "notes": "Technician on site"}
    )

    # Resolve with < 10 characters should fail schema validation (HTTP 422)
    res_short = client.post(
        f"/api/v1/tickets/{ticket.id}/resolve",
        json={"resolution_notes": "Fixed it"}
    )
    assert res_short.status_code == 422

    # Resolve with >= 10 chars
    res_valid = client.post(
        f"/api/v1/tickets/{ticket.id}/resolve",
        json={
            "resolution_notes": "Replaced burst copper section and pressure-tested line.",
            "parts_replaced": "1m copper pipe, 2x couplers",
            "technician_name": "Dave Miller"
        }
    )
    assert res_valid.status_code == 200
    data = res_valid.json()
    assert data["status"] == "RESOLVED"
    assert data["resolved_at"] is not None
    assert "CLOSURE REPORT" in data["resolution_notes"]
    assert "Dave Miller" in data["resolution_notes"]


def test_ticket_escalate_endpoint(client, db_session):
    ticket = create_ticket(
        db=db_session,
        tracking_code="TICK-TEST-3",
        title="Ceiling fan sparking",
        description="Sparking and smoke",
        location="Room 12",
        priority="HIGH",
    )

    # Move to IN_PROGRESS first
    client.patch(
        f"/api/v1/tickets/{ticket.id}/status",
        json={"status": "IN_PROGRESS", "notes": "Evaluating"}
    )

    # Escalate
    res = client.post(
        f"/api/v1/tickets/{ticket.id}/escalate",
        json={
            "escalation_reason": "Sparking poses immediate fire hazard, need Senior Electrician.",
            "supervisor_id": "SUPERVISOR-42"
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ESCALATED"
    assert "ESCALATION:" in data["resolution_notes"]
    assert "SUPERVISOR-42" in data["resolution_notes"]


def test_get_active_sla_breaches_endpoint(client, db_session):
    # Ticket 1: Breached (created 30 hours ago, MEDIUM priority = 24h deadline)
    past_time = datetime.now(timezone.utc) - timedelta(hours=30)
    dept = db_session.query(Department).first()
    team = db_session.query(MaintenanceTeam).first()

    t_breached = create_ticket(
        db=db_session,
        tracking_code="TICK-BREACH-1",
        title="Overdue repair",
        description="Air conditioner leaking",
        location="Admin Block",
        priority="MEDIUM",
        department_id=dept.id,
        assigned_team_id=team.id,
        created_at=past_time,
    )

    # Ticket 2: Healthy (created 1 hour ago, LOW priority = 72h deadline)
    t_healthy = create_ticket(
        db=db_session,
        tracking_code="TICK-HEALTHY-1",
        title="Routine paint touchup",
        description="Scratched wall",
        location="Corridor A",
        priority="LOW",
        department_id=dept.id,
        assigned_team_id=team.id,
    )

    res = client.get("/api/v1/sla/breaches/active")
    assert res.status_code == 200
    breaches = res.json()
    assert len(breaches) == 1
    assert breaches[0]["tracking_code"] == "TICK-BREACH-1"
    assert breaches[0]["is_breached"] is True
    assert breaches[0]["overdue_seconds"] > 0
    assert breaches[0]["department_name"] == "Electrical Services"
