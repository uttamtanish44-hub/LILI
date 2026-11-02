import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Sun,
  Camera,
  Power,
  RotateCcw,
  Lock,
  Moon,
  Folder,
  FileText,
  Trash2,
  Plus,
  Play,
  Square,
  Cpu,
  Monitor,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { sfx } from '../lib/audio';

interface PCControlPanelProps {
  onExecuteCommand: (cmd: string, args?: any) => void;
}

export const PCControlPanel: React.FC<PCControlPanelProps> = ({ onExecuteCommand }) => {
  const [volume, setVolume] = useState<number>(75);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [brightness, setBrightness] = useState<number>(85);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [fileList, setFileList] = useState<string[]>([
    'documents/project_alpha_spec.pdf',
    'pictures/lili_hud_concept.png',
    'desktop/jarvis_routines.json',
    'downloads/voice_model_v4.bin',
  ]);
  const [processes, setProcesses] = useState([
    { pid: 1042, name: 'lili_backend.exe', cpu: '2.4%', ram: '142 MB' },
    { pid: 2180, name: 'chrome.exe', cpu: '8.1%', ram: '680 MB' },
    { pid: 3412, name: 'code.exe (VS Code)', cpu: '4.2%', ram: '410 MB' },
    { pid: 4890, name: 'spotify.exe', cpu: '1.1%', ram: '180 MB' },
  ]);

  const handleVolumeChange = (newVal: number) => {
    setVolume(newVal);
    onExecuteCommand('set_system_volume', { level: newVal });
  };

  const handleBrightnessChange = (newVal: number) => {
    setBrightness(newVal);
    onExecuteCommand('set_system_brightness', { level: newVal });
  };

  const handleTakeScreenshot = () => {
    sfx.playClick();
    const fakeScreenshotUrl = `https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80`;
    setScreenshot(fakeScreenshotUrl);
    sfx.playSuccess();
    onExecuteCommand('take_screenshot', { name: 'screenshot_desktop.png' });
  };

  const handleAddFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    sfx.playSuccess();
    setFileList([newFileName.trim(), ...fileList]);
    onExecuteCommand('create_file', { path: newFileName.trim() });
    setNewFileName('');
  };

  const handleDeleteFile = (fileName: string) => {
    sfx.playWarning();
    setFileList(fileList.filter((f) => f !== fileName));
    onExecuteCommand('delete_file', { path: fileName });
  };

  const handleKillProcess = (pid: number, name: string) => {
    sfx.playWarning();
    setProcesses(processes.filter((p) => p.pid !== pid));
    onExecuteCommand('close_application', { app_name: name });
  };

  const apps = [
    { name: 'Google Chrome', icon: '🌐', cmd: 'chrome.exe' },
    { name: 'VS Code', icon: '📝', cmd: 'code' },
    { name: 'Spotify', icon: '🎵', cmd: 'spotify.exe' },
    { name: 'Terminal', icon: '💻', cmd: 'cmd.exe' },
    { name: 'File Explorer', icon: '📁', cmd: 'explorer.exe' },
    { name: 'Calculator', icon: '🔢', cmd: 'calc.exe' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full overflow-y-auto no-scrollbar p-1">
      {/* Column 1: System Hardware Controls & Power */}
      <div className="space-y-4">
        {/* Hardware Sliders */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl space-y-4 shadow-[0_0_25px_rgba(34,211,238,0.06)]">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-cyan-400 tracking-[0.15em] uppercase">
            <Monitor className="w-4 h-4" />
            <span>SYSTEM HARDWARE CONTROL</span>
          </div>

          {/* Volume Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
              <span className="flex items-center gap-1.5">
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                Master Volume
              </span>
              <span className="text-cyan-300 font-bold">{isMuted ? 'MUTED' : `${volume}%`}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
            />
          </div>

          {/* Brightness Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-400" />
                Display Brightness
              </span>
              <span className="text-amber-300 font-bold">{brightness}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={brightness}
              onChange={(e) => handleBrightnessChange(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
            />
          </div>

          {/* Instant Screenshot */}
          <div className="pt-2 border-t border-white/10">
            <button
              onClick={handleTakeScreenshot}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(34,211,238,0.15)]"
            >
              <Camera className="w-4 h-4" />
              <span>TAKE DESKTOP SCREENSHOT</span>
            </button>
          </div>
        </div>

        {/* System Power Management */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl space-y-3 shadow-[0_0_25px_rgba(34,211,238,0.06)]">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-rose-400 tracking-[0.15em] uppercase">
            <Power className="w-4 h-4" />
            <span>POWER & SECURITY STATE</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                sfx.playWarning();
                onExecuteCommand('system_power', { command: 'lock' });
              }}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-mono text-xs flex items-center gap-2 transition-all"
            >
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>LOCK PC</span>
            </button>

            <button
              onClick={() => {
                sfx.playWarning();
                onExecuteCommand('system_power', { command: 'sleep' });
              }}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-mono text-xs flex items-center gap-2 transition-all"
            >
              <Moon className="w-4 h-4 text-purple-400" />
              <span>SLEEP MODE</span>
            </button>

            <button
              onClick={() => {
                sfx.playWarning();
                onExecuteCommand('system_power', { command: 'restart' });
              }}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-mono text-xs flex items-center gap-2 transition-all"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>RESTART PC</span>
            </button>

            <button
              onClick={() => {
                sfx.playWarning();
                onExecuteCommand('system_power', { command: 'shutdown' });
              }}
              className="p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono text-xs flex items-center gap-2 transition-all"
            >
              <Power className="w-4 h-4 text-rose-400" />
              <span>SHUTDOWN</span>
            </button>
          </div>
        </div>
      </div>

      {/* Column 2: App Launcher & Active Processes */}
      <div className="space-y-4">
        {/* Fast App Launcher */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl space-y-3 shadow-[0_0_25px_rgba(34,211,238,0.06)]">
          <div className="flex items-center justify-between font-mono text-xs font-bold text-cyan-400 tracking-[0.15em] uppercase">
            <span className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              APPLICATION LAUNCHER
            </span>
            <span className="text-[10px] text-white/40">WINDOWS APIS</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {apps.map((app, idx) => (
              <button
                key={idx}
                onClick={() => {
                  sfx.playClick();
                  onExecuteCommand('open_application', { app_name: app.cmd });
                }}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-500/40 text-left text-xs font-mono text-slate-200 transition-all backdrop-blur-md"
              >
                <span className="text-base">{app.icon}</span>
                <span className="truncate">{app.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Task Manager Process Monitor */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl space-y-3 shadow-[0_0_25px_rgba(34,211,238,0.06)]">
          <div className="flex items-center justify-between font-mono text-xs font-bold text-purple-400 tracking-[0.15em] uppercase">
            <span className="flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              ACTIVE PROCESS MANAGER
            </span>
            <span className="text-[10px] text-white/40">{processes.length} RUNNING</span>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto no-scrollbar">
            {processes.map((proc) => (
              <div
                key={proc.pid}
                className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono backdrop-blur-md"
              >
                <div className="flex flex-col">
                  <span className="text-slate-200 font-semibold">{proc.name}</span>
                  <span className="text-[10px] text-white/40">
                    PID: {proc.pid} • CPU: {proc.cpu} • RAM: {proc.ram}
                  </span>
                </div>
                <button
                  onClick={() => handleKillProcess(proc.pid, proc.name)}
                  className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[10px] transition-all"
                  title="Kill Process"
                >
                  END TASK
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Column 3: File System Architect & Screenshot Preview */}
      <div className="space-y-4">
        {/* File System Architect */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl space-y-3 shadow-[0_0_25px_rgba(34,211,238,0.06)]">
          <div className="flex items-center justify-between font-mono text-xs font-bold text-emerald-400 tracking-[0.15em] uppercase">
            <span className="flex items-center gap-2">
              <Folder className="w-4 h-4" />
              FILE ARCHITECT &amp; VAULT
            </span>
          </div>

          <form onSubmit={handleAddFile} className="flex gap-2">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="e.g. notes/ai_routine.txt"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200 placeholder:text-white/30 outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              CREATE
            </button>
          </form>

          <div className="space-y-1.5 max-h-[180px] overflow-y-auto no-scrollbar">
            {fileList.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono backdrop-blur-md"
              >
                <div className="flex items-center gap-2 text-slate-300 truncate">
                  <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{file}</span>
                </div>
                <button
                  onClick={() => handleDeleteFile(file)}
                  className="text-white/40 hover:text-rose-400 p-1 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Screenshot View Preview */}
        {screenshot && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl space-y-2 shadow-[0_0_25px_rgba(34,211,238,0.06)]">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-400 tracking-wider">
              <span className="font-bold flex items-center gap-1.5 uppercase">
                <Camera className="w-3.5 h-3.5" />
                LAST CAPTURED SCREENSHOT
              </span>
              <button onClick={() => setScreenshot(null)} className="text-white/40 hover:text-white text-[10px]">
                CLOSE
              </button>
            </div>
            <div className="rounded-xl overflow-hidden border border-white/10 aspect-video bg-black/40">
              <img src={screenshot} alt="Screenshot" className="w-full h-full object-cover" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
