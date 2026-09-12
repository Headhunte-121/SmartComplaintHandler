# Module M2 - File 07: FastAPI Root Application Entry Point
## Target File: `backend/app/main.py`
### Execution Track: Phase 4 (Can be built in parallel with File 06 once File 05 is complete)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In professional Python web engineering, `main.py` serves as the **Root ASGI Application Factory & Middleware Orchestrator**. It is the top-level entry point executed by ASGI web servers (such as Uvicorn or Gunicorn) to boot the application, register global middleware (such as Cross-Origin Resource Sharing and security headers), manage application lifespan startup and shutdown routines, mount versioned router trees, and provide root health check endpoints.

### Standard Industry Role & Real-World Use Cases
In modern production web architectures, `main.py` standardly fulfills five core system responsibilities:

1. **The ASGI Server Target:**
   * Acts as the primary target for asynchronous application servers. When Uvicorn boots (`uvicorn app.main:app --port 8000`), it loads this module and inspects the exported `app` callable object to handle asynchronous network sockets.
2. **Cross-Origin Resource Sharing (CORS) Security Enforcement:**
   * Modern web browsers enforce the **Same-Origin Policy**: by default, a frontend application running on `http://localhost:5173` (Vite / React) is strictly blocked by the browser from making network requests to a backend on `http://localhost:8000` (FastAPI).
   * `main.py` registers CORS middleware, instructing the server to transmit explicit `Access-Control-Allow-Origin` headers that authorize the frontend to make requests.
3. **Application Lifespan Event Management (Startup & Teardown):**
   * Uses modern ASGI lifespan context managers to execute critical infrastructure setup tasks at server boot (such as verifying database connectivity, running schema generation, and warming cache connections) before any incoming user traffic is accepted.
4. **Interactive Documentation Configuration:**
   * Configures global API metadata: application title, version number, public descriptions, and interactive Swagger UI (`/docs`) and ReDoc (`/redoc`) documentation endpoints.
5. **System Health & Liveness Probing:**
   * Exposes lightweight, unauthenticated health check routes (e.g. `GET /health`) used by monitoring tools, cloud load balancers, and developers to verify that the web process is running and healthy.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our campus complaint automation platform, our 5-student engineering team specifically uses `backend/app/main.py` for four concrete operational functions:

1. **Booting Our Campus Complaint Platform:**
   * Serves as the exact command target when any team member starts the backend server in PowerShell:
     `uvicorn app.main:app --reload --port 8000`
2. **Connecting Our React Frontend to FastAPI via CORS:**
   * Configures `CORSMiddleware` to explicitly permit origins `http://localhost:5173` and `http://127.0.0.1:5173` (the Vite React development server).
   * Guarantees that when our teammate developing the React frontend submits a complaint from their browser, Google Chrome or Microsoft Edge allows the HTTP request to pass through without CORS errors.
3. **Automated Database Table Verification on Startup:**
   * Uses an asynchronous lifespan context manager to execute `Base.metadata.create_all(bind=engine)` upon boot.
   * Ensures that if a teammate pulls new code or sets up a fresh laptop, the SQLite tables (`departments`, `teams`, `tickets`) are automatically guaranteed to exist on disk before the server handles its first student request.
4. **Mounting Our `/api/v1` Route Tree & Health Check:**
   * Mounts the master aggregator from File 06 (`api_router`) at prefix `/api/v1`.
   * Exposes `GET /health` returning `{"status": "healthy", "version": "1.0.0"}` so anyone on the team can test that the server is alive by typing `http://localhost:8000/health` into their web browser.

### How Other Components Standardly Interact with This File
Across the system architecture:
* **The Uvicorn ASGI Server:** Directly inspects and runs `app = FastAPI(...)`.
* **The Master API Router (`app/api/v1/router.py`):** Is imported and mounted into `app`.
* **The Core Database Engine (`app/core/database.py`):** Is imported by the lifespan manager to bind tables.
* **The Settings Singleton (`app/core/config.py`):** Supplies `settings.PROJECT_NAME` and `settings.API_V1_STR`.

