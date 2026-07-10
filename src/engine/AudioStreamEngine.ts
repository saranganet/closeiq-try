import type { Persona, DynamicState } from '../types';
import { HumanConversationEngine } from './HumanConversationEngine';

export interface AudioEngineCallbacks {
  onSTTResult: (text: string, isFinal: boolean) => void;
  onInterruption: () => void;
  onAudioLevel: (level: number) => void;
  onSpeechStarted: () => void;
  onSpeechEnded: () => void;
}

export class AudioStreamEngine {
  private isListening: boolean = false;
  private isSpeaking: boolean = false;

  private recognition: any = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private vadInterval: number | null = null;

  private synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  private callbacks: AudioEngineCallbacks;
  private contextualKeywords: string[] = ['InCruiter', 'CloseIQ'];

  constructor(callbacks: AudioEngineCallbacks) {
    this.callbacks = callbacks;
    this.initSpeechRecognition();
  }

  /**
   * Set dynamic contextual entity keywords (e.g. target company, persona name)
   */
  public setContextualKeywords(keywords: string[]): void {
    this.contextualKeywords = Array.from(new Set([...this.contextualKeywords, ...keywords.filter(Boolean)]));
  }

  /**
   * Intelligent phonetic and speech recognition normalizer.
   * Corrects common acoustic mis-transcriptions (e.g. "include us" -> "InCruiter").
   */
  public normalizeTranscript(text: string): string {
    if (!text) return '';
    let cleaned = text;

    // 1. Target Company Phonetic Corrections (InCruiter, Incruiter)
    cleaned = cleaned.replace(/\b(include us|include a|include or|included us|include\s*is|in recruiter|in-recruiter|in cruiter|in-cruiter|incruitor|incruite|incruiters|in recruiters)\b/gi, (match) => {
      if (/s\b/i.test(match)) return "InCruiter's";
      return 'InCruiter';
    });

    // 2. Query phrasing corrections
    cleaned = cleaned.replace(/\b(what included us|what include us|what include or|what include a)\b/gi, 'what InCruiter');
    cleaned = cleaned.replace(/\b(how included us|how include us|how include or)\b/gi, 'how InCruiter');

    // 3. Seller Product Phonetic Corrections (CloseIQ)
    cleaned = cleaned.replace(/\b(close iq|close eye queue|clothes iq|close icu|closeeq|close-iq)\b/gi, 'CloseIQ');
    cleaned = cleaned.replace(/\b(close iq's|clothes iq's)\b/gi, "CloseIQ's");

    // 4. Common Sales & Persona Terms
    cleaned = cleaned.replace(/\b(sarah chan|sara chen|sara chan)\b/gi, 'Sarah Chen');
    cleaned = cleaned.replace(/\b(gong io|gong\.io)\b/gi, 'Gong');
    cleaned = cleaned.replace(/\b(hire view|hireview)\b/gi, 'HireVue');

    return cleaned;
  }

  /**
   * Initializes Speech Recognition API (WebKitSpeechRecognition / SpeechRecognition)
   */
  private initSpeechRecognition(): void {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        this.callbacks.onSpeechStarted();
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Apply phonetic correction
        const normalizedFinal = this.normalizeTranscript(finalTranscript.trim());
        const normalizedInterim = this.normalizeTranscript(interimTranscript.trim());

        // Full-duplex interruption check: if user speaks while AI is speaking
        if (this.isSpeaking && (normalizedInterim.length > 3 || normalizedFinal.length > 3)) {
          console.log('⚡ Full Duplex Interruption Triggered!');
          this.stopSpeaking();
          this.callbacks.onInterruption();
        }

        if (normalizedFinal) {
          this.callbacks.onSTTResult(normalizedFinal, true);
        } else if (normalizedInterim) {
          this.callbacks.onSTTResult(normalizedInterim, false);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
          this.isListening = false;
        }
      };

