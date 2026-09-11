# Module M3 - File 01: Deterministic Priority & Severity Engine
## Target File: `backend/app/services/priority_engine.py`
### Execution Track: Phase 1 (Can be built in parallel with Files 02 and 03)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In professional site reliability engineering (SRE), ITIL service desks, and enterprise incident management systems (such as PagerDuty and ServiceNow), `priority_engine.py` defines the **Automated Urgency & Severity Scoring Subsystem**. It inspects incoming incident reports, detects physical danger indicators, and computes a standardized urgency priority level without relying on human subjective guesswork.

### Standard Industry Role & Real-World Use Cases
In modern production environments, automated priority engines standardly fulfill four core system functions:

1. **Deterministic Incident Triage (SEV-1 to SEV-4):**
   * Standardly categorizes issues into strict operational tiers:
     * Tier 1 (Critical / SEV-1): Total service outage or active safety hazard. Immediate pager alert.
     * Tier 2 (High / SEV-2): Core functionality impaired with significant operational impact.
     * Tier 3 (Medium / SEV-3): Standard maintenance issue with workarounds available.
     * Tier 4 (Low / SEV-4): Minor cosmetic defect or informational request.
2. **Immediate Life-Safety Hazard Detection (Short-Circuit Evaluation):**
   * High-consequence safety hazards (fire, gas leaks, electrical sparking, structural collapse) trigger immediate short-circuit escalation.
   * If a hazard indicator is detected, the engine bypasses standard routine scoring algorithms and instantly locks the ticket into the highest priority tier.
3. **Auditability & Explainable Triage:**
   * In institutional and regulated environments, automated decisions must be explainable.
   * The priority engine standardly outputs a structured explanation detailing *why* an incident received a specific priority (e.g. listing the exact hazard keywords detected in text), providing complete diagnostic visibility for facility managers.
4. **Decoupling Priority from User-Reported Emotion:**
   * Complainants frequently mark every trivial issue as "Urgent!" because they want fast service.
   * The engine enforces objective, institutional rules: evaluating the factual text rather than user-selected panic buttons, preventing queue distortion.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our campus complaint automation platform, our 5-student engineering team specifically uses `priority_engine.py` for four concrete operational functions:

1. **Protecting Student Safety with Instant Hazard Detection (`CRITICAL`):**
   * Scans complaint text for life-safety hazard terms: `"fire"`, `"spark"`, `"smoke"`, `"shock"`, `"electric shock"`, `"gas"`, `"gas leak"`, `"flood"`, `"emergency"`, `"danger"`.
   * The moment an electrical switch sparking in a hostel room or a chemical spill in a chemistry lab is detected, the priority is immediately locked to `CRITICAL`, triggering a 4-hour SLA resolution window.
2. **Prioritizing Major Campus Disruptions (`HIGH`):**
   * Scans for widespread infrastructure failures: `"burst"`, `"blackout"`, `"no power"`, `"major leak"`, `"broken lock"`, `"overflow"`, `"sewage"`.
   * Elevates complaints affecting whole hostel floors or academic buildings to `HIGH` (12-hour SLA).
3. **Establishing Routine Maintenance Baseline (`MEDIUM`):**
   * Any standard complaint with routine maintenance keywords (broken ceiling fan, dripping tap, jammed window) receives `MEDIUM` priority (24-hour SLA).
4. **Filtering Minor Cosmetic Defects (`LOW`):**
   * Complaints regarding aesthetic or cosmetic items (`paint`, `scratch`, `faded`, `stain`, `peeling`) are assigned `LOW` priority (72-hour SLA), ensuring technicians fix emergency water and power problems before repainting walls.
5. **Serving as the Future AI Safety Guardrail & Low-Latency Fallback (V2 Architecture):**
   * In future milestones (V2), when an AI / Large Language Model (LLM) evaluates complex narrative context from reports to decide priority, this deterministic engine will serve as the immediate, zero-latency safety fallback and sanity check.
   * If the external AI API is unreachable or times out, this engine guarantees continuous, uninterrupted priority assignment.

### Future AI Integration & Contextual Priority Evaluation Hook (V2 Roadmap)
While Version 1 uses deterministic regex token matching, the architectural boundary of `calculate_priority(title, description) -> dict` is intentionally designed to account for future Artificial Intelligence integration:
* **Contextual Narrative Evaluation:** In V2, natural language reports will be passed to an AI model (such as Gemini API) to evaluate full semantic context (e.g. recognizing that *"the switch is warm to the touch and humming strangely"* indicates impending electrical failure even without the explicit word *"fire"*).
* **AI Decides, Human Admin Overrides:** The AI will determine the baseline priority recommendation based on narrative context, while the campus facility administrator maintains exclusive supervisory control to manually adjust or override that priority if an on-site inspection proves otherwise.
* **Drop-In Compatibility:** Because the output dictionary format (`priority`, `hazard_detected`, `matched_keywords`, `reason`) is standardized, upgrading to AI in V2 will require zero changes to caller functions in `ticket_service.py` or database schemas.

