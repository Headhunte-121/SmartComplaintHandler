# Module M4 - Backend File 02: Assignment & Workload Schemas
## Target File: `backend/app/schemas/assignment.py`
### Execution Track: Phase 1 (Can be built in parallel with Files 01 and 03)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In modern web API architectures and enterprise microservices, `schemas/assignment.py` defines the **Data Transfer Object (DTO) & Contract Validation Subsystem** for workforce dispatch, maintenance squad management, and task reassignment. A Data Transfer Object (DTO) is an in-memory data container designed specifically to serialize and deserialize data across network boundaries (such as between client browsers and server controllers) without leaking internal database structures.

### Standard Industry Role & Real-World Use Cases
In professional enterprise systems (such as Field Service Management platforms and ITIL service desks), assignment schema files standardly fulfill four core architectural duties:

1. **Input Boundary Guarding (Mutation Request Validation):**
   * Validates payloads sent when a supervisor manually reassigns an incident from one team to another.
   * Enforces that the target squad ID is a valid positive integer and that the accompanying reassignment explanation satisfies institutional character length rules before any database query is executed.
2. **Workload Telemetry Serialization:**
   * Structures outgoing data packets representing real-time squad statistics (e.g. squad ID, squad name, active ticket count, operational shift status, and department affiliation).
   * Ensures that administrative dashboards receive clean, strongly-typed JSON data ready for rendering visual queue depth graphs and progress bars.
3. **Automated OpenAPI Contract Documentation (Swagger UI):**
   * Pydantic schemas are inspected by FastAPI's reflection engine to generate OpenAPI (v3.1.0) documentation at `/docs`.
   * Frontend developers inspect this schema contract to build type-safe TypeScript interfaces and form state objects matching backend expectations.
4. **Mass-Assignment Defense:**
   * Protects the database from malicious payload tampering by defining an explicit allow-list of accepted attributes, rejecting unexpected injected fields.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our campus complaint automation platform, our 5-student engineering team specifically uses `backend/app/schemas/assignment.py` for four distinct operational needs:

1. **Validating Administrative Team Reassignments (`TeamReassignRequest`):**
   * Validates payloads when a campus maintenance supervisor uses the React Admin Desk to manually reassign a complaint.
   * Mandates that the supervisor provide an integer `new_team_id` (or `new_team_name`) and an explicit `reassignment_reason` (5 to 500 characters) to ensure complete audit accountability.
2. **Structuring Live Squad Workload Telemetry (`TeamWorkloadResponse`):**
   * Powers the frontend squad workload panel (`TeamWorkloadView.jsx`).
   * Serializes squad statistics: `team_id`, `team_name`, `department_id`, `department_name`, `is_active`, `active_ticket_count`, and a calculated `workload_status` tag (`"LOW"`, `"NORMAL"`, `"HIGH"`, `"AT_CAPACITY"`).
3. **Structuring Automated Dispatch Results (`DispatchResult`):**
   * Formulates the response returned when an automated dispatch operation executes: containing `ticket_id`, `assigned_team`, `team_id`, `algorithm_used`, and `queue_depth_at_assignment`.
4. **Governing Squad Availability Updates (`TeamAvailabilityUpdate`):**
   * Validates payloads when a supervisor toggles a squad's on-duty status (`is_active: bool`), allowing the system to take squads off-duty when their shifts conclude.

### Future AI Integration & Contract Stability (V2 Roadmap)
While Version 1 utilizes these schemas for deterministic least-loaded dispatch, the schemas are intentionally engineered to support future AI integration:
* **AI Output Serialization:** In V2, when a predictive machine learning model or AI agent evaluates historical repair times and campus travel distances to recommend squad assignments, the AI's output will serialize into this exact `DispatchResult` schema.
* **Preserving the Human-in-the-Loop Gateway:** The `TeamReassignRequest` schema is the permanent contract for human supervisory control. Even if an AI model makes an automated assignment, a supervisor can adjust the assignment using this schema, preserving institutional human-in-the-loop oversight.
* **Zero Frontend Breaking Changes:** Because the schema shapes are standardized in V1, introducing predictive AI dispatch in V2 requires zero changes to frontend React components.

