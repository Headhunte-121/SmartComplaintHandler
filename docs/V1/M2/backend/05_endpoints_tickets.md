# Module M2 - File 05: Ticket REST API Endpoints
## Target File: `backend/app/api/v1/endpoints/tickets.py`
### Execution Track: Phase 3 (Requires File 04 and Module M1 `deps.py`)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In modern web API architectures with FastAPI, `endpoints/tickets.py` serves as the **HTTP Presentation Controller & Route Handler**. It exposes the RESTful network interface of the platform: intercepting incoming HTTP requests from client browsers, parsing URL path parameters and query strings, coordinating dependency-injected database sessions, delegating business logic to the service layer, and returning standardized HTTP status codes and serialized JSON payloads.

### Standard Industry Role & Real-World Use Cases
In professional production systems, REST API endpoint controllers standardly fulfill four core architectural duties:

1. **Protocol Translation (HTTP to Python & Back):**
   * The HTTP world speaks in TCP streams, HTTP verbs (`GET`, `POST`, `PATCH`), header strings, and raw JSON text.
   * Endpoint controllers translate incoming HTTP network payloads into strongly typed Python objects (via Pydantic schemas) and translate service layer Python domain entities back into structured HTTP responses.
2. **RESTful HTTP Status Code Semantics:**
   * Enforces standard REST communication protocols:
     * Returning `201 Created` when a new entity is created and saved.
     * Returning `200 OK` for successful queries or updates.
     * Returning `404 Not Found` when a requested entity does not exist.
     * Returning `422 Unprocessable Entity` when incoming data fails schema validation.
3. **Automated Resource Lifecycle Management via Dependency Injection:**
   * Uses FastAPI's `Depends(get_db)` to request an active database session for the duration of the HTTP request, guaranteeing that the session is closed when the response leaves the server.
4. **Input Parameter Resolution (Path, Query, and Body):**
   * Automatically differentiates between path parameters (embedded inside the URL path), query parameters (passed after the `?` symbol for pagination or filtering), and request bodies (JSON payloads sent in `POST`/`PATCH`).

### What WE Are Specifically Using It For in Smart Complaint Handler
In our campus complaint automation platform, our 5-student engineering team specifically uses `endpoints/tickets.py` for four concrete operational endpoints:

1. **Student Complaint Submission (`POST /`):**
   * Receives the student's submission payload (`title`, `description`, `location`).
   * Calls `ticket_service.create_ticket(db, ticket_in)` to mint the tracking code, classify the department, and commit the row to SQLite.
   * Returns `201 Created` with the full `TicketResponse` object so the React frontend can display the newly minted tracking code to the student.
2. **Student Tracking Code Lookup (`GET /{tracking_code}`):**
   * Extracts the tracking code from the URL path (e.g. `/api/v1/tickets/TICK-8F2D`).
   * Normalizes the string to uppercase and queries SQLite via `ticket_service.get_ticket_by_code()`.
   * If found, returns `TicketResponse`; if missing, raises `HTTPException(404, "Ticket not found")` so the frontend can inform the student that the code was not recognized.
3. **Staff Dashboard Feed (`GET /`):**
   * Ingests optional pagination query parameters (`skip: int = 0`, `limit: int = 100`).
   * Calls `ticket_service.list_tickets(db, skip, limit)` and returns a JSON list of tickets to populate the campus technician administrative table (`/admin`).
4. **Technician Status & Resolution Update (`PATCH /{ticket_id}/status`):**
   * Ingests the ticket ID from the path and the update payload (`status`, `resolution_notes`) from the request body.
   * Calls `ticket_service.update_ticket_status()`.
   * Allows maintenance workers to transition tickets from `SUBMITTED` to `IN_PROGRESS` and `RESOLVED`, stamping UTC completion times automatically.

### How Other Components Standardly Interact with This File
Across the platform, this controller serves as the primary bridge between the web network and backend services:
* **The Master API Router (`app/api/v1/router.py`):** Imports this module's `router` and mounts it at `/tickets`:
  `api_router.include_router(tickets.router, prefix="/tickets", tags=["tickets"])`
* **The React Client (`frontend/src/services/api.js`):** Makes asynchronous Fetch/Axios calls to these exact URL endpoints:
  `fetch("http://localhost:8000/api/v1/tickets", { method: "POST", body: ... })`
