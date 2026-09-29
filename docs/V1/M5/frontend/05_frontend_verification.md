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

## Section 5: Architectural & Theoretical References

This specification operates strictly as an **implementation and integration blueprint**. For the exhaustive computer science fundamentals, language runtime mechanics, and protocol specifications governing this component, consult the following authoritative manuals in the **Developer Guide Suite**:

* [**Guide 10: Vite Build Engine & Module Bundling**](../../../developer_guide/10_VITE_AND_MODERN_BUILD_TOOLCHAINS.md)  
  Production bundle compilation, asset minification, and static export validation.

* [**Guide 07: React 18 Architecture & Virtual DOM**](../../../developer_guide/07_REACT_18_AND_VIRTUAL_DOM_ARCHITECTURE.md)  
  Component mount validation and teardown memory leak prevention.

* [**Unit 14B: Web Browser Security & Origin Policies**](../../../developer_guide/14B_WEB_BROWSER_SECURITY_AND_ORIGIN_POLICIES.md)  
  Browser DevTools console auditing, network inspect validation, and SOP error diagnostics.

---

---

## Section 6: Definition of Done & Live Website Verification

### What This File Is Responsible For
This document is responsible for **governing the complete frontend verification and quality certification protocol for Module M5**. It coordinates testing across the countdown timer, the resolution modal, the breach escalation panel, and lifecycle state changes.

### What It Should Perform
When executing verification across the frontend, this protocol ensures:
1. **Timer Precision:** Validates that countdown timers tick continuously and update severity colors at threshold boundaries.
2. **Resolution Guard Integrity:** Confirms that resolution modals strictly prevent empty or sub-10-character submissions.
3. **Lifecycle Visual Harmony:** Verifies that resolving a ticket updates the tracking page timeline and admin table without page reloads.

### How to See It Performing Its Job on the Live Website
1. Launch both dev servers: `npm run dev` and `uvicorn app.main:app --reload`.
2. Open **`http://localhost:5173/track`**:
   * Verify the countdown timer ticks down seconds in real time.
3. On **`http://localhost:5173/admin`**:
   * Click **Resolve** on an in-progress ticket, type a valid 10+ character explanation, and submit.
   * Confirm the ticket reflects `Status: RESOLVED` and the timer freezes with a green completion checkmark.
