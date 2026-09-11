# Module M1 - File 04: Campus Departments Model
## Target File: `backend/app/models/department.py`
### Execution Track: Phase 2 (Requires File 03)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In campus enterprise systems and facilities management platforms, `department.py` defines the **Master Organizational Domain Entity** (`Department`). It models the high-level operational units of an institution (such as Electrical, Plumbing, IT Support, Carpentry, Sanitation, and Hostel Maintenance) that bear administrative and operational accountability for physical plant maintenance.

### Standard Industry Role & Real-World Use Cases
In modern service management and ticketing architectures, `Department` standardly fulfills four core responsibilities:

1. **The Master Lookup Entity (Taxonomy Anchor):**
   * Standardly establishes the official catalog of operational categories across the university.
   * Eliminates unstructured free-text categorization, providing standardized names and IDs that both frontend dropdown menus and backend dispatch engines rely upon.
2. **The Top-Level Relational Parent:**
   * Serves as the one-to-many ($1:N$) relational root for all operational maintenance squads (`teams`) and all student complaints (`tickets`).
   * By anchoring child entities to an immutable integer primary key (`id`), the system guarantees that squads and tickets are permanently linked to a governing administrative unit.
3. **Operational Soft-Decommissioning (`is_active`):**
   * Implements the enterprise **Soft Delete** pattern.
   * If a department temporarily halts intake or is reorganized, administrators set `is_active = False`. The automated ticket routing system immediately skips that department, while all historical complaint records, SLA metrics, and technician audit trails remain 100% intact.
4. **Context Corpus for Automated & AI Routing:**
   * The `description` field standardly stores the operational scope of what the department fixes.
   * In automated routing and AI-assisted triage, this text serves as the reference domain knowledge used by keyword matchers or machine learning vector embeddings to classify complaints.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our campus complaint automation platform, our 5-student engineering team specifically uses `department.py` for four concrete operational functions:

1. **Representing Our 6 Real Campus Facilities Divisions:**
   * Models our 6 foundational campus maintenance departments: Electrical, Plumbing, IT Support, Carpentry, Sanitation, and Hostel Maintenance.
   * Provides the authoritative list that feeds frontend dropdown selectors so students and faculty choose from clean, pre-validated options rather than typing free-form department names.
2. **Top-Level Parent for Our 12 Maintenance Squads (`teams`):**
   * Acts as the relational anchor for all 12 operational maintenance squads across campus (e.g. Electrical owns "Hostel Wiring Squad" and "Substation High-Voltage Team"; IT Support owns "Network & Wi-Fi Squad" and "Lab Hardware Squad").
   * Guarantees that every squad operates under the governing oversight, operational jurisdiction, and service level targets of a recognized campus department.
3. **Primary Classification & Triage Target for Student Complaints (`tickets`):**
   * Every complaint submitted by a student (e.g. "Broken ceiling fan in Hostel Room 304") is categorized and linked directly to a department (`department_id = 1` for Electrical).
   * Enables department supervisors to log in to our dashboard and immediately see all pending, in-progress, and resolved complaints assigned specifically to their division.
4. **Campus Operational Pausing via Soft Deactivation (`is_active`):**
   * Allows facility administrators to set `is_active = False` if a department temporarily halts intake (for instance, during semester breaks or when carpentry contractors are off campus).
   * Ensures our complaint intake and triage engine immediately prevents students from filing new tickets to inactive departments, while keeping all historical tickets, resolution notes, and SLA logs intact in the database.

### How Other Components Standardly Interact with This File
Across the backend architecture, other subsystems interact with `Department` through standard patterns:
* **Complaint Routing Engine:** When a new ticket is classified, the routing service executes:
  `dept = db.query(Department).filter_by(name="Electrical").first()`
  `ticket.department_id = dept.id`
* **Administrative Reporting & Dashboards:** Reporting endpoints query the relationship `department.tickets` to calculate active workloads, average turnaround times, and SLA breach percentages per department.
* **Technician Squad Dispatch:** Squad models link to `Department` via foreign keys, and access parent details via `team.department.name`.

### The Core Problem It Solves & Why It Exists
* **Free-Text Ambiguity:** Unstructured department names lead to variations ("Electrical", "Elec Dept", "ELEC") that break filtering and reporting. A dedicated table enforces exact string uniqueness.
* **Database Normalization (3NF):** Duplicating department descriptions across thousands of ticket rows causes update and deletion anomalies. Storing the department once in a master table ensures a single source of truth.
* **Referential Anchor for Sub-Entities:** Teams and tickets cannot enforce relational integrity without a stable parent foreign key target.

---

# 2. What Must Be in This File & Why Each Item Is Needed

