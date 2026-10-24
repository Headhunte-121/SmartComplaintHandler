# Frontend Source Documentation: `frontend/src/api/triage.js`

> **File Path**: `frontend/src/api/triage.js`  
> **Role**: Asynchronous HTTP transport client for stateless AI triage previews and supervisor priority overrides.  
> **Target Audience**: College Viva Examiners, Evaluation Committees, System Architects, Students grounded in basic C/Python.

---

## 1. High-Level Architectural Purpose

In a modern client-server architecture, client web browsers need dedicated communication channels to interact with backend endpoints without reloading the webpage. In C, if you wanted to send structured data to a remote server over TCP/IP, you would create a socket (`socket()`), connect to the remote host (`connect()`), serialize your C `struct` into a JSON byte buffer (`sprintf` or `snprintf`), and transmit it (`send()`).

In JavaScript, modern browsers provide the native `window.fetch()` function, which acts like an asynchronous networking library wrapping HTTP sockets.

`triage.js` serves two critical operational roles:
1. **Stateless Live Triage Preview (`fetchTriagePreview`)**: As a student types an incident title and description into the complaint form, the client fires a debounced request to the backend. Without saving any ticket to PostgreSQL, the backend machine learning/heuristics classifier analyzes the text and predicts the department, category, and priority tier (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), returning this preview to the frontend.
2. **Supervisory Priority Override (`overrideTicketPriority`)**: When an administrator or technician supervisor determines that an algorithmically assigned priority is inaccurate (e.g., a burst pipe leaking onto high-voltage server racks was marked `MEDIUM` but must be `CRITICAL`), this function sends an authenticated `PATCH` request to update the database record while recording an audit log of who changed it and why.

---

## 2. Sequential Code Breakdown & Deep Analysis

```javascript
/**
 * SmartComplaintHandler - Triage & Priority API Client
 * Blueprint Reference: docs/V1/M3/frontend/01_triage_api_client.md
 * Role: Asynchronous HTTP transport client for stateless triage previews and supervisor priority overrides.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
```

### Plain-English Purpose
This section establishes the module banner and determines the root network address (`API_BASE_URL`) of the backend server. It ensures that whether the application runs on a developer's laptop (`localhost:8000`) or in production (`https://complaints.iiitnr.ac.in`), the code dynamically connects to the correct server.

### Line-by-Line Breakdown
- `const API_BASE_URL`: Declares an immutable constant pointer/binding named `API_BASE_URL`.
- `import.meta.env.VITE_API_URL`: Reads an environment variable provided by Vite (the frontend bundler). In Python, this is identical to `os.environ.get("VITE_API_URL")`.
- `|| '/api/v1'`: The logical OR operator (`||`) serves as a fallback default. If `import.meta.env.VITE_API_URL` is `undefined`, `null`, or an empty string, the expression resolves to the string literal `'/api/v1'`.

### Deep Term & Concept Expansion
- **`import.meta`**: An ECMAScript module feature that exposes context-specific metadata to a JavaScript module. Vite intercepts `import.meta.env` during bundling and injects variables defined in `.env` files.
- **Vite Bundler Ingestion**: Vite only exposes environment variables prefixed with `VITE_` to the client browser code to prevent accidentally leaking sensitive server secrets (like database passwords or private encryption keys) to public webpage visitors.
- **Relative Path Fallback (`/api/v1`)**: When using a reverse proxy like Nginx, requests to `/api/v1` are automatically forwarded from the frontend domain to the backend server running on a local port, avoiding Cross-Origin Resource Sharing (CORS) preflight hurdles.

### Runtime Mechanics & Security
- **Memory Footprint**: `API_BASE_URL` is allocated in the module's static heap memory once upon initial script evaluation and retained for the lifespan of the browser tab.
- **Security Implications**: Hardcoding backend URLs introduces severe operational rigidity. Using environment variables allows continuous deployment pipelines to point frontend staging builds to staging servers and production builds to production clusters without source code modifications.

---

```javascript
/**
 * Extracts and normalizes backend error details into a human-readable string.
 */
function extractErrorMessage(data, defaultMsg) {
  if (!data) return defaultMsg;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail.map((err) => err.msg || JSON.stringify(err)).join('; ');
  }
  return data.message || defaultMsg;
}
```

