# Module M1 - File 01: Application Settings & Environment Configuration
## Target Files: `backend/app/core/config.py` and `backend/.env`
### Execution Track: Phase 1 (Can be built in parallel with File 03)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In professional software engineering, `config.py` (paired with `.env`) serves as the **Central Application Configuration Subsystem**. It is the industry-standard mechanism for managing all operational parameters, environment-specific coordinates, and system settings across a backend service.

### Standard Industry Role & Real-World Use Cases
In modern production frameworks (such as FastAPI, Django, and enterprise backend systems), `config.py` is standardly used for five core responsibilities:

1. **Central Application Identity & Metadata:**
   * Standardly defines the service name, version string, release stage (`development`, `staging`, `production`), and public description.
   * When FastAPI boots, it reads `settings.PROJECT_NAME` directly to populate the OpenAPI specification and configure the interactive Swagger UI documentation header (`/docs`).
2. **Global Network & API Routing Parameters:**
   * Standardly defines the base API URL prefix (`settings.API_V1_STR = "/api/v1"`), CORS (Cross-Origin Resource Sharing) allowed origin lists, and default pagination limits.
   * The main application entry point reads this setting to mount routers under standard versioned URL paths (`app.include_router(api_router, prefix=settings.API_V1_STR)`).
3. **Database & Infrastructure Coordinates:**
   * Standardly holds the connection URI for relational databases (`settings.DATABASE_URL`), cache servers (Redis), and filesystem storage directories.
   * The database engine (`app/core/database.py`) imports `settings.DATABASE_URL` to establish physical socket connections and file handles without hardcoding connection strings in query logic.
4. **Security, Cryptography & Secret Management:**
   * In authentication and security workflows, this file standardly holds JWT (JSON Web Token) secret keys, hashing algorithms (`HS256`), and token expiration durations.
   * Sensitive secrets are loaded dynamically from the external `.env` file or cloud secrets managers (AWS Secrets Manager, Google Secret Manager), ensuring secrets are never hardcoded in source code.
5. **Third-Party Service & AI Integration Settings:**
   * Standardly stores external API credentials (such as Gemini API keys, SMTP mail server credentials for sending ticket status emails, and webhook endpoints).

### What WE Are Specifically Using It For in Smart Complaint Handler
In our campus complaint automation platform, our 5-student engineering team specifically uses `config.py` and `.env` for four concrete purposes:

1. **Naming Our Application in Documentation (`PROJECT_NAME`):**
   * We set `PROJECT_NAME = "Smart Complaint Handler"`.
   * When we launch our FastAPI server and open `http://localhost:8000/docs`, this string appears as the official title at the top of our interactive API documentation page.
2. **Standardizing Our Complaint URL Routes (`API_V1_STR`):**
   * We set `API_V1_STR = "/api/v1"`.
   * This ensures that every complaint endpoint we create in Module M2 lives at a clean, professional web address (such as `POST http://localhost:8000/api/v1/tickets` for submitting a ticket).
3. **Targeting Our SQLite Database File (`DATABASE_URL`):**
   * We set `DATABASE_URL = "sqlite:///./smart_complaints.db"`.
   * This tells SQLite to create and open a physical database file named `smart_complaints.db` directly inside our `backend/` directory to store our campus departments, squads, and student complaints.
4. **Enabling Friction-Free Team Development (5-Member Squad):**
   * Because `.env` is ignored by Git, each of us can customize our local settings on our own laptop (such as testing with a temporary database `test_complaints.db` or changing port settings) without overwriting teammates' files or causing Git merge conflicts.

### How Other Components Standardly Interact with This File
Across the entire application codebase, components follow a standard consumption pattern:
* Modules never read raw `.env` text files directly.
* Modules never call `os.environ.get(...)` throughout random route files.
* Instead, every component imports the pre-validated singleton instance:
  `from app.core.config import settings`
  and accesses typed attributes directly (e.g. `settings.DATABASE_URL`, `settings.PROJECT_NAME`).