### How Other Components Standardly Interact with This File
Across the backend architecture, this engine is consumed through clean functional calls:
* **The Ticket Service (`app/services/ticket_service.py`):** Calls `priority_data = calculate_priority(title, description)` during ticket creation to stamp `ticket.priority` with the computed string.
* **Triage Preview Endpoints (`app/api/v1/endpoints/priority.py`):** Calls `calculate_priority()` statelessly to show live priority badges on the frontend submit form before the student clicks submit.
* **The Future SLA Engine (Module M5):** Reads the calculated priority string to determine the exact expiration deadline (`sla_deadline = created_at + timedelta(hours=4)` for Critical).

### The Core Problem It Solves & Why It Exists
* **The "Unreviewed Overnight Hazard":** If a student reports sparking wires at 11:00 PM, a manual triage system leaves the ticket in an unreviewed inbox until 9:00 AM the next morning, risking an electrical fire. The automated engine flags it as `CRITICAL` in under 1 millisecond.
* **Queue Inversion (The Boy Who Cried Wolf):** When students can choose their own priority, 90% of students choose "Emergency" to get their ceiling fan fixed first. Objective text scanning eliminates queue inversion.
* **Hardcoded Defaults:** In Module M2, priority was temporarily hardcoded to `"MEDIUM"`. This engine brings the ticket table to life with real, dynamic priority calculations.

---

# 2. What Must Be in This File & Why Each Item Is Needed

To be complete, this component must define, configure, and export the following five essential items:

---

### Item 1: Standardized Priority String Constants
* **What it is:** Module-level string constants defining the four institutional priority tiers.
* **Specification:**
  * `PRIORITY_CRITICAL: str = "CRITICAL"`
  * `PRIORITY_HIGH: str = "HIGH"`
  * `PRIORITY_MEDIUM: str = "MEDIUM"`
  * `PRIORITY_LOW: str = "LOW"`
* **Why it is needed:**
  * **Typo Elimination:** Prevents developers from typing `"Critical"` (mixed case) or `"URGENT"` in different files.
  * Ensures exact match with the database column values established in Module M1 (`Ticket.priority`).

---

### Item 2: Severity Indicator Keyword Dictionaries
* **What it is:** Structured sets or lists of lowercase keywords representing each severity level.
* **Specification:**
  * `CRITICAL_KEYWORDS = {"fire", "spark", "sparking", "shock", "electric shock", "smoke", "gas leak", "flood", "flooding", "danger", "emergency", "blast", "explosion", "short circuit"}`
  * `HIGH_KEYWORDS = {"burst", "blackout", "no power", "major leak", "broken lock", "overflow", "overflowing", "sewage", "contaminated", "fallen"}`
  * `LOW_KEYWORDS = {"paint", "scratch", "scratched", "faded", "stain", "peeling", "cosmetic", "dust", "poster", "dirty mark"}`
* **Why it is needed:**
  * Captures the real-world vocabulary students use when experiencing infrastructure failures on campus.
  * Separates life-safety hazards (`CRITICAL`) from widespread infrastructure failures (`HIGH`) and minor cosmetic touchups (`LOW`).

---

### Item 3: Text Normalization & Word-Boundary Tokenizer
* **What it is:** Internal logic that converts text to lowercase and evaluates words using regular expression word boundaries (`\b`).
* **Behavior:** Checks for independent word matches using `re.search(r"\b" + re.escape(keyword) + r"\b", text)`.
* **Why it is needed:**
  * Prevents substring false positives (e.g. ensuring `"paint"` matches cosmetic wall painting, but does not falsely match inside words like `"complaint"` or `"faint"`).

---

### Item 4: Hierarchical Rule Evaluation Algorithm
* **What it is:** A top-down conditional evaluation algorithm that checks higher severity tiers first.
* **Evaluation Sequence:**
  1. **Step 1 (Hazard Check):** Scans for `CRITICAL_KEYWORDS`. If any match is found, immediately returns `PRIORITY_CRITICAL` with `hazard_detected = True`.
  2. **Step 2 (Major Failure Check):** Scans for `HIGH_KEYWORDS`. If any match is found, returns `PRIORITY_HIGH`.
  3. **Step 3 (Cosmetic Check):** Scans for `LOW_KEYWORDS`. If matches are found *and no routine maintenance words are present*, returns `PRIORITY_LOW`.
  4. **Step 4 (Default Fallback):** Returns `PRIORITY_MEDIUM`.
