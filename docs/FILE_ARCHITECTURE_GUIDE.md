# Full-Stack File Architecture Blueprint
## The Complete Directory Anatomy of the Smart Complaint Handler

> **Architecture Overview:**  
> This guide is an in-depth course reference for every file and folder in the `SmartComplaintHandler` project.  
> Every directory has a dedicated responsibility (Single Responsibility Principle), and every file is categorized by its **Milestone Version** (V1 Core, V2 AI/SLA, V3 QoL, V4 Automation) so your team can build progressively without refactoring.

---

# Front Summary: Master Directory Anatomy

```
SmartComplaintHandler/
│
├── backend/                             # Python 3.10+ / FastAPI Server
│   ├── .env.example                     # Sample environment variable template
│   ├── requirements.txt                 # Python dependencies list (FastAPI, SQLAlchemy 2.0, Pydantic V2)
│   └── app/
│       ├── __init__.py                  # Python package marker
│       ├── main.py                      # FastAPI application entry point & CORS configuration
│       │
│       ├── core/                        # Application configuration & singleton engines
│       │   ├── __init__.py
│       │   ├── config.py                # Environment configuration settings (DATABASE_URL, DEBUG)
│       │   ├── constants.py             # Global constants & system enums (Priority, Status)
│       │   └── database.py              # SQLAlchemy 2.0 SQLite engine (WAL Mode) & SessionLocal
│       │
│       ├── db/                          # Database connection & bootstrapping
│       │   ├── __init__.py
│       │   ├── base.py                  # SQLAlchemy Declarative Base re-export
│       │   └── seed.py                  # Campus departments & initial squads bootstrap seeder
│       │
│       ├── models/                      # Database Table Definitions (SQLAlchemy 2.0 ORM)
│       │   ├── __init__.py              # Model namespace aggregator
│       │   ├── base.py                  # DeclarativeBase registry
│       │   ├── department.py            # "departments" table schema
│       │   ├── team.py                  # "maintenance_teams" table schema (workload queues)
│       │   └── ticket.py                # "tickets" table schema (closed-loop container)
│       │
│       ├── schemas/                     # Data Validation Blueprints (Pydantic V2 DTOs)
│       │   ├── __init__.py
│       │   ├── complaint.py             # ComplaintCreate & ComplaintResponse DTOs
│       │   ├── priority.py              # TriagePreview & PriorityOverride DTOs
│       │   ├── assignment.py            # TeamWorkloadResponse & ReassignTeamRequest DTOs
│       │   └── sla.py                   # StatusUpdateRequest, TicketResolveRequest, SLABreachResponse
│       │
│       ├── services/                    # Business Logic Engines & Orchestrators
│       │   ├── __init__.py
│       │   ├── keyword_router.py        # M2 rule-based dictionary keyword scanner
│       │   ├── ticket_service.py        # Core complaint creation, status & resolution orchestrator
│       │   ├── priority_engine.py       # M3 deterministic priority scoring engine (CRITICAL..LOW)
│       │   ├── classifier.py            # M3 5-domain taxonomy classifier & conflict resolver
│       │   ├── dispatch_engine.py       # M4 least-loaded queue balancing algorithm
│       │   ├── team_service.py          # M4 squad workload aggregation & reassignment service
│       │   ├── sla_engine.py            # M5 SLA deadline calculator (4h, 12h, 24h, 72h)
│       │   └── lifecycle.py             # M5 finite state automata lifecycle validator
│       │
│       ├── utils/                       # Shared Pure Utility Functions
│       │   ├── __init__.py
│       │   └── code_generator.py        # CSPRNG collision-resistant ticket code generator (TICK-XXXX)
│       │
│       └── api/                         # HTTP Transport & REST Controllers
│           ├── __init__.py
│           ├── deps.py                  # FastAPI dependency injection (get_db)
│           └── v1/
│               ├── __init__.py
│               ├── router.py            # Master V1 API router aggregator (/api/v1)
│               └── endpoints/
│                   ├── __init__.py
│                   ├── complaints.py    # Public submission (POST) and tracking (GET)
│                   ├── priority.py      # Live triage preview & supervisor priority overrides
│                   ├── assignment.py    # Squad workloads & ticket reassignment
│                   └── sla.py           # Status transitions, ticket resolution & breach alerts
│
└── frontend/                            # React 18 / Vite / Tailwind CSS Client
    ├── .env.example                     # Frontend environment variables (VITE_API_BASE_URL)
    ├── package.json                     # Node.js dependencies & scripts (React 18, Vite, Tailwind, Axios)
    ├── index.html                       # Single HTML entry point for the SPA
    ├── vite.config.js                   # Vite dev server with reverse proxy (/api -> :8000)
    ├── tailwind.config.js               # Tailwind design tokens & hazard color theme
    ├── postcss.config.js                # CSS processor configuration
    │
    └── src/
        ├── main.jsx                     # React root DOM mount point
        ├── App.jsx                      # Client root wrapper rendering AppRouter
        ├── styles/
        │   └── globals.css              # Tailwind base directives & global styles
        │
        ├── api/                         # Encapsulated HTTP Transport Modules (Axios)
        │   ├── client.js                # Base Axios instance with interceptors & baseURL
        │   ├── complaints.js            # Complaint submission & tracking API calls
        │   ├── triage.js                # Live preview & priority override API calls
        │   ├── assignment.js            # Squad workload & reassignment API calls
        │   └── sla.js                   # Status mutation, resolution notes & breach queries
        │
        ├── router/                      # Client-Side Navigation
        │   └── AppRouter.jsx            # React Router DOM configuration (/submit, /track, /admin)
        │
        ├── components/                  # Reusable Functional UI Components
        │   ├── Layout.jsx               # Persistent full-page shell (Navbar + Page + Footer)
        │   ├── Navbar.jsx               # Top navigation bar with active route highlighting
        │   ├── Footer.jsx               # Persistent bottom footer with campus emergency info
        │   ├── SubmissionSuccessModal.jsx # Modal displaying TICK-XXXX with 1-click copy
        │   ├── PriorityBadge.jsx        # Atomic colored priority chip (CRITICAL pulsing red, etc.)
        │   ├── LiveTriageCard.jsx       # 500ms debounced live feedback card
        │   ├── PriorityOverrideModal.jsx# Supervisor dialog with 5-character reason guard
        │   ├── TeamWorkloadView.jsx     # 4-column responsive grid of squad workload meters
        │   ├── ReassignTeamModal.jsx    # Administrative squad reassignment dialog
        │   ├── SLACountdownTimer.jsx    # Ticking countdown timer pill with color shifting
        │   ├── ResolutionNotesModal.jsx # Staff closure modal requiring 10-char repair notes
        │   └── SLABreachTable.jsx       # High-visibility administrative escalation panel
        │
        └── pages/                       # Full-Screen Page Views
            ├── SubmitComplaint.jsx      # Route "/submit" - Student intake form with live triage
            ├── TrackTicket.jsx          # Route "/track" - Public lookup with 3-step progress stepper
            └── AdminDashboard.jsx       # Route "/admin" - Facility staff operations desk
```

