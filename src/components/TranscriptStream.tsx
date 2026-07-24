import React, { useRef, useEffect } from 'react';
import type { ConversationTurn, Persona } from '../types';
import { Bot, Zap, AlertCircle } from 'lucide-react';

interface TranscriptStreamProps {
  activePersona: Persona;
  turns: ConversationTurn[];
  isStreamingResponse: boolean;
  streamingText: string;
}

export const TranscriptStream: React.FC<TranscriptStreamProps> = ({
  activePersona,
  turns,
  isStreamingResponse,
  streamingText,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, streamingText]);

  const shortTitle = activePersona.title.toUpperCase().includes('CTO')
    ? 'CTO'
    : activePersona.title.toUpperCase().includes('VP')
    ? 'VP OF SALES'
    : activePersona.title.toUpperCase().includes('FOUNDER')
    ? 'FOUNDER'
    : activePersona.title.toUpperCase().includes('PROCUREMENT')
    ? 'PROCUREMENT'
    : 'BUYER';

  return (
    <div className="flex-1 border border-white/[0.08] bg-[#0c0d12] shadow-2xl flex flex-col overflow-hidden">
      
      {/* Buyer Simulation Header matching CloseIQ Screenshot */}
      <div className="border-b border-white/[0.08] px-6 py-4 bg-[#090a0f] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
              Buyer Simulation
            </span>
            <span className="text-sm sm:text-base font-bold text-white">
              {activePersona.name} ({activePersona.title})
            </span>
          </div>
          <span className="px-3 py-1 text-[11px] font-bold text-blue-400 border border-blue-500/40 bg-blue-950/30 flex items-center gap-2">
            <span className="h-2 w-2 bg-blue-400 animate-pulse"></span>
            ACTIVE
          </span>
        </div>

        {/* Persona Context Metadata */}
        <div className="text-xs text-slate-300 space-y-1 pt-1 border-t border-white/[0.06]">
          <p className="leading-relaxed">
            <strong className="text-white">Behavior:</strong> {activePersona.knowledge?.currentNeeds || 'Focuses on pipeline velocity, sales ramp times, and integration reliability.'}
          </p>
          <p>
            <strong className="text-white">Budget:</strong> $150k - $250k
          </p>
        </div>
      </div>

      {/* Transcript Log List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {turns.length === 0 && !isStreamingResponse && (
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500">
            <Bot className="h-10 w-10 text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-200">Ready for Live Practice</p>
            <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
              Click the microphone button below or type a message to start roleplaying out loud with {activePersona.name}.
            </p>
          </div>
        )}

        {turns.map((turn) => {
          const isUser = turn.speaker === 'user';

          return (
            <div key={turn.id} className="space-y-1.5">
              {/* Speaker Tag */}
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider px-1">
                <span className={isUser ? 'text-slate-400' : 'text-blue-400 font-extrabold'}>
                  {isUser ? 'ALEX (SDR)' : shortTitle}
                </span>

                <div className="flex items-center gap-2">
                  {turn.telemetry && (
                    <span className="font-mono text-slate-400 text-xs">
                      {turn.telemetry.totalRoundtripMs}ms
                    </span>
                  )}
                  {turn.wasInterrupted && (
                    <span className="bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-300 border border-rose-500/40 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Interrupted
                    </span>
                  )}
                </div>
              </div>

              {/* Message Bubble - Matching CloseIQ Left Blue Accent Bar on Persona */}
              <div
                className={`p-4 text-sm sm:text-base leading-relaxed transition-all ${
                  isUser
                    ? 'bg-[#12141c] border border-white/[0.08] text-slate-200'
                    : 'bg-[#11131a] border-l-4 border-l-blue-500 border-y border-r border-white/[0.08] pl-4 text-white font-medium shadow-sm'
                }`}
              >
                <p>{turn.text}</p>
              </div>
            </div>
          );
        })}

        {/* Live Streaming Response Bubble */}
        {isStreamingResponse && (
          <div className="space-y-1.5 animate-in fade-in">
            <div className="flex items-center justify-between text-xs text-blue-400 font-bold uppercase tracking-wider px-1">
              <span>{shortTitle}</span>
              <span className="font-mono text-blue-400 flex items-center gap-1.5 animate-pulse">
                <Zap className="h-3.5 w-3.5" /> Streaming...
              </span>
            </div>
            <div className="p-4 bg-[#11131a] border-l-4 border-l-blue-500 border-y border-r border-white/[0.08] pl-4 text-sm sm:text-base text-white font-medium shadow-sm">
              <p>
                {streamingText || '...'}
                <span className="inline-block h-4 w-1.5 ml-1 bg-blue-500 animate-ping" />
              </p>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

    </div>
  );
};
