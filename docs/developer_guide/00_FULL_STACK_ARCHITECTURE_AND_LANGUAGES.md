# Section 0: Full-Stack Architecture & Language Mechanics

To write robust, production-grade code, every engineer on the team must understand how the browser, the operating system, the Python runtime, and the JavaScript engine communicate at the byte, protocol, and process levels.

---

## 1. The Anatomy of an HTTP Request & Wire Protocol

### What It Is
HTTP (Hypertext Transfer Protocol) is a text-based, stateless application-layer protocol running on top of a reliable TCP/IP connection. Every interaction in `SmartComplaintHandler` — submitting a complaint, polling ticket status, or reassigning a squad — consists of an HTTP request and an HTTP response.

```
CLIENT (Browser / Axios)                              SERVER (FastAPI / Uvicorn)
         │                                                      │
         │─────── 1. POST /api/v1/complaints/ HTTP/1.1 ─────────▶│
         │        Host: localhost:8000                          │
         │        Content-Type: application/json                │
         │        Content-Length: 78                            │
         │                                                      │
         │        {"title": "No Power", "location": "Lab 3"}    │
         │                                                      │
         │◀────── 2. HTTP/1.1 201 Created ──────────────────────│
         │        Content-Type: application/json                │
         │        Content-Length: 124                           │
         │                                                      │
         │        {"tracking_code": "TKT-20260911-A1B2", ...}   │
```

### Engineering Rationale & REST Semantics
Why use strict REST status codes instead of returning `{ "status": "error" }` with HTTP 200?
* **HTTP 200 OK:** Request succeeded; the response body contains the requested resource.
* **HTTP 201 Created:** A new resource was successfully persisted in the database.
* **HTTP 400 Bad Request:** Syntactically invalid request or failed domain logic (e.g. attempting an illegal state transition).
* **HTTP 404 Not Found:** The requested ticket code or department does not exist.
* **HTTP 422 Unprocessable Entity:** The payload was valid JSON, but failed type/schema validation (e.g. `title` was fewer than 5 characters).
* **HTTP 500 Internal Server Error:** An unhandled exception crashed on the server.

> [!IMPORTANT]
> If an API returns `HTTP 200 OK` when an error occurs, client-side HTTP libraries like Axios, React Query, and browser error boundaries cannot trigger their `catch` blocks or automated retry strategies. Strict status code adherence is foundational to full-stack reliability.

---

## 2. Python Language Mechanics: ASGI vs. WSGI & The Event Loop

### How Python Handles Web Requests
Traditional Python frameworks (Flask, Django 2.x) run on **WSGI** (Web Server Gateway Interface). In WSGI, each incoming HTTP request is assigned to a dedicated OS thread. If that thread waits on a slow database query or file write, the entire thread is blocked.

FastAPI runs on **ASGI** (Asynchronous Server Gateway Interface), powered by `uvicorn` and Python's built-in `asyncio` event loop.

```
WSGI (Thread-per-request):
Request 1 ──▶ [Thread 1 (Blocked waiting on DB)] ──▶ Response 1
Request 2 ──▶ [Thread 2 (Blocked waiting on DB)] ──▶ Response 2
Request 3 ──▶ [Blocked in queue: All worker threads busy!]

ASGI (Single-threaded Event Loop with async/await):
Event Loop ──▶ [Begins Request 1] ──▶ [DB query awaits: Loop switches to Request 2]
           ──▶ [DB query awaits: Loop switches to Request 3]
           ──▶ [DB 1 completes: Loop resumes Request 1 and sends Response 1]
```

### Synchronous `def` vs. Asynchronous `async def` in FastAPI
Why do we write standard `def` for our database endpoints instead of `async def`?

```python
# Synchronous Endpoint (Recommended for SQLite / Synchronous SQLAlchemy)
@router.post("/complaints")
def create_complaint(data: ComplaintCreate, db: Session = Depends(get_db)):
    return ticket_service.create_ticket(db, data)
```

* **The SQLite Threading Reality:** SQLite is an in-process, file-backed C library. It does not perform asynchronous network I/O; it performs file locks on local disk. Wrapping SQLite in asynchronous drivers often introduces thread synchronization overhead without performance gains.
* **FastAPI's Threadpool Magic:** When an endpoint is declared with standard `def`, FastAPI automatically runs it inside a background worker thread pool (`anyio.to_thread.run_sync`). This guarantees that the main ASGI event loop remains 100% unblocked to accept incoming network connections.

> [!WARNING]
> If you declare an endpoint as `async def` and execute blocking synchronous code (such as `time.sleep()` or heavy CPU loops), you freeze the ENTIRE SERVER event loop. No other request can be accepted until that function returns!

