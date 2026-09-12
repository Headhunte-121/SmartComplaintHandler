# Module M2 - File 08: Complete Integration Verification Protocol
## Target: Full End-to-End Module M2 Verification Suite
### Execution Track: Phase 5 (Full Integration Verification)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In professional software engineering, this protocol serves as the **Integration Verification Suite & Architectural Quality Gate**. It is the standard operational procedure used to certify that the entire ingestion pipeline, validation boundary layer, deterministic classification engine, and RESTful API endpoints function reliably as a cohesive system before the frontend user interface is connected.

### Standard Industry Role & Real-World Use Cases
In modern enterprise software delivery and continuous integration (CI) workflows, an integration verification protocol standardly fulfills four core functions:

1. **The Pre-Frontend Quality Gate:**
   * Proves that all backend endpoints (`POST /api/v1/tickets`, `GET /api/v1/tickets/{tracking_code}`, etc.) work 100% reliably over real HTTP network sockets before frontend developers connect React forms.
   * Eliminates the classic development deadlock: *"Is the bug in the React submit button, or is it in the FastAPI backend?"* Verifying the backend in isolation proves that the API layer is flawless.
2. **End-to-End Data Ingestion Certification:**
   * Exercises the complete lifecycle of incoming complaint data: passing raw JSON through Pydantic boundary checks, generating cryptographic tracking codes, computing keyword department predictions, persisting records to SQLite, and serializing outgoing JSON responses.
3. **Defensive Validation Boundary Auditing (HTTP 422):**
   * Confirms that the application actively rejects invalid data (titles that are too short, empty whitespace strings) with clean HTTP 422 status codes rather than crashing or storing corrupted data.
4. **Developer Onboarding & Multi-Machine Consistency:**
   * Provides our 5-student team with a deterministic, repeatable command suite to verify that the backend behaves identically across all team members' Windows laptops.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our campus complaint automation platform, our 5-student engineering team specifically uses this protocol for four concrete operational goals:

1. **Certifying Module M2 Before Building the Frontend (Module M6/M7):**
   * Acts as our team's definitive sign-off gate: certifying that a student complaint submitted in PowerShell is assigned a real tracking code (like `TICK-8F2D`), auto-routed to the correct department ID, and saved permanently to `smart_complaints.db`.
2. **Validating Auto-Routing Across Campus Departments:**
   * Runs automated tests for Electrical complaints ("fan sparking" ➔ Department 1), Plumbing complaints ("tap leaking" ➔ Department 2), and General queries ("lost student ID card" ➔ Department 6 fallback).
3. **Testing Live HTTP Network Traffic on Port 8000:**
   * Boots the Uvicorn web server and fires real HTTP requests using PowerShell's `Invoke-RestMethod` and web browser URLs to verify CORS headers and OpenAPI Swagger documentation (`http://localhost:8000/docs`).
4. **Guaranteed Zero Regressions When Merging Branches in Git:**
   * Whenever a team member completes their assigned file (such as `keyword_router.py` or `endpoints/tickets.py`), running this verification protocol proves that their changes did not break teammates' modules.

### How Development Teams Standardly Use This Protocol
Across the engineering lifecycle, the team uses this verification protocol at critical milestones:
* **Post-Milestone Certification:** Executed immediately upon finishing all Module M2 code files to certify backend readiness.
* **Pre-Merge Validation:** Run in PowerShell before committing code to Git to prevent broken routes from entering the shared repository.
* **Live Evaluator Viva Demonstrations:** The team can execute these exact terminal tests during project presentations to prove to professors that complaint ingestion and auto-routing work under the hood.

### The Core Problem It Solves & Why It Exists
* **The "Live Viva Disaster":** Testing endpoints for the first time during an evaluation presentation often results in unexpected 500 errors or syntax crashes. This verification protocol catches every edge case before professors see the system.
* **Frontend Debugging Frustration:** Connecting a React frontend to an unverified API leads to hours of wasted time debugging CORS and 422 errors. Verifying the API first makes frontend integration effortless.
* **Silent Data Truncation:** Ensures that string length limits and auto-assigned department IDs match the database column constraints established in Module M1.

---

# 2. The 5 Verification Checkpoints

---

### Checkpoint 1: Unit Service Verification (Code Generator & Keyword Router)
* **What is tested:**  
  Importing and executing `code_generator.py` and `keyword_router.py` in an isolated Python session without running the web server.
