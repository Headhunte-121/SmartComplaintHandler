"""
SmartComplaintHandler - Ticket ORM Model
Blueprint Reference: V1/M1/backend/06_ticket_model.md
Role: Core closed-loop complaint entity holding tracking codes, priority, SLA deadlines, and audit notes.
"""
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, ForeignKey, Integer
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
    status: Mapped[str] = mapped_column(String(30), default="SUBMITTED", index=True, nullable=False)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), index=True, nullable=True)
    assigned_team_id: Mapped[int] = mapped_column(ForeignKey("maintenance_teams.id"), index=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True, nullable=False)
    sla_deadline: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    resolved_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    resolution_notes: Mapped[str] = mapped_column(Text, nullable=True)

    student_name: Mapped[str] = mapped_column(String(150), nullable=True, default="Aarav Sharma")
    student_email: Mapped[str] = mapped_column(String(150), index=True, nullable=True, default="aarav.sharma@campus.edu")
    feedback_rating: Mapped[int] = mapped_column(Integer, nullable=True)
    feedback_comments: Mapped[str] = mapped_column(Text, nullable=True)
    feedback_submitted_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    department = relationship("Department", back_populates="tickets")
    assigned_team = relationship("MaintenanceTeam", back_populates="tickets")
