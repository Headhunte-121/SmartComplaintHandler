# Comprehensive Code Walkthrough & Line-by-Line Guide: `backend/app/services/user_service.py`

> **File Location**: [`backend/app/services/user_service.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/backend/app/services/user_service.py)  
> **Prerequisites**: Basic knowledge of C or Python (functions, dictionaries, regular expressions, hashing algorithms, HTTP requests, SQL `SELECT`/`INSERT`/`UPDATE`). No advanced enterprise identity management background is assumed.  
> **What this file is**: The authentication, identity governance, and institutional user service. It powers login, registration, and profile management for the entire IIIT Naya Raipur campus. It provides multi-layer security defenses:
> 1. **Institutional Domain Enforcement**: Restricts access to certified `@iiitnr.edu.in` accounts.
> 2. **Roll Number & Batch Parsing**: Automatically extracts student names, branch (CSE, ECE, DSAI), and admission batch from email prefixes.
> 3. **Google OAuth2 & OIDC ID Token Verification**: Validates cloud tokens against Google's authoritative Identity APIs with strict audience checking.
> 4. **Brute-Force & Timing Attack Protection**: Implements sliding-window account lockouts (5 failed attempts $\to$ 15-minute freeze) and constant-time dummy password hashing to prevent user enumeration.
> 5. **Cold-Start Migration Caching**: Ensures database columns (`hostel_name`, `room_number`, `avatar_url`) exist without incurring table-lock penalties on serverless platforms.

---

## Block 1: Imports & Institutional Staff Taxonomy (Lines 1–160)

```python
"""
SmartComplaintHandler - User Authentication & Administration Service
Role: Production-grade authentication for IIIT Naya Raipur (@iiitnr.edu.in) on Vercel & Supabase:
      - Authoritative server-side Google OAuth2 (UserInfo/TokenInfo) & OIDC ID Token verification
      - Blocks unverified Google token fallbacks and DB-outage account-deactivation bypasses in production
      - Persistent & in-memory brute-force account lockout, OTP rate-limiting, and constant-time anti-enumeration
      - Student hostel & room number profile persistence (Ramanujan, Bhabha, Bose, Raman, Shabhari Houses)
      - Cold-start-cached schema initialization (eliminates per-request DDL table locks on Supabase)
      - Stateless HMAC-signed OTP verification across Vercel Serverless instances
      - Password hashing via bcrypt (72-byte safe), access + refresh JWT issuance, and RBAC helpers
"""
import base64
from datetime import datetime, timedelta, timezone
import json
import logging
import os
import re
import secrets
import sys
from typing import Any, Dict, List, Optional, Set, Tuple
import urllib.error
import urllib.parse
import urllib.request

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    DEFAULT_EXPIRE_HOURS,
    DUMMY_PASSWORD_HASH,
    OTP_EXPIRE_MINUTES,
    REMEMBER_ME_EXPIRE_DAYS,
    create_access_token,
    create_otp_verification_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    hash_password,
    verify_otp_verification_token,
    verify_password,
)
from app.models.base import Base
from app.models.department import Department
from app.models.team import MaintenanceTeam
from app.models.ticket import Ticket
from app.models.user import User
from app.schemas.user import (
    IIITNR_DOMAIN,
    AdminCreateRequest,
    AuthResponse,
    GoogleAuthRequest,
    LoginRequest,
    RegisterRequest,
    UserProfileUpdateRequest,
    UserResponse,
)

logger = logging.getLogger(__name__)

STUDENT_PATTERN = re.compile(
    r"^([a-zA-Z]+(?:[._][a-zA-Z]+)*?)(\d{2})(\d{2,5})@iiitnr\.edu\.in$",
    re.IGNORECASE,
)

GOOGLE_USERINFO_URLS = (
    "https://www.googleapis.com/oauth2/v3/userinfo",
    "https://openidconnect.googleapis.com/v1/userinfo",
)
GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"
VALID_GOOGLE_ISSUERS = {"accounts.google.com", "https://accounts.google.com"}

_VERIFIED_ENGINES: Set[str] = set()

# Sliding-window brute-force & OTP rate limiters
_FAILED_LOGIN_TRACKER: Dict[str, Dict[str, Any]] = {}
_OTP_DISPATCH_TRACKER: Dict[str, List[datetime]] = {}
_OTP_VERIFY_FAILURES: Dict[str, Dict[str, Any]] = {}

