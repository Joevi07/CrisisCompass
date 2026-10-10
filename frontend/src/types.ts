export type SeverityLevel = 'Low' | 'Moderate' | 'High' | 'Critical';
export type VerificationStatus = 'Official source' | 'Verified' | 'Unverified report' | 'Expired';
export type DataOrigin = 
  | 'live_weather_api' 
  | 'official_alert_feed' 
  | 'verified_facility_source' 
  | 'user_report' 
  | 'simulated_demo_data' 
  | 'cached_provider_data';

export type HazardType = 'flood' | 'cyclone' | 'storm' | 'heavy_rain' | 'tsunami' | 'heatwave' | 'restricted' | 'other';
export type FacilityType = 'shelter' | 'hospital' | 'relief_camp' | 'emergency_service';

export interface WeatherCurrent {
  temperature: number;
  rainfall: number;
  wind_speed: number;
  humidity?: number;
  weather_condition: string;
  is_live: boolean;
  data_origin: DataOrigin;
  retrieved_at: string;
  location_name: string;
  latitude: number;
  longitude: number;
}

export interface DailyForecast {
  date: string;
  max_temp: number;
  min_temp: number;
  precipitation: number;
  condition: string;
}

export interface WeatherResponse {
  current: WeatherCurrent;
  forecast: DailyForecast[];
  status: string;
  message?: string;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  hazard_type: HazardType;
  severity: SeverityLevel;
  affected_location: string;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  issuing_authority: string;
  source_url: string;
  published_at: string;
  updated_at: string;
  valid_until?: string;
  verification_status: VerificationStatus;
  data_origin: DataOrigin;
  recommended_action: string;
  translated_title?: string;
  translated_description?: string;
  translation_lang?: string;
}

export interface Facility {
  id: string;
  name: string;
  facility_type: FacilityType;
  latitude: number;
  longitude: number;
  address: string;
  contact_number?: string;
  capacity?: number;
  current_occupancy?: number;
  is_open: boolean;
  status_verified_at: string;
  data_origin: DataOrigin;
  source_notes: string;
}

export interface HazardZone {
  id: string;
  hazard_type: HazardType;
  severity: SeverityLevel;
  title: string;
  description: string;
  coordinates: number[][];
  radius_meters?: number;
  is_polygon: boolean;
  source_organization: string;
  source_url: string;
  reported_at: string;
  data_origin: DataOrigin;
  verification_status: VerificationStatus;
}

export interface SourceCitation {
  organization: string;
  url: string;
  published_at?: string;
  verification_status: VerificationStatus;
}

export interface ChatResponse {
  reply: string;
  language: string;
  citations: SourceCitation[];
  data_timestamps?: string;
  is_ai_generated: boolean;
  model_or_rule: string;
  disclaimer: string;
}

export interface ConfigServiceStatus {
  service_name: string;
  is_live: boolean;
  provider: string;
  details: string;
}

export interface ConfigStatusResponse {
  app_mode: string;
  services: ConfigServiceStatus[];
  trusted_domains_count: number;
  server_time: string;
}

export interface IncidentReport {
  id: string;
  user_id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  incident_type: string;
  severity: string;
  status: string;
  verification_status: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

