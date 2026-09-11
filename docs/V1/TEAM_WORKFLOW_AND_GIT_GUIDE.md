# Team Workflow & Beginner Git Collaboration Guide
## Simultaneous File Matrix & Everyday Git Branching Guide for the Team

> **Operational Purpose:**  
> This guide provides the practical collaboration framework for the student engineering team building `SmartComplaintHandler`.  
> It directly answers:
> 1. **"Which files can we work on at the exact same time without colliding or blocking each other?"**  
> 2. **"How do we use Git day-to-day with a `main` branch, a `develop` branch, and personal branches for each team member?"**  
> 3. **"What does each Git command actually do under the hood, step-by-step, with every flag and argument explained?"**  
> 
> All technical terms are defined in-line directly where they appear.

---

# Part 1: Simultaneous vs. Sequential File Matrix (What Can Be Worked on in Parallel)

In software development, two developers can work on separate files **at the exact same time** if those files do not edit the same lines of code and do not require the other file to run immediately.

Below is the complete breakdown across Modules M1 through M5, divided into three clear operational groups:

---

### Group 1: Files That Can Be Worked On Simultaneously Right From the Start
These files have **zero dependencies** on other new code. Multiple team members can open their code editors and write these files in parallel on Day 1 without waiting for anyone:

| Layer | Blueprint File | Target Source File | What It Does | Why It Can Be Built In Parallel |
| :--- | :--- | :--- | :--- | :--- |
| **Backend** | `V1/M1/backend/01_config_and_env.md` | `backend/app/core/config.py` | Loads environment variables (`DATABASE_URL`, `DEBUG`). | Independent settings file; depends only on `pydantic-settings`. |
| **Backend** | `V1/M1/backend/02_sqlite_engine.md` | `backend/app/core/database.py` | Creates SQLite engine and sessionmaker. | Depends only on SQLAlchemy and `config.py`. |
| **Backend** | `V1/M1/backend/03_declarative_base.md` | `backend/app/models/base.py` | Defines declarative base class for tables. | Pure SQLAlchemy base class; zero external logic. |
| **Backend** | `V1/M2/backend/01_code_generator.md` | `backend/app/utils/code_generator.py` | Generates random ticket codes (`TICK-XXXX`). | Pure Python utility function using `secrets` and `string`. |
| **Backend** | `V1/M2/backend/02_keyword_router.md` | `backend/app/services/keyword_router.py` | Scans text for keywords to detect department. | Pure dictionary-based keyword matching algorithm. |
| **Backend** | `V1/M2/backend/03_complaint_schemas.md` | `backend/app/schemas/complaint.py` | Pydantic validation schemas (`ComplaintCreate`). | Pure Pydantic data contract; needs no database connection. |
| **Backend** | `V1/M3/backend/01_priority_engine.md` | `backend/app/services/priority_engine.py` | Scans emergency keywords to calculate priority. | Pure heuristic scoring function; zero database dependencies. |
| **Backend** | `V1/M3/backend/02_classifier_engine.md` | `backend/app/services/classifier.py` | 5-domain keyword taxonomy classifier. | Pure text classification utility. |
| **Backend** | `V1/M3/backend/03_priority_schemas.md` | `backend/app/schemas/priority.py` | Pydantic DTOs for priority and overrides. | Pure validation schemas. |
| **Backend** | `V1/M4/backend/01_dispatch_engine.md` | `backend/app/services/dispatch_engine.py` | Finds the squad with the lowest active tickets. | Pure list-sorting / queue balancing algorithm. |
| **Backend** | `V1/M4/backend/02_assignment_schemas.md` | `backend/app/schemas/assignment.py` | Pydantic schemas for squad reassignment. | Pure validation schemas. |
| **Backend** | `V1/M5/backend/01_sla_engine.md` | `backend/app/services/sla_engine.py` | Calculates SLA deadlines from priority. | Pure date/time arithmetic function (`timedelta`). |
| **Backend** | `V1/M5/backend/02_lifecycle_state_machine.md` | `backend/app/services/lifecycle.py` | State machine transitions (`SUBMITTED` -> `IN_PROGRESS` -> `RESOLVED`). | Pure transition dictionary logic with validation checks. |
| **Backend** | `V1/M5/backend/03_sla_schemas.md` | `backend/app/schemas/sla.py` | Pydantic schemas for status updates and notes. | Pure validation schemas. |
| **Frontend** | `V1/M1/frontend/01_vite_tailwind_config.md` | `vite.config.js`, `tailwind.config.js` | Configures Vite proxy (`:5173` to `:8000`) and Tailwind. | Frontend build configuration; zero backend dependencies. |
| **Frontend** | `V1/M1/frontend/02_base_api_client.md` | `frontend/src/api/client.js` | Configures Axios instance with base URL. | Generic HTTP wrapper file. |
| **Frontend** | `V1/M1/frontend/03_layout_and_navigation.md` | `Layout.jsx`, `Navbar.jsx`, `Footer.jsx` | Header, navigation bar, and page container shell. | Pure UI presentation components. |
| **Frontend** | `V1/M1/frontend/04_app_router.md` | `frontend/src/router/AppRouter.jsx` | Configures React Router route paths. | Pure routing configuration. |
| **Frontend** | `V1/M2/frontend/02_submit_complaint_page.md` | `frontend/src/pages/SubmitComplaint.jsx` | Form with inputs for title, description, location. | Uses React state; can test with mock submit handler. |
| **Frontend** | `V1/M2/frontend/03_submission_success_modal.md` | `SubmissionSuccessModal.jsx` | Popup showing generated tracking code with copy button. | Pure UI modal component driven by React props. |
| **Frontend** | `V1/M2/frontend/04_track_ticket_page.md` | `frontend/src/pages/TrackTicket.jsx` | Search box and 3-step visual progress bar. | Pure UI component; testable with mock ticket data. |
| **Frontend** | `V1/M3/frontend/02_priority_badge.md` | `frontend/src/components/PriorityBadge.jsx` | Color-coded badge pills (red for CRITICAL, green for LOW). | Pure atomic UI component. |
| **Frontend** | `V1/M3/frontend/03_live_triage_card.md` | `frontend/src/components/LiveTriageCard.jsx` | Live feedback card showing detected priority. | Presentation card component. |
| **Frontend** | `V1/M4/frontend/03_team_workload_panel.md` | `frontend/src/components/TeamWorkloadView.jsx` | Responsive grid of squad cards and workload meters. | Presentation grid component. |
| **Frontend** | `V1/M5/frontend/02_sla_countdown_timer.md` | `frontend/src/components/SLACountdownTimer.jsx` | Ticking countdown timer badge (green, amber, red). | Independent timer component using `setInterval`. |

