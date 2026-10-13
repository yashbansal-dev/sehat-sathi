import os
from pydantic_settings import BaseSettings
from typing import Optional

is_vercel = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))
default_db_url = "sqlite:////tmp/sehat_sathi.db" if is_vercel else "sqlite:///./sehat_sathi.db"
default_upload_dir = "/tmp/uploads" if is_vercel else os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "storage", "uploads")
default_synth_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "storage", "synthetic")

class Settings(BaseSettings):
    APP_NAME: str = "Sehat Sathi AI - The Two-Minute Doctor"
    ENVIRONMENT: str = "production" if is_vercel else "development"
    DEBUG: bool = not is_vercel
    
    # Storage & Uploads
    UPLOAD_DIR: str = os.environ.get("UPLOAD_DIR", default_upload_dir)
    SYNTHETIC_DIR: str = os.environ.get("SYNTHETIC_DIR", default_synth_dir)
    MAX_UPLOAD_SIZE_MB: int = 15
    ALLOWED_EXTENSIONS: list[str] = [".pdf", ".png", ".jpg", ".jpeg"]
    
    # Database
    DATABASE_URL: str = os.environ.get("DATABASE_URL", default_db_url)
    
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
