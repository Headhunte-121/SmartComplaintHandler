"""
Interactive Live Test & Seeder for Module M5:
Seeds realistic campus complaints across SLA urgency tiers and tests live HTTP endpoints.
"""
from datetime import datetime, timedelta, timezone
import requests
from sqlalchemy.orm import Session

from app.core.database import engine, SessionLocal
from app.db.base import Base
from app.models.department import Department
from app.models.team import MaintenanceTeam
from app.models.ticket import Ticket
from app.services.sla_engine import calculate_sla_deadline

API_BASE = "http://127.0.0.1:8000/api/v1"


def seed_database():
    print("\n--- 1. Initializing Database & Seeding Infrastructure ---")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Seed Departments
        dept_elec = db.query(Department).filter(Department.name == "Electrical Services").first()
        if not dept_elec:
            dept_elec = Department(name="Electrical Services", description="Power, lighting, and substation maintenance")
            db.add(dept_elec)

        dept_plumb = db.query(Department).filter(Department.name == "Plumbing & Water").first()
        if not dept_plumb:
            dept_plumb = Department(name="Plumbing & Water", description="Water supply, sanitation, and drainage")
            db.add(dept_plumb)

        dept_hvac = db.query(Department).filter(Department.name == "HVAC Systems").first()
        if not dept_hvac:
            dept_hvac = Department(name="HVAC Systems", description="Campus cooling and ventilation")
            db.add(dept_hvac)

        db.commit()
        db.refresh(dept_elec)
        db.refresh(dept_plumb)
        db.refresh(dept_hvac)
        print("  [OK] Departments seeded.")

        # 2. Seed Maintenance Teams
        team_elec = db.query(MaintenanceTeam).filter(MaintenanceTeam.name == "Rapid Electrical Squad 1").first()
        if not team_elec:
            team_elec = MaintenanceTeam(name="Rapid Electrical Squad 1", department_id=dept_elec.id, active_ticket_count=2)
            db.add(team_elec)

        team_plumb = db.query(MaintenanceTeam).filter(MaintenanceTeam.name == "Plumbing Unit Alpha").first()
        if not team_plumb:
            team_plumb = MaintenanceTeam(name="Plumbing Unit Alpha", department_id=dept_plumb.id, active_ticket_count=1)
            db.add(team_plumb)

        db.commit()
        db.refresh(team_elec)
        db.refresh(team_plumb)
        print("  [OK] Maintenance Teams seeded.")

        # 3. Seed Sample Tickets Across Urgency Tiers
        now = datetime.now(timezone.utc)

        # Clean existing test demo tickets
        db.query(Ticket).filter(Ticket.tracking_code.like("TICK-M5-%")).delete(synchronize_session=False)
        db.commit()

        # Ticket 1: CRITICAL (4h SLA) created 6 hours ago -> Overdue by 2 hours
        t1_created = now - timedelta(hours=6)
        t1_deadline = calculate_sla_deadline(t1_created, "CRITICAL")
        t1 = Ticket(
            tracking_code="TICK-M5-001",
            title="Main Distribution Board Arcing & Burning Smell",
            description="Power fluctuating rapidly in Academic Block B; sparks observed near primary circuit breaker.",
            location="Academic Block B, Ground Floor Panel Room",
            priority="CRITICAL",
            status="SUBMITTED",
            department_id=dept_elec.id,
            assigned_team_id=team_elec.id,
            created_at=t1_created,
            sla_deadline=t1_deadline,
        )

        # Ticket 2: HIGH (12h SLA) created 11 hours ago -> 1 hour remaining (< 20% warning window)
        t2_created = now - timedelta(hours=11)
        t2_deadline = calculate_sla_deadline(t2_created, "HIGH")
        t2 = Ticket(
            tracking_code="TICK-M5-002",
            title="Burst Overhead Water Line Flooding Stairwell",
            description="Continuous cascade of water flooding East stairwell between 3rd and 2nd floor.",
            location="Hostel 4, East Stairwell",
            priority="HIGH",
            status="IN_PROGRESS",
            department_id=dept_plumb.id,
            assigned_team_id=team_plumb.id,
            created_at=t2_created,
            sla_deadline=t2_deadline,
            resolution_notes="[TRANSITION: Staff on-site with submersible pump]",
        )

        # Ticket 3: MEDIUM (24h SLA) created 2 hours ago -> 22 hours remaining (Healthy)
        t3_created = now - timedelta(hours=2)
        t3_deadline = calculate_sla_deadline(t3_created, "MEDIUM")
        t3 = Ticket(
            tracking_code="TICK-M5-003",
            title="Ceiling Fan Capacitor Buzzing & Low RPM",
            description="Fan in Room 204 rotates sluggishly with loud electrical humming.",
            location="Hostel 1, Room 204",
            priority="MEDIUM",
            status="SUBMITTED",
            department_id=dept_elec.id,
            assigned_team_id=team_elec.id,
            created_at=t3_created,
            sla_deadline=t3_deadline,
        )

        # Ticket 4: LOW (72h SLA) created 4 hours ago -> 68 hours remaining (Healthy)
        t4_created = now - timedelta(hours=4)
        t4_deadline = calculate_sla_deadline(t4_created, "LOW")
        t4 = Ticket(
            tracking_code="TICK-M5-004",
            title="Window Latch Loose in Study Hall",
            description="Window rattles during strong winds; latch screw loose.",
            location="Library Study Wing 2",
            priority="LOW",
            status="SUBMITTED",
            department_id=dept_plumb.id,
            assigned_team_id=team_plumb.id,
            created_at=t4_created,
            sla_deadline=t4_deadline,
        )

        db.add_all([t1, t2, t3, t4])
        db.commit()
        db.refresh(t1)
        db.refresh(t2)
        db.refresh(t3)
        db.refresh(t4)
        print(f"  [OK] Seeded 4 sample tickets across SLA tiers:")
        print(f"       1. {t1.tracking_code} [CRITICAL] -> Overdue (Breached)")
        print(f"       2. {t2.tracking_code} [HIGH]     -> Warning (Approaching Breach)")
        print(f"       3. {t3.tracking_code} [MEDIUM]   -> Healthy (22h remaining)")
        print(f"       4. {t4.tracking_code} [LOW]      -> Healthy (68h remaining)")

        return t1.id, t2.id, t3.id, t4.id
    finally:
        db.close()


