# Module M2 - File 04: Ticket Business Service Layer
## Target File: `backend/app/services/ticket_service.py`
### Execution Track: Phase 2 (Requires Files 01, 02, 03, and Module M1)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In enterprise software engineering, `ticket_service.py` defines the **Application Business Service Layer**. It serves as the primary coordinator of domain operations: sitting directly between the HTTP presentation controllers (API endpoints) and the database persistence layer (SQLAlchemy models), encapsulating all business logic, workflow rules, and atomic database transactions.

### Standard Industry Role & Real-World Use Cases
In professional production systems, the Service Layer pattern standardly fulfills four core architectural responsibilities:

1. **Decoupling Business Rules from Transport Protocols:**
   * Business logic (such as classifying a complaint, generating reference codes, assigning teams, and validating lifecycle state transitions) has nothing to do with HTTP headers, URL paths, or cookies.
   * By isolating logic inside pure Python service functions, the exact same complaint creation logic can be invoked from an HTTP REST endpoint, a WebSocket listener, a background queue worker, or a command-line utility without duplicating a single line of code.
2. **Orchestrating Subsystem Collaboration:**
   * A single business operation usually requires multiple independent subsystems to collaborate.
   * In complaint intake, the service coordinates the cryptographic code generator, the keyword routing classifier, and the database session into one coherent workflow.
3. **Managing Transactional Boundaries (Unit of Work):**
   * Ensures database operations are executed atomically.
   * The service layer determines the exact boundaries of when changes are staged (`db.add`), committed to physical disk (`db.commit`), refreshed into memory (`db.refresh`), or rolled back during unexpected errors (`db.rollback`).
4. **Enabling Frictionless Headless Testing:**
   * Because service functions accept standard Python data structures and an open database session, developers can test complex business logic in unit test scripts without spinning up an HTTP server or simulating network requests.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our campus complaint automation platform, our 5-student engineering team specifically uses `ticket_service.py` for four concrete operational functions:

1. **Orchestrating Complete Complaint Ingestion (`create_ticket`):**
   * Receives the pre-validated `TicketCreate` payload from the API route.
   * Calls `generate_unique_tracking_code(db)` to obtain a verified, collision-free code like `TICK-8F2D`.
   * Calls `classify_complaint(title, description)` to deterministically compute the proper `department_id` (1 through 6).
   * Instantiates the Module M1 `Ticket` model with status initialized to `SUBMITTED`, priority defaulted to `MEDIUM`, and assigned team set to `Unassigned`.
   * Commits the record to SQLite and refreshes the instance from disk to populate the auto-incrementing integer `id`.
2. **Looking Up Tickets by Public Tracking Code (`get_ticket_by_code`):**
   * Executes high-speed indexed queries against SQLite to retrieve a ticket using its public tracking code for the student tracking page (`/track`).
3. **Powering Staff Admin Dashboards (`list_tickets`):**
   * Queries all complaints ordered chronologically descending (`created_at.desc()`) with pagination limits so campus maintenance supervisors can view incoming workloads.
4. **Managing the Complaint Lifecycle (`update_ticket_status`):**
   * Manages state transitions: updating status (`IN_PROGRESS`, `RESOLVED`), attaching technician work notes (`resolution_notes`), and automatically recording the completion timestamp (`resolved_at = datetime.now(timezone.utc)`) the moment a ticket is marked resolved.

### How Other Components Standardly Interact with This File
Across the backend architecture, other components interact with this service through standardized functional calls:
* **The REST API Router (`app/api/v1/endpoints/tickets.py`):** Route handlers act as thin presentation wrappers, delegating all work to this service:
  `ticket = ticket_service.create_ticket(db=db, ticket_in=ticket_in)`
* **Automated Integration Tests:** Integration tests invoke `ticket_service.create_ticket()` directly to create test records and assert business logic without simulating HTTP network calls.

### The Core Problem It Solves & Why It Exists
* **The "Fat Controller" Anti-Pattern:** Without a service layer, developers dump database queries, keyword matching, and random number generation directly inside API route handlers. Route handlers balloon to 80+ lines of unreadable, untestable code.
* **Leaky Database Sessions:** Placing `commit()` and `refresh()` calls haphazardly across multiple endpoints leads to partial writes, uncommitted data, and locked database files. The service layer centralizes all transaction boundaries.
* **Code Duplication:** If ticket lookup logic is needed in both a student-facing route and an administrative route, writing the query in a service function allows both routes to share the same code.

---

# 2. What Must Be in This File & Why Each Item Is Needed

To be complete, this component must define, configure, and export the following five essential service functions:

---

