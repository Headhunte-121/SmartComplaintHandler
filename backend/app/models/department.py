"""
SmartComplaintHandler - Department ORM Model
Blueprint Reference: V1/M1/backend/04_department_model.md
Role: Operational campus domains (Hostel Maintenance, Electrical, Plumbing, IT Infrastructure).
"""
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class Department(Base):
    # Physical database table name
    __tablename__ = "departments"

    # Unique sequential primary key identifier
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Formal operational division name (e.g., 'Electrical Services', 'Plumbing')
    # unique=True prevents duplicate department registration
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)

    # Optional description of the department's operational scope
    description: Mapped[str] = mapped_column(String(255), nullable=True)

    # 1-to-Many relationship: One department manages multiple specialized maintenance teams
    # cascade='all, delete-orphan' ensures teams are cleaned up if a department is retired
    teams = relationship("MaintenanceTeam", back_populates="department", cascade="all, delete-orphan")

    # 1-to-Many relationship: One department is assigned multiple student grievance tickets
    tickets = relationship("Ticket", back_populates="department")