---

### Group 2: Files That Depend on Group 1 (Sequential Phase 2)
Once the database models, utility engines, and schemas from Group 1 exist, team members can work on these files simultaneously:

| Layer | Blueprint File | Target Source File | What It Does | Prerequisite It Waits For |
| :--- | :--- | :--- | :--- | :--- |
| **Backend** | `V1/M1/backend/04_department_model.md` | `models/department.py` | SQLAlchemy table for Departments. | Waits for `models/base.py` (Group 1). |
| **Backend** | `V1/M1/backend/05_team_model.md` | `models/team.py` | SQLAlchemy table for Maintenance Teams. | Waits for `models/department.py`. |
| **Backend** | `V1/M1/backend/06_ticket_model.md` | `models/ticket.py` | SQLAlchemy table for Tickets. | Waits for Department and Team models. |
| **Backend** | `V1/M1/backend/07_seed_data.md` | `backend/app/db/seed.py` | Populates default departments and squads. | Waits for all three ORM models to be created. |
| **Backend** | `V1/M1/backend/08_database_session_dep.md`| `backend/app/api/deps.py` | FastAPI `get_db` dependency. | Waits for `database.py` sessionmaker. |
| **Backend** | `V1/M2/backend/04_ticket_service.md` | `backend/app/services/ticket_service.py` | Core complaint creation and storage logic. | Waits for Ticket model and keyword router. |
| **Backend** | `V1/M4/backend/03_team_service.md` | `backend/app/services/team_service.py` | Calculates active ticket count per squad. | Waits for Ticket and Team models. |
| **Frontend** | `V1/M2/frontend/01_complaints_api_client.md` | `frontend/src/api/complaints.js` | Calls backend `POST /tickets` and `GET /tickets/{code}`. | Waits for `api/client.js` (Group 1). |
| **Frontend** | `V1/M3/frontend/01_triage_api_client.md` | `frontend/src/api/triage.js` | Calls `POST /triage-preview`. | Waits for `api/client.js`. |
| **Frontend** | `V1/M4/frontend/01_assignment_api_client.md` | `frontend/src/api/assignment.js` | Calls `GET /teams/workloads` and `PATCH /reassign`. | Waits for `api/client.js`. |
| **Frontend** | `V1/M5/frontend/01_sla_api_client.md` | `frontend/src/api/sla.js` | Calls `PATCH /status` and `POST /resolve`. | Waits for `api/client.js`. |

---

### Group 3: Integration & Wiring Files (Sequential Phase 3)
These are the files where individual components are plugged together into the main application. Edit these only when the underlying services and endpoints are written:

| Layer | Blueprint File | Target Source File | What It Does |
| :--- | :--- | :--- | :--- |
| **Backend** | `V1/M2/backend/05_complaint_endpoints.md` | `backend/app/api/v1/endpoints/complaints.py` | REST API routes for complaint intake and lookup. |
| **Backend** | `V1/M3/backend/05_priority_endpoints.md` | `backend/app/api/v1/endpoints/priority.py` | REST API routes for triage preview and priority overrides. |
| **Backend** | `V1/M4/backend/05_assignment_endpoints.md` | `backend/app/api/v1/endpoints/assignment.py`| REST API routes for squad workloads and reassignment. |
| **Backend** | `V1/M5/backend/05_sla_endpoints.md` | `backend/app/api/v1/endpoints/sla.py` | REST API routes for status updates and ticket resolution. |
| **Backend** | Router updates (`06_api_router_update.md`) | `backend/app/api/v1/router.py` | Includes all endpoint routers into the central `/api/v1` router. |
| **Backend** | `V1/M1/backend/09_fastapi_app.md` | `backend/app/main.py` | Mounts CORS, lifespan startup seed, and root router. |
| **Frontend** | `V1/M4/frontend/02_admin_dashboard_page.md` | `frontend/src/pages/AdminDashboard.jsx` | Unifies ticket tables, priority badges, and reassign modals. |
| **Full Stack**| All Verification Files (`07_verification...`) | Shell / Terminal verification commands | Running automated requests to verify the complete flow. |

---

# Part 2: Zero-Blocking Coordination with Mock Data

To make sure **frontend developers do not sit idle** while backend APIs are being developed, frontend developers should use mock JavaScript objects. 

This means frontend components can be styled, tested, and completed immediately using fake data that exactly matches what the backend will later return:

### 1. Mock Data for Complaint Submission (`POST /api/v1/tickets`)
Put this inside `frontend/src/api/complaints.js` temporarily:
```javascript
export const mockSubmitTicketResponse = {
  id: 1,
  tracking_code: "TICK-8F2D",
  title: "Water pipe leaking in Hostel B",
  description: "Flooding the second floor corridor near room 204",
  location: "Hostel B, 2nd Floor",
  department_name: "Plumbing & Water Services",
  priority: "HIGH",
  assigned_team_name: "Plumbing Rapid Response",
  status: "SUBMITTED",
  sla_deadline: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
  created_at: new Date().toISOString()
};
```

### 2. Mock Data for Ticket Tracking (`GET /api/v1/tickets/TICK-8F2D`)
Use this inside `TrackTicket.jsx` to test all 3 steps of the progress bar:
```javascript
export const mockTrackTicketData = {
  tracking_code: "TICK-8F2D",
  title: "Water pipe leaking in Hostel B",
  status: "IN_PROGRESS", // Change to "SUBMITTED" or "RESOLVED" to test other steps
  priority: "HIGH",
  department_name: "Plumbing & Water Services",
  assigned_team_name: "Plumbing Rapid Response",
  created_at: "2026-09-11T10:00:00Z",
  sla_deadline: "2026-09-11T22:00:00Z",
  resolution_notes: null
};
```

### 3. Mock Data for Team Workloads (`GET /api/v1/teams/workloads`)
Use this inside `TeamWorkloadView.jsx` to test squad cards:
```javascript
export const mockTeamWorkloads = [
  { team_id: 1, team_name: "Plumbing Squad 1", department_name: "Plumbing", active_ticket_count: 4 },
  { team_id: 2, team_name: "Plumbing Squad 2", department_name: "Plumbing", active_ticket_count: 1 },
  { team_id: 3, team_name: "Electrical Squad A", department_name: "Electrical", active_ticket_count: 3 },
  { team_id: 4, team_name: "Carpentry Team", department_name: "Carpentry", active_ticket_count: 0 }
];
```

*When the backend developer finishes the actual endpoint, the frontend developer simply removes the mock data and lets Axios make the real HTTP call. Everything connects instantly without rewrites.*

---

# Part 3: The Standard Branching Strategy: `main`, `develop`, and Personal Branches

To prevent team members from accidentally overwriting or deleting each other's work, the repository must use a **three-tier branch structure**:

```
[ main ]          <-- STABLE / FINAL DEMO (Nobody commits directly here)
   ▲
   │ (Merge only when a full module is tested and working)
   │
[ develop ]       <-- TEAM INTEGRATION BRANCH (Everyone merges their finished work here)
   ▲
   ├── [ dev-person1 ]  <-- Person 1's private workspace
   ├── [ dev-person2 ]  <-- Person 2's private workspace
   ├── [ dev-person3 ]  <-- Person 3's private workspace
   ├── [ dev-person4 ]  <-- Person 4's private workspace
   └── [ dev-person5 ]  <-- Person 5's private workspace
```

