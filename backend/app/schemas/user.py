"""
SmartComplaintHandler - User Authentication & Administration Schemas
Role: Pydantic DTOs for @iiitnr.edu.in login, session payload, and admin creation.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator

IIITNR_DOMAIN = "iiitnr.edu.in"

class LoginRequest(BaseModel):
    email: str = Field(..., description="Official IIIT-NR institutional email address")
    password: Optional[str] = Field("••••••••", description="Optional password for campus credentials")

    @field_validator("email")
    @classmethod
    def validate_iiitnr_domain(cls, v: str) -> str:
        v = v.strip().lower()
        if not v.endswith(f"@{IIITNR_DOMAIN}"):
            raise ValueError(f"Institutional login requires an official @{IIITNR_DOMAIN} email address.")
        return v

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


class AdminCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=150, description="Full name of staff/admin member")
    email: str = Field(..., description="Official IIIT-NR email address")
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