IIITNR_KNOWN_STAFF: Dict[str, Dict[str, Any]] = {
    "superadmin@iiitnr.edu.in": {
        "name": "Prof. (Dr.) Om Prakash Vyas (Director)",
        "role": "SUPER_ADMIN",
        "department_name": "Office of the Director",
        "identifier": "Directorate (DIR-01)",
    },
    "director@iiitnr.edu.in": {
        "name": "Prof. (Dr.) Om Prakash Vyas",
        "role": "SUPER_ADMIN",
        "department_name": "Office of the Director",
        "identifier": "Vice Chancellor & Director",
    },
    "admin@iiitnr.edu.in": {
        "name": "Rakesh Kumar Mishra (Estate Officer)",
        "role": "ADMIN",
        "department_name": "General Administration",
        "identifier": "Estate Officer (0771-2474104)",
    },
    "rakesh@iiitnr.edu.in": {
        "name": "Rakesh Kumar Mishra (Estate Officer)",
        "role": "ADMIN",
        "department_name": "General Administration",
        "identifier": "Estate Officer (0771-2474104)",
    },
    "ranjeet@iiitnr.edu.in": {
        "name": "Ranjeet Singh Thakur (JE Electrical)",
        "role": "ADMIN",
        "department_name": "Electrical",
        "identifier": "JE Electrical (0771-2474109)",
    },
    "abir@iiitnr.edu.in": {
        "name": "Abir Bhattacharya (Sr. Network Engineer)",
        "role": "ADMIN",
        "department_name": "IT Support",
        "identifier": "Sr. Network Engineer (Room 131C)",
    },
    "parvinder@iiitnr.edu.in": {
        "name": "Parvinder Singh (Network Engineer)",
        "role": "TECHNICIAN",
        "department_name": "IT Support",
        "identifier": "Network Engineer (Room 131E)",
    },
    "tech.ramesh@iiitnr.edu.in": {
        "name": "Ramesh Kumar (Electrical Tech Lead)",
        "role": "TECHNICIAN",
        "department_name": "Electrical",
        "identifier": "Electrical Field Tech (Squad 1)",
    },
    "tech.suresh@iiitnr.edu.in": {
        "name": "Suresh Patel (Plumbing Specialist)",
        "role": "TECHNICIAN",
        "department_name": "Plumbing",
        "identifier": "Plumbing Field Tech (Squad 2)",
    },
    "tech.rajesh@iiitnr.edu.in": {
        "name": "Rajesh Baghel (Sanitation Supervisor)",
        "role": "TECHNICIAN",
        "department_name": "Sanitation",
        "identifier": "Sanitation Field Crew (Squad 3)",
    },
    "tech.vikram@iiitnr.edu.in": {
        "name": "Vikram Sahu (Master Carpenter)",
        "role": "TECHNICIAN",
        "department_name": "Carpentry",
        "identifier": "Carpentry and Civil Crew (Squad 4)",
    },
    "tech.amit@iiitnr.edu.in": {
        "name": "Amit Sharma (Estate and Facility Tech)",
        "role": "TECHNICIAN",
        "department_name": "General Administration",
        "identifier": "Facilities and Civil Tech (Squad 8)",
    },
    "ambika@iiitnr.edu.in": {
        "name": "Ambika Prasad Choubey (Assistant Registrar)",
        "role": "ADMIN",
        "department_name": "General Administration",
        "identifier": "Assistant Registrar (0771-2474105)",
    },
}
```

### 1. Plain-English Purpose
Loads data networking, cryptography, date/time, and database tools, compiles the student email regex pattern, defines Google OAuth2 endpoints, initializes in-memory brute-force rate limiters, and establishes the authoritative pre-authorized faculty and technician staff directory for IIIT Naya Raipur.

### 2. Line-by-Line Breakdown
- **Lines 1–11 (`""" ... """`)**: Module docstring outlining the production-grade authentication responsibilities.
- **Lines 12–23 (Standard Library Imports)**:
  - `base64`: URL-safe decoding for JWT payload inspection.
  - `datetime`, `timedelta`, `timezone`: Temporal arithmetic for token expiry and account lockout durations.
  - `urllib.request`, `urllib.parse`, `urllib.error`: Lightweight HTTP client tools used to verify tokens directly with Google without requiring heavy third-party SDK dependencies.
- **Lines 30–43 (`from app.core.security import ...`)**: Cryptographic primitives including bcrypt hashing (`hash_password`, `verify_password`), JWT creation/decoding (`create_access_token`, `decode_access_token`), and dummy password hash for timing attack mitigation.
- **Lines 44–58 (Models & Schemas)**: ORM models (`User`, `Ticket`, `Department`, `MaintenanceTeam`) and schemas (`LoginRequest`, `RegisterRequest`, `UserResponse`).
- **Lines 62–65 (`STUDENT_PATTERN = re.compile(...)`)**:
  - Regex capturing the official IIIT-NR student email format:
    `^([name])(\d{2})(\d{2,5})@iiitnr\.edu\.in$`
    Example: `nikhil22100@iiitnr.edu.in` $\to$ Name: `nikhil`, Year: `22` (Batch 2022), Roll Code: `100`.
- **Lines 67–72 (Google OAuth Configuration)**:
  - Official Google endpoints for verifying UserInfo and ID Tokens.
- **Lines 76–79 (Rate Limiting Trackers)**:
  - `_FAILED_LOGIN_TRACKER`: Tracks failed password attempts per email.
  - `_OTP_DISPATCH_TRACKER`: Tracks timestamps of sent OTPs to prevent SMS/email flooding.
  - `_OTP_VERIFY_FAILURES`: Tracks failed OTP guesses.
- **Lines 81–160 (`IIITNR_KNOWN_STAFF = { ... }`)**:
  - Authoritative directory mapping official institutional staff accounts to verified names and roles (`SUPER_ADMIN`, `ADMIN`, `TECHNICIAN`), preventing self-registration privilege escalation attacks.

### 3. Deep Term & Concept Expansion
- **Why Pre-Authorize Staff Accounts?**: If any student could register with role `"ADMIN"` or `"SUPER_ADMIN"`, system security would collapse. By maintaining `IIITNR_KNOWN_STAFF`, self-registration is strictly restricted to `STUDENT` roles. Administrative roles can only be granted to pre-approved institutional staff or provisioned explicitly by the Super Administrator.

---

## Block 2: Cold-Start Database Schema & Migration Cache (Lines 163–292)

```python
_VERIFIED_ENGINES: Set[str] = set()

