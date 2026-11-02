import React, { useState, useEffect, useCallback } from 'react';
import { HUDHeader } from './components/HUDHeader';
import { Hologram3D } from './components/Hologram3D';
import { VoiceController } from './components/VoiceController';
import { ConsoleTerminal } from './components/ConsoleTerminal';
import { PCControlPanel } from './components/PCControlPanel';
import { SmartHomePanel } from './components/SmartHomePanel';
import { InternetWebPanel } from './components/InternetWebPanel';
import { ProductivityPanel } from './components/ProductivityPanel';
import { CodeAssistantPanel } from './components/CodeAssistantPanel';
import { AutomationEngine } from './components/AutomationEngine';
import { MemoryVaultPanel } from './components/MemoryVaultPanel';
import { SecurityPanel } from './components/SecurityPanel';
import { DeviceSyncPanel } from './components/DeviceSyncPanel';
import { WeatherPanel } from './components/WeatherPanel';
import { CalendarFestivalPanel } from './components/CalendarFestivalPanel';
import { GeminiStudioHub } from './components/GeminiStudioHub';
import { SettingsModal } from './components/SettingsModal';

import { AIState, ChatMessage, SystemStats, VoiceSettings } from './types';
import { tts, sfx } from './lib/audio';
import {
  Radio,
  Sparkles,
  Terminal,
  Volume2,
  ShieldAlert,
  Zap,
  Globe,
  Lock,
  RotateCcw,
} from 'lucide-react';

