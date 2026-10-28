# SmartComplaintHandler - End-to-End (E2E) QA User Stories & Testing Guide

> **Testing Method**: Every test flow is a discrete, single-path **User Story** with interactive todo checkboxes (`- [ ]`). Follow each step in order without branching.

---

## Master Credentials Reference

| Role | Email | Password | Primary Route |
| :--- | :--- | :--- | :--- |
| **Student (SSO)** | Your Google `@iiitnr.edu.in` Account | Google Auth | `/student` |
| **Student (Manual)** | `aarav24100@iiitnr.edu.in` | `Student@1234` | `/student` |
| **Estate Admin** | `admin@iiitnr.edu.in` | `Admin@1234` | `/operations` |
| **Super Admin** | `superadmin@iiitnr.edu.in` | `SuperAdmin@2026` *(or `Admin@1234`)* | `/superadmin` |
| **Field Technician** | `tech.ramesh@iiitnr.edu.in` | `Password@123` *(or `IIITNR@2026`)* | `/technician` |

---

## User Story 1: Student Google SSO Onboarding & In-Room Hazard Intake
**Persona**: New Undergraduate Student using official Google Workspace  
**Goal**: Verify Google SSO authentication, mandatory residence setup without cached phantom data, 1-tap room hazard filing, and live SLA countdown.

- [ ] **Step 1.1**: Open an incognito browser window and navigate to `http://localhost:5173/login`.
- [ ] **Step 1.2**: Click **"Sign in with Google (@iiitnr.edu.in)"** and complete authentication with your `@iiitnr.edu.in` Google account.
- [ ] **Step 1.3**: Verify the application routes directly to `/residence-info` (Residence Onboarding) without any `401 Unauthorized` error.
- [ ] **Step 1.4**: On `/residence-info`, verify the student badge displays your auto-detected Department and Name.
- [ ] **Step 1.5**: Verify the form has **no phantom pre-fills** *(Implemented Update: Hostel starts on `"Select Hostel / Residence..."`, floor and room fields start completely blank without forced defaults, floors are unconstrained/flexible, and room number is 100% freeform)*.
- [ ] **Step 1.6**: In the **Hostel Residence House** dropdown, select `Raman House (Boys Hostel 1)`.
- [ ] **Step 1.7**: In the **Floor** section, click the quick pill **"Floor 3"** (or select it from the dropdown) to generate Floor 3 suggestions.
- [ ] **Step 1.8**: In the **Room Number** field, click the suggestion pill `Room 331` (or freely type any custom format like `Room 331`, `331`, or `B-312`).
- [ ] **Step 1.9**: Click **"Save & Continue"**, verify the green success notice appears, and verify automatic redirect to the Student Portal (`/student` or `/submit`).
- [ ] **Step 1.10**: Navigate to **File Grievance** (`/submit`).
- [ ] **Step 1.11**: Verify the **"🏠 My Room"** mode is active by default and displays: `Raman House (Boys Hostel 1) 📍 Room 331`.
- [ ] **Step 1.12**: In the **Issue Summary** box, type: `Ceiling fan regulator shorted and making popping noise`.
- [ ] **Step 1.13**: In the **Details & Observations** box, type: `The regulator knob sparked when turned on, emitting burning plastic odor in Room 331. Urgent fire safety hazard.`
- [ ] **Step 1.14**: Verify the **Live AI Triage Card** evaluates:
  - **Category**: `Electrical`
  - **Priority**: `CRITICAL`
  - **Target SLA**: `2 Hours`
- [ ] **Step 1.15**: Click the orange **"Submit Request · Raman House (Room 331)"** button.
- [ ] **Step 1.16**: In the confirmation dialog, copy and write down the generated **Tracking Code** (e.g. `TICK-1001`).
- [ ] **Step 1.17**: Navigate to `/track`, enter your Tracking Code, and press Enter.
- [ ] **Step 1.18**: Verify the **Live SLA Countdown Timer** is actively ticking down from `02h 00m`.
- [ ] **Step 1.19**: Scroll to the bottom and verify the **Student Feedback** section is locked with notice: *"Feedback can be submitted once this ticket is resolved."*

---

## User Story 2: Student Manual Registration & Public Campus Outage
**Persona**: Student registering manually with institutional email  
**Goal**: Verify roll-based department detection, day-scholar onboarding, reporting a public facility defect via map/search, and multi-ticket dashboard tracking.

- [ ] **Step 2.1**: Open an incognito browser window and navigate to `http://localhost:5173/register`.
- [ ] **Step 2.2**: In the Institutional Email field, type: `aarav24100@iiitnr.edu.in`.
- [ ] **Step 2.3**: Verify the live preview card appears and auto-detects:
  - **Full Name**: `Aarav`
  - **Department**: `Data Science & Artificial Intelligence` (`DSAI`)
  - **Batch**: `'2024`
