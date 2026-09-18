"""
SmartComplaintHandler - Database Base Re-export
Blueprint Reference: V1/M1/backend/03_declarative_base.md
Role: Re-exports Declarative Base for migrations and engine metadata.
"""
from app.models.base import Base
from app.models.department import Department
from app.models.team import MaintenanceTeam
from app.models.ticket import Ticket
