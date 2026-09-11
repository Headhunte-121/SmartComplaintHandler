# Module M5 Backend: SLA & Lifecycle REST API Controllers Specification

Authoritative Engineering Blueprint for `backend/app/api/v1/endpoints/sla.py`.

---

## Section 1: Standard Purpose & Industry Role

### Standard Industry Role & Real-World Use Cases
In RESTful API design, Presentation Controllers (the API routing modules that expose HTTP endpoints, unpack serialized network request payloads, enforce dependency injection, and map service outcomes to HTTP response status codes) serve as the formal boundary between client applications and backend business logic. Controllers must remain thin and declarative: they do not implement business logic directly, but rather validate incoming data, delegate to domain services, and translate domain exceptions into standardized HTTP error envelopes.

In incident management, facility operations, and ticketing platforms, lifecycle endpoints govern state transitions and operational audits:
1. `PATCH /tickets/{id}/status`: Allows operational staff to advance ticket lifecycles incrementally (e.g. from `SUBMITTED` to `IN_PROGRESS`).
2. `POST /tickets/{id}/resolve`: A dedicated, high-integrity transaction endpoint requiring formal closure documentation to resolve an issue.
3. `POST /tickets/{id}/escalate`: A supervisory command endpoint that elevates high-risk issues for immediate intervention.
4. `GET /sla/breaches/active`: A real-time telemetry endpoint feeding administrative monitoring dashboards with all tickets nearing or exceeding SLA commitments.

### What WE Are Specifically Using It For in Smart Complaint Handler
In `SmartComplaintHandler`, `backend/app/api/v1/endpoints/sla.py` provides the HTTP presentation layer for all SLA and lifecycle actions:
1. It exposes `PATCH /tickets/{ticket_id}/status`, accepting a Pydantic `StatusUpdateRequest` body and invoking `update_ticket_status()`. It catches domain exceptions (`InvalidStateTransitionError`, `TerminalStateModificationError`) and translates them into clean `HTTP 400 Bad Request` responses with explanatory messages.
2. It exposes `POST /tickets/{ticket_id}/resolve`, accepting a `TicketResolveRequest` body, verifying substantive resolution notes (min 10 characters), stamping `resolved_at`, and returning the updated ticket conforming to `TicketLifecycleResponse`.
3. It exposes `POST /tickets/{ticket_id}/escalate`, allowing staff or supervisors to escalate a delayed ticket with documented justification.
4. It exposes `GET /sla/breaches/active`, returning a prioritized array of overdue and approaching-breach complaints conforming to `SLABreachResponse` to populate the supervisor escalation table (`SLABreachTable.jsx`).
5. It enforces transaction isolation and dependency injection via FastAPI's `Depends(get_db)`.

### Future AI Integration & Roadmap Hooks
In Version 2 (V2), when our platform introduces automated AI-driven triage and operational optimization via Gemini API, these endpoints provide:
1. AI Webhook & Trigger Ingestion: A secure service endpoint `POST /tickets/{id}/ai-triage-audit` allowing background Gemini AI workers to append automated telemetry, predictive SLA adjustments, and confidence ratings to open tickets.
2. Photographic Closure Verification: Integration in `POST /tickets/{id}/resolve` accepting multi-part image uploads, forwarding photos to Gemini Vision for physical repair verification before confirming resolution.
3. Universal Endpoint Stability: The frontend API client interacts with the exact same REST endpoints regardless of whether an escalation or status update is executed by a human supervisor or proposed by Gemini AI.

### How Other Components Standardly Interact with This File
1. `api/v1/router.py` (Module M5 Backend) imports `router` from this file and mounts it under the `/api/v1` namespace.
2. `src/api/sla.js` (Module M5 Frontend) executes HTTP requests (`apiClient.patch()`, `apiClient.post()`, `apiClient.get()`) against these endpoints.
3. This file imports schemas from `schemas/sla.py` and service methods from `services/ticket_service.py`.

### The Core Problem It Solves & Why It Exists
Without these controllers:
- Frontend components would attempt to modify tickets through generic database updates, bypassing lifecycle state machine rules and validation guards.
- Service exceptions (like attempting an illegal state transition) would result in unhandled Python errors returning generic `HTTP 500 Internal Server Error` responses with zero actionable guidance for staff.
- Supervisors would have no dedicated endpoint to query active SLA breaches, forcing client applications to download thousands of closed tickets and compute delays locally in the browser.

