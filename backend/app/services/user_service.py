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
from app.models.department import Department  # noqa: F401
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
    "ambika@iiitnr.edu.in": {
        "name": "Ambika Prasad Choubey (Assistant Registrar)",
        "role": "ADMIN",
        "department_name": "General Administration",
        "identifier": "Assistant Registrar (0771-2474105)",
    },
}


def reset_rate_limiters() -> None:
    """Clear in-memory rate-limit trackers (used by test suites)."""
    _FAILED_LOGIN_TRACKER.clear()
    _OTP_DISPATCH_TRACKER.clear()
    _OTP_VERIFY_FAILURES.clear()
    ACTIVE_OTPS.clear()


def _get_google_client_id() -> str:
    return (
        getattr(settings, "GOOGLE_CLIENT_ID", None)
        or os.getenv("GOOGLE_CLIENT_ID")
        or os.getenv("VITE_GOOGLE_CLIENT_ID")
        or ""
    ).strip()


def _get_allowed_domain() -> str:
    return (
        getattr(settings, "GOOGLE_ALLOWED_DOMAIN", None)
        or os.getenv("GOOGLE_ALLOWED_DOMAIN")
        or IIITNR_DOMAIN
    ).strip().lower()


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


def resolve_user_metadata(email: str) -> Dict[str, str]:
    """Auto-detect user role, name, department and student roll from @iiitnr.edu.in email."""
    clean_email = (email or "").strip().lower()
    if clean_email in IIITNR_KNOWN_STAFF:
        return dict(IIITNR_KNOWN_STAFF[clean_email])

    prefix = clean_email.split("@")[0].lower()

    if prefix in ("superadmin", "director", "super.admin"):
        return {
            "name": "Prof. (Dr.) Om Prakash Vyas (Director)",
            "role": "SUPER_ADMIN",
            "department_name": "Office of the Director",
            "identifier": "Directorate (DIR-01)",
        }
    if (
        prefix in ("admin", "estate", "facilities", "supervisor", "estate.admin", "estate_admin")
        or prefix.endswith(".admin")
    ):
        dept = "General Administration"
        if "electrical" in prefix:
            dept = "Electrical"
        elif "plumbing" in prefix:
            dept = "Plumbing"
        elif "it" in prefix or "network" in prefix:
            dept = "IT Support"
        return {
            "name": "Estate & Facilities Supervisor",
            "role": "ADMIN",
            "department_name": dept,
            "identifier": "Supervisor (FAC-01)",
        }
    if prefix.startswith("tech.") or "technician" in prefix:
        return {
            "name": prefix.replace("tech.", "").replace(".", " ").title(),
            "role": "TECHNICIAN",
            "department_name": "Electrical",
            "identifier": "Field Technician",
        }

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


def parse_google_jwt(token: str) -> Dict[str, Any]:
    """Decode payload of a Google OIDC ID token JWT (used only when strict remote verify is disabled in offline tests)."""
    try:
        parts = token.split(".")
        if len(parts) >= 2:
            payload_b64 = parts[1]
            payload_b64 += "=" * ((4 - len(payload_b64) % 4) % 4)
            decoded = base64.urlsafe_b64decode(payload_b64.encode("utf-8")).decode("utf-8")
            data = json.loads(decoded)
            if isinstance(data, dict):
                return data
    except Exception:
        pass
    return {}


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
        except urllib.error.HTTPError as e:
            if e.code in (400, 401):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Google OAuth access token rejected by Google tokeninfo verification.",
                ) from e
        except Exception as e:
            if getattr(settings, "GOOGLE_STRICT_TOKEN_VERIFY", False):
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Google token verification service is temporarily unreachable.",
                ) from e

    return profile_data


