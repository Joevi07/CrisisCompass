import React, { useState } from 'react';
import { ChatResponse } from '../types';
import { Bot, Send, ShieldCheck, AlertCircle, Sparkles, ExternalLink, HelpCircle, Mic, Volume2, VolumeX } from 'lucide-react';
import { TRANSLATIONS } from '../translations';

interface AssistantPageProps {
  currentLang: string;
}

interface MessageItem {
  sender: 'user' | 'assistant';
  text: string;
  responseMeta?: ChatResponse;
}

export const AssistantPage: React.FC<AssistantPageProps> = ({ currentLang }) => {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      sender: 'assistant',
      text: "Hello! I am the TravelTech Emergency Assistant. I provide real-time verified guidance on active flood and cyclone alerts, safe evacuation shelters, emergency hotlines, and safety protocols.\n\nHow can I support your safety today?",
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const sampleQuestions = [
    "What should I do during a flash flood?",
    "Are there any active alerts near my destination?",
    "How do I find an emergency shelter?",
    "What are the emergency contact numbers?",
    "What should I do if my hotel area is flooded?",
  ];

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = currentLang === 'ta' ? 'ta-IN' : currentLang === 'hi' ? 'hi-IN' : currentLang === 'fr' ? 'fr-FR' : currentLang === 'es' ? 'es-ES' : 'en-US';
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  const handleSpeakText = (text: string, idx: number) => {
    if (!('speechSynthesis' in window)) return;
    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLang === 'ta' ? 'ta-IN' : currentLang === 'hi' ? 'hi-IN' : currentLang === 'fr' ? 'fr-FR' : currentLang === 'es' ? 'es-ES' : 'en-US';
    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);
    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim()) return;

    const userMsg: MessageItem = { sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          language: currentLang,
        }),
      });

      if (res.ok) {
        const data: ChatResponse = await res.json();
        setMessages(prev => [
          ...prev,
          {
            sender: 'assistant',
            text: data.reply,
            responseMeta: data,
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            sender: 'assistant',
            text: "Notice: Unable to reach the safety assistant service right now. Please dial local emergency numbers (112 or 911) if you need immediate rescue.",
          }
        ]);
      }
    } catch (e) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: "Connection error: Failed to connect to server. Please check your network or call local emergency services.",
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-600" />
            TravelTech Emergency AI Assistant
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Zero-hallucination guidance with voice input/output powered by verified disaster registries and local emergency protocols.
          </p>
        </div>
        <div className="hidden sm:block text-right">
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Safety Mode
          </span>
        </div>
      </div>

      {/* Suggested Questions */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" /> Suggested:
        </span>
        {sampleQuestions.map((sq, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(sq)}
            className="text-xs bg-white hover:bg-slate-100 text-slate-700 font-medium px-3 py-1.5 rounded-full border border-slate-200 transition cursor-pointer shadow-2xs"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Chat Window */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex min-h-[min(68svh,520px)] sm:h-[520px] flex-col">
        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed relative group ${
                  m.sender === 'user'
                    ? 'bg-orange-600 text-white shadow-sm rounded-br-none'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-none shadow-2xs'
                }`}
              >
                <div className="whitespace-pre-line">{m.text}</div>

                {/* Text to Speech Button for Assistant Messages */}
                {m.sender === 'assistant' && (
                  <button
                    onClick={() => handleSpeakText(m.text, idx)}
                    title={speakingIdx === idx ? "Stop Voice" : "Listen to Response"}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 cursor-pointer bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200"
                  >
                    {speakingIdx === idx ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                        Stop Voice
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        Listen
                      </>
                    )}
                  </button>
                )}

                {/* Citations & Metadata if provided */}
                {m.responseMeta && (
                  <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500 space-y-2">
                    {m.responseMeta.citations.length > 0 && (
                      <div>
                        <span className="font-semibold text-slate-700">Verified Citations:</span>
                        <ul className="mt-1 space-y-1">
                          {m.responseMeta.citations.map((c, cIdx) => (
                            <li key={cIdx} className="flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <a
                                href={c.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-0.5"
                              >
                                {c.organization}
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="bg-white p-2 rounded border border-slate-200 text-[11px] text-slate-500 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{m.responseMeta.disclaimer}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-500 flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin text-orange-500" />
                Retrieving verified emergency guidance...
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2 items-center"
          >
            {/* Voice Input Button */}
            <button
              type="button"
              onClick={handleVoiceInput}
              title="Voice Input (Speech-to-Text)"
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                isListening
                  ? 'bg-red-600 text-white border-red-600 animate-pulse'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              <Mic className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening... Speak now..." : "Ask about flash floods, shelter routes, or emergency contacts..."}
              className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl text-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
