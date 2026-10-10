import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SidebarNav } from './components/SidebarNav';
const Dashboard = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const AlertsPage = lazy(() => import('./pages/AlertsPage').then((module) => ({ default: module.AlertsPage })));
const SafetyMapPage = lazy(() => import('./pages/SafetyMapPage').then((module) => ({ default: module.SafetyMapPage })));
const AssistantPage = lazy(() => import('./pages/AssistantPage').then((module) => ({ default: module.AssistantPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));
import RegistrationPage from './pages/RegistrationPage';
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ReportPage = lazy(() => import('./pages/ReportPage'));
const RoutePage = lazy(() => import('./pages/RoutePage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
import { TRANSLATIONS, SUPPORTED_LANGUAGES } from './translations';
import { PhoneCall, WifiOff, AlertTriangle, X } from 'lucide-react';
import { Alert } from './types';
import { fetchWithOfflineFallback } from './utils/offlineCache';

export const App: React.FC = () => {
  const [currentLang, setCurrentLang] = useState<string>(() => {
    const savedLanguage = localStorage.getItem('traveltech_language');
    return SUPPORTED_LANGUAGES.some((language) => language.code === savedLanguage) ? savedLanguage! : 'en';
  });

  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [geofenceWarning, setGeofenceWarning] = useState<{ title: string; location: string; action: string } | null>(null);
  const [showStartupAuthModal, setShowStartupAuthModal] = useState<boolean>(() =>
    !localStorage.getItem('userId') && sessionStorage.getItem('traveltech_guest_mode') !== 'true'
  );

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const handleLanguageChange = (lang: string) => {
    setCurrentLang(lang);
    localStorage.setItem('traveltech_language', lang);
  };

  useEffect(() => {
    const syncAuthScreen = () => {
      setShowStartupAuthModal(
        !localStorage.getItem('userId') && sessionStorage.getItem('traveltech_guest_mode') !== 'true'
      );
    };
    window.addEventListener('crisiscompass-auth-change', syncAuthScreen);
    return () => window.removeEventListener('crisiscompass-auth-change', syncAuthScreen);
  }, []);

  // Keep document language in sync with the selected language.
  useEffect(() => {
    const langObj = SUPPORTED_LANGUAGES.find(l => l.code === currentLang);
    const dir = langObj?.dir || 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', currentLang);
  }, [currentLang]);

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

  // Smart Geofence Location Hazard Monitoring (with offline cache fallback)
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;

        try {
          const payload = await fetchWithOfflineFallback<{ alerts: Alert[] }>('/api/alerts', 'active_alerts');
          const activeAlerts: Alert[] = payload.data.alerts || [];

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
      {showStartupAuthModal ? (
        <RegistrationPage onGuest={() => {
          sessionStorage.setItem('traveltech_guest_mode', 'true');
          setShowStartupAuthModal(false);
        }} />
      ) : (
      <div className="min-h-screen flex flex-col lg:flex-row bg-[#f8fafc] text-slate-800 font-['Poppins',sans-serif]">
        {/* Responsive Sidebar Navigation Layout */}
        <SidebarNav
          currentLang={currentLang}
          onLanguageChange={handleLanguageChange}
          alertCount={3}
          isOffline={isOffline}
        />

        {/* Main Workspace Container (Padded left for fixed sidebar on desktop, bottom for mobile nav) */}
        <div className="flex-1 lg:ml-64 flex flex-col min-h-screen pb-20 lg:pb-0">
          {/* Offline Emergency Mode Banner */}
          {isOffline && (
            <div className="bg-[#FB9038] text-white text-xs py-2 px-4 font-bold flex items-center justify-between shadow-md">
              <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <WifiOff className="w-4 h-4 text-amber-100 animate-pulse" />
                  <span>OFFLINE EMERGENCY MODE — Displaying cached alerts, shelters, and helpline directory.</span>
                </span>
                <span className="text-amber-100 text-[11px] font-mono">Cached Data Active</span>
              </div>
            </div>
          )}

          {/* Smart Location Geofence Warning Notification */}
          {geofenceWarning && (
            <div className="bg-[#DF4444] text-white text-xs py-3 px-4 shadow-lg border-b border-red-900">
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
          <div className="bg-[#0F4C5C] text-white text-xs py-2 px-4 font-semibold shadow-xs">
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
              <span className="flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5 text-[#38BDAC] animate-bounce" />
                <span>
                  Emergency Helplines: <strong>112 (All-in-one)</strong> • <strong>108 (Ambulance)</strong> • <strong>101 (Fire)</strong> • <strong>1070 (Disaster Control)</strong>
                </span>
              </span>
              <span className="hidden sm:inline text-slate-300 text-[11px]">
                {t.disclaimer}
              </span>
            </div>
          </div>

          {/* Main Content Router */}
          <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
            <Suspense fallback={<div className="min-h-64 flex items-center justify-center p-8 text-sm font-semibold text-slate-600" role="status">Loading this page…</div>}>
              <Routes>
                <Route path="/" element={<Dashboard currentLang={currentLang} />} />
                <Route path="/alerts" element={<AlertsPage currentLang={currentLang} />} />
                <Route path="/map" element={<SafetyMapPage />} />
                <Route path="/route" element={<RoutePage />} />
                <Route path="/assistant" element={<AssistantPage currentLang={currentLang} />} />
                <Route path="/settings" element={<SettingsPage currentLang={currentLang} onLanguageChange={handleLanguageChange} />} />
                <Route path="/register" element={<RegistrationPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/:userId" element={<ProfilePage />} />
                <Route path="/report" element={<ReportPage />} />
                <Route path="/admin" element={<AdminDashboard />} />
              </Routes>
            </Suspense>
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-slate-100 py-8 text-xs text-slate-500 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0F4C5C] flex items-center justify-center text-white font-bold text-sm">
                  TT
                </div>
                <div>
                  <p className="font-extrabold text-sm text-[#0F4C5C]">TravelTech CrisisCompass</p>
                  <p className="text-slate-400">Your Safety. Our Priority. &copy; 2026</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-slate-400 font-medium">
                <span>Open-Meteo Weather API</span>
                <span>•</span>
                <span>OpenStreetMap Tiles</span>
                <span>•</span>
                <span>FastAPI Architecture</span>
                <span>•</span>
                <span className="text-[#38BDAC] font-bold">English + {SUPPORTED_LANGUAGES.length - 1} Indian Languages</span>
              </div>
            </div>
          </footer>
        </div>

      </div>
      )}
    </BrowserRouter>
  );
};

export default App;
