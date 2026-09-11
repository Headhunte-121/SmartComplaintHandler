# Module M3 - File 05: Priority & Triage REST API Endpoints
## Target File: `backend/app/api/v1/endpoints/priority.py`
### Execution Track: Phase 2 (Presentation Layer; Requires Files 01, 02, 03, and 04)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In modern web API architectures and RESTful microservices, `endpoints/priority.py` defines the **Presentation Controller Layer** for automated incident triage and priority management. In the Model-View-Controller (MVC) and Clean Architecture paradigms, presentation controllers sit on the outer perimeter of the backend: intercepting HTTP requests over TCP network sockets, validating incoming JSON payloads against data schemas, delegating business execution to underlying service engines, and formatting standardized HTTP responses.

### Standard Industry Role & Real-World Use Cases
In professional enterprise platforms (such as GitHub issue management, AWS Support Center, and Zendesk Ticket Routing), presentation controller endpoints standardly fulfill four core architectural duties:

1. **Hosting Stateless Real-Time Preview Pipelines:**
   * In modern responsive web applications, users expect real-time feedback as they type into a web form (similar to password strength meters or shipping cost calculators).
   * A stateless preview endpoint accepts raw draft text, processes it through machine classifiers and priority engines in memory, and returns diagnostic results instantly without creating or altering any database records.
2. **Exposing Controlled State Mutation Endpoints (HTTP PATCH Semantics):**
   * Exposes semantic HTTP `PATCH` routes designed for partial resource modification.
   * Unlike HTTP `PUT` (which replaces an entire database entity with a new representation), `PATCH` modifies only the specifically targeted fields (e.g. updating priority and audit notes while leaving tracking codes, submission timestamps, and complaint descriptions untouched).
3. **HTTP Status Code Mapping & Standardized Error Handling:**
   * Converts internal business states into internationally standardized RFC 9110 HTTP status codes:
     * `200 OK`: Successful triage calculation or priority update.
     * `404 Not Found`: Requested ticket primary key does not exist in the database.
     * `422 Unprocessable Entity`: Request body failed schema validation (e.g. invalid priority enum or missing override reason).
4. **Enforcing Inversion of Control via Dependency Injection:**
   * Decouples database session lifecycles from endpoint logic by injecting database connections via FastAPI's `Depends(get_db)` provider, ensuring every incoming request receives an isolated database session that automatically closes upon request completion.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our automated campus complaint routing platform, our 5-student engineering team specifically uses `backend/app/api/v1/endpoints/priority.py` for four concrete operational functions:

1. **Live Complaint Triage Preview (`POST /triage-preview`):**
   * Receives draft complaint text (`title` and `description`) sent by the frontend React submission form as the student is typing.
   * Runs the text through both `calculate_priority()` (File 01) and `classify_complaint()` (File 02).
   * Returns a complete `TriageResult` schema containing calculated priority (`CRITICAL`), predicted department (`Electrical`), hazard status (`True`), confidence score (`0.95`), explanation reason, and matched keywords.
   * Because it is 100% stateless, it requires zero database queries, executing in less than 2 milliseconds.
2. **Administrative Priority Override (`PATCH /{ticket_id}/priority`):**
   * Exposes a secure endpoint allowing authorized facility supervisors to adjust a complaint's priority tier.
   * Receives `ticket_id` as an integer path parameter and `PriorityOverrideRequest` in the JSON request body.
   * Delegates the update to `ticket_service.override_ticket_priority(db, ticket_id, override_data)`.
   * Returns the updated ticket formatted according to `TicketResponse`.
3. **Protecting Against Phantom Updates (404 Handling):**
   * If an administrator attempts to override a ticket ID that does not exist in SQLite (e.g. `PATCH /tickets/99999/priority`), the endpoint intercepts the `None` return from the service layer and raises `HTTPException(status_code=404, detail="Ticket with ID 99999 not found")`.
