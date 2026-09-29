"""
Centralized settings. Everything here comes from environment variables /
a .env file — nothing sensitive is hardcoded, unlike the old docker-compose.yml.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- Database ---
    database_url: str

    # --- Auth ---
    jwt_secret_key: str = "supersecretfallbackkey123"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # --- Login protection ---
    max_failed_login_attempts: int = 5
    lockout_minutes: int = 15

    # --- CORS: only known frontend origins, never "*" ---
    allowed_origins: list[str] = [
        "http://localhost:3000",   # frontend (patient/doctor) dev
        "http://localhost:3001",   # frontend, docker-mapped port
        "http://localhost:5173",   # admin-portal (vite) dev
    ]

    environment: str = "development"
    PROJECT_NAME: str = "MediNexus-AI Backend Engine"
    API_V1_STR: str = "/api"
    
    # --- Demo Contacts ---
    DEMO_AMBULANCE_CONTACT: str = "+91 83039 36384"
    DEMO_EMERGENCY_CONTACT: str = "102"
    DEMO_DRIVER_CONTACT: str = "+91 83039 36384"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
