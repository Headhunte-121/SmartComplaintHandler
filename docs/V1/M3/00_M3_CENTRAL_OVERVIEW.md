# Module M3: Central Full-Stack Architecture & Execution Roadmap
## Deterministic Classification & Priority Engine

> **Module Role:**  
> Module M3 is the analytical triage and priority intelligence brain of the Smart Complaint Handler platform.  
> It bridges the backend analytical algorithms and frontend user interfaces into a complete, unified operational workflow:
> 1. **Backend Subsystem (`backend/`):** Evaluates grievance narratives, executes deterministic 5-domain classification, identifies physical safety hazards, calculates urgency priority tiers (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), manages administrative overrides with audit logs, and exposes stateless real-time preview routes.
> 2. **Frontend Subsystem (`frontend/`):** Delivers real-time student form feedback in React 18 (debounced live triage preview cards, normalized confidence bars, hazard alert warning banners, priority badges) and the supervisor priority override modal for administrative triage adjustments.

---

# 1. Full-Stack Architecture: End-to-End Triage & Preview Flow

The following diagram illustrates how student complaint keystrokes, automated triage algorithms, live preview cards, and supervisor priority overrides interact across the full stack:

```
                     FULL-STACK INCIDENT TRIAGE & PREVIEW PIPELINE

  [ STUDENT COMPLAINT FORM ]                   [ FACILITY STAFF & SUPERVISORS ]
  (React 18: Typing Keystrokes)                (React 18 Admin Dashboard Desk)
           │                                                  │
           ▼ (Debounced @ 500ms)                              ▼
 ┌──────────────────────────────┐              ┌──────────────────────────────┐
 │ Module M3 Frontend:          │              │ Module M3 Frontend:          │
 │ • `LiveTriageCard.jsx`       │              │ • `PriorityOverrideModal.jsx`│
 │ • `PriorityBadge.jsx`        │              │ • `PriorityBadge.jsx`        │
 └──────────────┬───────────────┘              └──────────────┬───────────────┘
                │                                             │
   POST /triage-preview (Stateless)             PATCH /{id}/priority (Stateful)
                ▼                                             ▼
 ┌────────────────────────────────────────────────────────────────────────────┐
 │ MODULE M3 BACKEND TRANSPORT & REST API (`endpoints/priority.py`)           │
 │ • `POST /api/v1/tickets/triage-preview`  ➔ In-memory classification        │
 │ • `PATCH /api/v1/tickets/{id}/priority`  ➔ Supervisor administrative audit │
 └──────────────────────┬─────────────────────────────────────┬───────────────┘
                        │                                     │
                        ▼                                     ▼
 ┌──────────────────────────────────────────┐  ┌──────────────────────────────┐
 │ MODULE M3 CORE TRIAGE ENGINES            │  │ PERSISTENCE & AUDIT LAYER    │
 │ 1. `services/priority_engine.py`:        │  │ (`services/ticket_service.py`│
 │    • Scans hazard keywords (spark, fire) │  │ • Updates `ticket.priority`   │
 │    • Short-circuits to `CRITICAL`        │  │ • Appends audit explanation  │
 │ 2. `services/classifier.py`:             │  │   to `resolution_notes`      │
 │    • 2.0x title vs 1.0x description      │  │ • Commits to SQLite disk     │
 │    • Computes normalized confidence score│  └──────────────────────────────┘
 └──────────────────────┬───────────────────┘
                        │
                        ▼
 ┌──────────────────────────────────────────┐
 │ UNIFIED `TriageResult` JSON RESPONSE     │
 │ • `priority`: "CRITICAL"                 │
 │ • `category`: "Electrical"               │
 │ • `confidence`: 0.95                     │
 │ • `hazard_detected`: True                │
 │ • `matched_keywords`: ["spark", "wire"]  │
 └──────────────────────────────────────────┘
```

---

# 2. The Campus Incident Severity Matrix

Module M3 codifies the university facilities service charter into a formal four-tier incident matrix:

| Priority Tier | Criteria & Real-World Campus Scenarios | Trigger Keywords & Indicators | Target Response SLA |
| :--- | :--- | :--- | :--- |
| **`CRITICAL`** | **Life Safety & Structural Disasters:** Direct danger to human life, active fire, electrical shock risks, severe room flooding, gas leaks, or collapsing fixtures. | `fire`, `spark`, `shock`, `smoke`, `gas leak`, `flood`, `emergency`, `danger`, `blast` | **4 Hours** |
| **`HIGH`** | **Major Operational Disruptions:** Complete loss of essential utilities blocking student routines, main waterline bursts, hostel power blackouts, broken exterior locks. | `burst`, `blackout`, `major leak`, `broken lock`, `overflow`, `no power`, `short circuit` | **12 Hours** |
| **`MEDIUM`** | **Standard Operational Maintenance (Default):** Normal equipment breakdowns, single malfunctioning ceiling fans, dripping bathroom taps, broken desk hinges. | Standard domain keywords (`fan`, `light`, `tap`, `drain`, `door`, `desk`, `switch`) | **24 Hours** |
| **`LOW`** | **Cosmetic & Minor Aesthetic Defects:** Non-blocking minor defects, paint peeling, minor desk scratches, wall stains, faded signage, loose notice boards. | `paint`, `scratch`, `faded`, `cosmetic`, `stain`, `peeling`, `dust`, `poster` | **72 Hours** |

---

# 3. Execution Matrix: Full-Stack Parallel vs. Sequential Build Order

To enable our 5-student engineering team to develop Module M3 concurrently without merge conflicts, work is strictly divided into **Backend (`backend/`)** and **Frontend (`frontend/`)** tracks across **5 execution phases**:

```
PHASE 1 (Backend Core & Schemas / Frontend API Client & Badges - Parallel)
┌─────────────────────────────────┐ ┌─────────────────────────────────┐ ┌─────────────────────────────────┐
│ backend/01_priority_engine.md   │ │ backend/02_classifier_engine.md │ │ frontend/01_triage_api_client.md│
│ (Urgency & Hazard Scorer)       │ │ (Domain Taxonomy Classifier)    │ │ (Axios/Fetch HTTP Bridge)       │
├─────────────────────────────────┤ ├─────────────────────────────────┤ ├─────────────────────────────────┤
│ backend/03_priority_schemas.md  │ │                                 │ │ frontend/02_priority_badge.md   │
│ (Pydantic V2 DTOs & Enums)      │ │                                 │ │ (Reusable Visual Pill Badges)   │
└────────────────┬────────────────┘ └────────────────┬────────────────┘ └────────────────┬────────────────┘
                 │                                   │                                   │
PHASE 2 (Backend Service Integration & Frontend Live Card - Parallel)                    │
┌────────────────▼────────────────┐ ┌────────────────▼────────────────┐                  │
│ backend/04_service_integration  │ │ frontend/03_live_triage_card.md │                  │
│ (Upgraded `ticket_service.py`)  │ │ (Debounced Preview Card & Alert)│                  │
└────────────────┬────────────────┘ └────────────────┬────────────────┘                  │
                 │                                   │                                   │
PHASE 3 (REST API Endpoints & Supervisor Modal - Parallel)                               │
┌────────────────▼────────────────┐ ┌────────────────▼────────────────┐                  │
│ backend/05_priority_endpoints   │ │ frontend/04_override_modal.md   │                  │
│ (Preview & Supervisor Routes)   │ │ (Human-in-the-Loop Dialog)      │                  │
└────────────────┬────────────────┘ └────────────────┬────────────────┘                  │
                 │                                   │                                   │
PHASE 4 (Router Aggregator Update - Sequential)      │                                   │
┌────────────────▼────────────────┐                  │                                   │
│ backend/06_api_router_update.md │                  │                                   │
│ (Mounting Priority Routes)      │                  │                                   │
└────────────────┬────────────────┘                  │                                   │
                 │                                   │                                   │
PHASE 5 (Full-Stack Integration Quality Gate)        │                                   │
┌────────────────▼───────────────────────────────────▼───────────────────────────────────┐
│ backend/07_verification_and_testing.md & frontend/05_frontend_verification.md          │
│ (5-Checkpoint Backend Test Suite + Complete Frontend UI Interaction Test Protocol)     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 4. Phase-by-Phase File Map: Backend & Frontend Division

### Division A: Backend Subsystem (`V1/M3/backend/`)

| Phase | File # | Blueprint File Name | Target Source File | Build Mode | Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Phase 1** | **01** | `01_priority_engine.md` | `backend/app/services/priority_engine.py` | **Parallel** | Deterministic urgency scoring, hazard short-circuiting, severity constants |
| **Phase 1** | **02** | `02_classifier_engine.md` | `backend/app/services/classifier.py` | **Parallel** | 5-domain taxonomy classifier, 2.0x title weighting, normalized confidence score |
| **Phase 1** | **03** | `03_priority_schemas.md` | `backend/app/schemas/priority.py` | **Parallel** | Pydantic V2 DTOs (`PriorityEnum`, `TriagePreviewRequest`, `TriageResult`, `PriorityOverrideRequest`) |
| **Phase 2** | **04** | `04_service_integration.md` | `backend/app/services/ticket_service.py` (Upgrade) | Sequential | Connects dynamic priority to `create_ticket()`; implements `override_ticket_priority()` |
| **Phase 3** | **05** | `05_priority_endpoints.md` | `backend/app/api/v1/endpoints/priority.py` | Sequential | REST presentation routes (`POST /triage-preview`, `PATCH /{id}/priority`) |
| **Phase 4** | **06** | `06_api_router_update.md` | `backend/app/api/v1/router.py` (Update) | Sequential | Aggregator wiring, mounting priority routes under `/tickets` with tag `"priority"` |
| **Phase 5** | **07** | `07_verification_and_testing.md` | Backend 5-Checkpoint Verification Protocol | Sequential | Terminal tests for hazard detection, classification confidence, and override audits |

### Division B: Frontend Subsystem (`V1/M3/frontend/`)

| Phase | File # | Blueprint File Name | Target Source File | Build Mode | Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Phase 1** | **01** | `01_triage_api_client.md` | `frontend/src/api/triage.js` | **Parallel** | Asynchronous network transport client, error normalization, `fetchTriagePreview`, `overrideTicketPriority` |
| **Phase 1** | **02** | `02_priority_badge.md` | `frontend/src/components/PriorityBadge.jsx` | **Parallel** | Reusable high-contrast visual badge component (`CRITICAL` pulsing red, `HIGH` orange, `MEDIUM` blue, `LOW` slate) |
| **Phase 2** | **03** | `03_live_triage_card.md` | `frontend/src/components/LiveTriageCard.jsx` | **Parallel** | Real-time debounced complaint preview card, confidence bar, hazard alert banner, matched keywords |
| **Phase 3** | **04** | `04_priority_override_modal.md` | `frontend/src/components/PriorityOverrideModal.jsx` | **Parallel** | Supervisory modal dialog, priority dropdown, mandatory 5-character reason guard, audit logging |
| **Phase 5** | **05** | `05_frontend_verification.md` | Frontend Verification Protocol | Sequential | Browser & component testing protocol, debouncing validation, modal interaction flows |

---

# 5. Standard Blueprint Structure for Each File

Every file blueprint in this directory is structured into the identical 6 standard sections:
1. **Standard Purpose & Industry Role:** Dual perspective explaining both industry standard practices and what WE are specifically using it for in Smart Complaint Handler, including future AI roadmap hooks.
2. **What Must Be in This File & Why Each Item Is Needed:** Explicit technical specification of required functions, props, hooks, endpoints, state variables, or parameters with in-line definitions of all technical terms.
3. **Component Life-Cycle (IPO Table):** Input, Process, and Output life-cycle stages.
4. **Flexibility & Modification Guide:** Clear breakdown of 🟢 *Safe to Modify* vs. 🔴 *Strict Non-Negotiables*.
5. **Advanced Concepts Explained (OOP, State & Architecture):** Deep first-principles explanations of backend algorithms or frontend React mechanics (Enum metaclasses, Pydantic Rust validation, debounced async network calls, optimistic updates) for engineering students.
6. **Definition of Done:** Observable operational checklist and terminal/browser verification procedures.

---

# 6. Future AI Integration Architecture & V2 Drop-In Roadmap

### The Architectural Vision: Transitioning from Deterministic Keywords to Contextual AI
While Module M3 delivers a 100% deterministic, zero-external-dependency triage engine for Version 1 (V1), our system architecture is specifically designed to accommodate a seamless transition to **Contextual Artificial Intelligence (AI) and Large Language Model (LLM) Inference** in Version 2 (V2).

In V2, rather than relying exclusively on fixed regular expression keyword matching, the platform will utilize an LLM (such as Google's Gemini API) to read the natural language narrative of a student's complaint report, analyze the subtle semantic context, extract contextually relevant keywords, and evaluate the underlying operational urgency. Crucially, **the AI will determine the baseline classification and priority recommendations, while the campus facility administrator retains ultimate supervisory authority to manually modify or override that priority at any time**.

### How the Current V1 Architecture Specifically Accounts for Future AI
The engineering patterns established in this V1 specification ensure that plugging in an AI model in V2 requires **zero breaking changes to the database, zero breaking changes to REST endpoints, and zero disruption to frontend clients**:

1. **Uniform Data Transfer Contract (`TriageResult` Schema):**
   * The Pydantic schema `TriageResult` (`schemas/priority.py`) already returns `priority`, `category`, `hazard_detected`, `confidence`, `reason`, and `matched_keywords`.
   * When an AI engine is introduced in V2, it will output this exact same JSON structure. The frontend and service layers consume the schema interface, completely agnostic to whether the confidence score and keywords were computed by a regex frequency counter or a transformer neural network.
2. **The Strategy Pattern & Service Boundary Decoupling:**
   * In `backend/app/services/ticket_service.py`, complaint creation calls `calculate_priority(title, description)` and `classify_complaint(title, description)`.
   * In V2, we will implement an `AIContextClassifier` that conforms to the exact same functional signature. Switching between deterministic rules and AI is achieved via a simple configuration flag (`TRIAGE_ENGINE_MODE = "DETERMINISTIC"` vs `"AI_GEMINI"`), exemplifying the **Strategy Pattern** and the **Open-Closed Principle**.
3. **Contextual Extraction vs. Literal Keyword Pitfalls:**
   * In V1, literal matching cannot detect semantic negation (e.g., *"There is no smoke or fire, just a loose plastic cover"* triggers fire keywords).
   * In V2, the AI will inspect the narrative context, recognize the negation (*"no smoke"*), extract the true contextual issue (*"loose plastic cover"*), and assign `LOW` priority instead of `CRITICAL`.
   * Furthermore, the AI will recognize implicit hazards that omit standard keywords (e.g., *"There is a pungent rotten egg odor spreading through the chemistry lab basement"* ➔ AI infers dangerous hydrogen sulfide / gas leak hazard ➔ triggers `CRITICAL`).
4. **Human-in-the-Loop (HITL) Administrative Governance:**
   * In enterprise mission-critical software, autonomous AI decisions must never operate without human supervisory oversight.
   * The administrative priority override endpoint (`PATCH /api/v1/tickets/{ticket_id}/priority`) and frontend modal (`PriorityOverrideModal.jsx`) serve as the permanent **Human-in-the-Loop (HITL)** governance gate.
   * If the AI misinterprets student sarcasm or assigns an incorrect priority, the facility manager can immediately adjust the priority with a single click in the staff dashboard, and the required `override_reason` is permanently recorded in `ticket.resolution_notes` alongside the AI's original explanation.
5. **Graceful Degradation & Fallback Resilience:**
   * Third-party AI cloud APIs can experience network latency, rate limits, or transient connection outages.
   * Because the V1 deterministic engine is fully self-contained and local, the V2 architecture will use V1 as an instant, zero-latency fallback: if the AI API fails to respond within 1.5 seconds, the system automatically falls back to our V1 regex engine with zero user disruption.

```
              V1 TO V2 ARCHITECTURAL EVOLUTION (STRATEGY PATTERN)

                     [ INCOMING COMPLAINT REPORT ]
                     "Odd chemical smell in chemistry lab"
                                  │
                                  ▼
                   ┌──────────────────────────────┐
                   │ TRIAGE ORCHESTRATOR / FACADE │
                   │   (`services/triage.py`)     │
                   └──────────────┬───────────────┘
                                  │
          ┌───────────────────────┴───────────────────────┐
          ▼ (V1: Active Default)                          ▼ (V2: Future Drop-In)
┌─────────────────────────────────┐             ┌─────────────────────────────────┐
│ DETERMINISTIC KEYWORD ENGINE    │             │ CONTEXTUAL AI / LLM EXTRACTOR   │
│ • Local Python regex matching   │             │ • Prompt: Context keyword extract│
│ • Fixed domain word dictionaries│             │ • Semantic negation analysis    │
│ • Zero external network calls   │             │ • Implicit hazard inference     │
└────────────────┬────────────────┘             └────────────────┬────────────────┘
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         ▼
                        ┌─────────────────────────────────┐
                        │ UNIFIED `TriageResult` CONTRACT │
                        │ • priority: PriorityEnum        │
                        │ • category: str                 │
                        │ • hazard_detected: bool         │
                        │ • confidence: float (0.0 - 1.0) │
                        │ • reason: str (Explainable)     │
                        │ • matched_keywords: list[str]   │
                        └────────────────┬────────────────┘
                                         │
                                         ▼
                        ┌─────────────────────────────────┐
                        │ HUMAN-IN-THE-LOOP (HITL) GATE   │
                        │ • Facility Admin Dashboard      │
                        │ • `PATCH /{ticket_id}/priority` │
                        │ • Supervisor Override & Audit   │
                        └─────────────────────────────────┘
```
