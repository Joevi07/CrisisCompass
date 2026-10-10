import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parents[2] / ".env")
except ImportError:
    pass

class Settings:
    APP_NAME: str = "TravelTech: CrisisCompass"
    APP_VERSION: str = "1.0.0"
    APP_MODE: str = os.getenv("APP_MODE", "demo")
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./crisis_compass.db")
    
    # Weather
    WEATHER_PROVIDER: str = os.getenv("WEATHER_PROVIDER", "open-meteo")
    OPEN_METEO_BASE_URL: str = os.getenv("OPEN_METEO_BASE_URL", "https://api.open-meteo.com/v1")
    
    # Trusted Sources
    TRUSTED_SOURCE_DOMAINS: list[str] = [
        d.strip() for d in os.getenv(
            "TRUSTED_SOURCE_DOMAINS", 
            "weather.gov,meteoalarm.org,imd.gov.in,bmdi.gov,nhc.noaa.gov,redcross.org,who.int,gdacs.org"
        ).split(",") if d.strip()
    ]
    
    # LLM Assistant
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "rule_based")
    LLM_API_KEY: str | None = os.getenv("LLM_API_KEY", "") or None
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o-mini")
    
    # Translation
    TRANSLATION_PROVIDER: str = os.getenv("TRANSLATION_PROVIDER", "built_in")
    TRANSLATION_API_KEY: str | None = os.getenv("TRANSLATION_API_KEY", "") or None
    
    # CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    CORS_ALLOWED_ORIGINS: list[str] = [
        origin.strip().rstrip("/")
        for origin in os.getenv("CORS_ALLOWED_ORIGINS", os.getenv("FRONTEND_URL", "http://localhost:5173")).split(",")
        if origin.strip()
    ]

    # Admin dashboard authentication. Configure both values in backend/.env.
    ADMIN_ACCESS_CODE: str | None = os.getenv("ADMIN_ACCESS_CODE") or None
    ADMIN_TOKEN_SECRET: str | None = os.getenv("ADMIN_TOKEN_SECRET") or None

settings = Settings()
