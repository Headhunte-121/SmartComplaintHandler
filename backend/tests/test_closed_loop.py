"""
SmartComplaintHandler - Closed-Loop End-to-End Integration Test Suite
Governed by: docs/V1/V1_BLUEPRINT.md & docs/developer_guide/06_TESTING_AND_GIT_DELIVERY.md
"""
from fastapi.testclient import TestClient
from app.main import app

def test_full_complaint_lifecycle():
    with TestClient(app) as client:
        # Step 1: Health Check (M1 Foundation)
        res_health = client.get("/health")
        assert res_health.status_code == 200
        assert res_health.json()["status"] == "healthy"

        # Step 2: Submit a new complaint (M2 Intake)
        payload = {
            "title": "Severe water pipe burst in Chemistry Lab",
            "description": "Continuous flooding with water leaking near electrical outlets.",
            "location": "Science Block, Lab 2"
        }
        res_submit = client.post("/api/v1/tickets", json=payload)
        assert res_submit.status_code == 201, f"Expected 201, got {res_submit.status_code}"
        data = res_submit.json()
        
        tracking_code = data["tracking_code"]
        ticket_id = data["id"]
        assert tracking_code.startswith("TICK-") or tracking_code.startswith("TKT-")
        assert data["status"] in ["SUBMITTED", "OPEN"]

        # Step 3: Track ticket by tracking code (M2 Lookup)
        res_track = client.get(f"/api/v1/tickets/{tracking_code}")
        assert res_track.status_code == 200
        assert res_track.json()["tracking_code"] == tracking_code.upper()

        # Step 4: Evaluate triage preview (M3 Priority)
        res_triage = client.post("/api/v1/triage-preview", json={
            "title": data["title"],
            "description": data["description"]
        })
        assert res_triage.status_code == 200
        triage_data = res_triage.json()
        assert "suggested_priority" in triage_data
        assert triage_data["suggested_priority"] in ["HIGH", "LOW", "CRITICAL"]

        # Step 5: Check Squad Workloads (M4 Dispatch)
        res_workload = client.get("/api/v1/teams/workloads")
        assert res_workload.status_code == 200
        workloads = res_workload.json()
        assert len(workloads) >= 1
        assert "active_ticket_count" in workloads[0]

        # Step 6: Reassign Ticket (M4 Workload Management)
        res_reassign = client.patch(f"/api/v1/tickets/{ticket_id}/reassign", json={
            "team_id": 2,
            "reason": "Specialized high-pressure plumbing required"
        })
        assert res_reassign.status_code == 200
        assert res_reassign.json()["status"] == "success"

        # Step 7: Update Status to IN_PROGRESS (M5 Automata)
        res_progress = client.patch(f"/api/v1/tickets/{ticket_id}/status", json={
            "status": "IN_PROGRESS"
        })
        assert res_progress.status_code == 200
        assert res_progress.json()["new_status"] == "IN_PROGRESS"

        # Step 8: Resolve Ticket with Notes (M5 Dual-Verification)
        res_resolve = client.post(f"/api/v1/tickets/{ticket_id}/resolve", json={
            "resolution_notes": "Replaced burst valve gasket and cleaned surrounding floor area."
        })
        assert res_resolve.status_code == 200
        assert res_resolve.json()["resolved"] is True

        # Step 9: Query SLA Breaches (M5 Breach Dashboard)
        res_breach = client.get("/api/v1/sla/breaches")
        assert res_breach.status_code == 200
        assert isinstance(res_breach.json(), list)

        print("\n[+] All 9 Full-Stack Closed-Loop Integration Test Steps Passed Successfully!")
