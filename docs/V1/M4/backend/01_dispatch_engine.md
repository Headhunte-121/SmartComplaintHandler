# Module M4 - File 01: Workload-Balanced Dispatch Engine
## Target File: `backend/app/services/dispatch_engine.py`
### Execution Track: Phase 1 (Can be built in parallel with Files 02 and 03)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In Field Service Management (FSM), enterprise service desk orchestration, and logistics dispatch systems (such as Salesforce Field Service, ServiceNow Work Order Management, and PagerDuty incident routing), `dispatch_engine.py` defines the **Workload-Balanced Workforce Allocation Subsystem**. It executes mathematical dispatch algorithms that inspect incoming incident criteria, analyze live technician queues, and allocate tasks to the most suitable available operational crew without human bias or manual distribution bottlenecks.

### Standard Industry Role & Real-World Use Cases
In modern production environments, automated dispatch engines standardly fulfill four core architectural duties:

1. **Least-Loaded Queue Balancing (Workload Equalization):**
   * Computes the current active queue depth (the number of unresolved incidents currently assigned) across all eligible worker groups.
   * Dispatches newly ingested incidents to the active group with the smallest queue depth, mathematically preventing technician burnout and eliminating unassigned ticket pileups.
2. **Emergency Short-Circuit Allocation (Critical Incident Routing):**
   * High-consequence safety emergencies (life-threatening hazards, catastrophic utility shutdowns) cannot wait in standard balancing queues.
   * The dispatch engine provides a short-circuit bypass: routing `CRITICAL` incidents immediately to specialized emergency response crews (e.g. hazardous materials units, high-voltage electricians) regardless of existing backlog.
3. **Zone & Specialization Affinity Heuristics:**
   * Evaluates geographic campus zones and equipment specializations indicated in the complaint narrative (e.g. distinguishing residential student hostel issues from high-tech research laboratory issues).
   * Applies an affinity bias that favors squads specifically trained or situated for that zone while maintaining overall queue fairness.
