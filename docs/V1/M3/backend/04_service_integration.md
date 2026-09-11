# Module M3 - File 04: Ticket Service Priority Integration
## Target File: `backend/app/services/ticket_service.py`
### Execution Track: Phase 2 (Upgrades Module M2 Service; Requires Files 01, 02, and 03)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In enterprise software systems and microservice architectures, `ticket_service.py` defines the **Application Business Service Layer**. It coordinates complex multi-step business transactions: intercepting incoming data transfer objects (DTOs) from the presentation layer, delegating specialized logic to domain engines (classification, priority, code generation), managing database transaction boundaries (commits and rollbacks), and returning unified domain entities.

### Standard Industry Role & Real-World Use Cases
In professional production systems (such as Salesforce Service Cloud, Zendesk, and Jira Service Management), the Service Layer standardly fulfills four critical operational functions:

1. **Orchestrating Subsystem Collaboration:**
   * A single business action (e.g. creating an incident) requires coordination across multiple independent subsystems.
   * The service layer acts as the master conductor: it calls the tracking code generator for cryptographic identification, invokes the domain classifier to detect the responsible service team, and calls the priority engine to calculate urgency based on physical risk.
2. **Transitioning from Static Stubs to Production Rule Engines:**
   * During early software scaffolding, secondary attributes are frequently assigned temporary static defaults (e.g. `priority = "MEDIUM"`).
   * As specialized modules mature, the service layer is upgraded to replace these static placeholders with calls to real-time deterministic rule engines without disrupting existing client-facing endpoints.
3. **Governing Controlled State Mutations (Administrative Overrides):**
   * While automated algorithms assign baseline classifications, operational reality requires human facility managers to override automated decisions when physical on-site inspections reveal new facts.
   * The service layer standardly governs these mutations: verifying entity existence, checking authorization boundaries, modifying attributes atomically, and preserving tamper-evident audit explanations.
4. **Managing Transaction Boundaries (Unit of Work & Atomic Integrity):**
   * The service layer determines the exact perimeter of database transactions.
   * If any step fails during ticket intake or priority updating, the service issues an immediate `db.rollback()`, ensuring the database never holds half-written, corrupted, or orphaned records.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our automated campus complaint routing platform, our 5-student engineering team specifically uses the upgraded `backend/app/services/ticket_service.py` for four concrete operational functions:

1. **Replacing Static Priority with Dynamic Triage (`create_ticket` Upgrade):**
   * In Module M2, ticket creation hardcoded `priority="MEDIUM"`.
   * In this Module M3 upgrade, `create_ticket()` directly invokes `priority_info = calculate_priority(ticket_in.title, ticket_in.description)` from `backend/app/services/priority_engine.py`.
   * The ticket's priority is immediately and dynamically populated with `CRITICAL`, `HIGH`, `MEDIUM`, or `LOW` based on detected danger keywords, short-circuiting life-safety emergencies instantly upon submission.
2. **Implementing Administrative Priority Overrides (`override_ticket_priority`):**
   * Implements a dedicated service function that allows authorized campus facility supervisors to manually adjust a ticket's priority tier.
   * Validates that the requested ticket exists in SQLite, checks that the new priority is an authorized enum tier, updates `ticket.priority`, appends the mandatory justification note to the ticket's resolution record, and commits the transaction to disk.
3. **Priority-Aware Ticket Querying (`list_tickets` Enhancement):**
   * Enhances the ticket list query with optional filtering parameters: `priority: Optional[str] = None` and `department_id: Optional[int] = None`.
   * Allows maintenance supervisors to filter their dashboard specifically for `CRITICAL` or `HIGH` tickets to address life-safety hazards before routine maintenance requests.
4. **Preserving Audit Accountability:**
   * When an administrative override occurs, the service appends an audit string into `ticket.resolution_notes` (e.g. `"[PRIORITY OVERRIDE] Changed from CRITICAL to MEDIUM. Reason: Site inspection showed harmless steam, not smoke."`), guaranteeing that automated priority demotions cannot be performed silently.
5. **Establishing the Architectural Socket for Future AI Inference (V2 Roadmap):**
   * Prepares the exact service-layer boundary where future AI contextual inference will be connected.
   * Isolates triage decision-making so that switching from V1 deterministic heuristics to V2 contextual LLM models requires zero modifications to ticket persistence, database session management, or tracking code generation.

