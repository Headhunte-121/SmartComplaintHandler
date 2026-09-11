# Module M5 Frontend: 5-Checkpoint SLA & Lifecycle Verification Protocol

Authoritative Engineering Protocol for Frontend Timers, Modal Dialogs, Breach Tables & Quality Assurance.

---

## Section 1: Standard Purpose & Industry Role

### Standard Industry Role & Real-World Use Cases
In modern web applications managing critical operations (such as emergency dispatches, incident escalation centers, and facility tracking), user interfaces cannot be validated solely by static visual inspection. A countdown timer may look perfectly styled on initial mount, but suffer subtle memory leaks that crash the browser after 10 minutes of active use. A resolution modal might submit clean data on the happy path, but fail to display error messages when the backend rejects an invalid state machine transition.

A formal frontend verification protocol (a comprehensive, repeatable suite of diagnostic browser tests, synthetic timer validations, form guard assertions, and event delegation sweeps) provides undeniable proof that:
1. Dynamic countdown timers tick accurately every second, execute seamless color transitions across urgency tiers, and destroy background intervals on unmount.
2. Operational modals enforce validation guards (such as minimum character constraints) before network transmission.
3. Closed-loop resolution workflows update parent dashboard rows instantaneously upon receiving confirmed server responses.
4. Exception tables filter, sort, and display high-risk data with automated background polling.
5. Action delegation patterns correctly orchestrate supervisory modal dialogs without memory leaks or race conditions.

### What WE Are Specifically Using It For in Smart Complaint Handler
In `SmartComplaintHandler`, this verification protocol acts as the authoritative quality assurance gate for Module M5 Frontend:
1. It validates `SLACountdownTimer.jsx`: Asserting that timers tick once per second, shift colors from green to sky to pulsing amber, turn red with "Overdue by Xh Ym" for past deadlines, and freeze cleanly when a ticket is resolved.
2. It validates `ResolutionNotesModal.jsx`: Asserting that the submit button remains disabled when resolution notes are under 10 characters, outlines invalid inputs in red (`border-rose-500`), and submits structured closure data.
3. It validates the full resolution lifecycle handoff: Confirming that submitting the resolution modal calls `resolveTicket()`, updates the database, closes the modal, and refreshes the parent dashboard table row without page reloads.
4. It validates `SLABreachTable.jsx`: Proving that active breaches are displayed in a dedicated high-visibility panel, tabs filter overdue tickets from approaching breaches, and the 30-second polling interval refreshes data silently.
5. It validates action delegation: Confirming that clicking "Escalate" and "Reassign Squad" triggers parent modal overlays with the correct ticket context.

### Future AI Integration & Roadmap Hooks
In Version 2 (V2), when our platform introduces automated AI-driven operational optimization via Gemini API, this verification protocol provides:
1. AI Predictive Latency Assertion: Testing that client-side components render Gemini AI dynamic turnaround estimates alongside static deadlines without layout shifts.
2. Photographic Evidence Dropzone Test: Synthetic validation verifying that uploading high-resolution photos compresses images in a client-side web worker before dispatching to Gemini Vision endpoints.
3. Automated Anomaly Highlight Sweep: Testing that tickets flagged by Gemini AI as anomalous are decorated with intelligent callout badges in the breach table.

### How Other Components Standardly Interact with This File
1. Frontend developers execute this 5-checkpoint protocol before merging pull requests for Module M5.
2. Quality assurance team members use these steps to verify staff administrative workflows across desktop and tablet browsers.

### The Core Problem It Solves & Why It Exists
Without this verification protocol:
- Un-cleared `setInterval` hooks inside countdown timers would cause browser tabs to become sluggish and overheat mobile devices.
- Staff could discover in the field that resolution notes are submitted with empty text, failing backend database constraints and crashing forms.
- Supervisors would have no guarantee that the breach table is accurately reflecting current database statuses.

---

## Section 2: What Must Be in This File & Why Each Item Is Needed

### Checkpoint 1: SLA Countdown Timer Interval Ticks & Color Transitions Check
* Objective: Confirm that `SLACountdownTimer.jsx` decrements accurately and shifts colors across all 4 severity tiers.
* Verification Criteria:
  - Timer decrements seconds smoothly once every 1000ms.
  - Future deadlines > 4 hours render in green (`bg-emerald-50 text-emerald-700`).
  - Deadlines between 1 and 4 hours render in sky blue (`bg-sky-50 text-sky-700`).
  - Deadlines < 1 hour render as pulsing amber (`bg-amber-50 text-amber-700 animate-pulse`).
  - Past deadlines render as pulsing red (`bg-rose-100 text-rose-700`) displaying `"Overdue by Xh Ym"`.
  - Tickets with status `RESOLVED` render static compliance badges ("Resolved on Time") and freeze interval ticking.
  - Navigating away from the view cleans up the interval with zero unmounted state update warnings.

