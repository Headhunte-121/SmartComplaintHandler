# Module M2 Frontend: Student Ticket Tracking Page Specification

Authoritative Engineering Blueprint for `src/pages/TrackTicket.jsx`.

---

## Section 1: Standard Purpose & Industry Role

### Standard Industry Role & Real-World Use Cases
In service desk operations, customer support, and public utility workflows, real-time status tracking transforms an opaque submission into an accountable, transparent process. When end-users submit grievances, the single largest driver of repeated, redundant inquiries is the lack of visible progress. Providing a self-service tracking portal eliminates administrative overhead while boosting user trust.

A visual progress stepper (a linear multi-step progress bar that visually maps a discrete lifecycle state machine onto sequential milestones) is the universal design pattern for tracking systems (such as courier delivery tracking, visa processing, and municipal service requests). It translates abstract database status strings (`SUBMITTED`, `IN_PROGRESS`, `RESOLVED`) into intuitive visual markers: completed stages, active work in progress, and upcoming milestones.

URL search parameter synchronization (the practice of binding application state directly to browser query strings like `?code=TICK-8F2D`) enables bookmarking, deep-linking, and seamless navigation between independent views.

### What WE Are Specifically Using It For in Smart Complaint Handler
In `SmartComplaintHandler`, `src/pages/TrackTicket.jsx` is the dedicated self-service status portal for students and faculty across the campus:
1. It provides a prominent tracking search workstation where students can enter their 9-character tracking code (`TICK-XXXX`).
2. It automatically inspects the browser URL on initial mount via React Router's `useSearchParams()`. If a student was directed from `SubmissionSuccessModal.jsx` (or opened a shared link containing `?code=TICK-8F2D`), the page automatically populates the search input and executes the status lookup immediately without requiring manual clicks.
3. It maps our three-phase database lifecycle state machine onto a high-contrast, responsive 3-step visual progress stepper:
   - Step 1: `SUBMITTED` (Complaint logged in database, queued for department classification and dispatch).
   - Step 2: `IN_PROGRESS` (Assigned to a specific field maintenance squad, repair work actively underway).
   - Step 3: `RESOLVED` (Physical inspection and repair completed, verified with closure notes).
4. It displays complete ticket transparency: Department name, Assigned Maintenance Squad (e.g. "Hostel Wire Squad 1" or "Pending Dispatch"), Priority Badge (integrating `PriorityBadge.jsx` from Module M3), formatted created/updated timestamps, and official staff resolution notes.

### Future AI Integration & Roadmap Hooks
In Version 2 (V2), when our platform introduces automated AI-driven complaint tracking and conversational assistant capabilities, this page provides:
1. AI Resolution Time Predictor: A machine learning estimation widget calculating real-time Estimated Time to Resolution (ETR) based on historical team turnaround times (e.g. "Based on active plumbing queues, estimated repair completion: Today at 3:30 PM").
2. AI Chatbot Status Assistant: An interactive conversational drawer allowing students to ask contextual questions (e.g. "Why is my electrical repair taking longer than expected?") with automated answers synthesized by Gemini AI from team workload data.
3. AI Photographic Verification Display: A secure image viewer rendering before-and-after photographic evidence uploaded by field technicians upon ticket resolution, verified by AI visual comparison.

### How Other Components Standardly Interact with This File
1. `src/routes/AppRouter.jsx` registers this page under route path `/track`.
2. `Navbar.jsx` renders a direct navigation link (`<NavLink to="/track">Track Complaint</NavLink>`).
3. `SubmissionSuccessModal.jsx` navigates directly to this view via `navigate('/track?code=' + code)`.
4. It imports and executes `fetchTicketByCode()` from `src/api/complaints.js` (Module M2).
5. It imports and renders `<PriorityBadge priority={ticket.priority} />` from `src/components/PriorityBadge.jsx` (Module M3).

### The Core Problem It Solves & Why It Exists
Without this blueprint:
- Students have no way to verify whether maintenance staff ever saw their complaint, leading to frustration, multiple duplicate submissions, and hostile escalations to college management.
- When repairs are delayed, students cannot tell whether a technician is currently on-site or if the ticket is still stuck in an administrative backlog.
- Staff must answer hundreds of repetitive telephone calls asking "what is the status of my ticket?" instead of focusing on physical repairs.

---

## Section 2: What Must Be in This File & Why Each Item Is Needed

### 1. Component State Architecture
* Search Code State (`searchCode`): Controlled string state storing the active input in the search bar. Automatically forced to uppercase.
* Active Ticket State (`ticket`): Object storing the fetched ticket record (or `null` when no ticket is loaded).
* Fetch Lifecycle State (`status`): String taking one of four values: `'idle'`, `'loading'`, `'success'`, `'error'`.
* Error Feedback State (`error`): Object storing error details: `{ message: string, isNotFound: boolean }`.
* URL Query Synchronization: Utilizes `const [searchParams, setSearchParams] = useSearchParams()` to read and update `?code=` in the browser address bar.

