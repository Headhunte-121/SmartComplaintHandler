# Guide 01: Python 3.10+ — Language Mechanics & Runtime Architecture

This guide is the authoritative, foundational reference on the Python runtime, language mechanics, memory model, and execution architecture for the **Automated Smart Complaint Routing & Workflow Automation Platform**.

Rather than presenting surface-level tutorials, this manual is designed to build deep engineering mastery: explaining **what** each language construct is, **why** it behaves the way it does, **how** the CPython interpreter executes it under the hood, and **how** it is applied in production.

Every topic is broken into:
1. **Core Language Construct (What we use in this project)**
2. **+2 Advanced Related Concepts (Deeper engineering mechanics & edge cases)**
3. **Execution Model & Memory Architecture (How it works under the hood)**
4. **Focused Syntax & Usage Examples**
5. **Common Traps, Failure Modes & Debugging**

---

## 1. The CPython Execution Model & Runtime Lifecycle

### 1.1 What We Use in This Project
Python is not purely interpreted or purely compiled; it is a **bytecode-compiled, virtual machine-evaluated language**. When you run our FastAPI server (`uvicorn app.main:app`), Python does not execute text source code directly.

```
Source Code (.py)
       │
       ▼ [1. Lexical Analysis & Tokenization]
Token Stream
       │
       ▼ [2. Parsing & AST Generation]
Abstract Syntax Tree (AST)
       │
       ▼ [3. Bytecode Compilation]
Python Bytecode (.pyc / __pycache__)
       │
       ▼ [4. CPython Virtual Machine Execution]
Evaluation Loop (CEval.c) ──▶ Native OS System Calls (CPU, Memory, Disk, Sockets)
```

1. **Lexical Analysis (Tokenizing):** The interpreter reads characters and converts them into tokens (`NAME`, `NUMBER`, `STRING`, `NEWLINE`, `INDENT`).
2. **Parsing (AST Generation):** Tokens are arranged into an **Abstract Syntax Tree (AST)** representing the hierarchical grammar of the code.
3. **Bytecode Compilation:** The AST is compiled into linear, low-level instructions called **Bytecode** (`LOAD_FAST`, `STORE_NAME`, `CALL_FUNCTION`). This bytecode is cached in `.pyc` files inside `__pycache__/` to eliminate compilation overhead on subsequent runs.
4. **CPython Virtual Machine:** The CPython VM evaluates the bytecode instructions sequentially inside an infinite loop written in C (`ceval.c`).

---

### 1.2 +2 Advanced Concepts: Bytecode Disassembly & Alternative Runtimes

#### Concept A: Bytecode Disassembly (`dis` Module)
To understand what Python is actually executing at the machine level, the standard library provides the `dis` (disassembler) module.

```python
# Conceptual Example: Inspecting CPython Bytecode
import dis

def calculate_urgency(base_score: int, is_emergency: bool) -> int:
    if is_emergency:
        return base_score * 2
    return base_score

# Disassemble the function into CPython VM opcodes
dis.dis(calculate_urgency)
```

Output of disassembly:
```text
  2           0 LOAD_FAST                1 (is_emergency)
              2 POP_JUMP_IF_FALSE        5 (to 10)

  3           4 LOAD_FAST                0 (base_score)
              6 LOAD_CONST               1 (2)
              8 BINARY_MULTIPLY
             10 RETURN_VALUE

  4     >>   12 LOAD_FAST                0 (base_score)
             14 RETURN_VALUE
```
* **`LOAD_FAST`:** Pushes a local variable onto the execution evaluation stack.
* **`POP_JUMP_IF_FALSE`:** Evaluates the top-of-stack boolean; jumps program counter if false.
* **`BINARY_MULTIPLY`:** Pops two values, multiplies them, and pushes the result.
* **`RETURN_VALUE`:** Pops the top-of-stack and passes it back to the caller.

#### Concept B: CPython vs. PyPy vs. MicroPython
* **CPython (Reference Implementation):** Written in C. It is the gold standard used in our project because of 100% C-extension compatibility with libraries like `pydantic-core`, `psycopg2`, and `numpy`.
* **PyPy (JIT-Compiled Runtime):** Uses a Just-In-Time compiler. It monitors loop execution and translates hot bytecode directly into native x86/ARM assembly at runtime, achieving 4x–7x speedups for pure mathematical Python code, but often suffers from C-extension compatibility friction.
* **MicroPython:** A stripped-down Python 3 implementation designed for microcontrollers with a few kilobytes of RAM (relevant for V3 IoT campus sensors).

