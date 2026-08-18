import React from 'react';
import { Zap, Key, Award, Users, Plus, ChevronDown } from 'lucide-react';
import type { Persona, TelemetryMetrics } from '../types';

// CloseIQ Fox Brand Icon
export const CloseIQFoxIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
  <svg viewBox="0 0 32 32" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M4 6C4 6 6 12 11 15.5C9 18 7 20 4.5 21C7.5 22.5 11.5 22 14.5 20C15.2 21.2 16.5 21.2 17.5 20C20.5 22 24.5 22.5 27.5 21C25 20 23 18 21 15.5C26 12 28 6 28 6C24.5 8.5 20.5 10 17 9.2C16.5 8 15.5 8 15 9.2C11.5 10 7.5 8.5 4 6Z" fill="currentColor"/>
    <path d="M16 16.5L13.5 20L16 23L18.5 20L16 16.5Z" fill="currentColor"/>
  </svg>
);

interface HeaderNavProps {
  activePersona: Persona;
  telemetry?: TelemetryMetrics;
  onOpenPersonaSelector: () => void;
  onOpenCreateModal: () => void;
  onOpenApiKeyModal: () => void;
  onOpenScorecard: () => void;
  isDuplexActive: boolean;
  isSimulating?: boolean;
  onToggleSimulation?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activePersona,
  telemetry,
  onOpenPersonaSelector,
  onOpenCreateModal,
  onOpenApiKeyModal,
  onOpenScorecard,
  isDuplexActive: _isDuplexActive,
  isSimulating: _isSimulating,
  onToggleSimulation,
}) => {
  const roundtrip = telemetry?.totalRoundtripMs || 420;
  const isPass = roundtrip <= 800;

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#050507]/90 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        
        {/* Left: CloseIQ Logo */}
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center gap-2.5 text-white hover:opacity-90 transition-opacity">
            <CloseIQFoxIcon className="h-6 w-6 text-white" />
            <span className="text-xl font-bold tracking-tight text-white">CloseIQ</span>
          </a>
        </div>

        {/* Center: CloseIQ Pill Navigation Bar */}
        <nav className="hidden lg:flex items-center rounded-full border border-white/[0.08] bg-[#0c0d12]/90 p-1 shadow-inner backdrop-blur-md">
          <a
            href="/"
            className="rounded-full bg-blue-600/15 border border-blue-500/30 px-3.5 py-1 text-xs font-semibold text-blue-400 transition-all"
          >
            Home
          </a>
          <div className="relative group">
            <button className="flex items-center gap-1 rounded-full px-3.5 py-1 text-xs font-medium text-slate-300 hover:text-white transition-colors">
              Solutions
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
          </div>
          <button
            onClick={onToggleSimulation}
            className="rounded-full bg-white/[0.06] hover:bg-white/[0.1] px-3.5 py-1 text-xs font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Pilot Program
          </button>
          <a
            href="#faqs"
            className="rounded-full px-3.5 py-1 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            FAQs
          </a>
          <a
            href="#company"
            className="rounded-full px-3.5 py-1 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Company
          </a>
        </nav>

        {/* Right Action Controls & Roleplay Tools */}
        <div className="flex items-center gap-2.5">
          {/* Latency / SLA Pill */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-[#0c0d12] px-2.5 py-1 text-[11px] font-mono text-slate-400">
            <Zap className={`h-3 w-3 ${isPass ? 'text-blue-400' : 'text-amber-400'}`} />
            <span>{roundtrip}ms</span>
          </div>

          {/* Active Persona Pill */}
          <button
            onClick={onOpenPersonaSelector}
            className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#0c0d12] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-white/20 hover:bg-[#151722] transition-all"
            title="Switch Buyer Persona"
          >
            <img
              src={activePersona.avatarUrl}
              alt={activePersona.name}
              className="h-4 w-4 rounded-full object-cover border border-blue-500/40"
            />
            <span className="font-semibold text-white">{activePersona.name.split(' ')[0]}</span>
            <span className="text-[10px] text-slate-400 hidden md:inline">({activePersona.title})</span>
            <Users className="h-3 w-3 text-slate-400 ml-0.5" />
          </button>

          {/* Create Persona */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-[#0c0d12] px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:border-white/20 transition-all"
            title="Add Custom Target Persona"
          >
            <Plus className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden xl:inline">Persona</span>
          </button>

          {/* API Keys */}
          <button
            onClick={onOpenApiKeyModal}
            className="rounded-full border border-white/[0.08] bg-[#0c0d12] p-1.5 text-slate-400 hover:text-white hover:border-white/20 transition-all"
            title="API Keys (Groq / Deepgram / Gemini)"
          >
            <Key className="h-3.5 w-3.5 text-amber-400" />
          </button>

          {/* Evaluation Scorecard */}
          <button
            onClick={onOpenScorecard}
            className="hidden md:flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-[#0c0d12] px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:border-white/20 transition-all"
          >
            <Award className="h-3.5 w-3.5 text-blue-400" />
            <span>Scorecard</span>
          </button>

          {/* Contact (Outline Pill) */}
          <a
            href="mailto:team@closeiq.in"
            className="hidden sm:inline-block rounded-full border border-white/[0.08] bg-transparent px-4 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.05] hover:border-white/20 transition-all"
          >
            Contact
          </a>

          {/* Register for Pilot (Solid Electric Blue Pill) */}
          <button
            onClick={onToggleSimulation}
            className="rounded-full bg-blue-600 hover:bg-blue-500 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            Register for Pilot
          </button>
        </div>

      </div>
    </header>
  );
};