### Item 1: Complaint Creation Orchestrator (`create_ticket`)
* **What it is:** The primary business function that transforms an incoming `TicketCreate` schema into a persistent database record.
* **Signature:** `create_ticket(db: Session, ticket_in: TicketCreate) -> Ticket`
* **Internal Execution Sequence:**
  1. Mint unique tracking code: `code = generate_unique_tracking_code(db)`.
  2. Compute department classification: `classification = classify_complaint(ticket_in.title, ticket_in.description)`.
  3. Instantiate ORM entity:
     `db_ticket = Ticket(`
     `    title=ticket_in.title,`
     `    description=ticket_in.description,`
     `    location=ticket_in.location,`
     `    tracking_code=code,`
     `    department_id=classification["department_id"],`
     `    status="SUBMITTED",`
     `    priority="MEDIUM",`
     `    assigned_team="Unassigned"`
     `)`
  4. Persist to database: `db.add(db_ticket)`, `db.commit()`, `db.refresh(db_ticket)`.
  5. Return the hydrated ORM instance.
* **Why it is needed:**
  * Coordinates all three prerequisite Phase 1 components into a single, cohesive transactional unit.
  * Guarantees that every new complaint has an unambiguous tracking code, a valid department foreign key, and clean initial states.

---

### Item 2: Public Tracking Code Lookup (`get_ticket_by_code`)
* **What it is:** A query function that retrieves a complaint record by its public tracking identifier.
* **Signature:** `get_ticket_by_code(db: Session, tracking_code: str) -> Ticket | None`
* **Query Logic:** `db.query(Ticket).filter(Ticket.tracking_code == tracking_code.strip().upper()).first()`
* **Why it is needed:**
  * Normalizes the tracking code to uppercase, ensuring that if a student types `tick-8f2d` in lowercase, the system still finds their ticket.
  * Utilizes SQLite's B-Tree index on `tracking_code`, returning the record in logarithmic time ($O(\log N)$).
  * Returns `None` if no record matches, allowing upstream callers to handle missing tickets cleanly.

---

### Item 3: Chronological Ticket List Query (`list_tickets`)
* **What it is:** A query function that retrieves a paginated slice of complaints for administrative inspection.
* **Signature:** `list_tickets(db: Session, skip: int = 0, limit: int = 100) -> list[Ticket]`
* **Query Logic:** `db.query(Ticket).order_by(Ticket.created_at.desc()).offset(skip).limit(limit).all()`
* **Why it is needed:**
  * **Reverse Chronological Sorting:** Orders complaints with the newest submissions first, so staff immediately see recently filed issues.
  * **Pagination Safety (`skip`, `limit`):** Prevents the database from attempting to load tens of thousands of rows into memory simultaneously, protecting server RAM.

---

### Item 4: Lifecycle State & Resolution Controller (`update_ticket_status`)
* **What it is:** A state transition function that updates a ticket's progress and audit details.
* **Signature:** `update_ticket_status(db: Session, ticket_id: int, status: str | None = None, resolution_notes: str | None = None) -> Ticket | None`
* **Internal Logic:**
  1. Locates ticket by primary key: `ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()`.
  2. If missing, returns `None`.
  3. If `status` is supplied, updates `ticket.status = status`.
  4. If `status == "RESOLVED"`, automatically stamps `ticket.resolved_at = datetime.now(timezone.utc)`.
  5. If `resolution_notes` is supplied, updates `ticket.resolution_notes = resolution_notes`.
  6. Executes `db.commit()` and `db.refresh(ticket)`.
* **Why it is needed:**
  * **Automated Audit Timestamps:** Guarantees that the exact second a repair is marked resolved is recorded in timezone-aware UTC without relying on manual timestamp input from technicians.
  * Centralizes all status mutation logic in one place.

---

### Item 5: The Transaction Commit & Refresh Protocol
* **What it is:** The explicit execution of `db.commit()` followed by `db.refresh()`.
* **Why it is needed:**
  * **`db.commit()`:** Flushes all staged SQL statements (`INSERT` or `UPDATE`) to the physical SQLite file on disk and closes the atomic transaction.
  * **`db.refresh(db_ticket)`:** Instructs SQLAlchemy to re-read the newly committed row from disk into Python memory. This hydrates attributes generated by the database engine (such as the auto-incremented primary key `id` and default creation timestamps) so they are populated when returned to upstream callers.

---

# 3. Component Life-Cycle: Input, Process, Output