---

## 2. Memory Management, References & Garbage Collection

### 2.1 What We Use in This Project: Variables are Pointers
In Python, **variables are not memory buckets that hold values; variables are named pointers that reference objects in the heap**.

```
Python Assignment:
x = [1, 2, 3]
y = x

Stack (Names/Pointers)                 Heap (Actual Object in Memory)
┌───────────┐                         ┌─────────────────────────────┐
│     x     │ ───────────────────────▶│ Type: list                  │
└───────────┘                         │ RefCount: 2                 │
┌───────────┐                         │ Value: [1, 2, 3]            │
│     y     │ ───────────────────────▶│ Address: 0x7fa2b048         │
└───────────┘                         └─────────────────────────────┘
```

Because `x` and `y` point to the exact same memory address, mutating `y.append(4)` modifies `x` as well!

#### Mutability vs. Immutability
* **Immutable Types:** `int`, `float`, `str`, `tuple`, `frozenset`, `bytes`. Once created in memory, their values **cannot be altered**. Any "modification" creates an entirely new object in memory.
* **Mutable Types:** `list`, `dict`, `set`, custom class instances. Their internal contents can be mutated in-place without altering their memory address.

---

### 2.2 +2 Advanced Concepts: Reference Counting & Cyclical Garbage Collection

Python uses a **two-tiered memory management system**:

#### Concept A: Reference Counting (Primary Real-Time Mechanism)
Every Python object header contains a C-level integer named `ob_refcnt`.
* When an object is assigned to a variable, passed to a function, or placed in a list, its `ob_refcnt` increments by 1.
* When a variable goes out of scope, is reassigned, or deleted (`del`), its `ob_refcnt` decrements by 1.
* **The instant `ob_refcnt == 0`**, the memory is immediately deallocated and returned to the allocator. There is zero pause or latency!

```python
import sys

ticket_code = "TKT-2026-001"
# sys.getrefcount increments reference temporarily while inspecting
print(sys.getrefcount(ticket_code))  # Outputs: 2 (variable + argument to getrefcount)

alias = ticket_code
print(sys.getrefcount(ticket_code))  # Outputs: 3

del alias
print(sys.getrefcount(ticket_code))  # Outputs: 2
```

#### Concept B: Cyclical Garbage Collector (`gc` Module)
Reference counting has one fatal flaw: **Cyclic References**.
If Object A points to Object B, and Object B points back to Object A, their reference counts can never drop to 0, even if the program deletes all external references to them!

```
Cyclic Reference Memory Leak:
┌──────────────┐                  ┌──────────────┐
│   Object A   │ ───────────────▶ │   Object B   │
│ (refcnt: 1)  │ ◀─────────────── │ (refcnt: 1)  │
└──────────────┘                  └──────────────┘
       ▲
       │ [External reference deleted!]
       ❌ No external variables point here, but refcnt never hits 0!
```

To prevent memory leaks from cycles (common in bi-directional ORM relationships like `ticket.department` and `department.tickets`), Python runs an auxiliary **Cyclical Generational Garbage Collector**:
* **Generation 0 (Youngest):** Newly created objects. Scanned very frequently.
* **Generation 1 (Intermediate):** Objects that survived one Gen 0 collection.
* **Generation 2 (Oldest):** Long-lived objects (modules, singletons). Scanned rarely.
* The GC detects cycles by temporarily subtracting references from within the group; if an isolated cluster has zero external pointers, the entire cycle is purged.

---

## 3. The Global Interpreter Lock (GIL) & Concurrency Primitives

### 3.1 What We Use in This Project
FastAPI utilizes asynchronous co-routines for network handling and offloads blocking synchronous database operations to worker threads. Understanding the **GIL** is essential to understanding why Python handles concurrency this way.

### What is the GIL?
The Global Interpreter Lock is a **mutual exclusion lock (mutex)** that prevents multiple native OS threads from executing CPython bytecode simultaneously on multiple CPU cores.

