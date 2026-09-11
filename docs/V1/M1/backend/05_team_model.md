# Module M1 - File 05: Maintenance Teams Model
## Target File: `backend/app/models/team.py`
### Execution Track: Phase 2 (Can be built in parallel with File 06 once File 04 is complete)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In Field Service Management (FSM) and enterprise work order dispatch systems, `team.py` defines the **Operational Maintenance Squad Entity** (`Team`). It represents the physical groups of technicians (such as the "Hostel Wiring Squad" or "Academic AC Crew") that execute hands-on repairs under the administrative authority of a governing campus department.

### Standard Industry Role & Real-World Use Cases
In modern dispatch and workforce automation architectures, `Team` standardly fulfills four core responsibilities:

1. **The Operational Workgroup Entity (Execution Layer):**
   * While a department represents administrative domain oversight, a `Team` represents the human operational crew assigned to physical campus zones, specialized equipment categories, or shifts.
   * Provides the structured entity that technicians log into and report under.
2. **The Concrete Dispatch Target:**
   * Serves as the operational destination for complaint dispatch.
   * Once a ticket is routed to a department, the dispatch algorithm queries this table to select an assigned squad based on location, specialization, and availability.
3. **Dynamic Squad Availability Toggling (`is_active`):**
   * Implements real-world shift and availability management.
   * When a squad goes off-duty, transitions to night shifts, or undergoes safety training, administrators toggle `is_active = False`. The automated dispatch engine skips unavailable squads, preventing tickets from languishing unassigned.
4. **Workload Balancing & Performance Analytics:**
   * Allows dispatch algorithms to query the number of open tickets currently assigned to each active squad, routing new complaints to the crew with the lowest queue depth.
   * Enables institutional analytics to track average repair durations and resolution rates per maintenance squad.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our campus complaint automation platform, our 5-student engineering team specifically uses `team.py` for four concrete operational functions:

1. **Representing Our 12 Specialized Field Technician Squads:**
   * Models our 12 operational maintenance crews across campus (e.g., Electrical owns "Hostel Wiring Squad" and "Substation High-Voltage Team"; Plumbing owns "Hostel Pipe Repair Crew" and "Academic Sanitation Unit"; IT Support owns "Network & Wi-Fi Squad" and "Lab Hardware Squad").
   * Connects high-level administrative departments directly to the ground-level technicians who physically inspect, troubleshoot, and fix campus infrastructure.
2. **Automated Dispatch Target in Milestone M3:**
   * When a student complaint is categorized and prioritized, our automated triage engine evaluates squad assignments and assigns the complaint directly to a specific team (e.g. `assigned_team = "Hostel Wiring Squad"`).
   * Allows maintenance technicians to log into their squad-specific dashboard and view only the work orders dispatched to their crew.
3. **Preventing Orphan Squads via Database-Level Foreign Keys (`department_id`):**
   * Enforces `ForeignKey("departments.id", ondelete="CASCADE")` to guarantee that every squad is permanently linked to an existing campus department.
   * If a department is ever removed during testing or database resetting, SQLite automatically cleans up all associated squads, preventing database corruption or orphaned rows.
4. **Shift & Availability Toggling (`is_active`):**
   * Allows facility managers or team leads to toggle a squad's status to `is_active = False` when they are off-shift, attending emergency training, or out of replacement parts.
   * Ensures our dispatch engine skips inactive squads and automatically routes urgent complaints to an alternate available crew.

### How Other Components Standardly Interact with This File
Across the platform, other subsystems interact with `Team` through standard architectural patterns:
* **Automated Ticket Dispatcher (Module M3):** When a ticket is routed to a department, the dispatcher queries:
  `active_teams = db.query(Team).filter_by(department_id=ticket.department_id, is_active=True).all()`
  and assigns the ticket to an available squad.
* **Technician Dashboard Filters:** Technicians log in and filter their active ticket feed by their squad name:
  `my_tickets = db.query(Ticket).filter_by(assigned_team=current_team.name, status="ASSIGNED").all()`
* **Department Model Bridge:** Parent departments access their squads via the in-memory collection `department.teams`.

