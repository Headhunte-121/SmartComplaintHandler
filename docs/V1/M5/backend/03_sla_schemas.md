# Module M5 Backend: SLA & Lifecycle Pydantic V2 Schemas Specification

Authoritative Engineering Blueprint for `backend/app/schemas/sla.py`.

---

## Section 1: Standard Purpose & Industry Role

### Standard Industry Role & Real-World Use Cases
In modern microservice and RESTful API architectures, Data Transfer Objects (DTOs, structured objects that carry data between software processes without containing business logic) define the contract between client interfaces and server controllers. In enterprise applications, endpoints that modify business entity lifecycles (such as transitioning an issue to "Resolved" or escalating a breached ticket) must enforce strict boundary validation before any execution reaches the service or database layers.

Pydantic V2 (a high-performance data validation and parsing library built on a Rust core for Python) provides declarative schema definitions. It guarantees that incoming JSON request bodies contain required fields, conform to exact string enumerations, adhere to character length constraints, and convert raw ISO date strings into native Python `datetime` instances.

In Service Level Agreement (SLA) and incident management systems, schemas enforce data integrity: requiring technicians to enter substantive closure documentation before resolving tickets, restricting status mutations to recognized lifecycle enums, and serializing complex temporal calculations into predictable JSON responses.

### What WE Are Specifically Using It For in Smart Complaint Handler
In `SmartComplaintHandler`, `backend/app/schemas/sla.py` establishes the strict Pydantic V2 data contracts governing all SLA monitoring, lifecycle status transitions, and resolution workflows:
1. `TicketStatusEnum`: A strict Python `str` enum enumerating all valid ticket states (`SUBMITTED`, `IN_PROGRESS`, `ESCALATED`, `ON_HOLD`, `RESOLVED`, `CLOSED`, `CANCELLED`).
2. `StatusUpdateRequest`: The request contract for general lifecycle updates (`PATCH /api/v1/tickets/{id}/status`), validating the target status and accepting optional operational notes and actor identifiers.
3. `TicketResolveRequest`: A dedicated, high-integrity contract for resolving complaints (`POST /api/v1/tickets/{id}/resolve`), asserting that `resolution_notes` contains at least 10 non-whitespace characters and optionally capturing parts replaced and technician names.
4. `EscalationRequest`: The schema for supervisory escalations, enforcing a mandatory 5-character reason explaining why the issue is being expedited.
5. `SLABreachResponse` and `TicketLifecycleResponse`: Output response contracts serializing calculated deadlines, elapsed overdue seconds, and dynamic SLA status flags (`ON_TRACK`, `APPROACHING_BREACH`, `BREACHED`, `RESOLVED_MET`).

### Future AI Integration & Roadmap Hooks
In Version 2 (V2), when our platform introduces automated AI-driven operational optimization and multimodal resolution verification via Gemini API, these schemas provide:
1. AI Triage Telemetry Metadata: An optional structured dictionary field `ai_telemetry` in `TicketLifecycleResponse` capturing model confidence scores, prompt tokens, and predictive completion times.
2. Photographic Verification Schema: An extended field in `TicketResolveRequest` accepting an array of uploaded image URLs (`closure_image_urls: list[str]`) for Gemini Vision visual inspection before resolution confirmation.
3. Universal Data Contract Stability: By anchoring all lifecycle mutations to Pydantic V2 schemas, the underlying service implementation can switch between deterministic rule engines and Gemini AI agents without altering a single field in the external API contract.

### How Other Components Standardly Interact with This File
1. `endpoints/sla.py` (Module M5 Backend) imports these schemas and uses them as parameter type annotations (`payload: StatusUpdateRequest`, `payload: TicketResolveRequest`), relying on FastAPI to automatically validate request bodies.
2. `ticket_service.py` (Module M5 Backend) uses these schemas to unpack validated data when mutating database models.
3. Frontend API client `src/api/sla.js` (Module M5 Frontend) serializes its request payloads to match the exact field keys defined in these schemas.

