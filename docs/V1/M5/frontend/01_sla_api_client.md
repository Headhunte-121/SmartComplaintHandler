# Module M5 Frontend: SLA & Lifecycle API Transport Client Specification

Authoritative Engineering Blueprint for `src/api/sla.js`.

---

## Section 1: Standard Purpose & Industry Role

### Standard Industry Role & Real-World Use Cases
In modern single-page frontend architectures, managing state machine mutations and real-time SLA metrics requires a specialized network transport layer. When a web application executes critical operational transitions—such as advancing a ticket's lifecycle, submitting legal closure documentation, or triggering supervisory escalations—it must not rely on fragmented HTTP calls embedded across individual buttons or table rows.

A domain API client (a dedicated JavaScript service that encapsulates all REST communication, payload serialization, parameter validation, and error normalization for a specific business domain) acts as the secure gateway between React user interface components and backend endpoints.

In incident response and facility operations platforms, the SLA API client manages:
1. Lifecycle transitions: Sending incremental `PATCH` requests to advance status (`SUBMITTED` ➔ `IN_PROGRESS`).
2. Verified ticket resolution: Transmitting structured closure reports and repair notes to `POST /resolve`.
3. Emergency escalation triggers: Dispatching supervisory escalation requests with documented justification.
4. Active breach telemetry: Fetching real-time lists of overdue complaints to populate supervisor dashboards.

### What WE Are Specifically Using It For in Smart Complaint Handler
In `SmartComplaintHandler`, `src/api/sla.js` is the exclusive network bridge for all Module M5 lifecycle and SLA interactions:
1. It imports the pre-configured singleton `apiClient` from `@/api/client` (Module M1) and exposes four specialized asynchronous service functions:
   - `updateTicketStatus(ticketId, newStatus, notes, actor)`: Transmits status mutations to `PATCH /api/v1/tickets/{ticket_id}/status`, returning the updated ticket entity.
   - `resolveTicket(ticketId, resolutionNotes, partsReplaced, technicianName)`: Dispatches formal closure payloads to `POST /api/v1/tickets/{ticket_id}/resolve`. It performs client-side pre-validation asserting that `resolutionNotes` contains at least 10 non-whitespace characters before consuming network bandwidth.
   - `escalateTicket(ticketId, reason, supervisorId)`: Transmits supervisory escalation commands to `POST /api/v1/tickets/{ticket_id}/escalate`.
   - `fetchActiveBreaches(thresholdRatio)`: Queries `GET /api/v1/sla/breaches/active` to populate the supervisor escalation panel (`SLABreachTable.jsx`).
2. It normalizes HTTP 400 errors returned by backend state machine guards (such as illegal transitions like `SUBMITTED` -> `RESOLVED`), converting raw server errors into friendly, actionable notifications for maintenance staff.

### Future AI Integration & Roadmap Hooks
In Version 2 (V2), when our platform introduces automated AI-driven operational optimization via Gemini API, this API service provides:
1. AI Triage Telemetry Transport: An extended client method `fetchAITriageTelemetry(ticketId)` querying Gemini AI prediction audits, confidence scores, and historical repair turnaround curves.
2. Photographic Closure Upload: A multipart form-data submission method `resolveTicketWithEvidence(ticketId, formData)` uploading before-and-after repair photographs directly to Gemini Vision inspection endpoints.
3. Automated Re-Fetch Synchronization: WebSocket integration hooks allowing this client to listen for real-time SLA breach broadcasts from the backend, pushing instant table updates without requiring manual browser refreshes.

### How Other Components Standardly Interact with This File
1. `AdminDashboard.jsx` (Module M4) calls `updateTicketStatus()` when staff click "Start Work" or "Place on Hold".
2. `ResolutionNotesModal.jsx` (Module M5) calls `resolveTicket()` when staff submit the closure dialog.
3. `SLABreachTable.jsx` (Module M5) calls `fetchActiveBreaches()` on mount and interval polling, and calls `escalateTicket()` when supervisors click "Escalate".
4. This file interacts strictly downward with `src/api/client.js` (Module M1), inheriting its base URL, timeout guards, and error interceptors.

