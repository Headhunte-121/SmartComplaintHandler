# Module M3 - File 06: API Router Aggregator Update
## Target File: `backend/app/api/v1/router.py`
### Execution Track: Phase 3 (Requires File 05)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In enterprise web architectures and modular FastAPI applications, `backend/app/api/v1/router.py` acts as the **Master API Router Aggregator & Version Facade**. It implements the architectural **Composite Pattern** for web routes: aggregating independent domain-specific endpoint controllers (such as tickets, triage-priority, departments, and authentication) into a single, cohesive, version-controlled `/api/v1` namespace before mounting them into the root web application.

### Standard Industry Role & Real-World Use Cases
In professional production systems (such as Twilio REST APIs, Stripe checkout gateways, and Datadog monitoring APIs), router aggregators standardly fulfill four mission-critical functions:

1. **Hierarchical URL Namespace Composition:**
   * Instead of repeating lengthy, error-prone URL prefixes in dozens of individual controller files, the architecture organizes endpoints hierarchically:
     * `backend/app/main.py` defines the global API version prefix: `/api/v1`.
     * `backend/app/api/v1/router.py` defines domain resource namespaces: `/tickets`, `/departments`.
     * The endpoint files define atomic operations: `/triage-preview`, `/{ticket_id}/priority`.
   * The framework automatically stitches these segments together into clean, standard RESTful URLs: `/api/v1/tickets/triage-preview` and `/api/v1/tickets/{ticket_id}/priority`.
2. **API Version Isolation & Backward Compatibility:**
   * In enterprise production, APIs evolve across version milestones (`v1`, `v2`, `v3`).
   * By isolating Version 1 routes inside `app/api/v1/router.py`, the engineering team can develop a future `v2` router with breaking payload changes without breaking legacy mobile applications or existing web clients.
3. **Decoupled Development in Multi-Engineer Teams:**
   * Enables team members to work on separate endpoint files simultaneously without experiencing Git merge conflicts.
   * Integrating a newly completed module (like our priority and triage subsystem) requires adding only two clean lines to this aggregator file.
4. **Interactive Documentation Categorization (OpenAPI Tags):**
   * Standardly attaches metadata tags to sub-routers, partitioning endpoints into logical sections within the interactive Swagger UI (`/docs`) and ReDoc documentation pages.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our automated campus complaint routing platform, our 5-student engineering team specifically uses `backend/app/api/v1/router.py` for three concrete operational functions:

1. **Mounting the Priority & Triage Subsystem into the `/tickets` Namespace:**
   * Imports the newly created `priority.router` from `backend/app/api/v1/endpoints/priority.py`.
   * Mounts it into `api_router` under the existing `/tickets` prefix with the tag `tags=["priority"]`.
   * Seamlessly exposes the two Module M3 endpoints:
     * `POST /api/v1/tickets/triage-preview` (stateless complaint analysis for real-time form feedback).
     * `PATCH /api/v1/tickets/{ticket_id}/priority` (administrative priority override).
2. **Maintaining Uniform REST Resource Hierarchy:**
   * By mounting both `tickets.router` (Module M2) and `priority.router` (Module M3) under the common `/tickets` resource namespace, external consumers interact with a unified REST resource model where all complaint-related operations live under `/api/v1/tickets`.
3. **Preserving a Clean Directed Acyclic Graph (DAG):**
   * Keeps `main.py` completely decoupled from individual endpoint controllers. `main.py` only knows about `api_router`, maintaining strict architectural layering.

### How Other Components Standardly Interact with This File
Across the backend architecture, this file is consumed in a single standardized relationship:
* **The Root Application (`backend/app/main.py`):** Imports `api_router` and mounts it into the root FastAPI application:
  `from app.api.v1.router import api_router`
  `app.include_router(api_router, prefix=settings.API_V1_STR)`
* **The Sub-Routers (`endpoints/tickets.py` and `endpoints/priority.py`):** Define their own isolated routers. They never import `router.py`, ensuring dependencies flow strictly downwards.
* **OpenAPI Documentation Engine:** Inspects `api_router` to generate the global `/openapi.json` contract and interactive `/docs` UI.

