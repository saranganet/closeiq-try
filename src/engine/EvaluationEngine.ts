import type { Persona, DynamicState, TurnEvaluation, PostCallScorecard, ConversationTurn, EvaluationCategoryScore } from '../types';

export class EvaluationEngine {
  private turnEvaluations: TurnEvaluation[] = [];

  /**
   * Evaluates a single turn asynchronously without blocking or altering persona state.
   */
  public evaluateTurn(
    turnIndex: number,
    userText: string,
    _personaResponseText: string,
    persona: Persona,
    state: DynamicState,
    _memoryContext: string,
    _apiKey?: string
  ): TurnEvaluation {
    const textLower = userText.toLowerCase();

    // 1. Rapport Building Score (Empathy, validation, warm tone, active listening)
    let rapport = 50;
    if (/understand|makes sense|fair point|i hear you|valid concern|appreciate/i.test(textLower)) rapport += 25;
    if (userText.includes('?')) rapport += 15; // Asking open questions builds rapport
    if (userText.length > 300) rapport -= 15; // Overly long speeches reduce rapport
    rapport = Math.min(100, Math.max(10, rapport));

    // 2. Objection Handling Score
    let objectionScore = 50;
    if (state.activeObjections.length > 0) {
      const activeObj = state.activeObjections[0];
      if (textLower.includes(activeObj.category) || textLower.includes('security') || textLower.includes('cost') || textLower.includes('time') || textLower.includes('risk')) {
        objectionScore += 30;
      }
      if (state.resolvedObjections.length > 0) objectionScore += 20;
    } else {
      objectionScore = 75; // Baseline when no active objections
    }
    objectionScore = Math.min(100, Math.max(10, objectionScore));

    // 3. Pitch Clarity & Value Score
    let pitchScore = 50;
    if (/\d+%/i.test(textLower) || /\$\d+/i.test(textLower) || /roi|saving|metrics|case study|proven/i.test(textLower)) {
      pitchScore += 30;
    }
    if (userText.split(' ').length >= 10 && userText.split(' ').length <= 40) {
      pitchScore += 15; // Concise value pitch
    }
    pitchScore = Math.min(100, Math.max(10, pitchScore));

    // 4. Confidence & Tone Score
    let confidenceScore = 60;
    if (/um|uh|i think|maybe|sort of|kind of|i guess/i.test(textLower)) confidenceScore -= 25;
    if (/definitely|guaranteed|proven|absolutely|our platform|we deliver/i.test(textLower)) confidenceScore += 25;
    confidenceScore = Math.min(100, Math.max(10, confidenceScore));

    // 5. Active Listening Score
    let activeListeningScore = 50;
    persona.knowledge.currentPainPoints.forEach(pain => {
      const painWords = pain.toLowerCase().split(' ');
      if (painWords.some(w => w.length > 4 && textLower.includes(w))) {
        activeListeningScore += 20;
      }
    });
    activeListeningScore = Math.min(100, Math.max(10, activeListeningScore));

    // Coaching Tip & Technique Detector
    let coachingTip = "Keep your response concise and focus on quantifiable value.";
    let detectedTechnique: string | undefined = undefined;

    if (rapport > 80 && objectionScore > 75) {
      coachingTip = "Excellent rapport & objection reframing! Pivot to asking for a commitment or next steps.";
      detectedTechnique = "Empathy & Value-Bridging";
    } else if (confidenceScore < 50) {
      coachingTip = "Avoid filler words like 'kind of' or 'maybe'. Speak with firm authority about your product's capabilities.";
      detectedTechnique = "Hesitation Reduction Needed";
    } else if (state.patienceLevel < 40) {
      coachingTip = `${persona.name} is losing patience. Stop lecturing and ask a direct 1-sentence question.`;
      detectedTechnique = "Patience Recovery Protocol";
    } else if (state.activeObjections.length > 0) {
      const obj = state.activeObjections[0];
      coachingTip = `Address ${persona.name}'s objection ("${obj.title}") directly before pushing feature details.`;
      detectedTechnique = "Objection Acknowledgment";
    }

    const evaluation: TurnEvaluation = {
      turnIndex,
      rapportScore: Math.round(rapport),
      objectionHandlingScore: Math.round(objectionScore),
      pitchClarityScore: Math.round(pitchScore),
      confidenceScore: Math.round(confidenceScore),
      activeListeningScore: Math.round(activeListeningScore),
      coachingTip,
      detectedTechnique,
    };

    this.turnEvaluations.push(evaluation);
    return evaluation;
  }

