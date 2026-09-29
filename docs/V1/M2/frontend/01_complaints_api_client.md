# Module M2 Frontend: Complaints API Transport Client Specification

Authoritative Engineering Blueprint for `src/api/complaints.js`.

---

## Section 1: Standard Purpose & Industry Role

### Standard Industry Role & Real-World Use Cases
In professional frontend architectures, UI components must never construct raw HTTP request URLs or directly manage network serialization. Instead, applications implement Domain API Services (dedicated JavaScript modules that encapsulate all network communication, data transformation, parameter sanitization, and endpoint contracts for a specific business entity).

A domain API client acts as the abstraction barrier separating React user interfaces from backend REST endpoints. If a backend URL path changes from `/api/v1/tickets` to `/api/v2/complaints`, or if payload key names are modified, only the domain API client needs to be updated. The dozens of React components that render forms, progress bars, and modal dialogs remain completely untouched.

In enterprise complaint and ticket management systems, the complaints API client manages the primary business transactions: submitting new grievances, tracking existing tickets by immutable tracking identifiers, and retrieving filtered status summaries.

### What WE Are Specifically Using It For in Smart Complaint Handler
In `SmartComplaintHandler`, `src/api/complaints.js` manages all HTTP interactions related to student complaint intake and resolution tracking:
1. It imports the singleton `apiClient` from `@/api/client` (Module M1) and exposes three strongly-typed asynchronous service functions:
   - `submitComplaint(payload)`: Transmits student form data (Title, Description, Location, Department Hint) to FastAPI's `POST /api/v1/tickets` endpoint, returning the newly created ticket entity containing the unique tracking code (`TICK-XXXX`).
   - `fetchTicketByCode(trackingCode)`: Normalizes and URL-encodes student tracking codes, querying `GET /api/v1/tickets/{tracking_code}` to retrieve real-time status, department routing, assigned team, and staff notes.
   - `fetchRecentTickets(params)`: Queries `GET /api/v1/tickets` with optional filtering parameters (status, department, limit) to populate recent campus issue feeds.
2. It enforces input sanitization: trimming whitespace, enforcing uppercase formatting on tracking codes (`tick-8f2d` -> `TICK-8F2D`), and discarding null or undefined payload attributes before network transmission.
3. It integrates browser `AbortController` signal forwarding, allowing caller views to cancel in-flight search requests if a student types a new tracking code before the previous lookup completes.

### Future AI Integration & Roadmap Hooks
In Version 2 (V2), when our platform introduces automated AI-driven complaint processing and real-time grievance classification, this API service provides:
1. Multimodal File Attachment Support: An extended payload handler configured to package binary image data (`multipart/form-data`) alongside text fields for submission to Gemini Vision multimodal analysis endpoints.
2. Semantic Duplicate Check Query: A pre-submission query function (`checkPotentialDuplicates(title, location)`) that queries backend vector similarity endpoints to notify students if an identical issue (e.g. "Hostel C elevator stuck") was already filed minutes earlier.
3. Client-Side AI Response Normalization: A data adapter that parses AI confidence ratings and contextual keyword tags returned by the server, attaching normalized explanation objects to the ticket data structure.

### How Other Components Standardly Interact with This File
1. `SubmitComplaint.jsx` (Module M2) calls `submitComplaint(formData)` upon form submission, awaiting the returned tracking code to display the success confirmation modal.
2. `TrackTicket.jsx` (Module M2) calls `fetchTicketByCode(code)` when students execute tracking searches or when the page loads with a `?code=` URL query parameter.
3. This file interacts strictly downward with `src/api/client.js` (Module M1) for network execution, inheriting its base URL, timeout guards, and 422 error normalization.

### The Core Problem It Solves & Why It Exists
Without this domain API client:
- React components would embed raw `apiClient.post('/tickets', ...)` calls directly in UI event handlers, scattering endpoint strings across the codebase.
- Case-sensitivity bugs would occur: if a student entered lowercase `tick-8f2d`, the backend lookup would fail unless normalized before dispatch.
- Fast typing in search inputs would trigger race conditions (a software flaw where the timing or order of events impacts correctness, such as an older search request resolving after a newer one and overwriting the display with stale data).