* **Why it is needed:**
  * **Short-Circuit Safety:** If a complaint mentions both a scratch and a spark ("There is a scratch on the switchboard and it is sparking"), the safety hazard (`CRITICAL`) takes absolute precedence over the cosmetic scratch (`LOW`).

---

### Item 5: Core Priority Evaluation Function (`calculate_priority`)
* **What it is:** The primary public API function returning the complete priority assessment.
* **Signature:** `calculate_priority(title: str, description: str) -> dict`
* **Return Structure:** A dictionary containing:
  * `priority`: String (`"CRITICAL"`, `"HIGH"`, `"MEDIUM"`, `"LOW"`).
  * `hazard_detected`: Boolean flag indicating whether a physical danger keyword was detected.
  * `detected_keywords`: List of unique strings that triggered the priority assignment.
  * `reasoning`: Human-readable explanation of why this priority tier was assigned.
* **Why it is needed:**
  * Supplies all required metadata to downstream services: `priority` feeds the database and SLA engine, while `reasoning` and `detected_keywords` populate the technician audit log.

---

# 3. Component Life-Cycle: Input, Process, Output

| Stage | What Happens Behind the Scenes |
| :--- | :--- |
| **INPUT** | Complaint `title` (e.g. `"Water cooler wire sparking"`) and `description` (e.g. `"Loose electrical wire touching water basin, making sparks."`). |
| **PROCESS** | 1. Concatenates title and description into normalized lowercase text.<br>2. Evaluates `CRITICAL_KEYWORDS` using word-boundary matching.<br>3. Detects `"spark"`, `"wire"`, `"sparking"`.<br>4. Triggers short-circuit hazard rule: sets `hazard_detected = True`, `priority = "CRITICAL"`.<br>5. Generates diagnostic reasoning: `"Physical safety hazard detected: spark"`.<br>6. Bypasses lower-tier checks. |
| **OUTPUT** | `{"priority": "CRITICAL", "hazard_detected": True, "detected_keywords": ["spark"], "reasoning": "Physical safety hazard detected: spark"}`. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. What Must Stay Exact

### 🟢 Safe to Modify & Customize (Your Team's Creative Freedom):
* **Expanding Keyword Dictionaries:** You can freely add new terms to `CRITICAL_KEYWORDS` (e.g. `"live wire"`, `"transformer"`), `HIGH_KEYWORDS` (e.g. `"water shortage"`), or `LOW_KEYWORDS` (e.g. `"sticker"`).
* **Refining Reasoning Strings:** You can customize the explanatory sentences in the `reasoning` attribute to match your institution's terminology.
* **Adding Priority Score Numbers:** You can optionally attach a numeric score (e.g. `severity_score = 95`) alongside the priority string if you want to rank tickets numerically within the same tier.

### 🔴 Strict Non-Negotiables (Must Remain Exact Across the Team):
* **The Priority String Values:** Must output exact strings: `"CRITICAL"`, `"HIGH"`, `"MEDIUM"`, `"LOW"`. These strings are stored in `Ticket.priority` and consumed by the SLA calculation engine.
* **Function Identifier & Signature:** Must remain `calculate_priority(title: str, description: str) -> dict`. `app/services/ticket_service.py` imports and executes this specific function.
* **Output Dictionary Keys:** Must contain `"priority"`, `"hazard_detected"`, `"detected_keywords"`, and `"reasoning"`.
* **Short-Circuit Hazard Precedence:** Critical hazards must always evaluate before routine or cosmetic rules. Reversing the order would allow a cosmetic word to downgrade an electrical emergency.
* **File Location (`backend/app/services/priority_engine.py`):** The module must reside precisely at this path.

---

# 5. Advanced Python Concepts Explained (OOP & Architecture)

Since you already understand programming fundamentals like loops, conditions, and basic variables, here is an exhaustive, first-principles breakdown of the Object-Oriented Programming (OOP) and software architecture concepts that drive this file:

---

### 1. Short-Circuit Evaluation and Defensive Early Returns
How does the control flow of this engine protect system safety?

* **Linear Traversal vs. Guard Clauses:**
  * In naive code, an algorithm might calculate scores for all tiers, store them in temporary variables, and compare them at the end.
  * In safety-critical engineering, we use **Guard Clauses with Early Returns**:
    `if is_hazard(text):`
    `    return {"priority": PRIORITY_CRITICAL, ...}`
