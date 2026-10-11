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
from app.core.admin_auth import issue_admin_token, require_admin
from app.services.live_geo_service import live_geo_service

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
    try:
        return await weather_service.get_weather(location)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error))

@router.get("/alerts", response_model=AlertResponse)
async def get_alerts(
    location: Optional[str] = Query(None, description="Filter by location keyword"),
    severity: Optional[str] = Query(None, description="Filter by Low, Moderate, High, Critical"),
    lang: Optional[str] = Query("en", description="Target language code"),
    latitude: Optional[float] = Query(None, ge=-90, le=90),
    longitude: Optional[float] = Query(None, ge=-180, le=180),
    radius_km: float = Query(500, ge=1, le=2000),
    india_only: bool = Query(True, description="Enforce India alerts only"),
):
    try:
        alerts = await live_geo_service.flood_alerts(location, latitude, longitude, radius_km, india_only=india_only)
    except Exception:
        raise HTTPException(status_code=503, detail="Live disaster feed is temporarily unavailable. Check connection or try again later.")

    if severity:
        alerts = [alert for alert in alerts if alert.severity.value.lower() == severity.lower()]
    
    # Enrich with translated texts if requested
    if lang and lang != "en":
        for a in alerts:
            a.translated_title = translation_service.translate_text(a.title, lang)
            a.translated_description = translation_service.translate_text(a.description, lang)
            a.translated_action = translation_service.translate_text(a.recommended_action, lang)
            a.translation_lang = lang

    return AlertResponse(
        alerts=alerts,
        total=len(alerts),
        data_freshness=datetime.utcnow()
    )

@router.get("/alerts/{alert_id}", response_model=AlertBase)
async def get_alert_by_id(alert_id: str, lang: Optional[str] = Query("en", description="Target language code")):
    try:
        live_alerts = await live_geo_service.flood_alerts()
        alert = next((item for item in live_alerts if item.id == alert_id), None)
    except Exception as error:
        alert = alert_service.get_alert_by_id(alert_id)
        if alert is None:
            raise HTTPException(status_code=503, detail="Live disaster feed is temporarily unavailable.") from error

    if alert is None:
        alert = alert_service.get_alert_by_id(alert_id)

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    if lang and lang != "en":
        alert.translated_title = translation_service.translate_text(alert.title, lang)
        alert.translated_description = translation_service.translate_text(alert.description, lang)
        alert.translated_action = translation_service.translate_text(alert.recommended_action, lang)
        alert.translation_lang = lang
    return alert

@router.get("/map/hazards", response_model=List[HazardZone])
async def get_hazard_zones(
    latitude: Optional[float] = Query(None, ge=-90, le=90),
    longitude: Optional[float] = Query(None, ge=-180, le=180),
    radius_km: float = Query(500, ge=1, le=2000),
):
    try:
        return await live_geo_service.hazards_near(latitude, longitude, radius_km)
    except Exception:
        raise HTTPException(status_code=503, detail="Live hazard feed is temporarily unavailable.")


@router.get("/map/nearby", response_model=List[Facility])
async def get_nearby_facilities(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(20, ge=1, le=50),
):
    try:
        return await live_geo_service.nearby_facilities(latitude, longitude, radius_km)
    except Exception:
        raise HTTPException(status_code=503, detail="Nearby OpenStreetMap places are temporarily unavailable.")

@router.get("/map/shelters", response_model=List[Facility])
async def get_shelters(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(20, ge=1, le=50),
    facility_type: Optional[str] = Query(None, description="shelter or hospital"),
):
    facilities = await live_geo_service.nearby_facilities(latitude, longitude, radius_km)
    if facility_type:
        facilities = [facility for facility in facilities if facility.facility_type.value == facility_type]
    return facilities

@router.get("/sources")
def get_sources_registry():
    return {
        "trusted_domains": settings.TRUSTED_SOURCE_DOMAINS,
        "total_trusted": len(settings.TRUSTED_SOURCE_DOMAINS),
        "validation_strategy": "Domain allowlisting with SSRF protection and HTTPS requirement"
    }

class TranslateRequest(BaseModel):
    text: str
    target_lang: str

class TranslateResponse(BaseModel):
    original_text: str
    translated_text: str
    target_lang: str
    is_verified: bool

@router.get("/translations")
def get_translations(lang: str = Query("en")):
    return translation_service.get_translations(lang)

