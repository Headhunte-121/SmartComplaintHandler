# Module M2 - File 01: Unique Tracking Code Generator
## Target File: `backend/app/services/code_generator.py`
### Execution Track: Phase 1 (Can be built in parallel with Files 02 and 03)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In professional software engineering, `code_generator.py` serves as the **Cryptographically Secure Reference Token Generator**. It is the standard utility responsible for minting short, high-entropy, human-readable identifiers that external users (students, customers, patients) use to track transactions across public web interfaces without exposing internal database keys.

### Standard Industry Role & Real-World Use Cases
In modern production systems (such as airline reservation codes, delivery tracking numbers, two-factor authentication tokens, and service desk portals), reference generators standardly fulfill four core architectural requirements:

1. **Mitigating Insecure Direct Object References (IDOR):**
   * Standardly decouples public access from internal database sequence IDs.
   * If an application exposes internal numeric primary keys in URLs (e.g. `/tickets/101`), malicious actors can systematically increment the number (`/tickets/102`, `/tickets/103`) to scrape confidential data belonging to other users.
   * Generating random, non-sequential reference tokens completely neutralizes automated enumeration attacks.
2. **Eliminating Human Optical Misreadings (Disambiguated Character Pools):**
   * Standardly sanitizes the alphanumeric character pool by eliminating ambiguous character pairs (such as the number `0` and capital letter `O`, or the number `1`, lowercase `l`, and capital `I`).
   * When users read reference codes off small smartphone screens or dictate them over the phone to a support desk, disambiguated codes prevent transcription errors.
3. **Cryptographic Entropy from Operating System Hardware:**
   * Uses Cryptographically Secure Pseudo-Random Number Generators (CSPRNG) seeded by hardware entropy rather than standard deterministic random algorithms.
   * Guarantees that even if an attacker inspects dozens of consecutive generated codes, they cannot reverse-engineer the random number generator's internal state to predict the next issued code.
4. **Collision Resistance with Defensive Retry Loops:**
   * Implements automated collision detection: checking the database to guarantee that newly minted tokens are globally unique before committing them to storage.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our campus complaint automation platform, our 5-student engineering team specifically uses `code_generator.py` for four concrete operational functions:

1. **Minting Student Complaint Tracking Codes (`TICK-XXXX`):**
   * Whenever a student files a complaint (such as a broken water pipe or malfunctioning classroom projector), this file mints a formatted, memorable reference code (e.g. `TICK-8F2D`).
   * Displayed in the frontend success modal so students can write it down or screenshot it on their phones.
2. **Powering Passwordless Complaint Status Tracking:**
   * Students track their complaints by navigating to `/track?code=TICK-8F2D`.
   * Allows students to check repair progress without undergoing a tedious multi-step user registration or login process, maximizing student adoption across campus.
3. **Protecting Student Privacy from Campus Enumeration:**
   * Prevents curious students from guessing consecutive ticket IDs to snoop on sensitive complaints filed by roommates or classmates across different hostels.
4. **Automated SQLite Collision Protection:**
   * Provides `generate_unique_tracking_code(db: Session)` which queries our SQLite `tickets` table to ensure that even with thousands of campus complaints, duplicate tracking codes are never inserted.

### How Other Components Standardly Interact with This File
Across the backend service layer, components consume this generator through clean functional imports:
* **The Ticket Service (`app/services/ticket_service.py`):** When creating a new complaint, the service calls:
  `tracking_code = generate_unique_tracking_code(db)`
  and stamps the resulting string directly into the ORM `Ticket` instance.
* **Unit Testing Suites:** Test runners import `generate_tracking_code()` directly to assert that generated strings match the required length, prefix format, and character set constraints without touching the database.

### The Core Problem It Solves & Why It Exists
* **The Sequential Scrape Vulnerability:** Exposing incremental integer IDs allows competitors or students to measure total institutional complaint volume and view confidential records. Random reference tokens seal this vulnerability.
* **The Visual Confusion Trap:** Using standard alphanumeric generators outputs strings like `1I0O8B`, causing students to type the wrong character on mobile tracking forms and report that their complaint was lost.
* **The Silent Crash on Duplicate Keys:** Blindly inserting generated codes without verifying database uniqueness causes random `IntegrityError` crashes during peak submission periods.

---

# 2. What Must Be in This File & Why Each Item Is Needed

To be complete, this component must define, configure, and export the following four essential items:

---

### Item 1: Disambiguated Character Pool Constant (`ALPHABET`)
* **What it is:** A module-level constant string defining the exact pool of valid alphanumeric characters permitted in generated tracking codes.
* **Specification:** `ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"`
* **Why it is needed:**
  * **Excluding `0` and `O`:** On mobile displays and in many monospaced fonts, the numeric zero (`0`) and the uppercase letter `O` look virtually indistinguishable.
  * **Excluding `1` and `I`:** The numeric one (`1`) and the uppercase letter `I` frequently appear identical.
  * **Base-32 Pool Size:** Removing these four characters leaves exactly 32 unambiguous characters ($2^5$). 32 characters provide clean mathematical bit-distribution and over one million ($32^4 = 1,048,576$) unique 4-character combinations.

---

