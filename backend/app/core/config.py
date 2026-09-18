import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MediNexus AI Backend"
    API_V1_STR: str = "/api"
    
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "medinexus_ai")
    
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
    )

    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev_secret_key_medinexus_ai_2026_super_secure_change_in_production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # LLM Interface configuration for Shivansh Gupta's AI engine
    NVIDIA_NIM_API_KEY: str = os.getenv("NVIDIA_NIM_API_KEY", "")
    NVIDIA_NIM_ENDPOINT: str = os.getenv("NVIDIA_NIM_ENDPOINT", "https://integrate.api.nvidia.com/v1")

    # Demo Contact Configuration
    DEMO_EMERGENCY_CONTACT: str = os.getenv("DEMO_EMERGENCY_CONTACT", "9111711122")
    DEMO_AMBULANCE_CONTACT: str = os.getenv("DEMO_AMBULANCE_CONTACT", "8303936384")

    # Telephony Provider Configuration (Outbound Voice Driver Calls)
    TELEPHONY_PROVIDER: str = os.getenv("TELEPHONY_PROVIDER", "twilio")
    TELEPHONY_ACCOUNT_ID: str = os.getenv("TELEPHONY_ACCOUNT_ID", "")
    TELEPHONY_AUTH_TOKEN: str = os.getenv("TELEPHONY_AUTH_TOKEN", "")
    TELEPHONY_FROM_NUMBER: str = os.getenv("TELEPHONY_FROM_NUMBER", "")
    DEMO_DRIVER_CONTACT: str = os.getenv("DEMO_DRIVER_CONTACT", os.getenv("DEMO_AMBULANCE_CONTACT", "8303936384"))

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