### Future AI Integration & Human-in-the-Loop (HITL) Governance (V2 Roadmap)
The service layer design in this file directly operationalizes our long-term AI strategy:
* **The Strategy Pattern in Ingestion:** In V1, `create_ticket()` calls `calculate_priority()` and `classify_complaint()`. In V2, these function calls will be routed through a unified triage orchestrator that queries an AI model (such as Gemini API) for contextual keyword extraction. The service orchestrator simply receives the resulting priority and persists it, remaining completely decoupled from whether rules or AI generated the values.
* **The Permanent Human-in-the-Loop Supervisory Gate:** Even in an AI-driven platform, institutional safety rules dictate that an AI cannot hold unchallengeable authority over physical facility operations. The `override_ticket_priority()` service function acts as the permanent **Human-in-the-Loop (HITL)** safeguard: the AI decides initial triage from the report context, but the human administrator can inspect the physical scene, adjust the priority, and leave an immutable audit explanation.
* **Audit Trail Transparency:** The audit string appended to `resolution_notes` will explicitly record both the automated decision and the human override (e.g. `"[PRIORITY OVERRIDE] Changed from CRITICAL (AI-Assigned) to MEDIUM. Reason: Physical site inspection confirmed steam radiator relief valve venting normally, no fire risk."`).

### How Other Components Standardly Interact with This File
Across the backend architecture, other components interact with this service through clean function calls:
* **The Complaint Intake Endpoint (`backend/app/api/v1/endpoints/tickets.py`):** Calls `ticket_service.create_ticket(db, ticket_in)` during HTTP POST requests. Thanks to the internal upgrade, incoming tickets are automatically triaged without altering the endpoint's interface.
* **The Priority Management Endpoint (`backend/app/api/v1/endpoints/priority.py`):** Calls `ticket_service.override_ticket_priority(db, ticket_id, override_data)` during HTTP PATCH requests.
* **Administrative Dashboard Endpoints:** Call `ticket_service.list_tickets(db, skip=0, limit=50, priority="CRITICAL")` to render high-urgency operational queues.
* **Automated Test Suites:** Execute end-to-end service assertions directly against test database sessions to verify that hazardous text generates `CRITICAL` priority records in SQLite.

### The Core Problem It Solves & Why It Exists
* **Elimination of the "Blind Triage" Bottleneck:** With hardcoded `"MEDIUM"` priority, an electrical fire report and a squeaky chair appeared identical in the database. The supervisor had to read hundreds of complaints manually to find emergencies. Dynamic calculation ensures emergency complaints immediately surface at the top of the queue.
* **Preventing "Silent Priority Tampering":** In unmanaged systems, a technician might manually lower an emergency ticket to "LOW" to avoid being penalized for missing a deadline. The `override_ticket_priority()` service function mandates an explanation and logs the event, preserving administrative transparency.
* **Preserving Endpoint Simplicity:** By encapsulating priority calculations and override logic in `ticket_service.py`, API endpoints remain clean 5-line controller functions that simply delegate work to the service layer.

---

# 2. What Must Be in This File & Why Each Item Is Needed

To complete the Module M3 service integration, `backend/app/services/ticket_service.py` must define, configure, and export the following five structural components:

---

### Item 1: Priority Engine Dependency Import
* **What it is:** Importing the deterministic priority calculation function and priority constants from Module M3 File 01.
* **Specification:** `from app.services.priority_engine import calculate_priority, PRIORITY_CRITICAL, PRIORITY_HIGH, PRIORITY_MEDIUM, PRIORITY_LOW`
* **Why it is needed:**
  * Connects the business service layer to the deterministic scoring engine.
  * Provides access to priority string constants, preventing typo bugs.

---

### Item 2: Upgraded `create_ticket()` Orchestrator
* **What it is:** The primary creation function, updated to calculate priority dynamically from complaint text before database insertion.
* **Signature:** `create_ticket(db: Session, ticket_in: TicketCreate) -> Ticket`
* **Internal Execution Sequence:**
  1. Generate unique collision-free tracking code: `code = generate_unique_tracking_code(db)`.
  2. Compute department classification: `classification = classify_complaint(ticket_in.title, ticket_in.description)`.
  3. Compute deterministic urgency priority: `priority_result = calculate_priority(ticket_in.title, ticket_in.description)`.
  4. Instantiate ORM entity with dynamic priority:
     `db_ticket = Ticket(`
     `    title=ticket_in.title,`
     `    description=ticket_in.description,`
     `    location=ticket_in.location,`
     `    tracking_code=code,`
     `    department_id=classification["department_id"],`
     `    status="SUBMITTED",`
     `    priority=priority_result["priority"],`
     `    assigned_team="Unassigned"`
     `)`
  5. Atomic persistence: `db.add(db_ticket)`, `db.commit()`, `db.refresh(db_ticket)`.
  6. Return hydrated `db_ticket` instance.