### 2. Search Bar Workstation Section
* Container Layout: A centered search card with class `max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8`.
* Search Input Form: An accessible form with `onSubmit={handleSearchSubmit}`:
  - Input Field: `<input type="text" value={searchCode} onChange={handleCodeChange} placeholder="Enter Tracking Code (e.g. TICK-8F2D)" className="font-mono uppercase ...">`.
  - Search Button: `<button type="submit" disabled={isLoading || !searchCode.trim()}>`:
    - Normal State: Displays SVG magnifying glass icon and text "Track Status".
    - Loading State: Displays animated spinner and text "Searching...".
  - Quick Helper Notice: "Tracking codes are 9 characters long and start with 'TICK-' followed by 4 alphanumeric characters."

### 3. 3-Step Visual Progress Stepper Component
* Stepper Container: A full-width horizontal container with class `relative flex items-center justify-between mb-8 px-4 sm:px-8`.
* Background Connecting Track: A horizontal bar positioned behind the step nodes:
  - Base Track: `absolute top-1/2 left-8 right-8 h-1 bg-slate-200 -translate-y-1/2 -z-0`.
  - Active Progress Fill: Dynamic width bar with class `bg-indigo-600 transition-all duration-500`:
    - Width `0%` when status is `'SUBMITTED'`.
    - Width `50%` when status is `'IN_PROGRESS'`.
    - Width `100%` when status is `'RESOLVED'`.
* Step Node Indicators (3 Nodes):
  - Node 1 (`SUBMITTED`): "Complaint Lodged"
    - Always completed or active. Renders solid circular badge with checkmark icon (`bg-indigo-600 text-white`).
  - Node 2 (`IN_PROGRESS`): "Under Investigation & Repair"
    - Active State: Pulsing ring with class `bg-white border-2 border-indigo-600 text-indigo-600 ring-4 ring-indigo-100 animate-pulse`.
    - Completed State: Solid green checkmark (`bg-emerald-600 text-white`).
    - Inactive State: Muted gray circle (`bg-white border-2 border-slate-300 text-slate-400`).
  - Node 3 (`RESOLVED`): "Issue Resolved"
    - Completed State: Solid green checkmark badge (`bg-emerald-600 text-white`).
    - Inactive State: Muted gray circle with clock icon.
* Step Labels: Text labels positioned beneath each node rendering the step title and a brief description (e.g. "Queued for triage", "Squad dispatched", "Verified complete").

### 4. Ticket Overview & Transparency Card
* Container Layout: Rendered when `ticket` is populated: `max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden`.
* Header Bar:
  - Top flex row displaying the tracking code in prominent monospace font: `TICK-8F2D`.
  - Badges cluster:
    - Status Badge: High-contrast pill (`bg-blue-50 text-blue-700` for SUBMITTED; `bg-amber-50 text-amber-700` for IN_PROGRESS; `bg-emerald-50 text-emerald-700` for RESOLVED).
    - Priority Badge: Rendered via `<PriorityBadge priority={ticket.priority} />`.
    - Department Badge: Department title pill (e.g. "Plumbing & Water Services").
* Key-Value Grid:
  - Location: Campus building and room name with map pin icon.
  - Assigned Squad: Name of the active maintenance team (e.g. "Hostel Pipe Squad 2"), or an amber notice "Pending Squad Dispatch" if unassigned.
  - Submitted At: Formatted timestamp string (e.g. "11 Sep 2026, 04:30 PM").
  - Target Resolution SLA: Formatted deadline timestamp with a clock icon.
* Complaint Text Section:
  - Complaint Title: Large bold header text.
  - Full Description: Paragraph text displaying the student's original grievance report.
* Official Resolution Card (Conditional):
  - Rendered only when `ticket.status === 'RESOLVED'`:
  - Green-tinted container: `bg-emerald-50 border border-emerald-200 rounded-xl p-5 mt-6`.
  - Header: SVG shield checkmark and title "Official Resolution Report".
  - Staff Resolution Notes: Rendered text from `ticket.resolution_notes` detailing the physical repairs performed.
  - Resolution Timestamp: Date and time when the ticket was formally closed.

### 5. Empty & Error Presentation States
* Empty Initial State: Rendered when no search has been executed and no URL query exists:
  - Centered illustration: SVG clipboard with magnifying glass.
  - Heading: "Track Your Campus Complaint".
  - Subtext: "Enter your unique 9-character tracking code above to inspect live dispatch status, assigned maintenance squads, and resolution notes."
