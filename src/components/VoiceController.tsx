import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Radio, AlertCircle, Play, Send, Globe } from 'lucide-react';
import { AIState } from '../types';
import { sfx, tts } from '../lib/audio';

interface VoiceControllerProps {
  aiState: AIState;
  onTranscript: (text: string) => void;
  onStopSpeech?: () => void;
  onAudioLevel?: (level: number) => void;
  onWakeWordDetected?: () => void;
  wakeWord?: string;
  autoListen?: boolean;
  selectedLanguage?: string;
  onLanguageChange?: (lang: string) => void;
}

export const VoiceController: React.FC<VoiceControllerProps> = ({
  aiState,
  onTranscript,
  onStopSpeech,
  onAudioLevel,
  onWakeWordDetected,
  wakeWord = 'lili',
  autoListen = true,
  selectedLanguage = 'hi-IN',
  onLanguageChange,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [micSupported, setMicSupported] = useState(true);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentLang, setCurrentLang] = useState(selectedLanguage);

  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const shouldListenRef = useRef(true);
  const lastProcessedRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });

  // Mutable refs to prevent stale closures inside speech handlers
  const aiStateRef = useRef(aiState);
  aiStateRef.current = aiState;

  const wakeWordRef = useRef(wakeWord);
  wakeWordRef.current = wakeWord;

  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const onStopSpeechRef = useRef(onStopSpeech);
  onStopSpeechRef.current = onStopSpeech;

  const onWakeWordDetectedRef = useRef(onWakeWordDetected);
  onWakeWordDetectedRef.current = onWakeWordDetected;

  const autoListenRef = useRef(autoListen);
  autoListenRef.current = autoListen;

  const isListeningRef = useRef(isListening);
  isListeningRef.current = isListening;

  const currentLangRef = useRef(currentLang);
  currentLangRef.current = currentLang;

  // Sync external prop language changes
  useEffect(() => {
    if (selectedLanguage && selectedLanguage !== currentLang) {
      setCurrentLang(selectedLanguage);
    }
  }, [selectedLanguage]);

  // Function to stop speech synthesis immediately
  const triggerInstantStop = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    tts.stop();
    onStopSpeechRef.current?.();
  };

  // Change Speech Language and restart recognition instantly
  const handleSelectLanguage = (langCode: string) => {
    sfx.playClick();
    setCurrentLang(langCode);
    onLanguageChange?.(langCode);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = langCode;
        if (isListeningRef.current) {
          recognitionRef.current.stop();
          setTimeout(() => {
            try {
              recognitionRef.current.start();
            } catch (e) {}
          }, 100);
        }
      } catch (e) {}
    }
  };

  const silenceTimerRef = useRef<any>(null);

  // Helper to reset and restart speech recognition engine cleanly
  const resetRecognitionEngine = () => {
    setInterimTranscript('');
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        try {
          recognitionRef.current.abort();
        } catch (err) {}
      }
    }
  };

  // Process and emit recognized speech commands
  const processRecognizedSpeech = (rawText: string) => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    const raw = rawText.trim();
    if (!raw) return;

    // Deduplicate rapid identical speech inputs within 1.5s
    const now = Date.now();
    if (lastProcessedRef.current.text === raw && now - lastProcessedRef.current.time < 1500) {
      return;
    }
    lastProcessedRef.current = { text: raw, time: now };

    const lower = raw.toLowerCase();
    const targetWake = (wakeWordRef.current || 'lili').toLowerCase();

    triggerInstantStop();
    sfx.playSuccess();
    setInterimTranscript('');

    const isFinalStop =
      lower === 'stop' ||
      lower.includes('stop speaking') ||
      lower.includes('stop talking') ||
      lower.includes('be quiet') ||
      lower.includes('shut up') ||
      lower.includes('shutup') ||
      lower.includes('silence') ||
      lower === 'quiet' ||
      lower === 'pause' ||
      lower === 'cancel' ||
      lower === 'halt' ||
      lower.includes('रुको') ||
      lower.includes('चुप');

    if (isFinalStop) {
      onTranscriptRef.current('stop');
      resetRecognitionEngine();
      return;
    }

    if (
      lower.includes(targetWake) ||
      lower.includes('lili') ||
      lower.includes('jarvis') ||
      raw.includes('लिली') ||
      raw.includes('हे लिली')
    ) {
      sfx.playWakeBeep();
      onWakeWordDetectedRef.current?.();

      const regex = new RegExp(`(hey\\s+)?(${targetWake}|lili|jarvis|लिली|हे लिली)`, 'gi');
      const cleaned = raw.replace(regex, '').trim();

      if (cleaned.length > 0) {
        onTranscriptRef.current(cleaned);
      } else {
        onTranscriptRef.current(currentLangRef.current.startsWith('hi') ? 'नमस्ते लिली' : 'hello lili');
      }
    } else {
      onTranscriptRef.current(raw);
    }

    // Immediately reset recognition engine after processing command to clear audio buffers & prepare for next input
    resetRecognitionEngine();
  };

  // Helper to start recognition safely with browser mic permission unlock
  const startListeningWithPermission = async () => {
    shouldListenRef.current = true;
    setMicPermissionDenied(false);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (err) {
      console.warn('Microphone access prompt dismissed or blocked:', err);
      setMicPermissionDenied(true);
      shouldListenRef.current = false;
      setIsListening(false);
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = currentLangRef.current || 'hi-IN';
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        // Recognition already running or active
        setIsListening(true);
      }
    }
  };

  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = currentLangRef.current || 'hi-IN';

    recognition.onstart = () => {
      setIsListening(true);
      setMicPermissionDenied(false);
    };

    recognition.onresult = (event: any) => {
      let currentInterim = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          currentInterim += transcript;
        }
      }

      if (finalTranscript.trim()) {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        setInterimTranscript('');
        processRecognizedSpeech(finalTranscript);
      } else if (currentInterim.trim()) {
        setInterimTranscript(currentInterim);

        // Check interim transcript for rapid sub-100ms STOP detection
        const lowerInterim = currentInterim.toLowerCase().trim();
        const isStopPhrase =
          lowerInterim === 'stop' ||
          lowerInterim.includes('stop speaking') ||
          lowerInterim.includes('stop talking') ||
          lowerInterim.includes('be quiet') ||
          lowerInterim.includes('shut up') ||
          lowerInterim.includes('shutup') ||
          lowerInterim.includes('silence') ||
          lowerInterim === 'quiet' ||
          lowerInterim === 'pause' ||
          lowerInterim === 'cancel' ||
          lowerInterim === 'halt' ||
          lowerInterim.includes('रुको') ||
          lowerInterim.includes('चुप');

        if (isStopPhrase) {
          triggerInstantStop();
          setInterimTranscript('');
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          return;
        }

        if (currentInterim.trim().length > 2) {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          const capturedInterim = currentInterim.trim();
          silenceTimerRef.current = setTimeout(() => {
            processRecognizedSpeech(capturedInterim);
          }, 200); // Ultra-fast 200ms silence detection for instantaneous voice triggering
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition status:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setMicPermissionDenied(true);
        setIsListening(false);
        shouldListenRef.current = false;
      } else if (event.error === 'no-speech' || event.error === 'aborted') {
        // Non-fatal errors, keep listening state active
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart listening continuously if enabled
      if (shouldListenRef.current && autoListenRef.current && !micPermissionDenied) {
        setTimeout(() => {
          try {
            if (recognitionRef.current && shouldListenRef.current && aiStateRef.current !== 'speaking') {
              recognitionRef.current.lang = currentLangRef.current || 'hi-IN';
              recognitionRef.current.start();
              setIsListening(true);
            }
          } catch (e) {
            // Already active or starting
            setIsListening(true);
          }
        }, 120);
      }
    };

    recognitionRef.current = recognition;

    // Auto-start listening on mount
    if (autoListen) {
      try {
        recognition.start();
      } catch (e) {}
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [currentLang]);

  // Effect to manage recognition state while LILI is speaking or idle
  useEffect(() => {
    if (aiState === 'speaking') {
      if (recognitionRef.current && isListeningRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    } else if (aiState === 'idle' || aiState === 'listening') {
      if (shouldListenRef.current && autoListenRef.current && !micPermissionDenied) {
        setTimeout(() => {
          try {
            if (recognitionRef.current) {
              recognitionRef.current.lang = currentLangRef.current || 'hi-IN';
              recognitionRef.current.start();
              setIsListening(true);
            }
          } catch (e) {
            // Already active or starting
            setIsListening(true);
          }
        }, 200);
      }
    }
  }, [aiState, micPermissionDenied]);

  // Unlock mic on first user interaction anywhere on window
  useEffect(() => {
    const handleFirstUserInteraction = () => {
      if (!isListeningRef.current && shouldListenRef.current && !micPermissionDenied) {
        startListeningWithPermission();
      }
    };

    window.addEventListener('click', handleFirstUserInteraction, { once: true });
    window.addEventListener('keydown', handleFirstUserInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstUserInteraction);
      window.removeEventListener('keydown', handleFirstUserInteraction);
    };
  }, []);

  // Audio Analyzer for Mic Meter
  const startAudioAnalyzer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(1, avg / 128);
        setAudioLevel(normalized);
        onAudioLevel?.(normalized);
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (err) {
      console.log('Mic meter not granted');
    }
  };

  useEffect(() => {
    startAudioAnalyzer();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    };
  }, []);

  const toggleListening = async () => {
    sfx.playClick();
    if (isListening) {
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
    } else {
      await startListeningWithPermission();
    }
  };

  const handleQuickCommand = (cmd: string) => {
    sfx.playClick();
    onTranscript(cmd);
  };

  return (
    <div className="flex flex-col items-center gap-2.5 w-full max-w-xl mx-auto">
      {/* Voice Status Capsule */}
      <div className="flex items-center justify-between gap-3 px-5 py-2.5 rounded-full bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 shadow-[0_0_25px_rgba(34,211,238,0.15)] w-full">
        <button
          onClick={toggleListening}
          className={`relative p-2.5 rounded-full transition-all duration-300 backdrop-blur-md flex-shrink-0 ${
            isListening
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/80 shadow-[0_0_20px_#22d3ee]'
              : 'bg-white/5 text-white/40 hover:text-white border border-white/10'
          }`}
          title={isListening ? 'Click to mute mic' : 'Click to enable voice mic'}
        >
          {isListening ? <Mic className="w-5 h-5 animate-pulse text-cyan-400" /> : <MicOff className="w-5 h-5 text-rose-400" />}

          {/* Audio level pulsing ring */}
          {isListening && (
            <div
              className="absolute inset-0 rounded-full border border-cyan-400 transition-transform duration-75 pointer-events-none"
              style={{
                transform: `scale(${1 + audioLevel * 0.7})`,
                opacity: 0.3 + audioLevel * 0.7,
              }}
            />
          )}
        </button>

        <div className="flex flex-col text-left flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-[0.15em] text-cyan-300 flex items-center gap-1.5 truncate">
              <Radio className={`w-3.5 h-3.5 flex-shrink-0 ${isListening ? 'text-emerald-400 animate-pulse' : 'text-rose-400'}`} />
              {aiState === 'listening'
                ? 'LILI LISTENING NOW...'
                : aiState === 'thinking'
                ? 'LILI THINKING...'
                : aiState === 'speaking'
                ? 'LILI SPEAKING...'
                : isListening
                ? `LISTENING (SAY "HEY LILI" OR TALK)`
                : 'MIC OFF • CLICK TO LISTEN'}
            </span>
          </div>

          <span className="text-[11px] text-white/60 truncate max-w-full">
            {interimTranscript ? (
              <span className="text-cyan-200 italic font-mono">"{interimTranscript}"</span>
            ) : micPermissionDenied ? (
              <button
                onClick={startListeningWithPermission}
                className="text-amber-300 hover:text-amber-200 underline font-semibold flex items-center gap-1 text-[11px] text-left animate-pulse"
              >
                <AlertCircle className="w-3.5 h-3.5 inline text-amber-400 flex-shrink-0" /> Click to grant Mic Permission &amp; Start Listening!
              </button>
            ) : micSupported ? (
              isListening ? (
                `Speak anything or say "Hey Lili" to command`
              ) : (
                <button
                  onClick={startListeningWithPermission}
                  className="text-cyan-300 hover:text-cyan-200 underline font-mono text-[11px] text-left font-semibold"
                >
                  ⚡ CLICK HERE TO ACTIVATE VOICE MIC
                </button>
              )
            ) : (
              'Voice mic unsupported in browser. Use terminal below.'
            )}
          </span>
        </div>

        {/* Dynamic Voice Level Visualizer Bars */}
        <div className="flex items-center gap-1.5 h-5 ml-1 flex-shrink-0">
          {(aiState === 'speaking' || isListening) && (
            <button
              onClick={() => triggerInstantStop()}
              className="px-2.5 py-1 rounded-full bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/60 transition-all font-mono text-[10px] uppercase font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(244,63,94,0.4)] animate-pulse active:scale-95"
              title="Click to instantly stop speech"
            >
              <Volume2 className="w-3 h-3 text-rose-400 animate-spin" />
              STOP
            </button>
          )}

          {[0.3, 0.7, 1.0, 0.6, 0.4].map((multiplier, idx) => (
            <div
              key={idx}
              className="w-1 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] transition-all duration-75"
              style={{
                height: isListening ? `${Math.max(4, audioLevel * 24 * multiplier)}px` : '4px',
                opacity: isListening ? 0.6 + audioLevel * 0.4 : 0.2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Language Selector Bar */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap text-[11px] font-mono">
        <span className="text-cyan-400/80 font-bold flex items-center gap-1 mr-1 uppercase">
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          Listening Language:
        </span>
        {[
          { id: 'hi-IN', label: '🌐 AUTO (EN / HI)' },
          { id: 'en-US', label: '🇺🇸 English' },
          { id: 'hi-IN-pure', label: '🇮🇳 हिन्दी (Hindi)' },
          { id: 'es-ES', label: '🇪🇸 Español' },
        ].map((lang) => (
          <button
            key={lang.id}
            onClick={() => handleSelectLanguage(lang.id === 'hi-IN-pure' ? 'hi-IN' : lang.id)}
            className={`px-2.5 py-1 rounded-full border transition-all font-bold flex items-center gap-1 active:scale-95 ${
              currentLang === (lang.id === 'hi-IN-pure' ? 'hi-IN' : lang.id)
                ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>

      {/* Quick Test Voice Command Buttons for 1-Click Testing */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap text-xs">
        <button
          onClick={() => triggerInstantStop()}
          className="px-2.5 py-1 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50 transition-all font-mono text-[11px] flex items-center gap-1 active:scale-95 font-bold"
        >
          🛑 STOP SPEECH
        </button>
        {[
          'Hey Lili',
          'नमस्ते लिली',
          'Ring my phone',
          'Lock my laptop',
          'Who created you?',
          'आप कौन हो?',
          'What is 25 * 4?',
          'Turn on lights',
        ].map((cmd) => (
          <button
            key={cmd}
            onClick={() => handleQuickCommand(cmd)}
            className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-cyan-500/20 text-cyan-200/80 hover:text-cyan-200 border border-white/10 hover:border-cyan-400/50 transition-all font-mono text-[11px] flex items-center gap-1 active:scale-95"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            {cmd}
          </button>
        ))}
      </div>
    </div>
  );
};
