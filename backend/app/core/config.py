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


def _resolve_default_database_url() -> str:
    """
    Resolve database connection URL from Vercel / Supabase environment variables,
    falling back to local SQLite only during local development or automated tests.
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
    return "sqlite:///./smart_complaints.db"


def _is_production_env() -> bool:
    env = os.getenv("ENVIRONMENT", os.getenv("VERCEL_ENV", "")).strip().lower()
    return bool(os.getenv("VERCEL")) or env in ("production", "prod", "staging")


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
    ENFORCE_STRICT_RBAC: bool = (
        os.getenv(
            "ENFORCE_STRICT_RBAC",
            "false" if "pytest" in sys.modules else "true",
        ).lower()
        in ("true", "1", "yes")
    )
    ALLOW_UNREGISTERED_LOGIN_PROVISIONING: bool = (
        os.getenv("ALLOW_UNREGISTERED_LOGIN_PROVISIONING", "false").lower()
        in ("true", "1", "yes")
    )
    EXPOSE_DEV_OTP_IN_RESPONSE: bool = (
        os.getenv("EXPOSE_DEV_OTP_IN_RESPONSE", "false" if _is_production_env() else "true").lower()
        in ("true", "1", "yes")
    )
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

    @property
    def parsed_cors_origins(self) -> List[str]:
        raw = (self.CORS_ORIGINS or "").strip()
        if not raw:
            return ["http://localhost:5173", "http://127.0.0.1:5173"]
        if raw == "*":
            return ["*"]
        return [origin.strip().rstrip("/") for origin in raw.split(",") if origin.strip()]

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