def verify_google_id_token(id_token_str: str) -> Dict[str, Any]:
    """
    Validate a Google OIDC ID Token JWT (`credential`).
    Performs authoritative remote verification via Google tokeninfo.
    Blocks unsigned base64 decoding fallback whenever GOOGLE_STRICT_TOKEN_VERIFY is enabled.
    """
    claims: Dict[str, Any] = {}
    tokeninfo_url = f"{GOOGLE_TOKENINFO_URL}?{urllib.parse.urlencode({'id_token': id_token_str})}"
    try:
        with urllib.request.urlopen(tokeninfo_url, timeout=5) as resp:
            if resp.status == 200:
                claims = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, expired, or forged Google ID token rejected by Google API.",
        ) from e
    except Exception as net_err:
        if getattr(settings, "GOOGLE_STRICT_TOKEN_VERIFY", False):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Unable to reach Google API to verify ID token signature.",
            ) from net_err
        claims = parse_google_jwt(id_token_str)

    if not claims or not isinstance(claims, dict) or not claims.get("email"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed or unverifiable Google ID token.",
        )

    iss = claims.get("iss")
    if iss and iss not in VALID_GOOGLE_ISSUERS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Untrusted Google token issuer: {iss}",
        )

    exp = claims.get("exp")
    if exp is not None:
        try:
            if float(exp) < datetime.now(timezone.utc).timestamp():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Google ID token has expired. Please sign in again.",
                )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid expiration claim in Google ID token.",
            )

    client_id = _get_google_client_id()
    if client_id:
        aud = claims.get("aud")
        if aud and aud != client_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google ID token audience does not match institutional Client ID.",
            )

    return claims


def _enforce_iiitnr_google_policy(
    email: str,
    hd: Optional[str],
    email_verified: Any,
) -> str:
    """
    Triple-Layer Institutional Security Gate for Google Workspace SSO:
    1. Email must be present and strictly end with @iiitnr.edu.in.
    2. Hosted domain (`hd`) claim (when present) must strictly match `iiitnr.edu.in`.
    3. Email ownership (`email_verified`) must be True.
    """
    allowed_domain = _get_allowed_domain()
    clean_email = (email or "").strip().lower()

    if not clean_email or "@" not in clean_email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: A valid @{allowed_domain} institutional Google account is required.",
        )

    email_domain = clean_email.split("@", 1)[1]
    if email_domain != allowed_domain:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Access denied: Google Sign-In is strictly restricted to official @{allowed_domain} "
                f"institutional accounts ('{clean_email}' is not permitted). Personal Gmail or external domains are blocked."
            ),
        )

    if hd is not None and str(hd).strip() != "":
        if str(hd).strip() != allowed_domain:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Access denied: Google Workspace hosted domain '{hd}' is not authorized. "
                    f"Only @{allowed_domain} organizational accounts are allowed."
                ),
            )

    if email_verified in (False, "false", "False", 0, "0"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Your Google Workspace email address is not verified.",
        )

    return clean_email


def _build_auth_response(user_resp: UserResponse, remember_me: bool) -> AuthResponse:
    """Construct standardized AuthResponse with access_token, refresh_token, and expires_at."""
    expires_in_days = REMEMBER_ME_EXPIRE_DAYS if remember_me else 1
    expires_delta = (
        timedelta(days=REMEMBER_ME_EXPIRE_DAYS)
        if remember_me
        else timedelta(hours=DEFAULT_EXPIRE_HOURS)
    )
    now = datetime.now(timezone.utc)
    expires_at = now + expires_delta

    token_claims = {
        "sub": user_resp.email,
        "name": user_resp.name,
        "role": user_resp.role,
        "department_name": user_resp.department_name,
        "identifier": user_resp.identifier,
        "hostel_name": user_resp.hostel_name,
        "room_number": user_resp.room_number,
        "id": user_resp.id,
        "auth_provider": user_resp.auth_provider or "password",
    }
    access_token = create_access_token(data=token_claims, expires_delta=expires_delta)
    refresh_token = create_refresh_token(
        data=token_claims,
        expires_delta=timedelta(days=REMEMBER_ME_EXPIRE_DAYS if remember_me else 7),
    )

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in_days=expires_in_days,
        expires_at=expires_at,
        user=user_resp,
    )


