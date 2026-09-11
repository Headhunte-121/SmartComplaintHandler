"""
SmartComplaintHandler - Application Settings & Configuration
Blueprint Reference: V1/M1/backend/01_config_and_env.md
Role: Pydantic BaseSettings loading environment variables (DATABASE_URL, CORS, DEBUG).
"""
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Complaint Handler"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "sqlite:///./smart_complaints.db"
    DEBUG: bool = True

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
