import React, { useEffect, useState } from 'react';
import { WeatherResponse, Alert, Facility, HazardZone } from '../types';
import { TRANSLATIONS } from '../translations';
import { 
  Search, RefreshCw, CloudRain, Wind, Droplets, Thermometer, 
  ShieldAlert, Navigation, ArrowRight, ShieldCheck, MapPin, 
  Home as HomeIcon, Hospital, Phone, Radio, ChevronRight, AlertTriangle, Layers
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon } from 'react-leaflet';
import L from 'leaflet';

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

export const Dashboard: React.FC<DashboardProps> = ({ currentLang }) => {
  const navigate = useNavigate();
  const [city, setCity] = useState('Chennai');
  const [searchQuery, setSearchQuery] = useState('Chennai');
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [shelters, setShelters] = useState<Facility[]>([]);
  const [hazards, setHazards] = useState<HazardZone[]>([]);
  const [loading, setLoading] = useState(false);

  // Map layer toggle states matching Reference UI
  const [layerHazard, setLayerHazard] = useState(true);
  const [layerFlooded, setLayerFlooded] = useState(true);
  const [layerClosures, setLayerClosures] = useState(true);
  const [layerSafeZones, setLayerSafeZones] = useState(true);
  const [layerShelters, setLayerShelters] = useState(true);
  const [layerHospitals, setLayerHospitals] = useState(true);

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const fetchData = async (location: string) => {
    setLoading(true);
    try {
      // 1. Weather
      const wRes = await fetch(`/api/weather?location=${encodeURIComponent(location)}`);
      if (wRes.ok) {
        const wJson = await wRes.json();
        setWeatherData(wJson);
      }

      // 2. Alerts
      const aRes = await fetch(`/api/alerts?location=${encodeURIComponent(location)}&lang=${currentLang}`);
      if (aRes.ok) {
        const aJson = await aRes.json();
        setAlerts(aJson.alerts || []);
      }

      // 3. Shelters
      const sRes = await fetch('/api/map/shelters');
      if (sRes.ok) {
        const sJson = await sRes.json();
        setShelters(sJson || []);
      }

      // 4. Hazards
      const hRes = await fetch('/api/map/hazards');
      if (hRes.ok) {
        const hJson = await hRes.json();
        setHazards(hJson || []);
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(city);
  }, [city, currentLang]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setCity(searchQuery.trim());
    }
  };

  // Coordinates for preview map centered on Chennai
  const mapCenter: [number, number] = weatherData 
    ? [weatherData.current.latitude, weatherData.current.longitude]
    : [13.0827, 80.2707];

  return (
    <div className="space-y-8 pb-12">
      
      {/* 1. HERO SECTION (Matching Reference Image: Coastal ocean background with bold title, search, feature chips) */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl text-white">
        {/* Background Image & Gradient Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F4C5C]/95 via-[#0F4C5C]/80 to-transparent" />

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

          {/* Floating Warning Badge inside hero bottom right */}
          <div className="mt-6 inline-flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-xs">
            <div className="w-6 h-6 rounded-full bg-[#DF4444] flex items-center justify-center text-white">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-white">Heavy Rainfall Alert</span>
              <span className="text-slate-300 ml-2">Coastal Region</span>
            </div>
            <Link to="/alerts" className="text-[#38BDAC] hover:underline font-semibold ml-2">
              {t.view_details} →
            </Link>
          </div>
        </div>
      </div>

      {/* 2. URGENT CRISIS BANNER (Red/Orange alert card matching Reference screen) */}
      <div className="bg-gradient-to-r from-[#DF4444] to-[#f05252] rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 text-white shadow-inner">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                ACTIVE CRISIS
              </span>
              <h3 className="font-bold text-base sm:text-lg">
                {t.urgent_warning}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-red-100 mt-0.5 font-medium">
              {t.urgent_desc}
            </p>
          </div>
        </div>

        <Link
          to="/alerts"
          className="self-start sm:self-auto px-4 py-2 bg-white text-[#DF4444] hover:bg-red-50 rounded-xl font-bold text-xs sm:text-sm transition shadow-xs flex items-center gap-1.5"
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
                Live Hazard & Safe Zone Map
              </h2>
              <p className="text-xs text-slate-400">
                Centred on {weatherData?.current.location_name || city} • Verified geospatial perimeter
              </p>
            </div>
            <Link
              to="/map"
              className="text-xs font-bold text-[#0F4C5C] bg-[#F3F4F6] hover:bg-slate-200 px-3 py-1.5 rounded-xl transition"
            >
              Full Screen Map →
            </Link>
          </div>

          <div className="relative h-[420px] w-full">
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
                      <p className="text-emerald-700 font-semibold mt-1">Verified Open</p>
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

              {/* Hazard Polygon: Adyar river flood */}
              {layerFlooded && hazards.map(h => (
                h.is_polygon ? (
                  <Polygon
                    key={h.id}
                    positions={h.coordinates as [number, number][]}
                    pathOptions={{ color: '#DF4444', fillColor: '#DF4444', fillOpacity: 0.35, weight: 2 }}
                  />
                ) : (
                  <Circle
                    key={h.id}
                    center={h.coordinates[0] as [number, number]}
                    radius={h.radius_meters || 1500}
                    pathOptions={{ color: '#FB9038', fillColor: '#FB9038', fillOpacity: 0.3, weight: 2 }}
                  />
                )
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
                    checked={layerHazard} 
                    onChange={e => setLayerHazard(e.target.checked)}
                    className="rounded text-[#DF4444]" 
                  />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#DF4444]"></span>
                  <span>{t.layer_hazard_zones}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                  <input 
                    type="checkbox" 
                    checked={layerFlooded} 
                    onChange={e => setLayerFlooded(e.target.checked)}
                    className="rounded text-blue-500" 
                  />
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span>{t.layer_flooded_areas}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                  <input 
                    type="checkbox" 
                    checked={layerClosures} 
                    onChange={e => setLayerClosures(e.target.checked)}
                    className="rounded text-[#FB9038]" 
                  />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FB9038]"></span>
                  <span>{t.layer_road_closures}</span>
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

            {/* Flooded Area Callout Badge */}
            <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-red-200 text-xs text-[#DF4444] font-bold shadow-md flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#DF4444] animate-ping"></span>
              <span>{t.flooded_area_badge}</span>
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
                    {weatherData ? `${weatherData.current.temperature.toFixed(0)}°C` : '28°C'}
                  </div>
                  <p className="text-xs font-bold text-slate-500">
                    {weatherData?.current.weather_condition || t.heavy_rain}
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
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 text-center">
              <div className="bg-slate-50 p-2 rounded-xl">
                <p className="text-[10px] text-slate-400 font-medium">Rainfall</p>
                <p className="text-xs font-bold text-slate-700">{weatherData?.current.rainfall || 18} mm</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl">
                <p className="text-[10px] text-slate-400 font-medium">Wind</p>
                <p className="text-xs font-bold text-slate-700">{weatherData?.current.wind_speed || 42} km/h</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl">
                <p className="text-[10px] text-slate-400 font-medium">Humidity</p>
                <p className="text-xs font-bold text-slate-700">{weatherData?.current.humidity || 88}%</p>
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
              {/* Nearest Shelter */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                    <HomeIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{t.nearest_shelter}</p>
                    <p className="text-slate-400 text-[11px]">TNGS School Hall</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-emerald-700 text-sm">1.2 km</span>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase">{t.safe_badge}</p>
                </div>
              </div>

              {/* Nearest Hospital */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-red-50/60 border border-red-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-500 text-white flex items-center justify-center font-bold">
                    <Hospital className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{t.hospital}</p>
                    <p className="text-slate-400 text-[11px]">Govt General Hospital</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-red-700 text-sm">2.8 km</span>
                  <p className="text-[10px] text-slate-400">Level 1 ER</p>
                </div>
              </div>

              {/* Police Station */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0F4C5C] text-white flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{t.police_station}</p>
                    <p className="text-slate-400 text-[11px]">Marina Police Division</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-[#0F4C5C] text-sm">3.8 km</span>
                  <p className="text-[10px] text-slate-400">Open 24/7</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 4. NEARBY SAFE ZONES PREVIEWS (Horizontal Cards matching Reference Layout) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-xl text-[#0F4C5C]">
            {t.nearby_safe_zones}
          </h2>
          <Link to="/map" className="text-xs font-bold text-[#0F4C5C] hover:underline">
            {t.view_all} →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Card 1 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                <HomeIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">TNGS School (Shelter)</h4>
                <p className="text-xs text-slate-400 mt-0.5">1.2 km • 15 min walk</p>
              </div>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                {t.safe_badge}
              </span>
              <button 
                onClick={() => navigate('/route')}
                className="mt-2 block text-[11px] font-bold text-[#0F4C5C] hover:underline"
              >
                {t.start_navigation} →
              </button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                <Hospital className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">City Hospital Safe Wing</h4>
                <p className="text-xs text-slate-400 mt-0.5">2.8 km • 8 min drive</p>
              </div>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                {t.safe_badge}
              </span>
              <button 
                onClick={() => navigate('/route')}
                className="mt-2 block text-[11px] font-bold text-[#0F4C5C] hover:underline"
              >
                {t.start_navigation} →
              </button>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">Govt Higher Secondary Camp</h4>
                <p className="text-xs text-slate-400 mt-0.5">3.1 km • 20 min walk</p>
              </div>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                {t.safe_badge}
              </span>
              <button 
                onClick={() => navigate('/route')}
                className="mt-2 block text-[11px] font-bold text-[#0F4C5C] hover:underline"
              >
                {t.start_navigation} →
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