### The Core Problem It Solves & Why It Exists
Without these schemas:
- Staff could send arbitrary status strings (like `"done"`, `"finished"`, or `"fixed"`), polluting the database with inconsistent, unindexed values that break dashboard filters.
- Tickets could be closed with empty payloads (`{}`), bypassing physical repair documentation and erasing operational accountability.
- Unhandled schema validation errors would trigger raw Python exceptions, leaking internal stack traces rather than returning clean HTTP 422 errors.

---

## Section 2: What Must Be in This File & Why Each Item Is Needed

### 1. `TicketStatusEnum(str, Enum)`
* Purpose: Defines the exhaustive set of valid status states as a string enum.
* Members:
  - `SUBMITTED = "SUBMITTED"`
  - `IN_PROGRESS = "IN_PROGRESS"`
  - `ESCALATED = "ESCALATED"`
  - `ON_HOLD = "ON_HOLD"`
  - `RESOLVED = "RESOLVED"`
  - `CLOSED = "CLOSED"`
  - `CANCELLED = "CANCELLED"`
* Why Needed: Subclassing both `str` and `Enum` allows Pydantic to serialize status values directly to JSON strings while restricting incoming payloads to exact enumerated matches.

### 2. `StatusUpdateRequest(BaseModel)`
* Purpose: Request DTO for standard lifecycle state transitions (`PATCH /tickets/{id}/status`).
* Fields:
  - `status: TicketStatusEnum`: The target status to transition into. Required.
  - `notes: str | None = None`: Optional operational notes explaining the status update.
  - `actor: str = "Staff"`: The identifier of the staff member or automated process performing the transition. Defaults to `"Staff"`.
* Field Validators:
  - Whitespace Stripper: Applies `@field_validator("notes")` to strip whitespace; converts empty strings to `None`.

### 3. `TicketResolveRequest(BaseModel)`
* Purpose: Dedicated request DTO for formally resolving and completing a complaint (`POST /tickets/{id}/resolve`).
* Fields:
  - `resolution_notes: str`: Detailed documentation of the physical repairs performed. Required. Length: minimum 10 characters, maximum 1000 characters.
  - `parts_replaced: str | None = None`: Optional description of hardware components, pipes, or wiring replaced.
  - `technician_name: str | None = None`: Optional name of the field technician who completed the work.
* Field Validators:
  - Substantive Notes Validator: Uses `@field_validator("resolution_notes")` to ensure that after stripping leading/trailing whitespace, the string contains at least 10 non-whitespace characters. Rejects empty strings or repetitive padding.

### 4. `EscalationRequest(BaseModel)`
* Purpose: Request DTO for manual supervisory escalation of a ticket.
* Fields:
  - `escalation_reason: str`: Mandatory explanation for why the ticket is being escalated. Required. Length: minimum 5 characters, maximum 500 characters.
  - `supervisor_id: str | None = None`: Optional identifier of the supervisor authorizing the escalation.

### 5. `SLABreachResponse(BaseModel)`
* Purpose: Response DTO serializing overdue and high-risk tickets for the supervisory breach table.
* Fields:
  - `ticket_id: int`: Primary key database ID.
  - `tracking_code: str`: Unique tracking code (e.g. `"TICK-8F2D"`).
  - `title: str`: Truncated complaint title.
  - `priority: str`: Priority string (`"CRITICAL"`, `"HIGH"`, `"MEDIUM"`, `"LOW"`).
  - `status: str`: Current lifecycle status.
  - `department_name: str`: Name of the assigned campus department.
  - `assigned_team: str | None`: Name of the assigned maintenance squad (or null).
  - `sla_deadline: datetime`: Target resolution deadline in UTC.
  - `overdue_seconds: float`: Number of seconds elapsed past deadline (positive if overdue).
  - `formatted_overdue: str`: Human-readable text (e.g. `"1h 45m overdue"`).

