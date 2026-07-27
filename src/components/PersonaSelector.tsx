import React from 'react';
import type { Persona } from '../types';
import { BUILTIN_PERSONAS } from '../data/personas';
import { Plus, Check, ShieldAlert, Cpu, DollarSign, Clock, Sliders, Trash2 } from 'lucide-react';

interface PersonaSelectorProps {
  activePersona: Persona;
  customPersonas: Persona[];
  onSelectPersona: (persona: Persona) => void;
  onDeleteCustomPersona?: (id: string) => void;
  onOpenCreateModal: () => void;
  onClose: () => void;
}

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  activePersona,
  customPersonas,
  onSelectPersona,
  onDeleteCustomPersona,
  onOpenCreateModal,
  onClose,
}) => {
  const allPersonas = [...BUILTIN_PERSONAS, ...customPersonas];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-4xl max-h-[85vh] border border-white/[0.08] bg-[#0c0d12] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] p-5 bg-[#090a0f]">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-blue-400" />
              Select Target Buyer Persona
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose a calibrated buyer profile or build a custom prospect with tailored behavioral traits.
            </p>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenCreateModal();
            }}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            + Build Custom Persona
          </button>
        </div>

        {/* Persona Cards Gallery */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {allPersonas.map((persona) => {
            const isSelected = persona.id === activePersona.id;
            const isCustom = persona.id.startsWith('custom-');

            return (
              <div
                key={persona.id}
                onClick={() => {
                  onSelectPersona(persona);
                  onClose();
                }}
                className={`relative cursor-pointer p-4 transition-all duration-150 border flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-500 bg-[#111626] shadow-md shadow-blue-500/10'
                    : 'border-white/[0.06] bg-[#11131a] hover:border-white/[0.15] hover:bg-[#151722]'
                }`}
              >
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  {isCustom && onDeleteCustomPersona && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCustomPersona(persona.id);
                      }}
                      className="flex h-6 w-6 items-center justify-center bg-rose-950/50 text-rose-400 border border-rose-500/30 hover:bg-rose-900/80 transition-colors"
                      title="Delete Custom Persona"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                  {isSelected && (
                    <div className="flex h-5 w-5 items-center justify-center bg-blue-500 text-white shadow-md">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </div>

                <div>
                  {/* Avatar & Info */}
                  <div className="flex items-center gap-3">
                    <img
                      src={persona.avatarUrl}
                      alt={persona.name}
                      className="h-11 w-11 object-cover border border-white/[0.08]"
                    />
                    <div>
                      <h3 className="font-bold text-white text-sm flex items-center gap-2">
                        {persona.name}
                        {isCustom && (
                          <span className="bg-blue-500/20 px-2 py-0.5 text-[10px] text-blue-300 font-normal border border-blue-500/30">
                            Custom
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400">{persona.title}</p>
                      <p className="text-[11px] text-blue-400 font-medium">{persona.company}</p>
                    </div>
                  </div>

                  {/* Personality Traits Badges */}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                    <div className="bg-[#090a0f] p-2 border border-white/[0.04]">
                      <div className="text-slate-400 flex items-center gap-1 text-[10px]">
                        <Cpu className="h-3 w-3 text-blue-400" /> Tech Depth
                      </div>
                      <div className="font-semibold text-white mt-0.5">{persona.behavior.technicalDepth}%</div>
                    </div>

                    <div className="bg-[#090a0f] p-2 border border-white/[0.04]">
                      <div className="text-slate-400 flex items-center gap-1 text-[10px]">
                        <DollarSign className="h-3 w-3 text-emerald-400" /> Price Sens.
                      </div>
                      <div className="font-semibold text-white mt-0.5">{persona.behavior.priceSensitivity}%</div>
                    </div>

                    <div className="bg-[#090a0f] p-2 border border-white/[0.04]">
                      <div className="text-slate-400 flex items-center gap-1 text-[10px]">
                        <ShieldAlert className="h-3 w-3 text-rose-400" /> Risk Aversion
                      </div>
                      <div className="font-semibold text-white mt-0.5">{persona.behavior.riskAversion}%</div>
                    </div>
                  </div>

                  {/* Initial Objections Preview */}
                  <div className="mt-3 text-xs text-slate-400">
                    <span className="text-[10px] uppercase font-semibold text-slate-500">Key Objection:</span>
                    <p className="text-slate-300 italic mt-0.5 truncate">
                      "{persona.initialState.activeObjections[0]?.title || 'Standard Enterprise Procurement'}"
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="h-3 w-3 text-amber-400" /> Decay: {persona.behavior.patienceDecayRate}/10
                  </span>
                  <span className="text-blue-400 font-semibold">
                    {isSelected ? 'Selected' : 'Select →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-white/[0.08] p-4 flex justify-between items-center text-xs text-slate-400 bg-[#090a0f]">
          <span>Total Personas: {allPersonas.length}</span>
          <button
            onClick={onClose}
            className="bg-white/[0.06] hover:bg-white/[0.1] px-4 py-1.5 font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
