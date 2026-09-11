# Module M2 - File 03: Ticket Validation Schemas
## Target File: `backend/app/schemas/ticket.py`
### Execution Track: Phase 1 (Can be built in parallel with Files 01 and 02)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In modern web API architectures and FastAPI engineering, `schemas/ticket.py` defines the **Network Data Transfer Objects (DTOs) & Data Contract Layer**. Using Pydantic V2, it establishes the formal specifications for how complaint data enters the server over HTTP (request validation) and how internal database entities are structured before being transmitted back to client browsers (response serialization).

### Standard Industry Role & Real-World Use Cases
In professional production systems, Pydantic validation schemas fulfill five foundational architectural responsibilities:

1. **The Network Perimeter Firewall (Input Validation):**
   * Standardly intercepts raw HTTP request bodies before they reach application services or the database.
   * Enforces data types, string length boundaries, numerical limits, and formatting rules.
   * If incoming JSON is malformed, missing required keys, or contains invalid characters, the schema layer immediately halts execution and returns an automated HTTP 422 Unprocessable Entity error without wasting server compute cycles.
2. **Data Sanitization & Normalization:**
   * Cleans incoming user inputs (e.g. trimming leading/trailing whitespace, normalizing line breaks).
   * Prevents users from submitting "blank" inputs consisting entirely of invisible spaces.
3. **Automated OpenAPI / Swagger Documentation Generation:**
   * FastAPI uses Pydantic schemas via Python type reflection to automatically generate the interactive Swagger UI (`/docs`) and OpenAPI JSON specification.
   * Frontend developers inspect these generated docs to know the exact structure, data types, and constraints required for API requests.
4. **Data Masking & Output Serialization:**
   * In enterprise architectures, internal database tables often contain sensitive fields (such as internal employee notes, hashed passwords, or system audit flags) that must never be exposed to public users.
   * Response schemas define an explicit whitelist of public fields, guaranteeing sensitive internal database attributes are never leaked over the wire.
5. **Bridging Relational ORM Objects to JSON (`from_attributes = True`):**
   * SQLAlchemy ORM rows are complex Python objects with attributes (`ticket.tracking_code`).
   * Pydantic schemas configured with `from_attributes = True` automatically extract data from ORM object attributes and serialize them into standard JSON dictionaries for HTTP transport.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our campus complaint automation platform, our 5-student engineering team specifically uses `schemas/ticket.py` for four concrete operational functions:

1. **Guarding Complaint Submissions (`TicketCreate`):**
   * Validates that student complaints contain genuine information:
     * `title`: Between 5 and 150 characters (preventing meaningless 1-letter titles like "X").
     * `description`: Between 10 and 1000 characters (ensuring students provide sufficient diagnostic detail for maintenance technicians).
     * `location`: Between 3 and 100 characters (ensuring technicians know exactly which hostel, floor, or room to visit).
   * Automatically strips accidental spaces before and after text fields.
2. **Governing Administrative Status Updates (`TicketUpdate`):**
   * Allows facility managers and technicians to update the complaint lifecycle: changing `status` (`SUBMITTED`, `IN_PROGRESS`, `RESOLVED`) and attaching optional `resolution_notes` (up to 500 characters) explaining how the repair was executed.
3. **Formatting the Public Student & Staff JSON Response (`TicketResponse`):**
   * Dictates the complete, standardized JSON object returned to students and administrative dashboards.
   * Includes the generated tracking code (`tracking_code`), assigned department ID (`department_id`), current status (`status`), priority (`priority`), assigned maintenance squad (`assigned_team`), and UTC timestamps (`created_at`, `updated_at`, `resolved_at`).
4. **Reading Live SQLite Objects Directly:**
   * Configures Pydantic V2's `model_config = ConfigDict(from_attributes=True)`, allowing our API endpoints to directly return SQLAlchemy `Ticket` models from Module M1 without writing manual dictionary conversion loops.

### How Other Components Standardly Interact with This File
Across the platform, schemas sit directly at the boundary between HTTP controllers and business services:
* **The REST API Controller (`app/api/v1/endpoints/tickets.py`):** Declares:
  `@router.post("", response_model=TicketResponse, status_code=201)`
  `def create_ticket(ticket_in: TicketCreate, db: Session = Depends(get_db)): ...`
  FastAPI automatically parses the incoming JSON into `ticket_in: TicketCreate`.