* **Interactive Swagger UI (`/docs`):** Automatically reads these function definitions to render interactive forms where evaluators can test endpoints directly in their web browser.

### The Core Problem It Solves & Why It Exists
* **Unstructured URL Chaos:** Without a dedicated endpoint controller, route paths become inconsistent (e.g. `/submit_ticket` vs `/get-ticket` vs `/ticketUpdate`). Standard REST endpoints (`POST /tickets`, `GET /tickets/{code}`, `PATCH /tickets/{id}/status`) create a clean, predictable API.
* **Leaking Infrastructure Errors:** If a ticket is missing, letting Python raise an uncaught error causes an ugly `500 Internal Server Error`. The controller catches missing entities and returns clean `404 Not Found` messages.
* **Missing HTTP Protocol Compliance:** Web standards dictate that creating a resource must return `201 Created` rather than `200 OK`. The controller enforces this compliance.

---

# 2. What Must Be in This File & Why Each Item Is Needed

To be complete, this component must define, configure, and export the following six essential routing constructs:

---

### Item 1: The Modular APIRouter Instance (`router`)
* **What it is:** An instantiated `APIRouter()` object with tags configured.
* **Specification:** `router = APIRouter()`
* **Why it is needed:**
  * Allows route endpoints to be defined in a dedicated module rather than cluttering `main.py`.
  * The tags parameter (`tags=["tickets"]`) groups all ticket endpoints under a dedicated "tickets" header in FastAPI's Swagger UI documentation.

---

### Item 2: Complaint Submission Route (`POST /`)
* **What it is:** The HTTP path operation handling student complaint submissions.
* **Signature:**
  `@router.post("", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)`
  `def create_ticket(ticket_in: TicketCreate, db: Session = Depends(get_db)):`
* **Why it is needed:**
  * **Input Parsing:** Injects `ticket_in: TicketCreate`, automatically triggering Pydantic schema boundary checks and whitespace trimming.
  * **Status Code 201:** Signals to client browsers and automated tools that a new record was successfully created on the server.
  * **Output Serialization:** Returns the newly created database ticket serialized via `TicketResponse`.

---

### Item 3: Tracking Code Lookup Route (`GET /{tracking_code}`)
* **What it is:** The HTTP path operation allowing students to check complaint progress using their tracking code.
* **Signature:**
  `@router.get("/{tracking_code}", response_model=TicketResponse)`
  `def get_ticket(tracking_code: str, db: Session = Depends(get_db)):`
* **Internal Logic:**
  1. Calls `ticket = ticket_service.get_ticket_by_code(db, tracking_code=tracking_code)`.
  2. If `not ticket`, raises `HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")`.
  3. Returns `ticket`.
* **Why it is needed:**
  * **Path Parameter Extraction:** Extracts `{tracking_code}` directly from the URL.
  * **404 Guard:** Converts a `None` return from the service layer into a standardized HTTP 404 response.

---

### Item 4: Administrative Ticket List Route (`GET /`)
* **What it is:** The HTTP path operation returning a paginated list of complaints for campus staff dashboards.
* **Signature:**
  `@router.get("", response_model=list[TicketResponse])`
  `def list_tickets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):`
* **Internal Logic:** Calls and returns `ticket_service.list_tickets(db, skip=skip, limit=limit)`.
* **Why it is needed:**
  * **Query Parameter Ingestion:** Automatically parses optional `skip` and `limit` URL query parameters (e.g. `GET /api/v1/tickets?skip=0&limit=50`).
  * Returns an array of serialized tickets conforming to `list[TicketResponse]`.

---

### Item 5: Status Mutation Route (`PATCH /{ticket_id}/status`)
* **What it is:** The HTTP path operation allowing maintenance staff to update a ticket's status and work notes.
* **Signature:**
  `@router.patch("/{ticket_id}/status", response_model=TicketResponse)`
  `def update_ticket_status(ticket_id: int, update_data: TicketUpdate, db: Session = Depends(get_db)):`
* **Internal Logic:**
  1. Calls `ticket = ticket_service.update_ticket_status(db, ticket_id=ticket_id, status=update_data.status, resolution_notes=update_data.resolution_notes)`.
  2. If `not ticket`, raises `HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")`.
  3. Returns `ticket`.
