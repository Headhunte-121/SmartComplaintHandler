# Module M2 - File 02: Deterministic Keyword Routing Engine
## Target File: `backend/app/services/keyword_router.py`
### Execution Track: Phase 1 (Can be built in parallel with Files 01 and 03)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In enterprise workflow automation and service desk engineering, `keyword_router.py` serves as the **Deterministic Rule-Based Triage & Classification Engine**. It provides high-speed, local, zero-latency text classification, scanning the textual narrative of an incoming support request to automatically identify the responsible administrative department without human intervention.

### Standard Industry Role & Real-World Use Cases
In modern service management and distributed architectures, deterministic keyword routers standardly fulfill four critical operational requirements:

1. **Sub-Millisecond Heuristic Classification:**
   * Unlike large machine learning or cloud AI models (which introduce 500ms to 2000ms of network latency and consume external API tokens), a local dictionary-based keyword scanner executes in under 1 millisecond.
   * Immediately classifies 80% to 90% of standard, obvious domain complaints without incurring compute costs or network overhead.
2. **Defensive Offline Fallback for Cloud AI Services:**
   * In production enterprise systems that integrate cloud AI (such as Google Gemini, OpenAI, or AWS Bedrock), network timeouts, rate limit breaches, and cloud outages will inevitably happen.
   * A local deterministic rule engine serves as the **High-Availability Circuit Breaker Fallback**: if the external AI service fails or drops off the network, the application instantly routes requests through the keyword router, guaranteeing 100% platform uptime.
3. **Word-Boundary Tokenization & Disambiguation:**
   * Standardly implements regular expression word boundary scanning (`\bkeyword\b`).
   * Prevents false positive matching caused by partial substrings (e.g. ensuring the word `"fan"` matches a cooling fan complaint, but does not falsely match inside words like `"fantastic"` or `"infantry"`).
4. **Guaranteed Routing with Default Fallbacks:**
   * Ensures that no incoming ticket is ever left as an unassigned "orphan" floating without an administrative owner.
   * If an incoming complaint lacks domain-specific keywords (e.g. "I lost my ID card near the fountain"), the system automatically assigns the ticket to a designated general triage department.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our campus complaint automation platform, our 5-student engineering team specifically uses `keyword_router.py` for four concrete operational functions:

1. **Auto-Categorizing Complaints to Our 6 Campus Departments:**
   * Scans incoming student titles and descriptions to route tickets directly to the correct department ID seeded in Module M1:
     * Department 1: **Electrical** (ceiling fans, broken switches, sparking wires, circuit breakers).
     * Department 2: **Plumbing** (dripping taps, pipe leaks, clogged washroom drains, overhead water tanks).
     * Department 3: **Sanitation** (overflowing trash bins, dirty hostel corridors, pest control, restroom hygiene).
     * Department 4: **Carpentry** (broken lecture hall desks, broken hostel wooden doors, damaged window frames).
     * Department 5: **IT Support** (campus Wi-Fi outages, laboratory LAN cables, broken projectors, portal login bugs).
     * Department 6: **General Administration** (default fallback for unmapped campus queries).
2. **Providing Rock-Solid Evaluation Demo Reliability:**
   * Because this engine runs locally in Python memory with zero external API dependencies, our team can demonstrate end-to-end complaint routing to college evaluators even if the college campus Wi-Fi drops completely.
3. **Keyword Auditing for Staff Explanations:**
   * Returns a list of matched keywords (e.g. `matched_keywords = ["tap", "leak"]`), which is logged and displayed on the technician dashboard so workers understand why the ticket was directed to their department.
4. **Foundation for Module V2 AI Upgrade:**
   * In Milestone V2, when we add the Gemini AI classification service, we will plug the AI router in front of this file. If the student uses complex colloquial language, Gemini classifies it; if Gemini times out, this file handles it seamlessly.

### How Other Components Standardly Interact with This File
Across the backend architecture, other components interact with this engine through a single standardized function:
* **The Ticket Service (`app/services/ticket_service.py`):** When creating a complaint, the service calls:
  `classification = classify_complaint(ticket_in.title, ticket_in.description)`
  `new_ticket.department_id = classification["department_id"]`
* **Unit Testing Suites:** Automated tests pass synthetic strings ("The fan in Room 302 is smoking") to assert that `department_id == 1` is returned deterministically.

### The Core Problem It Solves & Why It Exists
* **The Manual Triage Bottleneck:** Without auto-routing, a human college administrator must manually read hundreds of daily complaints and click dropdowns, causing day-long delays. Auto-routing reduces triage latency to zero.
* **The Cloud API Dependency Trap:** Relying exclusively on external AI models during a college viva demo creates an extreme point of failure: if API keys expire or the internet fails, the demo crashes. A deterministic router ensures absolute reliability.
* **Orphan Tickets:** Complaints with no clear category could be rejected or lost. The General Administration fallback ensures 100% of complaints are captured and reviewed.

