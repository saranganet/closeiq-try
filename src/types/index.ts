// Core Data Types for AI Sales Roleplay Simulator & CloseIQ /try Flow

export type MoodState = 
  | 'skeptical'
  | 'frustrated'
  | 'neutral'
  | 'curious'
  | 'delighted'
  | 'defensive'
  | 'convinced';

export interface BigFiveTraits {
  openness: number;         // 0-100 (Willingness to explore new solutions)
  conscientiousness: number;// 0-100 (Detail-oriented, data-driven demands)
  extraversion: number;     // 0-100 (Talkativeness, directness)
  agreeableness: number;    // 0-100 (Warmth vs skepticism)
  neuroticism: number;      // 0-100 (Volatility under sales pitch pressure)
}

export interface BehavioralMatrix {
  directness: number;       // 0-100 (Prefers blunt, concise answers)
  priceSensitivity: number; // 0-100 (Immediate concern with ROI & budget)
  riskAversion: number;     // 0-100 (Needs SLA, enterprise security, proof)
  decisionSpeed: number;    // 0-100 (Fast decision maker vs long procurement process)
  technicalDepth: number;   // 0-100 (Wants deep architecture vs high-level pitch)
  patienceDecayRate: number;// 1-10 (How fast patience drops when rep talks too long)
}

export interface Objection {
  id: string;
  category: 'pricing' | 'security' | 'timing' | 'competition' | 'complexity' | 'authority';
  title: string;
  description: string;
  triggerThreshold: {
    minPatience?: number;
    maxTrust?: number;
    keywordTriggers?: string[];
  };
  hidden: boolean;           // If true, prospect won't state it immediately unless probed
  isResolved: boolean;
  resolutionCriteria: string;// What seller needs to state/demonstrate to resolve
}

export interface DynamicState {
  trustScore: number;       // 0 - 100
  mood: MoodState;
  patienceLevel: number;    // 0 - 100
  buyingIntent: number;     // 0 - 100
  perceivedValue: number;   // 0 - 100
  riskPerception: number;   // 0 - 100
  turnCount: number;
  activeObjections: Objection[];
  resolvedObjections: Objection[];
}

export interface CommunicationStyle {
  speechRateMultiplier: number; // 0.8 - 1.4 (Slower vs faster voice)
  pauseFrequency: 'low' | 'medium' | 'high';
  hesitationFrequency: 'low' | 'medium' | 'high'; // uh, hmm, well
  vocabularyLevel: 'plain' | 'business' | 'technical_executive';
  sentenceLengthTarget: 'short' | 'concise' | 'detailed'; // Short human replies enforcement
  interruptionSensitivity: number; // 0-100 (How quickly prospect interrupts user)
}

export interface DomainKnowledge {
  industry: string;
  companySize: string;
  techStack: string[];
  currentPainPoints: string[];
  competitorsEvaluated: string[];
  budgetRange: string;
  companyDescription?: string;   // What the company does / product & services offered
  servicesProvided?: string;     // Specific services or products provided
  currentNeeds?: string;         // What they are looking for from vendors
}

export interface Persona {
  id: string;
  name: string;
  title: string;
  company: string;
  avatarUrl: string;
  voiceGender: 'male' | 'female';
  personality: BigFiveTraits;
  behavior: BehavioralMatrix;
  communication: CommunicationStyle;
  knowledge: DomainKnowledge;
  initialState: DynamicState;
  objectionPool: Objection[];
  systemContext: string;
}

export interface FactEntry {
  id: string;
  entity: string;
  value: string;
  disclosedBy: 'user' | 'persona';
  turnIndex: number;
  confidence: number;
}

export interface MemoryStore {
  discoveredPainPoints: string[];
  promisesMade: string[];
  pricingDiscussed: string[];
  keyFacts: FactEntry[];
  contradictionFlags: string[];
}

