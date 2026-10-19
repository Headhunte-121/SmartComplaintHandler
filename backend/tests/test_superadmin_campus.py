"""
Integration tests for SuperAdmin Telemetry, Campus Buildings, and Supervisory Ticket Patch
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.api.deps import get_db
from app.db.base import Base
from app.models.department import Department
from app.models.team import MaintenanceTeam
from app.models.ticket import Ticket
from app.models.user import User

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def client():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        # Seed test dept and team
        dept = Department(id=1, name="Electrical", description="Campus electrical")
        db.add(dept)
        team = MaintenanceTeam(id=1, name="Hostel Electrical Squad", department_id=1, active_ticket_count=0)
        db.add(team)
        ticket = Ticket(
            id=1,
            tracking_code="SCH-20261019-TST001",
            title="Broken switchboard in Room 101",
            description="Sparking switch in laboratory",
            location="Academic Block, Room 101",
            priority="HIGH",
            status="SUBMITTED",
            department_id=1,
            assigned_team_id=1,
        )
        db.add(ticket)
        db.commit()

        def override_get_db():
            try:
                yield db
            finally:
                pass

        app.dependency_overrides[get_db] = override_get_db
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()
        db.close()
        Base.metadata.drop_all(bind=engine)


def test_superadmin_telemetry_endpoint(client):
    res = client.get("/api/v1/superadmin/telemetry")
    assert res.status_code == 200
    data = res.json()
    assert "kpis" in data
    assert data["kpis"]["total_tickets"] >= 1
    assert "department_stats" in data
    assert len(data["department_stats"]) == 6


def test_campus_buildings_endpoint(client):
    res = client.get("/api/v1/campus/buildings")
    assert res.status_code == 200
    buildings = res.json()
    assert isinstance(buildings, list)
    assert len(buildings) > 0


def test_ticket_direct_patch(client):
    payload = {
        "title": "Updated Switchboard Issue",
        "priority": "CRITICAL",
        "status": "IN_PROGRESS",
        "location": "Academic Block, Room 105",
        "resolution_notes": "Technician arrived with spare parts.",
    }
    res = client.patch("/api/v1/tickets/1", json=payload)
    assert res.status_code == 200
    updated = res.json()
    assert updated["title"] == "Updated Switchboard Issue"
    assert updated["priority"] == "CRITICAL"
    assert updated["status"] == "IN_PROGRESS"
    assert updated["location"] == "Academic Block, Room 105"