---

# 2. What Must Be in This File & Why Each Item Is Needed

To be complete, this component must define, configure, and export the following five essential items:

---

### Item 1: Department Keyword Mapping Catalog (`DEPARTMENT_KEYWORDS`)
* **What it is:** A module-level dictionary mapping integer department IDs (1 through 5) to comprehensive lists of lowercase keywords representing that department's physical maintenance domain.
* **Specification:**
  * `1` (Electrical): `"fan"`, `"light"`, `"bulb"`, `"wire"`, `"spark"`, `"switch"`, `"socket"`, `"power"`, `"blackout"`, `"voltage"`, `"ac"`, `"cooler"`, `"short circuit"`, `"mcb"`.
  * `2` (Plumbing): `"pipe"`, `"leak"`, `"water"`, `"tap"`, `"drain"`, `"flush"`, `"tank"`, `"sewage"`, `"faucet"`, `"clog"`, `"dripping"`, `"overflow"`, `"geyser"`.
  * `3` (Sanitation): `"garbage"`, `"trash"`, `"cleaning"`, `"dustbin"`, `"smell"`, `"odor"`, `"waste"`, `"dirty"`, `"pest"`, `"mosquito"`, `"cockroach"`, `"sanitary"`.
  * `4` (Carpentry): `"door"`, `"window"`, `"desk"`, `"chair"`, `"bench"`, `"table"`, `"cupboard"`, `"handle"`, `"lock"`, `"hinge"`, `"wooden"`, `"furniture"`.
  * `5` (IT Support): `"wifi"`, `"internet"`, `"network"`, `"lan"`, `"ethernet"`, `"router"`, `"printer"`, `"projector"`, `"computer"`, `"system"`, `"portal"`, `"login"`.
* **Why it is needed:**
  * Establishes the definitive institutional maintenance vocabulary.
  * Directly reflects the physical infrastructure and common student grievances found on an engineering campus.

---

### Item 2: Default Fallback Department ID (`DEFAULT_DEPARTMENT_ID`)
* **What it is:** A module-level integer constant set to `6` representing General Administration.
* **Specification:** `DEFAULT_DEPARTMENT_ID: int = 6`
* **Why it is needed:**
  * Implements the **Null Object / Fallback Pattern**.
  * If a student writes a vague or non-technical complaint (e.g. "Someone took my notebook from the library"), the scanner will find zero matching technical keywords. Setting `DEFAULT_DEPARTMENT_ID = 6` routes the issue to General Administration for human review rather than rejecting the submission or raising an unhandled error.

---

### Item 3: Text Normalization Function (`normalize_text`)
* **What it is:** A private helper function that cleans and standardizes raw input strings before matching occurs.
* **Signature:** `_normalize_text(text: str) -> str`
* **Why it is needed:**
  * **Case Neutralization:** Students enter text with unpredictable capitalization ("FAN NOT WORKING", "Fan", "fan"). Converting all text to lowercase via `text.lower()` guarantees case-insensitive evaluation.
  * **Punctuation & Extra Whitespace Cleansing:** Eliminates extraneous punctuation (commas, exclamation marks, line breaks) that could interfere with word boundary tokenization.

---

### Item 4: Regular Expression Word-Boundary Matcher
* **What it is:** Logic utilizing Python's `re` module to check for whole words rather than raw substring containment.
* **Behavior:** For each keyword, it compiles or executes a word-boundary pattern: `r"\b" + re.escape(keyword) + r"\b"`.
* **Why it is needed:**
  * **Sub-String Collision Prevention:** In pure Python, writing `'ac' in 'reaction'` evaluates to `True`. If our scanner used simple `'ac' in text`, any complaint containing the word `"reaction"`, `"practice"`, or `"place"` would falsely trigger the Electrical department!
  * Word boundary `\b` asserts that the keyword is surrounded by non-alphanumeric characters (spaces, punctuation, start/end of string), guaranteeing that `"ac"` only matches when used as an independent word.

---

### Item 5: Core Classification Function (`classify_complaint`)
* **What it is:** The primary public API function that accepts the complaint's title and description, computes keyword match frequencies across departments, and returns the winning department.
* **Signature:** `classify_complaint(title: str, description: str) -> dict`
* **Return Structure:** A dictionary containing:
  * `department_id`: Integer (1 to 6).
  * `matched_keywords`: List of unique string keywords that triggered the match.
  * `confidence`: Float representing matching confidence (e.g. `1.0` for matches, `0.0` for default fallback).
