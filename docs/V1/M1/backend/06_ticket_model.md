# Module M1 - File 06: Complaint Tickets Master Model
## Target File: `backend/app/models/ticket.py`
### Execution Track: Phase 2 (Can be built in parallel with File 05 once File 04 is complete)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In enterprise ticketing and service desk architectures (such as ServiceNow, Zendesk, and Jira Service Management), `ticket.py` defines the **Central Transactional Domain Entity** (`Ticket`). It represents the core business object of the entire platform—capturing every complaint submitted by students and tracking its complete lifecycle from intake and AI routing to squad dispatch, SLA deadline monitoring, and final resolution.

### Standard Industry Role & Real-World Use Cases
In professional workflow automation systems, `Ticket` standardly fulfills five foundational roles:

1. **The Core Transactional Record (State Machine):**
   * Standardly acts as the central state machine entity.
   * Tracks the complaint as it transitions across formalized operational phases: `SUBMITTED` (logged by student) ➔ `ASSIGNED` (routed to department/team) ➔ `IN_PROGRESS` (technician on site) ➔ `RESOLVED` (repair completed) ➔ `CLOSED` (verified by complainant).
2. **Dual-Key Architecture for Public Privacy & Performance:**
   * Standardly implements the enterprise **Dual-Key Pattern**:
     * An internal integer primary key (`id`) used exclusively by the database engine for high-speed indexing, B-tree traversal, and foreign key joins.
     * A public, non-sequential tracking code (`tracking_code`, e.g. `TICK-2026-A1B2`) exposed to students in URLs and notifications, strictly preventing Insecure Direct Object Reference (IDOR) enumeration attacks.
3. **Automated SLA Deadline & Compliance Tracking:**
   * Stores the calculated resolution deadline (`sla_deadline`) based on urgency priority (`LOW`, `MEDIUM`, `HIGH`, `EMERGENCY`).
   * Allows background cron jobs and monitoring services to detect overdue repairs, automatically trigger escalation alerts to campus directors, and calculate monthly SLA compliance rates.
4. **Comprehensive Repair Audit Trails:**
   * Automatically captures immutable creation timestamps (`created_at`), dynamic modification timestamps (`updated_at`), completion timestamps (`resolved_at`), and technician closure notes (`resolution_notes`).
   * Provides the historical data foundation required for facility audits, equipment failure trend analysis, and technician accountability.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our campus complaint automation platform, our 5-student engineering team specifically uses `ticket.py` for four concrete operational functions:

1. **The Core Grievance Record for Campus Maintenance:**
   * Represents every physical issue reported by students and faculty across academic blocks, laboratories, cafeterias, and residential hostels (e.g., broken electrical switchboards, leaking bathroom pipes, damaged laboratory desks, or dormitory Wi-Fi drops).
   * Holds the complete narrative explanation, physical campus coordinates (`location = "Hostel Block B, Room 204"`), and urgency level.
2. **Student Tracking Codes for Privacy (`tracking_code`):**
   * Generates clean public tracking identifiers (such as `TICK-2026-A1B2`) so students can check the live progress of their repairs on mobile or web without needing to log in with passwords.
   * Protects student privacy by strictly preventing other users from guessing ticket numbers or scraping confidential complaint data.
3. **Automated Lifecycle & SLA Monitoring Across 5 Stages:**
   * Drives complaints across our 5 system states: `SUBMITTED` ➔ `ASSIGNED` ➔ `IN_PROGRESS` ➔ `RESOLVED` ➔ `CLOSED`.
   * Evaluates priority levels (`LOW`, `MEDIUM`, `HIGH`, `EMERGENCY`) and calculates expected completion times (`sla_deadline`) so our system can detect overdue repairs and notify maintenance supervisors automatically.
4. **Technician Dispatch Logs & Audit Trails:**
   * Records which campus department (`department_id`) and field maintenance squad (`assigned_team = "Hostel Wiring Squad"`) is responsible for the fix.
   * Stores exact UTC timestamps (`created_at`, `updated_at`, `resolved_at`) and final technician work summaries (`resolution_notes`), creating an immutable record of campus maintenance history.

### How Other Components Standardly Interact with This File
Across the platform, almost every major subsystem interacts directly with `Ticket`:
* **Student Submission API (Module M2):** Instantiates and saves new tickets:
  `new_ticket = Ticket(title=..., description=..., location=..., tracking_code=generate_code())`
* **AI Routing & Classification Engine (Module M2/V2):** Analyzes the ticket description and updates:
  `ticket.department_id = predicted_dept.id; ticket.priority = predicted_priority; ticket.sla_deadline = calculate_sla(predicted_priority)`
