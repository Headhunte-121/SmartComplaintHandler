"""
SmartComplaintHandler - Authentication & Super Admin Endpoints
Role: Institutional registration, login with persistent Remember Me sessions,
      Google Workspace OAuth2/OIDC SSO strictly restricted to @iiitnr.edu.in,
      stateless OTP challenge/verification, JWT access/refresh lifecycle,
      password updates, profile retrieval, and Super Admin operations.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, get_optional_current_user
from app.core.config import settings
from app.schemas.user import (
    IIITNR_DOMAIN,
    AdminCreateRequest,
    AuthResponse,
    GoogleAuthConfigResponse,
    GoogleAuthRequest,
    LoginRequest,
    OTPRequest,
    OTPVerifyRequest,
    PasswordChangeRequest,
    RefreshTokenRequest,
    RegisterRequest,
    UserResponse,
)
from app.services.user_service import (
    add_admin_user,
    authenticate_google_user,
    authenticate_iiitnr_user,
    change_user_password,
    delete_admin_user,
    generate_otp_challenge,
    get_current_user_from_token,
    list_administrative_users,
    purge_all_tickets,
    refresh_user_session,
    register_user,
    verify_otp,
)

router = APIRouter()


@router.get(
    "/config",
    response_model=GoogleAuthConfigResponse,
    summary="Get Public Institutional Auth & Google SSO Configuration",
)
def get_auth_config() -> GoogleAuthConfigResponse:
    """
    Returns the public Google OAuth 2.0 Client ID and mandatory @iiitnr.edu.in
    hosted domain constraints for the frontend Google Identity Services SDK.
    """
    client_id = (settings.GOOGLE_CLIENT_ID or "").strip()
    allowed_domain = (settings.GOOGLE_ALLOWED_DOMAIN or IIITNR_DOMAIN).strip().lower()
    return GoogleAuthConfigResponse(
        google_client_id=client_id,
        allowed_domain=allowed_domain,
        hosted_domain=allowed_domain,
        google_sso_enabled=bool(client_id),
    )


@router.post("/send-otp", summary="Generate & Dispatch Verification OTP")
def send_otp_endpoint(payload: OTPRequest):
    """
    Generate 6-digit verification OTP and stateless HMAC challenge token
    for institutional @iiitnr.edu.in email verification on Vercel Serverless.
    """
    clean_email = payload.email.strip().lower()
    otp, otp_token = generate_otp_challenge(clean_email)
    response = {
        "status": "success",
        "email": clean_email,
        "otp_token": otp_token,
        "expires_in_minutes": settings.OTP_EXPIRE_MINUTES,
        "message": f"Verification code sent to {clean_email}.",
    }
    if getattr(settings, "EXPOSE_DEV_OTP_IN_RESPONSE", True):
        response["otp"] = otp
    return response


@router.post("/verify-otp", summary="Verify Institutional Email OTP")
def verify_otp_endpoint(payload: OTPVerifyRequest):
    """Verify submitted OTP code against stateless challenge token or active record."""
    clean_email = payload.email.strip().lower()
    is_valid = verify_otp(clean_email, payload.otp, payload.otp_token)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )
    return {
        "verified": True,
        "email": clean_email,
        "message": "Institutional email verified successfully.",
    }


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Institutional @iiitnr.edu.in Login with Remember Me",
)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    """
    Authenticate an official IIIT-NR user.
    Verifies credentials via bcrypt, detects role, and returns access + refresh JWT tokens:
    - Normal session: 24-hour access token
    - Remember Me enabled: 30-day persistent token
    """
    return authenticate_iiitnr_user(payload, db)


@router.post(
    "/google",
    response_model=AuthResponse,
    summary="Institutional Google Workspace SSO (@iiitnr.edu.in Only)",
)
def google_sso(payload: GoogleAuthRequest, db: Session = Depends(get_db)) -> AuthResponse:
    """
    Authenticate or register an institutional user via official Google Workspace SSO.
    Verifies OAuth2 access_token / OIDC ID token with Google APIs, strictly enforces
    @iiitnr.edu.in email and hosted domain (hd == 'iiitnr.edu.in'), syncs profile to Supabase,
    and issues access + refresh tokens.
    """
    return authenticate_google_user(payload, db)


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register New Institutional Account",
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    """
    Register a new student, faculty, or staff member with an official @iiitnr.edu.in email.
    Securely stores password hash via bcrypt in Supabase and returns JWT tokens for immediate access.
    """
    return register_user(payload, db)


@router.post(
    "/refresh",
    response_model=AuthResponse,
    summary="Refresh Access Token Using Refresh Token",
)
def refresh_session(payload: RefreshTokenRequest, db: Session = Depends(get_db)) -> AuthResponse:
    """Exchange a valid JWT refresh token for a fresh access token and updated profile."""
    return refresh_user_session(payload.refresh_token, payload.remember_me, db)


@router.post("/logout", summary="Terminate Active Session")
def logout_endpoint():
    """Acknowledge client logout and instruct browser to clear session tokens."""
    return {
        "status": "success",
        "message": "Session terminated successfully.",
    }


@router.post(
    "/change-password",
    response_model=UserResponse,
    summary="Update Authenticated User Password",
)
def update_password(
    payload: PasswordChangeRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    """Allow an authenticated user to change or initialize their account password."""
    return change_user_password(
        email=current_user.email,
        current_password=payload.current_password,
        new_password=payload.new_password,
        db=db,
    )


@router.get("/me", response_model=UserResponse, summary="Get Current Authenticated User")
def get_me(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> UserResponse:
    """Fetch active user profile using cryptographic JWT Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header. Expected 'Bearer <token>'.",
        )
    token = authorization.split("Bearer ", 1)[1].strip()
    return get_current_user_from_token(token, db)


def _enforce_super_admin_if_authenticated(current_user: Optional[UserResponse]) -> None:
    """If an Authorization header is supplied on admin routes, verify SUPER_ADMIN/ADMIN authority."""
    if current_user is not None and current_user.role not in ("SUPER_ADMIN", "ADMIN"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Restricted to Super Administrators and Facility Administrators.",
        )


@router.get(
    "/admins",
    response_model=List[UserResponse],
    summary="List Campus Admins & Staff (Super Admin)",
)
def get_admins(
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
) -> List[UserResponse]:
    """Retrieve list of all registered administrators, supervisors, and technicians."""
    _enforce_super_admin_if_authenticated(current_user)
    users = list_administrative_users(db)
    return [UserResponse.model_validate(u) for u in users]


@router.post(
    "/admins",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add New Admin / Staff (Super Admin)",
)
def create_admin(
    payload: AdminCreateRequest,
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    """Super Admin action to register a new facility admin or maintenance squad lead."""
    _enforce_super_admin_if_authenticated(current_user)
    user = add_admin_user(payload, db)
    return UserResponse.model_validate(user)


@router.delete("/admins/{user_id}", summary="Remove Admin / Staff (Super Admin)")
def remove_admin(
    user_id: int,
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Super Admin action to delete or revoke access for a staff member."""
    _enforce_super_admin_if_authenticated(current_user)
    success = delete_admin_user(user_id, db)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Staff account with ID {user_id} was not found.",
        )
    return {"message": f"Staff account #{user_id} revoked successfully."}


@router.post("/purge-tickets", summary="Purge All Tickets (Super Admin)")
def purge_tickets_endpoint(
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Super Admin action to clear all complaint tickets from database."""
    _enforce_super_admin_if_authenticated(current_user)
    count = purge_all_tickets(db)
    return {
        "message": f"Database sanitized: {count} complaints cleared.",
        "purged_count": count,
    }