* **The Ticket Service (`app/services/ticket_service.py`):** Receives the pre-validated `TicketCreate` object and reads its typed properties (`ticket_in.title`, `ticket_in.description`) to create database rows.

### The Core Problem It Solves & Why It Exists
* **The "Garbage In, Garbage Out" Database Corruption:** Without input schemas, a student submitting an empty title or a 50,000-character spam essay could crash SQLite or cause buffer overflows in the frontend UI.
* **Manual Validation Spaghetti:** Manually writing dozens of `if len(title) < 5:` checks inside every route handler clutters code and leads to inconsistent error messages. Pydantic centralizes all rules into clean, reusable models.
* **Serialization Failures:** Python cannot send raw SQLAlchemy database objects across the network. Schemas provide the automated translation layer into standardized JSON.

---

# 2. What Must Be in This File & Why Each Item Is Needed

To be complete, this component must define, configure, and export the following five essential schema classes and configurations:

---

### Item 1: Base Complaint Schema (`TicketBase`)
* **What it is:** The foundational Pydantic model defining shared complaint properties inherited by creation and response schemas.
* **Attributes & Constraints:**
  * `title`: String, min length 5, max length 150.
  * `description`: String, min length 10, max length 1000.
  * `location`: String, min length 3, max length 100.
* **Why it is needed:**
  * **DRY (Don't Repeat Yourself) Principle:** Avoids re-declaring `title`, `description`, and `location` with identical length rules in multiple classes.
  * **Length Boundary Enforcement:**
    * A minimum title of 5 characters prevents accidental blank submissions.
    * A maximum title of 150 characters guarantees the string fits into the database column (`String(150)`) and won't break mobile UI table layouts.
    * A minimum description of 10 characters forces students to provide context rather than writing single words like "broken".
    * A maximum description of 1000 characters prevents malicious payload bloat.

---

### Item 2: Whitespace Cleansing Field Validator
* **What it is:** A Pydantic V2 `@field_validator` method attached to `title`, `description`, and `location`.
* **Behavior:** Strips leading and trailing whitespace via `v.strip()`, and asserts that the remaining string is not empty.
* **Why it is needed:**
  * **The "Spacebar Exploit":** A student could bypass minimum length rules by typing 10 consecutive spacebar characters `"          "`. A raw length check counts 10 characters and allows it through!
  * Stripping whitespace before checking lengths guarantees that every submission contains actual text characters.

---

### Item 3: Client Submission Payload Schema (`TicketCreate`)
* **What it is:** The exact Pydantic schema used by the `POST /api/v1/tickets` endpoint to parse and validate incoming student requests.
* **Inheritance:** Inherits directly from `TicketBase`: `class TicketCreate(TicketBase): pass`.
* **Why it is needed:**
  * Represents the contract of what the student is permitted to supply upon submission.
  * Notice that fields like `status`, `tracking_code`, `department_id`, and `created_at` are **completely absent** from `TicketCreate`. A student is not allowed to choose their own tracking code or mark their ticket as `RESOLVED` on submission!

---

### Item 4: Administrative Status Update Schema (`TicketUpdate`)
* **What it is:** The Pydantic schema used by staff endpoints (`PATCH /api/v1/tickets/{id}/status`) to update a complaint during repair work.
* **Attributes & Constraints:**
  * `status`: Optional string (defaulting to `None`), representing the new lifecycle state (`SUBMITTED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`).
  * `resolution_notes`: Optional string (defaulting to `None`, max length 500), recording technician work notes.
* **Why it is needed:**
  * All fields are optional so that staff can update just the status, just the notes, or both simultaneously without having to resend the entire ticket payload.

---

### Item 5: Public Complaint Response Schema (`TicketResponse`)
* **What it is:** The comprehensive Pydantic schema that defines the JSON structure returned to web clients when tickets are created, queried, or listed.
* **Inheritance:** Inherits from `TicketBase`.
* **Additional Attributes:**
  * `id`: Integer (internal primary key).
  * `tracking_code`: String (public identifier, e.g. `"TICK-8F2D"`).
  * `department_id`: Optional integer (assigned department).
  * `assigned_team`: Optional string (assigned maintenance squad).
  * `priority`: String (urgency priority, e.g. `"MEDIUM"`).
  * `status`: String (current state, e.g. `"SUBMITTED"`).
  * `sla_deadline`: Optional datetime (resolution deadline).
  * `created_at`: Datetime (UTC creation timestamp).
  * `updated_at`: Datetime (UTC last update timestamp).
  * `resolved_at`: Optional datetime (completion timestamp).
  * `resolution_notes`: Optional string (technician closure explanation).
* **Configuration:** `model_config = ConfigDict(from_attributes=True)`.
* **Why it is needed:**
  * Guarantees that the React frontend receives an identical, predictable data structure across all ticket endpoints.
  * `from_attributes = True` allows Pydantic to read directly from SQLAlchemy ORM model instances.

---

# 3. Component Life-Cycle: Input, Process, Output

| Stage | What Happens Behind the Scenes |
| :--- | :--- |
| **INPUT** | Raw JSON text from an HTTP request body (e.g. `{"title": " Fan broken ", "description": "Sparks flying from ceiling fan", "location": "Room 204"}`). |
| **PROCESS** | 1. FastAPI intercepts the JSON and passes the raw dictionary into `TicketCreate`.<br>2. Pydantic’s core engine validates types (`str`).<br>3. The `@field_validator` runs: `v.strip()` trims leading/trailing spaces from `" Fan broken "`.<br>4. Boundary checks execute: asserts length $\ge 5$ and $\le 150$.<br>5. If any check fails, Pydantic halts and returns an HTTP 422 JSON response with error details.<br>6. If all checks pass, Pydantic instantiates a typed `TicketCreate` object in RAM. |
| **OUTPUT** | A validated, sanitized `TicketCreate` object ready for service layer processing. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. What Must Stay Exact

### 🟢 Safe to Modify & Customize (Your Team's Creative Freedom):
* **Adjusting Text Length Bounds:** You can modify the length constraints to suit institutional policies (e.g. changing description max length from 1000 to 2000 characters, or title min length from 5 to 3).
* **Adding Extra Input Fields:** You can add optional fields to `TicketBase` (e.g. `contact_phone: Optional[str] = None` or `student_email: Optional[str] = None`).
* **Custom Error Messages:** You can customize the error strings raised inside `@field_validator` to provide friendlier instructions to students.
* **Adding Allowed Status Enums:** You can introduce a Python `Enum` class for `status` to strictly enforce permitted state strings (`SUBMITTED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`).

### 🔴 Strict Non-Negotiables (Must Remain Exact Across the Team):
* **Class Names:** Must stay `TicketBase`, `TicketCreate`, `TicketUpdate`, and `TicketResponse`. Route endpoints and test suites explicitly import these identifiers.
* **Core Attribute Names:** The attributes `title`, `description`, `location`, `status`, `tracking_code`, and `resolution_notes` must not be renamed (do not change `title` to `subject` or `location` to `room`). Changing attribute names breaks the contract between the frontend, API, and database.
* **The ORM Bridge (`from_attributes = True`):** `TicketResponse` must define `model_config = ConfigDict(from_attributes=True)`. In Pydantic V2, omitting this configuration causes a fatal error whenever an endpoint attempts to return a SQLAlchemy ORM object.
* **File Location (`backend/app/schemas/ticket.py`):** The module must reside precisely at this path.

---

# 5. Advanced Python Concepts Explained (OOP & Architecture)

Since you already understand programming fundamentals like loops, conditions, and basic variables, here is an exhaustive, first-principles breakdown of the Object-Oriented Programming (OOP) and software architecture concepts that drive this file:

---

### 1. Pydantic V2 Architecture: Metaclasses and Rust Core Validation
How does Pydantic enforce data types at runtime when normal Python simply ignores type hints?

* **Python's Native Type Hint Passivity:**
  * In standard Python, writing `def add(x: int): pass` is purely decorative. If you pass `add("hello")`, Python executes without complaint. Native Python does not enforce type hints at runtime.
* **Pydantic's Metaclass Magic:**
  * When a class inherits from `BaseModel`, Pydantic uses a custom **Metaclass** (`ModelMetaclass`).
  * As Python parses the class definition in RAM, the metaclass intercepts the class attributes. It reads the type hints (`title: str`, `Field(min_length=5)`) and extracts their metadata.
* **The `pydantic-core` Rust Engine:**
  * In Pydantic V2, validation logic is not written in slow Python loops; it compiles into pre-compiled binary Rust code (`pydantic-core`).
  * When data enters `TicketCreate(**data)`, Pydantic passes the dictionary directly to the compiled Rust engine. Rust checks memory byte-lengths, verifies string encodings, and strips whitespace at lightning speed (10x–50x faster than pure Python).

---

### 2. Schema Inheritance & Specialized Interface Segregation
Why don't we use a single `TicketSchema` class for both incoming submissions and outgoing responses?

* **The Interface Segregation Principle (ISP):**
  * In software architecture, clients should not be forced to depend on interfaces they do not use.
* **The Risk of a Single Combined Schema:**
  * If we used one schema containing `id`, `tracking_code`, `title`, and `status`:
    * When a student submits a complaint, `id` and `tracking_code` do not exist yet! We would have to mark them as `Optional[int] = None`.
    * But if they are optional, a malicious student could craft an HTTP request containing `{"id": 999, "status": "RESOLVED"}` and potentially manipulate system state.
* **Inheritance Hierarchy Solution:**
  * `TicketBase`: Defines only what is common to all representations (`title`, `description`, `location`).
  * `TicketCreate(TicketBase)`: Contains *only* what the student is authorized to send.
  * `TicketResponse(TicketBase)`: Extends the base by adding server-generated properties (`id`, `tracking_code`, `status`, `created_at`).
  * This guarantees strict data boundaries and total type safety at compile time and runtime.

---

### 3. Decorator Mechanics: Pydantic Field Validators (`@field_validator`)
What actually happens inside Python when you prefix a method with `@field_validator`?

* **The Decorator Protocol:**
  * In Python, a **Decorator** is a higher-order function that takes a function as an argument and returns a replacement or modified function:
    `@decorator`
    `def my_func(): pass`
    is mathematically equivalent to:
    `my_func = decorator(my_func)`
* **Pydantic's Validator Registration:**
  * When you write `@field_validator("title", "description", "location")`, Pydantic intercepts the validator function and stores a reference to it in the model's internal validator registry.
  * During instantiation, Pydantic passes the raw field value `v` into your function.
  * Your function returns the transformed value (e.g. `v.strip()`). If the value violates business rules (e.g. it is empty after trimming), raising a `ValueError` causes Pydantic to catch the error, format it with the field name, and return a clean HTTP 422 JSON payload to the user.

---

### 4. Reading ORM Models via Descriptors (`from_attributes = True`)
Why is `ConfigDict(from_attributes=True)` required to serialize SQLAlchemy database objects?

* **Dictionary Subscripting vs. Attribute Dereferencing:**
  * Standard JSON serializes standard Python dictionaries: `my_dict["tracking_code"]`.
  * However, SQLAlchemy database rows are **not** dictionaries! They are custom class instances (`Ticket`), and their fields are accessed via attribute dot notation: `ticket_instance.tracking_code`.
  * In basic Python, if you pass an ORM instance to a dictionary serializer, Python crashes with:
    `TypeError: 'Ticket' object is not subscriptable`
* **How `from_attributes = True` Bridges the Gap:**
  * Setting `from_attributes = True` instructs Pydantic to change its data extraction strategy.
  * Instead of evaluating `obj["tracking_code"]`, Pydantic evaluates `getattr(obj, "tracking_code")`.
  * Python's descriptor protocol on the SQLAlchemy model executes, retrieves the database value from memory, and hands it to Pydantic for clean JSON serialization.

---

# 6. Definition of Done: How to Verify This File Is Complete

This component is 100% complete and verified when:

1. **File Existence:**
   * The Python module exists precisely at `backend/app/schemas/ticket.py`.
2. **Schema Class Declarations:**
   * `TicketBase`, `TicketCreate`, `TicketUpdate`, and `TicketResponse` are defined and exported.
   * `TicketResponse` includes `model_config = ConfigDict(from_attributes=True)`.
3. **Boundary & Validation Enforcement:**
   * Creating a `TicketCreate` with a 4-character title raises a validation error.
   * Creating a `TicketCreate` with trailing spaces automatically strips the whitespace.
4. **Programmatic Verification:**
   * Executing the following inline terminal verification command:
     `python -c "from app.schemas.ticket import TicketCreate, TicketResponse; t = TicketCreate(title='  Valid Title  ', description='Valid description with enough characters', location='Room 101'); assert t.title == 'Valid Title'; print('Ticket Schemas OK: Validation and Trimming Verified')"`
     succeeds cleanly, printing `Ticket Schemas OK: Validation and Trimming Verified`.
