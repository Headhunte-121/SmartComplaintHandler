# Module M3 - Frontend File 04: Administrative Priority Override Modal
## Target File: `frontend/src/components/PriorityOverrideModal.jsx`
### Execution Track: Phase 3 (Can be built in parallel with Files 01 and 02)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In enterprise incident response platforms, ITIL service desks, and compliance-driven ticketing systems (such as PagerDuty, ServiceNow, and Jira Service Management), `components/PriorityOverrideModal.jsx` defines the **Controlled Human-in-the-Loop Severity Adjustment Modal Component**. It serves as the supervisory presentation gate that intercepts manual priority modifications: requiring explicit institutional justification, preventing unauthorized silent demotions, and ensuring tamper-evident audit logging.

### Standard Industry Role & Real-World Use Cases
In professional production systems, priority adjustment modals standardly fulfill four core architectural duties:

1. **Contextual Focus & Error Prevention (Modal Isolation):**
   * Uses modal backdrop styling to isolate the supervisor's attention on the high-consequence operational decision of modifying an incident's priority level.
   * Prevents accidental clicks on background elements while a severity change is being configured.
2. **Enforcing Institutional Compliance & Non-Repudiation:**
   * Acts as the client-side enforcement gate for audit compliance.
   * Disables the "Save Priority Change" button until the supervisor enters an explicit explanation (minimum 5 characters), guaranteeing that no complaint can be silently escalated or demoted without a recorded reason.
3. **Displaying Current Severity vs. Target Severity:**
   * Renders the complaint's current priority badge alongside a dropdown for the target tier, providing immediate visual contrast between the existing state and the proposed adjustment.
4. **Accessible Dialog Semantics (WAI-ARIA Standards):**
   * Adheres to accessibility best practices: binding the Escape key to close the dialog, trapping focus within the modal container, and returning focus cleanly upon dismissal.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our campus complaint automation platform, our 5-student engineering team specifically uses `frontend/src/components/PriorityOverrideModal.jsx` for four concrete operational functions:

1. **Facilitating Manual Priority Overrides from the Admin Desk:**
   * Launched when a facility supervisor clicks "Adjust Priority" on any complaint row in `AdminDashboard.jsx` or on the ticket detail view.
   * Displays the complaint's tracking code (`TICK-XXXX`), title, and current priority tier.
2. **Selecting Authorized Target Priority Tiers:**
   * Renders a dropdown containing the four official institutional priority tiers: `CRITICAL` (4h SLA), `HIGH` (12h SLA), `MEDIUM` (24h SLA), and `LOW` (72h SLA).
3. **Enforcing Mandatory Justification for Audit Logging:**
   * Features a controlled textarea input with a dynamic character counter (`"X / 500 characters (minimum 5 required)"`).
   * Explains that the entered reason is permanently appended to `ticket.resolution_notes` in SQLite.
4. **Submitting Changes via the Triage API Client:**
   * Dispatches `overrideTicketPriority(ticket.id, newPriority, overrideReason)` from `frontend/src/api/triage.js`.
   * On success, passes the updated ticket entity back to the parent view via `onPriorityUpdated()` callback and closes the modal smoothly.

### Future AI Integration & Supervisory Governance (V2 Roadmap)
While Version 1 overrides deterministic heuristics, this modal serves as the permanent Human-in-the-Loop gateway for future AI triage:
* **The Permanent Human Supervisory Gate:** In V2, when an AI model calculates the baseline priority from report narratives, human facility managers will use this exact modal to correct machine triage errors.
* **AI vs. Human Audit History:** When an override is submitted, the audit entry in `resolution_notes` will explicitly record both the AI's original recommendation and the human supervisor's justification (e.g. `"[PRIORITY OVERRIDE] Changed from CRITICAL (AI-Assigned) to MEDIUM. Reason: Site inspection confirmed harmless radiator steam."`).
* **Stable Interface:** Upgrading the backend to AI requires zero modifications to this modal component.

### How Other Components Standardly Interact with This File
Across the frontend architecture, this component is consumed cleanly:
* **The Staff Admin Desk (`frontend/src/pages/AdminDashboard.jsx`):** Renders this modal conditionally, passing props: `ticket={activeTicket}`, `isOpen={!!activeTicket}`, `onClose={handleClose}`, and `onPriorityUpdated={handleUpdate}`.
* **The Priority Badge Component (`frontend/src/components/PriorityBadge.jsx`):** Rendered inside the modal to display the complaint's current and selected priority tiers.
* **The Triage API Client (`frontend/src/api/triage.js`):** Invoked inside this modal to execute `overrideTicketPriority()`.

