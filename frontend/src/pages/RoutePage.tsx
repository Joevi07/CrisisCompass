import { useState, useEffect } from 'react';
import { MapPin, AlertTriangle, Navigation, Clock, Shield } from 'lucide-react';

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

export default function RoutePage() {
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [mode, setMode] = useState('walking');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [route, setRoute] = useState<RouteData | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Get user's current location
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
    const start = parseCoordinates(startLocation);
    const end = parseCoordinates(endLocation);

    if (!start || !end) {
      setError('Invalid coordinates. Use format: latitude,longitude');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/route/safe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_lat: start.lat,
          start_lng: start.lng,
          end_lat: end.lat,
          end_lng: end.lng,
          mode: mode
        }),
      });

      if (!response.ok) throw new Error('Failed to calculate route');
      
      const data = await response.json();
      setRoute(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getSafetyColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'text-red-600 bg-red-50';
      case 'High': return 'text-orange-600 bg-orange-50';
      case 'Moderate': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Navigation className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Safe Route Navigator</h1>
          </div>
          <p className="text-gray-600">
            Find hazard-aware routes to your destination with real-time safety information
          </p>
        </div>

        {/* Route Input Form */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Starting Point (Latitude, Longitude)
              </label>
              <input
                type="text"
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                placeholder="13.0827, 80.2707"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {userLocation && `📍 Your location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination (Latitude, Longitude)
              </label>
              <input
                type="text"
                value={endLocation}
                onChange={(e) => setEndLocation(e.target.value)}
                placeholder="13.1939, 80.2109"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Transport Mode</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setMode('walking')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    mode === 'walking'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  🚶 Walking
                </button>
                <button
                  onClick={() => setMode('driving')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    mode === 'driving'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  🚗 Driving
                </button>
              </div>
            </div>

            <button
              onClick={handleCalculateRoute}
              disabled={loading}
              className="flex-1 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed h-10 flex items-center justify-center"
            >
              {loading ? 'Calculating...' : 'Calculate Safe Route'}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}
        </div>

        {/* Route Results */}
        {route && (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Route Summary</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {/* Distance */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">Distance</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {route.distance_km.toFixed(1)} km
                  </div>
                </div>

                {/* Time */}
                <div className="bg-indigo-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm font-medium text-gray-600">Est. Time</span>
                  </div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {route.estimated_time_min.toFixed(0)} min
                  </div>
                </div>

                {/* Safety Score */}
                <div className={`rounded-lg p-4 ${getSafetyColor(route.safety_score)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5" />
                    <span className="text-sm font-medium">Safety Score</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {(route.safety_score * 100).toFixed(0)}%
                  </div>
                </div>

                {/* Hazards Count */}
                <div className={`rounded-lg p-4 ${
                  route.hazard_intersections.length === 0
                    ? 'bg-green-50'
                    : 'bg-red-50'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-gray-600">Hazards</span>
                  </div>
                  <div className={`text-2xl font-bold ${
                    route.hazard_intersections.length === 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {route.hazard_intersections.length}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Safety Recommendations</h3>
                <div className="space-y-2">
                  {route.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      {rec.includes('✅') ? (
                        <div className="text-green-600 font-bold mt-0.5">✓</div>
                      ) : rec.includes('⚠️') ? (
                        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <span className="text-gray-700">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Waypoints */}
            {route.waypoints.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Route Waypoints</h3>
                <div className="space-y-2">
                  {route.waypoints.map((wp, idx) => (
                    <div key={idx} className="flex items-center gap-3 py-2 border-l-4 border-blue-500 pl-4">
                      <span className="text-sm font-medium text-gray-600">{wp.name}</span>
                      <span className="text-gray-700">
                        {wp.lat.toFixed(4)}°N, {wp.lng.toFixed(4)}°E
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hazard Details */}
            {route.hazard_intersections.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Hazards on Route</h3>
                <div className="space-y-4">
                  {route.hazard_intersections.map((hazard, idx) => (
                    <div key={idx} className={`rounded-lg p-4 border-l-4 ${getSeverityColor(hazard.severity)}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold capitalize">{hazard.type}</h4>
                          <p className="text-sm">
                            Location: {hazard.lat.toFixed(4)}°N, {hazard.lng.toFixed(4)}°E
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-white">
                          {hazard.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
