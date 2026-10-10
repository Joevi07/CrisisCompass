import React, { useEffect, useState } from 'react';
import { Alert } from '../types';
import { AlertCard } from '../components/AlertCard';
import { TRANSLATIONS } from '../translations';
import { 
  Search, Filter, ShieldCheck, AlertTriangle, 
  Volume2, VolumeX, Copy, Check, Radio, ExternalLink 
} from 'lucide-react';

interface AlertsPageProps {
  currentLang: string;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ currentLang }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Translate Alert Card state (Reference screen "Translate Alert")
  const [selectedAlertForTrans, setSelectedAlertForTrans] = useState<Alert | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/alerts?lang=${currentLang}`);
      if (res.ok) {
        const data = await res.json();
        const alertList: Alert[] = data.alerts || [];
        setAlerts(alertList);
        setFilteredAlerts(alertList);
        if (alertList.length > 0 && !selectedAlertForTrans) {
          setSelectedAlertForTrans(alertList[0]);
        }
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

    if (activeCategory === 'weather') {
      result = result.filter(a => a.hazard_type === 'storm' || a.hazard_type === 'heavy_rain');
    } else if (activeCategory === 'flood') {
      result = result.filter(a => a.hazard_type === 'flood');
    } else if (activeCategory === 'cyclone') {
      result = result.filter(a => a.hazard_type === 'cyclone');
    } else if (activeCategory === 'road') {
      result = result.filter(a => a.hazard_type === 'restricted');
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
  }, [activeCategory, search, alerts]);

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLang === 'ta' ? 'ta-IN' : currentLang === 'hi' ? 'hi-IN' : 'en-US';
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Page Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#DF4444] text-xs font-bold mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            Verified Civil Defense Broadcasts
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F4C5C]">
            {t.live_alerts_title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time storm bulletins, flood advisories and official evacuation orders.
          </p>
        </div>

        {/* Filter Pills matching Reference ("All", "Weather", "Flood", "Cyclone", "Road Closure") */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: t.filter_all },
            { id: 'weather', label: t.filter_weather },
            { id: 'flood', label: t.filter_flood },
            { id: 'cyclone', label: t.filter_cyclone },
            { id: 'road', label: t.filter_road },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-[#0F4C5C] text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Alerts Feed */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search keyword, district or authority..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
            />
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-400 text-sm">Loading verified crisis bulletins...</div>
          ) : filteredAlerts.length > 0 ? (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <div 
                  key={alert.id}
                  onClick={() => setSelectedAlertForTrans(alert)}
                  className="cursor-pointer transition-transform hover:scale-[1.01]"
                >
                  <AlertCard alert={alert} currentLang={currentLang} />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
              <p className="text-slate-600 font-bold mb-1">No active advisories found</p>
              <p className="text-xs text-slate-400">All districts are reporting normal conditions.</p>
            </div>
          )}
        </div>

        {/* Right 1 Col: "Translate Alert" Card matching Reference Screen */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm sticky top-28">
            <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center justify-between">
              <span>{t.translate_alert_title}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Official Multi-Lingual
              </span>
            </h3>

            {selectedAlertForTrans ? (
              <div className="space-y-4 text-xs">
                {/* Original Message (English) Box */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 font-bold mb-1.5">
                    <AlertTriangle className="w-4 h-4 text-[#FB9038]" />
                    <span>{t.original_msg}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">{selectedAlertForTrans.title}</h4>
                  <p className="text-slate-600 leading-relaxed">{selectedAlertForTrans.description}</p>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Source: {selectedAlertForTrans.issuing_authority}
                  </p>
                </div>

                {/* Translated Message Box */}
                <div className="p-4 rounded-2xl bg-[#0F4C5C]/5 border border-[#0F4C5C]/15">
                  <div className="flex items-center justify-between text-[#0F4C5C] font-bold mb-1.5">
                    <span>{t.translated_msg} ({currentLang.toUpperCase()})</span>
                    <span className="text-[10px] bg-[#0F4C5C] text-white px-2 py-0.5 rounded-full">
                      Verified Translation
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">
                    {selectedAlertForTrans.translated_title || selectedAlertForTrans.title}
                  </h4>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {selectedAlertForTrans.translated_description || selectedAlertForTrans.description}
                  </p>
                </div>

                {/* Action Buttons: Listen & Copy matching Reference Screen */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => handleSpeakText(selectedAlertForTrans.translated_description || selectedAlertForTrans.description)}
                    className="p-2.5 rounded-xl bg-[#0F4C5C] hover:bg-[#0c3c49] text-white font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    {isSpeaking ? <VolumeX className="w-4 h-4 text-[#FB9038]" /> : <Volume2 className="w-4 h-4" />}
                    <span>{isSpeaking ? 'Stop' : t.listen_btn}</span>
                  </button>

                  <button
                    onClick={() => handleCopyText(`${selectedAlertForTrans.title}\n${selectedAlertForTrans.description}`)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    <span>{copied ? 'Copied!' : t.copy_btn}</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">
                Select an alert card from the list to view translations and audio synthesis.
              </p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
