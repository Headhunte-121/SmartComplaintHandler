# Module M4 - Backend File 04: Ticket Service Dispatch Integration
## Target File: `backend/app/services/ticket_service.py`
### Execution Track: Phase 2 (Sequential; Upgrades Module M2/M3 Service; Requires Files 01, 02, and 03)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In enterprise software engineering and domain-driven architectures, `ticket_service.py` defines the **Application Business Service Orchestrator**. It sits at the epicenter of system operations: coordinating domain calculations (classification, priority, code generation), executing business workflows (automated workforce dispatch, administrative reassignments, lifecycle transitions), and managing atomic database transaction boundaries.

### Standard Industry Role & Real-World Use Cases
In professional production systems (such as Salesforce Service Cloud, Zendesk Enterprise, and ServiceNow ITIL Incident Management), the Service Layer standardly fulfills four core architectural responsibilities:

1. **Automated Incident Lifecycle Advancement:**
   * Transitions incidents across formal business states based on automated rules.
   * Advances newly ingested complaints from raw intake (`SUBMITTED`) directly into active workforce allocation (`ASSIGNED`) the instant an operational squad is identified, eliminating manual queue sorting delays.
2. **Orchestrating Subsystem Collaboration:**
   * Coordinates multi-stage collaboration across independent domain engines:
     1. Cryptographic tracking code generator (`code_generator.py`)
     2. Domain taxonomy classifier (`classifier.py`)
     3. Urgency priority engine (`priority_engine.py`)
     4. Workload-balanced dispatch engine (`dispatch_engine.py`)
3. **Governing Controlled State Mutations (Human-in-the-Loop Reassignments):**
   * Manages human supervisory interventions: verifying entity existence, checking squad availability, modifying assignments atomically, and recording immutable audit justifications into resolution notes.
4. **Enforcing Atomic Transaction Boundaries (ACID Guarantees):**
   * Ensures that complaint creation, triage calculation, and team dispatch succeed or fail as a single atomic unit of work, issuing immediate rollbacks if disk or network errors occur.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our campus complaint automation platform, our 5-student engineering team specifically uses the upgraded `backend/app/services/ticket_service.py` for four concrete operational functions:

1. **Automatic Squad Allocation on Ingestion (`create_ticket` Upgrade):**
   * Upgrades the complaint ingestion pipeline. After computing department and priority, `create_ticket()` immediately calls `select_optimal_team(db, department_id, priority, location)`.
   * If an active squad is found, it stamps `ticket.assigned_team = optimal_team.name` and transitions `ticket.status = "ASSIGNED"`. If no squad is active, it leaves the ticket as `"Unassigned"` with status `"SUBMITTED"`.
2. **Administrative Team Reassignment (`reassign_ticket_team`):**
   * Powers the supervisor reassignment feature in the React Admin Desk (`ReassignTeamModal.jsx`).
   * Validates target squad existence via `team_service.get_team_by_id()`, updates `ticket.assigned_team`, advances status to `ASSIGNED` if needed, appends a mandatory audit entry to `ticket.resolution_notes`, and commits to SQLite.
3. **On-Demand Re-Dispatch for Unassigned Complaints (`dispatch_existing_ticket`):**
   * Provides a service function allowing supervisors to trigger automated dispatch on older complaints that were submitted when squads were off-duty.
4. **Squad-Specific Dashboard Filtering (`list_tickets` Enhancement):**
   * Adds an optional `assigned_team: Optional[str] = None` query filter to `list_tickets()`.
   * Enables technicians to log into their crew-specific dashboard view and fetch only the tickets dispatched to their squad.

### Future AI Integration & Human-in-the-Loop (HITL) Governance (V2 Roadmap)
The service layer design in this file directly operationalizes our long-term AI strategy:
* **The Strategy Pattern in Ingestion:** In V1, `create_ticket()` invokes the deterministic `select_optimal_team()` engine. In V2, when an AI predictive model is introduced to estimate task durations or route technicians via GPS proximity, `create_ticket()` simply consumes the predictive dispatcher through the same interface. The database insertion logic remains 100% unchanged.
* **The Permanent Human-in-the-Loop Supervisory Gate:** Even in an AI-driven platform, institutional safety rules dictate that an AI cannot hold unchallengeable authority over human technician schedules. The `reassign_ticket_team()` service function acts as the permanent **Human-in-the-Loop (HITL)** safeguard: the AI decides initial dispatch, but the human administrator can inspect physical circumstances, reassign the ticket to another squad, and leave an immutable audit justification.
* **Audit Trail Transparency:** The audit string appended to `resolution_notes` will explicitly record both the automated decision and the human override (e.g. `"[REASSIGNMENT] Transferred from 'Hostel Wiring Squad' (AI-Dispatched) to 'Substation High-Voltage Team'. Reason: Physical site inspection revealed high-voltage transformer arcing."`).

