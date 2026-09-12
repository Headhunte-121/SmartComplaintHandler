# Module M5 Frontend: Staff Ticket Resolution Modal Specification

Authoritative Engineering Blueprint for `src/components/ResolutionNotesModal.jsx`.

---

## Section 1: Standard Purpose & Industry Role

### Standard Industry Role & Real-World Use Cases
In physical facility maintenance, IT service delivery, and municipal infrastructure management, closing an incident cannot be an anonymous or undocumented action. Simply clicking a "Done" checkbox without capturing what physical intervention was completed invites fraud, conceals recurring equipment failures, and eliminates administrative transparency.

A resolution modal dialog (a mandatory overlay interface that intercepts a user's intent to resolve an issue, requiring structured input of closure notes, parts consumed, and technician identities before permitting status closure) acts as the operational quality gate of the platform.

In professional service desk suites (such as ServiceNow or Salesforce Service Cloud), resolution modals enforce:
1. Substantive documentation: Requiring technicians to describe the root cause and repair steps.
2. Spare parts inventory tracking: Capturing hardware components, valves, or wiring replaced on-site.
3. Accountability: Recording the technician or contractor responsible for the physical repair.

### What WE Are Specifically Using It For in Smart Complaint Handler
In `SmartComplaintHandler`, `src/components/ResolutionNotesModal.jsx` is the definitive closure interface used by campus maintenance staff across all departments:
1. It is launched when a technician or facility staff member clicks "Resolve Complaint" inside `AdminDashboard.jsx` (Module M4).
2. It mounts an accessible, high-contrast modal dialog over a blurred backdrop (`fixed inset-0 bg-slate-900/60 backdrop-blur-sm`), capturing:
   - Detailed Resolution Notes: A required textarea input requiring a minimum of 10 characters (e.g. "Replaced 32A circuit breaker in main distribution panel") with a live character counter.
   - Parts Replaced (Optional): A text input recording hardware components consumed during repair (e.g. "PVC Pipe 2in, 1 Brass Gate Valve").
   - Technician Name (Optional): A text input recording the field worker who completed the repair.
3. It enforces client-side validation: disabling the "Confirm Resolution" button and highlighting borders in red (`border-rose-500`) if the resolution notes are empty or under 10 characters.
4. Upon form submission, it calls `resolveTicket()` from `@/api/sla` (Module M5), locks the modal in `submitting` state with an animated spinner, and upon receiving `HTTP 200`, notifies the parent dashboard to update the ticket's status to `RESOLVED` and close the modal.

### Future AI Integration & Roadmap Hooks
In Version 2 (V2), when our platform introduces automated AI-driven operational optimization via Gemini API, this resolution modal provides:
1. AI Repair Summary Autocomplete: A "Generate Summary with AI" button that analyzes the original complaint text and pre-populates standardized resolution notes based on typical campus repair patterns.
2. Photographic Evidence Upload: A dropzone allowing technicians to attach a photo of the completed repair, passing the image to Gemini Vision to automatically verify that the broken fixture was fixed before enabling the resolve button.
3. Automated Parts Inventory Deduplication: AI extraction that parses the `parts_replaced` field into structured inventory SKU codes, automatically decrementing warehouse parts balances.

### How Other Components Standardly Interact with This File
1. `AdminDashboard.jsx` imports `ResolutionNotesModal` and renders it conditionally:
   `<ResolutionNotesModal isOpen={isResolveModalOpen} ticket={selectedTicket} onClose={() => setIsResolveModalOpen(false)} onResolved={handleTicketResolved} />`.
2. When the user successfully resolves the ticket, this modal invokes `onResolved(updatedTicket)`, enabling the parent dashboard to update its table row immediately without requiring a full page refresh.
3. It imports and executes `resolveTicket()` from `src/api/sla.js` (Module M5).

### The Core Problem It Solves & Why It Exists
Without this resolution modal:
- Staff could resolve complaints with zero documentation, leaving students with no explanation of what work was done.
- Facility supervisors would have no visibility into what replacement parts are being used across campus dormitories and academic halls.
- Malicious or accidental button clicks could close open grievances permanently with no confirmation step.

---

## Section 2: What Must Be in This File & Why Each Item Is Needed

### 1. Component Props Contract
* `isOpen`: Boolean prop governing modal visibility. Returns `null` if `false`.
* `ticket`: The active ticket entity being resolved:
  - `id`: Integer primary key. Required.
  - `tracking_code`: String (e.g. `'TICK-8F2D'`). Required.
  - `title`: String complaint title.
  - `department_id`: Integer or string.
* `onClose`: Callback function triggered when the user cancels or closes the dialog.
* `onResolved`: Callback function triggered upon successful API resolution, passing the updated ticket entity back to the parent component.

### 2. Internal State Architecture
* `formData`: Object managing controlled inputs:
  - `resolution_notes`: String, initialized to `''`. Required.
  - `parts_replaced`: String, initialized to `''`. Optional.
  - `technician_name`: String, initialized to `''`. Optional.
* `errors`: Dictionary storing field validation errors (e.g. `{ resolution_notes: 'Must contain at least 10 characters' }`).
* `isSubmitting`: Boolean state indicating whether the network request is in flight.
* `serverError`: String storing backend error messages to display in an alert banner.

### 3. Modal Backdrop & Accessibility Shell
* Backdrop Overlay: Fixed full-viewport container: `fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm`.
* Stop Propagation Guard: Inner card element includes `onClick={e => e.stopPropagation()}` to prevent backdrop click closure when clicking inputs.
* Keyboard Dismissal: An `useEffect` hook listening for the `Escape` key to close the modal.
* Accessible ARIA Attributes: `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="resolve-modal-title"`.

### 4. Visual Form Fields & Layout Hierarchy
* Header Section:
  - Title: `<h3 id="resolve-modal-title" className="text-lg font-bold text-slate-900">Resolve Complaint</h3>`.
  - Subtitle: Displays the ticket tracking code in monospace typography: `ticket.tracking_code` and title.
* Resolution Notes Field (Required Textarea):
  - Semantic `<label htmlFor="resolution_notes">`: "Detailed Resolution & Work Performed" with red asterisk (`*`).
  - Textarea: `id="resolution_notes"`, `rows={4}`, `placeholder="Detail the physical repairs completed, components tested, and verify operational status..."`.
  - Character Counter: A bottom-aligned helper: `<span>{formData.resolution_notes.trim().length} / 1000 characters (min 10)</span>`.
  - Dynamic Error Outline: Red border (`border-rose-500`) if `errors.resolution_notes` is present.
* Parts Replaced Field (Optional Input):
  - Label: "Parts Replaced / Materials Consumed (Optional)".
  - Text Input: `placeholder="e.g., 2-inch PVC Valve, 5m Copper Wire, 1x Light Bulb"`.
* Technician Name Field (Optional Input):
  - Label: "Technician / Staff Name (Optional)".
  - Text Input: `placeholder="e.g., Dave Miller (Plumbing Squad 2)"`.
* Action Buttons Footer:
  - Secondary Button ("Cancel"): Neutral button calling `onClose()`. Disabled when `isSubmitting` is true.
  - Primary Button ("Confirm Resolution"): High-contrast emerald button with class `bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed`.
  - Dynamic Button Content: Displays spinner and "Resolving Ticket..." when submitting; displays "Confirm Resolution & Close" when idle.

---

## Section 3: Component Life-Cycle: Input, Process, Output (IPO Table)

| Life-Cycle Phase | Primary Input | Internal Validation & Execution | Final Output |
| :--- | :--- | :--- | :--- |
| **1. Modal Mount** | Staff clicks "Resolve" in dashboard | Component mounts over blurred backdrop; resets form state; focuses textarea. | High-contrast resolution dialog displayed on screen. |
| **2. Keystroke Validation** | Staff types 6 characters ("Fixed") | `onChange` updates state; counter displays `5 / 1000`; detects length < 10. | Submit button remains disabled; inline helper text reminds staff of 10-char min. |
| **3. Valid Input Entry** | Staff types 35 characters | Counter updates (`35 / 1000`); clears validation errors; enables submit button. | Submit button highlights in emerald; ready for submission. |
| **4. In-Flight Submission** | Staff clicks "Confirm Resolution" | Sets `isSubmitting = true`; disables inputs; dispatches `resolveTicket()` via `@/api/sla`. | UI locks with spinner; background network request executes. |
| **5. Success Handoff** | Server returns `201/200` with updated ticket | Calls `onResolved(updatedTicket)`; calls `onClose()`; unmounts modal. | Modal closes smoothly; parent dashboard table updates ticket row to `RESOLVED`. |
| **6. Backend Error Catch** | Server returns 400 (e.g. illegal jump) | Catch block captures error; sets `serverError`; sets `isSubmitting = false`. | Red error banner renders inside modal; staff input is preserved. |

---

## Section 4: Flexibility & Modification Guide

### 🟢 Safe to Modify & Customize
* **Placeholder Guidance Strings**: You may adjust placeholder text in the notes, parts, and technician inputs to match campus trade terminology.
* **Modal Elevation & Width**: You can customize card max-width (`max-w-lg` to `max-w-xl`) or border radius (`rounded-xl` to `rounded-2xl`).
* **Optional Field Defaults**: You can pre-populate the technician name input from the currently logged-in user session if an authentication context is available.

### 🔴 Strict Non-Negotiables (Do NOT Alter)
* **Minimum 10 Characters Enforcement**: Do NOT remove the client-side validation requiring `formData.resolution_notes.trim().length >= 10`. Disabling this allows empty or meaningless submissions that will be rejected by the backend with HTTP 422 or 400 errors.
* **Stop Propagation on Modal Card**: Do NOT remove `onClick={e => e.stopPropagation()}` from the inner modal container. Removing it causes any click inside the form to bubble to the backdrop, accidentally closing the modal and wiping out typed text.
* **`onResolved` Callback Execution**: Always invoke `onResolved(updatedTicket)` on successful resolution before calling `onClose()`. Omitting this prevents the parent dashboard from updating in-memory state.

---

## Section 5: Architectural & Theoretical References

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

## Section 6: Definition of Done & Verification Protocol

### Observable Verification Checklist
* [ ] `src/components/ResolutionNotesModal.jsx` exists and is exported as default.
* [ ] Renders Resolution Notes (textarea), Parts Replaced (input), and Technician Name (input).
* [ ] Displays live character counter for resolution notes (`X / 1000 characters`).
* [ ] Submit button is disabled when resolution notes contain fewer than 10 non-whitespace characters.
* [ ] Submitting valid notes calls `resolveTicket()` from `src/api/sla.js`.
* [ ] Displays loading spinner and disables buttons while submission is in flight.
* [ ] Invokes `onResolved(updatedTicket)` and closes modal upon receiving HTTP 200 response.
* [ ] Pressing Escape key or clicking backdrop closes the modal without submitting.
* [ ] Clicks inside the form do NOT close the modal.

### Verification Commands & Troubleshooting Matrix

1. **Verify Modal Launch & Character Counter:**
   In browser on `http://localhost:5173/admin`, trigger the resolution modal on an `IN_PROGRESS` ticket.
   Observe: Modal opens with blurred backdrop. Type "Fixed valve".
   Confirm counter displays `11 / 1000 characters`. Confirm submit button enables.

2. **Verify Short Notes Guard:**
   Backspace text to "Fixed".
   Confirm counter displays `5 / 1000 characters`. Confirm submit button disables with red helper text.

3. **Verify Successful Resolution Flow:**
   Type "Replaced broken 2-inch PVC valve under sink and tested water flow".
   Enter Parts: "PVC Valve 2in". Enter Technician: "Dave M.".
   Click "Confirm Resolution & Close".
   Confirm button shows spinner and "Resolving Ticket...".
   Confirm modal closes and parent dashboard table updates ticket status to `RESOLVED`.

4. **Troubleshooting Matrix:**
   * *Problem:* Clicking the textarea immediately closes the modal.
     * *Cause:* `event.stopPropagation()` was omitted from the modal card container.
     * *Fix:* Ensure `onClick={e => e.stopPropagation()}` is placed on the inner modal card element.
   * *Problem:* Form submit triggers full page reload.
     * *Cause:* `event.preventDefault()` was omitted from `handleSubmit`.
     * *Fix:* Add `e.preventDefault()` on the first line of the form submission handler.
   * *Problem:* Parent dashboard does not reflect the resolved status after modal closes.
     * *Cause:* `onResolved` prop callback was not invoked with the server response.
     * *Fix:* Verify `if (onResolved) onResolved(updatedTicket);` is called inside the `try` block before `onClose()`.
