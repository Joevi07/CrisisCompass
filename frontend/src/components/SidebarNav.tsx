import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { 
  Home, Bell, Map, Navigation, AlertTriangle, 
  Settings, PhoneCall, Globe, LogOut, User, ShieldCheck, 
  ChevronRight, Sparkles, MoreHorizontal, X
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../translations';
import { getCache, saveCache } from '../utils/offlineCache';
import { apiUrl } from '../utils/api';

interface SidebarNavProps {
  currentLang: string;
  onLanguageChange: (lang: string) => void;
  alertCount?: number;
  isOffline?: boolean;
}

interface UserProfileData {
  id: string;
  full_name: string;
  email: string;
  destination: string;
  language_preference: string;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  currentLang,
  onLanguageChange,
  alertCount = 3,
  isOffline = false,
}) => {
  const navigate = useNavigate();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem('userId'));
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(() => {
    const id = localStorage.getItem('userId');
    try { return id ? JSON.parse(localStorage.getItem(`crisiscompass_cache_profile_${id}`) || 'null')?.data || null : null; } catch { return null; }
  });

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const refreshAuth = () => {
      const id = localStorage.getItem('userId');
      setUserId(id);
      try { setUserProfile(id ? JSON.parse(localStorage.getItem(`crisiscompass_cache_profile_${id}`) || 'null')?.data || null : null); } catch { setUserProfile(null); }
    };
    window.addEventListener('crisiscompass-auth-change', refreshAuth);
    window.addEventListener('storage', refreshAuth);
    return () => { window.removeEventListener('crisiscompass-auth-change', refreshAuth); window.removeEventListener('storage', refreshAuth); };
  }, []);

  // Fetch logged in user profile dynamically
  useEffect(() => {
    if (!userId) {
      setUserProfile(null);
      return;
    }
    const cachedProfile = getCache<UserProfileData>(`profile_${userId}`)?.data;
    if (cachedProfile) setUserProfile(cachedProfile);
    fetch(apiUrl(`/api/users/${userId}`))
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setUserProfile(data);
          saveCache(`profile_${userId}`, data);
          saveCache(`profile_email_${data.email.trim().toLowerCase()}`, data);
          localStorage.setItem('userFullName', data.full_name);
        } else {
          // Fallback to localStorage email if available
          const storedEmail = localStorage.getItem('userEmail') || 'Tourist';
          setUserProfile({
            id: userId,
            full_name: localStorage.getItem('userFullName') || storedEmail.split('@')[0],
            email: storedEmail,
            destination: 'Chennai, India',
            language_preference: currentLang,
          });
        }
      })
      .catch(() => {
        const storedEmail = localStorage.getItem('userEmail') || 'Tourist';
        setUserProfile({
          id: userId,
          full_name: localStorage.getItem('userFullName') || storedEmail.split('@')[0],
          email: storedEmail,
          destination: 'Chennai, India',
          language_preference: currentLang,
        });
      });
  }, [userId, currentLang]);

  // Compute initials dynamically (e.g. "JD" for John Doe, "A" for Admin)
  const getUserInitials = (): string => {
    if (!userProfile || !userProfile.full_name) return 'T';
    const parts = userProfile.full_name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const handleSignOut = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userFullName');
    localStorage.removeItem('userLanguage');
    sessionStorage.removeItem('traveltech_guest_mode');
    window.dispatchEvent(new Event('crisiscompass-auth-change'));
    setUserId(null);
    setUserProfile(null);
    setProfileMenuOpen(false);
    navigate('/register');
  };

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 overflow-y-auto bg-white border-r border-slate-200 z-40 flex-col justify-between shadow-xs">
        <div>
          {/* Brand Logo & Sync Status */}
          <div className="p-6 border-b border-slate-100">
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src="/crisis-compass-logo.png"
                alt="CrisisCompass compass logo"
                className="h-10 w-10 shrink-0 rounded-xl object-contain shadow-sm transition-transform duration-200 group-hover:scale-105"
              />
              <div>
                <span className="font-black text-xl tracking-tight text-[#0F4C5C]">CrisisCompass</span>
                <p className="text-[10px] font-semibold text-slate-400">TravelTech Safety Platform</p>
              </div>
            </Link>

            {/* Sync / Connectivity Status Badge */}
            <div className="mt-4 flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="flex items-center gap-1.5 font-bold text-slate-600">
                <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`}></span>
                {isOffline ? 'Offline Mode' : 'LIVE SYNC'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">v2.4</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive ? 'bg-[#0F4C5C] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-[#0F4C5C]'
                }`
              }
            >
              <Home className="w-4 h-4" />
              <span>{t.nav_home || 'Dashboard'}</span>
            </NavLink>

            <NavLink
              to="/alerts"
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive ? 'bg-[#0F4C5C] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-[#0F4C5C]'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4" />
                <span>{t.nav_alerts || 'Live Alerts'}</span>
              </div>
              {alertCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#DF4444] text-white text-[10px] font-black">
                  {alertCount}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/map"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive ? 'bg-[#0F4C5C] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-[#0F4C5C]'
                }`
              }
            >
              <Map className="w-4 h-4" />
              <span>{t.nav_map || 'Safety Map'}</span>
            </NavLink>

            <NavLink
              to="/route"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive ? 'bg-[#0F4C5C] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-[#0F4C5C]'
                }`
              }
            >
              <Navigation className="w-4 h-4" />
              <span>{t.nav_route || 'Safe Route'}</span>
            </NavLink>

            <NavLink
              to="/assistant"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive ? 'bg-[#0F4C5C] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-[#0F4C5C]'
                }`
              }
            >
              <Sparkles className="w-4 h-4 text-[#FB9038]" />
              <span>{t.nav_assistant || 'AI Assistant'}</span>
            </NavLink>

            <NavLink
              to={userId ? `/profile/${userId}` : '/register'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive ? 'bg-[#0F4C5C] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-[#0F4C5C]'
                }`
              }
            >
              <User className="w-4 h-4" />
              <span>{t.nav_profile || 'Profile'}</span>
            </NavLink>

            <NavLink
              to="/report"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive ? 'bg-[#0F4C5C] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-[#0F4C5C]'
                }`
              }
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Report Hazard / SOS</span>
            </NavLink>

            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive ? 'bg-[#0F4C5C] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-[#0F4C5C]'
                }`
              }
            >
              <ShieldCheck className="w-4 h-4 text-[#38BDAC]" />
              <span>Authority Desk</span>
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive ? 'bg-[#0F4C5C] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-[#0F4C5C]'
                }`
              }
            >
              <Settings className="w-4 h-4" />
              <span>Sources & Status</span>
            </NavLink>
          </nav>
        </div>

        {/* Bottom Section: SOS Button, Language Switcher, & Dynamic User Profile */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          {/* Quick SOS Action Button */}
          <Link
            to="/report"
            className="w-full bg-[#DF4444] hover:bg-red-600 text-white font-black text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition transform active:scale-95"
          >
            <PhoneCall className="w-4 h-4 animate-bounce" />
            <span>EMERGENCY SOS</span>
          </Link>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#38BDAC]" />
                <span>{currentLangObj.nativeName}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">({currentLangObj.code.toUpperCase()})</span>
            </button>

            {langDropdownOpen && (
              <div className="absolute bottom-12 left-0 w-full bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                  Languages ({SUPPORTED_LANGUAGES.length})
                </div>
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onLanguageChange(lang.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer ${
                        currentLang === lang.code ? 'font-bold text-[#0F4C5C] bg-[#F3F4F6]' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{lang.nativeName}</span>
                      <span className="text-[10px] text-slate-400">({lang.name})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dynamic User Profile Card & Sign Out Menu */}
          <div className="relative pt-2 border-t border-slate-100">
            {userId ? (
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  {/* Dynamic Initials Avatar */}
                  <div className="w-9 h-9 rounded-xl bg-[#0F4C5C] text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                    {getUserInitials()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 line-clamp-1">
                      {userProfile?.full_name || 'Tourist Profile'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium line-clamp-1">
                      {userProfile?.destination || 'Chennai, India'}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            ) : (
              <Link
                to="/register"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
              >
                <User className="w-4 h-4 text-blue-600" />
                <span>Sign In / Register</span>
              </Link>
            )}

            {/* Profile Sign Out Popover */}
            {profileMenuOpen && userId && (
              <div className="absolute bottom-14 left-0 w-full bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 space-y-2">
                <div className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
                  <div>{userProfile?.full_name}</div>
                  <div className="text-[11px] font-normal text-slate-500">{userProfile?.email}</div>
                </div>
                <Link
                  to={`/profile/${userId}`}
                  onClick={() => setProfileMenuOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <User className="w-4 h-4 text-blue-600" />
                  <span>View Account Profile</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-600" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Compact mobile navigation; secondary destinations live in More. */}
      {mobileMoreOpen && <button aria-label="Close menu" className="lg:hidden fixed inset-0 z-40 bg-slate-950/30" onClick={() => setMobileMoreOpen(false)} />}
      {mobileMoreOpen && (
        <div className="lg:hidden fixed bottom-[4.5rem] left-3 right-3 z-50 mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between px-2">
            <span className="text-sm font-bold text-slate-800">More</span>
            <button aria-label="Close menu" onClick={() => setMobileMoreOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { to: '/route', label: 'Safe Route', icon: Navigation },
              { to: '/assistant', label: 'AI Assistant', icon: Sparkles },
              { to: userId ? `/profile/${userId}` : '/register', label: 'Profile', icon: User },
              { to: '/settings', label: 'Settings', icon: Settings },
              { to: '/admin', label: 'Authority Desk', icon: ShieldCheck },
            ].map(({ to, label, icon: Icon }) => (
              <NavLink key={label} to={to} onClick={() => setMobileMoreOpen(false)} className={({ isActive }) => `flex min-w-0 items-center gap-2 rounded-xl px-3 py-3 text-xs font-semibold ${isActive ? 'bg-[#0F4C5C] text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>
                <Icon className="h-4 w-4 shrink-0" /><span className="truncate">{label}</span>
              </NavLink>
            ))}
            {userId && <button onClick={() => { setMobileMoreOpen(false); handleSignOut(); }} className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-3 text-left text-xs font-semibold text-red-700"><LogOut className="h-4 w-4 shrink-0" />Sign out</button>}
          </div>
        </div>
      )}
      <nav aria-label="Main navigation" className="lg:hidden fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 items-center border-t border-slate-200 bg-white/95 px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_24px_rgba(15,76,92,0.1)] backdrop-blur">
        <NavLink to="/" className={({ isActive }) => `flex min-w-0 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-bold ${isActive ? 'text-[#0F4C5C]' : 'text-slate-500'}`}><Home className="h-5 w-5" /><span>Home</span></NavLink>
        <NavLink to="/alerts" className={({ isActive }) => `relative flex min-w-0 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-bold ${isActive ? 'text-[#0F4C5C]' : 'text-slate-500'}`}><Bell className="h-5 w-5" /><span>Alerts</span>{alertCount > 0 && <span className="absolute right-[calc(50%-1rem)] top-0 h-2 w-2 rounded-full bg-[#DF4444]" />}</NavLink>
        <NavLink to="/report" aria-label="Emergency SOS" className="-mt-5 mx-auto flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-[#DF4444] text-white shadow-lg shadow-red-900/20"><PhoneCall className="h-5 w-5" /></NavLink>
        <NavLink to="/map" className={({ isActive }) => `flex min-w-0 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-bold ${isActive ? 'text-[#0F4C5C]' : 'text-slate-500'}`}><Map className="h-5 w-5" /><span>Map</span></NavLink>
        <button aria-expanded={mobileMoreOpen} onClick={() => setMobileMoreOpen(!mobileMoreOpen)} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-bold ${mobileMoreOpen ? 'text-[#0F4C5C]' : 'text-slate-500'}`}><MoreHorizontal className="h-5 w-5" /><span>More</span></button>
      </nav>
    </>
  );
};
