import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TRANSLATIONS as translations, SUPPORTED_LANGUAGES } from '../translations';
import { fetchWithOfflineFallback, saveCache } from '../utils/offlineCache';
import { 
  User, Mail, Phone, MapPin, Globe, HeartPulse, 
  ShieldAlert, Calendar, Edit3, Save, X, Trash2, 
  CheckCircle, AlertCircle, Sparkles, AlertTriangle
} from 'lucide-react';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  destination: string;
  city?: string;
  state?: string;
  blood_group?: string;
  language_preference: string;
  latitude?: number;
  longitude?: number;
  emergency_contact?: string;
  emergency_contact_phone?: string;
  created_at: string;
  is_active: boolean;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    city: '',
    state: '',
    blood_group: '',
    language_preference: 'en',
    emergency_contact: '',
    emergency_contact_phone: '',
    destination: ''
  });

  const currentUserId = userId || localStorage.getItem('userId');
  const savedLanguage = localStorage.getItem('traveltech_language') || localStorage.getItem('userLanguage') || 'en';
  const currentLanguage = SUPPORTED_LANGUAGES.some((lang) => lang.code === savedLanguage) ? savedLanguage : 'en';
  const t = translations[currentLanguage as keyof typeof translations] || translations['en'];

  useEffect(() => {
    fetchProfile();
  }, [currentUserId]);

  const populateForm = (data: UserProfile) => {
    // Parse emergency contact string if it contains name & phone (e.g., "Parent - +91 9876543210")
    let ecName = data.emergency_contact || '';
    let ecPhone = data.emergency_contact_phone || '';
    if (ecName.includes(' - ') && !ecPhone) {
      const parts = ecName.split(' - ');
      ecName = parts[0].trim();
      ecPhone = parts[1].trim();
    }

    // Parse city / state if not individually split
    let cityVal = data.city || '';
    let stateVal = data.state || '';
    if (!cityVal && data.destination) {
      const destParts = data.destination.split(',').map(s => s.trim());
      cityVal = destParts[0] || '';
      stateVal = destParts[1] || '';
    }

    setFormData({
      full_name: data.full_name || '',
      phone_number: data.phone_number || '',
      city: cityVal,
      state: stateVal,
      blood_group: data.blood_group || '',
      language_preference: data.language_preference || currentLanguage,
      emergency_contact: ecName,
      emergency_contact_phone: ecPhone,
      destination: data.destination || `${cityVal || 'Chennai'}, ${stateVal || 'Tamil Nadu'}, India`
    });
  };

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    
    // Check if we have user identification
    const effectiveId = currentUserId || localStorage.getItem('userId');
    const storedEmail = localStorage.getItem('userEmail');
    const storedName = localStorage.getItem('userFullName');

    try {
      if (effectiveId) {
        try {
          const payload = await fetchWithOfflineFallback<UserProfile>(`/api/users/${effectiveId}`, `profile_${effectiveId}`);
          if (payload && payload.data) {
            const data = payload.data;
            setUser(data);
            populateForm(data);
            setLoading(false);
            return;
          }
        } catch (fetchErr) {
          console.warn('Direct user ID fetch failed, trying email fallback:', fetchErr);
        }
      }

      // Fallback 1: lookup by stored email
      if (storedEmail) {
        try {
          const emailRes = await fetch(`/api/users/email/${encodeURIComponent(storedEmail.trim())}`);
          if (emailRes.ok) {
            const data = await emailRes.json();
            setUser(data);
            populateForm(data);
            localStorage.setItem('userId', data.id);
            setLoading(false);
            return;
          }
        } catch (emailErr) {
          console.warn('Email lookup failed:', emailErr);
        }
      }

      // Safe Auto-Initialization: if profile was never persisted on backend, initialize cleanly
      if (storedEmail || storedName || effectiveId) {
        const initData: UserProfile = {
          id: effectiveId || `user-${Date.now()}`,
          email: storedEmail || 'tourist@crisiscompass.in',
          full_name: storedName || 'Registered Tourist',
          phone_number: '',
          city: 'Chennai',
          state: 'Tamil Nadu',
          destination: 'Chennai, Tamil Nadu, India',
          blood_group: '',
          language_preference: currentLanguage,
          emergency_contact: '',
          created_at: new Date().toISOString(),
          is_active: true
        };

        // Try registering in backend database if network is alive
        if (navigator.onLine && storedEmail) {
          try {
            const regRes = await fetch('/api/users/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: initData.email,
                full_name: initData.full_name,
                destination: initData.destination,
                language_preference: initData.language_preference,
                city: initData.city,
                state: initData.state
              })
            });
            if (regRes.ok) {
              const createdUser = await regRes.json();
              setUser(createdUser);
              populateForm(createdUser);
              localStorage.setItem('userId', createdUser.id);
              saveCache(`profile_${createdUser.id}`, createdUser);
              setLoading(false);
              return;
            }
          } catch (regErr) {
            console.warn('Backend auto-creation failed, using active memory profile:', regErr);
          }
        }

        // Use local verified fallback
        setUser(initData);
        populateForm(initData);
        if (!effectiveId) localStorage.setItem('userId', initData.id);
      } else {
        // No account session exists at all, redirect to registration
        navigate('/register');
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    const targetId = user?.id || currentUserId || localStorage.getItem('userId');
    const combinedEmergency = formData.emergency_contact_phone 
      ? `${formData.emergency_contact || 'Emergency Contact'} - ${formData.emergency_contact_phone}`
      : formData.emergency_contact;

    const formattedDestination = `${formData.city || 'Chennai'}, ${formData.state || 'Tamil Nadu'}, India`;

    const updatePayload = {
      full_name: formData.full_name,
      phone_number: formData.phone_number,
      destination: formattedDestination,
      city: formData.city,
      state: formData.state,
      blood_group: formData.blood_group,
      language_preference: formData.language_preference,
      emergency_contact: combinedEmergency
    };

    try {
      let savedProfile: UserProfile | null = null;
      if (targetId && navigator.onLine) {
        const response = await fetch(`/api/users/${targetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        });

        if (response.ok) {
          savedProfile = await response.json();
        }
      }

      const mergedUser: UserProfile = savedProfile || {
        ...(user || ({} as UserProfile)),
        id: targetId || 'local-user',
        email: user?.email || localStorage.getItem('userEmail') || '',
        ...updatePayload,
        created_at: user?.created_at || new Date().toISOString(),
        is_active: true
      };

      setUser(mergedUser);
      populateForm(mergedUser);
      saveCache(`profile_${mergedUser.id}`, mergedUser);
      if (mergedUser.email) {
        saveCache(`profile_email_${mergedUser.email.trim().toLowerCase()}`, mergedUser);
      }
      
      localStorage.setItem('userFullName', mergedUser.full_name);
      localStorage.setItem('userEmail', mergedUser.email);
      localStorage.setItem('userLanguage', mergedUser.language_preference);
      localStorage.setItem('traveltech_language', mergedUser.language_preference);
      window.dispatchEvent(new Event('crisiscompass-auth-change'));

      setIsEditing(false);
      setSuccessMsg('Profile updated successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to deactivate your profile?')) return;
    const targetId = user?.id || currentUserId;
    try {
      if (targetId && navigator.onLine) {
        await fetch(`/api/users/${targetId}`, { method: 'DELETE' });
      }
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userFullName');
      localStorage.removeItem('userLanguage');
      sessionStorage.removeItem('traveltech_guest_mode');
      window.dispatchEvent(new Event('crisiscompass-auth-change'));
      navigate('/register');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deactivating account');
    }
  };

  // Helper to extract initials
  const getInitials = (name?: string) => {
    if (!name) return 'IN';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="w-12 h-12 border-4 border-[#0F4C5C]/20 border-t-[#0F4C5C] rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-500">Loading your CrisisCompass profile...</p>
      </div>
    );
  }

  const locationDisplay = user?.city && user?.state 
    ? `${user.city}, ${user.state}, India`
    : user?.destination || 'Chennai, Tamil Nadu, India';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Top Banner & Avatar Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-[#0F4C5C] via-[#1a6477] to-[#38BDAC]" />
        
        <div className="relative pt-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            {/* User Avatar Initials */}
            <div className="w-24 h-24 rounded-3xl bg-white p-1.5 shadow-lg flex-shrink-0">
              <div className="w-full h-full rounded-2xl bg-[#0F4C5C] text-white flex items-center justify-center font-black text-2xl tracking-wider shadow-inner">
                {getInitials(user?.full_name)}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                  {user?.full_name || 'Tourist Profile'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  Verified Tourist
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-[#38BDAC]" />
                <span>{locationDisplay}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-400">CrisisCompass India Network</span>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 bg-[#0F4C5C] hover:bg-[#0c3c49] text-white text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSave()}
                  disabled={saving}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    if (user) populateForm(user);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Details Grid */}
      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Personal & Identification Information */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-[#0F4C5C]" />
              <span>Personal Details</span>
            </h2>
            <span className="text-[11px] font-semibold text-slate-400">Account Identity</span>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Full Name</label>
            {isEditing ? (
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
              />
            ) : (
              <p className="text-xs sm:text-sm font-bold text-slate-800 py-1">{user?.full_name || 'Not provided'}</p>
            )}
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Email Address</label>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-800 font-medium py-1">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{user?.email || 'Not provided'}</span>
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Mobile Phone Number</label>
            {isEditing ? (
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
              />
            ) : (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-800 font-medium py-1">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{user?.phone_number || 'Not provided'}</span>
              </div>
            )}
          </div>

          {/* Blood Group (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Blood Group (Optional Emergency Metric)</label>
            {isEditing ? (
              <select
                name="blood_group"
                value={formData.blood_group}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
              >
                <option value="">Select Blood Group</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium py-1">
                <HeartPulse className="w-4 h-4 text-rose-500" />
                <span className="font-bold text-slate-800">{user?.blood_group || 'Not provided'}</span>
              </div>
            )}
          </div>

          {/* Account Creation Date */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>Registered on</span>
            </span>
            <span className="font-bold text-slate-600">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
            </span>
          </div>
        </div>

        {/* Card 2: India Location & Language System */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#0F4C5C]" />
              <span>Location & Language</span>
            </h2>
            <span className="text-[11px] font-semibold text-slate-400">India Region</span>
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Current City (India)</label>
            {isEditing ? (
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Chennai, Mumbai, New Delhi"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
              />
            ) : (
              <p className="text-xs sm:text-sm font-bold text-slate-800 py-1">
                {formData.city || (user?.destination?.split(',')[0] || 'Chennai')}
              </p>
            )}
          </div>

          {/* State / UT */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">State / Union Territory</label>
            {isEditing ? (
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="e.g. Tamil Nadu, Maharashtra, Delhi"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
              />
            ) : (
              <p className="text-xs sm:text-sm font-bold text-slate-800 py-1">
                {formData.state || (user?.destination?.split(',')[1] || 'Tamil Nadu')}
              </p>
            )}
          </div>

          {/* Country: Fixed to India */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Country</label>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 py-1">
              <span className="text-base">🇮🇳</span>
              <span>India</span>
              <span className="text-[10px] text-slate-400 font-normal">(CrisisCompass India Alert System)</span>
            </div>
          </div>

          {/* Preferred Language connected to application i18n */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Preferred Crisis Language (12 Supported)</label>
            {isEditing ? (
              <select
                name="language_preference"
                value={formData.language_preference}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-800 font-bold py-1">
                <Globe className="w-4 h-4 text-[#38BDAC]" />
                <span>
                  {SUPPORTED_LANGUAGES.find(l => l.code === (user?.language_preference || currentLanguage))?.nativeName || 'English'}
                </span>
                <span className="text-slate-400 font-normal">
                  ({SUPPORTED_LANGUAGES.find(l => l.code === (user?.language_preference || currentLanguage))?.name || 'English'})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Emergency Contact Information (Spans 2 columns) */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#DF4444]" />
              <span>Emergency Contact Information</span>
            </h2>
            <span className="text-[11px] font-semibold text-[#DF4444] bg-red-50 px-2.5 py-0.5 rounded-full">
              Automated SOS Recipient
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Emergency Contact Name / Relation</label>
              {isEditing ? (
                <input
                  type="text"
                  name="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={handleChange}
                  placeholder="e.g. Parent, Spouse, Local Guardian"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                />
              ) : (
                <p className="text-xs sm:text-sm font-bold text-slate-800 py-1">
                  {formData.emergency_contact || 'Not provided'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Emergency Contact Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={handleChange}
                  placeholder="+91 98400 11223"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                />
              ) : (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-800 font-medium py-1">
                  <Phone className="w-4 h-4 text-[#DF4444]" />
                  <span>{formData.emergency_contact_phone || 'Not provided'}</span>
                </div>
              )}
            </div>
          </div>
          
          <p className="text-[11px] text-slate-400 font-medium">
            This contact receives automated SMS broadcasts and geo-coordinates when you tap the 1-Click SOS emergency button.
          </p>
        </div>

      </form>

      {/* Account Management & Deactivation */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-sm text-slate-800">Account Security & Data Management</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Deactivate your tourist record and remove cached local emergency preferences.
          </p>
        </div>

        <button
          onClick={handleDelete}
          className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Deactivate Account</span>
        </button>
      </div>

    </div>
  );
}
