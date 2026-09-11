# Module M3 - Frontend File 01: Triage & Priority API Client
## Target File: `frontend/src/api/triage.js`
### Execution Track: Phase 1 (Can be built in parallel with Backend Files and Components)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In modern Single Page Application (SPA) frontend engineering (using React, Vue, or Angular), `frontend/src/api/triage.js` defines the **API Transport Client Layer** for automated incident triage, category classification, and priority adjustment. It encapsulates all asynchronous network communication between the web browser and backend REST controllers: abstracting HTTP methods, centralizing API base URL paths, managing request headers, and standardizing error handling.

### Standard Industry Role & Real-World Use Cases
In professional production systems (such as GitHub issue labels, Zendesk incident triage, and ServiceNow ITSM), dedicated API client modules standardly fulfill four core architectural duties:

1. **Decoupling Network Protocols from UI Presentation:**
   * React UI components should only care about rendering views and managing user interaction states; they should never hardcode raw fetch calls, TCP URLs, or JSON header configurations.
   * Isolating network logic in a dedicated API module ensures that if API routes change (e.g. upgrading `/api/v1` to `/api/v2`), only this single client file is updated, without touching a single React component.
2. **Centralizing Error Interception & Normalization:**
   * Intercepts HTTP network failures (such as 400 Bad Request, 404 Not Found, or 422 Unprocessable Entity) and normalizes backend error responses into consistent JavaScript Error objects.
   * Prevents unhandled network exceptions from crashing React component rendering trees.
3. **Stateless Request Execution & Debounce Safety:**
   * Implements lightweight request dispatching suitable for high-frequency user interactions (such as live typing debounces) without polluting local component state.
4. **Frictionless Mocking in Component Unit Tests:**
   * By centralizing network functions into exported symbols, frontend test runners (such as Vitest or Jest) can easily mock these functions during automated UI testing without spinning up a live backend server.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our campus complaint automation platform, our 5-student engineering team specifically uses `frontend/src/api/triage.js` for three concrete operational functions:

1. **Fetching Stateless Real-Time Triage Previews (`fetchTriagePreview`):**
   * Dispatches HTTP `POST /api/v1/tickets/triage-preview` containing the student's draft `title` and `description`.
   * Returns a structured `TriageResult` object containing calculated `priority`, predicted `category`, `hazard_detected` boolean, `confidence` score (0.0 to 1.0), `reason`, and `matched_keywords`.
   * Invoked by `LiveTriageCard.jsx` on debounced keystrokes as the student types.
2. **Submitting Administrative Priority Overrides (`overrideTicketPriority`):**
   * Dispatches HTTP `PATCH /api/v1/tickets/{ticketId}/priority` with `new_priority` and `override_reason`.
   * Invoked when a facility supervisor submits the `PriorityOverrideModal.jsx` dialog to adjust a ticket's severity tier with an audit explanation.
3. **Enforcing Request Validation at the Transport Layer:**
   * Validates that `title` and `description` meet minimum length thresholds before firing network requests, preventing wasteful network calls for single-character keystrokes.

### Future AI Integration & Client Stability (V2 Roadmap)
While Version 1 endpoints trigger deterministic algorithms, this API client provides a permanent, stable network gateway for future AI integration:
* **Permanent Frontend Contract:** In V2, when AI contextual keyword models are deployed on the backend, this client will continue making the exact same network calls to `/triage-preview` and `/{ticketId}/priority`. The React UI remains completely insulated from backend algorithmic changes.
* **Human-in-the-Loop Supervisory Bridge:** The `overrideTicketPriority()` function serves as the permanent frontend bridge for human supervisory governance, allowing facility managers to override machine recommendations at any time.

### How Other Components Standardly Interact with This File
Across the frontend architecture, this client is consumed cleanly:
* **The Live Triage Card (`frontend/src/components/LiveTriageCard.jsx`):** Calls `fetchTriagePreview(title, description)` on debounced form keystrokes.
* **The Priority Override Modal (`frontend/src/components/PriorityOverrideModal.jsx`):** Calls `overrideTicketPriority(ticketId, newPriority, reason)` when a supervisor submits a manual priority adjustment.
* **The Student Complaint Page (`frontend/src/pages/SubmitTicket.jsx`):** Imports this client to validate triage states prior to final ticket submission.

