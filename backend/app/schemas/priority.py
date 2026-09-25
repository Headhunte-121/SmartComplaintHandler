"""
SmartComplaintHandler - Priority & Triage Data Transfer Schemas
Blueprint Reference: V1/M3/backend/03_priority_schemas.md
Role: Pydantic V2 DTOs for priority enums, stateless triage preview, and supervisor override requests.
"""
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict, model_validator


class PriorityEnum(str, Enum):
    """
    Standardized campus complaint priority tiers matching SQLite schema.
    """
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class TriagePreviewRequest(BaseModel):
    """
    Validates draft complaint narrative for stateless pre-submission triage preview.
    """
    title: str = Field(
        ...,
        min_length=5,
        max_length=200,
        description="Short summary of the complaint issue",
        examples=["Sparking switchboard in lab 302"]
    )
    description: str = Field(
        ...,
        min_length=10,
        max_length=2000,
        description="Detailed description of the problem",
        examples=["The main switchboard is emitting loud electrical buzzing and visible sparks."]
    )

    model_config = ConfigDict(str_strip_whitespace=True)


class TriageResult(BaseModel):
    """
    Unified diagnostic triage response schema returned by preview routes.
    """
    priority: PriorityEnum = Field(..., description="Calculated institutional urgency tier")
    suggested_priority: Optional[str] = Field(default=None, description="Alias for priority to support closed-loop suites")
    category: str = Field(..., description="Predicted facility service domain")
    hazard_detected: bool = Field(..., description="True if a life-safety hazard keyword was identified")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Normalized classification confidence score")
    reason: str = Field(..., description="Human-readable explanation of triage determination")
    matched_keywords: List[str] = Field(default_factory=list, description="List of domain or hazard keywords identified")

    @model_validator(mode="after")
    def populate_suggested_priority(self) -> "TriageResult":
        if self.suggested_priority is None and self.priority is not None:
            self.suggested_priority = self.priority.value
        return self


class PriorityOverrideRequest(BaseModel):
    """
    Administrative schema for supervisor priority override adjustments.
    """
    new_priority: PriorityEnum = Field(..., description="The target priority tier assigned by supervisor")
    override_reason: str = Field(
        ...,
        min_length=5,
        max_length=500,
        description="Mandatory institutional justification explaining why the priority was modified",
        examples=["Site inspection revealed isolated wire casing wear, not active fire risk."]
    )

    model_config = ConfigDict(str_strip_whitespace=True)