### The Core Problem It Solves & Why It Exists
* **Separation of Concerns (12-Factor App Standard):** Strict industry standards dictate that source code should be completely decoupled from deployment configuration. Code should be written once and run anywhere.
* **Multi-Developer Consistency:** Team members running on Windows, macOS, or Linux maintain their own local `.env` files with personal database paths and port numbers without conflicting with their teammates' files or causing Git merge conflicts.
* **Fail-Fast Boot Validation:** If a required configuration parameter is missing or has an invalid data type (such as an alphabetic string where a numeric port is expected), Pydantic halts the server immediately during startup with an explicit error, preventing broken runtime states.

---

# 2. What Must Be in This File & Why Each Item Is Needed

To be complete, this component must define, validate, and manage six essential items:

---

### Item 1: Application Project Name (`PROJECT_NAME`)
* **What it is:** A text string attribute that defines the official human-readable name of the backend service (defaulting to `"Smart Complaint Handler"`).
* **Data Type:** String (`str`).
* **Default Value:** `"Smart Complaint Handler"`.
* **Why it is needed:**
  * **Interactive API Documentation (OpenAPI / Swagger UI):** When the FastAPI framework launches, it automatically compiles an interactive web portal documenting all available HTTP endpoints. This string is injected directly into the HTML header of that documentation portal, identifying the application to frontend developers and testers.
  * **System Startup Logging:** When the backend server boots up in a terminal, it writes diagnostic initialization logs to the console. This name is printed during startup to verify which service and version are currently running.
  * **Fallback Safety:** Providing a sensible default string ensures that even if a developer initializes a completely blank `.env` file, the server still boots successfully without crashing on a missing project title.

---

### Item 2: API Version Prefix (`API_V1_STR`)
* **What it is:** A standardized URL path segment (specifically `"/api/v1"`) prepended to every web route exposed by the backend application.
* **Data Type:** String (`str`).
* **Default Value:** `"/api/v1"`.
* **Why it is needed:**
  * **URL Routing Architecture:** When an HTTP client (such as a web browser or mobile app) sends a request to the server, the server inspects the URL path to determine which Python function should handle the request.
  * **API Versioning & Backwards Compatibility:** Web APIs evolve over time. When future features require changing the input or output structure of an endpoint, developers cannot simply break the existing endpoints because active mobile apps or external integrations will immediately crash.
  * By grouping all current endpoints under `/api/v1` (e.g., `/api/v1/tickets`), the team can build a new set of `/api/v2` endpoints in the future on the same server, allowing old and new clients to operate concurrently without conflicts.
  * Defining this prefix in `config.py` allows all routers across the application to import the prefix from one place rather than hardcoding `"/api/v1"` in every single router file.

---

### Item 3: Database Connection Address (`DATABASE_URL`)
* **What it is:** A fully qualified Uniform Resource Identifier (URI) specifying the database engine dialect, network protocol, and physical file path or server address.
* **Data Type:** String (`str`).
* **Default Value:** `"sqlite:///./smart_complaints.db"`.
* **Anatomy of this URI:**
  * `sqlite:` specifies the **Database Dialect**—telling the database engine to use the SQLite relational engine.
  * `///` specifies a **Relative Filesystem Path** on the local hard drive (three slashes indicate a relative path from the current working directory).
  * `./smart_complaints.db` specifies the **Target File Name**—the actual physical database file on disk where tables, rows, and indexes will be stored.
* **Why it is needed:**
  * The database engine cannot guess where to store or retrieve data; it requires an explicit connection address.
  * By isolating this address inside configuration, developers can switch from a local development file (`sqlite:///./smart_complaints.db`) to a shared in-memory test database (`sqlite:///:memory:`) or a cloud PostgreSQL database (`postgresql://user:password@hostname:5432/dbname`) simply by changing a single line in their `.env` file, without altering any Python application code.

---