* **Why it is needed:**
  * **HTTP PATCH Semantics:** In REST standards, `PATCH` indicates a partial update of a resource (modifying status or notes) without replacing the entire entity.

---

### Item 6: Session Dependency Injection Parameter (`Depends(get_db)`)
* **What it is:** A function parameter `db: Session = Depends(get_db)` declared in every route handler.
* **Why it is needed:**
  * Instructs FastAPI's dependency injection system to invoke `get_db()` from Module M1 (`app/api/deps.py`), inject the open session into `db`, and guarantee that the session is closed via `finally: db.close()` once the response is sent.

---

# 3. Component Life-Cycle: Input, Process, Output

| Stage | What Happens Behind the Scenes |
| :--- | :--- |
| **INPUT** | An incoming HTTP network request (e.g. `POST /api/v1/tickets` with JSON body, or `GET /api/v1/tickets/TICK-8F2D`). |
| **PROCESS** | 1. FastAPI resolves the URL path to this controller.<br>2. It invokes `get_db()` to loan an isolated database session.<br>3. It parses and validates parameters (path variables, query parameters, or request body via Pydantic).<br>4. It delegates execution to the corresponding function in `ticket_service.py`.<br>5. If the service returns `None`, it raises `HTTPException(404)`.<br>6. It serializes the returned ORM object according to `response_model=TicketResponse`.<br>7. It resumes `get_db` to close the database session. |
| **OUTPUT** | A standardized HTTP response with status code (`201`, `200`, or `404`) and JSON payload sent across the network to the client. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. What Must Stay Exact

### 🟢 Safe to Modify & Customize (Your Team's Creative Freedom):
* **Customizing 404 Error Detail Strings:** You can alter the error message text (e.g. changing `"Ticket not found"` to `"No complaint matches the supplied tracking code"`).
* **Adding Extra Query Filters:** You can add optional filtering parameters to `GET ""` (e.g. `department_id: Optional[int] = None` or `priority: Optional[str] = None`) and pass them to the service layer.
* **Adjusting Default Pagination Limits:** You can change default `limit` from 100 to 50 or 25.
* **Adding Custom Response Headers:** You can add custom headers (such as execution timing headers) to responses.

### 🔴 Strict Non-Negotiables (Must Remain Exact Across the Team):
* **The Route Paths & Verbs:**
  * `POST ""` (Submit ticket)
  * `GET "/{tracking_code}"` (Lookup ticket)
  * `GET ""` (List tickets)
  * `PATCH "/{ticket_id}/status"` (Update status)
  The React frontend's API client explicitly calls these exact paths and HTTP methods. Renaming them breaks the frontend connection.
* **HTTP Status Code 201:** The `POST` route must declare `status_code=status.HTTP_201_CREATED`. Automated test suites assert `response.status_code == 201`.
* **Dependency Injection Declaration:** Every route requiring database access must declare `db: Session = Depends(get_db)`. Removing this parameter prevents the endpoint from accessing SQLite.
* **File Location (`backend/app/api/v1/endpoints/tickets.py`):** The module must reside precisely at this path so the router aggregator can import it.

---

# 5. Advanced Python Concepts Explained (OOP & Architecture)

Since you already understand programming fundamentals like loops, conditions, and basic variables, here is an exhaustive, first-principles breakdown of the Object-Oriented Programming (OOP) and software architecture concepts that drive this file:

---

### 1. Function Decorators in Web Frameworks (`@router.post`, `@router.get`)
What actually happens inside Python when you prefix a function with `@router.post("")`?

* **Metaprogramming & Route Registration:**
  * In Python, a decorator is evaluated at **Import Time** (when the file is first loaded into memory), not when an HTTP request arrives.
  * When Python executes `@router.post("", response_model=TicketResponse)`:
    1. FastAPI's `APIRouter` inspects the decorated function's signature using Python's `inspect` module.
    2. It reads the function's parameter names (`ticket_in`, `db`) and type annotations (`TicketCreate`, `Session`).
    3. It registers an internal **Route Definition Object** into the router's routing table, mapping the HTTP verb `POST` and URL path `""` directly to this function pointer in RAM.
* **Separation of Definition from Execution:**
  * The decorator does not run the endpoint. It simply registers the endpoint into FastAPI's internal dispatch table so that hours later, when a client sends an HTTP packet, the framework knows which function to execute.

