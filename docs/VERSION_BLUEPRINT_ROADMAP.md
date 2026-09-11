# Realistic Multi-Version Engineering Blueprint: From Zero to Mid-Sem
## The Additive "Zero-Refactor" Roadmap for the Smart Complaint Handler

> **Mid-Sem Strategic Objective:**  
> You have only a few weeks until mid-semester evaluations. To deliver a working, impressive project without burning out, the project is divided into **4 realistic versions**:
> * **Version 1 (Days 1–5):** The Core Skeleton (Working Submission, Keyword Routing, Ticket Tracking, Admin Table).
> * **Version 2 (Days 6–12):** The AI & SLA Core (Gemini Structured Classification, Team Assignment, SLA Deadlines).  
>   *(By the end of V2, 100% of all required core project features are fully functional for Mid-Sem demo!)*
> * **Version 3 (Week 3):** Quality-of-Life (QoL) & Polish (Filters, Search, UI Toasts, Department Badges, CSV Export).
> * **Version 4 (Week 4 / Post-Mid-Sem):** Automation & Analytics (APScheduler Escalation Daemon, Resolution Metrics).
>
> **The Zero-Refactor Rule:** Every version is **additive**. You will never have to rip apart, alter, or rewrite existing working files to move from V1 to V2 or V3.

---

# Front Summary: Version Master Matrix

| Version | Milestone Name | Core Goal & Deliverables | Backend Changes | Frontend Changes | How to Demo to Professors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **V1** | **The Core Skeleton** *(Working MVP)* | Full-stack end-to-end working pipeline. Student submits complaint, receives tracking code, keyword engine assigns department, admin views & updates status. | • Pre-provisioned DB tables<br>• Keyword routing engine<br>• CRUD API endpoints | • Submission Form (`/`)<br>• Tracker Page (`/track`)<br>• Admin Table (`/admin`) | Submit "Water pipe leaking in Hostel B" ➔ Code `TICK-8492` generated ➔ Auto-routed to Plumbing ➔ Admin marks "In Progress". |
| **V2** | **AI Triage & SLA Engine** *(Basics Complete!)* | **Mid-Sem Finish Line!** Gemini AI structured extraction, automated team assignment, and SLA deadline calculation based on priority. | • `ai_routing_service.py`<br>• Rule-based fallback<br>• Team workload assigner<br>• SLA calculator | • AI analysis badge<br>• Priority tag display<br>• Team assignment chip | Submit vague/slang complaint ➔ Gemini predicts Electrical, Critical, Room 302 ➔ Assigns Team with lowest workload ➔ Sets 4h SLA deadline. |
| **V3** | **Quality-of-Life (QoL)** *(Polish & Usability)* | Search, filters, toast notifications, UI polish, and CSV export for college management reports. | • Query filters (`?dept=2&status=OPEN`)<br>• CSV export endpoint | • Search bar & dropdowns<br>• Toast alerts<br>• Mobile-responsive cards | Filter admin table by "Sanitation" and "Critical" ➔ Click "Export to CSV" ➔ File downloads instantly. |
| **V4** | **Automation Daemon** *(Final Showcase)* | APScheduler runs every 60s in background. Automatically detects overdue tickets and flags them as `ESCALATED`. | • APScheduler daemon<br>• Escalation state logic<br>• Audit logger | • Escalation alert banner<br>• Performance metrics chart | Advance system clock or create test ticket with past deadline ➔ Within 60 seconds, ticket badge automatically flips to RED `ESCALATED`. |

---

# The Engineering Secret: The "Additive Architecture" Pattern

First-year students usually fail multi-week projects because when they try to add "AI" or "SLA timers" in Week 2, they modify their Week 1 files, introduce 20 syntax bugs, and break their working demo right before the evaluation.

To prevent this, our architecture follows the **Open-Closed Principle**:
> **Software entities should be open for extension, but closed for modification.**

