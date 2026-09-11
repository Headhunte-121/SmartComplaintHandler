# Module M5 Backend: Ticket Lifecycle State Machine & Automata Specification

Authoritative Engineering Blueprint for `backend/app/services/lifecycle.py`.

---

## Section 1: Standard Purpose & Industry Role

### Standard Industry Role & Real-World Use Cases
In software architecture, complex business entities (such as orders, bank transfers, legal contracts, or support tickets) cannot exist in arbitrary combinations of attributes. A ticket cannot be both "Resolved" and "Unassigned," nor can an issue skip directly from creation to closure without an operator ever inspecting it.

A Finite State Machine (FSM, a computational mathematical model consisting of a finite number of discrete states, transitions between those states, and actions, where an entity can be in exactly one state at any given moment) governs the lifecycle of business entities. An FSM defines:
1. An exhaustive set of legal states.
2. A deterministic transition table dictating which target states are reachable from any given current state.
3. Transition guards (validation rules and prerequisites that must evaluate to true before a transition is permitted).

In enterprise service management platforms (such as ServiceNow or Jira Service Management), the ticket lifecycle FSM prevents fraudulent closures, guarantees operational accountability, and maintains an unbroken audit trail of custody.

### What WE Are Specifically Using It For in Smart Complaint Handler
In `SmartComplaintHandler`, `backend/app/services/lifecycle.py` is the operational gatekeeper that controls all status changes across campus maintenance tickets:
1. It defines the formal state taxonomy for complaints:
   - `SUBMITTED`: Complaint ingested, tracking code assigned, queued for triage and dispatch.
   - `IN_PROGRESS`: Assigned to a maintenance squad, physical inspection or repair actively underway.
   - `ESCALATED`: Flagged by staff or supervisors due to SLA breach risk, hazard severity, or parts delays.
   - `ON_HOLD`: Temporarily paused awaiting external parts or campus access windows.
   - `RESOLVED`: Physical repair verified complete, closure notes documented.
   - `CLOSED`: Terminal archived state confirmed by student or facility administrator.
   - `CANCELLED`: Terminal state for duplicate, invalid, or retracted complaints.
2. It validates all state transitions via `validate_transition(current_status, target_status, notes)`, rejecting illegal shortcuts (such as attempting to move directly from `SUBMITTED` to `RESOLVED` without a technician ever picking up the ticket).
3. It enforces mandatory closure documentation: transitioning to `RESOLVED` requires `notes` with a minimum of 10 non-whitespace characters detailing what physical repair was performed.
4. It formats immutable, structured audit log entries (`[STATUS_CHANGE: 2026-09-11 14:30:00 UTC SUBMITTED -> IN_PROGRESS by Staff #3]`) appended to `resolution_notes` to guarantee permanent transparency.

### Future AI Integration & Roadmap Hooks
In Version 2 (V2), when our platform introduces automated AI-driven complaint processing and automated closure verification via Gemini API, this state machine provides:
1. AI Transition Trigger Hooks: Safe programmatic interfaces allowing Gemini AI to suggest state changes (such as auto-escalating a ticket when an unmonitored leak description indicates escalating structural damage) while subjecting AI triggers to the exact same transition guards as human operators.
2. Photographic Closure Verification Guard: An extended transition guard that requires Gemini Vision to inspect before-and-after photographs uploaded by technicians, asserting that the repair was physically completed before permitting the transition to `RESOLVED`.
3. Invariant Safety Enforcer: Regardless of AI model decisions or confidence scores, the state machine acts as the hard deterministic boundary that prevents AI agents from executing illegal transitions or bypassing mandatory documentation rules.

### How Other Components Standardly Interact with This File
1. `ticket_service.py` (Module M5 Backend) invokes `validate_transition()` before mutating any ticket's `status` column in SQLite. If validation fails, it rolls back the transaction and raises an exception.
2. `endpoints/sla.py` (Module M5 Backend) catches lifecycle exceptions (`InvalidStateTransitionError`, `MissingResolutionNotesError`) and converts them into structured HTTP 400 Bad Request responses with explanatory error messages.
3. The frontend progress stepper (`TrackTicket.jsx`) and status update buttons in `AdminDashboard.jsx` reflect the state topology defined in this specification.

### The Core Problem It Solves & Why It Exists
Without this state machine:
- Maintenance staff could click "Resolve" on tickets within 2 seconds of submission to artificially inflate performance metrics without doing any physical work.
- Tickets could be closed with empty or missing notes, leaving students and administrators with zero record of what repairs were performed.
- Concurrent updates could leave tickets in impossible ghost states (such as an already-cancelled ticket suddenly transitioning to `IN_PROGRESS`).

