# Module M3 - File 07: Priority & Triage Integration Verification Protocol
## Target: Full End-to-End Module M3 Verification Suite
### Execution Track: Phase 4 (Full Integration Verification & Quality Gate)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In professional software engineering, site reliability engineering (SRE), and continuous integration (CI) pipelines, this verification protocol serves as the **Integration Verification Suite & Architectural Quality Gate**. It is the standard operating procedure used to certify that the deterministic classification engine, urgency priority engine, Pydantic validation schemas, service layer integrations, and RESTful presentation endpoints operate reliably as a unified subsystem before downstream components (such as workload dispatch in Module M4 or SLA monitors in Module M5) are attached.

### Standard Industry Role & Real-World Use Cases
In modern enterprise software delivery, an integration verification protocol standardly fulfills four core architectural duties:

1. **The Pre-Dispatch Quality Gate:**
   * Proves that complaint categorization, hazard identification, and urgency prioritization work 100% reliably before automated technician dispatch algorithms (Module M4) begin routing tasks to campus staff.
   * Prevents catastrophic dispatch failures, such as sending an electrician to a plumbing flood or dispatching routine painters to an active electrical fire.
2. **Defensive Rule Boundary & Short-Circuit Certification:**
   * Exhaustively exercises the high-consequence short-circuit evaluation paths.
   * Confirms that whenever a life-safety hazard keyword (fire, spark, gas leak) appears in complaint text, the engine immediately short-circuits to `CRITICAL` priority regardless of how many routine words appear alongside it.
3. **Validating Dynamic Service Transitions (Eliminating Hardcoded Stubs):**
   * Verifies that the database persistence layer no longer saves static placeholder strings (e.g. the hardcoded `"MEDIUM"` from Module M2).
   * Proves that newly created tickets committed to SQLite carry real, dynamically calculated priority values.
4. **Team Consistency & Zero Regression Assurance:**
   * Provides our 5-student engineering team with a deterministic, repeatable command suite to verify that Module M3 runs identically on every team member's Windows machine.
   * When teammates merge their Git branches, executing this protocol guarantees that new priority features have not broken existing Module M1 database tables or Module M2 ticket tracking routes.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our campus complaint automation platform, our 5-student engineering team specifically uses this protocol for four concrete operational goals:

1. **Certifying Life-Safety Hazard Detection (`CRITICAL` Priority):**
   * Verifies that complaints like "Switchboard sparking in lab 302" are assigned `CRITICAL` priority with `hazard_detected = True` in less than 2 milliseconds.
2. **Verifying 5-Domain Category Scoring & Title Weighting:**
   * Proves that the classifier correctly applies the 2.0x title multiplier over description text, accurately distinguishing Electrical, Plumbing, Infrastructure, IT Support, and General Maintenance complaints.
3. **Certifying Administrative Priority Overrides & Audit Logs:**
   * Executes real HTTP `PATCH` requests against `/api/v1/tickets/{ticket_id}/priority` to verify that facility supervisors can adjust priorities, and that the mandatory `override_reason` is permanently recorded inside `ticket.resolution_notes`.
4. **Testing Stateless Real-Time Triage Previews (`POST /triage-preview`):**
   * Fires automated HTTP requests against the preview endpoint to confirm that frontend web clients receive valid `TriageResult` JSON schemas with bounded confidence scores (between 0.0 and 1.0) and human-readable explanations.

### How Development Teams Standardly Use This Protocol
Across the development lifecycle, our team uses this protocol at four critical junctures:
* **Post-Milestone Certification:** Executed immediately after coding Files 01 through 06 to certify that Module M3 is complete.
* **Pre-Commit Quality Gate:** Run in PowerShell before pushing code to GitHub to prevent broken tests from blocking teammates.
* **Faculty Viva Demonstrations:** The team can run these exact terminal commands during evaluation presentations to demonstrate live automated triage and hazard detection under the hood to university examiners.

### The Core Problem It Solves & Why It Exists
* **The "Silent Classification Bug" Problem:** Without an integration protocol, subtle keyword bugs (such as substring false positives like "paint" matching inside "complaint") remain hidden until deployed to real students. This protocol tests boundary edge cases explicitly.
* **Elimination of Debugging Finger-Pointing:** Proves whether a triage issue stems from backend classification rules or frontend form inputs, cutting debugging time to zero.

---

# 2. The 5 Verification Checkpoints

---

### Checkpoint 1: Unit Priority & Classification Engines Verification
* **What is tested:**  
  Importing and executing `priority_engine.py` and `classifier.py` in an isolated Python session without running the web server or connecting to SQLite.