### How Other Components Standardly Interact with This File
Across the backend architecture, this service is consumed cleanly:
* **The Complaint Intake Endpoint (`backend/app/api/v1/endpoints/tickets.py`):** Calls `ticket_service.create_ticket(db, ticket_in)`, automatically receiving an assigned ticket entity.
* **The Assignment Endpoints (`backend/app/api/v1/endpoints/assignment.py`):** Calls `reassign_ticket_team()` during HTTP `PATCH /{ticket_id}/reassign` and `dispatch_existing_ticket()` during HTTP `POST /{ticket_id}/dispatch`.
* **Staff Admin Dashboards:** Calls `list_tickets(db, assigned_team="Hostel Wiring Squad")` to render crew-specific work order feeds.

### The Core Problem It Solves & Why It Exists
* **The "Unassigned Limbo" Delay:** In traditional university systems, complaints sit in an unassigned database state for hours until an administrator reads them. Automatic dispatch assigns tickets in under 2 milliseconds upon submission.
* **Silent Work-Shifting:** Prevents technicians from passing tickets between squads without accountability. The service layer guarantees every transfer has an audit justification permanently saved to SQLite.

---

# 2. What Must Be in This File & Why Each Item Is Needed

To complete the Module M4 service integration, `backend/app/services/ticket_service.py` must define, configure, and export the following structural upgrades:

---

### Item 1: Module M4 Service & Engine Imports
* **What it is:** Importing the dispatch engine and team query service functions.
* **Specification:**
  * `from app.services.dispatch_engine import select_optimal_team, generate_dispatch_reason`
  * `from app.services.team_service import get_team_by_id`
  * `from app.schemas.assignment import TeamReassignRequest`
* **Why it is needed:**
  * Connects the business service orchestrator to workforce allocation engines and validation schemas.

---

### Item 2: Upgraded `create_ticket()` Orchestrator
* **What it is:** The ticket creation workflow, upgraded to automatically assign an active maintenance squad during ingestion.
* **Signature:** `create_ticket(db: Session, ticket_in: TicketCreate) -> Ticket`
* **Internal Execution Sequence:**
  1. Mint unique tracking code: `code = generate_unique_tracking_code(db)`
  2. Compute department classification: `classification = classify_complaint(ticket_in.title, ticket_in.description)`
  3. Compute urgency priority: `priority_info = calculate_priority(ticket_in.title, ticket_in.description)`
  4. Execute automated workforce dispatch:
     * `optimal_team = select_optimal_team(db=db, department_id=classification["department_id"], priority=priority_info["priority"], location=ticket_in.location)`
     * If `optimal_team is not None`:
       * `assigned_squad = optimal_team.name`
       * `initial_status = "ASSIGNED"`
     * Else:
       * `assigned_squad = "Unassigned"`
       * `initial_status = "SUBMITTED"`
  5. Instantiate ORM entity:
     `db_ticket = Ticket(`
     `    title=ticket_in.title,`
     `    description=ticket_in.description,`
     `    location=ticket_in.location,`
     `    tracking_code=code,`
     `    department_id=classification["department_id"],`
     `    status=initial_status,`
     `    priority=priority_info["priority"],`
     `    assigned_team=assigned_squad`
     `)`
  6. Atomic commit and refresh: `db.add(db_ticket)`, `db.commit()`, `db.refresh(db_ticket)`.
  7. Return the hydrated `db_ticket` instance.
* **Why it is needed:**
  * Completes the end-to-end ingestion pipeline: a submitted complaint is immediately categorized, prioritized, and assigned to an active field squad in one atomic transaction.

---