To be complete, this component must define, configure, and establish the following seven essential attributes and relational links:

---

### Item 1: Physical Table Name Declaration (`__tablename__ = "departments"`)
* **What it is:** A reserved class attribute specifying that this Python model maps directly to a physical database table named `departments`.
* **Why it is needed:**
  * **Explicit DDL Naming:** Relational database engines like SQLite require an exact identifier for the table file structure on disk.
  * **Preventing Tooling Inconsistencies:** If `__tablename__` is omitted, some ORMs attempt to automatically guess a table name by converting the class name to lowercase, which can cause subtle discrepancies (such as naming it `department` instead of `departments`). Declaring it explicitly guarantees consistent SQL statements (`CREATE TABLE departments`, `SELECT FROM departments`).
  * **Relational Foreign Key Target:** Files `team.py` and `ticket.py` establish foreign keys targeting `"departments.id"`. The string before the dot must match this table name exactly.

---

### Item 2: Department Unique Identifier (`id`)
* **What it is:** An auto-incrementing integer column designated as the table's Primary Key and marked as indexed.
* **Data Type:** Integer (`Integer`).
* **Constraints:** `primary_key=True`, `index=True`.
* **Why it is needed:**
  * **Primary Key Enforcement:** In relational databases, every row must have a unique identifier that guarantees it can be distinguished from all other rows. A primary key cannot be null and must be unique.
  * **Surrogate Key Stability:** Names of departments can change over time due to campus reorganization, but their numeric `id` remains completely immutable. Child records (teams and tickets) link to `id`, ensuring that updating a department's name never breaks relational links.
  * **B-Tree Indexing for Instant Retrieval:** Marking `index=True` instructs SQLite to build a **B-Tree (Balanced Tree) Index** on this column. Searching for a department by its ID takes logarithmic time ($O(\log N)$) instead of scanning the entire disk table row by row ($O(N)$).

---

### Item 3: Department Official Name (`name`)
* **What it is:** A text column (up to 100 characters) storing the department's title (e.g., `"Electrical"`, `"Plumbing"`), configured with unique and non-nullable constraints and an index.
* **Data Type:** String (`String(100)`).
* **Constraints:** `unique=True`, `nullable=False`, `index=True`.
* **Why it is needed:**
  * **Non-Nullability (`nullable=False`):** Every department record must have a valid title. Preventing null values stops developers or scripts from accidentally inserting blank "ghost" departments into the database.
  * **Unique Constraint (`unique=True`):** The database engine actively prevents duplicate names. If a script attempts to insert a second "Electrical" department, the database rejects the transaction with an `IntegrityError`.
  * **Indexed Querying:** During ticket intake and automated routing, the system frequently looks up departments by name. Indexing this column ensures microsecond search performance.

---

### Item 4: Department Scope Description (`description`)
* **What it is:** An optional, long-text column providing a detailed narrative of the facilities, equipment, and geographical areas managed by this department.
* **Data Type:** Text (`Text` or `String(255)`).
* **Constraints:** `nullable=True`.
* **Why it is needed:**
  * **Administrative Clarity:** Explains the operational boundaries of the department (e.g., "Responsible for academic block power outlets, hostel ceiling fans, water heater wiring, and substation distribution").
  * **Future AI Routing Context:** In Milestone V2, automated routing will feed this description into machine learning classification algorithms to calculate semantic relevance when categorizing student complaints.
  * **Nullable Flexibility:** It is marked as `nullable=True` so that new or minor departments can be registered quickly without requiring an extensive essay on their operational scope.

---

### Item 5: Operational Availability Flag (`is_active`)
* **What it is:** A boolean flag indicating whether the department is currently active and accepting complaint assignments.
* **Data Type:** Boolean (`Boolean`).
* **Constraints:** `default=True`, `nullable=False`.
* **Why it is needed:**
  * **Soft Deletion vs. Hard Deletion:** In enterprise databases, critical master records should almost never be physically deleted (`DELETE FROM departments`). If you delete a department from disk, all historical complaints, SLAs, and performance metrics associated with that department lose their referential integrity and become corrupted.
  * **Operational Toggling:** Setting `is_active = False` (**Soft Deletion**) allows campus administrators to temporarily decommission a department (e.g. during summer renovations) without deleting its historical records. The automated ticket routing system checks this flag and automatically bypasses inactive departments.

---

