import type { Persona, DynamicState } from '../types';

export class HumanConversationEngine {
  private static INTERRUPTION_BREAKINS = [
    "Hold on a second—",
    "Wait, let me stop you right there.",
    "Sorry to interrupt, but—",
    "Hang on, ",
    "Look, before you keep going—",
  ];

  /**
   * Post-processes persona response text to inject human conversation patterns.
   */
  public static applyHumanSpeechPatterns(
    rawText: string,
    persona: Persona,
    _state: DynamicState,
    wasInterrupted: boolean
  ): { formattedText: string; hesitationUsed?: string } {
    let text = rawText.trim();

    // 1. If user interrupted persona on previous turn or rep was rambling, lead with interruption break-in
    if (wasInterrupted) {
      const breakIn = this.INTERRUPTION_BREAKINS[Math.floor(Math.random() * this.INTERRUPTION_BREAKINS.length)];
      text = `${breakIn} ${text.charAt(0).toLowerCase() + text.slice(1)}`;
      return { formattedText: text, hesitationUsed: breakIn };
    }

    // 2. Enforce natural concise response constraint (max 3 sentences) only if excessively long
    if (text.length > 350 && persona?.communication?.sentenceLengthTarget !== 'detailed') {
      const sentences = text.split(/(?<=[.!?])\s+/);
      if (sentences.length > 3) {
        text = sentences.slice(0, 3).join(' ').trim();
      }
    }

    // 3. Clean and polish text for natural speech synthesis
    text = text.replace(/—/g, ', ').replace(/\s{2,}/g, ' ').trim();

    return { formattedText: text };
  }

  /**
   * Generates a rapid interruption statement if user rambles or persona patience drops below threshold mid-turn.
   */
  public static generateInterruptionStatement(persona: Persona): string {
    const options = [
      `Hold on, ${persona.name.split(' ')[0]} here—let's focus on the main point.`,
      `Wait, let me jump in. How does this solve my immediate issue?`,
      `Hang on a second. Give me the short version.`,
      `Sorry to cut you off, but we're getting off track.`,
    ];
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Calculate speech synthesis prosody parameters.
   */
  public static getSpeechParams(persona: Persona, state: DynamicState): { rate: number; pitch: number } {
    let rate = persona.communication.speechRateMultiplier;
    let pitch = 1.0;

    // Mood adjustments
    if (state.mood === 'frustrated') {
      rate *= 1.15;
      pitch *= 1.05;
    } else if (state.mood === 'defensive') {
      rate *= 0.95;
      pitch *= 0.95;
    } else if (state.mood === 'delighted' || state.mood === 'curious') {
      rate *= 1.05;
      pitch *= 1.08;
    }

    return {
      rate: Math.min(1.4, Math.max(0.7, rate)),
      pitch: Math.min(1.3, Math.max(0.7, pitch)),
    };
  }
}