```
Multi-Threaded Python on a 4-Core CPU:
Core 1: [ Thread 1 executing Python Bytecode (Holds GIL) ]
Core 2: [ Thread 2 BLOCKED waiting for GIL               ]
Core 3: [ Thread 3 BLOCKED waiting for GIL               ]
Core 4: [ Thread 4 BLOCKED waiting for GIL               ]
```

### Why Does the GIL Exist?
CPython's memory management relies heavily on reference counts (`ob_refcnt`). Without a lock, two threads running on different CPU cores could increment/decrement reference counts simultaneously, leading to race conditions, memory corruption, and segmentation faults.

### The Critical Rule of GIL Release:
**The GIL is released during I/O operations!**
Whenever a thread executes:
* Database queries (waiting for disk/socket)
* Reading/writing local files
* Network HTTP calls
* Sleep statements (`time.sleep()`)

CPython drops the GIL! This allows other threads to run freely while the first thread waits for I/O. Therefore, **Python multi-threading is highly effective for I/O-bound web applications (like our platform)**, but ineffective for CPU-bound computation (e.g. video rendering or raw number crunching).

---

### 3.2 +2 Advanced Concepts: `sys.getswitchinterval()` & Multiprocessing

#### Concept A: Thread Switching Intervals
In pure Python computation, threads do not starve forever. CPython forces the active thread to release the GIL every 5 milliseconds (the default switch interval).
```python
import sys
# Returns the GIL check interval in seconds (default is 0.005 seconds = 5ms)
interval = sys.getswitchinterval()
```

#### Concept B: Multiprocessing vs. Multi-Threading vs. AsyncIO
To achieve true multi-core parallel CPU execution in Python, you bypass the GIL using **Multiprocessing**:

| Concurrency Model | Mechanism | Number of Processes | Memory Sharing | Best Used For |
| :--- | :--- | :--- | :--- | :--- |
| **AsyncIO (`async/await`)** | Cooperative Single Thread | 1 OS Process | Fully shared (same thread) | High-concurrency I/O, WebSockets, HTTP APIs |
| **Multi-Threading (`threading`)** | Preemptive OS Threads | 1 OS Process | Shared heap memory | Blocking I/O, database queries, file transfers |
| **Multi-Processing (`multiprocessing`)** | Multiple OS Processes | $N$ Processes (1 per core) | Isolated memory (IPC required) | Heavy CPU tasks, image processing, machine learning |

In our deployment launcher (`uvicorn app.main:app --workers 4`), Uvicorn uses **multiprocessing** to spawn 4 independent Python processes, each with its own GIL and its own AsyncIO event loop, fully utilizing a 4-core processor!

---

## 4. Modern Type System & Static Analysis (PEP 484, 585, 604)

### 4.1 What We Use in This Project
Python 3.10 introduced modern, expressive typing syntax that completely eliminates verbose imports like `typing.Union` and `typing.Optional`.

#### The New Union Syntax (PEP 604)
Instead of importing `Union` and `Optional`:
```python
# Legacy Syntax (Python 3.8 and below)
from typing import Optional, Union, List

def find_ticket(code: str) -> Optional[dict]: ...
def process_id(identifier: Union[int, str]) -> None: ...
def get_tags() -> List[str]: ...

# Modern Python 3.10+ Syntax (Used throughout our project)
def find_ticket(code: str) -> dict | None: ...
def process_id(identifier: int | str) -> None: ...
def get_tags() -> list[str]: ...  # Built-in collections are generic (PEP 585)
```

#### Why Typing Matters in Our Stack:
1. **Pydantic Validation:** Pydantic inspects type hints at startup via reflection (`__annotations__`) to generate JSON validation logic.
2. **FastAPI Route Documentation:** Type hints automatically populate Swagger UI parameters and response models.
3. **Static Bug Prevention:** IDEs (Pylance/VS Code) catch `AttributeError` bugs (e.g. calling `.upper()` on a variable that could be `None`) before you even execute the script.

---

### 4.2 +2 Advanced Concepts: Generics (`TypeVar`) & Structural Typing (`Protocol`)