* **Why it is needed:**
  * **Frequency-Based Winner Resolution:** If a complaint mentions multiple words (e.g. "The wooden desk near the electrical switch is broken"), the function counts occurrences across departments. Department 4 (Carpentry) receives 2 matches (`"wooden"`, `"desk"`), while Department 1 receives 1 match (`"switch"`). The algorithm selects Department 4 as the highest-frequency winner.
  * **Audit Metadata:** Returning `matched_keywords` and `confidence` provides full diagnostic visibility to developers, supervisors, and future AI triage comparison suites.

---

# 3. Component Life-Cycle: Input, Process, Output

| Stage | What Happens Behind the Scenes |
| :--- | :--- |
| **INPUT** | Complaint `title` (e.g. `"Ceiling fan sparking"`) and `description` (e.g. `"The fan in room 204 has loose wires and sparks when turned on."`). |
| **PROCESS** | 1. The function concatenates title and description: `combined = title + " " + description`.<br>2. `_normalize_text()` converts `combined` to lowercase and strips irregular punctuation.<br>3. It initializes a counter dictionary tracking match scores for department IDs 1 through 5.<br>4. It loops through `DEPARTMENT_KEYWORDS`, evaluating word boundary regexes against the normalized text.<br>5. For each match, it increments that department's score and appends the keyword to a matched list.<br>6. It inspects the scores: if all scores are 0, it selects `DEFAULT_DEPARTMENT_ID = 6` with confidence `0.0`.<br>7. If matches exist, it selects the department ID with the highest score and calculates confidence. |
| **OUTPUT** | A dictionary: `{"department_id": 1, "matched_keywords": ["fan", "wire", "spark"], "confidence": 1.0}`. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. What Must Stay Exact

### 🟢 Safe to Modify & Customize (Your Team's Creative Freedom):
* **Expanding Keyword Vocabularies:** You can freely add new slang, technical terms, or regional vocabulary to any department's keyword list in `DEPARTMENT_KEYWORDS` (e.g. adding `"mcb"`, `"inverter"`, `"ro water"`, or `"whiteboard"`). Adding keywords increases routing accuracy.
* **Changing the Fallback Department ID:** You can change `DEFAULT_DEPARTMENT_ID` if your institution assigns general triage to a different department ID.
* **Adjusting Scoring Weights:** You can give extra weight to keywords found in the `title` compared to the `description` (e.g. counting title matches as 2 points).
* **Confidence Metric Formulas:** You can refine how `confidence` is calculated (e.g. scaling confidence based on the margin of victory between the first-place and second-place department).

### 🔴 Strict Non-Negotiables (Must Remain Exact Across the Team):
* **Department IDs (1 to 6):** The integer keys in `DEPARTMENT_KEYWORDS` must match the exact primary keys seeded into `departments.id` in Module M1 (1: Electrical, 2: Plumbing, 3: Sanitation, 4: Carpentry, 5: IT Support, 6: General Administration). If an ID is wrong, foreign key insertion in SQLite will crash.
* **Function Identifier & Signature:** Must remain `classify_complaint(title: str, description: str) -> dict`. `app/services/ticket_service.py` calls this specific function with these two arguments.
* **Output Dictionary Keys:** The returned dictionary must contain the exact keys: `"department_id"`, `"matched_keywords"`, and `"confidence"`. Consuming modules access these keys directly via subscript notation.
* **File Location (`backend/app/services/keyword_router.py`):** The module must reside precisely at this path.

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
   * The Python module exists precisely at `backend/app/services/keyword_router.py`.
2. **Catalog Integrity:**
   * `DEPARTMENT_KEYWORDS` contains valid keyword lists for department IDs 1 through 5.
   * `DEFAULT_DEPARTMENT_ID` is defined as `6`.
3. **Word-Boundary Matching:**
   * The engine correctly classifies whole words and ignores partial substring collisions (e.g. ignores `"ac"` inside `"practice"`).
4. **Programmatic Verification:**
   * Executing the following inline terminal verification command:
     `python -c "from app.services.keyword_router import classify_complaint; assert classify_complaint('Ceiling fan sparking', 'wire is loose')['department_id'] == 1; assert classify_complaint('Water pipe leak', 'tap broken')['department_id'] == 2; assert classify_complaint('Lost umbrella', 'left in cafeteria')['department_id'] == 6; print('Keyword Router OK: All 3 Tests Passed')"`
     succeeds cleanly, printing `Keyword Router OK: All 3 Tests Passed`.
