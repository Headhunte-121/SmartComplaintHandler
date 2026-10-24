# Comprehensive Code Walkthrough & Line-by-Line Guide: `backend/app/api/v1/endpoints/auth.py`

> **File Location**: [`backend/app/api/v1/endpoints/auth.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/backend/app/api/v1/endpoints/auth.py)  
> **Prerequisites**: Basic knowledge of C or Python (functions, HTTP requests, strings, dictionaries). No web security background is assumed.  
> **What this file is**: The authentication and account management API controller. It handles student registration, login, stateless email OTP verification, Google Workspace Single Sign-On (SSO), profile updates (hostel/room assignments), password modifications, and Super Admin staff provisioning.

---

## Block 1: Imports and Framework Tools (Lines 1–35)

```python
"""
SmartComplaintHandler - Authentication & User Administration Endpoints
Role: Exposes routes for login, Google Workspace SSO, registration, stateless OTP email verification,
      student hostel profile management, password updates, and administrative staff management.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_roles
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
    UserProfileUpdateRequest,
    UserResponse,
)
from app.services.user_service import (
    add_admin_user,
    authenticate_google_user,
    authenticate_iiitnr_user,
    change_user_password,
    delete_admin_user,
    generate_otp_challenge,
    list_administrative_users,
    purge_all_tickets,
    refresh_user_session,
    register_user,
    update_user_profile,
    verify_otp,
)

router = APIRouter()
```

### 1. Plain-English Purpose:
Loads routing classes, dependency injection guards (`get_db`, `get_current_user`, `require_roles`), user validation schemas, and delegates database operations to `user_service.py`. Instantiates the domain `router`.

### 2. Line-by-Line Breakdown:
- **Lines 1–5**: Docstring detailing authentication and administrative endpoints.
- **Line 6 (`from typing import List, Optional`)**: Type hints.
- **Line 7 (`from fastapi import APIRouter, Depends, Header, HTTPException, status`)**: FastAPI routing, dependency injection, and error classes.
- **Line 8 (`from sqlalchemy.orm import Session`)**: Database session type.
- **Line 10 (`from app.api.deps import get_current_user, get_db, require_roles`)**: Injected dependencies: database sessions, JWT authentication, and role authorization.
- **Line 11 (`from app.core.config import settings`)**: Global system configuration.
- **Lines 12–27**: Inbound request and outbound response Pydantic schemas.
- **Lines 28–41**: Service functions executing password hashing, database queries, and token generation.
- **Line 43 (`router = APIRouter()`)**: Instantiates the local router object.

---

## Block 2: Google SSO Public Configuration: `GET /config` (Lines 44–65)

```python
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
```

### 1. Plain-English Purpose:
Provides the frontend React application with the Google OAuth 2.0 Client ID and hosted domain restrictions (`iiitnr.edu.in`). If no Google Client ID is configured on the server, `google_sso_enabled` returns `False`, allowing the frontend to hide the Google login button gracefully.

### 2. Line-by-Line Breakdown:
- **Line 44 (`@router.get("/config", ...)`)**: Registers public HTTP GET route at `/api/v1/auth/config`.
- **Line 47 (`def get_auth_config() -> GoogleAuthConfigResponse:`)**: Endpoint handler function.
- **Line 52 (`client_id = (settings.GOOGLE_CLIENT_ID or "").strip()`)**: Reads Google Client ID from configuration.
- **Line 53 (`allowed_domain = (settings.GOOGLE_ALLOWED_DOMAIN or IIITNR_DOMAIN).strip().lower()`)**: Reads institutional domain.
- **Lines 54–59 (`return GoogleAuthConfigResponse(...)`)**: Returns sanitized client configuration.

---

## Block 3: Email OTP Dispatch & Stateless Verification: `POST /send-otp` & `POST /verify-otp` (Lines 68–101)

```python
@router.post("/send-otp", summary="Generate & Dispatch Verification OTP")
def send_otp_endpoint(payload: OTPRequest):
    clean_email = payload.email.strip().lower()
    otp, otp_token = generate_otp_challenge(clean_email)
    response = {
        "status": "success",
        "email": clean_email,
        "otp_token": otp_token,
        "expires_in_minutes": settings.OTP_EXPIRE_MINUTES,
        "message": f"Verification code sent to {clean_email}.",
    }
    return response


@router.post("/verify-otp", summary="Verify Institutional Email OTP")
def verify_otp_endpoint(payload: OTPVerifyRequest):
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
```

### 1. Plain-English Purpose:
Handles two-step email ownership proof:
1. `/send-otp`: Generates a 6-digit code and packages its cryptographic HMAC digest into a stateless 10-minute token (`otp_token`) returned to the browser.
2. `/verify-otp`: Re-computes the HMAC digest on the submitted code and challenge token statelessly, verifying email ownership without storing OTPs in an external Redis database.

### 2. Line-by-Line Breakdown:
- **Line 68 (`@router.post("/send-otp")`)**: Route generating verification challenge.
- **Line 70 (`otp, otp_token = generate_otp_challenge(clean_email)`)**: Generates 6-digit code and HMAC challenge token.
- **Lines 71–78**: Returns status, email, challenge token, and 10-minute expiration notice.
- **Line 81 (`@router.post("/verify-otp")`)**: Route verifying submitted code.
- **Line 83 (`is_valid = verify_otp(clean_email, payload.otp, payload.otp_token)`)**: Validates code against token signature.
- **Lines 84–88**: If invalid or expired, raises HTTP 400 Bad Request.
- **Lines 89–93**: Returns confirmation dictionary upon success.

---

## Block 4: Standard Login & Google SSO: `POST /login` & `POST /google` (Lines 103–130)

```python
@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Institutional @iiitnr.edu.in Login with Remember Me",
)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    """
    Authenticate an official IIIT-NR user.
    Verifies credentials via bcrypt, enforces brute-force lockout protection, and returns access + refresh JWTs.
    """
    return authenticate_iiitnr_user(payload, db)


@router.post(
    "/google",
    response_model=AuthResponse,
    summary="Institutional Google Workspace SSO (@iiitnr.edu.in Only)",
)
def google_sso(payload: GoogleAuthRequest, db: Session = Depends(get_db)) -> AuthResponse:
    return authenticate_google_user(payload, db)
```

### 1. Plain-English Purpose:
Primary authentication gateways:
1. `/login`: Authenticates institutional email and password via bcrypt, enforces 15-minute brute-force lockout counters, and returns JWT access (24-hour) and refresh (30-day) tokens.
2. `/google`: Authenticates Google Workspace SSO tokens, strictly validating that the Google hosted domain (`hd`) equals `iiitnr.edu.in`, and links or creates the student's profile.

### 2. Line-by-Line Breakdown:
- **Line 103 (`@router.post("/login", response_model=AuthResponse)`)**: Login route returning tokens and user profile.
- **Line 112 (`return authenticate_iiitnr_user(payload, db)`)**: Executes credential check and issues tokens.
- **Line 115 (`@router.post("/google", response_model=AuthResponse)`)**: Google SSO route.
- **Line 124 (`return authenticate_google_user(payload, db)`)**: Verifies Google OIDC token and issues campus tokens.

---

## Block 5: Registration & Session Renewal: `POST /register` & `POST /refresh` (Lines 131–160)

```python
@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register New Institutional Account",
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    return register_user(payload, db)


@router.post(
    "/refresh",
    response_model=AuthResponse,
    summary="Refresh Access Token Using Refresh Token",
)
def refresh_session(payload: RefreshTokenRequest, db: Session = Depends(get_db)) -> AuthResponse:
    return refresh_user_session(payload.refresh_token, payload.remember_me, db)
```

### 1. Plain-English Purpose:
1. `/register`: Registers new students, hashes password with salted bcrypt (12 rounds), records hostel allocation (Ramanujan, Bhabha, etc.), and returns an active session with HTTP 201 Created.
2. `/refresh`: Exchanges a valid 30-day refresh token for a brand-new 24-hour access token, preventing active students from being kicked out when typing lengthy grievances.

---

## Block 6: Profile Management, Password Updates & `/me` (Lines 162–215)

```python
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
    return change_user_password(
        email=current_user.email,
        current_password=payload.current_password,
        new_password=payload.new_password,
        db=db,
    )


@router.patch(
    "/profile",
    response_model=UserResponse,
    summary="Update Authenticated User Profile (Hostel, Room Number, Phone, Name)",
)
def update_profile_endpoint(
    payload: UserProfileUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    return update_user_profile(
        email=current_user.email,
        payload=payload,
        db=db,
    )


@router.get("/me", response_model=UserResponse, summary="Get Current Authenticated User")
def get_me(
    current_user: UserResponse = Depends(get_current_user),
) -> UserResponse:
    return current_user
```

### 1. Plain-English Purpose:
- `/logout`: Acknowledges session termination, instructing the browser to wipe client-side tokens.
- `/change-password`: Verifies old password and hashes new password for the currently logged-in user.
- `/profile`: Uses HTTP `PATCH` to perform partial updates on student hostel allocations, room numbers, or phone numbers.
- `/me`: Returns the authenticated student/staff profile extracted from the Bearer token when the frontend loads.

---

## Block 7: SuperAdmin Governance & Ticket Purge (Lines 217–275)

```python
@router.get(
    "/admins",
    response_model=List[UserResponse],
    summary="List Campus Admins & Staff (Super Admin / Admin)",
)
def get_admins(
    current_user: Optional[UserResponse] = Depends(require_roles(["SUPER_ADMIN", "ADMIN"])),
    db: Session = Depends(get_db),
) -> List[UserResponse]:
    users = list_administrative_users(db)
    return [UserResponse.model_validate(u) for u in users]


@router.post(
    "/admins",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add New Admin / Staff (Super Admin Only)",
)
def create_admin(
    payload: AdminCreateRequest,
    current_user: Optional[UserResponse] = Depends(require_roles(["SUPER_ADMIN"])),
    db: Session = Depends(get_db),
) -> UserResponse:
    user = add_admin_user(payload, db)
    return UserResponse.model_validate(user)


@router.delete("/admins/{user_id}", summary="Remove Admin / Staff (Super Admin Only)")
def remove_admin(
    user_id: int,
    current_user: Optional[UserResponse] = Depends(require_roles(["SUPER_ADMIN"])),
    db: Session = Depends(get_db),
):
    success = delete_admin_user(user_id, db)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Staff account with ID {user_id} was not found.",
        )
    return {"message": f"Staff account #{user_id} revoked successfully."}


@router.post("/purge-tickets", summary="Purge All Tickets (Super Admin Only)")
def purge_tickets_endpoint(
    current_user: Optional[UserResponse] = Depends(require_roles(["SUPER_ADMIN"])),
    db: Session = Depends(get_db),
):
    count = purge_all_tickets(db)
    return {
        "message": f"Database sanitized: {count} complaints cleared.",
        "purged_count": count,
    }
```

### 1. Plain-English Purpose:
Administrative governance tools strictly restricted to `SUPER_ADMIN`:
- `GET /admins`: Lists staff and supervisors (accessible to `ADMIN` and `SUPER_ADMIN`).
- `POST /admins`: Appoints new department administrators or technicians (Super Admin only).
- `DELETE /admins/{user_id}`: Revokes a staff account (Super Admin only).
- `POST /purge-tickets`: Clears all complaint records during end-of-semester database maintenance (Super Admin only).

### 2. Deep Term & Concept Expansion:
- **Privilege Separation via `require_roles(["SUPER_ADMIN"])`**:
  If a student or technician attempts to call `DELETE /admins/4` or `POST /purge-tickets`, FastAPI's RBAC dependency halts execution immediately with HTTP 403 Forbidden before any database logic executes.

---

## Overall File Viva & Technical Defense Guide

### Top 10 Viva Questions on `backend/app/api/v1/endpoints/auth.py`:

#### Q1: What is the primary role of `endpoints/auth.py`?
> **Model Answer**:  
> *"Sir, `endpoints/auth.py` is the API controller for authentication, identity, and user administration. It exposes endpoints for institutional login, Google Workspace SSO, student registration, stateless OTP verification, profile management, and Super Admin staff provisioning."*

#### Q2: How does the system prevent non-university students from logging in via Google?
> **Model Answer**:  
> *"Sir, the `/google` endpoint verifies that the Google OIDC token contains a Hosted Domain claim (`hd`) matching `iiitnr.edu.in`. If an outsider authenticates with a personal `@gmail.com` account, the server detects the domain mismatch and immediately raises HTTP 403 Forbidden."*

#### Q3: Why does `logout_endpoint()` not execute a SQL query?
> **Model Answer**:  
> *"Sir, our architecture utilizes stateless JSON Web Tokens (JWT). The server does not maintain server-side session rows in the database. Logging out is accomplished client-side by having the React frontend delete the JWT access and refresh tokens from memory, avoiding unnecessary database write overhead."*

#### Q4: Why do you use `PATCH /profile` instead of `PUT /profile`?
> **Model Answer**:  
> *"Sir, in RESTful API design, `PUT` represents a complete resource replacement, which would overwrite omitted fields with nulls. `PATCH` is designed for partial entity modifications, allowing students to update only their room number or phone without re-submitting their name, email, or password."*

#### Q5: What is the purpose of the `/refresh` endpoint?
> **Model Answer**:  
> *"Sir, access tokens are short-lived (24 hours) for security. When an access token expires while a student is using the portal, the frontend Axios interceptor automatically sends the 30-day refresh token to `/refresh` to obtain a fresh access token without interrupting the student's session."*

#### Q6: How does `send_otp_endpoint` work without an external Redis server?
> **Model Answer**:  
> *"Sir, it uses stateless HMAC tokens. The server generates a 6-digit OTP and packages an HMAC-SHA256 signature of `(email, otp)` into a 10-minute signed token returned to the client. When the client submits their OTP to `/verify-otp`, the server verifies the cryptographic signature statelessly without requiring an external Redis cache."*

#### Q7: What role is required to call `POST /purge-tickets`?
> **Model Answer**:  
> *"Sir, only `SUPER_ADMIN` (the Institute Directorate). Line 258 guards the endpoint with `Depends(require_roles(['SUPER_ADMIN']))`. If any other user tries to call it, FastAPI halts the request immediately with HTTP 403 Forbidden."*

#### Q8: What HTTP status code is returned when a student registers successfully?
> **Model Answer**:  
> *"Sir, line 133 specifies `status_code=status.HTTP_201_CREATED`, adhering to REST standards which dictate that successful resource creation must return HTTP 201 rather than generic HTTP 200."*

#### Q9: What happens when an invalid `user_id` is passed to `DELETE /admins/{user_id}`?
> **Model Answer**:  
> *"Sir, if the integer ID does not exist in the database, `delete_admin_user` returns `False`, causing the endpoint to raise an HTTP `404 Not Found` error explaining that the staff account was not found."*

#### Q10: How does `GET /config` assist the frontend during local development?
> **Model Answer**:  
> *"Sir, `GET /config` returns `google_sso_enabled: bool`. If a developer runs the project locally without setting up Google Cloud API keys, `google_sso_enabled` returns `False`, signaling the React frontend to cleanly hide the Google login button without throwing JavaScript runtime errors."*

---

## Quick Viva Summary Table

| HTTP Method | Route URL | Function Name | Role Required | What it does |
| :--- | :--- | :--- | :--- | :--- |
| **`GET`** | `/config` | `get_auth_config` | Public | Returns Google Client ID & domain restrictions |
| **`POST`** | `/send-otp` | `send_otp_endpoint` | Public | Generates 6-digit OTP & stateless challenge token |
| **`POST`** | `/verify-otp` | `verify_otp_endpoint` | Public | Verifies submitted OTP against challenge token |
| **`POST`** | `/login` | `login` | Public | Validates email/password and returns JWT tokens |
| **`POST`** | `/google` | `google_sso` | Public | Verifies Google Workspace SSO (`@iiitnr.edu.in`) |
| **`POST`** | `/register` | `register` | Public | Creates student account with bcrypt hash (201 Created) |
| **`POST`** | `/refresh` | `refresh_session` | Public | Exchanges refresh token for new 24-hour access token |
| **`POST`** | `/logout` | `logout_endpoint` | Public | Signals browser to clear stored tokens |
| **`POST`** | `/change-password` | `update_password` | Any Authenticated | Validates current password and updates hash |
| **`PATCH`** | `/profile` | `update_profile_endpoint` | Any Authenticated | Partial update of hostel, room, or phone number |
| **`GET`** | `/me` | `get_me` | Any Authenticated | Returns current profile from Bearer token |
| **`GET`** | `/admins` | `get_admins` | Admin / Super Admin | Lists administrative staff and squad leads |
| **`POST`** | `/admins` | `create_admin` | Super Admin Only | Appoints new facility admin or tech lead (201) |
| **`DELETE`**| `/admins/{user_id}`| `remove_admin` | Super Admin Only | Revokes administrative staff account (404 if missing) |
| **`POST`** | `/purge-tickets` | `purge_tickets_endpoint` | Super Admin Only | Clears all complaints during semester reset |