#### Concept A: Generics with `TypeVar`
When writing reusable utility functions or base services where the return type matches the input type:

```python
from typing import TypeVar, Sequence

# Declare a generic type variable bounded to any type
T = TypeVar('T')

def get_first_element(items: Sequence[T]) -> T | None:
    """Returns the first element of any sequence while preserving its exact type."""
    return items[0] if items else None

# Pylance knows num is 'int' and name is 'str'
num: int | None = get_first_element([10, 20, 30])
name: str | None = get_first_element(["Alpha", "Beta"])
```

#### Concept B: Structural Subtyping via `Protocol` (PEP 544)
Python has always been fundamentally "Duck Typed": *“If it walks like a duck and quacks like a duck, it is a duck.”*
In traditional OOP, you must explicitly inherit from an Abstract Base Class (`class Dog(Animal)`).
Using `Protocol`, Python enables **Static Duck Typing**: any class that implements the required methods automatically satisfies the type contract without explicit inheritance!

```python
from typing import Protocol

class LoggableEntity(Protocol):
    """Any object that possesses an id (int) and a tracking_code (str)."""
    id: int
    tracking_code: str

def print_audit_entry(entity: LoggableEntity) -> None:
    print(f"[AUDIT] ID: {entity.id} | Code: {entity.tracking_code}")

# Both Ticket and ArchivedTicket satisfy LoggableEntity without shared inheritance!
```

---

## 5. Object-Oriented Architecture, Metaclasses & Dunder Methods

### 5.1 What We Use in This Project
SQLAlchemy ORM models and Pydantic schemas are built on Python's object-oriented foundation.

#### Class Attributes vs. Instance Attributes
A critical distinction that confuses beginners in SQLAlchemy:
```python
class Ticket:
    # CLASS ATTRIBUTE: Shared across all instances. Stored in Ticket.__dict__
    # In SQLAlchemy, this defines the database column schema metadata!
    status: str = "OPEN"

    def __init__(self, tracking_code: str):
        # INSTANCE ATTRIBUTE: Unique to this specific object. Stored in self.__dict__
        self.tracking_code = tracking_code
```

---

### 5.2 +2 Advanced Concepts: Essential Dunder Methods & Metaclass Hooks

#### Concept A: The Core Magic (Dunder) Methods
Dunder ("Double Underscore") methods allow custom Python classes to integrate seamlessly with native Python language operators:

| Dunder Method | Triggering Operator / Function | Architectural Purpose |
| :--- | :--- | :--- |
| `__repr__(self)` | `repr(obj)` or terminal output | Developer-friendly debugging representation |
| `__str__(self)` | `str(obj)` or `print(obj)` | Human-readable presentation string |
| `__eq__(self, other)` | `obj1 == obj2` | Custom equality logic (e.g. comparing tickets by tracking code) |
| `__hash__(self)` | `hash(obj)`, dictionary keys, sets | Allows objects to be used as dictionary keys or in sets |
| `__call__(self, ...)` | `obj(...)` (calling object like a function) | Turns class instances into callable functions |

```python
class TrackingCode:
    def __init__(self, code: str):
        self.code = code.upper().strip()

    def __repr__(self) -> str:
        return f"TrackingCode(code='{self.code}')"

    def __eq__(self, other: object) -> bool:
        if isinstance(other, TrackingCode):
            return self.code == other.code
        if isinstance(other, str):
            return self.code == other.upper().strip()
        return False

    def __hash__(self) -> int:
        return hash(self.code)
```

#### Concept B: Class Construction Hooks (`__init_subclass__`)
How do frameworks like SQLAlchemy and Pydantic detect when you inherit from `Base` or `BaseModel`?
Instead of complex metaclasses, Python 3.6+ provides `__init_subclass__`. It executes automatically whenever a class is subclassed:

```python
class SchemaRegistry:
    registered_models = {}

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        # Automatically register any child class in a global schema registry
        cls.registered_models[cls.__name__] = cls

class ComplaintSchema(SchemaRegistry):
    pass

print(SchemaRegistry.registered_models)  # {'ComplaintSchema': <class '__main__.ComplaintSchema'>}
```

---

## 6. Generators, Iterators & The Generator Dependency Pattern