### Item 3: Administrative Team Reassignment Function (`reassign_ticket_team`)
* **What it is:** A service function executing supervisor manual transfers of tickets between squads.
* **Signature:** `reassign_ticket_team(db: Session, ticket_id: int, reassign_data: TeamReassignRequest) -> Optional[Ticket]`
* **Internal Execution Sequence:**
  1. Query ticket by primary key: `ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()`.
  2. If `ticket is None`, return `None` (triggers HTTP 404).
  3. Query target squad: `target_team = get_team_by_id(db, reassign_data.new_team_id)`.
  4. If `target_team is None`, raise `ValueError(f"Team with ID {reassign_data.new_team_id} does not exist")` (triggers HTTP 400).
  5. Capture previous team: `old_team = ticket.assigned_team or 'Unassigned'`.
  6. Update assigned squad: `ticket.assigned_team = target_team.name`.
  7. Update status: If `ticket.status == "SUBMITTED"`, advance `ticket.status = "ASSIGNED"`.
  8. Format audit log entry:
     `timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")`
     `audit_entry = f"[{timestamp}] Reassigned from '{old_team}' to '{target_team.name}'. Reason: {reassign_data.reassignment_reason}"`
  9. Append audit entry:
     `if ticket.resolution_notes:`
     `    ticket.resolution_notes = f"{ticket.resolution_notes}\n{audit_entry}"`
     `else:`
     `    ticket.resolution_notes = audit_entry`
  10. Commit and refresh: `db.commit()`, `db.refresh(ticket)`.
  11. Return modified `ticket` instance.
* **Why it is needed:**
  * Enforces the Human-in-the-Loop supervisory pattern, recording who changed the team, why it was changed, and when it occurred.

---

### Item 4: On-Demand Re-Dispatch Function (`dispatch_existing_ticket`)
* **What it is:** A service function that executes automated dispatch on a previously unassigned ticket.
* **Signature:** `dispatch_existing_ticket(db: Session, ticket_id: int) -> tuple[Optional[Ticket], Optional[str]]`
* **Internal Execution Sequence:**
  1. Query ticket: `ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()`.
  2. If `ticket is None`, return `(None, "Ticket not found")`.
  3. Call dispatch engine: `optimal_team = select_optimal_team(db, ticket.department_id, ticket.priority, ticket.location)`.
  4. If `optimal_team is None`, return `(ticket, "No active squads available for this department")`.
  5. Assign: `ticket.assigned_team = optimal_team.name`, `ticket.status = "ASSIGNED"`.
  6. Commit and refresh: `db.commit()`, `db.refresh(ticket)`.
  7. Return `(ticket, f"Successfully dispatched to {optimal_team.name}")`.
* **Why it is needed:**
  * Allows facility managers to re-run automated dispatch on pending tickets once on-duty shifts begin.

---

### Item 5: Squad-Aware List Filtering in `list_tickets()`
* **What it is:** Enhancing `list_tickets()` to support filtering by squad name.
* **Signature:** `list_tickets(db: Session, skip: int = 0, limit: int = 100, priority: Optional[str] = None, department_id: Optional[int] = None, assigned_team: Optional[str] = None) -> list[Ticket]`
* **Query Addition:**
  * `if assigned_team:`
  * `    query = query.filter(Ticket.assigned_team == assigned_team.strip())`
* **Why it is needed:**
  * Enables technician dashboard views where technicians filter the queue specifically for their assigned squad.

---

# 3. Component Life-Cycle: Input, Process, Output (IPO Table)

The following table documents the data life-cycle for upgraded functions in `backend/app/services/ticket_service.py`:

| Service Function | Input Received | Business Processing & Orchestration | Output Produced | Failure Modes Handled |
| :--- | :--- | :--- | :--- | :--- |
| `create_ticket` | `db: Session`, `ticket_in: TicketCreate` | 1. Mints code.<br>2. Classifies department.<br>3. Computes priority.<br>4. Selects optimal squad via `select_optimal_team()`.<br>5. Sets status (`ASSIGNED` or `SUBMITTED`).<br>6. Commits to SQLite. | Fully hydrated `Ticket` ORM entity with populated `assigned_team` and status. | Rolls back transaction on database errors; defaults to `"Unassigned"` if no squads active. |
| `reassign_ticket_team` | `db: Session`, `ticket_id: int`, `reassign_data: TeamReassignRequest` | 1. Verifies ticket exists.<br>2. Verifies target squad exists.<br>3. Updates `ticket.assigned_team`.<br>4. Advances status if `SUBMITTED`.<br>5. Appends audit log to `resolution_notes`.<br>6. Commits changes. | Updated `Ticket` instance with new squad and audit trail. | Returns `None` if ticket missing; raises `ValueError` if target team missing; rolls back on commit failure. |
| `dispatch_existing_ticket`| `db: Session`, `ticket_id: int` | 1. Finds ticket.<br>2. Runs dispatch engine.<br>3. Updates `assigned_team` and status.<br>4. Commits to disk. | Tuple `(Ticket, explanation_message)`. | Returns `(None, error_str)` if ticket missing; returns unassigned ticket if all squads inactive. |
| `list_tickets` | `db: Session`, query filter parameters | Applies optional filters for priority, department, and `assigned_team` with pagination. | List of `Ticket` ORM entities. | Returns empty list `[]` if no tickets match filter criteria. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. Strict Non-Negotiables

To ensure system stability across the full stack, adhere to the following rules:

### 🟢 Safe to Modify (Configurable Parameters)
* **Audit Log Entry Formatting:** You can customize the formatting of the audit trail string inside `reassign_ticket_team()` (e.g. changing date formatting or adding supervisor badges).
* **Default Initial Status:** You can configure whether unassigned tickets default to `"SUBMITTED"` or `"PENDING_TRIAGE"`.
* **Pagination Limits:** You can adjust the default `limit` parameter in `list_tickets()`.
* **Logging Statements:** You can add Python `logging.info()` statements to track dispatch decisions and reassignments.

### 🔴 Strict Non-Negotiables (System Breaking Changes)
* **DO NOT Hardcode Squad Names:** Never assign string literals like `"Hostel Crew"` directly in code. Always assign the `name` attribute of a verified `Team` entity returned by the dispatch engine or team service.
* **DO NOT Skip Target Squad Existence Validation:** Attempting to reassign a ticket to a non-existent team ID corrupts relational data and creates ghost squads.
* **DO NOT Omit Audit Logging During Reassignments:** Silently transferring tickets without logging the justification into `resolution_notes` violates institutional compliance standards.
* **DO NOT Omit `db.commit()` and `db.refresh()`:** In SQLAlchemy, changes made to entity attributes are lost upon request termination unless committed to disk.
* **DO NOT Import FastAPI HTTP Constructs Here:** The service layer must remain pure Python. Importing `HTTPException` or `Request` into `ticket_service.py` violates the Separation of Concerns.

---

# 5. Advanced Python Concepts Explained: OOP & System Architecture

### 1. The Open-Closed Principle (OCP) Across Multiple Module Milestones
* **The Architectural Rule:** The Open-Closed Principle states that code should be open for extension, but closed for modification.
* **How Our Architecture Demonstrates OCP:**
  * In Module M2, `create_ticket()` handled basic ingestion with placeholder defaults.
  * In Module M3, we plugged in dynamic priority calculation (`calculate_priority`).
  * In Module M4, we plug in automated squad dispatch (`select_optimal_team`).
  * Notice that the public signature `create_ticket(db: Session, ticket_in: TicketCreate) -> Ticket` has never changed! Existing API route handlers, integration tests, and scripts continue to work without modifying a single line of caller code.

### 2. Transactional Atomicity & The Unit of Work Pattern
* **The Concept:** A database transaction must be completely atomic: all operations succeed together, or all fail together (All-or-Nothing).
* **Why Multi-Stage Ingestion Requires Strict Atomicity:**
  * In `create_ticket()`, the system: (1) mints a tracking code, (2) computes classification, (3) computes priority, (4) selects an optimal squad, and (5) writes the row to SQLite.
  * If the process fails at step 4, the database must not store an incomplete ticket with missing priority or missing tracking code.
  * Because all steps execute within a single open `db: Session` before `db.commit()` is invoked, any exception automatically triggers `db.rollback()`, aborting the transaction and leaving the database completely clean.

