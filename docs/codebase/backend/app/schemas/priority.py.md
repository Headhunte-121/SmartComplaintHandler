# Comprehensive Code Walkthrough & Line-by-Line Guide: `backend/app/schemas/priority.py`

> **File Location**: [`backend/app/schemas/priority.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/backend/app/schemas/priority.py)  
> **Prerequisites**: Basic knowledge of C or Python (enums, classes, strings, floating point numbers, dictionaries). No AI or machine learning background is assumed.  
> **What this file is**: The data contracts for the complaint triage and priority engine. It defines the priority enumeration tiers (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), validates real-time stateless triage previews (`TriagePreviewRequest`), packages diagnostic classification results (`TriageResult`), and validates supervisor manual overrides (`PriorityOverrideRequest`).

---

## Block 1: Imports & `PriorityEnum` Definition (Lines 1–23)

```python
"""
SmartComplaintHandler - Priority & Triage Data Transfer Schemas
Blueprint Reference: V1/M3/backend/03_priority_schemas.md
Role: Pydantic DTOs for priority enums, stateless triage preview, and supervisor override requests.
"""
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

HAS_PYDANTIC_V2 = hasattr(BaseModel, "model_validate")
if HAS_PYDANTIC_V2:
    from pydantic import ConfigDict, model_validator
else:
    from pydantic import root_validator


class PriorityEnum(str, Enum):
    """Standardized campus complaint priority tiers matching database schema."""
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
```

### 1. Plain-English Purpose:
Defines the official 4-tier urgency scale used across IIIT-NR. Using a string-based Python `Enum` guarantees that only these exact 4 strings can be submitted for priority calculations; any other string (like `"URGENT"` or `"SUPER_HIGH"`) is rejected immediately.

### 2. Line-by-Line Breakdown:
- **Lines 1–5**: Docstring referencing Module 3 Blueprint for Priority Schemas.
- **Line 6 (`from enum import Enum`)**: Standard library tool to define enumerations.
- **Line 7 (`from typing import List, Optional`)**: Type hints for keyword arrays and optional values.
- **Line 8 (`from pydantic import BaseModel, Field`)**: Pydantic schema validation base tools.
- **Lines 10–14**: Pydantic v1 vs v2 validator compatibility check.
- **Line 17 (`class PriorityEnum(str, Enum):`)**: Defines an enumeration that inherits from both `str` and `Enum`.
- **Lines 19–22**: Four standardized urgency tiers: `CRITICAL` (P1), `HIGH` (P2), `MEDIUM` (P3), and `LOW` (P4).

### 3. Deep Term & Concept Expansion (For C / Basic Python Readers):
- **What is an Enum in C vs Python?**:
  In C, an `enum` assigns integers to names (`enum Priority { LOW=0, MEDIUM=1, HIGH=2, CRITICAL=3 };`). In Python, inheriting from `(str, Enum)` creates a **String Enum**: the value is simultaneously an Enum member and a native Python string (`PriorityEnum.CRITICAL == "CRITICAL"`). This allows seamless JSON serialization without converting integers back to strings.

---

## Block 2: `TriagePreviewRequest` Schema (Lines 25–48)

```python
class TriagePreviewRequest(BaseModel):
    """Validates draft complaint narrative for stateless pre-submission triage preview."""
    title: str = Field(
        ...,
        min_length=5,
        max_length=200,
        description="Short summary of the complaint issue",
    )
    description: str = Field(
        ...,
        min_length=10,
        max_length=2000,
        description="Detailed description of the problem",
    )
    api_key: Optional[str] = Field(default=None, description="Optional Google Gemini or Groq API key")
    provider: Optional[str] = Field(default=None, description="AI provider ('groq' or 'gemini')")

    if HAS_PYDANTIC_V2:
        model_config = ConfigDict(str_strip_whitespace=True, extra="ignore")
    else:
        class Config:
            anystr_strip_whitespace = True
            extra = "ignore"
```

### 1. Plain-English Purpose:
Data contract for the "Live Triage Preview" card on the complaint submission page. As a student types their problem, the frontend sends draft text to the backend to preview predicted department, priority, and SLA before saving anything to the database.

### 2. Line-by-Line Breakdown:
- **Lines 27–32 (`title`)**: Issue headline (5 to 200 characters).
- **Lines 33–38 (`description`)**: Issue details (10 to 2000 characters).
- **Lines 39–40 (`api_key`, `provider`)**: Optional parameters allowing students or reviewers to test alternative AI models (Groq or Gemini) on-the-fly.
- **Line 43 (`extra="ignore"`)**: Silently discards extra unexpected frontend payload parameters without throwing errors.

---

## Block 3: `TriageResult` Diagnostic Schema (Lines 50–81)

```python
class TriageResult(BaseModel):
    """Unified diagnostic triage response schema returned by preview routes."""
    priority: PriorityEnum = Field(..., description="Calculated institutional urgency tier")
    suggested_priority: Optional[str] = Field(default=None, description="Alias for priority to support closed-loop suites")
    category: str = Field(..., description="Predicted facility service domain")
    department_id: Optional[int] = Field(default=None, description="Department ID 1-6")
    department_name: Optional[str] = Field(default=None, description="Target department name")
    hazard_detected: bool = Field(..., description="True if a life-safety hazard keyword was identified")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Normalized classification confidence score")
    reason: str = Field(..., description="Human-readable explanation of triage determination")
    matched_keywords: List[str] = Field(default_factory=list, description="List of domain or hazard keywords identified")
    sla_hours: Optional[int] = Field(default=None, description="Dynamic SLA duration commitment in hours")
    ai_powered: bool = Field(default=False, description="True if classified by generative AI")
    provider: Optional[str] = Field(default=None, description="Provider used for classification")
    model_used: Optional[str] = Field(default=None, description="Model used for classification (e.g. allam-2-7b)")

    if HAS_PYDANTIC_V2:
        model_config = ConfigDict(extra="ignore")

        @model_validator(mode="after")
        def populate_suggested_priority(self) -> "TriageResult":
            if self.suggested_priority is None and self.priority is not None:
                self.suggested_priority = self.priority.value
            return self
    else:
        @root_validator(pre=False)
        def populate_suggested_priority(cls, values):
            if values.get("suggested_priority") is None and values.get("priority") is not None:
                prio = values["priority"]
                values["suggested_priority"] = prio.value if hasattr(prio, "value") else str(prio)
            return values
```

### 1. Plain-English Purpose:
The diagnostic report returned by the classification engine. It explains *why* the system chose a specific priority (e.g. "Smoke detected in lab"), indicates whether a life-safety hazard was flagged, shows the confidence score ($0.0$ to $1.0$), lists matched keywords, and returns the calculated SLA turnaround hours.

### 2. Line-by-Line Breakdown:
- **Line 52 (`priority: PriorityEnum`)**: Calculated priority tier.
- **Line 53 (`suggested_priority`)**: String alias synchronized via `model_validator` for backward compatibility.
- **Line 54 (`category`)**: Predicted service domain (e.g. `"Electrical"`).
- **Lines 55–56 (`department_id`, `department_name`)**: Target department routing details.
- **Line 57 (`hazard_detected: bool`)**: True if emergency hazard keywords (smoke, spark, fire, gas, electric shock) were found.
- **Line 58 (`confidence: float = Field(..., ge=0.0, le=1.0)`)**: Confidence score strictly bounded between 0% (`0.0`) and 100% (`1.0`).
- **Line 59 (`reason: str`)**: Plain-English explanation generated by the engine.
- **Line 60 (`matched_keywords: List[str] = Field(default_factory=list)`)**: Array of trigger words detected in the complaint text.
- **Line 61 (`sla_hours: Optional[int]`)**: Turnaround commitment (2, 6, 24, or 72 hours).
- **Lines 62–64 (`ai_powered`, `provider`, `model_used`)**: AI classification provenance metadata.
- **Lines 69–73 (`populate_suggested_priority`)**: Model validator that ensures `suggested_priority` matches `priority.value`.

### 3. Deep Term & Concept Expansion:
- **What is `default_factory=list`?**:
  In Python, writing `matched_keywords: List[str] = []` creates a mutable default argument trap where all instances share the exact same list in RAM! `default_factory=list` instructs Pydantic to execute `list()` freshly to create a new, isolated empty list for every result object.

---

## Block 4: `PriorityOverrideRequest` Administrative Schema (Lines 83–97)

```python
class PriorityOverrideRequest(BaseModel):
    """Administrative schema for supervisor priority override adjustments."""
    new_priority: PriorityEnum = Field(..., description="The target priority tier assigned by supervisor")
    override_reason: str = Field(
        ...,
        min_length=5,
        max_length=500,
        description="Mandatory institutional justification explaining why the priority was modified",
    )

    if HAS_PYDANTIC_V2:
        model_config = ConfigDict(str_strip_whitespace=True)
    else:
        class Config:
            anystr_strip_whitespace = True
```

### 1. Plain-English Purpose:
Data contract for department supervisors manually overriding an automated priority decision. Crucially, it forces the supervisor to provide an official institutional justification (`override_reason`, 5 to 500 characters) for audit compliance.

### 2. Line-by-Line Breakdown:
- **Line 83 (`class PriorityOverrideRequest(BaseModel):`)**: Schema class.
- **Line 85 (`new_priority: PriorityEnum`)**: The new target priority (`CRITICAL`, `HIGH`, `MEDIUM`, or `LOW`).
- **Lines 86–91 (`override_reason`)**: Mandatory explanation. Enforcing `min_length=5` prevents supervisors from submitting blank or single-character justifications.

---

## Overall File Viva & Technical Defense Guide

### Top 5 Viva Questions on `backend/app/schemas/priority.py`:

#### Q1: What is the purpose of `schemas/priority.py`?
> **Model Answer**:  
> *"Sir, `schemas/priority.py` defines the data contracts for complaint classification and triage. It establishes the `PriorityEnum` tiers, validates stateless real-time triage requests (`TriagePreviewRequest`), formats diagnostic classification output (`TriageResult`), and enforces mandatory justification on manual supervisor overrides (`PriorityOverrideRequest`)."*

#### Q2: Why is `PriorityEnum` defined as `(str, Enum)`?
> **Model Answer**:  
> *"Sir, inheriting from both `str` and `Enum` creates a string-based enumeration. This ensures that Pydantic validates inputs against strict enum constants while allowing direct JSON serialization as standard strings without manual type casting."*

#### Q3: What is the purpose of `TriagePreviewRequest`?
> **Model Answer**:  
> *"Sir, it supports the interactive 'Live Triage Preview' card on the student complaint submission page. As a student types their issue, the frontend sends draft text to test the classification rules without inserting any uncommitted records into the database."*

#### Q4: Why does `PriorityOverrideRequest` mandate `min_length=5` on `override_reason`?
> **Model Answer**:  
> *"Sir, in campus governance, overriding an automated SLA deadline is an audited administrative action. Requiring a minimum of 5 characters prevents supervisors from bypassing accountability with blank or meaningless explanations (like '.' or 'ok')."*

#### Q5: How is `confidence` constrained in `TriageResult`?
> **Model Answer**:  
> *"Sir, line 58 uses `Field(..., ge=0.0, le=1.0)`. This enforces that the classification confidence score is normalized as a mathematical probability between 0.0 (0% confidence) and 1.0 (100% confidence). Any value outside this range raises a validation error."*

---

## Quick Viva Summary Table

| Schema Class | Direction | Purpose | Key Validations |
| :--- | :--- | :--- | :--- |
| **`PriorityEnum`** | Type Enum | Urgency tiers matching database | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| **`TriagePreviewRequest`**| Incoming (Request) | Validates draft text for live preview | Title (5–200), Desc (10–2000), optional AI key |
| **`TriageResult`** | Outgoing (Response)| Diagnostic classification report | Confidence (0.0 to 1.0), hazard flag, SLA hours |
| **`PriorityOverrideRequest`**| Incoming (Request)| Audited supervisor priority change | New priority enum, justification (5–500 chars) |