* **Why this test is needed:**  
  Proves that:
  1. The `secrets` module generates unambiguous 9-character tracking codes prefixed with `TICK-`.
  2. The keyword classifier correctly maps electrical keywords to Department 1, plumbing keywords to Department 2, and unrecognized complaints to Department 6 fallback.
* **Execution Command (Run from `backend/` directory in PowerShell):**
  `python -c "from app.services.code_generator import generate_tracking_code; from app.services.keyword_router import classify_complaint; code = generate_tracking_code(); assert code.startswith('TICK-'); assert len(code) == 9; assert classify_complaint('Ceiling fan sparks', 'loose wires')['department_id'] == 1; assert classify_complaint('Pipe leak', 'tap drips')['department_id'] == 2; assert classify_complaint('Lost backpack', 'left in canteen')['department_id'] == 6; print('Checkpoint 1 PASSED: Unit Services Operational')"`
* **Observable Success Criteria:**  
  The terminal prints `Checkpoint 1 PASSED: Unit Services Operational` with zero assertion errors.

---

### Checkpoint 2: Schema Boundary & Normalization Verification
* **What is tested:**  
  Validating proper and improper payloads using Pydantic V2 schemas from `app.schemas.ticket`.
* **Why this test is needed:**  
  Proves that:
  1. Valid payloads instantiate clean `TicketCreate` objects.
  2. The `@field_validator` trims accidental leading and trailing whitespace.
  3. Boundary violations (e.g. title shorter than 5 characters) are caught and rejected by Pydantic.
* **Execution Command (Run from `backend/` directory in PowerShell):**
  `python -c "from app.schemas.ticket import TicketCreate; from pydantic import ValidationError; t = TicketCreate(title='  Water pipe broken  ', description='Water flooding hallway', location='Block B'); assert t.title == 'Water pipe broken'; has_error = False;
try:
    TicketCreate(title='Bad', description='Valid desc here', location='Room 1')
except ValidationError:
    has_error = True
assert has_error; print('Checkpoint 2 PASSED: Pydantic Schemas Enforce Boundaries & Trimming')"`
* **Observable Success Criteria:**  
  The terminal prints `Checkpoint 2 PASSED: Pydantic Schemas Enforce Boundaries & Trimming`.

---

### Checkpoint 3: Service Layer Database Transaction Verification
* **What is tested:**  
  Invoking `create_ticket()`, `get_ticket_by_code()`, `list_tickets()`, and `update_ticket_status()` directly against the SQLite database using an active session.
* **Why this test is needed:**  
  Confirms that:
  1. The service layer successfully mints tracking codes, auto-classifies departments, and commits the row to `smart_complaints.db`.
  2. `db.refresh()` successfully hydrates the generated primary key `id`.
  3. Querying by tracking code returns the exact persisted entity.
  4. Updating status to `"RESOLVED"` automatically populates the `resolved_at` UTC timestamp.
  5. The test record is deleted and committed cleanly, leaving the database pristine.
* **Execution Command (Run from `backend/` directory in PowerShell):**
  `python -c "from app.core.database import SessionLocal; from app.schemas.ticket import TicketCreate; from app.services.ticket_service import create_ticket, get_ticket_by_code, update_ticket_status; db = SessionLocal(); t = create_ticket(db, TicketCreate(title='Test Electrical Issue', description='Testing fan wiring', location='Lab 2')); assert t.department_id == 1; found = get_ticket_by_code(db, t.tracking_code); assert found is not None; updated = update_ticket_status(db, t.id, status='RESOLVED', resolution_notes='Replaced switch'); assert updated.resolved_at is not None; db.delete(updated); db.commit(); db.close(); print('Checkpoint 3 PASSED: Service Layer Transactions & Cleanup Verified')"`
* **Observable Success Criteria:**  
  The terminal prints `Checkpoint 3 PASSED: Service Layer Transactions & Cleanup Verified`.

---

### Checkpoint 4: Server Boot, OpenAPI Docs & Health Check
* **What is tested:**  
  Starting the FastAPI application via Uvicorn and inspecting server responsiveness.
* **Why this test is needed:**  
  Proves that:
  1. `main.py` starts without syntax or import errors.
  2. The lifespan context manager executes table generation on boot.
  3. The master router mounts all ticket endpoints under `/api/v1`.
