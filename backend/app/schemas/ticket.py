"""
SmartComplaintHandler - Ticket Validation Schemas
Blueprint Reference: V1/M2/backend/03_ticket_schemas.md & V1/M3/backend/04_service_integration.md
Role: Pydantic V2 DTOs for complaint intake (TicketCreate) and response serialization (TicketResponse).
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class TicketCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200, description="Brief summary of the physical issue")
    description: str = Field(..., min_length=10, max_length=2000, description="Detailed explanation of the defect or emergency")
    location: str = Field(..., min_length=3, max_length=150, description="Specific campus location (Hostel, Room, Lab)")
    student_name: Optional[str] = Field(None, max_length=150, description="Student submitter name")
    student_email: Optional[str] = Field(None, max_length=150, description="Student university email")

    model_config = ConfigDict(str_strip_whitespace=True)


class TicketResponse(BaseModel):
    id: int
    tracking_code: str
    title: str
    description: str
    location: str
    priority: str
    status: str
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    assigned_team_id: Optional[int] = None
    assigned_team_name: Optional[str] = None
    sla_deadline: Optional[datetime] = None
    target_resolution_date: Optional[datetime] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    feedback_rating: Optional[int] = None
    feedback_comments: Optional[str] = None
    feedback_submitted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

    def model_post_init(self, __context):
        if self.target_resolution_date is None and self.sla_deadline is not None:
            self.target_resolution_date = self.sla_deadline
        elif self.sla_deadline is None and self.target_resolution_date is not None:
            self.sla_deadline = self.target_resolution_date


class FeedbackSubmitRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Student satisfaction rating from 1 (poor) to 5 (excellent)")
    comments: Optional[str] = Field(None, max_length=1000, description="Student feedback remarks or satisfaction notes")
    student_name: Optional[str] = Field(None, max_length=150, description="Student submitter identity")


# Schema aliases for cross-module compatibility
ComplaintCreate = TicketCreate
ComplaintResponse = TicketResponse
FeedbackCreate = FeedbackSubmitRequest

