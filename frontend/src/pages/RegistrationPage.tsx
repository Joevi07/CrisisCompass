import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SUPPORTED_LANGUAGES } from '../translations';
import { getCache, saveCache } from '../utils/offlineCache';


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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{mode === 'signin' ? 'Sign in to CrisisCompass' : 'Create your tourist profile'}</h1>
        <p className="text-gray-600 mb-6">Your saved emergency profile stays available on this device when connectivity is limited.</p>
        {mode === 'signin' && (
          <p className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Prototype sign-in looks up a profile by email only. Add password or one-time-code verification before using real accounts.
          </p>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            Registration successful! Redirecting to your profile...
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Emergency contact number"
            />
          </div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-4">
          {mode === 'signin' ? 'New to CrisisCompass?' : 'Already have a profile?'}{' '}
          <button
            type="button"
            onClick={() => { setError(''); setMode(mode === 'signin' ? 'register' : 'signin'); }}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {mode === 'signin' ? 'Create account' : 'Sign in'}
          </button>
        </p>
        {onGuest && (
          <button
            type="button"
            onClick={onGuest}
            className="mt-5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Continue as guest — emergency information is available offline
          </button>
        )}
      </div>
    </div>
  );
}