  /**
   * Generates the final post-call scorecard after roleplay simulation ends.
   */
  public generatePostCallScorecard(
    persona: Persona,
    finalState: DynamicState,
    turns: ConversationTurn[],
    callDurationSeconds: number
  ): PostCallScorecard {
    const totalTurns = this.turnEvaluations.length || 1;

    const avgRapport = Math.round(this.turnEvaluations.reduce((acc, t) => acc + t.rapportScore, 0) / totalTurns || 65);
    const avgObjection = Math.round(this.turnEvaluations.reduce((acc, t) => acc + t.objectionHandlingScore, 0) / totalTurns || 60);
    const avgClarity = Math.round(this.turnEvaluations.reduce((acc, t) => acc + t.pitchClarityScore, 0) / totalTurns || 70);
    const avgConfidence = Math.round(this.turnEvaluations.reduce((acc, t) => acc + t.confidenceScore, 0) / totalTurns || 68);
    const avgListening = Math.round(this.turnEvaluations.reduce((acc, t) => acc + t.activeListeningScore, 0) / totalTurns || 62);

    // Weighted Overall Score
    const overallScore = Math.round(
      (avgRapport * 0.20) +
      (avgObjection * 0.30) +
      (avgClarity * 0.20) +
      (avgConfidence * 0.15) +
      (avgListening * 0.15)
    );

    let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'B';
    if (overallScore >= 93) grade = 'A+';
    else if (overallScore >= 85) grade = 'A';
    else if (overallScore >= 75) grade = 'B';
    else if (overallScore >= 65) grade = 'C';
    else if (overallScore >= 50) grade = 'D';
    else grade = 'F';

    const rapportCategory: EvaluationCategoryScore = {
      score: avgRapport,
      feedback: avgRapport >= 80 ? "Strong empathy and warm customer validation throughout call." : "Needs stronger empathy statements when prospect expresses hesitation.",
      highlights: ["Validated customer concerns early", "Maintained positive conversational tone"],
      suggestions: ["Use prospect's exact phraseology when summarizing pain points"],
    };

    const objectionCategory: EvaluationCategoryScore = {
      score: avgObjection,
      feedback: finalState.resolvedObjections.length > 0 
        ? `Successfully resolved ${finalState.resolvedObjections.length} key objection(s).` 
        : "Failed to fully resolve primary objections before closing.",
      highlights: finalState.resolvedObjections.map(o => `Resolved: ${o.title}`),
      suggestions: ["Acknowledge the objection first before immediately counter-arguing"],
    };

    const pitchCategory: EvaluationCategoryScore = {
      score: avgClarity,
      feedback: avgClarity >= 75 ? "Clear, concise value proposition with good metric density." : "Pitch was occasionally too long or lacked concrete metrics.",
      highlights: ["Kept response lengths concise"],
      suggestions: ["Incorporate specific customer case studies with ROI percentages"],
    };

    const confidenceCategory: EvaluationCategoryScore = {
      score: avgConfidence,
      feedback: avgConfidence >= 70 ? "Decisive tone and authoritative product domain knowledge." : "Slight hesitation detected in handling technical or pricing questions.",
      highlights: ["Firm closing statements"],
      suggestions: ["Eliminate low-confidence phrases like 'I think' or 'maybe'"],
    };

    const listeningCategory: EvaluationCategoryScore = {
      score: avgListening,
      feedback: avgListening >= 75 ? "Directly referenced customer pain points and tech stack." : "Opportunity to probe deeper into customer pain points.",
      highlights: [`Addressed ${persona.company}'s specific profile`],
      suggestions: ["Ask open-ended discovery questions to uncover hidden objections"],
    };

    const keyWins = [
      `Maintained Trust score at ${finalState.trustScore}/100.`,
      `Final Buying Intent reached ${finalState.buyingIntent}/100.`,
      ...finalState.resolvedObjections.map(o => `Resolved objection: ${o.title}`),
    ];

    const missedOpportunities = [
      ...(finalState.activeObjections.map(o => `Unresolved objection: ${o.title}`)),
      ...(finalState.patienceLevel < 50 ? ["Prospect patience dropped below 50% due to lengthy turns."] : []),
    ];

    const actionableRecommendations = [
      `For ${persona.title} prospects like ${persona.name}, open with 1 sentence of validation followed by a specific metric.`,
      `When handling ${persona.objectionPool[0]?.category || 'pricing'} objections, use the 'Acknowledge -> Reframe -> Proof' framework.`,
      `Target response durations under 10 seconds to maintain sub-800ms full-duplex conversational rhythm.`,
    ];

    return {
      overallScore,
      grade,
      callDurationSeconds,
      totalTurns: turns.length,
      categories: {
        rapport: rapportCategory,
        objectionHandling: objectionCategory,
        pitchClarity: pitchCategory,
        confidence: confidenceCategory,
        activeListening: listeningCategory,
      },
      keyWins,
      missedOpportunities,
      actionableRecommendations,
      turnEvaluations: this.turnEvaluations,
    };
  }

  public reset(): void {
    this.turnEvaluations = [];
  }
}