### How Other Components Standardly Interact with This File
Across the backend architecture, this file is consumed in multiple key locations:
* **The Assignment Endpoints (`backend/app/api/v1/endpoints/assignment.py`):** Uses `TeamReassignRequest` as the request body and `TeamWorkloadResponse` as the response model.
* **The Team Query Service (`backend/app/services/team_service.py`):** Serializes raw database queries into lists of `TeamWorkloadResponse` objects.
* **The Ticket Service (`backend/app/services/ticket_service.py`):** Consumes `TeamReassignRequest` when executing manual supervisor reassignments.
* **The Frontend API Client (`frontend/src/api/assignment.js`):** Sends requests matching these schemas and consumes their responses.

### The Core Problem It Solves & Why It Exists
* **Unjustified Reassignments:** Without `TeamReassignRequest` requiring `reassignment_reason`, technicians could silently pass difficult jobs to other squads without explanation, causing disputes between maintenance crews.
* **Schema Leakage:** Exposing raw SQLAlchemy models over HTTP exposes internal database relationships and column metadata to public networks. Schemas act as a decoupled firewall.
* **Dashboard Rendering Bugs:** Without strict schemas, a missing or null active ticket count could crash frontend React dashboard cards. Pydantic enforces guaranteed defaults.

---

# 2. What Must Be in This File & Why Each Item Is Needed

To be complete, production-grade, and fully compliant with Pydantic V2 standards, `backend/app/schemas/assignment.py` must define and export the following four structural schema models:

---

### Item 1: Manual Reassignment Request Schema (`TeamReassignRequest`)
* **What it is:** A Pydantic V2 `BaseModel` governing administrative ticket transfers.
* **Field Specifications:**
  * `new_team_id: int = Field(..., gt=0, description="Unique primary key ID of the target maintenance squad", examples=[2])`
  * `reassignment_reason: str = Field(..., min_length=5, max_length=500, description="Mandatory explanation for the manual reassignment", examples=["Hostel squad lacks replacement high-voltage breaker parts; transferred to academic squad."])`
* **Model Configuration:**
  * `model_config = ConfigDict(str_strip_whitespace=True)` to strip leading and trailing whitespace automatically.
* **Why it is needed:**
  * **Positive Integer Constraint:** `gt=0` guarantees that target squad IDs are valid database primary keys, rejecting negative or zero values.
  * **Mandatory Audit Reason:** Enforces minimum 5 characters, preventing blank or single-character justifications.

---

### Item 2: Squad Workload Telemetry Response Schema (`TeamWorkloadResponse`)
* **What it is:** A Pydantic V2 `BaseModel` defining the data payload for squad queue status cards.
* **Field Specifications:**
  * `team_id: int = Field(..., description="Unique squad primary key identifier")`
  * `team_name: str = Field(..., description="Operational squad name (e.g. Hostel Wiring Squad)")`
  * `department_id: int = Field(..., description="Parent department foreign key identifier")`
  * `department_name: str = Field(..., description="Name of the governing department (e.g. Electrical)")`
  * `is_active: bool = Field(..., description="True if squad is currently on-duty and accepting dispatches")`
  * `active_ticket_count: int = Field(..., ge=0, description="Number of unresolved tickets currently assigned to this squad")`
  * `workload_status: str = Field(..., description="Workload band indicator: LOW (0-2), NORMAL (3-5), HIGH (6-8), AT_CAPACITY (9+)")`
* **Model Configuration:**
  * `model_config = ConfigDict(from_attributes=True)` to allow automatic serialization directly from SQLAlchemy ORM entities.
* **Why it is needed:**
  * Provides the exact data shape required by the frontend React workload panel to render queue bars, capacity tags, and status colors.

---