### Plain-English Purpose
When a backend server rejects a request (e.g., due to an invalid format, missing field, or validation failure), it can send error responses in different formats. Python FastAPI and Pydantic typically return `{ "detail": "Invalid token" }` or a complex list of field-level errors like `[{"loc": ["body", "title"], "msg": "field required"}]`. Other servers return `{ "message": "Failed" }`. 
`extractErrorMessage` acts as a data normalizer: it inspects whatever structure the backend returned and extracts a single, clean, readable text string suitable for displaying in a user alert or toast message.

### Line-by-Line Breakdown
- `function extractErrorMessage(data, defaultMsg)`: Declares a function accepting two parameters: `data` (the parsed JSON response object from the server) and `defaultMsg` (a fallback string used if `data` is empty or unrecognizable).
- `if (!data) return defaultMsg;`: Guard clause. If `data` is `null`, `undefined`, or `false`, immediately return `defaultMsg`. In C, this is equivalent to `if (data == NULL) return defaultMsg;`.
- `if (typeof data.detail === 'string') return data.detail;`: Checks if the property `detail` exists on `data` and is a primitive string. If true, returns `data.detail`.
- `if (Array.isArray(data.detail))`: Checks if `detail` is a JavaScript Array (list). FastAPI/Pydantic returns an array of objects when validation fails on one or more fields.
- `return data.detail.map((err) => err.msg || JSON.stringify(err)).join('; ');`: 
  - `.map(...)`: Iterates over every error object in the array, extracting its human-friendly `.msg` property. If `.msg` is missing, it converts the raw error struct to a JSON string (`JSON.stringify(err)`).
  - `.join('; ')`: Joins all extracted error strings into a single sentence separated by semicolons.
- `return data.message || defaultMsg;`: Fallback check for general REST APIs that use `{ "message": "..." }`. If absent, returns `defaultMsg`.

### Deep Term & Concept Expansion
- **`typeof` Operator**: JavaScript unary operator returning the data type of an operand as a string (e.g., `'string'`, `'number'`, `'object'`).
- **`Array.isArray()`**: Built-in static method to reliably verify if an object is an array, because in JavaScript, `typeof []` evaluates to `'object'`.
- **FastAPI / Pydantic `ValidationError` Format**: When Pydantic schema validation fails, the HTTP 422 response body looks like:
  ```json
  {
    "detail": [
      {
        "loc": ["body", "title"],
        "msg": "String should have at least 5 characters",
        "type": "string_too_short"
      }
    ]
  }
  ```
  `extractErrorMessage` unpacks this structure so the student sees: *"String should have at least 5 characters"* rather than `[object Object]`.

### Runtime Mechanics & Security
- **Crash Prevention**: Network error handling code must never throw unhandled exceptions itself. By using strict null checks (`!data`) and fallback chaining (`|| defaultMsg`), this function is mathematically guaranteed never to throw an unhandled error, protecting the frontend UI from crashing during error reporting.
- **Time Complexity**: $O(K)$ where $K$ is the number of validation errors in `data.detail`. Since validation payloads rarely exceed 5-10 errors, execution takes less than 1 millisecond.

---

```javascript
/**
 * Dispatches a stateless complaint classification and priority triage preview request.
 * Debounced caller invokes this when student finishes typing and pauses for several seconds.
 *
 * @param {string} title - Complaint title (min 5 characters)
 * @param {string} description - Complaint narrative description (min 10 characters)
 * @returns {Promise<Object|null>} - Parsed TriageResult object or null if input too short
 */
export async function fetchTriagePreview(title, description) {
  const cleanTitle = (title || '').trim();
  const cleanDesc = (description || '').trim();

  // Transport-layer guard: avoid wasteful network calls if input is below schema boundaries
  if (cleanTitle.length < 5 || cleanDesc.length < 10) {
    return null;
  }

  const endpoint = `${API_BASE_URL}/tickets/triage-preview`;
```

### Plain-English Purpose
This is the entry gate for the live AI triage preview. When a student is typing their complaint title and narrative, we do not want to bombard the server with network requests on every single keystroke. Furthermore, the backend classifier requires meaningful text (at least 5 characters in title and 10 in description).
This function first cleans the strings by stripping leading and trailing spaces. If the cleaned text is too short, it immediately returns `null` without sending any network request, saving server bandwidth and computational resources.