### Item 4: External Environment File Link (`env_file = ".env"`)
* **What it is:** An internal configuration directive that instructs the settings parser to locate and parse a local `.env` file residing on the filesystem.
* **Why it is needed:**
  * Operating systems allow users to set global environment variables, but manually configuring dozens of environment variables in the Windows Command Prompt or PowerShell every time you open a terminal is tedious and error-prone.
  * The `.env` file loader automates this process: upon startup, it reads key-value text pairs from `.env`, converts each line into a key-value mapping, and feeds them directly into the configuration schema.
  * UTF-8 character encoding must be explicitly configured so that international characters or special symbols in passwords or paths do not cause parsing errors across different operating systems.

---

### Item 5: Unrecognized Variable Tolerance Policy (`extra = "ignore"`)
* **What it is:** A strict parser configuration setting that instructs the validation engine to safely ignore any system environment variables that are not explicitly defined in the `Settings` class.
* **Why it is needed:**
  * Modern operating systems (Windows, macOS, Linux) inherently maintain dozens of global system environment variables (such as `PATH`, `USERNAME`, `TEMP`, `SYSTEMROOT`, `COMPUTERNAME`).
  * By default, strict data validators will examine all variables present in the environment; if they encounter variables that are not explicitly declared in the class schema, they raise an error and abort the process under the assumption that an unexpected variable represents an error.
  * Setting the extra variable behavior to `"ignore"` ensures that the parser extracts only the variables defined in our schema (`PROJECT_NAME`, `API_V1_STR`, `DATABASE_URL`) and silently bypasses all background operating system variables, preventing startup crashes.

---

### Item 6: Singleton In-Memory Instance (`settings = Settings()`)
* **What it is:** The instantiation of the validated `Settings` class into an active Python object held in computer memory (RAM), exported as a module-level variable named `settings`.
* **Why it is needed:**
  * **Disk I/O vs. RAM Access:** Reading a file from a physical solid-state drive or hard drive (**Disk I/O**) is thousands of times slower than reading data already stored in computer memory (**RAM**).
  * If the application had to open, read, parse, and validate the `.env` file from disk every single time a student submitted a complaint or viewed a ticket, the server would suffer severe latency and throughput degradation.
  * **The Singleton Pattern:** By instantiating the object once at the bottom of `config.py`, the settings are loaded, validated, and stored in RAM during the server's initial boot sequence. Every other file across the backend simply imports this pre-allocated `settings` object, gaining microsecond access to configuration values without redundant disk reads.

---

# 3. Component Life-Cycle: Input, Process, Output

| Stage | What Happens Behind the Scenes |
| :--- | :--- |
| **INPUT** | 1. The operating system process environment is queried for active system variables.<br>2. The physical filesystem is checked for the existence of `backend/.env`.<br>3. If `.env` exists, raw key-value text strings (e.g. `PROJECT_NAME=Smart Complaint Handler`) are read into memory. |
| **PROCESS** | 1. The Pydantic `BaseSettings` engine intercepts the inputs.<br>2. System environment variables are merged with `.env` values (system variables take priority).<br>3. Values are matched against the declared class attributes (`PROJECT_NAME`, `API_V1_STR`, `DATABASE_URL`).<br>4. Missing values are filled with their declared fallback defaults.<br>5. Data types are validated and converted into proper Python types.<br>6. Extraneous operating system variables are discarded per the `extra = "ignore"` policy. |
| **OUTPUT** | A frozen, fully validated `Settings` Python object stored in RAM at the module level as `settings`, providing safe attribute access (`settings.DATABASE_URL`) across all application components. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. What Must Stay Exact