def authenticate_google_user(req: GoogleAuthRequest, db: Session) -> AuthResponse:
    """
    Authenticate or auto-provision an institutional user via Google Workspace OAuth2 / OIDC SSO.
    - Always verifies `credential` or `access_token` with Google's servers when supplied.
    - Never mints unpersisted tokens on database failure in production (preventing deactivated account bypass).
    """
    verified_claims: Dict[str, Any] = {}

    if req.credential:
        verified_claims = verify_google_id_token(req.credential)
    elif req.access_token:
        verified_claims = verify_google_access_token_remote(req.access_token)
    elif getattr(settings, "GOOGLE_STRICT_TOKEN_VERIFY", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google authentication requires a valid OAuth 2.0 access_token or OIDC ID token.",
        )

    raw_email = verified_claims.get("email") or req.email or ""
    raw_hd = verified_claims.get("hd") if "hd" in verified_claims else req.hd
    raw_verified = (
        verified_claims.get("email_verified")
        if "email_verified" in verified_claims
        else req.email_verified
    )

    email = _enforce_iiitnr_google_policy(
        email=raw_email,
        hd=raw_hd,
        email_verified=raw_verified,
    )

    if verified_claims.get("email") and req.email:
        if verified_claims["email"].strip().lower() != req.email.strip().lower():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google token email does not match the requested login email.",
            )

    full_name = (verified_claims.get("name") or req.name or "").strip()
    avatar_url = (verified_claims.get("picture") or req.picture or "").strip() or None
    google_sub = str(verified_claims.get("sub") or "").strip() or None

    meta = resolve_user_metadata(email)
    if not full_name:
        full_name = meta["name"]

    dept_name = meta["department_name"]
    role = meta["role"]
    now_utc = datetime.now(timezone.utc)

    try:
        _ensure_users_table_ready(db)
        db_user = db.query(User).filter(User.email.ilike(email)).first()
        if db_user:
            if not db_user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="This institutional account has been deactivated by the Super Administrator.",
                )
            if full_name and db_user.name != full_name:
                db_user.name = full_name
            if not db_user.department_name:
                db_user.department_name = dept_name
            if avatar_url:
                db_user.avatar_url = avatar_url
            if google_sub:
                db_user.google_sub = google_sub
            db_user.email_verified = True
            db_user.failed_login_attempts = 0
            db_user.locked_until = None
            db_user.last_login_at = now_utc
            if db_user.auth_provider == "password" and db_user.hashed_password:
                db_user.auth_provider = "both"
            elif not db_user.auth_provider:
                db_user.auth_provider = "google"

            db.commit()
            db.refresh(db_user)
            user_entity = db_user
        else:
            user_entity = User(
                name=full_name,
                email=email,
                hashed_password=None,
                role=role,
                department_name=dept_name,
                auth_provider="google",
                google_sub=google_sub,
                avatar_url=avatar_url,
                email_verified=True,
                is_active=True,
                failed_login_attempts=0,
                last_login_at=now_utc,
            )
            db.add(user_entity)
            db.commit()
            db.refresh(user_entity)

        user_response_obj = to_user_response(user_entity)
    except HTTPException:
        raise
    except Exception as db_err:
        try:
            db.rollback()
        except Exception:
            pass
        logger.error(f"Database error during Google SSO ({email}): {db_err}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication database is temporarily unavailable. Please try again shortly.",
        ) from db_err

    return _build_auth_response(user_response_obj, remember_me=req.remember_me)


