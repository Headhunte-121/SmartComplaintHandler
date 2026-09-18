"""
SmartComplaintHandler - Maintenance Team ORM Model
Blueprint Reference: V1/M1/backend/05_team_model.md
Role: Maintenance squads linked to departments, tracking active work queues and capacity.
"""
from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class MaintenanceTeam(Base):
    __tablename__ = "maintenance_teams"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), nullable=False)
    active_ticket_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    department = relationship("Department", back_populates="teams")
    tickets = relationship("Ticket", back_populates="assigned_team")
