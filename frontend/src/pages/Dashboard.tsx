import React, { useEffect, useState } from 'react';
import { WeatherResponse, Alert, Facility, HazardZone } from '../types';
import { fetchWithOfflineFallback } from '../utils/offlineCache';
import { TRANSLATIONS } from '../translations';

import { 
  Search, RefreshCw, CloudRain, Wind, Droplets, Thermometer, 
  ShieldAlert, Navigation, ArrowRight, ShieldCheck, MapPin, 
  Home as HomeIcon, Hospital, Phone, Radio, ChevronRight, AlertTriangle, Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import heroImage from '../assets/coastal-traveler.jpg';

interface DashboardProps {
  currentLang: string;
}

const createCustomIcon = (bgColor: string, text: string) => {
  return L.divIcon({
    className: 'custom-map-icon',
    html: `
      <div style="background-color: ${bgColor}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 13px; box-shadow: 0 4px 6px rgba(0,0,0,0.25); border: 2px solid white;">
        ${text}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
};

const shelterIcon = createCustomIcon('#10B981', '🏠');
const hospitalIcon = createCustomIcon('#DF4444', '🏥');
const floodAlertIcon = createCustomIcon('#DF4444', '!');

const getInitialDestination = () => {
  const userId = localStorage.getItem('userId');
  if (userId) {
    try {
      const profile = JSON.parse(localStorage.getItem(`crisiscompass_cache_profile_${userId}`) || 'null')?.data;
      if (profile?.destination) return profile.destination;
    } catch { /* Use a general India location if profile cache is unavailable. */ }
  }
  return 'New Delhi';
};

const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRadians = (degree: number) => degree * Math.PI / 180;
  const a = Math.sin(toRadians(lat2 - lat1) / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(toRadians(lon2 - lon1) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const Dashboard: React.FC<DashboardProps> = ({ currentLang }) => {
  const [city, setCity] = useState(getInitialDestination);
  const [searchQuery, setSearchQuery] = useState(getInitialDestination);
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [shelters, setShelters] = useState<Facility[]>([]);
  const [hazards, setHazards] = useState<HazardZone[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchWarning, setFetchWarning] = useState('');

  // Map layer toggle states matching Reference UI
  const [layerFlooded, setLayerFlooded] = useState(true);
  const [layerShelters, setLayerShelters] = useState(true);
  const [layerHospitals, setLayerHospitals] = useState(true);

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const fetchData = async (location: string) => {
    setLoading(true);
    try {
      const [weatherResult, alertResult] = await Promise.allSettled([
        fetchWithOfflineFallback<WeatherResponse>(`/api/weather?location=${encodeURIComponent(location)}`, `weather_${location}`),
        fetchWithOfflineFallback<{ alerts: Alert[] }>(`/api/alerts?location=${encodeURIComponent(location)}&lang=${currentLang}`, `alerts_${location}_${currentLang}`),
      ]);
      if (weatherResult.status === 'fulfilled') setWeatherData(weatherResult.value.data);
      if (alertResult.status === 'fulfilled') setAlerts(alertResult.value.data.alerts || []);
      const latitude = weatherResult.status === 'fulfilled' ? weatherResult.value.data.current.latitude : 22.5;
      const longitude = weatherResult.status === 'fulfilled' ? weatherResult.value.data.current.longitude : 79.0;
      const mapKey = `${latitude.toFixed(2)}_${longitude.toFixed(2)}`;
      const coordinates = `latitude=${latitude}&longitude=${longitude}`;
      const [facilitiesResult, hazardsResult] = await Promise.allSettled([
        fetchWithOfflineFallback<Facility[]>(`/api/map/nearby?${coordinates}&radius_km=25`, `nearby_facilities_${mapKey}`),
        fetchWithOfflineFallback<HazardZone[]>(`/api/map/hazards?${coordinates}&radius_km=500`, `nearby_hazards_${mapKey}`),
      ]);
      if (facilitiesResult.status === 'fulfilled') setShelters(facilitiesResult.value.data || []);
      if (hazardsResult.status === 'fulfilled') setHazards(hazardsResult.value.data || []);
      setFetchWarning([weatherResult, alertResult, facilitiesResult, hazardsResult].some((result) => result.status === 'rejected')
        ? 'Some live data could not refresh. Showing saved information where available.'
        : '');
    } catch {
      setFetchWarning('Live data could not refresh. Showing saved information where available.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(city);
    // Refresh live feeds periodically while online; cached data remains available offline.
    const interval = setInterval(() => {
      if (navigator.onLine) fetchData(city);
    }, 60000);
    return () => clearInterval(interval);
  }, [city, currentLang]);


  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setCity(searchQuery.trim());
    }
  };

  // Coordinates come from the selected destination; default to an India overview.
  const mapCenter: [number, number] = weatherData 
    ? [weatherData.current.latitude, weatherData.current.longitude]
    : [22.5, 79.0];
  const nearestShelter = shelters.filter((facility) => facility.facility_type === 'shelter')
    .sort((a, b) => distanceKm(...mapCenter, a.latitude, a.longitude) - distanceKm(...mapCenter, b.latitude, b.longitude))[0];
  const nearestHealthcare = shelters.filter((facility) => facility.facility_type === 'hospital')
    .sort((a, b) => distanceKm(...mapCenter, a.latitude, a.longitude) - distanceKm(...mapCenter, b.latitude, b.longitude))[0];

  return (
    <div className="space-y-8 pb-12">
      
      {/* 1. HERO SECTION (Matching Reference Image: Coastal ocean background with bold title, search, feature chips) */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl text-white">
        {/* Background Image & Gradient Overlay */}
        <img src={heroImage} alt="Traveler in a sun hat looking across a coastal mountain bay" className="absolute inset-y-0 right-0 h-full w-full sm:w-[82%] lg:w-[64%] object-cover object-[68%_center]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F4C5C]/95 via-[#0F4C5C]/85 to-[#0F4C5C]/15" />

        <div className="relative px-6 py-12 sm:px-12 sm:py-16 max-w-4xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold mb-4 border border-white/20">
            <Radio className="w-3.5 h-3.5 text-[#38BDAC] animate-pulse" />
            <span>{t.tagline}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-4 drop-shadow-sm">
            {t.hero_headline}
          </h1>

          <p className="text-sm sm:text-base text-slate-100/90 max-w-2xl mb-8 leading-relaxed">
            {t.hero_subheadline}
          </p>

          {/* Quick Feature Pills matching reference */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-8">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-3 border border-white/25 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
                <CloudRain className="w-4 h-4 text-[#38BDAC]" />
              </div>
              <span className="text-xs font-semibold">{t.feat_weather_alerts}</span>
            </div>

            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-3 border border-white/25 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
                <MapPin className="w-4 h-4 text-[#FB9038]" />
              </div>
              <span className="text-xs font-semibold">{t.feat_hazard_map}</span>
            </div>

            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-3 border border-white/25 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
                <Radio className="w-4 h-4 text-emerald-300" />
              </div>
              <span className="text-xs font-semibold">{t.feat_multilingual}</span>
            </div>

            <Link to="/report" className="bg-[#DF4444]/90 hover:bg-[#DF4444] transition backdrop-blur-md rounded-2xl p-3 border border-red-300/40 flex items-center gap-2.5 cursor-pointer">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
                <Phone className="w-4 h-4 animate-bounce" />
              </div>
              <span className="text-xs font-bold text-white">{t.feat_sos}</span>
            </Link>
          </div>

          {/* Floating Search Input matching reference */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-xl">
            <div className="bg-white rounded-2xl p-1.5 shadow-2xl flex items-center gap-2">
              <div className="pl-3 text-slate-400">
                <Search className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.search_placeholder}
                className="w-full py-2.5 px-2 text-slate-800 placeholder-slate-400 text-sm focus:outline-none font-medium"
              />
              <button
                type="submit"
                className="bg-[#0F4C5C] hover:bg-[#0c3c49] text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shadow-md"
              >
                <span>{t.search_btn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {weatherData && <div className="mt-6 inline-flex max-w-full flex-wrap items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-xs">
            <CloudRain className="h-4 w-4 shrink-0 text-[#38BDAC]" />
            <span className="font-bold text-white">{weatherData.current.weather_condition}</span>
            <span className="text-slate-200">{weatherData.current.is_live ? 'Live weather' : 'Saved weather'}</span>
            <Link to="/alerts" className="text-[#38BDAC] hover:underline font-semibold">Safety notices →</Link>
          </div>}
        </div>
      </div>

      {fetchWarning && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
          {fetchWarning}
        </div>
      )}

      {/* Show weather freshness without presenting simulated alerts as active emergencies. */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 text-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0 text-sky-800">
            <CloudRain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base sm:text-lg">
                {weatherData?.current.location_name || city}
              </h3>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${weatherData?.current.is_live ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {weatherData?.current.is_live ? 'Live weather' : 'Saved / unavailable'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 font-medium">
              {weatherData?.current.weather_condition || 'Weather information is loading.'}
              {weatherData?.current.is_live && weatherData.current.retrieved_at ? ` · Updated ${new Date(weatherData.current.retrieved_at).toLocaleTimeString()}` : ''}
            </p>
          </div>
        </div>

        <Link
          to="/alerts"
          className="self-start sm:self-auto px-4 py-2 bg-[#0F4C5C] text-white hover:bg-[#0c3c49] rounded-xl font-bold text-xs sm:text-sm transition shadow-xs flex items-center gap-1.5"
        >
          <span>{t.view_details}</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 3. MAIN DASHBOARD GRID (Interactive Map Preview + Weather & Emergency Info Side Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT / CENTER (2 cols): Interactive Map with Reference Layer Checkbox Overlay */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-5 pb-3 flex items-center justify-between border-b border-slate-100">
            <div>
              <h2 className="font-bold text-lg text-[#0F4C5C] flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#38BDAC]" />
                  Flood bulletins & nearby places
              </h2>
              <p className="text-xs text-slate-400">
                Centred on {weatherData?.current.location_name || city} • Flood-feed and OpenStreetMap listings
              </p>
            </div>
            <Link
              to="/map"
              className="text-xs font-bold text-[#0F4C5C] bg-[#F3F4F6] hover:bg-slate-200 px-3 py-1.5 rounded-xl transition"
            >
              Full Screen Map →
            </Link>
          </div>

          <div className="relative h-[min(58svh,420px)] min-h-[300px] w-full sm:h-[420px]">
            {/* Map Canvas */}
            <MapContainer
              center={mapCenter}
              zoom={12}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
              key={`${mapCenter[0]}-${mapCenter[1]}`}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Shelters & Hospitals */}
              {layerShelters && shelters.filter(s => s.facility_type === 'shelter').map(s => (
                <Marker key={s.id} position={[s.latitude, s.longitude]} icon={shelterIcon}>
                  <Popup>
                    <div className="p-1 text-xs">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                        SHELTER
                      </span>
                      <p className="font-bold mt-1">{s.name}</p>
                      <p className="text-slate-500">{s.address}</p>
                      <p className="mt-1 font-semibold text-amber-700">Open status not verified</p>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {layerHospitals && shelters.filter(s => s.facility_type === 'hospital').map(s => (
                <Marker key={s.id} position={[s.latitude, s.longitude]} icon={hospitalIcon}>
                  <Popup>
                    <div className="p-1 text-xs">
                      <span className="bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                        HOSPITAL
                      </span>
                      <p className="font-bold mt-1">{s.name}</p>
                      <p className="text-slate-500">{s.address}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Live flood feed locations */}
              {layerFlooded && hazards.filter((hazard) => hazard.coordinates?.[0]).map((hazard) => (
                <Marker key={hazard.id} position={hazard.coordinates[0] as [number, number]} icon={floodAlertIcon}>
                  <Popup><strong>{hazard.title}</strong><p>{hazard.source_organization}</p><a href={hazard.source_url} target="_blank" rel="noreferrer">Open source bulletin</a></Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Reference Floating Layer Controls Widget (Top Right of Map) */}
            <div className="absolute top-4 right-4 z-[400] bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-100 p-3.5 text-xs w-48">
              <div className="font-bold text-slate-800 mb-2 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                <Layers className="w-3.5 h-3.5 text-[#0F4C5C]" />
                <span>{t.layers_title}</span>
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                  <input 
                    type="checkbox" 
                    checked={layerFlooded} 
                    onChange={e => setLayerFlooded(e.target.checked)}
                    className="rounded text-blue-500" 
                  />
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span>Flood bulletins</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                  <input 
                    type="checkbox" 
                    checked={layerShelters} 
                    onChange={e => setLayerShelters(e.target.checked)}
                    className="rounded text-[#10B981]" 
                  />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                  <span>{t.layer_shelters}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                  <input 
                    type="checkbox" 
                    checked={layerHospitals} 
                    onChange={e => setLayerHospitals(e.target.checked)}
                    className="rounded text-red-600" 
                  />
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                  <span>{t.layer_hospitals}</span>
                </label>
              </div>
            </div>

            <div className="absolute bottom-4 left-4 z-[400] max-w-[calc(100%-2rem)] rounded-xl border border-slate-200 bg-white/95 px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-md">
              {hazards.length ? `${hazards.length} flood feed item${hazards.length === 1 ? '' : 's'} in this area` : 'No flood feed items found in this search radius'}
            </div>
          </div>
        </div>

        {/* RIGHT (1 col): Current Weather Card + Emergency Info Widget */}
        <div className="space-y-6">
          
          {/* Weather Card matching Reference Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t.current_weather}
              </span>
              <button
                onClick={() => fetchData(city)}
                className="text-slate-400 hover:text-[#0F4C5C] transition p-1"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex items-center justify-between my-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-inner">
                  <CloudRain className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-3xl font-black text-slate-800">
                    {weatherData?.current.is_live ? `${weatherData.current.temperature.toFixed(0)}°C` : '—'}
                  </div>
                  <p className="text-xs font-bold text-slate-500">
                    {weatherData?.current.weather_condition || 'No current weather data'}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 font-medium">
                  {weatherData?.current.location_name.split(',')[0] || city}
                </span>
                <p className="text-[11px] font-bold text-[#38BDAC] mt-0.5">
                  <Link to="/alerts">{t.forecast_link} →</Link>
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {weatherData?.current.is_live ? 'Live weather' : 'Saved weather'}
                  {weatherData?.current.retrieved_at ? ` · ${new Date(weatherData.current.retrieved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 text-center">
              <div className="bg-slate-50 p-2 rounded-xl">
                <p className="text-[10px] text-slate-400 font-medium">Rainfall</p>
                <p className="text-xs font-bold text-slate-700">{weatherData?.current.is_live ? `${weatherData.current.rainfall} mm` : '—'}</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl">
                <p className="text-[10px] text-slate-400 font-medium">Wind</p>
                <p className="text-xs font-bold text-slate-700">{weatherData?.current.is_live ? `${weatherData.current.wind_speed} km/h` : '—'}</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl">
                <p className="text-[10px] text-slate-400 font-medium">Humidity</p>
                <p className="text-xs font-bold text-slate-700">{weatherData?.current.humidity ?? '—'}{weatherData?.current.humidity != null ? '%' : ''}</p>
              </div>
            </div>
          </div>

          {/* Emergency Info Card matching Reference Card (Nearest Shelter, Hospital, Police) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-sm">
                {t.emergency_info}
              </h3>
              <Link to="/map" className="text-xs font-semibold text-[#0F4C5C] hover:underline">
                {t.view_all} →
              </Link>
            </div>

            <div className="space-y-3 text-xs">
              {[nearestShelter, nearestHealthcare].map((facility, index) => (
                <div key={facility?.id || `missing-${index}`} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white ${index === 0 ? 'bg-emerald-600' : 'bg-red-600'}`}>
                      {index === 0 ? <HomeIcon className="h-4 w-4" /> : <Hospital className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0"><p className="font-bold text-slate-800">{index === 0 ? t.nearest_shelter : t.hospital}</p><p className="truncate text-[11px] text-slate-500">{facility?.name || 'No community listing found nearby'}</p></div>
                  </div>
                  <span className="shrink-0 text-right text-[10px] text-slate-500">{facility ? `${distanceKm(...mapCenter, facility.latitude, facility.longitude).toFixed(1)} km` : '—'}<br />availability unverified</span>
                </div>
              ))}
              <p className="text-[11px] text-amber-800">Community map listings may be incomplete. Verify that a facility is open before travelling to it.</p>
            </div>
          </div>

        </div>
      </div>

      {/* Nearby community-mapped facilities */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-xl text-[#0F4C5C]">Nearby places</h2>
          <Link to="/map" className="text-xs font-bold text-[#0F4C5C] hover:underline">Open safety map →</Link>
        </div>
        {shelters.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">No nearby facilities are saved for this area. When connected, search a location on the Safety Map to load community listings.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shelters.slice(0, 3).map((facility) => (
              <div key={facility.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-[#0F4C5C]">{facility.facility_type === 'shelter' ? <HomeIcon className="h-5 w-5" /> : <Hospital className="h-5 w-5" />}</div>
                  <div className="min-w-0"><h3 className="truncate text-sm font-bold text-slate-800">{facility.name}</h3><p className="truncate text-xs text-slate-500">{facility.address}</p><p className="text-[10px] text-amber-800">Availability not verified</p></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>    </div>
  );
};