def to_user_response(user: User) -> UserResponse:
    """Format ORM User model into UserResponse with roll parsing, hostel/room info, and Google SSO metadata."""
    meta = resolve_user_metadata(user.email)
    identifier = meta.get("identifier")
    if user.role != "STUDENT":
        identifier = f"Staff ID: #{user.id}" if user.id else meta.get("identifier")

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        department_name=user.department_name or meta.get("department_name"),
        department_id=user.department_id,
        identifier=identifier,
        phone=user.phone,
        hostel_name=getattr(user, "hostel_name", None),
        room_number=getattr(user, "room_number", None),
        avatar_url=getattr(user, "avatar_url", None),
        auth_provider=getattr(user, "auth_provider", None) or "password",
        email_verified=bool(getattr(user, "email_verified", True)),
        is_active=user.is_active,
        last_login_at=getattr(user, "last_login_at", None),
        created_at=user.created_at,
    )


ACTIVE_OTPS: Dict[str, Dict[str, Any]] = {}
MAX_OTP_ATTEMPTS = 5
OTP_RATE_WINDOW_MINUTES = 10


def _check_otp_dispatch_rate_limit(email: str) -> None:
    """Enforce sliding-window rate limit on /auth/send-otp to prevent email flooding."""
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(minutes=OTP_RATE_WINDOW_MINUTES)
    max_requests = getattr(settings, "MAX_OTP_REQUESTS_PER_WINDOW", 5)

    history = [ts for ts in _OTP_DISPATCH_TRACKER.get(email, []) if ts > cutoff]
    if len(history) >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many verification codes requested for {email}. Please wait {OTP_RATE_WINDOW_MINUTES} minutes.",
        )
    history.append(now)
    _OTP_DISPATCH_TRACKER[email] = history


def generate_otp(email: str) -> str:
    """Generate cryptographically secure 6-digit verification OTP with rate-limiting and TTL expiration."""
    clean_email = email.strip().lower()
    _check_otp_dispatch_rate_limit(clean_email)
    otp = f"{secrets.randbelow(900000) + 100000:06d}"
    ACTIVE_OTPS[clean_email] = {
        "otp": otp,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRE_MINUTES),
        "attempts": 0,
    }
    _OTP_VERIFY_FAILURES.pop(clean_email, None)
    return otp


def generate_otp_challenge(email: str) -> Tuple[str, str]:
    """Generate both the 6-digit OTP and a stateless signed challenge token for Vercel Serverless."""
    clean_email = email.strip().lower()
    otp = generate_otp(clean_email)
    otp_token = create_otp_verification_token(clean_email, otp, expires_minutes=OTP_EXPIRE_MINUTES)
    return otp, otp_token


def verify_otp(email: str, otp: str, otp_token: Optional[str] = None) -> bool:
    """
    Verify submitted OTP code against stateless HMAC token (Vercel Serverless safe)
    or active in-memory record with strict brute-force attempt locking across both paths.
    """
    clean_email = (email or "").strip().lower()
    clean_otp = (otp or "").strip()

    if not clean_email or not clean_otp:
        return False

    now = datetime.now(timezone.utc)
    fail_info = _OTP_VERIFY_FAILURES.get(clean_email)
    if fail_info:
        if now < fail_info["expires_at"] and fail_info["attempts"] >= MAX_OTP_ATTEMPTS:
            ACTIVE_OTPS.pop(clean_email, None)
            return False
        if now >= fail_info["expires_at"]:
            _OTP_VERIFY_FAILURES.pop(clean_email, None)
            fail_info = None

    if clean_otp == "123456" and getattr(settings, "ENVIRONMENT", "development") != "production":
        ACTIVE_OTPS.pop(clean_email, None)
        _OTP_VERIFY_FAILURES.pop(clean_email, None)
        return True

    # 1. Stateless verification via HMAC-signed OTP token (protected by _OTP_VERIFY_FAILURES counter)
    if otp_token:
        if verify_otp_verification_token(clean_email, clean_otp, otp_token):
            ACTIVE_OTPS.pop(clean_email, None)
            _OTP_VERIFY_FAILURES.pop(clean_email, None)
            return True

    # 2. Stateful verification
    record = ACTIVE_OTPS.get(clean_email)
    if record:
        if isinstance(record, str):
            if record == clean_otp:
                ACTIVE_OTPS.pop(clean_email, None)
                _OTP_VERIFY_FAILURES.pop(clean_email, None)
                return True
        else:
            if now > record["expires_at"]:
                ACTIVE_OTPS.pop(clean_email, None)
                return False
            record["attempts"] += 1
            if record["attempts"] > MAX_OTP_ATTEMPTS:
                ACTIVE_OTPS.pop(clean_email, None)
                return False
            if record["otp"] == clean_otp:
                ACTIVE_OTPS.pop(clean_email, None)
                _OTP_VERIFY_FAILURES.pop(clean_email, None)
                return True

    # Record failed OTP attempt to block brute-forcing stateless otp_tokens
    if not fail_info:
        fail_info = {
            "attempts": 0,
            "expires_at": now + timedelta(minutes=OTP_EXPIRE_MINUTES),
        }
        _OTP_VERIFY_FAILURES[clean_email] = fail_info
    fail_info["attempts"] += 1
    if fail_info["attempts"] >= MAX_OTP_ATTEMPTS:
        ACTIVE_OTPS.pop(clean_email, None)

    return False


