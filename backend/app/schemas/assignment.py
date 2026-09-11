"""
SmartComplaintHandler - Assignment & Workload Schemas
Blueprint Reference: V1/M4/backend/02_assignment_schemas.md
Role: DTOs for squad workload metrics and supervisor team reassignment.
"""
from pydantic import BaseModel, Field

class TeamWorkloadResponse(BaseModel):
    team_id: int
    team_name: str
    department_name: str
    active_ticket_count: int

class ReassignTeamRequest(BaseModel):
    team_id: int
    reason: str = Field(..., min_length=5)
