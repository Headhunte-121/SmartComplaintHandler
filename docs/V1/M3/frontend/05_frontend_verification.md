# Module M3 - Frontend File 05: Triage & Priority Frontend Verification Protocol
## Target: Full End-to-End Module M3 Frontend Verification Suite
### Execution Track: Phase 5 (Full Frontend Integration Verification & Quality Gate)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In professional software engineering and modern Single Page Application (SPA) development, this verification protocol serves as the **Frontend User Interface & Interaction Quality Gate**. It is the standard operating procedure used to certify that all UI components, state machines, debouncing timers, input validation guards, API transport clients, and user interaction flows function reliably in real web browsers before software is deployed to campus students and facility staff.

### Standard Industry Role & Real-World Use Cases
In modern enterprise frontend engineering, an integration verification protocol standardly fulfills four core architectural duties:

1. **The End-to-End User Experience Gate:**
   * Proves that students receive instant, debounced feedback as they type complaints, and that supervisors can adjust priority tiers seamlessly without encountering JavaScript console errors or visual layout glitches.
2. **Defensive Client-Side Validation Verification:**
   * Verifies that modals actively prevent invalid submissions (e.g. disabling buttons when override reasons are under 5 characters) before HTTP requests are dispatched, saving server CPU cycles and network bandwidth.
3. **Hazard Alert Interception Certification:**
   * Confirms that whenever a complaint mentions life-safety hazards (sparking, smoke, fire), the UI immediately displays high-contrast emergency warning banners, reassuring students that their complaint is recognized as critical.
4. **State Synchronization & Cache Consistency:**
   * Confirms that when a supervisor overrides an incident's priority tier, the UI state updates immediately and remains synchronized with the backend database without requiring manual browser page refreshes.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our campus complaint automation platform, our 5-student engineering team specifically uses this protocol for four concrete operational goals:

1. **Certifying the Live Triage Preview Card (`LiveTriageCard.jsx`):**
   * Verifies that typing complaint text into the submission form triggers a clean, debounced `POST /api/v1/tickets/triage-preview` call after 500ms of user inactivity, rendering predicted department tags, priority badges, and confidence meters.
2. **Validating Reusable Priority Badges (`PriorityBadge.jsx`):**
   * Confirms that all four priority tiers (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) render with correct colors and animations, especially verifying that `CRITICAL` pulses prominently.
3. **Testing the Administrative Priority Override Modal (`PriorityOverrideModal.jsx`):**
   * Verifies the complete override flow: clicking "Adjust Priority", selecting a target tier, enforcing the mandatory 5-character reason, submitting the change, and seeing the table row update instantaneously.
4. **Ensuring Zero Regressions Across Full-Stack Milestones:**
   * Confirms that connecting Module M3 frontend components does not break student submission forms (Module M2) or database tracking lookups.

### Future AI Integration & UI Verification (V2 Roadmap)
While testing deterministic classification today, this protocol establishes the baseline verification procedure for future AI triage:
* **Validating the Permanent Human-in-the-Loop Gateway:** Checkpoint 4 certifies that the supervisor override interface operates flawlessly, guaranteeing that human supervisors retain full operational control when AI triage models are deployed in Version 2.

### The Core Problem It Solves & Why It Exists
* **The "Silent Hazard" Defect:** Without structured UI testing, a styling bug could prevent the emergency hazard alert from displaying, leaving a student unaware that their fire hazard report was escalated.
* **Typing Floods (Denial of Service):** Confirms that debouncing timers properly throttle rapid keystrokes, preventing hundreds of redundant HTTP requests from hitting the server.

---

# 2. The 5 Verification Checkpoints

---

### Checkpoint 1: Frontend API Client Verification (Network Bridge)
* **What is tested:**  
  Executing `fetchTriagePreview` and `overrideTicketPriority` from `frontend/src/api/triage.js` directly within the browser developer tools console.
* **Why this test is needed:**  
  Confirms that:
  1. The API base URL correctly connects to the backend server.
  2. The preview endpoint returns valid `TriageResult` JSON objects with normalized confidence scores.
  3. Override calls serialize JSON payloads matching backend Pydantic schemas.
* **Execution Procedure (In Chrome/Edge DevTools Console with Backend & Frontend Running):**  
  `import('/src/api/triage.js').then(api => api.fetchTriagePreview('Water pipe leak in lab', 'Pipe broken under sink flooding floor')).then(data => console.log('Checkpoint 1 PASSED: Triage preview fetched:', data.priority, data.category, data.confidence))`
* **Observable Success Criteria:**  
  The browser console prints `Checkpoint 1 PASSED: Triage preview fetched: HIGH Plumbing` with a numeric confidence score between 0.0 and 1.0.

---

