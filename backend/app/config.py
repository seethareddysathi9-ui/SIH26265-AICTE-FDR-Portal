from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    SECRET_KEY: str = "sih2026-aicte-fdr-portal-secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    DATABASE_URL: str = "sqlite:///./sih_fdr.db"
    UPLOAD_DIR: str = "uploads"
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"

settings = Settings()
