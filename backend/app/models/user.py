"""
SmartComplaintHandler - User ORM Model
Role: Manages campus accounts for Students, Facility Admins, Technicians, and Super Admins
      stored in Supabase PostgreSQL (or local SQLite).
Domain: Enforces official @iiitnr.edu.in institutional identity and tracks Google OAuth2/OIDC metadata.
"""
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(50), default="STUDENT", nullable=False)  # STUDENT, ADMIN, SUPER_ADMIN, TECHNICIAN
    department_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    department_id: Mapped[Optional[int]] = mapped_column(ForeignKey("departments.id"), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    auth_provider: Mapped[Optional[str]] = mapped_column(String(50), default="password", nullable=True)  # password, google, both
    google_sub: Mapped[Optional[str]] = mapped_column(String(255), index=True, nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    department = relationship("Department")
