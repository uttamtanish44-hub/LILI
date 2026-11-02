import React, { useState } from 'react';
import { Zap, Play, Plus, Trash2, CheckCircle2, ShieldAlert, Sparkles, Sun, Moon, Laptop, Lock } from 'lucide-react';
import { AutomationRoutine } from '../types';
import { sfx } from '../lib/audio';

interface AutomationEngineProps {
  onRunRoutine: (routineName: string) => void;
}

export const AutomationEngine: React.FC<AutomationEngineProps> = ({ onRunRoutine }) => {
  const [routines, setRoutines] = useState<AutomationRoutine[]>([
    {
      id: 'r1',
      name: 'Good Morning Routine',
      triggerPhrase: 'Good Morning',
      iconName: 'Sun',
      enabled: true,
      actions: [
        { type: 'speak', payload: { text: 'Good morning Boss. Initializing your daily workspace.' } },
        { type: 'open_app', payload: { app_name: 'chrome.exe' } },
        { type: 'fetch_weather', payload: { city: 'Delhi' } },
        { type: 'smart_home', payload: { device: 'Main Ceiling Light', action: 'on', value: 80 } },
      ],
    },
    {
      id: 'r2',
      name: 'Deep Work Coding Mode',
      triggerPhrase: 'Start Coding',
      iconName: 'Laptop',
      enabled: true,
      actions: [
        { type: 'open_app', payload: { app_name: 'code' } },
        { type: 'open_app', payload: { app_name: 'spotify.exe' } },
        { type: 'set_volume', payload: { level: 35 } },
        { type: 'smart_home', payload: { device: 'Desk Ambient Strip', action: 'on', value: 100 } },
      ],
    },
    {
      id: 'r3',
      name: 'Protocol Zero (Emergency Lock)',
      triggerPhrase: 'Protocol Zero',
      iconName: 'Lock',
      enabled: true,
      actions: [
        { type: 'speak', payload: { text: 'Protocol Zero engaged. Terminating processes and locking workstation.' } },
        { type: 'smart_home', payload: { device: 'All Devices', action: 'off' } },
      ],
    },
  ]);

  const [routineName, setRoutineName] = useState('');
  const [triggerPhrase, setTriggerPhrase] = useState('');

  const handleAddRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineName.trim() || !triggerPhrase.trim()) return;
    sfx.playSuccess();
    setRoutines([
      ...routines,
      {
        id: Date.now().toString(),
        name: routineName.trim(),
        triggerPhrase: triggerPhrase.trim(),
        iconName: 'Zap',
        enabled: true,
        actions: [
          { type: 'speak', payload: { text: `Executing custom routine: ${routineName}` } },
        ],
      },
    ]);
    setRoutineName('');
    setTriggerPhrase('');
  };

  const handleRun = (r: AutomationRoutine) => {
    sfx.playSuccess();
    onRunRoutine(r.name);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full overflow-y-auto no-scrollbar p-1">
      {/* Column 1 & 2: Active Automation Macro Routines */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl space-y-4 lg:col-span-2 shadow-[0_0_25px_rgba(34,211,238,0.06)]">
        <div className="flex items-center justify-between font-mono text-xs font-bold text-cyan-400 tracking-[0.15em] uppercase">
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            AUTOMATION ENGINE &amp; ROUTINE MACROS
          </span>
          <span className="text-[10px] text-white/40">{routines.length} ACTIVE ROUTINES</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {routines.map((r) => (
            <div
              key={r.id}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between gap-3 font-mono text-xs backdrop-blur-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300">
                    {r.iconName === 'Sun' ? (
                      <Sun className="w-5 h-5" />
                    ) : r.iconName === 'Lock' ? (
                      <Lock className="w-5 h-5" />
                    ) : (
                      <Laptop className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-200">{r.name}</span>
                    <span className="text-[10px] text-cyan-400">Trigger: "{r.triggerPhrase}"</span>
                  </div>
                </div>
              </div>

              {/* Steps List */}
              <div className="space-y-1 bg-white/5 p-2 rounded-xl text-[10px] text-white/60 border border-white/5">
                {r.actions.map((act, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 truncate">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">
                      {act.type}: {JSON.stringify(act.payload)}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleRun(r)}
                className="w-full py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_10px_rgba(34,211,238,0.1)]"
              >
                <Play className="w-3.5 h-3.5" />
                <span>EXECUTE ROUTINE NOW</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Column 3: Create Custom Routine Builder */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl space-y-4 shadow-[0_0_25px_rgba(34,211,238,0.06)]">
        <div className="flex items-center gap-2 font-mono text-xs font-bold text-emerald-400 tracking-[0.15em] uppercase">
          <Plus className="w-4 h-4" />
          <span>BUILD NEW CUSTOM ROUTINE</span>
        </div>

        <form onSubmit={handleAddRoutine} className="space-y-3 font-mono text-xs">
          <div>
            <label className="text-[10px] text-white/40">ROUTINE NAME</label>
            <input
              type="text"
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              placeholder="e.g., Night Cinema Setup"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-cyan-400 mt-1 placeholder:text-white/30"
            />
          </div>

          <div>
            <label className="text-[10px] text-white/40">VOICE TRIGGER PHRASE</label>
            <input
              type="text"
              value={triggerPhrase}
              onChange={(e) => setTriggerPhrase(e.target.value)}
              placeholder="e.g., Movie Time"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-cyan-400 mt-1 placeholder:text-white/30"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center gap-2 transition-all mt-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>SAVE AUTOMATION MACRO</span>
          </button>
        </form>
      </div>
    </div>
  );
};
