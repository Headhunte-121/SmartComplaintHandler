# Module M4 - Frontend File 01: Workforce & Dispatch API Client
## Target File: `frontend/src/api/assignment.js`
### Execution Track: Phase 1 (Can be built in parallel with Backend Files 01, 02, and 03)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In modern Single Page Application (SPA) frontend engineering (using React, Vue, or Angular), `frontend/src/api/assignment.js` defines the **API Transport Client Layer** for workforce dispatch and squad operations. It encapsulates all asynchronous network communication between the web browser and backend REST controllers: abstracting HTTP methods, centralizing API base URL paths, managing request headers, and standardizing error handling.

### Standard Industry Role & Real-World Use Cases
In professional production systems (such as Salesforce, Stripe dashboards, and Jira Cloud), dedicated API client modules standardly fulfill four core architectural duties:

1. **Decoupling Network Protocols from UI Presentation:**
   * React UI components should only care about rendering views and managing user interaction states; they should never hardcode raw fetch calls, TCP URLs, or JSON header configurations.
   * Isolating network logic in a dedicated API module ensures that if API routes change (e.g. upgrading `/api/v1` to `/api/v2`), only this single client file is updated, without touching a single React component.
2. **Centralizing Error Interception & Normalization:**
   * Intercepts HTTP network failures (such as 400 Bad Request, 404 Not Found, or 500 Internal Server Error) and normalizes backend error responses into consistent JavaScript Error objects.
   * Prevents unhandled network exceptions from crashing React component rendering trees.
3. **Optimizing Request Payloads & Type Safety:**
   * Converts component state variables into strictly validated JSON payloads that conform exactly to backend Pydantic DTO contracts (`TeamReassignRequest`, `TeamAvailabilityUpdate`).
4. **Frictionless Mocking in Component Unit Tests:**
   * By centralizing network functions into exported symbols, frontend test runners (such as Vitest or Jest) can easily mock these functions during automated UI testing without spinning up a live backend server.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our campus complaint automation platform, our 5-student engineering team specifically uses `frontend/src/api/assignment.js` for four concrete operational functions:

1. **Fetching Real-Time Squad Workload Telemetry (`fetchSquadWorkloads`):**
   * Executes HTTP `GET /api/v1/teams/workloads` (with optional `departmentId` query filter) to feed live queue depths to `TeamWorkloadView.jsx`.
2. **Executing Administrative Ticket Reassignments (`reassignTicketTeam`):**
   * Sends HTTP `PATCH /api/v1/tickets/{ticketId}/reassign` with `new_team_id` and `reassignment_reason` when a supervisor submits the `ReassignTeamModal.jsx` dialog.
3. **Triggering On-Demand Squad Dispatch (`triggerTicketDispatch`):**
   * Sends HTTP `POST /api/v1/tickets/{ticketId}/dispatch` to trigger automated least-loaded dispatch for unassigned complaints.
4. **Toggling Squad Shift Availability (`toggleSquadAvailability`):**
   * Sends HTTP `PATCH /api/v1/teams/{teamId}/availability` with `{ is_active: boolean }` when a facility manager clicks the on-duty toggle switch.

### Future AI Integration & Client Stability (V2 Roadmap)
While Version 1 endpoints trigger deterministic algorithms, this API client provides a permanent, stable network gateway for future AI integration:
* **Permanent Frontend Contract:** In V2, when AI predictive dispatch models are deployed on the backend, this client will continue making the exact same network calls. The React UI remains completely insulated from backend algorithmic changes.
* **Human-in-the-Loop Supervisory Bridge:** The `reassignTicketTeam()` function serves as the permanent frontend bridge for human supervisory governance, allowing facility managers to override machine recommendations at any time.

### How Other Components Standardly Interact with This File
Across the frontend architecture, this client is consumed cleanly:
* **The Staff Admin Desk Page (`frontend/src/pages/AdminDashboard.jsx`):** Imports `fetchSquadWorkloads` and `triggerTicketDispatch` to manage the central operational queue.
* **The Squad Workload Component (`frontend/src/components/TeamWorkloadView.jsx`):** Calls `fetchSquadWorkloads` on mount and `toggleSquadAvailability` on user click.
* **The Reassignment Modal (`frontend/src/components/ReassignTeamModal.jsx`):** Calls `reassignTicketTeam` upon supervisor form submission.

### The Core Problem It Solves & Why It Exists
* **The "Scattered Fetch" Anti-Pattern:** Without a centralized API client, developers paste `fetch('http://localhost:8000/...')` across multiple React files. If the port or path changes, updating the code requires editing dozens of files.
* **Inconsistent Error Displays:** Centralized error extraction ensures that error banners across the UI display clear backend messages (e.g. *"Team with ID 99 does not exist"*) rather than generic *"Network Error"* alerts.

