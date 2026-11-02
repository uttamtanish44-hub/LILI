import React, { useState } from 'react';
import {
  Lightbulb,
  Fan,
  Thermometer,
  Tv,
  Power,
  Zap,
  Sliders,
  Sparkles,
  Gamepad2,
  Film,
  BookOpen,
  Moon,
  Home,
} from 'lucide-react';
import { SmartDevice } from '../types';
import { sfx } from '../lib/audio';

interface SmartHomePanelProps {
  onControlDevice: (device: string, action: string, value?: any) => void;
  onTriggerScene: (sceneName: string) => void;
}

export const SmartHomePanel: React.FC<SmartHomePanelProps> = ({
  onControlDevice,
  onTriggerScene,
}) => {
  const [devices, setDevices] = useState<SmartDevice[]>([
    {
      id: 'light-1',
      name: 'Main Ceiling Light',
      room: 'Living Room',
      type: 'light',
      state: true,
      brightness: 80,
      colorRgb: '#00e5ff',
    },
    {
      id: 'light-2',
      name: 'Desk Ambient Strip',
      room: 'Workspace',
      type: 'light',
      state: true,
      brightness: 100,
      colorRgb: '#ff0055',
    },
    {
      id: 'ac-1',
      name: 'Dual Inverter AC',
      room: 'Bedroom',
      type: 'ac',
      state: true,
      temperature: 22,
    },
    {
      id: 'fan-1',
      name: 'BLDC High Speed Fan',
      room: 'Workspace',
      type: 'fan',
      state: true,
      speed: 4,
    },
    {
      id: 'tv-1',
      name: 'QLED 4K Smart TV',
      room: 'Living Room',
      type: 'tv',
      state: false,
    },
  ]);

  const toggleDevice = (id: string, name: string) => {
    sfx.playClick();
    setDevices(
      devices.map((d) => {
        if (d.id === id) {
          const newState = !d.state;
          onControlDevice(name, newState ? 'on' : 'off');
          return { ...d, state: newState };
        }
        return d;
      })
    );
  };

  const updateBrightness = (id: string, name: string, brightness: number) => {
    setDevices(
      devices.map((d) => (d.id === id ? { ...d, brightness } : d))
    );
    onControlDevice(name, 'dim', brightness);
  };

  const updateTemperature = (id: string, name: string, delta: number) => {
    sfx.playClick();
    setDevices(
      devices.map((d) => {
        if (d.id === id && d.temperature) {
          const newTemp = Math.min(30, Math.max(16, d.temperature + delta));
          onControlDevice(name, 'set_temp', newTemp);
          return { ...d, temperature: newTemp };
        }
        return d;
      })
    );
  };

  const scenes = [
    {
      id: 'gaming',
      name: 'Gaming Mode',
      desc: 'RGB Lights, Cool 20°C AC, High Speed Fan',
      icon: Gamepad2,
      color: 'from-pink-500 to-purple-600',
    },
    {
      id: 'cinema',
      name: 'Cinema Night',
      desc: 'Dim Warm Lights, TV ON, Mute System',
      icon: Film,
      color: 'from-amber-500 to-red-600',
    },
    {
      id: 'focus',
      name: 'Deep Study',
      desc: 'Bright White Lights, 24°C AC, Lo-Fi',
      icon: BookOpen,
      color: 'from-cyan-500 to-blue-600',
    },
    {
      id: 'sleep',
      name: 'Sleep Protocol',
      desc: 'All Lights OFF, 22°C Eco AC, Low Fan',
      icon: Moon,
      color: 'from-indigo-600 to-slate-800',
    },
  ];

  return (
    <div className="space-y-4 h-full overflow-y-auto no-scrollbar p-1">
      {/* Quick Scenes Toolbar */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-[0_0_25px_rgba(34,211,238,0.06)]">
        <div className="flex items-center justify-between mb-3 font-mono text-xs font-bold text-cyan-400 tracking-[0.15em] uppercase">
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            ONE-CLICK SMART SCENE PRESETS
          </span>
          <span className="text-[10px] text-white/40">HOME ASSISTANT HUB</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {scenes.map((sc) => {
            const Icon = sc.icon;
            return (
              <button
                key={sc.id}
                onClick={() => {
                  sfx.playSuccess();
                  onTriggerScene(sc.id);
                }}
                className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${sc.color} opacity-90 hover:opacity-100 text-white font-mono text-xs text-left transition-all shadow-lg hover:scale-[1.02] border border-white/10 backdrop-blur-md`}
              >
                <div className="p-2 rounded-lg bg-black/30 backdrop-blur-sm">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold">{sc.name}</span>
                  <span className="text-[10px] opacity-80 leading-tight">{sc.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Smart Device Cards Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device) => (
          <div
            key={device.id}
            className={`p-4 rounded-2xl border transition-all backdrop-blur-xl ${
              device.state
                ? 'bg-white/5 border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.12)]'
                : 'bg-white/5 border-white/10 opacity-60'
            }`}
          >
            {/* Header: Name, Room, Toggle */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2.5 rounded-xl ${
                    device.state ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-white/40'
                  }`}
                >
                  {device.type === 'light' ? (
                    <Lightbulb className="w-5 h-5" />
                  ) : device.type === 'ac' ? (
                    <Thermometer className="w-5 h-5" />
                  ) : device.type === 'fan' ? (
                    <Fan className="w-5 h-5" />
                  ) : (
                    <Tv className="w-5 h-5" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-xs font-bold text-slate-200">{device.name}</span>
                  <span className="font-mono text-[10px] text-white/40">{device.room}</span>
                </div>
              </div>

              <button
                onClick={() => toggleDevice(device.id, device.name)}
                className={`p-2 rounded-full border transition-all ${
                  device.state
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'bg-white/5 border-white/10 text-white/40'
                }`}
              >
                <Power className="w-4 h-4" />
              </button>
            </div>

            {/* Device Custom Controls */}
            {device.state && (
              <div className="pt-2 border-t border-white/10 space-y-2">
                {/* Light Controls */}
                {device.type === 'light' && device.brightness !== undefined && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-white/60">
                      <span>Brightness</span>
                      <span className="text-cyan-300 font-bold">{device.brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={device.brightness}
                      onChange={(e) => updateBrightness(device.id, device.name, Number(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                    />
                  </div>
                )}

                {/* AC Thermostat Controls */}
                {device.type === 'ac' && device.temperature !== undefined && (
                  <div className="flex items-center justify-between font-mono text-xs pt-1">
                    <span className="text-slate-400">Target Temp:</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateTemperature(device.id, device.name, -1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold"
                      >
                        -
                      </button>
                      <span className="text-lg font-bold text-cyan-300">{device.temperature}°C</span>
                      <button
                        onClick={() => updateTemperature(device.id, device.name, 1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Fan Speed Controls */}
                {device.type === 'fan' && device.speed !== undefined && (
                  <div className="flex items-center justify-between font-mono text-xs pt-1">
                    <span className="text-slate-400">Fan Speed:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => {
                            sfx.playClick();
                            setDevices(
                              devices.map((d) => (d.id === device.id ? { ...d, speed: lvl } : d))
                            );
                            onControlDevice(device.name, 'set_speed', lvl);
                          }}
                          className={`w-6 h-6 rounded-md font-mono text-[10px] font-bold ${
                            device.speed === lvl
                              ? 'bg-cyan-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