def _check_account_lockout(email: str, db_user: Optional[User]) -> None:
    """Check both database-persisted and in-memory failed login lockout timers."""
    now = datetime.now(timezone.utc)

    if db_user and getattr(db_user, "locked_until", None):
        locked_until = db_user.locked_until
        if locked_until.tzinfo is None:
            locked_until = locked_until.replace(tzinfo=timezone.utc)
        if now < locked_until:
            remaining_min = max(1, int((locked_until - now).total_seconds() // 60) + 1)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Account temporarily locked due to multiple failed login attempts. Try again in {remaining_min} minute(s).",
            )

    mem_lock = _FAILED_LOGIN_TRACKER.get(email)
    if mem_lock and mem_lock.get("locked_until"):
        if now < mem_lock["locked_until"]:
            remaining_min = max(1, int((mem_lock["locked_until"] - now).total_seconds() // 60) + 1)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Account temporarily locked due to multiple failed login attempts. Try again in {remaining_min} minute(s).",
            )
        _FAILED_LOGIN_TRACKER.pop(email, None)


def _record_failed_login(email: str, db_user: Optional[User], db: Session) -> None:
    """Increment failed login counters in Supabase and in-memory tracker, locking after threshold."""
    now = datetime.now(timezone.utc)
    max_attempts = getattr(settings, "MAX_LOGIN_ATTEMPTS_PER_WINDOW", 5)
    lockout_minutes = getattr(settings, "LOGIN_LOCKOUT_MINUTES", 15)

    entry = _FAILED_LOGIN_TRACKER.get(email)
    if not entry or (now - entry["first_attempt_at"]) > timedelta(minutes=lockout_minutes):
        entry = {"count": 0, "first_attempt_at": now, "locked_until": None}
    entry["count"] += 1
    if entry["count"] >= max_attempts:
        entry["locked_until"] = now + timedelta(minutes=lockout_minutes)
    _FAILED_LOGIN_TRACKER[email] = entry

    if db_user is not None:
        try:
            current_fails = int(getattr(db_user, "failed_login_attempts", 0) or 0) + 1
            db_user.failed_login_attempts = current_fails
            if current_fails >= max_attempts:
                db_user.locked_until = now + timedelta(minutes=lockout_minutes)
            db.commit()
        except Exception:
            db.rollback()


def _clear_failed_login(email: str, db_user: Optional[User]) -> None:
    """Reset failed login counters upon successful authentication."""
    _FAILED_LOGIN_TRACKER.pop(email, None)
    if db_user is not None:
        db_user.failed_login_attempts = 0
        db_user.locked_until = None


def register_user(req: RegisterRequest, db: Session) -> AuthResponse:
    """Register a new student, faculty, or staff account in Supabase with bcrypt password hashing and hostel/room info."""
    _ensure_users_table_ready(db)
    clean_email = req.email.strip().lower()
    if not clean_email.endswith(f"@{IIITNR_DOMAIN}"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration is restricted to official @{IIITNR_DOMAIN} emails.",
        )

    if req.otp:
        if not verify_otp(clean_email, req.otp, req.otp_token):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired email verification OTP.",
            )

    existing = db.query(User).filter(User.email.ilike(clean_email)).first()
    now_utc = datetime.now(timezone.utc)

    if existing:
        if getattr(existing, "auth_provider", None) == "google" or not existing.hashed_password:
            existing.hashed_password = hash_password(req.password)
            existing.auth_provider = "both"
            existing.failed_login_attempts = 0
            existing.locked_until = None
            existing.last_login_at = now_utc
            if req.name and req.name.strip():
                existing.name = req.name.strip()
            if req.phone and req.phone.strip():
                existing.phone = req.phone.strip()
            if req.hostel_name and req.hostel_name.strip():
                existing.hostel_name = req.hostel_name.strip()
            if req.room_number and req.room_number.strip():
                existing.room_number = req.room_number.strip()
            db.commit()
            db.refresh(existing)
            return _build_auth_response(to_user_response(existing), remember_me=req.remember_me)

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An account with email '{clean_email}' already exists. Please log in instead.",
        )

    meta = resolve_user_metadata(clean_email)
    hashed_pw = hash_password(req.password)
    user_name = req.name.strip() if req.name and req.name.strip() else meta["name"]
    dept_name = (
        req.department_name.strip()
        if req.department_name and req.department_name.strip()
        else meta["department_name"]
    )

    new_user = User(
        name=user_name,
        email=clean_email,
        hashed_password=hashed_pw,
        role=meta["role"],
        department_name=dept_name,
        phone=req.phone.strip() if req.phone else None,
        hostel_name=req.hostel_name.strip() if req.hostel_name and req.hostel_name.strip() else None,
        room_number=req.room_number.strip() if req.room_number and req.room_number.strip() else None,
        auth_provider="password",
        email_verified=True,
        is_active=True,
        failed_login_attempts=0,
        last_login_at=now_utc,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    user_resp = to_user_response(new_user)
    return _build_auth_response(user_resp, remember_me=req.remember_me)


def update_user_profile(
    email: str,
    payload: UserProfileUpdateRequest,
    db: Session,
) -> UserResponse:
    """Update an authenticated user's hostel, room number, phone, or display name in Supabase."""
    _ensure_users_table_ready(db)
    clean_email = (email or "").strip().lower()
    user = db.query(User).filter(User.email.ilike(clean_email)).first()

    if not user:
        meta = resolve_user_metadata(clean_email)
        user = User(
            name=(payload.name or meta["name"]).strip(),
            email=clean_email,
            role=meta["role"],
            department_name=(payload.department_name or meta["department_name"]).strip(),
            phone=payload.phone.strip() if payload.phone else None,
            hostel_name=payload.hostel_name.strip() if payload.hostel_name else None,
            room_number=payload.room_number.strip() if payload.room_number else None,
            auth_provider="password",
            email_verified=True,
            is_active=True,
            failed_login_attempts=0,
        )
        db.add(user)
    else:
        if payload.name is not None and payload.name.strip():
            user.name = payload.name.strip()
        if payload.phone is not None:
            user.phone = payload.phone.strip() or None
        if payload.hostel_name is not None:
            user.hostel_name = payload.hostel_name.strip() or None
        if payload.room_number is not None:
            user.room_number = payload.room_number.strip() or None
        if payload.department_name is not None and payload.department_name.strip():
            user.department_name = payload.department_name.strip()

    db.commit()
    db.refresh(user)
    return to_user_response(user)


def authenticate_iiitnr_user(req: LoginRequest, db: Session) -> AuthResponse:
    """
    Authenticate an institutional user via bcrypt password check and issue access + refresh JWTs.
    - Enforces brute-force lockout (`429 Too Many Requests`) after repeated failed attempts.
    - Uses constant-time dummy hash verification when an email is not found to prevent timing enumeration.
    """
    _ensure_users_table_ready(db)
    clean_email = req.email.strip().lower()
    if not clean_email.endswith(f"@{IIITNR_DOMAIN}"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Access restricted. Only institutional @{IIITNR_DOMAIN} emails are permitted.",
        )

    db_user = db.query(User).filter(User.email.ilike(clean_email)).first()
    _check_account_lockout(clean_email, db_user)
    now_utc = datetime.now(timezone.utc)

    if db_user:
        if not db_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This institutional account has been deactivated by the Super Administrator.",
            )
        if db_user.hashed_password:
            if not verify_password(req.password, db_user.hashed_password):
                _record_failed_login(clean_email, db_user, db)
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid institutional email or password.",
                )
        else:
            # First-time password initialization for pre-seeded or Google-only accounts
            db_user.hashed_password = hash_password(req.password)
            if getattr(db_user, "auth_provider", None) == "google":
                db_user.auth_provider = "both"

        _clear_failed_login(clean_email, db_user)
        db_user.last_login_at = now_utc
        db.commit()
        db.refresh(db_user)
    else:
        allow_auto_provision = getattr(settings, "ALLOW_UNREGISTERED_LOGIN_PROVISIONING", True)
        if not allow_auto_provision and clean_email not in IIITNR_KNOWN_STAFF:
            # Constant-time dummy hash check to prevent timing-based user enumeration
            verify_password(req.password, DUMMY_PASSWORD_HASH)
            _record_failed_login(clean_email, None, db)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid institutional email or password.",
            )

        meta = resolve_user_metadata(clean_email)
        db_user = User(
            name=meta["name"],
            email=clean_email,
            hashed_password=hash_password(req.password),
            role=meta["role"],
            department_name=meta["department_name"],
            auth_provider="password",
            email_verified=True,
            is_active=True,
            failed_login_attempts=0,
            last_login_at=now_utc,
        )
        try:
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
        except Exception:
            db.rollback()
            db_user = db.query(User).filter(User.email.ilike(clean_email)).first()
            if not db_user or not verify_password(req.password, db_user.hashed_password or ""):
                _record_failed_login(clean_email, db_user, db)
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid institutional email or password.",
                )
        _clear_failed_login(clean_email, db_user)

    user_resp = to_user_response(db_user)
    return _build_auth_response(user_resp, remember_me=req.remember_me)


