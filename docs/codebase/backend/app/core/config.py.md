# Comprehensive Code Walkthrough & Line-by-Line Guide: `backend/app/core/config.py`

> **File Location**: [`backend/app/core/config.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/backend/app/core/config.py)  
> **Prerequisites**: Basic knowledge of C or Python (classes, variables, functions, environment variables). No advanced framework or DevOps background is assumed.  
> **What this file is**: The central control room and configuration manager for the entire application. It reads environment variables (from `.env` or cloud providers like Vercel/Supabase), validates them using Pydantic, provides defaults, and exposes a single global configuration object (`settings`).

---

## Block 1: Imports and Pydantic Version Compatibility (Lines 1–20)

```python
"""
SmartComplaintHandler - Application Settings & Configuration
Blueprint Reference: V1/M1/backend/01_config_and_env.md
Role: Production-grade Pydantic BaseSettings loading environment variables for Vercel Serverless,
      Supabase PostgreSQL connection pooling, JWT cryptography with key rotation, and Google Workspace OAuth2/OIDC.
"""
import os
import sys
from typing import List, Optional

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
    HAS_PYDANTIC_SETTINGS_V2 = True
except ImportError:
    HAS_PYDANTIC_SETTINGS_V2 = False
    try:
        from pydantic import BaseSettings
    except ImportError:
        from pydantic import BaseModel as BaseSettings
```

### 1. Plain-English Purpose:
Imports system tools and ensures compatibility between different versions of Pydantic (Pydantic v1 vs Pydantic v2). This prevents the application from crashing if deployed on different server environments with varying library versions.

### 2. Line-by-Line Breakdown:
- **Lines 1–6**: Module docstring documenting the architectural responsibilities of the configuration layer.
- **Line 7 (`import os`)**: Python's standard library module to interact with the OS and read environment variables.
- **Line 8 (`import sys`)**: Provides system parameters and interpreter details.
- **Line 9 (`from typing import List, Optional`)**: Imports type annotations (`List` for arrays of strings, `Optional` for values that can be `None`).
- **Line 11–15 (`try: from pydantic_settings import BaseSettings, SettingsConfigDict ...`)**: Attempts to import from the modern `pydantic-settings` library (used in Pydantic v2). If successful, sets `HAS_PYDANTIC_SETTINGS_V2 = True`.
- **Line 16–20 (`except ImportError: ...`)**: If Pydantic v2 is not installed, catches the `ImportError` and falls back to importing `BaseSettings` from Pydantic v1, or defaults to `BaseModel`.

### 3. Deep Term & Concept Expansion:
- **What is an Environment Variable?**: In C, when you compile a program, constants are hardcoded into the binary. An environment variable is a dynamic string stored outside the source code in the operating system memory (e.g. `set DATABASE_URL=...` on Windows). This allows changing passwords or database locations without recompiling or modifying the code.
- **What is Pydantic `BaseSettings`?**: Unlike a regular Python class, a class inheriting from `BaseSettings` automatically reads environment variables matching its attribute names and coerces them into the specified Python types (e.g. converting `"300"` into an integer `300`).

### 4. Runtime Mechanics & Security Under the Hood:
- **Zero-Downtime Dependency Gracefulness**: In older Python deployments or virtual environments, mixing Pydantic v1 and v2 is a frequent source of deployment failures. This `try...except` pattern makes the configuration module resilient across environments.

---

## Block 2: Database Connection URL Resolver (Lines 22–40)

```python
def _resolve_default_database_url() -> str:
    """
    Resolve database connection URL from Supabase / PostgreSQL environment variables.
    Enforces Supabase PostgreSQL connection string across production and local execution.
    """
    for env_key in (
        "DATABASE_URL",
        "POSTGRES_URL",
        "SUPABASE_DB_URL",
        "POSTGRES_PRISMA_URL",
        "POSTGRES_URL_NON_POOLING",
    ):
        val = os.getenv(env_key, "").strip()
        if val:
            if val.startswith("postgres://"):
                return val.replace("postgres://", "postgresql://", 1)
            return val
    return "postgresql://postgres.swtckhxitsxvphtenaqo:2TKUGaPmLDqXYKx0@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require"
```

### 1. Plain-English Purpose:
Searches through all standard environment variable names that cloud hosting platforms (like Vercel, Supabase, Heroku, or Prisma) use to pass database connection strings, standardizes the protocol prefix, and provides a default cloud Supabase PostgreSQL connection string as a fallback.

### 2. Line-by-Line Breakdown:
- **Line 22 (`def _resolve_default_database_url() -> str:`)**: Private helper function returning a validated database connection URL string.
- **Lines 27–33 (`for env_key in (...):`)**: Iterates through 5 common cloud database environment variable aliases.
- **Line 34 (`val = os.getenv(env_key, "").strip()`)**: Reads the variable from the OS. If not set, returns an empty string `""` and removes whitespace.
- **Line 35 (`if val:`)**: If a non-empty string is found:
  - **Line 36–37 (`if val.startswith("postgres://"): return val.replace("postgres://", "postgresql://", 1)`)**: SQLAlchemy requires the driver dialect `postgresql://`. If cloud providers inject the legacy `postgres://` dialect, it replaces the prefix. The `1` argument ensures only the first occurrence is replaced.
  - **Line 38 (`return val`)**: Returns the valid URL immediately.
- **Line 39 (`return "postgresql://postgres...supabase.com:6543/postgres?sslmode=require"`)**: If none of the environment variables were set, returns the institutional cloud Supabase PostgreSQL connection endpoint with encrypted SSL (`sslmode=require`).

### 3. Deep Term & Concept Expansion:
- **What is a Connection String?**: A structured URL containing all network credentials to reach a database:
  `postgresql://[user]:[password]@[host]:[port]/[database_name]?sslmode=[mode]`
- **Why replace `postgres://` with `postgresql://`?**: Older platforms (like Heroku and early Vercel integrations) generated URLs starting with `postgres://`. In SQLAlchemy 1.4+, the `postgres://` URI scheme was deprecated and throws an exception. Normalizing this prefix automatically prevents database startup crashes.

### 4. Runtime Mechanics & Security Under the Hood:
- **Encrypted Transmission (`sslmode=require`)**: The query parameter `?sslmode=require` instructs the PostgreSQL client library to establish a TLS/SSL encrypted tunnel to AWS ap-south-1 (Mumbai). Any packet sniffers on campus Wi-Fi cannot read user data or complaints in transit.

---

## Block 3: Production Environment Detector (Lines 42–45)

```python
def _is_production_env() -> bool:
    env = os.getenv("ENVIRONMENT", os.getenv("VERCEL_ENV", "")).strip().lower()
    return bool(os.getenv("VERCEL")) or env in ("production", "prod", "staging")
```

### 1. Plain-English Purpose:
Determines whether the application is running in a live production environment (e.g. deployed to Vercel or cloud staging) versus a local development machine.

### 2. Line-by-Line Breakdown:
- **Line 42 (`def _is_production_env() -> bool:`)**: Helper function returning a boolean.
- **Line 43 (`env = os.getenv("ENVIRONMENT", os.getenv("VERCEL_ENV", "")).strip().lower()`)**: Reads `ENVIRONMENT`, falling back to `VERCEL_ENV`, trims spaces, and converts to lowercase.
- **Line 44 (`return bool(os.getenv("VERCEL")) or env in ("production", "prod", "staging")`)**: Returns `True` if running on Vercel or if the environment name matches `"production"`, `"prod"`, or `"staging"`.

### 3. Deep Term & Concept Expansion:
- **Why differentiate environments?**: In development, you want detailed error messages and easy testing. In production, you want strict security, sanitized error messages, locked-down tokens, and disabled public Swagger documentation.

---

## Block 4: `Settings` Class Definition & Configuration Properties (Lines 47–119)

```python
class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Complaint Handler"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "production" if _is_production_env() else "development"
    DEBUG: bool = (
        os.getenv("DEBUG", "false" if _is_production_env() else "true").lower()
        in ("true", "1", "yes")
        and not _is_production_env()
    )

    # Supabase PostgreSQL / SQLite Database Configuration
    DATABASE_URL: str = _resolve_default_database_url()
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_RECYCLE_SECONDS: int = 300
    DB_CONNECT_TIMEOUT_SECONDS: int = 10

    # Cryptographic JWT & OTP Settings (with PREVIOUS_SECRET_KEY support for zero-downtime key rotation)
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        os.getenv(
            "JWT_SECRET_KEY",
            os.getenv(
                "SUPABASE_JWT_SECRET",
                "iiitnr-campus-grievance-secret-key-super-secure-token-2026-auth-prod",
            ),
        ),
    )
    PREVIOUS_SECRET_KEY: Optional[str] = os.getenv("PREVIOUS_SECRET_KEY") or None
    REFRESH_SECRET_KEY: str = os.getenv(
        "REFRESH_SECRET_KEY",
        f"{os.getenv('SECRET_KEY', 'iiitnr-campus-grievance-secret-key-2026')}-refresh",
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 24
    REMEMBER_ME_EXPIRE_DAYS: int = 30
    OTP_EXPIRE_MINUTES: int = 10

    # Brute-Force & Rate-Limiting Thresholds
    MAX_LOGIN_ATTEMPTS_PER_WINDOW: int = int(os.getenv("MAX_LOGIN_ATTEMPTS_PER_WINDOW", "5"))
    LOGIN_LOCKOUT_MINUTES: int = int(os.getenv("LOGIN_LOCKOUT_MINUTES", "15"))
    MAX_OTP_REQUESTS_PER_WINDOW: int = int(os.getenv("MAX_OTP_REQUESTS_PER_WINDOW", "5"))

    # Google Workspace OAuth2 / OIDC SSO & IIIT-NR Domain Constraints
    GOOGLE_CLIENT_ID: Optional[str] = (
        os.getenv("GOOGLE_CLIENT_ID")
        or os.getenv("VITE_GOOGLE_CLIENT_ID")
        or os.getenv("NEXT_PUBLIC_GOOGLE_CLIENT_ID")
        or None
    )
    GOOGLE_CLIENT_SECRET: Optional[str] = os.getenv("GOOGLE_CLIENT_SECRET") or None
    GOOGLE_ALLOWED_DOMAIN: str = os.getenv("GOOGLE_ALLOWED_DOMAIN", "iiitnr.edu.in").strip().lower()
    GOOGLE_STRICT_TOKEN_VERIFY: bool = (
        os.getenv("GOOGLE_STRICT_TOKEN_VERIFY", "true" if _is_production_env() else "false").lower()
        in ("true", "1", "yes")
    )

    # Security & Access Control Policies
    AUTO_SEED_ON_STARTUP: bool = (
        os.getenv("AUTO_SEED_ON_STARTUP", "false").lower() in ("true", "1", "yes")
    )
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,https://smart-complaint-handler.vercel.app",
    )
    CORS_ALLOWED_REGEX: Optional[str] = os.getenv("CORS_ALLOWED_REGEX")

    # AI Classification & Triage Provider Configuration
    GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY")
    DEFAULT_AI_PROVIDER: str = os.getenv("DEFAULT_AI_PROVIDER", "groq")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "allam-2-7b")
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
```

### 1. Plain-English Purpose:
Defines the structure and default values for all system settings, organized into logical domains: core metadata, database pooling, JWT security keys, brute-force rate limits, Google SSO credentials, CORS policies, and AI classification models.

### 2. Line-by-Line Breakdown:
- **Lines 48–55**:
  - `PROJECT_NAME`: Title of the application.
  - `API_V1_STR`: Common URL prefix (`"/api/v1"`).
  - `ENVIRONMENT`: Either `"production"` or `"development"`.
  - `DEBUG`: Boolean flag. Strictly forced to `False` in production (`and not _is_production_env()`), preventing accidental debug mode leaks.
- **Lines 58–62 (Database Pooling)**:
  - `DATABASE_URL`: Connection string from Block 2.
  - `DB_POOL_SIZE = 5`: Keeps 5 persistent database socket connections open in RAM.
  - `DB_MAX_OVERFLOW = 10`: Allows creating up to 10 additional temporary connections during traffic spikes.
  - `DB_POOL_RECYCLE_SECONDS = 300`: Refreshes connections every 5 minutes to prevent stale dropped sockets.
  - `DB_CONNECT_TIMEOUT_SECONDS = 10`: Aborts hanging connection attempts after 10 seconds.
- **Lines 65–84 (Cryptographic JWT & OTP)**:
  - `SECRET_KEY`: Master HMAC-SHA256 secret used to sign access tokens.
  - `PREVIOUS_SECRET_KEY`: Allows zero-downtime key rotation. If a token fails verification with `SECRET_KEY`, the server checks `PREVIOUS_SECRET_KEY` so existing users aren't abruptly logged out during security rotations.
  - `REFRESH_SECRET_KEY`: Separate secret key used exclusively for long-lived refresh tokens.
  - `ALGORITHM = "HS256"`: Standard cryptographic algorithm.
  - `ACCESS_TOKEN_EXPIRE_HOURS = 24`: Short-lived access token valid for 24 hours.
  - `REMEMBER_ME_EXPIRE_DAYS = 30`: Long-lived session persistence.
  - `OTP_EXPIRE_MINUTES = 10`: Time limit for one-time verification passwords.
- **Lines 86–88 (Rate Limiting)**:
  - `MAX_LOGIN_ATTEMPTS_PER_WINDOW = 5`: Blocks accounts after 5 failed password attempts.
  - `LOGIN_LOCKOUT_MINUTES = 15`: 15-minute lockout period.
  - `MAX_OTP_REQUESTS_PER_WINDOW = 5`: Limits OTP spamming.
- **Lines 91–102 (Google SSO)**:
  - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Google Workspace API credentials.
  - `GOOGLE_ALLOWED_DOMAIN = "iiitnr.edu.in"`: Institutional boundary constraint.
  - `GOOGLE_STRICT_TOKEN_VERIFY`: Enforces strict Google OIDC verification in production.
- **Lines 105–119 (CORS & AI Engine)**:
  - `AUTO_SEED_ON_STARTUP`: Toggle for automatic database seeding.
  - `CORS_ORIGINS`: Comma-separated list of approved frontend URLs.
  - `GROQ_API_KEY`, `DEFAULT_AI_PROVIDER`, `GROQ_MODEL`, `GEMINI_API_KEY`: Credentials and models for the automated complaint triage engine.

### 3. Deep Term & Concept Expansion:
- **What is Zero-Downtime Key Rotation (`PREVIOUS_SECRET_KEY`)?**:
  In security, passwords and signing keys should be rotated periodically. If you change `SECRET_KEY` on a live server, every student currently using the application would immediately have their active session invalidated and get kicked out. By maintaining `PREVIOUS_SECRET_KEY`, existing tokens remain valid until their expiration, while all newly generated tokens use the new key.
- **What is Connection Pooling (`DB_POOL_SIZE`)?**:
  Establishing a TCP and SSL handshake with a remote database server takes 50–100ms. If every student request created a new connection, the server would be slow. A connection pool keeps a set of pre-established connections in RAM, borrowing one to execute a query and returning it immediately upon completion.

### 4. Runtime Mechanics & Security Under the Hood:
- **Fail-Safe Debug Enforcement**: Line 54 contains `and not _is_production_env()`. Even if an administrator accidentally deploys a `.env` file containing `DEBUG=True` to production, this logic overrides it to `False`, preventing internal stack traces and database queries from ever leaking to students.

---

## Block 5: Dynamic CORS Origin Parser (Lines 120–128)

```python
    @property
    def parsed_cors_origins(self) -> List[str]:
        raw = (self.CORS_ORIGINS or "").strip()
        if not raw:
            return ["http://localhost:5173", "http://127.0.0.1:5173"]
        if raw == "*":
            return ["*"]
        return [origin.strip().rstrip("/") for origin in raw.split(",") if origin.strip()]
```

### 1. Plain-English Purpose:
A computed property that transforms the raw comma-separated `CORS_ORIGINS` string (from `.env`) into a clean Python list of stripped URLs with trailing slashes removed.

### 2. Line-by-Line Breakdown:
- **Line 120 (`@property`)**: Decorator allowing this method to be accessed like an attribute (`settings.parsed_cors_origins`) without parenthesis.
- **Line 121 (`def parsed_cors_origins(self) -> List[str]:`)**: Method returning a list of strings.
- **Line 122 (`raw = (self.CORS_ORIGINS or "").strip()`)**: Reads the raw string and trims whitespace.
- **Line 123–124 (`if not raw: return [...]`)**: If blank, defaults to standard local development URLs (`localhost:5173`).
- **Line 125–126 (`if raw == "*": return ["*"]`)**: If wildcard is explicitly specified, returns `["*"]`.
- **Line 127 (`return [origin.strip().rstrip("/") for origin in raw.split(",") if origin.strip()]`)**:
  - `raw.split(",")`: Splits comma-separated entries into an array.
  - `origin.strip().rstrip("/")`: Trims spaces and removes trailing forward slashes.
  - `if origin.strip()`: Ignores empty entries (e.g. trailing commas like `"a,b,"`).

### 3. Deep Term & Concept Expansion:
- **What is `@property` in C vs Python?**: In C, if you want a calculated value from a struct, you call a function `get_parsed_origins(&settings)`. In Python, `@property` creates a "getter" that behaves syntactically like a variable read (`settings.parsed_cors_origins`), calculating the result on demand.

### 4. Runtime Mechanics & Security Under the Hood:
- **List Comprehension Efficiency**: The list comprehension processes the string in $O(N)$ time where $N$ is the number of configured origins, stripping slashes to prevent browser comparison mismatches.

---

## Block 6: Pydantic Configuration & Settings Singleton (Lines 129–143)

```python
    if HAS_PYDANTIC_SETTINGS_V2:
        model_config = SettingsConfigDict(
            case_sensitive=True,
            env_file=".env",
            env_file_encoding="utf-8",
            extra="ignore",
        )
    else:
        class Config:
            case_sensitive = True
            env_file = ".env"
            extra = "ignore"


settings = Settings()
```

### 1. Plain-English Purpose:
Configures Pydantic to read variables from the `.env` file on disk with case sensitivity and UTF-8 encoding, ignoring any unrecognized environment variables. Finally, creates the single global `settings` instance for the entire backend.

### 2. Line-by-Line Breakdown:
- **Line 129 (`if HAS_PYDANTIC_SETTINGS_V2:`)**: Branch for modern Pydantic v2.
- **Line 130–135 (`model_config = SettingsConfigDict(...)`)**:
  - `case_sensitive=True`: Distinguishes between `SECRET_KEY` and `secret_key`.
  - `env_file=".env"`: Automatically parses the local `.env` file.
  - `env_file_encoding="utf-8"`: Handles special characters safely.
  - `extra="ignore"`: Silently ignores unrelated environment variables in the OS.
- **Line 136–140 (`else: class Config: ...`)**: Equivalent configuration class for Pydantic v1.
- **Line 143 (`settings = Settings()`)**: Instantiates the settings object as a global singleton.

### 3. Deep Term & Concept Expansion:
- **What is a Singleton?**: In software engineering, the Singleton pattern ensures that only one instance of a class exists throughout the program's lifecycle. Creating `settings = Settings()` once at module level means all files in our backend share the exact same configuration data in RAM without reloading `.env` from disk on every import.

### 4. Runtime Mechanics & Security Under the Hood:
- **Disk I/O Optimization**: Reading `.env` from disk happens exactly once when the server boots. All subsequent reads (`settings.DATABASE_URL`) access RAM directly ($O(1)$ property access), eliminating disk I/O bottlenecks.

---

## Overall File Viva & Technical Defense Guide

### Top 10 Viva Questions on `backend/app/core/config.py`:

#### Q1: What is the primary role of `config.py` in the system?
> **Model Answer**:  
> *"Sir, `config.py` serves as the centralized configuration manager. It uses Pydantic's `BaseSettings` to read, validate, type-cast, and supply environment variables (database credentials, cryptographic keys, rate limits, and Google SSO tokens) to the entire application through a single global `settings` singleton."*

#### Q2: Why did you use Pydantic `BaseSettings` instead of standard `os.getenv()` calls across every file?
> **Model Answer**:  
> *"Sir, using `os.getenv()` scattered across multiple files leads to code duplication, missing variable crashes at runtime, and lack of type safety. Pydantic `BaseSettings` centralizes configuration, performs automatic type conversion (e.g. parsing strings into integers or booleans), applies default fallback values, and validates critical parameters at server startup."*

#### Q3: What is the purpose of `_resolve_default_database_url()`?
> **Model Answer**:  
> *"Sir, cloud hosting platforms use different environment variable names for PostgreSQL (such as `DATABASE_URL`, `POSTGRES_URL`, or `SUPABASE_DB_URL`). This function checks all 5 common aliases, standardizes legacy `postgres://` prefixes to SQLAlchemy's required `postgresql://`, and provides a fallback Supabase cloud endpoint with encrypted SSL."*

#### Q4: How does the system handle zero-downtime cryptographic key rotation?
> **Model Answer**:  
> *"Sir, line 75 defines `PREVIOUS_SECRET_KEY`. When rotating JWT signing keys, administrators can set the new secret in `SECRET_KEY` while keeping the old secret in `PREVIOUS_SECRET_KEY`. Active student sessions signed with the previous key continue to validate until they naturally expire, preventing sudden user logouts during security updates."*

#### Q5: What database connection pooling parameters are defined, and what do they control?
> **Model Answer**:  
> *"Sir, lines 59–62 define:  
> - `DB_POOL_SIZE = 5`: Maintains 5 persistent connections in memory.  
> - `DB_MAX_OVERFLOW = 10`: Permits up to 10 additional temporary connections during traffic spikes.  
> - `DB_POOL_RECYCLE_SECONDS = 300`: Recycles connections every 5 minutes to prevent dropped sockets.  
> - `DB_CONNECT_TIMEOUT_SECONDS = 10`: Prevents server threads from hanging if the database is unreachable."*

#### Q6: How does `config.py` guarantee that `DEBUG` mode is never accidentally enabled in production?
> **Model Answer**:  
> *"Sir, line 54 includes `and not _is_production_env()`. Even if an administrator mistakenly sets `DEBUG=True` in a production `.env` file, the logic detects the production environment and forces `DEBUG` to `False`, preventing internal stack traces and SQL queries from ever being exposed to students."*

#### Q7: What is the role of `parsed_cors_origins`?
> **Model Answer**:  
> *"Sir, it is a `@property` method that parses the comma-separated `CORS_ORIGINS` string into a clean list of URLs, stripping whitespace and trailing slashes to prevent browser origin mismatch errors during CORS validation."*

#### Q8: How does the application enforce institutional email constraints at the configuration level?
> **Model Answer**:  
> *"Sir, line 98 sets `GOOGLE_ALLOWED_DOMAIN = "iiitnr.edu.in"`. When students log in via Google Workspace OAuth2/OIDC, the authentication service validates that the Google hosted domain claim matches this setting, preventing non-institutional accounts from logging in."*

#### Q9: What rate-limiting thresholds are defined in `config.py`?
> **Model Answer**:  
> *"Sir, lines 86–88 define brute-force defense limits:  
> - `MAX_LOGIN_ATTEMPTS_PER_WINDOW = 5`: Limits failed password attempts to 5.  
> - `LOGIN_LOCKOUT_MINUTES = 15`: Imposes a 15-minute lockout period upon exceeding failed attempts.  
> - `MAX_OTP_REQUESTS_PER_WINDOW = 5`: Prevents email and SMS OTP flooding attacks."*

#### Q10: Why is `extra="ignore"` configured in Pydantic's `SettingsConfigDict`?
> **Model Answer**:  
> *"Sir, production operating systems and cloud platforms inject many unrelated environment variables (such as `PATH`, `HOME`, or `VERCEL_GIT_COMMIT_SHA`). Setting `extra="ignore"` instructs Pydantic to ignore any variable not explicitly defined in `Settings`, preventing startup validation errors."*

---

## Quick Viva Summary Table

| Configuration Attribute | Default Value | Purpose | Security / Architectural Significance |
| :--- | :--- | :--- | :--- |
| **`ENVIRONMENT`** | `"production"` / `"development"` | Identifies runtime tier | Automatically toggles security rules |
| **`DEBUG`** | Auto-detected | Controls stack trace verbosity | Strictly forced to `False` in production |
| **`DATABASE_URL`** | Supabase AWS pooler | Database connection endpoint | Enforces encrypted SSL (`sslmode=require`) |
| **`DB_POOL_SIZE`** | `5` | Active persistent database connections | Eliminates TCP handshake overhead |
| **`SECRET_KEY`** | University secret string | Signs JWT access tokens | 256-bit symmetric cryptographic key |
| **`PREVIOUS_SECRET_KEY`**| `None` | Key rotation support | Enables zero-downtime secret rotation |
| **`ACCESS_TOKEN_EXPIRE_HOURS`**| `24` | Access token lifespan | Mitigates token theft exposure window |
| **`MAX_LOGIN_ATTEMPTS`** | `5` | Brute-force threshold | Triggers 15-minute account lockout |
| **`GOOGLE_ALLOWED_DOMAIN`**| `"iiitnr.edu.in"` | Google SSO constraint | Restricts authentication to university members |
| **`parsed_cors_origins`**| Localhost / Vercel list | Allowed frontend URLs | Strips trailing slashes to prevent CORS mismatches |