### The Core Problem It Solves & Why It Exists
* **The "Silent Demotion" Hazard:** In unmanaged systems, a technician might silently lower an emergency ticket from CRITICAL to LOW to avoid SLA penalties. This modal guarantees every demotion requires an immutable justification.
* **Accidental Priority Changes:** Without a confirmation modal, a supervisor could accidentally change a priority while scrolling through a table.

---

# 2. What Must Be in This File & Why Each Item Is Needed

To be complete, accessible, and production-grade, `frontend/src/components/PriorityOverrideModal.jsx` must define and render the following six structural components:

---

### Item 1: Component Props Specification
* **What it is:** Accepted properties passed from parent views.
* **Props:**
  * `ticket: Object` (The selected complaint object: `id`, `tracking_code`, `title`, `priority`, `resolution_notes`).
  * `isOpen: boolean` (Controls modal visibility in the DOM).
  * `onClose: function` (Callback fired when user clicks Cancel, the close X button, or presses Escape).
  * `onPriorityUpdated: function` (Callback fired with the updated ticket JSON upon successful server response).
* **Why it is needed:**
  * Provides a decoupled component interface that can be launched from anywhere in the application.

---

### Item 2: Internal Form State Management
* **What it is:** React state hooks managing input values, validation, and network status.
* **Required State Variables:**
  * `newPriority`: String holding the selected priority tier (defaults to `ticket.priority` or next logical tier).
  * `overrideReason`: String holding the supervisor's explanation text.
  * `submitting`: Boolean disabling buttons while HTTP PATCH resolves.
  * `error`: String holding error messages returned by the backend.
* **Why it is needed:**
  * Encapsulates form input state cleanly inside the modal dialog.

---

### Item 3: Modal Backdrop & Layout Overlay
* **What it is:** A fixed positioning container with semi-transparent backdrop blur.
* **Tailwind Classes:** `fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4`
* **Why it is needed:**
  * Focuses user attention and prevents accidental background clicks.

---

### Item 4: Incident Context Header & Metadata Summary
* **What it is:** Header section displaying ticket details.
* **Elements:**
  * Header Title: `"Adjust Priority - Ticket #" + ticket.tracking_code`.
  * Title Summary: Complaint title and current priority badge using `<PriorityBadge priority={ticket.priority} size="sm" />`.
* **Why it is needed:**
  * Confirms which specific incident is being modified.

---

### Item 5: Target Priority Dropdown Selector
* **What it is:** A styled HTML `<select>` input listing the four institutional priority tiers.
* **Options:**
  * `CRITICAL`: `"CRITICAL (4-Hour Response SLA)"`
  * `HIGH`: `"HIGH (12-Hour Response SLA)"`
  * `MEDIUM`: `"MEDIUM (24-Hour Response SLA)"`
  * `LOW`: `"LOW (72-Hour Response SLA)"`
* **Why it is needed:**
  * Restricts user selection strictly to the authorized `PriorityEnum` values recognized by the database.

---

### Item 6: Mandatory Justification Textarea & Action Buttons
* **What it is:** The audit explanation field and dialog action buttons.
* **Elements:**
  * Textarea: Bound to `overrideReason` with placeholder `"Enter mandatory explanation for this priority adjustment..."`.
  * Character Counter: Displays `overrideReason.length + "/500 characters (minimum 5 required)"`.
  * Error Alert Banner: Displays backend error messages if the submission fails.
  * "Cancel" Button: Calls `onClose()`.
  * "Save Priority Change" Button:
    * Disabled if `submitting || newPriority === ticket.priority || overrideReason.trim().length < 5`.
    * Displays loading spinner when `submitting === true`.
* **Why it is needed:**
  * Guarantees audit compliance by preventing submission of empty or uninformative explanations.

---

# 3. Component Life-Cycle: Input, Process, Output (IPO Table)

The following table documents the component life-cycle for `frontend/src/components/PriorityOverrideModal.jsx`:

| Life-Cycle Stage | Event Trigger | Internal Processing | Visual UI Output |
| :--- | :--- | :--- | :--- |
| **Open (Mount)** | `isOpen` becomes `true` | Initializes `newPriority = ticket.priority`, `overrideReason = ""`. | Modal animates onto screen over dimmed dashboard backdrop. |
| **Priority Picked** | User selects "LOW" in dropdown | Sets `newPriority = "LOW"`. | Dropdown shows new selection; button remains disabled pending reason. |
| **Reason Typed** | User types explanation | Updates `overrideReason` state; recalculates character counter. | Character counter advances; error message clears. |
| **Submit Clicked** | User clicks "Save Priority Change" | 1. Sets `submitting = true`.<br>2. Calls `overrideTicketPriority(ticket.id, newPriority, reason)`. | Button disables and displays spinning loading icon. |
| **Server Confirmed** | Network promise resolves | Calls `onPriorityUpdated(updatedTicket)`, calls `onClose()`. | Modal closes smoothly; parent dashboard updates priority badge. |
| **Server Error** | Network fails (e.g. 422 Unprocessable) | Sets `error = err.message`, sets `submitting = false`. | Displays red alert banner inside modal with backend error message. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. Strict Non-Negotiables