### Definitions of Core Terms:
* **Repository (Repo):** The project folder tracked by Git that contains all project files and the complete history of every change made.
* **Branch:** An independent line of development. A branch in Git is simply a lightweight, movable pointer to a specific commit. Making changes on your branch does not alter any other branch until you explicitly merge.
* **`main` Branch:** The production branch. It contains only clean, tested, working code meant for presentation to professors. **Never write code directly on `main`.**
* **`develop` Branch:** The shared team integration branch. When a team member finishes a feature on their personal branch, they merge it into `develop`.
* **Personal / Feature Branch:** A private branch created by an individual team member (e.g. `dev-rahul`, `feature-complaint-form`). You do all your daily work here.

---

# Part 4: In-Depth Git Commands Guide: Exactly What Each Command Does

This section explains **every single Git command** used by the team. For each command, we break down:
1. **Command Syntax & Anatomy** (what each word and flag means).
2. **Under-the-Hood Mechanism** (what Git actually changes on your disk and in memory).
3. **Screen Output** (what terminal text appears upon success).
4. **When & Why to Run It** (practical scenario).
5. **Common Mistakes & What to Avoid**.

---

### Command 1: `git clone <repository-url>`

```bash
git clone https://github.com/YourTeamAccount/SmartComplaintHandler.git
```

#### 1. Anatomy of the Command:
* `git`: Invokes the Git executable program installed on your operating system.
* `clone`: The specific sub-command instructing Git to create an exact, complete duplicate of an existing repository.
* `https://github.com/YourTeamAccount/SmartComplaintHandler.git`: The remote URL location of the project on GitHub.

#### 2. What Happens Under the Hood:
* Git creates a new directory on your local disk named `SmartComplaintHandler`.
* Git establishes an encrypted HTTPS network connection to GitHub's servers and downloads the entire `.git` folder, including every commit, branch pointer, and file version in project history.
* Git automatically configures a remote pointer named `origin`, mapping `origin` to `https://github.com/YourTeamAccount/SmartComplaintHandler.git`.
* Git checks out the default branch (usually `main`) into your Working Directory (the visible project folder on your computer).

#### 3. What Appears on Your Screen:
```text
Cloning into 'SmartComplaintHandler'...
remote: Enumerating objects: 142, done.
remote: Counting objects: 100% (142/142), done.
remote: Compressing objects: 100% (98/98), done.
Receiving objects: 100% (142/142), 48.20 KiB | 1.20 MiB/s, done.
Resolving deltas: 100% (45/45), done.
```

#### 4. When & Why to Run It:
Run this **only once** at the very beginning of the project when setting up your local computer.

#### 5. Common Mistake:
Running `git clone` inside an already cloned Git repository. Always verify your current folder before cloning: do not clone a repo inside another repo.

---

### Command 2: `cd <directory-name>`

```bash
cd SmartComplaintHandler
```

#### 1. Anatomy of the Command:
* `cd`: Standard shell command meaning **"Change Directory"**.
* `SmartComplaintHandler`: The folder created by the `git clone` operation.

#### 2. What Happens Under the Hood:
* Your terminal moves its active process working directory into the newly cloned project folder. Git commands will now detect the local `.git` metadata directory inside `SmartComplaintHandler`.

#### 3. When & Why to Run It:
Run this immediately after `git clone`. If you forget to run `cd`, any following Git commands will error with: `fatal: not a git repository (or any of the parent directories): .git`.

---

### Command 3: `git checkout develop` (or `git switch develop`)

```bash
git checkout develop
```

#### 1. Anatomy of the Command:
* `git checkout`: The multi-purpose navigation command used to switch between branches or restore working tree files.
* `develop`: The target branch you want your workspace to switch to.
*(Modern Git alternative: `git switch develop`)*.

#### 2. What Happens Under the Hood:
* Git reads the branch pointer located at `.git/refs/heads/develop`.
* Git updates `.git/HEAD` (the internal text pointer that tracks which branch is currently active) so that `HEAD` now points to `refs/heads/develop`.
* Git replaces the contents of your Working Directory on disk with the exact snapshot of files recorded at the latest commit on `develop`. Any files that only exist on your previous branch vanish from your screen, and files on `develop` appear.

#### 3. What Appears on Your Screen:
```text
Switched to branch 'develop'
Your branch is up to date with 'origin/develop'.
```

#### 4. When & Why to Run It:
Run this before creating any new personal branch, or when preparing to pull the team's latest integrated changes.

#### 5. Common Mistake:
Attempting to switch branches while you have unsaved, conflicting changes in your working directory. Git will block you with: `error: Your local changes to the following files would be overwritten by checkout`. You must either commit your changes or discard them before switching.

---

### Command 4: `git checkout -b <new-branch-name>` (or `git switch -c <new-branch-name>`)

```bash
git checkout -b dev-rahul
```