### Checkpoint 2: Resolution Notes Modal Validation & Character Counter Check
* Objective: Confirm that `ResolutionNotesModal.jsx` enforces input validation and character counting rules.
* Verification Criteria:
  - Modal launches cleanly over a blurred backdrop (`fixed inset-0 bg-slate-900/60 backdrop-blur-sm`).
  - Typing fewer than 10 characters disables the "Confirm Resolution" button.
  - Character counter updates dynamically on every keystroke (`X / 1000 characters`).
  - Typing 10 or more non-whitespace characters enables the submit button with emerald styling.
  - Pressing Escape or clicking the backdrop closes the modal without submitting.
  - Clicking inside the modal card does NOT close the modal.

### Checkpoint 3: Complete Ticket Resolution Flow & Parent State Refresh Check
* Objective: Confirm that resolving a ticket through the modal updates the backend and refreshes the parent view.
* Verification Criteria:
  - Submitting valid resolution notes transitions button to disabled state with text "Resolving Ticket..." and spinner.
  - The API client dispatches `POST /api/v1/tickets/{id}/resolve` with resolution notes, parts, and technician name.
  - Upon receiving HTTP 200, modal closes automatically and invokes `onResolved(updatedTicket)`.
  - Parent table row immediately updates status to `RESOLVED` and displays the closure timestamp without a full page refresh.

### Checkpoint 4: SLA Breach Table Data Rendering & Exception Filtering Check
* Objective: Confirm that `SLABreachTable.jsx` surfaces high-risk tickets and supports multi-tier filtering.
* Verification Criteria:
  - Queries `GET /api/v1/sla/breaches/active` on initial mount.
  - Displays red header counter pill reflecting total overdue count.
  - "All High-Risk Issues" tab displays all breached and near-breach records.
  - "Overdue Breaches" tab displays strictly tickets where `overdue_seconds > 0`.
  - "Approaching Breach" tab displays strictly tickets where remaining time is < 20%.
  - Manual refresh button spins during fetch and updates the `lastRefreshed` timestamp.
  - Polling interval automatically triggers every 30 seconds.

### Checkpoint 5: Supervisory Action Delegation & Empty State Verification Check
* Objective: Confirm that action buttons delegate through props and empty states render gracefully.
* Verification Criteria:
  - Clicking "Escalate" on a breach row invokes `onEscalate(ticket)` with the row's ticket entity.
  - Clicking "Reassign" on a breach row invokes `onReassign(ticket)`.
  - When zero breaches exist in the database, the table collapses and renders the emerald "Zero Active SLA Breaches" callout card.
  - Table and timer unmount cleanly with zero lingering background intervals.

---

## Section 3: Component Life-Cycle: Input, Process, Output (IPO Table)

| Verification Phase | Input Action | Execution & Evaluation Procedure | Expected Pass Result |
| :--- | :--- | :--- | :--- |
| **1. Timer Check** | Mount timer with 30-minute deadline | Inspects DOM every second; verifies seconds decrement; evaluates color classes. | Pulsing amber badge renders; seconds tick down: `29m 59s`, `29m 58s`. |
| **2. Modal Guard Check** | Open modal; type "Fixed" (5 chars) | `onChange` updates state; evaluates `length < 10`; checks button `disabled`. | Submit button is disabled; red helper text displays: "Min 10 chars". |
| **3. Resolution Flow Check** | Type 25 characters; click Confirm | Dispatches `POST /resolve`; catches 200 response; invokes `onResolved()`. | Modal closes; parent table updates ticket status to `RESOLVED`. |
| **4. Breach Filter Check** | Click "Overdue Breaches" tab in table | Filters active array where `overdue_seconds > 0`; re-renders table body. | Only overdue rows display; near-breach rows are hidden. |
| **5. Action Delegate Check** | Click "Escalate" button on breach row | Invokes prop callback `onEscalate(ticket)`. | Parent dashboard receives ticket; mounts escalation dialog. |

---

## Section 4: Flexibility & Modification Guide

### 🟢 Safe to Modify & Customize
* **Test Ticket Timestamps**: You may test timers using different synthetic deadline offsets (e.g. 5 minutes in the future, 2 hours in the past).
* **Browser Test Viewports**: You can execute these tests on mobile viewports (375px), tablets (768px), and widescreen monitors (1440px).
* **Network Speed Profiles**: You can enable Chrome Developer Tools network throttling ("Slow 3G") to inspect loading spinners in `ResolutionNotesModal.jsx`.

### 🔴 Strict Non-Negotiables (Do NOT Alter)
* **Sequential Checkpoint Order**: Do NOT skip checkpoints. Verifying resolution flow (Checkpoint 3) before proving that modal validation guards work (Checkpoint 2) will produce invalid test coverage.
* **Interval Leak Inspection**: Checkpoint 1 must verify that navigating away from the countdown timer does NOT throw React unmounted state update warnings in the browser console.
* **Double-Submit Prevention**: Checkpoint 3 must confirm that rapid double-clicks on the "Confirm Resolution" button dispatch exactly one HTTP request to the backend.

---

## Section 5: Advanced Concepts Explained