* **Technician Dispatch API (Module M3):** Assigns a squad and updates status:
  `ticket.assigned_team = "Hostel Wiring Squad"; ticket.status = "ASSIGNED"`
* **Background SLA Monitor:** Continuously queries:
  `overdue = db.query(Ticket).filter(Ticket.status != "RESOLVED", Ticket.sla_deadline < datetime.now(timezone.utc)).all()`
* **Resolution Endpoint:** Technicians finalize repairs by logging notes and timestamps:
  `ticket.status = "RESOLVED"; ticket.resolved_at = datetime.now(timezone.utc); ticket.resolution_notes = "Replaced circuit breaker"`

### The Core Problem It Solves & Why It Exists
* **The Additive Architecture Rule:** Altering tables in production SQLite databases is destructive and complex. By declaring all 14 foundational lifecycle, priority, SLA, and audit fields up front, the schema supports future AI routing and dispatch modules without requiring database rewrites.
* **IDOR Security Protection:** Exposing sequential database IDs (`/tickets/1`) allows malicious actors to scrape confidential student reports. Public tracking codes ensure privacy.
* **Deterministic SLA Arithmetic:** Using timezone-aware UTC timestamps prevents time-shift calculation errors across server environments.

---

# 2. What Must Be in This File & Why Each Item Is Needed

To be complete, this component must define, configure, and establish the following sixteen essential attributes and relationships:

---

### Item 1: Physical Table Name Declaration (`__tablename__ = "tickets"`)
* **What it is:** A reserved class attribute specifying that this model maps to the physical database table named `tickets`.
* **Why it is needed:** Establishes the physical table identity in SQLite storage where all complaint records are saved.

---

### Item 2: Internal Primary Key ID (`id`)
* **What it is:** An auto-incrementing integer column designated as the table's Primary Key and indexed.
* **Data Type:** Integer (`Integer`).
* **Constraints:** `primary_key=True`, `index=True`.
* **Why it is needed:**
  * Provides a compact, high-speed numeric surrogate key used by the database engine for internal B-tree indexing, sorting, and foreign key joins.

---

### Item 3: Public Human-Readable Tracking Code (`tracking_code`)
* **What it is:** A unique, formatted string identifier (e.g. `"TICK-2026-A1B2"`), non-nullable and indexed.
* **Data Type:** String (`String(50)`).
* **Constraints:** `unique=True`, `nullable=False`, `index=True`.
* **Why it is needed:**
  * **IDOR Protection:** Decouples public URLs from internal sequential IDs, preventing malicious users from guessing other students' ticket URLs.
  * **Student Tracking:** Provides students with a memorable, professional reference code to query complaint status on web or mobile interfaces.
  * **B-Tree Indexing:** Indexing ensures that querying a ticket by its tracking code takes $O(\log N)$ logarithmic time.

---

### Item 4: Complaint Title (`title`)
* **What it is:** A concise text summary of the issue (up to 150 characters), non-nullable.
* **Data Type:** String (`String(150)`).
* **Constraints:** `nullable=False`.
* **Why it is needed:**
  * Displayed in administrative summary dashboards, technician notification lists, and mobile alert previews.
  * Marked non-nullable because every ticket must have a recognizable heading.

---

### Item 5: Detailed Narrative Description (`description`)
* **What it is:** An unbounded text column storing the complete, detailed narrative submitted by the student, non-nullable.
* **Data Type:** Text (`Text`).
* **Constraints:** `nullable=False`.
* **Why it is needed:**
  * Supplies the full physical context of the problem for technicians (e.g., "The ceiling fan in room 302 makes a loud grinding noise, sparks periodically, and does not rotate at high speed").
  * Serves as the primary input for future Natural Language Processing (NLP) and AI classification models to evaluate category and urgency.

---

### Item 6: Physical Campus Location (`location`)
* **What it is:** A text column (up to 100 characters) specifying the physical campus room, floor, or building, non-nullable.
* **Data Type:** String (`String(100)`).
* **Constraints:** `nullable=False`.
* **Why it is needed:**
  * Directs maintenance personnel to the physical site of the malfunction (e.g., `"Hostel Block 1, Room 204"` or `"Academic Complex, Lab 3"`).

---