* **Why This Matters in RAM:**
  * If a high-voltage spark is detected, evaluating whether the complaint also mentions a scratched table is completely irrelevant.
  * Returning immediately from the function halts further regex operations, releases CPU cycles, and guarantees that no secondary rule can ever accidentally overwrite or downgrade a life-safety hazard.

---

### 2. Set Theory and Set Intersections in Memory (`set.intersection`)
Why are keyword pools declared as Python `set` collections rather than `list` objects?

* **List Membership ($O(N)$) vs. Set Lookup ($O(1)$):**
  * In Python, checking `'fire' in my_list` scans every element in the list one by one until it finds a match or reaches the end (linear search, $O(N)$).
  * A Python `set` is implemented as an in-memory **Hash Table** without values.
  * When Python checks `'fire' in my_set`, it hashes the string `'fire'` and inspects the memory address directly. Membership verification takes $O(1)$ constant time.
* **Set Intersection Operations:**
  * When comparing a set of extracted words against keyword pools:
    `matches = extracted_words.intersection(CRITICAL_KEYWORDS)`
  * Python executes the intersection in low-level C code at memory speed, identifying all shared terms in a single optimized pass.

---

### 3. Substring Collisions & Word Boundaries Revisited (`"paint"` vs. `"complaint"`)
Why is word boundary matching even more critical for priority calculations than department routing?

* **The Catastrophic Downgrade Bug:**
  * Suppose our cosmetic pool contains `"paint"`.
  * A student submits a serious report: *"The electrical switch caught fire. This is my third **complaint**."*
  * If the engine used simple substring matching:
    `'paint' in 'This is my third complaint'` ➔ Evaluates to `True`!
  * If the rule logic was flawed, the word `"complaint"` could falsely trigger the cosmetic rule and downgrade an electrical fire to `LOW` priority!
* **Regular Expression Word Boundaries (`\b`):**
  * Wrapping keywords in `r"\b" + keyword + r"\b"` guarantees that the letter `p` in `"paint"` must not be preceded by `"com"`.
  * Only genuine, standalone words match, preventing catastrophic misclassifications.

---

### 4. Explainable System Architecture (Transparency in Decision Engines)
Why is returning a `reasoning` string considered standard architectural practice?

* **The "Black Box" Problem:**
  * If a system outputs only `{"priority": "HIGH"}`, human operators cannot determine why the decision was made. If a ticket is misclassified, debugging requires stepping through code with a debugger.
* **Audit Transparency:**
  * By returning `{"priority": "HIGH", "detected_keywords": ["burst", "pipe"], "reasoning": "Major infrastructure failure detected: burst"}`, the system explains its own internal logic.
  * If an evaluator asks during a project demo: *"Why is this ticket marked High?"*, the frontend can display the reasoning string directly on the screen, proving that the algorithm works deterministically.

---

# 6. Definition of Done: How to Verify This File Is Complete

This component is 100% complete and verified when:

1. **File Existence:**
   * The Python module exists precisely at `backend/app/services/priority_engine.py`.
2. **Constant & Keyword Declarations:**
   * `PRIORITY_CRITICAL`, `PRIORITY_HIGH`, `PRIORITY_MEDIUM`, and `PRIORITY_LOW` are defined.
   * `CRITICAL_KEYWORDS`, `HIGH_KEYWORDS`, and `LOW_KEYWORDS` are populated.
3. **Four-Tier Verification:**
   * Testing hazard terms ("fire", "spark") returns `CRITICAL` with `hazard_detected = True`.
   * Testing major outages ("burst", "blackout") returns `HIGH`.
   * Testing routine repairs ("fan stopped") returns `MEDIUM`.
   * Testing cosmetic defects ("paint scratched") returns `LOW`.
4. **Programmatic Verification:**
   * Executing the following inline terminal command from `backend/`:
     `python -c "from app.services.priority_engine import calculate_priority, PRIORITY_CRITICAL, PRIORITY_HIGH, PRIORITY_MEDIUM, PRIORITY_LOW; assert calculate_priority('Fire in lab', 'smoke coming from outlet')['priority'] == PRIORITY_CRITICAL; assert calculate_priority('Pipe burst', 'water everywhere')['priority'] == PRIORITY_HIGH; assert calculate_priority('Fan not working', 'stopped spinning')['priority'] == PRIORITY_MEDIUM; assert calculate_priority('Desk paint peeling', 'cosmetic mark on table')['priority'] == PRIORITY_LOW; print('Priority Engine OK: All 4 Priority Tiers Verified')"`
     succeeds cleanly, printing `Priority Engine OK: All 4 Priority Tiers Verified`.
