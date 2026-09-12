# Module M1 - File 09: API Session Dependency Injector
## Target File: `backend/app/api/deps.py`
### Execution Track: Phase 3 (Can be built in parallel with File 07 once File 02 is complete)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In modern web API engineering with FastAPI, `deps.py` serves as the **Request-Scoped Dependency Hub & Resource Lifecycle Manager**. It is the official architectural location where reusable dependencies (such as database sessions, authentication credentials, and permission checkers) are defined and injected into HTTP route handlers.

### Standard Industry Role & Real-World Use Cases
In professional production FastAPI architectures, `deps.py` is standardly responsible for four core infrastructure capabilities:

1. **The Universal Database Session Injector (`get_db`):**
   * Standardly provides the per-request database loan mechanism.
   * Uses a Python generator (`yield`) wrapped in a `try ... finally: db.close()` structure to guarantee that an isolated database session is instantiated when an HTTP request arrives, loaned to the endpoint, and unconditionally closed the moment the response is returned to the client.
2. **The Authentication & User Identity Provider (Future Milestones):**
   * In modern web architectures, `deps.py` is the standard home for security dependencies (such as `get_current_user`, `get_current_active_student`, and `verify_admin_role`).
   * Route handlers declare `current_user = Depends(get_current_user)` to enforce authentication automatically.
3. **Inversion of Control (IoC) & Test Mocking Anchor:**
   * Standardly decouples route handler business logic from physical infrastructure instantiation.
   * During automated testing, Pytest suites use FastAPI's standard dependency override feature:
     `app.dependency_overrides[get_db] = get_test_db`
     instantly substituting a fast in-memory SQLite database or a mock session without modifying a single line of endpoint code.
4. **Guaranteed Connection Leak Immunity:**
   * Eliminates developer error: individual developers writing route handlers never have to remember to open or close database connections. The dependency injection system manages the entire resource lifecycle automatically.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our campus complaint automation platform, our 5-student engineering team specifically uses `deps.py` for four concrete operational functions:

1. **Per-Request Database Loans for Student Complaint Endpoints (`get_db`):**
   * Whenever a student submits a complaint via `POST /api/v1/tickets` or an administrator reviews open grievances via `GET /api/v1/tickets`, FastAPI calls `get_db()`.
   * It creates an isolated session from `SessionLocal()`, hands it to the route handler, and closes it immediately after the HTTP response is returned.
2. **Preventing SQLite Database File Locking on Developer Laptops:**
   * SQLite is a lightweight, single-file database that locks the `.db` file whenever connections or transactions remain dangling.
   * By wrapping the session lifecycle in a generator with `try ... finally: db.close()`, we guarantee that no session is ever left open or abandoned—even if an endpoint crashes, an invalid ticket payload is rejected with an HTTP 422 error, or an unexpected exception occurs.
3. **Decoupling Our 5-Student Team's Route Handlers from Infrastructure Logic:**
   * Team members writing route handlers in Module M2 and M3 don't need to know how the SQLite engine was created or configured.
   * They simply declare `db: Session = Depends(get_db)` in their endpoint parameters, getting an active, pre-configured session automatically.
4. **Enabling Automated Test Overrides in Pytest:**
   * Allows our automated test suite in `backend/tests/` to swap out the production SQLite database with a temporary in-memory database using `app.dependency_overrides[get_db] = get_test_db`, executing tests at lightning speed without modifying application code.

### How Other Components Standardly Interact with This File
Across the API layer, every router interacts with `deps.py` through standard FastAPI dependency injection syntax:
* **All API Route Handlers:** Every endpoint requiring database access declares:
  `from app.api.deps import get_db`
  `@router.get("/tickets")`
  `def list_tickets(db: Session = Depends(get_db)): ...`
* **FastAPI Dependency Runner:** When a web request hits the endpoint, FastAPI's internal dependency runner invokes `get_db()`, advances the generator to `yield`, hands the session into the `db` parameter, and resumes the generator after the response is sent to execute `finally: db.close()`.

### The Core Problem It Solves & Why It Exists
* **The "Forgotten Close" Connection Leak:** If route handlers manually opened sessions, exiting early due to validation errors (HTTP 400) would skip `db.close()`, causing connection leaks that lock SQLite. The generator pattern guarantees closure 100% of the time.
* **Shared Session Concurrency Disasters:** Sharing a single global session across requests causes multi-threaded transaction cross-contamination. Per-request generators guarantee total user isolation.
* **Tight Architectural Coupling:** Hardcoding database calls inside endpoints prevents mock testing. Dependency injection enforces clean Inversion of Control.

---

# 2. What Must Be in This File & Why Each Item Is Needed

To be complete, this component must define, configure, and export the following three essential items:

---

### Item 1: The Per-Request Session Generator (`get_db`)
* **What it is:** A Python generator function that calls `SessionLocal()` to instantiate a fresh database session when an HTTP request enters the backend.
* **Why it is needed:**
  * **Strict Request Isolation:** Guarantees that every request operates in its own private memory workspace, preventing race conditions and cross-user data bleeding.
  * **Memory Conservation:** Sessions are created only when a route explicitly requires database access, ensuring lightweight memory consumption for routes that only serve static files or health checks.

