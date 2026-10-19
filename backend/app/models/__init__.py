"""
SmartComplaintHandler - Models Package Aggregator & Domain Facade
Blueprint Reference: V1/M1/backend/07_models_init.md
Role: Exposes all ORM entities and registers schemas into Base.metadata.
"""
from app.models.department import Department
from app.models.team import Team, MaintenanceTeam
from app.models.ticket import Ticket
from app.models.user import User
from app.models.campus import CampusBuilding, CampusRoad

__all__ = [
    "Department",
    "Team",
    "MaintenanceTeam",
    "Ticket",
    "User",
    "CampusBuilding",
    "CampusRoad",
]