---

## Section 2: What Must Be in This File & Why Each Item Is Needed

### 1. APIRouter Initialization & Dependency Setup
* Router Instantiation: `router = APIRouter()`.
* Session Dependency: Imports `get_db` from `app.api.deps` and injects it across all endpoints using `db: Session = Depends(get_db)`.
* Schema Imports: Imports `StatusUpdateRequest`, `TicketResolveRequest`, `EscalationRequest`, `SLABreachResponse`, and `TicketLifecycleResponse` from `app.schemas.sla`.
* Service Imports: Imports `update_ticket_status`, `resolve_ticket`, `escalate_ticket`, and `get_active_sla_breaches` from `app.services.ticket_service`.
* Exception Imports: Imports `InvalidStateTransitionError`, `MissingResolutionNotesError`, and `TerminalStateModificationError` from `app.services.lifecycle`.

### 2. `PATCH /tickets/{ticket_id}/status` Controller Specification
* Endpoint Path & Method: `@router.patch("/tickets/{ticket_id}/status", response_model=TicketLifecycleResponse)`
* Parameters:
  - `ticket_id: int`: Path parameter identifying target ticket.
  - `payload: StatusUpdateRequest`: JSON body containing target `status`, optional `notes`, and `actor`.
  - `db: Session = Depends(get_db)`: Injected database session.
* Execution Flow:
  - Calls `ticket = update_ticket_status(db, ticket_id, payload.status.value, payload.notes, payload.actor)`.
  - If `ticket is None`: Raises `HTTPException(status_code=404, detail="Ticket not found")`.
  - Returns `ticket`.
* Exception Translation:
  - Catches `(InvalidStateTransitionError, TerminalStateModificationError)`:
    - Raises `HTTPException(status_code=400, detail=str(e))`.

### 3. `POST /tickets/{ticket_id}/resolve` Controller Specification
* Endpoint Path & Method: `@router.post("/tickets/{ticket_id}/resolve", response_model=TicketLifecycleResponse)`
* Parameters:
  - `ticket_id: int`: Path parameter identifying target ticket.
  - `payload: TicketResolveRequest`: JSON body containing `resolution_notes`, optional `parts_replaced`, and `technician_name`.
  - `db: Session = Depends(get_db)`: Injected database session.
* Execution Flow:
  - Calls `ticket = resolve_ticket(db, ticket_id, payload.resolution_notes, payload.parts_replaced, payload.technician_name)`.
  - If `ticket is None`: Raises `HTTPException(status_code=404, detail="Ticket not found")`.
  - Returns `ticket`.
* Exception Translation:
  - Catches `(InvalidStateTransitionError, MissingResolutionNotesError, TerminalStateModificationError)`:
    - Raises `HTTPException(status_code=400, detail=str(e))`.

### 4. `POST /tickets/{ticket_id}/escalate` Controller Specification
* Endpoint Path & Method: `@router.post("/tickets/{ticket_id}/escalate", response_model=TicketLifecycleResponse)`
* Parameters:
  - `ticket_id: int`: Path parameter identifying target ticket.
  - `payload: EscalationRequest`: JSON body containing `escalation_reason` and optional `supervisor_id`.
  - `db: Session = Depends(get_db)`: Injected database session.
* Execution Flow:
  - Calls `ticket = escalate_ticket(db, ticket_id, payload.escalation_reason, payload.supervisor_id)`.
  - If `ticket is None`: Raises `HTTPException(status_code=404, detail="Ticket not found")`.
  - Returns `ticket`.
* Exception Translation:
  - Catches `InvalidStateTransitionError`: Raises `HTTPException(status_code=400, detail=str(e))`.

### 5. `GET /sla/breaches/active` Controller Specification
* Endpoint Path & Method: `@router.get("/sla/breaches/active", response_model=list[SLABreachResponse])`
* Parameters:
  - `threshold_ratio: float = 0.20`: Query parameter specifying early-warning threshold ratio.
  - `db: Session = Depends(get_db)`: Injected database session.
* Execution Flow:
  - Calls `breaches = get_active_sla_breaches(db, threshold_ratio)`.
  - Returns `breaches`.

---

## Section 3: Component Life-Cycle: Input, Process, Output (IPO Table)

