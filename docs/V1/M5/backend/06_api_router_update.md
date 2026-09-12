# Module M5 Backend: Central API Router Aggregation Specification

Authoritative Engineering Blueprint for Updating `backend/app/api/v1/router.py`.

---

## Section 1: Standard Purpose & Industry Role

### Standard Industry Role & Real-World Use Cases
In modular backend engineering, a monolithic endpoint file where hundreds of route definitions are piled together becomes an unmaintainable bottleneck. Modern web frameworks (such as FastAPI, Express, or Spring Boot) employ Router Aggregation (the pattern of breaking endpoint handlers into domain-specific controller modules and mounting them into a hierarchical router tree under a common API namespace).

An API router aggregator (a centralized module that imports disparate domain route controllers and registers them onto a parent router instance) establishes a single, unified HTTP entry point. In enterprise architectures, this aggregator enforces:
1. Uniform API versioning (e.g. prefixing all routes with `/api/v1`).
2. Centralized OpenAPI metadata and Swagger tag categorization.
3. Path prefix scoping and middleware inheritance across endpoints.

### What WE Are Specifically Using It For in Smart Complaint Handler
In `SmartComplaintHandler`, `backend/app/api/v1/router.py` is the central aggregator uniting all backend feature modules (M2, M3, M4, M5):
1. It imports the newly created SLA and lifecycle controllers from `app.api.v1.endpoints.sla`.
2. It mounts `sla.router` onto `api_router` with tags `["sla", "tickets"]`, registering the four new lifecycle endpoints:
   - `PATCH /api/v1/tickets/{id}/status`
   - `POST /api/v1/tickets/{id}/resolve`
   - `POST /api/v1/tickets/{id}/escalate`
   - `GET /api/v1/sla/breaches/active`
3. It ensures that the interactive Swagger API documentation at `http://127.0.0.1:8000/docs` reflects all SLA and lifecycle endpoints with schemas, request models, and response status codes.

### Future AI Integration & Roadmap Hooks
In Version 2 (V2), when our platform introduces automated AI-driven operational optimization via Gemini API, this router configuration provides:
1. Dynamic AI Route Namespace: An isolated mount point for Version 2 AI endpoints (`api_router.include_router(ai_triage.router, prefix="/ai", tags=["ai"])`) that can be activated or deactivated via feature flags without altering core operational routes.
2. AI Telemetry Middleware Attachment: The ability to attach route-level middleware directly to the aggregated router to record request payloads, token usage, and AI inference latency across all ticket endpoints.
3. Backward Compatibility Preservation: By maintaining the unified `/api/v1` namespace, legacy mobile apps or external campus portals can continue querying standard ticket endpoints even as AI microservices are integrated.

### How Other Components Standardly Interact with This File
1. `main.py` (Module M2 Backend) imports `api_router` from `app.api.v1.router` and mounts it onto the root FastAPI application: `app.include_router(api_router, prefix="/api/v1")`.
2. `src/api/sla.js` (Module M5 Frontend) targets endpoints exposed through this aggregated router tree.

### The Core Problem It Solves & Why It Exists
Without this central router update:
- The new SLA endpoints created in `endpoints/sla.py` remain isolated and unreachable, returning `HTTP 404 Not Found` when called by the frontend.
- Endpoint registration would be scattered across random files, making it impossible to audit which routes are active or enforce consistent security policies.
- Interactive documentation at `/docs` would be fragmented or missing lifecycle contracts entirely.

---

## Section 2: What Must Be in This File & Why Each Item Is Needed

### 1. Router Aggregator Instance
* Router Instantiation: `api_router = APIRouter()`.
* Top-Level Routing Tree: Acts as the parent router collecting all `/api/v1` routes.

### 2. Endpoint Module Imports
* Existing Imports:
  - `from app.api.v1.endpoints import tickets` (Module M2 Ingestion & Tracking)
  - `from app.api.v1.endpoints import priority` (Module M3 Classification & Triage)
  - `from app.api.v1.endpoints import assignment` (Module M4 Dispatch & Workload)
* Newly Added Import:
  - `from app.api.v1.endpoints import sla` (Module M5 SLA & Lifecycle State Machine)

### 3. Router Inclusions & Tag Categorization
* Ingestion Endpoints Mounting:
  `api_router.include_router(tickets.router, tags=["tickets"])`
* Priority Endpoints Mounting:
  `api_router.include_router(priority.router, tags=["priority", "tickets"])`
* Assignment Endpoints Mounting:
  `api_router.include_router(assignment.router, tags=["assignment", "teams", "tickets"])`
* Newly Added SLA Endpoints Mounting:
  `api_router.include_router(sla.router, tags=["sla", "tickets"])`
* Why Needed: Attaching the `sla.router` registers the status update, resolution, escalation, and breach endpoints under the master API tree, making them immediately accessible to HTTP clients.

---

## Section 3: Component Life-Cycle: Input, Process, Output (IPO Table)

