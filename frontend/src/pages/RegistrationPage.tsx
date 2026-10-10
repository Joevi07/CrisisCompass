import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SUPPORTED_LANGUAGES } from '../translations';
import { getCache, saveCache } from '../utils/offlineCache';
import { ArrowRight, Compass, ShieldCheck, WifiOff } from 'lucide-react';
import heroImage from '../assets/coastal-traveler.jpg';


interface RegistrationFormData {
  email: string;
  full_name: string;
  phone_number: string;
  destination: string;
  language_preference: string;
  emergency_contact: string;
}

interface RegistrationPageProps {
  onGuest?: () => void;
}

export default function RegistrationPage({ onGuest }: RegistrationPageProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegistrationFormData>({
    email: '',
    full_name: '',
    phone_number: '',
    destination: '',
    language_preference: SUPPORTED_LANGUAGES.some((language) => language.code === localStorage.getItem('traveltech_language'))
      ? localStorage.getItem('traveltech_language')!
      : 'hi',
    emergency_contact: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mode, setMode] = useState<'signin' | 'register'>('signin');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'signin') {
        const cached = getCache<any>(`profile_email_${formData.email.trim().toLowerCase()}`)?.data;
        let user = cached;
        if (navigator.onLine) {
          try {
            const response = await fetch(`/api/users/email/${encodeURIComponent(formData.email.trim())}`, { signal: AbortSignal.timeout(5000) });
            if (response.ok) {
              user = await response.json();
              saveCache(`profile_email_${formData.email.trim().toLowerCase()}`, user);
            } else if (response.status === 404) {
              throw new Error('No account found for this email. Create an account first.');
            }
          } catch (networkError) {
            if (!cached) throw networkError;
          }
        }
        if (!user) throw new Error('This profile is not saved on this device. Connect to the internet to sign in.');
        const userLanguage = SUPPORTED_LANGUAGES.some((language) => language.code === user.language_preference)
          ? user.language_preference
          : 'hi';
        localStorage.setItem('userId', user.id);
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userFullName', user.full_name);
        localStorage.setItem('userLanguage', userLanguage);
        localStorage.setItem('traveltech_language', userLanguage);
        sessionStorage.removeItem('traveltech_guest_mode');
        saveCache(`profile_${user.id}`, user);
        window.dispatchEvent(new Event('crisiscompass-auth-change'));
        navigate(`/profile/${user.id}`);
        return;
      }

      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Registration failed');
      }

      const user = await response.json();
      setSuccess(true);
      
      // Store user ID in localStorage
      localStorage.setItem('userId', user.id);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userLanguage', user.language_preference);
      localStorage.setItem('userFullName', user.full_name);
      localStorage.setItem('traveltech_language', user.language_preference);
      sessionStorage.removeItem('traveltech_guest_mode');
      saveCache(`profile_email_${user.email.trim().toLowerCase()}`, user);
      saveCache(`profile_${user.id}`, user);
      window.dispatchEvent(new Event('crisiscompass-auth-change'));

      // Redirect to profile page after 2 seconds
      setTimeout(() => {
        navigate(`/profile/${user.id}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f2f7f8] p-3 sm:p-6 lg:p-10">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_80px_rgba(15,76,92,0.14)] sm:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative flex min-h-[250px] flex-col justify-between overflow-hidden bg-[#0f4c5c] p-7 text-white sm:min-h-[320px] sm:p-10 lg:min-h-full lg:p-12">
          <img src={heroImage} alt="Traveler looking across a coastal landscape" className="absolute inset-0 h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#062b3b]/95 via-[#0b3d50]/40 to-[#0b3d50]/20" />
          <div className="relative z-10 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 backdrop-blur"><Compass className="h-6 w-6" /></span>
            <div><p className="text-lg font-extrabold tracking-tight">CrisisCompass</p><p className="text-xs text-white/75">Travel with confidence</p></div>
          </div>
          <div className="relative z-10 mt-14 max-w-lg lg:mb-3">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-teal-100">Your journey, safer</p>
            <h2 className="text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">Explore more.<br />Travel prepared.</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/85 sm:text-base">Get local alerts, find safer routes, and keep important travel details close at hand.</p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-2 backdrop-blur"><ShieldCheck className="h-4 w-4" />Safety updates</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-2 backdrop-blur"><WifiOff className="h-4 w-4" />Saved essentials</span>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-9 sm:px-10 sm:py-12 lg:px-14">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <p className="mb-2 text-sm font-bold text-[#168b89]">{mode === 'signin' ? 'WELCOME BACK' : 'GET STARTED'}</p>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{mode === 'signin' ? 'Sign in' : 'Create your profile'}</h1>
              <p className="mt-2 text-sm text-slate-500">{mode === 'signin' ? 'Enter your email to continue your journey.' : 'Add a few details to personalize your safety information.'}</p>
            </div>

        {success && (
          <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            Profile created. Taking you to your profile…
          </div>
        )}

        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10"
              autoComplete="email"
              placeholder="your@email.com"
            />
          </div>

          {mode === 'register' && <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10"
              placeholder="John Doe"
            />
          </div>}

          {mode === 'register' && <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10"
              autoComplete="tel"
              placeholder="+1 (555) 000-0000"
            />
          </div>}

          {mode === 'register' && <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destination *
            </label>
            <input
              type="text"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10"
              placeholder="Chennai, India"
            />
          </div>}

          {mode === 'register' && <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Language *
            </label>
            <select
              name="language_preference"
              value={formData.language_preference}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10"
            >
              {SUPPORTED_LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>{language.nativeName}</option>
              ))}
            </select>
          </div>}

          {mode === 'register' && <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emergency Contact
            </label>
            <input
              type="tel"
              name="emergency_contact"
              value={formData.emergency_contact}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10"
              autoComplete="tel"
              placeholder="Emergency contact number"
            />
          </div>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f4c5c] px-5 py-3.5 font-bold text-white shadow-lg shadow-[#0f4c5c]/15 transition hover:bg-[#0b3c4a] focus:outline-none focus:ring-4 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Please wait…' : mode === 'signin' ? 'Continue' : 'Create profile'}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {mode === 'signin' ? 'New to CrisisCompass?' : 'Already have a profile?'}{' '}
          <button
            type="button"
            onClick={() => { setError(''); setMode(mode === 'signin' ? 'register' : 'signin'); }}
            className="font-bold text-teal-700 hover:text-teal-900"
          >
            {mode === 'signin' ? 'Create account' : 'Sign in'}
          </button>
        </p>
        {onGuest && (
          <button
            type="button"
            onClick={onGuest}
            className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Continue as guest
          </button>
        )}
          </div>
        </section>
      </div>
    </main>
  );
}
