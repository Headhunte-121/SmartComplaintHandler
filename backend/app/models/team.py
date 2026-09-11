"""
SmartComplaintHandler - Maintenance Team ORM Model
Blueprint Reference: V1/M1/backend/05_team_model.md
Role: Maintenance squads linked to departments, tracking active work queues and capacity.
"""
from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class MaintenanceTeam(Base):
    # Physical database table name for field squads
    __tablename__ = "maintenance_teams"

    # Unique team ID
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Squad name (e.g., 'Plumbing Rapid Response 1', 'Substation Squad A')
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    # Foreign key binding squad to its parent department
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), nullable=False)

    # Dynamic counter tracking total unresolved tickets currently assigned to this team
    # Used by M4 Dispatch Engine to execute least-loaded queue load balancing
    active_ticket_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Many-to-1 relationship linking back to parent department
    department = relationship("Department", back_populates="teams")

    # 1-to-Many relationship linking to all work orders assigned to this maintenance squad
    tickets = relationship("Ticket", back_populates="assigned_team")
