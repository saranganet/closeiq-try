import type { MemoryStore, FactEntry, Persona } from '../types';

export class MemoryEngine {
  private store: MemoryStore = {
    discoveredPainPoints: [],
    promisesMade: [],
    pricingDiscussed: [],
    keyFacts: [],
    contradictionFlags: [],
  };

  public getMemory(): MemoryStore {
    return { ...this.store };
  }

  /**
   * Process a turn to extract facts and check memory consistency.
   */
  public processTurn(
    turnIndex: number,
    speaker: 'user' | 'persona',
    text: string,
    _persona: Persona
  ): { contradictionsFound: string[]; newFactsExtracted: FactEntry[] } {
    const textLower = text.toLowerCase();
    const newFacts: FactEntry[] = [];
    const contradictions: string[] = [];

    // Extract Pricing Numbers
    const priceMatch = text.match(/(\$\d+[\d,]*|\d+\s*(dollars|k|percent|%))/gi);
    if (priceMatch) {
      priceMatch.forEach(p => {
        if (!this.store.pricingDiscussed.includes(p)) {
          this.store.pricingDiscussed.push(p);
          const fact: FactEntry = {
            id: `fact-price-${Date.now()}-${Math.random()}`,
            entity: 'Pricing Figure',
            value: p,
            disclosedBy: speaker,
            turnIndex,
            confidence: 0.9,
          };
          this.store.keyFacts.push(fact);
          newFacts.push(fact);
        }
      });
    }

    // Extract Feature / SLA / Security Promises made by user
    const promiseKeywords = ['guarantee', 'we promise', 'we provide', 'included free', '24/7', 'zero downtime', 'soc2 certified', 'custom integration'];
    promiseKeywords.forEach(pk => {
      if (textLower.includes(pk) && speaker === 'user') {
        if (!this.store.promisesMade.includes(pk)) {
          this.store.promisesMade.push(pk);
          const fact: FactEntry = {
            id: `fact-promise-${Date.now()}-${Math.random()}`,
            entity: 'Seller Commitment',
            value: pk,
            disclosedBy: 'user',
            turnIndex,
            confidence: 0.95,
          };
          this.store.keyFacts.push(fact);
          newFacts.push(fact);
        }
      }
    });

    // Check Contradictions
    if (speaker === 'user') {
      // E.g., if seller says "no SOC2" after earlier claiming "SOC2 certified"
      if (textLower.includes('no soc2') || textLower.includes('not soc2')) {
        if (this.store.promisesMade.some(p => p.includes('soc2'))) {
          const flag = `Contradiction detected at turn ${turnIndex}: Rep previously promised SOC2 certification but now stated lack of compliance.`;
          this.store.contradictionFlags.push(flag);
          contradictions.push(flag);
        }
      }
    }

    return { contradictionsFound: contradictions, newFactsExtracted: newFacts };
  }

  /**
   * Returns a concise summary of remembered facts formatted for system prompt context.
   */
  public getMemoryContextPrompt(): string {
    const factsSummary = this.store.keyFacts.map(f => `- [${f.disclosedBy.toUpperCase()}] ${f.entity}: ${f.value}`).join('\n');
    const contradictions = this.store.contradictionFlags.map(c => `⚠️ ${c}`).join('\n');

    return `
[CONVERSATION MEMORY]
Facts Disclosed & Commitments Made:
${factsSummary || 'None yet.'}

${contradictions ? `Contradictions Detected:\n${contradictions}` : ''}
`.trim();
  }
}