### 1. Synthetic Timer Progression in Browser DevTools
Testing countdown timers that take hours to transition between color bands would be impossibly slow if engineers had to wait for real-world clocks.

In our verification protocol, we test dynamic timers using Synthetic Timestamp Injection:
- In the browser Developer Tools console, we test the timer by passing synthetic `slaDeadline` props:
  - 5 hours ahead: Tests green pill (`bg-emerald-50`).
  - 2 hours ahead: Tests sky blue pill (`bg-sky-50`).
  - 30 minutes ahead: Tests pulsing amber pill (`bg-amber-50`).
  - 15 minutes past: Tests pulsing red overdue badge (`bg-rose-100`).
- This allows an engineer to verify all four visual states and their corresponding accessibility tags in less than 60 seconds.

### 2. Event Delegation Verification in Complex Dashboards
In component-based software architecture, validating event delegation requires verifying the complete callback chain:
- When the user clicks "Reassign" inside `SLABreachTable.jsx`, the button does not open the modal directly.
- It executes `onReassign(ticket)`.
- The verification protocol confirms that:
  1. The event object is not swallowed.
  2. The exact ticket entity for that row is passed to the parent handler.
  3. The parent `AdminDashboard.jsx` updates its `selectedTicketForReassign` state.
  4. The `ReassignTeamModal.jsx` mounts with the correct ticket title pre-populated.

### 3. Real-Time Memory Leak Auditing in React SPAs
A major cause of performance degradation in single-page applications is un-cleared intervals:
- Checkpoint 5 tests for memory leaks by navigating between the student tracker (`/track`) and the admin dashboard (`/admin`) ten times in rapid succession.
- In Chrome Developer Tools -> Performance / Memory tab, we verify that:
  1. JavaScript Heap size returns to baseline after garbage collection.
  2. Zero orphan timers remain ticking in the event loop.
  3. The browser console displays zero warnings about state updates on unmounted components.

---

## Section 6: Complete Verification Commands & Troubleshooting Matrix

### Verification Execution Commands

1. **Verify Countdown Timer Ticking in Browser:**
   Open `http://localhost:5173/track?code=TICK-XXXX` for an open ticket.
   Observe the countdown timer pill. Confirm the seconds value decrements smoothly every 1000ms.
   Open Developer Tools (F12) -> Console. Confirm zero unmounted state warnings appear.

2. **Verify Resolution Modal Character Guard:**
   Open `http://localhost:5173/admin`.
   Locate an `IN_PROGRESS` ticket. Click "Resolve Complaint".
   Confirm modal opens over blurred backdrop.
   Type "Replaced" (8 characters). Confirm counter shows `8 / 1000` and submit button is disabled.
   Type " valve in room". Confirm counter shows `22 / 1000` and submit button enables.

3. **Verify Ticket Resolution Flow:**
   With valid resolution notes entered, click "Confirm Resolution & Close".
   Confirm button displays spinner and "Resolving Ticket...".
   Confirm modal closes automatically.
   Confirm the table row for that ticket updates to `RESOLVED` and displays closure timestamp.

4. **Verify SLA Breach Table & Tabs:**
   In `AdminDashboard.jsx`, locate the SLA Breach Table at the top of the workstation.
   Verify the overdue counter pill matches the number of breached rows.
   Click "Overdue Breaches" tab: confirm near-breach rows are filtered out.
   Click "All High-Risk Issues" tab: confirm all rows return.
   Click manual refresh icon: confirm icon spins and data refreshes.

5. **Verify Empty State when No Breaches Exist:**
   Resolve or advance all overdue tickets in the database.
   Refresh dashboard.
   Confirm the breach table collapses and renders the emerald "Zero Active SLA Breaches" callout card with shield checkmark icon.

### Complete Troubleshooting Matrix

| Symptom / Failure | Root Cause | Exact Resolution Procedure |
| :--- | :--- | :--- |
| Timer displays `NaNh NaNm remaining` or flashes erratic numbers. | `slaDeadline` prop was passed as null or undefined. | Verify parent component passes valid ISO date string (e.g. `ticket.sla_deadline`). |
| Console warning: `Can't perform a React state update on an unmounted component`. | `SLACountdownTimer.jsx` or `SLABreachTable.jsx` omitted `clearInterval()` in `useEffect` cleanup. | Return `() => clearInterval(timer)` from the `useEffect` hook. |
| Submit button in `ResolutionNotesModal.jsx` remains disabled even after typing 15 characters. | Whitespace was not trimmed properly or validation condition checked an incorrect key. | Ensure validation checks `formData.resolution_notes.trim().length >= 10`. |
| Parent dashboard table does not update after modal successfully resolves ticket. | Modal omitted calling `onResolved(updatedTicket)` before closing. | Add `if (onResolved) onResolved(updatedTicket)` inside `handleSubmit` try block. |
| Breach table displays zero tickets even though open tickets in SQLite are overdue. | The backend endpoint returned an empty array because `sla_deadline` in database is null or status is `RESOLVED`. | Check database records to confirm open tickets have valid past `sla_deadline` values. |