| Life-Cycle Phase | Primary Input | Internal Transformation & Logic | Final Output |
| :--- | :--- | :--- | :--- |
| **1. Application Startup** | `main.py` imports `api_router` | FastAPI evaluates `router.py`; imports `sla.py`; inspects route decorators; mounts endpoints into internal URL map. | All SLA endpoints registered and active in memory. |
| **2. Inbound HTTP Request** | Client sends `PATCH /api/v1/tickets/1/status` | FastAPI inspects path `/api/v1`; routes to `api_router`; matches `/tickets/{id}/status`; dispatches to `sla.py`. | Request forwarded to controller handler without latency. |
| **3. Documentation Generation** | Developer accesses `http://127.0.0.1:8000/docs` | FastAPI inspects all included routers and tags; compiles OpenAPI 3.0 JSON schema; renders Swagger UI. | Interactive documentation page renders SLA endpoints under "sla" and "tickets" sections. |

---

## Section 4: Flexibility & Modification Guide

### 🟢 Safe to Modify & Customize
* **Swagger Tag Names**: You can customize or re-order tags in `tags=["sla", "tickets"]` to change how endpoints are grouped in the interactive documentation.
* **Route Path Prefixes**: If your institution prefers a dedicated prefix for SLA management (e.g. `/api/v1/sla`), you can add `prefix="/sla"` to the `include_router()` call. Make sure to update the frontend client accordingly.
* **Additional Middleware**: You can attach endpoint dependencies (such as rate limiters or authentication guards) directly to `api_router.include_router(sla.router, dependencies=[...])`.

### 🔴 Strict Non-Negotiables (Do NOT Alter)
* **Variable Name `api_router`**: Do NOT rename `api_router`. `main.py` explicitly imports `from app.api.v1.router import api_router`. Renaming it will cause `ImportError` on application boot.
* **Router Inclusion Order**: Do NOT mount routers with static paths after routers with broad path parameter wildcards that might intercept the static path. `GET /sla/breaches/active` must never be shadowed by a generic `GET /tickets/{id}`.
* **Namespace Isolation**: Do NOT mount `sla.router` directly inside individual endpoint files. All endpoint routers must aggregate through `backend/app/api/v1/router.py`.

---

## Section 5: Architectural & Theoretical References

This specification operates strictly as an **implementation and integration blueprint**. For the exhaustive computer science fundamentals, language runtime mechanics, and protocol specifications governing this component, consult the following authoritative manuals in the **Developer Guide Suite**:

* [**Guide 02: FastAPI & Modern ASGI Web Architecture**](../../../developer_guide/02_FASTAPI_ASGI_WEB_ARCHITECTURE.md)  
  Hierarchical router aggregation, Composite architectural pattern, and prefix tree URL compilation.

* [**Guide 01: Python Language and Runtime Mechanics**](../../../developer_guide/01_PYTHON_LANGUAGE_AND_RUNTIME_MECHANICS.md)  
  Module import hierarchy, namespace isolation, and clean architectural boundaries.

---

## Section 6: Definition of Done & Verification Protocol

### Observable Verification Checklist
* [ ] `backend/app/api/v1/router.py` imports `sla` from `app.api.v1.endpoints`.
* [ ] `api_router.include_router(sla.router, tags=["sla", "tickets"])` is executed.
* [ ] Starting FastAPI server prints no routing errors or duplicate route warnings.
* [ ] Navigating to `http://127.0.0.1:8000/docs` in browser renders all 4 SLA endpoints under the Swagger UI.
* [ ] Executing `GET /api/v1/openapi.json` returns valid JSON containing path definitions for `/tickets/{ticket_id}/status`, `/tickets/{ticket_id}/resolve`, `/tickets/{ticket_id}/escalate`, and `/sla/breaches/active`.

### Verification Commands & Troubleshooting Matrix

1. **Verify Router Compilation via Python CLI:**
   Run in backend directory:
   `python -c "from app.api.v1.router import api_router; routes = [r.path for r in api_router.routes]; print('Mounted routes:', [r for r in routes if 'status' in r or 'resolve' in r or 'breaches' in r])"`
   Expected output: `Mounted routes: ['/tickets/{ticket_id}/status', '/tickets/{ticket_id}/resolve', '/tickets/{ticket_id}/escalate', '/sla/breaches/active']`.

2. **Verify OpenAPI Schema Generation:**
   Run in backend directory with server active:
   `curl http://127.0.0.1:8000/openapi.json | grep -o "tickets/{ticket_id}/status"`
   Expected output: `tickets/{ticket_id}/status`.

3. **Troubleshooting Matrix:**
   * *Problem:* Terminal shows `ImportError: cannot import name 'sla' from 'app.api.v1.endpoints'`.
     * *Cause:* `backend/app/api/v1/endpoints/sla.py` was not created or contains a fatal syntax error.
     * *Fix:* Verify that `sla.py` exists in the endpoints folder and can be imported without errors.
   * *Problem:* Calling SLA endpoints returns `404 Not Found`.
     * *Cause:* `router.py` was saved but the backend Uvicorn development server was not restarted.
     * *Fix:* Restart Uvicorn or ensure `--reload` flag is active in the development terminal.
   * *Problem:* Interactive docs at `/docs` do not group SLA endpoints together.
     * *Cause:* `tags` parameter was omitted from `include_router()`.
     * *Fix:* Verify `tags=["sla", "tickets"]` is included in `api_router.include_router(sla.router, ...)`.