* **Execution Steps:**
  1. In Terminal 1, navigate to `backend/` and start Uvicorn:
     `uvicorn app.main:app --reload --port 8000`
  2. Open your web browser and navigate to:
     `http://localhost:8000/health`
     * Expected Output: `{"status": "healthy", "version": "1.0.0"}`
  3. Navigate to the interactive Swagger UI:
     `http://localhost:8000/docs`
     * Expected Output: The interactive page renders showing the **tickets** section with `POST /api/v1/tickets`, `GET /api/v1/tickets/{tracking_code}`, `GET /api/v1/tickets`, and `PATCH /api/v1/tickets/{ticket_id}/status`.
* **Observable Success Criteria:**  
  Uvicorn logs `Application startup complete` and both `/health` and `/docs` load cleanly in your browser.

---

### Checkpoint 5: Live HTTP Network Test Suite (cURL / PowerShell)
* **What is tested:**  
  Firing live HTTP requests from a second terminal window to verify complaint ingestion, department auto-routing, schema validation errors, and 404 handling over real network sockets.
* **Why this test is needed:**  
  Proves that the entire system functions end-to-end exactly as it will when connected to the React frontend.

#### Test A: Submit Electrical Complaint (Auto-Route to Department 1)
* **PowerShell Command:**  
  `Invoke-RestMethod -Uri "http://localhost:8000/api/v1/tickets" -Method Post -ContentType "application/json" -Body '{"title": "Ceiling fan stopped spinning", "description": "The fan in room 204 has loose wires and emits a humming spark noise.", "location": "Hostel Block A, Room 204"}'`
* **Expected JSON Response:**
  * `tracking_code`: Starts with `TICK-` (e.g. `TICK-8F2D`).
  * `department_id`: `1` (Automatically mapped to Electrical!).
  * `status`: `"SUBMITTED"`.
  * `priority`: `"MEDIUM"`.

#### Test B: Submit Plumbing Complaint (Auto-Route to Department 2)
* **PowerShell Command:**  
  `Invoke-RestMethod -Uri "http://localhost:8000/api/v1/tickets" -Method Post -ContentType "application/json" -Body '{"title": "Severe water pipe leak", "description": "The washroom tap is continuously dripping and water is flooding the floor.", "location": "Academic Block C, Ground Floor Restroom"}'`
* **Expected JSON Response:**
  * `department_id`: `2` (Automatically mapped to Plumbing!).

#### Test C: Submit General Issue (Auto-Route to Department 6 Fallback)
* **PowerShell Command:**  
  `Invoke-RestMethod -Uri "http://localhost:8000/api/v1/tickets" -Method Post -ContentType "application/json" -Body '{"title": "Lost my identity card", "description": "Misplaced my university student ID card near the main sports ground yesterday.", "location": "Sports Complex"}'`
* **Expected JSON Response:**
  * `department_id`: `6` (Automatically routed to General Administration fallback!).

#### Test D: Verify Schema Boundary Validation (HTTP 422 Guard)
Submit a payload with an invalid title (too short, under 5 characters) and verify the 422 error:
* **PowerShell Command:**  
  `try { Invoke-RestMethod -Uri "http://localhost:8000/api/v1/tickets" -Method Post -ContentType "application/json" -Body '{"title": "Bad", "description": "Valid description length here.", "location": "Hostel B"}' } catch { $_.Exception.Response.StatusCode.value__ }`
* **Expected Output:** The terminal catches and outputs status code `422` (Unprocessable Entity). The database remains completely protected from corrupted data.

#### Test E: Look Up Ticket by Tracking Code
Take the `tracking_code` returned from Test A (e.g. `TICK-8F2D`) and query it:
* **PowerShell Command:**  
  `Invoke-RestMethod -Uri "http://localhost:8000/api/v1/tickets/TICK-8F2D" -Method Get`
* **Expected JSON Response:** Returns the exact complaint record created in Test A.

---

# 3. Flexibility & Modification Guide: What Can Be Changed vs. What Must Stay Exact