| Life-Cycle Phase | Primary Input | Internal Transformation & Logic | Final Output |
| :--- | :--- | :--- | :--- |
| **1. Status Update Request** | `PATCH /tickets/1/status` `{"status": "IN_PROGRESS"}` | Validates schema; invokes `update_ticket_status()`; catches exceptions; commits changes. | Returns HTTP 200 with updated `TicketLifecycleResponse` JSON. |
| **2. Illegal Transition Error** | `PATCH /tickets/1/status` `{"status": "RESOLVED"}` | Service raises `InvalidStateTransitionError`; controller catches exception; maps to HTTP 400. | Returns HTTP 400 with `{"detail": "Illegal state transition from 'SUBMITTED' to 'RESOLVED'..."}`. |
| **3. Resolution Request** | `POST /tickets/1/resolve` `{"resolution_notes": "Replaced valve"}` | Validates notes >= 10 chars; calls `resolve_ticket()`; records `resolved_at`; updates status. | Returns HTTP 200 with resolved ticket record and closure metadata. |
| **4. Escalation Command** | `POST /tickets/1/escalate` `{"escalation_reason": "Severe leak"}` | Validates reason >= 5 chars; calls `escalate_ticket()`; sets status `ESCALATED`. | Returns HTTP 200 with escalated ticket record. |
| **5. Breach Scan Query** | `GET /sla/breaches/active` | Queries open tickets; calculates overdue seconds; formats breach list. | Returns HTTP 200 with JSON array of overdue and high-risk tickets. |

---

## Section 4: Flexibility & Modification Guide

### 🟢 Safe to Modify & Customize
* **Default Query Thresholds**: You can adjust the default value of `threshold_ratio` in `GET /sla/breaches/active` from `0.20` to `0.25` based on operational preferences.
* **OpenAPI Documentation Tags & Summaries**: You can customize endpoint `summary`, `description`, and `tags` attributes to enhance the generated Swagger documentation at `/docs`.
* **Additional Query Filters**: You can add optional query parameters (such as `department_id: int | None = None`) to `GET /sla/breaches/active` to allow filtering breaches by specific campus departments.

### 🔴 Strict Non-Negotiables (Do NOT Alter)
* **HTTP PATCH Semantics for Status Updates**: Status updates must use `PATCH`, not `PUT`. `PUT` implies replacing the entire entity (requiring all ticket attributes to be re-transmitted), whereas `PATCH` correctly represents a partial mutation of the `status` and `resolution_notes` attributes.
* **Domain Exception to HTTP 400 Mapping**: Never allow domain lifecycle exceptions to escape unhandled. Letting `InvalidStateTransitionError` escape triggers an uncaught server exception returning `HTTP 500`, misrepresenting a client input violation as a server crash.
* **404 Not Found Checks**: Every ticket mutation endpoint must verify that the returned ticket is not `None`. Attempting to return `None` or access attributes on a missing record causes server errors.

---

## Section 5: Advanced Concepts Explained

### 1. HTTP PATCH Semantics vs. PUT in State Automata
In HTTP specification (RFC 5789 and RFC 7231):
- `PUT`: Idempotent resource replacement. The client transmits the complete representation of the resource. If fields are omitted, they are reset to defaults.
- `PATCH`: Non-idempotent or incremental partial modification. The client transmits only the specific delta of changes to be applied.

In state machine engineering, modifying entity status is an incremental event:
- A staff member starting work transmits only `{"status": "IN_PROGRESS"}`.
- Using `PATCH` guarantees that the client does not inadvertently overwrite existing fields (such as `title`, `location`, or `created_at`).
- Furthermore, transition validation guards execute as side-effect checks during the patch operation, ensuring state machine integrity.

### 2. Standardized Error Response Mapping (RFC 7807)
FastAPI's `HTTPException` aligns with modern web API error standards:
- Status `400 Bad Request`: Used when the client's request is syntactically well-formed JSON, but violates business domain rules (such as attempting an illegal state machine transition or providing insufficient resolution documentation).
- Status `404 Not Found`: Used when the resource identified by the URL path (`ticket_id`) does not exist in SQLite.
- Status `422 Unprocessable Entity`: Used when the request body violates Pydantic structural boundaries (such as passing an invalid enum string or missing a required field).

By mapping domain exceptions to these precise status codes, frontend clients can programmatically distinguish between a typo in the URL (404), a form syntax mistake (422), and an operational rule violation (400).

