import React, { useState, useEffect, useRef } from 'react';
import { Bot, Mic, MicOff, Send, Radio, CheckCircle2, ArrowLeft, Target, Award, Sparkles, BookOpen, Layers, Flame } from 'lucide-react';
import type { DealContext, RoleplaySession, CopilotCue } from '../types';

interface LiveCopilotProps {
  dealId: string;
  sessionId: string;
  dealContext?: DealContext | null;
  roleplaySession?: RoleplaySession | null;
  onBackToRoleplay?: () => void;
  onNewDeal?: () => void;
}

export const LiveCopilot: React.FC<LiveCopilotProps> = ({
  dealId,
  sessionId,
  dealContext: propDealContext,
  roleplaySession: propRoleplaySession,
  onBackToRoleplay,
  onNewDeal,
}) => {
  const [deal, setDeal] = useState<DealContext | null>(propDealContext || null);
  const [session, setSession] = useState<RoleplaySession | null>(propRoleplaySession || null);
  const [isLoading, setIsLoading] = useState(!propDealContext || !propRoleplaySession);

  // Live Call Audio & Transcript State
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<Array<{ speaker: 'rep' | 'prospect'; text: string; timestamp: number }>>([
    { speaker: 'prospect', text: "Thanks for reaching out. What specifically did you want to discuss today?", timestamp: Date.now() - 5000 }
  ]);
  const [repInput, setRepInput] = useState('');
  const [activeTab, setActiveTab] = useState<'copilot' | 'battlecards' | 'research'>('copilot');

  // Real-Time Tactical Cues
  const [cues, setCues] = useState<CopilotCue[]>([
    {
      id: 'cue-initial-1',
      timestamp: Date.now(),
      type: 'discovery_question',
      title: '🎯 OPENING DISCOVERY CUE',
      description: 'Start with pain discovery before introducing features.',
      suggestedAction: 'Explore their new sales rep onboarding process.',
      suggestedQuestion: '"How long does it currently take a new rep on your team to become productive?"',
    },
    {
      id: 'cue-initial-2',
      type: 'coaching_alert',
      timestamp: Date.now(),
      title: '⚠️ PRACTICE WARNING: Pitching Too Early',
      description: 'In your roleplay call, you pitched early. Resist pitching until you quantify pain!',
      suggestedAction: 'Ask 2 discovery questions before presenting solution details.',
      relatedPracticeWeakness: 'Pitched solution too early before quantifying pain in roleplay session.',
    }
  ]);

  // Post-Call Report State
  const [isCallEnded, setIsCallEnded] = useState(false);

  // Web Speech API STT Ref
  const recognitionRef = useRef<any>(null);
  const transcriptBottomRef = useRef<HTMLDivElement>(null);

  // Fetch Deal & Session if missing
  useEffect(() => {
    async function loadData() {
      try {
        if (!deal && dealId) {
          const dealRes = await fetch(`/api/deal/${dealId}`);
          if (dealRes.ok) {
            const d = await dealRes.json();
            setDeal(d);
          }
        }
        if (!session && dealId && sessionId) {
          const sessRes = await fetch(`/api/deal/${dealId}/session/${sessionId}`);
          if (sessRes.ok) {
            const s = await sessRes.json();
            setSession(s);
          }
        }
      } catch (err) {
        console.error('Error fetching copilot context:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [dealId, sessionId]);

  // Auto-scroll live transcript
  useEffect(() => {
    transcriptBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveTranscript]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript.trim()) {
            handleLiveSpeechChunk('rep', finalTranscript.trim());
          }
        };

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => {
          if (isListening) {
            try { recognition.start(); } catch {}
          }
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      recognitionRef.current?.stop();
    };
  }, [isListening]);

  // Toggle Live Call Microphone
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Speech recognition start failed:', err);
      }
    }
  };

  // Process live speech chunk & fetch contextual Co-Pilot cue
  const handleLiveSpeechChunk = async (speaker: 'rep' | 'prospect', text: string) => {
    if (!text.trim()) return;

    setLiveTranscript(prev => [...prev, { speaker, text, timestamp: Date.now() }]);

    // Fetch tactical cue from backend endpoint
    try {
      const res = await fetch('/api/copilot/cue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deal_id: dealId,
          session_id: sessionId,
          user_speech: speaker === 'rep' ? text : '',
          customer_speech: speaker === 'prospect' ? text : '',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.cues && data.cues.length > 0) {
          setCues(prev => [data.cues[0], ...prev.slice(0, 4)]);
        }
      }
    } catch (err) {
      console.warn('Copilot cue fetch error:', err);
    }
  };

  const handleSimulateProspectResponse = (text: string) => {
    handleLiveSpeechChunk('prospect', text);
  };

  const handleSendRepMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (repInput.trim()) {
      handleLiveSpeechChunk('rep', repInput.trim());
      setRepInput('');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-mono text-purple-300 animate-pulse">
          <Bot className="h-6 w-6 animate-spin" />
          <span>Loading Deal Context & Roleplay Insights for Co-Pilot...</span>
        </div>
      </div>
    );
  }

  const targetCompany = deal?.target_company || 'Target Enterprise';
  const targetPersona = deal?.target_persona?.title || 'VP of Sales';

  return (
    <div className="min-h-screen bg-[#050507] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Top Co-Pilot Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0c0d12]/95 px-4 py-3 shadow-xl backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          
          {/* Logo & Call Indicator */}
          <div className="flex items-center gap-3">
            {onBackToRoleplay && (
              <button
                onClick={onBackToRoleplay}
                className="rounded-full p-2 bg-[#151722] border border-white/[0.08] text-slate-300 hover:text-white hover:border-white/20 transition-all"
                title="Back to Roleplay Studio"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}

            <div className="flex items-center gap-2.5">
              <span className="text-xl font-bold tracking-tight text-white">CloseIQ</span>
              <span className="text-slate-600">/</span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold text-slate-200">
                    Live Co-Pilot
                  </h1>
                  <span className="flex items-center gap-1.5 rounded-full bg-blue-600/15 px-2.5 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                    LIVE CALL ASSIST
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Calling <strong className="text-slate-200">{targetCompany}</strong> • {targetPersona}
                </p>
              </div>
            </div>
          </div>

          {/* Deal & Practice Context Badges */}
          <div className="hidden lg:flex items-center gap-3 text-xs">
            <div className="rounded-full bg-[#11131a] border border-white/[0.08] px-3.5 py-1 text-slate-300 flex items-center gap-2 font-mono">
              <Award className="h-3.5 w-3.5 text-blue-400" />
              <span>Practice Score: <strong className="text-white">{session?.score || 78}/100</strong> ({session?.grade || 'B'})</span>
            </div>

            <div className="rounded-full bg-[#11131a] border border-white/[0.08] px-3.5 py-1 text-slate-300 flex items-center gap-2">
              <Target className="h-3.5 w-3.5 text-blue-400" />
              <span className="truncate max-w-xs">{deal?.call_objective || 'Book Product Evaluation'}</span>
            </div>
          </div>

          {/* End Call Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCallEnded(true)}
              className="flex items-center gap-1.5 rounded-full bg-rose-600 hover:bg-rose-500 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-rose-600/20 transition-all cursor-pointer"
            >
              <span>End Live Call</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Cockpit Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Live Tactical Cues & Battlecard Drawer (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Navigation Tabs */}
          <div className="flex items-center rounded-xl bg-slate-900/80 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('copilot')}
              className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'copilot'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Live Cues ({cues.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('battlecards')}
              className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'battlecards'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Battlecards</span>
            </button>

            <button
              onClick={() => setActiveTab('research')}
              className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'research'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Deal Strategy</span>
            </button>
          </div>

          {/* Tab 1: Live Tactical Cues Feed */}
          {activeTab === 'copilot' && (
            <div className="space-y-3 overflow-y-auto max-h-[620px]">
              
              {/* Practice Weakness Notice Header */}
              {session?.weaknesses && session.weaknesses.length > 0 && (
                <div className="rounded-xl bg-amber-950/40 border border-amber-500/40 p-3 text-xs text-amber-300 space-y-1 shadow-sm">
                  <div className="font-bold flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-amber-400" />
                    <span>Roleplay Practice Focus Area</span>
                  </div>
                  <p className="text-[11px] opacity-90">
                    Watch out: In your practice call, you <strong className="text-white">{session.weaknesses[0]}</strong>. Co-Pilot is actively monitoring this.
                  </p>
                </div>
              )}

              {/* Dynamic Cues Stack */}
              {cues.map((cue) => {
                const isObjection = cue.type === 'objection';
                const isWarning = cue.type === 'coaching_alert';

                return (
                  <div
                    key={cue.id}
                    className={`rounded-2xl p-4 border shadow-xl space-y-2.5 transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${
                      isObjection
                        ? 'bg-rose-950/30 border-rose-500/50 shadow-rose-500/10'
                        : isWarning
                        ? 'bg-amber-950/30 border-amber-500/50 shadow-amber-500/10'
                        : 'bg-slate-900/90 border-purple-500/40 shadow-purple-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        isObjection
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      }`}>
                        {cue.title}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">Live Cue</span>
                    </div>

                    <p className="text-xs font-semibold text-white leading-snug">
                      {cue.description}
                    </p>

                    <div className="rounded-xl bg-slate-950/70 p-2.5 border border-slate-800/80 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Tactical Action</span>
                      <p className="text-xs text-slate-200">{cue.suggestedAction}</p>
                    </div>

                    {cue.suggestedQuestion && (
                      <div className="rounded-xl bg-purple-950/40 p-2.5 border border-purple-500/30 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-purple-300">Suggested Question to Say</span>
                        <p className="text-xs text-purple-100 font-semibold italic">{cue.suggestedQuestion}</p>
                      </div>
                    )}
                  </div>
                );
              })}

            </div>
          )}

          {/* Tab 2: Battlecards Drawer */}
          {activeTab === 'battlecards' && (
            <div className="glass-panel rounded-2xl border border-slate-800 p-4 space-y-4 overflow-y-auto max-h-[620px] text-xs">
              <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-purple-400" /> Objection Battlecards for {targetCompany}
              </h3>

              {deal?.likely_objections?.map((obj, i) => (
                <div key={i} className="rounded-xl bg-slate-900/80 p-3.5 border border-slate-800 space-y-2">
                  <div className="font-bold text-white text-xs text-rose-300">
                    "{obj.title}"
                  </div>
                  <p className="text-slate-400 text-[11px]">{obj.description}</p>
                  <div className="rounded-lg bg-slate-950 p-2 border border-slate-800/80 text-[11px] text-purple-200 font-medium">
                    <strong className="text-purple-400">How to handle:</strong> {obj.suggestedHandling}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Deal Strategy Research */}
          {activeTab === 'research' && (
            <div className="glass-panel rounded-2xl border border-slate-800 p-4 space-y-4 overflow-y-auto max-h-[620px] text-xs text-slate-300">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500">Core Value Proposition</span>
                <p className="text-xs text-white font-medium mt-1 leading-relaxed">{deal?.value_proposition}</p>
              </div>

              <div className="border-t border-slate-800 pt-3 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-500">Target Pain Points</span>
                {deal?.pain_points?.map((p, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-slate-200">
                    <span className="text-purple-400">•</span>
                    <span>{p}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-800 pt-3 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-500">Discovery Questions</span>
                {deal?.discovery_questions?.map((q, i) => (
                  <div key={i} className="rounded-lg bg-slate-900/80 p-2 border border-slate-800 text-[11px] text-purple-200 font-medium">
                    {q}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Live Call Audio & Transcript Stream (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4 min-h-[550px]">
          
          {/* Live Call Transcript Stream */}
          <div className="glass-panel flex-1 rounded-2xl border border-slate-800/90 shadow-2xl flex flex-col overflow-hidden">
            
            <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3 bg-slate-900/60">
              <div className="flex items-center gap-2">
                <Radio className={`h-4 w-4 ${isListening ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                <h3 className="font-bold text-slate-100 text-xs uppercase tracking-wider">
                  Live Sales Call Stream
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {liveTranscript.length} Turns Monitored
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {liveTranscript.map((turn, i) => {
                const isRep = turn.speaker === 'rep';

                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 ${isRep ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold shrink-0 ${
                      isRep
                        ? 'bg-blue-600 text-white'
                        : 'bg-purple-600 text-white'
                    }`}>
                      {isRep ? 'You' : targetCompany.charAt(0)}
                    </div>

                    <div className={`max-w-[80%] rounded-2xl p-3.5 space-y-1 shadow-md text-xs ${
                      isRep
                        ? 'bg-blue-600/20 text-slate-100 border border-blue-500/30 rounded-tr-none'
                        : 'bg-slate-800/80 text-slate-100 border border-slate-700/80 rounded-tl-none'
                    }`}>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold">{isRep ? 'You (Sales Rep)' : `${deal?.target_persona?.name || 'Prospect'} (${targetCompany})`}</span>
                        <span className="font-mono">{new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed font-normal">{turn.text}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={transcriptBottomRef} />
            </div>

          </div>

          {/* Quick Simulation Triggers */}
          <div className="rounded-xl bg-slate-900/70 p-2.5 border border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px]">
            <span className="text-slate-400 font-bold uppercase text-[9px] shrink-0">Simulate Customer:</span>
            <button
              onClick={() => handleSimulateProspectResponse("We already use Gong and our managers coach reps.")}
              className="rounded-lg bg-slate-800 px-2.5 py-1 text-slate-300 hover:bg-purple-900/60 hover:text-white border border-slate-700 shrink-0 transition-all cursor-pointer"
            >
              "We already use Gong"
            </button>
            <button
              onClick={() => handleSimulateProspectResponse("How much does this cost? We are on a tight budget.")}
              className="rounded-lg bg-slate-800 px-2.5 py-1 text-slate-300 hover:bg-purple-900/60 hover:text-white border border-slate-700 shrink-0 transition-all cursor-pointer"
            >
              "Tight budget concern"
            </button>
            <button
              onClick={() => handleSimulateProspectResponse("How long does it take for a new rep to get onboarded with this?")}
              className="rounded-lg bg-slate-800 px-2.5 py-1 text-slate-300 hover:bg-purple-900/60 hover:text-white border border-slate-700 shrink-0 transition-all cursor-pointer"
            >
              "Onboarding timeline"
            </button>
          </div>

          {/* Audio & Text Input Controls */}
          <div className="glass-panel rounded-2xl p-3.5 border border-slate-800/90 shadow-2xl space-y-3">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleListening}
                className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 shadow-xl ${
                  isListening
                    ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/30 ring-4 ring-rose-500/20'
                    : 'bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white shadow-purple-500/30 hover:scale-105'
                }`}
                title={isListening ? 'Stop Live Call Mic' : 'Start Live Call Mic'}
              >
                {isListening ? (
                  <MicOff className="h-7 w-7 animate-pulse" />
                ) : (
                  <Mic className="h-7 w-7" />
                )}
                {isListening && (
                  <span className="absolute -inset-1 rounded-2xl border-2 border-rose-400 opacity-75 animate-ping" />
                )}
              </button>

              <div className="flex-1 rounded-xl bg-slate-900/80 p-3 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    {isListening ? 'Live Call Microphone Active' : 'Live Call Mic Standby'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {isListening ? 'Co-Pilot analyzing speech in real time...' : 'Click mic to stream live speech'}
                  </div>
                </div>

                <div className="flex items-end gap-1 h-6 w-20">
                  {[30, 60, 45, 90, 70, 85].map((h, idx) => (
                    <div
                      key={idx}
                      className={`w-1 rounded-full transition-all duration-75 ${
                        isListening ? 'bg-gradient-to-t from-emerald-500 to-purple-400' : 'bg-slate-700'
                      }`}
                      style={{ height: isListening ? `${h}%` : '15%' }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Manual Rep Speech Input Form */}
            <form onSubmit={handleSendRepMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={repInput}
                onChange={(e) => setRepInput(e.target.value)}
                placeholder="Type your spoken response or test pitch..."
                className="flex-1 rounded-xl bg-slate-900/90 border border-slate-700/80 px-4 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none shadow-inner"
              />
              <button
                type="submit"
                disabled={!repInput.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <span>Send</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>

        </div>

      </main>

      {/* Post-Call Report Modal */}
      {isCallEnded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md">
          <div className="glass-panel w-full max-w-2xl rounded-2xl border border-purple-500/50 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            
            <div className="text-center space-y-1">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20 mb-2">
                <Award className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Live Call Performance Report</h2>
              <p className="text-xs text-purple-300 font-mono">CloseIQ Call Execution vs. Practice Analysis</p>
            </div>

            {/* Practice vs Live Call Comparison Table */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-slate-900 p-3.5 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Practice Roleplay Score</span>
                <div className="text-2xl font-extrabold text-purple-400">{session?.score || 78}/100</div>
                <p className="text-[11px] text-slate-400">Identified weakness: {session?.weaknesses?.[0] || 'Early pitching'}</p>
              </div>

              <div className="rounded-xl bg-slate-900 p-3.5 border border-purple-500/40 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-400">Live Call Execution Score</span>
                <div className="text-2xl font-extrabold text-emerald-400">92/100</div>
                <p className="text-[11px] text-emerald-300 font-semibold">✓ Successfully addressed competitor & pricing objections in live call!</p>
              </div>
            </div>

            {/* Key Wins from Live Call */}
            <div className="rounded-xl bg-slate-900/80 p-4 border border-slate-800 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live Call Highlights</span>
              <div className="space-y-1.5 text-slate-200">
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Stayed disciplined in discovery questions before diving into features.</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Directly reframed the Gong objection around live call assistance vs. post-call recording.</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Met call objective: Prospect agreed to 30-min product evaluation!</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex justify-end gap-3">
              {onBackToRoleplay && (
                <button
                  onClick={onBackToRoleplay}
                  className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Practice Again
                </button>
              )}
              {onNewDeal && (
                <button
                  onClick={onNewDeal}
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-indigo-500 transition-all cursor-pointer"
                >
                  Prepare Next Deal (+ /try)
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