export function App() {
  const [aiState, setAiState] = useState<AIState>('idle');
  const [activeTab, setActiveTab] = useState<string>('core');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [hudToast, setHudToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);
  const [screenFlash, setScreenFlash] = useState<boolean>(false);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    setHudToast({ message, type });
    setTimeout(() => setHudToast(null), 4000);
  }, []);

  // Settings
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    wakeWord: 'lili',
    voicePitch: 1.15,
    voiceRate: 1.05,
    autoListen: true,
    themeAccent: 'cyan',
    hindiSupport: true,
    selectedLanguage: 'hi-IN',
  });

  // Messages / Terminal Log
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'boot-1',
      sender: 'system',
      text: 'LILI AI OS v4.5 initialized. Three.js Particle Mesh Core: ONLINE.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    {
      id: 'boot-2',
      sender: 'lili',
      text: 'Good day, Boss. I am online and listening. Say "Hey Lili" or type a command to begin.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // System Stats Telemetry
  const [systemStats, setSystemStats] = useState<SystemStats>({
    cpuUsage: 14,
    ramUsage: 38,
    gpuUsage: 22,
    networkSpeedKbps: 1024,
  });

  // Simulated live telemetry fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStats({
        cpuUsage: Math.floor(12 + Math.random() * 15),
        ramUsage: Math.floor(36 + Math.random() * 6),
        gpuUsage: Math.floor(18 + Math.random() * 20),
        networkSpeedKbps: Math.floor(800 + Math.random() * 600),
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Update TTS Settings
  useEffect(() => {
    tts.setPitch(voiceSettings.voicePitch);
    tts.setRate(voiceSettings.voiceRate);
  }, [voiceSettings]);

  // Add Message to Console
  const addMessage = useCallback(
    (sender: 'user' | 'lili' | 'system', text: string, toolCall?: any) => {
      const newMsg: ChatMessage = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
        sender,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolCall,
      };
      setMessages((prev) => [...prev, newMsg]);
    },
    []
  );

  // Stop current speech output immediately
  const handleStopSpeech = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    tts.stop();
    setIsProcessing(false);
    setAiState('idle');
  };

  // Send Command to LILI Backend API
  const handleUserCommand = async (userInput: string) => {
    if (!userInput.trim()) return;

    const lower = userInput.trim().toLowerCase();

    // Instant Stop Command Handler
    const isStop =
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
      lower.includes('stop lili');

    if (isStop) {
      handleStopSpeech();
      addMessage('user', userInput);
      addMessage('lili', 'Speech output stopped, Boss. Standing by.');
      return;
    }

    // Always interrupt previous speech on receiving a new command
    handleStopSpeech();

    setIsProcessing(true);
    setAiState('thinking');
    sfx.playProcessingBeep();

    // Prepare history payload for multi-turn conversational context (last 4 turns for rapid inference)
    const historyPayload = messages
      .filter((m) => m.sender === 'user' || m.sender === 'lili')
      .slice(-4)
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
      }));

    // Add user message
    addMessage('user', userInput);

    try {
      const response = await fetch('/api/lili/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userInput, history: historyPayload }),
      });

      const data = await response.json();

      let replyText = data.text || data.fallbackText || 'जी बॉस, मैं आपके निर्देश पर कार्य करने के लिए तैयार हूँ।';
      let toolCall = data.toolCall;

      // Add LILI Response
      addMessage('lili', replyText, toolCall);

      // Trigger client tool actions if present
      if (toolCall) {
        if (toolCall.name === 'control_pc' && toolCall.args) {
          handleExecutePCCommand(toolCall.args.action || 'command', toolCall.args);
        } else if (toolCall.name === 'control_smart_home' && toolCall.args) {
          handleSmartHomeAction(toolCall.args.device || 'Home', toolCall.args.action || 'trigger', toolCall.args.value);
        }
      }

      // Trigger Voice TTS
      setAiState('speaking');
      sfx.playSuccess();

      await tts.speak(replyText);

      // Set back to idle
      setAiState('idle');
    } catch (err) {
      console.error('Error contacting LILI backend:', err);
      const fallback = 'I am currently operating in offline backup mode, Boss. Command logged.';
      addMessage('lili', fallback);
      setAiState('speaking');
      await tts.speak(fallback);
      setAiState('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  // Triggered when mic wake word or voice transcript is recognized
  const handleVoiceTranscript = (transcript: string) => {
    if (!transcript.trim()) return;
    handleUserCommand(transcript);
  };

  // Directly speak in LILI's voice without roundtrip LLM re-prompt
  const handleDirectLiliSpeech = async (text: string) => {
    handleStopSpeech();
    addMessage('lili', text);
    setAiState('speaking');
    sfx.playSuccess();
    await tts.speak(text);
    setAiState('idle');
  };

  // Smart Home Direct Action Handler
  const handleSmartHomeAction = async (device: string, action: string, value?: any) => {
    addMessage('system', `[IOT_HUB]: ${device} -> Action: ${action} ${value !== undefined ? `(${value})` : ''}`);
    sfx.playClick();
    showToast(`🏠 SMART HOME: ${device} -> ${action.toUpperCase()} ${value ? `(${value})` : ''}`, 'success');
    try {
      await fetch('/api/lili/smarthome/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceName: device, action, value }),
      });
    } catch (e) {}
  };

  // Scene Trigger Handler
  const handleTriggerScene = (sceneId: string) => {
    handleUserCommand(`Activate smart home scene: ${sceneId}`);
  };

  // Execute PC Direct Command
  const handleExecutePCCommand = (cmd: string, args?: any) => {
    addMessage('system', `[PC_KERNEL]: Execute ${cmd} with parameters ${JSON.stringify(args || {})}`);
    sfx.playClick();

    const target = (args?.target || args?.query || cmd || '').toLowerCase();

    if (cmd === 'open_app' || cmd === 'open_url' || cmd === 'launch' || cmd === 'open_tab') {
      if (target.includes('calendar') || target.includes('festival') || target.includes('tyohar') || target.includes('panchang')) {
        setActiveTab('calendar');
        showToast('📅 SWITCHED TO CALENDAR & FESTIVALS HUB', 'success');
        return;
      }
      let url = '';
      if (target.includes('youtube')) url = 'https://www.youtube.com';
      else if (target.includes('spotify') || target.includes('music') || target.includes('gaana')) url = 'https://open.spotify.com';
      else if (target.includes('chrome') || target.includes('browser') || target.includes('google')) url = 'https://www.google.com';
      else if (target.includes('whatsapp')) url = 'https://web.whatsapp.com';
      else if (target.includes('code') || target.includes('vscode')) url = 'https://vscode.dev';
      else if (target.includes('github')) url = 'https://github.com';
      else if (target.includes('calculator')) url = 'https://www.google.com/search?q=calculator';
      
      if (url) {
        try {
          window.open(url, '_blank');
          showToast(`⚡ OPENED: ${args.target || 'Application'}`, 'success');
        } catch {
          showToast(`⚡ POPUP BLOCKED: Launch ${args.target || 'Application'}`, 'info');
        }
      } else {
        showToast(`⚡ EXECUTED: Launch ${args.target || cmd}`, 'success');
      }
    } else if (cmd === 'web_search') {
      const q = args?.query || target;
      if (q) {
        try {
          window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank');
          showToast(`🔍 GOOGLE SEARCH: "${q}"`, 'success');
        } catch {
          showToast(`🔍 SEARCH: "${q}"`, 'info');
        }
      }
    } else if (cmd === 'set_volume') {
      showToast(`🔊 SYSTEM VOLUME: ${args?.target || '80'}%`, 'info');
      sfx.playSuccess();
    } else if (cmd === 'set_brightness') {
      showToast(`☀️ DISPLAY BRIGHTNESS: ${args?.target || '75'}%`, 'info');
    } else if (cmd === 'take_screenshot') {
      setScreenFlash(true);
      setTimeout(() => setScreenFlash(false), 350);
      sfx.playSuccess();
      showToast(`📸 SCREENSHOT CAPTURED TO MEDIA VAULT`, 'success');
    } else {
      showToast(`⚡ EXECUTED: ${cmd} ${args?.target ? `(${args.target})` : ''}`, 'success');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#020617] text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 relative">
      {/* Screen Camera Flash Overlay */}
      {screenFlash && <div className="fixed inset-0 bg-white z-50 animate-pulse pointer-events-none" />}

      {/* Sci-Fi HUD Action Executed Toast Banner */}
      {hudToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-900/95 border border-cyan-500/50 text-cyan-400 text-xs font-mono tracking-wider shadow-[0_0_25px_rgba(6,182,212,0.4)] backdrop-blur-md animate-bounce">
          <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>{hudToast.message}</span>
        </div>
      )}

      {/* Frosted Glass Radial Ambient Glow Backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#1e293b_0%,_transparent_70%)] opacity-40 pointer-events-none z-0" />

      {/* Sci-Fi Top Telemetry Header */}
      <div className="relative z-10">
        <HUDHeader
          aiState={aiState}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            sfx.playClick();
            setActiveTab(tab);
          }}
          systemStats={systemStats}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </div>

      {/* Main Workspace Body */}
      <main className="flex-1 flex flex-col p-3 overflow-hidden relative z-10">
        {/* TAB 1: 3D Hologram Core View & Side Terminal */}
        {activeTab === 'core' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full overflow-hidden">
            {/* 3D Holographic Core Viewport (Left 7 Cols) */}
            <div className="lg:col-span-7 flex flex-col h-full bg-white/5 border border-white/10 rounded-2xl overflow-hidden relative shadow-[0_0_30px_rgba(34,211,238,0.08)] backdrop-blur-xl">
              {/* Sci-Fi Canvas HUD Overlay */}
              <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_10px_#22d3ee] animate-pulse" />
                  <span className="font-mono text-xs font-bold text-cyan-300 tracking-[0.2em] uppercase">
                    THREE.JS NEURAL HOLOGRAM MESH
                  </span>
                </div>
                <div className="font-mono text-[10px] text-cyan-400/80 bg-white/5 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10">
                  GPU ACCELERATED • 120 FPS
                </div>
              </div>

              {/* Hologram Canvas Viewport */}
              <div className="flex-1 relative w-full h-full min-h-[300px]">
                <Hologram3D aiState={aiState} accentColor={voiceSettings.themeAccent} />
              </div>

              {/* Bottom Voice Controller Pill overlay */}
              <div className="p-4 z-10 bg-gradient-to-t from-[#020617]/90 via-[#020617]/60 to-transparent backdrop-blur-md border-t border-white/5">
                <VoiceController
                  aiState={aiState}
                  onTranscript={handleVoiceTranscript}
                  onStopSpeech={handleStopSpeech}
                  onWakeWordDetected={() => {
                    setAiState('listening');
                    sfx.playWakeBeep();
                  }}
                  wakeWord={voiceSettings.wakeWord}
                  autoListen={voiceSettings.autoListen}
                  selectedLanguage={voiceSettings.selectedLanguage}
                  onLanguageChange={(lang) =>
                    setVoiceSettings((prev) => ({ ...prev, selectedLanguage: lang }))
                  }
                />
              </div>
            </div>

            {/* Console Terminal View (Right 5 Cols) */}
            <div className="lg:col-span-5 h-full overflow-hidden">
              <ConsoleTerminal
                messages={messages}
                onSendMessage={handleUserCommand}
                onClearLogs={() => setMessages([])}
                isProcessing={isProcessing}
              />
            </div>
          </div>
        )}

        {/* TAB: Gemini Studio AI Suite */}
        {activeTab === 'gemini_studio' && (
          <div className="h-full overflow-y-auto">
            <GeminiStudioHub />
          </div>
        )}

        {/* TAB: Calendar & Festivals Hub */}
        {activeTab === 'calendar' && (
          <div className="h-full overflow-hidden">
            <CalendarFestivalPanel onSpeak={handleDirectLiliSpeech} />
          </div>
        )}

        {/* TAB 2: Real-time Weather & Climate Satellite */}
        {activeTab === 'weather' && (
          <div className="h-full overflow-hidden">
            <WeatherPanel onSpeakWeather={handleDirectLiliSpeech} />
          </div>
        )}

        {/* TAB 3: Device Connectivity & Remote Control */}
        {activeTab === 'devices' && (
          <div className="h-full overflow-hidden">
            <DeviceSyncPanel onExecuteCommand={handleExecutePCCommand} />
          </div>
        )}

        {/* TAB 3: PC Control Suite */}
        {activeTab === 'pc' && (
          <div className="h-full overflow-hidden">
            <PCControlPanel onExecuteCommand={handleExecutePCCommand} />
          </div>
        )}

        {/* TAB 3: Live Internet & Web Search */}
        {activeTab === 'web' && (
          <div className="h-full overflow-hidden">
            <InternetWebPanel onSearchWeb={(q) => handleUserCommand(`Search web for: ${q}`)} />
          </div>
        )}

        {/* TAB 4: Smart Home IoT Matrix */}
        {activeTab === 'smarthome' && (
          <div className="h-full overflow-hidden">
            <SmartHomePanel
              onControlDevice={handleSmartHomeAction}
              onTriggerScene={handleTriggerScene}
            />
          </div>
        )}

        {/* TAB 5: Productivity & Task Planner */}
        {activeTab === 'productivity' && (
          <div className="h-full overflow-hidden">
            <ProductivityPanel onAskLili={handleUserCommand} />
          </div>
        )}

        {/* TAB 6: Code Assistant & Debugger */}
        {activeTab === 'code' && (
          <div className="h-full overflow-hidden">
            <CodeAssistantPanel onRunCodePrompt={handleUserCommand} />
          </div>
        )}

        {/* TAB 7: Automation Routines */}
        {activeTab === 'automation' && (
          <div className="h-full overflow-hidden">
            <AutomationEngine onRunRoutine={(r) => handleUserCommand(`Execute routine: ${r}`)} />
          </div>
        )}

        {/* TAB 8: Encrypted Memory Vault */}
        {activeTab === 'memory' && (
          <div className="h-full overflow-hidden">
            <MemoryVaultPanel
              onSaveFact={(fact) => handleUserCommand(`Remember this fact: ${fact}`)}
            />
          </div>
        )}

        {/* TAB 9: Security Guardian Audit Trail */}
        {activeTab === 'security' && (
          <div className="h-full overflow-hidden">
            <SecurityPanel
              onTogglePrivacy={(isPrivate) => {
                setAiState(isPrivate ? 'private' : 'idle');
                addMessage(
                  'system',
                  `[GUARDIAN]: Private Mode set to ${isPrivate ? 'ENABLED' : 'DISABLED'}`
                );
              }}
            />
          </div>
        )}
      </main>

      {/* Persistent Voice Command Quick Dock (when not on Core tab) */}
      {activeTab !== 'core' && (
        <div className="p-2.5 bg-white/5 border-t border-white/10 backdrop-blur-xl flex items-center justify-center relative z-20 shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
          <VoiceController
            aiState={aiState}
            onTranscript={handleVoiceTranscript}
            onStopSpeech={handleStopSpeech}
            onWakeWordDetected={() => {
              setAiState('listening');
              sfx.playWakeBeep();
            }}
            wakeWord={voiceSettings.wakeWord}
            autoListen={voiceSettings.autoListen}
            selectedLanguage={voiceSettings.selectedLanguage}
            onLanguageChange={(lang) =>
              setVoiceSettings((prev) => ({ ...prev, selectedLanguage: lang }))
            }
          />
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={voiceSettings}
        onUpdateSettings={(newSet) => setVoiceSettings((prev) => ({ ...prev, ...newSet }))}
      />
    </div>
  );
}
export default App;