### Item 7: Assigned Department Link (`department_id`)
* **What it is:** An integer column enforcing a Foreign Key constraint linking to `departments.id`, marked as indexed and explicitly nullable.
* **Data Type:** Integer (`Integer`).
* **Constraints:** `ForeignKey("departments.id")`, `nullable=True`, `index=True`.
* **Why it is needed:**
  * Anchors the complaint to the governing campus department responsible for resolving it.
  * **Why It Must Be Nullable (`nullable=True`):** In modern event-driven architectures, complaint submission and complaint routing are separate steps. When a student clicks "Submit", the ticket is initially saved with `department_id = None`. The classification engine then inspects the text and updates the department. If this column were `nullable=False`, initial ticket submission would crash immediately!

---

### Item 8: Assigned Maintenance Squad (`assigned_team`)
* **What it is:** An optional text column storing the name or identifier of the specific technician squad dispatched to the job.
* **Data Type:** String (`String(100)`).
* **Constraints:** `nullable=True`.
* **Why it is needed:**
  * Tracks which field crew is handling the physical repair. Marked nullable because team dispatch occurs after initial departmental routing.

---

### Item 9: Urgency Priority Level (`priority`)
* **What it is:** A categorical string attribute with four standardized levels (`LOW`, `MEDIUM`, `HIGH`, `EMERGENCY`), defaulting to `MEDIUM`, non-nullable.
* **Data Type:** String (`String(20)`).
* **Constraints:** `default="MEDIUM"`, `nullable=False`.
* **Why it is needed:**
  * Categorizes urgency and directly drives the calculation of SLA resolution deadlines (e.g. EMERGENCY = 2 hours, LOW = 72 hours).

---

### Item 10: Lifecycle Workflow Status (`status`)
* **What it is:** A categorical string tracking the complaint's progression through its operational workflow stages (`SUBMITTED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`), defaulting to `SUBMITTED`, indexed, and non-nullable.
* **Data Type:** String (`String(20)`).
* **Constraints:** `default="SUBMITTED"`, `nullable=False`, `index=True`.
* **Why it is needed:**
  * Represents the state of the ticket within the campus resolution state machine.
  * Indexing allows administrative dashboards to filter thousands of tickets by status (e.g. `status == "SUBMITTED"`) in microseconds.

---

### Item 11: Target SLA Resolution Deadline (`sla_deadline`)
* **What it is:** An optional UTC datetime timestamp representing the calculated deadline by which the issue must be resolved.
* **Data Type:** DateTime (`DateTime(timezone=True)`).
* **Constraints:** `nullable=True`.
* **Why it is needed:**
  * Allows automated background monitoring tasks to detect overdue complaints, escalate stalled tickets to senior campus directors, and compute institutional SLA compliance rates.

---

### Item 12: Creation Audit Timestamp (`created_at`)
* **What it is:** An immutable UTC datetime timestamp automatically populated at the exact millisecond the ticket is inserted, non-nullable.
* **Data Type:** DateTime (`DateTime(timezone=True)`).
* **Constraints:** `default=lambda: datetime.now(timezone.utc)`, `nullable=False`.
* **Why it is needed:**
  * Provides the authoritative baseline timestamp for all SLA duration calculations, sorting order in complaint feeds, and audit trail records.

---

### Item 13: Last Updated Audit Timestamp (`updated_at`)
* **What it is:** A UTC datetime timestamp that automatically refreshes whenever any attribute on the ticket is modified, non-nullable.
* **Data Type:** DateTime (`DateTime(timezone=True)`).
* **Constraints:** `default=lambda: datetime.now(timezone.utc)`, `onupdate=lambda: datetime.now(timezone.utc)`, `nullable=False`.
* **Why it is needed:**
  * Guarantees an unambiguous, automated audit record of when the complaint was last modified, reassigned, or had its status updated.

---

### Item 14: Resolution Timestamp (`resolved_at`)
* **What it is:** An optional UTC datetime timestamp populated at the moment the ticket status transitions to `RESOLVED`.
* **Data Type:** DateTime (`DateTime(timezone=True)`).
* **Constraints:** `nullable=True`.
* **Why it is needed:**
  * Allows analytics systems to calculate the exact turnaround time ($T_{resolved} - T_{created}$) for performance benchmarks.

---

### Item 15: Resolution Notes (`resolution_notes`)
* **What it is:** An optional long-text column documenting the physical repairs performed by technicians.
* **Data Type:** Text (`Text`).
* **Constraints:** `nullable=True`.
* **Why it is needed:**
  * Records the technician's explanation of what was fixed (e.g., "Replaced burnt 16A wall socket and restored circuit breaker in Substation 2"), providing closure transparency to the student.

---

