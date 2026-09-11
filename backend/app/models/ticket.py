"""
SmartComplaintHandler - Ticket ORM Model
Blueprint Reference: V1/M1/backend/06_ticket_model.md
Role: Core closed-loop complaint entity holding tracking codes, priority, SLA deadlines, and audit notes.
"""
from datetime import datetime
from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    tracking_code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str] = mapped_column(String(150), nullable=False)
    priority: Mapped[str] = mapped_column(String(20), default="MEDIUM", nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="SUBMITTED", nullable=False)

    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), nullable=True)
    assigned_team_id: Mapped[int] = mapped_column(ForeignKey("maintenance_teams.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    sla_deadline: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    resolution_notes: Mapped[str] = mapped_column(Text, nullable=True)

    department = relationship("Department", back_populates="tickets")
    assigned_team = relationship("MaintenanceTeam", back_populates="tickets")
