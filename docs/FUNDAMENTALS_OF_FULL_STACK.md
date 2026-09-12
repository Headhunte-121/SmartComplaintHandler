# Full-Stack Engineering Course: Architecture & Mechanics
## A First-Year College Guide to Modern Web Development & The Smart Complaint Handler

> **Course Overview:**  
> This textbook is structured as an engineering curriculum for first-year students. It breaks down every layer of modern full-stack web software, explains **what each tool actually does under the hood**, **what it is used for in our project**, and **defines every technical term right when it appears**.
>
> All historical comparisons and legacy tools have been removed so you can focus 100% on how modern systems actually work today.

---

# Course Syllabus & Front Summary Matrix

Here is the complete roadmap of all 12 technologies in our stack before diving into individual lessons.

| Lesson # | Layer & Technology | What It Is | What It Actually Does & What It Is Used For In Our Project | Key Technical Concept Defined |
| :--- | :--- | :--- | :--- | :--- |
| **1.1** | **UI View Engine**<br>`React 18` | A JavaScript UI library | Renders reactive UI components and automatically updates the screen when data changes (complaint forms, progress bars, dashboards). | **Virtual DOM & Reconciliation** |
| **1.2** | **Dev Server & Build Tool**<br>`Vite` | A local developer tool & compiler | Runs our local server at `localhost:5173` and instantly reflects code changes in the browser without reloading the page. | **Hot Module Replacement (HMR)** |
| **1.3** | **Syntax Extension**<br>`JSX` | HTML-in-JavaScript syntax | Allows writing UI elements directly inside JavaScript code, making UI structure intuitive and readable. | **Transpilation & Syntactic Sugar** |
| **1.4** | **Styling Engine**<br>`Tailwind CSS` | A utility-first CSS framework | Styles cards, status badges, buttons, and tables directly inside component markup using pre-defined utility classes. | **JIT Compiler & Purging** |
| **1.5** | **Client-Side Routing**<br>`React Router DOM` | A browser URL manager | Switches page views (`/`, `/track`, `/admin`) instantly inside the browser without reloading or contacting the server. | **Single-Page Application (SPA)** |
| **2.1** | **Transport Protocol & Format**<br>`REST + JSON over HTTP` | Standard network communication rules | Standardizes how data travels across the network between the browser and backend as lightweight JSON text. | **Serialization & Deserialization** |
| **2.2** | **Network Client**<br>`Fetch API` | Browser network request tool | Sends complaint data from the React form across the network to FastAPI and awaits the response asynchronously. | **Asynchronous Promises & Headers** |
| **3.1** | **App Server & Gateway**<br>`Uvicorn (ASGI)` | An asynchronous Python web server | Listens on port `8000`, receives incoming browser requests, and dispatches them efficiently using an async event loop. | **Asynchronous Event Loop** |
| **3.2** | **Web Framework**<br>`FastAPI` | A modern Python web framework | Directs incoming requests to the right Python function, checks permissions, and auto-generates interactive API docs at `/docs`. | **Dependency Injection (`Depends`)** |
| **3.3** | **Validation Engine**<br>`Pydantic V2` | A schema & data validation library | Inspects incoming complaint data, enforcing exact types, lengths, and constraints before saving to the database. | **Type Coercion & Schema Gatekeeping** |
| **4.1** | **Database Storage Engine**<br>`SQLite` | A file-based relational database | Permanently saves records on disk in a single binary file (`smart_complaints.db`) with relational integrity. | **Foreign Keys & B-Tree Indexes** |
| **4.2** | **Database ORM**<br>`SQLAlchemy 2.0` | Object-Relational Mapper | Translates Python objects into SQL queries, letting us query and update database tables using pure Python code. | **Unit of Work & Identity Map** |
| **5.1** | **Background Automation**<br>`APScheduler` *(V4)* | In-process cron & interval daemon | Runs an internal timer every 60 seconds to inspect ticket deadlines and auto-escalate overdue complaints. | **Background Daemons & Thread Pools** |
| **5.2** | **AI Extraction Engine**<br>`Google Gemini` *(V2)* | Large Language Model | Reads unstructured complaint text and extracts clean, structured JSON (category, priority, location) using schema mode. | **Structured Output Mode & Guardrails** |

---

# The Big Picture: The 60-Millisecond Lifecycle

Before exploring the individual modules, understand how data flows across the system in real time when a student submits a complaint:

```
[Student clicks Submit]
       │
       ▼ (0ms - 2ms)
[React 18 State] ──> Packages input data into a JavaScript Object
       │
       ▼ (2ms - 5ms)
[Fetch API] ────────> Serializes object to JSON string & sends HTTP POST across network
       │
       ▼ (5ms - 20ms: Network Latency)
[Uvicorn Server] ───> Accepts network connection on Port 8000, hands request to FastAPI
       │
       ▼ (20ms - 25ms)
[FastAPI Router] ───> Matches URL /api/v1/tickets, invokes create_ticket()
       │
       ▼ (25ms - 28ms)
[Pydantic V2] ──────> Validates data types, lengths, and constraints
       │
       ▼ (28ms - 35ms)
[SQLAlchemy ORM] ───> Converts Python Ticket object into SQL INSERT statement
       │
       ▼ (35ms - 42ms)
[SQLite Engine] ────> Writes record to disk file smart_complaints.db, updates B-Tree index
       │
       ▼ (42ms - 45ms)
[FastAPI] ──────────> Serializes new Ticket (with ID and tracking code) into JSON response
       │
       ▼ (45ms - 58ms: Network Latency)
[React 18] ─────────> Parses JSON response, updates State, re-renders confirmation screen
       │
       ▼ (60ms Total)
[Student sees Tracking Code on screen]
```

---

# Chapter 1: The Frontend (User Interface Layer)

The frontend is the portion of the application that executes inside the user's web browser (such as Google Chrome, Firefox, or Safari). It is responsible for rendering screens, capturing student inputs, and displaying live updates.

---

## Lesson 1.1: The UI View Engine (React 18)

### What it is:
React is a JavaScript library designed for building user interfaces out of reusable, modular building blocks called **Components**.

### What it actually does under the hood:
* **Maintains a Virtual Representation:** Instead of directly touching the browser's real display elements (which is computationally expensive and slow), React keeps a lightweight virtual model of the screen in your computer's RAM.
* **Diffing & Reconciliation:** When data changes (for example, when a ticket status switches from `SUBMITTED` to `IN_PROGRESS`), React automatically compares the new virtual screen against the old one, calculates the exact difference (the "diff"), and updates *only* that specific badge on the monitor. The rest of the page remains untouched.

### What it is used for in our project:
* **The Complaint Form:** Stores the student's text as they type into the title, description, and location fields.
* **The 3-Step Progress Bar:** Dynamically highlights the current stage of a complaint (`Submitted` ➔ `In Progress` ➔ `Resolved`).
* **The Staff Admin Dashboard:** Renders a searchable, filterable table of tickets that refreshes instantly when new tickets arrive.

### Technical Terms Defined In-Place:
* **The DOM (Document Object Model):** The browser's live internal tree of HTML elements on the page. Every `<button>`, `<div>`, and `<p>` is converted by the browser into a memory object. Modifying the DOM directly is slow because the browser must recalculate positions and repaint pixels on the monitor.
* **The Virtual DOM (Virtual Document Object Model):** An ultra-fast, in-memory tree of JavaScript objects created by React that mirrors the real DOM. React does all calculations here first.
* **Reconciliation:** React's comparison algorithm. It determines the minimum number of changes needed to sync the real browser DOM with the updated Virtual DOM.
* **Component:** A self-contained, independent JavaScript function that returns user interface markup (e.g., `<Navbar />`, `<TicketCard />`).
* **Props (Properties):** Read-only inputs passed from a parent component down to a child component (e.g., `<TicketStatusBadge status="RESOLVED" />`).
* **State:** A special variable stored inside a component that represents its dynamic data. Whenever state changes, the component automatically re-executes and refreshes the screen.
* **Hooks (`useState`, `useEffect`):** Built-in React helper functions.
  * `useState`: Declares a reactive state variable that triggers a re-render when updated.
  * `useEffect`: Runs side-effects (like fetching data over the network) when a component first appears on the screen.

---

## Lesson 1.2: The Dev Server & Build Tool (Vite)

### What it is:
Vite is a high-speed development tool that runs a local web server during development and bundles/optimizes our frontend code for final deployment.

