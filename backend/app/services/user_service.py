"""
SmartComplaintHandler - User Authentication & Administration Service
Role: Resolves role-based access for @iiitnr.edu.in accounts, parses student rolls,
      manages facility admins, and executes super admin administrative actions.
"""
import re
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.ticket import Ticket
from app.models.team import MaintenanceTeam
from app.schemas.user import AdminCreateRequest, UserResponse, IIITNR_DOMAIN

STUDENT_PATTERN = re.compile(r"^([a-zA-Z]+)(\d{2})(\d{2,4})@iiitnr\.edu\.in$", re.IGNORECASE)

def authenticate_iiitnr_user(email: str, db: Session) -> UserResponse:
    """
    Authenticate an institutional user from @iiitnr.edu.in.
    1. Checks if user is explicitly registered in SQLite (Super Admin, Admins, Staff).
    2. Recognizes institutional administrative handles (superadmin@, admin@, etc.).
    3. Parses student enrollment handles (e.g. nikhil26100@iiitnr.edu.in).
    """
    clean_email = email.strip().lower()
    if not clean_email.endswith(f"@{IIITNR_DOMAIN}"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Access restricted. Only institutional @{IIITNR_DOMAIN} emails are permitted."
        )

    # 1. Check if user is in SQLite database
    db_user = db.query(User).filter(User.email.ilike(clean_email)).first()
    if db_user:
        if not db_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This institutional account has been deactivated by the Super Administrator."
            )
        return UserResponse(
            id=db_user.id,
            name=db_user.name,
            email=db_user.email,
            role=db_user.role,
            department_name=db_user.department_name or "General Administration",
            department_id=db_user.department_id,
            identifier=f"Staff ID: #{db_user.id}" if db_user.role != "STUDENT" else "Student",
            phone=db_user.phone,
            is_active=db_user.is_active,
            created_at=db_user.created_at,
        )

    # 2. Check administrative email prefixes
    prefix = clean_email.split("@")[0].lower()
    if prefix in ("superadmin", "director", "super.admin"):
        # Auto-create or return Super Admin
        super_user = User(
            name="Chief Campus Administrator",
            email=clean_email,
            role="SUPER_ADMIN",
            department_name="Office of the Director",
            is_active=True,
        )
        try:
            db.add(super_user)
            db.commit()
            db.refresh(super_user)
            return UserResponse(
                id=super_user.id,
                name=super_user.name,
                email=super_user.email,
                role="SUPER_ADMIN",
                department_name="Office of the Director",
                identifier="Super Admin (DIR-01)",
                is_active=True,
                created_at=super_user.created_at,
            )
        except Exception:
            db.rollback()
            return UserResponse(
                name="Chief Campus Administrator",
                email=clean_email,
                role="SUPER_ADMIN",
                department_name="Office of the Director",
                identifier="Super Admin (DIR-01)",
                is_active=True,
            )

    if prefix in ("admin", "estate", "facilities", "supervisor", "estate.admin", "estate_admin"):
        admin_user = User(
            name="Estate & Facilities Supervisor",
            email=clean_email,
            role="ADMIN",
            department_name="Central Facilities Management",
            is_active=True,
        )
        try:
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            return UserResponse(
                id=admin_user.id,
                name=admin_user.name,
                email=admin_user.email,
                role="ADMIN",
                department_name="Central Facilities Management",
                identifier="Supervisor (FAC-01)",
                is_active=True,
                created_at=admin_user.created_at,
            )
        except Exception:
            db.rollback()
            return UserResponse(
                name="Estate & Facilities Supervisor",
                email=clean_email,
                role="ADMIN",
                department_name="Central Facilities Management",
                identifier="Supervisor (FAC-01)",
                is_active=True,
            )

    # 3. Student pattern check: name(year)(roll)@iiitnr.edu.in (e.g. nikhil26100@iiitnr.edu.in)
    match = STUDENT_PATTERN.match(clean_email)
    if match:
        raw_name = match.group(1).title()
        year = match.group(2)
        roll = match.group(3)
        roll_no = f"20{year}BCS{roll.zfill(3)}"
        return UserResponse(
            name=raw_name,
            email=clean_email,
            role="STUDENT",
            department_name="Computer Science & Engineering",
            identifier=f"Roll: {roll_no} (Batch '20{year})",
            is_active=True,
        )

    # 4. General student fallback for any valid @iiitnr.edu.in address
    clean_name = prefix.replace(".", " ").replace("_", " ").title()
    return UserResponse(
        name=clean_name,
        email=clean_email,
        role="STUDENT",
        department_name="IIIT Naya Raipur",
        identifier=f"Student ID: {prefix.upper()}",
        is_active=True,
    )


def list_administrative_users(db: Session) -> List[User]:
    """Retrieve all staff, facility admins, technicians, and super admins."""
    return db.query(User).filter(User.role.in_(["ADMIN", "SUPER_ADMIN", "TECHNICIAN"])).order_by(User.id.asc()).all()


def add_admin_user(admin_data: AdminCreateRequest, db: Session) -> User:
    """Create a new facility admin or technician under Super Admin authority."""
    existing = db.query(User).filter(User.email.ilike(admin_data.email.strip())).first()
    if existing:
        existing.name = admin_data.name.strip()
        existing.role = admin_data.role.strip().upper()
        existing.department_name = admin_data.department_name
        existing.phone = admin_data.phone
        existing.is_active = True
        db.commit()
        db.refresh(existing)
        return existing

    new_user = User(
        name=admin_data.name.strip(),
        email=admin_data.email.strip().lower(),
        role=admin_data.role.strip().upper(),
        department_name=admin_data.department_name or "General Administration",
        department_id=admin_data.department_id,
        phone=admin_data.phone,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def delete_admin_user(user_id: int, db: Session) -> bool:
    """Deactivate or remove a staff admin account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False
    if user.role == "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the root Super Administrator account."
        )
    db.delete(user)
    db.commit()
    return True


def purge_all_tickets(db: Session) -> int:
    """Purge all ticket complaints from SQLite (Super Admin capability)."""
    count = db.query(Ticket).delete()
    # Reset team ticket counts
    teams = db.query(MaintenanceTeam).all()
    for t in teams:
        t.active_ticket_count = 0
    db.commit()
    return count