### 6.1 What We Use in This Project: `yield` in FastAPI
In [`backend/app/api/deps.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/backend/app/api/deps.py), our database session dependency uses Python's `yield` keyword:

```python
def get_db():
    db = SessionLocal()
    try:
        yield db  # Pauses execution and provides the session to the route handler
    finally:
        db.close()  # Resumes execution after the HTTP response and closes the connection
```

### How Does a Generator Work Under the Hood?
A standard function executes from top to bottom and terminates when reaching `return`. Its stack frame is destroyed.
A **Generator Function** (any function containing `yield`):
1. Returns a generator object without executing the body immediately.
2. When `next()` is called, execution advances until hitting `yield`.
3. **Execution is frozen in place:** Local variables, instruction pointer, and exception handlers remain preserved in memory.
4. When `next()` is called again, execution resumes immediately after the `yield` statement.

---

### 6.2 +2 Advanced Concepts: Memory-Efficient Streaming & Two-Way Coroutines

#### Concept A: Lazy Evaluation for Massive Datasets
Never load 50,000 database rows into a single in-memory Python list `[row for row in query]`. If each row is 2KB, you allocate 100MB of RAM instantly.
Using a generator streams records **one item at a time**, keeping memory consumption constant at $O(1)$:

```python
def stream_large_log_file(filepath: str):
    """Streams lines one-by-one with near-zero memory consumption."""
    with open(filepath, "r", encoding="utf-8") as file:
        for line in file:
            yield line.strip()
```

#### Concept B: Bidirectional Generators (`send()` and `throw()`)
Generators can receive values from the outside world while paused:

```python
def running_average():
    total = 0.0
    count = 0
    average = None
    while True:
        # yield produces 'average', and pauses waiting for new input via .send()
        val = yield average
        if val is None:
            break
        total += val
        count += 1
        average = total / count

calc = running_average()
next(calc)  # Prime the generator to the first yield
print(calc.send(10))  # 10.0
print(calc.send(20))  # 15.0
print(calc.send(30))  # 20.0
```

---

## 7. Decorators, Closures & Metaprogramming

### 7.1 What We Use in This Project
Decorators are everywhere in our codebase:
* `@router.get("/tickets")`
* `@asynccontextmanager`
* `@event.listens_for(engine, "connect")`

### What is a Decorator?
A decorator is simply **a higher-order function that takes a function as an argument and returns an enhanced replacement function**.

```python
# The '@' syntax is pure syntactic sugar:
@my_decorator
def my_function():
    pass

# Is mathematically identical to:
my_function = my_decorator(my_function)
```

---

### 7.2 +2 Advanced Concepts: Parameterized Decorators & `functools.wraps`

#### Concept A: Preserving Function Identity (`functools.wraps`)
When you wrap a function, the wrapper replaces the original function. Without `functools.wraps`, the original function's `__name__`, `__doc__`, and parameter signatures are erased, breaking FastAPI's ability to inspect route arguments!

```python
import functools
import time
from typing import Callable, Any

def audit_log(action_name: str) -> Callable:
    """A parameterized decorator that records execution time and action metadata."""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)  # CRITICAL: Copies __name__, __doc__, and annotations
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            start_time = time.perf_counter()
            print(f"[*] Starting action: '{action_name}' on function '{func.__name__}'")
            try:
                result = func(*args, **kwargs)
                duration = time.perf_counter() - start_time
                print(f"[+] Completed '{action_name}' in {duration:.4f}s")
                return result
            except Exception as exc:
                print(f"[!] Action '{action_name}' failed with error: {exc}")
                raise exc
        return wrapper
    return decorator

@audit_log("DISPATCH_TICKET")
def assign_ticket(ticket_id: int, squad_id: int):
    """Assigns ticket to designated maintenance squad."""
    return f"Ticket {ticket_id} assigned to squad {squad_id}."

# Inspecting function name preserves the original identity:
print(assign_ticket.__name__)  # Outputs: 'assign_ticket' (NOT 'wrapper'!)
```

#### Concept B: Class Decorators
Decorators can also decorate entire classes:
```python
def singleton(cls):
    """Guarantees only one instance of a class ever exists."""
    instances = {}
    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]
    return get_instance
