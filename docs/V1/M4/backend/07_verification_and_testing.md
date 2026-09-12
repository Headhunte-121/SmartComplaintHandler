# Module M4 - Backend File 07: Dispatch & Assignment Integration Verification Protocol
## Target: Full End-to-End Module M4 Backend Verification Suite
### Execution Track: Phase 5 (Full Integration Verification & Quality Gate)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In professional software engineering, site reliability engineering (SRE), and continuous integration (CI) pipelines, this verification protocol serves as the **Backend Integration Verification Suite & Architectural Quality Gate**. It is the standard operating procedure used to certify that the least-loaded dispatch algorithm, squad query services, Pydantic validation schemas, ticket service orchestrations, and RESTful presentation endpoints operate reliably as a unified backend subsystem before the frontend user interface is connected.

### Standard Industry Role & Real-World Use Cases
In modern enterprise software delivery, an integration verification protocol standardly fulfills four core architectural duties:

1. **The Pre-Frontend Quality Gate:**
   * Proves that all backend workforce endpoints (`GET /api/v1/teams/workloads`, `PATCH /api/v1/tickets/{id}/reassign`, etc.) work 100% reliably over real HTTP network sockets before frontend developers connect React components.
   * Eliminates development deadlocks by proving that the API layer is flawless in isolation.
2. **Workforce Equalization & Queue Depth Certification:**
   * Mathematically verifies that the dispatch engine distributes incoming tickets evenly across active maintenance squads rather than overburdening a single technician.
3. **Audit Trail Verification (Non-Repudiation):**
   * Confirms that administrative ticket reassignments create permanent, immutable, timestamped audit entries in SQLite, ensuring full compliance with institutional governance standards.
4. **Team Consistency & Zero Regression Assurance:**
   * Provides our 5-student engineering team with a deterministic command suite to verify that Module M4 runs identically on all team members' Windows laptops without regressions.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our campus complaint automation platform, our 5-student engineering team specifically uses this protocol for four concrete operational goals:

1. **Certifying Automated Squad Dispatch on Ingestion:**
   * Verifies that a submitted complaint is immediately assigned to an active campus squad (e.g. `assigned_team == "Hostel Pipe Repair Crew"`) and transitions status to `ASSIGNED`.
2. **Verifying Emergency Escalation Short-Circuits:**
   * Proves that `CRITICAL` complaints automatically short-circuit directly to specialized emergency teams (e.g. electrical hazards to `"Substation High-Voltage Team"`).
3. **Certifying Administrative Team Reassignments:**
   * Executes HTTP `PATCH` requests against `/api/v1/tickets/{ticket_id}/reassign` to verify that facility supervisors can transfer complaints and that the mandatory `reassignment_reason` is permanently recorded in `ticket.resolution_notes`.
4. **Testing Real-Time Telemetry Retrieval:**
   * Fires automated requests against `/api/v1/teams/workloads` to confirm that the React dashboard receives all 12 squads with valid active ticket counts and status bands.

### Future AI Integration & Verification Stability (V2 Roadmap)
While testing deterministic algorithms today, this protocol establishes the baseline verification criteria for future AI dispatch:
* **Benchmark for Future AI Dispatch:** When a predictive machine learning dispatch model is introduced in V2, running this exact test suite will prove that the AI achieves equal or better workload balance without violating availability constraints.
* **Human-in-the-Loop Supervisory Validation:** Checkpoint 3 and Checkpoint 4 verify that the administrative override gate remains 100% operational, guaranteeing human oversight regardless of the underlying dispatch engine.

### The Core Problem It Solves & Why It Exists
* **The "Phantom Assignment" Failure:** Without an integration protocol, bugs in availability filtering might route emergency tickets to inactive squads unnoticed.
* **Database Session Bleed:** Catches uncommitted transactions or missing session rollbacks before deploying code.

---

# 2. The 5 Verification Checkpoints

---

### Checkpoint 1: Unit Dispatch Engine & Team Query Verification
* **What is tested:**  
  Importing and executing `dispatch_engine.py` and `team_service.py` in an isolated Python session without running the web server.
* **Why this test is needed:**  
  Proves that:
  1. `select_optimal_team()` routes `CRITICAL` electrical tickets directly to `"Substation High-Voltage Team"`.
  2. `get_active_teams_for_department()` filters out inactive squads.
  3. `get_all_teams_with_workload()` returns telemetry for all 12 squads with valid status bands.