### The Core Problem It Solves & Why It Exists
Without this domain API client:
- UI components would manually construct complex HTTP `PATCH` and `POST` requests, leading to duplicated code and inconsistent parameter names across pages.
- Client-side validation would be missing, causing requests with empty notes to hit the server and return confusing server error messages.
- If backend endpoint URLs change, developers would be forced to hunt through dozens of React components to update path strings.

---

## Section 2: What Must Be in This File & Why Each Item Is Needed

### 1. Base Client Import
* Dependency: Imports `apiClient` from `./client` (or `@/api/client`).
* Architectural Constraint: Must not import Axios directly; all requests must flow through `apiClient` to ensure interceptor policies (e.g. 10-second timeout, error unwrapping) are preserved.

### 2. `updateTicketStatus()` Function Specification
* Signature: `export async function updateTicketStatus(ticketId, newStatus, notes = null, actor = 'Staff')`
* Input Validation:
  - Asserts that `ticketId` is a valid positive integer. Throws `TypeError` if missing.
  - Normalizes `newStatus`: Trims whitespace and converts to uppercase string.
* Payload Construction: Constructs a clean JSON payload:
  `{ status: newStatus, notes: notes ? notes.trim() : null, actor }`
* Network Dispatch: Calls `apiClient.patch('/tickets/' + ticketId + '/status', payload)`.
* Return Value: Returns the updated `TicketLifecycleResponse` object directly.

### 3. `resolveTicket()` Function Specification
* Signature: `export async function resolveTicket(ticketId, resolutionNotes, partsReplaced = null, technicianName = null)`
* Client-Side Pre-Validation Guard:
  - Validates `resolutionNotes`: Checks that `resolutionNotes` is a string and `resolutionNotes.trim().length >= 10`.
  - If validation fails: Throws a client-side `Error("Resolution notes must contain at least 10 characters detailing the repair performed.")` immediately, preventing unnecessary network traffic.
* Payload Construction:
  `{ resolution_notes: resolutionNotes.trim(), parts_replaced: partsReplaced ? partsReplaced.trim() : null, technician_name: technicianName ? technicianName.trim() : null }`
* Network Dispatch: Calls `apiClient.post('/tickets/' + ticketId + '/resolve', payload)`.
* Return Value: Returns the resolved ticket entity with closure timestamp.

### 4. `escalateTicket()` Function Specification
* Signature: `export async function escalateTicket(ticketId, reason, supervisorId = null)`
* Client-Side Pre-Validation Guard:
  - Validates `reason`: Asserts `reason.trim().length >= 5`.
  - If validation fails: Throws `Error("Escalation reason must contain at least 5 characters.")`.
* Payload Construction:
  `{ escalation_reason: reason.trim(), supervisor_id: supervisorId ? supervisorId.trim() : null }`
* Network Dispatch: Calls `apiClient.post('/tickets/' + ticketId + '/escalate', payload)`.
* Return Value: Returns the updated ticket with status `'ESCALATED'`.

### 5. `fetchActiveBreaches()` Function Specification
* Signature: `export async function fetchActiveBreaches(thresholdRatio = 0.20)`
* Query Parameter Mapping: Prepares query parameter object: `{ threshold_ratio: thresholdRatio }`.
* Network Dispatch: Calls `apiClient.get('/sla/breaches/active', { params: { threshold_ratio: thresholdRatio } })`.
* Return Value: Returns an array of `SLABreachResponse` objects.

---

## Section 3: Component Life-Cycle: Input, Process, Output (IPO Table)

