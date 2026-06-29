import type { DynamicState, Persona, MoodState } from '../types';

export class StateEngine {
  /**
   * Evaluate user input and compute updated dynamic state variables for current turn.
   */
  public static computeTurnState(
    persona: Persona,
    currentState: DynamicState,
    userText: string,
    wasInterrupted: boolean,
    speechDurationSeconds: number
  ): { nextState: DynamicState; delta: Partial<DynamicState>; log: string[] } {
    const textLower = userText.toLowerCase();
    const logs: string[] = [];
    
    // Copy current state
    let trust = currentState.trustScore;
    let mood = currentState.mood;
    let patience = currentState.patienceLevel;
    let buyingIntent = currentState.buyingIntent;
    let perceivedValue = currentState.perceivedValue;
    let risk = currentState.riskPerception;
    const turn = currentState.turnCount + 1;
    
    let activeObjs = [...currentState.activeObjections];
    let resolvedObjs = [...currentState.resolvedObjections];

    // 1. Patience Decay / Bonus based on turn length & conciseness
    const wordCount = userText.trim().split(/\s+/).length;
    if (wordCount > 60 || speechDurationSeconds > 12) {
      const penalty = Math.min(25, Math.floor((wordCount - 50) / 4) * persona.behavior.patienceDecayRate / 3);
      patience = Math.max(0, patience - penalty);
      logs.push(`Patience dropped by ${penalty.toFixed(0)} due to long rambling response (${wordCount} words).`);
    } else if (wordCount >= 10 && wordCount <= 35) {
      patience = Math.min(100, patience + 4);
      logs.push(`Patience boosted by +4 for concise, direct reply.`);
    }

    // Interruption penalty/adjustment
    if (wasInterrupted) {
      if (persona.communication.interruptionSensitivity > 70) {
        trust = Math.max(0, trust - 6);
        patience = Math.max(0, patience - 10);
        logs.push(`Interruption penalty: Trust -6, Patience -10.`);
      }
    }

    // 2. Keyword & Intent Heuristics for Trust & Value
    // Positive sales signals: Empathy, Data/Metrics, Asking open questions, ROI, Social proof, Security compliance
    const empathyMarkers = ['understand', 'makes sense', 'valid concern', 'i hear you', 'fair point', 'absolutely'];
    const metricMarkers = ['percent', '%', 'roi', 'metrics', 'case study', 'benchmark', 'saving', 'dollars', 'hours'];
    const securityMarkers = ['soc2', 'encryption', 'compliance', 'privacy', 'gdpr', 'hipaa', 'isolated', 'security'];
    const priceHandlingMarkers = ['guarantee', 'tier', 'custom', 'roi', 'worth', 'value', 'flexible', 'discount'];

    let empathyHits = empathyMarkers.filter(m => textLower.includes(m)).length;
    let metricHits = metricMarkers.filter(m => textLower.includes(m)).length;
    let securityHits = securityMarkers.filter(m => textLower.includes(m)).length;

    // Directness bonus
    if (persona.behavior.directness > 75 && empathyHits > 0) {
      trust += empathyHits * 5;
      logs.push(`Empathy recognized: Trust +${empathyHits * 5}`);
    }

    if (persona.behavior.technicalDepth > 70 && metricHits > 0) {
      perceivedValue = Math.min(100, perceivedValue + metricHits * 8);
      trust = Math.min(100, trust + metricHits * 4);
      logs.push(`Technical/metric proof provided: Value +${metricHits * 8}`);
    }

    if (persona.behavior.riskAversion > 75 && securityHits > 0) {
      risk = Math.max(0, risk - securityHits * 12);
      trust = Math.min(100, trust + securityHits * 8);
      logs.push(`Security/compliance addressed: Risk -${securityHits * 12}, Trust +${securityHits * 8}`);
    }

    // 3. Objection Resolution Check
    activeObjs = activeObjs.filter(obj => {
      let resolved = false;
      const criteriaLower = obj.resolutionCriteria.toLowerCase();
      const criteriaWords = criteriaLower.split(/\s+/).filter(w => w.length > 3);
      const matchesCriteria = criteriaWords.filter(w => textLower.includes(w)).length >= 2;
      
      // Heuristic resolution match
      if (
        matchesCriteria ||
        (obj.category === 'security' && securityHits > 0) ||
        (obj.category === 'pricing' && priceHandlingMarkers.some(p => textLower.includes(p))) ||
        (obj.category === 'complexity' && (textLower.includes('onboarding') || textLower.includes('downtime') || textLower.includes('migration') || textLower.includes('easy'))) ||
        (obj.category === 'competition' && (textLower.includes('versus') || textLower.includes('differs') || textLower.includes('unlike') || textLower.includes('practice')))
      ) {
        resolved = true;
      }

      if (resolved) {
        obj.isResolved = true;
        resolvedObjs.push(obj);
        trust = Math.min(100, trust + 12);
        buyingIntent = Math.min(100, buyingIntent + 15);
        logs.push(`Objection Resolved: "${obj.title}"! Trust +12, Buying Intent +15`);
        return false; // remove from active
      }
      return true; // keep in active
    });

    // 4. Trigger Hidden/Pool Objections if thresholds met
    persona.objectionPool.forEach(poolObj => {
      if (!activeObjs.some(a => a.id === poolObj.id) && !resolvedObjs.some(r => r.id === poolObj.id)) {
        let shouldTrigger = false;
        if (poolObj.triggerThreshold.maxTrust !== undefined && trust <= poolObj.triggerThreshold.maxTrust) {
          shouldTrigger = true;
        }
        if (poolObj.triggerThreshold.minPatience !== undefined && patience <= poolObj.triggerThreshold.minPatience) {
          shouldTrigger = true;
        }
        if (poolObj.triggerThreshold.keywordTriggers?.some(k => textLower.includes(k))) {
          shouldTrigger = true;
        }

        if (shouldTrigger) {
          activeObjs.push({ ...poolObj });
          logs.push(`New Objection Triggered: "${poolObj.title}"`);
        }
      }
    });

    // 5. Buying Intent Formula
    buyingIntent = Math.round(
      (trust * 0.35) + 
      (perceivedValue * 0.35) + 
      ((100 - risk) * 0.20) + 
      (patience * 0.10)
    );

    // 6. Mood State Machine Calculation
    mood = this.calculateMood(trust, patience, risk, activeObjs.length, persona);

    const nextState: DynamicState = {
      trustScore: Math.round(Math.max(0, Math.min(100, trust))),
      mood,
      patienceLevel: Math.round(Math.max(0, Math.min(100, patience))),
      buyingIntent: Math.round(Math.max(0, Math.min(100, buyingIntent))),
      perceivedValue: Math.round(Math.max(0, Math.min(100, perceivedValue))),
      riskPerception: Math.round(Math.max(0, Math.min(100, risk))),
      turnCount: turn,
      activeObjections: activeObjs,
      resolvedObjections: resolvedObjs,
    };

    const delta: Partial<DynamicState> = {
      trustScore: nextState.trustScore - currentState.trustScore,
      patienceLevel: nextState.patienceLevel - currentState.patienceLevel,
      buyingIntent: nextState.buyingIntent - currentState.buyingIntent,
      mood: nextState.mood,
    };

    return { nextState, delta, log: logs };
  }

  private static calculateMood(
    trust: number,
    patience: number,
    risk: number,
    activeObjectionsCount: number,
    persona: Persona
  ): MoodState {
    if (patience < 25) return 'frustrated';
    if (risk > 80 && persona.behavior.riskAversion > 70) return 'defensive';
    if (trust < 35) return 'skeptical';
    if (trust >= 75 && patience >= 70 && activeObjectionsCount === 0) return 'convinced';
    if (trust >= 60 && patience >= 50) return 'delighted';
    if (trust >= 45) return 'curious';
    return 'neutral';
  }
}
