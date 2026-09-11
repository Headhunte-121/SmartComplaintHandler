# Module M1 Frontend: Central Base API Client & HTTP Transport Specification

Authoritative Engineering Blueprint for `src/api/client.js`.

---

## Section 1: Standard Purpose & Industry Role

### Standard Industry Role & Real-World Use Cases
In modern web applications, the frontend communicates with backend microservices and databases exclusively across the network boundary via HTTP REST APIs. Rather than invoking raw browser `fetch()` or disparate HTTP requests scattered throughout hundreds of React components, enterprise applications enforce a centralized HTTP transport client.

An API client (a dedicated software module that encapsulates network request execution, headers configuration, serialization, and error transformation) acts as the single point of entry and exit for all network traffic. Libraries such as Axios (a popular promise-based HTTP client for the browser and node.js) allow engineering teams to establish pre-configured singleton instances with unified timeout limits, default headers, and interceptor pipelines.

An HTTP Interceptor (a middleware function that automatically inspects, mutates, or cancels an HTTP request before it is sent, or intercepts the HTTP response before it reaches the calling component) guarantees consistent handling of authentication tokens, request correlation IDs, network retries, and error unwrapping across the entire application lifecycle.

### What WE Are Specifically Using It For in Smart Complaint Handler
In `SmartComplaintHandler`, `src/api/client.js` is the foundational network bridge connecting all React UI views to our FastAPI backend:
1. It exposes a single pre-configured Axios instance (`apiClient`) with a base URL dynamically derived from the environment variable `VITE_API_BASE_URL` (falling back to `/api/v1` in local development to take advantage of our Vite proxy).
2. It enforces a strict 10-second request timeout (`timeout: 10000`), guaranteeing that if the backend server freezes or an SQLite table locks, the user's browser does not hang indefinitely with an infinite loading spinner.
3. It implements a Response Interceptor that automatically unwraps Axios response envelopes (returning `response.data` directly to caller functions so components never have to manually unpack `.data`), while catching FastAPI Pydantic validation errors (`HTTP 422 Unprocessable Entity`) and transforming raw Python validation arrays into human-readable JavaScript error messages.

### Future AI Integration & Roadmap Hooks
In Version 2 (V2), when our platform introduces real-time AI classification and multimodal grievance analysis via Gemini API endpoints, this client provides:
1. AI Telemetry & Session Header Injection: A request interceptor hook allowing the client to inject dynamic client session identifiers (`X-Client-Session-ID`) and AI model preference headers (`X-Predictive-Engine: gemini-1.5-flash`) into every outbound request.
2. Inference Latency Tracking: A response interceptor timer that calculates the exact round-trip network duration (in milliseconds) of AI preview endpoints, reporting telemetry metrics to the admin dashboard.
3. Graceful AI Fallback Normalization: An error interceptor rule that detects AI service timeouts or rate-limiting responses (`HTTP 429 Too Many Requests` or `HTTP 503 Service Unavailable`) and gracefully flags the response with a fallback indicator, signaling the UI to switch seamlessly to the local rule-based deterministic classifier without crashing the screen.

### How Other Components Standardly Interact with This File
1. Specialized API client modules in subsequent modules—such as `complaints.js` in M2, `triage.js` in M3, and `assignment.js` in M4—import `apiClient` directly from `@/api/client` and use it to execute REST requests (`apiClient.get()`, `apiClient.post()`, `apiClient.patch()`).
2. UI components never import `src/api/client.js` directly. Instead, UI components interact only with domain-specific API wrapper functions (like `submitComplaint()` or `fetchSquadWorkloads()`), maintaining strict separation between UI rendering and network transport mechanics.

### The Core Problem It Solves & Why It Exists
Without this centralized base client:
- Developers write duplicate `fetch()` calls across every page, manually passing JSON headers and stringifying payloads repeatedly.
- When the backend host changes from `localhost:8000` to a staging or production URL, developers must hunt through dozens of files to update hardcoded strings.
- Backend errors (such as 404, 500, or 422) crash React components because error shapes vary, leaving students staring at blank screens with no explanation when an issue occurs.

---

## Section 2: What Must Be in This File & Why Each Item Is Needed

