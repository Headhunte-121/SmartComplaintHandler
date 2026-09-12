# Module M3 - File 03: Priority & Triage Data Transfer Schemas
## Target File: `backend/app/schemas/priority.py`
### Execution Track: Phase 1 (Can be built in parallel with Files 01 and 02)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In modern enterprise API development and microservice architectures, `schemas/priority.py` defines the **Data Transfer Object (DTO) & Contract Validation Subsystem** for complaint classification and priority assignment. A Data Transfer Object (DTO) is an in-memory data container designed specifically to carry data across process boundaries (such as from an incoming HTTP client request into backend business logic) without containing any database logic or persistent storage behavior.

### Standard Industry Role & Real-World Use Cases
In professional production systems (such as AWS API Gateway integrations, Stripe billing APIs, and ServiceNow ITIL workflows), schema definition files standardly fulfill four mission-critical architectural roles:

1. **Boundary Guarding & Type Enforcement (Deserialization Validation):**
   * Raw incoming HTTP requests arrive over network sockets as unparsed JSON strings (plain byte streams).
   * Schema files define strict rules that intercept, inspect, parse, and validate these byte streams before any internal service or database query is executed.
   * If a client submits malformed data, unexpected field types, or out-of-range numerical values, the schema instantly rejects the request with HTTP 422 Unprocessable Entity, preventing malformed data from ever touching core business services.
