import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Video,
  Search,
  MapPin,
  Brain,
  Eye,
  Zap,
  Mic,
  Volume2,
  Film,
  Download,
  Loader2,
  Upload,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  ExternalLink,
} from 'lucide-react';

interface GroundingSource {
  title?: string;
  uri?: string;
  url?: string;
}

export function GeminiStudioHub() {
  const [activeTab, setActiveTab] = useState<
    | 'image_edit'
    | 'live_voice'
    | 'veo_video'
    | 'search_ground'
    | 'pro_image'
    | 'maps_ground'
    | 'intelligence'
    | 'vision_analyze'
    | 'low_latency'
    | 'high_thinking'
    | 'audio_transcribe'
  >('image_edit');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Image Create & Edit State
  const [imgEditPrompt, setImgEditPrompt] = useState('Add cyberpunk holographic armor to this character');
  const [imgEditBase64, setImgEditBase64] = useState<string | null>(null);
  const [imgEditResultUrl, setImgEditResultUrl] = useState<string | null>(null);
  const [imgEditText, setImgEditText] = useState<string>('');

  // 2. Live Voice State
  const [liveConnected, setLiveConnected] = useState(false);
  const [liveLog, setLiveLog] = useState<{ sender: 'user' | 'lili'; text: string }[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // 3. Veo Video State
  const [veoPrompt, setVeoPrompt] = useState('A sleek futuristic hovercraft gliding over a neon cyberpunk city at sunset');
  const [veoImageBase64, setVeoImageBase64] = useState<string | null>(null);
  const [veoAspectRatio, setVeoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [veoProgress, setVeoProgress] = useState<string>('');
  const [veoVideoBlobUrl, setVeoVideoBlobUrl] = useState<string | null>(null);

  // 4. Search Grounding State
  const [searchPrompt, setSearchPrompt] = useState('What are the latest tech breakthroughs in quantum computing this week?');
  const [searchResultText, setSearchResultText] = useState('');
  const [searchSources, setSearchSources] = useState<GroundingSource[]>([]);

  // 5. High-Quality Pro Image State
  const [proImagePrompt, setProImagePrompt] = useState('Ultra-realistic 8K photorealistic portrait of an AI android with glowing luminescent circuit patterns');
  const [proImageSize, setProImageSize] = useState<'1K' | '2K' | '4K'>('4K');
  const [proImageAspect, setProImageAspect] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('16:9');
  const [proImageResultUrl, setProImageResultUrl] = useState<string | null>(null);

  // 6. Maps Grounding State
  const [mapsPrompt, setMapsPrompt] = useState('Find top rated coffee shops near Connaught Place in New Delhi with opening hours');
  const [mapsResultText, setMapsResultText] = useState('');
  const [mapsSources, setMapsSources] = useState<any[]>([]);

  // 7. Intelligence State
  const [intelPrompt, setIntelPrompt] = useState('Design a scalable event-driven microservices architecture for real-time telemetry streaming');
  const [intelTaskType, setIntelTaskType] = useState<'complex' | 'general' | 'fast'>('complex');
  const [intelResultText, setIntelResultText] = useState('');
  const [intelModelUsed, setIntelModelUsed] = useState('');

  // 8. Vision Analyze State
  const [visionImageBase64, setVisionImageBase64] = useState<string | null>(null);
  const [visionPrompt, setVisionPrompt] = useState('Describe what you see in this image in high detail and extract any visible text or status codes.');
  const [visionResultText, setVisionResultText] = useState('');

  // 9. Low Latency State
  const [lowLatPrompt, setLowLatPrompt] = useState('Quickly explain what a WebSocket handshake is in 2 sentences.');
  const [lowLatResultText, setLowLatResultText] = useState('');
  const [lowLatMs, setLowLatMs] = useState<number | null>(null);

  // 10. High Thinking State
  const [thinkingPrompt, setThinkingPrompt] = useState('Solve this step by step: Prove that for any positive integer n, 3^(2n+1) + 2^(n+2) is divisible by 7.');
  const [thinkingResultText, setThinkingResultText] = useState('');

  // 11. Audio Transcribe State
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [transcribeBase64, setTranscribeBase64] = useState<string | null>(null);
  const [transcribeResultText, setTranscribeResultText] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Cleanup Live WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // File to Base64 helper
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      callback(result);
    };
    reader.readAsDataURL(file);
  };

  // -------------------------------------------------------------
  // Handlers for features
  // -------------------------------------------------------------

  // 1. Create / Edit Image
  const handleCreateEditImage = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gemini/image/create-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imgEditPrompt,
          imageBase64: imgEditBase64,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create/edit image');
      setImgEditResultUrl(data.imageUrl);
      setImgEditText(data.text || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Live Voice Toggle
  const toggleLiveSession = () => {
    if (liveConnected) {
      if (wsRef.current) wsRef.current.close();
      setLiveConnected(false);
      setLiveLog((prev) => [...prev, { sender: 'lili', text: '[Live voice session terminated]' }]);
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/live`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setLiveConnected(true);
      setLiveLog([{ sender: 'lili', text: 'Live API WebSocket connected. Speaking model initialized.' }]);
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.text) {
          setLiveLog((prev) => [...prev, { sender: 'lili', text: parsed.text }]);
        }
      } catch (e) {}
    };

    ws.onclose = () => {
      setLiveConnected(false);
    };

    wsRef.current = ws;
  };

  // 3. Veo Video Generation
  const handleGenerateVeoVideo = async () => {
    setLoading(true);
    setError(null);
    setVeoVideoBlobUrl(null);
    setVeoProgress('Initializing Veo 3.1 video generation pipeline...');

    try {
      const startRes = await fetch('/api/gemini/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: veoPrompt,
          imageBase64: veoImageBase64,
          aspectRatio: veoAspectRatio,
        }),
      });

      const startData = await startRes.json();
      if (!startRes.ok) throw new Error(startData.error || 'Veo start failed');

      const { operationName } = startData;
      setVeoProgress('Video rendering in progress on Veo GPU cluster (this may take up to 30s)...');

      // Poll every 3 seconds
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        try {
          const statusRes = await fetch('/api/gemini/video/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operationName }),
          });
          const statusData = await statusRes.json();

          if (statusData.done) {
            clearInterval(interval);
            setVeoProgress('Video rendering finished! Downloading high-definition MP4 stream...');

            const downloadRes = await fetch('/api/gemini/video/download', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ operationName }),
            });

            if (!downloadRes.ok) throw new Error('Failed to download video file');
            const blob = await downloadRes.blob();
            const blobUrl = URL.createObjectURL(blob);
            setVeoVideoBlobUrl(blobUrl);
            setVeoProgress('');
            setLoading(false);
          } else {
            setVeoProgress(`Rendering video... Step ${attempts} (checking status...)`);
          }
        } catch (pollErr: any) {
          clearInterval(interval);
          setError(pollErr.message || 'Error polling video status');
          setLoading(false);
        }
      }, 3500);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // 4. Search Grounding
  const handleSearchGrounding = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gemini/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: searchPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search grounding failed');
      setSearchResultText(data.text);
      setSearchSources(data.sources || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 5. Pro High-Res Image
  const handleProImageGen = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gemini/image/pro-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: proImagePrompt,
          imageSize: proImageSize,
          aspectRatio: proImageAspect,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Pro image generation failed');
      setProImageResultUrl(data.imageUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 6. Maps Grounding
  const handleMapsGrounding = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gemini/maps-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: mapsPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Maps grounding failed');
      setMapsResultText(data.text);
      setMapsSources(data.sources || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 7. Intelligence Router
  const handleIntelligence = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gemini/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: intelPrompt, taskType: intelTaskType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Intelligence query failed');
      setIntelResultText(data.text);
      setIntelModelUsed(data.modelUsed);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 8. Vision Analyze
  const handleVisionAnalyze = async () => {
    if (!visionImageBase64) {
      setError('Please upload an image to analyze first.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gemini/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: visionPrompt, imageBase64: visionImageBase64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Image analysis failed');
      setVisionResultText(data.text);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 9. Low Latency
  const handleLowLatency = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gemini/low-latency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: lowLatPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Low latency query failed');
      setLowLatResultText(data.text);
      setLowLatMs(data.latencyMs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 10. High Thinking Mode
  const handleHighThinking = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gemini/high-thinking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: thinkingPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'High thinking reasoning failed');
      setThinkingResultText(data.text);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 11. Audio Transcribe (Mic recording / File upload)
  const startRecordingAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setTranscribeBase64(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
      };
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecordingAudio(true);
    } catch (err) {
      setError('Microphone access denied or unsupported.');
    }
  };

  const stopRecordingAudio = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
    }
  };

  const handleTranscribeAudio = async () => {
    if (!transcribeBase64) {
      setError('Please record mic audio or upload an audio clip first.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gemini/transcribe-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64: transcribeBase64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Audio transcription failed');
      setTranscribeResultText(data.transcription);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-4 sm:p-6 backdrop-blur-md shadow-2xl text-slate-100 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-cyan-500/20 pb-4 mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-400/40 rounded-lg text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wide text-cyan-300 font-mono">
              LILI MULTIMODAL GEMINI STUDIO
            </h2>
            <p className="text-xs text-slate-400">
              Complete Gemini 3 & Veo AI Suite Engine • Connected to Server-Side API Keys
            </p>
          </div>
        </div>
      </div>

      {/* Feature Selector Tabs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
        {[
          { id: 'image_edit', label: 'Create & Edit Images', icon: ImageIcon, model: 'gemini-3.1-flash-image-preview' },
          { id: 'live_voice', label: 'Voice Conversation', icon: Mic, model: 'gemini-3.1-flash-live-preview' },
          { id: 'veo_video', label: 'Animate Image to Video', icon: Film, model: 'veo-3.1-fast-generate-preview' },
          { id: 'search_ground', label: 'Search Grounding', icon: Search, model: 'gemini-3.5-flash' },
          { id: 'pro_image', label: 'High-Res Pro Image (4K)', icon: Sparkles, model: 'gemini-3-pro-image-preview' },
          { id: 'maps_ground', label: 'Maps Grounding', icon: MapPin, model: 'gemini-3.5-flash' },
          { id: 'intelligence', label: 'Gemini Intelligence', icon: Brain, model: 'gemini-3.1-pro-preview' },
          { id: 'vision_analyze', label: 'Analyze Images', icon: Eye, model: 'gemini-3.1-pro-preview' },
          { id: 'low_latency', label: 'Low-Latency Responses', icon: Zap, model: 'gemini-3.1-flash-lite' },
          { id: 'high_thinking', label: 'High Thinking Mode', icon: Sliders, model: 'gemini-3.1-pro-preview' },
          { id: 'audio_transcribe', label: 'Transcribe Audio', icon: Volume2, model: 'gemini-3.5-flash' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setError(null);
              }}
              className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
                isActive
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.25)] scale-[1.02]'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className="text-[9px] px-1 py-0.5 bg-slate-950/80 rounded border border-slate-700 text-slate-400 font-mono">
                  {tab.model.split('-')[1]}
                </span>
              </div>
              <span className="text-xs font-semibold font-mono leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-200 text-xs font-mono">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Feature Workspace Container */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 min-h-[380px]">
        {/* 1. Create & Edit Images */}
        {activeTab === 'image_edit' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-cyan-300 font-mono text-sm font-semibold">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span>Text Prompt Image Creation & Editing (`gemini-3.1-flash-image-preview`)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-xs font-mono text-slate-400">1. Upload Source Image (Optional for Editing):</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-3 flex items-center justify-center gap-2 text-xs font-mono text-slate-300 transition-colors">
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>{imgEditBase64 ? 'Image Selected (Click to change)' : 'Select Image to Edit'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, setImgEditBase64)}
                    />
                  </label>
                  {imgEditBase64 && (
                    <button
                      onClick={() => setImgEditBase64(null)}
                      className="px-2.5 py-3 bg-red-950/60 border border-red-700/50 rounded-lg text-red-300 text-xs hover:bg-red-900/60"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <label className="text-xs font-mono text-slate-400">2. Prompt / Edit Instruction:</label>
                <textarea
                  value={imgEditPrompt}
                  onChange={(e) => setImgEditPrompt(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 font-mono focus:border-cyan-400 focus:outline-none"
                  placeholder="Describe what image to create or how to modify the uploaded image..."
                />

                <button
                  onClick={handleCreateEditImage}
                  disabled={loading}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold font-mono text-xs rounded-lg flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{imgEditBase64 ? 'Edit Image with Gemini' : 'Generate Image with Gemini'}</span>
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col items-center justify-center min-h-[220px]">
                {imgEditResultUrl ? (
                  <div className="w-full space-y-2 text-center">
                    <img src={imgEditResultUrl} alt="Generated" className="max-h-[240px] mx-auto rounded-lg border border-cyan-500/30 object-contain" />
                    <a
                      href={imgEditResultUrl}
                      download="gemini-generated.png"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950 border border-cyan-600/50 rounded text-cyan-300 text-xs font-mono hover:bg-cyan-900/60"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Result Image</span>
                    </a>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 text-xs font-mono">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Generated or edited image will display here
                  </div>
                )}
                {imgEditText && <p className="text-xs font-mono text-slate-300 mt-2">{imgEditText}</p>}
              </div>
            </div>
          </div>
        )}

        {/* 2. Real-Time Voice Conversation */}
        {activeTab === 'live_voice' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-cyan-300 font-mono text-sm font-semibold">
                <Mic className="w-4 h-4 text-cyan-400" />
                <span>Real-Time Voice Conversation Live API (`gemini-3.1-flash-live-preview`)</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded font-mono ${liveConnected ? 'bg-emerald-950 text-emerald-400 border border-emerald-600' : 'bg-slate-800 text-slate-400'}`}>
                {liveConnected ? 'LIVE SESSION ACTIVE' : 'DISCONNECTED'}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-6 bg-slate-900/80 border border-slate-800 rounded-lg">
              <button
                onClick={toggleLiveSession}
                className={`p-6 rounded-full border-2 transition-all ${
                  liveConnected
                    ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.4)]'
                    : 'bg-cyan-500/20 border-cyan-400 text-cyan-300 hover:scale-105 shadow-[0_0_25px_rgba(6,182,212,0.3)]'
                }`}
              >
                <Mic className="w-8 h-8" />
              </button>
              <p className="text-xs font-mono text-slate-300 mt-3 font-semibold">
                {liveConnected ? 'Tap to End Voice Connection' : 'Tap to Connect Real-Time Live Voice with LILI'}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 max-h-[180px] overflow-y-auto space-y-2 font-mono text-xs">
              {liveLog.length === 0 ? (
                <p className="text-slate-500 text-center py-4">Live API conversation logs will appear here...</p>
              ) : (
                liveLog.map((log, i) => (
                  <div key={i} className={`p-2 rounded ${log.sender === 'user' ? 'bg-slate-800 text-slate-200' : 'bg-cyan-950/60 border border-cyan-500/30 text-cyan-300'}`}>
                    <span className="font-bold mr-2">[{log.sender === 'user' ? 'Boss' : 'LILI Live'}]</span>
                    <span>{log.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 3. Veo Video Generation */}
        {activeTab === 'veo_video' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-cyan-300 font-mono text-sm font-semibold">
                <Film className="w-4 h-4 text-cyan-400" />
                <span>Animate Images into HD Video (`veo-3.1-fast-generate-preview`)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-xs font-mono text-slate-400">1. Upload Starting Photo (Optional):</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, setVeoImageBase64)}
                  className="block w-full text-xs text-slate-400 font-mono file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-cyan-300 hover:file:bg-slate-700"
                />

                <label className="text-xs font-mono text-slate-400">2. Video Animation Motion Prompt:</label>
                <textarea
                  value={veoPrompt}
                  onChange={(e) => setVeoPrompt(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 font-mono focus:border-cyan-400 focus:outline-none"
                  placeholder="Describe the motion and scene animation..."
                />

                <div className="flex items-center gap-3">
                  <label className="text-xs font-mono text-slate-400">Aspect Ratio:</label>
                  {(['16:9', '9:16'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setVeoAspectRatio(ratio)}
                      className={`px-3 py-1 rounded text-xs font-mono border ${
                        veoAspectRatio === ratio
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {ratio === '16:9' ? '16:9 Landscape' : '9:16 Portrait'}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleGenerateVeoVideo}
                  disabled={loading}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold font-mono text-xs rounded-lg flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
                  <span>Generate Veo AI Video</span>
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col items-center justify-center min-h-[220px]">
                {loading && (
                  <div className="text-center space-y-2 p-4">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                    <p className="text-xs font-mono text-cyan-300">{veoProgress}</p>
                  </div>
                )}

                {veoVideoBlobUrl && !loading && (
                  <div className="w-full space-y-2 text-center">
                    <video
                      src={veoVideoBlobUrl}
                      controls
                      autoPlay
                      loop
                      className="max-h-[260px] mx-auto rounded-lg border border-cyan-500/30 object-contain w-full"
                    />
                    <a
                      href={veoVideoBlobUrl}
                      download="veo-generated-video.mp4"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950 border border-cyan-600/50 rounded text-cyan-300 text-xs font-mono hover:bg-cyan-900/60"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Veo MP4 Video</span>
                    </a>
                  </div>
                )}

                {!veoVideoBlobUrl && !loading && (
                  <div className="text-center text-slate-500 text-xs font-mono">
                    <Film className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Rendered Veo video player will load here
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. Google Search Grounding */}
        {activeTab === 'search_ground' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-cyan-300 font-mono text-sm font-semibold border-b border-slate-800 pb-2">
              <Search className="w-4 h-4 text-cyan-400" />
              <span>Google Search Web Grounding (`gemini-3.5-flash` with `googleSearch`)</span>
            </div>

            <div className="space-y-3">
              <textarea
                value={searchPrompt}
                onChange={(e) => setSearchPrompt(e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 font-mono focus:border-cyan-400 focus:outline-none"
              />

              <button
                onClick={handleSearchGrounding}
                disabled={loading}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono text-xs rounded-lg flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Fetch Live Search Grounded Response</span>
              </button>

              {searchResultText && (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3 font-mono text-xs text-slate-200">
                  <p className="whitespace-pre-wrap">{searchResultText}</p>
                  {searchSources.length > 0 && (
                    <div className="border-t border-slate-800 pt-2">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">SEARCH GROUNDING SOURCES:</span>
                      <div className="flex flex-wrap gap-2">
                        {searchSources.map((src, idx) => (
                          <a
                            key={idx}
                            href={src.uri || src.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[10px] text-cyan-300"
                          >
                            <span>{src.title || 'Source'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. High-Res Pro Image Generator */}
        {activeTab === 'pro_image' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-cyan-300 font-mono text-sm font-semibold border-b border-slate-800 pb-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>High-Quality Studio Pro Image Generation (`gemini-3-pro-image-preview`)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-xs font-mono text-slate-400">Prompt:</label>
                <textarea
                  value={proImagePrompt}
                  onChange={(e) => setProImagePrompt(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 font-mono focus:border-cyan-400 focus:outline-none"
                />

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">Resolution:</span>
                    {(['1K', '2K', '4K'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => setProImageSize(size)}
                        className={`px-2.5 py-1 rounded text-xs font-mono border ${
                          proImageSize === size
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">Aspect:</span>
                    <select
                      value={proImageAspect}
                      onChange={(e) => setProImageAspect(e.target.value as any)}
                      className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                    >
                      <option value="1:1">1:1 Square</option>
                      <option value="16:9">16:9 Widescreen</option>
                      <option value="9:16">9:16 Story</option>
                      <option value="4:3">4:3 Standard</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleProImageGen}
                  disabled={loading}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono text-xs rounded-lg flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Generate Pro {proImageSize} Image</span>
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col items-center justify-center min-h-[220px]">
                {proImageResultUrl ? (
                  <div className="w-full space-y-2 text-center">
                    <img src={proImageResultUrl} alt="Pro Generated" className="max-h-[240px] mx-auto rounded-lg border border-cyan-500/30 object-contain" />
                    <a
                      href={proImageResultUrl}
                      download={`pro-${proImageSize}-gemini.png`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950 border border-cyan-600/50 rounded text-cyan-300 text-xs font-mono hover:bg-cyan-900/60"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download {proImageSize} Artwork</span>
                    </a>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 text-xs font-mono">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Pro {proImageSize} image output will render here
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 6. Maps Grounding */}
        {activeTab === 'maps_ground' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-cyan-300 font-mono text-sm font-semibold border-b border-slate-800 pb-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>Google Maps Grounding (`gemini-3.5-flash` with `googleMaps`)</span>
            </div>

            <div className="space-y-3">
              <textarea
                value={mapsPrompt}
                onChange={(e) => setMapsPrompt(e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 font-mono focus:border-cyan-400 focus:outline-none"
              />

              <button
                onClick={handleMapsGrounding}
                disabled={loading}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono text-xs rounded-lg flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                <span>Fetch Google Maps Location Grounded Info</span>
              </button>

              {mapsResultText && (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3 font-mono text-xs text-slate-200">
                  <p className="whitespace-pre-wrap">{mapsResultText}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. Intelligence */}
        {activeTab === 'intelligence' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-cyan-300 font-mono text-sm font-semibold border-b border-slate-800 pb-2">
              <Brain className="w-4 h-4 text-cyan-400" />
              <span>Multi-Model Intelligence Router (Pro / Flash / Flash Lite)</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400">Task Complexity:</span>
                {(['complex', 'general', 'fast'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setIntelTaskType(type)}
                    className={`px-3 py-1 rounded text-xs font-mono border ${
                      intelTaskType === type
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {type === 'complex' ? 'Complex (gemini-3.1-pro-preview)' : type === 'general' ? 'General (gemini-3.5-flash)' : 'Fast (gemini-3.1-flash-lite)'}
                  </button>
                ))}
              </div>

              <textarea
                value={intelPrompt}
                onChange={(e) => setIntelPrompt(e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 font-mono focus:border-cyan-400 focus:outline-none"
              />

              <button
                onClick={handleIntelligence}
                disabled={loading}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono text-xs rounded-lg flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                <span>Process with Selected Intelligence Model</span>
              </button>

              {intelResultText && (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-2 font-mono text-xs text-slate-200">
                  <div className="flex items-center justify-between text-[10px] text-cyan-400 pb-1 border-b border-slate-800 font-bold">
                    <span>MODEL EXECUTED: {intelModelUsed}</span>
                    <span>TASK TYPE: {intelTaskType.toUpperCase()}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{intelResultText}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 8. Vision Analyze */}
        {activeTab === 'vision_analyze' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-cyan-300 font-mono text-sm font-semibold border-b border-slate-800 pb-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Image Understanding & Multimodal Vision (`gemini-3.1-pro-preview`)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, setVisionImageBase64)}
                  className="block w-full text-xs text-slate-400 font-mono file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-cyan-300"
                />

                <textarea
                  value={visionPrompt}
                  onChange={(e) => setVisionPrompt(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 font-mono focus:border-cyan-400 focus:outline-none"
                />

                <button
                  onClick={handleVisionAnalyze}
                  disabled={loading}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono text-xs rounded-lg flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                  <span>Analyze Photo with Pro Vision</span>
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col justify-center min-h-[200px] font-mono text-xs">
                {visionImageBase64 && (
                  <img src={visionImageBase64} alt="To Analyze" className="max-h-[140px] mx-auto rounded border border-slate-700 mb-2 object-contain" />
                )}
                {visionResultText ? (
                  <p className="whitespace-pre-wrap text-slate-200">{visionResultText}</p>
                ) : (
                  <p className="text-slate-500 text-center">Vision analysis breakdown will show here</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 9. Low Latency */}
        {activeTab === 'low_latency' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-cyan-300 font-mono text-sm font-semibold border-b border-slate-800 pb-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Ultra Low-Latency Response Engine (`gemini-3.1-flash-lite`)</span>
            </div>

            <div className="space-y-3">
              <textarea
                value={lowLatPrompt}
                onChange={(e) => setLowLatPrompt(e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 font-mono focus:border-cyan-400 focus:outline-none"
              />

              <button
                onClick={handleLowLatency}
                disabled={loading}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono text-xs rounded-lg flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span>Query Fast Low-Latency Model</span>
              </button>

              {lowLatResultText && (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-2 font-mono text-xs text-slate-200">
                  <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold border-b border-slate-800 pb-1">
                    <span>MODEL: gemini-3.1-flash-lite</span>
                    {lowLatMs && <span>LATENCY: {lowLatMs} ms</span>}
                  </div>
                  <p className="whitespace-pre-wrap">{lowLatResultText}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 10. High Thinking Mode */}
        {activeTab === 'high_thinking' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-cyan-300 font-mono text-sm font-semibold border-b border-slate-800 pb-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Deep Reasoning High Thinking Mode (`gemini-3.1-pro-preview` with `ThinkingLevel.HIGH`)</span>
            </div>

            <div className="space-y-3">
              <textarea
                value={thinkingPrompt}
                onChange={(e) => setThinkingPrompt(e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 font-mono focus:border-cyan-400 focus:outline-none"
              />

              <button
                onClick={handleHighThinking}
                disabled={loading}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono text-xs rounded-lg flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                <span>Execute Deep Reasoning (ThinkingLevel.HIGH)</span>
              </button>

              {thinkingResultText && (
                <div className="p-4 bg-slate-900 border border-cyan-500/30 rounded-lg space-y-2 font-mono text-xs text-slate-200">
                  <div className="flex items-center justify-between text-[10px] text-cyan-400 font-bold border-b border-slate-800 pb-1">
                    <span>MODEL: gemini-3.1-pro-preview</span>
                    <span>THINKING LEVEL: HIGH</span>
                  </div>
                  <p className="whitespace-pre-wrap">{thinkingResultText}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 11. Audio Transcribe */}
        {activeTab === 'audio_transcribe' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-cyan-300 font-mono text-sm font-semibold border-b border-slate-800 pb-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>Microphone Audio Input Transcription (`gemini-3.5-flash`)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-xs font-mono text-slate-400">1. Record Live Microphone Audio:</label>
                <div className="flex items-center gap-2">
                  {!isRecordingAudio ? (
                    <button
                      onClick={startRecordingAudio}
                      className="flex-1 py-2.5 bg-red-950/80 hover:bg-red-900 border border-red-600/60 text-red-300 font-mono text-xs font-bold rounded-lg flex items-center justify-center gap-2"
                    >
                      <Mic className="w-4 h-4 text-red-400" />
                      <span>Start Mic Recording</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopRecordingAudio}
                      className="flex-1 py-2.5 bg-red-600 text-white font-mono text-xs font-bold rounded-lg flex items-center justify-center gap-2 animate-pulse"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Stop Recording (Recording active...)</span>
                    </button>
                  )}
                </div>

                <label className="text-xs font-mono text-slate-400">Or Upload Audio File:</label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleFileUpload(e, setTranscribeBase64)}
                  className="block w-full text-xs text-slate-400 font-mono file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-cyan-300"
                />

                <button
                  onClick={handleTranscribeAudio}
                  disabled={loading || !transcribeBase64}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold font-mono text-xs rounded-lg flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                  <span>Transcribe Audio with Gemini</span>
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col justify-center min-h-[180px] font-mono text-xs">
                {transcribeResultText ? (
                  <div className="space-y-1">
                    <span className="text-[10px] text-cyan-400 font-bold block border-b border-slate-800 pb-1">TRANSCRIPTION OUTPUT:</span>
                    <p className="whitespace-pre-wrap text-slate-200">{transcribeResultText}</p>
                  </div>
                ) : (
                  <p className="text-slate-500 text-center">Audio transcript will appear here</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