### 3. Human-in-the-Loop (HITL) Supervisory Architecture
* **The Architectural Rule:** In mission-critical enterprise systems, automated algorithms (whether heuristics or AI models) must always operate under human supervisory oversight.
* **How It Operates in Smart Complaint Handler:**
  * The automated dispatch engine assigns 95% of routine complaints in under 2 milliseconds without human intervention.
  * However, real-world campus situations (such as a technician calling in sick or specialized equipment breaking down) require immediate human adjustment.
  * The `reassign_ticket_team()` function provides the formal, secure mechanism for human supervisors to override automated decisions while enforcing non-repudiation by permanently logging the rationale into the ticket's resolution history.

---

# 6. Definition of Done: Observable Verification Checklist

Before considering the `backend/app/services/ticket_service.py` upgrade complete, verify each of the following operational checkpoints:

### Implementation Checklist
- [ ] Imports `select_optimal_team` from `app.services.dispatch_engine`.
- [ ] Imports `get_team_by_id` from `app.services.team_service`.
- [ ] Imports `TeamReassignRequest` from `app.schemas.assignment`.
- [ ] `create_ticket()` invokes `select_optimal_team()` and populates `db_ticket.assigned_team` and updates status to `ASSIGNED` if a squad is found.
- [ ] `reassign_ticket_team()` implemented with signature `(db: Session, ticket_id: int, reassign_data: TeamReassignRequest) -> Optional[Ticket]`.
- [ ] `reassign_ticket_team()` validates ticket existence, validates target squad existence, updates assigned squad, appends formatted audit log to `resolution_notes`, and commits to SQLite.
- [ ] `dispatch_existing_ticket()` implemented to re-dispatch previously unassigned tickets.
- [ ] `list_tickets()` supports optional `assigned_team: Optional[str] = None` query filtering.
- [ ] Contains zero FastAPI HTTP-specific imports (`HTTPException`, `Request`).
- [ ] Contains zero triple-backtick code blocks.

### Terminal Verification Commands (Run in PowerShell from Project Root)

1. **Verify Automatic Squad Dispatch on Ticket Creation:**
   `python -c "from app.db.session import SessionLocal; from app.schemas.ticket import TicketCreate; from app.services.ticket_service import create_ticket; db = SessionLocal(); t = create_ticket(db, TicketCreate(title='Water leak in Hostel 2 washroom', description='Continuous water leaking under sink', location='Hostel 2')); assert t.assigned_team != 'Unassigned'; assert t.status == 'ASSIGNED'; print('Ticket created and auto-dispatched! Assigned team:', t.assigned_team, 'Status:', t.status); db.close()"`

2. **Verify Critical Emergency Ticket Dispatches to Emergency Squad:**
   `python -c "from app.db.session import SessionLocal; from app.schemas.ticket import TicketCreate; from app.services.ticket_service import create_ticket; db = SessionLocal(); t = create_ticket(db, TicketCreate(title='Electrical spark fire in lab', description='Switchboard sparking with smoke', location='Lab 301')); assert t.priority == 'CRITICAL'; assert t.assigned_team == 'Substation High-Voltage Team'; print('Critical emergency ticket auto-dispatched to:', t.assigned_team); db.close()"`

3. **Verify Administrative Manual Team Reassignment & Audit Trail:**
   `python -c "from app.db.session import SessionLocal; from app.schemas.assignment import TeamReassignRequest; from app.services.ticket_service import create_ticket, reassign_ticket_team; from app.schemas.ticket import TicketCreate; db = SessionLocal(); t = create_ticket(db, TicketCreate(title='Broken desk bench', description='Wooden leg cracked', location='Hall 1')); orig_team = t.assigned_team; updated = reassign_ticket_team(db, t.id, TeamReassignRequest(new_team_id=8, reassignment_reason='Structural fixtures crew has heavy-duty timber tools')); assert updated.assigned_team == 'Structural Fixtures Crew'; assert 'Structural fixtures crew has heavy-duty timber tools' in updated.resolution_notes; print('Reassignment verified! From:', orig_team, 'To:', updated.assigned_team); db.close()"`

4. **Verify Squad-Filtered List Query:**
   `python -c "from app.db.session import SessionLocal; from app.services.ticket_service import list_tickets; db = SessionLocal(); squad_tickets = list_tickets(db, assigned_team='Substation High-Voltage Team'); print('Tickets assigned to Substation Team:', len(squad_tickets)); db.close()"`
