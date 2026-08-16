import React from 'react';
import type { Persona } from '../types';
import { Radio } from 'lucide-react';

interface VoiceAgentOrbProps {
  isSpeaking: boolean;
  isListening: boolean;
  audioLevel: number; // 0 - 100
  isStreamingResponse?: boolean;
  activePersona: Persona;
  wasInterrupted?: boolean;
}

export const VoiceAgentOrb: React.FC<VoiceAgentOrbProps> = ({
  isSpeaking,
  isListening,
  audioLevel,
  isStreamingResponse,
  activePersona,
  wasInterrupted: _wasInterrupted,
}) => {
  // Calculate dynamic scale factor from audio level
  const baseScale = isSpeaking || isStreamingResponse ? 1.15 : isListening ? 1.0 + (audioLevel / 200) : 1.0;
  const glowIntensity = isSpeaking || isStreamingResponse ? '0.8' : isListening ? `${0.4 + (audioLevel / 150)}` : '0.25';

  return (
    <div className="relative w-full flex flex-col items-center justify-center py-12 sm:py-20 overflow-hidden select-none">
      
      {/* Background radial ambient lights */}
      <div 
        className="absolute h-[380px] w-[380px] sm:h-[500px] sm:w-[500px] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none transition-all duration-700"
        style={{
          transform: `scale(${baseScale * 1.2})`,
          opacity: glowIntensity,
        }}
      />
      <div 
        className="absolute h-[250px] w-[250px] sm:h-[350px] sm:w-[350px] rounded-full bg-cyan-500/10 blur-[90px] pointer-events-none transition-all duration-500"
        style={{
          transform: `scale(${baseScale}) rotate(${isSpeaking ? '180deg' : '0deg'})`,
        }}
      />

      {/* Main Orb Center Container */}
      <div className="relative flex items-center justify-center">
        
        {/* Outer Ripple Wave Rings (Active during speech / listening) */}
        {(isSpeaking || isStreamingResponse || isListening) && (
          <>
            <div 
              className="absolute h-56 w-56 sm:h-72 sm:w-72 rounded-full border border-blue-500/30 animate-ping pointer-events-none"
              style={{ animationDuration: isSpeaking ? '2.2s' : '1.6s' }}
            />
            <div 
              className="absolute h-48 w-48 sm:h-60 sm:w-60 rounded-full border border-cyan-400/20 animate-pulse pointer-events-none"
              style={{ animationDuration: '1.4s' }}
            />
          </>
        )}

        {/* Secondary Halo Ring */}
        <div 
          className={`absolute h-44 w-44 sm:h-56 sm:w-56 rounded-full border transition-all duration-500 ${
            isSpeaking || isStreamingResponse
              ? 'border-blue-400/60 shadow-[0_0_50px_rgba(59,130,246,0.5)] scale-110'
              : isListening
              ? 'border-cyan-400/50 shadow-[0_0_35px_rgba(6,182,212,0.4)] scale-105'
              : 'border-white/[0.08] shadow-[0_0_20px_rgba(0,0,0,0.5)] scale-100'
          }`}
        />

        {/* Core Pulsating Fluid Orb */}
        <div 
          className="relative h-36 w-36 sm:h-48 sm:w-48 rounded-full flex items-center justify-center transition-all duration-300 ease-out shadow-2xl overflow-hidden"
          style={{
            transform: `scale(${baseScale})`,
            background: isSpeaking || isStreamingResponse
              ? 'radial-gradient(circle at 35% 35%, #60a5fa 0%, #2563eb 45%, #1e3a8a 80%, #0c0d12 100%)'
              : isListening
              ? 'radial-gradient(circle at 40% 40%, #38bdf8 0%, #0284c7 40%, #0369a1 75%, #0c0d12 100%)'
              : 'radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 50%, #080a10 100%)',
            boxShadow: isSpeaking || isStreamingResponse
              ? '0 0 60px rgba(37, 99, 235, 0.6), inset 0 0 30px rgba(147, 197, 253, 0.5)'
              : isListening
              ? '0 0 45px rgba(6, 182, 212, 0.5), inset 0 0 25px rgba(125, 211, 252, 0.4)'
              : '0 0 25px rgba(15, 23, 42, 0.8), inset 0 0 15px rgba(255, 255, 255, 0.05)',
          }}
        >
          {/* Inner Fluid Morphing Waves / Shimmer */}
          <div 
            className={`absolute inset-0 opacity-70 mix-blend-screen transition-all duration-1000 ${
              isSpeaking || isStreamingResponse
                ? 'animate-spin bg-gradient-to-tr from-cyan-400 via-transparent to-blue-400'
                : isListening
                ? 'animate-pulse bg-gradient-to-tr from-sky-400 via-transparent to-teal-400'
                : 'bg-gradient-to-tr from-slate-700/30 via-transparent to-slate-800/30'
            }`}
            style={{ animationDuration: '8s' }}
          />

          {/* Center Activity Icon / Wave bars */}
          <div className="relative z-10 flex flex-col items-center justify-center space-y-1">
            {isSpeaking || isStreamingResponse ? (
              <div className="flex items-center gap-1">
                {[40, 80, 100, 75, 45].map((h, idx) => (
                  <div
                    key={idx}
                    className="w-1.5 bg-white rounded-full animate-pulse shadow-sm"
                    style={{
                      height: `${h * 0.35}px`,
                      animationDuration: `${0.4 + idx * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            ) : isListening ? (
              <div className="flex items-center gap-1">
                {[20, 50, 90, 60, 30].map((h, idx) => (
                  <div
                    key={idx}
                    className="w-1.5 bg-cyan-200 rounded-full transition-all duration-75"
                    style={{
                      height: `${Math.max(8, (audioLevel / 100) * (h * 0.4))}px`,
                    }}
                  />
                ))}
              </div>
            ) : (
              <Radio className="h-7 w-7 text-slate-400 animate-pulse" />
            )}
          </div>
        </div>

      </div>

      {/* Real-Time Status & Persona Title Pill */}
      <div className="mt-8 flex flex-col items-center text-center space-y-2 z-10">
        
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#11131a] border border-white/[0.08] shadow-lg">
          {isSpeaking || isStreamingResponse ? (
            <>
              <span className="h-2 w-2 bg-blue-400 animate-ping rounded-full" />
              <span className="text-xs sm:text-sm font-bold text-blue-400 tracking-wide uppercase">
                {activePersona.name} Is Speaking ({activePersona.title})
              </span>
            </>
          ) : isListening ? (
            <>
              <span className="h-2 w-2 bg-cyan-400 animate-pulse rounded-full" />
              <span className="text-xs sm:text-sm font-bold text-cyan-300 tracking-wide uppercase">
                Listening to your pitch...
              </span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 bg-slate-500 rounded-full" />
              <span className="text-xs sm:text-sm font-bold text-slate-400 tracking-wide uppercase">
                Voice Standby • Press mic to speak
              </span>
            </>
          )}
        </div>

        {/* Persona Details */}
        <p className="text-sm text-slate-300 max-w-md">
          Practicing with <strong className="text-white">{activePersona.name}</strong> • <span className="text-slate-400">{activePersona.company || 'Target Account'}</span>
        </p>

      </div>

    </div>
  );
};