### The Core Problem It Solves & Why It Exists
* **The "Scattered Fetch" Anti-Pattern:** Without a centralized API client, developers paste `fetch('http://localhost:8000/...')` across multiple React files. If the port or path changes, updating the code requires editing dozens of files.
* **Inconsistent Error Displays:** Centralized error extraction ensures that error banners across the UI display clear backend messages (e.g. *"Reason must be at least 5 characters"*) rather than generic *"Network Error"* alerts.

---

# 2. What Must Be in This File & Why Each Item Is Needed

To be complete, robust, and production-grade, `frontend/src/api/triage.js` must define and export the following four essential items:

---

### Item 1: Base API Configuration & URL Normalization
* **What it is:** A shared base URL configuration utilizing Vite environment variables.
* **Specification:** `const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';`
* **Why it is needed:**
  * Allows the frontend to run smoothly in local development (`localhost:8000`) and in production environments without changing source code.

---

### Item 2: Stateless Triage Preview Fetcher (`fetchTriagePreview`)
* **What it is:** An asynchronous function sending draft complaint text for instant classification.
* **Signature:** `export async function fetchTriagePreview(title, description)`
* **Execution Logic:**
  * Validates inputs locally: If `title.trim().length < 5` or `description.trim().length < 10`, returns `null` immediately without firing a network request.
  * URL: `${API_BASE_URL}/tickets/triage-preview`
  * Executes HTTP `POST` with headers `{'Content-Type': 'application/json', 'Accept': 'application/json'}` and body:
    `JSON.stringify({ title: title.trim(), description: description.trim() })`
  * Checks `response.ok`. If not ok, parses `data.detail` and throws an Error.
  * Returns the parsed `TriageResult` JSON object (`priority`, `category`, `confidence`, `hazard_detected`, `reason`, `matched_keywords`).
* **Why it is needed:**
  * Powers real-time form feedback as students type, saving network bandwidth by blocking premature calls.

---

### Item 3: Administrative Priority Override Submitter (`overrideTicketPriority`)
* **What it is:** An asynchronous function submitting supervisor manual priority adjustments.
* **Signature:** `export async function overrideTicketPriority(ticketId, newPriority, overrideReason)`
* **Execution Logic:**
  * URL: `${API_BASE_URL}/tickets/${ticketId}/priority`
  * Executes HTTP `PATCH` with headers `{'Content-Type': 'application/json'}` and body:
    `JSON.stringify({ new_priority: newPriority.trim(), override_reason: overrideReason.trim() })`
  * Throws an error with backend detail if status code is 400, 404, or 422.
  * Returns updated ticket JSON.
* **Why it is needed:**
  * Powers the supervisor priority override modal with proper validation and audit compliance.

---

### Item 4: Centralized HTTP Error Normalization
* **What it is:** Internal logic that inspects HTTP error status codes and extracts backend detail strings.
* **Behavior:** Extracts `data.detail` (which may be a string or a Pydantic validation error array) and formats it into a clean, human-readable JavaScript Error message.
* **Why it is needed:**
  * Prevents cryptic `[object Object]` error messages from appearing in frontend UI alert banners.

---

# 3. Component Life-Cycle: Input, Process, Output (IPO Table)

The following table documents the network life-cycle for each function in `frontend/src/api/triage.js`:

| API Function | Input Parameters | Network Processing & Headers | Output Produced | Failure Modes Handled |
| :--- | :--- | :--- | :--- | :--- |
| `fetchTriagePreview` | `title`, `description` | Dispatches `POST /api/v1/tickets/triage-preview`. Content-Type: `application/json`. | Parsed `TriageResult` object with `priority`, `category`, `confidence`, `hazard_detected`, etc. | Rejects with error if network fails; returns `null` silently if text is too short for validation. |
| `overrideTicketPriority` | `ticketId`, `newPriority`, `overrideReason` | Dispatches `PATCH /api/v1/tickets/{id}/priority` with JSON body. | Updated ticket object with new priority and updated audit notes. | Rejects with backend error string on 404 (missing ticket) or 422 (short reason or invalid priority). |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. Strict Non-Negotiables