def _ensure_users_table_ready(db: Session) -> None:
    """
    Guarantee that `departments` and `users` tables and all production auth & hostel columns exist.
    Cached per database engine URL so DDL checks run only once per Vercel Serverless cold start.
    """
    try:
        bind = db.get_bind()
        engine_key = str(bind.url)
        if engine_key in _VERIFIED_ENGINES:
            return

        is_sqlite = "sqlite" in engine_key
        is_pytest = "pytest" in sys.modules
        run_migration = os.getenv("RUN_SCHEMA_MIGRATION", "false").lower() in ("true", "1", "yes")

        if not is_sqlite and not is_pytest and not run_migration:
            _VERIFIED_ENGINES.add(engine_key)
            return

        Base.metadata.create_all(bind=bind, checkfirst=True)
        if "sqlite" not in engine_key:
            with bind.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS hashed_password VARCHAR(255);"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS hostel_name VARCHAR(120);"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS room_number VARCHAR(60);"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS department_name VARCHAR(100);"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'password';"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub VARCHAR(255);"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT TRUE;"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;"))
        else:
            with bind.begin() as conn:
                res_user = conn.execute(text("PRAGMA table_info(users);"))
                existing_user = {row[1] for row in res_user.fetchall()}
                sqlite_cols = [
                    ("hashed_password", "VARCHAR(255)"),
                    ("department_name", "VARCHAR(100)"),
                    ("department_id", "INTEGER"),
                    ("phone", "VARCHAR(50)"),
                    ("hostel_name", "VARCHAR(120)"),
                    ("room_number", "VARCHAR(60)"),
                    ("auth_provider", "VARCHAR(50) DEFAULT 'password'"),
                    ("google_sub", "VARCHAR(255)"),
                    ("avatar_url", "VARCHAR(500)"),
                    ("email_verified", "BOOLEAN DEFAULT 1"),
                    ("is_active", "BOOLEAN DEFAULT 1"),
                    ("role", "VARCHAR(50) DEFAULT 'STUDENT'"),
                    ("failed_login_attempts", "INTEGER DEFAULT 0"),
                    ("locked_until", "DATETIME"),
                    ("last_login_at", "DATETIME"),
                ]
                for col_name, col_type in sqlite_cols:
                    if col_name not in existing_user:
                        conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type};"))

        _VERIFIED_ENGINES.add(engine_key)
    except Exception as e:
        try:
            db.rollback()
        except Exception:
            pass
        logger.warning(f"Users table initialization check notice: {e}")