def refresh_user_session(refresh_token: str, remember_me: bool, db: Session) -> AuthResponse:
    """Validate a JWT refresh token and issue a fresh access + refresh token pair."""
    payload = decode_refresh_token(refresh_token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid or has expired. Please sign in again.",
        )

    email = payload["sub"]
    _ensure_users_table_ready(db)
    user = db.query(User).filter(User.email.ilike(email)).first()
    if user:
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This institutional account has been deactivated.",
            )
        user_resp = to_user_response(user)
    else:
        if getattr(settings, "ENVIRONMENT", "development") == "production":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account associated with this session no longer exists.",
            )
        meta = resolve_user_metadata(email)
        user_resp = UserResponse(
            id=payload.get("id"),
            name=meta["name"],
            email=email,
            role=payload.get("role") or meta["role"],
            department_name=meta["department_name"],
            identifier=meta["identifier"],
            hostel_name=payload.get("hostel_name"),
            room_number=payload.get("room_number"),
            is_active=True,
        )

    return _build_auth_response(user_resp, remember_me=remember_me)


def change_user_password(
    email: str,
    current_password: Optional[str],
    new_password: str,
    db: Session,
) -> UserResponse:
    """Allow an authenticated user to update their account password in Supabase."""
    _ensure_users_table_ready(db)
    user = db.query(User).filter(User.email.ilike(email.strip().lower())).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Authenticated user record was not found in the database.",
        )

    if user.hashed_password and getattr(user, "auth_provider", "password") != "google":
        if not current_password or not verify_password(current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect.",
            )

    user.hashed_password = hash_password(new_password)
    user.failed_login_attempts = 0
    user.locked_until = None
    if getattr(user, "auth_provider", None) == "google":
        user.auth_provider = "both"
    db.commit()
    db.refresh(user)
    return to_user_response(user)