export interface TelemetryMetrics {
  sttMs: number;
  llmFirstTokenMs: number;
  llmTotalMs: number;
  ttsFirstByteMs: number;
  totalRoundtripMs: number;
  isSub800ms: boolean;
  tokensPerSec: number;
}

export interface ConversationTurn {
  id: string;
  timestamp: number;
  speaker: 'user' | 'persona' | 'system';
  text: string;
  audioDurationMs?: number;
  wasInterrupted?: boolean;
  hesitationsDetected?: string[];
  stateDelta?: Partial<DynamicState>;
  telemetry?: TelemetryMetrics;
}

export interface EvaluationCategoryScore {
  score: number; // 0-100
  feedback: string;
  highlights: string[];
  suggestions: string[];
}

export interface TurnEvaluation {
  turnIndex: number;
  rapportScore: number;
  objectionHandlingScore: number;
  pitchClarityScore: number;
  confidenceScore: number;
  activeListeningScore: number;
  coachingTip: string;
  detectedTechnique?: string;
}

export interface PostCallScorecard {
  overallScore: number; // 0-100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  callDurationSeconds: number;
  totalTurns: number;
  categories: {
    rapport: EvaluationCategoryScore;
    objectionHandling: EvaluationCategoryScore;
    pitchClarity: EvaluationCategoryScore;
    confidence: EvaluationCategoryScore;
    activeListening: EvaluationCategoryScore;
  };
  keyWins: string[];
  missedOpportunities: string[];
  actionableRecommendations: string[];
  turnEvaluations: TurnEvaluation[];
}

// CloseIQ /try Flow Types
export interface SellerValueProposition {
  title: string;
  hook: string;
  what_to_mention: string;
  impact_metric: string;
}

export interface SellerActionPlaybook {
  what_to_mention: string[];
  what_to_do: string[];
  what_to_avoid: string[];
  key_differentiators: string[];
}

export interface DealContext {
  deal_id: string;
  target_company: string;
  target_company_url: string;
  target_company_description?: string;
  seller_company: string;
  seller_company_url: string;
  seller_product_name?: string;
  seller_product_description?: string;
  seller_product_summary?: string;
  target_persona: {
    name: string;
    title: string;
    company: string;
    avatarUrl: string;
    voiceGender: 'male' | 'female';
    skepticism_reason?: string;
    winning_criteria?: string;
    personality?: BigFiveTraits;
    behavior?: BehavioralMatrix;
  };
  company_summary: string;
  company_research: {
    industry: string;
    companySize: string;
    techStack: string[];
    initiatives: string[];
  };
  seller_research?: {
    overview?: string;
    key_capabilities?: string[];
    unique_advantages?: string[];
  };
  pain_points: string[];
  buyer_priorities: string[];
  value_proposition: string;
  seller_value_propositions?: SellerValueProposition[];
  seller_action_playbook?: SellerActionPlaybook;
  discovery_questions: string[];
  likely_objections: Array<{
    title: string;
    category: 'pricing' | 'security' | 'timing' | 'competition' | 'complexity' | 'authority';
    description: string;
    suggestedHandling: string;
  }>;
  talking_points: string[];
  call_objective: string;
  sales_playbook?: {
    filename: string;
    summary: string;
    contentSnippet?: string;
  };
  built_persona?: Persona;
  created_at: number;
}

export interface RoleplaySession {
  session_id: string;
  deal_id: string;
  transcript: ConversationTurn[];
  score: number; // 0-100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  strengths: string[];
  weaknesses: string[];
  missed_opportunities: string[];
  missed_objections: string[];
  coaching_feedback: string[];
  buyer_reactions: string[];
  call_progress: number; // 0-100
  scorecard?: PostCallScorecard;
  created_at: number;
}

export interface CopilotCue {
  id: string;
  timestamp: number;
  type: 'objection' | 'coaching_alert' | 'discovery_question' | 'value_prop';
  title: string;
  description: string;
  suggestedAction: string;
  suggestedQuestion?: string;
  relatedPracticeWeakness?: string;
}
