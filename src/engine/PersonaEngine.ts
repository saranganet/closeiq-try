import type { Persona, DynamicState, ConversationTurn } from '../types';
import { HumanConversationEngine } from './HumanConversationEngine';
import { GoogleGenAI } from '@google/genai';

export class PersonaEngine {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  public setApiKey(key: string): void {
    this.apiKey = key;
  }

  /**
   * Generates persona response in real time by calling the Backend API endpoint (/api/persona/chat)
   * powered by Groq Llama-3.3-70B, with automatic client-side fallback engines.
   */
  public async streamResponse(
    persona: Persona,
    state: DynamicState,
    memoryContext: string,
    history: ConversationTurn[],
    userText: string,
    wasInterrupted: boolean,
    onChunk: (chunk: string) => void,
    onFirstToken?: () => void
  ): Promise<{ fullText: string; hesitationUsed?: string }> {
    let rawResponse = '';
    let firstTokenFired = false;
    let backendSuccess = false;

    // 1. Primary Route: Call Backend Express / Vite API (/api/persona/chat)
    try {
      rawResponse = await this.streamBackendGroqAPI(
        persona,
        state,
        memoryContext,
        history,
        userText,
        this.apiKey,
        (chunk) => {
          if (!firstTokenFired) {
            firstTokenFired = true;
            if (onFirstToken) onFirstToken();
          }
          onChunk(chunk);
        }
      );
      if (rawResponse.trim().length > 0) {
        backendSuccess = true;
      }
    } catch (err) {
      console.warn('Backend Groq API endpoint unavailable or unconfigured, trying fallback engines:', err);
    }

    // 2. Secondary Fallback Routes (Direct Groq / Direct Gemini / Fast Client Synthesizer)
    if (!backendSuccess) {
      const systemPrompt = this.buildHumanPersonaSystemPrompt(persona, state, memoryContext);
      const cleanKey = this.apiKey?.trim() || '';

      if (cleanKey.startsWith('gsk_')) {
        try {
          rawResponse = await this.streamDirectGroqAPI(cleanKey, systemPrompt, history, userText, (chunk) => {
            if (!firstTokenFired) {
              firstTokenFired = true;
              if (onFirstToken) onFirstToken();
            }
            onChunk(chunk);
          });
        } catch {
          rawResponse = await this.generateFastClientFallback(persona, state, userText, history, onChunk, onFirstToken);
        }
      } else if (cleanKey.startsWith('AIza') || cleanKey.length > 10) {
        try {
          const ai = new GoogleGenAI({ apiKey: cleanKey });
          const responseStream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: [
              { role: 'user', parts: [{ text: systemPrompt }] },
              ...history.slice(-6).map(h => ({
                role: h.speaker === 'user' ? 'user' : 'model',
                parts: [{ text: h.text }]
              })),
              { role: 'user', parts: [{ text: userText }] }
            ],
            config: { temperature: 0.8, maxOutputTokens: 100 }
          });
          for await (const chunk of responseStream) {
            if (!firstTokenFired) {
              firstTokenFired = true;
              if (onFirstToken) onFirstToken();
            }
            const textChunk = chunk.text || '';
            rawResponse += textChunk;
            onChunk(textChunk);
          }
        } catch {
          rawResponse = await this.generateFastClientFallback(persona, state, userText, history, onChunk, onFirstToken);
        }
      } else {
        rawResponse = await this.generateFastClientFallback(persona, state, userText, history, onChunk, onFirstToken);
      }
    }

    // Apply human conversation speech post-processing
    const { formattedText, hesitationUsed } = HumanConversationEngine.applyHumanSpeechPatterns(
      rawResponse,
      persona,
      state,
      wasInterrupted
    );

    return { fullText: formattedText, hesitationUsed };
  }

  /**
   * Calls the Backend Server Endpoint (/api/persona/chat) which securely executes Groq API queries.
   */
  private async streamBackendGroqAPI(
    persona: Persona,
    state: DynamicState,
    memoryContext: string,
    history: ConversationTurn[],
    userText: string,
    customApiKey: string | undefined,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const response = await fetch('/api/persona/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        persona,
        state,
        memoryContext,
        history,
        userText,
        customApiKey,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend API returned HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response body is empty');

    const decoder = new TextDecoder('utf-8');
    let fullResponse = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;

        if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            const deltaContent = parsed.choices?.[0]?.delta?.content || '';
            if (deltaContent) {
              fullResponse += deltaContent;
              onChunk(deltaContent);
            }
          } catch {
            // ignore partial SSE json lines
          }
        }
      }
    }

    return fullResponse;
  }

  /**
   * Direct client Groq API fallback.
   */
  private async streamDirectGroqAPI(
    groqKey: string,
    systemPrompt: string,
    history: ConversationTurn[],
    userText: string,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map(h => ({
        role: h.speaker === 'user' ? 'user' : 'assistant',
        content: h.text
      })),
      { role: 'user', content: userText }
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages,
        temperature: 0.7,
        max_tokens: 350,
        stream: true,
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API returned HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Groq response body is empty');

    const decoder = new TextDecoder('utf-8');
    let fullResponse = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;

        if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            const deltaContent = parsed.choices?.[0]?.delta?.content || '';
            if (deltaContent) {
              fullResponse += deltaContent;
              onChunk(deltaContent);
            }
          } catch {}
        }
      }
    }

    return fullResponse;
  }

  /**
   * Fast client-side fallback synthesizer.
   */
  private async generateFastClientFallback(
    persona: Persona,
    state: DynamicState,
    _userText: string,
    _history: ConversationTurn[],
    onChunk: (chunk: string) => void,
    onFirstToken?: () => void
  ): Promise<string> {
    let responseTemplates: string[] = [];

    const k = persona.knowledge;
    const companyInfo = k.companyDescription || `our operations at ${persona.company}`;
    const needInfo = k.currentNeeds || (k.currentPainPoints.length > 0 ? k.currentPainPoints[0] : 'improving our current workflow');

    if (state.activeObjections.length > 0 && Math.random() < 0.65) {
      const activeObj = state.activeObjections[0];
      if (activeObj.category === 'security') {
        responseTemplates = [
          `At ${persona.company}, security is top priority for us. How do you guarantee SOC2 Type II compliance and isolated data encryption?`,
          `Before we move forward, I need to know: how does your platform protect our sensitive operational data?`,
        ];
      } else if (activeObj.category === 'pricing') {
        responseTemplates = [
          `That sounds interesting, but we have strict budget constraints. Can you break down the pricing and show me the clear ROI?`,
          `How does your pricing scale as our transaction volume grows? We can't afford unpredictable overage fees.`,
        ];
      } else if (activeObj.category === 'complexity') {
        responseTemplates = [
          `Our team can't afford a lengthy migration right now. What does the actual onboarding and setup timeline look like?`,
          `We already have an established tech stack. How easily does your solution integrate with our existing workflow?`,
        ];
      } else if (activeObj.category === 'competition') {
        responseTemplates = [
          `We're currently evaluating a couple of vendors in your space. What specifically sets your solution apart?`,
          `Why should we choose your platform over sticking with our current provider?`,
        ];
      }
    }

    if (responseTemplates.length === 0) {
      if (state.mood === 'frustrated' || state.patienceLevel < 35) {
        responseTemplates = [
          `Look, let's cut to the chase. How specifically does this help ${companyInfo}?`,
          `You're giving me a lot of general pitch points. What is the single biggest advantage for my team right now?`,
        ];
      } else if (state.mood === 'curious' || state.trustScore > 60) {
        responseTemplates = [
          `That actually makes a lot of sense for us. Can you walk me through how another customer in our space used this?`,
          `I like where this is going. What would onboarding look like if we decided to move forward?`,
        ];
      } else if (state.mood === 'convinced') {
        responseTemplates = [
          `You've addressed my key concerns. Send over a formal proposal so I can review it with our team.`,
          `Alright, I'm aligned. What are the next steps to start a pilot or trial?`,
        ];
      } else {
        responseTemplates = [
          `I see what you mean, but considering ${needInfo}, how exactly does your solution fit into our daily operations?`,
          `Walk me through the concrete impact. How will this reduce our current operational overhead?`,
        ];
      }
    }

    const chosenText = responseTemplates[Math.floor(Math.random() * responseTemplates.length)];
    const words = chosenText.split(' ');

    let full = '';
    for (let i = 0; i < words.length; i++) {
      if (i === 0 && onFirstToken) onFirstToken();
      const wordChunk = (i === 0 ? '' : ' ') + words[i];
      full += wordChunk;
      onChunk(wordChunk);
      await new Promise(res => setTimeout(res, 20 + Math.random() * 25));
    }

    return full;
  }

  private buildHumanPersonaSystemPrompt(
    persona: Persona,
    state: DynamicState,
    memoryContext: string
  ): string {
    const k = persona.knowledge;

    return `
You are strictly roleplaying as ${persona.name}, ${persona.title} at ${persona.company}.
This is a live SCHEDULED discovery phone / Zoom call with a sales representative from CloseIQ.

CRITICAL DIRECTIVE: ULTRA-SHORT, PUNCHY PHONE CONVERSATION
1. STRICT SPOKEN BREVITY (UNDER 20-25 WORDS MAX):
   - Real humans on phone calls speak in rapid, concise conversational bursts (1 to 2 short sentences max).
   - NEVER recite long marketing paragraphs, lists of features, or multi-clause descriptions.
   - Be concise and punchy: give a quick 1-sentence answer and hand the mic back to the rep.
   - Example when asked about your company: "Yeah, sure—at InCruiter we provide AI interview automation to help companies screen candidates 4x faster. What's on your agenda today?" (23 words).

2. WARM, REALISTIC CALL OPENINGS (Turns 1-2):
   - If the rep says hello or asks how you are ("hi", "how are you doing", "good morning"):
     Respond with natural, friendly warmth: "Hey! Doing well, thanks. How are you doing today?"

3. SKEPTICISM & BUYER EVALUATION (Later Turns):
   - Ask about tangible ROI, integration, and differences from Gong in quick 1-sentence questions.

4. VOICE RECOGNITION ACOUSTIC TOLERANCE:
   - The caller speaks via live microphone speech-to-text.
   - Recognize that words like "include us", "in recruiter", "include a", or "include or" mean your company (${persona.company}).
   - NEVER question minor phonetic slips or say "what do you mean by include us". Seamlessly interpret their true business intent.

COMPANY CONTEXT:
- Company: ${persona.company} (${k.companySize || 'Enterprise'}, Industry: ${k.industry || 'Technology'})
- What You Do: ${k.companyDescription || k.servicesProvided || 'AI candidate screening, automated video assessments, and Interview-as-a-Service.'}
- Current Needs & Pain Points: ${k.currentNeeds || (k.currentPainPoints.length > 0 ? k.currentPainPoints.join(' | ') : 'Sales ramp times and high recruiter workload')}
- Current Mood: ${state.mood.toUpperCase()} (Trust: ${state.trustScore}/100).

PERSONA PROFILE:
- Personality: Openness ${persona.personality.openness}%, Conscientiousness ${persona.personality.conscientiousness}%, Agreeableness ${persona.personality.agreeableness}%.
- Behavioral Matrix: Directness ${persona.behavior.directness}/100, Price Sensitivity ${persona.behavior.priceSensitivity}/100, Technical Depth ${persona.behavior.technicalDepth}/100.

${memoryContext}
`.trim();
  }
}