---

## Section 2: What Must Be in This File & Why Each Item Is Needed

### 1. Module Imports & Dependencies
* Base Client Import: Imports `apiClient` from `./client` (or `@/api/client`).
* No Direct Third-Party HTTP Dependencies: This file must NOT import `axios` directly; it must rely exclusively on the pre-configured `apiClient` to ensure centralized interceptor policies are observed.

### 2. `submitComplaint(ticketData)` Function Specification
* Asynchronous Signature: `export async function submitComplaint(ticketData)`
* Input Parameter Validation:
  - Verifies that `ticketData` is an object. Throws a JavaScript `TypeError` if `ticketData` is missing or null.
  - Sanitizes `title`: Trims whitespace. Ensures title length meets the 5-character minimum requirement.
  - Sanitizes `description`: Trims whitespace. Ensures description length meets the 10-character minimum requirement.
  - Sanitizes `location`: Trims whitespace.
* Payload Construction: Constructs a clean JSON payload object containing:
  - `title`: Sanitized title string.
  - `description`: Sanitized description string.
  - `location`: Sanitized location string.
  - `department_id`: Optional integer (or `null` if omitted, allowing the backend keyword engine to auto-classify).
* Network Execution: Dispatches `apiClient.post('/tickets', payload)`.
* Return Value: Returns the resolved ticket object directly: `{ id, tracking_code, title, description, location, department_id, assigned_team, priority, status, sla_deadline, created_at }`.

### 3. `fetchTicketByCode(trackingCode, options)` Function Specification
* Asynchronous Signature: `export async function fetchTicketByCode(trackingCode, options = {})`
* Tracking Code Sanitization:
  - Validates that `trackingCode` is a non-empty string.
  - Trims all leading and trailing whitespace.
  - Converts all characters to uppercase (e.g. `tick-8f2d` becomes `TICK-8F2D`).
  - Encodes the code using `encodeURIComponent()` to prevent URI injection attacks or malformed URL errors.
* Signal Forwarding: Extracts `options.signal` (an `AbortSignal` instance from an `AbortController`) and forwards it in the request configuration: `apiClient.get('/tickets/' + sanitizedCode, { signal: options.signal })`.
* Error Handling & Not Found Normalization:
  - If the server returns `HTTP 404 Not Found`, catches the error and throws a normalized domain error with `error.isNotFound = true` and message `Complaint with tracking code TICK-XXXX was not found. Please verify the code and try again.`
* Return Value: Returns the complete ticket detail entity.

### 4. `fetchRecentTickets(params)` Function Specification
* Asynchronous Signature: `export async function fetchRecentTickets(params = {})`
* Query Parameter Mapping: Maps optional filter keys:
  - `department_id`: Integer filter for specific department queues.
  - `status`: String filter (`SUBMITTED`, `IN_PROGRESS`, `RESOLVED`).
  - `limit`: Integer maximum records to return (defaults to 20).
* Network Execution: Dispatches `apiClient.get('/tickets', { params })`.
* Return Value: Returns an array of ticket summary objects.

---

## Section 3: Component Life-Cycle: Input, Process, Output (IPO Table)

| Life-Cycle Phase | Primary Input | Internal Transformation & Logic | Final Output |
| :--- | :--- | :--- | :--- |
| **1. Complaint Submission** | Raw form object from `SubmitComplaint.jsx` | Validates required fields; strips whitespace; constructs clean payload; executes `apiClient.post('/tickets', payload)`. | Returns newly created ticket record with generated `tracking_code` (`TICK-XXXX`). |
| **2. Tracking Code Query** | User input string (e.g. ` tick-4b1a `) | Trims spaces; forces uppercase `TICK-4B1A`; encodes URI; dispatches `apiClient.get('/tickets/TICK-4B1A')`. | Returns live ticket record with status, department, and assigned team. |
| **3. Non-Existent Code Search** | Invalid code `TICK-9999` | Server returns HTTP 404; catches error; sets `isNotFound = true`; formats user-friendly error message. | Caller catch block receives clean, friendly error object without raw stack traces. |
| **4. Aborted Search Query** | User types new code while previous lookup is in flight | Component calls `abortController.abort()`; Axios detects canceled signal; suppresses error reporting. | Previous request terminates cleanly; UI displays only the latest search result. |