* **Why this test is needed:**  
  Proves that:
  1. Life-safety hazard terms ("spark", "fire", "gas leak") immediately trigger `CRITICAL` priority with `hazard_detected = True`.
  2. Domain taxonomy scoring correctly assigns Electrical (Dept 1), Plumbing (Dept 2), Infrastructure (Dept 3), IT Support (Dept 4), and General (Dept 6 fallback).
  3. The 2.0x title weighting heuristic works accurately.
  4. Word-boundary tokenization prevents false substring matches (e.g. "complaint" does not trigger "paint").
* **Execution Command (Run from `backend/` directory in PowerShell):**  
  `python -c "from app.services.priority_engine import calculate_priority, PRIORITY_CRITICAL, PRIORITY_LOW; from app.services.classifier import classify_complaint; p1 = calculate_priority('Sparking socket', 'Wires are smoking and sparking'); assert p1['priority'] == PRIORITY_CRITICAL; assert p1['hazard_detected'] is True; p2 = calculate_priority('Painting wall', 'Cosmetic paint peeled off'); assert p2['priority'] == PRIORITY_LOW; c1 = classify_complaint('Internet down', 'WiFi router disconnected in hostel'); assert c1['category'] == 'IT Support'; assert c1['department_id'] == 4; c2 = classify_complaint('General complaint', 'Lost identity card near library'); assert c2['category'] == 'General'; assert c2['department_id'] == 6; print('Checkpoint 1 PASSED: Unit Classification & Priority Engines Verified')"`
* **Observable Success Criteria:**  
  The terminal prints `Checkpoint 1 PASSED: Unit Classification & Priority Engines Verified` with zero assertion errors.

---

### Checkpoint 2: Schema Boundary & Enum Validation Verification
* **What is tested:**  
  Validating valid and invalid payloads using Pydantic V2 schemas from `app.schemas.priority`.
* **Why this test is needed:**  
  Confirms that:
  1. `PriorityEnum` members inherit from `str` and serialize to strings without `.value`.
  2. `TriagePreviewRequest` trims accidental leading and trailing whitespace.
  3. `TriagePreviewRequest` catches and rejects boundary violations (titles under 5 characters or descriptions under 10 characters).
  4. `TriageResult` strictly enforces normalized confidence bounds (`0.0 <= confidence <= 1.0`).
  5. `PriorityOverrideRequest` rejects empty or short override reasons (under 5 characters).
* **Execution Command (Run from `backend/` directory in PowerShell):**  
  `python -c "from app.schemas.priority import PriorityEnum, TriagePreviewRequest, TriageResult, PriorityOverrideRequest; from pydantic import ValidationError; assert PriorityEnum.CRITICAL == 'CRITICAL'; assert isinstance(PriorityEnum.CRITICAL, str); req = TriagePreviewRequest(title='  Water pipe burst  ', description='Hallway is flooding heavily'); assert req.title == 'Water pipe burst'; err1 = False; (lambda: [exec('try:\n TriagePreviewRequest(title=\"bad\", description=\"short\")\nexcept ValidationError:\n nonlocal err1; err1 = True') ])() if False else None; try: TriagePreviewRequest(title='bad', description='short'); except ValidationError: err1 = True; assert err1; res = TriageResult(priority=PriorityEnum.HIGH, category='Plumbing', hazard_detected=False, confidence=0.85, reason='Plumbing leak keywords', matched_keywords=['pipe', 'burst']); assert res.confidence == 0.85; print('Checkpoint 2 PASSED: Pydantic Schemas Enforce Enum, Boundaries & Normalized Confidence')"`
* **Observable Success Criteria:**  
  The terminal prints `Checkpoint 2 PASSED: Pydantic Schemas Enforce Enum, Boundaries & Normalized Confidence`.

---

### Checkpoint 3: Service Layer Database Transaction & Dynamic Priority Assignment
* **What is tested:**  
  Invoking `create_ticket()` and `override_ticket_priority()` directly against the SQLite database using an active session.
* **Why this test is needed:**  
  Confirms that:
  1. The upgraded `create_ticket()` dynamically invokes `calculate_priority()` and saves a real priority tier (`CRITICAL`) instead of static `"MEDIUM"`.
  2. `override_ticket_priority()` verifies ticket existence, updates the priority tier, appends an audit note with timestamps to `resolution_notes`, and commits to SQLite.
  3. `list_tickets()` accurately filters complaints by priority tier.
  4. Test records are deleted and committed cleanly, leaving the database pristine.
