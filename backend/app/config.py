import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "Sehat Sathi AI - The Two-Minute Doctor"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Storage & Uploads
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "storage", "uploads")
    SYNTHETIC_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "storage", "synthetic")
    MAX_UPLOAD_SIZE_MB: int = 15
    ALLOWED_EXTENSIONS: list[str] = [".pdf", ".png", ".jpg", ".jpeg"]
    
    # Database
    DATABASE_URL: str = "sqlite:///./sehat_sathi.db"
    
    # Security & Tokens
    SECRET_KEY: str = "sehat-sathi-super-secure-production-secret-change-in-prod-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Firebase / Mock Auth
    FIREBASE_PROJECT_ID: Optional[str] = None
    USE_MOCK_AUTH_FALLBACK: bool = True
    
    # AI LLM Provider
    LLM_API_KEY: Optional[str] = None
    LLM_MODEL: str = "gemini-1.5-pro"
    USE_SYNTHETIC_AI_FALLBACK: bool = True

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
