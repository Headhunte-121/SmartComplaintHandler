"""
SmartComplaintHandler - User Authentication & Administration Schemas
Role: Pydantic DTOs for @iiitnr.edu.in registration, login, Google Workspace OAuth2/OIDC SSO,
      stateless OTP verification, JWT access/refresh token payloads, and admin creation.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

HAS_PYDANTIC_V2 = hasattr(BaseModel, "model_validate")
if HAS_PYDANTIC_V2:
    from pydantic import ConfigDict, field_validator
else:
    from pydantic import validator

IIITNR_DOMAIN = "iiitnr.edu.in"


def _validate_iiitnr_email(v: str, context_label: str = "Institutional login") -> str:
    v = (v or "").strip().lower()
    if not v.endswith(f"@{IIITNR_DOMAIN}") or "@" not in v or v.startswith("@"):
        raise ValueError(f"{context_label} requires an official @{IIITNR_DOMAIN} email address.")
    domain_part = v.split("@", 1)[1]
    if domain_part != IIITNR_DOMAIN:
        raise ValueError(f"{context_label} is strictly restricted to @{IIITNR_DOMAIN} accounts.")
    return v


class LoginRequest(BaseModel):
    email: str = Field(..., description="Official IIIT-NR institutional email address")
    password: str = Field(..., min_length=4, max_length=128, description="Campus account credential password")
    remember_me: bool = Field(False, description="Persist session for 30 days across browser restarts")

    if HAS_PYDANTIC_V2:
        model_config = ConfigDict(str_strip_whitespace=True)

        @field_validator("email")
        @classmethod
        def validate_iiitnr_domain(cls, v: str) -> str:
            return _validate_iiitnr_email(v, "Institutional login")
    else:
        class Config:
            anystr_strip_whitespace = True

        @validator("email")
        def validate_iiitnr_domain(cls, v: str) -> str:
            return _validate_iiitnr_email(v, "Institutional login")


class OTPRequest(BaseModel):
    email: str = Field(..., description="Official IIIT-NR email address to receive OTP")

    if HAS_PYDANTIC_V2:
        model_config = ConfigDict(str_strip_whitespace=True)

        @field_validator("email")
        @classmethod
        def validate_iiitnr_domain(cls, v: str) -> str:
            return _validate_iiitnr_email(v, "OTP dispatch")
    else:
        class Config:
            anystr_strip_whitespace = True

        @validator("email")
        def validate_iiitnr_domain(cls, v: str) -> str:
            return _validate_iiitnr_email(v, "OTP dispatch")


class OTPVerifyRequest(BaseModel):
    email: str = Field(..., description="Official IIIT-NR email address")
    otp: str = Field(..., min_length=4, max_length=10, description="6-digit verification code")
    otp_token: Optional[str] = Field(None, description="Stateless HMAC-signed OTP challenge token for serverless verification")

    if HAS_PYDANTIC_V2:
        model_config = ConfigDict(str_strip_whitespace=True)

        @field_validator("email")
        @classmethod
        def validate_iiitnr_domain(cls, v: str) -> str:
            return _validate_iiitnr_email(v, "OTP verification")
    else:
        class Config:
            anystr_strip_whitespace = True

        @validator("email")
        def validate_iiitnr_domain(cls, v: str) -> str:
            return _validate_iiitnr_email(v, "OTP verification")


class RegisterRequest(BaseModel):
    name: Optional[str] = Field(None, max_length=150, description="Full name (auto-extracted from email if omitted)")
    email: str = Field(..., description="Official IIIT-NR institutional email address")
    password: str = Field(..., min_length=6, max_length=128, description="Secure account password (minimum 6 characters)")
    department_name: Optional[str] = Field(None, description="Academic department (auto-detected if omitted)")
    phone: Optional[str] = Field(None, max_length=50, description="Mobile contact or campus extension")
    remember_me: bool = Field(False, description="Persist session for 30 days")
    otp: Optional[str] = Field(None, description="Verification OTP")
    otp_token: Optional[str] = Field(None, description="Stateless signed OTP challenge token")

    if HAS_PYDANTIC_V2:
        model_config = ConfigDict(str_strip_whitespace=True)

        @field_validator("email")
        @classmethod
        def validate_iiitnr_domain(cls, v: str) -> str:
            return _validate_iiitnr_email(v, "Registration")
    else:
        class Config:
            anystr_strip_whitespace = True

        @validator("email")
        def validate_iiitnr_domain(cls, v: str) -> str:
            return _validate_iiitnr_email(v, "Registration")


class GoogleAuthRequest(BaseModel):
    """
    Production-grade Google Workspace SSO request payload.
    Supports both:
    - OAuth 2.0 access_token (via google.accounts.oauth2.initTokenClient)
    - OIDC ID Token JWT credential (via google.accounts.id)
    Strictly enforces @iiitnr.edu.in hosted domain (hd == 'iiitnr.edu.in').
    """
    access_token: Optional[str] = Field(None, description="Google OAuth 2.0 access token for server-side verification")
    credential: Optional[str] = Field(None, description="Google Identity Services OIDC JWT ID token")
    email: Optional[str] = Field(None, description="Verified institutional @iiitnr.edu.in email")
    name: Optional[str] = Field(None, description="Full real name from Google Workspace profile")
    picture: Optional[str] = Field(None, description="Google profile avatar URL")
    hd: Optional[str] = Field(None, description="Google Workspace Hosted Domain claim (must be iiitnr.edu.in)")
    email_verified: Optional[bool] = Field(True, description="Whether Google has verified email ownership")
    remember_me: bool = Field(True, description="Persist session for 30 days")

    if HAS_PYDANTIC_V2:
        model_config = ConfigDict(str_strip_whitespace=True)
    else:
        class Config:
            anystr_strip_whitespace = True


class GoogleAuthConfigResponse(BaseModel):
    """Public configuration for frontend Google Identity Services initialization."""
    google_client_id: str = Field("", description="Configured Google Cloud OAuth 2.0 Client ID")
    allowed_domain: str = Field(IIITNR_DOMAIN, description="Mandatory institutional email domain")
    hosted_domain: str = Field(IIITNR_DOMAIN, description="Mandatory Google Workspace hd parameter")
    google_sso_enabled: bool = Field(False, description="True if GOOGLE_CLIENT_ID is configured on the server")


class RefreshTokenRequest(BaseModel):
    """Request payload to exchange a valid refresh token for a new access token."""
    refresh_token: str = Field(..., min_length=10, description="Cryptographic JWT refresh token")
    remember_me: bool = Field(True, description="Keep extended session duration")


class PasswordChangeRequest(BaseModel):
    """Request payload for authenticated users updating their password."""
    current_password: Optional[str] = Field(None, description="Current password (optional if transitioning from Google-only account)")
    new_password: str = Field(..., min_length=6, max_length=128, description="New account password (minimum 6 characters)")


class UserResponse(BaseModel):
    id: Optional[int] = None
    name: str
    email: str
    role: str  # STUDENT, ADMIN, SUPER_ADMIN, TECHNICIAN
    department_name: Optional[str] = None
    department_id: Optional[int] = None
    identifier: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    auth_provider: Optional[str] = "password"
    email_verified: bool = True
    is_active: bool = True
    last_login_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    if HAS_PYDANTIC_V2:
        model_config = ConfigDict(from_attributes=True)
    else:
        class Config:
            orm_mode = True

        @classmethod
        def model_validate(cls, obj):
            if isinstance(obj, dict):
                return cls(**obj)
            return cls.from_orm(obj)


class AuthResponse(BaseModel):
    access_token: str = Field(..., description="Cryptographic JWT session bearer token")
    refresh_token: Optional[str] = Field(None, description="Cryptographic JWT refresh token for seamless session renewal")
    token_type: str = Field("bearer", description="Standard OAuth2 token type")
    expires_in_days: int = Field(..., description="Token lifespan in days (30 if remember_me is enabled, else 1)")
    expires_at: Optional[datetime] = Field(None, description="UTC expiration timestamp of the access token")
    user: UserResponse = Field(..., description="Authenticated user profile entity")


class AdminCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=150, description="Full name of staff/admin member")
    email: str = Field(..., description="Official IIIT-NR email address")
    password: Optional[str] = Field("IIITNR@2026", min_length=6, max_length=128, description="Initial credentials password")
    role: str = Field("ADMIN", description="Role to assign: ADMIN or TECHNICIAN")
    department_name: Optional[str] = Field("General Administration", description="Assigned campus maintenance department")
    department_id: Optional[int] = None
    phone: Optional[str] = Field(None, max_length=50, description="Contact phone or campus extension")

    if HAS_PYDANTIC_V2:
        model_config = ConfigDict(str_strip_whitespace=True)

        @field_validator("email")
        @classmethod
        def validate_iiitnr_domain(cls, v: str) -> str:
            return _validate_iiitnr_email(v, "Admin registration")
    else:
        class Config:
            anystr_strip_whitespace = True

        @validator("email")
        def validate_iiitnr_domain(cls, v: str) -> str:
            return _validate_iiitnr_email(v, "Admin registration")
