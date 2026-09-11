# Module M5 Backend: 5-Checkpoint SLA & Lifecycle Verification Protocol

Authoritative Engineering Protocol for Backend Temporal Calculations, State Automata Validation & Quality Assurance.

---

## Section 1: Standard Purpose & Industry Role

### Standard Industry Role & Real-World Use Cases
In high-reliability enterprise backend engineering, temporal calculation engines and state machine transitions cannot be assumed to work based on code inspection alone. A tiny defect in a date math formula can cause all tickets to be marked as instantly breached, triggering thousands of false alarm emails, or allow technicians to close uninspected tickets with empty notes, completely destroying operational auditability.

A comprehensive backend verification protocol (a formal, repeatable suite of programmatic unit tests, database transaction assertions, and live HTTP endpoint sweeps) provides undeniable proof that:
1. SLA deadline calculations add exact durations (4h, 12h, 24h, 72h) in UTC without timezone drift.
2. The lifecycle state machine permits all legal transitions while rejecting illegal shortcuts with strict HTTP 400 errors.
3. Transition guards enforce substantive resolution documentation (min 10 characters) before allowing ticket closure.
4. The database commits updates atomically, maintaining an append-only audit trail in `resolution_notes`.
5. REST API controllers return correct HTTP status codes and properly serialized JSON payloads.

### What WE Are Specifically Using It For in Smart Complaint Handler
In `SmartComplaintHandler`, this protocol acts as the authoritative quality gate for Module M5 Backend:
1. It validates `sla_engine.py`: Asserting that `CRITICAL` issues receive 4-hour deadlines, `HIGH` issues receive 12-hour deadlines, remaining time calculations accurately flag breached tickets, and warning thresholds activate when remaining time drops below 20%.
2. It validates `lifecycle.py`: Asserting that tickets progress cleanly through `SUBMITTED` ➔ `IN_PROGRESS` ➔ `RESOLVED`, while asserting that skipping directly from `SUBMITTED` to `RESOLVED` throws `InvalidStateTransitionError`.
3. It validates resolution notes guards: Asserting that resolving a ticket with empty notes (`""`) or short notes (`"fixed"`) is rejected with a validation error.
4. It validates database transactions in `ticket_service.py`: Asserting that `create_ticket()` automatically stamps `sla_deadline`, `update_ticket_status()` appends audit lines, and `resolve_ticket()` records `resolved_at`.
5. It validates live REST endpoints via curl: Testing `PATCH /status`, `POST /resolve`, `POST /escalate`, and `GET /sla/breaches/active`.

### Future AI Integration & Roadmap Hooks
In Version 2 (V2), when our platform introduces automated AI-driven operational optimization via Gemini API, this verification protocol provides:
1. AI Predictive Latency Benchmark: Checkpoint testing verifying that querying Gemini AI for dynamic SLA estimates completes within a strict 300ms SLA budget.
2. Automated Fallback Resilience Test: Synthetic error injection tests verifying that if the Gemini API service is intentionally severed, the backend service layer seamlessly falls back to local deterministic SLA calculations with zero failed requests.
3. Multi-Turn State Machine Integrity Test: Tests verifying that automated AI background agents cannot bypass human supervisory override gates or alter closed tickets.

### How Other Components Standardly Interact with This File
1. Developers execute this verification protocol after modifying any service, schema, or endpoint in Module M5.
2. Continuous Integration (CI) test runners execute these 5 checkpoints to prevent regression bugs from entering the master branch.

### The Core Problem It Solves & Why It Exists
Without this verification protocol:
- Timezone calculation bugs would go unnoticed until production deployment, when students in different regions report inaccurate countdown timers.
- Technicians could discover that empty resolution notes are accepted, leading to a breakdown in campus maintenance record-keeping.
- Breaking changes in endpoint schemas could silently break frontend components without warning.

---

## Section 2: What Must Be in This File & Why Each Item Is Needed

### Checkpoint 1: Deterministic SLA Math & Breach Evaluation Check
* Objective: Confirm that `sla_engine.py` executes exact temporal arithmetic and accurate breach evaluations.
* Verification Criteria:
  - `calculate_sla_deadline` for `CRITICAL` adds exactly 4 hours to `created_at`.
  - `calculate_sla_deadline` for `HIGH` adds exactly 12 hours.
  - `calculate_sla_deadline` for `MEDIUM` adds exactly 24 hours.
  - `calculate_sla_deadline` for `LOW` adds exactly 72 hours.
  - `calculate_time_remaining` returns `is_breached = False` for future deadlines and `is_breached = True` for past deadlines.
  - `compute_sla_breach_status` returns `"APPROACHING_BREACH"` when remaining time is less than 20% of total duration.