### Line-by-Line Breakdown
- `export async function fetchTriagePreview(title, description)`: Declares and exports an asynchronous function returning a Promise.
- `const cleanTitle = (title || '').trim();`: Safeguards against `null` or `undefined` inputs by defaulting to an empty string `''`, then invokes `.trim()` to remove leading/trailing whitespace.
- `const cleanDesc = (description || '').trim();`: Does the exact same whitespace sanitization on the description text.
- `if (cleanTitle.length < 5 || cleanDesc.length < 10)`: Client-side validation guard checking character lengths.
- `return null;`: Exits early without touching the network.
- `const endpoint = `${API_BASE_URL}/tickets/triage-preview`;`: Uses template literals to construct the destination URL (e.g., `/api/v1/tickets/triage-preview`).

### Deep Term & Concept Expansion
- **Stateless Endpoint**: A stateless endpoint does not insert, update, or alter any record in the PostgreSQL database. It accepts raw text, feeds it through an in-memory classifier model or keyword scoring engine, and immediately returns the result. If the student closes their laptop right after, zero phantom tickets exist in the database.
- **Transport-Layer Guard**: Validating preconditions in the frontend *before* dispatching HTTP requests is an essential performance optimization. It eliminates redundant TCP handshakes, TLS negotiations, and backend CPU load for inputs known in advance to fail validation.

---

```javascript
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        title: cleanTitle,
        description: cleanDesc,
      }),
    });

    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch {
        // ignore json parse error
      }
      const msg = extractErrorMessage(
        errorData,
        `Triage preview failed with status ${response.status}`
      );
      throw new Error(msg);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('[Triage API] Error fetching triage preview:', err);
    throw err;
  }
}
```

### Plain-English Purpose
This block executes the actual network transmission. It sends an HTTP `POST` request with the JSON-encoded title and description to the server. If the server responds with a success status (HTTP 200), it parses the response body into a JavaScript object and returns it. If the server returns an error (such as 400 Bad Request or 500 Internal Server Error), it extracts the error explanation and throws a JavaScript `Error`.

### Line-by-Line Breakdown
- `try { ... } catch (err) { ... }`: Exception handling block. Traps network dropouts, DNS failures, or thrown errors.
- `const response = await fetch(endpoint, { ... });`: Initiates the asynchronous HTTP request. `await` pauses execution of this function until the server sends HTTP headers.
- `method: 'POST'`: Specifies the HTTP method. `POST` is used because we are sending a request body payload.
- `headers: { 'Content-Type': 'application/json', Accept: 'application/json' }`:
  - `'Content-Type': 'application/json'`: Informs the server that the request body is formatted as a JSON string.
  - `'Accept': 'application/json'`: Informs the server that the browser expects the response formatted as JSON.
- `body: JSON.stringify({ title: cleanTitle, description: cleanDesc })`: Converts the JavaScript object `{ title, description }` into a serialized JSON text string (e.g. `{"title":"Leaking pipe","description":"Water is dripping"}`).
- `if (!response.ok)`: In `fetch()`, `response.ok` is a boolean that is `true` if the HTTP status code is in the 200–299 range. If it is 4xx or 5xx, `response.ok` is `false`.
- `let errorData = null; try { errorData = await response.json(); } catch { }`: Attempts to parse the server's error response body as JSON. If the server returned an HTML error page (e.g., from an Nginx crash), JSON parsing fails; the inner `catch` silently suppresses that secondary parse error so the primary HTTP error code can be reported.
- `const msg = extractErrorMessage(errorData, ...)`: Normalizes the error object into a readable string.
- `throw new Error(msg);`: Throws a new `Error` object containing the parsed message.
- `const data = await response.json();`: Parses the HTTP response stream into a JavaScript object.
- `return data;`: Returns the parsed triage preview object (containing predicted department, category, priority, and confidence score) to the caller.
- `console.error('[Triage API] Error fetching triage preview:', err);`: Logs the failure to the browser's developer console for debugging.
- `throw err;`: Re-throws the error so the UI component (e.g., `SubmitComplaint.jsx`) knows the request failed and can display an error state.

### Deep Term & Concept Expansion
- **Why `fetch()` does not reject on HTTP 404 or 500**: Unlike libraries such as Axios, the native `fetch()` API only rejects its Promise if a **network failure** occurs (e.g., user is offline, DNS lookup failed, cable unplugged). A 404 or 500 response is technically a completed HTTP transaction, so `fetch()` resolves normally. Developers must explicitly check `if (!response.ok)` to handle server-side errors.
- **Stream Consumption**: `response.json()` consumes the incoming HTTP response body stream. Because a stream can only be read once from memory, calling `response.json()` a second time on the same `response` object would throw a `TypeError: Body has already been consumed`.

