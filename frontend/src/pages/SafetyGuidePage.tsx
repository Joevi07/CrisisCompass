import React, { useState } from 'react';
import { 
  BookOpen, AlertTriangle, ShieldCheck, PhoneCall, 
  FileText, CheckSquare, Heart, Compass, Volume2, 
  ChevronRight, ExternalLink, ShieldAlert
} from 'lucide-react';
import { TRANSLATIONS } from '../translations';

interface SafetyGuideProps {
  currentLang: string;
}

export const SafetyGuidePage: React.FC<SafetyGuideProps> = ({ currentLang }) => {
  const [tab, setTab] = useState<'extreme' | 'general' | 'checklist'>('extreme');
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const checklistItems = [
    { text: "Preserve drinking water (3 liters/day per person for 72 hours)", done: true },
    { text: "Waterproof physical copies of passport, visa, travel insurance", done: true },
    { text: "Keep power banks, rechargeable torches and whistle accessible", done: false },
    { text: "Download offline maps of destination sector and emergency shelters", done: true },
    { text: "Pre-program universal emergency numbers (112, 911, 108) on speed dial", done: false },
    { text: "Evacuate immediately if water level approaches door step; never wait for dark", done: false },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Top Banner matching Reference Design "Safety Guide: Be prepared. It makes a difference." */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl text-white">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F4C5C]/95 via-[#0F4C5C]/85 to-transparent" />

        <div className="relative p-8 sm:p-12 max-w-2xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold mb-3">
            <BookOpen className="w-3.5 h-3.5 text-[#38BDAC]" />
            <span>Tourist Disaster Preparedness</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2">
            {t.safety_guide_title}
          </h1>
          <p className="text-sm text-slate-100 font-medium italic">
            "{t.guide_motto}"
          </p>

          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setTab('extreme')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                tab === 'extreme' ? 'bg-white text-[#0F4C5C] shadow-sm' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {t.tab_extreme_weather}
            </button>
            <button
              onClick={() => setTab('general')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                tab === 'general' ? 'bg-white text-[#0F4C5C] shadow-sm' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {t.tab_general_tips}
            </button>
            <button
              onClick={() => setTab('checklist')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                tab === 'checklist' ? 'bg-white text-[#0F4C5C] shadow-sm' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Emergency Checklist
            </button>
          </div>
        </div>
      </div>

      {/* Guide Cards (Matching exact rows and layout in reference UI) */}
      {tab === 'extreme' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-xl font-black text-[#0F4C5C] mb-4">
            Critical Actions During Storms, Cyclones & Floods
          </h2>

          <div className="space-y-3">
            {/* 1. Stay Informed */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-[#0F4C5C] text-white flex items-center justify-center flex-shrink-0 font-bold">
                <BookOpen className="w-5 h-5 text-[#38BDAC]" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-slate-800">{t.guide_stay_informed}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{t.guide_stay_informed_sub}</p>
              </div>
            </div>

            {/* 2. Avoid High-Risk Areas */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-red-50/50 border border-red-100">
              <div className="w-10 h-10 rounded-2xl bg-[#DF4444] text-white flex items-center justify-center flex-shrink-0 font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-slate-800">{t.guide_avoid_risk}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{t.guide_avoid_risk_sub}</p>
              </div>
            </div>

            {/* 3. Keep Documents Safe */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-[#0F4C5C] text-white flex items-center justify-center flex-shrink-0 font-bold">
                <FileText className="w-5 h-5 text-[#FB9038]" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-slate-800">{t.guide_keep_docs}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{t.guide_keep_docs_sub}</p>
              </div>
            </div>

            {/* 4. Know Emergency Numbers */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-[#0F4C5C] text-white flex items-center justify-center flex-shrink-0 font-bold">
                <PhoneCall className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-slate-800">{t.guide_know_numbers}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{t.guide_know_numbers_sub}</p>
              </div>
            </div>

            {/* 5. Use Official Transport */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-[#0F4C5C] text-white flex items-center justify-center flex-shrink-0 font-bold">
                <ShieldCheck className="w-5 h-5 text-[#38BDAC]" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-slate-800">{t.guide_use_official}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{t.guide_use_official_sub}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checklist Tab */}
      {tab === 'checklist' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-xl font-black text-[#0F4C5C] mb-2">
            Emergency Preparedness Checklist for Foreign Visitors
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Review these readiness checkpoints before embarking on coastal or tropical tours during monsoons.
          </p>

          <div className="space-y-3">
            {checklistItems.map((item, idx) => (
              <label 
                key={idx}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition cursor-pointer border border-slate-100"
              >
                <input 
                  type="checkbox" 
                  defaultChecked={item.done} 
                  className="rounded text-[#0F4C5C] focus:ring-[#0F4C5C] w-4 h-4" 
                />
                <span className="text-xs sm:text-sm font-semibold text-slate-700">{item.text}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* General Tips */}
      {tab === 'general' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-xl font-black text-[#0F4C5C] mb-4">
            International Travel Health & Civil Defense Precautions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <h4 className="font-bold text-slate-800 text-sm mb-1">Waterborne Disease Caution</h4>
              <p className="text-slate-500 leading-relaxed">
                Drink bottled or boiled water only during urban water breaches. Avoid street ice and salads washed in tap water.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <h4 className="font-bold text-slate-800 text-sm mb-1">Consular Registration</h4>
              <p className="text-slate-500 leading-relaxed">
                Register your travel schedule with your nation's embassy (e.g., STEP for USA, MADAD for India).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
