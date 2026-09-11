# Module M5 Backend: Service Layer SLA & Lifecycle Integration Specification

Authoritative Engineering Blueprint for Upgrading `backend/app/services/ticket_service.py`.

---

## Section 1: Standard Purpose & Industry Role

### Standard Industry Role & Real-World Use Cases
In multi-tiered enterprise software architectures, the Service Layer (the architectural layer that encapsulates core business logic, orchestrates cross-domain algorithms, and manages database transactions) operates as the engine room of the application. While presentation controllers (REST endpoints) handle HTTP parsing and data models govern table layouts, the service layer is where business rules are executed.

As an application matures through iterative development phases, the service layer must absorb new capabilities—such as automated deadline calculations, lifecycle state machine enforcement, and escalation workflows—without breaking existing caller contracts or destabilizing earlier modules.

In IT service management and operations research, service layer integration coordinates:
1. Ingestion stamping: Ensuring every newly created issue is stamped with a precise Service Level Agreement (SLA) target before it touches the database.
2. Controlled state transitions: Guaranteeing that status updates pass through formal validation guards before committing to disk.
3. Verified resolution workflows: Recording exact resolution timestamps and structured repair reports to enable performance auditing.

### What WE Are Specifically Using It For in Smart Complaint Handler
In `SmartComplaintHandler`, `backend/app/services/ticket_service.py` is upgraded to become the master orchestrator for Module M5:
1. It upgrades `create_ticket()`: Incorporates `calculate_sla_deadline()` from `sla_engine.py`. When a complaint is ingested, the service calculates its resolution deadline based on computed priority (`CRITICAL` = 4h, `HIGH` = 12h, `MEDIUM` = 24h, `LOW` = 72h) and stamps `sla_deadline` onto the `Ticket` ORM entity during initial creation.
2. It implements `update_ticket_status(db, ticket_id, new_status, staff_notes, actor)`: Intercepts all lifecycle status changes, validates the transition against `lifecycle.py` rules (rejecting illegal shortcuts like `SUBMITTED` -> `RESOLVED`), updates `status`, appends a timestamped audit log to `resolution_notes`, and executes an atomic database commit.
3. It implements `resolve_ticket(db, ticket_id, resolution_notes, parts_replaced, technician)`: A dedicated, verified closure function that validates resolution notes (min 10 characters), sets `status = "RESOLVED"`, records `resolved_at = datetime.utcnow()`, compiles a structured closure report, and records whether the repair met or breached its SLA target.
4. It implements `escalate_ticket(db, ticket_id, reason, supervisor_id)`: Transitions high-risk or delayed tickets to `ESCALATED`, documenting the supervisory justification in the audit trail.
5. It implements `get_active_sla_breaches(db)`: Queries all open, unresolved tickets across the campus, compares their `sla_deadline` against current UTC time, and returns a prioritized list of breached and near-breach tickets for the supervisor escalation dashboard.

### Future AI Integration & Roadmap Hooks
In Version 2 (V2), when our platform introduces automated AI-driven operational optimization via Gemini API, this integrated service layer provides:
1. AI Pre-Breach Warning Worker Hook: A scheduled background task calling Gemini AI to analyze active ticket queues and automatically invoke `escalate_ticket()` on stagnant, high-risk issues before a contractual breach occurs.
2. AI Resolution Notes Verification: An integration hook in `resolve_ticket()` allowing Gemini Vision to inspect closure photos and verify technician repair notes before committing the `RESOLVED` state to SQLite.
3. Zero-Latency Fallback Preservation: If AI inference services fail or encounter rate limits, this service layer continues executing local deterministic rules, ensuring uninterrupted complaint intake and resolution tracking.

### How Other Components Standardly Interact with This File
1. `endpoints/tickets.py` (Module M2) calls `create_ticket()`, automatically benefiting from the newly added SLA deadline stamping.
2. `endpoints/sla.py` (Module M5) imports and invokes `update_ticket_status()`, `resolve_ticket()`, `escalate_ticket()`, and `get_active_sla_breaches()`.
3. This file imports `calculate_sla_deadline` from `sla_engine.py` and `validate_transition`, `format_audit_log_entry` from `lifecycle.py`.

### The Core Problem It Solves & Why It Exists
Without this service integration:
- SLA calculation logic would be duplicated across multiple endpoint handlers, creating inconsistencies when tickets are created via different interfaces (e.g. web form vs admin script).
- State transitions would directly update the database column without validation, allowing staff to bypass required resolution notes or skip intermediate inspection states.
- Database updates would not be atomic, risking partial data commits where a status changes but the corresponding audit log fails to save.