To maintain UI harmony and functional reliability, follow these operational rules:

### 🟢 Safe to Modify (Configurable Parameters)
* **Backdrop Blur & Transition Speeds:** You can customize Tailwind classes for modal transitions (`duration-200`, `scale-95` to `scale-100`).
* **Textarea Rows:** You can change textarea height (e.g. `rows={3}` or `rows={5}`).
* **Button Themes:** You can customize button background colors (e.g. `bg-rose-600` for critical changes).

### 🔴 Strict Non-Negotiables (System Breaking Changes)
* **DO NOT Allow Submissions with `overrideReason.trim().length < 5`:** Enforcing this minimum length is non-negotiable for audit compliance.
* **DO NOT Allow Submitting Without Changing Priority:** If `newPriority === ticket.priority`, the submit button must remain disabled to prevent redundant database writes.
* **DO NOT Mutate Props Directly:** Always notify the parent view via `onPriorityUpdated(updatedTicket)`.
* **DO NOT Omit Keyboard Dismissal:** Ensure pressing the Escape key invokes `onClose()`.

---

# 5. Advanced Frontend Concepts Explained: State & React Architecture

### 1. Controlled Component Form Validation in React
* **The Concept:** In React, a form input is **controlled** when its value is driven entirely by React state rather than internal DOM state.
* **How We Enforce Dynamic Validation:**
  * We bind: `<textarea value={overrideReason} onChange={e => setOverrideReason(e.target.value)} />`.
  * Every keystroke updates `overrideReason` in state and triggers a fast re-render.
  * We derive validity dynamically: `const isValid = newPriority !== ticket.priority && overrideReason.trim().length >= 5;`.
  * The submit button uses `disabled={!isValid || submitting}`.
  * This guarantees that the user cannot bypass validation rules via copy-pasting or rapid clicking.

### 2. Preventing DOM Memory Leaks with Cleanup Hooks
* **The Concept:** When a modal is opened, attaching global window event listeners (like listening for the Escape key) can cause memory leaks if not cleaned up when the modal unmounts.
* **The Solution (Effect Cleanup Function):**
  * Inside `useEffect(() => { ... }, [isOpen])`, we attach the event listener: `window.addEventListener('keydown', handleKeyDown)`.
  * At the end of the effect, we return a cleanup function: `return () => window.removeEventListener('keydown', handleKeyDown);`.
  * React executes this cleanup function whenever `isOpen` changes or the component unmounts, ensuring no orphaned event listeners remain in browser RAM.

---

# 6. Definition of Done: Observable Verification Checklist

Before considering `frontend/src/components/PriorityOverrideModal.jsx` complete, verify each of the following operational checkpoints:

### Implementation Checklist
- [ ] File exists at `frontend/src/components/PriorityOverrideModal.jsx`.
- [ ] Accepts props: `ticket`, `isOpen`, `onClose`, and `onPriorityUpdated`.
- [ ] Renders modal overlay with dimmed, blurred backdrop.
- [ ] Displays complaint metadata: tracking code, title, and current priority badge.
- [ ] Renders target priority dropdown listing `CRITICAL`, `HIGH`, `MEDIUM`, and `LOW`.
- [ ] Includes controlled textarea for `overrideReason` with dynamic character counter.
- [ ] Disables submit button if `overrideReason.trim().length < 5` or `newPriority === ticket.priority`.
- [ ] Calls `overrideTicketPriority()` on submit and displays error alerts if the backend rejects the request.
- [ ] Invokes `onPriorityUpdated()` and closes modal on success.
- [ ] Contains zero triple-backtick code blocks.

### Browser Verification Procedure

1. **Verify Modal Launch & Context Display:**
   * Open `http://localhost:5173/admin` and click "Adjust Priority" on ticket `TICK-XXXX`.
   * Observe that the modal opens cleanly, displaying the ticket tracking code and current priority badge.
2. **Verify Disabled Submit Button:**
   * Notice that the submit button is initially disabled because `newPriority` matches current priority and the reason is empty.
   * Select a new priority (e.g. change `CRITICAL` to `HIGH`). Observe button remains disabled pending reason.
3. **Verify Character Counter & Validation:**
   * Type `"abc"` (3 characters) into the textarea. Notice counter says `"3 / 500 characters (minimum 5 required)"` and button remains disabled.
   * Type `"Site inspection confirmed steam valve wear, no fire danger"` (58 characters). Observe button becomes active.
4. **Verify Successful Priority Update:**
   * Click "Save Priority Change".
   * Observe button displays a spinner, the modal closes, and the dashboard row updates with the new priority badge immediately.