### Item 6: Maintenance Teams Navigation Relationship (`teams`)
* **What it is:** A bidirectional object-relational relationship linking the department to its child maintenance squads, configured with cascade deletion.
* **ORM Configuration:** `relationship("Team", back_populates="department", cascade="all, delete-orphan")`.
* **Why it is needed:**
  * **Object-Level Navigation:** In pure SQL, fetching the squads under a department requires writing `SELECT * FROM teams WHERE department_id = 1`. With SQLAlchemy's `relationship`, writing `my_dept.teams` in Python automatically executes the query and returns a list of `Team` objects.
  * **Bidirectional Synchronization (`back_populates`):** Links this property to the corresponding `department` property in `Team`, ensuring that in-memory changes on one side are immediately reflected on the other side.
  * **Cascade Deletion (`cascade="all, delete-orphan"`):** If a department record is deleted during automated testing, SQLAlchemy automatically deletes all child maintenance teams associated with it, preventing orphaned teams from remaining in the database.

---

### Item 7: Complaint Tickets Navigation Relationship (`tickets`)
* **What it is:** An object-relational relationship linking the department to all complaint tickets currently assigned to it.
* **ORM Configuration:** `relationship("Ticket", back_populates="department")`.
* **Why it is needed:**
  * **Departmental Workload Inspection:** Allows administrative dashboards and reporting services to immediately access all tickets routed to this department via `my_dept.tickets` without requiring manual SQL join queries.

---

# 3. Component Life-Cycle: Input, Process, Output

| Stage | What Happens Behind the Scenes |
| :--- | :--- |
| **INPUT** | 1. The master `Base` class imported from `app.db.base`.<br>2. Column definition types (`Integer`, `String`, `Boolean`, `Text`) and relational utilities (`relationship`) imported from `sqlalchemy`. |
| **PROCESS** | 1. Python evaluates `class Department(Base):`.<br>2. SQLAlchemy's declarative metaclass intercepts the class definition in RAM.<br>3. It parses `__tablename__`, creates a `Table` schema object, and attaches columns with their constraints (`id` as PK, `name` as Unique/Indexed, `is_active` defaulting to True).<br>4. It registers the completed table schema into `Base.metadata`.<br>5. It sets up property descriptors for `teams` and `tickets` relationships, deferring target class resolution. |
| **OUTPUT** | An exported `Department` ORM model class representing both the database table schema and the Python object factory, ready for model aggregation, database seeding, and ticket routing. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. What Must Stay Exact

### 🟢 Safe to Modify & Customize (Your Team's Creative Freedom):
* **Adding Extra Information Columns:** You can add optional, nullable columns to this table to suit your institution's specific needs (e.g., `office_room_number = Column(String(50), nullable=True)` or `head_of_department_email = Column(String(100), nullable=True)`). Adding nullable columns will never break existing code or seeders.
* **String Length Adjustments:** You can alter the maximum allocated length of text columns (e.g. changing `String(100)` to `String(150)` for names) if departmental titles at your campus are particularly lengthy.
* **Adding Custom Helper Methods:** You can define custom Python methods directly inside `class Department`. For example, a method `active_ticket_count(self)` that loops through `self.tickets` and counts how many tickets are currently in the `IN_PROGRESS` status.

### 🔴 Strict Non-Negotiables (Must Remain Exact Across the Team):
* **The Physical Table Name (`departments`):** Must stay `__tablename__ = "departments"`. Files `team.py` and `ticket.py` explicitly declare foreign keys targeting `"departments.id"`. Changing this table name breaks all relational links across the database.
* **The Primary Key Column Name (`id`):** Must remain `id`. Foreign keys in child tables explicitly point to this column.
* **The Attribute Names (`name`, `description`, `is_active`):** The seeder script (`app/db/seed_data.py`), future API schemas, and test verification scripts explicitly query and assign these attribute names. Renaming `is_active` to `active` or `name` to `dept_name` will cause immediate `AttributeError` crashes.
* **The Class Name (`Department`):** Must remain `class Department(Base):`. The central aggregator `app/models/__init__.py` explicitly imports this class name.
* **The File Location (`backend/app/models/department.py`):** The file must live precisely at this path.

---

# 5. Advanced Python Concepts Explained (OOP & Architecture)

Since you already understand programming fundamentals like loops, conditions, and basic variables, here is an exhaustive, first-principles breakdown of the Object-Oriented Programming (OOP) and software architecture concepts that drive this file:

---

### 1. Dual Role of Classes in ORMs: Schema Definition vs. Object Factory
In standard Python, a class defines a custom composite data type and serves as a constructor for allocating instances in memory. In an enterprise ORM like SQLAlchemy, `Department` plays two completely different architectural roles at different times in the software lifecycle:

* **Role 1: Schema Definition (Import Time):**
  * When Python first imports `department.py`, no database rows exist and no objects are instantiated.
  * During this phase, the class attributes (`id = Column(...)`, `name = Column(...)`) serve as **Declarative Schema Definitions**.
  * SQLAlchemy's metaclass reads these attributes to construct the internal structural representation of the physical SQLite table.
