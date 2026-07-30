import React, { useState } from 'react';
import type { Persona } from '../types';
import { Sparkles, X, User, Brain, Building2, Target } from 'lucide-react';

interface CustomPersonaModalProps {
  onSave: (persona: Persona) => void;
  onClose: () => void;
}

export const CustomPersonaModal: React.FC<CustomPersonaModalProps> = ({ onSave, onClose }) => {
  // Prospect Identity
  const [name, setName] = useState('Victoria Sterling');
  const [title, setTitle] = useState('VP of Operations');
  const [company, setCompany] = useState('Apex FinTech Global');
  const [avatarUrl, setAvatarUrl] = useState('https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&auto=format&fit=crop&q=80');
  const [gender, setGender] = useState<'male' | 'female'>('female');

  // Company & Business Context (What service they provide / Real Customer Context)
  const [companyDescription, setCompanyDescription] = useState('We build high-frequency payment processing software and financial API infrastructure for global banks.');
  const [servicesProvided, setServicesProvided] = useState('Real-time payment routing, fraud detection algorithms, and cross-border currency settlement.');
  const [currentSituation, setCurrentSituation] = useState('Our transaction volume grew 3x last quarter, causing server latency spikes during peak trading hours.');
  const [currentNeeds, setCurrentNeeds] = useState('We need a high-availability cloud infrastructure with SOC2 Type II compliance and sub-50ms database latency.');

  // Big 5 Personality Traits & Behavioral Sliders
  const [openness, setOpenness] = useState(60);
  const [conscientiousness, setConscientiousness] = useState(85);
  const [extraversion, setExtraversion] = useState(60);
  const [agreeableness, setAgreeableness] = useState(50);

  const [directness, setDirectness] = useState(80);
  const [priceSensitivity, setPriceSensitivity] = useState(70);
  const [riskAversion, setRiskAversion] = useState(85);
  const [technicalDepth, setTechnicalDepth] = useState(75);
  const [patienceDecay, setPatienceDecay] = useState(6);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newPersona: Persona = {
      id: `custom-${Date.now()}`,
      name,
      title,
      company,
      avatarUrl,
      voiceGender: gender,
      personality: {
        openness,
        conscientiousness,
        extraversion,
        agreeableness,
        neuroticism: 50,
      },
      behavior: {
        directness,
        priceSensitivity,
        riskAversion,
        decisionSpeed: 50,
        technicalDepth,
        patienceDecayRate: patienceDecay,
      },
      communication: {
        speechRateMultiplier: 1.05,
        pauseFrequency: 'medium',
        hesitationFrequency: 'medium',
        vocabularyLevel: 'business',
        sentenceLengthTarget: 'short',
        interruptionSensitivity: directness,
      },
      knowledge: {
        industry: 'Enterprise Software & Technology',
        companySize: '250 - 1,000 employees',
        techStack: ['Cloud Native', 'Distributed Systems'],
        currentPainPoints: [currentSituation, currentNeeds],
        competitorsEvaluated: ['Legacy Enterprise Vendors'],
        budgetRange: '$50k - $200k',
        companyDescription,
        servicesProvided,
        currentNeeds,
      },
      initialState: {
        trustScore: 35,
        mood: 'skeptical',
        patienceLevel: 75,
        buyingIntent: 30,
        perceivedValue: 40,
        riskPerception: riskAversion,
        turnCount: 0,
        activeObjections: [
          {
            id: `obj-custom-${Date.now()}`,
            category: 'complexity',
            title: `Integration & Performance for ${company}`,
            description: currentNeeds,
            triggerThreshold: { maxTrust: 60 },
            hidden: false,
            isResolved: false,
            resolutionCriteria: 'Demonstrate proven high-availability performance and security compliance.',
          }
        ],
        resolvedObjections: [],
      },
      objectionPool: [],
      systemContext: `You are ${name}, ${title} at ${company}. ${companyDescription} Your current situation: ${currentSituation}. What you are looking for: ${currentNeeds}. Speak like a real customer on a live call. Keep responses short (1-2 sentences).`,
    };

    onSave(newPersona);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md">
      <div className="glass-panel w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <div>
              <h2 className="text-base font-bold text-white">Custom Customer Persona Builder</h2>
              <p className="text-xs text-slate-400">Define your customer's company, services provided, and real business needs.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-300">
          
          {/* 1. Customer Identity */}
          <div className="rounded-xl bg-slate-900/60 p-4 border border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <User className="h-4 w-4 text-blue-400" /> Customer Identity
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white font-medium focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Job Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white font-medium focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Company Name</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white font-medium focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Voice Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white font-medium focus:border-blue-500 focus:outline-none"
                >
                  <option value="female">Female Voice</option>
                  <option value="male">Male Voice</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Avatar Image URL</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white font-medium focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* 2. Company & Services Provided (Real Customer Context) */}
          <div className="rounded-xl bg-purple-950/20 p-4 border border-purple-500/30 space-y-3">
            <h4 className="font-bold text-purple-300 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Building2 className="h-4 w-4 text-purple-400" /> Company Services & Real Business Context
            </h4>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">What service or product does their company provide?</label>
              <textarea
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                rows={2}
                placeholder="e.g. We build fintech payment software for global banks and financial institutions..."
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white font-medium focus:border-purple-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Key Offerings / Core Operations</label>
              <input
                type="text"
                value={servicesProvided}
                onChange={(e) => setServicesProvided(e.target.value)}
                placeholder="e.g. Real-time payment routing, fraud detection, and multi-currency settlement..."
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white font-medium focus:border-purple-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* 3. Real Business Situation & Vendor Criteria */}
          <div className="rounded-xl bg-blue-950/20 p-4 border border-blue-500/30 space-y-3">
            <h4 className="font-bold text-blue-300 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Target className="h-4 w-4 text-blue-400" /> Current Situation & Solution Requirements
            </h4>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Current Business Situation & Pain Points</label>
              <textarea
                value={currentSituation}
                onChange={(e) => setCurrentSituation(e.target.value)}
                rows={2}
                placeholder="e.g. Transaction volume grew 3x last quarter, causing server latency spikes during peak hours..."
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white font-medium focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">What are they looking for / Solution Requirements?</label>
              <textarea
                value={currentNeeds}
                onChange={(e) => setCurrentNeeds(e.target.value)}
                rows={2}
                placeholder="e.g. Looking for high-availability cloud infrastructure with SOC2 Type II compliance and sub-50ms latency..."
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white font-medium focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* 4. Personality & Behavioral Sliders */}
          <div className="rounded-xl bg-slate-900/60 p-4 border border-slate-800 space-y-4">
            <h4 className="font-bold text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Brain className="h-4 w-4 text-emerald-400" /> Personality & Behavioral Sliders
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Openness (New Solutions)</span>
                  <span className="font-mono text-purple-400 font-bold">{openness}%</span>
                </div>
                <input
                  type="range" min="0" max="100" value={openness}
                  onChange={(e) => setOpenness(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Conscientiousness (Data Proof)</span>
                  <span className="font-mono text-blue-400 font-bold">{conscientiousness}%</span>
                </div>
                <input
                  type="range" min="0" max="100" value={conscientiousness}
                  onChange={(e) => setConscientiousness(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Extraversion (Talkativeness)</span>
                  <span className="font-mono text-cyan-400 font-bold">{extraversion}%</span>
                </div>
                <input
                  type="range" min="0" max="100" value={extraversion}
                  onChange={(e) => setExtraversion(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Agreeableness (Warmth vs Skepticism)</span>
                  <span className="font-mono text-emerald-400 font-bold">{agreeableness}%</span>
                </div>
                <input
                  type="range" min="0" max="100" value={agreeableness}
                  onChange={(e) => setAgreeableness(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Directness (Concise Answers)</span>
                  <span className="font-mono text-indigo-400 font-bold">{directness}%</span>
                </div>
                <input
                  type="range" min="0" max="100" value={directness}
                  onChange={(e) => setDirectness(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Price Sensitivity</span>
                  <span className="font-mono text-emerald-400 font-bold">{priceSensitivity}%</span>
                </div>
                <input
                  type="range" min="0" max="100" value={priceSensitivity}
                  onChange={(e) => setPriceSensitivity(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Risk Aversion</span>
                  <span className="font-mono text-rose-400 font-bold">{riskAversion}%</span>
                </div>
                <input
                  type="range" min="0" max="100" value={riskAversion}
                  onChange={(e) => setRiskAversion(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Technical Depth Expectation</span>
                  <span className="font-mono text-teal-400 font-bold">{technicalDepth}%</span>
                </div>
                <input
                  type="range" min="0" max="100" value={technicalDepth}
                  onChange={(e) => setTechnicalDepth(Number(e.target.value))}
                  className="w-full accent-teal-500"
                />
              </div>

              <div className="col-span-2">
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Patience Decay Rate</span>
                  <span className="font-mono text-amber-400 font-bold">{patienceDecay}/10</span>
                </div>
                <input
                  type="range" min="1" max="10" value={patienceDecay}
                  onChange={(e) => setPatienceDecay(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button" onClick={onClose}
              className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-indigo-500"
            >
              Create Customer Persona
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
