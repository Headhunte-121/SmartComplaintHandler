"""
Module M3 Test Suite - Deterministic Classification & Priority Engine
Blueprint Reference: docs/V1/M3/backend/07_verification_and_testing.md
Exercises:
1. Priority engine hazard short-circuiting and severity tiers
2. Domain classifier 2.0x title weighting, tie-breaking, and normalized confidence
3. Pydantic V2 schemas, boundary validation, and string enum serialization
4. Service layer dynamic priority intake and administrative overrides with SLA recalculation and audit logs
5. REST API stateless /triage-preview and stateful /tickets/{id}/priority endpoints
"""
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.api.deps import get_db
from app.db.base import Base
from app.models.department import Department
from app.models.team import MaintenanceTeam
from app.models.ticket import Ticket
from app.services.priority_engine import (
    calculate_priority,
    PRIORITY_CRITICAL,
    PRIORITY_HIGH,
    PRIORITY_MEDIUM,
    PRIORITY_LOW,
)
from app.services.classifier import classify_ticket, classify_complaint
from app.schemas.priority import (
    PriorityEnum,
    TriagePreviewRequest,
    TriageResult,
    PriorityOverrideRequest,
)
from app.services.ticket_service import (
    create_ticket,
    override_ticket_priority,
    list_tickets,
)

# Test in-memory database setup
TEST_DB_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        # Seed test departments
        dept_elec = Department(id=1, name="Electrical", description="Electrical repairs")
        dept_plumb = Department(id=2, name="Plumbing", description="Plumbing repairs")
        dept_sanit = Department(id=3, name="Sanitation", description="Cleaning")
        dept_carp = Department(id=4, name="Carpentry", description="Woodwork")
        dept_it = Department(id=5, name="IT Support", description="Networking")
        dept_gen = Department(id=6, name="General Administration", description="General")
        db.add_all([dept_elec, dept_plumb, dept_sanit, dept_carp, dept_it, dept_gen])
        db.commit()

        team_elec = MaintenanceTeam(id=1, name="Rapid Electrical Squad", department_id=1, active_ticket_count=0)
        team_plumb = MaintenanceTeam(id=2, name="Plumbing Unit Alpha", department_id=2, active_ticket_count=0)
        db.add_all([team_elec, team_plumb])
        db.commit()

        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=test_engine)


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


# ==============================================================================
# CHECKPOINT 1: Unit Priority & Classification Engines
# ==============================================================================

def test_priority_engine_hazard_short_circuit():
    """Verify that life-safety hazard terms trigger CRITICAL priority and hazard_detected flag."""
    res = calculate_priority("Sparking socket", "Wires are smoking and sparking in the laboratory")
    assert res["priority"] == PRIORITY_CRITICAL
    assert res["hazard_detected"] is True
    assert "spark" in res["matched_keywords"] or "sparking" in res["matched_keywords"]
    assert "hazard" in res["reason"].lower()


def test_priority_engine_tiers():
    """Verify HIGH, MEDIUM, and LOW priority classifications."""
    # HIGH: Infrastructure outage
    res_high = calculate_priority("Pipe burst", "Main waterline burst, corridor is flooded")
    assert res_high["priority"] == PRIORITY_HIGH
    assert res_high["hazard_detected"] is False

    # MEDIUM: Standard routine maintenance
    res_med = calculate_priority("Ceiling fan slow", "Fan in room 102 spins slowly")
    assert res_med["priority"] == PRIORITY_MEDIUM
    assert res_med["hazard_detected"] is False

    # LOW: Minor cosmetic defect
    res_low = calculate_priority("Desk paint peeling", "Cosmetic scratch and peeling paint on study table")
    assert res_low["priority"] == PRIORITY_LOW
    assert res_low["hazard_detected"] is False


def test_priority_word_boundary_safety():
    """Ensure substring matches like 'paint' in 'complaint' or 'faint' do not trigger false cosmetic LOW."""
    res = calculate_priority("General complaint regarding schedule", "I have a formal student complaint")
    assert res["priority"] == PRIORITY_MEDIUM
    assert "paint" not in res["matched_keywords"]