### What it actually does under the hood:
* **Native ES Module Serving:** Modern browsers natively understand JavaScript `import` and `export` statements. When you open `localhost:5173`, Vite does not pre-bundle thousands of lines of code. Instead, it serves files on-demand as the browser requests them, launching your development server in milliseconds.
* **Hot Module Replacement (HMR):** Vite keeps an open background channel (a WebSocket) between your code editor and the browser. The millisecond you save a file, Vite transmits *only* that edited component to the browser, updating the live screen instantly without refreshing the webpage or resetting your form inputs.

### What it is used for in our project:
* Providing the live development environment on your laptop (`http://localhost:5173`).
* Compiling JSX syntax, processing Tailwind CSS classes, and packaging the final HTML and JavaScript files into a compact distribution folder (`dist/`).

### Technical Terms Defined In-Place:
* **Bundling:** The operation of combining multiple individual code files, style sheets, and assets into a minimal set of compressed files so a web browser can download them quickly.
* **Native ES Modules (ESM):** The official JavaScript standard for modular code using `import` and `export` statements, natively executed by the browser engine.
* **Hot Module Replacement (HMR):** A development mechanism that swaps, adds, or removes code modules while the application is running, without requiring a full browser page reload.
* **WebSocket:** A persistent, two-way communication channel between a client (browser) and a server that allows instantaneous data push.

---

## Lesson 1.3: The Syntax Extension (JSX)

### What it is:
JSX (JavaScript XML) is a syntax extension for JavaScript that allows you to write HTML-like markup directly inside your JavaScript code files.