### The Core Problem It Solves & Why It Exists
* **The Monolithic `main.py` Anti-Pattern:** Without a router aggregator, every new endpoint module must be imported directly into `main.py`. Over time, `main.py` balloons into a fragile 600-line monolith filled with competing imports and routing logic.
* **Namespace Fragmentation:** If different engineers independently declare prefixes in endpoint files, one engineer might use `/api/v1/ticket` (singular) while another uses `/api/v1/triage` (separate resource). The aggregator centrally enforces standardized REST naming conventions.

---

# 2. What Must Be in This File & Why Each Item Is Needed

To complete the Module M3 router update, `backend/app/api/v1/router.py` must define, configure, and export the following five essential items:

---

### Item 1: Endpoint Router Imports
* **What it is:** Importing both the existing `tickets` router from Module M2 and the new `priority` router from Module M3 File 05.
* **Specification:** `from app.api.v1.endpoints import tickets, priority`
* **Why it is needed:**
  * Brings both presentation controllers into the aggregator's scope for registration.

---

### Item 2: Master Router Instantiation
* **What it is:** Creating the master `api_router` instance.
* **Specification:** `api_router = APIRouter()`
* **Why it is needed:**
  * Serves as the top-level Version 1 routing container to which all domain sub-routers are attached.

---

### Item 3: Core Ticket Operations Inclusion (Module M2)
* **What it is:** Mounting the complaint intake and tracking router.
* **Specification:** `api_router.include_router(tickets.router, prefix="/tickets", tags=["tickets"])`
* **Why it is needed:**
  * Preserves all existing complaint endpoints: `POST /api/v1/tickets`, `GET /api/v1/tickets/{tracking_code}`, and `GET /api/v1/tickets`.

---

### Item 4: Priority & Triage Operations Inclusion (Module M3 Upgrade)
* **What it is:** Mounting the new priority triage and override router.
* **Specification:** `api_router.include_router(priority.router, prefix="/tickets", tags=["priority"])`
* **Why it is needed:**
  * Attaches the new triage preview (`/triage-preview`) and priority override (`/{ticket_id}/priority`) endpoints directly under `/tickets`.
  * Categorizes these operations under the `"priority"` tag in Swagger UI for clean visual separation.

---

### Item 5: Explicit Symbol Re-Export (`__all__`)
* **What it is:** Declaring `__all__ = ["api_router"]`.
* **Why it is needed:**
  * Clearly signals to static analysis tools and code linters that `api_router` is the sole intentional public export of this module.

---

# 3. Component Life-Cycle: Input, Process, Output (IPO Table)

The following table documents the registration life-cycle inside `backend/app/api/v1/router.py`:

| Stage | Action Performed Behind the Scenes |
| :--- | :--- |
| **INPUT** | 1. `tickets.router` instance from `app.api.v1.endpoints.tickets`<br>2. `priority.router` instance from `app.api.v1.endpoints.priority` |
| **PROCESS** | 1. Python imports both endpoint modules into memory.<br>2. Instantiates master `api_router = APIRouter()`.<br>3. Evaluates `api_router.include_router(tickets.router, prefix="/tickets", tags=["tickets"])`, appending ticket routes to the internal routing tree.<br>4. Evaluates `api_router.include_router(priority.router, prefix="/tickets", tags=["priority"])`, appending triage-preview and priority-override routes under `/tickets`.<br>5. Registers OpenAPI documentation tags. |
| **OUTPUT** | Unified `api_router` exposing the complete Version 1 route tree (`/api/v1/tickets/...`), ready for consumption by `main.py`. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. Strict Non-Negotiables

To preserve routing integrity across the backend, adhere to the following rules:

### 🟢 Safe to Modify (Configurable Parameters)
* **OpenAPI Tag Names:** You can customize the documentation tags list (e.g. changing `tags=["priority"]` to `tags=["priority", "triage"]` or `tags=["Incident Triage"]` to improve Swagger UI clarity).
* **Adding Future Sub-Routers:** You can mount future module routers here with a single instruction (e.g. adding `api_router.include_router(assignment.router, prefix="/tickets", tags=["assignment"])` in Module M4, and `api_router.include_router(sla.router, prefix="/tickets", tags=["sla"])` in Module M5).
* **Route Registration Order:** You can register `priority.router` before or after `tickets.router`, as their route paths and HTTP verbs do not conflict.

### 🔴 Strict Non-Negotiables (System Breaking Changes)
* **DO NOT Change `prefix="/tickets"` to a Non-Standard Path:** Changing the prefix to `/triage` or `/ticket` (singular) breaks frontend API client configurations and breaks the uniform REST resource hierarchy.
* **DO NOT Add Business Logic or Database Sessions Here:** This file must remain an aggregation facade only. Defining endpoint functions or importing SQLAlchemy sessions inside `router.py` breaks architectural layering.
* **DO NOT Rename `api_router`:** The root application (`backend/app/main.py`) explicitly imports the symbol `api_router`. Renaming it to `router` or `v1_router` causes an `ImportError` on application startup.
* **DO NOT Create Circular Imports:** Endpoints must NEVER import `router.py`. All imports must flow unidirectionally from `router.py` into endpoint modules.

---

# 5. Architectural & Theoretical References

This specification operates strictly as an **implementation and integration blueprint**. For the exhaustive computer science fundamentals, language runtime mechanics, and protocol specifications governing this component, consult the following authoritative manuals in the **Developer Guide Suite**:

* [**Guide 02: FastAPI & Modern ASGI Web Architecture**](../../../developer_guide/02_FASTAPI_ASGI_WEB_ARCHITECTURE.md)  
  Hierarchical router aggregation, Composite architectural pattern, and prefix tree URL compilation.

* [**Guide 01: Python Language and Runtime Mechanics**](../../../developer_guide/01_PYTHON_LANGUAGE_AND_RUNTIME_MECHANICS.md)  
  Module import hierarchy, namespace isolation, and clean architectural boundaries.

---

# 6. Definition of Done: Observable Verification Checklist

Before considering the `backend/app/api/v1/router.py` update complete, verify each of the following operational checkpoints:

### Implementation Checklist
- [ ] File exists at `backend/app/api/v1/router.py`.
- [ ] Imports both `tickets` and `priority` from `app.api.v1.endpoints`.
- [ ] Instantiates `api_router = APIRouter()`.
- [ ] Mounts `tickets.router` under `prefix="/tickets"` with `tags=["tickets"]`.
- [ ] Mounts `priority.router` under `prefix="/tickets"` with `tags=["priority"]`.
- [ ] Exports `api_router` cleanly.
- [ ] Contains zero database connections, session calls, or business logic.

### Terminal Verification Commands (Run in PowerShell from Project Root)

1. **Verify Router Import & Aggregated Route List:**
   `python -c "from app.api.v1.router import api_router; paths = [r.path for r in api_router.routes]; assert '/tickets/triage-preview' in paths; assert '/tickets/{ticket_id}/priority' in paths; assert '/tickets/' in paths; print('All v1 routes aggregated successfully:', paths)"`

2. **Verify Global App Route Mounting via `main.py`:**
   `python -c "from app.main import app; all_routes = [r.path for r in app.routes]; assert '/api/v1/tickets/triage-preview' in all_routes; assert '/api/v1/tickets/{ticket_id}/priority' in all_routes; print('Global application routes verified:', [r for r in all_routes if 'tickets' in r])"`

3. **Verify OpenAPI Documentation Generation:**
   `python -c "from app.main import app; schema = app.openapi(); assert '/api/v1/tickets/triage-preview' in schema['paths']; assert '/api/v1/tickets/{ticket_id}/priority' in schema['paths']; print('OpenAPI schema includes priority endpoints! Tags found:', [t['name'] for t in schema.get('tags', [])])"`
