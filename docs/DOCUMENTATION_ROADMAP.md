# SmartComplaintHandler — Master Documentation Roadmap & Progress Tracker

> **Repository Branch**: `documentation`  
> **Target Audience**: College Viva Examiners, Project Review Committee, Interviewers, Layman Students  
> **Writing Standard**: **4-Iteration Progressive Refinement** (Every line grounded in basic C/Python, zero unexplained buzzwords, edge cases analyzed, and Viva Q&A included).

---

## The 4-Iteration Refinement Standard (Mandatory for Every File)

Every single file documentation (`.md`) must pass through the following 4 refinement stages:
1. **Iteration 1 (Base Draft)**: Clear layman file purpose, breakdown of all imports, and basic function flow.
2. **Iteration 2 (Audit & Term Expansion)**: Hunting down and explaining every library function, syntax trick (like `@` decorators, `getattr`, `Generator`, `yield`, `split(..., 1)`), and variable origin.
3. **Iteration 3 (Runtime Mechanics & Security)**: Explaining what happens under the hood in memory, database connections (`try...finally: db.close()`), time complexity ($O(1)$ vs $O(N)$), and defense against malicious inputs or crashes.
4. **Iteration 4 (Viva Defense & Summary Table)**: Top 5 to 10 specific viva questions an examiner will ask on *this exact file* with direct model answers, plus a one-sentence summary cheat sheet table.

---

## Master Codebase Execution Order & Progress Tracker

### Phase 1: Backend Foundation & Core Configuration
- [x] `backend/app/main.py` &rarr; [`docs/codebase/backend/app/main.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/main.py.md)
- [x] `backend/app/core/config.py` &rarr; [`docs/codebase/backend/app/core/config.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/core/config.py.md)
- [x] `backend/app/core/constants.py` &rarr; [`docs/codebase/backend/app/core/constants.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/core/constants.py.md)
- [x] `backend/app/core/database.py` &rarr; [`docs/codebase/backend/app/core/database.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/core/database.py.md)
- [x] `backend/app/core/security.py` &rarr; [`docs/codebase/backend/app/core/security.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/core/security.py.md)
- [x] `backend/app/db/base.py` &rarr; [`docs/codebase/backend/app/db/base.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/db/base.py.md)
- [x] `backend/app/db/seed.py` &rarr; [`docs/codebase/backend/app/db/seed.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/db/seed.py.md)

### Phase 2: Backend Data Models (SQLAlchemy ORM)
- [x] `backend/app/models/base.py` &rarr; [`docs/codebase/backend/app/models/base.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/models/base.py.md)
- [x] `backend/app/models/department.py` &rarr; [`docs/codebase/backend/app/models/department.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/models/department.py.md)
- [x] `backend/app/models/team.py` &rarr; [`docs/codebase/backend/app/models/team.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/models/team.py.md)
- [x] `backend/app/models/user.py` &rarr; [`docs/codebase/backend/app/models/user.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/models/user.py.md)
- [x] `backend/app/models/ticket.py` &rarr; [`docs/codebase/backend/app/models/ticket.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/models/ticket.py.md)
- [x] `backend/app/models/campus.py` &rarr; [`docs/codebase/backend/app/models/campus.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/models/campus.py.md)

### Phase 3: Backend Schemas (Pydantic Data Contracts)
- [x] `backend/app/schemas/user.py` &rarr; [`docs/codebase/backend/app/schemas/user.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/schemas/user.py.md)
- [x] `backend/app/schemas/department.py` &rarr; [`docs/codebase/backend/app/schemas/department.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/schemas/department.py.md)
- [x] `backend/app/schemas/ticket.py` &rarr; [`docs/codebase/backend/app/schemas/ticket.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/schemas/ticket.py.md)
- [x] `backend/app/schemas/complaint.py` &rarr; [`docs/codebase/backend/app/schemas/complaint.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/schemas/complaint.py.md)
- [x] `backend/app/schemas/priority.py` &rarr; [`docs/codebase/backend/app/schemas/priority.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/schemas/priority.py.md)
- [x] `backend/app/schemas/assignment.py` &rarr; [`docs/codebase/backend/app/schemas/assignment.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/schemas/assignment.py.md)
- [x] `backend/app/schemas/sla.py` &rarr; [`docs/codebase/backend/app/schemas/sla.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/schemas/sla.py.md)
- [x] `backend/app/schemas/campus.py` &rarr; [`docs/codebase/backend/app/schemas/campus.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/schemas/campus.py.md)

### Phase 4: Backend Business Logic & Autonomous Service Engines
- [x] `backend/app/utils/code_generator.py` &rarr; [`docs/codebase/backend/app/utils/code_generator.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/utils/code_generator.py.md)
- [x] `backend/app/services/classifier.py` &rarr; [`docs/codebase/backend/app/services/classifier.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/services/classifier.py.md)
- [x] `backend/app/services/keyword_router.py` &rarr; [`docs/codebase/backend/app/services/keyword_router.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/services/keyword_router.py.md)
- [x] `backend/app/services/priority_engine.py` &rarr; [`docs/codebase/backend/app/services/priority_engine.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/services/priority_engine.py.md)
- [x] `backend/app/services/dispatch_engine.py` &rarr; [`docs/codebase/backend/app/services/dispatch_engine.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/services/dispatch_engine.py.md)
- [x] `backend/app/services/sla_engine.py` &rarr; [`docs/codebase/backend/app/services/sla_engine.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/services/sla_engine.py.md)
- [x] `backend/app/services/lifecycle.py` &rarr; [`docs/codebase/backend/app/services/lifecycle.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/services/lifecycle.py.md)
- [x] `backend/app/services/ticket_service.py` &rarr; [`docs/codebase/backend/app/services/ticket_service.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/services/ticket_service.py.md)
- [x] `backend/app/services/user_service.py` &rarr; [`docs/codebase/backend/app/services/user_service.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/services/user_service.py.md)
- [x] `backend/app/services/team_service.py` &rarr; [`docs/codebase/backend/app/services/team_service.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/services/team_service.py.md)
- [x] `backend/app/services/ai_triage_service.py` &rarr; [`docs/codebase/backend/app/services/ai_triage_service.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/services/ai_triage_service.py.md)

