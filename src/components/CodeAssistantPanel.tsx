import React, { useState } from 'react';
import { Code, Play, Terminal, Sparkles, Copy, Check, FileCode, Bug, GitBranch } from 'lucide-react';
import { sfx } from '../lib/audio';

interface CodeAssistantPanelProps {
  onRunCodePrompt: (prompt: string) => void;
}

export const CodeAssistantPanel: React.FC<CodeAssistantPanelProps> = ({ onRunCodePrompt }) => {
  const [selectedLang, setSelectedLang] = useState('python');
  const [copied, setCopied] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState(
    `# LILI AI Operating System - Autonomous Python Module
import sys
import os

def lili_neural_check():
    print("Initializing LILI Neural Diagnostics...")
    gpu_status = "NVIDIA RTX 4090 - Active 120 FPS"
    memory_encrypted = True
    print(f"GPU: {gpu_status}")
    print(f"Vault Security: {'AES-256 Verified' if memory_encrypted else 'Unsecured'}")
    return True

if __name__ == "__main__":
    lili_neural_check()`
  );

  const [codeOutput, setCodeOutput] = useState<string | null>(null);

  const snippetsMap: Record<string, string> = {
    python: `# LILI AI Operating System - Autonomous Python Module
import sys
import os

def lili_neural_check():
    print("Initializing LILI Neural Diagnostics...")
    gpu_status = "NVIDIA RTX 4090 - Active 120 FPS"
    memory_encrypted = True
    print(f"GPU: {gpu_status}")
    print(f"Vault Security: {'AES-256 Verified' if memory_encrypted else 'Unsecured'}")
    return True

if __name__ == "__main__":
    lili_neural_check()`,
    react: `// LILI React Three Fiber Particle Hologram Component
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function LiliSphere() {
  const meshRef = useRef();
  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.01;
  });
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.5, 32, 32]} />
      <meshBasicMaterial color="#00e5ff" wireframe />
    </mesh>
  );
}`,
    typescript: `// LILI Type Definitions & Command Dispatcher
export interface LiliCommand {
  id: string;
  intent: 'pc_control' | 'smart_home' | 'web_search';
  payload: Record<string, any>;
}

export function dispatchLili(cmd: LiliCommand): boolean {
  console.log(\`[LILI_KERNEL]: Executing \${cmd.intent}\`);
  return true;
}`,
  };

  const handleLangChange = (lang: string) => {
    sfx.playClick();
    setSelectedLang(lang);
    if (snippetsMap[lang]) {
      setCodeSnippet(snippetsMap[lang]);
    }
  };

  const handleCopy = () => {
    sfx.playClick();
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateRun = () => {
    sfx.playSuccess();
    setCodeOutput('Executing code in LILI Sandboxed Node/Python Runtime...\n[OUTPUT]: Initializing LILI Neural Diagnostics...\nGPU: NVIDIA RTX 4090 - Active 120 FPS\nVault Security: AES-256 Verified\nExecution finished with exit code 0.');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full overflow-y-auto no-scrollbar p-1">
      {/* Left 2 Cols: Code Editor & Generator */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl space-y-3 lg:col-span-2 flex flex-col h-full shadow-[0_0_25px_rgba(34,211,238,0.06)]">
        <div className="flex items-center justify-between font-mono text-xs font-bold text-cyan-400 tracking-[0.15em] uppercase">
          <span className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            LILI CODE ASSISTANT &amp; DEBUGGER
          </span>

          <div className="flex items-center gap-2">
            {['python', 'react', 'typescript'].map((lang) => (
              <button
                key={lang}
                onClick={() => handleLangChange(lang)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase transition-all ${
                  selectedLang === lang
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_#22d3ee]'
                    : 'bg-white/5 text-white/40 hover:text-white border border-white/10'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Code Editor Box */}
        <div className="relative flex-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden font-mono text-xs p-3 backdrop-blur-md">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2 text-[10px] text-white/40">
            <span>FILE: main_{selectedLang}.ts</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'COPIED' : 'COPY'}</span>
            </button>
          </div>

          <textarea
            value={codeSnippet}
            onChange={(e) => setCodeSnippet(e.target.value)}
            rows={12}
            className="w-full h-full bg-transparent border-none outline-none text-slate-200 font-mono text-xs leading-relaxed resize-none"
          />
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between gap-2 pt-2">
          <button
            onClick={() => {
              sfx.playClick();
              onRunCodePrompt(`Generate a python script to automate file organization in my Downloads folder.`);
            }}
            className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-mono text-xs font-bold flex items-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>ASK LILI TO WRITE CODE</span>
          </button>

          <button
            onClick={handleSimulateRun}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_12px_#22d3ee]"
          >
            <Play className="w-4 h-4" />
            <span>RUN CODE</span>
          </button>
        </div>
      </div>

      {/* Right Col: Output Console & Git Status */}
      <div className="space-y-4">
        {/* Output Window */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl space-y-3 shadow-[0_0_25px_rgba(34,211,238,0.06)]">
          <div className="flex items-center justify-between font-mono text-xs font-bold text-emerald-400 tracking-[0.15em] uppercase">
            <span className="flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              EXECUTION OUTPUT
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3 font-mono text-xs text-slate-300 min-h-[160px] whitespace-pre-wrap leading-relaxed backdrop-blur-md">
            {codeOutput ? codeOutput : '// Output window standby. Click "RUN CODE" above.'}
          </div>
        </div>

        {/* Git Repository Status */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl space-y-3 shadow-[0_0_25px_rgba(34,211,238,0.06)]">
          <div className="flex items-center justify-between font-mono text-xs font-bold text-amber-400 tracking-[0.15em] uppercase">
            <span className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              GIT CONTROL MATRIX
            </span>
            <span className="text-[10px] text-emerald-400">main Branch</span>
          </div>

          <div className="space-y-1.5 font-mono text-xs text-slate-400">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex justify-between">
              <span>Last Commit:</span>
              <span className="text-slate-200">a9f82d1 ("LILI Phase 10")</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex justify-between">
              <span>Modified Files:</span>
              <span className="text-cyan-400">0 files pending</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