### 🟢 Safe to Modify & Customize (Your Team's Creative Freedom):
* **Customizing Test Complaint Text:** You can modify the titles, descriptions, and campus room locations in the test scripts to test different scenarios (e.g. testing Wi-Fi issues for IT Support or broken chairs for Carpentry).
* **Automating Test Scripts:** You can wrap Checkpoints 1 through 5 in a single PowerShell script (`test_m2.ps1`) for one-click team execution.
* **Inspecting Additional JSON Fields:** You can print additional attributes (such as `created_at` or `sla_deadline`) to verify timestamp formatting.

### 🔴 Strict Non-Negotiables (Must Remain Exact Across the Team):
* **Execution Sequence (Checkpoints 1 ➔ 2 ➔ 3 ➔ 4 ➔ 5):** You cannot execute HTTP tests in Checkpoint 5 before booting the server in Checkpoint 4.
* **Server Port (8000):** The backend must run on port 8000 to match CORS configuration and the React client's network target.
* **HTTP Status Code Assertions:** Submissions must return `201 Created`. Invalid inputs must return `422 Unprocessable Entity`. Missing codes must return `404 Not Found`.

---

# 4. Architectural & Theoretical References

This specification operates strictly as an **implementation and integration blueprint**. For the exhaustive computer science fundamentals, language runtime mechanics, and protocol specifications governing this component, consult the following authoritative manuals in the **Developer Guide Suite**:

* [**Guide 12: Automated Testing, Fixtures & Integration**](../../../developer_guide/12_PYTEST_AND_AUTOMATED_TEST_SYSTEMS.md)  
  Pytest test runners, fixture dependency injection (`scope="function"`), and in-memory ASGI dispatch via Starlette `TestClient`.

* [**Guide 04: SQLite 3 Engine Architecture & Storage Mechanics**](../../../developer_guide/04_SQLITE_STORAGE_MECHANICS_AND_WAL_MODE.md)  
  Isolated transactional rollbacks and clean SQLite in-memory test databases.

* [**Guide 02: FastAPI & Modern ASGI Web Architecture**](../../../developer_guide/02_FASTAPI_ASGI_WEB_ARCHITECTURE.md)  
  Testing dependency overrides and closed-loop endpoint assertions.

---

# 5. Error Diagnostics & Troubleshooting Guide

If an error occurs during any verification checkpoint, inspect the bottom line of the terminal traceback and cross-reference this troubleshooting matrix:

| Traceback / Error Message | Underlying Cause in Plain English | Corrective Action |
| :--- | :--- | :--- |
| **`ModuleNotFoundError: No module named 'app'`** | The terminal command was executed from the wrong directory. | Ensure your terminal's current working directory is set precisely to `SmartComplaintHandler/backend/`. |
| **`HTTP 422 Unprocessable Entity`** | The submitted JSON violated Pydantic schema rules (e.g. title too short, missing required field). | Inspect the response body details to see which field failed validation. Ensure title is $\ge 5$ chars, description $\ge 10$ chars. |
| **`HTTP 404 Not Found`** | The URL path is misspelled, or the requested tracking code does not exist in SQLite. | Verify that the URL prefix matches `/api/v1/tickets`. For tracking lookups, ensure the code matches an existing record. |
| **`AttributeError: module 'app.main' has no attribute 'app'`** | Uvicorn cannot find the `app` instance in `backend/app/main.py`. | Verify that `main.py` explicitly exports `app = FastAPI(...)`. |
| **`sqlite3.OperationalError: no such table: tickets`** | Database tables were not created prior to testing. | Ensure `lifespan` in `main.py` executed `Base.metadata.create_all(bind=engine)`, or run the M1 schema creation command. |
| **`CORS Policy Error in Browser Console`** | The frontend origin is missing from `CORSMiddleware`. | Ensure `backend/app/main.py` includes `http://localhost:5173` in the `allow_origins` list. |

---

# 6. Milestone Sign-Off

Module M2 is 100% complete, hardened, and certified when all five checkpoints pass cleanly in sequence:
1. Unit services (`code_generator` and `keyword_router`) pass isolated assertions.
2. Pydantic schemas enforce boundaries and trim whitespace.
3. The service layer executes atomic complaint creation, lookup, and status updates.
4. Uvicorn boots cleanly with `/health` and `/docs` accessible in the browser.
5. Live HTTP submissions auto-route to Electrical, Plumbing, and General Administration, while invalid payloads are rejected with HTTP 422.

The backend ingestion and API transport layer is now officially certified and ready for Module M6 & M7 (React Frontend Portals).
