import React, { useState } from 'react';
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
import { PhoneCall } from 'lucide-react';

export const App: React.FC = () => {
  const [currentLang, setCurrentLang] = useState<string>('en');

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        <Navbar
          currentLang={currentLang}
          onLanguageChange={setCurrentLang}
          appMode="demo"
        />

        {/* Global Emergency Hotbar */}
        <div className="bg-red-600 text-white text-xs py-1.5 px-4 font-semibold flex items-center justify-between shadow-xs">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 animate-bounce" />
              Emergency Hotlines: <strong>112 (Universal/EU/India)</strong> • <strong>911 (USA)</strong> • <strong>108 (Disaster Medical)</strong>
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