### Runtime Mechanics & Security
- **Content-Type Mismatch Vulnerabilities**: If `'Content-Type': 'application/json'` is omitted, FastAPI may fail to parse the body or misinterpret it as form data, rejecting the request with an HTTP 422 Unprocessable Entity error.
- **Memory Lifetime**: As soon as `JSON.stringify` completes, the serialized string is transmitted over the OS network socket and eligible for garbage collection once TCP acknowledgement packets are processed.

---

```javascript
/**
 * Submits an administrative priority override for a specific incident ticket.
 *
 * @param {number|string} ticketId - Primary key database ID of the ticket
 * @param {string} newPriority - Target priority tier (CRITICAL, HIGH, MEDIUM, LOW)
 * @param {string} overrideReason - Mandatory supervisory explanation (min 5 chars)
 * @returns {Promise<Object>} - Updated ticket entity
 */
export async function overrideTicketPriority(ticketId, newPriority, overrideReason) {
  const cleanReason = (overrideReason || '').trim();
  const cleanPriority = (newPriority || '').trim().toUpperCase();

  if (cleanReason.length < 5) {
    throw new Error('Override justification must be at least 5 characters long.');
  }

  const endpoint = `${API_BASE_URL}/tickets/${ticketId}/priority`;
```

### Plain-English Purpose
This function allows a supervisor to change a ticket's priority level. In any enterprise ticket system, altering priority affects Service Level Agreement (SLA) timers and notification escalation. Therefore, an override cannot be done silently: a justification reason of at least 5 characters is strictly required. This function cleans the inputs, validates the reason length, and builds the URL for the specific ticket ID.

### Line-by-Line Breakdown
- `export async function overrideTicketPriority(ticketId, newPriority, overrideReason)`: Declares and exports the function taking three arguments: `ticketId` (database ID), `newPriority` (string like `'CRITICAL'`), and `overrideReason` (string explaining the decision).
- `const cleanReason = (overrideReason || '').trim();`: Strips whitespace from the override reason.
- `const cleanPriority = (newPriority || '').trim().toUpperCase();`: Converts the priority string to uppercase (e.g., `'critical'` becomes `'CRITICAL'`) to match the backend database enumeration.
- `if (cleanReason.length < 5)`: Validates that the justification is not empty or trivially short (like `"ok"`).
- `throw new Error('Override justification must be at least 5 characters long.');`: Throws an error immediately on the client side without contacting the server.
- `const endpoint = `${API_BASE_URL}/tickets/${ticketId}/priority`;`: Constructs the RESTful route using string interpolation (e.g., `/api/v1/tickets/42/priority`).

---

```javascript
  try {
    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        new_priority: cleanPriority,
        override_reason: cleanReason,
      }),
    });

    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch {
        // ignore json parse error
      }
      const msg = extractErrorMessage(
        errorData,
        `Priority override failed with status ${response.status}`
      );
      throw new Error(msg);
    }

    const updatedTicket = await response.json();
    return updatedTicket;
  } catch (err) {
    console.error('[Triage API] Error overriding priority:', err);
    throw err;
  }
}
```

### Plain-English Purpose
Sends an HTTP `PATCH` request to update the ticket's priority. `PATCH` is the standard HTTP verb for partial updates (we are modifying only the priority and reason, not replacing the entire ticket record). If successful, it returns the updated ticket struct so the frontend UI can immediately re-render badges and SLA countdown clocks without an extra refresh.

### Line-by-Line Breakdown
- `method: 'PATCH'`: Specifies HTTP `PATCH` semantics.
- `headers: { 'Content-Type': 'application/json', Accept: 'application/json' }`: Standard JSON communication headers.
- `body: JSON.stringify({ new_priority: cleanPriority, override_reason: cleanReason })`: Serializes the payload keys expected by the backend Pydantic schema `PriorityOverrideRequest`.
- `if (!response.ok)`: Standard error detection checking for 401 Unauthorized, 403 Forbidden, 404 Not Found, or 422 Validation Error.
- `const updatedTicket = await response.json();`: Parses the backend's updated ticket response.
- `return updatedTicket;`: Returns the updated ticket object to the caller.

### Deep Term & Concept Expansion
- **HTTP `PATCH` vs `PUT`**:
  - `PUT`: Idempotent full replacement. The client sends the complete representation of the entity. Any unmentioned attributes might be cleared or reset to defaults.
  - `PATCH`: Partial modification. The client only sends the specific attributes being changed (`new_priority`, `override_reason`). The backend leaves all other fields (title, description, student ID, creation timestamp) untouched.
