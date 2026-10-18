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
    ai_powered: bool = Field(default=False, description="True if classified by generative AI")
    provider: Optional[str] = Field(default=None, description="Provider used for classification")
    model_used: Optional[str] = Field(default=None, description="Model used for classification (e.g. allam-2-7b)")
    cached: bool = Field(default=False, description="True if retrieved from application LRU cache")

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