* **Role 2: Row Object Factory (Runtime):**
  * Later, when your application queries the database or creates a new department (`new_dept = Department(name="Electrical")`), the class acts as a standard **Object Factory**.
  * Python allocates a concrete object in RAM. On that specific object, `new_dept.name` is no longer a `Column` definition; it is a live string property holding `"Electrical"` at a specific memory address.

---

### 2. Python's Descriptor Protocol: How `Column` Attributes Intercept Access
In basic Python, writing `obj.x = 5` simply places the number `5` into the object's internal dictionary (`obj.__dict__["x"] = 5`). So how does SQLAlchemy know when a value changes, or how does it convert data types automatically?

* **The Descriptor Protocol:**
  * In advanced Python, any class that defines special methods named `__get__`, `__set__`, or `__delete__` is called a **Descriptor**.
  * The `Column` class in SQLAlchemy is a Descriptor.
* **What Happens During Attribute Access:**
  * When you write `dept.name = "Plumbing"`, Python does not store the string directly. It intercepts the assignment and invokes the descriptor's `__set__` method.
  * The descriptor performs three critical architectural operations:
    1. **Type Coercion & Validation:** It verifies that the assigned value matches the declared column type (e.g. converting a compatible type or rejecting invalid data).
    2. **Dirty Tracking:** It marks the object as "dirty" in the session's Unit of Work tracker, letting the database engine know that this specific field was modified and must be included in the next SQL `UPDATE` statement.
    3. **State Synchronization:** It informs any linked relationships (such as updating foreign key pointers) that a related attribute has changed.

---

### 3. Dunder Configuration Attributes (`__tablename__`)
Identifiers wrapped in double underscores (like `__tablename__`, `__init__`, `__repr__`) are known in Python as **Dunder** (Double Underscore) attributes or special methods.

* **Reserved Metaprogramming Protocol:**
  * Python reserves dunder names for language-level protocols and framework hooks.
  * In SQLAlchemy declarative models, `__tablename__` is a reserved metaprogramming directive.
  * While normal attributes like `name` or `description` represent database columns, SQLAlchemy treats attributes with double underscores as internal configuration directives. When the metaclass builds the table mapping, it extracts the value of `__tablename__` and uses it as the physical name of the SQL table on disk.

---

### 4. Forward String References and Deferred Target Resolution (`relationship("Team", ...)`)
In Object-Oriented Programming, relationships between classes frequently introduce **Circular Dependency Deadlocks**:
* `Department` needs to know about `Team` (to define `department.teams`).
* `Team` needs to know about `Department` (to define `team.department`).
* If you write `relationship(Team)` directly with the unquoted Python identifier `Team`, Python evaluates `Team` immediately. Because `team.py` has not been imported yet, Python halts with a fatal `NameError: name 'Team' is not defined`.
* If you attempt to solve this by importing `Team` at the top of `department.py`, while `team.py` imports `Department`, Python crashes with an `ImportError` due to a circular import loop.

* **The Forward Reference Solution:**
  * SQLAlchemy solves this by permitting **Forward String References**: writing `relationship("Team", ...)` with quotes.
  * When Python reads the string literal `"Team"`, it does not attempt to evaluate an unimported class. It simply stores the string in memory.
  * Later, after all model files across the project have been imported into the central `Base.metadata` catalog, SQLAlchemy triggers a deferred resolution pass. It matches the string `"Team"` to the actual `Team` class registered in the metadata catalog, seamlessly connecting the two classes without circular import errors.

---

# 6. Definition of Done: How to Verify This File Is Complete

This component is 100% complete and verified when:

1. **File Existence:**
   * The Python module exists precisely at `backend/app/models/department.py`.
2. **Model Class Definition:**
   * `Department` inherits directly from `Base` imported from `app.db.base`.
   * `__tablename__` is set explicitly to `"departments"`.
3. **Column & Constraint Specifications:**
   * `id`: Integer, primary key, indexed.
   * `name`: String(100), unique, non-nullable, indexed.
   * `description`: Text, nullable.
   * `is_active`: Boolean, default=True, non-nullable.
4. **Relational Bridges:**
   * `teams`: Relationship targeting `"Team"` with bidirectional synchronization (`back_populates="department"`) and cascade deletion (`cascade="all, delete-orphan"`).
   * `tickets`: Relationship targeting `"Ticket"` with bidirectional synchronization (`back_populates="department"`).
5. **Programmatic Verification:**
   * Importing `Department` from `app.models.department` in an isolated terminal session succeeds cleanly.
   * Inspecting `Department.__table__.columns.keys()` confirms that `id`, `name`, `description`, and `is_active` are registered on the table schema without errors.