---

## Section 4: Flexibility & Modification Guide

### 🟢 Safe to Modify & Customize
* **Default Query Limits**: You can safely modify the default `limit` parameter in `fetchRecentTickets` from 20 to 50 or 100 based on UI requirements.
* **Additional Payload Fields**: In future iterations, you can safely add optional student contact fields (such as `student_email` or `hostel_room_number`) to the payload dictionary in `submitComplaint`.
* **Client-Side Regex Validation**: You can add local regex patterns (e.g. validating that a tracking code matches `/^TICK-[A-Z0-9]{4}$/`) before making the network request to save unnecessary HTTP round-trips.

### 🔴 Strict Non-Negotiables (Do NOT Alter)
* **Uppercase Normalization**: Do NOT remove `trackingCode.trim().toUpperCase()`. Ticket tracking codes are generated by the backend in uppercase (`TICK-XXXX`). Because SQLite string comparisons are case-sensitive by default, omitting uppercase normalization will cause valid student lookups to fail with 404 errors.
* **URI Encoding**: Do NOT concatenate raw user input directly into URL strings without `encodeURIComponent()`. Unencoded spaces or special characters will corrupt the HTTP path.
* **Direct Axios Bypass**: Never bypass `apiClient` to call raw `axios.post()`. Bypassing the base client breaks the Vite reverse proxy, strips centralized timeout limits, and bypasses error normalization.

---

## Section 5: Architectural & Theoretical References

This specification operates strictly as an **implementation and integration blueprint**. For the exhaustive computer science fundamentals, language runtime mechanics, and protocol specifications governing this component, consult the following authoritative manuals in the **Developer Guide Suite**:

* [**Guide 09: Network Clients, Wire Protocols & Axios**](../../../developer_guide/09_AXIOS_FETCH_AND_REST_PROTOCOLS.md)  
  Axios client architecture, request/response interceptor pipelines, error normalization, and timeout cancellation.

* [**Unit 01B: HTTP Network Protocols & Wire Framing**](../../../developer_guide/01B_HTTP_NETWORK_PROTOCOLS_AND_WIRE_FRAMING.md)  
  HTTP wire streams, headers, payload serialization, and REST status codes.

* [**Unit 05B: JavaScript Core Language & Syntax Primitives**](../../../developer_guide/05B_JAVASCRIPT_CORE_LANGUAGE_AND_SYNTAX_PRIMITIVES.md)  
  Asynchronous Promises, `async/await` mechanics, and lexical closures in network clients.

---

---

## Section 6: Definition of Done & Live Website Verification

### What This File Is Responsible For
This JavaScript module (`frontend/src/api/complaints.js`) is responsible for **managing network communication between React complaint forms and the backend ticket endpoints**. It serializes form data, invokes the base HTTP client, and unwraps response objects for UI consumption.

### What It Should Perform
When invoked by UI components, this client provides the following methods:
1. **`submitComplaint(formData)`:** Dispatches `POST /api/v1/tickets` with title, description, department, and location, returning the created ticket object.
2. **`fetchTicketStatus(trackingCode)`:** Dispatches `GET /api/v1/tickets/{trackingCode}`, returning ticket telemetry and handling 404 errors gracefully.
3. **Error Normalization:** Converts network exceptions and backend validation errors into clear, actionable error messages for display in form banners.

### How to See It Performing Its Job on the Live Website
1. Open **`http://localhost:5173/`** and press `F12` to open the Console tab.
2. In the console, execute:
   `import('/src/api/complaints.js').then(api => api.fetchTicketStatus('TICK-1001')).then(console.log)`
3. **Observe Client Live:**
   * The console prints the ticket object directly with its tracking code, title, and current status.
4. In the Network tab, submit a new complaint and observe the clean HTTP `POST /api/v1/tickets` payload dispatched by this client.
