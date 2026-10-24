# Comprehensive Code Walkthrough & Line-by-Line Guide: `backend/app/services/priority_engine.py`

> **File Location**: [`backend/app/services/priority_engine.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/backend/app/services/priority_engine.py)  
> **Prerequisites**: Basic knowledge of C or Python (functions, string concatenation, regular expressions `\b`, sets, hierarchical `if/elif/else` decision trees). No machine learning background is assumed.  
> **What this file is**: The deterministic priority calculation engine. It evaluates incoming complaint text against a strict 4-tier life-safety hierarchy:
> 1. **CRITICAL**: Immediate danger to student life or campus infrastructure (e.g. fire, live wire, explosion, gas leak).
> 2. **HIGH**: Major utility disruptions or security compromises (e.g. lift stuck, blackout, broken lock, no water).
> 3. **LOW**: Purely cosmetic or aesthetic blemishes (e.g. paint peeling, scratches, loose screws).
> 4. **MEDIUM**: Standard functional maintenance issues (default baseline).

---

## Block 1: Imports & Priority Severity Registries (Lines 1–82)

```python
"""
SmartComplaintHandler - Priority Scoring Engine
Blueprint Reference: V1/M3/backend/01_priority_engine.md
Role: Evaluates urgency indicators to calculate priority level (CRITICAL, HIGH, MEDIUM, LOW).
"""
import re
from typing import Any, Dict, List, Set

# Item 1: Standardized Priority String Constants
PRIORITY_CRITICAL: str = "CRITICAL"
PRIORITY_HIGH: str = "HIGH"
PRIORITY_MEDIUM: str = "MEDIUM"
PRIORITY_LOW: str = "LOW"

# Item 2: Severity Indicator Keyword Dictionaries
CRITICAL_KEYWORDS: Set[str] = {
    "fire",
    "spark",
    "sparks",
    "sparking",
    "shock",
    "electric shock",
    "current shock",
    "smoke",
    "smoking",
    "gas leak",
    "flood",
    "flooding",
    "danger",
    "emergency",
    "blast",
    "explosion",
    "short circuit",
    "collapse",
    "live wire",
    "burning smell",
    "burning wire",
    "open wire",
    "ceiling collapse",
    "hanging wire",
}

HIGH_KEYWORDS: Set[str] = {
    "burst",
    "blackout",
    "no power",
    "power failure",
    "complete darkness",
    "major leak",
    "broken lock",
    "door lock jammed",
    "locked inside",
    "locked out",
    "overflow",
    "overflowing",
    "sewage",
    "contaminated",
    "dirty water",
    "fallen",
    "lift stuck",
    "elevator stuck",
    "water shortage",
    "no water",
    "geyser burst",
    "toilet blocked",
}

LOW_KEYWORDS: Set[str] = {
    "paint",
    "peeling",
    "scratch",
    "scratched",
    "faded",
    "stain",
    "cosmetic",
    "dust",
    "poster",
    "dirty mark",
    "aesthetic",
    "loose screw",
}
```

### 1. Plain-English Purpose
Imports regex tools and type hints, defines standard uppercase priority string constants (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), and creates three exhaustive keyword dictionaries classifying dangerous hazards, major functional disruptions, and minor cosmetic flaws.

### 2. Line-by-Line Breakdown
- **Lines 1–5 (`""" ... """`)**: Module docstring identifying Blueprint Reference Module 3 (`01_priority_engine.md`).
- **Line 6 (`import re`)**: Standard library regular expressions module.
- **Line 7 (`from typing import Any, Dict, List, Set`)**: Standard type annotations.
- **Lines 9–13 (`PRIORITY_* = ...`)**:
  - String constants representing the 4 allowed priority tiers. Using constants avoids typos (e.g. typing `"Critical"` instead of `"CRITICAL"`).
- **Lines 16–42 (`CRITICAL_KEYWORDS = { ... }`)**:
  - Terms signifying acute physical danger, fire risks, structural collapse, or toxic exposure.
- **Lines 43–66 (`HIGH_KEYWORDS = { ... }`)**:
  - Terms signifying major utility blackouts, total water loss, sewage overflow, or security lockouts (e.g., student locked inside a room).
- **Lines 68–81 (`LOW_KEYWORDS = { ... }`)**:
  - Non-urgent issues involving appearance, paint, dirt, or slight aesthetic wear.

### 3. Deep Term & Concept Expansion
- **Why Constants instead of Raw Strings?**: In C, developers use `#define PRIORITY_CRITICAL "CRITICAL"`. In Python, declaring module-level variables like `PRIORITY_CRITICAL = "CRITICAL"` provides IDE autocomplete and prevents runtime silent bugs caused by typos.
- **Why is there no `MEDIUM_KEYWORDS` set?**: In institutional triage systems, `MEDIUM` is the **default baseline**. If an issue is neither a life-safety crisis (`CRITICAL`), nor a major infrastructure blackout (`HIGH`), nor a trivial aesthetic mark (`LOW`), it is by definition a standard functional repair ticket (`MEDIUM`). Avoiding a medium keyword set eliminates boundary ambiguity.

### 4. Runtime Mechanics & Security
- **Constant-Time Lookups**: Keywords are stored in Python `set` structures, which utilize internal hash tables for high-speed indexing.

---

## Block 2: Whole-Word Boundary Matcher: `_find_matching_keywords` (Lines 84–95)

```python
def _find_matching_keywords(text: str, keyword_set: Set[str]) -> List[str]:
    """
    Search for whole-word boundary matches of keywords within the normalized text.
    Prevents false substring matches like 'paint' inside 'complaint'.
    """
    matches: List[str] = []
    for kw in sorted(keyword_set, key=len, reverse=True):
        pattern = r"\b" + re.escape(kw) + r"\b"
        if re.search(pattern, text, re.IGNORECASE):
            matches.append(kw)
    return matches
```

### 1. Plain-English Purpose
Scans the normalized complaint text for words from a given keyword set. It uses whole-word regex boundaries (`\b`) to eliminate false substring matches (e.g., ensuring the word `"paint"` in `LOW_KEYWORDS` does **not** match the word `"complaint"`!).

### 2. Line-by-Line Breakdown
- **Line 84 (`def _find_matching_keywords(...) -> List[str]:`)**:
  - Internal helper function accepting input `text` and a `keyword_set`.
- **Line 89 (`matches: List[str] = []`)**: Initializes empty match accumulator.
- **Line 90 (`for kw in sorted(keyword_set, key=len, reverse=True):`)**:
  - Sorts keywords from longest to shortest. Evaluates multi-word phrases (e.g., `"burning wire"`) before single words (`"wire"`).
- **Line 91 (`pattern = r"\b" + re.escape(kw) + r"\b"`)**:
  - Wraps the keyword in word boundary anchors (`\b`).
  - Example: `\bpaint\b` matches `"The paint is peeling"` but rejects `"This is a complaint"`.
- **Lines 92–93 (`if re.search(...) matches.append(kw)`)**:
  - Performs case-insensitive matching; appends detected terms.
- **Line 94 (`return matches`)**: Returns list of detected keywords.

### 3. Deep Term & Concept Expansion
- **The "Complaint" vs. "Paint" Classic Bug**:
  ```
  Word: "c-o-m-p-l-a-i-n-t"
  Substring:    [ p-a-i-n-t ]
  ```
  If a developer uses naive substring checking (`if "paint" in text:`), **every single complaint submitted in the entire university** would contain the word `"complaint"`, falsely downgrading all electrical fires and burst pipes to `LOW` priority! The `\b` boundary anchor completely prevents this disaster.

### 4. Runtime Mechanics & Security
- **Deterministic Scanning**: Sorting by length descending ensures that matching behavior is completely deterministic regardless of set hashing order.

---

## Block 3: Hierarchical Urgency Decision Tree: `calculate_priority` (Lines 97–161)

```python
def calculate_priority(title: str, description: str) -> Dict[str, Any]:
    """
    Calculate deterministic priority based on hierarchical safety hazard and severity rules.
    
    Sequence:
    1. Life-safety hazard check -> CRITICAL (hazard_detected=True)
    2. Major infrastructure failure check -> HIGH
    3. Cosmetic defect check -> LOW
    4. Default fallback -> MEDIUM
    """
    text = f"{title or ''} {description or ''}".lower()

    # Step 1: Critical Life-Safety Hazard Check (Short-Circuit)
    critical_matches = _find_matching_keywords(text, CRITICAL_KEYWORDS)
    if critical_matches:
        reason = f"Physical safety hazard detected: {', '.join(critical_matches)}"
        return {
            "priority": PRIORITY_CRITICAL,
            "suggested_priority": PRIORITY_CRITICAL,
            "hazard_detected": True,
            "detected_keywords": critical_matches,
            "matched_keywords": critical_matches,
            "reason": reason,
            "reasoning": reason,
        }

    # Step 2: Major Infrastructure & Utility Disruption Check
    high_matches = _find_matching_keywords(text, HIGH_KEYWORDS)
    if high_matches:
        reason = f"Major operational disruption detected: {', '.join(high_matches)}"
        return {
            "priority": PRIORITY_HIGH,
            "suggested_priority": PRIORITY_HIGH,
            "hazard_detected": False,
            "detected_keywords": high_matches,
            "matched_keywords": high_matches,
            "reason": reason,
            "reasoning": reason,
        }

    # Step 3: Cosmetic & Minor Aesthetic Check
    low_matches = _find_matching_keywords(text, LOW_KEYWORDS)
    if low_matches:
        reason = f"Cosmetic or minor aesthetic defect detected: {', '.join(low_matches)}"
        return {
            "priority": PRIORITY_LOW,
            "suggested_priority": PRIORITY_LOW,
            "hazard_detected": False,
            "detected_keywords": low_matches,
            "matched_keywords": low_matches,
            "reason": reason,
            "reasoning": reason,
        }

    # Step 4: Default Fallback - Standard Maintenance
    default_reason = "Standard operational maintenance issue."
    return {
        "priority": PRIORITY_MEDIUM,
        "suggested_priority": PRIORITY_MEDIUM,
        "hazard_detected": False,
        "detected_keywords": [],
        "matched_keywords": [],
        "reason": default_reason,
        "reasoning": default_reason,
    }
```

### 1. Plain-English Purpose
The central decision tree algorithm. It merges the complaint title and description into a single lowercase text buffer and runs it through a 4-step short-circuit hierarchy. The moment a higher-priority condition matches, it returns immediately without evaluating lower-priority rules.

### 2. Line-by-Line Breakdown
- **Line 107 (`text = f"{title or ''} {description or ''}".lower()`)**:
  - Concatenates title and description into a single string, handling `None` safely.
- **Lines 110–121 (Step 1: Critical Check)**:
  - Scans for `CRITICAL_KEYWORDS`.
  - If any match is found, immediately returns `priority: "CRITICAL"` with `hazard_detected: True` and an explanatory reason string (e.g. `"Physical safety hazard detected: fire, spark"`).
  - Short-circuit return prevents subsequent checks from running.
- **Lines 124–135 (Step 2: Major Infrastructure Check)**:
  - Scans for `HIGH_KEYWORDS`.
  - If matched, returns `priority: "HIGH"` with `hazard_detected: False`.
- **Lines 138–149 (Step 3: Cosmetic Check)**:
  - Scans for `LOW_KEYWORDS`.
  - If matched, returns `priority: "LOW"` with `hazard_detected: False`.
- **Lines 152–161 (Step 4: Default Fallback)**:
  - If no keywords matched Steps 1, 2, or 3, returns `priority: "MEDIUM"`.

### 3. Deep Term & Concept Expansion
- **Short-Circuit Decision Tree**:
  ```mermaid
  flowchart TD
      Input["Complaint: 'Fire in room, paint peeling'"] --> Step1{"Critical Keyword Found? ('fire')"}
      Step1 -- Yes --> ResCrit["Return CRITICAL (Hazard = True)"]
      Step1 -- No --> Step2{"High Keyword Found?"}
      Step2 -- Yes --> ResHigh["Return HIGH"]
      Step2 -- No --> Step3{"Low Keyword Found? ('paint')"}
      Step3 -- Yes --> ResLow["Return LOW"]
      Step3 -- No --> ResMed["Return Default MEDIUM"]
  ```
  Notice that even if the student mentioned `"paint peeling"`, the presence of the word `"fire"` in Step 1 immediately triggers `CRITICAL`. Life-safety always takes absolute precedence over cosmetic observations.

### 4. Runtime Mechanics & Security
- **Deterministic & Auditable**: Unlike probabilistic black-box neural networks, this deterministic engine produces 100% reproducible results and outputs a plain-text `reason` explaining *why* the priority was assigned.

---

## 4. Viva & Technical Defense Guide

> [!TIP]
> **Q1: What is the short-circuit evaluation order in `calculate_priority` and why is this order strictly enforced?**  
> **Answer**: The evaluation order is:
> 1. `CRITICAL` (Life-safety hazard)
> 2. `HIGH` (Major utility/security failure)
> 3. `LOW` (Cosmetic/aesthetic defect)
> 4. `MEDIUM` (Default fallback)  
> This order is strictly enforced because safety must override all other factors. If a student writes *"Ceiling paint is peeling and sparks are flying from the socket"*, evaluating `LOW` first would incorrectly downgrade an electrical fire hazard. Evaluating `CRITICAL` first guarantees immediate life-safety dispatch.

> [!TIP]
> **Q2: Why does the engine use `\b` word boundary regex matching instead of simple `in` string searches?**  
> **Answer**: Simple string searches cause severe false positive bugs. Specifically, the word `"paint"` is a `LOW` priority keyword, but every single complaint submitted in the portal contains the word `"complaint"`. With a naive substring search (`"paint" in text`), every grievance would match `"paint"` and be downgraded to `LOW`. Word boundaries (`\bpaint\b`) ensure that only the exact standalone word matches.

> [!TIP]
> **Q3: Why is `hazard_detected` set to `True` only for `CRITICAL` priorities?**  
> **Answer**: `hazard_detected=True` triggers special emergency protocols across the system: it sounds audio-visual sirens on the technician workstation, highlights the ticket with pulsating red borders on supervisor screens, and immediately assigns the strictest 2-hour SLA deadline. Setting it only for verified physical hazards prevents alert fatigue.

> [!TIP]
> **Q4: Why is `MEDIUM` designed as a default fallback rather than having its own keyword list?**  
> **Answer**: In real-world facilities management, complaints are diverse (e.g. *"Window latch feels stiff"*, *"Curtain rod loose"*). Attempting to maintain an exhaustive list of all ordinary maintenance terms is impossible. By defining boundaries for extremes (emergency hazards on the top end, trivial cosmetic marks on the bottom end), the vast majority of ordinary functional repairs naturally settle into the standard `MEDIUM` baseline (24-hour turnaround).

---

## 5. Quick-Reference Viva Summary Table

| Concept / Keyword | Meaning in Basic C / Python | Role in `priority_engine.py` |
| :--- | :--- | :--- |
| `PRIORITY_CRITICAL` | String constant (`"CRITICAL"`) | 2-hour SLA tier for immediate physical safety hazards. |
| `PRIORITY_HIGH` | String constant (`"HIGH"`) | 6-hour SLA tier for major utility or security failures. |
| `PRIORITY_MEDIUM` | String constant (`"MEDIUM"`) | 24-hour SLA tier for standard operational maintenance. |
| `PRIORITY_LOW` | String constant (`"LOW"`) | 72-hour SLA tier for minor cosmetic or aesthetic flaws. |
| `CRITICAL_KEYWORDS` | Hash set of hazard terms | Detects fire, sparks, smoke, gas leaks, electric shock. |
| `\b` Regex Boundary | Whole-word delimiter | Prevents false matches like `"paint"` inside `"complaint"`. |
| Short-Circuit Hierarchy | Cascading `if/return` tree | Guarantees life-safety checks execute before cosmetic checks. |
| `hazard_detected: True` | Safety emergency flag | Activates emergency visual alerts and locks SLA to 2 hours. |
| Default `MEDIUM` | Universal fallback state | Classifies standard repairs without requiring exhaustive keyword lists. |