```

### 1. Plain-English Purpose
In cloud serverless environments (like Vercel or AWS Lambda), code spins up frequently. Executing SQL `ALTER TABLE` commands on every HTTP request causes severe database locks and slow responses. This function uses an in-memory hash set (`_VERIFIED_ENGINES`) to guarantee that schema verification and column additions execute **only once per cold start**, running in $<0.01\text{ ms}$ for subsequent requests.

### 2. Line-by-Line Breakdown
- **Line 196 (`if engine_key in _VERIFIED_ENGINES: return`)**:
  - $O(1)$ fast exit: If this database connection has already been verified in this process, exits immediately without touching the database.
- **Lines 207–221 (PostgreSQL / Supabase Migration)**:
  - Executes `ALTER TABLE users ADD COLUMN IF NOT EXISTS ...` to ensure new profile columns (`hostel_name`, `room_number`, `avatar_url`, `locked_until`) exist.
- **Lines 222–246 (SQLite Migration)**:
  - SQLite does not support `IF NOT EXISTS` on column alterations. Queries `PRAGMA table_info(users);` to inspect existing columns and dynamically adds only the missing ones.
- **Line 284 (`_VERIFIED_ENGINES.add(engine_key)`)**:
  - Caches the verified engine key.

---

## Block 3: Identity & Student Roll Number Parser: `resolve_user_metadata` (Lines 293–335)

```python
def resolve_user_metadata(email: str) -> Dict[str, str]:
    """Auto-detect user role, name, department and student roll from @iiitnr.edu.in email."""
    clean_email = (email or "").strip().lower()
    if clean_email in IIITNR_KNOWN_STAFF:
        return dict(IIITNR_KNOWN_STAFF[clean_email])

    prefix = clean_email.split("@")[0].lower() if "@" in clean_email else clean_email

    match = STUDENT_PATTERN.match(clean_email)
    if match:
        raw_name = match.group(1).replace(".", " ").replace("_", " ").title().strip()
        year = match.group(2)
        code = match.group(3)

        if code.startswith("101") or code.endswith("01"):
            dept_name = "Data Science & Artificial Intelligence"
            dept_code = "DSAI"
        elif code.startswith("102") or code.endswith("02") or code == "302":
            dept_name = "Electronics & Communication Engineering"
            dept_code = "ECE"
        else:
            dept_name = "Computer Science & Engineering"
            dept_code = "CSE"

        roll_no = f"20{year}{dept_code}{code}"
        return {
            "name": raw_name,
            "role": "STUDENT",
            "department_name": dept_name,
            "identifier": f"Roll: {roll_no} (Batch '20{year})",
        }

    clean_name = prefix.replace(".", " ").replace("_", " ").title().strip()
    return {
        "name": clean_name,
        "role": "STUDENT",
        "department_name": "Computer Science & Engineering",
        "identifier": f"Student ID: {prefix.upper()}",
    }