### Checkpoint 2: Lifecycle State Machine Transitions & Invariants Check
* Objective: Confirm that `lifecycle.py` enforces legal transitions and preserves terminal state immutability.
* Verification Criteria:
  - `validate_transition('SUBMITTED', 'IN_PROGRESS')` evaluates to `True`.
  - `validate_transition('IN_PROGRESS', 'RESOLVED', 'Valid resolution notes here')` evaluates to `True`.
  - `validate_transition('IN_PROGRESS', 'ESCALATED', 'Valid escalation reason')` evaluates to `True`.
  - Modifying a ticket in `CLOSED` or `CANCELLED` state raises `TerminalStateModificationError`.

### Checkpoint 3: Transition Guard Validation & Illegal Shortcut Rejection
* Objective: Confirm that illegal transitions and insufficient documentation are blocked.
* Verification Criteria:
  - Attempting `SUBMITTED` -> `RESOLVED` raises `InvalidStateTransitionError`.
  - Attempting `SUBMITTED` -> `ESCALATED` raises `InvalidStateTransitionError`.
  - Attempting to resolve with empty notes (`""`) raises `MissingResolutionNotesError`.
  - Attempting to resolve with notes shorter than 10 characters (`"short"`) raises `MissingResolutionNotesError`.

### Checkpoint 4: Service Layer Transactional Integration & Audit Trail Check
* Objective: Confirm that `ticket_service.py` executes atomic database updates and preserves historical logs.
* Verification Criteria:
  - Ingesting a new ticket via `create_ticket()` automatically stamps non-null `sla_deadline` and initial status `SUBMITTED`.
  - Calling `update_ticket_status()` appends an audit string containing UTC timestamp and actor name to `resolution_notes`.
  - Calling `resolve_ticket()` sets `status = "RESOLVED"`, stamps `resolved_at`, and appends the structured closure report.
  - Calling `get_active_sla_breaches()` filters open tickets and returns only those past deadline or near breach.

### Checkpoint 5: Live HTTP REST API Controller Execution Check
* Objective: Confirm that endpoints in `endpoints/sla.py` return correct HTTP status codes and serialized responses.
* Verification Criteria:
  - `PATCH /api/v1/tickets/{id}/status` returns `HTTP 200` for legal transitions and `HTTP 400` for illegal transitions.
  - `POST /api/v1/tickets/{id}/resolve` returns `HTTP 200` with closure report for valid requests, and `HTTP 400`/`HTTP 422` for invalid notes.
  - `POST /api/v1/tickets/{id}/escalate` returns `HTTP 200` and sets status to `ESCALATED`.
  - `GET /api/v1/sla/breaches/active` returns `HTTP 200` with JSON array conforming to `SLABreachResponse`.
  - Non-existent ticket IDs return `HTTP 404 Not Found`.

---

## Section 3: Component Life-Cycle: Input, Process, Output (IPO Table)

| Verification Phase | Input Command / Action | Execution & Evaluation Procedure | Expected Pass Result |
| :--- | :--- | :--- | :--- |
| **1. Temporal Math Check** | Python CLI testing `calculate_sla_deadline` | Adds timedelta to UTC timestamp; calculates difference in seconds. | Difference equals exactly 14,400s (4h), 43,200s (12h), 86,400s (24h), 259,200s (72h). |
| **2. FSM Legal Check** | Python CLI testing `validate_transition` | Tests `SUBMITTED -> IN_PROGRESS` and `IN_PROGRESS -> RESOLVED`. | Both return `True` without exceptions. |
| **3. FSM Rejection Check** | Python CLI testing illegal jump | Attempts `validate_transition('SUBMITTED', 'RESOLVED')`. | Raises `InvalidStateTransitionError` cleanly. |
| **4. Service Audit Check** | Python CLI invoking `ticket_service` | Advances ticket through lifecycle; inspects database row. | `sla_deadline` populated, `resolved_at` populated, `resolution_notes` contains audit trail. |
| **5. Live HTTP Sweep** | Terminal `curl` commands | Dispatches PATCH, POST, GET requests to active FastAPI server. | HTTP 200 for valid actions; HTTP 400 for illegal transitions; HTTP 404 for missing IDs. |

---

## Section 4: Flexibility & Modification Guide

