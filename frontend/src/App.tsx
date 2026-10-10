import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { AlertsPage } from './pages/AlertsPage';
import { SafetyMapPage } from './pages/SafetyMapPage';
import { AssistantPage } from './pages/AssistantPage';
import { SettingsPage } from './pages/SettingsPage';
import RegistrationPage from './pages/RegistrationPage';
import ProfilePage from './pages/ProfilePage';
import ReportPage from './pages/ReportPage';
import RoutePage from './pages/RoutePage';
import AdminDashboard from './pages/AdminDashboard';
import { TRANSLATIONS } from './translations';
import { PhoneCall, WifiOff, AlertTriangle, X } from 'lucide-react';
import { Alert } from './types';

export const App: React.FC = () => {
  const [currentLang, setCurrentLang] = useState<string>('en');
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [geofenceWarning, setGeofenceWarning] = useState<{ title: string; location: string; action: string } | null>(null);

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  // Track online / offline state
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Smart Geofence Location Hazard Monitoring
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;

        try {
          // Fetch current active alerts
          const res = await fetch('/api/alerts');
          if (res.ok) {
            const data = await res.json();
            const activeAlerts: Alert[] = data.alerts || [];

            // Check if user is within 10km of any alert centroid
            const nearbyHazard = activeAlerts.find((alert) => {
              if (alert.latitude && alert.longitude) {
                const distKm = Math.hypot(
                  (alert.latitude - userLat) * 111,
                  (alert.longitude - userLng) * 111 * Math.cos((userLat * Math.PI) / 180)
                );
                return distKm <= (alert.radius_km || 10);
              }
              return false;
            });

            if (nearbyHazard) {
              setGeofenceWarning({
                title: nearbyHazard.title,
                location: nearbyHazard.affected_location,
                action: nearbyHazard.recommended_action || 'Follow local evacuation orders and stay away from floodwaters.',
              });
            }
          }
        } catch (e) {
          // Ignore network errors in geofence check
        }
      },
      (err) => console.log('Geofence location error:', err),
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        <Navbar
          currentLang={currentLang}
          onLanguageChange={setCurrentLang}
          appMode="demo"
        />

        {/* Offline Emergency Mode Banner */}
        {isOffline && (
          <div className="bg-amber-600 text-white text-xs py-2 px-4 font-bold flex items-center justify-between shadow-md">
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
              <span className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-amber-200 animate-pulse" />
                <span>OFFLINE EMERGENCY MODE — Displaying cached alerts, shelters, and helpline directory.</span>
              </span>
              <span className="text-amber-100 text-[11px] font-mono">Cached Data Mode</span>
            </div>
          </div>
        )}

        {/* Smart Location Geofence Warning Notification */}
        {geofenceWarning && (
          <div className="bg-red-700 text-white text-xs py-3 px-4 shadow-lg border-b border-red-900">
            <div className="max-w-7xl mx-auto flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <div className="font-extrabold text-sm uppercase tracking-wide text-yellow-300">
                    ⚠️ Smart Geofence Warning: Entering Hazard Zone ({geofenceWarning.location})
                  </div>
                  <div className="font-medium mt-0.5 text-red-100">
                    <strong>{geofenceWarning.title}:</strong> {geofenceWarning.action}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setGeofenceWarning(null)}
                className="text-white hover:text-red-200 p-1 cursor-pointer"
                title="Dismiss Warning"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Global Emergency Hotbar */}
        <div className="bg-red-600 text-white text-xs py-1.5 px-4 font-semibold flex items-center justify-between shadow-xs">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 animate-bounce" />
              Emergency Hotlines: <strong>112 (Universal/EU/India)</strong> • <strong>911 (USA)</strong> • <strong>108 (Medical)</strong> • <strong>1070 (Disaster Admin)</strong>
            </span>
            <span className="hidden sm:inline text-red-100">
              {t.disclaimer}
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
          <Routes>
            <Route path="/" element={<Dashboard currentLang={currentLang} />} />
            <Route path="/alerts" element={<AlertsPage currentLang={currentLang} />} />
            <Route path="/map" element={<SafetyMapPage />} />
            <Route path="/assistant" element={<AssistantPage currentLang={currentLang} />} />
            <Route path="/settings" element={<SettingsPage currentLang={currentLang} onLanguageChange={setCurrentLang} />} />
            <Route path="/register" element={<RegistrationPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/route" element={<RoutePage />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-slate-700">TravelTech: CrisisCompass &copy; 2026</p>
              <p>Real-Time Crisis Communication & Verified Decision Support for Tourists</p>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span>Open-Meteo Weather</span>
              <span>•</span>
              <span>OpenStreetMap</span>
              <span>•</span>
              <span>FastAPI Backend</span>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
