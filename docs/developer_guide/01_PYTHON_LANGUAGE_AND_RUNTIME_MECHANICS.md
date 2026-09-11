# Guide 01: Python 3.10+ — From Core Fundamentals to Production Engineering

This guide is designed for developers who understand basic programming syntax (variables, basic `if` statements, and simple `for` loops) and want to master the **exact concepts, language mechanics, mental models, and patterns** required to build, understand, and deploy the **SmartComplaintHandler** platform.

Every topic is explained from first principles: **what it is**, **why we use it**, **how it works**, **a clean, relevant example**, and **the common beginner traps to avoid**.

---

## Chapter 1: The Python Environment & How Code Runs

### 1.1 What is a Virtual Environment (`venv`)?
When you install Python on your computer, it comes with a global package library. If Project A needs `fastapi==0.100.0` and Project B needs `fastapi==0.115.0`, installing them globally creates package collisions and breaks your projects.

* **What a Virtual Environment actually is:** A `venv` is **not magic** — it is literally just a self-contained directory containing:
  1. A copy (or symlink) of the Python interpreter executable.
  2. Its own private `site-packages` directory where libraries are downloaded.
  3. Activation scripts (`activate.bat` on Windows, `activate` on Linux/macOS) that temporarily update your terminal's `PATH` variable to point to this private directory.

```
SmartComplaintHandler/backend/
├── venv/
│   ├── Scripts/          <-- Python.exe, pip.exe, activate.bat
│   └── Lib/
│       └── site-packages/<-- Where fastapi, sqlalchemy, pydantic live
├── app/
└── requirements.txt
```

* **Why we use it:** It ensures that every developer on the team runs the exact same dependencies without interfering with their personal computer's global Python.

### 1.2 `pip` & Dependency Pinning with `requirements.txt`
`pip` is Python’s package installer. It connects to the official Python Package Index (PyPI), downloads wheel files (`.whl`), and unpacks them into your active environment's `site-packages`.

* **`requirements.txt`:** A plain text file listing the required libraries:
  ```text
  fastapi>=0.110.0
  uvicorn[standard]>=0.28.0
  sqlalchemy>=2.0.0
  pydantic>=2.6.0
  ```
* **Command:** `pip install -r requirements.txt` reads this file line-by-line and installs all dependencies automatically.

### 1.3 What `if __name__ == "__main__":` Actually Means
When Python runs a file, it assigns special internal variables. One of them is `__name__`.
* If you run a file directly from the terminal (`python main.py`), Python sets `__name__ = "__main__"`.
* If another file imports this file (`import main`), Python sets `__name__ = "main"`.

```python
def start_server():
    print("Server starting...")

# This block ONLY executes if you run this file directly.
# It will NOT run if another file imports this file!
if __name__ == "__main__":
    start_server()
```
* **Why it matters:** It prevents test scripts, database connections, or server startups from accidentally triggering when another file simply wants to import a helper function.

### 1.4 How Python Finds Files (Imports & `sys.path`)
When you write `from app.core.config import settings`, how does Python find `app`?
1. Python looks in the current working directory where the script was launched.
2. It searches the list of directories stored in `sys.path`.
3. It searches the standard library and `site-packages`.

* **The `__init__.py` file:** An empty file named `__init__.py` inside a folder tells Python: *"Treat this directory as an importable package."*

---

## Chapter 2: Data Structures Beyond the Basics

### 2.1 The Pointer Mental Model (Pass-by-Assignment)
In Python, **variables are not boxes that hold data; variables are sticky notes (pointers) attached to objects in memory**.

```python
# Create a list in memory. 'a' points to it.
a = [1, 2, 3]

# 'b' now points to the EXACT SAME list in memory!
b = a

b.append(4)

print(a)  # Outputs: [1, 2, 3, 4]  <-- 'a' was modified too!
```

* **Mutable vs. Immutable:**
  * **Immutable (Cannot change in-place):** `int`, `float`, `str`, `tuple`, `bool`, `None`. If you modify a string or number, Python creates a brand new object in memory.
  * **Mutable (Can change in-place):** `list`, `dict`, `set`. Modifying them changes the object for every variable pointing to it.