| Stage | What Happens Behind the Scenes |
| :--- | :--- |
| **INPUT** | An active database session (`db: Session`) and a validated payload (`ticket_in: TicketCreate`). |
| **PROCESS** | 1. Calls `generate_unique_tracking_code(db)` to sample the OS entropy pool and verify collision safety.<br>2. Calls `classify_complaint()` to normalize text and count department keyword frequencies.<br>3. Instantiates `Ticket` ORM entity with calculated department ID and tracking code.<br>4. Calls `db.add(db_ticket)` to stage the instance in SQLAlchemy's Unit of Work.<br>5. Calls `db.commit()` to write the row to the SQLite database file on disk.<br>6. Calls `db.refresh(db_ticket)` to reload the row and populate the generated primary key `id`. |
| **OUTPUT** | A fully hydrated, persistent `Ticket` ORM object ready for serialization into `TicketResponse`. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. What Must Stay Exact

### 🟢 Safe to Modify & Customize (Your Team's Creative Freedom):
* **Customizing Default Fields:** You can adjust the default values assigned upon ticket creation (e.g. changing default priority from `"MEDIUM"` to `"LOW"`, or changing default assigned team from `"Unassigned"` to `"Triage Queue"`).
* **Adding Search Filters to `list_tickets`:** You can add optional filter arguments to `list_tickets` (e.g. `department_id: Optional[int] = None`, `status: Optional[str] = None`) to allow staff to filter their queue by department or state.
* **Expanding Pagination Bounds:** You can alter the default `limit` parameter from `100` to `50` or `200`.
* **Adding Custom Audit Log Hooks:** You can add logging statements (e.g. printing `Ticket TICK-XXXX created for Department 1`) to monitor activity in the terminal.

### 🔴 Strict Non-Negotiables (Must Remain Exact Across the Team):
* **Function Identifiers & Signatures:** The function names `create_ticket`, `get_ticket_by_code`, `list_tickets`, and `update_ticket_status` must remain exact. The API endpoints in File 05 import and call these specific functions.
* **The `db: Session` Parameter:** Every service function must accept `db: Session` as its very first argument. Sessions are loaned by FastAPI's dependency injection system and must never be instantiated locally inside service functions.
* **Automatic UTC Timestamping on Resolution:** When `status` transitions to `"RESOLVED"`, `resolved_at` must be stamped with `datetime.now(timezone.utc)`. Omitting this breaks SLA audit metrics.
* **File Location (`backend/app/services/ticket_service.py`):** The module must reside precisely at this path.

---

# 5. Architectural & Theoretical References

This specification operates strictly as an **implementation and integration blueprint**. For the exhaustive computer science fundamentals, language runtime mechanics, and protocol specifications governing this component, consult the following authoritative manuals in the **Developer Guide Suite**:

* [**Guide 05: SQLAlchemy 2.0 ORM & Relational Architecture**](../../../developer_guide/05_SQLALCHEMY_ORM_AND_DATA_LAYER.md)  
  Unit of Work transaction management (`db.commit()`, `db.rollback()`), query execution, and entity hydration.

* [**Guide 02: FastAPI & Modern ASGI Web Architecture**](../../../developer_guide/02_FASTAPI_ASGI_WEB_ARCHITECTURE.md)  
  Service layer decoupling, dependency injection wiring, and custom exception hierarchies.

* [**Unit 03B: SQL Relational Language & Query Mechanics**](../../../developer_guide/03B_SQL_RELATIONAL_LANGUAGE_AND_QUERY_MECHANICS.md)  
  Atomic transaction isolation, ACID guarantees, and declarative relational queries.

---

# 6. Definition of Done: How to Verify This File Is Complete

This component is 100% complete and verified when:

1. **File Existence:**
   * The Python module exists precisely at `backend/app/services/ticket_service.py`.
2. **Function Exports:**
   * All 4 core service functions (`create_ticket`, `get_ticket_by_code`, `list_tickets`, `update_ticket_status`) are defined and exported.
3. **Integration & Transaction Integrity:**
   * `create_ticket` properly combines code generation, keyword classification, and database persistence.
   * `update_ticket_status` automatically sets `resolved_at` when status is updated to `"RESOLVED"`.
4. **Programmatic Verification:**
   * In an isolated terminal session, creating and querying a ticket through the service:
     `python -c "from app.core.database import SessionLocal; from app.schemas.ticket import TicketCreate; from app.services.ticket_service import create_ticket, get_ticket_by_code; db = SessionLocal(); t = create_ticket(db, TicketCreate(title='Ceiling fan broken', description='Sparking wires in room 302', location='Room 302')); assert t.department_id == 1; found = get_ticket_by_code(db, t.tracking_code); assert found.id == t.id; db.delete(found); db.commit(); db.close(); print('Ticket Service OK: Create, Auto-Route, and Lookup Verified')"`
     succeeds cleanly, printing `Ticket Service OK: Create, Auto-Route, and Lookup Verified`.