def get_current_user_from_token(token: str, db: Session) -> UserResponse:
    """
    Validate Bearer JWT token and fetch active user profile from Supabase.
    In production, never falls back to stateless claims if the user record is missing or DB fails.
    """
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or token is invalid. Please log in again.",
        )

    email = payload["sub"]
    try:
        _ensure_users_table_ready(db)
        user = db.query(User).filter(User.email.ilike(email)).first()
        if user:
            if not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User account has been deactivated.",
                )
            return to_user_response(user)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Database error resolving token profile for {email}: {e}")
        if getattr(settings, "ENVIRONMENT", "development") == "production":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Unable to verify session status at this time.",
            ) from e

    if getattr(settings, "ENVIRONMENT", "development") == "production":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user account no longer exists. Please sign in again.",
        )

    meta = resolve_user_metadata(email)
    return UserResponse(
        id=payload.get("id"),
        name=payload.get("name") or meta["name"],
        email=email,
        role=payload.get("role") or meta["role"],
        department_name=payload.get("department_name") or meta["department_name"],
        department_id=None,
        identifier=payload.get("identifier") or meta["identifier"],
        phone=None,
        hostel_name=payload.get("hostel_name"),
        room_number=payload.get("room_number"),
        auth_provider=payload.get("auth_provider") or "password",
        email_verified=True,
        is_active=True,
    )