---

# Backend Architecture (Layer-by-Layer Breakdown)

### 1. Root Configuration Files

#### `backend/requirements.txt` *(Version 1)*
* **What it is:** A standard text file listing all third-party Python packages required to run our backend.
* **What it actually does:** When you execute `pip install -r requirements.txt`, the Python package manager downloads and installs libraries like FastAPI, Uvicorn, SQLAlchemy, and Pydantic into your virtual environment.
* **In-Place Definition:**  
  * **Virtual Environment (`.venv`):** An isolated folder on your laptop containing a dedicated Python interpreter and installed packages, preventing conflicts with other projects on your computer.

#### `backend/.env.example` *(Version 1)*
* **What it is:** A template showing which environment variables the backend requires (e.g., `DATABASE_URL=sqlite:///./smart_complaints.db`, `GEMINI_API_KEY=your_key_here`).
* **What it actually does:** Serves as a guide for developers to create their local `.env` file without committing private passwords or secret API keys to Git.

---

### 2. The Application Entrypoint & Core (`backend/app/core/`)

#### `backend/app/main.py` *(Version 1)*
* **What it is:** The primary entry file of the backend application.
* **What it actually does:** Creates the FastAPI application instance, configures CORS middleware (allowing the React frontend on port 5173 to communicate with port 8000), includes the API routers, and initializes the database tables on startup.
* **In-Place Definition:**  
  * **Application Instance:** The central Python object that orchestrates routes, middleware, and request lifecycles.