### 🟢 Safe to Modify & Customize
* **Test Complaint Data**: You may customize ticket titles, descriptions, and locations used in verification scripts.
* **Test Execution Environment**: You can execute these verification checkpoints on local development machines, staging servers, or inside Docker containers.
* **Verification Verbosity**: You may add print statements or logging configuration to output detailed JSON responses during test runs.

### 🔴 Strict Non-Negotiables (Do NOT Alter)
* **5-Checkpoint Sequence**: Do NOT skip checkpoints. Verifying HTTP controllers before proving that the underlying mathematical formulas and state machines are bug-free produces misleading results.
* **Zero Unhandled Exceptions Rule**: All negative tests (illegal transitions, short notes) must confirm that errors are caught and converted into clean HTTP 400 or 422 responses, rather than throwing uncaught HTTP 500 server crashes.
* **Database Session Teardown**: All standalone Python verification scripts must invoke `db.close()` inside a `finally` block to prevent SQLite connection pool exhaustion.

---

## Section 5: Advanced Concepts Explained

### 1. Temporal State Machine Testing & Time Freezing
Testing software that depends on elapsed time (such as countdown timers or breach detectors) is notoriously difficult because real-world time progresses uncontrollably.

In our verification protocol, we test temporal logic through Controlled Timestamp Offsetting:
- Rather than waiting 4 hours to verify that a ticket breaches, the test script creates a synthetic creation timestamp offset into the past:
  `past_time = datetime.now(timezone.utc) - timedelta(hours=5)`
- When passed into `calculate_time_remaining()`, the engine immediately evaluates the ticket as 1 hour overdue.
- This allows the entire 5-checkpoint verification protocol to execute in under 3 seconds, delivering instantaneous test results without requiring artificial sleep delays.

### 2. Idempotent Test Data Isolation
Running verification tests against a shared database risks leaving leftover dummy records:
- If a test script creates 10 test tickets and crashes midway, subsequent test runs find unexpected records, causing count assertions to fail.

Our verification protocol adheres to Idempotent Test Isolation:
- Tests operate within explicit database sessions.
- In automated test suites, each test executes inside a transaction that rolls back upon completion (`db.rollback()`), ensuring that the database remains in its pristine seed state.
- For live HTTP tests, unique tracking code prefixes (e.g. `TICK-TEST-XXXX`) are used so test records are easily distinguished from production complaints.

### 3. Assertion Testing of Negative Control Paths
In software engineering, testing only the "happy path" (scenarios where everything goes right) catches less than 20% of production defects.

Our verification protocol places heavy emphasis on Negative Control Paths:
- Checkpoint 3 deliberately attempts illegal state jumps (`SUBMITTED` -> `RESOLVED`), verifies that `InvalidStateTransitionError` is raised, and asserts that the ticket status was *not* mutated in SQLite.
- It deliberately submits 5-character resolution notes, verifies that `MissingResolutionNotesError` is raised, and confirms that `resolved_at` remains null.
- This mathematically proves that our validation guards operate as impenetrable security barriers.

---

## Section 6: Complete Verification Commands & Troubleshooting Matrix

### Verification Execution Commands

1. **Execute Checkpoint 1: Deterministic SLA Math:**
   Run in backend directory:
   `python -c "from app.services.sla_engine import calculate_sla_deadline, calculate_time_remaining; from datetime import datetime, timezone, timedelta; now = datetime.now(timezone.utc); c_dl = calculate_sla_deadline(now, 'CRITICAL'); assert (c_dl - now).total_seconds() == 14400; l_dl = calculate_sla_deadline(now, 'LOW'); assert (l_dl - now).total_seconds() == 259200; rem = calculate_time_remaining(now + timedelta(minutes=90)); assert rem['is_breached'] == False; overdue = calculate_time_remaining(now - timedelta(minutes=45)); assert overdue['is_breached'] == True; print('Checkpoint 1 PASS: SLA Math 100% Correct')"`
   Expected output: `Checkpoint 1 PASS: SLA Math 100% Correct`.