To preserve full-stack compatibility across teammates, follow these operational rules:

### 🟢 Safe to Modify (Configurable Parameters)
* **Local Pre-Validation Boundaries:** You can adjust local string length guards (e.g. allowing preview calls at 3 characters instead of 5 if desired).
* **Custom Request Headers:** You can add authorization headers (e.g. `Authorization: Bearer <token>`) when authentication is introduced in future milestones.
* **Logging Statements:** You can add `console.log()` or `console.error()` statements during debugging.

### 🔴 Strict Non-Negotiables (System Breaking Changes)
* **DO NOT Alter URL Endpoint Paths:** Paths must match backend routes (`/tickets/triage-preview`, `/tickets/{id}/priority`) exactly.
* **DO NOT Change HTTP Methods (`POST` and `PATCH`):** `/triage-preview` must be `POST` because it carries JSON bodies; `/priority` must be `PATCH` because it applies partial updates.
* **DO NOT Omit Reason Trimming:** Always trim whitespace from `overrideReason` to prevent whitespace-only submissions from causing HTTP 422 rejections.
* **DO NOT Import React Hooks in API Clients:** API client modules must remain pure JavaScript functions. Using `useState` or `useEffect` inside API modules violates React's Rules of Hooks.

---

# 5. Advanced Frontend Concepts Explained: State & Network Architecture

### 1. The API Gateway / Client Pattern in Single Page Applications
* **The Concept:** In clean frontend architecture, components should follow the Single Responsibility Principle (SRP).
* **Why Component-Level Fetching Is Fragile:**
  * If multiple components make direct `fetch()` calls to `/api/v1/tickets/triage-preview`, a minor URL path update requires editing multiple React files.
  * If one developer forgets to check `response.ok`, that component will silently fail when the backend returns an error.
* **How the API Client Pattern Solves This:**
  * All network requests are channeled through centralized functions.
  * Components simply call `const data = await fetchTriagePreview(title, desc)` and receive clean, parsed data or catch normalized errors.

### 2. Request Abort Controllers & Race Condition Prevention
* **The Concept:** When a user types rapidly into a form, multiple asynchronous preview requests are sent in close succession. If an older request takes longer to resolve than a newer request, it can overwrite the newer result. This is known as a **Network Race Condition**.
* **How It Is Mitigated:**
  * Modern frontend clients can pass an optional `AbortSignal` to `fetch()`.
  * When a new keystroke occurs, the calling component aborts the previous in-flight request, guaranteeing that only the freshest response updates the UI.

---

# 6. Definition of Done: Observable Verification Checklist

Before considering `frontend/src/api/triage.js` complete, verify each of the following operational checkpoints:

### Implementation Checklist
- [ ] File exists at `frontend/src/api/triage.js`.
- [ ] Configures base URL using `import.meta.env.VITE_API_URL || '/api/v1'`.
- [ ] Exports `fetchTriagePreview(title, description)`.
- [ ] Pre-validates string lengths before sending network requests in `fetchTriagePreview`.
- [ ] Exports `overrideTicketPriority(ticketId, newPriority, overrideReason)`.
- [ ] Inspects `response.ok` on all calls and extracts `data.detail` on errors.
- [ ] Contains zero React hooks (`useState`, `useEffect`).
- [ ] Contains zero triple-backtick code blocks.

### Verification Procedure (Run in Web Browser Console or Node.js)

1. **Verify Module Exports & Network Call in Browser Developer Tools Console:**
   * Open `http://localhost:8000/docs` or your Vite development server at `http://localhost:5173`.
   * Open the Browser Developer Console (F12) and run:
     `fetch('/api/v1/tickets/triage-preview', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ title: 'Sparking wire in lab', description: 'Switchboard smoking and sparking' }) }).then(r => r.json()).then(data => console.log('Triage API check:', data.priority, data.category))`
   * Observable Output: The console logs `Triage API check: CRITICAL Electrical`.
