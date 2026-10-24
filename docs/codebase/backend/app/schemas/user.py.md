# Comprehensive Code Walkthrough & Line-by-Line Guide: `backend/app/schemas/user.py`

> **File Location**: [`backend/app/schemas/user.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/backend/app/schemas/user.py)  
> **Prerequisites**: Basic knowledge of C or Python (classes, functions, strings, data validation). No web framework background is assumed.  
> **What this file is**: The data contracts (Pydantic Schemas / DTOs) for user accounts and authentication. It verifies all incoming login, registration, OTP, and profile update data, strictly enforcing that emails belong to `@iiitnr.edu.in` and masking sensitive password hashes in outgoing API responses.

---

## Block 1: Imports and Institutional Domain Validator (Lines 1–27)

```python
"""
SmartComplaintHandler - User Authentication & Administration Schemas
Role: Pydantic DTOs for @iiitnr.edu.in registration, login, Google Workspace OAuth2/OIDC SSO,
      student hostel/room profile management, stateless OTP verification, JWT access/refresh token payloads, and admin creation.
"""
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field

HAS_PYDANTIC_V2 = hasattr(BaseModel, "model_validate")
if HAS_PYDANTIC_V2:
    from pydantic import ConfigDict, field_validator, field_serializer
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
```

### 1. Plain-English Purpose:
Sets up Pydantic tools across v1 and v2, defines the institutional domain constant (`"iiitnr.edu.in"`), and establishes the foundational security validator function `_validate_iiitnr_email()` that blocks any non-university email address.

### 2. Line-by-Line Breakdown:
- **Lines 1–5**: Docstring detailing schemas for login, SSO, OTP, and admin creation.
- **Line 6 (`from datetime import datetime, timezone`)**: Utilities for UTC timestamps.
- **Line 7 (`from typing import Optional`)**: Type hint for optional payload fields.
- **Line 8 (`from pydantic import BaseModel, Field`)**: Core Pydantic classes for schema creation and field constraint validation.
- **Lines 10–14**: Detects Pydantic v2 via `hasattr(BaseModel, "model_validate")` and loads modern validators (`field_validator`, `field_serializer`).
- **Line 16 (`IIITNR_DOMAIN = "iiitnr.edu.in"`)**: Master institutional domain string.
- **Line 19 (`def _validate_iiitnr_email(v: str, context_label: str = "Institutional login") -> str:`)**: Reusable email validator function.
- **Line 20 (`v = (v or "").strip().lower()`)**: Defensive string normalization: trims leading/trailing whitespace and converts to lowercase.
- **Lines 21–22**: Guard check: ensures string contains `@`, does not start with `@`, and ends with `@iiitnr.edu.in`. If invalid, raises `ValueError`.
- **Lines 23–25**: Splits at `@` (`v.split("@", 1)[1]`) and verifies domain part is strictly identical to `IIITNR_DOMAIN` (defeating subdomain bypass attacks).
- **Line 26 (`return v`)**: Returns the sanitized, validated email string.

### 3. Deep Term & Concept Expansion (For C / Basic Python Readers):
- **What is a Schema / DTO (Data Transfer Object)?**:
  In C, receiving a network packet requires manually copying bytes into a struct `struct LoginPacket { char email[100]; char password[128]; };` and writing manual `if` statements to check lengths. A **Pydantic Schema (or DTO)** acts as an automatic filter at the entrance of an API: it reads incoming JSON text, verifies datatypes and string rules, and if the data is invalid, immediately responds with HTTP `422 Unprocessable Entity` before your database code ever runs.
- **Subdomain Bypass Defense**:
  If a developer only checks `email.endswith("iiitnr.edu.in")`, an attacker could register `"user@fake.iiitnr.edu.in"`. Line 23 uses `domain_part = v.split("@", 1)[1]` and verifies `domain_part == "iiitnr.edu.in"`, strictly ensuring only top-level institutional accounts are accepted.

---

## Block 2: `LoginRequest` Schema (Lines 29–48)

```python
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
```

### 1. Plain-English Purpose:
Defines the required data contract for student and staff login. Validates that the submitted email is an authentic `@iiitnr.edu.in` address, enforces password character boundaries (4 to 128 characters), and captures the "Remember Me" toggle.

### 2. Line-by-Line Breakdown:
- **Line 29 (`class LoginRequest(BaseModel):`)**: Schema class inheriting from `BaseModel`.
- **Line 30 (`email: str = Field(..., description=...)`)**: Mandatory string field. The ellipsis `...` indicates the field is strictly required.
- **Line 31 (`password: str = Field(..., min_length=4, max_length=128, ...)`)**: Password string with length boundaries (min 4, max 128).
- **Line 32 (`remember_me: bool = Field(False, ...)`)**: Boolean flag defaulting to `False`.
- **Line 35 (`model_config = ConfigDict(str_strip_whitespace=True)`)**: Automatically strips leading/trailing spaces from strings.
- **Lines 37–40 (`@field_validator("email") ...`)**: Attaches `_validate_iiitnr_email()` to the `email` field.

### 3. Deep Term & Concept Expansion:
- **What does `Field(...)` and `...` (Ellipsis) Mean?**:
  In Python, `...` is a built-in singleton object called Ellipsis. In Pydantic:
  - `email: str = Field(...)` tells Pydantic: *"This field is mandatory! If omitted in the JSON, reject the request with HTTP 422."*
  - `remember_me: bool = Field(False)` tells Pydantic: *"This field is optional. If omitted, default its value to `False`."*
- **Why `max_length=128`? (DoS Buffer Defense)**:
  Bcrypt password hashing consumes significant CPU cycles. If an attacker submits a 10MB text string as a password, the server's CPU would spike while hashing. Restricting passwords to a maximum of 128 characters prevents CPU exhaustion Denial-of-Service attacks.
- **What is `str_strip_whitespace=True`?**:
  Mobile virtual keyboards frequently append an accidental space when using autocomplete (e.g. `"student@iiitnr.edu.in "`). Stripping whitespace automatically prevents login failures caused by accidental trailing spaces.

---

## Block 3: `OTPRequest` & `OTPVerifyRequest` Schemas (Lines 50–88)

```python
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
```

### 1. Plain-English Purpose:
Data contracts for two-step email verification:
1. `OTPRequest`: Accepts and validates an `@iiitnr.edu.in` email address to dispatch a 6-digit one-time password code.
2. `OTPVerifyRequest`: Validates the submitted 6-digit code alongside an optional stateless HMAC challenge token (`otp_token`).

### 2. Line-by-Line Breakdown:
- **Lines 50–67 (`OTPRequest`)**: Contains only the validated institutional `email`.
- **Lines 69–88 (`OTPVerifyRequest`)**:
  - `email`: Institutional email.
  - `otp`: The verification digits entered by the user (min 4, max 10 chars).
  - `otp_token`: Optional signed HMAC challenge token from the server allowing stateless validation on serverless hosting.

---

## Block 4: `RegisterRequest` Schema (Lines 90–116)

```python
class RegisterRequest(BaseModel):
    name: Optional[str] = Field(None, max_length=150, description="Full name (auto-extracted from email if omitted)")
    email: str = Field(..., description="Official IIIT-NR institutional email address")
    password: str = Field(..., min_length=6, max_length=128, description="Secure account password (minimum 6 characters)")
    department_name: Optional[str] = Field(None, description="Academic department (auto-detected if omitted)")
    phone: Optional[str] = Field(None, max_length=50, description="Mobile contact or campus extension")
    hostel_name: Optional[str] = Field(None, max_length=120, description="Assigned IIIT-NR hostel house (e.g., Ramanujan House, Bhabha House, Bose House, Raman House, Shabhari House)")
    room_number: Optional[str] = Field(None, max_length=60, description="Assigned room number and wing/floor (e.g., Wing A, Room 204)")
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
```

### 1. Plain-English Purpose:
Validates new student registration data. Enforces minimum 6-character passwords, validates institutional email domains, and captures hostel details (Ramanujan, Bhabha, Bose, etc.) and verification OTP challenge tokens.

### 2. Line-by-Line Breakdown:
- **Line 91 (`name`)**: Student's name (optional; auto-extracted from email prefix if left blank).
- **Line 92 (`email`)**: Mandatory institutional email.
- **Line 93 (`password`)**: Password enforced to minimum 6 characters.
- **Lines 94–97 (`department_name`, `phone`, `hostel_name`, `room_number`)**: Student campus location profiles.
- **Lines 98–100 (`remember_me`, `otp`, `otp_token`)**: Session preferences and email challenge tokens.

---

## Block 5: `UserProfileUpdateRequest` Schema (Lines 118–131)

```python
class UserProfileUpdateRequest(BaseModel):
    """Request payload for students/staff updating their hostel, room number, phone, or display name."""
    name: Optional[str] = Field(None, max_length=150, description="Updated full name")
    phone: Optional[str] = Field(None, max_length=50, description="Mobile number or intercom extension")
    hostel_name: Optional[str] = Field(None, max_length=120, description="IIIT-NR Hostel House (Ramanujan, Bhabha, Bose, Raman, Shabhari, Transit Hostel, or Day Scholar)")
    room_number: Optional[str] = Field(None, max_length=60, description="Specific hostel room number / wing (e.g., Wing A, Room 204)")
    department_name: Optional[str] = Field(None, max_length=100, description="Academic branch or department")

    if HAS_PYDANTIC_V2:
        model_config = ConfigDict(str_strip_whitespace=True)
    else:
        class Config:
            anystr_strip_whitespace = True
```

### 1. Plain-English Purpose:
Data contract for authenticated students or staff updating their personal profile (e.g. changing room allocation at the start of a semester or updating their phone number). All fields are optional so users can update single fields independently.

---

## Block 6: Google Workspace SSO Schemas (Lines 133–164)

```python
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
    is_registration: bool = Field(False, description="True if calling from registration page to register a new account")

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
```

### 1. Plain-English Purpose:
1. `GoogleAuthRequest`: Incoming payload from Google Single Sign-On, supporting both OAuth2 `access_token` and OpenID Connect `credential` (ID token), verifying the hosted domain claim (`hd="iiitnr.edu.in"`).
2. `GoogleAuthConfigResponse`: Outgoing response providing the frontend React app with Google Client ID and domain restrictions.

### 2. Deep Term & Concept Expansion:
- **What is the `hd` Claim in Google OAuth?**:
  `hd` stands for **Hosted Domain**. When a user logs in with Google, Google's token payload includes `hd: "iiitnr.edu.in"` if and only if the account is an official Google Workspace enterprise account belonging to IIIT-NR. Standard `@gmail.com` accounts do not have this claim, allowing instant institutional filtering.

---

## Block 7: `RefreshTokenRequest` & `PasswordChangeRequest` (Lines 166–176)

```python
class RefreshTokenRequest(BaseModel):
    """Request payload to exchange a valid refresh token for a new access token."""
    refresh_token: str = Field(..., min_length=10, description="Cryptographic JWT refresh token")
    remember_me: bool = Field(True, description="Keep extended session duration")


class PasswordChangeRequest(BaseModel):
    """Request payload for authenticated users updating their password."""
    current_password: Optional[str] = Field(None, description="Current password (optional if transitioning from Google-only account)")
    new_password: str = Field(..., min_length=6, max_length=128, description="New account password (minimum 6 characters)")
```

### 1. Plain-English Purpose:
1. `RefreshTokenRequest`: Receives the long-lived refresh token to generate a fresh 24-hour access token.
2. `PasswordChangeRequest`: Validates user password changes, requiring a minimum of 6 characters and making `current_password` optional for users transitioning from a Google SSO account to local credentials.

---

## Block 8: `UserResponse` Outgoing Schema (Lines 178–218)

```python
class UserResponse(BaseModel):
    id: Optional[int] = None
    name: str
    email: str
    role: str  # STUDENT, ADMIN, SUPER_ADMIN, TECHNICIAN
    department_name: Optional[str] = None
    department_id: Optional[int] = None
    identifier: Optional[str] = None
    phone: Optional[str] = None
    hostel_name: Optional[str] = None
    room_number: Optional[str] = None
    avatar_url: Optional[str] = None
    auth_provider: Optional[str] = "password"
    has_password: bool = True
    email_verified: bool = True
    is_active: bool = True
    last_login_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    if HAS_PYDANTIC_V2:
        model_config = ConfigDict(from_attributes=True)

        @field_serializer("last_login_at", "created_at", when_used="json-unless-none")
        def _serialize_user_datetime_utc(self, dt: Optional[datetime]) -> Optional[str]:
            if dt is None:
                return None
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            else:
                dt = dt.astimezone(timezone.utc)
            return dt.isoformat()
    else:
        class Config:
            orm_mode = True

        @classmethod
        def model_validate(cls, obj):
            if isinstance(obj, dict):
                return cls(**obj)
            return cls.from_orm(obj)
```

### 1. Plain-English Purpose:
The safe, public user profile returned to the browser. It deliberately omits password hashes, formats timestamps in standardized UTC ISO 8601 strings, and supports direct serialization from SQLAlchemy ORM models via `from_attributes=True`.

### 2. Line-by-Line Breakdown:
- **Lines 179–196**: Declares public user fields. **Notice that `hashed_password` is completely absent!** Instead, line 191 defines `has_password: bool = True`.
- **Line 198 (`model_config = ConfigDict(from_attributes=True)`)**: Allows Pydantic to read directly from SQLAlchemy models (`user.email`) rather than dictionaries.
- **Lines 200–208 (`@field_serializer(...)`)**: Ensures datetime fields are exported with explicit UTC indicators (`+00:00` or `Z`).
- **Lines 210–218**: Backward-compatible fallback for Pydantic v1 (`orm_mode = True`).

### 3. Deep Term & Concept Expansion:
- **The Password Hash Masking Pattern**:
  A common security flaw occurs when an API returns raw database models (`return user_db`), accidentally leaking bcrypt password hashes in the JSON response. `UserResponse` acts as a security filter: because `hashed_password` is not defined on the schema, Pydantic strips it completely. The boolean `has_password` tells the frontend whether the user has set a local password without exposing any hash data.

---

## Block 9: `AuthResponse` & `AdminCreateRequest` (Lines 220–251)

```python
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
```

### 1. Plain-English Purpose:
1. `AuthResponse`: Envelope returned upon successful login containing JWT access/refresh tokens, token type (`bearer`), expiration days, and the nested `UserResponse` profile.
2. `AdminCreateRequest`: Payload used by the Super Admin to appoint new department administrators or maintenance technicians.

---

## Overall File Viva & Technical Defense Guide

### Top 10 Viva Questions on `backend/app/schemas/user.py`:

#### Q1: What is the architectural difference between a SQLAlchemy Model and a Pydantic Schema?
> **Model Answer**:  
> *"Sir, a SQLAlchemy Model (e.g. `models/user.py`) defines table structures on disk and handles database query execution. A Pydantic Schema (e.g. `schemas/user.py`) is a Data Transfer Object (DTO) that validates incoming HTTP request payloads over the network and serializes sanitized outgoing JSON responses."*

#### Q2: Why do we have both `RegisterRequest` and `UserResponse` instead of a single class?
> **Model Answer**:  
> *"Sir, this enforces separation of concerns and data protection:  
> - `RegisterRequest` accepts sensitive inbound data from the client, including plain-text passwords and validation OTPs.  
> - `UserResponse` defines the public profile sent to the browser. It deliberately omits passwords and security secrets, preventing accidental data leaks."*

#### Q3: How does `_validate_iiitnr_email()` enforce institutional domain boundaries?
> **Model Answer**:  
> *"Sir, it verifies that the email string is not empty, contains `@`, does not start with `@`, and strictly ends with `@iiitnr.edu.in`. Furthermore, it splits the string at `@` and verifies that the domain part matches `iiitnr.edu.in` exactly, preventing subdomain bypass attacks."*

#### Q4: What HTTP status code does FastAPI return if a Pydantic schema validation fails?
> **Model Answer**:  
> *"Sir, it returns HTTP `422 Unprocessable Entity` along with a detailed JSON response indicating the exact field that failed and the validation error message."*

#### Q5: What does `from_attributes=True` (formerly `orm_mode=True`) do?
> **Model Answer**:  
> *"Sir, by default, Pydantic expects dictionary input (`data['email']`). Setting `from_attributes=True` allows Pydantic to read directly from SQLAlchemy ORM models where attributes are accessed via dot notation (`user.email`), enabling seamless conversion from database records to JSON responses."*

#### Q6: Why is `has_password: bool` returned in `UserResponse` instead of the actual password?
> **Model Answer**:  
> *"Sir, exposing `hashed_password` in API responses is an Information Disclosure vulnerability. Instead, `UserResponse` returns a boolean flag `has_password: bool`. This informs the frontend UI whether the student has set a local password or is using Google SSO exclusively, without ever exposing password hashes."*

#### Q7: What is the purpose of `str_strip_whitespace=True` in `ConfigDict`?
> **Model Answer**:  
> *"Sir, mobile virtual keyboards often append accidental spaces when using autocomplete. Enabling `str_strip_whitespace=True` automatically trims leading and trailing whitespace from string inputs before validation, preventing failed logins caused by accidental trailing spaces."*

#### Q8: What does `Field(..., min_length=6, max_length=128)` do?
> **Model Answer**:  
> *"Sir:  
> - The ellipsis `...` indicates that the field is strictly mandatory.  
> - `min_length=6` enforces password strength.  
> - `max_length=128` prevents Denial-of-Service buffer overflow attacks where an attacker submits megabytes of text to exhaust server CPU cycles during bcrypt computation."*

#### Q9: How does `GoogleAuthRequest` support both OAuth2 and OIDC?
> **Model Answer**:  
> *"Sir, it provides optional fields for both authentication flows: `access_token` for Google OAuth 2.0 token verification, and `credential` for Google Identity Services OIDC JWT ID token verification, strictly verifying that the hosted domain claim (`hd`) matches `iiitnr.edu.in`."*

#### Q10: What does `@field_serializer` do in `UserResponse`?
> **Model Answer**:  
> *"Sir, it customizes how a specific field is converted to JSON. We use it on datetime fields (`created_at`, `last_login_at`) to force timezone conversion to UTC and format the output into standardized ISO 8601 strings."*

---

## Quick Viva Summary Table

| Schema Class | Direction | Purpose | Key Validations |
| :--- | :--- | :--- | :--- |
| **`LoginRequest`** | Incoming (Request) | Validates student/staff login credentials | Email domain `@iiitnr.edu.in`, password length $\ge 4$ |
| **`OTPRequest`** | Incoming (Request) | Validates email for dispatching 6-digit OTP | Email domain `@iiitnr.edu.in` |
| **`OTPVerifyRequest`** | Incoming (Request) | Validates submitted OTP digits and challenge token | Email domain `@iiitnr.edu.in`, OTP length 4–10 digits |
| **`RegisterRequest`** | Incoming (Request) | Validates new student account registration | Mandatory email domain, password length $\ge 6$, hostel house |
| **`GoogleAuthRequest`**| Incoming (Request) | Validates Google Workspace Single Sign-On payload | Google OIDC credential / access token, `hd == 'iiitnr.edu.in'` |
| **`UserResponse`** | Outgoing (Response) | Serializes safe user profile for frontend display | Masks passwords, formats UTC timestamps, supports ORM models |
| **`AuthResponse`** | Outgoing (Response) | Returns JWT access/refresh tokens and user profile | Contains tokens, expiration days, token type (`bearer`) |
| **`AdminCreateRequest`**| Incoming (Request) | Super Admin payload to appoint new department admins | Validates staff email, role (`ADMIN` or `TECHNICIAN`) |