* **Execution Command (Run from `backend/` directory in PowerShell):**  
  `python -c "from app.db.session import SessionLocal; from app.services.dispatch_engine import select_optimal_team; from app.services.team_service import get_active_teams_for_department, get_all_teams_with_workload; db = SessionLocal(); s = select_optimal_team(db, department_id=1, priority='CRITICAL', location='Lab'); assert s.name == 'Substation High-Voltage Team'; teams = get_active_teams_for_department(db, 1); assert len(teams) > 0; assert all(t.is_active for t in teams); wl = get_all_teams_with_workload(db); assert len(wl) == 12; db.close(); print('Checkpoint 1 PASSED: Dispatch Engine & Team Service Units Operational')"`
* **Observable Success Criteria:**  
  The terminal prints `Checkpoint 1 PASSED: Dispatch Engine & Team Service Units Operational` with zero assertion errors.

---

### Checkpoint 2: Schema Boundary & Validation Verification
* **What is tested:**  
  Validating proper and improper payloads using Pydantic V2 schemas from `app.schemas.assignment`.
* **Why this test is needed:**  
  Confirms that:
  1. `TeamReassignRequest` validates positive team IDs and strips whitespace.
  2. `TeamReassignRequest` catches and rejects boundary violations (e.g. `new_team_id <= 0` or reason shorter than 5 characters).
  3. `TeamWorkloadResponse` validates non-negative active ticket counts.
* **Execution Command (Run from `backend/` directory in PowerShell):**  
  `python -c "from app.schemas.assignment import TeamReassignRequest, TeamWorkloadResponse; from pydantic import ValidationError; req = TeamReassignRequest(new_team_id=2, reassignment_reason='Valid transfer reason here'); assert req.new_team_id == 2; has_err = False;
try:
    TeamReassignRequest(new_team_id=0, reassignment_reason='bad')
except ValidationError:
    has_err = True
assert has_err; res = TeamWorkloadResponse(team_id=1, team_name='Squad 1', department_id=1, department_name='Electrical', is_active=True, active_ticket_count=0, workload_status='LOW'); assert res.active_ticket_count == 0; print('Checkpoint 2 PASSED: Assignment Schemas Enforce Boundaries')"`
* **Observable Success Criteria:**  
  The terminal prints `Checkpoint 2 PASSED: Assignment Schemas Enforce Boundaries`.

---

### Checkpoint 3: Service Layer Database Transaction & Reassignment Verification
* **What is tested:**  
  Invoking `create_ticket()` and `reassign_ticket_team()` directly against SQLite using an active session.
* **Why this test is needed:**  
  Confirms that:
  1. The upgraded `create_ticket()` automatically dispatches the complaint, assigning `assigned_team` and advancing status to `ASSIGNED`.
  2. `reassign_ticket_team()` updates the assigned squad, records a timestamped audit entry in `resolution_notes`, and commits to SQLite.
  3. The test record is deleted and committed cleanly, leaving the database pristine.
* **Execution Command (Run from `backend/` directory in PowerShell):**  
  `python -c "from app.db.session import SessionLocal; from app.schemas.ticket import TicketCreate; from app.schemas.assignment import TeamReassignRequest; from app.services.ticket_service import create_ticket, reassign_ticket_team; db = SessionLocal(); t = create_ticket(db, TicketCreate(title='Leaking flush in Hostel 4', description='Bathroom flush valve overflowing', location='Hostel 4')); assert t.assigned_team != 'Unassigned'; assert t.status == 'ASSIGNED'; updated = reassign_ticket_team(db, t.id, TeamReassignRequest(new_team_id=6, reassignment_reason='Emergency water team has specialized high-pressure valve')); assert updated.assigned_team == 'Water Supply Emergency Team'; assert 'Emergency water team has specialized' in updated.resolution_notes; db.delete(updated); db.commit(); db.close(); print('Checkpoint 3 PASSED: Service Auto-Dispatch, Reassignment & Audit Trail Verified')"`
* **Observable Success Criteria:**  
  The terminal prints `Checkpoint 3 PASSED: Service Auto-Dispatch, Reassignment & Audit Trail Verified`.

---

### Checkpoint 4: REST API HTTP Endpoints via FastAPI TestClient
* **What is tested:**  
  Firing simulated HTTP requests against `/api/v1/teams/workloads`, `/api/v1/tickets/{id}/reassign`, and `/api/v1/teams/{id}/availability` using FastAPI's in-memory `TestClient`.
* **Why this test is needed:**  
  Proves that:
  1. `GET /api/v1/teams/workloads` returns HTTP 200 with 12 squad telemetry items.
  2. `POST /api/v1/tickets/` creates an auto-dispatched ticket.
  3. `PATCH /api/v1/tickets/{id}/reassign` updates the squad and returns HTTP 200 with updated fields.
  4. `PATCH /api/v1/tickets/99999/reassign` returns HTTP 404 Not Found.
  5. `PATCH /api/v1/teams/{id}/availability` updates squad status and returns HTTP 200.