### The Core Problem It Solves & Why It Exists
* **The Infamous CORS Browser Blockade:** Without CORS middleware in `main.py`, the React frontend cannot communicate with FastAPI. Submitting a complaint from the web UI results in an immediate red browser console error: *"Blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present"*.
* **Startup Race Conditions:** If incoming HTTP traffic arrives before database tables are created on disk, requests crash with missing-table errors. Lifespan events guarantee data readiness before network traffic begins.
* **Scattered Configuration:** Centralizing application metadata in `main.py` ensures that title, docs paths, and middleware rules are maintained in a single place.

---

# 2. What Must Be in This File & Why Each Item Is Needed

To be complete, this component must define, configure, and establish the following five essential items:

---

### Item 1: Modern Lifespan Context Manager (`lifespan`)
* **What it is:** An asynchronous context manager decorated with `@asynccontextmanager` governing application startup and shutdown.
* **Signature:** `@asynccontextmanager async def lifespan(app: FastAPI):`
* **Internal Behavior:**
  * **Before `yield` (Startup):**
    * Imports `Base` from `app.db.base` and `engine` from `app.core.database`.
    * Executes `Base.metadata.create_all(bind=engine)` to ensure all physical SQLite tables exist.
  * **The `yield` Statement:** Pauses the context manager and allows the web server to run and accept student requests.
  * **After `yield` (Shutdown):** Executes any required resource teardown when the server stops.
* **Why it is needed:**
  * Replaces deprecated FastAPI startup event decorators (`@app.on_event("startup")`).
  * Guarantees that tables are created deterministically before any HTTP request reaches route handlers.

---

### Item 2: The Root FastAPI Application Instance (`app`)
* **What it is:** The primary `FastAPI` instance instantiated with application metadata and the lifespan manager.
* **Specification:**
  `app = FastAPI(`
  `    title=settings.PROJECT_NAME,`
  `    version="1.0.0",`
  `    openapi_url=f"{settings.API_V1_STR}/openapi.json",`
  `    lifespan=lifespan`
  `)`
* **Why it is needed:**
  * Establishes the ASGI application callable target for Uvicorn.
  * Uses `settings.PROJECT_NAME` imported from Module M1 (`"Smart Complaint Handler"`), ensuring configuration consistency.

---

### Item 3: CORS Middleware Registration (`CORSMiddleware`)
* **What it is:** Adding `CORSMiddleware` to the application's middleware stack.
* **Configuration:**
  * `allow_origins`: List containing `["http://localhost:5173", "http://127.0.0.1:5173"]`.
  * `allow_credentials`: `True`.
  * `allow_methods`: `["*"]` (permits `GET`, `POST`, `PATCH`, `DELETE`, `OPTIONS`).
  * `allow_headers`: `["*"]` (permits standard headers including `Content-Type`).
* **Why it is needed:**
  * **Browser Security Clearance:** Intercepts browser preflight `OPTIONS` requests and adds required `Access-Control-Allow-Origin` response headers, allowing the React frontend on port 5173 to communicate with FastAPI on port 8000.

---

### Item 4: Master API Router Inclusion
* **What it is:** Mounting the aggregated v1 router into the application.
* **Specification:** `app.include_router(api_router, prefix=settings.API_V1_STR)`
* **Why it is needed:**
  * Connects all ticket endpoints (`/tickets`, `/{tracking_code}`) into the active application under the base `/api/v1` URL prefix.

---

### Item 5: Root Health Check Endpoint (`GET /health`)
* **What it is:** A lightweight, unauthenticated endpoint at `/health`.
* **Signature:**
  `@app.get("/health", tags=["system"])`
  `def health_check() -> dict:`
  `    return {"status": "healthy", "version": "1.0.0"}`
* **Why it is needed:**
  * Provides an instant, deterministic endpoint for developers and evaluators to verify the server is running without requiring database queries or complex inputs.

---

# 3. Component Life-Cycle: Input, Process, Output