---

# 2. What Must Be in This File & Why Each Item Is Needed

To be complete, robust, and production-grade, `frontend/src/api/assignment.js` must define and export the following five essential items:

---

### Item 1: Base API Configuration & URL Normalization
* **What it is:** A shared base URL configuration utilizing Vite environment variables.
* **Specification:** `const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';`
* **Why it is needed:**
  * Allows the frontend to run smoothly in local development (`localhost:8000`) and in production environments without changing source code.

---

### Item 2: Squad Workload Telemetry Fetcher (`fetchSquadWorkloads`)
* **What it is:** An asynchronous function fetching workload statistics across maintenance squads.
* **Signature:** `export async function fetchSquadWorkloads(departmentId = null)`
* **Execution Logic:**
  * Constructs query string: `const url = departmentId ? `${API_BASE_URL}/teams/workloads?department_id=${departmentId}` : `${API_BASE_URL}/teams/workloads`;`
  * Executes `fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } })`.
  * If response is not ok, extracts error detail and throws a formatted Error.
  * Returns the parsed JSON array of squad telemetry objects.
* **Why it is needed:**
  * Supplies real-time active queue metrics to the staff dashboard and workload cards.

---

### Item 3: Administrative Reassignment Submitter (`reassignTicketTeam`)
* **What it is:** An asynchronous function submitting supervisor manual ticket transfers.
* **Signature:** `export async function reassignTicketTeam(ticketId, newTeamId, reassignmentReason)`
* **Execution Logic:**
  * URL: `${API_BASE_URL}/tickets/${ticketId}/reassign`
  * Executes HTTP `PATCH` with headers `{'Content-Type': 'application/json'}` and body:
    `JSON.stringify({ new_team_id: Number(newTeamId), reassignment_reason: reassignmentReason.trim() })`
  * Throws an error with backend detail if status code is 400, 404, or 422.
  * Returns updated ticket JSON.
* **Why it is needed:**
  * Powers the supervisor reassignment modal with proper type casting and audit validation.

---

### Item 4: On-Demand Automated Dispatch Submitter (`triggerTicketDispatch`)
* **What it is:** An asynchronous function triggering automated dispatch for a pending ticket.
* **Signature:** `export async function triggerTicketDispatch(ticketId)`
* **Execution Logic:**
  * URL: `${API_BASE_URL}/tickets/${ticketId}/dispatch`
  * Executes HTTP `POST`.
  * Returns updated ticket JSON showing the newly assigned squad.
* **Why it is needed:**
  * Allows supervisors to trigger automated dispatch on older complaints with a single button click.

---

### Item 5: Squad Shift Availability Toggler (`toggleSquadAvailability`)
* **What it is:** An asynchronous function updating a squad's on-duty status.
* **Signature:** `export async function toggleSquadAvailability(teamId, isActive)`
* **Execution Logic:**
  * URL: `${API_BASE_URL}/teams/${teamId}/availability`
  * Executes HTTP `PATCH` with body `JSON.stringify({ is_active: Boolean(isActive) })`.
  * Returns updated availability state.
* **Why it is needed:**
  * Enables dynamic shift toggling directly from the UI without page reloads.

---

# 3. Component Life-Cycle: Input, Process, Output (IPO Table)

The following table documents the network life-cycle for each function in `frontend/src/api/assignment.js`:

| API Function | Input Parameters | Network Processing & Headers | Output Produced | Failure Modes Handled |
| :--- | :--- | :--- | :--- | :--- |
| `fetchSquadWorkloads` | Optional `departmentId` | Dispatches `GET /api/v1/teams/workloads`. Accepts JSON. | Array of squad telemetry objects with queue depths and status bands. | Rejects with descriptive error if server is offline or returns non-200. |
| `reassignTicketTeam` | `ticketId`, `newTeamId`, `reassignmentReason` | Dispatches `PATCH /api/v1/tickets/{id}/reassign` with JSON body. | Updated ticket object with new squad name and updated audit notes. | Rejects with backend error string on 400 (invalid team), 404 (missing ticket), or 422. |
| `triggerTicketDispatch` | `ticketId` | Dispatches `POST /api/v1/tickets/{id}/dispatch`. | Updated ticket object with assigned squad and `ASSIGNED` status. | Rejects on 404 if ticket does not exist. |
| `toggleSquadAvailability` | `teamId`, `isActive` | Dispatches `PATCH /api/v1/teams/{id}/availability`. | Object with updated `team_id`, `team_name`, and `is_active` boolean. | Rejects on 404 if team ID does not exist. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. Strict Non-Negotiables

