# Module M2 Frontend: Student Complaint Submission Page Specification

Authoritative Engineering Blueprint for `src/pages/SubmitComplaint.jsx`.

---

## Section 1: Standard Purpose & Industry Role

### Standard Industry Role & Real-World Use Cases
In web application engineering, intake forms are the primary interactive touchpoint between end-users and backend transactional pipelines. In enterprise customer support, issue ticketing, and facility management portals, a form must do far more than simply capture keystrokes: it must validate input syntax, enforce business logic boundaries, guard against double submissions, provide clear visual feedback during asynchronous network processing, and gracefully recover from server-side errors.

A controlled component (a React component where form data is handled by React component state rather than the browser DOM) ensures that every keystroke updates the component's internal state in real time. This enables live character count tracking, dynamic field validation, and conditional enabling of submit buttons.

A form state machine (an architectural pattern where the form explicitly transitions between defined lifecycle states: `idle`, `validating`, `submitting`, `success`, `error`) guarantees that users cannot submit duplicate records or trigger race conditions while network calls are in flight.

### What WE Are Specifically Using It For in Smart Complaint Handler
In `SmartComplaintHandler`, `src/pages/SubmitComplaint.jsx` is the front door of our campus facility automation platform:
1. It presents students with a clean, mobile-responsive card interface capturing four core complaint attributes:
   - Complaint Title: A concise summary of the issue (min 5, max 100 characters).
   - Detailed Description: A thorough explanation of the problem (min 10, max 1000 characters) with a live character countdown indicator.
   - Physical Location: The exact campus building, hostel, floor, or lab room where maintenance is required.
   - Department Hint (Optional): An optional dropdown selector allowing students to specify a department (Electrical, Plumbing, HVAC, Carpentry, Masonry, IT) or select "Auto-detect with Keyword Engine" (leaving department classification to our automated backend router).
2. It enforces real-time validation: highlighting inputs with high-contrast red borders (`border-rose-500`) and displaying clear inline error messages when constraints are violated.
3. Upon form submission, it transitions to `submitting` state, disables the submit button, renders an animated spinner, and invokes `submitComplaint()` from `@/api/complaints`.
4. On a successful `201 Created` response, it launches `<SubmissionSuccessModal />`, displaying the unique tracking code (`TICK-XXXX`) and resetting the form fields for future submissions.

### Future AI Integration & Roadmap Hooks
In Version 2 (V2), when our platform introduces automated AI-driven complaint processing via Gemini API endpoints, this page provides:
1. Real-Time AI Triage Preview Card: Integration with the `LiveTriageCard.jsx` component (Module M3), debouncing student keystrokes by 500ms to display predicted department classification and urgency levels (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) directly below the form as the student types.
2. AI Title Suggestion & Summarization: A "Summarize with AI" helper button that automatically condenses verbose complaint descriptions into crisp 10-word issue titles.
3. Photo Upload & Computer Vision Intake: A drag-and-drop image upload zone allowing students to attach photos of broken fixtures, automatically passing the image to Gemini Vision for hazard detection.

### How Other Components Standardly Interact with This File
1. `src/routes/AppRouter.jsx` mounts `SubmitComplaint.jsx` as the index route (`path: '/'`) inside `Layout.jsx`.
2. When the user successfully submits a ticket, this page passes the returned ticket object to `SubmissionSuccessModal.jsx` via a prop: `<SubmissionSuccessModal isOpen={isModalOpen} ticket={createdTicket} onClose={handleCloseModal} />`.
3. It imports and executes `submitComplaint()` from `src/api/complaints.js` (Module M2).

### The Core Problem It Solves & Why It Exists
Without this blueprint:
- Students submit malformed or empty complaints ("help", "broken"), which fail backend database constraints and trigger generic server errors.
- Double-clicking the submit button sends duplicate complaints to the database, cluttering maintenance queues with identical tickets.
- If a network error occurs, the entire form resets, destroying several paragraphs of student text and causing extreme user frustration.

---

## Section 2: What Must Be in This File & Why Each Item Is Needed

### 1. Component State Architecture
* Form Data State (`formData`): A single React state object managed by `useState`:
  - `title`: String, initialized to `''`.
  - `description`: String, initialized to `''`.
  - `location`: String, initialized to `''`.
  - `department_id`: String or number, initialized to `''` (empty string indicates auto-detect).
* Field Validation Errors State (`errors`): A dictionary mapping field names to error messages (e.g. `{ title: 'Title must be at least 5 characters' }`).
* Form Lifecycle State (`submitStatus`): A string state taking one of four values: `'idle'`, `'submitting'`, `'success'`, `'error'`.
* Global Server Error State (`serverError`): A string storing backend error messages to display in a top-level alert banner.
* Success Modal State: A boolean `isSuccessModalOpen` and an object `createdTicket` to store the server response.

