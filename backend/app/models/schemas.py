from enum import Enum
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Any

class SeverityLevel(str, Enum):
    LOW = "Low"
    MODERATE = "Moderate"
    HIGH = "High"
    CRITICAL = "Critical"

class VerificationStatus(str, Enum):
    OFFICIAL = "Official source"
    VERIFIED = "Verified"
    UNVERIFIED = "Unverified report"
    EXPIRED = "Expired"

class DataOrigin(str, Enum):
    LIVE_WEATHER_API = "live_weather_api"
    OFFICIAL_ALERT_FEED = "official_alert_feed"
    VERIFIED_FACILITY_SOURCE = "verified_facility_source"
    USER_REPORT = "user_report"
    SIMULATED_DEMO_DATA = "simulated_demo_data"
    CACHED_PROVIDER_DATA = "cached_provider_data"

class HazardType(str, Enum):
    FLOOD = "flood"
    CYCLONE = "cyclone"
    STORM = "storm"
    HEAVY_RAIN = "heavy_rain"
    TSUNAMI = "tsunami"
    HEATWAVE = "heatwave"
    RESTRICTED = "restricted"
    OTHER = "other"

class FacilityType(str, Enum):
    SHELTER = "shelter"
    HOSPITAL = "hospital"
    RELIEF_CAMP = "relief_camp"
    EMERGENCY_SERVICE = "emergency_service"

# --- Weather Schemas ---
class WeatherCurrent(BaseModel):
    temperature: float
    rainfall: float
    wind_speed: float
    humidity: Optional[float] = None
    weather_condition: str
    is_live: bool
    data_origin: DataOrigin
    retrieved_at: datetime
    location_name: str
    latitude: float
    longitude: float

class DailyForecast(BaseModel):
    date: str
    max_temp: float
    min_temp: float
    precipitation: float
    condition: str

class WeatherResponse(BaseModel):
    current: WeatherCurrent
    forecast: List[DailyForecast] = []
    status: str = "success"
    message: Optional[str] = None

# --- Alert Schemas ---
class AlertBase(BaseModel):
    id: str
    title: str
    description: str
    hazard_type: HazardType
    severity: SeverityLevel
    affected_location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_km: Optional[float] = None
    issuing_authority: str
    source_url: str
    published_at: datetime
    updated_at: datetime
    valid_until: Optional[datetime] = None
    verification_status: VerificationStatus
    data_origin: DataOrigin
    recommended_action: str
    translated_title: Optional[str] = None
    translated_description: Optional[str] = None
    translation_lang: Optional[str] = None

class AlertResponse(BaseModel):
    alerts: List[AlertBase]
    total: int
    data_freshness: datetime

# --- Map Facility & Hazard Schemas ---
class Facility(BaseModel):
    id: str
    name: str
    facility_type: FacilityType
    latitude: float
    longitude: float
    address: str
    contact_number: Optional[str] = None
    capacity: Optional[int] = None
    current_occupancy: Optional[int] = None
    is_open: bool
    status_verified_at: datetime
    data_origin: DataOrigin
    source_notes: str

class HazardZone(BaseModel):
    id: str
    hazard_type: HazardType
    severity: SeverityLevel
    title: str
    description: str
    coordinates: List[List[float]] # Polygons [[lat, lng], ...] or circle center
    radius_meters: Optional[float] = None
    is_polygon: bool = False
    source_organization: str
    source_url: str
    reported_at: datetime
    data_origin: DataOrigin
    verification_status: VerificationStatus

# --- Assistant Schemas ---
class ChatMessage(BaseModel):
    role: str # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    user_location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class SourceCitation(BaseModel):
    organization: str
    url: str
    published_at: Optional[datetime] = None
    verification_status: VerificationStatus

class ChatResponse(BaseModel):
    reply: str
    language: str
    citations: List[SourceCitation] = []
    data_timestamps: Optional[str] = None
    is_ai_generated: bool
    model_or_rule: str
    disclaimer: str

# --- User & Registration Schemas ---
class UserRegister(BaseModel):
    email: str
    full_name: str
    phone_number: Optional[str] = None
    destination: str
    language_preference: str = "en"
    emergency_contact: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    destination: Optional[str] = None
    language_preference: Optional[str] = None
    emergency_contact: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str
    phone_number: Optional[str] = None
    destination: str
    language_preference: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    emergency_contact: Optional[str] = None
    created_at: datetime
    is_active: bool

# --- Incident Report Schemas ---
class IncidentCreate(BaseModel):
    title: str
    description: str
    latitude: float
    longitude: float
    incident_type: str
    severity: str
    photo_url: Optional[str] = None

class IncidentResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: str
    latitude: float
    longitude: float
    incident_type: str
    severity: str
    status: str
    verification_status: str
    photo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# --- SOS Schemas ---
class SOSCreate(BaseModel):
    latitude: float
    longitude: float
    message: Optional[str] = None

class SOSResponse(BaseModel):
    id: str
    user_id: str
    latitude: float
    longitude: float
    status: str
    message: Optional[str] = None
    created_at: datetime

class AuthorityUpdate(BaseModel):
    verification_status: Optional[str] = None
    status: Optional[str] = None
    resolution_notes: Optional[str] = None

# --- Config Status ---
class ServiceStatus(BaseModel):
    service_name: str
    is_live: bool
    provider: str
    details: str

class ConfigStatusResponse(BaseModel):
    app_mode: str
    services: List[ServiceStatus]
    trusted_domains_count: int
    server_time: datetime
