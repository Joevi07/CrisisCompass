import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, AlertTriangle, MapPin, Bot, ShieldCheck, Globe, Wifi } from 'lucide-react';

interface NavbarProps {
  currentLang: string;
  onLanguageChange: (lang: string) => void;
  appMode?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentLang, onLanguageChange, appMode = "demo" }) => {
  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'fr', label: 'Français' },
    { code: 'es', label: 'Español' },
  ];

  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="bg-orange-500 p-2 rounded-lg text-white shadow-inner flex items-center justify-center">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-2">
                TravelTech <span className="text-orange-400 font-light text-sm bg-slate-800 px-2 py-0.5 rounded border border-slate-700">CrisisCompass</span>
              </span>
              <p className="text-xs text-slate-400 hidden sm:block">Tourist Emergency Communication Platform</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1 lg:space-x-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                  isActive ? 'bg-slate-800 text-orange-400 border border-slate-700' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/alerts"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                  isActive ? 'bg-slate-800 text-orange-400 border border-slate-700' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              Live Alerts
            </NavLink>
            <NavLink
              to="/map"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                  isActive ? 'bg-slate-800 text-orange-400 border border-slate-700' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <MapPin className="w-4 h-4 text-emerald-400" />
              Safety Map
            </NavLink>
            <NavLink
              to="/assistant"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                  isActive ? 'bg-slate-800 text-orange-400 border border-slate-700' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Bot className="w-4 h-4 text-blue-400" />
              AI Assistant
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                  isActive ? 'bg-slate-800 text-orange-400 border border-slate-700' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              Sources & Status
            </NavLink>
          </nav>

          {/* Right Toolbar: Language & Mode */}
          <div className="flex items-center space-x-3">
            <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 border border-amber-500/40 text-amber-300">
              <Wifi className="w-3 h-3 text-amber-400" />
              {appMode === 'demo' ? 'DEMO MODE' : 'LIVE API'}
            </span>

            {/* Language Selector */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-sm text-slate-200">
              <Globe className="w-4 h-4 mr-1.5 text-slate-400" />
              <select
                value={currentLang}
                onChange={(e) => onLanguageChange(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer text-xs sm:text-sm font-medium"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bar */}
      <div className="md:hidden flex justify-around bg-slate-950 py-2 border-t border-slate-800 text-xs">
        <NavLink to="/" className="text-slate-400 hover:text-white px-2 py-1">Dashboard</NavLink>
        <NavLink to="/alerts" className="text-slate-400 hover:text-white px-2 py-1">Alerts</NavLink>
        <NavLink to="/map" className="text-slate-400 hover:text-white px-2 py-1">Map</NavLink>
        <NavLink to="/assistant" className="text-slate-400 hover:text-white px-2 py-1">Assistant</NavLink>
        <NavLink to="/settings" className="text-slate-400 hover:text-white px-2 py-1">Status</NavLink>
      </div>
    </header>
  );
};
