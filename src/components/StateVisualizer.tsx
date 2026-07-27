import React from 'react';
import type { DynamicState, MoodState, Persona } from '../types';
import { ShieldCheck, ShieldAlert, HeartHandshake, Smile, AlertTriangle, TrendingUp, HelpCircle, CheckCircle2 } from 'lucide-react';

interface StateVisualizerProps {
  state: DynamicState;
  persona: Persona;
}

export const StateVisualizer: React.FC<StateVisualizerProps> = ({ state, persona }) => {
  const getMoodBadge = (mood: MoodState) => {
    switch (mood) {
      case 'delighted':
        return { label: 'Delighted', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: Smile };
      case 'curious':
        return { label: 'Curious', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', icon: TrendingUp };
      case 'convinced':
        return { label: 'Convinced', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: ShieldCheck };
      case 'skeptical':
        return { label: 'Skeptical', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: HelpCircle };
      case 'defensive':
        return { label: 'Defensive', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', icon: ShieldAlert };
      case 'frustrated':
        return { label: 'Frustrated', color: 'bg-red-600/30 text-red-300 border-red-500/40', icon: AlertTriangle };
      default:
        return { label: 'Neutral', color: 'bg-slate-700/40 text-slate-300 border-slate-600/40', icon: Smile };
    }
  };

  const moodInfo = getMoodBadge(state.mood);
  const MoodIcon = moodInfo.icon;

  return (
    <div className="border border-white/[0.08] bg-[#0c0d12] p-5 shadow-xl space-y-4">
      {/* Header Profile Summary */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <img
              src={persona.avatarUrl}
              alt={persona.name}
              className="h-12 w-12 object-cover border border-blue-500/40 shadow-md"
            />
            <span className={`absolute -bottom-1 -right-1 h-3 w-3 ${
              state.patienceLevel > 50 ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'
            }`} />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">{persona.name}</h3>
            <p className="text-xs sm:text-sm text-slate-400">{persona.title} • {persona.company}</p>
          </div>
        </div>

        {/* Dynamic Mood Badge */}
        <div className={`flex items-center gap-1.5 px-3.5 py-1 border text-xs font-bold uppercase tracking-wider ${moodInfo.color}`}>
          <MoodIcon className="h-4 w-4" />
          <span>{moodInfo.label}</span>
        </div>
      </div>

      {/* Main Dynamic Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Trust Score */}
        <div className="bg-[#11131a] p-3.5 border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5 font-bold uppercase text-[10px]"><HeartHandshake className="h-3.5 w-3.5 text-blue-400" /> Trust</span>
            <span className="font-mono text-blue-400 font-bold text-sm">{state.trustScore}%</span>
          </div>
          <div className="mt-2.5 h-1.5 w-full bg-slate-900 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${state.trustScore}%` }}
            />
          </div>
        </div>

        {/* Patience Level */}
        <div className="bg-[#11131a] p-3.5 border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5 font-bold uppercase text-[10px]"><Smile className="h-3.5 w-3.5 text-amber-400" /> Patience</span>
            <span className="font-mono text-amber-400 font-bold text-sm">{state.patienceLevel}%</span>
          </div>
          <div className="mt-2.5 h-1.5 w-full bg-slate-900 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                state.patienceLevel > 60 ? 'bg-emerald-500' : state.patienceLevel > 30 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${state.patienceLevel}%` }}
            />
          </div>
        </div>

        {/* Buying Intent */}
        <div className="bg-[#11131a] p-3.5 border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5 font-bold uppercase text-[10px]"><TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> Intent</span>
            <span className="font-mono text-emerald-400 font-bold text-sm">{state.buyingIntent}%</span>
          </div>
          <div className="mt-2.5 h-1.5 w-full bg-slate-900 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-500"
              style={{ width: `${state.buyingIntent}%` }}
            />
          </div>
        </div>

        {/* Perceived Risk */}
        <div className="bg-[#0c0d12] border border-white/[0.08] p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1"><ShieldAlert className="h-3.5 w-3.5 text-rose-400" /> Risk Perception</span>
            <span className="font-mono text-rose-300 font-bold">{state.riskPerception}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-slate-900 overflow-hidden">
            <div
              className="h-full bg-rose-500 transition-all duration-500"
              style={{ width: `${state.riskPerception}%` }}
            />
          </div>
        </div>

      </div>

      {/* Objections HUD Bar */}
      <div className="border-t border-white/[0.08] pt-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
            Active Objections ({state.activeObjections.length})
          </span>
          <span className="text-slate-400 flex items-center gap-1 text-[11px]">
            <CheckCircle2 className="h-3 w-3 text-blue-400" />
            {state.resolvedObjections.length} Resolved
          </span>
        </div>

        {state.activeObjections.length === 0 ? (
          <div className="bg-blue-950/20 border border-blue-500/20 p-2.5 text-xs text-blue-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
            <span>No active objections! Prospect is aligned with your value proposition.</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {state.activeObjections.map((obj) => (
              <div
                key={obj.id}
                className="group relative bg-rose-950/30 border border-rose-500/30 px-3 py-1 text-xs text-rose-200 flex items-center gap-2 shadow-sm"
              >
                <span className="h-1.5 w-1.5 bg-rose-400 animate-ping" />
                <span className="font-medium">{obj.title}</span>
                <span className="text-[10px] text-rose-400/80 uppercase">({obj.category})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
