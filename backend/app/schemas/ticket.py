"""
SmartComplaintHandler - Ticket Validation Schemas
Blueprint Reference: V1/M2/backend/03_ticket_schemas.md & V1/M3/backend/04_service_integration.md
Role: Pydantic DTOs for complaint intake (TicketCreate) and response serialization (TicketResponse).
"""
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field

HAS_PYDANTIC_V2 = hasattr(BaseModel, "model_validate")
if HAS_PYDANTIC_V2:
    from pydantic import ConfigDict, field_serializer
else:
    from pydantic import root_validator


class TicketCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200, description="Brief summary of the physical issue")
    description: str = Field(..., min_length=10, max_length=2000, description="Detailed explanation of the defect or maintenance issue")
    location: str = Field(..., min_length=3, max_length=150, description="Specific campus location (Hostel, Room, Lab)")
    student_name: Optional[str] = Field(None, max_length=150, description="Student submitter name")
    student_email: Optional[str] = Field(None, max_length=150, description="Student university email")

    if HAS_PYDANTIC_V2:
        model_config = ConfigDict(str_strip_whitespace=True)
    else:
        class Config:
            anystr_strip_whitespace = True


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

    if HAS_PYDANTIC_V2:
        model_config = ConfigDict(from_attributes=True)

        @field_serializer("created_at", "sla_deadline", "target_resolution_date", "resolved_at", "feedback_submitted_at", when_used="json-unless-none")
        def _serialize_datetime_utc(self, dt: Optional[datetime]) -> Optional[str]:
            if dt is None:
                return None
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            else:
                dt = dt.astimezone(timezone.utc)
            return dt.isoformat()

        def model_post_init(self, __context):
            if self.target_resolution_date is None and self.sla_deadline is not None:
                self.target_resolution_date = self.sla_deadline
            elif self.sla_deadline is None and self.target_resolution_date is not None:
                self.sla_deadline = self.target_resolution_date
    else:
        class Config:
            orm_mode = True

        @root_validator(pre=False)
        def _sync_deadline_aliases(cls, values):
            if values.get("target_resolution_date") is None and values.get("sla_deadline") is not None:
                values["target_resolution_date"] = values["sla_deadline"]
            elif values.get("sla_deadline") is None and values.get("target_resolution_date") is not None:
                values["sla_deadline"] = values["target_resolution_date"]
            return values

        @classmethod
        def model_validate(cls, obj):
            if isinstance(obj, dict):
                return cls(**obj)
            return cls.from_orm(obj)


class FeedbackSubmitRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Student satisfaction rating from 1 (poor) to 5 (excellent)")
    comments: Optional[str] = Field(None, max_length=1000, description="Student feedback remarks or satisfaction notes")
    student_name: Optional[str] = Field(None, max_length=150, description="Student submitter identity")


class TicketDirectUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200, description="Updated ticket headline")
    description: Optional[str] = Field(None, min_length=5, max_length=2000, description="Updated defect details")
    location: Optional[str] = Field(None, min_length=2, max_length=150, description="Updated campus room or facility location")
    priority: Optional[str] = Field(None, max_length=20, description="Updated priority (LOW, MEDIUM, HIGH, CRITICAL)")
    status: Optional[str] = Field(None, max_length=30, description="Updated lifecycle status")
    department_id: Optional[int] = Field(None, description="Department ID")
    department_name: Optional[str] = Field(None, description="Department Name string")
    assigned_team_id: Optional[int] = Field(None, description="Assigned Squad ID")
    resolution_notes: Optional[str] = Field(None, description="Supervisory or repair resolution notes")

    if HAS_PYDANTIC_V2:
        model_config = ConfigDict(str_strip_whitespace=True)
    else:
        class Config:
            anystr_strip_whitespace = True


ComplaintCreate = TicketCreate
ComplaintResponse = TicketResponse
FeedbackCreate = FeedbackSubmitRequest
TicketUpdate = TicketDirectUpdateRequest
