# Module M4 - Frontend File 04: Administrative Reassignment Modal
## Target File: `frontend/src/components/ReassignTeamModal.jsx`
### Execution Track: Phase 3 (Can be built in parallel with Files 01 and 03)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In enterprise workflow systems, Field Service Management (FSM) consoles, and ITIL incident desks, `components/ReassignTeamModal.jsx` defines the **Controlled Human-in-the-Loop Supervisory Modal Component**. It acts as the focused, interactive modal overlay that intercepts administrative ticket reassignments: displaying contextual incident metadata, rendering available candidate squads, enforcing mandatory institutional justification text, and orchestrating atomic state mutation over the network.

### Standard Industry Role & Real-World Use Cases
In professional production systems (such as ServiceNow ITSM, Salesforce Service Cloud, and Jira Work Management), supervisory modal dialogs standardly fulfill four core architectural duties:

1. **Contextual Focus & Error Prevention (Modal Isolation):**
   * Uses modal backdrop styling to isolate the user's attention on the high-consequence operational decision of workforce reassignment.
   * Prevents accidental clicks on background elements while a transfer is being configured.
2. **Enforcing Institutional Governance & Non-Repudiation:**
   * Acts as the client-side enforcement gate for audit compliance.
   * Mathematically disables the "Confirm Transfer" button until the supervisor enters a valid explanation (minimum 5 characters), guaranteeing that no complaint can be silently transferred without an audit explanation.
3. **Queue Depth & Squad Saturation Transparency:**
   * Renders real-time queue depth badges beside squad choices in the selection dropdown (e.g. `"Academic Electrical Crew (3 active tickets)"`).
   * Prevents supervisors from transferring tasks to already saturated squads.
4. **Accessible Dialog Semantics (Keyboard & Focus Traps):**
   * Implements accessible WAI-ARIA modal dialog conventions: binding the Escape key to close the modal, trapping keyboard focus inside the dialog, and restoring focus to the launching button upon dismissal.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our campus complaint automation platform, our 5-student engineering team specifically uses `frontend/src/components/ReassignTeamModal.jsx` for four concrete operational functions:

1. **Facilitating Manual Squad Transfers from the Admin Desk:**
   * Triggered when a supervisor clicks "Reassign Squad" on any complaint row in `AdminDashboard.jsx`.
   * Displays the complaint's tracking code (`TICK-XXXX`), title, current priority, and currently assigned squad.
2. **Displaying Department-Filtered Candidate Squads:**
   * Automatically queries available maintenance squads for the complaint's department (e.g. showing only Electrical squads for an electrical complaint).
   * Clearly flags off-duty squads with a visual `"(Off-Duty)"` badge to prevent transfers to absent crews.
3. **Enforcing Mandatory Reassignment Justification:**
   * Features a controlled textarea input with a dynamic character counter (`"X / 500 characters (minimum 5 required)"`).
   * Explains that the justification will be permanently recorded in the complaint's resolution notes for institutional accountability.
4. **Submitting Atomic Transfers via API Client:**
   * Invokes `reassignTicketTeam(ticket.id, selectedTeamId, reason)` from `frontend/src/api/assignment.js`.
   * On success, passes the updated ticket back to `AdminDashboard.jsx` via `onReassigned()` callback and closes the modal smoothly.

### Future AI Integration & Supervisory Governance (V2 Roadmap)
While Version 1 overrides deterministic heuristics, this modal serves as the permanent Human-in-the-Loop gateway for future AI dispatch:
* **The Permanent Human Supervisory Gate:** In V2, when predictive AI models or automated dispatch agents allocate complaints, human facility managers will use this exact modal to correct machine dispatch errors.
* **AI Confidence Explanation Display:** In V2, the modal will display why the AI made the original assignment (*"AI selected Hostel Squad based on 85% keyword match with bathroom plumbing"*) alongside the supervisor's new transfer dropdown.
* **Immutable Dual-Audit Trail:** The supervisor's override reason is appended directly alongside the AI's diagnostic reasoning, creating a transparent, auditable history of human-AI collaboration.

### How Other Components Standardly Interact with This File
Across the frontend architecture, this component is consumed cleanly:
* **The Staff Admin Desk (`frontend/src/pages/AdminDashboard.jsx`):** Renders this modal conditionally, passing props: `ticket={activeTicket}`, `isOpen={!!activeTicket}`, `onClose={handleClose}`, and `onReassigned={handleUpdate}`.
* **The Assignment API Client (`frontend/src/api/assignment.js`):** Invoked inside this modal to execute `reassignTicketTeam()`.