4. **Transparent, Explainable Dispatch Diagnostics:**
   * Emits structured diagnostic metadata explaining *why* a specific squad was chosen (e.g. detailing the candidate squad's queue depth and availability status), ensuring institutional auditability.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our campus complaint automation platform, our 5-student engineering team specifically uses `backend/app/services/dispatch_engine.py` for four concrete operational goals:

1. **Balancing Workloads Across Our 12 Campus Maintenance Squads:**
   * Inspects active squads belonging to the ticket's `department_id` (e.g. for Department 1 Electrical: "Hostel Wiring Squad", "Academic Electrical Crew", "Substation High-Voltage Team").
   * Queries SQLite to count active tickets (`ASSIGNED` or `IN_PROGRESS`) for each squad and assigns the new complaint to the squad with the lowest active backlog.
2. **Emergency Escalation to Specialized Response Squads (`CRITICAL`):**
   * If a complaint is triaged as `CRITICAL` (such as active wire sparks or major waterline flooding from Module M3), the engine immediately short-circuits:
     * Electrical `CRITICAL` ➔ Automatically routed to `"Substation High-Voltage Team"`.
     * Plumbing `CRITICAL` ➔ Automatically routed to `"Water Supply Emergency Team"`.
3. **Location-Aware Zone Matching:**
   * Analyzes the ticket's `location` string. If the complaint specifies `"Hostel Block B"`, the engine applies an affinity bonus to hostel squads (e.g. `"Hostel Pipe Repair Crew"`), ensuring technicians already stationed near residential blocks handle residential problems.
4. **Handling Availability Exclusions (`is_active = False`):**
   * Verifies that only currently on-duty squads (`Team.is_active == True`) enter the candidate pool. If a crew is off-duty, undergoing training, or depleted of parts, the engine automatically routes the complaint to the next available crew.

### Future AI Integration & Contextual Dispatch Hook (V2 Roadmap)
While Version 1 implements a deterministic least-loaded queue balancing algorithm, the interface of `select_optimal_team()` is intentionally architected to support future Artificial Intelligence integration:
* **Predictive Job Difficulty Inference:** In V2, an AI model will analyze complaint narratives to predict estimated resolution hours (e.g. recognizing that replacing an entire corroded drainage stack takes 6 hours, while tightening a tap washer takes 15 minutes). The dispatch algorithm will balance *estimated labor hours* rather than simple ticket counts.
* **Technician Skill & Historical Speed Matching:** Future machine learning models will analyze historical closure rates, matching complex technical faults to squads with the highest verified resolution speed for that specific failure type.
* **AI Recommends, Human Admin Overrides:** As with triage, the AI dispatch engine will decide the baseline squad assignment, while facility managers retain full authority to manually reassign tickets via the supervisor endpoint (`PATCH /api/v1/tickets/{ticket_id}/reassign`).
* **Zero-Latency Heuristic Fallback:** If future AI dispatch models experience latency or cloud timeouts, the system falls back instantly to this V1 least-loaded algorithm with zero downtime.

### How Other Components Standardly Interact with This File
Across the backend architecture, this engine is consumed through clean functional interfaces:
* **The Ticket Service (`backend/app/services/ticket_service.py`):** Calls `optimal_team = select_optimal_team(db, department_id, priority, location)` during complaint intake, assigning `ticket.assigned_team = optimal_team.name` and advancing `ticket.status = "ASSIGNED"`.
* **The Re-Dispatch Endpoint (`backend/app/api/v1/endpoints/assignment.py`):** Calls this engine to recalculate squad assignment when an unassigned ticket requires automated dispatch.
* **Unit & Integration Test Suites:** Assert that simulated concurrent complaints distribute evenly across available squads.

### The Core Problem It Solves & Why It Exists
* **The "Unequal Burden" Bottleneck:** In manual university systems, staff assign complaints to the one technician whose phone number they know best, leaving them overwhelmed with 25 complaints while other staff handle 2. Automated least-loaded balancing eliminates queue imbalances.
* **Delayed Emergency Response:** If an electrical fire hazard sits in a general inbox waiting for a clerk to decide which electrician is free, disaster strikes. Emergency short-circuiting ensures emergency crews receive immediate work orders.
* **Phantom Assignments:** Assigning tickets to off-duty or deactivated squads stalls resolution indefinitely. Checking `is_active == True` guarantees work orders only reach ready crews.

---

# 2. What Must Be in This File & Why Each Item Is Needed

To be complete, production-grade, and fully deterministic, `backend/app/services/dispatch_engine.py` must define, configure, and export the following four structural components:

---

### Item 1: Emergency Rapid-Response Squad Registry (`EMERGENCY_SQUAD_MAP`)
* **What it is:** A module-level mapping dictionary binding department IDs to their designated emergency response squads.
* **Specification:**
  * `EMERGENCY_SQUAD_MAP = { 1: "Substation High-Voltage Team", 2: "Water Supply Emergency Team", 3: "Structural Fixtures Crew", 4: "Network & Wi-Fi Squad" }`
* **Why it is needed:**
  * Provides instantaneous short-circuit resolution for `CRITICAL` priority tickets.
  * Ensures that life-safety hazards bypass normal queue depth comparisons and immediately reach high-capacity emergency crews.

---

### Item 2: Campus Zone & Specialization Keywords (`ZONE_AFFINITY_MAP`)
* **What it is:** A dictionary associating location keywords with specific squad name substrings.
* **Specification:**
  * Maps keywords like `["hostel", "mess", "dormitory", "room"]` to squad preference `"Hostel"`.
  * Maps keywords like `["academic", "class", "hall", "lab", "department", "seminar", "library"]` to squad preference `"Academic"` or `"Lab"`.
* **Why it is needed:**
  * Reduces physical technician transit time across campus by favoring technicians already stationed near the complaint's building zone.

---

### Item 3: The Primary Squad Selection Function (`select_optimal_team`)
* **What it is:** The core algorithmic function that selects the single best maintenance squad for a given ticket.
* **Signature:** `select_optimal_team(db: Session, department_id: int, priority: str, location: str) -> Optional[Team]`
* **Execution Sequence:**
  1. **Emergency Check:** If `priority == "CRITICAL"` and `department_id in EMERGENCY_SQUAD_MAP`:
     * Query for the designated emergency team: `db.query(Team).filter(Team.department_id == department_id, Team.name == EMERGENCY_SQUAD_MAP[department_id], Team.is_active == True).first()`.
     * If found and active, immediately return this emergency team.
  2. **Active Squad Query:** Query all active squads for the department:
     * `candidates = db.query(Team).filter(Team.department_id == department_id, Team.is_active == True).all()`.
     * If `candidates` is empty, return `None` (triggers fallback in service layer).
  3. **Queue Depth Calculation (Workload Inspection):**
     * For each candidate squad, count unresolved tickets in SQLite:
       * `queue_count = db.query(func.count(Ticket.id)).filter(Ticket.assigned_team == candidate.name, Ticket.status.in_(["ASSIGNED", "IN_PROGRESS"])).scalar() or 0`.
  4. **Zone Affinity Adjustment:**
     * Normalize `location` to lowercase.
     * If a candidate squad's name matches the detected zone (e.g. "hostel" in location and "Hostel" in squad name), apply a zone preference credit (subtract 1 from virtual queue depth for tie-breaking).
  5. **Least-Loaded Selection with Deterministic Tie-Breaking:**
     * Select the squad with the lowest effective queue depth.
     * If two squads tie with the exact same depth, break the tie deterministically using lowest `Team.id`.
  6. Return the selected `Team` ORM entity.
* **Why it is needed:**
  * Integrates safety rules, availability checks, workload balancing, and geographic proximity into a single, cohesive, atomic decision.

---

### Item 4: Explainable Dispatch Explanation Generator (`generate_dispatch_reason`)
* **What it is:** A utility function generating an institutional rationale string for the assignment.
* **Signature:** `generate_dispatch_reason(team_name: str, queue_depth: int, is_emergency: bool) -> str`
* **Why it is needed:**
  * Preserves diagnostic transparency by recording *why* a squad was selected (e.g. `"Dispatched to Hostel Pipe Repair Crew: Least loaded active squad (Queue: 2 active tickets)"`).

---

# 3. Component Life-Cycle: Input, Process, Output (IPO Table)

The following table documents the complete data life-cycle for `backend/app/services/dispatch_engine.py`:

| Execution Stage | Input Data Received | Processing & Algorithmic Evaluation | Output Produced | Error Handling & Edge Cases |
| :--- | :--- | :--- | :--- | :--- |
| **Emergency Evaluation** | `department_id`, `priority == "CRITICAL"` | Checks `EMERGENCY_SQUAD_MAP` for matching department; verifies team is active. | Designated emergency `Team` entity. | If emergency team is inactive (`is_active = False`), proceeds to standard queue balancing. |
| **Candidate Retrieval** | `department_id`, database `Session` | Executes `SELECT * FROM teams WHERE department_id = ? AND is_active = 1`. | List of eligible candidate `Team` objects. | If no squads are active, returns `None`, allowing caller to leave ticket unassigned with warning alert. |
| **Workload Calculation** | Candidate squad names | Executes SQL `COUNT()` queries for each candidate where `status IN ('ASSIGNED', 'IN_PROGRESS')`. | Integer queue depth per squad (e.g. Team A: 3, Team B: 1). | If database lock occurs, propagates exception cleanly for transaction rollback. |
| **Affinity & Tie-Breaking** | Raw `location` string, calculated queue depths | 1. Checks location keywords.<br>2. Applies zone bonus.<br>3. Selects minimum queue depth.<br>4. Breaks ties by `Team.id`. | Single optimal `Team` ORM instance and human-readable dispatch explanation. | If location is empty or unrecognized, evaluates purely on raw queue depth. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. Strict Non-Negotiables

To maintain system compatibility across the engineering team, follow these operational boundaries:

### 🟢 Safe to Modify (Configurable Parameters)
* **Zone Affinity Keywords:** You can expand or customize the location keywords in `ZONE_AFFINITY_MAP` to match specific buildings on your university campus (e.g. adding `"Kalam Block"` or `"Aryabhatta Hostel"`).
* **Emergency Squad Assignments:** You can update which squad serves as the primary emergency unit for each department in `EMERGENCY_SQUAD_MAP`.
* **Dispatch Reason Text Formatting:** You can customize the explanatory string returned by `generate_dispatch_reason()` to include extra metrics (such as timestamps).
* **Workload Status Filters:** You can add or remove ticket status values considered "active" (e.g. adding `"ON_HOLD"` if that status is introduced in a future module).

### 🔴 Strict Non-Negotiables (System Breaking Changes)
* **DO NOT Assign Inactive Squads (`is_active == False`):** Discarding the `is_active == True` filter routes tickets to squads that are off-shift, violating operational constraints.
* **DO NOT Hardcode Team Names as Strings Inside Tickets Directly:** The engine must query and return real `Team` ORM entities from the database, ensuring that assigned squad names strictly match seeded database entities.
* **DO NOT Use Random Tie-Breaking (`random.choice`):** In enterprise audit systems, tie-breaking must be 100% deterministic (e.g. using `Team.id`). Random selection creates non-reproducible test failures.
* **DO NOT Execute Unbounded Python Loops for Counting:** Use database-level counting (`func.count(Ticket.id)`) rather than querying all tickets into RAM and calling `len(tickets)`. Loading thousands of tickets into memory exhausts server RAM.
* **DO NOT Make External HTTP Calls:** This engine must remain purely local, fast ($O(T)$ where $T$ is squad count), and zero-dependency.

---

# 5. Architectural & Theoretical References

This specification operates strictly as an **implementation and integration blueprint**. For the exhaustive computer science fundamentals, language runtime mechanics, and protocol specifications governing this component, consult the following authoritative manuals in the **Developer Guide Suite**:

* [**Unit 00A: Data Structures, Algorithms & Complexity**](../../../developer_guide/00A_DATA_STRUCTURES_ALGORITHMS_AND_COMPLEXITY.md)  
  Algorithmic time and space complexity ($O(N)$, $O(1)$), hash tables, and priority sorting queues.

* [**Unit 03C: Regular Expressions & Automata Theory**](../../../developer_guide/03C_REGULAR_EXPRESSIONS_AND_AUTOMATA_THEORY.md)  
  Chomsky Type 3 regular languages, Deterministic Finite Automata (DFA), word boundaries (`\b`), and linear matching engines.

* [**Unit 21B: Cryptographic Mathematics, Encoding & Hashing**](../../../developer_guide/21B_CRYPTOGRAPHIC_MATHEMATICS_ENCODING_AND_HASHING.md)  
  Shannon entropy, high-entropy cryptographic randomness (`secrets`), and collision-resistant identifier generation.

---

---

---

# 6. Definition of Done & Live Website Verification

### What This File Is Responsible For
This Python module (`backend/app/services/dispatch_engine.py`) is responsible for **intelligently assigning incoming complaints to the optimal maintenance squad using a deterministic least-loaded workload algorithm**. It eliminates manual dispatcher bottlenecks by evaluating crew queues in real time and balancing operational workloads across campus technicians.

### What It Should Perform
When invoked during ticket routing, this module performs the following operations:
1. **Department Squad Filtering:** Queries SQLite for all active maintenance teams belonging to the ticket's assigned department.
2. **Workload Analysis & Capacity Evaluation:** Inspects each candidate team's active assigned tickets (`COUNT(status != 'RESOLVED')`) and remaining capacity.
3. **Deterministic Least-Loaded Selection:** Assigns the ticket to the team with the lowest active workload, breaking ties deterministically by primary key to ensure predictable dispatching.

### How to See It Performing Its Job on the Live Website
Follow these detailed steps to verify automated least-loaded dispatching on the live system:

1. **Inspect Current Crew Workloads on the Operations Desk:**
   * Open **`http://localhost:5173/admin`** in your browser.
   * Look at the **Team Workload Overview** panel on the right sidebar.
   * Note the active ticket counts for the Electrical crews (e.g. `Electrical Squad Alpha`: 1 ticket, `Electrical Squad Beta`: 0 tickets).

2. **Trigger Automated Least-Loaded Dispatch:**
   * Open a new browser tab to **`http://localhost:5173/submit`**.
   * Fill out an Electrical grievance:
     * Title: `Exposed wire sparking in Corridor B`
     * Description: `High-voltage cable detached from ceiling conduit; continuous sparking.`
     * Category: `Electrical`
     * Location: `Engineering Block, Corridor B`
   * Click **Submit Complaint** and copy the generated tracking code.

3. **Verify Optimal Crew Assignment in the Admin Queue:**
   * Return to **`http://localhost:5173/admin`** and refresh the ticket table:
     * Locate the newly submitted ticket in the queue.
     * Confirm that `dispatch_engine.py` automatically assigned it to **`Electrical Squad Beta`** because it had the lowest active queue (0 vs 1).
     * Check the sidebar: confirm `Electrical Squad Beta`'s workload counter incremented from 0 to 1 and its progress bar expanded.

4. **Verify Deterministic Balancing on Further Submissions:**
   * Submit another Electrical complaint on `/submit`.
   * Return to `/admin`: observe that because both crews now had 1 ticket each, the engine broke the tie deterministically and assigned to Squad Alpha, perfectly balancing crew queues.