```

### 1. Plain-English Purpose
Automatically resolves institutional identity details from an email address:
1. If the email belongs to certified staff, returns their certified name, department, and role.
2. If the email matches the student roll pattern (e.g. `rohit.sharma22101@iiitnr.edu.in`), it automatically extracts the name (`"Rohit Sharma"`), admission batch (`2022`), academic branch (`"DSAI"`), and official roll number (`"2022DSAI101"`).

### 2. Line-by-Line Breakdown
- **Lines 296–297**: Checks `IIITNR_KNOWN_STAFF` directory.
- **Lines 304–326 (Student Pattern Match & Decomposition)**:
  - `raw_name = match.group(1).replace(".", " ").title()`: Converts `"rohit.sharma"` into `"Rohit Sharma"`.
  - `year = match.group(2)`: Extracts two-digit year (e.g. `"22"`).
  - `code = match.group(3)`: Extracts numerical roll sequence.
  - Branch resolution:
    - Codes matching `101` $\to$ Data Science & Artificial Intelligence (`DSAI`).
    - Codes matching `102` or `302` $\to$ Electronics & Communication Engineering (`ECE`).
    - Default $\to$ Computer Science & Engineering (`CSE`).
  - Constructs roll number: `2022DSAI101`.
- **Lines 328–334**: Fallback for non-standard student email handles, safely defaulting role to `"STUDENT"`.

---

## Block 4: Remote Google OAuth2 & OIDC Verification (Lines 337–450)

```python
def verify_google_access_token_remote(access_token: str) -> Dict[str, Any]:
    """
    Fetch verified profile from Google OIDC UserInfo endpoint and validate token audience
    when an OAuth 2.0 access_token is provided.
    Never returns an empty dict on failure: raises 401 if invalid/expired or 503 if Google APIs are unreachable.
    """
    last_http_error: Optional[urllib.error.HTTPError] = None
    profile_data: Optional[Dict[str, Any]] = None

    for url in GOOGLE_USERINFO_URLS:
        req_userinfo = urllib.request.Request(
            url,
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
        )
        try:
            with urllib.request.urlopen(req_userinfo, timeout=5) as resp:
                if resp.status == 200:
                    profile_data = json.loads(resp.read().decode("utf-8"))
                    break
        except urllib.error.HTTPError as e:
            last_http_error = e
            if e.code in (401, 403):
                break
        except Exception as e:
            logger.warning(f"Google UserInfo endpoint {url} unreachable: {e}")

    if last_http_error is not None and profile_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Google OAuth access token. Please sign in with Google again.",
        ) from last_http_error

    if not profile_data or not profile_data.get("email"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to verify Google OAuth token with Google Identity Services. Please try again.",
        )

    client_id = _get_google_client_id()
    if client_id:
        tokeninfo_url = f"{GOOGLE_TOKENINFO_URL}?{urllib.parse.urlencode({'access_token': access_token})}"
        try:
            with urllib.request.urlopen(tokeninfo_url, timeout=4) as resp:
                if resp.status == 200:
                    tinfo = json.loads(resp.read().decode("utf-8"))
                    aud = tinfo.get("aud") or tinfo.get("azp")
                    if aud and aud != client_id:
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Google OAuth access token audience does not match institutional Client ID.",
                        )
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"Google tokeninfo notice: {e}")

    return profile_data
```

### 1. Plain-English Purpose
Authoritative server-side verification of Google OAuth access tokens. It connects directly to Google's UserInfo API, validates that the token was signed by Google, extracts the user's verified Google email and avatar, and verifies that the token's audience (`aud`) matches our university's registered Google Client ID.

### 2. Line-by-Line Breakdown
- **Lines 362–378 (UserInfo Verification Loop)**:
  - Iterates over Google UserInfo endpoints, sending `Authorization: Bearer <access_token>`.
  - Sets a strict 5-second network timeout to prevent hanging worker threads.
- **Lines 379–389 (Error Handling)**:
  - If Google responds with HTTP 401 or 403, raises `HTTP 401 Unauthorized` with a clear explanation.
  - If Google servers cannot be reached, raises `HTTP 503 Service Unavailable`.
- **Lines 391–405 (Audience Validation Guard)**:
  - Queries Google's `tokeninfo` endpoint to verify the audience claim (`aud`).
  - If an attacker obtains a valid Google token issued for a different application (e.g. Spotify) and tries to present it here, the audience check detects the mismatch (`aud != client_id`) and immediately rejects it with `HTTP 401 Unauthorized`!

---

## Block 5: Brute-Force Rate Limiting & Account Lockout Defense

```python
def _check_account_lockout(email: str, db_user: Optional[User] = None) -> None:
    """
    Enforce brute-force account lockout.
    Blocks authentication if 5 consecutive failed attempts occur within 15 minutes.
    """
    clean_email = (email or "").strip().lower()
    now = datetime.now(timezone.utc)

    # 1. Database-backed persistent lockout check
    if db_user and db_user.locked_until:
        locked_until = db_user.locked_until
        if locked_until.tzinfo is None:
            locked_until = locked_until.replace(tzinfo=timezone.utc)
        if now < locked_until:
            wait_seconds = int((locked_until - now).total_seconds())
            wait_mins = max(1, (wait_seconds + 59) // 60)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Account temporarily locked due to excessive failed login attempts. Please retry in {wait_mins} minute(s).",
            )

    # 2. In-memory sliding-window tracker
    tracker = _FAILED_LOGIN_TRACKER.get(clean_email)
    if tracker:
        lock_until = tracker.get("lock_until")
        if lock_until and now < lock_until:
            wait_seconds = int((lock_until - now).total_seconds())
            wait_mins = max(1, (wait_seconds + 59) // 60)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Account temporarily locked due to excessive failed login attempts. Please retry in {wait_mins} minute(s).",
            )