### Phase 5: Backend API Layer & Endpoints
- [x] `backend/app/api/deps.py` &rarr; [`docs/codebase/backend/app/api/deps.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/api/deps.py.md)
- [x] `backend/app/api/v1/router.py` &rarr; [`docs/codebase/backend/app/api/v1/router.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/api/v1/router.py.md)
- [x] `backend/app/api/v1/endpoints/auth.py` &rarr; [`docs/codebase/backend/app/api/v1/endpoints/auth.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/api/v1/endpoints/auth.py.md)
- [x] `backend/app/api/v1/endpoints/complaints.py` &rarr; [`docs/codebase/backend/app/api/v1/endpoints/complaints.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/api/v1/endpoints/complaints.py.md)
- [x] `backend/app/api/v1/endpoints/priority.py` &rarr; [`docs/codebase/backend/app/api/v1/endpoints/priority.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/api/v1/endpoints/priority.py.md)
- [x] `backend/app/api/v1/endpoints/assignment.py` &rarr; [`docs/codebase/backend/app/api/v1/endpoints/assignment.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/api/v1/endpoints/assignment.py.md)
- [x] `backend/app/api/v1/endpoints/sla.py` &rarr; [`docs/codebase/backend/app/api/v1/endpoints/sla.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/api/v1/endpoints/sla.py.md)
- [x] `backend/app/api/v1/endpoints/campus.py` &rarr; [`docs/codebase/backend/app/api/v1/endpoints/campus.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/api/v1/endpoints/campus.py.md)
- [x] `backend/app/api/v1/endpoints/superadmin.py` &rarr; [`docs/codebase/backend/app/api/v1/endpoints/superadmin.py.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/api/v1/endpoints/superadmin.py.md)

### Phase 6: Frontend Architecture, HTTP Client & Global State
- [ ] `frontend/src/main.jsx` &rarr; `docs/codebase/frontend/src/main.jsx.md`
- [ ] `frontend/src/App.jsx` &rarr; `docs/codebase/frontend/src/App.jsx.md`
- [ ] `frontend/src/styles/globals.css` &rarr; `docs/codebase/frontend/src/styles/globals.css.md`
- [ ] `frontend/src/api/client.js` &rarr; `docs/codebase/frontend/src/api/client.js.md`
- [ ] `frontend/src/api/auth.js` &rarr; `docs/codebase/frontend/src/api/auth.js.md`
- [ ] `frontend/src/api/complaints.js` &rarr; `docs/codebase/frontend/src/api/complaints.js.md`
- [ ] `frontend/src/api/assignment.js` &rarr; `docs/codebase/frontend/src/api/assignment.js.md`
- [ ] `frontend/src/api/sla.js` &rarr; `docs/codebase/frontend/src/api/sla.js.md`
- [ ] `frontend/src/api/campus.js` &rarr; `docs/codebase/frontend/src/api/campus.js.md`
- [ ] `frontend/src/api/superadmin.js` &rarr; `docs/codebase/frontend/src/api/superadmin.js.md`
- [ ] `frontend/src/api/triage.js` &rarr; `docs/codebase/frontend/src/api/triage.js.md`
- [ ] `frontend/src/context/AuthContext.jsx` &rarr; `docs/codebase/frontend/src/context/AuthContext.jsx.md`
- [ ] `frontend/src/context/ThemeContext.jsx` &rarr; `docs/codebase/frontend/src/context/ThemeContext.jsx.md`
- [x] `frontend/src/router/AppRouter.jsx` &rarr; [`docs/codebase/frontend/src/router/AppRouter.jsx.md`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/frontend/src/router/AppRouter.jsx.md)
- [ ] `frontend/src/utils/dateUtils.js` &rarr; `docs/codebase/frontend/src/utils/dateUtils.js.md`

### Phase 7: Frontend Reusable Components & Campus Digital Twin
- [ ] `frontend/src/components/Navbar.jsx` &rarr; `docs/codebase/frontend/src/components/Navbar.jsx.md`
- [ ] `frontend/src/components/Footer.jsx` &rarr; `docs/codebase/frontend/src/components/Footer.jsx.md`
- [ ] `frontend/src/components/Layout.jsx` &rarr; `docs/codebase/frontend/src/components/Layout.jsx.md`
- [ ] `frontend/src/components/PriorityBadge.jsx` &rarr; `docs/codebase/frontend/src/components/PriorityBadge.jsx.md`
- [ ] `frontend/src/components/SLACountdownTimer.jsx` &rarr; `docs/codebase/frontend/src/components/SLACountdownTimer.jsx.md`
- [ ] `frontend/src/components/SLABreachTable.jsx` &rarr; `docs/codebase/frontend/src/components/SLABreachTable.jsx.md`
- [ ] `frontend/src/components/LiveTriageCard.jsx` &rarr; `docs/codebase/frontend/src/components/LiveTriageCard.jsx.md`
- [ ] `frontend/src/components/TeamWorkloadView.jsx` &rarr; `docs/codebase/frontend/src/components/TeamWorkloadView.jsx.md`
- [ ] `frontend/src/components/PriorityOverrideModal.jsx` &rarr; `docs/codebase/frontend/src/components/PriorityOverrideModal.jsx.md`
- [ ] `frontend/src/components/ReassignTeamModal.jsx` &rarr; `docs/codebase/frontend/src/components/ReassignTeamModal.jsx.md`
- [ ] `frontend/src/components/ResolutionNotesModal.jsx` &rarr; `docs/codebase/frontend/src/components/ResolutionNotesModal.jsx.md`
- [ ] `frontend/src/components/SetPasswordModal.jsx` &rarr; `docs/codebase/frontend/src/components/SetPasswordModal.jsx.md`
- [ ] `frontend/src/components/SubmissionSuccessModal.jsx` &rarr; `docs/codebase/frontend/src/components/SubmissionSuccessModal.jsx.md`
- [ ] `frontend/src/components/CampusMapSelector.jsx` &rarr; `docs/codebase/frontend/src/components/CampusMapSelector.jsx.md`
- [ ] `frontend/src/data/iiitnrCampusData.js` &rarr; `docs/codebase/frontend/src/data/iiitnrCampusData.js.md`
- [ ] `frontend/src/data/campusTwin/campusGeometry.js` &rarr; `docs/codebase/frontend/src/data/campusTwin/campusGeometry.js.md`
- [ ] `frontend/src/data/campusTwin/campusLabsAndRooms.js` &rarr; `docs/codebase/frontend/src/data/campusTwin/campusLabsAndRooms.js.md`
- [ ] `frontend/src/data/campusTwin/campusSearchEngine.js` &rarr; `docs/codebase/frontend/src/data/campusTwin/campusSearchEngine.js.md`
- [ ] `frontend/src/components/campusTwin/useMapCamera.js` &rarr; `docs/codebase/frontend/src/components/campusTwin/useMapCamera.js.md`
- [ ] `frontend/src/components/campusTwin/DigitalTwinCanvas.jsx` &rarr; `docs/codebase/frontend/src/components/campusTwin/DigitalTwinCanvas.jsx.md`
- [ ] `frontend/src/components/campusTwin/DigitalTwinInspector.jsx` &rarr; `docs/codebase/frontend/src/components/campusTwin/DigitalTwinInspector.jsx.md`
- [ ] `frontend/src/components/campusTwin/DigitalTwinSearchBar.jsx` &rarr; `docs/codebase/frontend/src/components/campusTwin/DigitalTwinSearchBar.jsx.md`

### Phase 8: Frontend Pages & Interactive Workstations
- [ ] `frontend/src/pages/Home.jsx` &rarr; `docs/codebase/frontend/src/pages/Home.jsx.md`
- [ ] `frontend/src/pages/Login.jsx` &rarr; `docs/codebase/frontend/src/pages/Login.jsx.md`
- [ ] `frontend/src/pages/Register.jsx` &rarr; `docs/codebase/frontend/src/pages/Register.jsx.md`
- [ ] `frontend/src/pages/SubmitComplaint.jsx` &rarr; `docs/codebase/frontend/src/pages/SubmitComplaint.jsx.md`
- [ ] `frontend/src/pages/TrackTicket.jsx` &rarr; `docs/codebase/frontend/src/pages/TrackTicket.jsx.md`
- [ ] `frontend/src/pages/StudentDashboard.jsx` &rarr; `docs/codebase/frontend/src/pages/StudentDashboard.jsx.md`
- [ ] `frontend/src/pages/TechnicianWorkstation.jsx` &rarr; `docs/codebase/frontend/src/pages/TechnicianWorkstation.jsx.md`
- [ ] `frontend/src/pages/AdminDashboard.jsx` &rarr; `docs/codebase/frontend/src/pages/AdminDashboard.jsx.md`
- [ ] `frontend/src/pages/SuperAdminDashboard.jsx` &rarr; `docs/codebase/frontend/src/pages/SuperAdminDashboard.jsx.md`
- [ ] `frontend/src/pages/SuperAdminDataEditor.jsx` &rarr; `docs/codebase/frontend/src/pages/SuperAdminDataEditor.jsx.md`
- [ ] `frontend/src/pages/ResidenceInfo.jsx` &rarr; `docs/codebase/frontend/src/pages/ResidenceInfo.jsx.md`
- [ ] `frontend/src/pages/SquadsPage.jsx` &rarr; `docs/codebase/frontend/src/pages/SquadsPage.jsx.md`
- [ ] `frontend/src/pages/StaffDirectoryPage.jsx` &rarr; `docs/codebase/frontend/src/pages/StaffDirectoryPage.jsx.md`
