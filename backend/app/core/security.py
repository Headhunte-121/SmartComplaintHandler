"""
SmartComplaintHandler - Security, Hashing & JWT Token Utilities
Role: Industry-standard password hashing via bcrypt and cryptographic JWT session tokens.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import bcrypt
import jwt

# Secure secret key with production fallback
SECRET_KEY = "iiitnr-campus-grievance-secret-key-super-secure-token-2026-auth-prod"
ALGORITHM = "HS256"
DEFAULT_EXPIRE_HOURS = 24
REMEMBER_ME_EXPIRE_DAYS = 30


def hash_password(password: str) -> str:
    """Hash raw password with random salt using bcrypt."""
    pw_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pw_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify raw password against bcrypt hash."""
    if not hashed_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Generate signed cryptographic JWT bearer token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=DEFAULT_EXPIRE_HOURS)
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a cryptographic JWT bearer token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None