---

### 2. Dependency Injection and The Call-Stack Lifecycle (`Depends(get_db)`)
How does FastAPI inject `db: Session` into an endpoint without requiring the caller to pass it manually?

* **The Inversion of Control Container:**
  * In standard Python, if a function declares `def my_func(db: Session):`, calling `my_func()` without arguments raises `TypeError: missing 1 required positional argument`.
  * But in FastAPI, you never call `create_ticket()` yourself! FastAPI's internal ASGI request runner calls it.
* **The Dependency Resolution Graph:**
  * When an HTTP request hits `POST /api/v1/tickets`:
    1. FastAPI inspects the function parameters and finds `Depends(get_db)`.
    2. It realizes that `get_db` is a dependency. It resolves `get_db` first by advancing its generator frame.
    3. `get_db` instantiates `SessionLocal()` and executes `yield db`.
    4. FastAPI captures the yielded `db` session and passes it into the `db` parameter of `create_ticket()`.
    5. Once `create_ticket()` finishes and returns the response, FastAPI returns to the suspended `get_db` generator and calls `next()`, advancing into `finally: db.close()`.
  * This guarantees 100% deterministic resource lifecycle management without placing connection management code inside route handlers.

---

### 3. RESTful HTTP Status Codes and Machine-to-Machine Contracts
Why is returning specific HTTP status codes critical for web development?

* **Status Codes as an Architectural Protocol:**
  * HTTP status codes are standard 3-digit numbers defined by the Internet Engineering Task Force (IETF) that communicate the outcome of a request:
    * **`200 OK`:** Standard successful response for read or update operations.
    * **`201 Created`:** Explicit confirmation that a new persistent entity was created and assigned an identity on the server.
    * **`404 Not Found`:** Communicates that the requested resource identifier does not exist in storage.
    * **`422 Unprocessable Entity`:** Communicates that the server understood the JSON format, but the data violated semantic boundary rules (e.g. title was too short).
* **Frontend Automation:**
  * Modern frontend libraries (like Axios or Fetch) inspect status codes automatically.
  * A `201` triggers a redirect to the tracking page; a `422` highlights invalid form inputs in red; a `404` renders an error banner. Using proper codes allows the frontend to respond deterministically.

---

### 4. Path Parameter Extraction & Regex Routing
How does FastAPI know that `{tracking_code}` in `GET /{tracking_code}` is a variable and not a literal folder path?

* **URL Pattern Compilation:**
  * When the router loads `GET /{tracking_code}`, FastAPI converts the path string into an internal Regular Expression:
    `^/tickets/(?P<tracking_code>[^/]+)$`
* **Named Capture Groups in RAM:**
  * When a request arrives for `/tickets/TICK-8F2D`, the regex matches and extracts `"TICK-8F2D"` from the named capture group `tracking_code`.
  * FastAPI passes that extracted string directly into the function parameter named `tracking_code`.
  * Because the parameter is type-annotated as `str`, FastAPI performs type coercion and validation, ensuring total type safety before the function body executes.

---

# 6. Definition of Done: How to Verify This File Is Complete

This component is 100% complete and verified when:

1. **File Existence:**
   * The Python module exists precisely at `backend/app/api/v1/endpoints/tickets.py`.
2. **Endpoint Implementations:**
   * `router = APIRouter()` is exported.
   * `POST ""` is implemented with `status_code=201` and `response_model=TicketResponse`.
   * `GET "/{tracking_code}"` is implemented with `response_model=TicketResponse` and 404 error handling.
   * `GET ""` is implemented with `response_model=list[TicketResponse]`.
   * `PATCH "/{ticket_id}/status"` is implemented with `response_model=TicketResponse` and 404 error handling.
3. **Dependency Injection:**
   * All four endpoints declare `db: Session = Depends(get_db)`.
4. **Programmatic Verification:**
   * Executing the following inline terminal command:
     `python -c "from app.api.v1.endpoints.tickets import router; routes = [r.path for r in router.routes]; assert '' in routes or '/' in routes; assert '/{tracking_code}' in routes; assert '/{ticket_id}/status' in routes; print('Ticket Endpoints OK: All 4 Route Handlers Registered')"`
     succeeds cleanly, printing `Ticket Endpoints OK: All 4 Route Handlers Registered`.