---

## Section 2: What Must Be in This File & Why Each Item Is Needed

### 1. Ingestion Upgrade in `create_ticket()`
* SLA Deadline Calculation:
  - Immediately after calculating or receiving `priority`, the service invokes:
    `sla_deadline = calculate_sla_deadline(created_at=datetime.utcnow(), priority=ticket_data.priority or calculated_priority)`
  - Sets `db_ticket.sla_deadline = sla_deadline`.
  - Sets `db_ticket.status = "SUBMITTED"`.
* Why Needed: Guarantees that no ticket is ever committed to SQLite without a valid, non-null `sla_deadline`.

### 2. `update_ticket_status()` Function Specification
* Function Signature: `def update_ticket_status(db: Session, ticket_id: int, new_status: str, staff_notes: str | None = None, actor: str = "Staff") -> Ticket | None`
* Ticket Retrieval: Queries `db.query(Ticket).filter(Ticket.id == ticket_id).first()`. Returns `None` if not found.
* Transition Validation:
  - Calls `validate_transition(current_status=ticket.status, target_status=new_status, notes=staff_notes)`.
  - If validation raises an exception, the exception propagates to the endpoint layer, halting execution before database mutation.
* Audit Log Generation:
  - Calls `audit_entry = format_audit_log_entry(previous_status=ticket.status, new_status=new_status, actor=actor, notes=staff_notes)`.
  - Appends to notes: `ticket.resolution_notes = (ticket.resolution_notes or "") + "\n" + audit_entry`.
* State Mutation & Commit:
  - Updates `ticket.status = new_status`.
  - Executes `db.commit()` and `db.refresh(ticket)`.
* Return Value: Returns the updated `Ticket` ORM entity.

### 3. `resolve_ticket()` Function Specification
* Function Signature: `def resolve_ticket(db: Session, ticket_id: int, resolution_notes: str, parts_replaced: str | None = None, technician: str | None = None) -> Ticket | None`
* Ticket Retrieval: Queries `Ticket` by primary key `ticket_id`. Returns `None` if not found.
* Transition Validation:
  - Calls `validate_transition(current_status=ticket.status, target_status="RESOLVED", notes=resolution_notes)`.
* Closure Metadata Stamping:
  - Stamped Timestamp: Sets `ticket.resolved_at = datetime.utcnow()`.
  - Status Mutation: Sets `ticket.status = "RESOLVED"`.
* Structured Closure Report Compilation:
  - Formats a comprehensive closure record:
    `"[CLOSURE REPORT: {timestamp} | Technician: {technician or 'Unassigned'} | SLA Met: {is_met}]"`
    `"Work Summary: {resolution_notes}"`
    `"Parts Replaced: {parts_replaced or 'None'}"`
  - Appends closure report to `ticket.resolution_notes`.
* Atomic Commit: Commits transaction and refreshes ticket instance.
* Return Value: Returns the resolved `Ticket` entity.

### 4. `escalate_ticket()` Function Specification
* Function Signature: `def escalate_ticket(db: Session, ticket_id: int, reason: str, supervisor_id: str | None = None) -> Ticket | None`
* Ticket Retrieval: Queries `Ticket` by `ticket_id`.
* Transition Validation:
  - Calls `validate_transition(current_status=ticket.status, target_status="ESCALATED", notes=reason)`.
* State Mutation:
  - Sets `ticket.status = "ESCALATED"`.
  - Appends audit stamp: `"[ESCALATION: {timestamp} | Reason: {reason} | Supervisor: {supervisor_id or 'System'}]"`.
* Atomic Commit: Commits transaction and returns updated ticket.

### 5. `get_active_sla_breaches()` Function Specification
* Function Signature: `def get_active_sla_breaches(db: Session, threshold_ratio: float = 0.20) -> list[dict]`
* Active Tickets Query:
  - Queries `Ticket` joined with `Department` where `Ticket.status.in_(["SUBMITTED", "IN_PROGRESS", "ESCALATED"])`.
  - Filters tickets where `Ticket.sla_deadline != None`.
* Temporal Evaluation Loop:
  - Captures current time: `now = datetime.utcnow()`.
  - Iterates over queried tickets; calls `compute_sla_breach_status(ticket.sla_deadline, ticket.status)`.
  - Computes `overdue_seconds = (now - ticket.sla_deadline).total_seconds()`.
  - Filters for tickets where status is `"BREACHED"` (`overdue_seconds > 0`) or `"APPROACHING_BREACH"`.