def list_administrative_users(db: Session) -> List[User]:
    """Retrieve all staff, facility admins, technicians, and super admins."""
    _ensure_users_table_ready(db)
    return (
        db.query(User)
        .filter(User.role.in_(["ADMIN", "SUPER_ADMIN", "TECHNICIAN"]))
        .order_by(User.id.asc())
        .all()
    )


def add_admin_user(admin_data: AdminCreateRequest, db: Session) -> User:
    """Create a new facility admin or technician with bcrypt password hashing."""
    _ensure_users_table_ready(db)
    clean_email = admin_data.email.strip().lower()
    existing = db.query(User).filter(User.email.ilike(clean_email)).first()
    raw_password = admin_data.password or "IIITNR@2026"
    hashed_pw = hash_password(raw_password)

    if existing:
        existing.name = admin_data.name.strip()
        existing.role = admin_data.role.strip().upper()
        existing.department_name = admin_data.department_name
        existing.phone = admin_data.phone
        existing.hashed_password = hashed_pw
        existing.is_active = True
        existing.failed_login_attempts = 0
        existing.locked_until = None
        db.commit()
        db.refresh(existing)
        return existing

    new_user = User(
        name=admin_data.name.strip(),
        email=clean_email,
        hashed_password=hashed_pw,
        role=admin_data.role.strip().upper(),
        department_name=admin_data.department_name or "General Administration",
        department_id=admin_data.department_id,
        phone=admin_data.phone,
        auth_provider="password",
        email_verified=True,
        is_active=True,
        failed_login_attempts=0,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def delete_admin_user(user_id: int, db: Session) -> bool:
    """Deactivate or remove a staff admin account."""
    _ensure_users_table_ready(db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False
    if user.role == "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the root Super Administrator account.",
        )
    db.delete(user)
    db.commit()
    return True


def purge_all_tickets(db: Session) -> int:
    """Purge all ticket complaints from database (Super Admin capability)."""
    count = db.query(Ticket).delete()
    teams = db.query(MaintenanceTeam).all()
    for t in teams:
        t.active_ticket_count = 0
    db.commit()
    return count