* Not Found State (`error.isNotFound === true`):
  - Amber/Rose callout card: `bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center`.
  - Icon: SVG alert triangle.
  - Heading: "Complaint Not Found".
  - Explanation: "We could not find any complaint matching code '{searchCode}'. Please verify that the code was typed correctly (e.g. TICK-XXXX)."
* Server / Network Error State:
  - Red alert card displaying the error message and a "Retry Search" button.

---

## Section 3: Component Life-Cycle: Input, Process, Output (IPO Table)

| Life-Cycle Phase | Primary Input | Internal Transformation & Logic | Final Output |
| :--- | :--- | :--- | :--- |
| **1. Direct URL Access** | User opens `http://localhost:5173/track` | Component inspects `searchParams.get('code')`; finds no code; initializes in `'idle'` state. | Search bar renders with empty state illustration below. |
| **2. Deep Link Navigation** | User opens `.../track?code=TICK-8F2D` | `useEffect` detects `code` in URL; populates `searchCode = 'TICK-8F2D'`; dispatches `executeLookup('TICK-8F2D')`. | Search input pre-populates; loading spinner displays; live ticket data loads automatically. |
| **3. Manual Code Search** | Student types `tick-4a1b` and clicks Search | Form submit handler forces uppercase `TICK-4A1B`; updates URL search params; calls `fetchTicketByCode('TICK-4A1B')`. | Browser URL updates to `?code=TICK-4A1B`; progress stepper and ticket overview card mount. |
| **4. Lifecycle Mapping** | Backend returns `status: 'IN_PROGRESS'` | Component calculates active step index = 1; sets connecting progress bar width to 50%; highlights Node 2. | Progress bar smoothly animates to 50%; Node 2 pulses with indigo ring; assigned squad name displays. |
| **5. Closed Ticket View** | Backend returns `status: 'RESOLVED'` | Calculates active step index = 2; progress bar fills to 100%; renders green checkmarks on all nodes. | Progress bar completely fills green; official resolution report card renders with staff repair notes. |
| **6. Invalid Code Search** | Student searches `TICK-9999` | API returns 404; catch block sets `error.isNotFound = true`; sets status to `'error'`. | Amber "Complaint Not Found" card displays with helpful instructions to re-check code. |

---

## Section 4: Flexibility & Modification Guide

### 🟢 Safe to Modify & Customize
* **Date & Time Formatting**: You can customize the date/time string format in `formatDateTime()` (e.g. switching between 12-hour AM/PM and 24-hour military time, or adding timezone abbreviations).
* **Empty State Illustration**: You can replace the default SVG clipboard icon with a branded university mascot or custom campus graphic.
* **Progress Bar Step Descriptions**: You may adjust the subtitle text beneath each step node (e.g. changing "Under Investigation" to "Technician On-Site").

### 🔴 Strict Non-Negotiables (Do NOT Alter)
* **Lifecycle State String Mappings**: Do NOT alter the status string comparisons: `'SUBMITTED'`, `'IN_PROGRESS'`, `'RESOLVED'`. These strings correspond directly to the database status enum in SQLite. Mismatching a string (e.g. checking for `'PENDING'` instead of `'SUBMITTED'`) will break the visual progress stepper.
* **URL Search Parameter Key (`code`)**: Do NOT change `searchParams.get('code')` to a different key name (like `?id=` or `?ticket=`). Doing so breaks deep-linking from `SubmissionSuccessModal.jsx` and prevents shared links from working.
* **Tracking Code Normalization**: Always invoke `.trim().toUpperCase()` before querying the API client to guarantee consistent cache resolution and prevent false 404 errors caused by lowercase inputs.

---

## Section 5: Advanced Concepts Explained

### 1. Declarative Stepper UI State Machines
In user interface engineering, a progress stepper is a visual representation of a finite state machine:
- State 0: `SUBMITTED` -> Step index 0
- State 1: `IN_PROGRESS` -> Step index 1
- State 2: `RESOLVED` -> Step index 2

Rather than writing procedural, fragile conditional statements across dozens of HTML elements (`if status == 'SUBMITTED' render this, else if status == 'IN_PROGRESS' render that`), our component implements a Declarative Step Mapping Array:
- We declare an immutable array of step definitions:
  `const STEPS = [ { id: 'SUBMITTED', title: 'Complaint Lodged' }, { id: 'IN_PROGRESS', title: 'In Progress' }, { id: 'RESOLVED', title: 'Resolved' } ];`
- We compute the active index dynamically:
  `const currentStepIndex = STEPS.findIndex(s => s.id === ticket.status);`
- When rendering each node at index `i`:
  - If `i < currentStepIndex`: The step is completed -> render solid green checkmark.
  - If `i === currentStepIndex`: The step is currently active -> render pulsing indigo ring.
  - If `i > currentStepIndex`: The step is upcoming -> render muted gray border.