4. **Powering Interactive Swagger UI Documentation:**
   * Decorates endpoints with route metadata, response schemas, and parameter descriptions, making the endpoints immediately testable via the web browser at `http://127.0.0.1:8000/docs`.

### How Other Components Standardly Interact with This File
Across the system architecture, this file is consumed by frontend clients and registered in API routers:
* **The Central API Router (`backend/app/api/v1/router.py`):** Includes this router with an appropriate prefix (e.g. `/tickets`), making the endpoints accessible under `/api/v1/tickets/triage-preview` and `/api/v1/tickets/{ticket_id}/priority`.
* **The Student Frontend Web App:** Listens to the `title` and `description` input fields. Once the user pauses typing (debounced at 500ms), it sends a POST request to `/triage-preview` to render a live priority badge and department tag before submission.
* **The Staff Admin Dashboard:** Contains an "Adjust Priority" dropdown modal. Submitting the modal fires a PATCH request to `/{ticket_id}/priority`, updating the ticket in real time.
* **Automated Integration Test Suites:** Use FastAPI's `TestClient` to make simulated HTTP requests against these endpoints, asserting status codes, payload structures, and database persistence.

### The Core Problem It Solves & Why It Exists
* **The "Black Box" Complaint Submission Problem:** In traditional university systems, students submit complaints into a void, having no idea which department will receive it or how urgent the administration considers it. Live triage previews provide instant transparency.
* **Separation of Presentation from Core Logic:** If priority calculation algorithms change in the future (e.g. introducing machine learning in a later version), the endpoint file does not change at all. It simply acts as an HTTP gateway to the underlying service functions.

---

# 2. What Must Be in This File & Why Each Item Is Needed

To be complete, production-grade, and fully compliant with FastAPI standards, `backend/app/api/v1/endpoints/priority.py` must define and export the following five structural components:

---

### Item 1: Router Initialization
* **What it is:** Instantiating the FastAPI sub-router.
* **Specification:** `router = APIRouter()`
* **Why it is needed:**
  * Groups related triage and priority route handlers into an isolated, modular sub-application that can be mounted into the master API router.

---

### Item 2: Dependency Imports & Service Connections
* **What it is:** Importing required HTTP constructs, database session providers, domain services, and Pydantic schemas.
* **Required Imports:**
  * `from fastapi import APIRouter, Depends, HTTPException, status`
  * `from sqlalchemy.orm import Session`
  * `from app.api.deps import get_db`
  * `from app.schemas.priority import TriagePreviewRequest, TriageResult, PriorityOverrideRequest`
  * `from app.schemas.ticket import TicketResponse`
  * `from app.services.priority_engine import calculate_priority`
  * `from app.services.classifier import classify_complaint`
  * `from app.services.ticket_service import override_ticket_priority`
* **Why it is needed:**
  * Connects the presentation layer to the necessary validation schemas and business services.

---

### Item 3: Stateless Triage Preview Endpoint (`POST /triage-preview`)
* **What it is:** An HTTP POST route handler that executes real-time classification and priority calculation on draft complaint text.
* **Route Declaration:** `@router.post("/triage-preview", response_model=TriageResult, status_code=status.HTTP_200_OK, summary="Preview complaint triage classification and priority")`
* **Handler Signature:** `def preview_triage(request_data: TriagePreviewRequest) -> TriageResult`
* **Execution Sequence:**
  1. Call priority engine: `priority_info = calculate_priority(request_data.title, request_data.description)`.
  2. Call classifier engine: `classification_info = classify_complaint(request_data.title, request_data.description)`.
  3. Combine detected keywords from both engines: `all_keywords = list(set(priority_info["matched_keywords"] + classification_info["matched_keywords"]))`.
  4. Formulate composite human explanation:
     `reason = f"Category '{classification_info['category']}' assigned based on domain keywords. Priority '{priority_info['priority']}' assigned: {priority_info['reason']}"`
  5. Return `TriageResult(`
     `    priority=priority_info["priority"],`
     `    category=classification_info["category"],`
     `    hazard_detected=priority_info["hazard_detected"],`
     `    confidence=classification_info["confidence"],`
     `    reason=reason,`
     `    matched_keywords=all_keywords`
     `)`
