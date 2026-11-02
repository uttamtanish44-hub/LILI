import React from 'react';
import { X, Sliders, Volume2, Mic, Palette, Globe, Check } from 'lucide-react';
import { VoiceSettings } from '../types';
import { sfx } from '../lib/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VoiceSettings;
  onUpdateSettings: (newSettings: Partial<VoiceSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const themes: { id: VoiceSettings['themeAccent']; name: string; color: string }[] = [
    { id: 'cyan', name: 'Cyber Cyan', color: 'bg-cyan-400' },
    { id: 'emerald', name: 'Emerald Matrix', color: 'bg-emerald-400' },
    { id: 'gold', name: 'Gold Sovereign', color: 'bg-amber-400' },
    { id: 'crimson', name: 'Crimson Sentinel', color: 'bg-rose-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-5 shadow-[0_0_50px_rgba(34,211,238,0.15)] backdrop-blur-2xl font-mono text-xs space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 text-cyan-400">
          <div className="flex items-center gap-2 font-bold tracking-[0.15em] uppercase">
            <Sliders className="w-4 h-4" />
            <span>LILI SYSTEM SETTINGS</span>
          </div>
          <button
            onClick={() => {
              sfx.playClick();
              onClose();
            }}
            className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wake Word Config */}
        <div className="space-y-2">
          <label className="text-white/60 flex items-center gap-1.5 font-bold">
            <Mic className="w-3.5 h-3.5 text-cyan-400" />
            WAKE WORD PHRASE
          </label>
          <div className="flex gap-2">
            {['lili', 'hey lili'].map((ww) => (
              <button
                key={ww}
                onClick={() => {
                  sfx.playClick();
                  onUpdateSettings({ wakeWord: ww });
                }}
                className={`flex-1 py-2 rounded-xl border text-center uppercase font-bold transition-all backdrop-blur-md ${
                  settings.wakeWord === ww
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                    : 'bg-white/5 border-white/10 text-white/40 hover:text-slate-200'
                }`}
              >
                "{ww}"
              </button>
            ))}
          </div>
        </div>

        {/* Voice Pitch & Speed */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <label className="text-white/60 flex items-center gap-1.5 font-bold">
            <Volume2 className="w-3.5 h-3.5 text-purple-400" />
            FEMALE VOICE TUNING
          </label>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-white/60">
              <span>Voice Pitch ({settings.voicePitch})</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.4"
              step="0.05"
              value={settings.voicePitch}
              onChange={(e) => onUpdateSettings({ voicePitch: Number(e.target.value) })}
              className="w-full accent-purple-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-white/60">
              <span>Speech Rate ({settings.voiceRate})</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.3"
              step="0.05"
              value={settings.voiceRate}
              onChange={(e) => onUpdateSettings({ voiceRate: Number(e.target.value) })}
              className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Theme Accent Picker */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <label className="text-white/60 flex items-center gap-1.5 font-bold">
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            HOLOGRAPHIC ACCENT THEME
          </label>
          <div className="grid grid-cols-2 gap-2">
            {themes.map((th) => (
              <button
                key={th.id}
                onClick={() => {
                  sfx.playClick();
                  onUpdateSettings({ themeAccent: th.id });
                }}
                className={`p-2 rounded-xl border flex items-center gap-2 transition-all backdrop-blur-md ${
                  settings.themeAccent === th.id
                    ? 'bg-white/10 border-cyan-400 text-slate-100 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                    : 'bg-white/5 border-white/10 text-white/40 hover:text-slate-200'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full ${th.color}`} />
                <span className="text-[11px] font-bold">{th.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Primary Language Picker */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <label className="text-white/60 flex items-center gap-1.5 font-bold">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            PRIMARY VOICE LANGUAGE
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'hi-IN', name: '🇮🇳 Hindi / हिन्दी' },
              { id: 'en-US', name: '🇺🇸 English' },
              { id: 'es-ES', name: '🇪🇸 Spanish' },
              { id: 'fr-FR', name: '🇫🇷 French' },
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => {
                  sfx.playClick();
                  onUpdateSettings({ selectedLanguage: lang.id });
                }}
                className={`p-2 rounded-xl border flex items-center justify-between transition-all backdrop-blur-md ${
                  (settings.selectedLanguage || 'hi-IN') === lang.id
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)] font-bold'
                    : 'bg-white/5 border-white/10 text-white/40 hover:text-slate-200'
                }`}
              >
                <span className="text-[11px]">{lang.name}</span>
                {(settings.selectedLanguage || 'hi-IN') === lang.id && (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => {
              sfx.playClick();
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-[0_0_15px_rgba(0,229,255,0.3)]"
          >
            SAVE PREFERENCES
          </button>
        </div>
      </div>
    </div>
  );
};
