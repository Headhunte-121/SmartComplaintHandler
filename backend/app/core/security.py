"""
SmartComplaintHandler - Security, Hashing, Stateless OTP & JWT Token Utilities
Role: Industry-standard password hashing via bcrypt (with 72-byte UTF-8 safety & PBKDF2 fallback),
      cryptographic access/refresh JWT session tokens with key-rotation support,
      constant-time dummy password verification against timing attacks,
      and stateless HMAC-signed OTP tokens for Vercel Serverless.
"""
from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import secrets
import uuid
from typing import Any, Dict, List, Optional
import jwt

from app.core.config import settings

try:
    import bcrypt as _bcrypt_lib
    HAS_BCRYPT = True
except ImportError:
    _bcrypt_lib = None
    HAS_BCRYPT = False

SECRET_KEY = getattr(
    settings,
    "SECRET_KEY",
    "iiitnr-campus-grievance-secret-key-super-secure-token-2026-auth-prod",
)
PREVIOUS_SECRET_KEY = getattr(settings, "PREVIOUS_SECRET_KEY", None)
REFRESH_SECRET_KEY = getattr(
    settings,
    "REFRESH_SECRET_KEY",
    f"{SECRET_KEY}-refresh",
)
ALGORITHM = getattr(settings, "ALGORITHM", "HS256")
DEFAULT_EXPIRE_HOURS = getattr(settings, "ACCESS_TOKEN_EXPIRE_HOURS", 24)
REMEMBER_ME_EXPIRE_DAYS = getattr(settings, "REMEMBER_ME_EXPIRE_DAYS", 30)
OTP_EXPIRE_MINUTES = getattr(settings, "OTP_EXPIRE_MINUTES", 10)
PBKDF2_PREFIX = "pbkdf2_sha256$"
PBKDF2_ITERATIONS = 310000


def _get_verification_keys() -> List[str]:
    """Return active SECRET_KEY plus optional PREVIOUS_SECRET_KEY for seamless key rotation."""
    active = getattr(settings, "SECRET_KEY", SECRET_KEY)
    prev = getattr(settings, "PREVIOUS_SECRET_KEY", PREVIOUS_SECRET_KEY)
    keys = [active]
    if prev and prev not in keys:
        keys.append(prev)
    return keys


def _prepare_password_bytes(password: str) -> bytes:
    """
    Ensure UTF-8 password bytes never exceed bcrypt's 72-byte limit.
    Passwords longer than 72 bytes are pre-hashed with SHA-256 hex (64 bytes)
    so bcrypt >= 4.0 never raises a ValueError on long or multi-byte passwords.
    """
    raw_bytes = (password or "").encode("utf-8")
    if len(raw_bytes) > 72:
        return hashlib.sha256(raw_bytes).hexdigest().encode("ascii")
    return raw_bytes


def hash_password(password: str) -> str:
    """Hash raw password with random salt using bcrypt (or PBKDF2-HMAC-SHA256 fallback)."""
    pw_bytes = _prepare_password_bytes(password)
    if HAS_BCRYPT and _bcrypt_lib is not None:
        salt = _bcrypt_lib.gensalt(rounds=12)
        return _bcrypt_lib.hashpw(pw_bytes, salt).decode("utf-8")

    salt_hex = secrets.token_hex(16)
    derived = hashlib.pbkdf2_hmac(
        "sha256",
        pw_bytes,
        salt_hex.encode("ascii"),
        PBKDF2_ITERATIONS,
    ).hex()
    return f"{PBKDF2_PREFIX}{PBKDF2_ITERATIONS}${salt_hex}${derived}"


