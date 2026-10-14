"""
SmartComplaintHandler - Application Settings & Configuration
Blueprint Reference: V1/M1/backend/01_config_and_env.md
Role: Pydantic BaseSettings loading environment variables (DATABASE_URL, CORS, DEBUG).
"""
try:
    from pydantic_settings import BaseSettings
except ImportError:
    try:
        from pydantic import BaseSettings
    except ImportError:
        from pydantic import BaseModel as BaseSettings

from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Complaint Handler"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "postgresql://postgres.swtckhxitsxvphtenaqo:2TKUGaPmLDqXYKx0@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
    DEBUG: bool = True

    # Google Workspace OAuth SSO & IIIT-NR Domain Constraints
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_ALLOWED_DOMAIN: str = "iiitnr.edu.in"
    GOOGLE_STRICT_TOKEN_VERIFY: bool = False
    AUTO_SEED_ON_STARTUP: bool = False

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