### 6. `TicketLifecycleResponse(BaseModel)`
* Purpose: Comprehensive response DTO returned after any lifecycle mutation.
* Fields:
  - `id: int`: Primary key database ID.
  - `tracking_code: str`: Unique tracking code.
  - `title: str`: Complaint title.
  - `status: TicketStatusEnum`: Current lifecycle state.
  - `priority: str`: Priority string.
  - `sla_deadline: datetime`: Target resolution deadline.
  - `created_at: datetime`: Ticket creation timestamp.
  - `resolved_at: datetime | None`: Resolution timestamp (or null if unresolved).
  - `resolution_notes: str | None`: Full historical resolution notes and audit trail.
  - `sla_status: str`: Evaluated SLA status (`"ON_TRACK"`, `"APPROACHING_BREACH"`, `"BREACHED"`, `"RESOLVED_MET"`, `"RESOLVED_BREACHED"`).
* Model Configuration: `model_config = ConfigDict(from_attributes=True)` to enable direct ORM object serialization.

---

## Section 3: Component Life-Cycle: Input, Process, Output (IPO Table)

| Life-Cycle Phase | Primary Input | Internal Validation & Transformation | Final Output |
| :--- | :--- | :--- | :--- |
| **1. Status Update Parsing** | Raw JSON `{"status": "IN_PROGRESS", "notes": "Picked up tools"}` | Pydantic validates `"IN_PROGRESS"` is in `TicketStatusEnum`; strips whitespace from `notes`. | Instantiated `StatusUpdateRequest` instance passed to endpoint handler. |
| **2. Invalid Status Rejection** | Raw JSON `{"status": "COMPLETED"}` | Pydantic fails validation; `"COMPLETED"` is not in enum; generates validation error. | FastAPI halts request; returns HTTP 422 with message: `Input should be 'SUBMITTED', 'IN_PROGRESS'...`. |
| **3. Resolution Notes Guard** | Raw JSON `{"resolution_notes": "fixed"}` | Field validator inspects length after strip (5 chars < 10); fails length validation constraint. | FastAPI returns HTTP 422: `String should have at least 10 characters`. |
| **4. Valid Resolution Parse** | Raw JSON `{"resolution_notes": "Replaced burned capacitor on ceiling fan"}` | Validates length (43 chars >= 10); strips whitespace; populates optional fields with None. | Instantiated `TicketResolveRequest` passed to `ticket_service.resolve_ticket()`. |
| **5. Response Serialization** | `Ticket` ORM entity with `sla_deadline` and audit notes | Pydantic inspects ORM attributes via `from_attributes=True`; serializes datetimes to ISO 8601 strings. | Serialized JSON dictionary conforming to `TicketLifecycleResponse` returned with HTTP 200. |

---

## Section 4: Flexibility & Modification Guide

### 🟢 Safe to Modify & Customize
* **Maximum String Lengths**: You can safely increase maximum string constraints (such as expanding `resolution_notes` from 1000 to 2000 characters) if technicians require more room for complex repair logs.
* **Additional Optional Metadata**: You can add optional fields to `TicketResolveRequest` (such as `labor_hours: float | None` or `invoice_number: str | None`) without breaking existing endpoint callers.
* **Actor Default Name**: You can modify the default value of `actor` in `StatusUpdateRequest` from `"Staff"` to `"System"` or `"Field Technician"`.

### 🔴 Strict Non-Negotiables (Do NOT Alter)
* **`TicketStatusEnum` String Coercion**: `TicketStatusEnum` must inherit from both `str` and `Enum` (`class TicketStatusEnum(str, Enum)`). If `str` is omitted, FastAPI cannot serialize the enum to JSON strings and comparisons against database string columns will fail.
* **Minimum 10 Characters on `resolution_notes`**: Do NOT lower the minimum character count on `resolution_notes` below 10 characters. Allowing shorter notes encourages staff to bypass documentation by typing single characters ("ok", "done"), destroying audit accountability.
* **`from_attributes = True`**: Do NOT remove `model_config = ConfigDict(from_attributes=True)` from response models. Removing this disables SQLAlchemy ORM attribute reading, causing response serialization to throw `AttributeError`.

