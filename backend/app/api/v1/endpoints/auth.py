"""
SmartComplaintHandler - Authentication & Super Admin Endpoints
Role: Institutional registration, login with persistent Remember Me sessions, JWT issuance,
      profile retrieval, and administrative actions under Super Admin authority.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.user import (
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    UserResponse,
    AdminCreateRequest,
    OTPRequest,
    OTPVerifyRequest,
)
from app.services.user_service import (
    authenticate_iiitnr_user,
    register_user,
    get_current_user_from_token,
    list_administrative_users,
    add_admin_user,
    delete_admin_user,
    purge_all_tickets,
    generate_otp,
    verify_otp,
)

router = APIRouter()


@router.post("/send-otp", summary="Generate & Dispatch Verification OTP")
def send_otp_endpoint(payload: OTPRequest):
    """Generate 6-digit verification OTP for institutional email."""
    clean_email = payload.email.strip().lower()
    otp = generate_otp(clean_email)
    return {
        "status": "success",
        "email": clean_email,
        "otp": otp,
        "message": f"Verification code sent to {clean_email}."
    }


@router.post("/verify-otp", summary="Verify Institutional Email OTP")
def verify_otp_endpoint(payload: OTPVerifyRequest):
    """Verify submitted OTP code against active record."""
    clean_email = payload.email.strip().lower()
    is_valid = verify_otp(clean_email, payload.otp)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code."
        )
    return {
        "verified": True,
        "email": clean_email,
        "message": "Institutional email verified successfully."
    }


@router.post("/login", response_model=AuthResponse, summary="Institutional @iiitnr.edu.in Login with Remember Me")
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    """
    Authenticate an official IIIT-NR user.
    Verifies credentials via bcrypt, detects role, and returns JWT session token:
    - Normal session: 1 day expiry
    - Remember Me enabled: 30 days persistent token
    """
    return authenticate_iiitnr_user(payload, db)


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED, summary="Register New Institutional Account")
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    """
    Register a new student, faculty, or staff member with an official @iiitnr.edu.in email.
    Securely stores password hash via bcrypt and returns JWT token for immediate access.
    """
    return register_user(payload, db)


@router.get("/me", response_model=UserResponse, summary="Get Current Authenticated User")
def get_me(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> UserResponse:
    """Fetch active user profile using cryptographic JWT Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header. Expected 'Bearer <token>'."
        )
    token = authorization.split("Bearer ")[1].strip()
    return get_current_user_from_token(token, db)


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
    """Super Admin action to clear all complaint tickets from database."""
    count = purge_all_tickets(db)
    return {"message": f"Database sanitized: {count} complaints cleared.", "purged_count": count}