#### 1. Anatomy of the Command:
* `git checkout`: The branch switching command.
* `-b`: The flag that instructs Git to **create a brand-new branch first**, and then switch to it immediately in a single atomic action.
* `dev-rahul`: The unique name of your personal workspace branch.
*(Modern Git alternative: `git switch -c dev-rahul`, where `-c` stands for create)*.

#### 2. What Happens Under the Hood:
* Git looks at the commit that `HEAD` is currently pointing to (for example, the latest commit on `develop`).
* Git creates a new file at `.git/refs/heads/dev-rahul` containing the exact 40-character SHA hash of that current commit.
* Git updates `.git/HEAD` so that it now points to `refs/heads/dev-rahul`.
* Your working tree files remain identical, but any future commits you create will now advance `dev-rahul` while leaving `develop` untouched.

#### 3. What Appears on Your Screen:
```text
Switched to a new branch 'dev-rahul'
```

#### 4. When & Why to Run It:
Run this when starting your work on a new feature or task. Every team member creates their own personal branch so their experiments never interfere with other students.

#### 5. Common Mistake:
Running `git checkout -b` while still on `main` instead of `develop`. Always run `git checkout develop` first, so your personal branch branches off the shared development code rather than the production release.

---

### Command 5: `git branch -a`

```bash
git branch -a
```

#### 1. Anatomy of the Command:
* `git branch`: Sub-command used to list, inspect, create, or delete branch references.
* `-a`: The flag meaning **"all"** (lists both local branches on your computer and remote-tracking branches on GitHub).