#### `backend/app/core/config.py` *(Version 1)*
* **What it is:** The centralized configuration manager using Pydantic's `BaseSettings`.
* **What it actually does:** Automatically reads values from the operating system or `.env` file, validates that database connection URLs are correctly formatted, and provides typed configuration objects across the codebase.

#### `backend/app/core/constants.py` *(Version 1)*
* **What it is:** A file holding immutable system enums and fixed values.
* **What it actually does:** Defines ticket statuses (`SUBMITTED`, `IN_PROGRESS`, `RESOLVED`, `ESCALATED`) and priority levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) as Python `Enum` classes, preventing accidental spelling errors across different files.
* **In-Place Definition:**  
  * **Enum (Enumeration):** A special data type that restricts a variable to only one value out of a predefined list of allowed constant strings.

#### `backend/app/core/database.py` *(Version 1)*
* **What it is:** The database connection engine.
* **What it actually does:** Initializes the SQLAlchemy `Engine` that communicates with the `smart_complaints.db` file and defines `SessionLocal`, the factory that spawns database sessions for incoming API requests.

#### `backend/app/core/scheduler.py` *(Version 4)*
* **What it is:** The background automation configuration.
* **What it actually does:** Configures `APScheduler` to run inside the FastAPI process, setting up a background daemon thread that runs periodic maintenance tasks without blocking web requests.

---

### 3. Database Layer (`backend/app/db/` & `backend/app/models/`)

#### `backend/app/db/base.py` *(Version 1)*
* **What it is:** The master table registry.
* **What it actually does:** Creates SQLAlchemy's `Base` class. When `Base.metadata.create_all(bind=engine)` is called, SQLAlchemy scans all model classes that inherit from `Base` and automatically creates their SQL tables on disk.

#### `backend/app/db/seed_data.py` *(Version 1)*
* **What it is:** The initial database bootstrap script.
* **What it actually does:** Checks if the `departments` table is empty. If empty, it inserts the 6 primary campus departments (Electrical, Plumbing, Sanitation, Civil, IT, General) so the system works immediately.
* **In-Place Definition:**  
  * **Database Seeding:** The automated process of populating a fresh database with initial default data required for an application to function properly.

#### `backend/app/models/department.py` *(Version 1)*
* **What it is:** The database model for campus departments.
* **What it actually does:** Defines the `departments` SQL table with columns: `id`, `name`, `description`, and `is_active`.

#### `backend/app/models/ticket.py` *(Version 1 - Pre-Provisioned)*
* **What it is:** The master database model for student complaints.
* **What it actually does:** Defines the `tickets` SQL table with columns: `id`, `tracking_code`, `title`, `description`, `location`, `department_id`, `status`, `priority`, `assigned_team`, `sla_deadline`, `created_at`, `updated_at`, and `resolved_at`.
* **The Zero-Refactor Role:** Pre-provisioning columns with default values ensures you never have to alter this table schema when upgrading from V1 to V2 or V4.

#### `backend/app/models/audit_log.py` *(Version 4)*
* **What it is:** The historical event log model.
* **What it actually does:** Defines the `audit_logs` table that records whenever an overdue ticket is automatically marked as `ESCALATED` by the background daemon.

---

### 4. Data Validation Schemas (`backend/app/schemas/`)

#### Difference Between Models and Schemas Explained In-Place:
* **Models (`app/models/`):** Define how data is physically stored in tables on the hard drive (SQLAlchemy).
* **Schemas (`app/schemas/`):** Define how data enters and leaves the API across the network over HTTP (Pydantic). They protect the database from malicious or malformed inputs.