This declarative architecture guarantees that adding a new intermediate state (such as `PARTS_ON_ORDER` in V2) requires modifying only the step array without rewriting any layout logic.

### 2. Synchronization with URL Search Parameters
In modern web applications, the browser address bar is a vital piece of application state:
- When a user searches for a tracking code, the component does not simply store the code in isolated React memory.
- It invokes `setSearchParams({ code: normalizedCode })`.
- This synchronizes the URL without triggering a page refresh: `http://localhost:5173/track?code=TICK-8F2D`.

Benefits of this synchronization:
1. Browser History Navigation: The user can click the browser's Back button to return to their previously searched ticket.
2. Shareable Deep Links: A student can copy the address bar link and email it to a campus administrator, who opens the exact same ticket view instantly upon clicking.
3. Refresh Resilience: If the student accidentally refreshes their browser tab, the ticket reloads automatically from the URL parameter rather than resetting to an empty screen.

### 3. Native Date Formatting via `Intl.DateTimeFormat`
Displaying raw UTC ISO timestamps (such as `2026-09-11T12:30:00Z`) creates a poor user experience. Rather than importing heavy third-party date libraries (like `moment.js`) that bloat the bundle by hundreds of kilobytes, our component utilizes the browser's native `Intl.DateTimeFormat` API:
- It creates a reusable formatter:
  `const dateFormatter = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });`
- It converts ISO strings into clean, human-readable text: "11 Sep 2026, 05:30 PM".
- It automatically handles user timezone conversions based on the client's operating system settings, ensuring that timestamps are always accurate for the student's local time.

---

## Section 6: Definition of Done & Verification Protocol

### Observable Verification Checklist
* [ ] `src/pages/TrackTicket.jsx` exists and is exported as default.
* [ ] Search input binds to `searchCode` state and forces uppercase formatting.
* [ ] Searching a valid tracking code displays the 3-step visual progress stepper and ticket overview card.
* [ ] When ticket status is `SUBMITTED`, Node 1 is active, connecting bar is at 0%, and assigned team shows "Pending Squad Dispatch".
* [ ] When ticket status is `IN_PROGRESS`, Node 2 is active with pulsing ring, connecting bar is at 50%, and assigned squad name is displayed.
* [ ] When ticket status is `RESOLVED`, all 3 nodes display green checkmarks, connecting bar is at 100%, and Official Resolution Report card renders staff notes.
* [ ] Searching an invalid code renders the amber "Complaint Not Found" card without crashing.
* [ ] Navigating to `http://localhost:5173/track?code=TICK-XXXX` automatically executes the lookup on initial page load.

### Verification Commands & Troubleshooting Matrix

1. **Verify Empty State Rendering:**
   Navigate browser to `http://localhost:5173/track`.
   Verify search bar renders and empty state card displays: "Track Your Campus Complaint".

2. **Verify Ticket Lookup & Progress Stepper:**
   Enter a known tracking code (e.g. generated from Submit Complaint page). Click "Track Status".
   Verify the URL updates to `?code=TICK-XXXX`.
   Verify the 3-step stepper displays with correct step highlighted.
   Verify Complaint Title, Location, Priority Badge, and Timestamps are populated.

3. **Verify Deep Linking via Address Bar:**
   Open a new browser tab. Paste `http://localhost:5173/track?code=TICK-XXXX` directly into address bar. Press Enter.
   Verify the page loads, automatically fills the input field, and renders the ticket details without requiring any clicks.

4. **Verify Invalid Code Error Handling:**
   Type `TICK-0000` into the search input. Click "Track Status".
   Verify the amber alert card renders: "Complaint Not Found... We could not find any complaint matching code 'TICK-0000'".

5. **Troubleshooting Matrix:**
   * *Problem:* Deep link `?code=TICK-XXXX` does not trigger automatic lookup on page load.
     * *Cause:* `useEffect` hook listening to `searchParams` is missing or lacks proper dependency array.
     * *Fix:* Ensure `useEffect(() => { const code = searchParams.get('code'); if (code) executeLookup(code); }, [searchParams])` is implemented.
   * *Problem:* Progress stepper stays stuck at Step 1 even when database status is `IN_PROGRESS`.
     * *Cause:* Case-sensitivity mismatch (e.g. comparing `ticket.status === 'in_progress'` instead of `'IN_PROGRESS'`).
     * *Fix:* Verify that status comparisons use exact uppercase strings matching database constants: `'SUBMITTED'`, `'IN_PROGRESS'`, `'RESOLVED'`.
   * *Problem:* Timestamps display as `Invalid Date` or `NaN`.
     * *Cause:* The ISO date string from FastAPI is undefined or malformed.
     * *Fix:* Wrap date parsing in a helper function: `timestamp ? new Date(timestamp).toLocaleDateString(...) : 'N/A'`.