* **Why it is needed:**
  * Provides instantaneous, zero-cost diagnostic feedback to client applications without opening database transactions or creating unwanted test records.

---

### Item 4: Administrative Priority Override Endpoint (`PATCH /{ticket_id}/priority`)
* **What it is:** An HTTP PATCH route handler allowing authorized staff to update a ticket's priority level.
* **Route Declaration:** `@router.patch("/{ticket_id}/priority", response_model=TicketResponse, status_code=status.HTTP_200_OK, summary="Manually override ticket priority tier")`
* **Handler Signature:** `def override_priority(ticket_id: int, override_data: PriorityOverrideRequest, db: Session = Depends(get_db)) -> TicketResponse`
* **Execution Sequence:**
  1. Delegate update to service layer: `updated_ticket = override_ticket_priority(db=db, ticket_id=ticket_id, override_data=override_data)`.
  2. Check for missing entity:
     `if updated_ticket is None:`
     `    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ticket with ID {ticket_id} not found")`
  3. Return `updated_ticket` (FastAPI automatically serializes it into `TicketResponse`).
* **Why it is needed:**
  * Exposes the administrative override business capability over standard REST HTTP semantics with proper status code and error handling.

---

### Item 5: OpenAPI Documentation Tags & Metadata
* **What it is:** Docstrings and route descriptions detailing endpoint behaviors for Swagger UI.
* **Why it is needed:**
  * Documents the expected payload format, query parameters, and potential error codes directly in `/docs`, facilitating collaboration with frontend team members.

---

# 3. Component Life-Cycle: Input, Process, Output (IPO Table)

The following table documents the request-response life-cycle for each endpoint in `backend/app/api/v1/endpoints/priority.py`:

| Endpoint Route | HTTP Method | Input Received | Processing Sequence | Output Returned | Error Codes & Triggers |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/triage-preview` | `POST` | JSON body matching `TriagePreviewRequest` (`title`, `description`). | 1. Pydantic validates string lengths.<br>2. Invokes `calculate_priority()`.<br>3. Invokes `classify_complaint()`.<br>4. Combines keywords and builds explanation.<br>5. Serializes into `TriageResult`. | HTTP 200 OK with `TriageResult` JSON containing `priority`, `category`, `confidence`, `hazard_detected`, etc. | • `422 Unprocessable Entity` if `title` is under 5 characters or missing. |
| `/{ticket_id}/priority` | `PATCH` | 1. URL Path: `ticket_id` (integer).<br>2. JSON Body: `PriorityOverrideRequest` (`new_priority`, `override_reason`).<br>3. Injected: `db: Session`. | 1. Pydantic validates enum and reason length.<br>2. Injects open database session.<br>3. Calls `ticket_service.override_ticket_priority()`.<br>4. Validates ticket existence.<br>5. Serializes result into `TicketResponse`. | HTTP 200 OK with updated `TicketResponse` JSON displaying modified priority and updated audit notes. | • `404 Not Found` if `ticket_id` does not exist in SQLite.<br>• `422 Unprocessable Entity` if `new_priority` is invalid or `override_reason` is under 5 characters. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. Strict Non-Negotiables

To maintain API compatibility across the project, adhere to the following operational boundaries:

### 🟢 Safe to Modify (Configurable Parameters)
* **Summary and Description Metadata:** You can edit the `summary` and docstrings inside `@router.post` and `@router.patch` to clarify documentation for frontend developers.
* **Keyword Deduplication Formatting:** You may change how matched keywords are sorted or displayed (e.g. sorting alphabetically before returning).
* **Composite Reason Text:** You can rephrase the composite `reason` string generated in `preview_triage()` to include more details (such as the specific hazard keyword that triggered the critical priority).
* **Adding Response Headers:** You can add custom HTTP response headers (e.g. `X-Triage-Execution-Time-Ms`) if you implement performance benchmarking.

### 🔴 Strict Non-Negotiables (System Breaking Changes)
* **DO NOT Change HTTP Methods (`POST` and `PATCH`):**
  * `/triage-preview` must remain `POST` because it receives a JSON body containing multiline descriptions. (Sending JSON bodies in HTTP `GET` requests violates RFC standards and causes failures in web proxies).
  * `/{ticket_id}/priority` must remain `PATCH` because it modifies only a subset of attributes.
* **DO NOT Add Database Dependencies to `/triage-preview`:** The triage preview endpoint MUST remain completely stateless. Adding `db: Session = Depends(get_db)` to `/triage-preview` forces the server to acquire a database connection from SQLite for every keystroke debounce, causing database connection pool exhaustion.
* **DO NOT Swag/Bypass 404 Exceptions:** If `updated_ticket is None`, you MUST raise `HTTPException(status_code=404)`. Returning an empty dictionary `{}` or `null` with HTTP 200 violates REST standards and causes frontend apps to crash with blank screen errors.
* **DO NOT Hardcode Response Dictionaries:** Always declare `response_model=TriageResult` and `response_model=TicketResponse` on the route decorators. This guarantees that FastAPI enforces serialization rules and strips internal ORM fields.

---

# 5. Advanced Python Concepts Explained: OOP & System Architecture

### 1. Stateless vs. Stateful API Design & Computational Efficiency
* **The Concept:** An operation is **stateless** if its execution depends exclusively on the inputs passed in the current request and creates no persistent side-effects. An operation is **stateful** if it reads or modifies persistent storage (like a database or session store).
* **Why `/triage-preview` Is Stateless:**
  * Complaint intake forms often trigger preview requests on every debounced keystroke as the user types.
  * If the preview endpoint wrote to SQLite or opened database connections, a thousand concurrent students typing complaints would lock SQLite (which allows only one writer at a time).
  * By making `/triage-preview` pure in-memory computation ($O(K)$ where $K$ is keyword count), the endpoint can serve tens of thousands of requests per second directly from CPU cache with zero disk I/O.

### 2. FastAPI Dependency Injection (`Depends(get_db)`) & Generator Lifetime Management
* **The Concept:** Dependency Injection (DI) is an architectural pattern where a component receives its dependencies from an external assembler rather than instantiating them itself.
* **How It Works in FastAPI:**
  * When a request arrives at `override_priority(...)`, FastAPI inspects the parameter type hints using Python's reflection system.
  * It sees `db: Session = Depends(get_db)`. FastAPI halts endpoint execution, calls `get_db()`, advances the generator until the `yield` statement, and injects the resulting `Session` object into the `db` parameter.
  * Once the endpoint finishes executing (or raises an exception), FastAPI returns to the `get_db()` generator and executes the code after the `yield` statement (which calls `db.close()`).
  * This guarantees that database connections are never leaked, even if an unhandled error occurs during endpoint processing.

### 3. REST Semantics: HTTP `PATCH` vs. HTTP `PUT`
* **The Architectural Rule:** In RFC 9110 and standard REST conventions:
  * `PUT` represents complete resource replacement. If you `PUT` to `/tickets/12` with only `{"priority": "HIGH"}`, a strictly compliant server would replace the entire ticket, wiping out the title, description, and creation timestamp.
  * `PATCH` represents a partial delta update. It instructs the server: "Apply these specific attribute modifications to the existing resource, leaving all unspecified attributes untouched."
  * Therefore, priority adjustments must standardly be exposed over `PATCH`, preserving all other ticket attributes.

### 4. Controller-Service Pattern & Thin Controllers
* **The Concept:** In modern backend design, route handlers are designed as **Thin Controllers**.
* **What Thin Controllers Do:**
  * A thin controller only handles HTTP concerns: validating JSON input via schemas, calling the service layer, checking for `None`, and returning the HTTP response.
  * A thin controller never executes raw SQL queries, never calculates priority math, and never performs string tokenization.
  * By keeping `endpoints/priority.py` thin, all core business logic remains testable, reusable, and cleanly encapsulated inside the service layer (`ticket_service.py` and `priority_engine.py`).

---

# 6. Definition of Done: Observable Verification Checklist

Before considering `backend/app/api/v1/endpoints/priority.py` complete, verify each of the following operational checkpoints:

### Implementation Checklist
- [ ] File exists at `backend/app/api/v1/endpoints/priority.py`.
- [ ] Defines `router = APIRouter()`.
- [ ] Exposes `POST /triage-preview` accepting `TriagePreviewRequest` and returning `TriageResult`.
- [ ] `/triage-preview` calls both `calculate_priority()` and `classify_complaint()` and contains zero database session dependencies.
- [ ] Exposes `PATCH /{ticket_id}/priority` accepting integer `ticket_id` and `PriorityOverrideRequest`, returning `TicketResponse`.
- [ ] `PATCH /{ticket_id}/priority` injects `db: Session = Depends(get_db)` and delegates to `ticket_service.override_ticket_priority()`.
- [ ] Raises `HTTPException(status_code=404)` if the requested `ticket_id` does not exist.
- [ ] All routes include explicit `response_model` declarations for contract enforcement and OpenAPI documentation.

### Terminal Verification Commands (Run in PowerShell from Project Root)

1. **Verify Route Function Imports & Router Export:**
   `python -c "from app.api.v1.endpoints.priority import router; routes = [r.path for r in router.routes]; assert '/triage-preview' in routes; assert '/{ticket_id}/priority' in routes; print('Priority router endpoints verified:', routes)"`

2. **Verify Stateless `/triage-preview` Execution via FastAPI TestClient:**
   `python -c "from fastapi.testclient import TestClient; from app.main import app; client = TestClient(app); res = client.post('/api/v1/tickets/triage-preview', json={'title': 'Electric switchboard spark', 'description': 'Loud buzzing and visible fire sparks in room 302'}); assert res.status_code == 200; data = res.json(); assert data['priority'] == 'CRITICAL'; assert data['hazard_detected'] == True; print('Triage preview response verified:', data)"`

3. **Verify Routine Ticket Preview Output:**
   `python -c "from fastapi.testclient import TestClient; from app.main import app; client = TestClient(app); res = client.post('/api/v1/tickets/triage-preview', json={'title': 'Faded paint on wall', 'description': 'The wall paint behind the seminar board is peeling and scratched'}); assert res.status_code == 200; data = res.json(); assert data['priority'] == 'LOW'; print('Routine preview verified:', data['priority'], data['category'])"`

4. **Verify Administrative Priority Override on Existing Ticket:**
   `python -c "from fastapi.testclient import TestClient; from app.main import app; client = TestClient(app); res = client.post('/api/v1/tickets/', json={'title': 'Leaking sink tap', 'description': 'Water leaking from tap in bathroom 2', 'location': 'Hostel 3'}); assert res.status_code == 201; t_id = res.json()['id']; patch_res = client.patch(f'/api/v1/tickets/{t_id}/priority', json={'new_priority': 'HIGH', 'override_reason': 'Leak has escalated to flooding the hallway'}); assert patch_res.status_code == 200; updated = patch_res.json(); assert updated['priority'] == 'HIGH'; print('Priority override endpoint verified on ticket ID:', t_id)"`

5. **Verify 404 Handling on Non-Existent Ticket Override:**
   `python -c "from fastapi.testclient import TestClient; from app.main import app; client = TestClient(app); res = client.patch('/api/v1/tickets/99999/priority', json={'new_priority': 'LOW', 'override_reason': 'Non-existent ticket test'}); assert res.status_code == 404; print('404 error response verified:', res.json())"`
