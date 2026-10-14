# IIIT-NR Complete Integration Plan & Incremental Testing Roadmap

This document outlines the step-by-step phased integration of features from `SmartComplaintHandler_IIITNR_Complete` into the active `SmartComplaintHandler` production repository.

> [!IMPORTANT]
> **Safety Guarantee & Boundaries:**
> The modern two-step Vercel authentication flow (`Login.jsx`, `Register.jsx`), native Google OAuth popup integration, `@iiitnr.edu.in` domain security enforcement, and locked Department taxonomy (`100` $\rightarrow$ CSE, `101` $\rightarrow$ DSAI, `102` $\rightarrow$ ECE) will be **100% preserved** and untouched.

---

## Phased Integration Breakdown

```
Phase 1: Core Enums & Schemas
  └─► Phase 2: Keyword Routing & Workload Engines
        └─► Phase 3: IIIT-NR Campus Directory & Zone Affinity
              └─► Phase 4: Administrative Telemetry & CSV Export
                    └─► Phase 5: Authentic Frontend Campus Selectors & Controls
```

---

### Phase 1: Core Institutional Constants & Schemas
* **Files to Integrate:**
  - `backend/app/core/constants.py`
  - `backend/app/schemas/department.py`
  - `backend/app/schemas/assignment.py`
* **Features Added:**
  - Official IIIT-NR metadata (Sector 24 Nava Raipur, University Act 2013, campus phone/email).
  - Standard enums: `PriorityLevel`, `TicketStatus`, `UserRole`, `SLA_DURATION_HOURS` (4h Critical, 12h High, 24h Medium, 72h Low).
  - Pydantic v1/v2 compatible `DepartmentCreate` and `DepartmentResponse` schemas.
  - Enhanced `TeamWorkloadResponse` schema with `is_active`, `max_capacity`, `utilization_rate`, and `workload_status`.
* **Testing & Verification Step:**
  - Run `pytest backend/tests/test_auth.py`
  - Verify zero schema regressions.

---

### Phase 2: Keyword Routing & Squad Workload Engines
* **Files to Integrate:**
  - `backend/app/services/keyword_router.py` (Replaces 7-line starter stub)
  - `backend/app/services/team_service.py` (Replaces 7-line starter stub)
  - `backend/app/services/ticket_service.py` (`reassign_ticket_team`, `dispatch_existing_ticket`)
* **Features Added:**
  - **Deterministic Keyword Classifier:** Scans grievance text, normalizes tokens, applies 2x weight to issue title, and matches Electrical, Plumbing, Sanitation, Carpentry, and IT departments with confidence scoring.
  - **Workload Balancing Service:** Computes real-time queue depth across squads, filters active/on-duty squads, and calculates capacity utilization percentages.
  - **On-Demand Dispatch Engine Integration:** Automatically or manually dispatches open complaints to the least-loaded squad with zone preference.
* **Testing & Verification Step:**
  - Run keyword classification unit tests on sample complaints.
  - Verify deterministic fallback to General Administration (Department ID 6) if no keywords match.

---

### Phase 3: IIIT-NR Campus Directory, Seed Data & Zone Affinity
* **Files to Integrate:**
  - `backend/app/db/seed.py`
  - `backend/app/services/dispatch_engine.py`
* **Features Added:**
  - **Authentic IIIT-NR Hostels in Zone Affinity:** Automatically routes grievances containing `ramanujan`, `bhabha`, `raman`, `bose`, `shabhari` to hostel maintenance squads.
  - **Authentic Academic & Lab Zones:** Recognizes `idealab`, `vlsi`, `iot`, `data centre`, `131c`, `131e`, `krc`, and `sac` for specialized academic/IT squad routing.
  - **Authentic Administrative Seed Accounts:** Seeds official officers (Estate Officer Rakesh K. Mishra, Electrical JE Ranjeet S. Thakur, Network Engineers Abir Bhattacharya & Parvinder Singh) and 12 maintenance squads.
* **Testing & Verification Step:**
  - Run `python backend/app/db/seed.py`
  - Verify database seeding creates all 12 squads and campus officers.

---

### Phase 4: Administrative Telemetry & REST Endpoints
* **Files to Integrate:**
  - `backend/app/api/v1/endpoints/assignment.py`
  - `backend/app/api/v1/endpoints/complaints.py`
  - `backend/tests/test_iiitnr_and_m2_m4_completions.py`
* **Features Added:**
  - `GET /api/v1/departments`: Lists all campus facilities departments.
  - `PATCH /api/v1/teams/{id}/availability`: Toggles squad on-duty / off-duty shift status.
  - `POST /api/v1/tickets/{id}/dispatch`: Triggers least-loaded automated dispatch on an existing ticket.
  - `GET /api/v1/tickets/export/csv`: Streams downloadable complaint & SLA audit telemetry reports for Estate & SGRC compliance.
* **Testing & Verification Step:**
  - Run `pytest backend/tests/test_iiitnr_and_m2_m4_completions.py`
  - Verify all 49 backend unit and integration tests pass cleanly.

---

### Phase 5: Authentic Frontend Campus UI & Operational Controls
* **Files to Integrate:**
  - `frontend/src/api/assignment.js` (`fetchDepartments`, `toggleSquadAvailability`, `dispatchTicket`)
  - `frontend/src/pages/SubmitComplaint.jsx`
  - `frontend/src/pages/AdminDashboard.jsx`
  - `frontend/src/components/TeamWorkloadView.jsx`
  - `frontend/src/pages/Home.jsx` & `frontend/src/components/Footer.jsx`
* **Features Added:**
  - **Campus Grievance Form:** Dropdowns for Ramanujan, Bhabha, Raman, Bose, Shabhari hostels, Smart E-Classrooms, AI/Data Science labs, Data Centre 131C/131E, and KRC Library.
  - **Shift Availability Toggles:** Real-time On-Duty / Off-Duty buttons for maintenance squads on the supervisor desk.
  - **CSV Audit Report Export:** One-click CSV download button on Admin Console.
  - **Official Contacts:** Sector 24 Nava Raipur emergency directory in Footer and Home.
* **Testing & Verification Step:**
  - Run `npm run build` in `frontend/`.
  - Manually test submitting a complaint from Ramanujan House, toggling squad shifts, and exporting a CSV audit report.

---

## Implementation Schedule Matrix

| Phase | Module | Scope | Status |
| :--- | :--- | :--- | :--- |
| **Phase 1** | M1 Data Layer | Core Constants & Schemas | Pending User Approval |
| **Phase 2** | M2 & M4 Routing | Keyword Classifier & Workload Engine | Pending User Approval |
| **Phase 3** | M1 & M4 Seed/Dispatch | IIIT-NR Zone Affinities & Campus Officers | Pending User Approval |
| **Phase 4** | M2 & M4 Endpoints | CSV Report Export & Shift Availability API | Pending User Approval |
| **Phase 5** | Frontend Consoles | IIIT-NR Campus Selectors, Shift Controls & CSV UI | Pending User Approval |
