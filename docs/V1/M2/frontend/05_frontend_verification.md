# Module M2 Frontend: 5-Checkpoint Integration Verification & Quality Protocol

Authoritative Engineering Protocol for Student Intake, Ticket Submission, Clipboard Mechanics & Tracking Verification.

---

## Section 1: Standard Purpose & Industry Role

### Standard Industry Role & Real-World Use Cases
In modern user-facing web applications, the primary conversion and engagement funnel (such as submitting a support ticket, placing an e-commerce order, or lodging a civic complaint) must be verified through a closed-loop quality gate. If the student form submits invalid payloads, if the tracking code dialog fails to copy, or if the status tracker displays outdated information, the entire product value proposition collapses.

A domain verification protocol (a structured, repeatable series of diagnostic tests and quality checkpoints executed across the browser user interface and network boundary) proves that:
1. Form input validation rules reject malformed entries before they consume server resources.
2. Successful submissions launch confirmation dialogs containing unique reference identifiers.
3. Operating system clipboard integrations write data accurately across desktop and mobile devices.
4. Status lookups synchronize bidirectionally with URL search parameters and accurately render multi-stage lifecycle steppers.
5. Error states (such as non-existent tracking codes or network timeouts) are handled with actionable, user-friendly guidance rather than unhandled JavaScript exceptions.

### What WE Are Specifically Using It For in Smart Complaint Handler
In `SmartComplaintHandler`, this verification protocol serves as the quality assurance gate for Module M2's student-facing interfaces:
1. It validates that `SubmitComplaint.jsx` prevents submission of titles shorter than 5 characters or descriptions shorter than 10 characters, outlines invalid fields in red (`border-rose-500`), and live-updates the character counter.
2. It verifies that submitting a valid complaint dispatches a `POST /api/v1/tickets` request, locks the UI in `submitting` state with an animated spinner, and launches `SubmissionSuccessModal.jsx` with the returned tracking code (`TICK-XXXX`).
3. It confirms that clicking "Copy Tracking Code" invokes the browser Clipboard API, displays transient "Copied to Clipboard!" confirmation, and correctly copies the tracking code into the operating system clipboard buffer.
4. It proves that `TrackTicket.jsx` correctly maps the ticket's database status onto the 3-step visual progress stepper (`SUBMITTED` -> `IN_PROGRESS` -> `RESOLVED`), displaying department badges, assigned squads, and staff resolution notes.
5. It verifies that deep-linking (`http://localhost:5173/track?code=TICK-XXXX`) executes the lookup automatically on initial mount, and searching for an invalid code renders the amber "Complaint Not Found" card cleanly.

### Future AI Integration & Roadmap Hooks
In Version 2 (V2), when our platform introduces automated AI-driven complaint processing and real-time triage assistance, this verification protocol provides:
1. Live AI Preview Verification: Checkpoint testing verifying that typing in the complaint description triggers debounced background calls to Gemini AI, updating the predicted category chip within 500ms without interrupting student typing.
2. AI Duplicate Detection Alert Testing: Synthetic tests verifying that filing a complaint with wording identical to an existing open ticket triggers an informative duplicate alert modal.
3. Multimodal Image Compression Check: Verification testing confirming that student-attached photos are resized on the client before network transmission, preventing mobile bandwidth exhaustion.

### How Other Components Standardly Interact with This File
1. Every frontend developer executes this 5-checkpoint protocol before submitting pull requests for Module M2.
2. Quality assurance testers use the exact step sequences defined here to verify student grievance workflows across mobile and desktop browsers.

### The Core Problem It Solves & Why It Exists
Without this verification protocol:
- Bugs in form validation allow malformed data to reach the backend, triggering cryptic server 422 errors that confuse users.
- Clipboard copy bugs are only discovered after students complain that clicking "Copy" copied nothing, leaving them unable to track their tickets.
- Stepper synchronization bugs result in tickets stuck at "Submitted" even after maintenance teams have completed physical repairs.

---

## Section 2: What Must Be in This File & Why Each Item Is Needed

### Checkpoint 1: Form Validation & Character Constraint Verification
* Objective: Confirm that `SubmitComplaint.jsx` strictly enforces input boundaries and provides clear visual feedback.
* Verification Criteria:
  - Submitting an empty form outlines Title, Description, and Location inputs in red and renders inline error text.
  - Typing a 3-character title keeps the error message visible; typing a 5th character clears the error immediately.
  - The description character counter increments on every keystroke (`X / 1000 characters`).
  - Submit button remains enabled only when all required inputs contain non-whitespace text.

