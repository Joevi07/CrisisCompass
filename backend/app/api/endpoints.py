from fastapi import APIRouter, Query, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.models.schemas import (
    WeatherResponse, AlertResponse, AlertBase,
    Facility, HazardZone, ChatRequest, ChatResponse,
    ConfigStatusResponse, ServiceStatus,
    UserRegister, UserUpdate, UserProfile,
    IncidentCreate, IncidentResponse,
    SOSCreate, SOSResponse
)
from app.services.weather_service import weather_service
from app.services.alert_service import alert_service
from app.services.assistant_service import assistant_service
from app.services.translation_service import translation_service
from app.services.user_service import UserService, IncidentService, SOSService
from app.services.routing_service import routing_service
from app.database import get_db
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

# ============ User Registration & Profile Endpoints ============

@router.post("/users/register", response_model=UserProfile)
def register_user(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new tourist account."""
    try:
        return UserService.register_user(db, user_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/users/{user_id}", response_model=UserProfile)
def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    """Get user profile by ID."""
    try:
        return UserService.get_user(db, user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/users/email/{email}", response_model=UserProfile)
def get_user_by_email(email: str, db: Session = Depends(get_db)):
    """Get user profile by email."""
    try:
        return UserService.get_user_by_email(db, email)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.put("/users/{user_id}", response_model=UserProfile)
def update_user_profile(user_id: str, update_data: UserUpdate, db: Session = Depends(get_db)):
    """Update user profile."""
    try:
        return UserService.update_user(db, user_id, update_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/users/{user_id}")
def delete_user_account(user_id: str, db: Session = Depends(get_db)):
    """Deactivate user account."""
    try:
        UserService.delete_user(db, user_id)
        return {"message": "User account deactivated successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# ============ Incident Reporting Endpoints ============

@router.post("/incidents", response_model=IncidentResponse)
def create_incident(user_id: str = Query(..., description="User ID of reporter"), 
                   incident_data: IncidentCreate = None, 
                   db: Session = Depends(get_db)):
    """Create a new incident report."""
    if incident_data is None:
        raise HTTPException(status_code=400, detail="Incident data required")
    try:
        return IncidentService.create_incident(db, user_id, incident_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/incidents/{incident_id}", response_model=IncidentResponse)
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    """Get incident report by ID."""
    try:
        return IncidentService.get_incident(db, incident_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/users/{user_id}/incidents", response_model=List[IncidentResponse])
def get_user_incidents(user_id: str, db: Session = Depends(get_db)):
    """Get all incidents reported by a user."""
    return IncidentService.get_user_incidents(db, user_id)

# ============ SOS Request Endpoints ============

@router.post("/sos", response_model=SOSResponse)
def create_sos_request(user_id: str = Query(..., description="User ID"), 
                       sos_data: SOSCreate = None, 
                       db: Session = Depends(get_db)):
    """Submit a new SOS request."""
    if sos_data is None:
        raise HTTPException(status_code=400, detail="SOS data required")
    try:
        return SOSService.create_sos(db, user_id, sos_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/sos/{sos_id}", response_model=SOSResponse)
def get_sos_request(sos_id: str, db: Session = Depends(get_db)):
    """Get SOS request by ID."""
    try:
        return SOSService.get_sos(db, sos_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/sos/active", response_model=List[SOSResponse])
def get_active_sos_requests(db: Session = Depends(get_db)):
    """Get all active SOS requests (for authority dashboard)."""
    return SOSService.get_active_sos_requests(db)

@router.put("/sos/{sos_id}/resolve")
def resolve_sos_request(sos_id: str, admin_id: str = Query(None), db: Session = Depends(get_db)):
    """Mark SOS request as resolved (for authorities)."""
    try:
        return SOSService.resolve_sos(db, sos_id, admin_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# ============ Safe Routing Endpoints ============

class RouteRequest(BaseModel):
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    mode: str = "walking"  # walking or driving

class WaypointResponse(BaseModel):
    lat: float
    lng: float
    name: str

class SafeRouteResponse(BaseModel):
    distance_km: float
    estimated_time_min: float
    safety_score: float
    hazard_intersections: List[dict]
    waypoints: List[WaypointResponse]
    start_name: str = "Start"
    end_name: str = "Destination"
    recommendations: List[str]

@router.post("/route/safe", response_model=SafeRouteResponse)
def calculate_safe_route(request: RouteRequest):
    """Calculate a safe route avoiding hazard zones."""
    try:
        # Get current hazards
        hazards = alert_service.get_hazard_zones()
        routing_service.set_hazard_zones([h.__dict__ if hasattr(h, '__dict__') else h for h in hazards])
        
        # Calculate route
        route = routing_service.calculate_hazard_free_route(
            request.start_lat,
            request.start_lng,
            request.end_lat,
            request.end_lng,
            mode=request.mode
        )
        
        # Generate safety recommendations
        recommendations = []
        if route.hazard_intersections:
            for hazard in route.hazard_intersections:
                recommendations.append(
                    f"Avoid {hazard['type']} ({hazard['severity']} severity) near coordinates {hazard['lat']:.2f}, {hazard['lng']:.2f}"
                )
        
        if route.safety_score < 0.7:
            recommendations.append("⚠️ Route passes through or near hazard areas. Stay alert!")
        
        if not recommendations:
            recommendations.append("✅ Route is safe with no known hazards.")
        
        return SafeRouteResponse(
            distance_km=route.distance_km,
            estimated_time_min=route.estimated_time_min,
            safety_score=route.safety_score,
            hazard_intersections=route.hazard_intersections,
            waypoints=[
                WaypointResponse(lat=wp.lat, lng=wp.lng, name=wp.name)
                for wp in route.waypoints
            ],
            recommendations=recommendations
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============ Authority Dashboard Endpoints ============

@router.get("/admin/incidents", response_model=List[IncidentResponse])
def get_all_incidents(status: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Get all incident reports (authority view)."""
    from sqlalchemy import String, cast
    query = db.query(DBIncident)
    if status:
        query = query.filter(DBIncident.status == status)
    return [IncidentService._db_incident_to_response(i) for i in query.all()]

@router.put("/admin/incidents/{incident_id}/verify")
def verify_incident(incident_id: str, admin_id: str = Query(...), db: Session = Depends(get_db)):
    """Verify an incident report."""
    try:
        return IncidentService.update_incident_status(db, incident_id, "verified", admin_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.put("/admin/incidents/{incident_id}/resolve")
def resolve_incident(incident_id: str, admin_id: str = Query(...), db: Session = Depends(get_db)):
    """Mark incident as resolved."""
    try:
        return IncidentService.update_incident_status(db, incident_id, "resolved", admin_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

class DashboardStats(BaseModel):
    total_incidents: int
    unverified_incidents: int
    verified_incidents: int
    resolved_incidents: int
    active_sos_requests: int
    critical_hazards: int
    total_users: int

@router.get("/admin/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics for authority users."""
    from sqlalchemy import func
    
    total_incidents = db.query(func.count(DBIncident.id)).scalar() or 0
    unverified = db.query(func.count(DBIncident.id)).filter(DBIncident.status == "unverified").scalar() or 0
    verified = db.query(func.count(DBIncident.id)).filter(DBIncident.status == "verified").scalar() or 0
    resolved = db.query(func.count(DBIncident.id)).filter(DBIncident.status == "resolved").scalar() or 0
    active_sos = db.query(func.count(DBSOS.id)).filter(DBSOS.status == "active").scalar() or 0
    total_users = db.query(func.count(DBUser.id)).filter(DBUser.is_active == True).scalar() or 0
    
    # Count critical hazards
    hazards = alert_service.get_hazard_zones()
    critical_hazards = sum(1 for h in hazards if hasattr(h, 'severity') and h.severity == 'Critical')
    
    return DashboardStats(
        total_incidents=total_incidents,
        unverified_incidents=unverified,
        verified_incidents=verified,
        resolved_incidents=resolved,
        active_sos_requests=active_sos,
        critical_hazards=critical_hazards,
        total_users=total_users
    )

@router.get("/admin/sos/active", response_model=List[SOSResponse])
def get_pending_sos(db: Session = Depends(get_db)):
    """Get active SOS requests requiring attention."""
    return SOSService.get_active_sos_requests(db)

from app.database import DBIncident, DBSOS, DBUser
