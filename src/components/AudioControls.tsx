import React, { useState } from 'react';
import { Mic, MicOff, Send, Radio, AlertCircle, MessageSquareText, ChevronUp, ChevronDown } from 'lucide-react';

interface AudioControlsProps {
  isListening: boolean;
  isSpeaking: boolean;
  audioLevel: number; // 0-100 VAD level
  onToggleListening: () => void;
  onSendTextMessage: (text: string) => void;
  wasInterrupted: boolean;
  roundtripMs: number;
  showTranscripts?: boolean;
  onToggleTranscripts?: () => void;
  turnCount?: number;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  isListening,
  isSpeaking,
  audioLevel,
  onToggleListening,
  onSendTextMessage,
  wasInterrupted,
  roundtripMs,
  showTranscripts,
  onToggleTranscripts,
  turnCount = 0,
}) => {
  const [textInput, setTextInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      onSendTextMessage(textInput.trim());
      setTextInput('');
    }
  };

  return (
    <div className="border border-white/[0.08] bg-[#0c0d12] p-4 sm:p-6 shadow-2xl space-y-4 w-full">
      
      {/* Interruption Alert Banner */}
      {wasInterrupted && (
        <div className="border border-rose-500/40 bg-rose-950/30 p-3 text-xs sm:text-sm text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span className="font-bold">Speech Interruption Handled</span>
            <span className="text-xs opacity-90">• Buyer paused immediately to listen to your voice.</span>
          </div>
        </div>
      )}

      {/* Controls Grid */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
        
        {/* Main Microphone Button */}
        <button
          onClick={onToggleListening}
          className={`relative flex h-16 w-16 shrink-0 items-center justify-center transition-all duration-150 cursor-pointer shadow-lg border ${
            isListening
              ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-rose-600/30'
              : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400 shadow-blue-600/30'
          }`}
          title={isListening ? 'Stop Mic' : 'Start Full-Duplex Microphone'}
        >
          {isListening ? (
            <MicOff className="h-7 w-7" />
          ) : (
            <Mic className="h-7 w-7" />
          )}

          {isListening && (
            <span className="absolute -inset-1 border border-rose-400 animate-ping opacity-75 pointer-events-none" />
          )}
        </button>

        {/* Live Audio VAD Level Visualizer */}
        <div className="flex-1 min-w-[240px] bg-[#11131a] p-4 border border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <Radio className={`h-5 w-5 ${isListening ? 'text-blue-400 animate-pulse' : 'text-slate-500'}`} />
            <div className="space-y-0.5">
              <div className="font-bold text-sm sm:text-base text-white">
                {isListening ? 'Live Microphone Active' : 'Microphone Standby'}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {isSpeaking ? 'Buyer speaking in real-time...' : isListening ? 'Listening for your pitch...' : 'Click Blue Mic to speak out loud'}
              </div>
            </div>
          </div>

          {/* Waveform Bar Graphic */}
          <div className="flex items-end gap-1.5 h-7 w-32 px-2">
            {[30, 70, 45, 90, 60, 80, 40].map((baseHeight, i) => {
              const activeHeight = isListening ? Math.max(15, (audioLevel / 100) * baseHeight) : 10;
              return (
                <div
                  key={i}
                  className={`w-1.5 transition-all duration-75 ${
                    isListening ? 'bg-blue-500' : 'bg-slate-700/60'
                  }`}
                  style={{ height: `${activeHeight}%` }}
                />
              );
            })}
          </div>
        </div>

        {/* Latency Metric Display */}
        <div className="hidden md:flex flex-col justify-center bg-[#11131a] p-3.5 border border-white/[0.08] text-right min-w-[100px]">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Latency</span>
          <span className={`font-mono text-sm sm:text-base font-bold ${roundtripMs <= 800 ? 'text-blue-400' : 'text-amber-400'}`}>
            {roundtripMs}ms
          </span>
        </div>

        {/* Show/Hide Transcripts Toggle Button */}
        {onToggleTranscripts && (
          <button
            type="button"
            onClick={onToggleTranscripts}
            className={`flex items-center gap-2 px-5 py-4 border text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
              showTranscripts
                ? 'bg-blue-950/50 border-blue-500 text-blue-300'
                : 'bg-[#11131a] border-white/[0.08] hover:border-white/20 text-slate-300 hover:text-white'
            }`}
          >
            <MessageSquareText className="h-4 w-4 text-blue-400" />
            <span>{showTranscripts ? 'Hide Transcripts' : `Show Transcripts (${turnCount})`}</span>
            {showTranscripts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}

      </div>

      {/* Fallback Text Input Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Or type a sales pitch response manually..."
          className="flex-1 bg-[#11131a] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={!textInput.trim()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <span>Send</span>
          <Send className="h-4 w-4" />
        </button>
      </form>

    </div>
  );
};