---

## Section 5: Architectural & Theoretical References

This specification operates strictly as an **implementation and integration blueprint**. For the exhaustive computer science fundamentals, language runtime mechanics, and protocol specifications governing this component, consult the following authoritative manuals in the **Developer Guide Suite**:

* [**Guide 03: Pydantic v2 & Data Contract Engineering**](../../../developer_guide/03_PYDANTIC_V2_DATA_VALIDATION_AND_SCHEMAS.md)  
  Pydantic v2 validation engine, field constraints (`Field`), custom validators (`@field_validator`), and DTO serialization.

* [**Guide 01: Python Language and Runtime Mechanics**](../../../developer_guide/01_PYTHON_LANGUAGE_AND_RUNTIME_MECHANICS.md)  
  Modern Python typing (PEP 484/604 union operators), structural subtyping, and memory object lifecycle.

* [**Unit 03C: Regular Expressions & Automata Theory**](../../../developer_guide/03C_REGULAR_EXPRESSIONS_AND_AUTOMATA_THEORY.md)  
  Deterministic regex syntax constraints and ReDoS prevention for string inputs.

---

## Section 6: Definition of Done & Verification Protocol

### Observable Verification Checklist
* [ ] `backend/app/schemas/sla.py` exists, defining `TicketStatusEnum` with all 7 lifecycle states.
* [ ] `StatusUpdateRequest` validates `status` against `TicketStatusEnum` and strips `notes`.
* [ ] `TicketResolveRequest` enforces minimum 10 characters and maximum 1000 characters on `resolution_notes`.
* [ ] `EscalationRequest` enforces minimum 5 characters on `escalation_reason`.
* [ ] `SLABreachResponse` serializes `ticket_id`, `tracking_code`, `sla_deadline`, and `overdue_seconds`.
* [ ] `TicketLifecycleResponse` includes `model_config = ConfigDict(from_attributes=True)` and serializes `sla_status`.
* [ ] Passing invalid statuses or short resolution notes throws automated Pydantic validation errors.

### Verification Commands & Troubleshooting Matrix

1. **Verify Schema Validation via Python CLI:**
   Run in backend directory:
   `python -c "from app.schemas.sla import TicketResolveRequest; req = TicketResolveRequest(resolution_notes='Replaced broken fan motor'); print('Validated notes:', req.resolution_notes)"`
   Expected output: `Validated notes: Replaced broken fan motor`.

2. **Verify Short Notes Rejection (<10 Chars):**
   Run in backend directory:
   `python -c "from app.schemas.sla import TicketResolveRequest; TicketResolveRequest(resolution_notes='Fixed it')"`
   Expected output: Terminal displays `ValidationError: String should have at least 10 characters`.

3. **Verify Invalid Status Enum Rejection:**
   Run in backend directory:
   `python -c "from app.schemas.sla import StatusUpdateRequest; StatusUpdateRequest(status='DONE')"`
   Expected output: Terminal displays `ValidationError: Input should be 'SUBMITTED', 'IN_PROGRESS'...`.

4. **Troubleshooting Matrix:**
   * *Problem:* `TypeError: cannot inherit from both str and Enum`.
     * *Cause:* Incorrect import of `Enum` or class inheritance order.
     * *Fix:* Ensure `from enum import Enum` is imported and declare `class TicketStatusEnum(str, Enum):`.
   * *Problem:* Serializing an ORM model throws `PydanticSerializationError: Unable to serialize arbitrary type`.
     * *Cause:* Missing `from_attributes=True` in model configuration.
     * *Fix:* Add `model_config = ConfigDict(from_attributes=True)` inside `TicketLifecycleResponse`.
   * *Problem:* Empty string `""` passes resolution notes validation.
     * *Cause:* Whitespace stripping was omitted or validator executed after length check.
     * *Fix:* Ensure `@field_validator("resolution_notes")` trims whitespace before checking length.