### Checkpoint 2: Reusable Priority Badge Component Rendering
* **What is tested:**  
  Rendering `<PriorityBadge />` across all four priority tiers (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
* **Why this test is needed:**  
  Proves that:
  1. `CRITICAL` renders with red styling (`bg-rose-100 text-rose-800 border-rose-300`) and an active pulse animation (`animate-pulse`).
  2. `HIGH` renders in amber, `MEDIUM` in blue, and `LOW` in slate gray.
  3. Lowercase inputs like `"critical"` normalize cleanly to uppercase without crashing.
* **Execution Procedure:**  
  1. Inspect the Priority column in the Admin Desk table or review isolated storybook components.
  2. Verify that complaints triaged as `CRITICAL` pulse visually on the screen.
* **Observable Success Criteria:**  
  All priority badges display distinct colors with appropriate icons and WCAG-compliant high-contrast text.

---

### Checkpoint 3: Live Triage Card Debounce & Hazard Warning Banner
* **What is tested:**  
  Interacting with Title and Description inputs on `SubmitTicket.jsx` and observing `<LiveTriageCard />`.
* **Why this test is needed:**  
  Confirms that:
  1. Typing less than 5 characters displays the informational placeholder card.
  2. Pausing typing for 500ms dispatches exactly one `POST /api/v1/tickets/triage-preview` network request.
  3. Including hazard terms (e.g. `"sparking"`, `"fire"`, `"smoke"`) triggers the flashing red emergency warning alert banner.
* **Execution Procedure:**  
  1. Open `http://localhost:5173/submit`.
  2. Type Title: `"Ceiling fan sparking"` and Description: `"Motor is smoking heavily and emitting visible fire sparks"`.
  3. Pause typing for 500ms.
* **Observable Success Criteria:**  
  The card transitions to a full diagnostic display showing:
  * A flashing red alert banner: `"⚠️ Immediate Safety Hazard Detected..."`.
  * Category pill: `"Electrical"`.
  * Priority badge: Pulsing red `CRITICAL`.
  * Matched keyword tags: `["spark", "smoke", "fire"]`.

---

### Checkpoint 4: Supervisory Priority Override Modal & Validation Guard
* **What is tested:**  
  Opening `PriorityOverrideModal.jsx`, verifying validation rules, and submitting a priority adjustment.
* **Why this test is needed:**  
  Proves that:
  1. Clicking "Adjust Priority" on a complaint row opens the modal displaying the ticket's title and current priority.
  2. The "Save Priority Change" button is strictly disabled until a new priority is selected AND the reason text is at least 5 characters.
  3. Submitting the form fires `PATCH /api/v1/tickets/{id}/priority` and updates the table row immediately upon completion.
* **Execution Procedure:**  
  1. On `http://localhost:5173/admin`, click "Adjust Priority" on any ticket row.
  2. In the modal dropdown, select a different priority tier (e.g. change `CRITICAL` to `HIGH`).
  3. Type `"Short"` (5 characters) into the reason field; observe button enables.
  4. Type `"Inspection confirmed circuit breaker isolated; work scheduled as urgent"` and click "Save Priority Change".
* **Observable Success Criteria:**  
  The modal closes smoothly, and the table row displays the new priority badge immediately.

---

### Checkpoint 5: End-to-End Full-Stack Verification (Student Form to SQLite)
* **What is tested:**  
  Submitting a complaint on the student portal and verifying dynamic priority calculation and supervisor override in the database.
* **Why this test is needed:**  
  Certifies the complete full-stack integration:
  1. A complaint submitted at `http://localhost:5173/submit` receives dynamic priority calculation and is saved to `smart_complaints.db`.
  2. The complaint appears immediately on the Admin Desk at `http://localhost:5173/admin` with its calculated priority badge.
  3. The supervisor overrides the priority, and the updated priority and audit reason are reflected in both the UI and SQLite database.
* **Execution Procedure:**  
  1. Submit a complaint: Title `"Live wire hanging in hallway"`, Description `"Wire sparking near wet floor"`, Location `"Hostel Block B"`.
  2. Open `http://localhost:5173/admin` and find the ticket. Verify `priority` is `CRITICAL`.
  3. Override priority to `MEDIUM` with reason `"Wire was dead telecom line, no voltage present"`.
* **Observable Success Criteria:**  
  The ticket reflects `priority = "MEDIUM"` and `resolution_notes` contains the timestamped audit log.

---

# 3. Component Life-Cycle: Input, Process, Output (IPO Table)

The following table documents the end-to-end data life-cycle across the entire frontend verification suite:

| Checkpoint Stage | Input Received | System Verification Processing | Output Produced | Failure Modes Diagnosed |
| :--- | :--- | :--- | :--- | :--- |
| **Checkpoint 1 (API Client)** | Function call with parameters. | Dispatches HTTP requests using `fetch()`; checks `response.ok`. | Parsed `TriageResult` JSON or formatted JavaScript Error. | Identifies CORS blocking, wrong port numbers, or missing backend routes. |
| **Checkpoint 2 (Priority Badge)** | Priority string prop. | Resolves `PRIORITY_STYLES`; normalizes case. | Rendered visual pill badge with icons and pulse animation. | Identifies broken CSS classes, contrast failures, or missing icons. |
| **Checkpoint 3 (Live Triage Card)**| Input keystrokes. | Evaluates 500ms debounce timer; dispatches preview request. | Live preview card with category pill, confidence bar, and hazard alert. | Identifies broken debounce timers, missing length guards, or layout shifts. |
| **Checkpoint 4 (Override Modal)** | User clicks, priority select, reason text. | Enforces controlled input validation; dispatches HTTP PATCH. | Updated ticket row and closed modal overlay. | Identifies validation bypasses, missing reason guards, or broken modal callbacks. |
| **Checkpoint 5 (Full-Stack E2E)** | User complaint submission to dashboard. | End-to-end traversal: React Form ➔ FastAPI ➔ SQLite ➔ Triage Engine ➔ Admin Desk. | Complete, verified complaint lifecycle with audit trails. | Identifies data truncation, broken foreign keys, or missing state updates. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. Strict Non-Negotiables

To ensure UI consistency across different developer laptops, adhere to the following rules:

### 🟢 Safe to Modify (Configurable Parameters)
* **Visual Colors & Tailwind Spacing:** You can customize color palettes, card padding, and modal border radiuses.
* **Toast Notification Libraries:** You can use custom toast libraries (like `react-hot-toast` or native Tailwind banners) for success feedback.
* **Browser Test Tools:** You can run these tests in Google Chrome, Microsoft Edge, Firefox, or Brave.

### 🔴 Strict Non-Negotiables (System Breaking Changes)
* **DO NOT Bypass Client-Side Validation in Checkpoint 4:** The modal must strictly prevent submission if the justification reason is under 5 characters.
* **DO NOT Disable CORS in Production Insecurely:** Ensure CORS allows `http://localhost:5173` cleanly during development without wildcarding sensitive headers.
* **DO NOT Hardcode Mock Data:** Checkpoint 5 MUST test live communication between the React frontend on port 5173 and the FastAPI backend on port 8000.

---

# 5. Architectural & Theoretical References

This specification operates strictly as an **implementation and integration blueprint**. For the exhaustive computer science fundamentals, language runtime mechanics, and protocol specifications governing this component, consult the following authoritative manuals in the **Developer Guide Suite**:

* [**Guide 10: Vite Build Engine & Module Bundling**](../../../developer_guide/10_VITE_AND_MODERN_BUILD_TOOLCHAINS.md)  
  Production bundle compilation, asset minification, and static export validation.

* [**Guide 07: React 18 Architecture & Virtual DOM**](../../../developer_guide/07_REACT_18_AND_VIRTUAL_DOM_ARCHITECTURE.md)  
  Component mount validation and teardown memory leak prevention.

* [**Unit 14B: Web Browser Security & Origin Policies**](../../../developer_guide/14B_WEB_BROWSER_SECURITY_AND_ORIGIN_POLICIES.md)  
  Browser DevTools console auditing, network inspect validation, and SOP error diagnostics.

---

# 6. Definition of Done & Troubleshooting Matrix

Before considering Module M3 Frontend fully signed off, all 5 verification checkpoints must pass without a single failure.

### Operational Sign-Off Checklist
- [ ] Checkpoint 1 passes: API client methods fetch triage previews and submit priority overrides with zero uncaught errors.
- [ ] Checkpoint 2 passes: Priority badges render with distinct colors, icons, and pulsing animation for `CRITICAL`.
- [ ] Checkpoint 3 passes: Live triage card debounces keystrokes (500ms) and displays flashing red hazard alert on danger terms.
- [ ] Checkpoint 4 passes: Priority override modal enforces 5-character reason validation and updates table rows smoothly.
- [ ] Checkpoint 5 passes: Complete full-stack complaint flow verified from student preview to supervisor override in SQLite.

---

### Frontend Troubleshooting Matrix

| Issue Observed in Browser | Root Cause of Failure | Concrete Immediate Fix |
| :--- | :--- | :--- |
| `Failed to fetch / NetworkError` | FastAPI backend is not running or running on an unexpected port. | Boot the backend server: `uvicorn app.main:app --reload --port 8000`. |
| `CORS error: No 'Access-Control-Allow-Origin' header` | Vite frontend port is not registered in backend CORS origins. | In `backend/app/main.py`, verify `allow_origins` includes `"http://localhost:5173"`. |
| `Preview card does not update after typing` | Text did not meet minimum length thresholds (5 chars for title, 10 for description). | Type longer, realistic complaint text (e.g. 15+ characters). |
| `Hazard warning banner does not appear` | Complaint narrative did not contain an exact keyword from `CRITICAL_KEYWORDS`. | Include terms like `"spark"`, `"fire"`, `"smoke"`, or `"gas leak"`. |
| `Modal does not close after submitting override` | `onClose()` callback was not invoked inside the submission promise resolution block. | In `PriorityOverrideModal.jsx`, ensure `onClose()` is called after `onPriorityUpdated(data)`. |