### 2. Form Input Fields & Layout Hierarchy
* Container Layout: A centered card container with class `max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8`.
* Header Section: An institutional title "Lodge a Campus Facility Complaint" and a helpful subtitle "Your issue will be automatically routed to the appropriate maintenance squad with live tracking."
* Title Input Field:
  - Semantic `<label htmlFor="title">`: "Complaint Title" with a red required asterisk (`*`).
  - Text `<input id="title" name="title">`: `placeholder="e.g., Water pipe burst in Hostel B washroom"`.
  - Input attributes: `maxLength={100}`, `required`, `disabled={isSubmitting}`.
  - Dynamic error styling: Applies `border-rose-500 focus:ring-rose-500` if `errors.title` exists; otherwise `border-slate-300 focus:ring-indigo-500`.
* Description Input Field:
  - Semantic `<label htmlFor="description">`: "Detailed Description" with required asterisk.
  - Textarea `<textarea id="description" name="description" rows={5}>`: `placeholder="Describe the exact issue, equipment affected, and any safety hazards..."`.
  - Live Character Counter: A bottom-aligned counter: `<span>{formData.description.length} / 1000 characters (min 10)</span>`.
* Location Input Field:
  - Semantic `<label htmlFor="location">`: "Campus Location" with required asterisk.
  - Text `<input id="location" name="location">`: `placeholder="e.g., Hostel B, 2nd Floor, Room 204 or Library 1st Floor"`.
* Department Hint Selector (Optional):
  - Semantic `<label htmlFor="department_id">`: "Department Category (Optional)" with a helper tooltip: "Leave as Auto-Detect to let our automated engine classify your complaint."
  - `<select id="department_id" name="department_id">`:
    - Option 1: Value `""` -> "Auto-detect with Keyword Engine (Recommended)"
    - Option 2: Value `"1"` -> "Electrical Maintenance"
    - Option 3: Value `"2"` -> "Plumbing & Water Services"
    - Option 4: Value `"3"` -> "HVAC & Air Conditioning"
    - Option 5: Value `"4"` -> "Carpentry & Furniture"
    - Option 6: Value `"5"` -> "Masonry & Structural Maintenance"
    - Option 7: Value `"6"` -> "IT & Network Infrastructure"
* Submit Button:
  - Interactive `<button type="submit">`: Full-width or right-aligned primary button with class `bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed`.
  - Dynamic Button Content: When `submitStatus === 'submitting'`, displays an SVG spinner and text "Submitting Complaint..."; when `idle`, displays "Submit Complaint".

### 3. Client-Side Validation Logic (`validateForm()`)
* Execution Timing: Triggered on form submit and on input blur.
* Validation Rules:
  - Title: Must not be empty after trimming. Length must be between 5 and 100 characters.
  - Description: Must not be empty after trimming. Length must be between 10 and 1000 characters.
  - Location: Must not be empty after trimming. Length must be between 3 and 100 characters.
* Returns: A boolean `isValid`. If false, populates `errors` state dictionary and focuses the first invalid input field.

### 4. Asynchronous Submission Handler (`handleSubmit()`)
* Event Prevention: Calls `event.preventDefault()` to stop traditional browser page submission.
* Validation Gate: Runs `validateForm()`. If validation fails, halts execution immediately.
* Network Dispatch: Sets `submitStatus = 'submitting'` and `serverError = ''`.
* Calls `submitComplaint(formData)` from `@/api/complaints`.
* Success Handling:
  - Sets `createdTicket` to returned ticket entity.
  - Opens modal: `setIsSuccessModalOpen(true)`.
  - Sets `submitStatus = 'success'`.
  - Resets `formData` to initial blank state so subsequent submissions start fresh.
* Error Catching:
  - Sets `submitStatus = 'error'`.
  - Sets `serverError` to `error.message` (or Pydantic validation message).
  - Preserves user input in `formData` so the student does not lose what they typed.

---

## Section 3: Component Life-Cycle: Input, Process, Output (IPO Table)

| Life-Cycle Phase | Primary Input | Internal Transformation & Logic | Final Output |
| :--- | :--- | :--- | :--- |
| **1. Page Render** | User opens `http://localhost:5173/` | Component initializes form state; renders empty controlled inputs, character counters, and submit button. | Clean, accessible complaint intake form rendered in viewport. |
| **2. Real-Time Keystrokes** | Student types in description input | `onChange` handler updates `formData.description`; React re-renders character counter (`45 / 1000`); clears existing field errors. | Responsive live text display; character counter updates smoothly. |
| **3. Validation Failure** | Student clicks Submit with 3-character title | `validateForm()` fails title length check; populates `errors.title = 'Title must be at least 5 characters'`. | Submit halts; title input outlines in red (`border-rose-500`); red helper message appears beneath input. |
| **4. In-Flight Submission** | Student submits valid form | `handleSubmit()` sets `submitStatus = 'submitting'`; disables all inputs and submit button; renders loading spinner; dispatches `POST /tickets`. | UI locks to prevent double-submit; spinner signals active background network processing. |
| **5. Success Confirmation** | Backend returns `201 Created` with `TICK-8F2D` | Sets `createdTicket`; launches `SubmissionSuccessModal`; resets form fields to blank; sets status to `'success'`. | Modal appears on screen displaying tracking code `TICK-8F2D`; form is ready for next use. |
| **6. Server Failure Recovery** | Network disconnects or backend returns 500 | Catch block captures error; extracts message; sets `serverError`; sets status to `'error'`; leaves `formData` intact. | Red dismissible alert banner renders at top of form; all student text is preserved. |

