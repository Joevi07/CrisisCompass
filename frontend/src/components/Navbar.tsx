import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  Compass, AlertTriangle, MapPin, Bot, ShieldCheck, 
  Globe, Bell, PhoneCall, ShieldAlert, Navigation, 
  Menu, X, Sparkles, User, FileText, Activity
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../translations';

interface NavbarProps {
  currentLang: string;
  onLanguageChange: (lang: string) => void;
  appMode?: string;
  alertCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentLang, 
  onLanguageChange, 
  appMode = "demo",
  alertCount = 3
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand matching Reference Design: TravelTech with geometric icon */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#0F4C5C] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-200">
              {/* Reference polygon/triangle logo shape */}
              <div className="flex items-center gap-0.5">
                <div className="w-2.5 h-5 bg-[#38BDAC] rounded-xs transform -skew-x-12"></div>
                <div className="w-2.5 h-6 bg-white rounded-xs transform skew-x-12"></div>
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-extrabold text-2xl tracking-tight text-[#0F4C5C]">TravelTech</span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 hidden sm:block tracking-wide">
                Your Safety. Our Priority.
              </p>
            </div>
          </Link>

          {/* Center Navigation Links (Clean pill style matching reference) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive 
                    ? 'text-[#0F4C5C] bg-[#F3F4F6] font-bold' 
                    : 'text-slate-600 hover:text-[#0F4C5C] hover:bg-slate-50'
                }`
              }
            >
              {t.nav_home}
            </NavLink>

            <NavLink
              to="/alerts"
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                  isActive 
                    ? 'text-[#0F4C5C] bg-[#F3F4F6] font-bold' 
                    : 'text-slate-600 hover:text-[#0F4C5C] hover:bg-slate-50'
                }`
              }
            >
              <span>{t.nav_alerts}</span>
              {alertCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#DF4444] text-white text-[11px] font-bold flex items-center justify-center">
                  {alertCount}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/map"
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive 
                    ? 'text-[#0F4C5C] bg-[#F3F4F6] font-bold' 
                    : 'text-slate-600 hover:text-[#0F4C5C] hover:bg-slate-50'
                }`
              }
            >
              {t.nav_map}
            </NavLink>

            <NavLink
              to="/route"
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive 
                    ? 'text-[#0F4C5C] bg-[#F3F4F6] font-bold' 
                    : 'text-slate-600 hover:text-[#0F4C5C] hover:bg-slate-50'
                }`
              }
            >
              {t.nav_route}
            </NavLink>

            <NavLink
              to="/assistant"
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 flex items-center gap-1 ${
                  isActive 
                    ? 'text-[#0F4C5C] bg-[#F3F4F6] font-bold' 
                    : 'text-slate-600 hover:text-[#0F4C5C] hover:bg-slate-50'
                }`
              }
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FB9038]" />
              {t.nav_assistant}
            </NavLink>

            <NavLink
              to="/report"
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive 
                    ? 'text-[#0F4C5C] bg-[#F3F4F6] font-bold' 
                    : 'text-slate-600 hover:text-[#0F4C5C] hover:bg-slate-50'
                }`
              }
            >
              {t.nav_guide}
            </NavLink>

            <NavLink
              to="/advanced"
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                  isActive 
                    ? 'text-[#0F4C5C] bg-[#F3F4F6] font-bold' 
                    : 'text-slate-600 hover:text-[#0F4C5C] hover:bg-slate-50'
                }`
              }
            >
              <Activity className="w-3.5 h-3.5 text-[#38BDAC]" />
              {t.nav_advanced}
            </NavLink>
          </nav>

          {/* Right Toolbar: Notifications, Language Selector, SOS Button, Avatar */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Red SOS Pill Button */}
            <NavLink
              to="/report"
              className="bg-[#DF4444] hover:bg-red-600 text-white px-3.5 py-2 rounded-full font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
            >
              <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
              <span>SOS</span>
            </NavLink>

            {/* Notification Bell */}
            <NavLink
              to="/alerts"
              className="relative p-2.5 rounded-full text-slate-500 hover:bg-slate-100 hover:text-[#0F4C5C] transition"
              title="Crisis Alerts"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#DF4444]"></span>
            </NavLink>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition cursor-pointer"
                title="Change Language"
              >
                <Globe className="w-4 h-4 text-[#38BDAC]" />
                <span>{currentLangObj.nativeName}</span>
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                    Select Language ({SUPPORTED_LANGUAGES.length})
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          onLanguageChange(lang.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                          currentLang === lang.code ? 'font-bold text-[#0F4C5C] bg-[#F3F4F6]' : 'text-slate-600'
                        }`}
                      >
                        <span>{lang.nativeName}</span>
                        <span className="text-[11px] text-slate-400 font-normal">({lang.name})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar matching reference ("MJ") */}
            <Link
              to="/profile"
              className="w-9 h-9 rounded-full bg-[#0F4C5C] text-white font-bold text-xs flex items-center justify-center hover:opacity-90 transition shadow-xs"
              title="Tourist Profile"
            >
              MJ
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-100 px-4 pt-3 pb-6 space-y-2 shadow-lg">
          <NavLink
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {t.nav_home}
          </NavLink>
          <NavLink
            to="/alerts"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <span>{t.nav_alerts}</span>
            <span className="px-2 py-0.5 rounded-full bg-[#DF4444] text-white text-xs font-bold">{alertCount}</span>
          </NavLink>
          <NavLink
            to="/map"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {t.nav_map}
          </NavLink>
          <NavLink
            to="/route"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {t.nav_route}
          </NavLink>
          <NavLink
            to="/assistant"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {t.nav_assistant}
          </NavLink>
          <NavLink
            to="/report"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {t.nav_guide}
          </NavLink>
          <NavLink
            to="/advanced"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-[#0F4C5C] bg-[#F3F4F6]"
          >
            {t.nav_advanced}
          </NavLink>
          <NavLink
            to="/settings"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {t.nav_status}
          </NavLink>
        </div>
      )}
    </header>
  );
};