### Item 3: Automated Dispatch Result Schema (`DispatchResult`)
* **What it is:** A Pydantic V2 `BaseModel` returning the diagnostic outcome of an automated dispatch calculation.
* **Field Specifications:**
  * `ticket_id: int = Field(..., description="Primary key of the dispatched ticket")`
  * `assigned_team: str = Field(..., description="Name of the squad assigned to the ticket")`
  * `team_id: int = Field(..., description="Primary key ID of the assigned squad")`
  * `algorithm_used: str = Field(..., description="The dispatch algorithm applied: LEAST_LOADED, EMERGENCY_CRITICAL, or ZONE_AFFINITY")`
  * `queue_depth_at_assignment: int = Field(..., ge=0, description="Number of active tickets the squad had when this ticket was assigned")`
  * `explanation: str = Field(..., description="Human-readable explanation of why this squad was selected")`
* **Why it is needed:**
  * Provides explainable diagnostic feedback to frontend admin users and automated audit monitors.

---

### Item 4: Squad Shift Availability Toggle Schema (`TeamAvailabilityUpdate`)
* **What it is:** A Pydantic V2 `BaseModel` for updating a squad's on-duty status.
* **Field Specifications:**
  * `is_active: bool = Field(..., description="New availability status: true for on-duty, false for off-duty")`
* **Why it is needed:**
  * Allows supervisors to toggle a squad's active state over HTTP `PATCH`, preventing complaints from being dispatched to off-duty crews.

---

# 3. Component Life-Cycle: Input, Process, Output (IPO Table)

The following table documents the data life-cycle for each schema in `backend/app/schemas/assignment.py`:

| Schema Class | Input Received | Validation & Processing Performed | Output Produced | Rejection Conditions (HTTP 422) |
| :--- | :--- | :--- | :--- | :--- |
| `TeamReassignRequest` | Raw JSON payload with `new_team_id` and `reassignment_reason`. | 1. Strips whitespace.<br>2. Verifies `new_team_id > 0`.<br>3. Verifies reason length between 5 and 500 characters. | Strongly-typed Python object passed to service layer. | Rejects if `new_team_id <= 0`, reason is missing, or reason is under 5 characters. |
| `TeamWorkloadResponse` | Raw database query results or ORM `Team` objects. | 1. Maps attributes via `from_attributes=True`.<br>2. Verifies `active_ticket_count >= 0`.<br>3. Validates string types. | Standardized JSON payload sent to frontend dashboard cards. | Rejects if active ticket count is negative or mandatory fields are null. |
| `DispatchResult` | Dispatch engine return dictionary. | 1. Validates algorithm name and team strings.<br>2. Verifies queue depth is non-negative. | Standardized diagnostic JSON response sent to client. | Rejects if queue depth is negative or explanation is missing. |
| `TeamAvailabilityUpdate` | Raw JSON payload with `is_active` boolean. | 1. Validates boolean type.<br>2. Coerces valid boolean representations. | Validated Python object passed to `toggle_team_availability()`. | Rejects if `is_active` cannot be parsed as a boolean. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. Strict Non-Negotiables

To preserve API stability across the engineering team, follow these operational rules:

### 🟢 Safe to Modify (Configurable Parameters)
* **Reassignment Reason Character Limits:** You can adjust `min_length` or `max_length` in `Field(...)` (e.g. lowering `min_length` to `3` or raising `max_length` to `1000`).
* **Workload Status Thresholds:** You can customize the categorization boundaries for `workload_status` (e.g. changing `"HIGH"` to trigger at 5 tickets instead of 6).
* **Adding Supplementary Metadata Fields:** You can add optional fields to `TeamWorkloadResponse`, such as `lead_technician_name: Optional[str] = None` or `contact_phone: Optional[str] = None`.
* **Swagger Documentation Examples:** You can update the `examples` and `description` text within `Field(...)` to reflect local campus buildings and squads.