* **Why it is needed:**
  * Transforms static ticket creation into an intelligent, risk-aware intake workflow.
  * Guarantees that every complaint committed to SQLite has a priority determined by physical hazard rules.

---

### Item 3: Administrative Priority Override Function (`override_ticket_priority`)
* **What it is:** A specialized service function that executes administrative adjustments to a ticket's priority tier.
* **Signature:** `override_ticket_priority(db: Session, ticket_id: int, override_data: PriorityOverrideRequest) -> Ticket | None`
* **Internal Execution Sequence:**
  1. Query ticket by primary key: `ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()`.
  2. If `ticket is None`, return `None` (allowing the endpoint to raise HTTP 404 Not Found).
  3. Capture previous priority: `old_priority = ticket.priority`.
  4. Update priority: `ticket.priority = override_data.new_priority.value`.
  5. Format audit log entry:
     `timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")`
     `audit_entry = f"[{timestamp}] Priority changed from {old_priority} to {ticket.priority}. Reason: {override_data.override_reason}"`
  6. Append audit entry:
     `if ticket.resolution_notes:`
     `    ticket.resolution_notes = f"{ticket.resolution_notes}\n{audit_entry}"`
     `else:`
     `    ticket.resolution_notes = audit_entry`
  7. Commit and refresh: `db.commit()`, `db.refresh(ticket)`.
  8. Return the modified `ticket` instance.
* **Why it is needed:**
  * Empowers facility supervisors to adjust priorities based on real-world verification while permanently recording who changed what and why.

---

### Item 4: Enhanced Filtering in `list_tickets()`
* **What it is:** An extension to the ticket listing query supporting optional priority and department filtering.
* **Signature:** `list_tickets(db: Session, skip: int = 0, limit: int = 100, priority: Optional[str] = None, department_id: Optional[int] = None) -> list[Ticket]`
* **Query Construction:**
  * `query = db.query(Ticket)`
  * `if priority:`
  * `    query = query.filter(Ticket.priority == priority.strip().upper())`
  * `if department_id is not None:`
  * `    query = query.filter(Ticket.department_id == department_id)`
  * `return query.order_by(Ticket.created_at.desc()).offset(skip).limit(limit).all()`
* **Why it is needed:**
  * Enables high-priority queue slicing so staff can filter specifically for `CRITICAL` issues during campus emergencies.

---

### Item 5: Transaction Safety with Exception Rollback
* **What it is:** Encapsulating database commit points with try/except error recovery blocks.
* **Behavior:** If `db.commit()` raises an operational error or database lock exception, execute `db.rollback()` before re-raising the error.
* **Why it is needed:**
  * Prevents SQLite database connection corruption or stuck transaction locks in the event of an unexpected disk error.

---

# 3. Component Life-Cycle: Input, Process, Output (IPO Table)

The following table documents the data life-cycle for each function in `backend/app/services/ticket_service.py`:

| Service Function | Input Received | Business Processing & Orchestration | Output Produced | Failure Modes & Safeguards |
| :--- | :--- | :--- | :--- | :--- |
| `create_ticket` | `db: Session`, `ticket_in: TicketCreate` | 1. Generates collision-free tracking code.<br>2. Classifies department via `classify_complaint()`.<br>3. Computes urgency via `calculate_priority()`.<br>4. Persists new `Ticket` ORM entity to SQLite.<br>5. Commits and refreshes entity. | Fully hydrated `Ticket` ORM instance with populated `id`, `tracking_code`, `department_id`, and `priority`. | If commit fails, executes `db.rollback()` and raises exception to prevent partial database writes. |
| `override_ticket_priority` | `db: Session`, `ticket_id: int`, `override_data: PriorityOverrideRequest` | 1. Queries ticket by primary key `id`.<br>2. Records `old_priority`.<br>3. Updates `ticket.priority = override_data.new_priority.value`.<br>4. Formats and appends audit log to `resolution_notes`.<br>5. Commits changes to disk. | Updated `Ticket` instance with new priority and appended audit notes. | Returns `None` if `ticket_id` does not exist in SQLite; executes `db.rollback()` if disk commit fails. |
| `list_tickets` | `db: Session`, `skip: int`, `limit: int`, optional `priority`, optional `department_id` | 1. Builds base query `db.query(Ticket)`.<br>2. Conditionally applies priority filter.<br>3. Conditionally applies department filter.<br>4. Applies chronological ordering (`created_at.desc()`).<br>5. Applies pagination (`offset`, `limit`). | List of `Ticket` ORM instances matching filter criteria. | Returns empty list `[]` if no tickets match criteria; limits maximum records to prevent memory exhaustion. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. Strict Non-Negotiables