### The Core Problem It Solves & Why It Exists
* **Conflating Administration with Execution:** Departments do not climb ladders or fix circuit breakers; specific squads do. Separating `departments` from `teams` mirrors real-world organizational hierarchy.
* **Orphan Squads & Integrity Failures:** Without enforced foreign keys, squads could be created pointing to non-existent departments or left stranded when departments are deleted.
* **Routing to Inactive Crews:** Storing team names as raw text prevents the system from verifying whether a squad is currently operational before dispatching emergency repairs.

---

# 2. What Must Be in This File & Why Each Item Is Needed

To be complete, this component must define, configure, and establish the following six essential attributes and relational links:

---

### Item 1: Physical Table Name Declaration (`__tablename__ = "teams"`)
* **What it is:** A reserved class attribute declaring that this Python model maps to the physical database table named `teams`.
* **Why it is needed:**
  * Establishes the exact table identifier in SQLite storage.
  * Ensures that automated table generation routines (`Base.metadata.create_all`) execute `CREATE TABLE teams (...)` cleanly on disk.

---

### Item 2: Team Unique Identifier (`id`)
* **What it is:** An auto-incrementing integer column designated as the Primary Key and indexed.
* **Data Type:** Integer (`Integer`).
* **Constraints:** `primary_key=True`, `index=True`.
* **Why it is needed:**
  * **Guaranteed Uniqueness:** Every maintenance squad in the institution receives an immutable numeric identifier.
  * **Permanent Reference ID:** When tickets are assigned or dispatch logs are audited, the application references this stable ID rather than volatile team names that might be adjusted later.
  * **Indexed Lookup Tree:** Indexing ensures that fetching a squad by its ID takes $O(\log N)$ logarithmic time via SQLite's internal B-Tree index.

---

### Item 3: Parent Department Link (`department_id`)
* **What it is:** An integer column that enforces a database Foreign Key constraint pointing to `departments.id`, configured with cascade deletion, non-nullability, and an index.
* **Data Type:** Integer (`Integer`).
* **Constraints:** `ForeignKey("departments.id", ondelete="CASCADE")`, `nullable=False`, `index=True`.
* **Why it is needed:**
  * **Referential Integrity Enforcement:** A Foreign Key is a database-level rule. If a script attempts to insert a team with `department_id = 999` when department 999 does not exist, the SQLite engine immediately raises an `IntegrityError` and rejects the write.
  * **Non-Nullable Mandatory Parent (`nullable=False`):** A maintenance squad cannot exist in an administrative vacuum; it must be governed by a department. Preventing null values stops orphan squads from being created.
  * **Cascade Deletion (`ondelete="CASCADE"`):** In SQLite, this tells the disk storage engine: *"If a department row is deleted, automatically delete all child team rows that point to that department."* This guarantees that deleting a department never leaves orphaned records stranded in the database.
  * **Foreign Key Indexing (`index=True`):** In relational databases, foreign key columns are frequently used in `WHERE` clauses (e.g. `SELECT * FROM teams WHERE department_id = 1`). Without an index, SQLite would have to scan every single row in the `teams` table (**Full Table Scan**). Indexing the foreign key column makes departmental squad lookups instantaneous.

---

### Item 4: Team Display Name (`name`)
* **What it is:** A text column (up to 100 characters) storing the official title of the maintenance squad (e.g., `"Hostel Wiring Squad"`), non-nullable.
* **Data Type:** String (`String(100)`).
* **Constraints:** `nullable=False`.
* **Why it is needed:**
  * Technicians, dispatchers, and students need a human-readable identifier on work orders, administrative dashboards, and SMS/push notifications.
  * Enforcing `nullable=False` ensures that every team record has an identifiable name.

---

### Item 5: Operational Availability Flag (`is_active`)
* **What it is:** A boolean flag indicating whether the maintenance squad is currently on-duty and available for ticket dispatch.
* **Data Type:** Boolean (`Boolean`).
* **Constraints:** `default=True`, `nullable=False`.
* **Why it is needed:**
  * **Dynamic Dispatch Filtering:** Maintenance squads take scheduled leaves, undergo training, or transition between day and night shifts.
  * When the automated ticket routing engine assigns tickets, it filters squads using `is_active == True`. Setting a squad to inactive safely pauses new ticket assignments to that crew without deleting their historical performance records.

---

