# Module M3 - File 02: Advanced Taxonomy Classification Engine
## Target File: `backend/app/services/classifier.py`
### Execution Track: Phase 1 (Can be built in parallel with Files 01 and 03)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In enterprise information retrieval, text classification, and natural language routing architectures, `classifier.py` defines the **Weighted Domain Taxonomy Classification Engine**. It upgrades baseline flat keyword matching into a multi-factor scoring system: weighting field importance (giving higher priority to concise titles over long, noisy descriptions), computing mathematical confidence scores, resolving vocabulary overlaps between departments, and providing a clean tie-breaking resolution system.

### Standard Industry Role & Real-World Use Cases
In professional service desk and automated triage platforms, advanced taxonomy classifiers standardly fulfill four core architectural requirements:

1. **Field-Weighted Feature Extraction:**
   * In human communication, a user's title ("Water leaking in bathroom") is high in **Information Entropy** (dense with core intent), while the description often contains conversational filler ("Hello sir, I was walking by yesterday and noticed...").
   * A weighted classifier assigns higher mathematical multipliers (e.g. 2.0x) to tokens discovered in the title compared to tokens in the body (1.0x), preventing irrelevant conversational words from distorting classification.
2. **Confidence Score Calculation ($0.0$ to $1.0$):**
   * Computes a normalized confidence metric representing classification certainty.
   * If a complaint mentions 5 distinct electrical terms and 0 plumbing terms, confidence is high ($0.95$). If a complaint mentions 1 electrical term and 1 plumbing term, confidence is low ($0.50$).
   * Allows downstream systems to trigger human review when confidence drops below an institutional threshold.
3. **Cross-Department Conflict Resolution (Tie-Breaking Heuristics):**
   * Real-world complaints frequently cross domain boundaries (e.g. "The wooden desk near the electrical switch is damaged").
   * An advanced classifier uses deterministic tie-breaking algorithms (evaluating margin of victory, keyword density, and domain specificity) to route the complaint cleanly rather than failing on equal scores.
4. **Decoupling Taxonomy Metadata from Database State:**
   * Centralizes the official names, descriptions, and keywords of all 6 campus departments in a structured in-memory registry, making classification instantaneous without querying SQLite on every character match.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our campus complaint automation platform, our 5-student engineering team specifically uses `classifier.py` for four concrete operational functions:

1. **Upgrading Our Module M2 Baseline Categorization:**
   * In Module M2, `keyword_router.py` performed flat, unweighted keyword counting.
   * `classifier.py` provides the advanced production classifier for Module M3: applying a 2.0x multiplier to words in the complaint title and a 1.0x multiplier to words in the description.
2. **Calculating True Confidence Ratings:**
   * Generates a floating-point confidence score (e.g. `confidence = 0.85`) that is passed to the frontend so staff can see how confident the automated engine was in its departmental routing.
3. **Handling Complex Multi-Keyword Campus Complaints:**
   * Properly routes complaints like: *"Water leaking from ceiling onto electrical junction box in Hostel Room 104"*.
   * The classifier identifies that while both water and electricity are present, the hazard engine (File 01) handles the electrical life-safety priority, while the classifier routes the repair to the root physical cause (Plumbing).
4. **Providing the Pre-Submission Triage Preview:**
   * Powers our frontend real-time preview feature: as a student types their complaint in React, the frontend calls our triage preview API, displaying an instant colored badge ("Predicted: Electrical (92% Confidence)").
5. **Architectural Baseline for Future AI Contextual Keyword Extraction (V2 Architecture):**
   * Acts as the deterministic baseline for future AI integration. In V2, an AI model will read the full report context to extract keywords and determine categories, while this engine serves as the zero-latency, local fallback.