---

## Section 4: Flexibility & Modification Guide

### 🟢 Safe to Modify & Customize
* **Placeholder Text & Guidance Hints**: You may freely modify the placeholder strings in the Title, Description, and Location inputs to align with campus terminology (e.g. changing "Hostel B" to "Dormitory North").
* **Department Category List**: If campus administrative structures change, you can safely add or modify options in the `<select>` dropdown (ensuring corresponding department IDs exist in the database).
* **Card Container Styling**: You can customize padding (`p-6` to `p-10`), rounded corners (`rounded-xl` to `rounded-2xl`), or background colors without altering form logic.

### 🔴 Strict Non-Negotiables (Do NOT Alter)
* **Form Field Names (`title`, `description`, `location`)**: Do NOT rename these object keys. They correspond exactly to the Pydantic schema keys expected by the backend (`POST /api/v1/tickets`). Renaming `title` to `complaint_title` will cause FastAPI to reject all requests with HTTP 422 errors.
* **Minimum Length Validations (5, 10, 3)**: Do NOT lower client-side minimum length validations below the backend Pydantic limits (Title min 5, Description min 10). Doing so will cause the frontend to submit payloads that the backend will reject.
* **Controlled Input Value Binding**: Every input must retain `value={formData[fieldName]}` and `onChange={handleChange}`. Converting them to uncontrolled inputs (`ref`) will break character counters, error clearing, and automated form reset.

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
* [ ] `src/pages/SubmitComplaint.jsx` exists and is exported as default.
* [ ] Renders Title, Description, Location inputs, Department Hint dropdown, and Submit button.
* [ ] Controlled state binds all input values and updates smoothly on keystrokes.
* [ ] Description field displays live character counter (`X / 1000 characters`).
* [ ] Submitting empty fields highlights invalid inputs in red and renders inline error messages.
* [ ] Submitting a valid form transitions button to loading state with spinner and text "Submitting Complaint...".
* [ ] Submitting a valid form calls `submitComplaint()` and launches `<SubmissionSuccessModal />` with the returned tracking code.
* [ ] Successful submission resets form fields to blank.
* [ ] Network failures render a red dismissible alert banner without wiping out student-entered text.

### Verification Commands & Troubleshooting Matrix

1. **Verify Live Form Validation in Browser:**
   Navigate to `http://localhost:5173/`.
   Click "Submit Complaint" immediately without entering data.
   Verify that red borders appear on Title, Description, and Location fields, and inline error text appears under each.

2. **Verify Character Counter:**
   Click the Description textarea. Type "Short text".
   Verify the counter displays "10 / 1000 characters". Type more text; verify counter increments.

3. **Verify Successful Submission & Modal Trigger:**
   Fill out:
   - Title: "Broken Classroom Chair"
   - Description: "The wooden chair in Seminar Hall 3 has a broken leg."
   - Location: "Academic Block 1, Seminar Hall 3"
   - Department: "Carpentry & Furniture"
   Click "Submit Complaint".
   Verify the button shows "Submitting Complaint..." spinner, followed by the appearance of the Success Modal displaying `TICK-XXXX`.
   Verify the underlying form fields have reset to blank.

4. **Troubleshooting Matrix:**
   * *Problem:* Form submissions fail with HTTP 422 `field required` for `location`.
     * *Cause:* Input name attribute is mismatched (e.g. `name="place"` instead of `name="location"`).
     * *Fix:* Verify that the input element has `name="location"` and updates `formData.location`.
   * *Problem:* Typing into inputs does not update the text on screen.
     * *Cause:* `onChange` handler is missing or does not call `setFormData({ ...formData, [name]: value })`.
     * *Fix:* Ensure the controlled `handleChange` function correctly spreads existing state and updates the named key.
   * *Problem:* Modal does not open upon successful submission.
     * *Cause:* `isSuccessModalOpen` state was not toggled to `true` in `handleSubmit` or modal component prop is named incorrectly.
     * *Fix:* Check `setIsSuccessModalOpen(true)` is called inside the `try` block and verify `<SubmissionSuccessModal isOpen={isSuccessModalOpen} ... />`.