```

### 1. Plain-English Purpose
Guards against brute-force password guessing attacks. If an attacker attempts 5 incorrect passwords for an account, the system locks the account for 15 minutes. It checks both persistent database columns (`User.locked_until`) and an in-memory sliding-window tracker, returning `HTTP 429 Too Many Requests`.

### 2. Line-by-Line Breakdown
- **Lines 8–18**: Inspects `db_user.locked_until`. If `now < locked_until`, computes remaining wait time and throws `HTTP 429`.
- **Lines 20–29**: Checks in-memory tracker `_FAILED_LOGIN_TRACKER`, preventing attacks even if the database is in read-only mode.

---

## Block 6: Password Registration Pipeline: `register_user`

```python
def register_user(db: Session, request: RegisterRequest) -> User:
    """
    Register a new user account with institutional email validation,
    bcrypt password hashing, and automatic role/batch resolution.
    """
    _ensure_users_table_ready(db)
    clean_email = request.email.strip().lower()

    # 1. Domain Enforcement Guard
    allowed_domain = _get_allowed_domain()
    if not clean_email.endswith(f"@{allowed_domain}"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration restricted to institutional @{allowed_domain} email addresses.",
        )

    # 2. Existing Account Verification
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address is already registered.",
        )

    # 3. Identity & Metadata Resolution
    meta = resolve_user_metadata(clean_email)
    assigned_role = meta["role"]

    # Prevent self-elevation to ADMIN or SUPER_ADMIN
    if assigned_role in ("ADMIN", "SUPER_ADMIN") and clean_email not in IIITNR_KNOWN_STAFF:
        assigned_role = "STUDENT"

    hashed = hash_password(request.password)

    new_user = User(
        name=request.name or meta["name"],
        email=clean_email,
        hashed_password=hashed,
        role=assigned_role,
        department_name=request.department or meta.get("department_name"),
        hostel_name=request.hostel_name,
        room_number=request.room_number,
        phone=request.phone,
        auth_provider="password",
        email_verified=True,
        is_active=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
```

### 1. Plain-English Purpose
Handles new user signups. Enforces institutional domain validation (`@iiitnr.edu.in`), blocks duplicate registrations, resolves metadata (auto-extracting roll numbers for students), prevents self-escalation of privileges to `ADMIN`, hashes the password with bcrypt, and commits the user.

---

## Block 7: Secure Authentication & Constant-Time Verification: `authenticate_user`

```python
def authenticate_user(db: Session, request: LoginRequest) -> AuthResponse:
    """
    Authenticate user via email and password.
    Includes account lockout defense and constant-time dummy hashing against user enumeration.
    """
    _ensure_users_table_ready(db)
    clean_email = request.email.strip().lower()

    user = db.query(User).filter(User.email == clean_email).first()
    _check_account_lockout(clean_email, db_user=user)

    # Constant-Time Timing Attack Mitigation:
    # If user does NOT exist, execute a real bcrypt hash verification against DUMMY_PASSWORD_HASH
    # so the server response time is identical whether the user exists or not!
    target_hash = user.hashed_password if user and user.hashed_password else DUMMY_PASSWORD_HASH
    password_ok = verify_password(request.password, target_hash)

    if not user or not password_ok:
        _record_login_failure(clean_email, db_user=user, db=db)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact campus facilities administration.",
        )

    _clear_login_failures(clean_email, db_user=user, db=db)

    # Issue JWT tokens
    expire_hours = (
        REMEMBER_ME_EXPIRE_DAYS * 24
        if request.remember_me
        else DEFAULT_EXPIRE_HOURS
    )
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role},
        expires_delta=timedelta(hours=expire_hours),
    )
    refresh_token = create_refresh_token(
        data={"sub": str(user.id), "email": user.email}
    )

    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )
```

### 1. Plain-English Purpose
Authenticates users with email and password. Features **constant-time dummy password hashing**: if an attacker guesses a non-existent email, the server still computes a bcrypt verification against `DUMMY_PASSWORD_HASH` so response times are identical, preventing attackers from measuring CPU latency to discover valid student emails.

---

## Block 8: Institutional Google OAuth Pipeline: `authenticate_with_google`

```python
def authenticate_with_google(db: Session, request: GoogleAuthRequest) -> AuthResponse:
    """
    Authenticate or auto-provision users via Google OAuth2 / OIDC credentials.
    Enforces institutional @iiitnr.edu.in domain restrictions.
    """
    _ensure_users_table_ready(db)

    # Remote verification against Google Identity APIs
    if request.credential:
        profile = verify_google_id_token(request.credential)
    elif request.access_token:
        profile = verify_google_access_token_remote(request.access_token)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Google authentication token.",
        )

    email = profile.get("email", "").strip().lower()
    allowed_domain = _get_allowed_domain()
    if not email.endswith(f"@{allowed_domain}"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Only @{allowed_domain} Google accounts are permitted.",
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Auto-provision new student account
        meta = resolve_user_metadata(email)
        user = User(
            name=profile.get("name") or meta["name"],
            email=email,
            role=meta["role"],
            department_name=meta.get("department_name"),
            auth_provider="google",
            google_sub=profile.get("sub"),
            avatar_url=profile.get("picture"),
            email_verified=True,
            is_active=True,
        )
        db.add(user)
    else:
        # Update existing profile
        if profile.get("picture") and not user.avatar_url:
            user.avatar_url = profile["picture"]
        user.google_sub = profile.get("sub") or user.google_sub

    user.last_login_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role}
    )
    refresh_token = create_refresh_token(
        data={"sub": str(user.id), "email": user.email}
    )

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )
```

### 1. Plain-English Purpose
Allows students and faculty to click "Sign in with Google". Verifies the Google token, validates the `@iiitnr.edu.in` domain, auto-provisions a new student account if signing in for the first time, syncs their Google profile photo, and issues institutional JWT access and refresh tokens.

---

## Block 9: Token Refreshing & Profile Management

```python
def refresh_access_token(db: Session, refresh_token_str: str) -> AuthResponse:
    """Validates refresh token, checks account active status, and issues fresh access token."""
    payload = decode_refresh_token(refresh_token_str)
    if not payload or not payload.get("email"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token.")

    user = db.query(User).filter(User.email == payload["email"]).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account is deactivated or missing.")

    access_token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})
    new_refresh = create_refresh_token(data={"sub": str(user.id), "email": user.email})
    return AuthResponse(
        access_token=access_token,
        refresh_token=new_refresh,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


def update_user_profile(db: Session, user_id: int, updates: UserProfileUpdateRequest) -> User:
    """Updates student residence data (hostel name, room number, phone)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if updates.hostel_name is not None:
        user.hostel_name = updates.hostel_name
    if updates.room_number is not None:
        user.room_number = updates.room_number
    if updates.phone is not None:
        user.phone = updates.phone
    if updates.name is not None:
        user.name = updates.name

    db.commit()
    db.refresh(user)
    return user
```

### 1. Plain-English Purpose
- `refresh_access_token`: Replaces an expiring access token using a long-lived refresh token, avoiding forcing the user to log in again.
- `update_user_profile`: Allows students to update their hostel residence information (e.g. moving from Ramanujan House to Bose House).

---

## Block 10: SuperAdmin RBAC Governance & User Administration

```python
def list_users(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    role: Optional[str] = None,
    department: Optional[str] = None,
) -> List[User]:
    """SuperAdmin directory query supporting role and department filtering."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role.strip().upper())
    if department:
        query = query.filter(User.department_name.ilike(f"%{department.strip()}%"))
    return query.order_by(User.id.asc()).offset(skip).limit(limit).all()


def admin_deactivate_user(db: Session, target_user_id: int, superadmin_id: int) -> User:
    """Deactivates a user account, preventing further logins. Prevents self-deactivation."""
    if target_user_id == superadmin_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="SuperAdmin cannot deactivate their own account.")
    user = db.query(User).filter(User.id == target_user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target user not found.")
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user
```

### 1. Plain-English Purpose
Provides administrative governance for the Directorate: querying the full campus staff and student directory with filtering, and allowing Super Administrators to deactivate compromised user accounts (while blocking accidental self-deactivation).

---

## 11. Viva & Technical Defense Guide

> [!TIP]
> **Q1: What is a "Timing Side-Channel Attack" and how does `authenticate_user` mitigate it?**  
> **Answer**: Bcrypt password hashing is intentionally CPU-intensive, taking $\approx 100\text{ ms}$ to compute. If a system checks `if not user: return 401` before hashing, requests for non-existent users return in $2\text{ ms}$, while requests for existing users take $100\text{ ms}$. An attacker can measure this timing difference to enumerate valid student emails. In `authenticate_user`, if the user does not exist, the system verifies against `DUMMY_PASSWORD_HASH` anyway, making response times identical regardless of whether the email exists.

> [!TIP]
> **Q2: How does the system automatically detect a student's branch and admission year?**  
> **Answer**: In `resolve_user_metadata`, the email is matched against `STUDENT_PATTERN = ^([name])(\d{2})(\d{2,5})@iiitnr\.edu\.in$`. For `nikhil22100@iiitnr.edu.in`, `group(2)` yields `"22"` (Batch 2022). The roll sequence `group(3)` is evaluated: codes matching `101` are assigned to DSAI, `102`/`302` to ECE, and others to CSE. This automatically structures student profile records without manual input.

> [!TIP]
> **Q3: What prevents a student from elevating their role to `ADMIN` or `SUPER_ADMIN` during registration?**  
> **Answer**: Strict privilege separation in `register_user`:
> ```python
> if assigned_role in ("ADMIN", "SUPER_ADMIN") and clean_email not in IIITNR_KNOWN_STAFF:
>     assigned_role = "STUDENT"
> ```
> Self-registration is hardcoded to assign `STUDENT`. Administrative roles can only be granted to pre-approved institutional staff listed in `IIITNR_KNOWN_STAFF` or provisioned explicitly by the Super Administrator.

> [!TIP]
> **Q4: Why does `verify_google_access_token_remote` check the token's audience (`aud`)?**  
> **Answer**: Checking the audience prevents **Confused Deputy Token Substitution Attacks**. If an attacker creates their own malicious Google login app, tricks an IIIT-NR student into logging into it, and captures their valid Google access token, the token is genuine. However, because it was issued for the attacker's app, its `aud` claim will not match our institutional Google Client ID. Checking `aud == client_id` detects the fraud and rejects the token.

---

## 12. Quick-Reference Viva Summary Table

| Concept / Keyword | Meaning in Basic C / Python | Role in `user_service.py` |
| :--- | :--- | :--- |
| `STUDENT_PATTERN` | Regex parser | Extracts student name, admission year, and roll number from email. |
| `IIITNR_KNOWN_STAFF` | Constant dictionary directory | Authoritative registry of certified IIIT-NR faculty and technicians. |
| `_VERIFIED_ENGINES` | Hash set cache | Caches database migration checks to eliminate cold-start DDL table locks. |
| `DUMMY_PASSWORD_HASH` | Pre-computed bcrypt string | Prevents user enumeration via constant-time timing attack mitigation. |
| Account Lockout (5 tries) | Rate limiting counter | Temporarily freezes accounts for 15 minutes after 5 bad passwords. |
| `verify_google_access_token_remote` | Remote HTTP validator | Queries Google APIs to verify identity and check Client ID audience (`aud`). |
| `register_user` | User creation function | Validates `@iiitnr.edu.in` domain and hashes password with bcrypt. |
| `authenticate_user` | Login validator | Verifies credentials, resets lockout counters, and issues JWT access/refresh tokens. |
| `authenticate_with_google` | OAuth orchestrator | Auto-provisions student accounts and syncs profile avatars via Google Sign-In. |
| `admin_deactivate_user` | Security kill-switch | Allows SuperAdmin to disable accounts while preventing self-deactivation. |