To maintain system integrity while allowing operational flexibility, adhere to the following rules:

### 🟢 Safe to Modify (Configurable Parameters)
* **Audit Log Text Formatting:** You can customize the formatting of the audit trail string inside `override_ticket_priority()` (e.g. changing date formatting or prefixing with `[SUPERVISOR OVERRIDE]`).
* **Pagination Boundaries:** You may adjust default `skip` and `limit` boundaries in `list_tickets()` (e.g. changing default limit from `100` to `50` for mobile dashboards).
* **Additional Filtering Options:** You can add extra query filters to `list_tickets()`, such as filtering by `status` (e.g. `status="SUBMITTED"`).
* **Logging Statements:** You can add Python standard library `logging.info()` calls to record priority calculations and override events into backend server log files.

### 🔴 Strict Non-Negotiables (System Breaking Changes)
* **DO NOT Hardcode Priority Back to `"MEDIUM"`:** Reverting to static strings destroys the purpose of Module M3 and blinds the automated dispatch system.
* **DO NOT Omit `db.commit()` and `db.refresh()`:** In SQLAlchemy, failing to commit leaves changes in volatile RAM session cache; changes are discarded the moment the HTTP request completes. Failing to refresh leaves the object missing generated values like `created_at`.
* **DO NOT Skip the `ticket is None` Check in Override Logic:** Attempting to access `ticket.priority` on a `None` object raises an unhandled `AttributeError: 'NoneType' object has no attribute 'priority'`, returning an internal server error (HTTP 500) instead of a clean HTTP 404.
* **DO NOT Remove Audit Reason Logging:** Allowing priority overrides without logging the rationale destroys administrative accountability.
* **DO NOT Import FastAPI or HTTP Request Objects Here:** The service layer must remain pure Python. Importing `Request`, `HTTPException`, or `Response` into `ticket_service.py` violates the Separation of Concerns and prevents headless CLI scripting.

---

# 5. Advanced Python Concepts Explained: OOP & System Architecture

### 1. The Open-Closed Principle (OCP) in Service Architecture
* **The Architectural Rule:** The Open-Closed Principle states that software entities (classes, modules, functions) should be **open for extension, but closed for modification**.
* **How We Apply It Here:**
  * When Module M2 was written, `create_ticket()` established the contract for ticket ingestion.
  * In Module M3, we extend the system's intelligence by plugging in `calculate_priority()`. Notice that the function signature `create_ticket(db: Session, ticket_in: TicketCreate) -> Ticket` remains completely unchanged!
  * Because the public signature and return type did not change, none of the existing callers (API endpoints, test scripts, CLI tools) broke. We extended the internal behavior without breaking external contracts.

### 2. SQLAlchemy Unit of Work Pattern & Identity Map
* **The Concept:** SQLAlchemy's `Session` is not just a database connection; it is an implementation of Martin Fowler's **Unit of Work** and **Identity Map** patterns.
* **How It Works in RAM:**
  * When `override_ticket_priority()` executes `ticket = db.query(Ticket).filter(...).first()`, SQLAlchemy reads the row from SQLite, instantiates a Python `Ticket` object, and places it in an internal memory registry called the **Identity Map**.
  * When you execute `ticket.priority = "HIGH"`, SQLAlchemy's attribute instrumentation detects that an attribute was modified. It marks the object as **dirty**.
  * You do not need to call `db.update(ticket)`. When `db.commit()` is called, SQLAlchemy inspects the Identity Map, identifies all dirty objects, constructs a highly optimized SQL `UPDATE tickets SET priority = 'HIGH', resolution_notes = ... WHERE id = ?` statement, and executes it inside an atomic transaction.

