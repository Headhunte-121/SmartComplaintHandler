"""
SmartComplaintHandler - SLA & Lifecycle Schemas
Blueprint Reference: V1/M5/backend/03_sla_schemas.md
Role: DTOs for lifecycle status updates, closure documentation, and active breach reporting.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class StatusUpdateRequest(BaseModel):
    status: str

class TicketResolveRequest(BaseModel):
    resolution_notes: str = Field(..., min_length=10)

class SLABreachResponse(BaseModel):
    ticket_id: int
    tracking_code: str
    title: str
    priority: str
    sla_deadline: datetime
    hours_overdue: float
