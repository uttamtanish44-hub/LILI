/**
 * LILI Audio & Speech Engine
 * Web Audio API synthesizer for sci-fi UI sound effects
 * Web Speech API wrapper for LILI's female voice synthesis
 */

class SoundEffects {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Sci-fi UI click chime
  playClick() {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  // Wake Word / Voice Activation Beep
  playWakeBeep() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.setValueAtTime(659.25, now + 0.08); // E5
    osc1.frequency.setValueAtTime(783.99, now + 0.16); // G5
    osc1.frequency.setValueAtTime(1046.50, now + 0.24); // C6

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1046.50, now + 0.24);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  }

  // Command Execution Success Chime
  playSuccess() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.setValueAtTime(1760, now + 0.1); // A6
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Thinking Hum Effect
  playThinking() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(440, now + 0.15);
    osc.frequency.linearRampToValueAtTime(330, now + 0.3);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Security / Warning Alert
  playWarning() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(220, now + 0.1);
    osc.frequency.setValueAtTime(440, now + 0.2);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Processing Beep Effect
  playProcessingBeep() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Futuristic Boot Sequence Sound
  playBoot() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    // Sub bass sweep
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(60, now);
    subOsc.frequency.exponentialRampToValueAtTime(180, now + 0.8);
    subGain.gain.setValueAtTime(0.2, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 1.2);

    // High shimmer
    const shimmer = ctx.createOscillator();
    const shimGain = ctx.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(1200, now + 0.3);
    shimmer.frequency.exponentialRampToValueAtTime(2400, now + 0.9);
    shimGain.gain.setValueAtTime(0.08, now + 0.3);
    shimGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    shimmer.connect(shimGain);
    shimGain.connect(ctx.destination);
    shimmer.start(now + 0.3);
    shimmer.stop(now + 1.0);
  }
}

export const sfx = new SoundEffects();

// Web Speech API Voice Synthesizer
class SpeechEngine {
  private synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private currentPitch: number = 1.08;
  private currentRate: number = 1.22;

  setPitch(pitch: number) {
    this.currentPitch = pitch;
  }

  setRate(rate: number) {
    this.currentRate = rate;
  }

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        // Look for natural female English or Hindi voices
        const femaleVoice = voices.find(v => 
          (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Zira') || v.name.includes('Google UK English Female') || v.name.includes('Google US English') || v.name.includes('Natural')) && v.lang.startsWith('en')
        ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
        
        if (femaleVoice) {
          this.selectedVoice = femaleVoice;
        }
      };

      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }

  speak(
    text: string, 
    options: { pitch?: number; rate?: number; onStart?: () => void; onEnd?: () => void } = {}
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        resolve();
        return;
      }

      this.synth.cancel(); // Stop current speech
      if (this.synth.paused) {
        try {
          this.synth.resume();
        } catch (e) {}
      }

      // Clean text of markdown or special code blocks for speech
      const cleanedText = text
        .replace(/```[\s\S]*?```/g, 'Code block generated.')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/[*#_~]/g, '')
        .trim();

      if (!cleanedText) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      
      // Auto detect Hindi script, Devanagari, or bilingual Hinglish phrasing
      const isHindi =
        /[\u0900-\u097F]/.test(cleanedText) ||
        /\b(namaste|kaise|kya|hai|ho|batao|karo|raha|rahi|samajh|aap|tum|mera|meri|mujhe|chahiye|liya|diya|dekh|suno|kaha|nahi|thik|haan|bolo|karna|karne|kardo|kardiya|karein|chalao|khol|kholo|band|baat|kaun|kaise|kab|kahan|kyun|hun|hoon|kar|karti|karta|shukriya|alvida)\b/i.test(cleanedText);

      const voices = this.synth.getVoices();

      if (isHindi) {
        const hindiVoice =
          voices.find(v => v.lang.startsWith('hi') || v.name.includes('Hindi') || v.name.includes('हिन्दी') || v.name.includes('Google हिन्दी')) ||
          voices.find(v => v.lang.includes('IN')) ||
          this.selectedVoice;
        if (hindiVoice) utterance.voice = hindiVoice;
        utterance.lang = 'hi-IN';
      } else {
        if (this.selectedVoice) utterance.voice = this.selectedVoice;
        utterance.lang = 'en-US';
      }

      utterance.pitch = options.pitch ?? this.currentPitch;
      utterance.rate = options.rate ?? this.currentRate;

      let isFinished = false;
      let safetyTimeout: any = null;

      const finishSpeech = () => {
        if (isFinished) return;
        isFinished = true;
        if (safetyTimeout) clearTimeout(safetyTimeout);
        options.onEnd?.();
        resolve();
      };

      // Safety fallback: resolve promise after calculated duration if browser onend fires late/never
      const estimatedMs = Math.min(15000, Math.max(3000, cleanedText.length * 80 + 2000));
      safetyTimeout = setTimeout(() => {
        if (!isFinished) {
          try {
            if (this.synth) this.synth.cancel();
          } catch (e) {}
          finishSpeech();
        }
      }, estimatedMs);

      utterance.onstart = () => {
        options.onStart?.();
      };

      utterance.onend = () => {
        finishSpeech();
      };

      utterance.onerror = () => {
        finishSpeech();
      };

      try {
        this.synth.speak(utterance);
      } catch (err) {
        finishSpeech();
      }
    });
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

export const tts = new SpeechEngine();
export const speech = tts;