def test_live_endpoints(t1_id, t2_id, t3_id, t4_id):
    print("\n--- 2. Testing Live REST API Endpoints on http://127.0.0.1:8000 ---")

    # 1. Query Active SLA Breaches
    print("\n[A] GET /api/v1/sla/breaches/active")
    res = requests.get(f"{API_BASE}/sla/breaches/active")
    print(f"    HTTP Status: {res.status_code}")
    breaches = res.json()
    print(f"    Returned {len(breaches)} high-risk breaches/warnings:")
    for b in breaches:
        state_str = f"OVERDUE by {b['overdue_seconds'] // 3600}h {(b['overdue_seconds'] % 3600) // 60}m" if b['is_breached'] else f"{b['remaining_seconds'] // 60}m remaining"
        print(f"    - {b['tracking_code']} [{b['priority']}] | {state_str} | Squad: {b['assigned_team_name']}")

    # 2. Advance Status via State Machine: SUBMITTED -> IN_PROGRESS
    print(f"\n[B] PATCH /api/v1/tickets/{t1_id}/status (Advance TICK-M5-001 to IN_PROGRESS)")
    payload = {
        "status": "IN_PROGRESS",
        "notes": "Squad dispatched with replacement 100A main circuit breaker.",
        "actor": "Lead Tech Sharma"
    }
    res = requests.patch(f"{API_BASE}/tickets/{t1_id}/status", json=payload)
    print(f"    HTTP Status: {res.status_code}")
    data = res.json()
    print(f"    Updated Status: {data['status']}")
    print(f"    Audit Note: {data['resolution_notes'].splitlines()[-1]}")

    # 3. Test Invalid Transition Guard (IN_PROGRESS -> SUBMITTED)
    print(f"\n[C] PATCH /api/v1/tickets/{t1_id}/status (Illegal transition: IN_PROGRESS -> SUBMITTED)")
    res_bad = requests.patch(f"{API_BASE}/tickets/{t1_id}/status", json={"status": "SUBMITTED", "notes": "Rollback"})
    print(f"    HTTP Status: {res_bad.status_code} (Expected 400 Bad Request)")
    print(f"    Rejection Detail: {res_bad.json().get('detail')}")

    # 4. Escalate Ticket TICK-M5-002
    print(f"\n[D] POST /api/v1/tickets/{t2_id}/escalate (Escalate TICK-M5-002)")
    esc_payload = {
        "escalation_reason": "High risk of water entering electrical riser duct; urgent supervisor dispatch required.",
        "supervisor_id": "SUPV-KUMAR"
    }
    res_esc = requests.post(f"{API_BASE}/tickets/{t2_id}/escalate", json=esc_payload)
    print(f"    HTTP Status: {res_esc.status_code}")
    esc_data = res_esc.json()
    print(f"    Updated Status: {esc_data['status']}")
    print(f"    Audit Note: {esc_data['resolution_notes'].splitlines()[-1]}")

    # 5. Formally Resolve Ticket TICK-M5-001
    print(f"\n[E] POST /api/v1/tickets/{t1_id}/resolve (Resolve TICK-M5-001)")
    resolve_payload = {
        "resolution_notes": "Replaced burned 100A Schneider breaker, torqued busbar connections to 15Nm, tested phase load.",
        "parts_replaced": "1x Schneider 100A MCCB, 3x copper lugs",
        "technician_name": "Dave Sharma & Alex Miller"
    }
    res_resolve = requests.post(f"{API_BASE}/tickets/{t1_id}/resolve", json=resolve_payload)
    print(f"    HTTP Status: {res_resolve.status_code}")
    resolve_data = res_resolve.json()
    print(f"    Resolved Status: {resolve_data['status']}")
    print(f"    Resolved At: {resolve_data['resolved_at']}")
    print("    Full Closure Report:")
    for line in resolve_data['resolution_notes'].splitlines():
        print(f"      {line}")


if __name__ == "__main__":
    t1_id, t2_id, t3_id, t4_id = seed_database()
    test_live_endpoints(t1_id, t2_id, t3_id, t4_id)
    print("\n=== Live M5 Verification Complete! ===")