* Sorting: Sorts breach list in descending order of urgency: overdue tickets first, sorted by largest overdue duration.
* Return Value: Returns a list of breach summary dictionaries conforming to `SLABreachResponse`.

---

## Section 3: Component Life-Cycle: Input, Process, Output (IPO Table)

| Life-Cycle Phase | Primary Input | Internal Transformation & Logic | Final Output |
| :--- | :--- | :--- | :--- |
| **1. Ingestion Creation** | `create_ticket(db, ticket_data)` | Calls `calculate_sla_deadline()`; sets `sla_deadline = now + 4h`; sets status = `SUBMITTED`. | Ticket saved with non-null `sla_deadline` and status `SUBMITTED`. |
| **2. Status Mutation** | `update_ticket_status(db, 1, 'IN_PROGRESS')` | Validates transition `SUBMITTED -> IN_PROGRESS`; generates audit log; updates status. | Ticket status set to `IN_PROGRESS`; audit log line appended to `resolution_notes`. |
| **3. Ticket Resolution** | `resolve_ticket(db, 1, 'Replaced burnt fuse')` | Validates transition `IN_PROGRESS -> RESOLVED`; stamps `resolved_at`; evaluates SLA compliance. | Status set to `RESOLVED`; `resolved_at` stamped; closure report saved. |
| **4. Manual Escalation** | `escalate_ticket(db, 1, 'Water leak worsening')` | Validates transition to `ESCALATED`; appends supervisor justification to notes. | Status set to `ESCALATED`; ticket elevated in monitoring queues. |
| **5. Breach Scan** | `get_active_sla_breaches(db)` | Queries open tickets; calculates `now - sla_deadline`; filters breached and near-breach records. | Returns sorted list of high-risk tickets for supervisor dashboard. |

---

## Section 4: Flexibility & Modification Guide

### 🟢 Safe to Modify & Customize
* **Audit Line Formatting**: You may adjust the text templates used in `format_audit_log_entry()` or closure reports (e.g. adding department contact numbers or supervisor email tags) without breaking database integrity.
* **Breach Query Thresholds**: You can adjust `threshold_ratio` in `get_active_sla_breaches()` from `0.20` to `0.30` to broaden the early-warning window for staff.
* **Actor Identification**: You can pass dynamic usernames or authentication tokens into `actor` and `technician` arguments without altering service signatures.

### 🔴 Strict Non-Negotiables (Do NOT Alter)
* **Atomic Transaction Commits**: Every mutating service method (`update_ticket_status`, `resolve_ticket`, `escalate_ticket`) must execute `db.commit()` and `db.refresh(ticket)`. Omitting `db.commit()` leaves changes in-memory, causing them to be discarded when the session closes.
* **Pre-Commit Transition Validation**: You must invoke `validate_transition()` *before* mutating the `ticket.status` attribute. Mutating the attribute before validation risks committing invalid states if an unexpected runtime error occurs.
* **Mandatory Timestamping on Resolution**: `resolve_ticket()` must always record `ticket.resolved_at = datetime.utcnow()`. Storing null resolution timestamps makes it impossible to calculate SLA turnaround compliance.

---

## Section 5: Advanced Concepts Explained

### 1. The Open-Closed Principle in Service Architecture
The Open-Closed Principle (a fundamental tenet of object-oriented and service-oriented design stating that software entities should be open for extension, but closed for modification) is strictly observed in this service upgrade:
- We did NOT rewrite `ticket_service.py` from scratch, nor did we change the parameters expected by existing callers (Module M2).
- We extended `create_ticket()` by inserting the SLA deadline calculation step, preserving the existing signature so that all existing tests and endpoints continue to function without modification.
- We added new, specialized methods (`update_ticket_status`, `resolve_ticket`, `escalate_ticket`) to handle new lifecycle workflows as independent extensions.

### 2. Transaction Isolation & Rollback Guarantees
In relational database management, an ACID Transaction (Atomicity, Consistency, Isolation, Durability) guarantees that a series of operations either all succeed together or fail completely with zero side effects:
- When a staff member resolves a ticket, three separate mutations occur: `status` is updated, `resolved_at` is stamped, and `resolution_notes` is appended.
- If an unexpected error occurs (such as a database lock timeout) during notes formatting, SQLAlchemy automatically executes `db.rollback()`.
- The database returns to its exact pre-mutation state: the ticket remains `IN_PROGRESS` and no corrupt, half-written data is committed to disk.

