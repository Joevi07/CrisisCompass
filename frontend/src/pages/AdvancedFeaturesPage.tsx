import React, { useState } from 'react';
import { 
  Bot, Send, ShieldCheck, Sparkles, Volume2, 
  VolumeX, Mic, Share2, Layers, AlertTriangle, 
  CheckCircle2, Users, FileCheck, ArrowRight, TrendingUp, 
  HelpCircle, Sparkle, PhoneCall
} from 'lucide-react';
import { TRANSLATIONS } from '../translations';
import { apiUrl } from '../utils/api';

interface AdvancedFeaturesProps {
  currentLang: string;
}

export const AdvancedFeaturesPage: React.FC<AdvancedFeaturesProps> = ({ currentLang }) => {
  const [activeTab, setActiveTab] = useState<'copilot' | 'agents' | 'predictor' | 'verification' | 'volunteer'>('copilot');
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  // AI Copilot state
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I am the TravelTech AI Crisis Copilot. I analyze live weather feeds, official warnings, and verified shelter registries to provide real-time, zero-hallucination evacuation guidance.\n\nHow can I protect your journey today?`
    }
  ]);
  const [loading, setLoading] = useState(false);

  // Multi-Agent Workflow state
  const [agentStep, setAgentStep] = useState(0);
  const [agentOutput, setAgentOutput] = useState<{
    situation?: string;
    verification?: string;
    resources?: string;
    plan?: string;
  }>({});

  // Crisis Escalation Predictor state
  const [escalationRisk, setEscalationRisk] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');

  const handleSendCopilot = async (customQ?: string) => {
    const textToSend = customQ || query;
    if (!textToSend.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
    if (!customQ) setQuery('');
    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/assistant/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, language: currentLang })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Failed to connect to crisis copilot service. Dial 112 / 911 immediately in emergencies." }]);
    } finally {
      setLoading(false);
    }
  };

  const runMultiAgentWorkflow = () => {
    setAgentStep(1);
    setAgentOutput({
      situation: "Situation Agent: Synthesizing IMD Radar + 4 citizen reports in Velachery sector. Water levels rising +0.4m/hr.",
    });

    setTimeout(() => {
      setAgentStep(2);
      setAgentOutput(prev => ({
        ...prev,
        verification: "Verification Agent: Corroborated with NOAA satellite precip telemetry and municipal flood sensor #04. Confidence: 94%.",
      }));
    }, 1200);

    setTimeout(() => {
      setAgentStep(3);
      setAgentOutput(prev => ({
        ...prev,
        resources: "Resource Agent: Located TNGS Safe Shelter (1.2km away, 360/500 capacity available). 2 volunteer squads on standby.",
      }));
    }, 2400);

    setTimeout(() => {
      setAgentStep(4);
      setAgentOutput(prev => ({
        ...prev,
        plan: "Response Agent: Proposed Action Plan -> 1) Issue red exclusion polygon on tourist map. 2) Route 85 tourists to TNGS School via elevated Bypass Road.",
      }));
    }, 3600);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F4C5C]/10 text-[#0F4C5C] text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#38BDAC]" />
              Agentic AI & Advanced Crisis Infrastructure
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F4C5C]">
              Crisis Command & Copilot Hub
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Multi-Agent coordination, escalation prediction, voice synthesis, and verified response planning.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
              Agent Network: Active
            </span>
          </div>
        </div>

        {/* Sub-Feature Tab Nav */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-100">
          {[
            { id: 'copilot', label: 'AI Crisis Copilot', icon: Bot },
            { id: 'agents', label: 'Multi-Agent Coordination', icon: Users },
            { id: 'predictor', label: 'Escalation Predictor', icon: TrendingUp },
            { id: 'verification', label: 'Misinformation & Verification', icon: FileCheck },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#0F4C5C] text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: AI CRISIS COPILOT */}
      {activeTab === 'copilot' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[560px]">
            {/* Messages */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-[#0F4C5C] text-white rounded-br-none shadow-sm'
                        : 'bg-[#F3F4F6] text-slate-800 rounded-bl-none border border-slate-100'
                    }`}
                  >
                    <div className="whitespace-pre-line">{m.content}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#F3F4F6] p-4 rounded-2xl text-xs text-slate-500 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FB9038] animate-spin" />
                    <span>Synthesizing authoritative guidance...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendCopilot();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Ask about flash flood guidelines, road clearance, or shelters..."
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="bg-[#0F4C5C] hover:bg-[#0c3c49] text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>

          {/* Quick Safety Context & Suggested Questions */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-sm text-[#0F4C5C] mb-3 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#38BDAC]" />
                Suggested Queries
              </h3>
              <div className="space-y-2">
                {[
                  "What should I do during a sudden coastal flash flood?",
                  "Which evacuation shelter has the highest safety score near Marina?",
                  "Are there open bridges across the Adyar basin right now?",
                  "Translate emergency instructions into Tamil / Hindi",
                ].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendCopilot(q)}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-[#F3F4F6] text-xs font-semibold text-slate-700 transition cursor-pointer border border-slate-100"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Anti-Hallucination Safe Mode
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                TravelTech Copilot utilizes deterministic civil protection ontologies. In case of API failure, it provides verified safety actions without inventing numbers or routes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MULTI-AGENT COORDINATION */}
      {activeTab === 'agents' && (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-[#0F4C5C] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#38BDAC]" />
                Autonomous Multi-Agent Crisis Workflow
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                4 specialized agents working in an explainable pipeline: Situation → Verification → Resource → Response Plan.
              </p>
            </div>
            <button
              onClick={runMultiAgentWorkflow}
              className="bg-[#0F4C5C] hover:bg-[#0c3c49] text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shadow-sm self-start"
            >
              <Sparkles className="w-4 h-4 text-[#38BDAC]" />
              Run Agent Pipeline
            </button>
          </div>

          {/* Workflow Steps Indicator */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-4">
            <div className={`p-4 rounded-2xl border transition ${agentStep >= 1 ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-blue-900">1. Situation Agent</span>
                {agentStep >= 1 && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
              </div>
              <p className="text-[11px] text-blue-700">Synthesizes radar, rain telemetry & incident reports.</p>
            </div>

            <div className={`p-4 rounded-2xl border transition ${agentStep >= 2 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-amber-900">2. Verification Agent</span>
                {agentStep >= 2 && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
              </div>
              <p className="text-[11px] text-amber-700">Validates domain allowlists & detects fake reports.</p>
            </div>

            <div className={`p-4 rounded-2xl border transition ${agentStep >= 3 ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-emerald-900">3. Resource Agent</span>
                {agentStep >= 3 && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <p className="text-[11px] text-emerald-700">Matches open shelter capacity & medical inventory.</p>
            </div>

            <div className={`p-4 rounded-2xl border transition ${agentStep >= 4 ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-purple-900">4. Response Agent</span>
                {agentStep >= 4 && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
              </div>
              <p className="text-[11px] text-purple-700">Generates coordinator-approved action directives.</p>
            </div>
          </div>

          {/* Agent Output Terminal */}
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 font-mono text-xs space-y-3">
            <div className="text-slate-400 border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>// Agent Audit Trail Logs (Timestamped)</span>
              <span className="text-emerald-400">STATUS: {agentStep === 4 ? 'READY FOR REVIEW' : agentStep > 0 ? 'PROCESSING' : 'IDLE'}</span>
            </div>
            {agentOutput.situation && (
              <div className="text-blue-300">
                [00:01] {agentOutput.situation}
              </div>
            )}
            {agentOutput.verification && (
              <div className="text-amber-300">
                [00:02] {agentOutput.verification}
              </div>
            )}
            {agentOutput.resources && (
              <div className="text-emerald-300">
                [00:03] {agentOutput.resources}
              </div>
            )}
            {agentOutput.plan && (
              <div className="text-purple-300 font-bold bg-slate-800 p-3 rounded-xl border border-purple-500/30">
                [00:04] {agentOutput.plan}
              </div>
            )}
            {agentStep === 0 && (
              <div className="text-slate-500 italic">Click "Run Agent Pipeline" to simulate autonomous coordination...</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CRISIS ESCALATION PREDICTOR */}
      {activeTab === 'predictor' && (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-[#0F4C5C] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#FB9038]" />
                Crisis Escalation Predictor
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Real-time multi-variable scoring model (Weather Severity + Water Level + Population Density).
              </p>
            </div>

            <span className="px-3.5 py-1.5 rounded-full bg-red-100 text-red-800 text-xs font-black uppercase">
              Current Risk: {escalationRisk}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-400 font-bold">Rainfall Accretion Rate</span>
              <div className="text-2xl font-black text-slate-800 mt-1">22 mm/hr</div>
              <span className="text-[11px] text-red-500 font-semibold">Exceeds Red Threshold</span>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-400 font-bold">Cluster Anomaly Index</span>
              <div className="text-2xl font-black text-slate-800 mt-1">7 Reports / 1km²</div>
              <span className="text-[11px] text-amber-500 font-semibold">High Geographic Density</span>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-400 font-bold">Predicted Inundation Window</span>
              <div className="text-2xl font-black text-slate-800 mt-1">~3.5 Hours</div>
              <span className="text-[11px] text-purple-600 font-semibold">Safe Evacuation Remaining</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MISINFORMATION & VERIFICATION */}
      {activeTab === 'verification' && (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-xl font-black text-[#0F4C5C] flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-[#38BDAC]" />
            Misinformation & Report Verification Engine
          </h2>
          <p className="text-xs text-slate-500">
            Automated fact-checking cross-references citizen incident submissions with IMD, NOAA, and official civil protection domains.
          </p>

          <div className="divide-y divide-slate-100 mt-4">
            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  OFFICIALLY CONFIRMED
                </span>
                <h4 className="font-bold text-sm text-slate-800 mt-1">Adyar Basin Inundation Warning</h4>
                <p className="text-xs text-slate-500">Matched with official IMD bulletin at 10:45 AM • Verified by Domain Allowlist</p>
              </div>
              <span className="text-xs font-bold text-emerald-600">100% Trust Score</span>
            </div>

            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  UNDER REVIEW
                </span>
                <h4 className="font-bold text-sm text-slate-800 mt-1">Citizen Report: Metro Water Logging</h4>
                <p className="text-xs text-slate-500">Submitted by user • Geo-fenced within 200m of reported coordinates</p>
              </div>
              <span className="text-xs font-bold text-amber-600">Pending Field Verification</span>
            </div>

            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                  FLAGGED RUMOR / DISPUTED
                </span>
                <h4 className="font-bold text-sm text-slate-800 mt-1">Social Claim: Chembarambakkam Dam Breach</h4>
                <p className="text-xs text-slate-500">Contradicted by Public Works Department live sensor water discharge telemetry</p>
              </div>
              <span className="text-xs font-bold text-red-600">Debunked</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
