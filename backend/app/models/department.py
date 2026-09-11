"""
SmartComplaintHandler - Department ORM Model
Blueprint Reference: V1/M1/backend/04_department_model.md
Role: Operational campus domains (Hostel Maintenance, Electrical, Plumbing, IT Infrastructure).
"""
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=True)

    teams = relationship("MaintenanceTeam", back_populates="department", cascade="all, delete-orphan")
    tickets = relationship("Ticket", back_populates="department")