---

## Section 2: What Must Be in This File & Why Each Item Is Needed

### 1. State Enumeration & Allowed Transitions Table (`TRANSITION_RULES`)
* State String Constants:
  - `STATE_SUBMITTED = "SUBMITTED"`
  - `STATE_IN_PROGRESS = "IN_PROGRESS"`
  - `STATE_ESCALATED = "ESCALATED"`
  - `STATE_ON_HOLD = "ON_HOLD"`
  - `STATE_RESOLVED = "RESOLVED"`
  - `STATE_CLOSED = "CLOSED"`
  - `STATE_CANCELLED = "CANCELLED"`
* Terminal States Set: An immutable set `TERMINAL_STATES = { "CLOSED", "CANCELLED" }`. Tickets in these states can never undergo further transitions.
* Transition Matrix Dictionary (`TRANSITION_RULES`):
  - `"SUBMITTED"`: `{"IN_PROGRESS", "CANCELLED"}`
  - `"IN_PROGRESS"`: `{"RESOLVED", "ESCALATED", "ON_HOLD", "CANCELLED"}`
  - `"ESCALATED"`: `{"IN_PROGRESS", "RESOLVED"}`
  - `"ON_HOLD"`: `{"IN_PROGRESS", "CANCELLED"}`
  - `"RESOLVED"`: `{"CLOSED"}`
  - `"CLOSED"`: `set()` (empty set; no outbound transitions)
  - `"CANCELLED"`: `set()` (empty set; no outbound transitions)

### 2. Custom Domain Exceptions
* `InvalidStateTransitionError(Exception)`:
  - Raised when `target_status` is not in `TRANSITION_RULES.get(current_status, set())`.
  - Encapsulates `current_status`, `target_status`, and a human-readable explanation message.
* `MissingResolutionNotesError(Exception)`:
  - Raised when attempting to transition to `"RESOLVED"` without providing resolution notes or when notes contain fewer than 10 characters.
* `TerminalStateModificationError(Exception)`:
  - Raised when an operation attempts to alter a ticket that is already in `"CLOSED"` or `"CANCELLED"` state.

### 3. `validate_transition(current_status, target_status, notes)` Function Specification
* Function Signature: `def validate_transition(current_status: str, target_status: str, notes: str | None = None) -> bool`
* Case & Whitespace Normalization: Normalizes `current_status` and `target_status` using `.strip().upper()`.
* Terminal State Guard:
  - Checks if `current_status in TERMINAL_STATES`.
  - If true, raises `TerminalStateModificationError(f"Ticket is in terminal state '{current_status}' and cannot be modified.")`.
* Allowed Transition Lookup:
  - Retrieves `allowed_targets = TRANSITION_RULES.get(current_status, set())`.
  - If `target_status not in allowed_targets`:
    - Formats an error: `InvalidStateTransitionError(f"Illegal state transition from '{current_status}' to '{target_status}'. Allowed transitions: {sorted(list(allowed_targets))}")`.
* Resolution Notes Guard:
  - If `target_status == STATE_RESOLVED`:
    - Verifies that `notes` is a non-empty string and `len(notes.strip()) >= 10`.
    - If notes are missing or shorter than 10 characters, raises `MissingResolutionNotesError("Transition to RESOLVED requires detailed resolution_notes containing at least 10 characters.")`.
* Cancellation Reason Guard:
  - If `target_status == STATE_CANCELLED`:
    - Verifies that `notes` is provided (min 5 characters) explaining why the ticket is being cancelled (e.g. "Duplicate of TICK-1234").
* Return Value: Returns `True` if all validation guards pass.

### 4. `format_audit_log_entry(previous_status, new_status, actor, notes)` Function Specification
* Function Signature: `def format_audit_log_entry(previous_status: str, new_status: str, actor: str, notes: str | None = None) -> str`
* Timestamping: Generates current UTC timestamp in ISO 8601 format: `datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")`.
* Structured String Formatting:
  - Constructs a clean, parseable text line:
    `"[STATUS_CHANGE: {timestamp} | {previous_status} -> {new_status} | Actor: {actor}]"`
  - If `notes` is provided, appends: `" Reason/Notes: {notes.strip()}"`.
* Return Value: Returns the formatted single-line audit record string ready to be appended to the ticket's history.

---