#### 2. What Happens Under the Hood:
* Git reads all files inside `.git/refs/heads/` (your local branches) and `.git/refs/remotes/origin/` (cached copies of GitHub's branches).
* It highlights your currently active branch with an asterisk (`*`) and green text.

#### 3. What Appears on Your Screen:
```text
* dev-rahul
  develop
  main
  remotes/origin/HEAD -> origin/main
  remotes/origin/develop
  remotes/origin/main
```

#### 4. When & Why to Run It:
Run this whenever you are unsure which branch you are currently on, or when checking if a teammate has pushed a new branch to GitHub.

---

### Command 6: `git status`

```bash
git status
```

#### 1. Anatomy of the Command:
* `git status`: The inspection command that displays the state of your Working Directory and Staging Area relative to your current branch commit.

#### 2. What Happens Under the Hood:
* Git performs a 3-way comparison between:
  1. The commit currently referenced by `HEAD`.
  2. The Staging Area / Index (the `.git/index` file).
  3. The physical files on your hard drive (Working Directory).
* It groups files into three categories:
  - **Untracked files:** New files created on your disk that Git has never tracked before (shown in red).
  - **Changes not staged for commit:** Tracked files that you edited or deleted, but haven't staged yet (shown in red).
  - **Changes to be committed:** Files added to the staging area ready to be saved in the next commit (shown in green).

#### 3. What Appears on Your Screen:
```text
On branch dev-rahul
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
	modified:   frontend/src/pages/SubmitComplaint.jsx

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	frontend/src/components/PriorityBadge.jsx

no changes added to commit (use "git add" to track)
```

#### 4. When & Why to Run It:
Run this **frequently**—before adding files, before committing, and before switching branches. It is your diagnostic dashboard that prevents accidental commits.

---

### Command 7: `git diff`

```bash
git diff
```

#### 1. Anatomy of the Command:
* `git diff`: Computes and displays the exact line-by-line differences between files.

#### 2. What Happens Under the Hood:
* By default, `git diff` compares your **Working Directory** (unstaged edits) against your **Staging Area** (index).
* If you run `git diff --staged` (or `git diff --cached`), it compares your **Staging Area** against your **last commit** (`HEAD`), showing exactly what will be included in your upcoming commit.
* Added lines are highlighted with a plus sign (`+`) in green; deleted lines are shown with a minus sign (`-`) in red.

#### 3. What Appears on Your Screen:
```text
diff --git a/frontend/src/pages/SubmitComplaint.jsx b/frontend/src/pages/SubmitComplaint.jsx
--- a/frontend/src/pages/SubmitComplaint.jsx
+++ b/frontend/src/pages/SubmitComplaint.jsx
@@ -14,3 +14,5 @@
+  const [loading, setLoading] = useState(false);
+  const [priority, setPriority] = useState("LOW");
```

#### 4. When & Why to Run It:
Run this before running `git add` to review your code and make sure you didn't leave temporary debug print statements or accidental typos.

---

### Command 8: `git add <file>` and `git add .`

```bash
# Option A: Stage a specific file
git add frontend/src/pages/SubmitComplaint.jsx

# Option B: Stage all modified and new files in the repository
git add .
```

#### 1. Anatomy of the Command:
* `git add`: The sub-command that moves modifications from the Working Directory into the Staging Area (Index).
* `<file>`: The specific relative path of the file to stage.
* `.` (dot): A shell wildcard representing the current directory and all its subdirectories recursively.

#### 2. What Happens Under the Hood:
* For each specified file, Git reads the file's current content, computes a cryptographic SHA-1 hash of the content, compresses the data using zlib, and writes a **blob object** into the `.git/objects/` database.
* Git updates the binary `.git/index` file with the file path, permissions, timestamp, and the SHA hash of the blob object.
* The files are now officially staged: they are locked into the pending snapshot, ready to be committed.

#### 3. What Appears on Your Screen:
`git add` executes silently without printing text upon success. Run `git status` immediately afterward to see your files turned **green** under `Changes to be committed`.

#### 4. When & Why to Run It:
Run this when you have finished a logical piece of code and are ready to prepare it for a permanent save checkpoint.

#### 5. Common Mistake:
Blindly typing `git add .` when you have unwanted files in your folder (such as `node_modules/`, `__pycache__/`, `.env` with passwords, or SQLite `.db` test files). Always ensure your `.gitignore` file is properly configured before running `git add .`.

---

### Command 9: `git commit -m "<commit-message>"`

```bash
git commit -m "Add form validation and live priority preview to SubmitComplaint"
```

#### 1. Anatomy of the Command:
* `git commit`: The sub-command that records the staged snapshot permanently into the repository history.
* `-m`: The flag standing for **"message"**. It allows you to pass the commit message directly inside quotation marks from the command line without opening a text editor like Vim or Nano.
* `"<commit-message>"`: A concise, imperative sentence describing what was added, changed, or fixed.

#### 2. What Happens Under the Hood:
* Git takes the staged files recorded in the `.git/index` and writes a **tree object** representing the project folder structure.
* Git creates a **commit object** in `.git/objects/` containing:
  - The SHA hash of the tree object (the file snapshot).
  - The SHA hash of the parent commit (linking this commit to history).
  - Author and committer name, email, and timestamp.
  - The commit message text.
* Git moves your current branch pointer (`.git/refs/heads/dev-rahul`) forward to point to this brand-new commit hash.
* The Staging Area is cleared for the next batch of changes.

#### 3. What Appears on Your Screen:
```text
[dev-rahul a7f3b1c] Add form validation and live priority preview to SubmitComplaint
 2 files changed, 48 insertions(+), 3 deletions(-)
 create mode 100644 frontend/src/components/PriorityBadge.jsx
```

#### 4. When & Why to Run It:
Run this every time you finish a clear, working unit of code (e.g. creating a button, finishing an API function, fixing a bug). Small, frequent commits are much easier to debug than one massive commit at the end of the week.

#### 5. Common Mistake:
Omitting the closing quotation mark in `git commit -m "message`. This causes the terminal to get stuck displaying a `>` continuation prompt. Press `Ctrl + C` to cancel and re-run with matching quotes.

---

### Command 10: `git push -u origin <branch-name>` and `git push`

```bash
# First time pushing your new personal branch:
git push -u origin dev-rahul

# Every push after that:
git push
```

#### 1. Anatomy of the Command:
* `git push`: The network command that transmits local branch commits from your machine to the remote repository on GitHub.
* `-u`: The flag meaning **"--set-upstream"**. It creates a persistent link between your local branch (`dev-rahul`) and the remote branch on GitHub (`origin/dev-rahul`).
* `origin`: The default alias name for the remote GitHub repository URL.
* `dev-rahul`: The name of the branch you are pushing.

#### 2. What Happens Under the Hood:
* Git connects to GitHub via HTTPS.
* Git determines which commits exist locally on `dev-rahul` that are missing from GitHub's server.
* It bundles those commit objects, tree objects, and blob objects into a packfile, compresses them, and uploads them across the network.
* GitHub's server unpacks the objects and updates its remote branch reference `refs/heads/dev-rahul`.
* Your local Git creates a tracking reference at `.git/refs/remotes/origin/dev-rahul`. Because `-u` was specified, Git remembers this relationship, allowing you to simply type `git push` or `git pull` in the future without typing the remote name and branch name again.

#### 3. What Appears on Your Screen:
```text
Enumerating objects: 7, done.
Counting objects: 100% (7/7), done.
Delta compression using up to 8 threads
Compressing objects: 100% (4/4), done.
Writing objects: 100% (4/4), 890 bytes | 890.00 KiB/s, done.
Total 4 (delta 2), reused 0 (delta 0), pack-reused 0
remote: Resolving deltas: 100% (2/2), completed with 2 local objects.
To https://github.com/YourTeamAccount/SmartComplaintHandler.git
 * [new branch]      dev-rahul -> dev-rahul
branch 'dev-rahul' set up to track 'origin/dev-rahul'.
```

#### 4. When & Why to Run It:
Run this at the end of every work session or when you want your teammates to see your code on GitHub. Pushing ensures your work is backed up in the cloud and cannot be lost if your computer crashes.

#### 5. Common Mistake:
Forgetting `-u` on the very first push of a new branch. Git will reject the push with: `fatal: The current branch dev-rahul has no upstream branch`. Fix it by running `git push -u origin dev-rahul`.

---

### Command 11: `git pull origin develop`

```bash
git pull origin develop
```

#### 1. Anatomy of the Command:
* `git pull`: The combination command that downloads changes from a remote repository AND immediately integrates them into your current local branch.
* `origin`: The remote repository location.
* `develop`: The branch on GitHub whose latest commits you want to download.

#### 2. What Happens Under the Hood:
`git pull` is actually a shorthand for two consecutive Git commands:
1. **`git fetch origin develop`**: Git contacts GitHub, downloads all new commits, files, and refs pushed by your teammates, and saves them into `.git/refs/remotes/origin/develop`. Your working directory does not change yet.
2. **`git merge origin/develop`**: Git immediately merges those newly fetched commits into your active local branch. If there are no conflicting edits, Git performs a fast-forward merge or creates a merge commit, updating your working directory files to match the latest team progress.

#### 3. What Appears on Your Screen:
```text
remote: Enumerating objects: 12, done.
remote: Counting objects: 100% (12/12), done.
remote: Compressing objects: 100% (8/8), done.
remote: Total 8 (delta 4), reused 8 (delta 4), pack-reused 0
Unpacking objects: 100% (8/8), 2.14 KiB | 547.00 KiB/s, done.
From https://github.com/YourTeamAccount/SmartComplaintHandler
 * branch            develop    -> FETCH_HEAD
Updating e3b4c1a..9a8f2d1
Fast-forward
 backend/app/services/ticket_service.py | 24 ++++++++++++++++++++++++
 1 file changed, 24 insertions(+)
```

#### 4. When & Why to Run It:
Run this at the start of every single workday on your local `develop` branch before you write any new code. Keeping your workspace synchronized with your teammates avoids painful integration headaches later.

#### 5. Common Mistake:
Running `git pull` when you have uncommitted changes in your working tree. If a teammate modified the same file, Git will abort. Commit your local work first before pulling.

---

### Command 12: `git merge <branch-name>`

```bash
# Example: Merge develop into your personal branch
git merge develop
```

#### 1. Anatomy of the Command:
* `git merge`: The integration command used to combine the commit history of a specified branch into your currently active branch.
* `develop`: The branch whose history you want to bring into your current branch.

#### 2. What Happens Under the Hood:
* Git finds the **common ancestor commit** (the point in history where your current branch and `develop` originally split).
* It checks if `develop` has progressed while your branch has not (in which case it performs a **Fast-Forward merge**, simply sliding your branch pointer forward).
* If both branches have new commits, Git performs a **3-way merge** between the ancestor commit, your branch's tip, and `develop`'s tip.
* If different files (or different lines of the same file) were changed, Git automatically merges them and creates a new **merge commit** with two parent commits.
* If the exact same lines were modified differently on both branches, Git halts and inserts **conflict markers** (`<<<<<<<`, `=======`, `>>>>>>>`) for you to resolve.

#### 3. What Appears on Your Screen (Successful Auto-Merge):
```text
Merge made by the 'ort' strategy.
 backend/app/core/database.py | 12 ++++++++++++
 1 file changed, 12 insertions(+)
```

#### 4. When & Why to Run It:
* Run `git merge develop` while on your personal branch to incorporate your teammates' latest updates.
* Run `git merge dev-yourname` while on `develop` when your personal feature is 100% complete and verified.

---

### Command 13: `git log --oneline -n 5`

```bash
git log --oneline -n 5
```

#### 1. Anatomy of the Command:
* `git log`: The history inspection command that lists past commits in reverse chronological order.
* `--oneline`: Formats each commit as a single compact line showing only its 7-character abbreviated SHA hash and commit title.
* `-n 5`: Limits the output to the 5 most recent commits.

#### 2. What Happens Under the Hood:
* Git starts at the commit pointed to by `HEAD`, reads its commit object, traverses backward through parent commit pointers, and prints them to your screen.

#### 3. What Appears on Your Screen:
```text
a7f3b1c (HEAD -> dev-rahul) Add form validation and live priority preview to SubmitComplaint
9a8f2d1 (origin/develop, develop) Add ticket creation endpoint and Pydantic schemas
e3b4c1a Add SQLite database engine and declarative base models
f10a82e Configure Vite reverse proxy and Tailwind CSS tokens
01d4a89 Initial repository commit
```

#### 4. When & Why to Run It:
Run this whenever you want to check what was recently committed, find a previous commit hash, or verify that your last commit succeeded.

---

### Command 14: `git restore <filepath>` (or `git checkout -- <filepath>`)

```bash
git restore frontend/src/pages/SubmitComplaint.jsx
```

#### 1. Anatomy of the Command:
* `git restore`: Modern sub-command designed specifically to restore working tree files.
* `<filepath>`: The file you want to revert.
*(Legacy Git alternative: `git checkout -- <filepath>`)*.

#### 2. What Happens Under the Hood:
* Git discards all uncommitted modifications you made to that file in your working directory and overwrites it with the clean version currently stored in the Staging Area or last commit (`HEAD`).

#### 3. When & Why to Run It:
Run this when you were experimenting, made a mess of a file, broke the code, and simply want to throw away your unsaved edits and return to your last saved checkpoint.

#### 4. Caution:
This operation is **irreversible**. Any uncommitted code in that file will be permanently erased.

---

### Command 15: `git restore --staged <filepath>` (or `git reset HEAD <filepath>`)

```bash
git restore --staged frontend/src/pages/SubmitComplaint.jsx
```

#### 1. Anatomy of the Command:
* `git restore`: The file restoration command.
* `--staged`: The flag telling Git to operate on the **Staging Area (Index)** rather than your working directory.
*(Legacy Git alternative: `git reset HEAD <filepath>`)*.

#### 2. What Happens Under the Hood:
* Git copies the file state from `HEAD` into the Staging Area `.git/index`.
* Your actual code edits in the working directory on your disk remain completely intact. The file simply changes from green (`Changes to be committed`) back to red (`Changes not staged for commit`).

#### 3. When & Why to Run It:
Run this when you accidentally typed `git add .` and staged a file that you did not intend to include in your next commit.

---

# Part 5: The Daily Student Workflow: Step-by-Step Execution Sequence

Here is the exact sequence of commands every student runs during their daily work sessions:

```
[ START OF WORK SESSION ]
  1. git checkout develop          (Switch to integration branch)
  2. git pull origin develop       (Download latest code from teammates)
  3. git checkout dev-yourname     (Switch to your personal branch)
  4. git merge develop             (Bring teammates' updates into your branch)

[ CODING & SAVING PROGRESS ]
  5. Edit files in VS Code
  6. git status                    (Inspect what files you changed)
  7. git diff                      (Review exact line modifications)
  8. git add .                     (Stage your completed work)
  9. git commit -m "Clear message" (Save a permanent checkpoint)
 10. git push origin dev-yourname  (Backup your branch to GitHub)

[ FEATURE COMPLETE & VERIFIED ]
 11. git checkout develop          (Switch back to develop)
 12. git pull origin develop       (Ensure develop is current)
 13. git merge dev-yourname        (Merge your finished work into develop)
 14. git push origin develop       (Share your completed feature with the team)
```

---

# Part 6: How to Resolve a Merge Conflict in 3 Steps

A merge conflict happens only when two people modify the **same line of the same file**. When this happens, Git pauses and marks the conflict in your file:

```text
<<<<<<< HEAD
const API_BASE_URL = "http://localhost:8000/api/v1";
=======
const API_BASE_URL = "/api/v1";
>>>>>>> develop
```

### The 3-Step Resolution Procedure:
1. **Open the file in VS Code:** Look at the lines between `<<<<<<< HEAD` (your version) and `>>>>>>> develop` (the incoming version).
2. **Decide the correct code:** Delete the marker lines (`<<<<<<<`, `=======`, `>>>>>>>`) and keep only the correct code line (for example, keeping `const API_BASE_URL = "/api/v1";`). Save the file (`Ctrl + S`).
3. **Commit the resolution:**
   ```bash
   git add .
   git commit -m "Resolve API_BASE_URL conflict in api client"
   git push origin dev-yourname
   ```
The conflict is resolved cleanly.

---

# Part 7: Emergency Troubleshooting Reference Table

| Symptom / Error Message | Root Cause | Immediate Fix Command |
| :--- | :--- | :--- |
| `fatal: not a git repository` | Terminal is in the wrong folder (outside the project). | Run `cd SmartComplaintHandler` to enter the repo folder. |
| `fatal: The current branch has no upstream branch` | First push of a new personal branch. | Run `git push -u origin <your-branch-name>`. |
| `error: Your local changes would be overwritten by checkout` | You have unsaved changes preventing branch switch. | Either commit them (`git commit -m "WIP"`) or discard them (`git restore .`). |
| `CONFLICT (content): Merge conflict in <file>` | Both you and a teammate edited the same lines. | Open file in VS Code, choose the correct lines, save, then `git add .` and `git commit -m "Fix conflict"`. |
| `Everything up-to-date` | No new commits exist locally to push. | Normal state; make code changes and commit them before pushing. |
