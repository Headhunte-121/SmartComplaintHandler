"""
SmartComplaintHandler - Database Session & Authentication Dependencies
Blueprint Reference: V1/M1/backend/09_api_deps.md
Role: FastAPI dependency injectors yielding SQLAlchemy sessions and verifying JWT Bearer tokens.
"""
from typing import Callable, Generator, Optional, Sequence
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.schemas.user import UserResponse


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> UserResponse:
    """Require a valid JWT Bearer token and return the active UserResponse profile."""
    from app.services.user_service import get_current_user_from_token

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header. Expected 'Bearer <token>'.",
        )
    token = authorization.split("Bearer ", 1)[1].strip()
    return get_current_user_from_token(token, db)


def get_optional_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Optional[UserResponse]:
    """Resolve the current authenticated user if a Bearer token is supplied, else return None."""
    from app.services.user_service import get_current_user_from_token

    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split("Bearer ", 1)[1].strip()
    if not token:
        return None
    return get_current_user_from_token(token, db)


def require_roles(allowed_roles: Sequence[str]) -> Callable:
    """Factory dependency enforcing role-based access control (RBAC) for protected endpoints."""
    normalized_roles = {r.upper() for r in allowed_roles}

    def _role_checker(current_user: UserResponse = Depends(get_current_user)) -> UserResponse:
        if (current_user.role or "").upper() not in normalized_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required role: {', '.join(sorted(normalized_roles))}.",
            )
        return current_user

    return _role_checker