* **How to make a real copy:**
  ```python
  # Shallow copy (creates an independent list)
  b = a.copy()
  ```

### 2.2 Dictionaries in Depth (The Backbone of Web APIs)
A dictionary (`dict`) is a collection of key-value pairs implemented as a **Hash Table**. Looking up a key in a dictionary takes $O(1)$ constant time (instantaneous), regardless of whether the dictionary has 10 items or 10 million items.

#### Safe Access with `.get()`
Accessing a missing key with square brackets crashes your application with a `KeyError`:
```python
user_data = {"name": "Alice", "role": "Technician"}

# Dangerous: Crashes with KeyError if 'department' does not exist
# dept = user_data["department"] 

# Safe: Returns None or a custom default instead of crashing
dept = user_data.get("department", "General")
print(dept)  # Outputs: "General"
```

#### Iterating Over Dictionaries
```python
scores = {"Electrical": 4, "Plumbing": 8, "IT": 2}

# Iterate over keys and values simultaneously
for department, active_tickets in scores.items():
    print(f"{department} currently has {active_tickets} tickets.")
```

### 2.3 Tuples & Tuple Unpacking
A tuple is an immutable list declared with parentheses `(a, b)`. Because tuples cannot change, they are faster and can be used as dictionary keys.

#### Unpacking Syntax:
```python
# Functions can return multiple values as a tuple
def get_coordinates():
    return (12.9716, 77.5946)

# Unpack directly into two variables in one line
latitude, longitude = get_coordinates()
```

### 2.4 Sets (Instant Deduplication & Fast Membership)
A set is an unordered collection of unique elements. Like dictionary keys, checking `item in my_set` is $O(1)$ instantaneous, whereas checking `item in my_list` requires scanning the whole list $O(n)$.

```python
# Instantly remove duplicates from a list
raw_tags = ["leak", "pipe", "water", "leak", "pipe"]
unique_tags = set(raw_tags)
print(unique_tags)  # {'leak', 'pipe', 'water'}

# Set operations
allowed_roles = {"ADMIN", "SUPERVISOR", "TECHNICIAN"}
user_role = "STUDENT"

if user_role not in allowed_roles:
    print("Access denied.")
```

### 2.5 List & Dictionary Comprehensions
Comprehensions provide a clean, readable syntax to transform or filter data in a single line instead of writing clunky multi-line `for` loops.

```python
# Traditional Loop (5 lines)
ticket_codes = []
for t in tickets:
    if t["is_active"]:
        ticket_codes.append(t["code"].upper())

# List Comprehension (1 line, faster and cleaner)
ticket_codes = [t["code"].upper() for t in tickets if t["is_active"]]

# Dictionary Comprehension
departments = ["Electrical", "Plumbing", "IT"]
# Creates: {'Electrical': 0, 'Plumbing': 0, 'IT': 0}
initial_counts = {dept: 0 for dept in departments}
```

---

## Chapter 3: Advanced Function Mechanics

### 3.1 The Dangerous Mutable Default Argument Trap
This is one of the most infamous interview questions and real-world bugs in Python:

```python
# ❌ DANGEROUS BUG:
def add_ticket(code: str, ticket_list=[]):
    ticket_list.append(code)
    return ticket_list

print(add_ticket("TKT-001"))  # Outputs: ['TKT-001']
print(add_ticket("TKT-002"))  # Outputs: ['TKT-001', 'TKT-002'] <-- REUSED THE SAME LIST!
```
* **Why this happens:** In Python, default function arguments are created **once when the function is defined**, NOT every time the function is called! The same list is shared across every subsequent function call.
* **The Correct Pattern:**
  ```python
  # ✅ CORRECT: Use None as the default
  def add_ticket(code: str, ticket_list: list[str] | None = None) -> list[str]:
      if ticket_list is None:
          ticket_list = []
      ticket_list.append(code)
      return ticket_list
  ```

### 3.2 Flexible Arguments: `*args` and `**kwargs`
* **`*args` (Positional arguments):** Gathers extra positional arguments into a **tuple**.
* **`**kwargs` (Keyword arguments):** Gathers extra named arguments into a **dictionary**.