### 3. Temporal Indexing & Breach Query Optimization
In large-scale database deployments with hundreds of thousands of tickets, querying all records to evaluate deadlines in Python can degrade performance:
- In `Ticket` ORM model (Module M1), `sla_deadline` is explicitly declared with `index=True`.
- The SQLite query engine utilizes a B-tree index on `sla_deadline`, allowing the database to identify tickets where `sla_deadline < now` using logarithmic binary search $O(\log N)$ rather than scanning the entire table $O(N)$.
- In `get_active_sla_breaches()`, the service pre-filters tickets at the database level (`Ticket.status.in_(["SUBMITTED", "IN_PROGRESS", "ESCALATED"])`), ensuring that only active, unresolved issues are loaded into Python memory for evaluation.

---

## Section 6: Definition of Done & Verification Protocol

### Observable Verification Checklist
* [ ] `ticket_service.py` is upgraded to calculate and stamp `sla_deadline` during `create_ticket()`.
* [ ] `update_ticket_status()` validates transitions via `lifecycle.py` and appends audit logs.
* [ ] `resolve_ticket()` validates resolution notes, sets status to `RESOLVED`, stamps `resolved_at`, and appends closure report.
* [ ] `escalate_ticket()` transitions tickets to `ESCALATED` with documented reasons.
* [ ] `get_active_sla_breaches()` filters and returns tickets that are overdue or approaching breach.
* [ ] Illegal state transitions raise exceptions and execute database rollbacks with zero partial updates.

### Verification Commands & Troubleshooting Matrix

1. **Verify Automatic SLA Deadline Stamping on Ingestion:**
   Run in backend directory:
   `python -c "from app.db.session import SessionLocal; from app.services.ticket_service import create_ticket; from app.schemas.ticket import TicketCreate; db = SessionLocal(); t = create_ticket(db, TicketCreate(title='Power Failure in Lab 4', description='Complete electrical outage in computer lab 4', location='Block 2, Lab 4')); print('Created ticket:', t.tracking_code, '| Deadline:', t.sla_deadline, '| Status:', t.status); db.close()"`
   Expected output: `Created ticket: TICK-XXXX | Deadline: <valid future timestamp> | Status: SUBMITTED`.

2. **Verify Legal Status Transition & Audit Log:**
   Run in backend directory:
   `python -c "from app.db.session import SessionLocal; from app.services.ticket_service import update_ticket_status; db = SessionLocal(); t = update_ticket_status(db, 1, 'IN_PROGRESS', 'Squad arriving on site', 'Staff-1'); print('New Status:', t.status, '| Notes:', t.resolution_notes); db.close()"`
   Expected output: `New Status: IN_PROGRESS | Notes: [STATUS_CHANGE: ... | SUBMITTED -> IN_PROGRESS | Actor: Staff-1] Reason/Notes: Squad arriving on site`.

3. **Verify Verified Ticket Resolution:**
   Run in backend directory:
   `python -c "from app.db.session import SessionLocal; from app.services.ticket_service import resolve_ticket; db = SessionLocal(); t = resolve_ticket(db, 1, 'Replaced faulty circuit breaker in main distribution box', 'Circuit Breaker 32A', 'Tech Alex'); print('Status:', t.status, '| Resolved At:', t.resolved_at); db.close()"`
   Expected output: `Status: RESOLVED | Resolved At: <valid UTC timestamp>`.

4. **Troubleshooting Matrix:**
   * *Problem:* Newly created tickets have `sla_deadline = None` in the database.
     * *Cause:* `create_ticket()` was not updated to call `calculate_sla_deadline()` or failed to assign the value to `db_ticket.sla_deadline`.
     * *Fix:* Ensure `calculate_sla_deadline()` is imported and assigned before `db.add(db_ticket)`.
   * *Problem:* Calling `resolve_ticket` leaves `resolved_at` as `None`.
     * *Cause:* `ticket.resolved_at = datetime.utcnow()` was omitted or placed after `db.commit()`.
     * *Fix:* Verify that `ticket.resolved_at` is populated before `db.commit()`.
   * *Problem:* Status updates succeed even when illegal transitions are requested.
     * *Cause:* `validate_transition()` call was bypassed or caught internally without raising an error.
     * *Fix:* Ensure `validate_transition()` is invoked directly and allowed to raise custom exceptions.