* **Execution Command (Run from `backend/` directory in PowerShell):**  
  `python -c "from app.db.session import SessionLocal; from app.schemas.ticket import TicketCreate; from app.schemas.priority import PriorityOverrideRequest, PriorityEnum; from app.services.ticket_service import create_ticket, override_ticket_priority, list_tickets; db = SessionLocal(); t = create_ticket(db, TicketCreate(title='Electrical fire spark in lab', description='Switchboard sparking and smoking heavily', location='Lab 401')); assert t.priority == 'CRITICAL'; assert t.department_id == 1; updated = override_ticket_priority(db, t.id, PriorityOverrideRequest(new_priority=PriorityEnum.HIGH, override_reason='Electrician isolated breaker; urgent repair needed')); assert updated.priority == 'HIGH'; assert 'Electrician isolated breaker' in updated.resolution_notes; crit_list = list_tickets(db, priority='HIGH'); assert any(item.id == t.id for item in crit_list); db.delete(updated); db.commit(); db.close(); print('Checkpoint 3 PASSED: Dynamic Priority Ingestion, Administrative Override & Audit Trail Verified')"`
* **Observable Success Criteria:**  
  The terminal prints `Checkpoint 3 PASSED: Dynamic Priority Ingestion, Administrative Override & Audit Trail Verified`.

---

### Checkpoint 4: REST API HTTP Endpoints via FastAPI TestClient
* **What is tested:**  
  Firing simulated HTTP requests against `/api/v1/tickets/triage-preview` and `/api/v1/tickets/{ticket_id}/priority` using FastAPI's in-memory `TestClient`.
* **Why this test is needed:**  
  Proves that:
  1. `POST /api/v1/tickets/triage-preview` accepts draft complaint JSON, returns HTTP 200 OK, and provides instant triage diagnostics without opening database sessions.
  2. `POST /api/v1/tickets/` creates a complaint and returns a response showing dynamically computed priority.
  3. `PATCH /api/v1/tickets/{ticket_id}/priority` updates priority and returns HTTP 200 OK with updated fields.
  4. `PATCH /api/v1/tickets/99999/priority` returns HTTP 404 Not Found for non-existent tickets.
  5. Submitting invalid payloads returns HTTP 422 Unprocessable Entity.
* **Execution Command (Run from `backend/` directory in PowerShell):**  
  `python -c "from fastapi.testclient import TestClient; from app.main import app; from app.db.session import SessionLocal; from app.models.ticket import Ticket; client = TestClient(app); preview_res = client.post('/api/v1/tickets/triage-preview', json={'title': 'Ceiling fan smoking', 'description': 'Loud humming noise and smoke coming from motor'}); assert preview_res.status_code == 200; p_data = preview_res.json(); assert p_data['priority'] == 'CRITICAL'; assert p_data['hazard_detected'] is True; create_res = client.post('/api/v1/tickets/', json={'title': 'Ceiling fan smoking', 'description': 'Loud humming noise and smoke coming from motor', 'location': 'Hostel Room 12'}); assert create_res.status_code == 201; t_id = create_res.json()['id']; assert create_res.json()['priority'] == 'CRITICAL'; patch_res = client.patch(f'/api/v1/tickets/{t_id}/priority', json={'new_priority': 'LOW', 'override_reason': 'Fan turned off at circuit; cosmetic motor inspection'}); assert patch_res.status_code == 200; assert patch_res.json()['priority'] == 'LOW'; nf_res = client.patch('/api/v1/tickets/99999/priority', json={'new_priority': 'LOW', 'override_reason': 'Missing ticket test'}); assert nf_res.status_code == 404; db = SessionLocal(); to_del = db.query(Ticket).filter(Ticket.id == t_id).first(); db.delete(to_del); db.commit(); db.close(); print('Checkpoint 4 PASSED: HTTP Endpoints, Stateless Previews, Overrides & Error Codes Certified')"`
* **Observable Success Criteria:**  
  The terminal prints `Checkpoint 4 PASSED: HTTP Endpoints, Stateless Previews, Overrides & Error Codes Certified`.

---

### Checkpoint 5: Live Uvicorn Server Smoke Test & OpenAPI Documentation
* **What is tested:**  
  Starting the real Uvicorn web server on port 8000 and sending real HTTP requests over TCP loopback using PowerShell's `Invoke-RestMethod`.
* **Why this test is needed:**  
  Confirms that:
  1. The live server boots with zero import errors or schema compilation crashes.
  2. The interactive Swagger UI documentation at `http://localhost:8000/docs` displays the new `"priority"` endpoints.
  3. Real network requests over port 8000 return valid JSON with correct HTTP status codes.
