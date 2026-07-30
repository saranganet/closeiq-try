import React, { useState } from 'react';
import { Key, X, Check, Zap } from 'lucide-react';

interface ApiKeyModalProps {
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ apiKey, onSaveApiKey, onClose }) => {
  const [keyInput, setKeyInput] = useState(apiKey);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(keyInput.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md">
      <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-amber-400" />
            <h3 className="font-bold text-slate-100 text-sm">Engine & API Configuration</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-4 space-y-4 text-xs">
          
          <div className="rounded-xl bg-blue-950/20 border border-blue-500/20 p-3 space-y-1 text-blue-300">
            <div className="flex items-center gap-1.5 font-bold">
              <Zap className="h-4 w-4 text-emerald-400" /> Ultra-Fast Neural Engine Configuration
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Enter your <strong>Groq API Key</strong> (<code>gsk_...</code>) for sub-150ms <strong>Llama-3.3-70B</strong> responses, or a Gemini API Key.
              If no key is set, the app uses the built-in <strong>Fast Client Engine</strong> out-of-the-box (&lt;300ms latency).
            </p>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Groq API Key (gsk_...) or Gemini API Key
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="gsk_... or AIzaSy..."
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-white font-mono placeholder-slate-600 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setKeyInput('');
                onSaveApiKey('');
                onClose();
              }}
              className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              Clear Key
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg"
            >
              <Check className="h-3.5 w-3.5" />
              Save Configuration
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