### 3. Database Transaction Isolation & Atomic Commits
* **The Concept:** A database transaction is an isolated, atomic unit of work governed by ACID principles (Atomicity, Consistency, Isolation, Durability).
* **Why `db.rollback()` Is Mandatory:**
  * In SQLite, if an operation begins staging writes and an error occurs (such as a database file lock or disk space error), the transaction remains open in a failed state.
  * If the connection is returned to the connection pool without executing `db.rollback()`, subsequent requests using that connection will fail with `sqlite3.OperationalError: cannot start a transaction within a transaction`.
  * By wrapping commits in try/except blocks with explicit rollback calls, we guarantee that failed transactions are instantly aborted and the connection is restored to a pristine state.

### 4. Audit Trails & Non-Repudiation in Operations Engineering
* **The Concept:** In cybersecurity and enterprise governance, **non-repudiation** guarantees that an action cannot be denied by the party that performed it.
* **Why Priority Overrides Require Audit Logging:**
  * If a fire hazard ticket is submitted as `CRITICAL` (4-hour resolution deadline) and someone lowers it to `LOW` (72-hour deadline), causing property damage because technicians arrived too late, the institution must determine who lowered the priority and why.
  * By embedding an immutable timestamped audit log directly into the ticket record, the service layer creates an irrefutable audit trail that preserves system integrity.

---

# 6. Definition of Done: Observable Verification Checklist

Before considering the `backend/app/services/ticket_service.py` upgrade complete, verify each of the following operational checkpoints:

### Implementation Checklist
- [ ] Imports `calculate_priority` from `app.services.priority_engine`.
- [ ] `create_ticket()` invokes `calculate_priority(ticket_in.title, ticket_in.description)` and assigns the computed priority to `db_ticket.priority`.
- [ ] `override_ticket_priority()` implemented with signature `(db: Session, ticket_id: int, override_data: PriorityOverrideRequest) -> Ticket | None`.
- [ ] `override_ticket_priority()` checks for ticket existence, records old priority, updates priority, appends formatted audit note to `resolution_notes`, and commits to SQLite.
- [ ] `list_tickets()` supports optional `priority: Optional[str] = None` and `department_id: Optional[int] = None` filtering.
- [ ] File contains proper exception handling with `db.rollback()` on commit failures.
- [ ] Zero FastAPI HTTP-specific imports (`HTTPException`, `Request`) inside `ticket_service.py`.

### Terminal Verification Commands (Run in PowerShell from Project Root)

1. **Verify Dynamic Priority Assignment on Ticket Creation:**
   `python -c "from app.db.session import SessionLocal; from app.schemas.ticket import TicketCreate; from app.services.ticket_service import create_ticket; db = SessionLocal(); t = create_ticket(db, TicketCreate(title='Sparking wire in lab', description='Main switch is smoking and sparking', location='Lab 101')); assert t.priority == 'CRITICAL'; print('Ticket created with dynamic priority:', t.priority, t.tracking_code); db.close()"`

2. **Verify Non-Hazard Ticket Receives Medium Priority:**
   `python -c "from app.db.session import SessionLocal; from app.schemas.ticket import TicketCreate; from app.services.ticket_service import create_ticket; db = SessionLocal(); t = create_ticket(db, TicketCreate(title='Broken chair wheel', description='Desk chair wheel is stuck in seminar hall', location='Hall A')); assert t.priority in ['MEDIUM', 'LOW']; print('Routine ticket created with priority:', t.priority); db.close()"`

3. **Verify Administrative Priority Override Execution:**
   `python -c "from app.db.session import SessionLocal; from app.schemas.priority import PriorityOverrideRequest, PriorityEnum; from app.services.ticket_service import override_ticket_priority, list_tickets; db = SessionLocal(); tickets = list_tickets(db, limit=1); assert len(tickets) > 0; t = tickets[0]; updated = override_ticket_priority(db, t.id, PriorityOverrideRequest(new_priority=PriorityEnum.LOW, override_reason='Verified false alarm by staff inspection')); assert updated.priority == 'LOW'; assert 'Verified false alarm' in updated.resolution_notes; print('Priority override verified successfully on ticket:', updated.tracking_code); db.close()"`

4. **Verify Priority-Filtered List Query:**
   `python -c "from app.db.session import SessionLocal; from app.services.ticket_service import list_tickets; db = SessionLocal(); criticals = list_tickets(db, priority='CRITICAL'); print('Found critical tickets:', len(criticals)); db.close()"`
