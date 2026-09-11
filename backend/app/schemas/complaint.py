"""
SmartComplaintHandler - Complaint Validation Schemas
Blueprint Reference: V1/M2/backend/03_complaint_schemas.md
Role: Pydantic V2 DTOs for complaint intake (ComplaintCreate) and response serialization.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class ComplaintCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=150)
    description: str = Field(..., min_length=10)
    location: str = Field(..., min_length=3)

class ComplaintResponse(BaseModel):
    id: int
    tracking_code: str
    title: str
    description: str
    location: str
    priority: str
    status: str
    department_name: Optional[str] = None
    assigned_team_name: Optional[str] = None
    sla_deadline: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
