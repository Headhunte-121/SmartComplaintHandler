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
    # Physical SQLite table name in the database
    __tablename__ = "tickets"

    # Primary key: auto-incrementing integer identifier
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Public tracking code (format: TICK-XXXX), indexed and unique for fast O(1) student lookups
    tracking_code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)

    # Brief title describing the issue (e.g., 'Water leakage in corridor')
    title: Mapped[str] = mapped_column(String(200), nullable=False)

    # Complete text grievance submitted by the student
    description: Mapped[str] = mapped_column(Text, nullable=False)

    # Campus location string (e.g., 'Hostel B, Room 204')
    location: Mapped[str] = mapped_column(String(150), nullable=False)

    # Urgency priority tier: CRITICAL, HIGH, MEDIUM, or LOW
    priority: Mapped[str] = mapped_column(String(20), default="MEDIUM", nullable=False)

    # Lifecycle state machine status: SUBMITTED -> IN_PROGRESS -> RESOLVED
    status: Mapped[str] = mapped_column(String(30), default="SUBMITTED", nullable=False)

    # Foreign key referencing the responsible campus department (Plumbing, Electrical, etc.)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), nullable=True)

    # Foreign key referencing the assigned maintenance squad
    assigned_team_id: Mapped[int] = mapped_column(ForeignKey("maintenance_teams.id"), nullable=True)

    # UTC timestamp of initial grievance intake
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Calculated contractual resolution deadline based on SLA priority commitment
    sla_deadline: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    # Mandatory repair documentation and audit trail recorded upon ticket resolution
    resolution_notes: Mapped[str] = mapped_column(Text, nullable=True)

    # ORM relationships linking to Department and MaintenanceTeam entity models
    department = relationship("Department", back_populates="tickets")
    assigned_team = relationship("MaintenanceTeam", back_populates="tickets")
