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

# 5. Architectural & Theoretical References

This specification operates strictly as an **implementation and integration blueprint**. For the exhaustive computer science fundamentals, language runtime mechanics, and protocol specifications governing this component, consult the following authoritative manuals in the **Developer Guide Suite**:

* [**Guide 07: React 18 Architecture & Virtual DOM**](../../../developer_guide/07_REACT_18_AND_VIRTUAL_DOM_ARCHITECTURE.md)  
  Fiber tree reconciliation, React Hooks lifecycle (`useState`, `useEffect`, `useCallback`, `useMemo`), and closure capture safety.

* [**Guide 08: Tailwind CSS & PostCSS Architecture**](../../../developer_guide/08_TAILWIND_CSS_AND_POSTCSS_ENGINEERING.md)  
  Semantic design tokens, responsive breakpoints, and utility class composition.

* [**Guide 20: Form State Machines & Optimistic UI**](../../../developer_guide/20_FORM_STATE_MACHINES_AND_OPTIMISTIC_UI.md)  
  Controlled input architectures, debounced event handling, and form validation state automata.

* [**Unit 05B: JavaScript Core Language & Syntax Primitives**](../../../developer_guide/05B_JAVASCRIPT_CORE_LANGUAGE_AND_SYNTAX_PRIMITIVES.md)  
  Object destructuring, arrow functions, and array declarative manipulation methods.

* [**Unit 06B: HTML5 Semantics & CSS3 Foundations**](../../../developer_guide/06B_HTML5_SEMANTICS_AND_CSS3_FOUNDATIONS.md)  
  Form controls, interactive focus indicators, and WCAG accessibility standards.

---

# 6. Definition of Done & Live Website Testing Procedure

### What This File Is Responsible For
This React component is responsible for **providing an administrative human-in-the-loop governance interface to safely override AI-assigned priority levels**. It renders a focused modal dialog that forces campus supervisors to document a clear, auditable justification before altering any ticket's urgency tier.

### What It Should Perform
When activated by a supervisor, this modal component performs the following operational safeguards:
1. **Context Awareness:** Opens in an accessible dialog window over a dimmed backdrop, displaying the current ticket tracking code, complaint title, and existing priority badge.
2. **Double Validation Guarding:**
   * Strictly keeps the "Confirm Override" button disabled if the newly selected priority is identical to the current priority (preventing redundant database updates).
   * Strictly keeps the button disabled if the audit reason contains fewer than 5 non-whitespace characters (enforcing institutional audit accountability).
3. **Reactive Character Counting:** Features a live character counter that warns in amber when fewer than 5 characters have been typed (`X/5 characters required (min 5)`), dynamically turning green once the minimum requirement is met.
4. **Asynchronous State Feedback:** Shows an inline spinning loading indicator and disables inputs while the backend network request is in-flight.
5. **Clean Optimistic Parent Notification:** Upon HTTP 200 confirmation, cleanly closes itself and calls `onPriorityUpdated(updatedTicket)` so the parent dashboard immediately reflects the new priority badge without requiring a manual page refresh.

### How to See It Performing Its Job on the Live Website
1. Navigate to **`http://localhost:5173/`** and locate the **"Supervisor Priority Override Modal Demo"** section (or click "Override Priority" on any ticket row in the supervisor dashboard).
2. Click **"Open Priority Override Modal"**.
3. **Observe Initial Guard State:**
   * Modal opens over a dimmed backdrop showing ticket information and the current badge.
   * Notice the **"Confirm Override"** button is completely disabled and grayed out.
4. **Observe Validation Guarding:**
   * Change the priority dropdown from `CRITICAL` to `HIGH`. Notice the button remains disabled.
   * Type `ok` (only 2 characters) in the reason field: observe the character counter warn in amber (`2/5 characters required (min 5)`) with the button still disabled.
5. **Execute Override and Observe Instant UI Update:**
   * Finish typing a complete justification: `False alarm confirmed by site supervisor inspection`.
   * Watch the counter turn green and the **Confirm Override** button turn active blue.
   * Click **Confirm Override**: observe the brief loading spinner, modal auto-dismissal, and the dashboard priority badge immediately updating to **`HIGH`** without a page reload.

