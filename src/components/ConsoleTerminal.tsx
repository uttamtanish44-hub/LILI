import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TermIcon, Send, Trash2, Cpu, CheckCircle2, CornerDownLeft, Sparkles, Mic, MicOff } from 'lucide-react';
import { ChatMessage } from '../types';
import { sfx } from '../lib/audio';

interface ConsoleTerminalProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onClearLogs: () => void;
  isProcessing: boolean;
}

export const ConsoleTerminal: React.FC<ConsoleTerminalProps> = ({
  messages,
  onSendMessage,
  onClearLogs,
  isProcessing,
}) => {
  const [input, setInput] = useState('');
  const [isDictating, setIsDictating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    sfx.playClick();
    onSendMessage(input.trim());
    setInput('');
  };

  const toggleDictation = () => {
    sfx.playClick();
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isDictating) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsDictating(false);
    } else {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'hi-IN';

        recognition.onstart = () => {
          setIsDictating(true);
        };

        recognition.onresult = (event: any) => {
          let text = '';
          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript;
          }
          setInput(text);
        };

        recognition.onerror = () => {
          setIsDictating(false);
        };

        recognition.onend = () => {
          setIsDictating(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        setIsDictating(false);
      }
    }
  };

  const quickPrompts = [
    'Good Morning routine',
    'Open VS Code and Chrome',
    'What is the weather in Delhi?',
    'Dim smart lights to 30%',
    'Lock PC system',
    'Show news updates',
  ];

  return (
    <div className="flex flex-col h-full bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(34,211,238,0.08)] backdrop-blur-xl">
      {/* Terminal Titlebar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-2 font-mono text-xs text-cyan-400">
          <TermIcon className="w-4 h-4 text-cyan-400" />
          <span className="font-bold tracking-[0.15em] uppercase">LILI.OS COMMAND TERMINAL</span>
          <span className="text-white/20">|</span>
          <span className="text-[10px] text-white/40 uppercase tracking-widest">BILINGUAL INTENT ENGINE</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sfx.playClick();
              onClearLogs();
            }}
            className="p-1.5 rounded-xl text-white/40 hover:text-rose-400 hover:bg-white/10 transition-all text-xs font-mono flex items-center gap-1 border border-transparent hover:border-white/10"
            title="Clear Console Logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CLEAR</span>
          </button>
        </div>
      </div>

      {/* Terminal Output Log Area */}
      <div
        ref={scrollRef}
        className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-3 bg-transparent text-slate-200"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/40 gap-2 py-8 text-center">
            <Sparkles className="w-8 h-8 text-cyan-400/60 animate-pulse" />
            <p className="text-xs text-white/60 font-mono tracking-wider">LILI Command Shell Active & Ready.</p>
            <p className="text-[11px] text-white/40 max-w-sm">
              Type any system command or natural prompt in English or Hindi (e.g., "Lili, start my morning routine" or "Namaste Lili").
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="space-y-1">
              <div className="flex items-center gap-2 text-[10px] text-white/40">
                <span>[{msg.timestamp}]</span>
                <span className="uppercase font-semibold tracking-wider text-cyan-400/80">
                  {msg.sender === 'user' ? 'USER@SYS' : msg.sender === 'lili' ? 'LILI@OS' : 'SYSTEM@KERNEL'}
                </span>
              </div>

              {msg.sender === 'user' ? (
                <div className="flex items-start gap-2 text-cyan-200 bg-cyan-500/10 border border-cyan-500/20 p-2.5 rounded-xl backdrop-blur-md">
                  <span className="text-cyan-400 font-bold">&gt;</span>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              ) : msg.sender === 'lili' ? (
                <div className="flex flex-col gap-1 text-slate-200 bg-white/5 border border-white/10 p-3 rounded-xl backdrop-blur-md">
                  <div className="flex items-center gap-1.5 text-cyan-400 text-[11px] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="tracking-widest">LILI</span>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed text-slate-200">{msg.text}</p>

                  {/* Tool Call Output Pill */}
                  {msg.toolCall && (
                    <div className="mt-2 p-2 rounded-xl bg-white/5 border border-cyan-500/30 font-mono text-[11px] backdrop-blur-md">
                      <div className="flex items-center justify-between text-cyan-400 mb-1">
                        <span className="font-bold uppercase text-[10px] tracking-wider">
                          ⚡ EXECUTED TOOL: {msg.toolCall.name}
                        </span>
                      </div>
                      <pre className="text-white/60 text-[10px] overflow-x-auto p-1.5 bg-black/30 rounded-lg">
                        {JSON.stringify(msg.toolCall.args, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-amber-300 text-[11px] bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl backdrop-blur-md">
                  [SYS_LOG]: {msg.text}
                </div>
              )}
            </div>
          ))
        )}

        {isProcessing && (
          <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs animate-pulse p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl backdrop-blur-md">
            <Cpu className="w-4 h-4 animate-spin text-cyan-400" />
            <span className="tracking-wider">LILI IS REASONING &amp; EXECUTING COMMANDS...</span>
          </div>
        )}
      </div>

      {/* Quick Prompt Pills */}
      <div className="px-3 py-2 bg-white/5 border-t border-white/10 backdrop-blur-md flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest whitespace-nowrap">QUICK:</span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => {
              sfx.playClick();
              onSendMessage(prompt);
            }}
            className="text-[11px] font-mono px-3 py-1 rounded-full bg-white/5 hover:bg-cyan-500/20 text-white/70 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/30 whitespace-nowrap transition-all backdrop-blur-md"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Terminal Input Form */}
      <form onSubmit={handleSubmit} className="p-3 bg-white/5 border-t border-white/10 backdrop-blur-md flex items-center gap-2">
        <span className="text-cyan-400 font-mono font-bold text-sm pl-2">&gt;</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Command LILI... (e.g., 'Open Spotify and dim bedroom lights')"
          className="flex-1 bg-transparent border-none outline-none text-xs font-mono text-slate-100 placeholder:text-white/30"
          disabled={isProcessing}
        />

        <button
          type="submit"
          disabled={!input.trim() || isProcessing}
          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_12px_#22d3ee]"
        >
          <span>EXEC</span>
          <CornerDownLeft className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