---

### Item 2: The Session Loan Mechanism (`yield db`)
* **What it is:** Using the Python `yield` keyword to temporarily suspend the generator and pass the active database session into the requesting route handler.
* **Why it is needed:**
  * **Execution Suspension:** Unlike `return` (which terminates a function permanently), `yield` pauses the function mid-execution, keeping its local variables (including the active `db` session) alive in memory while FastAPI executes the route handler.
  * **Context Preservation:** Allows the generator to remain alive in the background while the endpoint runs its queries, and then resume execution after the endpoint completes.

---

### Item 3: Guaranteed Post-Request Session Teardown (`finally: db.close()`)
* **What it is:** An unconditional session closure instruction placed inside a `finally` block following the `yield` statement.
* **Why it is needed:**
  * **The Python `finally` Guarantee:** In Python's language grammar, a `finally` block is guaranteed to execute when the calling context exits, regardless of whether the caller succeeded, raised an `HTTPException`, or crashed with an unexpected error.
  * **Releasing OS Handles:** Executes `db.close()`, rolling back any uncommitted changes, clearing the session's Identity Map, and returning the file handle to the operating system pool, completely eliminating SQLite file locks.

---

# 3. Component Life-Cycle: Input, Process, Output

| Stage | What Happens Behind the Scenes |
| :--- | :--- |
| **INPUT** | An incoming HTTP request triggers a route handler declaring `db: Session = Depends(get_db)`. |
| **PROCESS** | 1. FastAPI calls the `get_db` generator.<br>2. `get_db` opens a session: `db = SessionLocal()`.<br>3. `yield db` pauses `get_db` and injects `db` into the route handler.<br>4. The route handler executes queries, commits changes, and returns an HTTP response.<br>5. FastAPI resumes `get_db` right after `yield`.<br>6. The `finally:` block executes: `db.close()` releases the database connection. |
| **OUTPUT** | An exported `get_db` dependency generator providing leak-free, isolated database access for every current and future API endpoint in the platform. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. What Must Stay Exact

### 🟢 Safe to Modify & Customize (Your Team's Creative Freedom):
* **Adding Future API Dependencies:** `backend/app/api/deps.py` is the official architectural home for all FastAPI dependencies. In future milestones, you can add extra dependency functions here (e.g., `get_current_user`, `get_current_active_admin`, or `verify_api_key`) without altering `get_db`.
* **Diagnostic Execution Logging:** You can add diagnostic logging before `yield` (logging session creation and request ID) and inside `finally` (logging session teardown and transaction duration).

### 🔴 Strict Non-Negotiables (Must Remain Exact Across the Team):
* **The Function Identifier (`get_db`):** Do NOT rename `get_db` to `get_session` or `db_conn`. All route handlers across Module M2, Module M3, and verification test suites explicitly write `db: Session = Depends(get_db)`. Renaming this function breaks every route handler in the application.
* **The Generator Pattern with `yield`:** Must use `yield db` inside a `try ... finally: db.close()` structure. Changing `yield` to a standard `return` prevents the cleanup code from running, causing catastrophic connection leaks that lock the database file.
* **The File Location (`backend/app/api/deps.py`):** All API router modules import dependencies directly from `app.api.deps`.

---

# 5. Architectural & Theoretical References

This specification operates strictly as an **implementation and integration blueprint**. For the exhaustive computer science fundamentals, language runtime mechanics, and protocol specifications governing this component, consult the following authoritative manuals in the **Developer Guide Suite**:

* [**Guide 05: SQLAlchemy 2.0 ORM & Relational Architecture**](../../../developer_guide/05_SQLALCHEMY_ORM_AND_DATA_LAYER.md)  
  Unit of Work transaction management (`db.commit()`, `db.rollback()`), query execution, and entity hydration.

* [**Guide 02: FastAPI & Modern ASGI Web Architecture**](../../../developer_guide/02_FASTAPI_ASGI_WEB_ARCHITECTURE.md)  
  Service layer decoupling, dependency injection wiring, and custom exception hierarchies.

* [**Unit 03B: SQL Relational Language & Query Mechanics**](../../../developer_guide/03B_SQL_RELATIONAL_LANGUAGE_AND_QUERY_MECHANICS.md)  
  Atomic transaction isolation, ACID guarantees, and declarative relational queries.

---

# 6. Definition of Done: How to Verify This File Is Complete

This component is 100% complete and verified when:

1. **File Existence:**
   * The Python module exists precisely at `backend/app/api/deps.py`.
2. **Generator Definition:**
   * `get_db()` is declared with the return type annotation `Generator[Session, None, None]`.
   * A fresh session is instantiated from `SessionLocal()`.
   * The session is yielded inside a `try:` block.
   * `db.close()` is unconditionally executed inside a `finally:` block.
3. **Programmatic Verification:**
   * In an isolated terminal session, stepping through the generator:
     * Calling `gen = get_db()` produces a valid Python generator object.
     * Calling `db = next(gen)` produces an active, open SQLAlchemy `Session` instance.
     * Calling `next(gen, None)` advances the generator, triggering `finally: db.close()` without raising exceptions.
