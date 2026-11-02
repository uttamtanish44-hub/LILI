import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  UserCheck,
  KeyRound,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  List,
} from 'lucide-react';
import { sfx } from '../lib/audio';

interface SecurityPanelProps {
  onTogglePrivacy: (enabled: boolean) => void;
}

export const SecurityPanel: React.FC<SecurityPanelProps> = ({ onTogglePrivacy }) => {
  const [privacyMode, setPrivacyMode] = useState(false);
  const [speakerVerified, setSpeakerVerified] = useState(true);

  const [auditLogs] = useState([
    { id: '1', time: '08:30:12', action: 'VOICEPRINT_VERIFIED', status: 'SUCCESS', details: 'User Voice match 98.4% (Speaker: Tanish / Boss)' },
    { id: '2', time: '08:28:45', action: 'AES_VAULT_DECRYPT', status: 'GRANTED', details: 'RAM Context decrypted' },
    { id: '3', time: '08:25:02', action: 'SMART_HOME_MUTATION', status: 'EXECUTED', details: 'Living Room Lights -> 80%' },
    { id: '4', time: '08:15:30', action: 'TERMINAL_COMMAND', status: 'EXECUTED', details: 'code.exe process started' },
  ]);

  const togglePrivacy = () => {
    sfx.playWarning();
    const nextVal = !privacyMode;
    setPrivacyMode(nextVal);
    onTogglePrivacy(nextVal);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full overflow-y-auto no-scrollbar p-1 font-mono text-xs">
      {/* Column 1: Voice Biometrics & Guardian Shield */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl space-y-4 shadow-[0_0_25px_rgba(34,211,238,0.06)]">
        <div className="flex items-center justify-between font-bold text-rose-400 tracking-[0.15em] uppercase">
          <span className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            GUARDIAN SECURITY LAYER
          </span>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/30">
            ACTIVE
          </span>
        </div>

        {/* Voice Biometrics Box */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              Speaker Voiceprint
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                speakerVerified
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              {speakerVerified ? 'VERIFIED OWNER' : 'UNAUTHORIZED'}
            </span>
          </div>
          <p className="text-[10px] text-white/40">
            ECAPA-TDNN Neural model verifies vocal frequencies before executing high-privilege OS tasks.
          </p>
        </div>

        {/* Privacy Offline Mode Toggle */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-3 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-300">
              {privacyMode ? <EyeOff className="w-4 h-4 text-purple-400" /> : <Eye className="w-4 h-4 text-cyan-400" />}
              Private Offline Mode
            </span>
            <button
              onClick={togglePrivacy}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                privacyMode
                  ? 'bg-purple-500 text-slate-950 shadow-[0_0_10px_#c084fc]'
                  : 'bg-white/5 border border-white/10 text-white/40 hover:text-white'
              }`}
            >
              {privacyMode ? 'ON' : 'OFF'}
            </button>
          </div>
          <p className="text-[10px] text-white/40">
            When ON, cloud requests are muted and LILI relies on local memory and encrypted sandboxes.
          </p>
        </div>
      </div>

      {/* Column 2 & 3: Audit Trail Log Stream */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl space-y-3 lg:col-span-2 shadow-[0_0_25px_rgba(34,211,238,0.06)]">
        <div className="flex items-center justify-between font-bold text-cyan-400 tracking-[0.15em] uppercase">
          <span className="flex items-center gap-2">
            <List className="w-4 h-4" />
            SECURITY AUDIT LOG TRAIL
          </span>
          <span className="text-[10px] text-white/40">ZERO-TRUST ENGINE</span>
        </div>

        <div className="space-y-2 max-h-[320px] overflow-y-auto no-scrollbar">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 backdrop-blur-md"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold text-slate-200">{log.action}</span>
                  <span className="text-[10px] text-white/40">{log.details}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-white/40">{log.time}</span>
                <div className="text-[10px] text-emerald-400 font-bold">{log.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
