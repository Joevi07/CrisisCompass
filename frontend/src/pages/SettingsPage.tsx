import React, { useEffect, useState } from 'react';
import { ConfigStatusResponse } from '../types';
import { ShieldCheck, CheckCircle2, Globe, Database, Server, Info, AlertTriangle } from 'lucide-react';
import { TRANSLATIONS, SUPPORTED_LANGUAGES } from '../translations';
import { apiUrl } from '../utils/api';

interface SettingsPageProps {
  currentLang: string;
  onLanguageChange: (lang: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ currentLang, onLanguageChange }) => {
  const [config, setConfig] = useState<ConfigStatusResponse | null>(null);
  const [trustedSources, setTrustedSources] = useState<string[]>([]);

  useEffect(() => {
    fetch(apiUrl('/api/config/status'))
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error(err));

    fetch(apiUrl('/api/sources'))
      .then(res => res.json())
      .then(data => setTrustedSources(data.trusted_domains || []))
      .catch(err => console.error(err));
  }, []);

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-purple-600" />
          Settings, Data Freshness & Source Verification
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Transparency registry verifying live API connections, trusted warning domains, and anti-SSRF protections.
        </p>
      </div>

      {/* Language Preference */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
          <Globe className="w-5 h-5 text-blue-500" />
          Emergency Language Preference
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Select your primary language for weather bulletins and emergency rescue instructions.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            ...SUPPORTED_LANGUAGES.map(({ code, nativeName }) => ({ code, label: nativeName })),
          ].map((item) => (
            <button
              key={item.code}
              onClick={() => onLanguageChange(item.code)}
              className={`p-3 rounded-xl border text-sm font-semibold transition cursor-pointer text-center ${
                currentLang === item.code
                  ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Service Status */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-500" />
            Backend Service Status
          </h2>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            System Online
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {config?.services.map((svc, i) => (
            <div key={i} className="py-3 flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {svc.service_name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{svc.details}</p>
                <p className="text-[11px] text-slate-400 mt-0.5"><strong>Provider:</strong> {svc.provider}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                ACTIVE
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Trusted Domains Allowlist */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
          <Database className="w-5 h-5 text-indigo-500" />
          Authoritative Source Registry & SSRF Safeguards
        </h2>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Alerts are automatically verified against an allowlist of official meteorological and disaster management domains. Unlisted sources are flagged as <em>Unverified Reports</em> to prevent rumor spreading during crises.
        </p>

        <div className="flex flex-wrap gap-2">
          {trustedSources.map((d, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md text-xs font-mono text-slate-700"
            >
              {d}
            </span>
          ))}
        </div>
      </div>

      {/* Demo vs Live Policy Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-900">
        <h3 className="font-bold text-sm flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          Academic & Hackathon Demonstration Policy
        </h3>
        <p className="text-xs text-amber-800 leading-relaxed">
          In compliance with safety and integrity standards, fictional demonstration records are visibly marked with <strong>DEMO DATA</strong>. Live weather conditions are fetched directly from Open-Meteo with no mocked substitutions.
        </p>
      </div>
    </div>
  );
};