| Stage | What Happens Behind the Scenes |
| :--- | :--- |
| **INPUT** | Terminal command: `uvicorn app.main:app --port 8000`. |
| **PROCESS** | 1. Uvicorn loads `backend/app/main.py`.<br>2. FastAPI initializes `app` with title and OpenAPI settings.<br>3. `CORSMiddleware` wraps the ASGI application pipeline.<br>4. `app.include_router()` mounts `/api/v1` routes.<br>5. The `lifespan` startup hook runs: `Base.metadata.create_all(bind=engine)` verifies SQLite tables.<br>6. Lifespan yields: Uvicorn binds to `127.0.0.1:8000` and begins listening for HTTP requests. |
| **OUTPUT** | A live, operational web server responding to student submissions, staff dashboards, `/docs` Swagger UI, and `/health`. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. What Must Stay Exact

### 🟢 Safe to Modify & Customize (Your Team's Creative Freedom):
* **Expanding CORS Origins:** If your team tests the frontend on another port (e.g. port 3000) or over your local campus network IP (e.g. `http://192.168.1.50:5173`), you can append those addresses to the `allow_origins` list.
* **Adjusting Version Metadata:** You can update `version="1.0.0"` to `"1.1.0"` as your team reaches new milestones.
* **Customizing Health Check Details:** You can expand the health check response dictionary (e.g. returning active database file path or uptime duration).

### 🔴 Strict Non-Negotiables (Must Remain Exact Across the Team):
* **The Variable Name (`app`):** Must remain `app = FastAPI(...)`. The Uvicorn launch command explicitly targets `app.main:app` (`<module>:<variable>`). Renaming `app` causes Uvicorn to crash with `AttributeError: module 'app.main' has no attribute 'app'`.
* **CORS Inclusion on Port 5173:** `http://localhost:5173` must remain in `allow_origins`. Removing it locks out the React client.
* **Mounting `api_router` with `settings.API_V1_STR`:** All endpoints must live under `/api/v1`.
* **File Location (`backend/app/main.py`):** Must reside precisely at this root application path.

---

# 5. Architectural & Theoretical References

This specification operates strictly as an **implementation and integration blueprint**. For the exhaustive computer science fundamentals, language runtime mechanics, and protocol specifications governing this component, consult the following authoritative manuals in the **Developer Guide Suite**:

* [**Guide 02: FastAPI & Modern ASGI Web Architecture**](../../../developer_guide/02_FASTAPI_ASGI_WEB_ARCHITECTURE.md)  
  ASGI application lifecycle, lifespan event handlers (`@asynccontextmanager`), and server bootstrapping.

* [**Guide 19: API Middleware & Defensive Security**](../../../developer_guide/19_API_MIDDLEWARE_AND_SECURITY_HEADERS.md)  
  ASGI middleware stack execution, CORS verification, and security header injection.

* [**Unit 14B: Web Browser Security & Origin Policies**](../../../developer_guide/14B_WEB_BROWSER_SECURITY_AND_ORIGIN_POLICIES.md)  
  Origin verification, preflight `OPTIONS` processing, and cross-origin security rules.

---

# 6. Definition of Done: How to Verify This File Is Complete

This component is 100% complete and verified when:

1. **File Existence:**
   * The Python module exists precisely at `backend/app/main.py`.
2. **Server Boot Verification:**
   * Running `uvicorn app.main:app --port 8000` starts cleanly without syntax or import errors.
3. **CORS Configuration:**
   * `CORSMiddleware` is registered with `allow_origins` including `http://localhost:5173`.
4. **Router & Lifespan Integration:**
   * `api_router` is mounted under `settings.API_V1_STR`.
   * Lifespan executes `Base.metadata.create_all(bind=engine)`.
5. **Programmatic Verification:**
   * Executing the following inline terminal command:
     `python -c "from app.main import app; routes = [r.path for r in app.routes]; assert '/health' in routes; assert any('/api/v1' in r for r in routes); print('Main App OK: FastAPI Application and Routers Loaded Successfully')"`
     succeeds cleanly, printing `Main App OK: FastAPI Application and Routers Loaded Successfully`.