- [ ] **Step 2.4**: Enter Password `Student@1234` and Confirm Password `Student@1234`.
- [ ] **Step 2.5**: Click **"Create Account"** and verify navigation to `/residence-info`.
- [ ] **Step 2.6**: In the **Hostel Residence House** dropdown, select `Day Scholar (Off-Campus Commuter)`.
- [ ] **Step 2.7**: Verify floor and room fields automatically collapse for Day Scholars.
- [ ] **Step 2.8**: Click **"Save & Continue"** and verify redirect to `/submit`.
- [ ] **Step 2.9**: On `/submit`, verify the "My Room" button is hidden (since Day Scholars have no hostel room).
- [ ] **Step 2.10**: Click the **"🔍 Quick Search"** tab.
- [ ] **Step 2.11**: In the spot search input, type: `Canteen` and select `Canteen IIIT Naya Raipur (Circular Rotunda & Arcade)`.
- [ ] **Step 2.12**: In the **Issue Summary** box, type: `Commercial water cooler drain pipe cracked and leaking`.
- [ ] **Step 2.13**: In the **Details & Observations** box, type: `Water cooler drain pipe under the main filter unit is split, creating standing water pool on the canteen walkway during lunch.`
- [ ] **Step 2.14**: Verify the **Live AI Triage Card** evaluates:
  - **Category**: `Plumbing`
  - **Priority**: `MEDIUM`
  - **Target SLA**: `24 Hours`
- [ ] **Step 2.15**: Click **Submit Request** and note down the generated Tracking Code (e.g. `TICK-1002`).
- [ ] **Step 2.16**: In the sidebar, click **My Grievances** (`/student`).
- [ ] **Step 2.17**: Verify both tickets (`TICK-1001` and `TICK-1002`) appear in the active grievances grid with status badges.

---

## User Story 3: Estate Operations Desk Triage & Real-World Overrides
**Persona**: Facilities / Estate Administrator (`admin@iiitnr.edu.in`)  
**Goal**: Verify access to Operations Desk without redirect loops, balance squad workload, upgrade priority due to slip hazard, and reassign squads.

- [ ] **Step 3.1**: Log out of student session and navigate to `http://localhost:5173/login`.
- [ ] **Step 3.2**: Sign in with Estate Admin credentials:
  - **Email**: `admin@iiitnr.edu.in`
  - **Password**: `Admin@1234`
- [ ] **Step 3.3**: In the sidebar, click **Operations Desk** (`/operations`).
- [ ] **Step 3.4**: Verify `/operations` loads directly **without bouncing** to `/student` or `/superadmin`.
- [ ] **Step 3.5**: Inspect the **Maintenance Squad Capacities** panel (top) and verify active load numbers reflect filed tickets.
- [ ] **Step 3.6**: In the **Campus Incident Queue** table, locate the Canteen Plumbing ticket (`TICK-1002`).
- [ ] **Step 3.7**: Click the **Priority Override (Sliders)** button on `TICK-1002`'s row to open the modal.
- [ ] **Step 3.8**: In the modal, change Target Priority from `MEDIUM` to `HIGH` (8-Hour SLA).
- [ ] **Step 3.9**: In the Justification box, type: `Water leak creates severe slip hazard for students during ongoing lunch hour rush.`
- [ ] **Step 3.10**: Click **"Save Priority Override"** and verify toast confirms update.
- [ ] **Step 3.11**: Verify `TICK-1002` row updates to `HIGH` priority with updated SLA countdown.
- [ ] **Step 3.12**: Locate the Critical Electrical ticket (`TICK-1001`) and click the **Reassign Squad (Users)** button.
- [ ] **Step 3.13**: In the modal, select Target Squad: `Substation High-Voltage Team`.
- [ ] **Step 3.14**: Enter Justification: `Electrical arcing requires specialized high-voltage circuit diagnostics toolkit.`
- [ ] **Step 3.15**: Click **"Confirm Reassignment"** and verify squad column updates immediately.
- [ ] **Step 3.16**: Click the **Escalate (Alert Triangle)** button on `TICK-1001`.
- [ ] **Step 3.17**: Enter reason: `Breaker arcing requires supervisor sign-off and power cut authorization.`
- [ ] **Step 3.18**: Click **"Confirm Escalation"** and verify ticket status badge updates to `ESCALATED`.

---

## User Story 4: Field Technician Execution & Resolution Closure Gate
**Persona**: Campus Field Technician (`tech.ramesh@iiitnr.edu.in`)  
**Goal**: View assigned squad queue, commence field repair, log a hold for replacement parts, and commit physical resolution audit notes.

- [ ] **Step 4.1**: Log out and navigate to `http://localhost:5173/login`.
- [ ] **Step 4.2**: Sign in with Field Technician credentials:
  - **Email**: `tech.ramesh@iiitnr.edu.in`
  - **Password**: `Password@123` *(or `IIITNR@2026`)*