```

---

## 8. Context Managers & The Resource Acquisition Lifecycle

### 8.1 What We Use in This Project
Handling open file handles, database connections, and network sockets requires strict resource acquisition and release patterns (`with` blocks).

```python
# Guaranteed cleanup: The file is closed even if an unhandled exception occurs inside!
with open("smart_complaints.log", "a") as f:
    f.write("System online.\n")
```

---

### 8.2 +2 Advanced Concepts: Class-Based Context Managers & `contextlib.ExitStack`

#### Concept A: Implementing the Context Manager Protocol
Any class implementing `__enter__` and `__exit__` becomes a context manager:

```python
class DatabaseTransactionScope:
    def __init__(self, session):
        self.session = session

    def __enter__(self):
        # Setup phase: begins transaction
        print("[*] Transaction started.")
        return self.session

    def __exit__(self, exc_type, exc_val, exc_tb):
        # Teardown phase: handles commit or rollback
        if exc_type is not None:
            # An exception occurred! Roll back changes
            print(f"[!] Rolling back due to: {exc_val}")
            self.session.rollback()
            # Returning False allows the exception to propagate outwards
            return False
        else:
            print("[+] Committing transaction.")
            self.session.commit()
            return True
```

#### Concept B: Dynamic Multi-Resource Management with `ExitStack`
When you need to dynamically open an unknown number of resources (e.g. opening 5 database files simultaneously), nesting 5 `with` statements is unmaintainable. `contextlib.ExitStack` manages dynamic resource cleanup:

```python
from contextlib import ExitStack

def process_multiple_files(filepaths: list[str]):
    with ExitStack() as stack:
        # Dynamically opens all files and guarantees all are closed upon exit
        files = [stack.enter_context(open(fp, "r")) for fp in filepaths]
        # Perform processing across all files safely
```

---

## 9. Asynchronous Concurrency: Coroutines & The Event Loop

### 9.1 What We Use in This Project
FastAPI utilizes `async def` for non-blocking I/O and route handling.

```python
@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

### What is a Coroutine?
A coroutine is a specialized function declared with `async def`. When invoked, **it does not execute immediately**; it returns a coroutine object that must be scheduled on the event loop via `await` or `asyncio.create_task()`.

---

### 9.2 +2 Advanced Concepts: Structured Concurrency & Task Cancellation

#### Concept A: Structured Concurrency (`asyncio.TaskGroup`)
In Python 3.11+, `asyncio.TaskGroup` provides reliable concurrent task execution. If any child task raises an exception, all other active tasks in the group are automatically cancelled, preventing orphaned background tasks:

```python
import asyncio

async def fetch_department_status(dept_id: int):
    await asyncio.sleep(0.5)
    return f"Dept {dept_id}: Operational"

async def main():
    # Runs multiple concurrent tasks with guaranteed completion or cleanup
    async with asyncio.TaskGroup() as tg:
        task1 = tg.create_task(fetch_department_status(1))
        task2 = tg.create_task(fetch_department_status(2))

    print(task1.result())
    print(task2.result())
```

#### Concept B: Shielding Against Task Cancellation
When performing critical database cleanup or auditing inside an async task, user disconnection might cancel the coroutine. Using `asyncio.shield()` protects vital operations from premature cancellation:

```python
await asyncio.shield(save_audit_log_to_disk())
```

---

## 10. Exception Hierarchies & Robust Error Handling

### 10.1 What We Use in This Project
In Module 5, we define custom domain exceptions to signal invalid lifecycle operations:
```python
class InvalidStateTransitionError(Exception):
    """Raised when an illegal lifecycle transition is attempted."""
    pass
```

---

### 10.2 +2 Advanced Concepts: Explicit Exception Chaining & Exception Groups

#### Concept A: Explicit Exception Chaining (`raise ... from exc`)
When catching a low-level error (e.g. `sqlite3.IntegrityError`) and raising a high-level domain error (`DuplicateTicketCodeError`), use `from exc` to preserve the full causal stack trace for debugging:

```python
try:
    db.commit()
except Exception as exc:
    # 'from exc' sets __cause__ and prints both the original and new error in logs
    raise TicketCreationError("Failed to persist ticket record") from exc
```

