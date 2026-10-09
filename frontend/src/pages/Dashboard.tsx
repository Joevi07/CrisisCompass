import React, { useEffect, useState } from 'react';
import { WeatherResponse, Alert } from '../types';
import { AlertCard } from '../components/AlertCard';
import { TRANSLATIONS } from '../translations';
import { Search, RefreshCw, CloudRain, Wind, Droplets, Thermometer, ShieldAlert, Navigation } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

interface DashboardProps {
  currentLang: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentLang }) => {
  const [city, setCity] = useState('Chennai');
  const [searchQuery, setSearchQuery] = useState('Chennai');
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const fetchData = async (location: string) => {
    setLoading(true);
    try {
      // Weather API
      const wRes = await fetch(`/api/weather?location=${encodeURIComponent(location)}`);
      if (wRes.ok) {
        const wJson = await wRes.json();
        setWeatherData(wJson);
      }

      // Alerts API
      const aRes = await fetch(`/api/alerts?location=${encodeURIComponent(location)}&lang=${currentLang}`);
      if (aRes.ok) {
        const aJson = await aRes.json();
        setAlerts(aJson.alerts || []);
      }
      setLastRefreshed(new Date().toLocaleTimeString());
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

  const chartData = weatherData?.forecast.map((f) => ({
    date: f.date.substring(5), // MM-DD
    maxTemp: f.max_temp,
    minTemp: f.min_temp,
    rain: f.precipitation,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Search */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30 mb-3">
            <ShieldAlert className="w-3.5 h-3.5" />
            Live Tourist Crisis Monitoring
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            {t.app_title}: {weatherData?.current.location_name || city}
          </h1>
          <p className="text-slate-300 text-sm mb-6">
            {t.tagline}
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.search_placeholder}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Navigation className="w-4 h-4" />
              Locate
            </button>
          </form>
        </div>
      </div>

      {/* Weather & Active Alert Summary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weather Card */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-orange-500" />
                {t.current_weather}
              </h2>
              <button
                onClick={() => fetchData(city)}
                disabled={loading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {weatherData ? (
              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <div className="text-4xl font-extrabold text-slate-900">
                    {weatherData.current.temperature.toFixed(1)}°C
                  </div>
                  <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                    {weatherData.current.weather_condition}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
                    <CloudRain className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-slate-400">{t.rain}</p>
                      <p className="font-bold text-slate-700">{weatherData.current.rainfall} mm</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
                    <Wind className="w-4 h-4 text-teal-500" />
                    <div>
                      <p className="text-slate-400">{t.wind}</p>
                      <p className="font-bold text-slate-700">{weatherData.current.wind_speed} km/h</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-indigo-500" />
                    <div>
                      <p className="text-slate-400">{t.humidity}</p>
                      <p className="font-bold text-slate-700">{weatherData.current.humidity ?? 'N/A'}%</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-orange-500" />
                    <div>
                      <p className="text-slate-400">Status</p>
                      <p className="font-bold text-emerald-600">Open-Meteo Live</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-sm">Loading current conditions...</div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>{t.last_updated}: {lastRefreshed || 'Just now'}</span>
            <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              live_weather_api
            </span>
          </div>
        </div>

        {/* 5-Day Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              {t.forecast_5day} (Temperature & Rain)
            </h2>
            <span className="text-xs text-slate-400">Open-Meteo Multi-Day Model</span>
          </div>

          <div className="h-48 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip />
                  <Area type="monotone" dataKey="maxTemp" stroke="#f97316" fill="#ffedd5" name="Max Temp (°C)" />
                  <Area type="monotone" dataKey="rain" stroke="#3b82f6" fill="#dbeafe" name="Rain (mm)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Awaiting forecast metric stream...
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100 text-xs">
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-3 rounded-full bg-orange-400 inline-block"></span>
                Max Temp
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-3 rounded-full bg-blue-400 inline-block"></span>
                Precipitation (mm)
              </span>
            </div>
            <Link to="/map" className="text-orange-600 hover:text-orange-700 font-semibold">
              Open Hazard Map →
            </Link>
          </div>
        </div>
      </div>

      {/* Active Alerts Section */}
      <div className="space-y-4">
        {/* Real Alerts Grid */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            {t.active_alerts} ({alerts.length})
          </h2>
          <Link to="/alerts" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
            View All Verified Advisories →
          </Link>
        </div>

        {alerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.slice(0, 4).map((alert) => (
              <AlertCard key={alert.id} alert={alert} currentLang={currentLang} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 text-center border border-slate-200 text-slate-500">
            {t.no_alerts}
          </div>
        )}
      </div>

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <Link to="/map" className="bg-white p-5 rounded-xl border border-slate-200 hover:border-orange-300 hover:shadow-md transition group">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mb-3 group-hover:scale-105 transition">
            🗺️
          </div>
          <h3 className="font-bold text-slate-900 mb-1">{t.nav_map}</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Locate verified cyclone shelters, flood danger polygons, and open hospitals near you.
          </p>
        </Link>

        <Link to="/assistant" className="bg-white p-5 rounded-xl border border-slate-200 hover:border-orange-300 hover:shadow-md transition group">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold mb-3 group-hover:scale-105 transition">
            🤖
          </div>
          <h3 className="font-bold text-slate-900 mb-1">{t.nav_assistant}</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Chat with our safety assistant for immediate step-by-step guidance in 5 languages.
          </p>
        </Link>

        <Link to="/settings" className="bg-white p-5 rounded-xl border border-slate-200 hover:border-orange-300 hover:shadow-md transition group">
          <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold mb-3 group-hover:scale-105 transition">
            🛡️
          </div>
          <h3 className="font-bold text-slate-900 mb-1">{t.nav_settings}</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Inspect trusted domain allowlists, feed freshness, and backend verification status.
          </p>
        </Link>
      </div>
    </div>
  );
};