| Life-Cycle Phase | Primary Input | Internal Validation & Execution | Final Output |
| :--- | :--- | :--- | :--- |
| **1. Status Update Call** | `updateTicketStatus(1, 'IN_PROGRESS', 'Squad on site')` | Normalizes status; calls `apiClient.patch('/tickets/1/status', payload)`. | Returns updated ticket object with status `'IN_PROGRESS'`. |
| **2. Short Notes Rejection** | `resolveTicket(1, 'fixed')` | Pre-validation detects length < 10 characters; throws client Error immediately. | Execution halts before network call; UI displays inline error. |
| **3. Valid Ticket Resolution** | `resolveTicket(1, 'Replaced 2-inch PVC valve under sink', 'PVC Valve', 'Dave')` | Validates length (38 chars); dispatches `POST /tickets/1/resolve`. | Returns resolved ticket record with `resolved_at` timestamp. |
| **4. Escalation Trigger** | `escalateTicket(1, 'Water flooding corridor', 'Supervisor Patel')` | Validates reason; dispatches `POST /tickets/1/escalate`. | Returns escalated ticket; status set to `'ESCALATED'`. |
| **5. Active Breaches Fetch** | `fetchActiveBreaches(0.20)` | Queries `GET /sla/breaches/active`; receives JSON array. | Returns array of overdue and near-breach tickets for dashboard. |

---

## Section 4: Flexibility & Modification Guide

### 🟢 Safe to Modify & Customize
* **Default Threshold Ratio**: You may adjust the default `thresholdRatio` in `fetchActiveBreaches` from `0.20` to `0.25` or `0.15` to alter the warning sensitivity.
* **Additional Payload Attributes**: In future versions, you can add optional client fields (such as `device_latitude` or `technician_signature_id`) to the payload dictionary in `resolveTicket`.
* **Custom Error Formatting**: You can wrap catch blocks to customize user-facing toast notification text (e.g. converting backend error details into campus-specific help text).

### 🔴 Strict Non-Negotiables (Do NOT Alter)
* **Pre-Validation Length Guards**: Do NOT remove the client-side length checks (`resolutionNotes.trim().length >= 10`). Bypassing client validation results in unnecessary network requests that fail at the backend with HTTP 422 or 400 errors.
* **Direct Axios Bypass**: Never bypass `apiClient` to invoke raw `axios.post()` or `axios.patch()`. Bypassing the base client removes centralized 10-second timeouts, breaks Vite reverse proxying, and disables 422 error unwrapping.
* **Uppercase Status Normalization**: Always invoke `.trim().toUpperCase()` on status arguments before dispatching network requests to prevent case-sensitivity mismatches against backend enums.

---

## Section 5: Advanced Concepts Explained

### 1. Client-Side Defensive Pre-Validation
In distributed web systems, Network Latency is an expensive resource. Submitting an invalid request to the server consumes bandwidth, allocates server thread memory, and incurs 100ms to 500ms of round-trip network lag before returning an error.

Our SLA API client implements Defensive Pre-Validation:
- Before any bytes are transmitted across the network, `resolveTicket()` inspects `resolutionNotes.trim().length`.
- If the student or technician typed fewer than 10 characters, the function throws an immediate JavaScript exception.
- The UI modal catches this exception in 0 milliseconds, displays a red validation outline, and keeps keyboard focus on the input without ever touching the network.

### 2. Semantic HTTP Verb Matching for Operational Lifecycle
In REST engineering, HTTP methods communicate intent:
- `PATCH`: Modifies specific fields of an existing resource without altering the rest. Used by `updateTicketStatus()` because only `status` and `resolution_notes` are updated.
- `POST`: Executes a non-idempotent business transaction that produces significant operational side effects. Used by `resolveTicket()` and `escalateTicket()` because resolving a ticket triggers timestamp calculations, SLA compliance evaluation, and permanent closure locking.
- `GET`: Safe, idempotent read-only query. Used by `fetchActiveBreaches()` to inspect overdue records without mutating any data.

