"""
SmartComplaintHandler - Complaint Validation Schemas
Blueprint Reference: V1/M2/backend/03_complaint_schemas.md
Role: Pydantic V2 DTOs for complaint intake (ComplaintCreate) and response serialization.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

# Data Transfer Object (DTO) for validating student complaint submission payloads
class ComplaintCreate(BaseModel):
    # Enforces minimum 5 characters to avoid empty/gibberish titles, capped at 150 characters
    title: str = Field(..., min_length=5, max_length=150, description="Brief summary of the physical issue")
    
    # Enforces minimum 10 characters so students provide sufficient detail for classification
    description: str = Field(..., min_length=10, description="Detailed explanation of the defect or emergency")
    
    # Campus building or room identification string
    location: str = Field(..., min_length=3, description="Specific campus location (Hostel, Room, Lab)")

# Response model for serialized complaint records returned by the API
class ComplaintResponse(BaseModel):
    id: int                                    # Unique internal database record ID
    tracking_code: str                         # Public CSPRNG tracking code (e.g., TICK-8F2D)
    title: str                                 # Complaint title
    description: str                           # Detailed grievance text
    location: str                              # Physical location string
    priority: str                              # Urgency level (CRITICAL, HIGH, MEDIUM, LOW)
    status: str                                # Current lifecycle status (SUBMITTED, IN_PROGRESS, RESOLVED)
    department_name: Optional[str] = None      # Name of assigned department (or None if unassigned)
    assigned_team_name: Optional[str] = None   # Name of assigned maintenance squad
    sla_deadline: Optional[datetime] = None    # Target resolution deadline
    created_at: datetime                       # Intake timestamp in UTC

    class Config:
        # Enables automatic conversion from SQLAlchemy ORM models to Pydantic JSON schemas
        from_attributes = True
