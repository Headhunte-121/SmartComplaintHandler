"""
SmartComplaintHandler - User Authentication & Administration Service
Role: Industry-standard authentication: password hashing via bcrypt, persistent 30-day JWT sessions,
      registration for @iiitnr.edu.in users, student roll parsing, and administrative operations.
"""
import re
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.ticket import Ticket
from app.models.team import MaintenanceTeam
from app.schemas.user import (
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    AdminCreateRequest,
    UserResponse,
    IIITNR_DOMAIN,
)
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    REMEMBER_ME_EXPIRE_DAYS,
)

STUDENT_PATTERN = re.compile(r"^([a-zA-Z]+)(\d{2})(\d{2,4})@iiitnr\.edu\.in$", re.IGNORECASE)


def resolve_user_metadata(email: str) -> Dict[str, str]:
    """Auto-detect user role, name, department and student roll from email."""
    clean_email = email.strip().lower()
    prefix = clean_email.split("@")[0].lower()

    if prefix in ("superadmin", "director", "super.admin"):
        return {
            "name": "Chief Campus Administrator",
            "role": "SUPER_ADMIN",
            "department_name": "Office of the Director",
            "identifier": "Super Admin (DIR-01)",
        }
    if prefix in ("admin", "estate", "facilities", "supervisor", "estate.admin", "estate_admin"):
        return {
            "name": "Estate & Facilities Supervisor",
            "role": "ADMIN",
            "department_name": "Central Facilities Management",
            "identifier": "Supervisor (FAC-01)",
        }
    if prefix.startswith("tech.") or "technician" in prefix:
        return {
            "name": prefix.replace("tech.", "").replace(".", " ").title(),
            "role": "TECHNICIAN",
            "department_name": "Electrical",
            "identifier": "Field Technician",
        }

    # Student pattern: e.g. nikhil26100@iiitnr.edu.in
    match = STUDENT_PATTERN.match(clean_email)
    if match:
        raw_name = match.group(1).title()
        year = match.group(2)
        roll = match.group(3)
        roll_no = f"20{year}BCS{roll.zfill(3)}"
        return {
            "name": raw_name,
            "role": "STUDENT",
            "department_name": "Computer Science & Engineering",
            "identifier": f"Roll: {roll_no} (Batch '20{year})",
        }

    # Fallback student format
    clean_name = prefix.replace(".", " ").replace("_", " ").title()
    return {
        "name": clean_name,
        "role": "STUDENT",
        "department_name": "IIIT Naya Raipur",
        "identifier": f"Student ID: {prefix.upper()}",
    }


def to_user_response(user: User) -> UserResponse:
    """Format ORM User model into UserResponse with roll parsing."""
    meta = resolve_user_metadata(user.email)
    identifier = meta.get("identifier")
    if user.role != "STUDENT":
        identifier = f"Staff ID: #{user.id}" if user.id else meta.get("identifier")

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        department_name=user.department_name or meta.get("department_name"),
        department_id=user.department_id,
        identifier=identifier,
        phone=user.phone,
        is_active=user.is_active,
        created_at=user.created_at,
    )


def register_user(req: RegisterRequest, db: Session) -> AuthResponse:
    """Register a new student, faculty, or staff account with bcrypt password hashing."""
    clean_email = req.email.strip().lower()
    if not clean_email.endswith(f"@{IIITNR_DOMAIN}"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration is restricted to official @{IIITNR_DOMAIN} emails."
        )

    existing = db.query(User).filter(User.email.ilike(clean_email)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An account with email '{clean_email}' already exists. Please log in instead."
        )

    meta = resolve_user_metadata(clean_email)
    hashed_pw = hash_password(req.password)

    new_user = User(
        name=req.name.strip(),
        email=clean_email,
        hashed_password=hashed_pw,
        role=meta["role"],
        department_name=req.department_name or meta["department_name"],
        phone=req.phone.strip() if req.phone else None,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Issue JWT Token (30 days if remember_me else 1 day)
    expires_in_days = REMEMBER_ME_EXPIRE_DAYS if req.remember_me else 1
    token = create_access_token(
        data={"sub": new_user.email, "role": new_user.role, "id": new_user.id},
        expires_delta=timedelta(days=expires_in_days)
    )

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        expires_in_days=expires_in_days,
        user=to_user_response(new_user)
    )