def test_classifier_taxonomy_routing():
    """Verify domain classification across distinct campus service categories."""
    c_elec = classify_ticket("Broken light bulb", "Tube light and bulb are flickering")
    assert c_elec["department_id"] == 1
    assert c_elec["category"] == "Electrical"
    assert c_elec["confidence"] > 0.6

    c_plumb = classify_ticket("Leaking washroom tap", "Water dripping continuously from bathroom faucet")
    assert c_plumb["department_id"] == 2
    assert c_plumb["category"] == "Plumbing"

    c_it = classify_complaint("Wi-Fi network down", "Cannot connect to campus internet router")
    assert c_it["department_id"] == 5
    assert c_it["category"] == "IT Support"

    c_gen = classify_ticket("Lost ID Card", "Misplaced student identity card near cafeteria")
    assert c_gen["department_id"] == 6
    assert c_gen["category"] == "General"
    assert c_gen["confidence"] == 0.0


def test_classifier_title_weighting():
    """Verify that title matches (2.0x) dominate competing description words (1.0x)."""
    # Title has 1 plumbing term ('Pipe leak'), description mentions 1 electrical term ('fan')
    # Score: Plumbing = 1 * 2.0 = 2.0; Electrical = 1 * 1.0 = 1.0 -> Plumbing wins
    res = classify_ticket("Pipe leak in corridor", "Happened right next to the ceiling fan")
    assert res["department_id"] == 2
    assert res["category"] == "Plumbing"


# ==============================================================================
# CHECKPOINT 2: Pydantic V2 Schemas & Boundaries
# ==============================================================================

def test_priority_enum_properties():
    """Verify PriorityEnum inherits from str and contains exact uppercase members."""
    assert PriorityEnum.CRITICAL == "CRITICAL"
    assert PriorityEnum.HIGH == "HIGH"
    assert PriorityEnum.MEDIUM == "MEDIUM"
    assert PriorityEnum.LOW == "LOW"
    assert isinstance(PriorityEnum.CRITICAL, str)


def test_triage_preview_request_validation():
    """Verify TriagePreviewRequest whitespace stripping and length boundaries."""
    req = TriagePreviewRequest(
        title="  Main switchboard burning  ",
        description="Visible sparks and smoke filling the floor  "
    )
    assert req.title == "Main switchboard burning"
    assert req.description == "Visible sparks and smoke filling the floor"

    # Title too short (< 5 chars)
    with pytest.raises(ValidationError):
        TriagePreviewRequest(title="Bad", description="Sufficient description length")

    # Description too short (< 10 chars)
    with pytest.raises(ValidationError):
        TriagePreviewRequest(title="Valid title here", description="Too short")


def test_triage_result_confidence_bounds():
    """Verify confidence must be bounded between 0.0 and 1.0."""
    valid = TriageResult(
        priority=PriorityEnum.CRITICAL,
        category="Electrical",
        hazard_detected=True,
        confidence=0.95,
        reason="Hazard detected",
        matched_keywords=["spark", "smoke"]
    )
    assert valid.confidence == 0.95

    with pytest.raises(ValidationError):
        TriageResult(
            priority=PriorityEnum.LOW,
            category="General",
            hazard_detected=False,
            confidence=1.5,  # Out of range!
            reason="Invalid",
            matched_keywords=[]
        )


def test_priority_override_request_validation():
    """Verify PriorityOverrideRequest requires at least 5 characters for reason."""
    valid = PriorityOverrideRequest(
        new_priority=PriorityEnum.HIGH,
        override_reason="Escalated due to water pooling near electrical panel"
    )
    assert valid.new_priority == PriorityEnum.HIGH

    # Reason under 5 characters must fail validation
    with pytest.raises(ValidationError):
        PriorityOverrideRequest(
            new_priority=PriorityEnum.LOW,
            override_reason="Bad"
        )


# ==============================================================================
# CHECKPOINT 3: Service Layer Database Transaction & Dynamic Priority
# ==============================================================================

def test_service_create_ticket_dynamic_priority(db_session):
    """Verify create_ticket automatically triages priority and department into SQLite."""
    ticket = create_ticket(
        db=db_session,
        tracking_code="TICK-M3-001",
        title="Fire alarm and smoke in hallway",
        description="Heavy electrical smoke detected in block A corridor",
        location="Hostel Block A",
    )
    assert ticket.priority == "CRITICAL"
    assert ticket.department_id == 1
    assert ticket.sla_deadline is not None
    # Critical SLA is 4 hours
    diff_hours = (ticket.sla_deadline - ticket.created_at).total_seconds() / 3600
    assert abs(diff_hours - 4.0) < 0.1


