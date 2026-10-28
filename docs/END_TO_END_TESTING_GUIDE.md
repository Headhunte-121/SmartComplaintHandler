# SmartComplaintHandler — Full End-to-End (E2E) Testing Guide & Multi-Persona Scenarios

> **Navigation**: [🏠 Project Root](../README.md) &nbsp;│&nbsp; [📚 Codebase Documentation Hub](codebase/README.md) &nbsp;│&nbsp; [🏛 Full-Stack Architecture](FULL_STACK_ARCHITECTURE.md) &nbsp;│&nbsp; [👥 5-Student Responsibility Matrix](TEAM_RESPONSIBILITY_MATRIX.md) &nbsp;│&nbsp; [🛡️ Supabase RLS Guide](SUPABASE_RLS_GUIDE.md)  
> **Course / Academic Context**: Final Project Review, Practical Demonstration & Viva Examination  
> **Coverage**: 5 Comprehensive User Personas + 10 Failure & Security Injection Scenarios + Automated CLI Quality Gates  
> **Repository Branch**: `documentation`

---

## 🧭 Pre-Test Setup & Service Launch

Before beginning the end-to-end testing scenarios, ensure your backend and frontend services are active:

### 1. Launch the Services (Windows Automated Launcher)
Double-click `run_all.bat` (or execute in PowerShell):
```powershell
.\run_all.bat
```
* **Frontend Single-Page Application (SPA)**: [http://localhost:5173](http://localhost:5173)
* **Backend FastAPI REST API & Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **Backend Health Check Probe**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 🎭 The 5 Multi-Persona Test Matrix

| Persona | Role | Pre-Seeded Email | Password | Primary Mission |
| :--- | :--- | :--- | :--- | :--- |
| **Persona 1: Student / Resident Scholar** | `STUDENT` | `nikhil26100@iiitnr.edu.in`<br>*(or register any `@iiitnr.edu.in`)* | `securepassword123` | File routine complaints, test debounced AI triage, copy tracking codes, track resolution progress |
| **Persona 2: Emergency Resident Scholar** | `STUDENT` | `nikhil26100@iiitnr.edu.in` | `securepassword123` | Report life-safety hazards, verify immediate short-circuit escalation to `CRITICAL` and 4h SLA clock |
| **Persona 3: Field Maintenance Technician** | `TECHNICIAN` | `tech.ramesh@iiitnr.edu.in`<br>*(or `parvinder@iiitnr.edu.in`)* | Register with `@iiitnr.edu.in` or login | View assigned squad queue, advance state machine, test anti-fraud resolution notes gate |
| **Persona 4: Facility Supervisor / Admin** | `ADMIN` | `admin@iiitnr.edu.in` | `adminpassword123` | Inspect campus queue depths, balance squad workloads, override priority with mandatory audit logs |
| **Persona 5: Directorate SuperAdmin** | `SUPER_ADMIN` | `superadmin@iiitnr.edu.in` | Register / Login | Review campus health scores, inspect building fault density heatmaps, manage staff provisioning |

---

## 🧪 SCENARIO 1: The Student Routine Grievance Journey

### Objective:
Verify multi-mode intake, real-time typing NLP triage ($<15\text{ms}$), collision-resistant tracking code generation, and public tracking.

### Step-by-Step Execution:
1. **Navigate & Login**:
   - Go to [http://localhost:5173/login](http://localhost:5173/login).
   - Enter credentials:
     - **Email**: `nikhil26100@iiitnr.edu.in`
     - **Password**: `securepassword123`
   - Click **Sign In** $\to$ You are redirected to `/student` (Student Dashboard).
2. **First-Time Residence Check**:
   - If prompted with `/residence-info`, select **Hostel Block 1 (Ramanujan House)** and enter **Room 204**. Click **Save Profile**.
3. **Lodge Complaint (`/submit`)**:
   - Click **Submit Complaint** in the navigation bar.
   - In the **Title** box, type: `"Water tap broken in 2nd floor restroom"`
   - In the **Description** box, type: `"The faucet in the corner wash basin is broken and water is continuously dripping onto the floor."`
   - **Observe Live AI Triage Card**:
     - Within 500ms of pausing your typing, the **Live Triage Card** updates dynamically.
     - **Predicted Category**: `Plumbing & Water Services`
     - **Calculated Priority**: `MEDIUM` (Blue pill)
     - **Estimated Turnaround**: `24 Hours`
4. **Select Location Mode**:
   - Choose **Campus Map Pin**: click the interactive mini-map on **Ramanujan House (BH-1)**.
   - Notice the location field auto-populates with `"Ramanujan House (BH-1), Floor 2"`.
5. **Submit & Copy Code**:
   - Click **Submit Complaint**.
   - A modal (`SubmissionSuccessModal.jsx`) appears with a green checkmark and a unique code (e.g. `TICK-20261028-4921`).
   - Click the **Copy Code** button (it displays *"Copied!"*).
6. **Public Tracking Verification (`/track`)**:
   - Navigate to [http://localhost:5173/track](http://localhost:5173/track).
   - Paste the code `TICK-20261028-4921` into the search box and press Enter.
   - **Verify Visual Stepper**:
     - Step 1: `SUBMITTED` is active (Blue).
     - Step 2: `IN_PROGRESS` is pending.
     - Step 3: `RESOLVED` is pending.
     - Department is displayed as `Plumbing`.
     - Assigned Squad: `Hostel Plumbing Squad 2` or `Water Supply Emergency Team`.
     - SLA Deadline: Exactly `Current Time + 24 Hours`.

---

## 🚨 SCENARIO 2: Emergency Life-Safety Hazard Short-Circuiting

### Objective:
Verify that life-safety hazards (fire, sparks, smoke, electric shock) bypass standard scoring, immediately trigger `CRITICAL` priority, accelerate the SLA deadline to **4 Hours**, and route to the emergency substation squad.

### Step-by-Step Execution:
1. Navigate to [http://localhost:5173/submit](http://localhost:5173/submit).
2. In the **Title**, type: `"Dangerous electrical sparking in corridor panel"`
3. In the **Description**, type: `"Sparks, fire hazard and burning electrical smoke coming from the distribution board near Academic Block Room 104."`
4. **Observe Instant Hazard Escalation**:
   - Notice the **Live Triage Card** flashes a pulsing **CRITICAL (Red Hazard)** badge.
   - **Hazard Detection Flag**: Displays *"High-voltage life-safety hazard detected. Short-circuiting to immediate emergency queue."*
   - **SLA Clock Target**: Automatically accelerates to **4 Hours** (Contractual Critical SLA).
5. **Submit Ticket**:
   - Click **Submit Complaint**.
   - Save the tracking code (e.g. `TICK-20261028-8812`).
6. **Verify Database / API Routing**:
   - Query the ticket via Swagger or `/track`:
     - `priority`: `"CRITICAL"`
     - `department_id`: `1` (`Electrical`)
     - `assigned_team_id`: `1` (`Substation High-Voltage Team`)
     - `sla_deadline`: Matches `created_at + 4 hours`.

---

## 🔧 SCENARIO 3: The Maintenance Field Technician Journey

### Objective:
Verify technician squad isolation, work order acknowledgment, finite state machine transition enforcement, and anti-fraud resolution notes validation.

### Step-by-Step Execution:
1. **Login as Field Technician**:
   - Go to [http://localhost:5173/login](http://localhost:5173/login).
   - Enter technician credentials:
     - **Email**: `tech.ramesh@iiitnr.edu.in`
     - **Password**: If registering for the first time, register with `tech.ramesh@iiitnr.edu.in` and password `Tech@12345` (the backend auto-assigns `role="TECHNICIAN"` and squad `Electrical Squad 1`).
   - Click **Sign In** $\to$ You are redirected to `/technician` (Technician Workstation).
2. **Verify Squad Isolation**:
   - The technician workstation only displays tickets assigned to `Hostel Electrical Squad 1`.
   - The student's electrical complaint from Scenario 2 appears at the top of the queue with a red `CRITICAL` badge.
3. **Acknowledge & Start Work (FSM Transition 1)**:
   - Click **Start Work** / **Acknowledge**.
   - The ticket status advances from `SUBMITTED` $\to$ `IN_PROGRESS`.
   - Real-time countdown timer turns amber and continues ticking down.
4. **Test Anti-Fraud Resolution Gate (Failure Test)**:
   - Click **Resolve Ticket**.
   - A modal (`ResolutionNotesModal.jsx`) opens prompting for physical repair notes.
   - Type `"Fixed"` (5 characters).
   - Click **Confirm Resolution**.
   - **Observe Rejection**:
     - System displays an error: *"Resolution notes must be at least 10 characters detailing the physical repair performed."*
     - The modal remains open; the ticket is **NOT** resolved.
5. **Legitimate Resolution (FSM Transition 2)**:
   - Enter authentic repair documentation:
     - `"Replaced burnt 32A MCB breaker switch, tightened terminal lugs, and tested phase voltage. Load restored normally."` (112 characters).
   - Click **Confirm Resolution**.
   - **Observe Successful Closure**:
     - Status updates to `RESOLVED`.
     - Timestamp `resolved_at` is stamped in the database.
     - The countdown timer freezes and displays: `✅ Resolved on Time`.
     - The ticket is removed from the active queue and moved to the "Resolved Work Orders" history tab.

---

## 📋 SCENARIO 4: Facility Supervisor Workload Balancing & Overrides

### Objective:
Verify facility management overview, real-time squad queue meters, administrative priority overrides with audit logging, and manual squad reassignment.

### Step-by-Step Execution:
1. **Login as Facility Admin**:
   - Go to [http://localhost:5173/login](http://localhost:5173/login).
   - **Email**: `admin@iiitnr.edu.in`
   - **Password**: `adminpassword123`
   - You land on `/operations` (`AdminDashboard.jsx`).
2. **Explore Facility Queue Filters**:
   - Click the tabs:
     - **`ALL TICKETS`**: Complete campus complaint catalog.
     - **`CRITICAL`**: Filtered down to emergency work orders.
     - **`IN PROGRESS`**: Active field technician repairs.
     - **`SLA BREACHED`**: Tickets exceeding their contractual resolution window.
3. **Inspect Team Workload View (`TeamWorkloadView.jsx`)**:
   - Scroll to the squad workload panel.
   - Observe capacity bars for each squad (`Substation High-Voltage Team`, `Water Supply Emergency Team`, `Sanitation Rapid Response`, etc.).
   - Verify that squads with more tickets show higher percentage load and color shifts (Green $\to$ Amber $\to$ Red).
4. **Execute Priority Override with Mandatory Reason**:
   - Find a `LOW` priority ticket (e.g. paint touch-up or loose desk screw).
   - Click the **Override Priority** button.
   - Select new priority: `HIGH`.
   - In the **Supervisory Justification** box, enter:
     - `"VIP committee inspection scheduled in this auditorium tomorrow morning; repair must finish before 9:00 AM."`
   - Click **Confirm Override**.
   - Notice the ticket priority badge immediately updates to `HIGH` (Amber) and the SLA deadline shrinks from 72h down to 12h!
   - Open ticket details: verify the audit trail in `resolution_notes` records:
     - `[2026-10-28 10:30 UTC - OVERRIDE by Rakesh Kumar Mishra]: VIP committee inspection scheduled...`
5. **Execute Squad Reassignment (`ReassignTeamModal.jsx`)**:
   - Click **Reassign Squad** on an overloaded squad's ticket.
   - Select an alternative squad (e.g. transfer from Squad 1 to Squad 6).
   - Enter reason: `"Squad 1 engaged in campus substation shutdown; balancing work order to Squad 6."`
   - Click **Transfer Work Order**.
   - The ticket moves to Squad 6, and both squads' workload queue meters update instantly.

---

## 🏛️ SCENARIO 5: Directorate SuperAdmin Governance & Campus Studio

### Objective:
Verify executive analytics, campus resolution rate KPIs, building fault density heatmaps, staff directory provisioning, and the JSON GIS data editor.

### Step-by-Step Execution:
1. **Login as Directorate SuperAdmin**:
   - Go to [http://localhost:5173/login](http://localhost:5173/login).
   - Register or login with:
     - **Email**: `superadmin@iiitnr.edu.in`
     - *(Any password if registering fresh, or use pre-seeded account)*.
   - You land on `/superadmin` (`SuperAdminDashboard.jsx`).
2. **Review Executive KPIs**:
   - **Resolution Health Score**: Composite institutional efficiency rating.
   - **Active vs Resolved Tickets**: Ratio charts.
   - **Mean Time to Resolve (MTTR)**: Real-time mathematical average closure hours.
   - **SLA Breach Rate**: Percentage of grievances resolved within contract windows.
3. **Building Fault Density Analysis**:
   - Inspect the **Campus Fault Density Table**:
     - See which buildings (Bhabha Hostel, Bose Hostel, Academic Complex, Data Centre) have the highest volume of recurring issues.
4. **Staff Directory & Role Provisioning (`/staff`)**:
   - Click **Staff Directory** in the navigation header.
   - Search for any employee or technician.
   - Test toggling account status or editing assigned squads.
5. **Spatial Infrastructure Studio (`/superadmin/data-editor`)**:
   - Click **Data Studio** / **GIS Editor**.
   - View the JSON structure for campus buildings and rooms.
   - Modify a room label or inspect coordinates used by the 2D Digital Twin.

---

## 🗺️ SCENARIO 6: The Unauthenticated Public Scholar (Digital Twin & Transparency)

### Objective:
Verify that non-logged-in visitors and students without accounts can track tickets publicly and interact with the 2D SVG Campus Digital Twin with zero map dependencies.

### Step-by-Step Execution:
1. Open a new **Incognito / Private Window** (or log out).
2. Visit [http://localhost:5173/](http://localhost:5173/).
3. **Navigate the 2D SVG Campus Digital Twin**:
   - Locate the campus map canvas (`DigitalTwinCanvas.jsx`).
   - Click and drag with your mouse: the map pans smoothly across the Cartesian canvas.
   - Roll your mouse wheel: the map zooms in and out with clamped boundaries.
4. **Interactive Building Inspection**:
   - Click on **Hostel Block 1** or **Academic Complex**.
   - The **Digital Twin Inspector** opens on the right, listing building wings, floor counts, room lists, and active complaint counts.
5. **Search Autocomplete**:
   - In the map search bar, type `"Room 102"` or `"Electrical Substation"`.
   - Select the match: the camera matrix smoothly animates and pans directly to center the target building in the viewport.
6. **Anonymous Tracking**:
   - Click **Track Grievance** in the public header.
   - Enter any ticket code (e.g. `TICK-20261028-4921`).
   - The public stepper displays live status without exposing student private phone numbers or passwords!

---

## ⚡ Automated Quality Gate Execution (Run in Terminal)

To run the complete automated test suite proving all 5 modules pass without manual clicking:

```bash
# Activate your backend virtual environment
cd SmartComplaintHandler/backend
.\venv\Scripts\activate   # Linux/macOS: source venv/bin/activate

# Execute the closed-loop end-to-end integration test
pytest tests/test_closed_loop.py -v

# Execute the complete 66-test quality gate suite
pytest tests/ -v
```

### Expected Output:
```text
============================== test session starts ==============================
collected 66 items

tests/test_auth.py::test_password_hashing PASSED                           [  1%]
tests/test_auth.py::test_jwt_issuance_and_decode PASSED                    [  3%]
tests/test_closed_loop.py::test_full_complaint_lifecycle PASSED           [  4%]
tests/test_m3_triage.py::test_priority_hazard_shortcircuit PASSED         [  6%]
tests/test_m5_api.py::test_illegal_state_transition_blocked PASSED        [  7%]
tests/test_m5_api.py::test_short_resolution_notes_rejected PASSED         [  9%]
tests/test_superadmin_campus.py::test_building_fault_density PASSED        [ 10%]
...
tests/test_closed_loop.py::test_full_closed_loop_verification PASSED       [100%]

======================== 66 passed, 2 warnings in 79.82s ========================
```

---

## 🧭 Navigation Footer

> **Quick Jump**:  
> [🏠 Project Root](../README.md) &nbsp;│&nbsp; [📚 Codebase Documentation Hub](codebase/README.md) &nbsp;│&nbsp; [🏛 Full-Stack Architecture Guide](FULL_STACK_ARCHITECTURE.md) &nbsp;│&nbsp; [👥 5-Student Responsibility Matrix](TEAM_RESPONSIBILITY_MATRIX.md) &nbsp;│&nbsp; [🛡️ Supabase RLS Guide](SUPABASE_RLS_GUIDE.md)
