"""
SmartComplaintHandler - SLA & Lifecycle Schemas
Blueprint Reference: V1/M5/backend/03_sla_schemas.md
Role: DTOs for lifecycle status updates, closure documentation, and active breach reporting.
"""
from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

HAS_PYDANTIC_V2 = hasattr(BaseModel, "model_validate")
if HAS_PYDANTIC_V2:
    from pydantic import ConfigDict, field_serializer
else:
    from pydantic import root_validator


class TicketStatusEnum(str, Enum):
    """Enumeration of all valid ticket lifecycle states."""
    SUBMITTED = "SUBMITTED"
    IN_PROGRESS = "IN_PROGRESS"
    ESCALATED = "ESCALATED"
    ON_HOLD = "ON_HOLD"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"


class StatusUpdateRequest(BaseModel):
    """Request schema for generic ticket lifecycle status transitions."""
    status: TicketStatusEnum = Field(..., description="Target lifecycle status")
    notes: Optional[str] = Field(None, max_length=1000, description="Optional transition remarks or rationale")
    actor: str = Field("Staff", max_length=100, description="Name or identifier of the operator")


class TicketResolveRequest(BaseModel):
    """Request schema for ticket resolution and formal work closure."""
    resolution_notes: str = Field(
        ...,
        min_length=10,
        max_length=2000,
        description="Mandatory substantive explanation of repair performed (minimum 10 characters)",
    )
    parts_replaced: Optional[str] = Field(
        None,
        max_length=500,
        description="Optional list or summary of replacement components consumed",
    )
    technician_name: Optional[str] = Field(
        None,
        max_length=150,
        description="Optional name of field worker who completed the repair",
    )


class EscalationRequest(BaseModel):
    """Request schema for supervisory escalation of stagnant or high-risk complaints."""
    escalation_reason: str = Field(
        ...,
        min_length=5,
        max_length=1000,
        description="Mandatory justification for supervisory escalation (minimum 5 characters)",
    )
    supervisor_id: Optional[str] = Field(
        None,
        max_length=100,
        description="Optional supervisor or manager identifier",
    )


class SLABreachResponse(BaseModel):
    """DTO for reporting overdue and near-breach tickets to supervisory dashboards."""
    ticket_id: int
    tracking_code: str
    title: str
    location: Optional[str] = None
    department_name: Optional[str] = None
    assigned_team_name: Optional[str] = None
    priority: str
    sla_deadline: datetime
    remaining_seconds: int
    overdue_seconds: int
    is_breached: bool
    status: str

    if HAS_PYDANTIC_V2:
        model_config = ConfigDict(from_attributes=True)

        @field_serializer("sla_deadline", when_used="json-unless-none")
        def _serialize_sla_deadline_utc(self, dt: Optional[datetime]) -> Optional[str]:
            if dt is None:
                return None
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            else:
                dt = dt.astimezone(timezone.utc)
            return dt.isoformat()
    else:
        class Config:
            orm_mode = True

        @classmethod
        def model_validate(cls, obj):
            if isinstance(obj, dict):
                return cls(**obj)
            return cls.from_orm(obj)


class TicketLifecycleResponse(BaseModel):
    """DTO returned following status modifications and ticket closures."""
    id: int
    tracking_code: str
    status: str
    new_status: Optional[str] = None
    resolved: Optional[bool] = None
    priority: str
    sla_deadline: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None

    if HAS_PYDANTIC_V2:
        model_config = ConfigDict(from_attributes=True)

        def model_post_init(self, __context):
            if self.new_status is None:
                self.new_status = self.status
            if self.resolved is None:
                self.resolved = self.status == "RESOLVED"
    else:
        class Config:
            orm_mode = True

        @root_validator(pre=False)
        def _populate_lifecycle_fields(cls, values):
            if values.get("new_status") is None and values.get("status") is not None:
                values["new_status"] = values["status"]
            if values.get("resolved") is None and values.get("status") is not None:
                values["resolved"] = values["status"] == "RESOLVED"
            return values

        @classmethod
        def model_validate(cls, obj):
            if isinstance(obj, dict):
                return cls(**obj)
            return cls.from_orm(obj)