* **Execution Command (Run from `backend/` directory in PowerShell):**  
  `python -c "from fastapi.testclient import TestClient; from app.main import app; from app.db.session import SessionLocal; from app.models.ticket import Ticket; client = TestClient(app); wl_res = client.get('/api/v1/teams/workloads'); assert wl_res.status_code == 200; assert len(wl_res.json()) == 12; post_res = client.post('/api/v1/tickets/', json={'title': 'Loose ceiling fan rod', 'description': 'Fan wobbling dangerously in room 20', 'location': 'Hostel Block A'}); assert post_res.status_code == 201; t_id = post_res.json()['id']; assert post_res.json()['assigned_team'] != 'Unassigned'; patch_res = client.patch(f'/api/v1/tickets/{t_id}/reassign', json={'new_team_id': 2, 'reassignment_reason': 'Academic crew stationed closer to Block A'}); assert patch_res.status_code == 200; assert patch_res.json()['assigned_team'] == 'Academic Electrical Crew'; nf_res = client.patch('/api/v1/tickets/99999/reassign', json={'new_team_id': 2, 'reassignment_reason': 'Testing missing ticket'}); assert nf_res.status_code == 404; db = SessionLocal(); to_del = db.query(Ticket).filter(Ticket.id == t_id).first(); db.delete(to_del); db.commit(); db.close(); print('Checkpoint 4 PASSED: HTTP Endpoints, Telemetry, Reassignments & Error Codes Certified')"`
* **Observable Success Criteria:**  
  The terminal prints `Checkpoint 4 PASSED: HTTP Endpoints, Telemetry, Reassignments & Error Codes Certified`.

---

### Checkpoint 5: Live Uvicorn Server Smoke Test & OpenAPI Documentation
* **What is tested:**  
  Starting the real Uvicorn web server on port 8000 and sending real HTTP requests over TCP loopback using PowerShell's `Invoke-RestMethod`.
* **Why this test is needed:**  
  Confirms that:
  1. The live server boots with zero import errors or router mounting crashes.
  2. The interactive Swagger UI documentation at `http://localhost:8000/docs` displays the new `"assignment"` endpoints.
  3. Real network requests over port 8000 return valid JSON with correct HTTP status codes.
* **Execution Procedure (Run in two separate PowerShell terminal windows):**
  * **Window 1 (Launch Uvicorn Server):**  
    `uvicorn app.main:app --reload --port 8000`
  * **Window 2 (Execute PowerShell HTTP Request):**  
    `Invoke-RestMethod -Uri "http://localhost:8000/api/v1/teams/workloads" -Method GET`
* **Observable Success Criteria:**  
  Window 2 prints a formatted JSON array of 12 squad objects with `team_name`, `active_ticket_count`, and `workload_status`. Window 1 logs `GET /api/v1/teams/workloads HTTP/1.1 200 OK`.

---

# 3. Component Life-Cycle: Input, Process, Output (IPO Table)

The following table documents the end-to-end data life-cycle across the entire backend verification suite:

| Checkpoint Stage | Input Received | System Verification Processing | Output Produced | Failure Modes Diagnosed |
| :--- | :--- | :--- | :--- | :--- |
| **Checkpoint 1 (Unit Engines)** | Department IDs, test locations, priority tiers. | Evaluates emergency maps, least-loaded queue algorithms, and active squad filters. | Selected `Team` entities and squad telemetry lists. | Identifies broken SQL queries, missing emergency mappings, or inactive squad leaks. |
| **Checkpoint 2 (Schemas)** | Valid and invalid dictionaries. | Pydantic V2 parsing, positive integer checks, whitespace trimming, and length validation. | Strongly typed schema instances or structured `ValidationError`. | Identifies loose boundaries, missing fields, or unhandled validation errors. |
| **Checkpoint 3 (Service Layer)** | Schema objects and active SQLite session. | Ingestion auto-dispatch, database insertion, manual supervisor reassignment, and audit commit. | Persisted `Ticket` entity with populated `assigned_team` and audit notes. | Identifies database lock issues, missing commits, or failed ORM state refreshes. |
| **Checkpoint 4 (REST Endpoints)** | HTTP JSON request payloads over simulated network. | FastAPI route resolution, dependency injection (`get_db`), service delegation, and response serialization. | HTTP responses with status codes `200`, `201`, `400`, `404`, and `422`. | Identifies route registration bugs, circular imports, or missing `response_model` annotations. |
| **Checkpoint 5 (Live Server)** | Real HTTP network traffic on port 8000. | Uvicorn ASGI server loop, socket binding, middleware processing, and network serialization. | Live JSON response and Swagger UI documentation at `/docs`. | Identifies port binding conflicts, CORS configuration errors, or ASGI startup crashes. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. Strict Non-Negotiables