#### `backend/app/schemas/ticket.py` *(Version 1)*
* **What it actually does:**
  * `TicketCreate`: Validates student inputs (`title` length, non-empty `description`, valid `location`).
  * `TicketUpdate`: Validates status changes submitted by staff.
  * `TicketResponse`: Dictates the JSON structure returned to the frontend (including generated IDs and timestamps).

---

### 5. The Business Logic Services (`backend/app/services/`)

#### Why have a `services/` directory?
Putting database queries and calculations directly inside API route functions makes code messy and untestable. The `services/` layer houses pure business logic, independent of the HTTP protocol.

#### `backend/app/services/code_generator.py` *(Version 1)*
* **What it does:** Generates unique, memorable tracking codes using cryptographic randomness (e.g., `TICK-8F2D`).

#### `backend/app/services/keyword_router.py` *(Version 1)*
* **What it does:** Scans complaint text for specific keywords and assigns department ID 1–6 deterministically in under 1 millisecond.

#### `backend/app/services/ticket_service.py` *(Version 1)*
* **What it does:** Coordinates creating new tickets in the database, querying tickets by tracking code, filtering tickets by status, and saving resolution notes.

#### `backend/app/services/ai_router.py` *(Version 2)*
* **What it does:** Calls the Google Gemini 2.5 Flash model with Structured JSON Mode to classify natural language complaints into department, priority, and location.

#### `backend/app/services/assignment_service.py` *(Version 2)*
* **What it does:** Inspects active tickets per team and assigns incoming complaints to the worker/team with the lowest current workload.

#### `backend/app/services/sla_service.py` *(Version 2)*
* **What it does:** Calculates the exact target deadline timestamp (`sla_deadline`) based on ticket priority (Critical = 4h, High = 12h, Medium = 24h, Low = 72h).

#### `backend/app/services/escalation_daemon.py` *(Version 4)*
* **What it does:** The job executed every 60 seconds by the scheduler. Finds unresolved tickets whose `sla_deadline` has passed, transitions them to `ESCALATED`, and creates an audit record.

---

### 6. API Controllers & Routes (`backend/app/api/`)

#### `backend/app/api/deps.py` *(Version 1)*
* **What it does:** Provides the `get_db` generator function used by FastAPI's `Depends()` system. It creates a database session when an HTTP request arrives and guarantees the session is safely closed after the response is sent.

#### `backend/app/api/v1/endpoints/tickets.py` *(Version 1)*
* **What it does:** Contains the HTTP endpoints:
  * `POST /api/v1/tickets`: Ingests complaint and returns tracking code.
  * `GET /api/v1/tickets/{tracking_code}`: Look up a single ticket.
  * `GET /api/v1/tickets`: List all tickets for staff dashboard.
  * `PATCH /api/v1/tickets/{id}/status`: Update ticket status.

#### `backend/app/api/v1/endpoints/export.py` *(Version 3)*
* **What it does:** Endpoint `GET /api/v1/tickets/export/csv` that streams a CSV spreadsheet of complaint records directly to the browser.

---

# Frontend Architecture (Layer-by-Layer Breakdown)

### 1. Root Configuration Files

#### `frontend/package.json` *(Version 1)*
* **What it is:** The project manifest for Node.js.
* **What it actually does:** Lists frontend dependencies (`react`, `react-dom`, `react-router-dom`, `lucide-react`, `tailwindcss`) and defines scripts like `npm run dev` and `npm run build`.

#### `frontend/index.html` *(Version 1)*
* **What it is:** The single HTML page of our Single-Page Application (SPA).
* **What it actually does:** Contains `<div id="root"></div>` where React mounts the entire visual application, and includes `<script type="module" src="/src/main.jsx"></script>`.

#### `frontend/vite.config.js` *(Version 1)*
* **What it is:** Configuration file for Vite.
* **What it actually does:** Configures the React plugin, sets up development server proxying (so frontend requests to `/api` route to `localhost:8000`), and controls build bundling.

