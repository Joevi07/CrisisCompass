import React, { useEffect, useState, useRef } from 'react';
import { Alert } from '../types';
import { AlertCard } from '../components/AlertCard';
import { TRANSLATIONS, SUPPORTED_LANGUAGES, LanguageOption } from '../translations';
import { 
  Search, Filter, ShieldCheck, AlertTriangle, 
  Volume2, VolumeX, Copy, Check, Radio, ExternalLink,
  Globe, Loader2, Sparkles, AlertCircle, Shield
} from 'lucide-react';

import { fetchWithOfflineFallback } from '../utils/offlineCache';
import { apiUrl } from '../utils/api';

interface AlertsPageProps {
  currentLang: string;
}

// Locale mapping for Web Speech API
const SPEECH_LOCALES: Record<string, string[]> = {
  'en': ['en-IN', 'en-US', 'en-GB'],
  'hi': ['hi-IN', 'hi'],
  'ta': ['ta-IN', 'ta'],
  'te': ['te-IN', 'te'],
  'ml': ['ml-IN', 'ml'],
  'kn': ['kn-IN', 'kn'],
  'bn': ['bn-IN', 'bn-BD', 'bn'],
  'mr': ['mr-IN', 'mr'],
  'ar': ['ar-SA', 'ar-AE', 'ar-EG', 'ar'],
  'zh-CN': ['zh-CN', 'zh', 'cmn-Hans-CN'],
  'ja': ['ja-JP', 'ja'],
  'de': ['de-DE', 'de-AT', 'de'],
  'fr': ['fr-FR', 'fr'],
  'es': ['es-ES', 'es-MX', 'es']
};

