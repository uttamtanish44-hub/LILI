import React, { useState, useEffect } from 'react';
import {
  Cpu,
  HardDrive,
  Activity,
  Volume2,
  VolumeX,
  Settings,
  Shield,
  Terminal,
  Home,
  Globe,
  Calendar,
  CalendarDays,
  Code,
  Zap,
  Lock,
  Radio,
  Sliders,
  Maximize2,
  Smartphone,
  CloudSun,
  Sparkles,
} from 'lucide-react';
import { AIState, SystemStats } from '../types';
import { sfx } from '../lib/audio';

interface HUDHeaderProps {
  aiState: AIState;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  systemStats: SystemStats;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  onOpenSettings: () => void;
  accentColor?: 'cyan' | 'emerald' | 'gold' | 'crimson';
}

export const HUDHeader: React.FC<HUDHeaderProps> = ({
  aiState,
  activeTab,
  setActiveTab,
  systemStats,
  soundEnabled,
  setSoundEnabled,
  onOpenSettings,
  accentColor = 'cyan',
}) => {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setDate(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { id: 'core', label: '3D Core', icon: Radio },
    { id: 'gemini_studio', label: 'Gemini Studio AI', icon: Sparkles },
    { id: 'calendar', label: 'Calendar & Festivals', icon: CalendarDays },
    { id: 'weather', label: 'Weather', icon: CloudSun },
    { id: 'devices', label: 'Device Sync', icon: Smartphone },
    { id: 'pc', label: 'PC Control', icon: Terminal },
    { id: 'web', label: 'Live Web', icon: Globe },
    { id: 'smarthome', label: 'Smart Home', icon: Home },
    { id: 'productivity', label: 'Productivity', icon: Calendar },
    { id: 'code', label: 'Code Lab', icon: Code },
    { id: 'automation', label: 'Automation', icon: Zap },
    { id: 'memory', label: 'Vault', icon: Lock },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const getBadgeColor = () => {
    switch (aiState) {
      case 'listening':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(0,229,255,0.4)]';
      case 'thinking':
        return 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-[0_0_10px_rgba(255,199,26,0.4)]';
      case 'speaking':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_10px_rgba(26,243,128,0.4)]';
      case 'warning':
        return 'bg-rose-500/20 text-rose-300 border-rose-400 shadow-[0_0_10px_rgba(243,38,89,0.4)]';
      case 'private':
        return 'bg-purple-500/20 text-purple-300 border-purple-400 shadow-[0_0_10px_rgba(166,26,243,0.4)]';
      default:
        return 'bg-slate-800 text-cyan-400 border-cyan-500/30';
    }
  };

  return (
    <header className="w-full bg-white/5 backdrop-blur-md border-b border-white/10 px-6 py-3 flex flex-col gap-2.5 sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
      {/* Top Telemetry Bar */}
      <div className="flex items-center justify-between gap-4">
        {/* Brand Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_0_15px_rgba(34,211,238,0.15)]">
            <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_10px_#22d3ee] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-sm font-mono tracking-[0.2em] uppercase text-cyan-400 font-bold">
                LILI // OS INTERFACE <span className="text-white/40 text-xs font-normal">v4.5</span>
              </h1>
              <span
                className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border uppercase tracking-wider transition-all duration-300 backdrop-blur-md ${getBadgeColor()}`}
              >
                ● {aiState}
              </span>
            </div>
            <p className="text-[10px] text-white/40 font-mono tracking-widest hidden sm:block">
              INTELLIGENT OPERATING SYSTEM • AUTONOMOUS ARCHITECTURE
            </p>
          </div>
        </div>

        {/* System Load Telemetry */}
        <div className="hidden lg:flex items-center gap-6 px-4 py-1.5 rounded-xl bg-white/5 backdrop-blur-lg border border-white/10 text-xs font-mono">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-cyan-500/50 uppercase font-bold tracking-tighter">CPU LOAD</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cyan-300">{systemStats.cpuUsage}%</span>
              <div className="w-10 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-500"
                  style={{ width: `${systemStats.cpuUsage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] text-cyan-500/50 uppercase font-bold tracking-tighter">RAM ALLOC</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-purple-300">{systemStats.ramUsage}%</span>
              <div className="w-10 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-400 transition-all duration-500"
                  style={{ width: `${systemStats.ramUsage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] text-cyan-500/50 uppercase font-bold tracking-tighter">NEURAL SPEED</span>
            <span className="text-xs font-mono text-emerald-300">{systemStats.networkSpeedKbps} Kb/s</span>
          </div>
        </div>

        {/* Right Action Controls: Clock, Sound, Settings */}
        <div className="flex items-center gap-3">
          <div className="text-right font-mono">
            <div className="text-xs font-bold text-cyan-400 tracking-wider">{time}</div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest">{date}</div>
          </div>

          <button
            onClick={() => {
              sfx.playClick();
              setSoundEnabled(!soundEnabled);
            }}
            className="p-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-cyan-500/30 text-white/70 hover:text-cyan-300 transition-all shadow-[0_0_10px_rgba(0,0,0,0.2)]"
            title={soundEnabled ? 'Mute SFX' : 'Enable SFX'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-white/30" />}
          </button>

          <button
            onClick={() => {
              sfx.playClick();
              onOpenSettings();
            }}
            className="p-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-cyan-500/30 text-white/70 hover:text-cyan-300 transition-all shadow-[0_0_10px_rgba(0,0,0,0.2)]"
            title="System Settings"
          >
            <Settings className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Header */}
      <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 border-t border-white/5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                sfx.playClick();
                setActiveTab(item.id);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium whitespace-nowrap transition-all duration-200 backdrop-blur-md ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-white/40'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
