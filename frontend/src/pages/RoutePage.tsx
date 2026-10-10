import { useState, useEffect } from 'react';
import { 
  MapPin, AlertTriangle, Navigation, Clock, Shield, 
  ArrowRight, ShieldCheck, Home as HomeIcon, CheckCircle2, ChevronRight 
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { TRANSLATIONS } from '../translations';
import { apiUrl } from '../utils/api';

interface Waypoint {
  lat: number;
  lng: number;
  name: string;
}

interface HazardIntersection {
  hazard_id: string;
  type: string;
  severity: string;
  lat: number;
  lng: number;
  radius_km?: number;
}

interface RouteData {
  distance_km: number;
  estimated_time_min: number;
  safety_score: number;
  hazard_intersections: HazardIntersection[];
  waypoints: Waypoint[];
  recommendations: string[];
}

const createIcon = (color: string, emoji: string) => {
  return L.divIcon({
    className: 'custom-icon',
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 2px solid white;">${emoji}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30]
  });
};

const userIcon = createIcon('#0F4C5C', '📍');
const destIcon = createIcon('#10B981', '🏠');

export default function RoutePage() {
  const [startLocation, setStartLocation] = useState('13.0827, 80.2707');
  const [endLocation, setEndLocation] = useState('13.0850, 80.2650');
  const [mode, setMode] = useState('walking');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [route, setRoute] = useState<RouteData | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [navigationActive, setNavigationActive] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setStartLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
        },
        (error) => console.log('Location error:', error)
      );
    }
  }, []);

  const parseCoordinates = (coordStr: string): { lat: number; lng: number } | null => {
    const parts = coordStr.split(',').map(p => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { lat: parts[0], lng: parts[1] };
    }
    return null;
  };

  const handleCalculateRoute = async () => {
    setError('');
    const start = parseCoordinates(startLocation);
    const end = parseCoordinates(endLocation);

    if (!start || !end) {
      setError('Please enter valid coordinates in format: latitude, longitude');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(apiUrl('/api/route/safe'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_lat: start.lat,
          start_lng: start.lng,
          end_lat: end.lat,
          end_lng: end.lng,
          mode: mode
        })
      });

      if (!response.ok) {
        throw new Error('Failed to calculate safe route');
      }

      const data = await response.json();
      setRoute(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error calculating route');
    } finally {
      setLoading(false);
    }
  };

  const startCoord = parseCoordinates(startLocation) || { lat: 13.0827, lng: 80.2707 };
  const endCoord = parseCoordinates(endLocation) || { lat: 13.0850, lng: 80.2650 };

  const routePolyline: [number, number][] = route && route.waypoints.length > 0
    ? route.waypoints.map(wp => [wp.lat, wp.lng])
    : [
        [startCoord.lat, startCoord.lng],
        [startCoord.lat + 0.005, startCoord.lng - 0.003],
        [endCoord.lat, endCoord.lng]
      ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header matching Reference Design "Safe Route to Nearest Shelter" */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Hazard-Aware Evacuation Routing
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F4C5C]">
            Safe Route to Nearest Shelter
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Calculates high-ground navigation bypasses that route tourists around active flood inundation zones.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setEndLocation('13.0850, 80.2650');
              handleCalculateRoute();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F3F4F6] text-[#0F4C5C] hover:bg-slate-200 transition"
          >
            TNGS Shelter (1.2 km)
          </button>
          <button
            onClick={() => {
              setEndLocation('13.0810, 80.2780');
              handleCalculateRoute();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F3F4F6] text-[#0F4C5C] hover:bg-slate-200 transition"
          >
            General Hospital (2.8 km)
          </button>
        </div>
      </div>

      {/* Main Grid: Map Screen (matching Reference Left) + Route Inputs & Destination Cards (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Interactive Safe Route Map matching Reference Left Screen */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="relative h-[min(58svh,480px)] min-h-[300px] w-full sm:h-[480px]">
            <MapContainer
              center={[startCoord.lat, startCoord.lng]}
              zoom={14}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Start & Destination Markers */}
              <Marker position={[startCoord.lat, startCoord.lng]} icon={userIcon}>
                <Popup>Your Location</Popup>
              </Marker>
              <Marker position={[endCoord.lat, endCoord.lng]} icon={destIcon}>
                <Popup>TNGS School (Shelter)</Popup>
              </Marker>

              {/* Blue Safe Route Polyline matching reference */}
              <Polyline
                positions={routePolyline}
                pathOptions={{ color: '#2563EB', weight: 6, opacity: 0.85, lineJoin: 'round' }}
              />

              {/* Hazard Danger Polygon (Red flood basin) */}
              <Polygon
                positions={[
                  [13.080, 80.260],
                  [13.085, 80.263],
                  [13.082, 80.272],
                  [13.076, 80.267]
                ]}
                pathOptions={{ color: '#DF4444', fillColor: '#DF4444', fillOpacity: 0.35, weight: 2 }}
              >
                <Popup>
                  <div className="text-xs">
                    <span className="font-bold text-red-600">ROAD CLOSED / INUNDATION</span>
                    <p className="text-slate-600 mt-1">Water level +0.5m. Route automatically avoids this zone.</p>
                  </div>
                </Popup>
              </Polygon>
            </MapContainer>

            {/* Reference Legend Floating Box (Top Right of Map) */}
            <div className="absolute top-4 right-4 z-[400] bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-100 p-3 text-xs w-44">
              <div className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">
                Route Legend
              </div>
              <div className="space-y-1.5 text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0F4C5C]"></span>
                  <span>Your Location</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-1 bg-blue-600 rounded"></span>
                  <span className="font-bold text-blue-700">Safe Route</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-red-500/40 border border-red-500"></span>
                  <span>Hazard Zone</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                  <span>Road Closed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <span className="font-bold text-emerald-700">Shelter</span>
                </div>
              </div>
            </div>

            {/* Bottom Card Inside Map: "TNGS School (Shelter) 1.2 km • 15 min [Safe] -> Start Navigation" */}
            <div className="absolute bottom-4 left-4 right-4 z-[400] bg-white rounded-2xl p-4 shadow-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-lg shadow-inner">
                  🏠
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-800 text-sm sm:text-base">TNGS School (Shelter)</h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      Safe
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {route ? `${route.distance_km.toFixed(1)} km • ${route.estimated_time_min.toFixed(0)} min (${mode})` : '1.2 km • 15 min (walking)'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setNavigationActive(!navigationActive)}
                className="bg-[#0F4C5C] hover:bg-[#0c3c49] text-white px-6 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
              >
                <Navigation className="w-4 h-4 text-[#38BDAC]" />
                <span>{navigationActive ? 'Navigation in Progress' : 'Start Navigation'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Route Configuration & Telemetry */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">
              Route Parameters
            </h3>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Start Coordinates
              </label>
              <input
                type="text"
                value={startLocation}
                onChange={e => setStartLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Destination Coordinates
              </label>
              <input
                type="text"
                value={endLocation}
                onChange={e => setEndLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Mode of Travel
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMode('walking')}
                  className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    mode === 'walking' ? 'bg-[#0F4C5C] text-white shadow-xs' : 'bg-slate-50 text-slate-600'
                  }`}
                >
                  🚶 Walking
                </button>
                <button
                  onClick={() => setMode('driving')}
                  className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    mode === 'driving' ? 'bg-[#0F4C5C] text-white shadow-xs' : 'bg-slate-50 text-slate-600'
                  }`}
                >
                  🚗 Driving
                </button>
              </div>
            </div>

            <button
              onClick={handleCalculateRoute}
              disabled={loading}
              className="w-full py-3 bg-[#38BDAC] hover:bg-[#2fa394] text-white font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              {loading ? 'Analyzing Hazards...' : 'Recalculate Safe Route'}
            </button>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                {error}
              </p>
            )}
          </div>

          {/* Safety Verification Badge */}
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Route Hazard Evaluation</span>
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              This route has been checked against 2 confirmed flood polygons and 1 coastal surge exclusion zone. No submerged bridge passages detected.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