- **Audit Trail Requirement**: When `overrideTicketPriority` executes on the backend, the database does not merely overwrite the `priority` column. It inserts an audit entry recording the supervisor's user ID, previous priority, new priority, timestamp, and the `override_reason` text.

### Runtime Mechanics & Security
- **Authentication & RBAC**: In production, requests to this endpoint must carry session cookies or Authorization headers. If an unprivileged user (such as a standard student) attempts to invoke this function, the backend verifies their role and responds with `403 Forbidden`.
- **Idempotency**: Changing a ticket's priority from `HIGH` to `CRITICAL` multiple times with the same reason produces the same resulting priority state on the ticket, though multiple audit log events may be registered.

---

## 3. High-Frequency Viva & Technical Defense Questions

### Q1: Why do we have both `fetchTriagePreview` and `submitComplaint`? Why not just classify when submitting?
**Model Answer:**  
`fetchTriagePreview` is **stateless and instantaneous**. It provides real-time feedback to the student *while* they are typing the complaint form. For example, if a student writes *"Water leakage in Lab 3"*, the AI preview immediately displays: *Department: Estates & Maintenance | Category: Plumbing | Priority: HIGH*. 
This allows the student to see if the system correctly understood their issue before submitting. If the prediction is incorrect, they can clarify their description. No database row is created during this preview, preventing incomplete or accidental drafts from polluting the production database.

### Q2: Why does `fetchTriagePreview` check `cleanTitle.length < 5 || cleanDesc.length < 10` before making the network request?
**Model Answer:**  
This is a **client-side transport guard**. The backend ML/NLP classifier cannot reliably categorize arbitrary 1- or 2-letter fragments (like *"ac"* or *"hi"*), and the backend Pydantic schema rejects inputs shorter than these thresholds with an HTTP 422 error. Checking this on the client prevents unnecessary network traffic, spares backend server CPU cycles, and prevents error spam in browser logs.

### Q3: Why does `overrideTicketPriority` use the HTTP `PATCH` verb instead of `POST` or `PUT`?
**Model Answer:**  
In RESTful API design standards:
- `POST` is intended for creating new resources.
- `PUT` replaces the entire resource with a new representation.
- `PATCH` applies partial modifications to an existing resource.
Because changing a ticket's priority modifies only the `priority` field and records an audit log without replacing the entire ticket entity, `PATCH` is the semantically correct HTTP verb.

### Q4: Why doesn't native `fetch()` reject when the server returns a 500 Internal Server Error?
**Model Answer:**  
The native browser `window.fetch()` API follows the W3C Fetch standard: the Promise rejects **only on fatal network transport failures** (such as DNS resolution failures, network disconnects, or CORS blocking). A server responding with HTTP 500, 404, or 403 has successfully delivered an HTTP response packet over TCP. Therefore, developers must manually verify `response.ok` (which checks if `status` is in the range 200–299) and throw an error when `response.ok` is `false`.

### Q5: How does `extractErrorMessage` handle FastAPI validation errors?
**Model Answer:**  
FastAPI with Pydantic returns HTTP 422 responses containing a `detail` array of error objects, where each object has a `.msg` property describing which field failed validation. `extractErrorMessage` detects if `data.detail` is an Array using `Array.isArray()`, iterates over it with `.map()`, extracts the `.msg` property from each error, and joins them using `.join('; ')`. If `detail` is a plain string, it returns that string directly; otherwise, it falls back to a generic default message.

---

## 4. Quick Reference Summary Table

| Function / Symbol | Type / Signature | Primary Purpose | Key Under-the-Hood Mechanism |
| :--- | :--- | :--- | :--- |
| `API_BASE_URL` | `string` | Base backend endpoint URL | Resolved from `import.meta.env.VITE_API_URL` or defaults to `/api/v1` |
| `extractErrorMessage` | `(data, defaultMsg) => string` | Formats backend error structures | Unpacks Pydantic `detail` arrays, strings, or `.message` fallbacks |
| `fetchTriagePreview` | `(title, desc) => Promise<Object\|null>` | Stateless AI categorization preview | Client guard (<5 or <10 chars returns `null`); HTTP `POST` to `/tickets/triage-preview` |
| `overrideTicketPriority` | `(id, priority, reason) => Promise<Object>` | Administrative priority adjustment | Client validation (reason $\ge$ 5 chars); HTTP `PATCH` to `/tickets/:id/priority` |