```python
def log_event(event_type: str, *details, **metadata):
    print(f"Event: {event_type}")
    print(f"Positional details tuple: {details}")
    print(f"Keyword metadata dictionary: {metadata}")

log_event("SLA_BREACH", "Ticket 42", "Floor 3", technician="John", priority="P1")
# details  = ('Ticket 42', 'Floor 3')
# metadata = {'technician': 'John', 'priority': 'P1'}
```

### 3.3 Lambda Functions & Sorting with `key=`
A `lambda` is a small, anonymous, one-line function: `lambda arguments: expression`.
We use lambdas heavily in Module 4 to sort maintenance squads by active ticket count:

```python
teams = [
    {"name": "Squad Alpha", "active_tickets": 4},
    {"name": "Squad Beta",  "active_tickets": 1},
    {"name": "Squad Gamma", "active_tickets": 3},
]

# Find the team with the minimum active tickets
# 'key' tells Python what attribute to compare
least_busy_team = min(teams, key=lambda t: t["active_tickets"])

print(least_busy_team["name"])  # Outputs: "Squad Beta"
```

---

## Chapter 4: Classes & Object-Oriented Programming (OOP)

### 4.1 What is a Class vs. an Object?
* **Class:** The blueprint (e.g. the architectural drawing of a house).
* **Object (Instance):** The actual built house in memory. You can build 50 houses from one blueprint.

### 4.2 The Mystery of `self`
Why do you have to write `self` as the first argument in every Python method?
* In languages like Java or C++, `this` is an invisible hidden variable.
* Python makes it explicit: `self` represents **the specific instance of the class that called the method**.

```python
class Ticket:
    def __init__(self, tracking_code: str, title: str):
        # self.tracking_code is an INSTANCE variable (unique to this ticket)
        self.tracking_code = tracking_code
        self.title = title

    def print_summary(self):
        print(f"[{self.tracking_code}] {self.title}")

# Create two independent instances
t1 = Ticket("TKT-001", "Broken fan")
t2 = Ticket("TKT-002", "Leaking pipe")

# When you call t1.print_summary(), Python secretly translates it to:
# Ticket.print_summary(t1)
t1.print_summary()
```

### 4.3 Instance Attributes vs. Class Attributes
This distinction is critical for understanding SQLAlchemy ORM models:

```python
class MaintenanceTeam:
    # CLASS ATTRIBUTE: Defined outside __init__.
    # Shared across ALL instances of MaintenanceTeam!
    # In SQLAlchemy, this defines the SQL Table Column definition!
    max_capacity = 10

    def __init__(self, name: str):
        # INSTANCE ATTRIBUTE: Defined on self.
        # Unique to this specific team!
        self.name = name
        self.active_ticket_count = 0
```

### 4.4 The `@property` Decorator (Clean Getters & Setters)
`@property` lets you call a method like a standard attribute variable without adding `()`:

```python
class Ticket:
    def __init__(self, priority: str):
        self.priority = priority

    @property
    def is_urgent(self) -> bool:
        """Computed property: access as ticket.is_urgent (no parentheses!)"""
        return self.priority in ("P1", "P2")

t = Ticket("P1")
print(t.is_urgent)  # Outputs: True (Notice: NO parentheses needed!)
```

---

## Chapter 5: Error Handling & Custom Exceptions

### 5.1 The `try...except...else...finally` Pattern
```python
try:
    # 1. Code that might fail
    file = open("tickets.json", "r")
    data = file.read()
except FileNotFoundError as err:
    # 2. Runs ONLY if a FileNotFoundError occurred
    print(f"Could not find file: {err}")
else:
    # 3. Runs ONLY if NO exceptions occurred in the try block
    print("File read successfully.")
finally:
    # 4. ALWAYS runs no matter what (even if an error occurred or return was called)
    print("Cleanup step complete.")
```

### 5.2 Creating Custom Domain Exceptions
In real-world backend applications, never raise generic `Exception("something broke")`. Create custom named exception classes that describe your business logic:

```python
# Inherit from Python's built-in Exception class
class InvalidStateTransitionError(Exception):
    """Raised when an illegal ticket lifecycle transition is attempted."""
    pass

class TicketNotFoundError(Exception):
    """Raised when a ticket code cannot be found in the database."""
    pass

# Usage in business logic:
def advance_ticket_status(current_status: str, new_status: str):
    if current_status == "CLOSED":
        raise InvalidStateTransitionError("Cannot modify a closed ticket!")
```

---

## Chapter 6: Modern Type Hinting (Python 3.10+)

### 6.1 Why We Use Type Hints
Python is dynamically typed, meaning variables can change types at runtime. However, in modern FastAPI and Pydantic, **type hints are mandatory** because FastAPI reads them to validate incoming web requests!

```python
# Primitive Types
title: str = "Pipe Leak"
age: int = 21
is_active: bool = True
rating: float = 4.85

# Collection Types (Python 3.9+ built-in syntax)
tags: list[str] = ["plumbing", "urgent"]
scores: dict[str, int] = {"Electrical": 5, "Plumbing": 2}

# Modern Union Syntax (Python 3.10+)
# Means: tracking_code can be a string OR None
tracking_code: str | None = None

# Means: identifier can be an integer OR a string
identifier: int | str = "TKT-100"
```

---

## Chapter 7: Working with Files, JSON & Date/Time

### 7.1 The `with` Statement (Context Managers)
Never open a file like `f = open(...)` without a `with` statement. If an error occurs before you call `f.close()`, the file stays locked by the operating system!

```python
# The with block guarantees the file is closed the moment the block exits
with open("log.txt", "w", encoding="utf-8") as f:
    f.write("Ticket created.\n")
```

### 7.2 JSON Parsing (`json.loads` vs. `json.dumps`)
JSON is the language of the web. Python has a built-in `json` module:
* **`json.loads(text)` (Load String):** Converts a JSON string into a Python dictionary.
* **`json.dumps(dict)` (Dump String):** Converts a Python dictionary into a JSON string.

```python
import json

# Receive JSON string from web request
raw_json = '{"title": "Broken light", "priority": "P2"}'
data_dict = json.loads(raw_json)
print(data_dict["title"])  # "Broken light" (Now a Python dict!)

# Convert Python dict back to JSON string to send over the network
outgoing_json = json.dumps(data_dict)
```

### 7.3 Date & Time Math (`datetime` and `timedelta`)
Calculating SLA deadlines requires date math:

```python
from datetime import datetime, timedelta

# Current time in UTC
now = datetime.utcnow()

# Add 24 hours to calculate deadline
deadline = now + timedelta(hours=24)

# Check if deadline has passed (SLA Breach)
if datetime.utcnow() > deadline:
    print("SLA Breached!")

# Format date into readable string: YYYY-MM-DD HH:MM
formatted_string = now.strftime("%Y-%m-%d %H:%M")
```

---

## Chapter 8: String Manipulation & Regular Expressions (RegEx)

### 8.1 Essential String Methods
```python
text = "  Water Leak In Room 101  "

# Strip leading/trailing whitespace
clean = text.strip()  # "Water Leak In Room 101"

# Case normalization (essential before searching keywords)
lowered = clean.lower()  # "water leak in room 101"

# Splitting and joining
words = lowered.split(" ")  # ['water', 'leak', 'in', 'room', '101']
slug = "-".join(words)      # "water-leak-in-room-101"
```

### 8.2 Regular Expressions & Word Boundaries (`\b`)
In Module 2, our keyword router matches words like `"fan"` and `"leak"`.
* **The Problem with `.contains()` or `in`:**
  `"fan" in "infant"` evaluates to `True`! That's a false positive.
* **The Solution: Word Boundaries (`\b`):**
  `\b` matches the boundary between a word character and a space or punctuation.

```python
import re

text = "The infant was sleeping near the electric fan."

# Matches 'fan' ONLY as an independent word, NOT inside 'infant'
pattern = r"\bfan\b"
matches = re.findall(pattern, text)

print(len(matches))  # Outputs: 1 (Correctly ignored 'infant'!)
```

---

## Chapter 9: Decorators Explained Simply

