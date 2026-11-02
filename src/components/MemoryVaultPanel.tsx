import React, { useState } from 'react';
import { Lock, Key, ShieldCheck, Database, Plus, Trash2, User, Sparkles } from 'lucide-react';
import { UserMemory } from '../types';
import { sfx } from '../lib/audio';

interface MemoryVaultPanelProps {
  onSaveFact: (fact: string) => void;
}

export const MemoryVaultPanel: React.FC<MemoryVaultPanelProps> = ({ onSaveFact }) => {
  const [memories, setMemories] = useState<UserMemory[]>([
    {
      id: 'm1',
      category: 'preference',
      content: 'User prefers dark themes, Python/TypeScript code, and lo-fi focus music.',
      confidence: 0.98,
      createdAt: '2026-08-10',
      encrypted: true,
    },
    {
      id: 'm2',
      category: 'fact',
      content: 'Primary workstation location is Delhi, India.',
      confidence: 0.95,
      createdAt: '2026-08-11',
      encrypted: true,
    },
    {
      id: 'm3',
      category: 'project',
      content: 'Project "Alpha" source code is located in ~/Documents/LILI_OS/ backend.',
      confidence: 0.92,
      createdAt: '2026-08-11',
      encrypted: true,
    },
  ]);

  const [newMemory, setNewMemory] = useState('');

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemory.trim()) return;
    sfx.playSuccess();
    const mem: UserMemory = {
      id: Date.now().toString(),
      category: 'fact',
      content: newMemory.trim(),
      confidence: 1.0,
      createdAt: new Date().toISOString().split('T')[0],
      encrypted: true,
    };
    setMemories([mem, ...memories]);
    onSaveFact(newMemory.trim());
    setNewMemory('');
  };

  const handleDelete = (id: string) => {
    sfx.playWarning();
    setMemories(memories.filter((m) => m.id !== id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full overflow-y-auto no-scrollbar p-1">
      {/* Column 1 & 2: Encrypted Memory Bank */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl space-y-4 lg:col-span-2 shadow-[0_0_25px_rgba(34,211,238,0.06)]">
        <div className="flex items-center justify-between font-mono text-xs font-bold text-cyan-400 tracking-[0.15em] uppercase">
          <span className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            LILI LONG-TERM MEMORY BANK (AES-256 VAULT)
          </span>
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/30">
            <ShieldCheck className="w-3 h-3" />
            ENCRYPTED IN RAM
          </span>
        </div>

        <form onSubmit={handleAddMemory} className="flex gap-2">
          <input
            type="text"
            value={newMemory}
            onChange={(e) => setNewMemory(e.target.value)}
            placeholder="Tell LILI a fact to remember (e.g., 'Remember my coffee order is black americano')..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 placeholder:text-white/30 outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_#22d3ee]"
          >
            <Plus className="w-4 h-4" />
            <span>SAVE</span>
          </button>
        </form>

        <div className="space-y-2 max-h-[320px] overflow-y-auto no-scrollbar">
          {memories.map((mem) => (
            <div
              key={mem.id}
              className="p-3 rounded-xl bg-white/5 border border-white/10 font-mono text-xs flex items-center justify-between gap-3 backdrop-blur-md"
            >
              <div className="flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-slate-200 leading-relaxed">{mem.content}</span>
                  <span className="text-[10px] text-white/40">
                    CATEGORY: {mem.category.toUpperCase()} • ADDED: {mem.createdAt} • CONFIDENCE: {Math.round(mem.confidence * 100)}%
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleDelete(mem.id)}
                className="text-white/40 hover:text-rose-400 p-1 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Column 3: Persona Graph Settings */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl space-y-3 font-mono text-xs shadow-[0_0_25px_rgba(34,211,238,0.06)]">
        <div className="flex items-center gap-2 font-bold text-purple-400 tracking-[0.15em] uppercase">
          <User className="w-4 h-4" />
          <span>USER PERSONA PROFILE</span>
        </div>

        <div className="space-y-2 bg-white/5 p-3 rounded-xl border border-white/10 text-slate-300 backdrop-blur-md">
          <div className="flex justify-between">
            <span className="text-white/40">Identity:</span>
            <span className="text-cyan-300 font-bold">Commander / User</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">AI Personality:</span>
            <span className="text-purple-300">LILI (Female, Loyal)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Primary Language:</span>
            <span className="text-emerald-300">Bilingual (English / Hindi)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Memory Engine:</span>
            <span className="text-amber-300">PostgreSQL Vector DB</span>
          </div>
        </div>
      </div>
    </div>
  );
};