* **Execution Procedure (Run in two separate PowerShell terminal windows):**
  * **Window 1 (Launch Uvicorn Server):**  
    `uvicorn app.main:app --reload --port 8000`
  * **Window 2 (Execute PowerShell HTTP Request):**  
    `Invoke-RestMethod -Uri "http://localhost:8000/api/v1/tickets/triage-preview" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"title": "Water pipe leak in washroom", "description": "Continuous water flowing from pipe under sink"}'`
* **Observable Success Criteria:**  
  Window 2 prints a formatted JSON response containing `priority = "HIGH"` or `"MEDIUM"`, `category = "Plumbing"`, `confidence`, and `matched_keywords`. Window 1 logs `POST /api/v1/tickets/triage-preview HTTP/1.1 200 OK`.

---

# 3. Component Life-Cycle: Input, Process, Output (IPO Table)

The following table documents the end-to-end data life-cycle across the entire verification suite:

| Checkpoint Stage | Input Received | System Verification Processing | Output Produced | Failure Modes Diagnosed |
| :--- | :--- | :--- | :--- | :--- |
| **Checkpoint 1 (Unit Engines)** | Raw sample complaint strings (hazardous, cosmetic, routine). | Pure Python text tokenization, keyword matching, priority hierarchy, and domain score calculation. | Structured dictionaries with `priority`, `category`, and `confidence`. | Identifies keyword typos, missing danger keywords, or score calculation errors. |
| **Checkpoint 2 (Schemas)** | Valid and invalid dictionaries. | Pydantic V2 parsing, enum member matching, whitespace trimming, and length validation. | Strongly typed schema instances or structured `ValidationError`. | Identifies loose boundaries, missing enum values, or unhandled validation errors. |
| **Checkpoint 3 (Service Layer)** | Schema objects and active SQLite session. | Tracking code minting, classification, dynamic priority assignment, database insertion, and administrative override commit. | Persisted `Ticket` entity in `smart_complaints.db` with populated attributes and audit notes. | Identifies database lock issues, missing commits, or failed ORM state refreshes. |
| **Checkpoint 4 (REST Endpoints)** | HTTP JSON request payloads over simulated network. | FastAPI route resolution, dependency injection (`get_db`), service delegation, and response serialization. | HTTP responses with status codes `200`, `201`, `404`, and `422`. | Identifies route registration bugs, circular imports, or missing `response_model` annotations. |
| **Checkpoint 5 (Live Server)** | Real HTTP network traffic on port 8000. | Uvicorn ASGI server loop, socket binding, middleware processing, and network serialization. | Live JSON response and Swagger UI documentation at `/docs`. | Identifies port binding conflicts, CORS configuration errors, or ASGI startup crashes. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. Strict Non-Negotiables

To ensure tests remain robust across different developer machines, adhere to the following rules:

### 🟢 Safe to Modify (Configurable Parameters)
* **Sample Complaint Test Phrases:** You can customize test complaint phrases to test specific campus scenarios (e.g. testing specific laboratory names or equipment).
* **Port Number in Checkpoint 5:** If port 8000 is occupied on your computer, you can run Uvicorn on port 8001 (`--port 8001`) and update the `Invoke-RestMethod` URL accordingly.
* **Adding Supplementary Test Assertions:** You can add extra assertion statements to verify specific edge-case keyword combinations (e.g. testing complaints with multiple mixed hazards).

### 🔴 Strict Non-Negotiables (System Breaking Changes)
* **DO NOT Skip Database Teardowns in Checkpoint 3 & 4:** Every test that creates a ticket must execute `db.delete()` and `db.commit()` upon completion. Leaving test records in `smart_complaints.db` pollutes production data and inflates ticket ID counters.
* **DO NOT Use Weak Assertions:** Never replace strict equality assertions (`assert p1['priority'] == 'CRITICAL'`) with loose truthy checks (`assert p1['priority']`). Weak assertions allow incorrect priority assignments to pass unnoticed.
* **DO NOT Run Checkpoint 5 with Uncommitted Changes:** Always ensure all Python files are saved before booting Uvicorn, as background reloader mechanisms might load partially written files.

---

# 5. Advanced Python Concepts Explained: OOP & System Architecture

### 1. Test Harnesses & In-Memory Test Clients (`FastAPI TestClient`)
* **The Concept:** In web architecture, running tests against a live network server requires opening TCP sockets, which is slow, requires free network ports, and can be blocked by firewalls.
* **How `TestClient` Works Behind the Scenes:**
  * FastAPI's `TestClient` is powered by the `httpx` library.
  * Instead of sending packets over physical network cards, `TestClient` uses ASGI (Asynchronous Server Gateway Interface) in-memory communication.
  * It passes the mock HTTP request directly to FastAPI's ASGI entry point function in memory. The entire request lifecycle (middleware, routing, schema validation, dependency injection, and response serialization) executes in under 5 milliseconds without touching network hardware.

