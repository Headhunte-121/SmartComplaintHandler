# Codebase Documentation Index & Execution Roadmap

> **Standard**: **4-Iteration Progressive Refinement**  
> Every file is documented so someone with only basic C and Python knowledge can understand every single word, variable, and line of code for their viva/interview.

---

## The 4-Iteration Refinement Standard

Each file undergoes four progressive expansion passes:
- **Iteration 1 (Base Draft)**: High-level purpose, import breakdown, and basic function-by-function walkthrough.
- **Iteration 2 (Audit & Unexplained Term Expansion)**: Identifies all library tools, decorators, syntax idioms (`getattr`, `yield`, `split`), and objects whose definitions or origins were assumed, expanding them in simple C/Python terms.
- **Iteration 3 (Runtime Mechanics & Edge Cases)**: Explains the internal mechanics (memory lifecycle, database sessions `try...finally: db.close()`, HTTP status codes, $O(1)$ vs $O(N)$ lookups) and failure modes.
- **Iteration 4 (Viva & Interview Defense Guide)**: The top 5–10 examiner questions on that specific file with model answers, plus a quick viva summary table.

---

## Master File Execution Order

### Phase 1: Backend Foundation & Core Configuration
1. [`backend/app/main.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/main.py.md) — Application entry point, ASGI server, CORS & lifespan.
2. [`backend/app/core/config.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/core/config.py.md) — Central configuration, environment variables, Pydantic settings.
3. [`backend/app/core/constants.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/core/constants.py.md) — System roles, status codes, SLA thresholds, priorities.
4. [`backend/app/core/database.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/core/database.py.md) — SQLAlchemy engine, connection pooling, SQLite WAL PRAGMAs, SessionLocal.
5. [`backend/app/core/security.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/core/security.py.md) — Bcrypt hashing, JWT access/refresh tokens, stateless OTP verification.
6. [`backend/app/db/base.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/db/base.py.md) — Declarative ORM base and model metadata registry.
7. [`backend/app/db/seed.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/db/seed.py.md) — Idempotent database seeder (departments, squads, campus buildings).

### Phase 2: Backend Data Models (SQLAlchemy ORM)
8. [`backend/app/models/base.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/models/base.py.md) — Timestamp and audit field mixins.
9. [`backend/app/models/department.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/models/department.py.md) — Academic & facilities department entities.
10. [`backend/app/models/team.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/models/team.py.md) — Maintenance squads and technician team assignments.
11. [`backend/app/models/user.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/models/user.py.md) — User accounts, roles, hostel info, auth credentials.
12. [`backend/app/models/ticket.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/models/ticket.py.md) — Complaint tickets, status state machine, SLA fields.
13. [`backend/app/models/campus.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/models/campus.py.md) — Campus buildings, rooms, GIS digital twin coordinates.

### Phase 3: Backend Schemas (Pydantic Data Contracts)
14. [`backend/app/schemas/user.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/schemas/user.py.md) — Auth requests, login, registration, user profile DTOs.
15. [`backend/app/schemas/department.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/schemas/department.py.md) — Department request/response contracts.
16. [`backend/app/schemas/ticket.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/schemas/ticket.py.md) — Ticket creation, update, tracking schemas.
17. [`backend/app/schemas/complaint.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/schemas/complaint.py.md) — Complaint intake and legacy schemas.
18. [`backend/app/schemas/priority.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/schemas/priority.py.md) — Priority evaluation and AI triage contracts.
19. [`backend/app/schemas/assignment.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/schemas/assignment.py.md) — Squad dispatch and technician workload schemas.
20. [`backend/app/schemas/sla.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/schemas/sla.py.md) — SLA countdown, breach calculation schemas.
21. [`backend/app/schemas/campus.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/schemas/campus.py.md) — Building directory and GIS digital twin schemas.

### Phase 4: Backend Business Logic & Autonomous Service Engines
22. [`backend/app/utils/code_generator.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/utils/code_generator.py.md) — Tracking code generator (`TICK-XXXX`).
23. [`backend/app/services/classifier.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/services/classifier.py.md) — 5-domain taxonomy classifier engine.
24. [`backend/app/services/keyword_router.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/services/keyword_router.py.md) — Architectural starter template for keyword routing.
25. [`backend/app/services/priority_engine.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/services/priority_engine.py.md) — Multi-factor priority matrix and hazard detector.
26. [`backend/app/services/dispatch_engine.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/services/dispatch_engine.py.md) — Autonomous workload balancing and squad dispatch.
27. [`backend/app/services/sla_engine.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/services/sla_engine.py.md) — SLA timer calculation, breach detection, escalation warnings.
28. [`backend/app/services/lifecycle.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/services/lifecycle.py.md) — Finite state machine lifecycle transitions.
29. [`backend/app/services/ticket_service.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/services/ticket_service.py.md) — Complaint orchestrator, CRUD, history, and status updates.
30. [`backend/app/services/user_service.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/services/user_service.py.md) — User authentication, password management, Google SSO, RBAC.
31. [`backend/app/services/team_service.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/services/team_service.py.md) — Architectural starter template for team service.
32. [`backend/app/services/ai_triage_service.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/services/ai_triage_service.py.md) — Groq / Gemini LLM integration for automated triage.

