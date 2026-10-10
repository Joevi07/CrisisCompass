import React from 'react';
import { Alert } from '../types';
import { AlertCircle, AlertTriangle, ShieldCheck, Clock, ExternalLink, ShieldAlert } from 'lucide-react';

interface AlertCardProps {
  alert: Alert;
  currentLang?: string;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, currentLang = 'en' }) => {
  if (!alert || !alert.id) {
    return null;
  }

  const getSeverityBadge = (severity: string) => {
    switch ((severity || '').toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'moderate':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'Official source':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Official Source
          </span>
        );
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Verified
          </span>
        );
      case 'Expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            Unverified Report
          </span>
        );
    }
  };

  const displayTitle = currentLang !== 'en' && alert.translated_title ? alert.translated_title : alert.title;
  const displayDescription = currentLang !== 'en' && alert.translated_description ? alert.translated_description : alert.description;
  const isDemoData = alert.data_origin === 'simulated_demo_data';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition p-5 flex flex-col justify-between">
      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border uppercase tracking-wider ${getSeverityBadge(alert.severity)}`}>
              {alert.severity}
            </span>
            <span className="text-xs uppercase font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {alert.hazard_type}
            </span>
          </div>
          <div>{isDemoData
            ? <span className="inline-flex rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">Demo only · not an official warning</span>
            : getVerificationBadge(alert.verification_status)}</div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-start gap-2">
          <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${alert.severity === 'Critical' ? 'text-red-500' : 'text-orange-500'}`} />
          {displayTitle}
        </h3>

        {/* Location & Authority */}
        <p className="text-xs text-slate-500 mb-3">
          <strong className="text-slate-700">Area:</strong> {alert.affected_location} • <strong className="text-slate-700">Authority:</strong> {alert.issuing_authority}
        </p>

        {/* Content */}
        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          {displayDescription}
        </p>

        {/* Safety Action Callout */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-md mb-4 text-xs">
          <p className="font-semibold text-amber-900 flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            Recommended Safety Action:
          </p>
          <p className="text-amber-800 font-medium">{alert.recommended_action}</p>
        </div>
      </div>

      {/* Meta Footer */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>Updated: {new Date(alert.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        
        {!isDemoData && <a
          href={alert.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 ml-auto"
        >
          Official Source
          <ExternalLink className="w-3 h-3" />
        </a>}
      </div>
    </div>
  );
};