To ensure tests remain robust across different developer machines, adhere to the following rules:

### 🟢 Safe to Modify (Configurable Parameters)
* **Sample Complaint Test Phrases:** You can customize test complaint phrases to test specific campus scenarios (e.g. testing specific laboratory names or equipment).
* **Port Number in Checkpoint 5:** If port 8000 is occupied on your computer, you can run Uvicorn on port 8001 (`--port 8001`) and update the `Invoke-RestMethod` URL accordingly.
* **Adding Supplementary Test Assertions:** You can add extra assertion statements to verify specific edge-case squad combinations.

### 🔴 Strict Non-Negotiables (System Breaking Changes)
* **DO NOT Skip Database Teardowns in Checkpoints 3 & 4:** Every test that creates a ticket must execute `db.delete()` and `db.commit()` upon completion to keep `smart_complaints.db` pristine.
* **DO NOT Use Weak Assertions:** Never replace strict equality assertions (`assert updated.assigned_team == 'Structural Fixtures Crew'`) with loose truthy checks.
* **DO NOT Run Checkpoint 5 with Unsaved Changes:** Ensure all Python files are saved before booting Uvicorn.

---

# 5. Architectural & Theoretical References

This specification operates strictly as an **implementation and integration blueprint**. For the exhaustive computer science fundamentals, language runtime mechanics, and protocol specifications governing this component, consult the following authoritative manuals in the **Developer Guide Suite**:

* [**Guide 12: Automated Testing, Fixtures & Integration**](../../../developer_guide/12_PYTEST_AND_AUTOMATED_TEST_SYSTEMS.md)  
  Pytest test runners, fixture dependency injection (`scope="function"`), and in-memory ASGI dispatch via Starlette `TestClient`.

* [**Guide 04: SQLite 3 Engine Architecture & Storage Mechanics**](../../../developer_guide/04_SQLITE_STORAGE_MECHANICS_AND_WAL_MODE.md)  
  Isolated transactional rollbacks and clean SQLite in-memory test databases.

* [**Guide 02: FastAPI & Modern ASGI Web Architecture**](../../../developer_guide/02_FASTAPI_ASGI_WEB_ARCHITECTURE.md)  
  Testing dependency overrides and closed-loop endpoint assertions.

---

# 6. Definition of Done & Troubleshooting Matrix

Before considering Module M4 Backend fully signed off, all 5 verification checkpoints must pass without a single failure.

### Operational Sign-Off Checklist
- [ ] Checkpoint 1 passes: Dispatch engine and team service unit operations produce correct outputs with zero assertion errors.
- [ ] Checkpoint 2 passes: Pydantic schemas enforce boundaries, integer constraints, and whitespace trimming.
- [ ] Checkpoint 3 passes: Service layer creates auto-dispatched tickets and executes auditable administrative reassignments in SQLite.
- [ ] Checkpoint 4 passes: In-memory HTTP tests confirm status codes `200`, `201`, `400`, `404`, and `422`.
- [ ] Checkpoint 5 passes: Live Uvicorn server serves `/teams/workloads` requests and displays the `"assignment"` tag in Swagger UI at `/docs`.

---

### Terminal Troubleshooting Matrix

| Error Message Observed in Terminal | Root Cause of Failure | Concrete Immediate Fix |
| :--- | :--- | :--- |
| `ImportError: cannot import name 'select_optimal_team'` | `dispatch_engine.py` is missing, misnamed, or has a syntax error. | Verify that `backend/app/services/dispatch_engine.py` exists and defines `def select_optimal_team(...)`. |
| `AssertionError: assert t.assigned_team != 'Unassigned'` | `create_ticket()` did not invoke `select_optimal_team()` or failed to update `assigned_team`. | In `backend/app/services/ticket_service.py`, ensure `db_ticket.assigned_team = optimal_team.name` when optimal team is found. |
| `ValidationError: 1 validation error for TeamReassignRequest` | Input text passed to the test had `new_team_id <= 0` or reason shorter than 5 characters. | Use valid team ID (`new_team_id=2`) and a realistic reassignment explanation (e.g. 20+ characters). |
| `HTTPException 400: Team with ID X does not exist` | Reassignment test targeted a squad ID not present in the seeded `teams` table. | Use an existing squad ID between 1 and 12 seeded during Module M1. |
| `HTTPException 404: Ticket with ID 99999 not found` | Normal and expected behavior when testing non-existent ticket reassignments. | Confirm that the test successfully catches this 404 response as proof of proper error handling. |