## Section 3: Component Life-Cycle: Input, Process, Output (IPO Table)

| Life-Cycle Phase | Primary Input | Internal Transformation & Logic | Final Output |
| :--- | :--- | :--- | :--- |
| **1. Squad Starts Work** | `current = 'SUBMITTED'`, `target = 'IN_PROGRESS'` | Checks `TRANSITION_RULES['SUBMITTED']`; confirms `'IN_PROGRESS'` is valid; checks terminal state. | Returns `True`; allows status update to proceed. |
| **2. Illegal Jump Attempt** | `current = 'SUBMITTED'`, `target = 'RESOLVED'` | Checks `TRANSITION_RULES['SUBMITTED']`; `'RESOLVED'` is missing; identifies shortcut violation. | Raises `InvalidStateTransitionError`; transaction halts with HTTP 400. |
| **3. Empty Notes Closure** | `current = 'IN_PROGRESS'`, `target = 'RESOLVED'`, `notes = ''` | State transition is legal, but resolution notes guard detects `len(notes) < 10`. | Raises `MissingResolutionNotesError`; halts update; prompts staff for documentation. |
| **4. Valid Work Closure** | `current = 'IN_PROGRESS'`, `target = 'RESOLVED'`, `notes = 'Replaced 2-inch PVC valve under sink'` | Checks transition; validates notes length (38 chars >= 10); passes all guards. | Returns `True`; updates status; records `resolved_at` timestamp. |
| **5. Audit Trace Append** | Valid status change completed | Calls `format_audit_log_entry()`; formats timestamp, actor, previous/new state, notes. | String generated: `[STATUS_CHANGE: 2026-09-11 14:30:00 UTC | SUBMITTED -> IN_PROGRESS | Actor: Staff-4]` |

---

## Section 4: Flexibility & Modification Guide

### 🟢 Safe to Modify & Customize
* **Intermediate Operational States**: You can safely introduce additional intermediate states (such as `STATE_AWAITING_STUDENT = "AWAITING_STUDENT"`) by adding the string constant and updating the allowed destination sets in `TRANSITION_RULES`.
* **Minimum Notes Length**: You can adjust the minimum character threshold for resolution notes from 10 to 15 or 20 characters based on department policy.
* **Audit Log Format Template**: You may adjust the bracket style or separator tokens in `format_audit_log_entry` without breaking any business logic.

### 🔴 Strict Non-Negotiables (Do NOT Alter)
* **No Direct SUBMITTED to RESOLVED Transition**: The transition `SUBMITTED` -> `RESOLVED` must NEVER be permitted. A ticket must transition through `IN_PROGRESS` or `ESCALATED` to guarantee that a physical field worker acknowledged assignment before closing it.
* **Terminal States Immutability**: Once a ticket reaches `CLOSED` or `CANCELLED`, its state must remain immutable. Re-opening a closed ticket creates data corruption; if a student's problem recurs, a new ticket must be filed.
* **Explicit Exception Raising**: Validation functions must raise distinct custom exceptions (`InvalidStateTransitionError`, `MissingResolutionNotesError`) rather than returning boolean `False`. Raising exceptions ensures that FastAPI service transactions roll back atomically on failure.

---

## Section 5: Advanced Concepts Explained

### 1. Finite State Automata Theory in Enterprise Software
A Finite State Automaton (FSA) is a formal mathematical structure defined as a 5-tuple: $(Q, \Sigma, \delta, q_0, F)$:
- $Q$: The finite set of states: `{SUBMITTED, IN_PROGRESS, ESCALATED, ON_HOLD, RESOLVED, CLOSED, CANCELLED}`.
- $\Sigma$: The set of input triggers: `{assign_squad, start_work, resolve, escalate, close, cancel}`.
- $\delta$: The transition function mapping a state and trigger to a next state: $\delta: Q \times \Sigma \rightarrow Q$.
- $q_0$: The initial state: `SUBMITTED`.
- $F$: The set of final (terminal) states: `{CLOSED, CANCELLED}`.

By formally modeling ticket lifecycles as an FSA:
- Determinism: At every moment, the system is in exactly one well-defined state.
- Provable Safety: We mathematically prove that an unreachable or illegal state (e.g. a closed ticket returning to submitted) is impossible.
- Decoupling: The business logic of *what transitions are permitted* is completely isolated from the database operations of *how rows are updated*.

### 2. Transition Invariants & ACID Transactional Integrity
In database systems, an Invariant is a condition that must remain true for the database to be considered valid.