To preserve full-stack compatibility across teammates, follow these operational rules:

### 🟢 Safe to Modify (Configurable Parameters)
* **Custom Request Headers:** You can add authorization headers (e.g. `Authorization: Bearer <token>`) when authentication is introduced in future versions.
* **Timeout Settings:** You can implement an `AbortController` timeout (e.g. aborting after 8 seconds of network silence).
* **Logging Statements:** You can add `console.log()` or `console.error()` statements during debugging.

### 🔴 Strict Non-Negotiables (System Breaking Changes)
* **DO NOT Alter URL Endpoint Paths:** Paths must match backend routes (`/teams/workloads`, `/tickets/{id}/reassign`, etc.) exactly.
* **DO NOT Omit `reassignment_reason` Trimming:** Always trim whitespace from the reason string to prevent whitespace-only submissions from being rejected with HTTP 422.
* **DO NOT Swallow Network Exceptions:** Never use an empty `catch` block that hides errors. Always rethrow the error so calling React components can display user-friendly error banners.
* **DO NOT Import React Hooks in API Clients:** API client modules must remain pure JavaScript functions. Using `useState` or `useEffect` inside API modules violates React's Rules of Hooks.

---

# 5. Advanced Frontend Concepts Explained: State & Network Architecture

### 1. The API Gateway / Client Pattern in Single Page Applications
* **The Concept:** In clean frontend architecture, components should follow the Single Responsibility Principle (SRP).
* **Why Component-Level Fetching Is Fragile:**
  * If five different components make direct `fetch()` calls to `/api/v1/teams/workloads`, a minor URL path update requires editing five different React files.
  * If one developer forgets to check `response.ok`, that component will silently fail when the backend returns an error.
* **How the API Client Pattern Solves This:**
  * All network requests are channeled through centralized functions.
  * Components simply call `const data = await fetchSquadWorkloads()` and receive clean, parsed data or catch normalized errors.

### 2. JavaScript Asynchronous Event Loop & Promises
* **The Concept:** JavaScript in web browsers is single-threaded; it cannot pause execution while waiting for a server across a network.
* **How Async/Await Operates:**
  * When `fetch()` is called, JavaScript registers a non-blocking network I/O task with the browser runtime and yields control back to the event loop.
  * The React UI thread continues rendering animations and responding to user clicks smoothly.
  * Once the server responds, the Promise resolves and the execution resumes in the **Microtask Queue**, updating React state without UI freezing.

### 3. Error Normalization Across Full-Stack Boundaries
* **The Concept:** FastAPI returns error details as structured JSON: `{"detail": "Ticket with ID 5 not found"}`.
* **Why Normalization Is Critical:**
  * In standard JavaScript `fetch()`, HTTP error status codes (like 404 or 500) do not reject the promise; they resolve with `response.ok = false`.
  * If a component only checks `await response.json()`, it treats error responses as successful data.
  * Our API client explicitly checks `if (!response.ok)`, parses `data.detail`, and throws `new Error(data.detail || 'Request failed')`, guaranteeing that calling React components land squarely in their `catch` blocks.

---

# 6. Definition of Done: Observable Verification Checklist

Before considering `frontend/src/api/assignment.js` complete, verify each of the following operational checkpoints:

### Implementation Checklist
- [ ] File exists at `frontend/src/api/assignment.js`.
- [ ] Configures base URL using `import.meta.env.VITE_API_URL || '/api/v1'`.
- [ ] Exports `fetchSquadWorkloads(departmentId)`.
- [ ] Exports `reassignTicketTeam(ticketId, newTeamId, reassignmentReason)`.
- [ ] Exports `triggerTicketDispatch(ticketId)`.
- [ ] Exports `toggleSquadAvailability(teamId, isActive)`.
- [ ] Inspects `response.ok` on all calls and extracts `data.detail` on errors.
- [ ] Contains zero React hooks (`useState`, `useEffect`).
- [ ] Contains zero triple-backtick code blocks.

### Verification Procedure (Run in Web Browser Console or Node.js)

1. **Verify Module Exports & Network Call in Browser Developer Tools Console:**
   * Open `http://localhost:8000/docs` or your Vite development server at `http://localhost:5173`.
   * Open the Browser Developer Console (F12) and run:
     `fetch('/api/v1/teams/workloads').then(r => r.json()).then(data => console.log('Workloads API check:', data.length, 'squads found'))`
   * Observable Output: The console logs `Workloads API check: 12 squads found` with an array of 12 squad objects.
