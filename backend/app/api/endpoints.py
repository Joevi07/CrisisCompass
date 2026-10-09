from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from datetime import datetime
from app.models.schemas import (
    WeatherResponse, AlertResponse, AlertBase,
    Facility, HazardZone, ChatRequest, ChatResponse,
    ConfigStatusResponse, ServiceStatus
)
from app.services.weather_service import weather_service
from app.services.alert_service import alert_service
from app.services.assistant_service import assistant_service
from app.services.translation_service import translation_service
from app.core.config import settings

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "mode": settings.APP_MODE,
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/weather", response_model=WeatherResponse)
async def get_weather(location: str = Query("chennai", description="City or destination name")):
    return await weather_service.get_weather(location)

@router.get("/alerts", response_model=AlertResponse)
def get_alerts(
    location: Optional[str] = Query(None, description="Filter by location keyword"),
    severity: Optional[str] = Query(None, description="Filter by Low, Moderate, High, Critical"),
    lang: Optional[str] = Query("en", description="Target language code (en, ta, hi, fr, es)")
):
    alerts = alert_service.get_alerts(location=location, severity=severity)
    
    # Enrich with translated texts if requested
    if lang and lang != "en":
        for a in alerts:
            a.translated_title = translation_service.translate_text(a.title, lang)
            a.translated_description = translation_service.translate_text(a.description, lang)
            a.translation_lang = lang

    return AlertResponse(
        alerts=alerts,
        total=len(alerts),
        data_freshness=datetime.utcnow()
    )

@router.get("/alerts/{alert_id}", response_model=AlertBase)
def get_alert_by_id(alert_id: str):
    alert = alert_service.get_alert_by_id(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.get("/map/hazards", response_model=List[HazardZone])
def get_hazard_zones():
    return alert_service.get_hazard_zones()

@router.get("/map/shelters", response_model=List[Facility])
def get_shelters(facility_type: Optional[str] = Query(None, description="shelter or hospital")):
    return alert_service.get_facilities(facility_type=facility_type)

@router.get("/sources")
def get_sources_registry():
    return {
        "trusted_domains": settings.TRUSTED_SOURCE_DOMAINS,
        "total_trusted": len(settings.TRUSTED_SOURCE_DOMAINS),
        "validation_strategy": "Domain allowlisting with SSRF protection and HTTPS requirement"
    }

@router.get("/translations")
def get_translations(lang: str = Query("en")):
    return translation_service.get_translations(lang)

@router.post("/assistant/chat", response_model=ChatResponse)
async def chat_assistant(request: ChatRequest):
    return await assistant_service.chat(request)

@router.get("/config/status", response_model=ConfigStatusResponse)
def get_config_status():
    services = [
        ServiceStatus(
            service_name="Weather Provider",
            is_live=True,
            provider="Open-Meteo Public API (Free/No-Key)",
            details="Live meteorological forecasts & current atmospheric metrics."
        ),
        ServiceStatus(
            service_name="Disaster Alert Registry",
            is_live=True,
            provider="CrisisCompass Authoritative Registry + IMD/NOAA feeds",
            details="Active normalized alerts with source verification and validity detection."
        ),
        ServiceStatus(
            service_name="Interactive Mapping",
            is_live=True,
            provider="OpenStreetMap & Leaflet",
            details="Zero-key vector/tile service for shelters and hazard zones."
        ),
        ServiceStatus(
            service_name="Multilingual Emergency Engine",
            is_live=True,
            provider="CrisisCompass Pre-mapped Safety Dictionaries",
            details="English, Tamil, Hindi, French, Spanish verified translations."
        ),
        ServiceStatus(
            service_name="Emergency AI Assistant",
            is_live=True,
            provider=f"Safe Rule-Based / Deterministic System ({settings.LLM_PROVIDER})",
            details="Verified emergency answers, anti-hallucination guardrails, and source citations."
        )
    ]
    return ConfigStatusResponse(
        app_mode=settings.APP_MODE,
        services=services,
        trusted_domains_count=len(settings.TRUSTED_SOURCE_DOMAINS),
        server_time=datetime.utcnow()
    )
