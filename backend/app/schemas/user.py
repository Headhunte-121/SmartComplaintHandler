"""
SmartComplaintHandler - User Authentication & Administration Schemas
Role: Pydantic DTOs for @iiitnr.edu.in registration, login, JWT token payloads, and admin creation.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator

IIITNR_DOMAIN = "iiitnr.edu.in"


class LoginRequest(BaseModel):
    email: str = Field(..., description="Official IIIT-NR institutional email address")
    password: str = Field(..., min_length=4, description="Campus account credential password")
    remember_me: bool = Field(False, description="Persist session for 30 days across browser restarts")

    @field_validator("email")
    @classmethod
    def validate_iiitnr_domain(cls, v: str) -> str:
        v = v.strip().lower()
        if not v.endswith(f"@{IIITNR_DOMAIN}"):
            raise ValueError(f"Institutional login requires an official @{IIITNR_DOMAIN} email address.")
        return v

    model_config = ConfigDict(str_strip_whitespace=True)


class OTPRequest(BaseModel):
    email: str = Field(..., description="Official IIIT-NR email address to receive OTP")

    @field_validator("email")
    @classmethod
    def validate_iiitnr_domain(cls, v: str) -> str:
        v = v.strip().lower()
        if not v.endswith(f"@{IIITNR_DOMAIN}"):
            raise ValueError(f"OTP dispatch is restricted to official @{IIITNR_DOMAIN} accounts.")
        return v


class OTPVerifyRequest(BaseModel):
    email: str = Field(..., description="Official IIIT-NR email address")
    otp: str = Field(..., min_length=4, max_length=10, description="Verification code")


class RegisterRequest(BaseModel):
    name: Optional[str] = Field(None, max_length=150, description="Full name (auto-extracted from email if omitted)")
    email: str = Field(..., description="Official IIIT-NR institutional email address")
    password: str = Field(..., min_length=6, max_length=100, description="Secure account password (minimum 6 characters)")
    department_name: Optional[str] = Field(None, description="Academic department (auto-detected if omitted)")
    phone: Optional[str] = Field(None, max_length=50, description="Mobile contact or campus extension")
    remember_me: bool = Field(False, description="Persist session for 30 days")
    otp: Optional[str] = Field(None, description="Verification OTP")

    @field_validator("email")
    @classmethod
    def validate_iiitnr_domain(cls, v: str) -> str:
        v = v.strip().lower()
        if not v.endswith(f"@{IIITNR_DOMAIN}"):
            raise ValueError(f"Registration is restricted to official @{IIITNR_DOMAIN} accounts.")
        return v

class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = Field(None, description="Google Identity Services JWT ID token")
    email: Optional[str] = Field(None, description="Verified institutional email")
    name: Optional[str] = Field(None, description="Full real name from Google profile")
    picture: Optional[str] = Field(None, description="Google profile picture URL")
    remember_me: bool = Field(True, description="Persist session for 30 days")

    model_config = ConfigDict(str_strip_whitespace=True)


class UserResponse(BaseModel):
    id: Optional[int] = None
    name: str
    email: str
    role: str # STUDENT, ADMIN, SUPER_ADMIN, TECHNICIAN
    department_name: Optional[str] = None
    department_id: Optional[int] = None
    identifier: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AuthResponse(BaseModel):
    access_token: str = Field(..., description="Cryptographic JWT session bearer token")
    token_type: str = Field("bearer", description="Standard OAuth2 token type")
    expires_in_days: int = Field(..., description="Token lifespan in days (30 if remember_me is enabled, else 1)")
    user: UserResponse = Field(..., description="Authenticated user profile entity")


class AdminCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=150, description="Full name of staff/admin member")
    email: str = Field(..., description="Official IIIT-NR email address")
    password: Optional[str] = Field("IIITNR@2026", min_length=6, description="Initial credentials password")
    role: str = Field("ADMIN", description="Role to assign: ADMIN or TECHNICIAN")
    department_name: Optional[str] = Field("General Administration", description="Assigned campus maintenance department")
    department_id: Optional[int] = None
    phone: Optional[str] = Field(None, max_length=50, description="Contact phone or campus extension")

    @field_validator("email")
    @classmethod
    def validate_iiitnr_domain(cls, v: str) -> str:
        v = v.strip().lower()
        if not v.endswith(f"@{IIITNR_DOMAIN}"):
            raise ValueError(f"Admin email must belong to the @{IIITNR_DOMAIN} domain.")
        return v

    model_config = ConfigDict(str_strip_whitespace=True)