# Pre-computed dummy password hash for constant-time verification when an email is not found
DUMMY_PASSWORD_HASH = hash_password("iiitnr_constant_time_dummy_guard_secret_2026")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify raw password against stored bcrypt or PBKDF2 hash in constant time."""
    if not plain_password or not hashed_password:
        return False

    try:
        if hashed_password.startswith(PBKDF2_PREFIX):
            parts = hashed_password.split("$")
            if len(parts) != 4:
                return False
            iterations = int(parts[1])
            salt_hex = parts[2]
            expected_hex = parts[3]
            pw_bytes = _prepare_password_bytes(plain_password)
            candidate_hex = hashlib.pbkdf2_hmac(
                "sha256",
                pw_bytes,
                salt_hex.encode("ascii"),
                iterations,
            ).hex()
            return hmac.compare_digest(candidate_hex, expected_hex)

        if HAS_BCRYPT and _bcrypt_lib is not None:
            pw_bytes = _prepare_password_bytes(plain_password)
            if _bcrypt_lib.checkpw(pw_bytes, hashed_password.encode("utf-8")):
                return True
            legacy_bytes = plain_password[:70].encode("utf-8")[:72]
            return _bcrypt_lib.checkpw(legacy_bytes, hashed_password.encode("utf-8"))
    except Exception:
        return False
    return False


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Generate signed cryptographic JWT access bearer token with standard claims."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta if expires_delta else timedelta(hours=DEFAULT_EXPIRE_HOURS))
    to_encode.update(
        {
            "exp": expire,
            "iat": now,
            "jti": uuid.uuid4().hex,
            "type": "access",
        }
    )
    active_key = getattr(settings, "SECRET_KEY", SECRET_KEY)
    return jwt.encode(to_encode, active_key, algorithm=ALGORITHM)


def create_refresh_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Generate signed cryptographic JWT refresh token for seamless session renewal."""
    to_encode = {
        "sub": data.get("sub"),
        "id": data.get("id"),
        "role": data.get("role"),
    }
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta if expires_delta else timedelta(days=REMEMBER_ME_EXPIRE_DAYS))
    to_encode.update(
        {
            "exp": expire,
            "iat": now,
            "jti": uuid.uuid4().hex,
            "type": "refresh",
        }
    )
    refresh_key = getattr(settings, "REFRESH_SECRET_KEY", REFRESH_SECRET_KEY)
    return jwt.encode(to_encode, refresh_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and validate a cryptographic JWT access bearer token.
    Supports seamless verification across key rotation via PREVIOUS_SECRET_KEY.
    """
    if not token:
        return None
    for candidate_key in _get_verification_keys():
        try:
            payload = jwt.decode(token, candidate_key, algorithms=[ALGORITHM])
            token_type = payload.get("type")
            if token_type and token_type != "access":
                return None
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.PyJWTError:
            continue
    return None


def decode_refresh_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a cryptographic JWT refresh token."""
    if not token:
        return None
    refresh_key = getattr(settings, "REFRESH_SECRET_KEY", REFRESH_SECRET_KEY)
    try:
        payload = jwt.decode(token, refresh_key, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload
    except jwt.PyJWTError:
        return None


def create_otp_verification_token(email: str, otp: str, expires_minutes: int = OTP_EXPIRE_MINUTES) -> str:
    """
    Create a stateless signed JWT encapsulating an HMAC-SHA256 digest of (email, otp).
    Ensures OTP verification works across multi-instance Vercel Serverless functions.
    """
    clean_email = (email or "").strip().lower()
    clean_otp = (otp or "").strip()
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=expires_minutes)
    active_key = getattr(settings, "SECRET_KEY", SECRET_KEY)
    digest = hmac.new(
        active_key.encode("utf-8"),
        f"{clean_email}:{clean_otp}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    payload = {
        "sub": clean_email,
        "otp_hash": digest,
        "jti": uuid.uuid4().hex,
        "type": "otp_challenge",
        "iat": now,
        "exp": expire,
    }
    return jwt.encode(payload, active_key, algorithm=ALGORITHM)


def verify_otp_verification_token(email: str, otp: str, otp_token: str) -> bool:
    """Verify a stateless OTP challenge token against the submitted email and OTP."""
    if not email or not otp or not otp_token:
        return False
    clean_email = email.strip().lower()
    for candidate_key in _get_verification_keys():
        try:
            payload = jwt.decode(otp_token, candidate_key, algorithms=[ALGORITHM])
            if payload.get("type") != "otp_challenge":
                return False
            if payload.get("sub") != clean_email:
                return False
            expected_digest = hmac.new(
                candidate_key.encode("utf-8"),
                f"{clean_email}:{otp.strip()}".encode("utf-8"),
                hashlib.sha256,
            ).hexdigest()
            return hmac.compare_digest(payload.get("otp_hash", ""), expected_digest)
        except jwt.ExpiredSignatureError:
            return False
        except jwt.PyJWTError:
            continue
    return False