### 🟢 Safe to Modify & Customize (Your Team's Creative Freedom):
* **The Project Name Text:** You can change `"Smart Complaint Handler"` in `.env` or in the class default to any custom title your team prefers (e.g., `"Campus Maintenance & Incident Tracker"`). This is purely human-readable display text and will not break any internal program logic.
* **The SQLite File Name:** You can change the target database filename from `smart_complaints.db` to `campus_data.db` or `testing.db` in your local `.env` file. As long as it remains a valid filesystem path ending in `.db`, the database engine will create and use that file.
* **Adding New Operational Settings:** If your team later implements additional features (such as an email notification server, JWT authentication secret tokens, or allowed web origins for CORS), you can freely declare new attributes inside `class Settings` (e.g., `SECRET_KEY: str = "temporary-secret"`). Adding optional or defaulted attributes will never break existing code.

### 🔴 Strict Non-Negotiables (Must Remain Exact Across the Team):
* **The Attribute Names (`PROJECT_NAME`, `API_V1_STR`, `DATABASE_URL`):** Do NOT rename these variables to `APP_NAME`, `DB_PATH`, or `API_PREFIX`. Other files—most notably `app/core/database.py`—explicitly execute `settings.DATABASE_URL`. Renaming this attribute will cause an immediate `AttributeError: 'Settings' object has no attribute 'DATABASE_URL'` when any other module attempts to connect to the database.
* **The Exported Singleton Name (`settings`):** The instance at the bottom of the file must be named specifically `settings` (all lowercase): `settings = Settings()`. Every service, router, and test across the application imports this object using `from app.core.config import settings`.
* **The Extra Variable Policy (`extra = "ignore"`):** Do NOT change this to `"forbid"`. Setting it to `"forbid"` causes Pydantic to crash the instant it detects standard Windows or Linux environment variables like `PATH` or `USERNAME`.
* **The File Name and Directory Path (`backend/app/core/config.py`):** The file must live precisely at this path. Python's module import hierarchy relies on this exact package structure.

---

# 5. Architectural & Theoretical References

This specification operates strictly as an **implementation and integration blueprint**. For the exhaustive computer science fundamentals, language runtime mechanics, and protocol specifications governing this component, consult the following authoritative manuals in the **Developer Guide Suite**:

* [**Guide 01: Python Language and Runtime Mechanics**](../../../developer_guide/01_PYTHON_LANGUAGE_AND_RUNTIME_MECHANICS.md)  
  CPython execution loop, class models, metaclass allocation, memory pointers, and module import caching in `sys.modules`.

* [**Guide 03: Pydantic v2 & Data Contract Engineering**](../../../developer_guide/03_PYDANTIC_V2_DATA_VALIDATION_AND_SCHEMAS.md)  
  Rust `pydantic-core` parsing engine, type coercion, `BaseSettings`, and `.env` parsing mechanics.

* [**Unit 00B: Operating Systems, Processes & Concurrency Mechanics**](../../../developer_guide/00B_OPERATING_SYSTEMS_PROCESSES_AND_CONCURRENCY_MECHANICS.md)  
  Operating system environment variable inheritance, process address space, and system call interfaces.

---

# 6. Definition of Done: How to Verify This File Is Complete

This component is 100% complete and ready when the following conditions are verified:

1. **Physical File Existence:**
   * An environment file named `.env` exists in the `backend/` root directory containing at minimum `PROJECT_NAME` and `DATABASE_URL`.
   * A Python module named `config.py` exists precisely at `backend/app/core/config.py`.
2. **Schema & Class Integrity:**
   * The `Settings` class inherits directly from `BaseSettings`.
   * All three core configuration attributes (`PROJECT_NAME`, `API_V1_STR`, `DATABASE_URL`) are declared with explicit type annotations and fallback defaults.
   * The inner configuration explicitly links to `.env` using UTF-8 encoding and specifies `extra = "ignore"`.
3. **Singleton Export:**
   * An active instance of `Settings` is instantiated and exported under the exact identifier `settings`.
4. **Programmatic Verification:**
   * Executing an inline Python command in the terminal to import `settings` from `app.core.config` prints the project name and database URL cleanly without throwing `ValidationError`, `AttributeError`, or `FileNotFoundError`.