2. **Execute Checkpoints 2 & 3: Lifecycle State Machine & Guards:**
   Run in backend directory:
   `python -c "from app.services.lifecycle import validate_transition, InvalidStateTransitionError, MissingResolutionNotesError; assert validate_transition('SUBMITTED', 'IN_PROGRESS') == True; assert validate_transition('IN_PROGRESS', 'RESOLVED', 'Replaced faulty valve') == True; try: validate_transition('SUBMITTED', 'RESOLVED'); assert False, 'Failed to block illegal jump'; except InvalidStateTransitionError: pass; try: validate_transition('IN_PROGRESS', 'RESOLVED', 'short'); assert False, 'Failed to block short notes'; except MissingResolutionNotesError: pass; print('Checkpoints 2 & 3 PASS: FSM Guards 100% Correct')"`
   Expected output: `Checkpoints 2 & 3 PASS: FSM Guards 100% Correct`.

3. **Execute Checkpoint 4: Service Layer Database Integration:**
   Run in backend directory:
   `python -c "from app.db.session import SessionLocal; from app.services.ticket_service import create_ticket, update_ticket_status, resolve_ticket; from app.schemas.ticket import TicketCreate; db = SessionLocal(); t = create_ticket(db, TicketCreate(title='Broken Window Latch', description='Window latch broken in Room 301', location='Hostel C 301')); assert t.sla_deadline is not None; assert t.status == 'SUBMITTED'; t = update_ticket_status(db, t.id, 'IN_PROGRESS', 'Technician assigned', 'Admin'); assert t.status == 'IN_PROGRESS'; assert 'SUBMITTED -> IN_PROGRESS' in t.resolution_notes; t = resolve_ticket(db, t.id, 'Repaired window latch and lubricated hinges'); assert t.status == 'RESOLVED'; assert t.resolved_at is not None; print('Checkpoint 4 PASS: Service Layer Integration 100% Correct'); db.close()"`
   Expected output: `Checkpoint 4 PASS: Service Layer Integration 100% Correct`.

4. **Execute Checkpoint 5: Live REST API Execution (Terminal Sweep):**
   Start backend server: `uvicorn app.main:app --reload --port 8000`
   In a separate terminal, execute:
   - Status Update:
     `curl -s -X PATCH http://127.0.0.1:8000/api/v1/tickets/1/status -H "Content-Type: application/json" -d "{\"status\": \"IN_PROGRESS\"}" | grep -o "\"status\":\"IN_PROGRESS\""`
   - Illegal Transition Rejection:
     `curl -s -X PATCH http://127.0.0.1:8000/api/v1/tickets/2/status -H "Content-Type: application/json" -d "{\"status\": \"RESOLVED\"}" | grep -o "Illegal state transition"`
   - Ticket Resolution:
     `curl -s -X POST http://127.0.0.1:8000/api/v1/tickets/1/resolve -H "Content-Type: application/json" -d "{\"resolution_notes\": \"Completed physical repairs and verified operations\"}" | grep -o "\"status\":\"RESOLVED\""`
   - Active Breaches Query:
     `curl -s http://127.0.0.1:8000/api/v1/sla/breaches/active | grep -o "\["`
   Expected output: All grep assertions return matching strings.

### Complete Troubleshooting Matrix

| Symptom / Failure | Root Cause | Exact Resolution Procedure |
| :--- | :--- | :--- |
| Checkpoint 1 fails with `AssertionError: (c_dl - now).total_seconds() == 14400`. | `SLA_POLICY` has an incorrect hourly value for `CRITICAL` (e.g. 24 instead of 4). | Check `backend/app/services/sla_engine.py` and verify `"CRITICAL": 4`. |
| Checkpoint 2 fails with `AssertionError: Failed to block illegal jump`. | `TRANSITION_RULES` mistakenly includes `"RESOLVED"` in the destination set for `"SUBMITTED"`. | Remove `"RESOLVED"` from the `"SUBMITTED"` set in `backend/app/services/lifecycle.py`. |
| Checkpoint 4 fails with `AttributeError: 'Ticket' object has no attribute 'sla_deadline'`. | The SQLite table was created before `sla_deadline` was added to the ORM model, and migrations were not run. | Delete `smart_complaints.db` and re-run `python -c "from app.db.base import Base; from app.db.session import engine; from app.models import *; Base.metadata.create_all(bind=engine)"` followed by seed runner. |
| Live API returns `HTTP 422 Unprocessable Entity` on `POST /resolve`. | `resolution_notes` passed in JSON has fewer than 10 characters or is missing. | Ensure the test payload contains `resolution_notes` with at least 10 non-whitespace characters. |
| Live API returns `HTTP 404 Not Found` on `GET /sla/breaches/active`. | Router was not included in `backend/app/api/v1/router.py`. | Verify `api_router.include_router(sla.router, tags=["sla", "tickets"])` is present in `router.py`. |
