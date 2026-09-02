from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional, List

class Settings(BaseSettings):
    PROJECT_NAME: str = "OmniPresence API"
    API_V1_STR: str = "/api/v1"
    
    # Database configuration (defaults to async SQLite for local/test, PostgreSQL for Supabase)
    DATABASE_URL: str = "sqlite+aiosqlite:///./omnipresence.db"
    
    # Supabase credentials (optional for standalone local mode)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    SUPABASE_JWT_SECRET: Optional[str] = "omnipresence-phase1-super-secret-jwt-key"
    
    # Gemini AI configuration
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.0-flash"
    
    # Weather configuration
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1/forecast"
    
    # Security
    SECRET_KEY: str = "omnipresence-phase1-secret-token-key-2026"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env")

settings = Settings()
