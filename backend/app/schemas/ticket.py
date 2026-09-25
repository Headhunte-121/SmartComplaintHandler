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
    created_at: datetime
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# Schema aliases for cross-module compatibility
ComplaintCreate = TicketCreate
ComplaintResponse = TicketResponse