### Item 16: Department Navigation Relationship (`department`)
* **What it is:** A bidirectional object-relational relationship linking the ticket back to its parent `Department` model object.
* **ORM Configuration:** `relationship("Department", back_populates="tickets")`.
* **Why it is needed:**
  * Enables any Python function holding a ticket object to read its parent department's details directly via dot notation (`my_ticket.department.name`) without manual SQL joins.

---

# 3. Component Life-Cycle: Input, Process, Output

| Stage | What Happens Behind the Scenes |
| :--- | :--- |
| **INPUT** | 1. The master `Base` class imported from `app.db.base`.<br>2. Column types, constraints, and datetime utilities imported from `sqlalchemy` and standard library `datetime`. |
| **PROCESS** | 1. Python evaluates `class Ticket(Base):`.<br>2. SQLAlchemy declarative metaclass constructs the 14-column schema under `__tablename__ = "tickets"`.<br>3. Primary keys, unique constraints, and B-tree indexes are attached to `id`, `tracking_code`, `status`, and `department_id`.<br>4. Dynamic callable lambdas are registered for `created_at` and `updated_at`.<br>5. Registers the completed schema into `Base.metadata`. |
| **OUTPUT** | An exported `Ticket` ORM model class representing both the database table schema and the Python object factory, ready for ticket intake, routing, and lifecycle queries. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. What Must Stay Exact

### 🟢 Safe to Modify & Customize (Your Team's Creative Freedom):
* **Adding Student Contact Information:** You can add optional, nullable columns to store student details (e.g., `student_email = Column(String(100), nullable=True)` or `student_phone = Column(String(20), nullable=True)`). Adding nullable columns is completely safe.
* **Adding Media Attachments:** You can add a column `attachment_url = Column(String(255), nullable=True)` to store image URLs of broken equipment.
* **Adjusting Default Priority:** If your team prefers all incoming complaints to default to `"LOW"` instead of `"MEDIUM"`, you can adjust the column's default setting.
* **Adding Custom Class Methods:** You can add helper functions inside `class Ticket` (e.g., a method `is_overdue(self)` that compares `self.sla_deadline` with the current time).

### 🔴 Strict Non-Negotiables (Must Remain Exact Across the Team):
* **The Physical Table Name (`tickets`):** Must stay `__tablename__ = "tickets"`.
* **The Core 14 Column Names (`id`, `tracking_code`, `title`, `description`, `location`, `department_id`, `assigned_team`, `priority`, `status`, `sla_deadline`, `created_at`, `updated_at`, `resolved_at`, `resolution_notes`):** Do NOT rename any of these columns (e.g. do not rename `tracking_code` to `code` or `department_id` to `dept_id`). Future API schemas, AI routing scripts, and verification test suites explicitly expect these exact column names.
* **The Nullable Setting on `department_id` (`nullable=True`):** Do NOT change this to `nullable=False`. During complaint intake, tickets are created before automated classification runs; making this column mandatory will crash complaint submission.
* **The Model Class Name (`Ticket`):** Must remain `class Ticket(Base):`.
* **The File Location (`backend/app/models/ticket.py`):** The file must live precisely at this path.

---

# 5. Advanced Python Concepts Explained (OOP & Architecture)

Since you already understand programming fundamentals like loops, conditions, and basic variables, here is an exhaustive, first-principles breakdown of the Object-Oriented Programming (OOP) and software architecture concepts that drive this file:

---

### 1. First-Class Functions, Callables, and Deferred Execution with `lambda`
Notice how timestamps are configured on `created_at` and `updated_at`:
`default=lambda: datetime.now(timezone.utc)`
Why do we use a `lambda` here instead of simply writing `default=datetime.now(timezone.utc)`?

* **Functions as First-Class Objects in Python:**
  * In Python, functions are first-class values, exactly like integers or strings. You can pass a function itself as an argument into another function without calling it.
* **The Catastrophic Bug of Immediate Evaluation (`()`):**
  * When Python imports `ticket.py`, it executes the class definition **once** when the server boots up (e.g. at 9:00:00 AM on Monday).
  * If you write `default=datetime.now()`, the parentheses `()` instruct Python to call the function immediately at import time. The resulting timestamp (Monday 9:00:00 AM) is permanently baked into the column definition in memory.
  * Every single ticket created on Monday, Tuesday, or next month would receive that exact same 9:00:00 AM timestamp!
* **Deferred Execution via Callable Lambdas:**
  * A `lambda` is an anonymous function—a package of executable code that has not been called yet.
  * Writing `lambda: datetime.now(timezone.utc)` hands SQLAlchemy a **Callable Reference** (a pointer to code).
  * SQLAlchemy stores this pointer. Whenever a new `Ticket` object is created and flushed to the database, SQLAlchemy invokes the callable at that exact millisecond, producing the true current time.

