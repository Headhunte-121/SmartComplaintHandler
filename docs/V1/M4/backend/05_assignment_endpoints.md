# Module M4 - Backend File 05: Workload Dispatch & Reassignment Endpoints
## Target File: `backend/app/api/v1/endpoints/assignment.py`
### Execution Track: Phase 4 (Presentation Layer; Requires Files 01, 02, 03, and 04)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In enterprise microservice architectures and RESTful web applications, `endpoints/assignment.py` defines the **Presentation Controller Layer** for workforce dispatch, squad telemetry monitoring, and task reassignment. Presentation controllers sit on the network perimeter of the backend: intercepting HTTP requests, validating incoming JSON payloads against Pydantic schemas, injecting database sessions, invoking business service functions, and serializing responses into standardized HTTP contracts.

### Standard Industry Role & Real-World Use Cases
In professional production systems (such as Salesforce Field Service, Zendesk Dispatch, and ServiceNow ITIL Work Order APIs), presentation controller endpoints standardly fulfill four core architectural duties:

1. **Exposing Workload Telemetry Feeds:**
   * Serves real-time workforce queue telemetry over HTTP `GET` endpoints.
   * Feeds frontend administrative dashboards with live squad statistics (active ticket counts, capacity bands, shift status) so facility managers can monitor operational health.