### Checkpoint 2: Live Ticket Creation & Modal Trigger Verification
* Objective: Confirm that valid form submissions create database records and trigger the confirmation dialog.
* Verification Criteria:
  - Submitting a valid form transitions the button to disabled state with text "Submitting Complaint..." and animated spinner.
  - FastAPI backend receives the request and returns `201 Created` with a unique tracking code (`TICK-XXXX`).
  - `SubmissionSuccessModal.jsx` mounts smoothly over a blurred backdrop (`fixed inset-0 bg-slate-900/60 backdrop-blur-sm`).
  - The modal displays the generated tracking code in prominent monospace font.
  - The underlying form fields are cleared to blank for subsequent submissions.

### Checkpoint 3: Clipboard Copy & Transient Feedback Verification
* Objective: Confirm that the copy-to-clipboard functionality operates reliably and provides clear UX confirmation.
* Verification Criteria:
  - Clicking "Copy Tracking Code" turns the button green with a checkmark icon and text "Copied to Clipboard!".
  - Pasting into a text editor (Notepad, browser address bar) produces the exact tracking code (`TICK-XXXX`).
  - After 2.5 seconds, the button smoothly reverts to its original neutral state.
  - Repeated clicks on the copy button do not throw console errors or close the modal.

### Checkpoint 4: Student Ticket Lookup & Stepper Milestones Verification
* Objective: Confirm that `TrackTicket.jsx` fetches ticket details and accurately reflects the lifecycle state machine.
* Verification Criteria:
  - Entering a lowercase code (e.g. `tick-8f2d`) automatically converts to uppercase `TICK-8F2D`.
  - Clicking "Track Status" updates the browser address bar to `/track?code=TICK-8F2D`.
  - When status is `SUBMITTED`, Node 1 is highlighted in indigo, the connecting progress bar is at 0%, and assigned team shows "Pending Squad Dispatch".
  - When status is `IN_PROGRESS`, Node 2 pulses with an indigo ring, the connecting progress bar is at 50%, and the assigned maintenance squad name is visible.
  - When status is `RESOLVED`, all 3 nodes display green checkmarks, the connecting progress bar is at 100%, and the Official Resolution Report card renders staff repair notes.

### Checkpoint 5: Deep Linking & 404 Error Recovery Verification
* Objective: Confirm that URL query parameter deep linking works in fresh tabs and invalid searches recover gracefully.
* Verification Criteria:
  - Opening `http://localhost:5173/track?code=TICK-XXXX` in an incognito or fresh browser tab automatically executes the lookup on initial mount without requiring user interaction.
  - Searching for an invalid code (e.g. `TICK-0000`) renders the styled amber "Complaint Not Found" card.
  - Searching again with a valid code clears the error card and renders the ticket details smoothly.
  - Network disconnects render a red alert banner with a working "Retry Search" button.

---

## Section 3: Component Life-Cycle: Input, Process, Output (IPO Table)

| Verification Phase | Input Action | Execution & Evaluation Procedure | Expected Pass Result |
| :--- | :--- | :--- | :--- |
| **1. Validation Check** | User clicks Submit on empty form | `validateForm()` evaluates field lengths; sets error dictionary; triggers re-render. | Inputs outline in red (`border-rose-500`); inline error messages appear; submit is blocked. |
| **2. Ingestion Check** | Submit valid complaint form | Dispatches `POST /api/v1/tickets`; backend executes keyword engine, generates code, saves to SQLite. | HTTP 201 response; `<SubmissionSuccessModal />` displays `TICK-XXXX`; form resets to blank. |
| **3. Clipboard Check** | Click "Copy Tracking Code" button | Invokes `navigator.clipboard.writeText()`; sets `isCopied = true`; sets 2.5s timer. | OS clipboard receives `TICK-XXXX`; button displays green "Copied to Clipboard!" toast. |
| **4. Stepper Check** | Enter tracking code in search bar | Calls `fetchTicketByCode()`; computes active step index from status; updates progress bar. | Progress bar smoothly animates to corresponding stage; node highlights; ticket details display. |
| **5. Deep Link Check** | Paste direct link into new tab | `useEffect` reads `searchParams.get('code')`; triggers automated fetch on mount. | Page opens directly with populated ticket details; zero user clicks required. |

---

## Section 4: Flexibility & Modification Guide

### 🟢 Safe to Modify & Customize
* **Test Complaint Scenarios**: You may use different complaint titles, descriptions, and locations during local verification (e.g. testing plumbing vs electrical scenarios).
* **Browser Test Environments**: You may execute these verification checkpoints on Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge, and mobile browser emulators.
* **Network Throttling Profiles**: You can enable Chrome Developer Tools network throttling ("Slow 3G" or "Fast 3G") to observe loading spinners and disabled button states during Checkpoint 2.