#### `frontend/tailwind.config.js` & `postcss.config.js` *(Version 1)*
* **What it actually does:** Instructs Tailwind to scan all `.jsx` files in `src/` for class names and configures custom theme colors (e.g., campus branding, status badge colors).

---

### 2. Application Entry & Styling (`frontend/src/`)

#### `frontend/src/main.jsx` *(Version 1)*
* **What it does:** The JavaScript entry point. Uses `ReactDOM.createRoot()` to mount the `<App />` component into the `root` element of `index.html`.

#### `frontend/src/App.jsx` *(Version 1)*
* **What it does:** Configures client-side routing using `react-router-dom`. It determines which page component to display based on the URL (`/`, `/track`, `/admin`, `/analytics`).

#### `frontend/src/styles/globals.css` *(Version 1)*
* **What it does:** Imports Tailwind's base layer directives (`@tailwind base;`, `@tailwind components;`, `@tailwind utilities;`) and sets global fonts and background colors.

#### `frontend/src/services/api.js` *(Version 1)*
* **What it does:** Centralizes network communication. Contains helper functions (`createTicket`, `getTicketByCode`, `listTickets`, `updateTicketStatus`) that wrap the browser's `fetch()` API with error handling and JSON serialization.

---

### 3. Components (`frontend/src/components/`)

#### Layout Components (`components/layout/`):
* `Navbar.jsx`: Top navigation banner with college branding, links to Submit, Track, and Admin pages, and status indicators.
* `Footer.jsx`: Bottom footer with helpline contact info and system version badge.
* `Layout.jsx`: The visual wrapper that sandwiches any active page between the Navbar and Footer.

#### UI Primitives (`components/ui/`):
* `Button.jsx`: Standardized clickable button with variants (primary, secondary, danger) and spinner loading states.
* `Input.jsx` & `Textarea.jsx`: Form inputs with integrated labels, placeholders, and validation error messages.
* `Card.jsx`: Reusable container with border, white background, and rounded corners.
* `StatusBadge.jsx`: Pill-shaped badge with dynamic colors:
  * `SUBMITTED`: Blue
  * `IN_PROGRESS`: Amber
  * `RESOLVED`: Green
  * `ESCALATED`: Red
* `Toast.jsx` *(Version 3)*: Animated popup alert confirming actions (e.g., *"Status updated to Resolved"*).
* `ExportButton.jsx` *(Version 3)*: Button that initiates CSV spreadsheet download.

#### Forms & Tracker Components:
* `ComplaintForm.jsx`: Captures title, description, and location with real-time validation.
* `SuccessModal.jsx`: Modal popup celebrating ticket submission and displaying the copyable tracking code.
* `SearchBar.jsx`: Input field allowing students to enter their tracking code (`TICK-XXXX`).
* `ProgressBar.jsx`: Visual 3-step progress track showing where the ticket is in its resolution lifecycle.
* `DetailsCard.jsx`: Shows complaint metadata, assigned department, SLA deadline, and resolution notes.

#### Admin Desk Components (`components/admin/`):
* `TicketTable.jsx`: Clean data table listing all tickets with status dropdowns, priority badges, and action buttons.
* `SummaryCards.jsx`: Metric boxes showing counts of Open, In Progress, and Resolved complaints.
* `ResolveModal.jsx`: Dialog box prompting staff to enter resolution notes before marking a ticket `RESOLVED`.
* `FilterBar.jsx` *(Version 3)*: Search bar and dropdowns to filter tickets by department or urgency.
* `EscalationBanner.jsx` *(Version 4)*: Flashing alert banner notifying staff when tickets breach SLA deadlines.

---

### 4. Page Views (`frontend/src/pages/`)

* `SubmitPage.jsx`: The student-facing complaint submission portal (`/`).
* `TrackPage.jsx`: The student-facing live status tracking page (`/track`).
* `AdminPage.jsx`: The campus department staff operations dashboard (`/admin`).
* `AnalyticsPage.jsx` *(Version 4)*: Statistical overview with resolution times and category breakdowns (`/analytics`).
* `NotFoundPage.jsx`: Catch-all 404 page for invalid URLs (`*`).