### 1. Base URL Resolution & Environment Fallback
* Environment Variable Inspection: The client checks `import.meta.env.VITE_API_BASE_URL` (Vite's standard mechanism for exposing environment variables to client-side code).
* Fallback Default String: If the environment variable is undefined, it defaults to the relative path `/api/v1`. This allows zero-configuration local development when running behind the Vite reverse proxy, while supporting explicit remote API URLs in production deployments.

### 2. Axios Instance Instantiation
* Exported Singleton Instance: Instantiated via `axios.create()`. Exported as a named export `apiClient` and a default export.
* Configuration Parameters:
  - `baseURL`: The resolved API base URL string.
  - `timeout`: An integer limit of `10000` milliseconds (10 seconds) to abort hanging requests.
  - `headers`: An initial headers dictionary containing `'Content-Type': 'application/json'` and `'Accept': 'application/json'`.

### 3. Request Interceptor Pipeline
* Outbound Header Injection: Inspects outgoing request config. Automatically ensures that if a payload body is present, the JSON content-type header is preserved.
* Extensibility Hook: Contains a designated comment hook for future authentication tokens (`Authorization: Bearer <token>`) and AI tracking headers without requiring architectural redesign.
* Promise Propagation: Returns the modified `config` object or calls `Promise.reject(error)` if request serialization fails.

### 4. Response Interceptor Pipeline
* Data Unwrapping Success Handler: A callback function `response => response.data`. In Axios, the HTTP payload is nested inside `response.data`. By returning `response.data` at the interceptor level, every downstream caller receives the clean JSON response directly.
* Centralized Error Transformer Error Handler: A callback function `error => { ... }` that catches failed HTTP responses:
  - Network Failure Detection: Checks if `error.response` is undefined (indicating that the backend server is unreachable, DNS failed, or internet connection was severed). Returns a standardized error object: `{ message: 'Backend service unreachable. Please ensure the server is running on port 8000.', status: 0 }`.
  - Pydantic Validation Error Normalization (HTTP 422): When FastAPI returns a 422 error, the error details reside in `error.response.data.detail` as an array of error objects (e.g. `[{ loc: ['body', 'title'], msg: 'field required' }]`). The interceptor extracts these items and converts them into a clean, comma-delimited string or structured dictionary that form components can bind directly to form input fields.
  - Standard HTTP Error Propagation: For HTTP 400, 404, 409, and 500 responses, extracts `error.response.data.detail` or `error.response.data.message` and attaches it to a rejected JavaScript `Error` object via `Promise.reject(normalizedError)`.

---

## Section 3: Component Life-Cycle: Input, Process, Output (IPO Table)

| Life-Cycle Phase | Primary Input | Internal Transformation & Logic | Final Output |
| :--- | :--- | :--- | :--- |
| **1. Client Instantiation** | `import.meta.env.VITE_API_BASE_URL` | Inspects environment; establishes Axios instance with 10s timeout, JSON headers, and attaches request/response interceptor functions. | Singleton `apiClient` ready for network execution. |
| **2. Outbound Request** | Calling function executes `apiClient.post('/tickets', payload)` | Request interceptor inspects config; ensures content-type is `application/json`; prepends baseURL; initiates TCP transmission. | Outbound HTTP request dispatched across network. |
| **3. Successful Response** | Backend returns `HTTP 200/201` with JSON envelope | Response interceptor intercepts payload; strips Axios metadata (headers, status, config); extracts inner `response.data`. | Calling service function receives pure data object directly (e.g. `{ id: 1, tracking_code: 'TICK-8F2D' }`). |
| **4. Network Failure** | TCP connection refused (FastAPI down) | Interceptor detects `!error.response`; formats human-readable connectivity diagnostic; throws normalized error. | Caller catch block receives clear diagnostic: `Backend service unreachable on port 8000`. |
| **5. Validation Error** | Backend returns `HTTP 422` with Pydantic detail array | Interceptor iterates over `detail` array; maps field paths to validation messages; formats unified error message string. | Caller catch block receives formatted message: `title: string too short, description: field required`. |

---

## Section 4: Flexibility & Modification Guide

### 🟢 Safe to Modify & Customize
* **Request Timeout Duration**: You may increase the timeout from `10000` ms to `15000` ms if running in environments with slower network connections or when testing complex multi-second AI inference calls in Version 2.
* **Custom Request Headers**: You can safely add custom non-standard headers (such as `X-Campus-Client-Version: 1.0`) inside the default headers object without disrupting core functionality.
* **Console Telemetry Logging**: You can add `console.log()` statements inside the request and response interceptors to log outbound API endpoints and response status codes during local debugging.

### 🔴 Strict Non-Negotiables (Do NOT Alter)
* **Data Unwrapping in Response Interceptor**: Do NOT remove `response => response.data`. All specialized API modules across M2, M3, and M4 depend on receiving the raw data payload directly. Removing this will break all downstream data bindings, causing `undefined` errors throughout the UI.
* **Error Normalization Structure**: Do NOT allow raw Axios errors to pass through unhandled. Raw Axios errors contain circular JavaScript references (`XMLHttpRequest`, `config`) that can crash React error boundary renderers and render cryptic `[object Object]` error messages on screen.
* **Base URL Relative Default**: Do NOT change the default fallback from `/api/v1` to an absolute URL like `http://localhost:8000/api/v1` in source code. Hardcoding `localhost:8000` bypasses the Vite proxy, breaks cross-browser testing on mobile devices, and causes CORS errors in staging environments. Always use environment variables for absolute URLs.

---

## Section 5: Advanced Concepts Explained

### 1. The Axios Interceptor Middleware Pipeline
An HTTP interceptor functions as an asynchronous chain of promises (an object representing the eventual completion or failure of an asynchronous operation). When `apiClient.request()` is invoked, Axios constructs a promise execution queue:

`[Request Interceptor 1, ..., Dispatch HTTP Request, ..., Response Interceptor 1]`

The request interceptors execute in First-In-First-Out (FIFO) sequence, passing the configuration dictionary from one middleware step to the next. Once the browser receives the raw TCP response, the response interceptors execute in sequence.

If an error occurs at any point in the pipeline, execution jumps immediately to the error handler of the next interceptor in the chain. This guarantees that centralized security, logging, and error-formatting policies are executed deterministically before any application component receives the result.

### 2. Error Normalization Architecture & Pydantic 422 Unwrapping
FastAPI validates incoming JSON payloads against Pydantic schemas before executing any endpoint handler. When a request violates schema constraints, FastAPI automatically generates an `HTTP 422 Unprocessable Entity` response with a structured JSON body following this schema:
`{ "detail": [ { "loc": ["body", "title"], "msg": "ensure this value has at least 5 characters", "type": "value_error.any_str.min_length" } ] }`

If a frontend component tries to display this error by reading `error.message`, it displays nothing helpful because the message is deeply nested inside an array of dictionaries.

Our response interceptor normalizes this error shape through deterministic transformation:
1. It inspects whether `error.response.status === 422` and verifies that `error.response.data.detail` is an array.
2. It maps over the array, extracting the field name from the last element of `loc` and concatenating it with `msg`.
3. It constructs a unified, user-facing error string (e.g. `Validation failed: title: ensure this value has at least 5 characters`).
4. It creates a standardized JavaScript `Error` instance and attaches a `fields` dictionary mapping each field directly to its error message. This allows form inputs to highlight individual red borders beneath the specific invalid input.

### 3. Graceful Network Degradation & Status Code 0
When a user loses network connectivity or the local backend crashes, the browser fails to complete the TCP handshake. In this scenario, the browser does not receive an HTTP status code (such as 400 or 500) because no HTTP response ever arrived.

Axios represents this condition by returning an error where `error.response` is completely `undefined`, while `error.request` is populated.

If an application does not check for this condition, it throws a secondary JavaScript error (`TypeError: Cannot read properties of undefined (reading 'status')`), masking the real root cause. Our base client explicitly checks for `!error.response`, assigns a synthetic status code of `0`, and provides a crystal-clear, actionable message instructing the student or developer to verify that the FastAPI backend server is running on port 8000.

---

## Section 6: Definition of Done & Verification Protocol

### Observable Verification Checklist
* [ ] `src/api/client.js` exists and exports both a named export `apiClient` and a default export.
* [ ] Base URL properly evaluates `import.meta.env.VITE_API_BASE_URL` with fallback to `/api/v1`.
* [ ] Request timeout is configured to `10000` ms (10 seconds).
* [ ] Request interceptor ensures `'Content-Type': 'application/json'` header is attached.
* [ ] Response interceptor unwraps `response.data` so that `apiClient.get()` returns the data object directly.
* [ ] Response error interceptor normalizes network connection dropouts into `{ message: 'Backend service unreachable...', status: 0 }`.
* [ ] Response error interceptor parses FastAPI Pydantic 422 validation arrays into clean readable strings.

### Verification Commands & Troubleshooting Matrix

1. **Verify Base Client Compilation & Import:**
   In `src/App.jsx` or a test script, verify the client can be imported without syntax errors:
   `import { apiClient } from './api/client';`

2. **Verify Network Error Interception (Backend Offline):**
   Stop the backend server and issue a request from browser developer console:
   `import('./src/api/client.js').then(m => m.apiClient.get('/health').catch(e => console.error(e.message)));`
   Expected console output: `Backend service unreachable. Please ensure the server is running on port 8000.`

3. **Verify Data Unwrapping (Backend Online):**
   With backend running, issue a request from browser developer console:
   `import('./src/api/client.js').then(m => m.apiClient.get('/tickets').then(data => console.log('Received data:', data)));`
   Expected console output: `Received data: [...]` (direct array/object, not nested inside `.data`).

4. **Troubleshooting Matrix:**
   * *Problem:* All API requests fail with `Network Error` and status 0 even when backend is running.
     * *Cause:* Vite development server proxy is misconfigured or backend is listening on a different port than 8000.
     * *Fix:* Check `vite.config.js` proxy settings and verify backend is running on `http://127.0.0.1:8000` via terminal curl.
   * *Problem:* Form errors render as `[object Object]` in the UI.
     * *Cause:* A component bypassed `client.js` or the 422 error normalization failed to extract the string message.
     * *Fix:* Inspect response error interceptor to ensure `error.response.data.detail` is mapped to string before `Promise.reject()`.
   * *Problem:* Requests time out prematurely after 1 second.
     * *Cause:* `timeout` was erroneously set to `1000` instead of `10000` (milliseconds).
     * *Fix:* Verify `timeout: 10000` in `src/api/client.js`.