### 🔴 Strict Non-Negotiables (Do NOT Alter)
* **Sequential Checkpoint Order**: Checkpoints 1 through 5 must be executed in order. Attempting to verify ticket tracking (Checkpoint 4) before creating a real ticket (Checkpoint 2) will result in missing test data.
* **Clipboard Verification Step**: Do NOT assume clipboard copy succeeded merely because the button turned green. You must physically paste the clipboard contents into an external application to verify data integrity.
* **Case-Insensitivity Rule**: Checkpoint 4 must be tested with lowercase input (`tick-xxxx`) to verify that client-side normalization enforces uppercase conversion before dispatching the HTTP query.

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

## Section 6: Complete Verification Commands & Troubleshooting Matrix

### Verification Execution Commands

1. **Verify Form Input Boundaries:**
   Open `http://localhost:5173/`.
   Click "Submit Complaint" with blank fields. Confirm red borders appear on Title, Description, and Location.
   Type "Pipe" in Title. Confirm error remains ("Title must be at least 5 characters").
   Type "Pipe leak". Confirm error disappears.

2. **Verify Ticket Creation & Modal Confirmation:**
   Fill out:
   - Title: "Water pipe leaking heavily"
   - Description: "Severe water leak under the washroom sink on the second floor of Hostel B."
   - Location: "Hostel B, 2nd Floor, Room 204"
   - Category: "Plumbing & Water Services"
   Click "Submit Complaint".
   Confirm button shows spinner and "Submitting Complaint...".
   Confirm modal opens displaying `TICK-XXXX` in monospace font.
   Confirm form inputs behind the modal are reset to empty.

3. **Verify Clipboard Copy:**
   In the confirmation modal, click "Copy Tracking Code".
   Confirm button turns green with checkmark and text "Copied to Clipboard!".
   Open Notepad or browser address bar; press Ctrl+V.
   Confirm the exact tracking code was pasted.

4. **Verify Deep Link & Status Stepper:**
   In the confirmation modal, click "Track Complaint Now".
   Confirm modal closes and URL changes to `http://localhost:5173/track?code=TICK-XXXX`.
   Confirm the search input is populated with the code.
   Confirm the 3-step progress stepper renders with Step 1 (`SUBMITTED`) highlighted.
   Confirm Ticket Overview displays Title, "Plumbing & Water Services", and Priority badge.

5. **Verify Lifecycle State Transitions (in Database):**
   Open backend terminal. Advance ticket status to `IN_PROGRESS` via SQLite CLI or curl PATCH:
   `curl -X PATCH http://127.0.0.1:8000/api/v1/tickets/1/status -H "Content-Type: application/json" -d "{\"status\": \"IN_PROGRESS\"}"`
   Refresh the tracking page: `http://localhost:5173/track?code=TICK-XXXX`.
   Confirm Step 2 (`IN_PROGRESS`) pulses with an indigo ring and the progress bar is filled to 50%.

6. **Verify 404 Recovery:**
   In the tracking search input, enter `TICK-9999`. Click "Track Status".
   Confirm amber card displays: "Complaint Not Found... We could not find any complaint matching code 'TICK-9999'".
   Re-enter the valid code from step 2. Click "Track Status".
   Confirm the ticket details re-appear cleanly.

### Complete Troubleshooting Matrix

| Symptom / Error | Root Cause | Exact Resolution Procedure |
| :--- | :--- | :--- |
| Form submission fails with HTTP 422 `ensure this value has at least 10 characters` for `description`. | Student typed fewer than 10 characters in the description textarea. | Ensure client-side validation requires `description.trim().length >= 10` before enabling submit. |
| Modal does not open after clicking Submit, but backend terminal shows `201 Created`. | `isSuccessModalOpen` state was not updated to `true` or `createdTicket` was not saved. | Check `SubmitComplaint.jsx` `handleSubmit`: verify `setCreatedTicket(response)` and `setIsSuccessModalOpen(true)` are called in the `try` block. |
| Clicking "Copy Tracking Code" throws `TypeError: Cannot read properties of undefined (reading 'writeText')`. | Browser is running in an insecure context (HTTP on a non-localhost domain). | Ensure testing is conducted on `http://localhost:5173` or verify that the fallback `execCommand('copy')` branch is implemented. |
| Searching for a code in `TrackTicket.jsx` returns `Complaint Not Found` even though the ticket exists. | Tracking code was stored or queried with lowercase letters (SQLite comparisons are case-sensitive). | Verify that `fetchTicketByCode` calls `.trim().toUpperCase()` before dispatching the HTTP request. |
| Progress bar does not update when ticket status changes from `SUBMITTED` to `IN_PROGRESS`. | Component cached stale ticket state or failed to re-fetch upon URL parameter update. | Verify that `useSearchParams` dependency is included in the `useEffect` hook that triggers `executeLookup()`. |