### Item 2: Cryptographic Token Generator (`generate_tracking_code`)
* **What it is:** A standalone helper function that accepts an optional prefix and character length, returning a formatted random string.
* **Signature:** `generate_tracking_code(prefix: str = "TICK-", length: int = 4) -> str`
* **Why it is needed:**
  * **Prefix Identification:** Prepending `TICK-` immediately identifies the token as a complaint tracking code across student notifications, database logs, and administrative emails.
  * **Pure Functional Design:** It does not touch the database, making it instantaneous to execute, completely stateless, and trivial to unit test in isolation.
  * **Configurable Defaults:** Allows callers to override the prefix or expand the length to 6 or 8 characters in future milestones without rewriting function internals.

---

### Item 3: Hardware Entropy Sampling Loop (`secrets.choice`)
* **What it is:** A generator loop that samples random characters from `ALPHABET` using Python's standard library `secrets` module.
* **Behavior:** Executes `secrets.choice(ALPHABET)` exactly `length` times and joins the characters into a single string.
* **Why it is needed:**
  * **True Cryptographic Randomness:** Python's standard `random` module uses the Mersenne Twister algorithm, which is completely deterministic and predictable if an attacker observes a few generated values.
  * Python's `secrets` module interfaces directly with the operating system's kernel entropy pool (hardware interrupts, thermal noise, disk timings), ensuring generated codes cannot be predicted or reverse-engineered.

---

### Item 4: Database-Aware Collision-Resistant Wrapper (`generate_unique_tracking_code`)
* **What it is:** A service-level function that accepts an active SQLAlchemy database session and guarantees that the returned code does not exist in the database.
* **Signature:** `generate_unique_tracking_code(db: Session, prefix: str = "TICK-", length: int = 4, max_attempts: int = 10) -> str`
* **Why it is needed:**
  * **Collision Verification:** Executes a high-speed indexed query against SQLite:
    `exists = db.query(Ticket.id).filter_by(tracking_code=code).first()`
  * **Defensive Guard Condition (`max_attempts`):** If a generated code collides with an existing record, the function regenerates a new one. A maximum loop limit (defaulting to 10) guarantees that if the database ever approaches saturation, the code will raise a clear `RuntimeError` rather than locking the web server in an infinite loop.
  * **Clean Separation of Concerns:** Keeps database query logic isolated from the pure string generator function.

---

# 3. Component Life-Cycle: Input, Process, Output

| Stage | What Happens Behind the Scenes |
| :--- | :--- |
| **INPUT** | An active database session (`db: Session`) passed from `ticket_service.py`, with optional prefix (`"TICK-"`) and length (`4`). |
| **PROCESS** | 1. The function enters a loop bounded by `max_attempts = 10`.<br>2. It invokes `secrets.choice(ALPHABET)` 4 times, querying the OS kernel entropy pool.<br>3. It concatenates the prefix and random characters (e.g. `"TICK-4K89"`).<br>4. It emits an indexed query to SQLite checking `filter(Ticket.tracking_code == code)`.<br>5. If no row exists, the loop immediately terminates and returns the unique code.<br>6. If a collision occurs (probability $< 0.001\%$), it discards the code and retries. |
| **OUTPUT** | An unambiguous, cryptographically random, verified collision-free tracking code string (e.g. `"TICK-8F2D"`). |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. What Must Stay Exact

### 🟢 Safe to Modify & Customize (Your Team's Creative Freedom):
* **Customizing the Tracking Code Prefix:** You can change `prefix="TICK-"` to reflect your college branding (e.g. `prefix="CAMPUS-"`, `prefix="GRIEVANCE-"`, or `prefix="SVC-"`). Changing the prefix string will not break database constraints or API contracts as long as it fits inside the database column length (`String(50)`).
* **Expanding Code Length:** You can increase `length=4` to `length=6` (yielding over 1 billion unique combinations) or `length=8` if campus submission volume grows.
* **Altering Character Set:** You can add lowercase characters or additional symbols, provided they remain unambiguous to human eyes.
* **Adjusting Retry Limits:** You can increase `max_attempts` from 10 to 20 if testing high-density stress scripts.

### 🔴 Strict Non-Negotiables (Must Remain Exact Across the Team):
* **The Cryptographic Engine (`secrets` module):** You must use `secrets.choice` from Python's standard `secrets` library. Never replace it with `random.choice`. Using `random` introduces predictable seeds that violate software security guidelines.
* **Function Names & Signatures:** The function names `generate_tracking_code` and `generate_unique_tracking_code` must remain exact. `app/services/ticket_service.py` imports these specific function identifiers.
* **Return Type (`str`):** Must return a standard Python string.
* **File Location (`backend/app/services/code_generator.py`):** The module must reside precisely at this path.

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
   * The module exists precisely at `backend/app/services/code_generator.py`.
2. **Alphabet Verification:**
   * `ALPHABET` is defined as a string of exactly 32 characters, with `0`, `1`, `I`, and `O` excluded.
3. **Function Signatures:**
   * `generate_tracking_code(prefix="TICK-", length=4) -> str` is exported.
   * `generate_unique_tracking_code(db: Session, prefix="TICK-", length=4, max_attempts=10) -> str` is exported.
4. **Programmatic Verification:**
   * Executing the inline terminal command:
     `python -c "from app.services.code_generator import generate_tracking_code, ALPHABET; code = generate_tracking_code(); assert code.startswith('TICK-'); assert len(code) == 9; assert all(c in ALPHABET for c in code[5:]); print('Code Generator OK:', code)"`
     succeeds cleanly, printing a valid tracking code (e.g. `Code Generator OK: TICK-8F2D`).