@router.post("/translate", response_model=TranslateResponse)
def translate_endpoint(req: TranslateRequest):
    translated = translation_service.translate_text(req.text, req.target_lang)
    is_verified = (translated != req.text) or (req.target_lang == "en")
    return TranslateResponse(
        original_text=req.text,
        translated_text=translated,
        target_lang=req.target_lang,
        is_verified=is_verified
    )

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
            provider="GDACS global flood RSS feed",
            details="Flood bulletins updated periodically and cached for low-network use. Open source bulletins and confirm with local authorities."
        ),
        ServiceStatus(
            service_name="Interactive Mapping",
            is_live=True,
            provider="OpenStreetMap tiles, Overpass nearby places, and Leaflet",
            details="Community facility listings; operating status and emergency suitability are not verified."
        ),
        ServiceStatus(
            service_name="Multilingual Emergency Engine",
            is_live=False,
            provider="CrisisCompass Pre-mapped Safety Dictionaries",
            details="English, Tamil, Hindi, French, Spanish verified translations."
        ),
        ServiceStatus(
            service_name="Emergency AI Assistant",
            is_live=False,
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

class AdminLoginRequest(BaseModel):
    access_code: str


@router.post("/admin/login")
def admin_login(request: AdminLoginRequest):
    """Exchange the configured authority access code for an expiring session token."""
    import hmac

    if not settings.ADMIN_ACCESS_CODE:
        raise HTTPException(status_code=503, detail="Admin access is not configured on this server.")
    if not hmac.compare_digest(request.access_code, settings.ADMIN_ACCESS_CODE):
        raise HTTPException(status_code=401, detail="Incorrect authority access code.")
    return {"access_token": issue_admin_token(), "token_type": "bearer"}

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

@router.get("/sos/{sos_id}", response_model=SOSResponse, dependencies=[Depends(require_admin)])
def get_sos_request(sos_id: str, db: Session = Depends(get_db)):
    """Get SOS request by ID."""
    try:
        return SOSService.get_sos(db, sos_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/sos/active", response_model=List[SOSResponse], dependencies=[Depends(require_admin)])
def get_active_sos_requests(db: Session = Depends(get_db)):
    """Get all active SOS requests (for authority dashboard)."""
    return SOSService.get_active_sos_requests(db)

@router.put("/sos/{sos_id}/resolve", dependencies=[Depends(require_admin)])
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
async def calculate_safe_route(request: RouteRequest):
    """Calculate a safe route avoiding hazard zones."""
    try:
        # Get current hazards
        mid_lat = (request.start_lat + request.end_lat) / 2
        mid_lng = (request.start_lng + request.end_lng) / 2
        hazard_feed_available = True
        try:
            hazards = await live_geo_service.hazards_near(mid_lat, mid_lng, 500)
        except Exception:
            # Route estimation should remain available when the external alert feed is down.
            # The response will contain no current feed hazards, so the client warns the user.
            hazards = []
            hazard_feed_available = False
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
        
        if not recommendations and hazard_feed_available:
            recommendations.append("No hazards were found in the connected alert feed. Confirm local conditions before traveling; this route is not a safety guarantee.")
        elif not hazard_feed_available:
            recommendations.append("Live hazard data is unavailable. This is a route estimate only, not a verified safe route. Check local alerts before traveling.")
        
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

@router.get("/admin/incidents", response_model=List[IncidentResponse], dependencies=[Depends(require_admin)])
def get_all_incidents(status: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Get all incident reports (authority view)."""
    from sqlalchemy import String, cast
    query = db.query(DBIncident)
    if status:
        query = query.filter(DBIncident.status == status)
    return [IncidentService._db_incident_to_response(i) for i in query.all()]

@router.put("/admin/incidents/{incident_id}/verify", dependencies=[Depends(require_admin)])
def verify_incident(incident_id: str, admin_id: str = Query(...), db: Session = Depends(get_db)):
    """Verify an incident report."""
    try:
        return IncidentService.update_incident_status(db, incident_id, "verified", admin_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.put("/admin/incidents/{incident_id}/resolve", dependencies=[Depends(require_admin)])
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

@router.get("/admin/stats", response_model=DashboardStats, dependencies=[Depends(require_admin)])
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

@router.get("/admin/sos/active", response_model=List[SOSResponse], dependencies=[Depends(require_admin)])
def get_pending_sos(db: Session = Depends(get_db)):
    """Get active SOS requests requiring attention."""
    return SOSService.get_active_sos_requests(db)

from app.database import DBIncident, DBSOS, DBUser