### 3. Concurrency & Optimistic State Verification
In busy campus environments, two staff members might view the same ticket simultaneously:
- Staff A clicks "Start Work" (`IN_PROGRESS`).
- Staff B clicks "Start Work" milliseconds later.

Our endpoint architecture handles this gracefully:
- When Staff A's request executes, the state machine transitions `SUBMITTED` -> `IN_PROGRESS`.
- When Staff B's request executes, the ticket's current state is already `IN_PROGRESS`.
- The state machine checks `TRANSITION_RULES['IN_PROGRESS']`. Because `IN_PROGRESS` cannot transition to `IN_PROGRESS`, it raises `InvalidStateTransitionError`.
- Staff B receives an immediate HTTP 400 informing them that the ticket is already under repair, preventing conflicting duplicate assignments.

---

## Section 6: Definition of Done & Verification Protocol

### Observable Verification Checklist
* [ ] `backend/app/api/v1/endpoints/sla.py` exists and defines the 4 core endpoints.
* [ ] `PATCH /tickets/{id}/status` updates ticket status and returns `TicketLifecycleResponse`.
* [ ] Attempting an illegal status transition returns `HTTP 400 Bad Request` with an explanatory error message.
* [ ] `POST /tickets/{id}/resolve` validates resolution notes and returns `TicketLifecycleResponse`.
* [ ] Attempting to resolve with notes shorter than 10 characters returns `HTTP 422` or `HTTP 400`.
* [ ] `POST /tickets/{id}/escalate` updates status to `ESCALATED` and records the justification.
* [ ] `GET /sla/breaches/active` returns a JSON array of overdue and high-risk tickets.
* [ ] Passing a non-existent `ticket_id` returns `HTTP 404 Not Found`.

### Verification Commands & Troubleshooting Matrix

1. **Verify Legal Status Update via Curl:**
   Run in terminal with backend active:
   `curl -X PATCH http://127.0.0.1:8000/api/v1/tickets/1/status -H "Content-Type: application/json" -d "{\"status\": \"IN_PROGRESS\", \"notes\": \"Technician arrived on site\"}"`
   Expected response: `HTTP 200 OK` with JSON displaying `"status": "IN_PROGRESS"` and updated notes.

2. **Verify Illegal Shortcut Rejection via Curl:**
   Run in terminal:
   `curl -X PATCH http://127.0.0.1:8000/api/v1/tickets/2/status -H "Content-Type: application/json" -d "{\"status\": \"RESOLVED\"}"`
   (Assuming ticket 2 is currently in `SUBMITTED` state).
   Expected response: `HTTP 400 Bad Request` with `{"detail": "Illegal state transition from 'SUBMITTED' to 'RESOLVED'..."}`.

3. **Verify Ticket Resolution Endpoint via Curl:**
   Run in terminal:
   `curl -X POST http://127.0.0.1:8000/api/v1/tickets/1/resolve -H "Content-Type: application/json" -d "{\"resolution_notes\": \"Replaced 2-inch PVC valve under washroom sink\", \"parts_replaced\": \"PVC Valve 2in\", \"technician_name\": \"Dave\"}"`
   Expected response: `HTTP 200 OK` with `"status": "RESOLVED"`, populated `"resolved_at"`, and closure report in notes.

4. **Verify Active Breaches Query via Curl:**
   Run in terminal:
   `curl http://127.0.0.1:8000/api/v1/sla/breaches/active`
   Expected response: `HTTP 200 OK` with JSON array `[...]`.

5. **Troubleshooting Matrix:**
   * *Problem:* Endpoints return `404 Not Found` for URL paths like `/api/v1/tickets/1/status`.
     * *Cause:* Router was not mounted in `backend/app/api/v1/router.py`.
     * *Fix:* Verify that `router.include_router(sla.router, tags=["sla", "tickets"])` is added in `router.py`.
   * *Problem:* Resolving a ticket returns `HTTP 500 Internal Server Error`.
     * *Cause:* A domain exception was unhandled in the endpoint or database session failed to commit.
     * *Fix:* Ensure `try/except (InvalidStateTransitionError, MissingResolutionNotesError)` blocks wrap service calls.
   * *Problem:* `GET /sla/breaches/active` returns an empty array even when tickets are past deadline.
     * *Cause:* Open tickets have `sla_deadline = None` or status is already `RESOLVED`.
     * *Fix:* Check database rows to confirm open tickets have non-null `sla_deadline` timestamps.
