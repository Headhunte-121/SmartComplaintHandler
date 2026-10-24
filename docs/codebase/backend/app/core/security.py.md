# Comprehensive Code Walkthrough & Line-by-Line Guide: `backend/app/core/security.py`

> **File Location**: [`backend/app/core/security.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/backend/app/core/security.py)  
> **Prerequisites**: Basic knowledge of C or Python (functions, strings, dictionaries, basic bitwise/hashing concepts). No advanced cryptography background is assumed.  
> **What this file is**: The cryptographic fortress of the backend. It handles irreversible password hashing (using salted bcrypt and PBKDF2), constant-time password verification (preventing timing attacks), JWT access and refresh token generation with zero-downtime key rotation, and stateless HMAC-signed OTP verification tokens for serverless deployments.

---

## Block 1: Imports & Cryptographic Configuration (Lines 1–42)

```python
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
```

### 1. Plain-English Purpose:
Loads Python's cryptographic modules (`hashlib`, `hmac`, `secrets`, `jwt`, `bcrypt`), ensures fallback support if native bcrypt is unavailable, and defines token expiration windows and hashing iteration counts.

### 2. Line-by-Line Breakdown:
- **Lines 1–7**: Docstring detailing bcrypt safety, timing attack mitigation, and JWT key rotation.
- **Line 8 (`from datetime import datetime, timedelta, timezone`)**: Utilities to calculate token expiration timestamps in strict UTC.
- **Line 9 (`import hashlib`)**: Standard library module implementing cryptographic hashes (SHA-256, PBKDF2).
- **Line 10 (`import hmac`)**: Keyed-Hashing for Message Authentication (HMAC), used for digital signatures and constant-time string comparisons.
- **Line 11 (`import secrets`)**: Cryptographically strong pseudo-random number generator (CSPRNG), far more secure than Python's basic `random`.
- **Line 12 (`import uuid`)**: Universally Unique Identifier generator, used to generate unique token IDs (`jti`).
- **Line 14 (`import jwt`)**: PyJWT library implementing JSON Web Token encoding and decoding.
- **Line 16 (`from app.core.config import settings`)**: Loads global configuration settings.
- **Lines 18–23 (`try: import bcrypt ...`)**: Imports the C-accelerated `bcrypt` library. If missing on a minimal system, falls back to Python's built-in `hashlib.pbkdf2_hmac`.
- **Lines 25–41**: Sets up secrets, algorithms (`HS256`), token durations (24 hours access, 30 days remember-me, 10 minutes OTP), and 310,000 PBKDF2 rounds (matching OWASP recommendations).

### 3. Deep Term & Concept Expansion (For C / Basic Python Readers):
- **Why use `secrets` instead of `random`?**:
  In C, `rand()` seeded with `time(NULL)` is completely predictable: an attacker knowing the current second can guess the generated numbers. Python's `secrets` module reads true entropy from the operating system kernel (`/dev/urandom` on Linux or `CryptGenRandom` on Windows), producing unpredictable random salts.
- **What is HMAC (Hash-based Message Authentication Code)?**:
  A standard SHA-256 hash checks if a file changed. An HMAC combines the message with a secret cryptographic key: `hash(key + message)`. Without knowing the secret key, an attacker cannot forge a valid HMAC signature.

### 4. Runtime Mechanics & Security Under the Hood:
- **OWASP Compliance**: The 310,000 iteration count for PBKDF2-HMAC-SHA256 complies directly with official OWASP Password Storage Guidelines, ensuring brute-force resistance even on modern GPU clusters.

---

## Block 2: Key Rotation Helper `_get_verification_keys()` (Lines 44–52)

```python
def _get_verification_keys() -> List[str]:
    """Return active SECRET_KEY plus optional PREVIOUS_SECRET_KEY for seamless key rotation."""
    active = getattr(settings, "SECRET_KEY", SECRET_KEY)
    prev = getattr(settings, "PREVIOUS_SECRET_KEY", PREVIOUS_SECRET_KEY)
    keys = [active]
    if prev and prev not in keys:
        keys.append(prev)
    return keys
```

### 1. Plain-English Purpose:
Returns a list of valid cryptographic keys used to verify incoming user tokens. If a previous key was configured during key rotation, both the current key and the previous key are accepted.

### 2. Line-by-Line Breakdown:
- **Line 44 (`def _get_verification_keys() -> List[str]:`)**: Helper returning a list of secret key strings.
- **Line 46 (`active = getattr(...)`)**: Retrieves the current primary secret key.
- **Line 47 (`prev = getattr(...)`)**: Retrieves the previous secret key (if any).
- **Line 48 (`keys = [active]`)**: Starts the list with the active key.
- **Lines 49–50 (`if prev and prev not in keys: keys.append(prev)`)**: Appends the previous key if it exists and is distinct from the active key.
- **Line 51 (`return keys`)**: Returns the list of valid verification keys.

### 3. Deep Term & Concept Expansion:
- **Why is Key Rotation necessary?**:
  If a server's secret key is leaked or routinely retired every 90 days, changing the key instantly revokes all existing student sessions. With dual-key verification, newly issued tokens use `active`, while previously issued tokens are verified against `prev`, preventing sudden session drops.

---

## Block 3: Bcrypt 72-Byte Truncation Guard `_prepare_password_bytes()` (Lines 54–64)

```python
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
```

### 1. Plain-English Purpose:
Protects against a well-known vulnerability and crash in the bcrypt algorithm: bcrypt has a hard physical limit of 72 bytes. If a user submits a password longer than 72 bytes, this function pre-hashes it with SHA-256 (producing a fixed 64-character string) so bcrypt never crashes.

### 2. Line-by-Line Breakdown:
- **Line 54 (`def _prepare_password_bytes(password: str) -> bytes:`)**: Function converting a password string into safe byte array.
- **Line 60 (`raw_bytes = (password or "").encode("utf-8")`)**: Encodes the password string into UTF-8 bytes.
- **Line 61 (`if len(raw_bytes) > 72:`)**: Checks if the byte count exceeds bcrypt's 72-byte maximum.
- **Line 62 (`return hashlib.sha256(raw_bytes).hexdigest().encode("ascii")`)**: If longer than 72 bytes, computes SHA-256 hex digest (exactly 64 ASCII bytes) and returns it.
- **Line 63 (`return raw_bytes`)**: Otherwise, returns the raw bytes unmodified.

### 3. Deep Term & Concept Expansion:
- **What is the Bcrypt 72-byte limit?**:
  The mathematical specification of the Blowfish cipher used by bcrypt processes input in 72-byte blocks. In `bcrypt >= 4.0`, passing a password longer than 72 bytes raises a fatal `ValueError: password cannot be longer than 72 bytes`. Furthermore, in older versions, bcrypt silently chopped off bytes after the 72nd byte, meaning two different 80-character passwords with the same first 72 bytes were treated as identical! Pre-hashing with SHA-256 completely eliminates this flaw.

---

## Block 4: Password Hashing Function `hash_password()` (Lines 66–81)

```python
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
```

### 1. Plain-English Purpose:
Converts a plain-text password into an irreversible, salted cryptographic hash string using 12 rounds of bcrypt (or 310,000 rounds of PBKDF2).

### 2. Line-by-Line Breakdown:
- **Line 66 (`def hash_password(password: str) -> str:`)**: Public function accepting plain password and returning hash string.
- **Line 68 (`pw_bytes = _prepare_password_bytes(password)`)**: Applies 72-byte safety normalization.
- **Line 69 (`if HAS_BCRYPT and _bcrypt_lib is not None:`)**: If native bcrypt is available:
  - **Line 70 (`salt = _bcrypt_lib.gensalt(rounds=12)`)**: Generates a random cryptographic salt with cost factor 12 ($2^{12} = 4096$ key expansions).
  - **Line 71 (`return _bcrypt_lib.hashpw(pw_bytes, salt).decode("utf-8")`)**: Computes the hash and returns it as a string (e.g. `"$2b$12$..."`).
- **Lines 73–80 (PBKDF2 Fallback)**:
  - Generates 16 bytes of random hex salt via `secrets.token_hex(16)`.
  - Derives key using `hashlib.pbkdf2_hmac` with 310,000 iterations.
  - Returns formatted string: `"pbkdf2_sha256$310000$[salt]$[hash]"`.

### 3. Deep Term & Concept Expansion:
- **What is a "Salt", and why is it essential?**:
  If two students choose the same password `"Password@123"`, a simple hash function (like MD5) produces identical hash strings. An attacker with a precomputed lookup table ("Rainbow Table") can instantly look up the password. A **salt** is a random string generated uniquely for every single user. Even if two users have the same password, their hashes are completely different, defeating rainbow table attacks.

---

## Block 5: Timing Attack Defense & Password Verification (Lines 83–118)

```python
# Pre-computed dummy password hash for constant-time verification when an email is not found
DUMMY_PASSWORD_HASH = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4oL9.x1W6e"


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
```

### 1. Plain-English Purpose:
Verifies whether a submitted password matches the stored cryptographic hash. Includes protection against timing attacks (using `hmac.compare_digest` and dummy hash evaluations) and handles legacy truncated hashes.

### 2. Line-by-Line Breakdown:
- **Line 84 (`DUMMY_PASSWORD_HASH = "..."`)**: A pre-computed bcrypt hash used when an email is not found in the database.
- **Line 87 (`def verify_password(plain_password: str, hashed_password: str) -> bool:`)**: Verification function returning boolean.
- **Lines 89–90 (`if not plain_password or not hashed_password: return False`)**: Guard clause against empty inputs.
- **Lines 93–107 (PBKDF2 Branch)**: Parses stored salt and iterations, hashes the candidate password, and compares hashes using `hmac.compare_digest`.
- **Lines 109–114 (Bcrypt Branch)**:
  - First tests normalized bytes via `_bcrypt_lib.checkpw`.
  - If that fails, tests legacy 70-character slice to support passwords created before pre-hashing was introduced.
- **Lines 115–117 (`except Exception: return False`)**: Any corrupted hash format cleanly returns `False` without crashing.

### 3. Deep Term & Concept Expansion:
- **What is a Timing Attack, and why `hmac.compare_digest`?**:
  In standard C `strcmp()` or Python `string1 == string2`, comparison terminates at the first differing character. If comparing an 8-character string, character 1 failing takes 1 nanosecond, while character 7 failing takes 7 nanoseconds. By measuring response times over thousands of network requests, an attacker can deduce correct passwords character-by-character! `hmac.compare_digest()` runs in **constant time**: it always inspects every single byte regardless of where differences occur.
- **What is `DUMMY_PASSWORD_HASH`?**:
  Bcrypt verification takes ~100ms of CPU time. If an attacker submits a login for `"nonexistent@iiitnr.edu.in"`, returning `False` in 1ms immediately reveals that the user does not exist. Running `verify_password("wrong", DUMMY_PASSWORD_HASH)` ensures invalid users take the exact same 100ms as valid users, defeating username enumeration attacks.

---

## Block 6: Access Token Generator `create_access_token()` (Lines 120–138)

```python
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
```

### 1. Plain-English Purpose:
Creates a digitally signed JSON Web Token (JWT) that a student's browser includes in the `Authorization: Bearer <token>` header to authenticate subsequent API requests.

### 2. Line-by-Line Breakdown:
- **Line 120 (`def create_access_token(...) -> str:`)**: Function accepting payload dictionary and optional duration.
- **Line 125 (`to_encode = data.copy()`)**: Clones user dictionary so original caller memory is not mutated.
- **Line 126 (`now = datetime.now(timezone.utc)`)**: Records current timestamp in strict UTC.
- **Line 127 (`expire = now + ...`)**: Computes expiration (defaults to 24 hours).
- **Lines 128–135 (`to_encode.update(...)`)**:
  - `exp`: Expiration time.
  - `iat`: "Issued At" time.
  - `jti`: Unique token identifier preventing replay attacks.
  - `type`: Explicitly marked `"access"` to prevent token substitution attacks.
- **Line 136 (`active_key = ...`)**: Reads active signing secret key.
- **Line 137 (`return jwt.encode(...)`)**: Cryptographically signs the payload with HMAC-SHA256 and returns the JWT string.

### 3. Deep Term & Concept Expansion:
- **What is a JWT?**:
  A compact string composed of three base64-encoded segments separated by dots: `Header.Payload.Signature`. The server does not need to store the session in a database table! When the browser returns the token, the server verifies the signature using `SECRET_KEY`. If valid, it trusts the claims (`user_id`, `role`) instantly in $O(1)$ memory.

---

## Block 7: Refresh Token Generator `create_refresh_token()` (Lines 140–162)

```python
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
```

### 1. Plain-English Purpose:
Generates a long-lived refresh token (valid for up to 30 days) signed with an independent key (`REFRESH_SECRET_KEY`), used exclusively to obtain a fresh access token without retyping passwords.

### 2. Line-by-Line Breakdown:
- **Lines 145–149**: Constructs a minimal payload containing only identity claims (`sub`, `id`, `role`).
- **Line 151**: Sets a 30-day expiration window (`REMEMBER_ME_EXPIRE_DAYS`).
- **Line 157**: Sets `type: "refresh"`.
- **Line 160 (`refresh_key = ...`)**: Uses the dedicated refresh signing secret key.
- **Line 161**: Encodes and returns the signed refresh token.

### 3. Deep Term & Concept Expansion:
- **Why have separate Access and Refresh keys?**:
  Access tokens travel over the wire with every single API call, exposing them to network capture if HTTPS is broken. Therefore, access tokens have a short lifespan (24 hours). Refresh tokens are transmitted only once every 24 hours to renew the session. Using a different secret key (`REFRESH_SECRET_KEY`) guarantees that compromising an access token never compromises the refresh infrastructure.

---

## Block 8: Token Decoding & Verification Functions (Lines 164–197)

```python
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
```

### 1. Plain-English Purpose:
Verifies incoming JWT tokens. For access tokens, it attempts verification against the active key and the previous key (key rotation support). It also validates expiration and enforces strict token type separation.

### 2. Line-by-Line Breakdown:
- **Lines 169–170 & 187–188**: Rejects empty strings immediately.
- **Line 171 (`for candidate_key in _get_verification_keys():`)**: Loops through active and previous keys.
- **Line 173 (`payload = jwt.decode(...)`)**: Verifies signature, expiration date, and algorithm.
- **Lines 174–176 & 192–194**: Enforces token type matching. If someone presents a refresh token to an API endpoint expecting an access token, it is rejected immediately.
- **Line 178 (`except jwt.ExpiredSignatureError: return None`)**: Expired tokens return `None` immediately without checking further keys.
- **Line 180 (`except jwt.PyJWTError: continue`)**: If signature verification failed on the active key, tries `PREVIOUS_SECRET_KEY`.

---

## Block 9: Stateless OTP Challenge Engine (Lines 199–247)

```python
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
```

### 1. Plain-English Purpose:
Generates and verifies stateless email verification tokens. In serverless clouds (like Vercel), servers don't share memory. Instead of storing OTP codes in an external Redis cache, this function packages a cryptographic HMAC hash of the OTP into a signed token returned to the client browser. When the student submits the code, the server verifies the token statelessly.

### 2. Line-by-Line Breakdown:
- **Lines 204–205**: Sanitizes email and OTP string.
- **Lines 209–213**: Computes HMAC-SHA256 digest of `{email}:{otp}` using `active_key`. The plain OTP is **not** stored in the token; only its cryptographic digest is stored.
- **Lines 214–221**: Bundles subject, digest, unique `jti`, expiration (10 minutes), and signs it into a JWT.
- **Lines 225–247 (`verify_otp_verification_token`)**:
  - Decodes and validates signature and expiration.
  - Re-computes expected HMAC digest for the submitted OTP and email.
  - Uses `hmac.compare_digest` to verify equality in constant time.

### 3. Deep Term & Concept Expansion:
- **What is Stateless Verification?**:
  In a traditional system, when user asks for an OTP, the server stores `otp = 492019` in server RAM. If request #1 hits Vercel Container A and request #2 (verification) hits Vercel Container B, Container B has no memory of the OTP! By signing the HMAC into a client-held token, any container can verify the OTP mathematically without shared database state.

---

## Overall File Viva & Technical Defense Guide

### Top 10 Viva Questions on `backend/app/core/security.py`:

#### Q1: Why do you hash passwords using bcrypt rather than SHA-256 or MD5?
> **Model Answer**:  
> *"Sir, SHA-256 and MD5 are general-purpose cryptographic hashes designed for raw speed. Modern graphics cards (GPUs) can compute billions of SHA-256 hashes per second, making dictionary attacks trivial. Bcrypt is an adaptive password hashing algorithm based on Blowfish: it includes an adjustable cost factor ($2^{12} = 4096$ rounds) and automatic per-user salt generation, making offline brute-force attacks computationally infeasible."*

#### Q2: What is the Bcrypt 72-byte limit, and how does `_prepare_password_bytes()` solve it?
> **Model Answer**:  
> *"Sir, the bcrypt algorithm has a hard mathematical limitation of 72 bytes. In modern Python bcrypt, submitting a password longer than 72 bytes raises a fatal `ValueError`. `_prepare_password_bytes()` checks the UTF-8 byte length: if it exceeds 72 bytes, it pre-hashes the password with SHA-256 hex (producing exactly 64 ASCII bytes), allowing passwords of arbitrary length without crashing."*

#### Q3: What is a Timing Attack, and how does `security.py` defend against it?
> **Model Answer**:  
> *"Sir, standard string equality checks (`==`) exit early at the first mismatched character, allowing attackers to measure microscopic CPU timing differences to guess strings byte-by-byte. We defend against this in two ways:  
> 1. Using `hmac.compare_digest()` for constant-time string comparisons.  
> 2. Using `DUMMY_PASSWORD_HASH` when an email is not found, ensuring that invalid usernames consume the same ~100ms bcrypt CPU time as valid users."*

#### Q4: How does zero-downtime key rotation work in `security.py`?
> **Model Answer**:  
> *"Sir, line 44 defines `_get_verification_keys()`, which returns both `SECRET_KEY` and `PREVIOUS_SECRET_KEY`. When signing new tokens, the system always uses the active key. When verifying existing tokens, it checks the active key first; if verification fails, it checks `PREVIOUS_SECRET_KEY`. This allows rotating server secrets without abruptly logging out all active students."*

#### Q5: What is the difference between Access Tokens and Refresh Tokens?
> **Model Answer**:  
> *"Sir, access tokens are short-lived (24 hours) bearer credentials sent with every HTTP request. Refresh tokens are long-lived (30 days) and signed with a distinct secret key (`REFRESH_SECRET_KEY`). They are used exclusively at the `/auth/refresh` endpoint to obtain a new access token, minimizing the window of vulnerability if an access token is intercepted."*

#### Q6: How does `create_otp_verification_token` achieve stateless OTP validation?
> **Model Answer**:  
> *"Sir, in serverless environments like Vercel, separate function instances do not share local RAM. `create_otp_verification_token` computes an HMAC-SHA256 digest of `email:otp` and packages it into a signed 10-minute JWT token given to the client. When the client submits their OTP, the server verifies the cryptographic signature statelessly without requiring a shared Redis cache or database write."*

#### Q7: Why is `jti` (JWT ID) included in every token?
> **Model Answer**:  
> *"Sir, `jti` is a universally unique identifier (`uuid.uuid4().hex`) generated for every token. It guarantees that every single token issued is unique, preventing replay attacks and enabling token blacklisting if needed."*

#### Q8: What happens if `bcrypt` library is not installed on the system?
> **Model Answer**:  
> *"Sir, line 18 uses a defensive `try...except` block. If `bcrypt` is not available, the system falls back to Python's built-in `hashlib.pbkdf2_hmac` using SHA-256 with 310,000 iterations (OWASP standard), ensuring authentication remains secure and functional without crashing."*

#### Q9: Why is token type strictly validated in `decode_access_token` and `decode_refresh_token`?
> **Model Answer**:  
> *"Sir, this prevents Token Substitution attacks. Without type validation, an attacker could steal a 30-day refresh token and present it directly to protected API endpoints. Checking `payload.get('type') == 'access'` ensures refresh tokens cannot be used as bearer credentials."*

#### Q10: Why are timestamps calculated using `datetime.now(timezone.utc)`?
> **Model Answer**:  
> *"Sir, naive datetime objects without timezone data cause bugs when comparing tokens across servers in different cloud regions. Using explicit UTC timestamps guarantees consistent expiration calculations worldwide."*

---

## Quick Viva Summary Table

| Function / Component | Cryptographic Technique | Primary Security Purpose | Vulnerability Mitigated |
| :--- | :--- | :--- | :--- |
| **`hash_password`** | Bcrypt (12 rounds) / PBKDF2 | Irreversible password hashing | Rainbow table and dictionary attacks |
| **`_prepare_password_bytes`** | SHA-256 pre-hash (>72 bytes) | Normalizes passwords to 64 bytes | Bcrypt 72-byte `ValueError` crash |
| **`verify_password`** | `hmac.compare_digest` | Constant-time hash verification | Side-channel timing attacks |
| **`DUMMY_PASSWORD_HASH`** | Pre-computed bcrypt string | Simulates password check on invalid user | Username enumeration attacks |
| **`create_access_token`**| JWT (HMAC-SHA256) | 24-hour stateless bearer credential | Server session state overhead |
| **`create_refresh_token`**| JWT (Dedicated Refresh Key) | 30-day session renewal credential | Access token theft exposure |
| **`decode_access_token`**| Dual-key signature verification| Validates tokens with key rotation support| Service downtime during key updates |
| **Stateless OTP Engine** | HMAC-SHA256 challenge token | Client-held signed challenge token | Serverless cross-instance state loss |
