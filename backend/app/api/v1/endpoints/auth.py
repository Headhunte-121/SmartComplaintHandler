"""
SmartComplaintHandler - Authentication & Super Admin Endpoints
Role: Institutional login for @iiitnr.edu.in, role resolution, admin management, and database maintenance.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.user import LoginRequest, UserResponse, AdminCreateRequest
from app.services.user_service import (
    authenticate_iiitnr_user,
    list_administrative_users,
    add_admin_user,
    delete_admin_user,
    purge_all_tickets,
)

router = APIRouter()

@router.post("/login", response_model=UserResponse, summary="Institutional @iiitnr.edu.in Login")
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> UserResponse:
    """
    Authenticate an official IIIT-NR user.
    Auto-detects role:
    - Normal student: e.g. nikhil26100@iiitnr.edu.in -> STUDENT
    - Facility Admin: admin@iiitnr.edu.in -> ADMIN
    - Super Admin: superadmin@iiitnr.edu.in -> SUPER_ADMIN
    """
    return authenticate_iiitnr_user(payload.email, db)


@router.get("/admins", response_model=List[UserResponse], summary="List Campus Admins & Staff (Super Admin)")
def get_admins(db: Session = Depends(get_db)) -> List[UserResponse]:
    """Retrieve list of all registered administrators, supervisors, and technicians."""
    users = list_administrative_users(db)
    return [UserResponse.model_validate(u) for u in users]


@router.post("/admins", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Add New Admin / Staff (Super Admin)")
def create_admin(payload: AdminCreateRequest, db: Session = Depends(get_db)) -> UserResponse:
    """Super Admin action to register a new facility admin or maintenance squad lead."""
    user = add_admin_user(payload, db)
    return UserResponse.model_validate(user)


@router.delete("/admins/{user_id}", summary="Remove Admin / Staff (Super Admin)")
def remove_admin(user_id: int, db: Session = Depends(get_db)):
    """Super Admin action to delete or revoke access for a staff member."""
    success = delete_admin_user(user_id, db)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Staff account with ID {user_id} was not found."
        )
    return {"message": f"Staff account #{user_id} revoked successfully."}


@router.post("/purge-tickets", summary="Purge All Tickets (Super Admin)")
def purge_tickets_endpoint(db: Session = Depends(get_db)):
    """Super Admin action to clear all complaint tickets from SQLite."""
    count = purge_all_tickets(db)
    return {"message": f"Database sanitized: {count} complaints cleared.", "purged_count": count}