2. **Standardized Enumeration Governance (Enum Boundary Enforcement):**
   * Systems standardly constrain critical lifecycle values (such as priority tiers, order statuses, or user roles) to closed, immutable sets known as Enumerations.
   * By governing priorities through an explicit `PriorityEnum`, the system guarantees that only officially authorized states (e.g. `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) can ever be processed, mathematically eliminating invalid status injections like `"URGENT"`, `"ASAP"`, or arbitrary strings.
3. **Automated OpenAPI Contract Generation (Swagger UI Documentation):**
   * Frameworks like FastAPI inspect Pydantic schema classes via Python runtime reflection and Abstract Syntax Tree (AST) metadata to automatically generate interactive OpenAPI (v3.1.0) specifications.
   * Frontend engineers, mobile developers, and external integrations consult this generated documentation at `/docs` to understand exact payload keys, expected data types, string constraints, and default examples without reading backend source code.
4. **Data Sanitization & Mass-Assignment Protection:**
   * Prevents mass-assignment security vulnerabilities (where malicious users inject unauthorized internal attributes like `is_admin=True` or `id=123` into an HTTP request payload).
   * Schema models define an explicit allow-list of accepted attributes; any unexpected key is either automatically stripped or rejected depending on model configuration.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our automated campus complaint routing platform, our 5-student engineering team specifically uses `backend/app/schemas/priority.py` for four distinct operational needs:

1. **Governing the Four Priority Tiers via `PriorityEnum`:**
   * Declares the four official institutional priority tiers: `CRITICAL`, `HIGH`, `MEDIUM`, and `LOW`.
   * Ensures every Python service, endpoint parameter, database write, and frontend response uses identical string representations that match the SQLite `tickets.priority` column created in Module M1.
2. **Validating Stateless Triage Preview Payloads (`TriagePreviewRequest`):**
   * Validates incoming complaints when students type into the frontend complaint submission form.
   * Enforces that the `title` contains between 5 and 200 characters, and `description` contains between 10 and 2,000 characters, preventing empty or spam submissions from triggering classifier computations.
3. **Structuring the Automated Triage Diagnostic Response (`TriageResult`):**
   * Defines the standardized response returned by both the preview endpoint and internal services.
   * Formulates an explainable diagnostic payload containing: calculated `priority`, predicted `category`, boolean `hazard_detected` flag, numerical `confidence` score (bounded between 0.0 and 1.0), textual `reason` explanation, and the list of `matched_keywords`.
4. **Authorizing Administrative Priority Adjustments (`PriorityOverrideRequest`):**
   * Validates payloads when a facility supervisor or maintenance administrator manually adjusts a complaint's priority tier.
   * Mandates that any priority override must include an authorized `new_priority` value and an explicit `override_reason` (5 to 500 characters) to preserve a tamper-evident institutional audit trail.
5. **Standardizing the Future AI Triage Output Contract (V2 Architecture):**
   * `TriageResult` serves as the standardized output contract for future AI inference. When an AI/LLM model extracts contextual keywords and calculates confidence scores in V2, it will serialize into this exact schema, preventing breaking changes across frontend and backend layers.

### Future AI Integration & Contract Stability (V2 Roadmap)
The schema definitions in this file directly support the planned evolution to Artificial Intelligence:
* **The Universal Triage Schema (`TriageResult`):** In V2, an AI model will analyze natural language complaint narratives to extract context and predict priority. Because `TriageResult` includes fields for `confidence` (float between 0.0 and 1.0), `matched_keywords` (list of strings), and `reason` (human-readable explanation), the schema is 100% prepared to receive AI-generated semantic explanations and contextual keywords without adding or modifying fields.
* **Human-in-the-Loop Schema Governance (`PriorityOverrideRequest`):** While the AI will decide the baseline triage recommendation, institutional safety demands that human administrators have the final say. `PriorityOverrideRequest` enforces that when a supervisor modifies an AI-assigned priority, they must supply an authorized `PriorityEnum` and a mandatory `override_reason`.
* **Zero Client-Side Disruption:** The React frontend form will continue consuming `TriageResult` and sending `PriorityOverrideRequest` without changing a single line of TypeScript when the backend upgrades from regex to AI.

### How Other Components Standardly Interact with This File
Across the platform codebase, `schemas/priority.py` acts as the shared vocabulary contract:
* **The Priority Endpoints (`backend/app/api/v1/endpoints/priority.py`):** Uses `TriagePreviewRequest` as the incoming HTTP body type hint and `TriageResult` as the `response_model`. Uses `PriorityOverrideRequest` to parse manual adjustment requests.
* **The Classifier & Priority Services (`backend/app/services/classifier.py` and `priority_engine.py`):** Output structured dictionaries or named tuples whose fields directly conform to `TriageResult`.
* **The Ticket Service (`backend/app/services/ticket_service.py`):** Consumes `PriorityOverrideRequest` when executing supervisor-level manual priority overrides.
* **The Frontend Client (React / Web UI):** Replicates these exact TypeScript interfaces to send valid JSON requests and render real-time priority badges, confidence bars, and hazard warning alerts.

### The Core Problem It Solves & Why It Exists
* **The Invalid State Corruption Problem:** Without a strict schema, an external client could send `{ "priority": "Emergency" }` or `{ "priority": "urgent" }`. Without schema validation, this arbitrary string would be written directly to the database. Downstream services (like the SLA calculation engine in Module M5) looking for `CRITICAL` would fail to match the condition, leading to unhandled runtime exceptions or infinite resolution deadlines.
* **The Blind Override Problem:** Without `PriorityOverrideRequest` enforcing a mandatory `override_reason` string, administrators could silently demote emergency tickets without leaving an explanation, destroying institutional accountability when incidents are investigated.
* **Decoupling Schemas from Database Models:** Database models (`backend/app/models/ticket.py`) define physical table columns, relational foreign keys, and indexes. Exposing database models directly over HTTP leaks internal database architecture to public networks. Schemas act as a decoupled insulation barrier.

---

# 2. What Must Be in This File & Why Each Item Is Needed

To be complete, production-grade, and fully compliant with Pydantic V2 standards, `backend/app/schemas/priority.py` must define and export the following four structural components:

---

### Item 1: The String Enumeration `PriorityEnum(str, Enum)`
* **What it is:** A Python enumeration class inheriting from both `str` and Python's standard `enum.Enum`.
* **Exact Enumeration Members:**
  * `CRITICAL = "CRITICAL"`
  * `HIGH = "HIGH"`
  * `MEDIUM = "MEDIUM"`
  * `LOW = "LOW"`
* **Why it is needed:**
  * **Dual Inheritance (`str, Enum`):** Subclassing `str` guarantees that when Pydantic or FastAPI serializes this enum to JSON, it converts seamlessly to a standard JSON string (e.g. `"CRITICAL"`) without requiring manual `.value` string extraction.
  * **FastAPI Query & Path Parameter Validation:** Allows FastAPI endpoints to enforce enum validation directly in endpoint function signatures.
  * **Consistency:** Eliminates string typos across all backend modules.

---

### Item 2: The Complaint Triage Preview Request Schema (`TriagePreviewRequest`)
* **What it is:** A Pydantic V2 `BaseModel` that defines and validates incoming complaint text sent for stateless triage analysis.
* **Field Specifications:**
  * `title: str = Field(..., min_length=5, max_length=200, description="Short summary of the complaint issue", examples=["Sparking switchboard in lab 302"])`
  * `description: str = Field(..., min_length=10, max_length=2000, description="Detailed description of the problem", examples=["The main switchboard is emitting loud electrical buzzing and visible sparks."])`
* **Model Configuration:**
  * Uses `model_config = ConfigDict(str_strip_whitespace=True)` to automatically strip leading and trailing whitespace from user input before validation.
* **Why it is needed:**
  * **Minimum Length Guards:** Prevents pointless single-character or blank requests (e.g. `title: "a"`, `description: "broken"`) from consuming server CPU cycles in text classification.
  * **Maximum Length Guards (DoS Protection):** Prevents malicious clients from submitting a 100-megabyte string designed to exhaust server RAM during regex tokenization.

---

### Item 3: The Structured Triage Diagnostic Response Schema (`TriageResult`)
* **What it is:** A Pydantic V2 `BaseModel` defining the standardized response payload returned after automated classification and priority scoring have finished.
* **Field Specifications:**
  * `priority: PriorityEnum = Field(..., description="Calculated institutional urgency tier")`
  * `category: str = Field(..., description="Predicted facility service domain (e.g. Electrical, Plumbing, Infrastructure, IT Support, General)")`
  * `hazard_detected: bool = Field(..., description="True if a life-safety hazard keyword was identified")`
  * `confidence: float = Field(..., ge=0.0, le=1.0, description="Normalized classification confidence score between 0.0 and 1.0")`
  * `reason: str = Field(..., description="Human-readable explanation of why this priority and category were assigned")`
  * `matched_keywords: list[str] = Field(default_factory=list, description="List of domain or hazard keywords identified in the complaint text")`
* **Why it is needed:**
  * **Contract Certainty:** Guarantees that the frontend receives an unvarying JSON shape containing every diagnostic attribute required to render visual triage feedback.
  * **Bounded Confidence:** The `ge=0.0` (greater than or equal to 0.0) and `le=1.0` (less than or equal to 1.0) validators mathematically enforce that the classification confidence score is a valid normalized probability ratio.

---

### Item 4: The Administrative Priority Override Schema (`PriorityOverrideRequest`)
* **What it is:** A Pydantic V2 `BaseModel` that governs manual administrative priority adjustments executed via HTTP `PATCH`.
* **Field Specifications:**
  * `new_priority: PriorityEnum = Field(..., description="The new priority tier being assigned by the administrator")`
  * `override_reason: str = Field(..., min_length=5, max_length=500, description="Mandatory institutional justification explaining why the automated priority was modified", examples=["Site inspection revealed isolated wire casing wear, not active fire risk."])`
* **Why it is needed:**
  * **Audit Accountability:** Enforces that a supervisor cannot change a priority without providing a valid justification (at least 5 characters).
  * **Value Safety:** Enforces that the `new_priority` can only be one of the four official enum members, rejecting invalid priority strings.

---

# 3. Component Life-Cycle: Input, Process, Output (IPO Table)

The following table documents the exact data life-cycle for each schema defined in `backend/app/schemas/priority.py`:

| Schema Class | Input Received | Validation & Processing Performed | Output Produced | Error Handling (422 Rejections) |
| :--- | :--- | :--- | :--- | :--- |
| `PriorityEnum` | String value (e.g. `"CRITICAL"`, `"LOW"`, or `"INVALID"`) | Checks whether the input string matches one of the defined enum member values. | Strongly-typed enum instance (`PriorityEnum.CRITICAL`) serializable as plain string. | Rejects with `ValueError: 'INVALID' is not a valid PriorityEnum` if string does not match allowed set. |
| `TriagePreviewRequest` | Raw JSON dictionary with `title` and `description` keys. | 1. Strips leading/trailing whitespace.<br>2. Verifies `title` is 5 to 200 characters.<br>3. Verifies `description` is 10 to 2000 characters. | Validated in-memory Python object accessible via dot-notation (`req.title`, `req.description`). | Rejects with HTTP 422 if `title` is under 5 characters or `description` exceeds 2000 characters. |
| `TriageResult` | Dictionary or keyword arguments from classification and priority engines. | 1. Validates `priority` matches `PriorityEnum`.<br>2. Validates `confidence` satisfies `0.0 <= confidence <= 1.0`.<br>3. Verifies `matched_keywords` is a valid string list. | Standardized JSON payload sent over HTTP to client with status code 200 OK. | Rejects at internal serialization if confidence is out of range (`-0.1` or `1.5`) or priority is invalid. |
| `PriorityOverrideRequest` | Raw JSON dictionary with `new_priority` and `override_reason`. | 1. Strips leading/trailing whitespace.<br>2. Validates `new_priority` against `PriorityEnum`.<br>3. Verifies `override_reason` is 5 to 500 characters. | Validated Python object passed directly to `ticket_service.override_ticket_priority()`. | Rejects with HTTP 422 if `override_reason` is missing, blank, or shorter than 5 characters. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. Strict Non-Negotiables

To preserve architectural stability while allowing institutional customization, follow these strict modification boundaries:

### 🟢 Safe to Modify (Configurable Parameters)
* **String Length Boundaries:** You may increase or decrease string length limits in `Field(...)` (e.g. changing `title` `max_length` from `200` to `250`, or `description` `max_length` from `2000` to `4000` for campuses with verbose incident reports).
* **Adding Supplementary Metadata Fields to `TriageResult`:** You can add optional fields such as `suggested_department: Optional[str] = None` or `estimated_resolution_hours: Optional[int] = None` to provide extra diagnostic information to the UI.
* **Schema Descriptions and Documentation Examples:** You can update the `description` and `examples` arguments within `Field(...)` to reflect local campus vocabulary (e.g. changing examples to reference specific buildings on your own university campus).
* **Adding Whitespace Trimming Configurations:** You can add custom validators (using `@field_validator`) to clean or uppercase specific input fields if needed.

### 🔴 Strict Non-Negotiables (System Breaking Changes)
* **DO NOT Alter the Core `PriorityEnum` Member Values:** Changing `CRITICAL` to `"URGENT"` or `"Sev-1"` will immediately break the database layer (`backend/app/models/ticket.py`), which stores these exact uppercase string literals.
* **DO NOT Remove `str` from `class PriorityEnum(str, Enum)`:** Omitting `str` creates a standard Python enum. When serialized by Pydantic or passed to SQLAlchemy database queries, standard enums serialize as enum objects instead of primitive strings, triggering JSON serialization errors and database insertion failures.
* **DO NOT Make `override_reason` Optional:** Allowing empty or optional override reasons destroys administrative auditability and breaks compliance standards.
* **DO NOT Remove Numerical Bounds on `confidence`:** Removing `ge=0.0, le=1.0` allows mathematical bugs in upstream classification algorithms (such as un-normalized confidence scores) to leak into public API responses undetected.
* **DO NOT Import Database Models Inside Schemas:** Schemas must remain strictly decoupled from SQLAlchemy or database sessions. Importing database entities into schema files creates circular import loops and violates Clean Architecture principles.

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

# 6. Definition of Done: Observable Verification Checklist

Before considering `backend/app/schemas/priority.py` complete, verify each of the following operational checkpoints:

### Implementation Checklist
- [ ] File exists at `backend/app/schemas/priority.py`.
- [ ] Imports `Enum` from standard library `enum`.
- [ ] Imports `BaseModel`, `Field`, and `ConfigDict` from `pydantic`.
- [ ] Defines `PriorityEnum(str, Enum)` with exact uppercase members: `CRITICAL`, `HIGH`, `MEDIUM`, and `LOW`.
- [ ] Defines `TriagePreviewRequest` with `title` (length 5-200) and `description` (length 10-2000), configured with whitespace trimming.
- [ ] Defines `TriageResult` containing `priority`, `category`, `hazard_detected`, `confidence`, `reason`, and `matched_keywords` with appropriate type constraints.
- [ ] Defines `PriorityOverrideRequest` with `new_priority` typed as `PriorityEnum` and `override_reason` requiring 5 to 500 characters.
- [ ] File contains zero database imports or SQLAlchemy dependencies.

### Terminal Verification Commands (Run in PowerShell from Project Root)

1. **Verify Python Syntax & Enum Serialization:**
   `python -c "from app.schemas.priority import PriorityEnum; assert PriorityEnum.CRITICAL == 'CRITICAL'; assert isinstance(PriorityEnum.CRITICAL, str); print('PriorityEnum verified successfully!')"`

2. **Verify `TriagePreviewRequest` Validation & Rejections:**
   `python -c "from app.schemas.priority import TriagePreviewRequest; req = TriagePreviewRequest(title='  Water pipe broken  ', description='Major water leak flooding floor 2'); assert req.title == 'Water pipe broken'; print('TriagePreviewRequest valid!')"`

3. **Verify Boundary Violation Detection (Must Catch Validation Error):**
   `python -c "from app.schemas.priority import TriagePreviewRequest, ValidationError; (lambda: [exec('try:\n TriagePreviewRequest(title=\"shrt\", description=\"too short\")\nexcept Exception as e:\n print(\"Validation caught successfully:\", type(e).__name__)') ])()"`

4. **Verify `TriageResult` Construction & Normalized Confidence:**
   `python -c "from app.schemas.priority import TriageResult, PriorityEnum; res = TriageResult(priority=PriorityEnum.CRITICAL, category='Electrical', hazard_detected=True, confidence=0.95, reason='Fire hazard keyword', matched_keywords=['spark', 'smoke']); assert res.confidence == 0.95; print('TriageResult schema verified!')"`

5. **Verify `PriorityOverrideRequest` Schema & Constraints:**
   `python -c "from app.schemas.priority import PriorityOverrideRequest, PriorityEnum; req = PriorityOverrideRequest(new_priority=PriorityEnum.HIGH, override_reason='Verified water pressure failure affecting floor'); assert req.new_priority == PriorityEnum.HIGH; print('PriorityOverrideRequest verified!')"`