Our lifecycle engine establishes strict transaction invariants:
1. When `update_ticket_status()` is invoked in `ticket_service.py`, it first executes `validate_transition()`.
2. If `validate_transition()` raises an exception, execution never reaches `db.commit()`.
3. SQLAlchemy rolls back the pending transaction (`db.rollback()`), guaranteeing that the SQLite table row is never left with partial, invalid data.
4. If validation succeeds, the status update, the audit log append, and the timestamp updates are committed in a single atomic database transaction.

### 3. Append-Only Audit Trail Architecture
In compliance engineering, overwriting previous status notes creates a catastrophic loss of historical provenance:
- If Staff Member A notes "Inspected wiring, requires replacement part" and Staff Member B later resolves the ticket by overwriting the field with "Replaced wiring," the historical contribution of Staff Member A is erased.

Our lifecycle engine implements an Append-Only Audit Trail:
- When a status change occurs, the newly generated audit line from `format_audit_log_entry()` is concatenated to the existing text:
  `ticket.resolution_notes = (ticket.resolution_notes or "") + "\n" + new_audit_entry`
- The database column operates as a chronologically ordered, append-only ledger that documents every state transition, the user who performed it, and the timestamp down to the second.

---

## Section 6: Definition of Done & Verification Protocol

### Observable Verification Checklist
* [ ] `backend/app/services/lifecycle.py` exists, defining all 7 state constants and `TRANSITION_RULES`.
* [ ] `TERMINAL_STATES` contains `CLOSED` and `CANCELLED`.
* [ ] Custom exceptions `InvalidStateTransitionError` and `MissingResolutionNotesError` are defined.
* [ ] `validate_transition` permits `SUBMITTED` -> `IN_PROGRESS` and `IN_PROGRESS` -> `RESOLVED`.
* [ ] `validate_transition` raises `InvalidStateTransitionError` on illegal transitions (e.g. `SUBMITTED` -> `RESOLVED`).
* [ ] `validate_transition` raises `MissingResolutionNotesError` when transitioning to `RESOLVED` with empty or short notes (<10 chars).
* [ ] Modifying a ticket in `CLOSED` or `CANCELLED` state raises `TerminalStateModificationError`.
* [ ] `format_audit_log_entry` generates formatted audit strings containing UTC timestamps and actor identifiers.

### Verification Commands & Troubleshooting Matrix

1. **Verify Legal State Transitions via Python CLI:**
   Run in backend directory:
   `python -c "from app.services.lifecycle import validate_transition; print('Legal 1:', validate_transition('SUBMITTED', 'IN_PROGRESS')); print('Legal 2:', validate_transition('IN_PROGRESS', 'RESOLVED', 'Replaced damaged copper wire in ceiling'))"`
   Expected output: `Legal 1: True | Legal 2: True`.

2. **Verify Illegal Shortcut Rejection:**
   Run in backend directory:
   `python -c "from app.services.lifecycle import validate_transition; validate_transition('SUBMITTED', 'RESOLVED', 'Tried to close immediately')"`
   Expected output: Terminal displays `InvalidStateTransitionError: Illegal state transition from 'SUBMITTED' to 'RESOLVED'`.

3. **Verify Resolution Notes Validation Guard:**
   Run in backend directory:
   `python -c "from app.services.lifecycle import validate_transition; validate_transition('IN_PROGRESS', 'RESOLVED', 'Short')"`
   Expected output: Terminal displays `MissingResolutionNotesError: Transition to RESOLVED requires detailed resolution_notes containing at least 10 characters`.

4. **Troubleshooting Matrix:**
   * *Problem:* `validate_transition` rejects a valid transition with `Illegal state transition from 'SUBMITTED' to 'in_progress'`.
     * *Cause:* Target status was passed in lowercase without uppercase normalization.
     * *Fix:* Ensure `target_status.strip().upper()` is called at the top of `validate_transition`.
   * *Problem:* Transition to `RESOLVED` passes even with empty notes.
     * *Cause:* Notes validation checked `if notes:` instead of `if len(notes.strip()) >= 10`.
     * *Fix:* Verify that `len((notes or '').strip()) >= 10` is enforced.
   * *Problem:* Cancelled tickets can be reopened by changing status to `IN_PROGRESS`.
     * *Cause:* `TERMINAL_STATES` check was bypassed or not evaluated before `TRANSITION_RULES`.
     * *Fix:* Ensure the check `if current_status in TERMINAL_STATES:` is executed before any transition lookup.