### 3. Graceful Error Recovery & Domain Exception Unwrapping
When an illegal state machine transition is attempted (e.g. two staff members try to update the same ticket simultaneously):
- The backend returns `HTTP 400 Bad Request` with `{ "detail": "Illegal state transition from 'SUBMITTED' to 'RESOLVED'..." }`.
- The base client interceptor (`client.js`) unwraps the error and extracts `error.response.data.detail`.
- The `sla.js` transport client allows this clean error message to bubble up directly to the React component's catch block, allowing the UI to display: "This ticket cannot be resolved directly from Submitted state. Please click 'Start Work' first."

---

## Section 6: Definition of Done & Verification Protocol

### Observable Verification Checklist
* [ ] `src/api/sla.js` exists, exporting `updateTicketStatus`, `resolveTicket`, `escalateTicket`, and `fetchActiveBreaches`.
* [ ] `updateTicketStatus` normalizes status to uppercase and calls `apiClient.patch()`.
* [ ] `resolveTicket` blocks notes shorter than 10 characters before making a network call.
* [ ] `resolveTicket` dispatches `POST /tickets/{id}/resolve` with resolution notes, parts, and technician name.
* [ ] `escalateTicket` dispatches `POST /tickets/{id}/escalate` with mandatory escalation reason.
* [ ] `fetchActiveBreaches` queries `GET /sla/breaches/active` and returns an array of breach records.
* [ ] All methods propagate normalized error messages cleanly to caller components.

### Verification Commands & Troubleshooting Matrix

1. **Verify Client-Side Pre-Validation in Browser Console:**
   Open browser Developer Tools (F12) on `http://localhost:5173/`. Paste into console:
   `import('./src/api/sla.js').then(m => m.resolveTicket(1, 'Short').catch(e => console.log('Caught Pre-Validation Error:', e.message)));`
   Expected console output: `Caught Pre-Validation Error: Resolution notes must contain at least 10 characters...` (Notice zero network requests were made in the Network tab).

2. **Verify Live Status Update via Client:**
   Paste into console:
   `import('./src/api/sla.js').then(m => m.updateTicketStatus(1, 'IN_PROGRESS', 'Arrived at site').then(t => console.log('Updated Ticket:', t)));`
   Expected console output: `Updated Ticket: { id: 1, status: 'IN_PROGRESS', ... }`.

3. **Verify Valid Ticket Resolution via Client:**
   Paste into console:
   `import('./src/api/sla.js').then(m => m.resolveTicket(1, 'Replaced damaged copper wiring in distribution panel', 'Copper Wire 2.5mm', 'Tech Sam').then(t => console.log('Resolved Ticket:', t)));`
   Expected console output: `Resolved Ticket: { id: 1, status: 'RESOLVED', resolved_at: '...', ... }`.

4. **Verify Active Breaches Query via Client:**
   Paste into console:
   `import('./src/api/sla.js').then(m => m.fetchActiveBreaches(0.20).then(b => console.log('Active Breaches:', b)));`
   Expected console output: `Active Breaches: [...]`.

5. **Troubleshooting Matrix:**
   * *Problem:* `TypeError: Cannot read properties of undefined (reading 'patch')`.
     * *Cause:* `apiClient` was not properly exported from `src/api/client.js` or import path is incorrect.
     * *Fix:* Check `import { apiClient } from './client'` in `src/api/sla.js`.
   * *Problem:* `resolveTicket` throws `Illegal state transition from 'SUBMITTED' to 'RESOLVED'`.
     * *Cause:* The ticket was never moved to `IN_PROGRESS` before attempting resolution.
     * *Fix:* Ensure the ticket status is updated to `IN_PROGRESS` before calling `resolveTicket`.
   * *Problem:* `fetchActiveBreaches` returns an empty array when breaches exist.
     * *Cause:* `threshold_ratio` was passed as an invalid string or backend query did not find open tickets.
     * *Fix:* Verify that `threshold_ratio` is a float (e.g. `0.20`) and confirm open tickets have past deadlines in database.