      this.recognition.onend = () => {
        // Auto restart if still supposed to be listening
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch {
            // ignore
          }
        }
      };
    }
  }

  /**
   * Starts full-duplex microphone listening + WebAudio VAD meter.
   */
  public async startListening(): Promise<boolean> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      // Start VAD meter loop
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.vadInterval = window.setInterval(() => {
        if (this.analyser) {
          this.analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const normalizedLevel = Math.min(100, Math.round((avg / 128) * 100));
          this.callbacks.onAudioLevel(normalizedLevel);
        }
      }, 50);

      if (this.recognition) {
        try {
          this.recognition.start();
        } catch {
          // Already started
        }
      }

      this.isListening = true;
      return true;
    } catch (err) {
      console.error('Failed to access microphone audio stream:', err);
      return false;
    }
  }

  /**
   * Stop listening and release audio resources.
   */
  public stopListening(): void {
    this.isListening = false;
    if (this.vadInterval) {
      clearInterval(this.vadInterval);
      this.vadInterval = null;
    }
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.callbacks.onAudioLevel(0);
    this.callbacks.onSpeechEnded();
  }

  private activeAudioElement: HTMLAudioElement | null = null;

  /**
   * Speaks text using Deepgram Aura Neural TTS with instant fallback to enhanced browser synthesis.
   */
  public async speak(
    text: string,
    persona: Persona,
    state: DynamicState,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    this.stopSpeaking(); // Cancel any ongoing audio

    // Priority 1: Deepgram Aura Neural Human Voice
    try {
      const response = await fetch('/api/tts/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceGender: persona.voiceGender || 'female',
        }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        this.activeAudioElement = audio;

        audio.onplay = () => {
          this.isSpeaking = true;
          if (onStart) onStart();
        };

        audio.onended = () => {
          this.isSpeaking = false;
          this.activeAudioElement = null;
          URL.revokeObjectURL(audioUrl);
          if (onEnd) onEnd();
        };

        audio.onerror = (e) => {
          console.warn('Deepgram Audio playback error, falling back to browser voice:', e);
          this.activeAudioElement = null;
          URL.revokeObjectURL(audioUrl);
          this.speakFallback(text, persona, state, onStart, onEnd);
        };

        await audio.play();
        return;
      }
    } catch (err) {
      console.warn('Deepgram TTS fetch error, falling back to browser voice:', err);
    }

    // Priority 2: Enhanced Native Browser Speech Fallback
    this.speakFallback(text, persona, state, onStart, onEnd);
  }

  /**
   * Fallback browser voice synthesis
   */
  private speakFallback(
    text: string,
    persona: Persona,
    state: DynamicState,
    onStart?: () => void,
    onEnd?: () => void
  ): void {
    if (!this.synth) {
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    const params = HumanConversationEngine.getSpeechParams(persona, state);
    utterance.rate = Math.min(1.1, Math.max(0.88, params.rate));
    utterance.pitch = persona.voiceGender === 'female' ? Math.min(1.15, params.pitch * 1.05) : Math.max(0.9, params.pitch * 0.95);

    const voices = this.synth.getVoices();
    if (voices.length > 0) {
      const preferred = voices.find(v => 
        persona.voiceGender === 'female' 
          ? /enhanced.*samantha|samantha.*enhanced|ava|karen.*premium|serena|google us english|samantha|victoria|zira|karen/i.test(v.name)
          : /enhanced.*alex|alex.*enhanced|tom|daniel|oliver|google uk english male|alex|david|daniel/i.test(v.name)
      ) || voices.find(v => 
        persona.voiceGender === 'female' ? /female|woman/i.test(v.name) : /male|man/i.test(v.name)
      ) || voices[0];

      if (preferred) utterance.voice = preferred;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('TTS Speech Synthesis error:', e);
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    this.synth.speak(utterance);
  }

  /**
   * Instantly stops audio playback when interrupted.
   */
  public stopSpeaking(): void {
    if (this.activeAudioElement) {
      this.activeAudioElement.pause();
      this.activeAudioElement.currentTime = 0;
      this.activeAudioElement = null;
    }
    if (this.synth) {
      this.synth.cancel();
    }
    if (this.currentUtterance) {
      this.currentUtterance = null;
    }
    this.isSpeaking = false;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}