### Item 6: Parent Department Navigation Relationship (`department`)
* **What it is:** A bidirectional object-relational relationship linking the team instance directly back to its parent `Department` model object.
* **ORM Configuration:** `relationship("Department", back_populates="teams")`.
* **Why it is needed:**
  * **Object-Oriented Property Access:** Allows any Python function holding a `team` object to immediately read its parent department's properties via dot notation (`my_team.department.name`) without writing a manual SQL query.
  * **Bidirectional Memory Synchronization:** Working in tandem with `Department.teams`, SQLAlchemy keeps both sides of the pointer relationship in sync in computer memory.

---

# 3. Component Life-Cycle: Input, Process, Output

| Stage | What Happens Behind the Scenes |
| :--- | :--- |
| **INPUT** | 1. The master `Base` class imported from `app.db.base`.<br>2. Column types (`Integer`, `String`, `Boolean`), constraints (`ForeignKey`), and relational tools (`relationship`) imported from `sqlalchemy`. |
| **PROCESS** | 1. Python evaluates `class Team(Base):`.<br>2. SQLAlchemy declarative metaclass inspects `__tablename__ = "teams"`.<br>3. It constructs the table schema: binding `id` as primary key, `department_id` as non-nullable foreign key with cascade deletion, `name` as required text, and `is_active` as boolean defaulting to True.<br>4. It establishes a relational bridge back to `Department` using `back_populates="teams"`.<br>5. Registers the completed schema into the central `Base.metadata` catalog. |
| **OUTPUT** | An exported `Team` ORM model class, ready for team seeding, ticket dispatch assignment, and relational queries. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. What Must Stay Exact

### 🟢 Safe to Modify & Customize (Your Team's Creative Freedom):
* **Adding Team Contact & Shift Attributes:** You can add optional, nullable columns to record more details about a squad (e.g., `lead_technician_name = Column(String(100), nullable=True)`, `contact_phone = Column(String(20), nullable=True)`, or `shift_schedule = Column(String(50), nullable=True)`). Adding nullable columns will never break existing code or seed scripts.
* **Adjusting String Limits:** You can increase the maximum character length for team names (e.g. from `String(100)` to `String(150)`).
* **Adding Custom Class Methods:** You can write helper functions inside `class Team`. For example, a method `can_accept_new_tickets(self)` that checks both `self.is_active` and the squad's current open workload.

### 🔴 Strict Non-Negotiables (Must Remain Exact Across the Team):
* **The Physical Table Name (`teams`):** Must stay `__tablename__ = "teams"`.
* **The Primary Key Identifier (`id`):** Must remain `id`.
* **The Foreign Key Column Name & Target (`department_id` pointing to `departments.id`):** Do NOT rename `department_id` to `dept_id` or `parent_department`. The database seeder (`seed_data.py`), dispatch logic, and test suites explicitly query and assign using the attribute name `department_id`.
* **The Foreign Key Cascade Rule (`ondelete="CASCADE"`):** Required to prevent orphaned child squads from remaining in the database if parent records are modified or removed during testing.
* **The Class Name (`Team`):** Must remain `class Team(Base):`. The central aggregator `app/models/__init__.py` explicitly imports this class name.
* **The File Location (`backend/app/models/team.py`):** The file must live precisely at this path.

---

# 5. Advanced Python Concepts Explained (OOP & Architecture)

Since you already understand programming fundamentals like loops, conditions, and basic variables, here is an exhaustive, first-principles breakdown of the Object-Oriented Programming (OOP) and software architecture concepts that drive this file:

---

### 1. Target String Resolution in Foreign Keys (`ForeignKey("departments.id")`)
Notice that the target column `"departments.id"` is passed as a string literal wrapped in quotes, rather than an imported Python variable.

* **The Problem It Solves (Compilation Order Decoupling):**
  * In a modular application, modules are loaded into memory one by one.
  * If `team.py` had to import the actual `Department` class object directly to define the foreign key, and `department.py` imported `Team` to define its relationship, Python would halt with a circular import error.
* **How Metaprogramming Resolves the String:**
  * When SQLAlchemy parses `ForeignKey("departments.id")`, it does not attempt to evaluate the string immediately.
  * Instead, it records the string in the column's configuration metadata.
  * When `Base.metadata.create_all` executes, SQLAlchemy walks through its central catalog of registered tables, looks up the table whose `__tablename__` equals `"departments"`, locates its column named `id`, and binds the foreign key constraint at the C-driver level. This decouples file loading order from relational integrity.

---