### Technical Terms Defined In-Place:
* **Additive Architecture:** A design methodology where new features are introduced by **adding new files** or **plugging into pre-made interface sockets**, rather than editing or rewriting existing working code.
* **Schema Pre-Provisioning:** Defining all database columns in Version 1 (even columns like `sla_deadline` or `ai_confidence` that won't be used until V2) with `nullable=True` or safe default values. This means you **never** have to migrate, delete, or re-create your database when upgrading versions.
* **Interface Adapter Pattern:** Writing code to call a generic function (e.g., `route_complaint()`). In V1, this function calls `keyword_matcher()`. In V2, we drop in `gemini_matcher()` without changing the route endpoint that called it.
* **Graceful Fallback:** If the internet drops or the Gemini API quota expires, the code automatically falls back to local keyword matching so the app never crashes during a live demo.

---

```
                       HOW ADDITIVE ARCHITECTURE WORKS:
 
        V1: Keyword Matcher ──┐
                              ▼
   API Route ──────> [ Routing Interface ] ─────> Database Model (Pre-Provisioned)
                              ▲                   (Has columns ready for V1, V2, V3, V4)
        V2: Gemini AI Engine ─┘
            (Added as a new file without touching the API Route!)
```

---

# Version 1: The Core Skeleton (Days 1 to 5)

### Objective:
Build a 100% functional, end-to-end full-stack complaint portal. It uses zero external AI APIs (so you never get blocked by API keys, internet issues, or quotas). 

### How It Works:
1. Student enters: *"Broken ceiling fan in Library 2nd floor"*.
2. The **Keyword Routing Engine** scans the text for keywords (`fan`, `light`, `wire`, `power` ➔ Electrical; `pipe`, `water`, `leak` ➔ Plumbing).
3. The system generates a human-friendly unique tracking code: `TICK-` followed by 4 random alphanumeric characters (e.g., `TICK-8F2D`).
4. Ticket is saved to SQLite with status `SUBMITTED`.
5. Student can open `/track?code=TICK-8F2D` and view their live status.
6. Department staff can open `/admin`, see the ticket in their table, and click buttons to change status to `IN_PROGRESS` or `RESOLVED`.

---

### File Architecture: What Gets Built in V1

#### Backend Files (Pre-Provisioned & Fully Functional):
1. `backend/app/core/config.py`: Reads settings (`DATABASE_URL`, `PROJECT_NAME`).
2. `backend/app/core/database.py`: SQLAlchemy database engine and `SessionLocal`.
3. `backend/app/db/base.py`: Declarative Base table registry.
4. `backend/app/models/department.py`: Pre-seeded table for campus departments.
5. `backend/app/models/ticket.py`: The master ticket table.
   * **The Pre-Provisioning Secret:** This file already contains `priority` (default `MEDIUM`), `assigned_team` (default `Unassigned`), `sla_deadline` (default `None`), and `ai_summary` (default `None`). Because they have defaults, V1 works immediately without needing these fields filled yet!
6. `backend/app/models/__init__.py`: Clean model aggregator.
7. `backend/app/db/seed_data.py`: Pre-populates 6 departments:
   * 1: Electrical
   * 2: Plumbing
   * 3: Sanitation
   * 4: Civil Maintenance
   * 5: IT Support
   * 6: General Administration (Default Fallback)
8. `backend/app/schemas/ticket.py`: Pydantic validation for incoming submissions.
9. `backend/app/services/keyword_router.py`: Fast, deterministic dictionary scanning keywords to assign department ID 1–6.
10. `backend/app/services/routing_service.py`: The routing gateway that calls `keyword_router`.
11. `backend/app/api/v1/endpoints/tickets.py`:
    * `POST /api/v1/tickets`: Ingests complaint, runs routing, returns tracking code.
    * `GET /api/v1/tickets/{tracking_code}`: Returns ticket details for student tracker.
    * `GET /api/v1/tickets`: Returns all tickets for staff admin dashboard.
    * `PATCH /api/v1/tickets/{id}/status`: Updates ticket status (`IN_PROGRESS`, `RESOLVED`).
12. `backend/main.py`: FastAPI application entry point with CORS enabled.

#### Frontend Files (Simple, Functional Tailwind Pages):
1. `frontend/src/App.jsx`: Sets up React Router DOM (`/`, `/track`, `/admin`).
2. `frontend/src/components/Navbar.jsx`: Top navigation header with college logo and links.
3. `frontend/src/pages/SubmitPage.jsx`: Form with Title, Description, Location, and Submit button. Displays modal with tracking code upon success.
4. `frontend/src/pages/TrackPage.jsx`: Search input for tracking code, displaying a 3-step progress bar (`Submitted` ➔ `In Progress` ➔ `Resolved`).
5. `frontend/src/pages/AdminPage.jsx`: Table displaying all tickets with dropdown or action buttons to update status.

---

### Technical Terms Defined In-Place:
* **CRUD (Create, Read, Update, Delete):** The four fundamental data operations supported by database applications. V1 implements Create (`POST`), Read (`GET`), and Update (`PATCH`).
* **Tracking Code:** A short, human-readable identifier (e.g., `TICK-8F2D`) generated using cryptographic randomness, indexed in the database so students don't have to memorize a raw database integer ID.
* **Deterministic Keyword Matching:** An algorithm that looks for exact substring matches in lowercase text (e.g., `if "leak" in text: return DEPT_PLUMBING`). It is fast (under 1ms) and 100% predictable.

---

# Version 2: AI Triage & SLA Engine (Days 6 to 12)
### ⭐ MID-SEM FINISH LINE (All Core Problem Requirements Fulfilled)

### Objective:
Upgrade the system to be genuinely "Smart" and automated using Google Gemini AI, rule-based priority scoring, team assignment, and SLA deadline calculations.

### How It Works (Without Changing V1 Files):
1. We add **one new backend file**: `backend/app/services/ai_router.py`.
2. Inside `backend/app/services/routing_service.py`, we add 4 lines of code:
   ```python
   # Try AI first; if API key missing or network fails, automatically fallback to V1 keyword matcher!
   result = ai_router.classify(text) or keyword_router.classify(text)
   ```
3. Gemini receives the complaint text and returns clean structured JSON:
   * Category / Department
   * Priority (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`)
   * Extracted specific location (e.g., *"Block C, Room 302"*)
4. The system calculates the **SLA Deadline** based on priority:
   * `CRITICAL` ➔ Resolution deadline = `Created Time + 4 Hours`
   * `HIGH` ➔ Resolution deadline = `Created Time + 12 Hours`
   * `MEDIUM` ➔ Resolution deadline = `Created Time + 24 Hours`
   * `LOW` ➔ Resolution deadline = `Created Time + 72 Hours`
5. The system queries available teams in that department and assigns the ticket to the team with the lowest number of currently active tickets.

---

### File Architecture: What Gets Added in V2

#### New Backend Files (Purely Additive):
1. `backend/app/services/ai_router.py` **[NEW]**:
   * Uses Google Gemini 2.5 Flash with `google-genai` SDK.
   * Locked to **Structured JSON Schema Mode** so it returns valid JSON matching our exact department list.
2. `backend/app/services/assignment_service.py` **[NEW]**:
   * Inspects active tickets in the assigned department and selects the worker/team with the lowest active load (e.g., *"Electrical Team 2"*).
3. `backend/app/services/sla_service.py` **[NEW]**:
   * Takes the priority string and calculates `sla_deadline = datetime.now() + timedelta(hours=X)`.
4. `backend/app/db/seed_teams.py` **[NEW]**:
   * Populates 2 teams per department (e.g., "Plumbing Team 1", "Plumbing Team 2").

#### Frontend Extensions (Non-Breaking Visual Enhancements):
1. `SubmitPage.jsx`: Displays an "AI Analyzing..." spinner for 1.5 seconds during submission.
2. `TrackPage.jsx`: Displays the calculated **Expected Resolution Deadline** (e.g., *"Expected by: Today, 6:00 PM"*) and Assigned Team.
3. `AdminPage.jsx`: Adds colorful Tailwind Priority Badges (`CRITICAL` = Red, `HIGH` = Orange, `MEDIUM` = Blue, `LOW` = Gray) and assigned team names.

---

### Technical Terms Defined In-Place:
* **SLA (Service Level Agreement):** The promised time window within which a complaint must be acknowledged and resolved.
* **Structured JSON Schema Mode:** An LLM capability where the AI's internal probability weights are mathematically restricted to emit only valid JSON conforming to an explicit schema provided in Python.
* **Graceful Degradation:** A software design principle where, if an advanced component fails (such as an external AI service), the application continues to operate safely at a lower level of capability (the V1 keyword matcher) rather than crashing.

---

# Version 3: Quality of Life (QoL) & Polish (Week 3)

### Objective:
Take the completed, working mid-sem application and make it look professional, responsive, and ready for institutional administration.

### How It Works:
* Department heads can now filter their dashboard by department, priority, or status.
* Users see instant toast notifications (animated popups in the corner) when actions succeed or fail.
* College administrators can export filtered ticket reports to CSV spreadsheets for committee meetings.

---

### File Architecture: What Gets Added in V3

#### Backend Files:
1. `backend/app/api/v1/endpoints/export.py` **[NEW]**:
   * Endpoint `GET /api/v1/tickets/export/csv` generates and streams a clean CSV file of all tickets directly to the browser.
2. `backend/app/api/v1/endpoints/tickets.py` *(Minor extension)*:
   * Adds optional query parameters to `GET /api/v1/tickets`:
     * `?department_id=1`
     * `?status=IN_PROGRESS`
     * `?priority=CRITICAL`

#### Frontend Files:
1. `frontend/src/components/Toast.jsx` **[NEW]**:
   * Non-intrusive popup notification ("Ticket #TICK-8F2D submitted successfully!").
2. `frontend/src/components/FilterBar.jsx` **[NEW]**:
   * Search input box and dropdown filters above the admin table.
3. `frontend/src/components/ExportButton.jsx` **[NEW]**:
   * "Download CSV Report" button that triggers the export endpoint.
4. Mobile layout adjustments using Tailwind breakpoints (`sm:`, `md:`, `lg:`).

---

### Technical Terms Defined In-Place:
* **QoL (Quality of Life):** Features in software that do not add new core functionality, but dramatically improve usability, workflow efficiency, visual comfort, and user satisfaction.
* **Query String / Query Parameters:** The part of a URL starting with `?` used to pass filtering parameters to an API (e.g., `?status=OPEN&dept=1`).
* **CSV (Comma-Separated Values):** A universal tabular data file format supported by Microsoft Excel, Google Sheets, and data analysis software.
* **Toast Notification:** A temporary, non-blocking UI alert that slides into the edge of the screen to confirm an action and automatically fades away after 3 seconds.

---

# Version 4: Automation & Advanced Workflow (Week 4 / Post-Mid-Sem)

### Objective:
Transform the system from an active administrative tool into a self-monitoring, automated workflow engine.

### How It Works:
* In previous versions, SLA deadlines were calculated and shown on screen, but a human had to notice if a deadline was missed.
* In V4, an in-process background daemon (**APScheduler**) wakes up every 60 seconds, inspects all tickets where `status != 'RESOLVED'`, and checks if `current_time > sla_deadline`.
* If a ticket has breached its deadline, the daemon automatically updates its status to `ESCALATED` and logs an escalation notice to the database.

---

### File Architecture: What Gets Added in V4

#### Backend Files:
1. `backend/app/core/scheduler.py` **[NEW]**:
   * Configures and starts APScheduler when FastAPI launches.
2. `backend/app/services/escalation_daemon.py` **[NEW]**:
   * Contains the exact job function:
     ```python
     def check_sla_breaches():
         # Finds tickets where sla_deadline < now and status != RESOLVED
         # Marks them ESCALATED and commits
     ```
3. `backend/app/models/audit_log.py` **[NEW]**:
   * An escalation history table recording when and why a ticket was escalated.

#### Frontend Files:
1. `frontend/src/components/EscalationBanner.jsx` **[NEW]**:
   * Displays a prominent pulsing amber/red alert at the top of the admin desk: *"⚠️ 3 Tickets have breached SLA deadlines and have been escalated to the Department Dean!"*
2. `frontend/src/pages/AnalyticsPage.jsx` **[NEW]**:
   * Visual cards showing: Total complaints, Average resolution time in hours, and Most frequent complaint categories.

---

### Technical Terms Defined In-Place:
* **In-Process Daemon:** A background thread running inside the same memory space as the web server, avoiding the complexity of running external Redis or Celery servers.
* **Escalation:** An automatic business workflow triggered when a service standard is breached, reassigning responsibility to a supervisor or higher authority.
* **Audit Log:** An immutable, chronological record of system events and state changes used for accountability and performance reviews.

---

# Realistic Student Implementation Timeline

Here is how your team can divide and conquer this roadmap over the remaining weeks leading to mid-sem:

```
[ WEEK 1: Days 1 to 5 ] ───> Complete Version 1.0 (Core Skeleton)
                             • Dev A: Backend database, models, seed data (Module B1)
                             • Dev B: API endpoints & keyword routing (Module B2, B3)
                             • Dev C: React submit form, tracker, and admin table (F1-F4)
                             • RESULT: A 100% working live demo. ZERO risk of failing.

[ WEEK 2: Days 6 to 12 ] ──> Complete Version 2.0 (AI Triage & SLA Engine)
                             • Dev A: Gemini AI integration with JSON schema mode
                             • Dev B: Team assignment & SLA deadline calculator
                             • Dev C: UI priority chips, SLA countdown, and AI status
                             • RESULT: Mid-sem requirements 100% complete! High scoring potential.

[ WEEK 3: Days 13 to 18 ] ─> Complete Version 3.0 (Quality of Life - QoL)
                             • Search bars, department filters, status tabs
                             • CSV download for college management
                             • Toast popups & mobile responsiveness

[ WEEK 4 / Final Prep ] ───> Complete Version 4.0 (Automation & Demo Rehearsal)
                             • APScheduler SLA breach daemon
                             • Escalation alert banner
                             • Live demo rehearsal with "Fast-Forward Clock" test script
```

---

# The "Fast-Forward" Live Demo Script for Professors

When presenting to professors or evaluators at mid-sem, follow this proven demonstration flow:

1. **Step 1 (The Normal Flow):**
   * Submit a clear complaint: *"Water pipe burst in Hostel B ground floor bathroom"*.
   * Point to the screen: show that Gemini AI categorized it as `Plumbing`, set priority to `HIGH`, assigned it to `Plumbing Team 1` (lowest workload), and set an SLA deadline for 12 hours from now.
   * Copy the tracking code `TICK-XXXX`.

2. **Step 2 (The Student Tracking Flow):**
   * Open `/track?code=TICK-XXXX`.
   * Show the student view: clear 3-step progress bar showing `Submitted`, expected resolution time, and assigned team.

3. **Step 3 (The Staff Admin Flow):**
   * Open `/admin`. Show the ticket listed in the Plumbing Department table.
   * Click "Start Work" ➔ Status changes to `IN_PROGRESS`.
   * Switch back to the student tab ➔ Refresh ➔ The progress bar has moved to Step 2!

4. **Step 4 (The SLA Escalation Demo - The Game Changer):**
   * Run your demo test script or submit a `CRITICAL` test ticket with an artificially short deadline (e.g. 10 seconds).
   * Show the screen: *"Watch what happens when the department fails to resolve this within the SLA deadline."*
   * 10 seconds later, the APScheduler daemon fires. The status badge automatically turns bright red: **`ESCALATED`**.
   * Evaluators love this because it proves you built a **closed-loop workflow system**, not just a basic form.