def authenticate_iiitnr_user(req: LoginRequest, db: Session) -> AuthResponse:
    """
    Authenticate an institutional user via bcrypt password check and issue JWT.
    Supports persistent 30-day Remember Me token.
    """
    clean_email = req.email.strip().lower()
    if not clean_email.endswith(f"@{IIITNR_DOMAIN}"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Access restricted. Only institutional @{IIITNR_DOMAIN} emails are permitted."
        )

    # Find user in database
    db_user = db.query(User).filter(User.email.ilike(clean_email)).first()

    if db_user:
        if not db_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This institutional account has been deactivated by the Super Administrator."
            )
        # Check password
        if db_user.hashed_password:
            if not verify_password(req.password, db_user.hashed_password):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid institutional email or password."
                )
        else:
            # Upgrade initial unhashed/seeded account to secure bcrypt hash
            db_user.hashed_password = hash_password(req.password)
            db.commit()
            db.refresh(db_user)
    else:
        # Auto-provision authentic IIIT-NR user with hashed password
        meta = resolve_user_metadata(clean_email)
        db_user = User(
            name=meta["name"],
            email=clean_email,
            hashed_password=hash_password(req.password),
            role=meta["role"],
            department_name=meta["department_name"],
            is_active=True,
        )
        try:
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
        except Exception:
            db.rollback()
            db_user = db.query(User).filter(User.email.ilike(clean_email)).first()

    # Generate JWT Token (30 days if remember_me else 1 day)
    expires_in_days = REMEMBER_ME_EXPIRE_DAYS if req.remember_me else 1
    token = create_access_token(
        data={"sub": db_user.email, "role": db_user.role, "id": db_user.id},
        expires_delta=timedelta(days=expires_in_days)
    )

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        expires_in_days=expires_in_days,
        user=to_user_response(db_user)
    )


def get_current_user_from_token(token: str, db: Session) -> UserResponse:
    """Validate Bearer JWT token and fetch active user profile."""
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or token is invalid. Please log in again."
        )

    email = payload["sub"]
    user = db.query(User).filter(User.email.ilike(email)).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or deactivated."
        )

    return to_user_response(user)


def list_administrative_users(db: Session) -> List[User]:
    """Retrieve all staff, facility admins, technicians, and super admins."""
    return db.query(User).filter(User.role.in_(["ADMIN", "SUPER_ADMIN", "TECHNICIAN"])).order_by(User.id.asc()).all()


def add_admin_user(admin_data: AdminCreateRequest, db: Session) -> User:
    """Create a new facility admin or technician with bcrypt password hashing."""
    clean_email = admin_data.email.strip().lower()
    existing = db.query(User).filter(User.email.ilike(clean_email)).first()
    raw_password = admin_data.password or "IIITNR@2026"
    hashed_pw = hash_password(raw_password)

    if existing:
        existing.name = admin_data.name.strip()
        existing.role = admin_data.role.strip().upper()
        existing.department_name = admin_data.department_name
        existing.phone = admin_data.phone
        existing.hashed_password = hashed_pw
        existing.is_active = True
        db.commit()
        db.refresh(existing)
        return existing

    new_user = User(
        name=admin_data.name.strip(),
        email=clean_email,
        hashed_password=hashed_pw,
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
    """Purge all ticket complaints from database (Super Admin capability)."""
    count = db.query(Ticket).delete()
    teams = db.query(MaintenanceTeam).all()
    for t in teams:
        t.active_ticket_count = 0
    db.commit()
    return count