def test_service_override_ticket_priority_audit(db_session):
    """Verify override_ticket_priority recalculates deadline and records audit entry."""
    ticket = create_ticket(
        db=db_session,
        tracking_code="TICK-M3-002",
        title="Fire alarm test false alarm",
        description="Heavy smoke was actually kitchen steam",
        location="Hostel Block A",
    )
    assert ticket.priority == "CRITICAL"

    # Supervisor overrides to LOW
    override_req = PriorityOverrideRequest(
        new_priority=PriorityEnum.LOW,
        override_reason="Site inspection confirmed kitchen steam, no fire risk."
    )
    updated = override_ticket_priority(db=db_session, ticket_id=ticket.id, override_data=override_req)
    assert updated.priority == "LOW"
    assert "PRIORITY OVERRIDE" in updated.resolution_notes
    assert "kitchen steam" in updated.resolution_notes
    # Low SLA is 72 hours
    diff_hours = (updated.sla_deadline - updated.created_at).total_seconds() / 3600
    assert abs(diff_hours - 72.0) < 0.1


def test_service_list_tickets_filtering(db_session):
    """Verify list_tickets priority filtering."""
    create_ticket(
        db=db_session,
        tracking_code="TICK-M3-CRIT",
        title="Sparking wire",
        description="Sparks shooting from wire",
        location="Lab 1",
    )
    create_ticket(
        db=db_session,
        tracking_code="TICK-M3-LOW",
        title="Scratch on bench",
        description="Paint scratched on bench",
        location="Lab 2",
    )

    crit_tickets = list_tickets(db=db_session, priority="CRITICAL")
    assert any(t.tracking_code == "TICK-M3-CRIT" for t in crit_tickets)
    assert not any(t.tracking_code == "TICK-M3-LOW" for t in crit_tickets)


# ==============================================================================
# CHECKPOINT 4: REST API HTTP Endpoints
# ==============================================================================

def test_api_triage_preview_stateless(client):
    """Verify POST /api/v1/tickets/triage-preview returns correct diagnostics."""
    res = client.post(
        "/api/v1/tickets/triage-preview",
        json={
            "title": "Water cooler sparking",
            "description": "Loose electrical wire touching water basin, making sparks"
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert data["priority"] == "CRITICAL"
    assert data["hazard_detected"] is True
    assert data["category"] in ["Electrical", "Plumbing"]
    assert 0.0 <= data["confidence"] <= 1.0
    assert "spark" in data["matched_keywords"] or "sparking" in data["matched_keywords"]


def test_api_priority_override_endpoint(client, db_session):
    """Verify PATCH /api/v1/tickets/{id}/priority updates priority and audit trail."""
    # 1. Create a ticket
    create_res = client.post(
        "/api/v1/tickets/",
        json={
            "title": "Flickering bathroom light",
            "description": "Tube light flickering continuously in ground floor washroom",
            "location": "Academic Block 1"
        }
    )
    assert create_res.status_code == 201
    ticket_id = create_res.json()["id"]
    orig_priority = create_res.json()["priority"]

    # 2. Override priority to CRITICAL
    patch_res = client.patch(
        f"/api/v1/tickets/{ticket_id}/priority",
        json={
            "new_priority": "CRITICAL",
            "override_reason": "Live wires exposed behind switch plate; shock hazard"
        }
    )
    assert patch_res.status_code == 200
    updated_data = patch_res.json()
    assert updated_data["priority"] == "CRITICAL"
    assert "Live wires exposed" in updated_data["resolution_notes"]


def test_api_priority_override_error_cases(client):
    """Verify 404 for missing ticket and 422 for invalid reason."""
    # 404 on non-existent ticket
    res_404 = client.patch(
        "/api/v1/tickets/999999/priority",
        json={
            "new_priority": "HIGH",
            "override_reason": "Non-existent ticket override"
        }
    )
    assert res_404.status_code == 404

    # 422 on reason < 5 chars
    res_422 = client.patch(
        "/api/v1/tickets/1/priority",
        json={
            "new_priority": "HIGH",
            "override_reason": "Tiny"
        }
    )
    assert res_422.status_code == 422