#### Concept B: Exception Groups & `except*` (Python 3.11+)
When multiple concurrent asynchronous tasks crash simultaneously, Python packages them into an `ExceptionGroup`:

```python
try:
    async with asyncio.TaskGroup() as tg:
        tg.create_task(failing_task_1())
        tg.create_task(failing_task_2())
except* ValueError as eg:
    # Handles only the ValueError instances from the group
    print(f"Handled ValueErrors: {eg.exceptions}")
except* ConnectionError as eg:
    # Handles ConnectionErrors simultaneously
    print(f"Handled ConnectionErrors: {eg.exceptions}")
```

---

## 11. Module Import Mechanics, Scopes & Package Resolution

### 11.1 What We Use in This Project
Our backend is structured as a modular Python package:
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   └── database.py
```

* An `__init__.py` file (even if empty) marks a folder as an importable Python package.
* Absolute imports (`from app.core.config import settings`) resolve starting from the directory added to `sys.path`.

---

### 11.2 +2 Advanced Concepts: Circular Imports & `sys.path` Resolution

#### Concept A: The Circular Import Trap
If `models/ticket.py` imports `models/department.py`, and `models/department.py` imports `models/ticket.py`, the interpreter hits an unresolved cycle and throws:
```
ImportError: cannot import name 'Ticket' from partially initialized module
```

**Resolution Strategies:**
1. **Deferred Imports:** Move the import inside the specific function that uses it, rather than at the top of the file.
2. **String References in SQLAlchemy:** Instead of importing the class directly for relationships, pass the model name as a string:
   ```python
   # No import required at top of file! SQLAlchemy resolves 'Department' lazily:
   department = relationship("Department", back_populates="tickets")
   ```

#### Concept B: Dynamic Imports with `importlib`
To load plugins or modules dynamically at runtime by name:
```python
import importlib

module_name = "app.services.priority_engine"
module = importlib.import_module(module_name)
evaluate_fn = getattr(module, "evaluate_complaint_priority")
```

---

## 12. String Formatting, Unicode & RegEx Foundations

### 12.1 What We Use in This Project
Formatted string literals (**f-strings**) are evaluated at runtime with native C-speed:
```python
tracking_code = f"TKT-{date_str}-{random_token.upper()}"
```

---

### 12.2 +2 Advanced Concepts: Advanced f-String Specifiers & Unicode Normalization

#### Concept A: Self-Documenting f-Strings & Format Specifiers
* **Self-documenting debug syntax (`{var=}`):**
  ```python
  priority = "P1"
  print(f"{priority=}")  # Outputs: "priority='P1'"
  ```
* **Precision and Padding:**
  ```python
  hours = 4
  # Pad with leading zeros to 2 digits:
  print(f"{hours:02d}:00:00")  # "04:00:00"
  
  score = 0.92564
  # Format as percentage with 1 decimal place:
  print(f"{score:.1%}")  # "92.6%"
  ```

#### Concept B: Unicode Normalization (NFC vs. NFD)
In modern web applications, user input may contain accented characters or composite glyphs. A character like `é` can be represented in memory as:
* Single code point: `\u00e9` (NFC - Canonical Composition)
* Two code points: `e` + `\u0301` (NFD - Canonical Decomposition)

If two students search for the same room name with different Unicode representations, standard equality (`==`) fails!
```python
import unicodedata

# Always normalize incoming user text before hashing or keyword matching:
clean_text = unicodedata.normalize("NFC", raw_user_input)
```

---

## 13. Summary Checklist for Production Deployment

Before pushing Python backend code to Git or launching production:
1. **Python Version:** Verify runtime is Python 3.10+ (`python --version`).
2. **Type Annotations:** Ensure modern union syntax (`| None`) is used throughout; verify zero lint errors with Pylance.
3. **Session Lifecycle:** Ensure every database interaction uses the `yield get_db()` dependency pattern to guarantee session closure.
4. **GIL Awareness:** Never place blocking CPU or synchronous I/O loops inside an `async def` route handler.
5. **No Mutable Default Arguments:** Never write `def func(items=[])`; always use `def func(items=None): items = items or []`.
6. **Exception Causality:** Always use `raise CustomError(...) from exc` when re-wrapping exceptions to preserve debugging traces.
