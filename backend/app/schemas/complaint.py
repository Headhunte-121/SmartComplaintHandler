"""
SmartComplaintHandler - Complaint Validation Schemas
Blueprint Reference: V1/M2/backend/03_complaint_schemas.md
Role: Re-exports ComplaintCreate and ComplaintResponse from ticket schemas.
"""
from app.schemas.ticket import (
    ComplaintCreate,
    ComplaintResponse,
    TicketCreate,
    TicketResponse,
)

__all__ = ["ComplaintCreate", "ComplaintResponse", "TicketCreate", "TicketResponse"]
