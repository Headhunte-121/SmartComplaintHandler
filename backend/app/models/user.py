"""
SmartComplaintHandler - User ORM Model
Role: Manages campus accounts for Students, Facility Admins, Technicians, and Super Admins.
Domain: Enforces official @iiitnr.edu.in institutional identity.
"""
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="STUDENT", nullable=False) # STUDENT, ADMIN, SUPER_ADMIN, TECHNICIAN
    department_name: Mapped[str] = mapped_column(String(100), nullable=True)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), nullable=True)
    phone: Mapped[str] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    department = relationship("Department")
