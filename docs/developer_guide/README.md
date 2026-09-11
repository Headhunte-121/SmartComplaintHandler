# SmartComplaintHandler: System Engineering & Architecture Guide

This directory contains the authoritative technical documentation, architectural rationales, language runtime deep-dives, and implementation walkthroughs for the **Automated Smart Complaint Routing & Workflow Automation Platform**.

Rather than siloing responsibilities, this guide is written under a core engineering principle:
> **Full-Stack Proficiency:** Every developer on the team should understand and be capable of writing, maintaining, and debugging every layer of the system — from low-level SQLite write-ahead log concurrency and Python ASGI event loops to React virtual DOM reconciliation, deterministic algorithms, and Git release workflows.

---

## 1. Documentation Map & Engineering Reference Guides

The documentation is organized into 7 modular technical deep-dives covering each operational phase of the system:

| Guide | Title | Key Architectural Concepts & Language Mechanics |
| :--- | :--- | :--- |
| [**`00_FULL_STACK_ARCHITECTURE_AND_LANGUAGES.md`**](00_FULL_STACK_ARCHITECTURE_AND_LANGUAGES.md) | **System Foundations & Language Mechanics** | HTTP wire protocol, REST semantics, ASGI vs. WSGI, Python `asyncio` event loop, JavaScript Promises, V8 engine event loop, and Client-Server DTO contracts. |
| [**`01_DATABASE_ENGINE_AND_SHELL.md`**](01_DATABASE_ENGINE_AND_SHELL.md) | **Database Architecture & Full-Stack Shell** | SQLite WAL (Write-Ahead Log) mode, SQLAlchemy 2.0 ORM, Python generators (`yield get_db`), FastAPI lifespan context managers, Vite reverse proxy, and React Router v6 SPA routing. |
| [**`02_INGESTION_AND_KEYWORD_ROUTING.md`**](02_INGESTION_AND_KEYWORD_ROUTING.md) | **Ticket Ingestion & Keyword Taxonomy** | Pydantic v2 Rust core validation, collision-resistant tracking code generation, regex word-boundary keyword taxonomy routing, transactional units of work, and React controlled forms. |
| [**`03_DETERMINISTIC_TRIAGE_AND_PRIORITY.md`**](03_DETERMINISTIC_TRIAGE_AND_PRIORITY.md) | **Deterministic Triage & Priority Engine** | ITIL 2D Severity-Impact Cartesian matrix, emergency keyword regex amplifiers, real-time debounced API calls in React, and semantic design tokens. |
| [**`04_WORKLOAD_DISPATCH_AND_BALANCING.md`**](04_WORKLOAD_DISPATCH_AND_BALANCING.md) | **Workload Dispatch & Queue Balancing** | Multi-server queue balancing theory ($M/M/c$), greedy lowest-load dispatch heuristic, race conditions, atomic database counter updates, and admin capacity grids. |
| [**`05_SLA_AND_LIFECYCLE_AUTOMATA.md`**](05_SLA_AND_LIFECYCLE_AUTOMATA.md) | **SLA Timers & Finite State Automata** | Finite State Machine (FSM) theory, state transition graphs, transition guards, Python `timedelta` deadline math, and memory-leak-free React countdown timer cleanup hooks. |
| [**`06_TESTING_AND_GIT_DELIVERY.md`**](06_TESTING_AND_GIT_DELIVERY.md) | **Automated Testing & Git Delivery** | Pytest `TestClient` integration suites, closed-loop E2E smoke tests, Git branching strategies, and interactive 3-way merge conflict resolution in VS Code. |

---

## 2. The Language & Runtime Mental Model

Understanding *how the underlying languages execute* is critical for writing performant, bug-free code:

### Python 3.10+ (Backend Runtime)
* **The ASGI Event Loop:** FastAPI runs on `uvicorn` using Python's `asyncio` event loop. Asynchronous endpoints (`async def`) run directly on the event loop; synchronous endpoints (`def`) are offloaded to an internal worker thread pool (`anyio.to_thread.run_sync`) so slow file or database I/O never blocks incoming HTTP connections.
* **Type Annotations & Pydantic Core:** Modern Python type hints (`str | None`, `list[int]`) are analyzed at runtime by Pydantic v2's Rust core (`pydantic-core`) to serialize and validate JSON payloads with zero Python interpreter overhead.
* **The Generator Pattern (`yield`):** Used in database session injection to guarantee that every HTTP request receives an isolated database session that automatically closes and returns its connection to the pool when the request concludes.
* **Decorators:** Functions that take another function as an argument and extend its behavior (e.g., `@app.get()`, `@event.listens_for()`, `@asynccontextmanager`).

### JavaScript (ES2022) & React 18 (Frontend Runtime)
* **Single-Threaded Event Loop (V8):** JavaScript runs on a single thread with a call stack, a Microtask queue (Promises, `async/await`), and a Macrotask queue (`setTimeout`, `setInterval`, I/O events).
* **Virtual DOM & Fiber Reconciliation:** React maintains a lightweight in-memory tree of UI nodes. When state changes (`setState`), React computes the minimal diff against the previous Fiber tree and applies only the required updates to the browser's real DOM.
* **React Hooks & Closures:** Hooks (`useState`, `useEffect`, `useCallback`) rely on JavaScript function closures. Values from render $N$ are captured in closures, necessitating proper dependency array (`[deps]`) declarations to avoid stale state.
* **Component Lifecycle & Cleanup:** Effects that spawn timers or network subscriptions must return a cleanup function (`return () => clearInterval(...)`) to prevent background memory leaks on unmount.

### SQLite 3 & SQLAlchemy (Database Runtime)
* **ACID Transactions:** SQLite provides Atomicity, Consistency, Isolation, and Durability.
* **Write-Ahead Logging (WAL Mode):** Replaces the traditional rollback journal. Readers read committed snapshots from the database file without taking shared locks, while writers append changes to a `-wal` file. Readers never block writers, and writers never block readers.
* **Unit of Work Pattern:** SQLAlchemy's `Session` tracks changes to ORM model instances in an identity map. When `session.commit()` is called, SQLAlchemy flushes all accumulated inserts, updates, and deletes in a single SQL transaction.

---

## 3. How to Use These Guides During Development

1. **Before coding a feature:** Read the corresponding guide to understand the underlying theory, data structures, and language mechanics.
2. **While coding:** Follow the step-by-step implementation walkthroughs, verifying that your code respects the architectural boundaries (e.g. DTO schemas vs. ORM entities).
3. **When encountering bugs:** Consult the *Failure Modes & Edge Cases* section of each guide for the top pitfalls and exact diagnostic steps.
4. **Before committing:** Run the automated closed-loop test suite (`pytest backend/tests/test_closed_loop.py`) to ensure zero regressions across the platform.