### What it actually does under the hood:
* Web browsers cannot read JSX directly. A build compiler (such as Vite's integrated compiler) converts every JSX tag into standard JavaScript function calls (`React.createElement(...)`) before it reaches the browser.
* For example:
  ```jsx
  // What you write:
  const badge = <span className="urgent">Critical</span>;

  // What the compiler converts it into:
  const badge = React.createElement("span", { className: "urgent" }, "Critical");
  ```

### What it is used for in our project:
* Building all UI components visually without writing separate HTML files and connecting them with complex JavaScript query selectors.

### Technical Terms Defined In-Place:
* **Transpilation / Compilation:** Converting source code written in one format (like JSX or TypeScript) into standard JavaScript that any browser engine can execute.
* **Syntactic Sugar:** Syntax introduced into a programming language to make code easier to write and read, without changing how the computer actually functions underneath.

---

## Lesson 1.4: The Styling Engine (Tailwind CSS)

### What it is:
Tailwind CSS is a utility-first styling framework that provides single-purpose CSS classes applied directly onto HTML and JSX elements.

### What it actually does under the hood:
* **Just-In-Time (JIT) Scanning:** As you type code, Tailwind's compiler continuously scans your JSX files. When it detects a class name like `bg-blue-600` or `rounded-lg`, it generates only that specific CSS rule on the fly.
* **Automated Purging:** When building for production, Tailwind discards every unused class, ensuring the final stylesheet sent to the user is extremely small (typically less than 15 KB).

### What it is used for in our project:
* Styling cards, status badges, submit buttons, input fields, and admin tables with clean, modern visuals.
* Setting dynamic colors based on ticket status (e.g., green for `RESOLVED`, red for `ESCALATED`, amber for `IN_PROGRESS`).

### Technical Terms Defined In-Place:
* **Utility-First CSS:** An architectural approach where styles are built by combining small, single-purpose classes (e.g., `flex`, `items-center`, `p-4`) directly in markup rather than inventing custom CSS selectors in separate `.css` files.
* **JIT (Just-In-Time) Compiler:** A compiler mode that generates CSS rules dynamically as you write class names in your templates.
* **Purging / Tree-Shaking:** An optimization process that eliminates unused code or styling rules from the final production bundle.
* **Specificity:** The browser's ranking algorithm used to determine which CSS rule takes priority when multiple rules target the same element.

---

## Lesson 1.5: Client-Side Routing (React Router DOM)

### What it is:
React Router DOM is a navigation library for React applications that synchronizes the visible screen components with the browser's address bar.

### What it actually does under the hood:
* **Intercepts Browser Navigation:** When a user clicks a navigation link, React Router prevents the browser from reloading the entire webpage. Instead, it modifies the address bar using the browser's internal History API and tells React to unmount the old page component and mount the new one in memory.

### What it is used for in our project:
* Directing users between three distinct application views:
  * `/` ➔ Student Complaint Submission Page (`SubmitPage.jsx`)
  * `/track` ➔ Real-Time Ticket Tracking Page (`TrackPage.jsx`)
  * `/admin` ➔ Department Staff Dashboard (`AdminPage.jsx`)

### Technical Terms Defined In-Place:
* **Single-Page Application (SPA):** A web application that loads a single HTML file once. All subsequent page transitions occur dynamically via JavaScript inside the browser, eliminating page reloads and screen flicker.
* **HTML5 History API (`window.history.pushState`):** A browser capability that allows JavaScript to modify the URL displayed in the address bar without triggering a network request or full-page refresh.
* **Query Parameters:** Key-value pairs appended to the end of a URL after a `?` symbol (e.g., `/track?code=TICK-4K89`). Our tracking page reads this parameter to fetch and display ticket details automatically.

---

# Chapter 2: The Network Bridge (Communication Layer)

The network layer connects the client (browser) to the server (backend). It defines the protocols, formats, and rules that govern how data travels across local networks or the internet.

---

## Lesson 2.1: The Transport Protocol & Format (HTTP, REST, JSON)

### What it is:
* **HTTP:** The foundational network protocol for transferring data across the web.
* **REST:** An architectural pattern that organizes server functions around resources identified by standard URLs.
* **JSON:** A lightweight, human-readable text format used to interchange data between different programming languages.

### What it actually does under the hood:
* **Data Transmission:** When a student clicks "Submit", the browser takes the JavaScript object in memory, converts it into a JSON text string, wraps it inside an HTTP request packet, and sends it over a TCP connection to the backend IP address and port.
* **HTTP Verbs / Methods:**
  * `POST /api/v1/tickets` ➔ Instructs the server to create a new ticket.
  * `GET /api/v1/tickets/TICK-4821` ➔ Instructs the server to retrieve an existing ticket.
  * `PATCH /api/v1/tickets/1/status` ➔ Instructs the server to update a ticket's status.

### What it is used for in our project:
* Establishing the universal language between our React frontend (written in JavaScript) and our FastAPI backend (written in Python).

### Technical Terms Defined In-Place:
* **HTTP (HyperText Transfer Protocol):** The standard request-response protocol used for communications over the web.
* **REST (Representational State Transfer):** A software architecture convention where resources are named using URLs (nouns) and operated on using standard HTTP methods (verbs).
* **JSON (JavaScript Object Notation):** A universal data interchange format represented as key-value pairs (e.g., `{"title": "Water leak", "priority": "HIGH"}`).
* **Serialization:** Converting an active in-memory object (a JavaScript object or Python dictionary) into a plain text string so it can travel across a network cable.
* **Deserialization:** Reconstructing a plain text string received from the network back into an active in-memory object inside your code.
* **HTTP Status Code:** A standardized 3-digit number returned by the server indicating the result:
  * `200 OK`: Request succeeded.
  * `201 Created`: Resource successfully created in the database.
  * `400 Bad Request`: Client sent incorrect or malformed data.
  * `404 Not Found`: Requested tracking code or resource does not exist.
  * `422 Unprocessable Entity`: Data passed schema checks but violated constraints (e.g., title too short).
  * `500 Internal Server Error`: Backend server crashed or encountered an unexpected bug.
* **CORS (Cross-Origin Resource Sharing):** A browser security rule. By default, browsers prevent scripts running on `localhost:5173` from accessing data from `localhost:8000` because the ports (origins) differ. The backend must explicitly send an `Access-Control-Allow-Origin` header to grant permission.

---

## Lesson 2.2: The Browser HTTP Client (Fetch API)

### What it is:
The Fetch API is the modern, built-in JavaScript interface for executing network requests from inside a web browser.

### What it actually does under the hood:
* **Non-Blocking Network Calls:** When `fetch()` is executed, the browser delegates the network request to its background network engine. It returns a **Promise** immediately, allowing the user interface to stay responsive while the data travels across the network. When the server responds, the Promise resolves and triggers your callback code.

### What it is used for in our project:
* Transmitting complaint forms to the backend.
* Polling or requesting status updates when a student looks up their tracking code.
* Loading tickets onto the staff dashboard.

### Technical Terms Defined In-Place:
* **Asynchronous:** A programming model where long-running operations (like network transfers or disk reads) run in the background without halting or freezing the main program thread.
* **Promise:** A JavaScript object representing the eventual completion or failure of an asynchronous operation, containing its resulting value.
* **Request Payload (Body):** The actual data content sent inside an HTTP POST or PATCH request.
* **Headers:** Metadata sent at the beginning of an HTTP request or response detailing technical properties (e.g., `Content-Type: application/json`).

---

# Chapter 3: The Backend (Server & Business Logic Layer)

The backend runs on the server (or your development laptop). It receives requests from the network, verifies security and data validity, applies business rules, and communicates with the database.

---

## Lesson 3.1: The Application Server & Gateway (Uvicorn / ASGI)

### What it is:
Uvicorn is a high-performance, asynchronous web server implementation for Python based on the **ASGI** specification.

### What it actually does under the hood:
* **Listens on a Port:** Uvicorn binds to a specific network port on your operating system (e.g., `Port 8000`).
* **The Asynchronous Event Loop:** When 50 students submit complaints at the same second, Uvicorn does not create 50 heavy operating system threads. Instead, it runs on a single event loop. While one request is waiting for the database to write to disk, the event loop switches CPU execution to process incoming data for another student, achieving massive concurrency with minimal memory.

### What it is used for in our project:
* Serving as the entry gate that receives raw network traffic, interprets the HTTP protocol, and hands requests to FastAPI.

### Technical Terms Defined In-Place:
* **Web Server vs. Application Framework:**
  * *Web Server (Uvicorn):* Handles network connections, sockets, and raw HTTP protocols.
  * *Application Framework (FastAPI):* Handles routes, application logic, and business rules.
* **ASGI (Asynchronous Server Gateway Interface):** The modern Python standard interface between async-capable web servers and Python web applications.
* **Event Loop:** An infinite programming loop that monitors and dispatches events, switching between tasks whenever an operation is waiting for external I/O.
* **Non-blocking I/O (Input/Output):** System operations that initiate work and immediately yield control, notifying the program when the data is ready rather than blocking CPU execution.
* **Port:** A 16-bit numerical address on a computer (e.g., `8000`) that directs incoming network packets to a specific running software program.

---

## Lesson 3.2: The Web Framework (FastAPI)

### What it is:
FastAPI is a modern, high-performance web framework for building APIs with Python, designed around standard Python type hints.

### What it actually does under the hood:
* **URL Routing:** Analyzes incoming HTTP requests, matches the URL path and HTTP verb to the corresponding Python function, and executes it.
* **Automatic OpenAPI Documentation:** FastAPI inspects your Python function signatures and type annotations, generating an interactive web-based testing playground at `/docs` (Swagger UI) automatically.

### What it is used for in our project:
* Defining our API endpoints (`POST /api/v1/tickets`, `GET /api/v1/tickets/{tracking_code}`).
* Connecting endpoints to the database using dependency injection.
* Auto-generating interactive API documentation for testing our endpoints in the browser.

### Technical Terms Defined In-Place:
* **Routing:** The mechanism of mapping an incoming HTTP request URL and method to the specific application function responsible for handling it.
* **Dependency Injection (`Depends`):** A design pattern where a function does not manually construct its dependencies (such as a database connection). Instead, the framework creates the connection, provides it as an argument, and guarantees it is cleanly closed after the function finishes.
* **OpenAPI / Swagger UI:** An open industry standard for describing REST APIs. It generates an interactive webpage where developers can test API endpoints directly from their browser.
* **Middleware:** Software components that sit in the request-response pipeline, executing logic before a request reaches an endpoint or before a response is sent to the client (e.g., CORS middleware).

---

## Lesson 3.3: Data Validation & Schemas (Pydantic V2)

### What it is:
Pydantic is Python's leading data parsing and validation library, powered by a core engine compiled in Rust.

### What it actually does under the hood:
* **Input Gatekeeper:** When raw JSON arrives at an API endpoint, Pydantic parses the payload and strictly validates every field against predefined rules:
  * Ensures `title` contains between 5 and 150 characters.
  * Validates that `department_id` is an integer.
  * Strips dangerous whitespace and coerces types where safe.
  * If validation fails, it stops execution instantly and returns a clear `422 Unprocessable Entity` error to the user without touching the database.

### What it is used for in our project:
* Defining the exact contract of data entering and leaving the system:
  * `TicketCreate` schema (what a student sends).
  * `TicketResponse` schema (what the server returns, including generated IDs and timestamps).

### Technical Terms Defined In-Place:
* **Schema:** A formal declaration or blueprint defining the required fields, data types, and validation rules of a data object.
* **Type Coercion:** The automatic conversion of data from one type to another (e.g., converting the string `"42"` into the integer `42`).
* **Rust-compiled Core (`pydantic-core`):** The underlying engine of Pydantic V2 is written in the Rust programming language, executing validation at native machine-code speeds.
* **Field Constraints:** Specific boundary rules attached to a schema property (e.g., `Field(min_length=5, max_length=150)`).

---

# Chapter 4: The Persistence Layer (Database & ORM)

The persistence layer ensures that data survives when the server restarts, crashes, or loses power. It stores information permanently in structured tables.

---

## Lesson 4.1: The Relational Database Engine (SQLite)

### What it is:
SQLite is a lightweight, self-contained, serverless relational database engine that stores all tables, rows, and indexes inside a single file on disk.

### What it actually does under the hood:
* **Zero-Configuration File Storage:** Unlike systems like MySQL or PostgreSQL (which require installing and configuring external server daemons), SQLite reads and writes directly to a disk file named `smart_complaints.db`.
* **ACID Guarantees:** Guarantees that even if your laptop suddenly loses power mid-write, the database will never be left in a corrupted or half-saved state.

### What it is used for in our project:
* Storing our `departments` table (hostel, electrical, sanitation) and `tickets` table (all student complaints, timestamps, priorities, and statuses).

### Technical Terms Defined In-Place:
* **Relational Database (RDBMS):** A database that stores information in structured tables composed of rows and columns, with mathematical relationships linking tables together.
* **Primary Key:** A column whose value uniquely identifies every individual row in a table (e.g., `id = 1, 2, 3`).
* **Foreign Key:** A column in one table (`tickets.department_id`) that references the primary key of another table (`departments.id`). This prevents orphaned records (e.g., a ticket assigned to a department that does not exist).
* **B-Tree Index:** An on-disk balanced tree data structure that allows the database engine to locate a specific record (like `tracking_code = "TICK-4K89"`) in logarithmic time $O(\log N)$ instead of scanning every row in the file from top to bottom.
* **ACID Guarantees:**
  * **Atomicity:** All changes in a transaction succeed together, or all fail together (no partial writes).
  * **Consistency:** All database rules (uniqueness, foreign keys) are strictly enforced.
  * **Isolation:** Multiple operations happening simultaneously do not interfere with each other.
  * **Durability:** Once committed, saved data will not be lost even during system failure.

---

## Lesson 4.2: The Object-Relational Mapper (SQLAlchemy 2.0)

### What it is:
SQLAlchemy is Python's premier Object-Relational Mapper (ORM) and SQL toolkit.

### What it actually does under the hood:
* **Object-to-Row Translation:** SQLAlchemy bridges the gap between Python classes and database tables. Instead of writing raw SQL strings (`"INSERT INTO tickets ..."`), you instantiate a Python class (`new_ticket = Ticket(title="Leak")`). SQLAlchemy analyzes the object, constructs the appropriate SQL statements, and executes them against the database driver.
* **Database Abstraction:** Because SQLAlchemy generates standard SQL, our entire backend can switch from SQLite on a laptop to enterprise PostgreSQL in the cloud by changing a single configuration string in `.env`.

### What it is used for in our project:
* Defining database tables as Python classes inside `app/models/`.
* Querying, filtering, creating, and updating tickets using Python methods.

### Technical Terms Defined In-Place:
* **ORM (Object-Relational Mapping):** A software layer that allows developers to manipulate database tables and records using object-oriented programming concepts instead of raw SQL queries.
* **Declarative Base:** A base Python class provided by SQLAlchemy that tracks all subclasses representing database tables.
* **Engine:** The core connectivity object in SQLAlchemy that manages database connections and executes raw SQL commands against the database file.
* **SessionLocal (Session Factory):** A factory that spawns individual database `Session` objects. A session acts as a temporary holding area for all database changes before they are committed to disk.
* **Unit of Work Pattern:** An architectural pattern where multiple database operations (inserts, updates, deletes) are collected in memory and sent to the database in a single transaction commit, minimizing disk writes.
* **Identity Map:** An in-memory cache inside an active session that ensures querying for the same database record twice returns the exact same Python object without querying the disk again.

---

# Chapter 5: Advanced Extensions (Automation & AI)

These modules extend the application with scheduled automation and artificial intelligence.

---

## Lesson 5.1: In-Process Automation (APScheduler - Version 4)

### What it is:
Advanced Python Scheduler (APScheduler) is an in-process library that allows Python functions to be scheduled to run at specific intervals or times.

### What it actually does under the hood:
* **Background Timer Thread:** APScheduler launches a lightweight daemon thread inside the running Python process. Every 60 seconds, it wakes up, creates a database session, queries for tickets where `status != 'RESOLVED'` and `sla_deadline < now()`, marks overdue tickets as `ESCALATED`, commits the change, and goes back to sleep.

### What it is used for in our project:
* Automating ticket escalation when departments fail to resolve complaints within designated Service Level Agreement (SLA) deadlines.

### Technical Terms Defined In-Place:
* **Daemon:** A background process or thread that runs continuously without user interaction to perform recurring maintenance or monitoring tasks.
* **Interval Trigger:** A scheduling rule that executes a target function repeatedly after a set duration (e.g., every 60 seconds).
* **Thread Pool:** A pre-allocated set of operating system threads that can execute background jobs concurrently without blocking the main application server.
* **SLA (Service Level Agreement):** The contractual or policy deadline by which a submitted complaint must be resolved (e.g., Electrical issues must be handled within 24 hours).

---

## Lesson 5.2: Structured AI Extraction (Google Gemini 2.5 Flash - Version 2)

### What it is:
Google Gemini 2.5 Flash is a high-speed, multimodal Large Language Model (LLM) accessed via the official `google-genai` SDK.

### What it actually does under the hood:
* **Semantic Analysis & Classification:** When a student enters unstructured, informal text (e.g., *"the ceiling fan in 3rd floor room 302 is making loud spark noises and smelling burnt"*), Gemini analyzes the semantics and intent.
* **Schema-Constrained Generation:** Instead of responding with conversational text, Gemini is locked into **Structured JSON Mode**. It evaluates probabilities only for tokens that conform to our required JSON schema, guaranteeing output like:
  ```json
  {
    "category": "Electrical",
    "priority": "CRITICAL",
    "location": "Room 302, 3rd Floor"
  }
  ```

### What it is used for in our project:
* Automatically parsing natural-language complaints, routing them to the proper department, and setting urgency levels without requiring manual triage.

### Technical Terms Defined In-Place:
* **LLM (Large Language Model):** A deep neural network trained on vast language corpora capable of understanding semantics, syntax, and complex human instructions.
* **Structured Output Mode:** A model capability where outputs are mathematically restricted to valid JSON matching a developer-provided schema.
* **Prompt Engineering:** The craft of formulating instructions given to an AI model to produce consistent, accurate, and predictable results.
* **Deterministic Guardrail:** A validation step in your backend Python code that checks the AI's output against real database records (e.g., confirming the predicted department exists in our `departments` table) before saving.

---

# Course Review & Viva Self-Assessment

Use these questions to verify your mastery of the concepts before oral examinations or technical presentations:

1. **Why does React use a Virtual DOM instead of directly modifying the real browser DOM?**  
   *Answer:* Modifying the real browser DOM forces the browser to recalculate element geometries and repaint pixels on screen, which is slow. React updates a fast copy in RAM, computes the minimal difference ("diff"), and updates only the altered elements in the real DOM.

2. **What is the difference between Uvicorn and FastAPI?**  
   *Answer:* Uvicorn is the **web server** that listens on a network port and handles raw TCP/HTTP network connections asynchronously. FastAPI is the **application framework** that directs incoming requests to specific Python functions, validates data schemas, and handles business logic.

3. **What does Pydantic do when incoming JSON fails validation rules?**  
   *Answer:* It halts execution immediately, prevents the invalid data from reaching the database or business logic, and returns an HTTP `422 Unprocessable Entity` response detailing exactly which field failed and why.

4. **Why do we mark `tracking_code` with `index=True` in our database model?**  
   *Answer:* It tells SQLite to build a **B-Tree index** on disk. When a student checks a ticket code, the database finds the record in $O(\log N)$ logarithmic time instead of scanning every row in the file (a Full Table Scan).

5. **How does client-side routing in React Router differ from traditional website links?**  
   *Answer:* Traditional links trigger a full browser refresh, discarding the page and requesting a complete new HTML file from the server. React Router uses the HTML5 History API to update the URL in the address bar without a page refresh, simply swapping which React component is displayed on screen.