### The Core Problem It Solves & Why It Exists
* **Unaccountable Work Shifting:** In unmanaged systems, technicians pass complaints to other squads via casual chat messages without recording why. This modal forces supervisors to record an explicit reason for every transfer.
* **Accidental Form Submissions:** Without a confirmation dialog, a supervisor could accidentally click a dropdown and misassign a critical fire hazard to a carpentry squad.

---

# 2. What Must Be in This File & Why Each Item Is Needed

To be complete, accessible, and production-grade, `frontend/src/components/ReassignTeamModal.jsx` must define and render the following six structural components:

---

### Item 1: Component Props Specification
* **What it is:** Accepted properties passed from `AdminDashboard.jsx`.
* **Props:**
  * `ticket: Object` (The selected complaint: `id`, `tracking_code`, `title`, `department_id`, `assigned_team`, `priority`).
  * `isOpen: boolean` (Controls whether the modal is visible in the DOM).
  * `onClose: function` (Callback fired when user clicks Cancel, the close X button, or presses Escape).
  * `onReassigned: function` (Callback fired with the updated ticket JSON upon successful server response).
* **Why it is needed:**
  * Connects the modal to parent state without tight coupling.

---

### Item 2: Internal Form State Management
* **What it is:** React state hooks managing user input, validation, and network status.
* **Required State Variables:**
  * `selectedTeamId`: Integer/String of the chosen target squad.
  * `reason`: String holding the supervisor's justification text.
  * `candidateTeams`: Array of squad objects fetched for this department.
  * `loadingTeams`: Boolean indicating squad fetching in progress.
  * `submitting`: Boolean disabling buttons while HTTP PATCH resolves.
  * `error`: String holding error messages returned by the backend.
* **Why it is needed:**
  * Encapsulates form state cleanly inside the modal dialog.

---

### Item 3: Modal Backdrop & Layout Overlay
* **What it is:** A fixed positioning container with semi-transparent backdrop blur.
* **Tailwind Classes:** `fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4`
* **Why it is needed:**
  * Dimms background dashboard elements and centers the modal card on screen.

---

### Item 4: Incident Context Header & Metadata Summary
* **What it is:** Header section displaying ticket details so the supervisor knows what they are reassigning.
* **Elements:**
  * Header Title: `"Reassign Squad - Ticket #" + ticket.tracking_code`.
  * Title Summary: Complaint title and location string.
  * Current Squad Badge: Displays current `assigned_team` in a pill badge.
  * Priority Tag: Color-coded priority pill (`CRITICAL`, `HIGH`, etc.).
* **Why it is needed:**
  * Provides complete operational context before the supervisor makes a transfer decision.

---

### Item 5: Target Squad Dropdown Selector
* **What it is:** A styled HTML `<select>` input listing candidate squads.
* **Options:**
  * Placeholder: `"-- Select New Maintenance Squad --"`.
  * Options mapped from `candidateTeams`: Displays `squad.team_name + (squad.is_active ? ` (${squad.active_ticket_count} active)` : " (Off-Duty)")`.
  * If a squad is off-duty, adds visual text indication.
* **Why it is needed:**
  * Ensures the supervisor selects an authorized, existing squad belonging to the complaint's department.

---

### Item 6: Mandatory Justification Textarea & Action Buttons
* **What it is:** The audit explanation field and dialog action buttons.
* **Elements:**
  * Textarea: Bound to `reason` state with placeholder `"Explain why this ticket is being reassigned..."`.
  * Character Counter: Displays `reason.length + "/500 characters (minimum 5 required)"`. If `reason.length < 5`, text displays in amber/red.
  * Error Alert Banner: Displays backend error messages if the submission fails.
  * "Cancel" Button: Calls `onClose()`.
  * "Confirm Reassignment" Button:
    * Disabled if `submitting || !selectedTeamId || reason.trim().length < 5`.
    * Displays loading spinner when `submitting === true`.
* **Why it is needed:**
  * Guarantees audit compliance by preventing submission of empty or single-character explanations.

---

# 3. Component Life-Cycle: Input, Process, Output (IPO Table)

The following table documents the component life-cycle for `frontend/src/components/ReassignTeamModal.jsx`:

| Life-Cycle Stage | Event Trigger | Internal Processing | Visual UI Output |
| :--- | :--- | :--- | :--- |
| **Open (Mount)** | `isOpen` becomes `true` | Resets `reason = ""`, `selectedTeamId = ""`. Fetches squads for `ticket.department_id`. | Modal animates onto screen over dimmed dashboard backdrop. |
| **Squad Selected** | User picks squad in dropdown | Sets `selectedTeamId = e.target.value`. | Dropdown shows selected squad; checks off-duty status. |
| **Reason Typed** | User types explanation | Updates `reason` state; recalculates character counter. | Character counter advances; error message clears. |
| **Submit Clicked** | User clicks "Confirm Reassignment" | 1. Sets `submitting = true`.<br>2. Calls `reassignTicketTeam(ticket.id, selectedTeamId, reason)`. | Button disables and displays spinning loading icon. |
| **Server Confirmed** | Network promise resolves | Calls `onReassigned(updatedTicket)`, calls `onClose()`. | Modal closes smoothly; parent dashboard updates squad badge. |
| **Server Error** | Network fails (e.g. 400 Bad Request) | Sets `error = err.message`, sets `submitting = false`. | Displays red alert banner inside modal with backend error message. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. Strict Non-Negotiables

To maintain UI harmony and functional reliability across the frontend, follow these operational rules:

### 🟢 Safe to Modify (Configurable Parameters)
* **Backdrop Blur & Transition Speeds:** You can customize Tailwind classes for modal transitions (`duration-200`, `scale-95` to `scale-100`).
* **Textarea Rows:** You can change textarea height (e.g. `rows={3}` or `rows={5}`).
* **Helper Text Phrasing:** You can customize the explanatory helper text under the textarea.
* **Theme Colors:** You can adjust the button colors (e.g. `bg-indigo-600` vs `bg-blue-600`).

### 🔴 Strict Non-Negotiables (System Breaking Changes)
* **DO NOT Allow Submissions with `reason.trim().length < 5`:** Enforcing this minimum length is non-negotiable for audit compliance.
* **DO NOT Submit Without a Selected Squad ID:** Ensure `selectedTeamId` is non-empty before enabling the confirm button.
* **DO NOT Mutate Props Directly:** Never modify `ticket.assigned_team` directly inside the modal; always notify the parent via `onReassigned(updatedTicket)`.
* **DO NOT Omit Keyboard Dismissal:** Ensure pressing the Escape key invokes `onClose()` to adhere to accessibility standards.

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

# 6. Definition of Done: Observable Verification Checklist

Before considering `frontend/src/components/ReassignTeamModal.jsx` complete, verify each of the following operational checkpoints:

### Implementation Checklist
- [ ] File exists at `frontend/src/components/ReassignTeamModal.jsx`.
- [ ] Accepts props: `ticket`, `isOpen`, `onClose`, and `onReassigned`.
- [ ] Renders modal overlay with dimmed, blurred backdrop.
- [ ] Displays complaint metadata: tracking code, title, priority, and current squad.
- [ ] Renders target squad dropdown listing candidate squads for the complaint's department.
- [ ] Includes controlled textarea for `reason` with dynamic character counter.
- [ ] Disables "Confirm Reassignment" button if `reason.trim().length < 5` or no squad is selected.
- [ ] Calls `reassignTicketTeam()` on submit and displays error alerts if the backend rejects the request.
- [ ] Invokes `onReassigned()` and closes modal on success.
- [ ] Contains zero triple-backtick code blocks.

### Browser Verification Procedure

1. **Verify Modal Launch & Context Display:**
   * Open `http://localhost:5173/admin` and click "Reassign" on ticket `TICK-XXXX`.
   * Observe that the modal opens cleanly, displaying the ticket tracking code and current squad.
2. **Verify Disabled Submit Button:**
   * Notice that the "Confirm Reassignment" button is initially disabled.
   * Select a target squad from the dropdown; verify the button remains disabled because the reason is empty.
3. **Verify Character Counter & Validation:**
   * Type `"abc"` (3 characters) into the textarea. Notice the counter says `"3 / 500 characters (minimum 5 required)"` and button remains disabled.
   * Type `"Transferred for urgent equipment check"` (37 characters). Observe that the button becomes active.
4. **Verify Successful Reassignment Submission:**
   * Click "Confirm Reassignment".
   * Observe button displays a spinner, the modal closes, and the dashboard row updates with the new squad name.