- [ ] **Step 4.3**: Verify direct landing on **Technician Workstation** (`/technician`).
- [ ] **Step 4.4**: Locate ticket `TICK-1001` (`Raman House - Room 331`) in your active queue.
- [ ] **Step 4.5**: Click **"Start Work"** and verify ticket status transitions to `IN_PROGRESS`.
- [ ] **Step 4.6**: Click **"Put On Hold"** (Parts Roadblock Protocol).
- [ ] **Step 4.7**: In the modal, type hold reason: `Awaiting replacement 32A DIN-rail breaker from central institutional inventory.`
- [ ] **Step 4.8**: Click **"Confirm On Hold"** and verify card displays `ON_HOLD` status with hold reason.
- [ ] **Step 4.9**: Click **"Resume Work"** to move status back to `IN_PROGRESS`.
- [ ] **Step 4.10**: Click the green **"Resolve Ticket"** button to open the Ticket Closure Gate modal (`ResolutionNotesModal`).
- [ ] **Step 4.11**: In the **Physical Work Completed** field, type:
  `Replaced burned-out 32A breaker with new industrial ABB unit, tightened terminal lugs, and tested voltage across all phases.`
- [ ] **Step 4.12**: In the **Parts Replaced** field, type: `1x 32A C-Curve Breaker, 2x 6mm copper terminal lugs`.
- [ ] **Step 4.13**: In the **Technician Sign-Off** field, type: `Ramesh Kumar (Electrical Lead)`.
- [ ] **Step 4.14**: Click **"Confirm Resolution & Close"**.
- [ ] **Step 4.15**: Verify ticket disappears from the active queue and moves to the **Resolved** tab.

---

## User Story 5: Student Verification & 5-Star Closed-Loop Feedback
**Persona**: Student (`aarav24100@iiitnr.edu.in` / Google Account)  
**Goal**: Verify resolution notes, inspect technician audit sign-off, and submit 5-star rating to complete the closed loop.

- [ ] **Step 5.1**: In an incognito tab, open `http://localhost:5173/track`.
- [ ] **Step 5.2**: Enter Tracking Code `TICK-1001` and press Enter.
- [ ] **Step 5.3**: Verify the top status banner displays **RESOLVED** in green.
- [ ] **Step 5.4**: Verify the SLA badge displays **RESOLVED ON TIME**.
- [ ] **Step 5.5**: In the Audit & Timeline section, verify technician notes are displayed:
  - *"Replaced burned-out 32A breaker with new industrial ABB unit..."*
  - Technician: `Ramesh Kumar (Electrical Lead)`.
- [ ] **Step 5.6**: Verify the **Student Feedback** section is now **unlocked**.
- [ ] **Step 5.7**: Click the **5th Star** (Rating: `5/5`).
- [ ] **Step 5.8**: In the feedback comments box, type: `Technician arrived promptly, replaced the sparking regulator, and verified power safety. Excellent service!`
- [ ] **Step 5.9**: Click **"Submit Feedback & Rating"**.
- [ ] **Step 5.10**: Verify rating form permanently locks with green checkmark confirmation.

---

## User Story 6: SuperAdmin Directorate Oversight & Staff Matrix
**Persona**: Super Administrator / Director (`superadmin@iiitnr.edu.in`)  
**Goal**: Verify dynamic dashboard telemetry alignment, provision new staff accounts, and test password overrides.

- [ ] **Step 6.1**: Navigate to `http://localhost:5173/login`.
- [ ] **Step 6.2**: Sign in with SuperAdmin credentials:
  - **Email**: `superadmin@iiitnr.edu.in`
  - **Password**: `SuperAdmin@2026` *(or `Admin@1234`)*
- [ ] **Step 6.3**: On the **SuperAdmin Nexus Dashboard** (`/superadmin`), verify telemetry:
  - **Resolution Rate**: Has increased to reflect the resolved ticket.
  - **Active Incidents**: Decremented by 1.
- [ ] **Step 6.4**: In the sidebar, click **Operations Desk** (`/operations`) and verify `TICK-1001` displays as `RESOLVED`.
- [ ] **Step 6.5**: In the sidebar, click **Staff Directory** (`/superadmin/staff`).
- [ ] **Step 6.6**: Click the **"Provision Staff Account"** button.
- [ ] **Step 6.7**: Fill in the modal fields:
  - **Full Name**: `Sunil Verma`
  - **Email**: `tech.sunil@iiitnr.edu.in`
  - **Role**: `TECHNICIAN`
  - **Department**: `Plumbing`
  - **Phone**: `+91-771-2474188`
- [ ] **Step 6.8**: Click **"Confirm & Authorize"**.
- [ ] **Step 6.9**: Verify Sunil Verma appears in the staff grid with `TECHNICIAN` badge.
- [ ] **Step 6.10**: On Sunil Verma's card, click the **Key (Set Password)** button to open `SetPasswordModal`.
- [ ] **Step 6.11**: Enter New Password `SunilPass@2026` and Confirm Password `SunilPass@2026`.
- [ ] **Step 6.12**: Click **"Update Password"** and verify toast confirms password was changed.
- [ ] **Step 6.13**: Test the role filters:
  - Click `Technicians` pill -> only technicians display.
  - Click `Admins` pill -> only admins display.
  - Click `All` pill -> full roster displays.
- [ ] **Step 6.14**: Click **Sign Out** from the user badge menu and verify clean session termination.
