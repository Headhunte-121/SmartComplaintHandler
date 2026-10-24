# Comprehensive Code Walkthrough & Line-by-Line Guide: `backend/app/api/v1/endpoints/priority.py`

> **File Location**: [`backend/app/api/v1/endpoints/priority.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/backend/app/api/v1/endpoints/priority.py)  
> **Prerequisites**: Basic knowledge of C or Python (functions, HTTP GET/POST, JSON key-value pairs, if/else branching). No specialized AI or web framework background is assumed.  
> **What this file is**: The priority calculation and administrative triage override controller. It exposes two critical operations:
> 1. A **stateless real-time triage preview** (`POST /triage-preview`) that scans a student's complaint draft as they type and instantly predicts the urgency level, target department, safety hazards, and resolution deadline.
> 2. A **role-protected supervisory override** (`PATCH /{ticket_id}/priority`) enabling facility directors to manually adjust a ticket's priority level with a mandatory logged justification.

---

## Block 1: Imports & Framework Tools (Lines 1–25)

```python
"""
SmartComplaintHandler - Priority & Triage REST API Endpoints
Blueprint Reference: V1/M3/backend/05_priority_endpoints.md
Role: REST presentation controllers for stateless real-time triage preview and RBAC-protected priority overrides.
"""
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_roles
from app.core.config import settings
from app.schemas.priority import (
    PriorityEnum,
    PriorityOverrideRequest,
    TriagePreviewRequest,
    TriageResult,
)
from app.schemas.ticket import TicketResponse
from app.schemas.user import UserResponse
from app.services.ai_triage_service import classify_and_triage_with_ai
from app.services.classifier import classify_ticket
from app.services.priority_engine import calculate_priority
from app.services.ticket_service import override_ticket_priority

router = APIRouter()
```

### 1. Plain-English Purpose
Loads data type definitions, web routing utilities, custom HTTP header extractors, database session injectors, security guards, data validation contracts, and internal business logic engines. Then, it instantiates an isolated web router (`router = APIRouter()`) that groups all priority-related HTTP endpoints together.

### 2. Line-by-Line Breakdown
- **Lines 1–5 (`""" ... """`)**: Module docstring explaining the architectural blueprint reference (Module 3, Section 5) and the responsibilities of this file.
- **Line 6 (`from typing import Optional`)**: Imports `Optional` from Python's standard typing library. In Python type hints, `Optional[T]` means the variable can either hold a value of type `T` or be `None` (identical to `T | None`). In C terms, this is like a pointer that can point to valid data or be a `NULL` pointer.
- **Line 7 (`from fastapi import APIRouter, Depends, Header, HTTPException, status`)**:
  - `APIRouter`: A mini-application router used to register web URLs without cluttering the main server entrypoint.
  - `Depends`: FastAPI's dependency injection hook. It automatically executes a helper function (like verifying user permissions or opening a database connection) and injects its result into the endpoint function arguments.
  - `Header`: Tells FastAPI to extract an incoming value from the HTTP request headers (metadata sent alongside the request) rather than the JSON body or URL parameters.
  - `HTTPException`: An error class used to interrupt execution and send back an HTTP error response (e.g., 404 Not Found) with a custom JSON error message.
  - `status`: A collection of standardized HTTP status integer constants (such as `status.HTTP_200_OK = 200` and `status.HTTP_404_NOT_FOUND = 404`).
- **Line 8 (`from sqlalchemy.orm import Session`)**: The active database session object representing a live transaction window with SQLite or PostgreSQL.
- **Line 10 (`from app.api.deps import get_db, require_roles`)**:
  - `get_db`: Yields an open database session and ensures it is safely closed in a `finally` block when the request finishes.
  - `require_roles`: A security gatekeeper function that checks if the caller possesses one of the allowed administrative roles before permitting the function to run.
- **Line 11 (`from app.core.config import settings`)**: The global configuration object holding campus server settings, environment variables, and fallback API keys.
- **Lines 12–17 (`from app.schemas.priority import (...)`)**:
  - `PriorityEnum`: The string enumeration defining legal priority categories: `"CRITICAL"`, `"HIGH"`, `"MEDIUM"`, and `"LOW"`.
  - `PriorityOverrideRequest`: The incoming JSON schema for manual overrides, requiring an `override_reason` string.
  - `TriagePreviewRequest`: The incoming JSON schema for live previewing, containing the draft complaint's `title`, `description`, and optional AI credentials.
  - `TriageResult`: The outgoing JSON schema containing the AI's predictions (predicted priority, detected department, confidence score 0.0–1.0, hazard flag, and explanation).
- **Line 18 (`from app.schemas.ticket import TicketResponse`)**: The serializable ticket model returned to the frontend after an override succeeds.
- **Line 19 (`from app.schemas.user import UserResponse`)**: Schema representing the authenticated supervisor making the override request.
- **Lines 20–23 (`from app.services...`)**:
  - `classify_and_triage_with_ai`: The dual-engine AI pipeline that queries LLM providers (Groq LPU or Google Gemini) or falls back to local regex pattern matching.
  - `classify_ticket`: Pure heuristic rule-based classifier that scans complaint text for facility keywords.
  - `calculate_priority`: Deterministic formula calculating ticket urgency based on hazard detection, location impact, and student vulnerability.
  - `override_ticket_priority`: Database mutator service that adjusts the ticket priority, recalculates the SLA deadline timestamp, and logs an audit record.
- **Line 25 (`router = APIRouter()`)**: Instantiates the router instance. The root server will later mount this router at the prefix `/api/v1/tickets`.

### 3. Deep Term & Concept Expansion
- **What is a "Header" in HTTP? (`Header(...)`)**: When a web browser communicates with a server, it sends two things: the **Request Body** (the payload data, such as a JSON document) and **Headers** (metadata such as authorization tokens, accepted languages, or custom API keys). Using `Header(None, alias="X-AI-API-Key")` allows developers or mobile apps to supply their own cloud LLM key directly in the HTTP headers without embedding secrets in the complaint text.
- **Stateless vs. Stateful Processing**: A stateful endpoint changes server memory or writes rows into a database. A **stateless** endpoint takes input data, performs calculations entirely in temporary RAM, and returns a result without persisting anything. The `/triage-preview` endpoint is strictly stateless: it allows a student to test 50 different complaint drafts without cluttering the database with 50 half-written draft rows.

### 4. Runtime Mechanics & Security
- **Memory Footprint**: `router = APIRouter()` allocates a single Python dictionary of route handlers in memory upon startup ($O(1)$ allocation). No database connections or network sockets are opened during import time.
- **Security Implications**: Importing `require_roles` ensures that sensitive priority modification logic cannot be invoked by unauthenticated callers or regular students.

---

## Block 2: Stateless Real-Time Triage Preview: `POST /triage-preview` (Lines 28–70)

```python
@router.post(
    "/triage-preview",
    response_model=TriageResult,
    status_code=status.HTTP_200_OK,
    summary="Preview complaint triage classification and priority",
    description="Stateless calculation of priority and domain taxonomy using Generative AI with local fallback.",
)
def preview_triage(
    request_data: TriagePreviewRequest,
    x_ai_api_key: Optional[str] = Header(None, alias="X-AI-API-Key"),
    x_ai_provider: Optional[str] = Header(None, alias="X-AI-Provider"),
) -> TriageResult:
    """
    Stateless evaluation: analyzes draft complaint title and description,
    extracts hazard/domain keywords, predicts service department, and computes urgency tier.
    Uses AI (Gemini / Groq) when key is available, or enhanced deterministic semantic engine.
    """
    active_key = request_data.api_key or x_ai_api_key
    active_provider = request_data.provider or x_ai_provider or getattr(settings, "DEFAULT_AI_PROVIDER", "groq")

    triage_info = classify_and_triage_with_ai(
        title=request_data.title,
        description=request_data.description,
        client_api_key=active_key,
        client_provider=active_provider,
    )

    return TriageResult(
        priority=PriorityEnum(triage_info["priority"]),
        suggested_priority=triage_info.get("suggested_priority", triage_info["priority"]),
        category=triage_info["category"],
        department_id=triage_info.get("department_id"),
        department_name=triage_info.get("department_name"),
        sla_hours=triage_info.get("sla_hours"),
        hazard_detected=triage_info["hazard_detected"],
        confidence=triage_info["confidence"],
        reason=triage_info["reason"],
        matched_keywords=triage_info.get("matched_keywords", []),
        ai_powered=triage_info.get("ai_powered", False),
        provider=triage_info.get("provider", "local-heuristic"),
        model_used=triage_info.get("model_used"),
    )
```

### 1. Plain-English Purpose
As a student types their complaint (e.g. *"Water heater sparked and emitted smoke in Room 302"*), the frontend frontend makes a quick background call to this endpoint. The endpoint analyzes the text using cloud AI (Groq Llama-3 or Google Gemini) or an instant local fallback rule engine, and replies within milliseconds with the suggested department (`Electrical`), priority level (`CRITICAL`), estimated resolution window (`2 hours`), hazard warning (`True`), and confidence score (`0.95`). This informs the student what will happen *before* they click the Submit button.

### 2. Line-by-Line Breakdown
- **Lines 28–34 (`@router.post(...)`)**:
  - `@router.post("/triage-preview")`: Binds this function to HTTP `POST` requests arriving at `/api/v1/tickets/triage-preview`.
  - `response_model=TriageResult`: Enforces that the output data structure matches the `TriageResult` schema, filtering out any extraneous internal fields.
  - `status_code=status.HTTP_200_OK`: Returns HTTP status code `200` upon success.
  - `summary` and `description`: Human-readable descriptions automatically displayed in the interactive Swagger UI (`/docs`).
- **Lines 35–39 (`def preview_triage(...)`)**:
  - `request_data: TriagePreviewRequest`: FastAPI automatically reads the incoming JSON request body and validates that `title` and `description` are present and non-empty.
  - `x_ai_api_key: Optional[str] = Header(None, alias="X-AI-API-Key")`: Checks if the client passed an API key in the HTTP header named `X-AI-API-Key`. If absent, defaults to `None`.
  - `x_ai_provider: Optional[str] = Header(None, alias="X-AI-Provider")`: Checks if the client specified an AI provider in the header `X-AI-Provider` (e.g., `"groq"` or `"gemini"`).
  - `-> TriageResult`: Type annotation declaring that this function returns an instance of `TriageResult`.
- **Line 45 (`active_key = request_data.api_key or x_ai_api_key`)**:
  - Python short-circuit evaluation: Checks if the user provided an API key inside the JSON body (`request_data.api_key`). If non-empty, it uses it; otherwise, it falls back to the header value (`x_ai_api_key`). If neither was provided, `active_key` is `None`.
- **Line 46 (`active_provider = request_data.provider or x_ai_provider or getattr(settings, "DEFAULT_AI_PROVIDER", "groq")`)**:
  - Cascading fallback logic:
    1. First checks the JSON body.
    2. Then checks the HTTP header.
    3. If both are empty, queries `settings.DEFAULT_AI_PROVIDER`.
    4. If that attribute is not configured in `.env`, safely defaults to `"groq"`.
- **Lines 48–53 (`triage_info = classify_and_triage_with_ai(...)`)**:
  - Calls the internal intelligence pipeline. It attempts to connect to Groq/Gemini with the available key. If the network is down or keys are invalid, it gracefully falls back to the campus deterministic keyword dictionary. It returns a Python dictionary `triage_info` containing keys like `"priority"`, `"hazard_detected"`, `"department_name"`, etc.
- **Lines 55–69 (`return TriageResult(...)`)**:
  - Constructs and returns the strongly typed `TriageResult` instance:
    - `priority=PriorityEnum(triage_info["priority"])`: Converts the string (e.g., `"CRITICAL"`) into a verified enum.
    - `suggested_priority=triage_info.get(...)`: Safe dictionary access (`.get()`) that falls back to `triage_info["priority"]` if `"suggested_priority"` was not set.
    - `category=triage_info["category"]`: The predicted taxonomy category (e.g., `"Hostel Maintenance"`).
    - `sla_hours=triage_info.get("sla_hours")`: The turnaround time (e.g., `2` for critical issues, `72` for low issues).
    - `hazard_detected=triage_info["hazard_detected"]`: Boolean flag (`True` if words like "fire", "spark", "gas leak" were detected).
    - `confidence=triage_info["confidence"]`: Confidence level ranging from `0.0` (pure guess) to `1.0` (exact certainty).
    - `matched_keywords=triage_info.get("matched_keywords", [])`: List of terms that triggered the classification.
    - `ai_powered=triage_info.get("ai_powered", False)`: Boolean indicating whether an external LLM was used or if local heuristics generated the result.

### 3. Deep Term & Concept Expansion
- **Short-Circuit Evaluation (`A or B or C`)**: In Python (as in C with `||`), logical `or` evaluates left-to-right. The first "truthy" value (non-empty string, non-zero number, non-None) is immediately returned without evaluating the remaining expressions. If all are "falsy", the very last expression is returned.
- **Safe Dictionary Lookup (`dict.get(key, default)`)**: In Python, accessing `triage_info["sla_hours"]` directly will throw a fatal `KeyError` crash if the key does not exist. Calling `triage_info.get("sla_hours", None)` returns `None` safely without throwing an exception.

### 4. Runtime Mechanics & Security
- **No Database Locks**: Notice that `db: Session` is completely absent from this endpoint's parameters! Because no database session is opened, this endpoint generates zero database queries, consumes no connection pool slots, and cannot cause database deadlocks.
- **Graceful Degradation (Zero Crash Guarantee)**: If an external cloud service (like Groq) suffers an outage or has high latency, `classify_and_triage_with_ai` catches the network timeout and falls back to local regex matching in $<2\text{ms}$. The user never sees an HTTP 500 error page.

---

## Block 3: Supervisory Priority Override: `PATCH /{ticket_id}/priority` (Lines 72–109)

```python
@router.patch(
    "/{ticket_id}/priority",
    response_model=TicketResponse,
    status_code=status.HTTP_200_OK,
    summary="Manually override ticket priority tier (Admin / Super Admin)",
    description="Authorized facility supervisor manual priority adjustment with mandatory audit explanation.",
)
def override_priority(
    ticket_id: int,
    override_data: PriorityOverrideRequest,
    current_user: Optional[UserResponse] = Depends(require_roles(["ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db),
) -> TicketResponse:
    """
    Administrative mutation: modifies ticket priority, recalculates SLA deadline,
    and appends timestamped explanation note to resolution_notes.
    """
    actor_label = f"{current_user.name} ({current_user.email})" if current_user else "Supervisor"
    updated_ticket = override_ticket_priority(
        db=db,
        ticket_id=ticket_id,
        override_data=override_data,
        actor=actor_label,
    )

    if updated_ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket with ID {ticket_id} not found",
        )

    response = TicketResponse.model_validate(updated_ticket)
    if updated_ticket.department:
        response.department_name = updated_ticket.department.name
    if updated_ticket.assigned_team:
        response.assigned_team_name = updated_ticket.assigned_team.name

    return response
```

### 1. Plain-English Purpose
Sometimes the AI assigns an issue a `MEDIUM` priority (e.g. *"Water pipe dripping in bathroom"*), but a campus administrator visits the site and discovers the drip is directly above the server rack, making it a critical emergency. This endpoint allows an authorized supervisor to escalate (or de-escalate) the priority level. When invoked, it updates the priority, recalculates the deadline, and logs an indelible audit message recording who made the change and why.

### 2. Line-by-Line Breakdown
- **Lines 72–78 (`@router.patch(...)`)**:
  - `@router.patch("/{ticket_id}/priority")`: Binds to HTTP `PATCH` requests. In REST API conventions, `PATCH` indicates a partial update of a resource (modifying just the priority field rather than replacing the entire ticket record).
  - `{ticket_id}`: A URL path parameter. If the client calls `PATCH /api/v1/tickets/42/priority`, FastAPI parses `42` as an integer and injects it into `ticket_id`.
- **Lines 79–84 (`def override_priority(...)`)**:
  - `ticket_id: int`: The primary key of the ticket being altered.
  - `override_data: PriorityOverrideRequest`: The validated payload containing `new_priority` (e.g. `"CRITICAL"`) and `override_reason` (e.g. `"Located near electrical main breaker"`).
  - `current_user: Optional[UserResponse] = Depends(require_roles(["ADMIN", "SUPER_ADMIN"]))`: **Security Gate**. Injects the authenticated user. If the user is a student or unauthenticated visitor, this dependency immediately aborts the request and responds with `HTTP 403 Forbidden`.
  - `db: Session = Depends(get_db)`: Injects the active database session.
- **Line 89 (`actor_label = f"{current_user.name} ({current_user.email})" if current_user else "Supervisor"`)**:
  - Constructs a human-readable identifier for the audit log (e.g. `"Dr. Verma (verma@iiitnr.edu.in)"`).
- **Lines 90–95 (`updated_ticket = override_ticket_priority(...)`)**:
  - Calls the backend domain service `override_ticket_priority`:
    1. Executes an SQL query to find the ticket by `ticket_id`.
    2. Modifies `ticket.priority = override_data.new_priority`.
    3. Recomputes `ticket.sla_deadline` based on the ticket's original `created_at` timestamp plus the new priority's allowed hours.
    4. Appends a timestamped audit trail entry to `ticket.resolution_notes`:  
       `"[PRIORITY OVERRIDE] Priority modified from MEDIUM to CRITICAL by Dr. Verma (verma@iiitnr.edu.in). Reason: Located near electrical main breaker."`
    5. Commits the transaction to the database.
- **Lines 97–101 (`if updated_ticket is None: raise HTTPException(...)`)**:
  - If the database query found no record matching `ticket_id`, halts execution and returns `HTTP 404 Not Found` with `{"detail": "Ticket with ID 42 not found"}`.
- **Lines 103–107 (`response = TicketResponse.model_validate(updated_ticket) ...`)**:
  - `TicketResponse.model_validate(...)`: Converts the SQLAlchemy ORM database object into a JSON-serializable Pydantic response model.
  - Lines 104–107: Manually extracts the human-friendly department name and assigned team name from the joined SQL relationship objects and attaches them to `response`.
- **Line 109 (`return response`)**:
  - Returns the validated, serialized ticket response back to the client.

### 3. Deep Term & Concept Expansion
- **Why HTTP `PATCH` instead of `PUT` or `POST`?**:
  - `POST`: Used to create an entirely new entity (e.g., submitting a brand-new complaint).
  - `PUT`: Used to replace an entire existing entity with a fresh representation (overwriting all fields).
  - `PATCH`: Used to modify specific attributes of an existing entity without overwriting the rest. Since we are only modifying the priority and recalculating its deadline, `PATCH` is the correct RESTful method.
- **Audit Trails**: In institutional software, silent modifications are dangerous. If a technician ignores a ticket because its priority was quietly lowered, investigators need to know who lowered it and why. Appending the actor's identity and justification to `resolution_notes` ensures complete institutional accountability.

### 4. Runtime Mechanics & Security
- **Role-Based Access Control (RBAC)**:
  ```mermaid
  flowchart TD
      Req["Client Request: PATCH /tickets/42/priority"] --> TokenCheck{"Valid Bearer Token?"}
      TokenCheck -- No --> E401["HTTP 401 Unauthorized"]
      TokenCheck -- Yes --> RoleCheck{"User Role in ['ADMIN', 'SUPER_ADMIN']?"}
      RoleCheck -- No (Student / Tech) --> E403["HTTP 403 Forbidden"]
      RoleCheck -- Yes --> Service["Execute override_ticket_priority()"]
      Service --> DBCommit["Commit SQL Transaction & Return TicketResponse"]
  ```
- **Transaction Safety**: `override_ticket_priority` runs within a single atomic database transaction. If updating the SLA deadline or logging the audit note fails, the entire transaction rolls back, preventing corrupted, partially updated tickets.

---

## 4. Viva & Technical Defense Guide

> [!TIP]
> **Q1: Why is `/triage-preview` completely stateless and why does it not accept a database session?**  
> **Answer**: The `/triage-preview` endpoint is invoked dynamically as the user types their complaint into the submission form (using frontend debouncing). If this endpoint performed database writes or held open database sessions, hundreds of active keystrokes would rapidly exhaust the database connection pool and fill the database with incomplete "draft" garbage rows. By keeping it 100% stateless in RAM, it provides instant predictions with zero database overhead.

> [!TIP]
> **Q2: What happens to a ticket's SLA deadline when an Administrator escalates its priority from LOW to CRITICAL?**  
> **Answer**: In `override_ticket_priority`, the system dynamically recalculates `ticket.sla_deadline` based on the ticket's initial `created_at` timestamp. If an issue created 3 hours ago with `LOW` priority (72-hour window) is escalated to `CRITICAL` (2-hour window), the new deadline is set to `created_at + 2 hours`. Since 3 hours have already elapsed, the ticket is immediately recognized by the system as breached, triggering immediate escalation alerts on supervisor dashboards.

> [!TIP]
> **Q3: What prevents ordinary students from calling the priority override endpoint and escalating their own complaints?**  
> **Answer**: The endpoint is protected by `Depends(require_roles(["ADMIN", "SUPER_ADMIN"]))`. FastAPI inspects the encrypted JWT access token in the incoming `Authorization: Bearer <token>` header. If the user's role is `"STUDENT"` or `"TECHNICIAN"`, FastAPI rejects the request with `HTTP 403 Forbidden` before `override_priority` is ever executed.

> [!TIP]
> **Q4: How does the system handle an AI service outage (e.g. Groq or Gemini API is unreachable)?**  
> **Answer**: The service function `classify_and_triage_with_ai` implements an automated fallback architecture. If the HTTP request to the external AI provider times out or returns an error, the system catches the exception and routes the text through a local deterministic regex and keyword matching engine (`classify_ticket`). The endpoint still succeeds, setting `ai_powered=False` and `provider="local-heuristic"`.

---

## 5. Quick-Reference Viva Summary Table

| Concept / Keyword | Meaning in Basic C / Python | Role in `priority.py` |
| :--- | :--- | :--- |
| `router = APIRouter()` | Subroutine grouping module | Mounts priority endpoints to the main web server. |
| `TriagePreviewRequest` | Input `struct` / dictionary | Validates incoming complaint title and description for live preview. |
| `TriageResult` | Output `struct` / dictionary | Returns predicted priority, department, SLA, hazard flag, and confidence. |
| `Header(None, alias=...)` | Reading HTTP packet metadata | Allows client to optionally supply external AI keys in request headers. |
| `require_roles(["ADMIN", ...])` | Access permission `if` check | Halts unauthorized users with HTTP 403 Forbidden. |
| `PATCH` HTTP Verb | Partial struct attribute update | Modifies priority and deadline without overwriting the entire ticket. |
| `override_ticket_priority` | Database update function | Updates priority, recalculates SLA deadline, and logs audit justification. |
| `HTTPException(404)` | Error return with code | Returns HTTP 404 when the target ticket ID does not exist in the database. |
| Stateless Evaluation | Pure function ($f(x) \to y$) | Calculates AI predictions in RAM without touching or locking the database. |
| Audit Trail Logging | Appending to a log file | Inscribes who changed the priority and why into `resolution_notes`. |