### Future AI Integration & Contextual Keyword Extraction Hook (V2 Roadmap)
While Version 1 uses fixed taxonomy dictionaries, the architecture of `classify_complaint(title, description) -> dict` is intentionally built to support future AI contextual keyword extraction:
* **Context-Aware Keyword Extraction:** In V2, the system will pass the complaint narrative to an AI model (such as Google's Gemini API) with a specialized context-extraction prompt: *"Analyze this student complaint report. Inspect the narrative context for the root physical failure, filter out irrelevant mentions, extract contextual keywords, and determine the responsible service department."*
* **Overcoming Literal Keyword Ambiguity:** Unlike static regex matching, an AI model understands conversational context:
  * Distinguishes negations (*"The ceiling is dry, but the floor drain is clogged"* ➔ routes to Plumbing without triggering roofing infrastructure).
  * Resolves slang and indirect phrasing (*"WiFi keeps dying every time the microwave runs"* ➔ understands electrical interference vs network hardware).
* **Consistent Return Interface:** The AI will return data conforming to the exact same return contract (`category`, `department_id`, `confidence`, `matched_keywords`, `reason`), ensuring that switching to AI in V2 requires zero refactoring of the ticket service or API routers.
* **Human Supervisory Control:** The AI decides initial categorization, but campus administrators retain the ability to override department assignments and priorities if on-site diagnostics differ from the automated classification.

### How Other Components Standardly Interact with This File
Across the backend architecture, this classifier is consumed via standard functional calls:
* **The Ticket Service (`app/services/ticket_service.py`):** Calls `classification = classify_ticket(title, description)` during ticket creation.
* **The Priority Endpoints Router (`app/api/v1/endpoints/priority.py`):** Calls `classify_ticket()` inside the `/triage-preview` route to return real-time categorization to the web browser.
* **Unit Testing Suites:** Test runners pass complex, edge-case campus complaints to assert that confidence scores and department IDs are mathematically consistent.

### The Core Problem It Solves & Why It Exists
* **The "Noisy Description" Trap:** A student filing an electrical issue might write: *"The fan is broken. I was carrying my water bottle and noticed it."* An unweighted scanner sees `"fan"` (Electrical) and `"water"` (Plumbing), producing a tie. Weighting the title breaks the tie instantly.
* **The False Confidence Illusion:** Without a confidence metric, the system treats a 1-keyword guess identically to a 10-keyword definitive match. Confidence metrics give visibility into classification quality.
* **Brittle Code:** Putting all keywords and scoring formulas inside a single flat script makes expanding to new departments difficult. This file structures taxonomy into clean, extensible dictionaries.

---

# 2. What Must Be in This File & Why Each Item Is Needed

To be complete, this component must define, configure, and export the following five essential items:

---

### Item 1: Department Taxonomy Registry (`DEPARTMENTS_TAXONOMY`)
* **What it is:** A structured dictionary mapping each department ID (1 through 6) to its official title, primary keywords, and secondary keywords.
* **Specification:**
  * `1` (Electrical): Official Name: `"Electrical"`. Keywords: `"fan"`, `"light"`, `"bulb"`, `"wire"`, `"spark"`, `"switch"`, `"socket"`, `"power"`, `"blackout"`, `"voltage"`, `"ac"`, `"cooler"`, `"short circuit"`, `"mcb"`, `"fuse"`, `"tube light"`.
  * `2` (Plumbing): Official Name: `"Plumbing"`. Keywords: `"pipe"`, `"leak"`, `"water"`, `"tap"`, `"drain"`, `"flush"`, `"tank"`, `"sewage"`, `"faucet"`, `"clog"`, `"dripping"`, `"overflow"`, `"geyser"`, `"washroom"`, `"sink"`.
  * `3` (Sanitation): Official Name: `"Sanitation"`. Keywords: `"garbage"`, `"trash"`, `"cleaning"`, `"dustbin"`, `"smell"`, `"odor"`, `"waste"`, `"dirty"`, `"pest"`, `"mosquito"`, `"cockroach"`, `"sanitary"`, `"sweeping"`, `"litter"`.
  * `4` (Carpentry): Official Name: `"Carpentry"`. Keywords: `"door"`, `"window"`, `"desk"`, `"chair"`, `"bench"`, `"table"`, `"cupboard"`, `"handle"`, `"lock"`, `"hinge"`, `"wooden"`, `"furniture"`, `"board"`, `"bed"`.
  * `5` (IT Support): Official Name: `"IT Support"`. Keywords: `"wifi"`, `"internet"`, `"network"`, `"lan"`, `"ethernet"`, `"router"`, `"printer"`, `"projector"`, `"computer"`, `"system"`, `"portal"`, `"login"`, `"screen"`, `"monitor"`.
  * `6` (General Administration): Official Name: `"General Administration"`. Default fallback with empty keyword set.
* **Why it is needed:**
  * Maps directly to the `departments` table seeded in Module M1.
  * Supplies both the numeric primary key (`1`) and the human-readable department title (`"Electrical"`).

---

### Item 2: Field Weighting Multipliers
* **What it is:** Numeric floating-point constants defining the importance of matching keywords in different fields.
* **Specification:**
  * `TITLE_WEIGHT: float = 2.0`
  * `DESCRIPTION_WEIGHT: float = 1.0`
* **Why it is needed:**
  * **Information Density Multiplier:** A keyword in the title is deliberately chosen by the student to summarize the problem, making it twice as significant as a word casually mentioned in the body.

---

### Item 3: Weighted Token Scoring Algorithm
* **What it is:** Logic that scans title and description independently using regular expression word boundaries (`\b`), multiplying matches by their respective weights.
* **Formula:**
  $$\text{Department Score} = (N_{\text{title\_matches}} \times \text{TITLE\_WEIGHT}) + (N_{\text{desc\_matches}} \times \text{DESCRIPTION\_WEIGHT})$$
* **Why it is needed:**
  * Translates raw textual occurrence into an objective numeric score for each department.

---

### Item 4: Confidence Score Normalizer
* **What it is:** A mathematical calculation that evaluates the winning score relative to competing scores and total matches.
* **Formula:**
  * If no matches occur across all departments: $\text{Confidence} = 0.0$ (routes to Department 6).
  * If matches occur:
    $$\text{Confidence} = \min\left(1.0, \frac{\text{Winning Score}}{\text{Total Matches} + 1.0} + 0.3\right)$$
* **Why it is needed:**
  * Produces a clean, normalized float between $0.0$ and $1.0$ suitable for frontend percentage display (e.g. $0.85 = 85\%$).

---

### Item 5: Core Classification Function (`classify_ticket`)
* **What it is:** The primary public API function returning the complete classification assessment.
* **Signature:** `classify_ticket(title: str, description: str) -> dict`
* **Return Structure:** A dictionary containing:
  * `department_id`: Integer (1 to 6).
  * `department_name`: String (e.g. `"Electrical"`).
  * `confidence`: Float ($0.0$ to $1.0$).
  * `matched_keywords`: List of unique strings that contributed to the score.
* **Why it is needed:**
  * Provides a complete, self-contained categorization payload ready for service layer database storage and API response serialization.

---

# 3. Component Life-Cycle: Input, Process, Output

| Stage | What Happens Behind the Scenes |
| :--- | :--- |
| **INPUT** | Complaint `title` (e.g. `"Broken ceiling fan"`) and `description` (e.g. `"The fan in my room makes a loud humming noise and stopped spinning."`). |
| **PROCESS** | 1. Normalizes title and description into lowercase text.<br>2. Scans title: finds `"fan"` in Electrical pool ($1 \text{ match} \times 2.0 = 2.0$).<br>3. Scans description: finds `"fan"` in Electrical pool ($1 \text{ match} \times 1.0 = 1.0$).<br>4. Electrical Total Score $= 3.0$. All other departments $= 0.0$.<br>5. Identifies Department 1 as the clear winner.<br>6. Computes normalized confidence: $0.88$.<br>7. Assembles output payload. |
| **OUTPUT** | `{"department_id": 1, "department_name": "Electrical", "confidence": 0.88, "matched_keywords": ["fan"]}`. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. What Must Stay Exact

### 🟢 Safe to Modify & Customize (Your Team's Creative Freedom):
* **Adjusting Weight Multipliers:** You can alter the weighting ratio (e.g. changing `TITLE_WEIGHT = 3.0` if you want titles to have even greater dominance over descriptions).
* **Expanding Department Keywords:** You can freely add specialized campus vocabulary to any department's keyword set in `DEPARTMENTS_TAXONOMY` (e.g. adding `"air conditioner"`, `"water purifier"`, or `"projector screen"`).
* **Refining Confidence Formulas:** You can tweak the mathematical formula used to compute `confidence`.

### 🔴 Strict Non-Negotiables (Must Remain Exact Across the Team):
* **Department IDs (1 to 6):** Must match the exact primary key integers seeded in Module M1 (`departments.id`). Renaming or swapping IDs will corrupt foreign key links in SQLite.
* **Function Identifier & Signature:** Must remain `classify_ticket(title: str, description: str) -> dict`. `app/services/ticket_service.py` and API endpoints import and call this specific function.
* **Output Dictionary Keys:** Must return `"department_id"`, `"department_name"`, `"confidence"`, and `"matched_keywords"`.
* **File Location (`backend/app/services/classifier.py`):** The module must reside precisely at this path.

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

# 6. Definition of Done: How to Verify This File Is Complete

This component is 100% complete and verified when:

1. **File Existence:**
   * The Python module exists precisely at `backend/app/services/classifier.py`.
2. **Taxonomy & Weight Definitions:**
   * `DEPARTMENTS_TAXONOMY` defines all 6 departments with non-empty keyword pools for departments 1 through 5.
   * `TITLE_WEIGHT` is set to `2.0` and `DESCRIPTION_WEIGHT` to `1.0`.
3. **Scoring & Weighting Verification:**
   * A title match outweighs a competing body match.
   * Confidence scores evaluate between `0.0` and `1.0`.
   * Unmatched complaints return Department ID 6 with `confidence = 0.0`.
4. **Programmatic Verification:**
   * Executing the following inline terminal command from `backend/`:
     `python -c "from app.services.classifier import classify_ticket; res1 = classify_ticket('Ceiling fan broken', 'fan stopped'); assert res1['department_id'] == 1; assert res1['confidence'] > 0.7; res2 = classify_ticket('Pipe leak', 'water on floor'); assert res2['department_id'] == 2; res3 = classify_ticket('Lost watch', 'left in library'); assert res3['department_id'] == 6; assert res3['confidence'] == 0.0; print('Classifier Engine OK: Title Weighting and Multi-Category Routing Verified')"`
     succeeds cleanly, printing `Classifier Engine OK: Title Weighting and Multi-Category Routing Verified`.
