import React, { useEffect, useState } from 'react';
import { Alert } from '../types';
import { AlertCard } from '../components/AlertCard';
import { TRANSLATIONS } from '../translations';
import { Search, Filter, ShieldCheck, AlertTriangle } from 'lucide-react';

interface AlertsPageProps {
  currentLang: string;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ currentLang }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [hazardFilter, setHazardFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/alerts?lang=${currentLang}`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
        setFilteredAlerts(data.alerts || []);
      }
    } catch (e) {
      console.error('Error fetching alerts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [currentLang]);

  useEffect(() => {
    let result = [...alerts];

    if (severityFilter !== 'all') {
      result = result.filter(a => a.severity.toLowerCase() === severityFilter.toLowerCase());
    }

    if (hazardFilter !== 'all') {
      result = result.filter(a => a.hazard_type.toLowerCase() === hazardFilter.toLowerCase());
    }

    if (verificationFilter !== 'all') {
      result = result.filter(a => a.verification_status.toLowerCase() === verificationFilter.toLowerCase());
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        a => a.title.toLowerCase().includes(q) ||
             a.description.toLowerCase().includes(q) ||
             a.affected_location.toLowerCase().includes(q) ||
             a.issuing_authority.toLowerCase().includes(q)
      );
    }

    setFilteredAlerts(result);
  }, [severityFilter, hazardFilter, verificationFilter, search, alerts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              {t.active_alerts}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Authoritative disaster warnings with domain verification, expiry detection, and safety protocols.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              Total Records: {filteredAlerts.length}
            </span>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search keyword or city..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">Severity: All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="moderate">Moderate</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={hazardFilter}
              onChange={(e) => setHazardFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">Hazard: All Types</option>
              <option value="flood">Flood</option>
              <option value="cyclone">Cyclone</option>
              <option value="heavy_rain">Heavy Rain</option>
              <option value="restricted">Restricted / Exclusion Zone</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">Source: All Statuses</option>
              <option value="official source">Official Source Only</option>
              <option value="verified">Verified</option>
              <option value="unverified report">Unverified Reports</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alert Listings */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading alerts registry...</div>
      ) : filteredAlerts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} currentLang={currentLang} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <p className="text-slate-600 font-semibold mb-1">No matching disaster alerts found</p>
          <p className="text-xs text-slate-400">Try adjusting your severity or hazard category filters.</p>
        </div>
      )}
    </div>
  );
};