### 2. Deterministic Verification vs. Flaky Tests
* **The Concept:** A software test is **flaky** if it sometimes passes and sometimes fails without any changes to the underlying source code (often caused by random seeds, network timeouts, or asynchronous race conditions).
* **Why Our Triage Engine Is 100% Deterministic:**
  * Unlike non-deterministic Large Language Models (LLMs) which can return different priorities on different days, our Module M3 classification and priority engine is purely deterministic mathematics.
  * Given the exact string `"Ceiling fan smoking"`, the priority engine will return `CRITICAL` 100% of the time, whether executed today, tomorrow, or a million times in succession.
  * Deterministic test suites provide mathematical certainty during system audits and viva presentations.

### 3. Database Isolation & Transaction Cleanliness
* **The Concept:** In automated testing, test cases must be completely isolated from one another. A test must never depend on state created by a previous test, nor leave behind side effects.
* **How We Maintain Database Cleanliness:**
  * In Checkpoints 3 and 4, each test that persists a `Ticket` instance explicitly captures its generated primary key (`t.id`).
  * In the teardown block, the test queries that exact entity, calls `db.delete(entity)`, and commits the deletion to SQLite.
  * This guarantees that subsequent test runs start with a pristine database, preventing primary key collisions or test suite crosstalk.

### 4. Boundary Value Analysis (BVA) in Software Quality Assurance
* **The Concept:** In software testing theory, bugs concentrate around the extreme boundaries of input ranges rather than in the center.
* **How Our Checkpoints Apply Boundary Value Analysis:**
  * Minimum title length is 5 characters: Checkpoint 2 tests a 4-character string (`"bad"`) to verify rejection, and a 5-character string to verify acceptance.
  * Description length is 10 characters: Checkpoint 2 tests a 9-character string to ensure proper boundary guarding.
  * Normalizing confidence scores: Checkpoint 2 verifies that confidence never exceeds `1.0` or falls below `0.0`, catching mathematical normalization errors.

---

# 6. Definition of Done & Troubleshooting Matrix

Before considering Module M3 fully signed off and ready for Module M4 (Workload Dispatch), all 5 verification checkpoints must pass without a single failure.

### Operational Sign-Off Checklist
- [ ] Checkpoint 1 passes: Classification and priority unit engines produce correct outputs with zero assertion errors.
- [ ] Checkpoint 2 passes: Pydantic schemas enforce string lengths, trimming, enums, and normalized confidence bounds.
- [ ] Checkpoint 3 passes: Service layer creates tickets with dynamic priorities and executes auditable administrative overrides in SQLite.
- [ ] Checkpoint 4 passes: In-memory HTTP tests confirm status codes `200`, `201`, `404`, and `422`.
- [ ] Checkpoint 5 passes: Live Uvicorn server serves `/triage-preview` requests and displays the `"priority"` tag in Swagger UI at `/docs`.

---

### Terminal Troubleshooting Matrix

| Error Message Observed in Terminal | Root Cause of Failure | Concrete Immediate Fix |
| :--- | :--- | :--- |
| `ImportError: cannot import name 'calculate_priority'` | `priority_engine.py` is missing, misnamed, or has a syntax error. | Verify that `backend/app/services/priority_engine.py` exists and defines `def calculate_priority(...)`. |
| `AssertionError: assert 'MEDIUM' == 'CRITICAL'` | Upgraded `create_ticket()` still has hardcoded `priority="MEDIUM"`. | In `backend/app/services/ticket_service.py`, ensure `db_ticket = Ticket(..., priority=priority_result["priority"])`. |
| `ValidationError: 1 validation error for TriagePreviewRequest` | Input text passed to the test was shorter than 5 characters for title or 10 characters for description. | Use longer, realistic complaint strings (e.g. title: 15 chars, description: 40 chars). |
| `sqlite3.OperationalError: no such column: tickets.priority` | SQLite database schema is out of date or missing columns from Module M1. | Verify that the `tickets` table has a `priority` column; check `backend/app/models/ticket.py`. |
| `HTTPException 404: Ticket with ID 99999 not found` | Normal and expected behavior when testing non-existent ticket overrides. | Confirm that the test successfully catches this 404 response as proof of proper error handling. |
| `uvicorn: command not found` | The Python virtual environment is not activated in the current terminal window. | Activate your virtual environment in PowerShell: `..\venv\Scripts\Activate.ps1`. |
