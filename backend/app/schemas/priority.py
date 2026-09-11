"""
SmartComplaintHandler - Priority & Triage Schemas
Blueprint Reference: V1/M3/backend/03_priority_schemas.md
Role: DTOs for live debounced triage preview and supervisor priority override requests.
"""
from pydantic import BaseModel, Field

class TriagePreviewRequest(BaseModel):
    title: str
    description: str

class TriagePreviewResponse(BaseModel):
    suggested_priority: str
    detected_department: str
    confidence_score: float

class PriorityOverrideRequest(BaseModel):
    priority: str
    reason: str = Field(..., min_length=5)