### Phase 5: Backend API Layer & Endpoints
33. [`backend/app/api/deps.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/api/deps.py.md) — Dependency injection: get_db, auth, RBAC.
34. [`backend/app/api/v1/router.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/api/v1/router.py.md) — Master API router aggregator.
35. [`backend/app/api/v1/endpoints/auth.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/api/v1/endpoints/auth.py.md) — Authentication, Google SSO, OTP, user management.
36. [`backend/app/api/v1/endpoints/complaints.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/api/v1/endpoints/complaints.py.md) — Complaint intake and tracking endpoints.
37. [`backend/app/api/v1/endpoints/priority.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/api/v1/endpoints/priority.py.md) — Priority override and AI triage inspection.
38. [`backend/app/api/v1/endpoints/assignment.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/api/v1/endpoints/assignment.py.md) — Squad assignment and workload endpoints.
39. [`backend/app/api/v1/endpoints/sla.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/api/v1/endpoints/sla.py.md) — SLA monitoring and resolution clocks.
40. [`backend/app/api/v1/endpoints/campus.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/api/v1/endpoints/campus.py.md) — Campus GIS and building directory endpoints.
41. [`backend/app/api/v1/endpoints/superadmin.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/backend/app/api/v1/endpoints/superadmin.py.md) — Directorate supervisory console endpoints.

### Phase 6: Frontend Architecture, HTTP Client & Global State
42. `frontend/src/main.jsx` — React DOM entry point.
43. `frontend/src/App.jsx` — Root component and context providers.
44. `frontend/src/styles/globals.css` — CSS design system and Tailwind styling.
45. `frontend/src/api/client.js` — Axios client, request/response interceptors, auto token refresh.
46. `frontend/src/api/auth.js` — Auth API client methods.
47. `frontend/src/api/complaints.js` — Complaints API client methods.
48. `frontend/src/api/assignment.js` — Dispatch API client methods.
49. `frontend/src/api/sla.js` — SLA API client methods.
50. `frontend/src/api/campus.js` — Campus digital twin API client methods.
51. `frontend/src/api/superadmin.js` — SuperAdmin telemetry API client methods.
52. `frontend/src/api/triage.js` — AI triage preview API client methods.
53. `frontend/src/context/AuthContext.jsx` — Authentication context, persistent session, role state.
54. `frontend/src/context/ThemeContext.jsx` — Dark/light mode theme context.
55. [`frontend/src/router/AppRouter.jsx`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/docs/codebase/frontend/src/router/AppRouter.jsx.md) — Client-side route declarations and RBAC guards.
56. `frontend/src/utils/dateUtils.js` — Date formatting and countdown utilities.

### Phase 7: Frontend Reusable Components & Campus Digital Twin
57. `frontend/src/components/Navbar.jsx` — Navigation bar and profile pill.
58. `frontend/src/components/Footer.jsx` — Portal footer and copyright.
59. `frontend/src/components/Layout.jsx` — Core layout container wrapper.
60. `frontend/src/components/PriorityBadge.jsx` — P1 to P4 visual badge component.
61. `frontend/src/components/SLACountdownTimer.jsx` — Live countdown timer widget.
62. `frontend/src/components/SLABreachTable.jsx` — SLA risk table with breach warnings.
63. `frontend/src/components/LiveTriageCard.jsx` — Real-time AI triage explanation card.
64. `frontend/src/components/TeamWorkloadView.jsx` — Squad capacity bar charts.
65. `frontend/src/components/PriorityOverrideModal.jsx` — Admin priority adjustment dialog.
66. `frontend/src/components/ReassignTeamModal.jsx` — Squad reassignment dialog.
67. `frontend/src/components/ResolutionNotesModal.jsx` — Technician work completion dialog.
68. `frontend/src/components/SetPasswordModal.jsx` — Password creation dialog.
69. `frontend/src/components/SubmissionSuccessModal.jsx` — Complaint submission confirmation.
70. `frontend/src/components/CampusMapSelector.jsx` — Interactive campus building/room selector.
71. `frontend/src/data/iiitnrCampusData.js` — Static campus coordinates and building list.
72. `frontend/src/data/campusTwin/campusGeometry.js` — 2D/3D polygon coordinates of campus buildings.
73. `frontend/src/data/campusTwin/campusLabsAndRooms.js` — Campus room directory.
74. `frontend/src/data/campusTwin/campusSearchEngine.js` — In-memory search engine for campus spaces.
75. `frontend/src/components/campusTwin/useMapCamera.js` — Map pan and zoom camera hook.
76. `frontend/src/components/campusTwin/DigitalTwinCanvas.jsx` — Interactive SVG/Canvas campus map.
77. `frontend/src/components/campusTwin/DigitalTwinInspector.jsx` — Selected building details sidebar.
78. `frontend/src/components/campusTwin/DigitalTwinSearchBar.jsx` — Autocomplete search bar.

### Phase 8: Frontend Pages & Interactive Workstations
79. `frontend/src/pages/Home.jsx` — Public landing page.
80. `frontend/src/pages/Login.jsx` — Login page with Google SSO and password auth.
81. `frontend/src/pages/Register.jsx` — Student registration page with OTP challenge.
82. `frontend/src/pages/SubmitComplaint.jsx` — Complaint submission form with live AI triage.
83. `frontend/src/pages/TrackTicket.jsx` — Public ticket tracking page.
84. `frontend/src/pages/StudentDashboard.jsx` — Student grievance history dashboard.
85. `frontend/src/pages/TechnicianWorkstation.jsx` — Technician assigned jobs workstation.
86. `frontend/src/pages/AdminDashboard.jsx` — Department admin triage and dispatch desk.
87. `frontend/src/pages/SuperAdminDashboard.jsx` — Directorate supervisory console.
88. `frontend/src/pages/SuperAdminDataEditor.jsx` — Direct database table editor.
89. `frontend/src/pages/ResidenceInfo.jsx` — Hostel facilities and warden directory.
90. `frontend/src/pages/SquadsPage.jsx` — Maintenance squad rosters.
91. `frontend/src/pages/StaffDirectoryPage.jsx` — Campus staff directory.