### 2. Bidirectional Relational Object Synchronization (`back_populates`)
In basic Python Object-Oriented Programming, if you have two independent objects `team` and `department`, establishing a two-way connection requires manual updates on both sides:
`team.department = department`
`department.teams.append(team)`
If a developer forgets the second line, the objects in memory fall out of sync: the team thinks it belongs to the department, but the department's team list doesn't include the team!

* **How `back_populates` Solves This in RAM:**
  * SQLAlchemy's `relationship(..., back_populates="teams")` uses Python's **Observer Pattern**.
  * When SQLAlchemy loads the `Department` and `Team` classes, it instruments the attributes with special event listeners.
  * The moment you execute `my_team.department = electrical_dept`, SQLAlchemy intercepts the assignment and automatically appends `my_team` to `electrical_dept.teams` in memory.
  * Conversely, if you write `electrical_dept.teams.append(my_team)`, SQLAlchemy automatically sets `my_team.department = electrical_dept`. Both sides of the memory pointer relationship remain 100% synchronized without manual list manipulation.

---

### 3. Python Descriptors and Lazy Loading Protocols
When you work with a `Team` object in Python, how does accessing `my_team.department` actually fetch the parent department from the database?

* **The Descriptor Protocol (`__get__`):**
  * As explained in File 04, attributes declared as `relationship(...)` are implemented using Python's **Descriptor Protocol**.
* **Lazy Loading Mechanics:**
  * When you query a team from SQLite (`team = db.query(Team).first()`), SQLAlchemy only loads the columns from the `teams` table (`id`, `department_id`, `name`, `is_active`). It does not load the parent department immediately.
  * The first time your Python code accesses `team.department`, Python invokes the descriptor's `__get__` method.
  * The descriptor intercepts the read: it checks if the parent `Department` object is already in memory. If not, it transparently emits a SQL query (`SELECT * FROM departments WHERE id = ?`) to SQLite, instantiates the `Department` object, and caches it on the team instance.
  * This is called **Lazy Loading**—delaying database queries until the exact moment data is needed, keeping initial queries fast and lightweight.

---

### 4. Database-Level Cascades vs. ORM-Level Cascades
Notice that this file declares `ondelete="CASCADE"` inside `ForeignKey`, while File 04 declared `cascade="all, delete-orphan"` inside `relationship`. These represent two completely distinct levels of software architecture:

* **Database-Level Cascade (`ondelete="CASCADE"`):**
  * This is an instruction written directly into the SQLite SQL schema on disk.
  * If a raw SQL command deletes a department (`DELETE FROM departments WHERE id = 1`), SQLite's internal C-engine automatically finds all rows in `teams` with `department_id = 1` and deletes them directly on disk, even if Python isn't running.
* **ORM-Level Cascade (`cascade="all, delete-orphan"`):**
  * This is an instruction evaluated in Python RAM by SQLAlchemy's Unit of Work manager.
  * If a Python developer removes a team from a department's list in memory (`electrical_dept.teams.remove(old_team)`), SQLAlchemy recognizes that `old_team` has been orphaned (lost its parent) and automatically stages a database `DELETE` for that orphaned squad when `db.commit()` is called.
  * Using both guarantees complete data integrity whether operations occur through Python ORM code or direct database scripts.

---

# 6. Definition of Done: How to Verify This File Is Complete

This component is 100% complete and verified when:

1. **File Existence:**
   * The Python module exists precisely at `backend/app/models/team.py`.
2. **Model Class Definition:**
   * `Team` inherits directly from `Base` imported from `app.db.base`.
   * `__tablename__` is set explicitly to `"teams"`.
3. **Column & Constraint Specifications:**
   * `id`: Integer, primary key, indexed.
   * `department_id`: Integer, foreign key to `"departments.id"` with `ondelete="CASCADE"`, non-nullable, indexed.
   * `name`: String(100), non-nullable.
   * `is_active`: Boolean, default=True, non-nullable.
4. **Relational Bridges:**
   * `department`: Relationship targeting `"Department"` with bidirectional synchronization (`back_populates="teams"`).
5. **Programmatic Verification:**
   * Importing `Team` from `app.models.team` in an isolated terminal session succeeds cleanly.
   * Inspecting `Team.__table__.foreign_keys` confirms that a foreign key targeting `departments.id` with `CASCADE` is actively registered.