---

## 3. JavaScript & React Language Mechanics

### The V8 Event Loop & Concurrency
JavaScript in the browser executes on a single main thread. Concurrency is managed via the **Browser Event Loop**:
1. **Call Stack:** Executes synchronous functions in LIFO order.
2. **Microtask Queue:** Executes Promises (`.then()`, `await`) immediately after the current call stack clears, before any DOM re-rendering.
3. **Macrotask Queue:** Executes timers (`setTimeout`, `setInterval`) and user input events.

```
Synchronous Code (Call Stack)
            │
            ▼
Microtask Queue (Promises, async/await, Axios responses)
            │
            ▼
Browser Render Pipeline (Style calculation, Layout, Paint)
            │
            ▼
Macrotask Queue (setTimeout, setInterval, Network I/O)
```

### React 18 Virtual DOM & Reconciliation
When state updates in React via `setFormData(newVal)`:
1. React does NOT immediately touch the browser's slow DOM.
2. React re-executes the component function in memory and creates a new **Virtual DOM tree (Fiber nodes)**.
3. **Reconciliation Diffing Algorithm:** React compares the new Virtual DOM tree against the previous Virtual DOM tree ($O(n)$ diffing heuristic).
4. **Commit Phase:** React batches only the specific DOM nodes that changed (e.g. updating an inner text node or toggling a CSS class) and applies them to the real browser DOM in a single redraw.

### Hooks, Closures & Dependency Arrays
React hooks (`useState`, `useEffect`) rely on JavaScript closures:
```jsx
useEffect(() => {
  const timer = setInterval(() => {
    // This closure captures 'deadline' from the render when the effect ran
    checkSla(deadline);
  }, 1000);

  // Cleanup function: executed when component unmounts or before re-running effect
  return () => clearInterval(timer);
}, [deadline]); // Re-runs effect only when 'deadline' reference changes
```
If you omit `[deadline]` from the dependency array, the closure becomes "stale" and references an outdated value of `deadline` forever.

---

## 4. The Client-Server Contract: JSON Serialization & DTOs

### Data Transfer Objects (DTOs) vs. Database Models
```
Database (SQLAlchemy ORM)           FastAPI (Pydantic DTO)           Browser (JavaScript)
┌───────────────────────┐          ┌──────────────────────┐         ┌────────────────────┐
│ Table: tickets        │          │ Schema: TicketResponse│        │ JSON Object        │
│ id: 42                │ ───────▶ │ tracking_code: str   │ ──────▶ │ {                  │
│ internal_hash: "x8f"  │ (Masked) │ title: str           │         │   "tracking_code": │
│ tracking_code: "TKT.."│          │ priority: str        │         │   "TKT-2026...",   │
│ created_at: datetime  │          │ created_at: datetime │         │   "title": "Leak"  │
└───────────────────────┘          └──────────────────────┘         │ }                  │
                                                                    └────────────────────┘
```

1. **Security (Preventing Mass Assignment):** If endpoints accept raw database entities, an attacker can send `{ "id": 1, "is_admin": true }` and overwrite internal columns. DTOs enforce strict input boundaries.
2. **Preventing Circular Reference Crashes:** SQLAlchemy ORM models reference each other (`ticket.department` -> `department.tickets` -> `ticket.department`). Attempting to serialize an ORM model directly to JSON causes an infinite recursion crash.
3. **Pydantic v2 Rust Core:** Pydantic v2 is written in Rust (`pydantic-core`). When JSON arrives, Rust compiles the validation rules into native machine code, achieving microsecond parsing throughput.

---

## 5. Modern Web Tooling: Vite HMR & The Reverse Proxy

### Why Local Development Needs a Reverse Proxy
When running locally:
* React runs on `http://localhost:5173` (Vite dev server).
* FastAPI runs on `http://localhost:8000` (Uvicorn server).

If the browser on port `5173` sends a request directly to port `8000`, the browser's **Same-Origin Policy (SOP)** intervenes:
```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at http://localhost:8000.
```

### The Solution: Development Reverse Proxy in `vite.config.js`
Instead of calling `http://localhost:8000/api/v1/complaints`, the frontend calls `/api/v1/complaints` (relative path on port `5173`):

```javascript
// frontend/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
});
```

1. The browser sends the request to `http://localhost:5173/api/v1/complaints` (Same origin: No CORS check!).
2. Vite's local Node.js server intercepts `/api`, forwards the raw HTTP packets to `http://localhost:8000/api/v1/complaints`.
3. FastAPI responds to Vite; Vite streams the response back to the browser.
4. CORS is completely bypassed during local development.