---

### 2. Unit of Work Lifecycle Event Triggers (`onupdate`)
How does `updated_at` automatically refresh its timestamp without requiring developers to manually write update lines in every API route handler?

* **SQLAlchemy's Unit of Work State Tracker:**
  * Inside a session, SQLAlchemy tracks every model instance across four states:
    1. **Transient:** Newly created in Python RAM, not yet associated with a database session.
    2. **Pending:** Added to a session, awaiting database write.
    3. **Persistent:** Synchronized with an existing row on disk.
    4. **Dirty:** An existing persistent object whose attributes have been modified in RAM.
* **The `onupdate` Event Trigger:**
  * When you modify an attribute on an existing ticket (e.g. `ticket.status = "IN_PROGRESS"`), SQLAlchemy’s descriptor marks the ticket object as "dirty".
  * When `db.commit()` is called, SQLAlchemy inspects all dirty objects. It detects that `updated_at` has an `onupdate` callable hook registered.
  * SQLAlchemy automatically invokes the lambda, stamps the new timestamp into `updated_at`, and appends the updated column to the generated SQL `UPDATE` statement. This keeps audit trails 100% automated and immune to developer forgetfulness.

---

### 3. Timezone-Aware vs. Naive Datetime Objects in Python
Notice that timestamps explicitly use `datetime.now(timezone.utc)` rather than plain `datetime.now()`.

* **Naive Datetimes (The Root of Time Bugs):**
  * A **Naive Datetime** object in Python holds only numbers (year, month, day, hour, minute) with no timezone context.
  * If a server running in New York saves a naive timestamp at 3:00 PM, and a developer running in India queries that timestamp, the computer cannot determine whether 3:00 PM was EST, UTC, or IST.
  * Comparing naive datetimes with aware datetimes raises a `TypeError: can't compare offset-naive and offset-aware datetimes`.
* **Aware Datetimes (`timezone.utc`):**
  * An **Aware Datetime** explicitly attaches a timezone reference object (`tzinfo=timezone.utc`).
  * Coordinated Universal Time (UTC) is the global, unambiguous scientific time standard. It does not observe Daylight Saving Time shifts.
  * Standardizing on UTC across the entire database ensures that calculating remaining SLA durations ($T_{deadline} - T_{current}$) is mathematically deterministic across all servers and client browsers globally.

---

### 4. Insecure Direct Object References (IDOR) & Public Token Architecture
Why does this model maintain both an integer `id` and a string `tracking_code`?

* **Internal Efficiency vs. External Security:**
  * Relational database engines are optimized for numeric integers: comparing two integers takes 1 CPU cycle, and integer B-trees are highly compact. Therefore, internal foreign keys and database joins should always use integer primary keys (`id`).
  * However, exposing sequential numeric IDs to public users creates severe security vulnerabilities: anyone can scrape tickets by looping through numbers `1..10000`.
  * By generating a randomized, formatted public string (`tracking_code = "TICK-2026-A1B2"`), the application achieves the best of both worlds: maximum database engine performance internally, and complete IDOR protection for students externally.

---

# 6. Definition of Done: How to Verify This File Is Complete

This component is 100% complete and verified when:

1. **File Existence:**
   * The Python module exists precisely at `backend/app/models/ticket.py`.
2. **Model Class Definition:**
   * `Ticket` inherits directly from `Base` imported from `app.db.base`.
   * `__tablename__` is set explicitly to `"tickets"`.
3. **Column & Constraint Specifications:**
   * All 14 columns (`id`, `tracking_code`, `title`, `description`, `location`, `department_id`, `assigned_team`, `priority`, `status`, `sla_deadline`, `created_at`, `updated_at`, `resolved_at`, `resolution_notes`) are declared with proper types and nullability rules.
   * `department_id` is a Foreign Key to `departments.id` and is explicitly `nullable=True`.
   * Indexes are configured on `id`, `tracking_code`, `status`, and `department_id`.
   * Creation and update timestamps utilize callable UTC lambdas.
4. **Relational Bridges:**
   * `department`: Relationship targeting `"Department"` with bidirectional synchronization (`back_populates="tickets"`).
5. **Programmatic Verification:**
   * Importing `Ticket` from `app.models.ticket` in an isolated terminal session succeeds cleanly.
   * Inspecting `Ticket.__table__.columns.keys()` verifies that all 14 columns are present in the table schema without errors.