### 🔴 Strict Non-Negotiables (System Breaking Changes)
* **DO NOT Remove `gt=0` from `new_team_id`:** Allowing zero or negative team IDs permits invalid foreign keys to reach the database, causing database constraint violations.
* **DO NOT Make `reassignment_reason` Optional:** Omitting justification destroys administrative accountability and violates institutional compliance standards.
* **DO NOT Remove `from_attributes=True` from `TeamWorkloadResponse`:** Without this configuration, Pydantic V2 cannot read attributes from SQLAlchemy ORM entities, causing `AttributeError` crashes during JSON serialization.
* **DO NOT Import SQLAlchemy Models Inside Schemas:** Schemas must remain strictly decoupled from database persistence layers to prevent circular import cycles.

---

# 5. Architectural & Theoretical References

This specification operates strictly as an **implementation and integration blueprint**. For the exhaustive computer science fundamentals, language runtime mechanics, and protocol specifications governing this component, consult the following authoritative manuals in the **Developer Guide Suite**:

* [**Guide 03: Pydantic v2 & Data Contract Engineering**](../../../developer_guide/03_PYDANTIC_V2_DATA_VALIDATION_AND_SCHEMAS.md)  
  Pydantic v2 validation engine, field constraints (`Field`), custom validators (`@field_validator`), and DTO serialization.

* [**Guide 01: Python Language and Runtime Mechanics**](../../../developer_guide/01_PYTHON_LANGUAGE_AND_RUNTIME_MECHANICS.md)  
  Modern Python typing (PEP 484/604 union operators), structural subtyping, and memory object lifecycle.

* [**Unit 03C: Regular Expressions & Automata Theory**](../../../developer_guide/03C_REGULAR_EXPRESSIONS_AND_AUTOMATA_THEORY.md)  
  Deterministic regex syntax constraints and ReDoS prevention for string inputs.

---

---

---

# 6. Definition of Done & Live Website Verification

### What This File Is Responsible For
This Python module (`backend/app/schemas/assignment.py`) is responsible for **enforcing Pydantic V2 validation contracts on technician assignment requests, supervisor reassignments, and team workload telemetry**. It guards data transfer boundaries for all Module M4 operations.

### What It Should Perform
When processing assignment payloads, this module validates:
1. **Mandatory Audit Justification:** In `ReassignTeamRequest`, enforces `min_length=5` on `reassignment_reason`, strictly preventing unreasoned supervisory team reassignments.
2. **Entity ID Validation:** Ensures `new_team_id` is a valid positive integer referencing an active maintenance team.
3. **Workload Telemetry Serialization:** Serializes team metrics (`active_tickets`, `max_capacity`, `utilization_rate`) into `TeamWorkloadResponse` for frontend dashboard rendering.

### How to See It Performing Its Job on the Live Website
Follow these detailed steps to verify assignment schema validation boundaries:

1. **Test Sub-5 Character Reason Rejection in Swagger Docs:**
   * Open **`http://localhost:8000/docs`** in your browser.
   * Locate `PATCH /api/v1/tickets/{ticket_id}/reassign` -> click **Try it out**.
   * Enter `ticket_id = 1` and provide an invalid short reason payload:
     ```json
     {
       "new_team_id": 2,
       "reassignment_reason": "ok"
     }
     ```
   * Click **Execute**:
     * Observe the server reject the request with **`HTTP 422 Unprocessable Entity`**.
     * Confirm error response highlights: `"String should have at least 5 characters"` under `loc: ["body", "reassignment_reason"]`.

2. **Test Valid Reassignment Payload:**
   * Change `reassignment_reason` to `"Shift change rotation approved by supervisor"`.
   * Click **Execute**:
     * Confirm server returns **`HTTP 200 OK`**.
     * Inspect response body: confirm `assigned_team_id` reflects the new team ID (`2`).

3. **Verify Client-Side Validation Guard in Reassign Modal:**
   * On **`http://localhost:5173/admin`**, click **Reassign** on any ticket row.
   * Select a new team from the dropdown.
   * In the reason box, type `Fix` (only 3 characters):
     * Observe the character counter warning: `"3/5 characters required (min 5)"` in amber.
     * Confirm the **"Confirm Reassignment"** button remains disabled until at least 5 non-whitespace characters are entered.