2. **Exposing Controlled State Mutation Endpoints (HTTP PATCH & POST Semantics):**
   * Exposes semantic HTTP `PATCH` endpoints for partial resource updates (such as transferring a ticket to a new squad or toggling a squad's shift availability).
   * Exposes semantic HTTP `POST` endpoints to trigger automated algorithmic dispatch runs.
3. **HTTP Status Code Mapping & Standardized Error Handling:**
   * Translates domain outcomes into standardized RFC 9110 HTTP status codes:
     * `200 OK`: Successful workload retrieval, ticket reassignment, or availability toggle.
     * `400 Bad Request`: Invalid business parameter (e.g. attempting to reassign a ticket to a non-existent squad ID).
     * `404 Not Found`: Target ticket or team does not exist in SQLite.
     * `422 Unprocessable Entity`: Request body failed schema validation rules.
4. **Dependency Injection & Connection Lifetime Safety:**
   * Injects database connections via FastAPI's `Depends(get_db)` provider, ensuring every incoming HTTP request receives an isolated database transaction that automatically closes when the request finishes.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our campus complaint automation platform, our 5-student engineering team specifically uses `backend/app/api/v1/endpoints/assignment.py` for four concrete operational functions:

1. **Serving Squad Workload Feeds (`GET /teams/workloads`):**
   * Supplies the live data consumed by the frontend React workload panel (`TeamWorkloadView.jsx`).
   * Supports an optional query parameter (`department_id`) so the dashboard can filter workloads for a specific department or view all 12 squads simultaneously.
2. **Administrative Ticket Reassignment (`PATCH /tickets/{ticket_id}/reassign`):**
   * Powers the supervisor transfer modal (`ReassignTeamModal.jsx`).
   * Receives `ticket_id` in the URL path and `TeamReassignRequest` in the JSON body, updates the assigned squad in SQLite, and appends the mandatory justification note into `ticket.resolution_notes`.
3. **On-Demand Automated Dispatch (`POST /tickets/{ticket_id}/dispatch`):**
   * Allows facility managers to trigger automated least-loaded dispatch on previously unassigned complaints.
4. **Squad Shift Availability Toggle (`PATCH /teams/{team_id}/availability`):**
   * Exposes an endpoint allowing staff supervisors to toggle a squad's on-duty status (`is_active = True/False`), instantly taking crews on or off shift.

### Future AI Integration & Workforce API Stability (V2 Roadmap)
While Version 1 endpoints trigger deterministic algorithms, the endpoint contracts are engineered to remain completely stable when AI is integrated:
* **Stable Network Contracts:** In V2, when predictive AI models evaluate historical repair times or technician GPS coordinates to recommend dispatches, the frontend will continue calling these exact same endpoints. The controller routes request traffic, agnostic to whether an algorithm or an AI model performs the selection.
* **Human-in-the-Loop Supervisory API:** The `PATCH /tickets/{ticket_id}/reassign` route serves as the permanent API gate for human supervisory governance. Regardless of what automated system made the assignment, this endpoint allows human administrators to override the machine decision with an audit explanation.
* **Zero Frontend Breaking Changes:** Upgrading the backend to predictive AI in V2 requires zero modifications to URL paths, request parameters, or response payloads.

### How Other Components Standardly Interact with This File
Across the backend architecture, this file connects the presentation layer to services and routers:
* **The API Router Aggregator (`backend/app/api/v1/router.py`):** Mounts this controller router, exposing paths under `/api/v1/tickets/...` and `/api/v1/teams/...`.
* **The Frontend API Client (`frontend/src/api/assignment.js`):** Makes Axios/Fetch network calls to these exact endpoints to populate dashboard cards and submit modal forms.
* **Automated Integration Test Suites:** Execute simulated HTTP calls using FastAPI's `TestClient` to verify status codes and database mutations.

### The Core Problem It Solves & Why It Exists
* **The "Black Hole" Workforce Problem:** Without telemetry endpoints, supervisors have no visibility into squad queues and must make phone calls to find out which technician is overloaded.
* **Unvalidated Direct Database Updates:** Exposing direct database modifications over generic APIs risks corrupting ticket statuses or assigning invalid team IDs. Dedicated endpoints enforce business validation rules strictly.

---

# 2. What Must Be in This File & Why Each Item Is Needed

To be complete, production-grade, and fully compliant with FastAPI standards, `backend/app/api/v1/endpoints/assignment.py` must define and export the following structural components:

---

### Item 1: Router Initialization
* **What it is:** Instantiating the FastAPI sub-router for assignment and workforce operations.
* **Specification:** `router = APIRouter()`
* **Why it is needed:**
  * Groups related assignment route handlers into a modular container that can be mounted into the master API router aggregator.

---

### Item 2: Dependency & Service Imports
* **What it is:** Importing required HTTP constructs, schemas, and service functions.
* **Required Imports:**
  * `from fastapi import APIRouter, Depends, HTTPException, status, Query`
  * `from sqlalchemy.orm import Session`
  * `from app.api.deps import get_db`
  * `from app.schemas.assignment import TeamWorkloadResponse, TeamReassignRequest, TeamAvailabilityUpdate`
  * `from app.schemas.ticket import TicketResponse`
  * `from app.services.team_service import get_all_teams_with_workload, toggle_team_availability`
  * `from app.services.ticket_service import reassign_ticket_team, dispatch_existing_ticket`
* **Why it is needed:**
  * Connects the presentation controller layer to validation models and underlying business logic.

---

### Item 3: Squad Workload Telemetry Endpoint (`GET /teams/workloads`)
* **What it is:** An HTTP GET endpoint returning real-time queue depths and status bands across maintenance squads.
* **Route Declaration:** `@router.get("/teams/workloads", response_model=list[TeamWorkloadResponse], status_code=status.HTTP_200_OK, summary="Get real-time workload telemetry for maintenance squads")`
* **Handler Signature:** `def get_squad_workloads(department_id: Optional[int] = Query(None, description="Optional department filter"), db: Session = Depends(get_db)) -> list[TeamWorkloadResponse]`
* **Execution Sequence:**
  1. Call service layer: `workloads = get_all_teams_with_workload(db=db, department_id=department_id)`
  2. Return `workloads` (FastAPI validates and serializes into `list[TeamWorkloadResponse]`).
* **Why it is needed:**
  * Powers the frontend React squad workload panel with live queue metrics.

---

### Item 4: Administrative Ticket Reassignment Endpoint (`PATCH /tickets/{ticket_id}/reassign`)
* **What it is:** An HTTP PATCH endpoint allowing supervisors to transfer a complaint to a different squad.
* **Route Declaration:** `@router.patch("/tickets/{ticket_id}/reassign", response_model=TicketResponse, status_code=status.HTTP_200_OK, summary="Manually reassign ticket to another squad")`
* **Handler Signature:** `def reassign_ticket(ticket_id: int, reassign_data: TeamReassignRequest, db: Session = Depends(get_db)) -> TicketResponse`
* **Execution Sequence:**
  1. Try executing reassignment:
     `try:`
     `    updated_ticket = reassign_ticket_team(db=db, ticket_id=ticket_id, reassign_data=reassign_data)`
     `except ValueError as e:`
     `    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))`
  2. If `updated_ticket is None`:
     `    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ticket with ID {ticket_id} not found")`
  3. Return `updated_ticket`.
* **Why it is needed:**
  * Implements the Human-in-the-Loop supervisory control over REST HTTP semantics with proper error handling.

---

### Item 5: On-Demand Automated Dispatch Endpoint (`POST /tickets/{ticket_id}/dispatch`)
* **What it is:** An HTTP POST endpoint triggering automated dispatch on a pending complaint.
* **Route Declaration:** `@router.post("/tickets/{ticket_id}/dispatch", response_model=TicketResponse, status_code=status.HTTP_200_OK, summary="Trigger automated squad dispatch for an unassigned ticket")`
* **Handler Signature:** `def dispatch_ticket(ticket_id: int, db: Session = Depends(get_db)) -> TicketResponse`
* **Execution Sequence:**
  1. Call service: `ticket, message = dispatch_existing_ticket(db=db, ticket_id=ticket_id)`
  2. If `ticket is None`:
     `    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)`
  3. Return `ticket`.
* **Why it is needed:**
  * Enables administrators to trigger dispatch runs on pending tickets once technicians begin their shifts.

---

### Item 6: Squad Availability Toggle Endpoint (`PATCH /teams/{team_id}/availability`)
* **What it is:** An HTTP PATCH endpoint toggling a squad's on-duty shift status.
* **Route Declaration:** `@router.patch("/teams/{team_id}/availability", status_code=status.HTTP_200_OK, summary="Toggle squad shift availability status")`
* **Handler Signature:** `def set_team_availability(team_id: int, update_data: TeamAvailabilityUpdate, db: Session = Depends(get_db))`
* **Execution Sequence:**
  1. Call service: `updated_team = toggle_team_availability(db=db, team_id=team_id, is_active=update_data.is_active)`
  2. If `updated_team is None`:
     `    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Team with ID {team_id} not found")`
  3. Return `{"team_id": updated_team.id, "team_name": updated_team.name, "is_active": updated_team.is_active}`.
* **Why it is needed:**
  * Allows facility managers to take squads on or off duty with a single toggle switch in the UI.

---

# 3. Component Life-Cycle: Input, Process, Output (IPO Table)

The following table documents the request-response life-cycle for each endpoint in `backend/app/api/v1/endpoints/assignment.py`:

| Endpoint Route | HTTP Method | Input Received | Business Processing & Orchestration | Output Returned | Error Codes Handled |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/teams/workloads` | `GET` | Optional `department_id` query parameter; injected `db: Session`. | Calls `team_service.get_all_teams_with_workload()`. Serializes into list of `TeamWorkloadResponse`. | HTTP 200 with JSON list of squad workload telemetry objects. | Returns empty list `[]` if department has no squads. |
| `/tickets/{ticket_id}/reassign` | `PATCH` | 1. URL Path: `ticket_id`<br>2. JSON Body: `TeamReassignRequest`<br>3. Injected: `db: Session`. | 1. Validates body schema.<br>2. Calls `reassign_ticket_team()`.<br>3. Checks ticket and team existence.<br>4. Appends audit log to `resolution_notes`. | HTTP 200 with updated `TicketResponse` showing new `assigned_team` and updated audit notes. | • `400 Bad Request` if target team ID is invalid.<br>• `404 Not Found` if ticket does not exist.<br>• `422 Unprocessable Entity` if reason under 5 chars. |
| `/tickets/{ticket_id}/dispatch` | `POST` | URL Path: `ticket_id`; injected `db: Session`. | Calls `dispatch_existing_ticket()`. Runs least-loaded selection algorithm and commits update. | HTTP 200 with updated `TicketResponse` showing newly assigned squad. | • `404 Not Found` if ticket ID does not exist. |
| `/teams/{team_id}/availability` | `PATCH` | URL Path: `team_id`; JSON Body: `TeamAvailabilityUpdate`; injected `db: Session`. | Calls `toggle_team_availability()`. Updates `team.is_active` in SQLite. | HTTP 200 with updated team availability state dictionary. | • `404 Not Found` if team ID does not exist. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. Strict Non-Negotiables

To preserve system compatibility across teammates' components, follow these operational rules:

### 🟢 Safe to Modify (Configurable Parameters)
* **Route Summary and Description Text:** You can edit the `summary` and docstrings inside route decorators to refine Swagger documentation.
* **Additional Query Parameters on `/teams/workloads`:** You can add extra query filters, such as `is_active: Optional[bool] = None` to filter for only active squads.
* **Custom HTTP Response Headers:** You can add diagnostic response headers (e.g. `X-Dispatch-Duration-Ms`).

### 🔴 Strict Non-Negotiables (System Breaking Changes)
* **DO NOT Change HTTP Methods (`GET`, `POST`, `PATCH`):**
  * `/teams/workloads` must remain `GET` (safe idempotent read).
  * `/tickets/{ticket_id}/reassign` must remain `PATCH` (partial resource delta update).
  * `/tickets/{ticket_id}/dispatch` must remain `POST` (triggers algorithmic execution).
* **DO NOT Omit 404 and 400 Exception Checks:** If a ticket or squad does not exist, the endpoint MUST raise `HTTPException(status_code=404)` or `400`. Returning empty dictionaries with HTTP 200 crashes frontend React components with null reference errors.
* **DO NOT Remove `Depends(get_db)`:** Database sessions must always be injected via FastAPI's dependency injection system to prevent database connection leaks.
* **DO NOT Remove `response_model` Declarations:** Removing `response_model` prevents FastAPI from validating outgoing responses and generating OpenAPI schemas for Swagger UI.

---

# 5. Advanced Python Concepts Explained: OOP & System Architecture

### 1. RESTful Path Design & Resource Hierarchies
* **The Concept:** Standard REST architecture models APIs around **Resources** and **Sub-Resources**.
* **How We Structure Assignment URLs:**
  * Notice that `/tickets/{ticket_id}/reassign` and `/tickets/{ticket_id}/dispatch` operate on a specific ticket resource (`/tickets/{id}`).
  * Conversely, `/teams/workloads` and `/teams/{team_id}/availability` operate on the squad resource (`/teams`).
  * By maintaining clean resource paths, the API remains intuitive for frontend developers and complies with industry REST best practices.

### 2. Dependency Injection Graphs & Resource Teardown Safety
* **The Concept:** In high-concurrency web servers, database connections are limited resources that must be acquired, used, and released reliably.
* **How FastAPI Manages Connection Lifecycles:**
  * When a request arrives at `reassign_ticket(...)`, FastAPI inspects the parameter `db: Session = Depends(get_db)`.
  * FastAPI calls the `get_db` generator function, which retrieves a connection from SQLite's connection pool.
  * When the route finishes executing (or if an unhandled exception is raised), FastAPI resumes the `get_db` generator past the `yield` statement, executing `db.close()`.
  * This architecture guarantees that database connections are never leaked or left hanging open in memory.

### 3. Controller Error Propagation & RFC 7807 Error Responses
* **The Concept:** When a request fails, the API should return a structured, standardized error format rather than unhandled Python tracebacks.
* **How `HTTPException` Operates:**
  * When an endpoint raises `HTTPException(status_code=404, detail="Ticket not found")`, FastAPI intercepts the exception before it crashes the ASGI server.
  * It formats a standardized JSON response: `{"detail": "Ticket not found"}` with an HTTP 404 status header.
  * This guarantees that frontend Axios/Fetch interceptors can catch errors cleanly and display user-friendly error banners rather than blank screens.

---

# 6. Definition of Done: Observable Verification Checklist

Before considering `backend/app/api/v1/endpoints/assignment.py` complete, verify each of the following operational checkpoints:

### Implementation Checklist
- [ ] File exists at `backend/app/api/v1/endpoints/assignment.py`.
- [ ] Defines `router = APIRouter()`.
- [ ] Exposes `GET /teams/workloads` returning `list[TeamWorkloadResponse]` with optional `department_id` filtering.
- [ ] Exposes `PATCH /tickets/{ticket_id}/reassign` accepting `TeamReassignRequest` and returning `TicketResponse`.
- [ ] Exposes `POST /tickets/{ticket_id}/dispatch` returning `TicketResponse`.
- [ ] Exposes `PATCH /teams/{team_id}/availability` accepting `TeamAvailabilityUpdate`.
- [ ] Handles 404 Not Found for non-existent tickets and non-existent teams.
- [ ] Handles 400 Bad Request if reassignment references an invalid squad.
- [ ] Injects `db: Session = Depends(get_db)` across all database-accessing routes.
- [ ] Contains zero triple-backtick code blocks.

### Terminal Verification Commands (Run in PowerShell from Project Root)

1. **Verify Assignment Router Routes Export:**
   `python -c "from app.api.v1.endpoints.assignment import router; routes = [r.path for r in router.routes]; assert '/teams/workloads' in routes; assert '/tickets/{ticket_id}/reassign' in routes; assert '/tickets/{ticket_id}/dispatch' in routes; print('Assignment endpoints verified:', routes)"`

2. **Verify `/teams/workloads` Execution via FastAPI TestClient:**
   `python -c "from fastapi.testclient import TestClient; from app.main import app; client = TestClient(app); res = client.get('/api/v1/teams/workloads'); assert res.status_code == 200; data = res.json(); assert len(data) == 12; assert 'active_ticket_count' in data[0]; print('Workloads endpoint verified! Total squads:', len(data))"`

3. **Verify Manual Ticket Reassignment via HTTP PATCH:**
   `python -c "from fastapi.testclient import TestClient; from app.main import app; client = TestClient(app); post_res = client.post('/api/v1/tickets/', json={'title': 'Loose window hinge in lab', 'description': 'Window frame shaking in wind', 'location': 'Lab 2'}); assert post_res.status_code == 201; t_id = post_res.json()['id']; reassign_res = client.patch(f'/api/v1/tickets/{t_id}/reassign', json={'new_team_id': 8, 'reassignment_reason': 'Specialized carpentry crew needed for exterior window casing'}); assert reassign_res.status_code == 200; updated = reassign_res.json(); assert updated['assigned_team'] == 'Structural Fixtures Crew'; print('Reassignment endpoint verified on ticket:', t_id, 'New squad:', updated['assigned_team'])"`

4. **Verify 404 Error Handling for Missing Ticket:**
   `python -c "from fastapi.testclient import TestClient; from app.main import app; client = TestClient(app); res = client.patch('/api/v1/tickets/99999/reassign', json={'new_team_id': 1, 'reassignment_reason': 'Testing missing ticket'}); assert res.status_code == 404; print('404 error response verified:', res.json())"`