export const AlertsPage: React.FC<AlertsPageProps> = ({ currentLang }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Target translation language independent from general app language
  const [targetLang, setTargetLang] = useState<string>(() => {
    return localStorage.getItem('crisiscompass_alert_trans_lang') || currentLang || 'en';
  });

  // Selected Alert for the "Translate Alert" card
  const [selectedAlertForTrans, setSelectedAlertForTrans] = useState<Alert | null>(null);

  // Dynamic translated data for the selected alert in targetLang
  const [translatedData, setTranslatedData] = useState<{
    title: string;
    description: string;
    action: string;
    isVerified: boolean;
  } | null>(null);

  const [transLoading, setTransLoading] = useState(false);
  const [transError, setTransError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  // Request counter ref to prevent race conditions on rapid language switching
  const translationReqIdRef = useRef<number>(0);

  // Speech utterance chunk queue ref
  const speechQueueRef = useRef<SpeechSynthesisUtterance[]>([]);
  const isCancelledRef = useRef<boolean>(false);

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const currentTargetLangObj = SUPPORTED_LANGUAGES.find(l => l.code === targetLang) || SUPPORTED_LANGUAGES[0];

  // Initialize SpeechSynthesis voices
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const handleVoicesChanged = () => {
      setVoicesLoaded(true);
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      setVoicesLoaded(true);
    }

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    };
  }, []);

  // Fetch alerts from backend
  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const payload = await fetchWithOfflineFallback<{ alerts: Alert[] }>(
        `/api/alerts?lang=${targetLang}`,
        `alerts_page_${targetLang}`
      );
      const alertList: Alert[] = payload.data.alerts || [];
      setAlerts(alertList);
      setFilteredAlerts(alertList);
      if (alertList.length > 0) {
        setSelectedAlertForTrans((prev) => {
          if (!prev) return alertList[0];
          const matched = alertList.find(a => a.id === prev.id);
          return matched || alertList[0];
        });
      }
    } catch (e) {
      console.error('Error fetching alerts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(() => {
      if (navigator.onLine) fetchAlerts();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filter alerts by category and search string
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

  // Synchronize translation for selected alert whenever selectedAlert or targetLang changes
  useEffect(() => {
    // Stop any ongoing speech immediately when alert or target language changes
    stopSpeech();

    if (!selectedAlertForTrans) {
      setTranslatedData(null);
      return;
    }

    const currentReqId = ++translationReqIdRef.current;

    // If target language is English, use original English content directly
    if (targetLang === 'en') {
      setTranslatedData({
        title: selectedAlertForTrans.title,
        description: selectedAlertForTrans.description,
        action: selectedAlertForTrans.recommended_action || '',
        isVerified: true
      });
      setTransLoading(false);
      setTransError(null);
      return;
    }

    // Otherwise, fetch translation for targetLang from backend
    setTransLoading(true);
    setTransError(null);

    const fetchTranslation = async () => {
      try {
        // Query backend alert endpoint with specific language
        const response = await fetch(apiUrl(`/api/alerts/${selectedAlertForTrans.id}?lang=${targetLang}`));
        if (!response.ok) {
          throw new Error(`Failed to load translation for ${currentTargetLangObj.name}`);
        }
        const data: Alert = await response.json();

        // Check for stale response
        if (currentReqId !== translationReqIdRef.current) return;

        const hasTranslatedTitle = Boolean(data.translated_title && data.translated_title !== data.title);
        const hasTranslatedDesc = Boolean(data.translated_description && data.translated_description !== data.description);
        const isVerified = hasTranslatedTitle || hasTranslatedDesc;

        setTranslatedData({
          title: data.translated_title || data.title,
          description: data.translated_description || data.description,
          action: data.translated_action || data.recommended_action || '',
          isVerified
        });
      } catch (err) {
        if (currentReqId !== translationReqIdRef.current) return;
        console.error('Translation fetch failed:', err);
        setTransError(err instanceof Error ? err.message : 'Translation currently unavailable.');
        // Fallback to original text safely without masking as verified
        setTranslatedData({
          title: selectedAlertForTrans.title,
          description: selectedAlertForTrans.description,
          action: selectedAlertForTrans.recommended_action || '',
          isVerified: false
        });
      } finally {
        if (currentReqId === translationReqIdRef.current) {
          setTransLoading(false);
        }
      }
    };

    fetchTranslation();
  }, [selectedAlertForTrans?.id, targetLang]);

  // Handle changing target language dropdown
  const handleTargetLangChange = (newLang: string) => {
    setTargetLang(newLang);
    localStorage.setItem('crisiscompass_alert_trans_lang', newLang);
  };

  // Copy full readable alert translation to clipboard
  const handleCopyText = () => {
    if (!selectedAlertForTrans || !translatedData) return;

    const copyText = [
      `[${selectedAlertForTrans.severity.toUpperCase()} ALERT: ${selectedAlertForTrans.affected_location}]`,
      `TITLE: ${translatedData.title}`,
      `DETAILS: ${translatedData.description}`,
      translatedData.action ? `SAFETY ACTION: ${translatedData.action}` : '',
      `ISSUING AUTHORITY: ${selectedAlertForTrans.issuing_authority}`,
      `SOURCE: CrisisCompass India Emergency Platform`
    ].filter(Boolean).join('\n\n');

    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Stop speech playback immediately
  const stopSpeech = () => {
    isCancelledRef.current = true;
    speechQueueRef.current = [];
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Find the most appropriate speech synthesis voice for a language
  const selectVoiceForLanguage = (langCode: string): SpeechSynthesisVoice | null => {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const preferredLocales = SPEECH_LOCALES[langCode] || [langCode];

    // 1. Check exact locale match (e.g., 'hi-IN')
    for (const loc of preferredLocales) {
      const match = voices.find(v => v.lang.toLowerCase() === loc.toLowerCase());
      if (match) return match;
    }

    // 2. Check prefix match (e.g., 'hi' in 'hi_IN')
    const primaryCode = langCode.split('-')[0].toLowerCase();
    const prefixMatch = voices.find(v => v.lang.toLowerCase().startsWith(primaryCode));
    if (prefixMatch) return prefixMatch;

    return null;
  };

  // Split text into coherent chunks for browser TTS without truncation
  const splitTextIntoChunks = (text: string, maxLen = 180): string[] => {
    if (text.length <= maxLen) return [text];
    
    // Split by sentence delimiters
    const rawSentences = text.split(/(?<=[.?!।۔\n])\s+/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of rawSentences) {
      if ((currentChunk + ' ' + sentence).trim().length <= maxLen) {
        currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
      } else {
        if (currentChunk) chunks.push(currentChunk.trim());
        if (sentence.length > maxLen) {
          // Subdivide long sentence by comma / phrase
          const clauses = sentence.split(/([,;:\-،、]+)/);
          let subChunk = '';
          for (const clause of clauses) {
            if ((subChunk + clause).length <= maxLen) {
              subChunk += clause;
            } else {
              if (subChunk) chunks.push(subChunk.trim());
              subChunk = clause;
            }
          }
          if (subChunk) chunks.push(subChunk.trim());
          currentChunk = '';
        } else {
          currentChunk = sentence;
        }
      }
    }
    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks.filter(c => c.length > 0);
  };

  // Full Text-to-Speech playback of exact visible translated content
  const handleSpeakText = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported by your browser.');
      return;
    }

    // If currently speaking, stop immediately
    if (isSpeaking) {
      stopSpeech();
      return;
    }

    if (!translatedData || transLoading) return;

    // Build the full speech script from visible translated fields
    const speechComponents: string[] = [];
    if (translatedData.title) speechComponents.push(translatedData.title.trim());
    if (translatedData.description) speechComponents.push(translatedData.description.trim());
    if (translatedData.action) speechComponents.push(translatedData.action.trim());

    const fullSpeechText = speechComponents.join('. ');
    if (!fullSpeechText.trim()) return;

    // Reset cancellation state and clear queue
    window.speechSynthesis.cancel();
    isCancelledRef.current = false;

    const chunks = splitTextIntoChunks(fullSpeechText);
    const chosenVoice = selectVoiceForLanguage(targetLang);
    const targetLocale = (SPEECH_LOCALES[targetLang] && SPEECH_LOCALES[targetLang][0]) || targetLang;

    const utterances: SpeechSynthesisUtterance[] = chunks.map((chunk, index) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = targetLocale;
      if (chosenVoice) utterance.voice = chosenVoice;
      utterance.rate = 0.95; // Clear natural emergency pacing
      utterance.pitch = 1.0;

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error on chunk:', e);
        if (index === chunks.length - 1) {
          setIsSpeaking(false);
        }
      };

      utterance.onend = () => {
        if (isCancelledRef.current) return;
        // Check if this was the final chunk
        if (index === chunks.length - 1) {
          setIsSpeaking(false);
        }
      };

      return utterance;
    });

    speechQueueRef.current = utterances;
    setIsSpeaking(true);

    // Speak all utterances sequentially
    utterances.forEach(u => window.speechSynthesis.speak(u));
  };

  // Clean up speech on component unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Page Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#DF4444] text-xs font-bold mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>CrisisCompass India Alert Registry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F4C5C]">
            {t.live_alerts_title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time verified extreme weather bulletins and flood advisories across Indian states and union territories.
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
              placeholder="Search city, district, hazard type, or issuing authority..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
            />
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-400 text-sm flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#0F4C5C]" />
              <span>Loading verified crisis bulletins...</span>
            </div>
          ) : filteredAlerts.length > 0 ? (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <div 
                  key={alert.id}
                  onClick={() => setSelectedAlertForTrans(alert)}
                  className={`cursor-pointer transition-all rounded-3xl ${
                    selectedAlertForTrans?.id === alert.id 
                      ? 'ring-2 ring-[#0F4C5C] shadow-md transform scale-[1.01]' 
                      : 'hover:scale-[1.005]'
                  }`}
                >
                  <AlertCard alert={alert} currentLang={currentLang} />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
              <p className="text-slate-600 font-bold mb-1">No active advisories found</p>
              <p className="text-xs text-slate-400">All Indian sectors are currently reporting standard parameters.</p>
            </div>
          )}
        </div>

        {/* Right 1 Col: "Translate Alert" Card matching Reference Screen */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm sticky top-28 space-y-4">
            
            {/* Header: Title + Target Language Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Globe className="w-4.5 h-4.5 text-[#38BDAC]" />
                  <span>{t.translate_alert_title || 'Translate Alert'}</span>
                </h3>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  translatedData?.isVerified 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  <ShieldCheck className="w-3 h-3" />
                  <span>{translatedData?.isVerified ? 'Official Translation' : 'Machine Translation'}</span>
                </span>
              </div>

              {/* Target Language Selector ("Translate to") */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 flex items-center justify-between gap-2">
                <label htmlFor="translate-to-select" className="text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
                  <span className="text-[#0F4C5C]">Translate to:</span>
                </label>

                <select
                  id="translate-to-select"
                  value={targetLang}
                  onChange={(e) => handleTargetLangChange(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] cursor-pointer shadow-xs"
                >
                  {SUPPORTED_LANGUAGES.map((lang: LanguageOption) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.nativeName} ({lang.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedAlertForTrans ? (
              <div className="space-y-4 text-xs">
                
                {/* 1. Original Message (English) Box */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-slate-500 font-bold">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#FB9038]" />
                      <span>Original Message (English)</span>
                    </span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                      EN-IN
                    </span>
                  </div>

                  <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                    {selectedAlertForTrans.title}
                  </h4>

                  <p className="text-slate-600 leading-relaxed font-normal">
                    {selectedAlertForTrans.description}
                  </p>

                  {selectedAlertForTrans.recommended_action && (
                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                        Safety Guidance:
                      </span>
                      <p className="text-slate-700 font-medium">
                        {selectedAlertForTrans.recommended_action}
                      </p>
                    </div>
                  )}

                  <div className="pt-1 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Authority: {selectedAlertForTrans.issuing_authority}</span>
                    <span>Zone: {selectedAlertForTrans.affected_location.split('(')[0].trim()}</span>
                  </div>
                </div>

                {/* 2. Translated Message Box (Dynamically shows selected language) */}
                <div className="p-4 rounded-2xl bg-[#0F4C5C]/5 border border-[#0F4C5C]/20 space-y-2 relative">
                  {transLoading && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-xs rounded-2xl flex items-center justify-center z-10">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#0F4C5C]">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Translating into {currentTargetLangObj.name}...</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[#0F4C5C] font-bold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#38BDAC]" />
                      <span>Translated Message ({currentTargetLangObj.name})</span>
                    </span>

                    <span className="text-[10px] font-mono px-2 py-0.5 bg-[#0F4C5C] text-white rounded-md">
                      {targetLang.toUpperCase()}
                    </span>
                  </div>

                  {transError ? (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{transError} Displaying fallback alert details.</span>
                    </div>
                  ) : null}

                  <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                    {translatedData?.title || selectedAlertForTrans.title}
                  </h4>

                  <p className="text-slate-700 leading-relaxed font-medium">
                    {translatedData?.description || selectedAlertForTrans.description}
                  </p>

                  {(translatedData?.action || selectedAlertForTrans.recommended_action) && (
                    <div className="pt-2 border-t border-[#0F4C5C]/15">
                      <span className="text-[10px] font-bold text-[#0F4C5C] uppercase tracking-wider block mb-0.5">
                        {currentTargetLangObj.name} Safety Instructions:
                      </span>
                      <p className="text-slate-800 font-semibold">
                        {translatedData?.action || selectedAlertForTrans.recommended_action}
                      </p>
                    </div>
                  )}

                  <div className="pt-1 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Language: {currentTargetLangObj.nativeName} ({currentTargetLangObj.code})</span>
                    <span>Status: {translatedData?.isVerified ? 'Official IMD / NDMA' : 'Automated'}</span>
                  </div>
                </div>

                {/* 3. Action Buttons: Listen & Copy */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  
                  {/* Listen / Stop Button */}
                  <button
                    onClick={handleSpeakText}
                    disabled={transLoading || !translatedData}
                    className={`p-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed ${
                      isSpeaking 
                        ? 'bg-[#DF4444] hover:bg-red-700 text-white ring-2 ring-red-300' 
                        : 'bg-[#0F4C5C] hover:bg-[#0c3c49] text-white'
                    }`}
                    title={isSpeaking ? 'Stop speaking immediately' : `Listen to complete alert in ${currentTargetLangObj.name}`}
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX className="w-4 h-4 animate-pulse" />
                        <span>Stop Voice</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4" />
                        <span>{t.listen_btn || 'Listen'}</span>
                      </>
                    )}
                  </button>

                  {/* Copy Button */}
                  <button
                    onClick={handleCopyText}
                    disabled={transLoading || !translatedData}
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                    title="Copy readable translated alert and safety instructions"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-400" />
                        <span>{t.copy_btn || 'Copy'}</span>
                      </>
                    )}
                  </button>

                </div>

                {/* Subtext info regarding speech locale and voice */}
                <div className="text-[10px] text-slate-400 text-center pt-1 font-medium">
                  {isSpeaking 
                    ? `Speaking full alert in ${currentTargetLangObj.name}... Click "Stop Voice" to interrupt.`
                    : `Voice reads title, full description & safety guidelines in ${currentTargetLangObj.nativeName}.`
                  }
                </div>

              </div>
            ) : (
              <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Globe className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-bold">No Alert Selected</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Click any advisory card on the left to inspect multi-lingual translations and activate text-to-speech.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