### 9.1 Functions are First-Class Citizens
In Python, functions can be passed into other functions as arguments, assigned to variables, and returned from functions:

```python
def shout(text):
    return text.upper()

# Assign function to another variable
say_loud = shout
print(say_loud("hello"))  # "HELLO"
```

### 9.2 What is a Decorator?
A decorator is just **a function that takes another function, wraps new behavior around it, and returns the wrapped version**.

```python
import time

def log_execution_time(func):
    """Decorator that measures and prints how long a function took to run."""
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)  # Call the original function
        duration = time.perf_counter() - start
        print(f"[Timer] Function '{func.__name__}' took {duration:.4f}s")
        return result
    return wrapper

# Using the '@' syntax applies the decorator automatically:
@log_execution_time
def process_complaints():
    time.sleep(0.5)
    print("All complaints processed.")

process_complaints()
# Output:
# All complaints processed.
# [Timer] Function 'process_complaints' took 0.5002s
```

---

## Chapter 10: Generators & The `yield` Keyword

### 10.1 `return` vs. `yield`
* **`return`:** Terminates the function completely. All local variables inside the function are wiped from memory.
* **`yield`:** **Pauses** the function, returns a value to the caller, and **freezes the function's state in memory**. When called again, execution resumes on the very next line!

### 10.2 How FastAPI Uses `yield` for Database Connections
In [`backend/app/api/deps.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/backend/app/api/deps.py):

```python
def get_db():
    # 1. Open a new database connection
    db = SessionLocal()
    try:
        # 2. Pause and hand the session to the FastAPI route handler
        yield db
    finally:
        # 3. After the route finishes and sends the response, resume here!
        # Guaranteed cleanup: closes the connection!
        db.close()
```
* **Why this is genius:** You never have to remember to close your database connection inside your route handlers. The generator handles setup before `yield` and cleanup after `yield` automatically.

---

## Chapter 11: Asynchronous Python (`async` and `await`)

### 11.1 Synchronous vs. Asynchronous in Plain English
Imagine a restaurant with one waiter:
* **Synchronous (Blocking):** The waiter takes Order 1 to the kitchen and **stands there doing nothing for 20 minutes** until the chef cooks the meal. Customers 2, 3, and 4 wait outside in the rain.
* **Asynchronous (Non-Blocking):** The waiter takes Order 1 to the kitchen. While the chef cooks, the waiter takes orders from Customers 2, 3, and 4. When meal 1 is ready, the waiter serves Customer 1.

### 11.2 `async def` and `await`
* **`async def`:** Declares a function as a non-blocking coroutine.
* **`await`:** Tells Python: *"This task will take time (e.g. waiting for a network response). Pause this function and handle other incoming requests on the event loop until this finishes."*

```python
import asyncio

async def fetch_campus_weather():
    print("Fetching weather...")
    # Non-blocking pause: event loop continues handling other requests!
    await asyncio.sleep(1)
    return "24°C Sunny"
```

> [!WARNING]
> Never use `time.sleep(5)` inside an `async def` endpoint! `time.sleep()` is synchronous and freezes the entire Python process. Always use `await asyncio.sleep(5)` in async code, or write a standard `def` endpoint so FastAPI runs it in a worker thread.

---

## Chapter 12: Developer Mastery Checklist

Before writing backend code, test your comprehension against this checklist:
- [ ] Understand why `venv` is necessary and how to activate it.
- [ ] Know the difference between mutable objects (lists/dicts) and immutable objects (strings/ints).
- [ ] Always use `.get(key, default)` to safely access dictionary values.
- [ ] Never put mutable default arguments like `def func(items=[])` in functions.
- [ ] Know how to use `min(items, key=lambda x: ...)` to sort collections by nested properties.
- [ ] Know what `self` represents inside a class method.
- [ ] Know how to define a custom exception inheriting from `Exception`.
- [ ] Use modern union type hints `str | None` instead of legacy `Optional[str]`.
- [ ] Understand why `with open(...)` is safe and `open(...)` without `with` is dangerous.
- [ ] Understand how `yield` pauses a function to provide resources and clean them up afterwards.
- [ ] Know that `await` can only be used inside `async def` functions.
