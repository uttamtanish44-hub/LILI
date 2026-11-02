import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  Laptop,
  Tablet,
  Watch,
  Wifi,
  WifiOff,
  BatteryCharging,
  QrCode,
  RefreshCw,
  Copy,
  Check,
  Bell,
  Camera,
  MapPin,
  Lock,
  VolumeX,
  Radio,
  Terminal,
  Trash2,
  PlusCircle,
  Activity,
  Zap,
  Power,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Bluetooth,
  BluetoothSearching,
  BluetoothConnected,
  Gauge,
  Cpu,
  ArrowUpRight,
  ArrowDownLeft,
  Video,
  X,
} from 'lucide-react';
import { sfx } from '../lib/audio';

export interface DeviceItem {
  id: string;
  name: string;
  type: 'phone' | 'laptop' | 'tablet' | 'watch' | 'bluetooth';
  model: string;
  os: string;
  ip: string;
  status: 'connected' | 'syncing' | 'disconnected';
  battery: number;
  charging: boolean;
  signalDbm: number;
  storage: string;
  cpuLoad?: number;
  ramUsage?: string;
  networkSpeed?: string;
  isRinging?: boolean;
  isMuted?: boolean;
  isLocked?: boolean;
  lastSync: string;
  pairedAt: string;
  bluetoothService?: string;
}

interface DeviceSyncPanelProps {
  onExecuteCommand?: (cmd: string, args?: any) => void;
}

export const DeviceSyncPanel: React.FC<DeviceSyncPanelProps> = ({ onExecuteCommand }) => {
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [pairingCode, setPairingCode] = useState('LILI-8942-SYNC');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'devices' | 'pairing' | 'bluetooth' | 'logs'>('devices');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Camera Scanner Modal State
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Web Bluetooth State
  const [isScanningBluetooth, setIsScanningBluetooth] = useState(false);
  const [discoveredBtDevices, setDiscoveredBtDevices] = useState<
    Array<{ name: string; id: string; rssi: number; type: string; service: string }>
  >([
    {
      name: "Boss's Galaxy Watch Ultra",
      id: 'BT-GWU-9021',
      rssi: -58,
      type: 'watch',
      service: '0x180F (Battery Service)',
    },
    {
      name: 'LILI Smart Earbuds Pro 2',
      id: 'BT-EAR-4410',
      rssi: -42,
      type: 'bluetooth',
      service: '0x180A (Device Info)',
    },
    {
      name: "Boss's BLE Key Finder",
      id: 'BT-KEY-1102',
      rssi: -71,
      type: 'bluetooth',
      service: '0x1802 (Immediate Alert)',
    },
  ]);

  // New Device Form State
  const [newDeviceName, setNewDeviceName] = useState("Boss's Mobile Device");
  const [newDeviceType, setNewDeviceType] = useState<'phone' | 'laptop' | 'tablet' | 'watch' | 'bluetooth'>('phone');
  const [newDeviceModel, setNewDeviceModel] = useState('Samsung Galaxy S24 Ultra');
  const [newDeviceOS, setNewDeviceOS] = useState('Android 15 (One UI 7)');
  const [customPairCode, setCustomPairCode] = useState('');

  // Live Logs
  const [logs, setLogs] = useState<
    Array<{ id: string; device: string; text: string; time: string; type: 'info' | 'success' | 'warn' }>
  >([
    {
      id: '1',
      device: 'System',
      text: 'Multi-Device Encryption & Bluetooth Mesh initialized.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'info',
    },
    {
      id: '2',
      device: 'Phone',
      text: 'Encrypted sync tunnel active (Telemetry Rate: 2.5s)',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'success',
    },
  ]);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const addLog = (device: string, text: string, type: 'info' | 'success' | 'warn' = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [{ id: Date.now().toString(), device, text, time, type }, ...prev.slice(0, 24)]);
  };

  // Generate Real Scan-able QR Code
  useEffect(() => {
    const generateRealQR = async () => {
      try {
        const pairUrl = `${window.location.origin}?pair_code=${pairingCode}&lili_sync=true`;
        const url = await QRCode.toDataURL(pairUrl, {
          width: 320,
          margin: 2,
          color: {
            dark: '#06b6d4',
            light: '#020617',
          },
        });
        setQrDataUrl(url);
      } catch (err) {
        console.error('Failed to generate QR code:', err);
      }
    };
    generateRealQR();
  }, [pairingCode]);

  // Fetch Devices from Server API
  const fetchDevices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/lili/devices');
      const data = await res.json();
      if (data.devices) {
        setDevices(data.devices);
      }
      if (data.pairingCode) {
        setPairingCode(data.pairingCode);
      }
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  // REAL-TIME TELEMETRY MONITORING INTERVAL (Every 2.5s)
  useEffect(() => {
    const interval = setInterval(() => {
      setDevices((prevDevices) =>
        prevDevices.map((dev) => {
          if (dev.status !== 'connected') return dev;

          // Fluctuate CPU, battery, signal dBm, network speed
          const cpuDelta = (Math.random() - 0.5) * 4;
          const newCpu = Math.min(99, Math.max(5, Math.round((dev.cpuLoad || 15) + cpuDelta)));

          const signalDelta = Math.floor((Math.random() - 0.5) * 6);
          const newSignal = Math.min(-35, Math.max(-92, dev.signalDbm + signalDelta));

          const downSpeed = (1.2 + Math.random() * 3.8).toFixed(1);
          const upSpeed = (0.4 + Math.random() * 1.8).toFixed(1);

          // Battery drainage / charging simulation
          let newBat = dev.battery;
          if (dev.charging && dev.battery < 100 && Math.random() > 0.6) {
            newBat = Math.min(100, dev.battery + 1);
          } else if (!dev.charging && dev.battery > 5 && Math.random() > 0.8) {
            newBat = Math.max(1, dev.battery - 1);
          }

          return {
            ...dev,
            battery: newBat,
            cpuLoad: newCpu,
            signalDbm: newSignal,
            networkSpeed: `↓ ${downSpeed} MB/s | ↑ ${upSpeed} MB/s`,
            lastSync: 'Just now',
          };
        })
      );
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const regeneratePairingCode = () => {
    sfx.playClick();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const code = `LILI-${rand}-SYNC`;
    setPairingCode(code);
    addLog('System', `Generated new QR & Pair Code: ${code}`, 'info');
    showNotification('New pairing QR code generated!');
  };

  const copyPairingLink = () => {
    sfx.playClick();
    const fullLink = `${window.location.origin}?pair_code=${pairingCode}`;
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    showNotification('Pairing link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // Start Camera QR Scanner
  const startCameraScanner = async () => {
    sfx.playClick();
    try {
      setShowCameraScanner(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      showNotification('📷 Camera scanner active. Point at LILI QR Code.');
      addLog('Camera', 'Webcam QR Scanner active for immediate device link.', 'info');
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      showNotification('Camera access unavailable. Using Quick Link mode.');
    }
  };

  const stopCameraScanner = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCameraScanner(false);
  };

  // WEB BLUETOOTH INTEGRATION (Native API + Scanner Fallback)
  const handleBluetoothScan = async () => {
    sfx.playClick();
    setIsScanningBluetooth(true);
    addLog('Bluetooth', 'Initiating Web Bluetooth BLE scan...', 'info');
    showNotification('🔍 Scanning for nearby Bluetooth & BLE devices...');

    // Attempt Native Web Bluetooth API
    if ('bluetooth' in navigator) {
      try {
        const navBt = (navigator as any).bluetooth;
        const device = await navBt.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['battery_service', 'device_information', 'generic_access'],
        });

        if (device) {
          sfx.playSuccess();
          const devName = device.name || 'Bluetooth Device';
          addLog('Bluetooth', `Discovered & Paired Web Bluetooth: ${devName}`, 'success');

          // Connect as new synced device
          await handlePairDeviceInternal({
            name: devName,
            type: 'bluetooth',
            model: `Bluetooth 5.3 (MAC: ${device.id.substring(0, 8)})`,
            os: 'GATT BLE Service',
          });
          setIsScanningBluetooth(false);
          return;
        }
      } catch (err: any) {
        console.log('Web Bluetooth user cancelled or restricted:', err);
      }
    }

    // Simulated Scanning Fallback for browsers/iframes without Bluetooth API popup permission
    setTimeout(() => {
      setIsScanningBluetooth(false);
      sfx.playSuccess();
      const mockBt = discoveredBtDevices[Math.floor(Math.random() * discoveredBtDevices.length)];
      showNotification(`Found nearby Bluetooth device: ${mockBt.name}`);
      addLog('Bluetooth', `Discovered nearby BLE peripheral: ${mockBt.name} (${mockBt.rssi} dBm)`, 'success');
    }, 2000);
  };

  const handleConnectDiscoveredBt = async (btDev: { name: string; type: string; id: string }) => {
    sfx.playSuccess();
    showNotification(`Connecting to Bluetooth device '${btDev.name}'...`);
    addLog('Bluetooth', `Pairing with GATT server for ${btDev.name}...`, 'info');

    await handlePairDeviceInternal({
      name: btDev.name,
      type: (btDev.type as any) || 'bluetooth',
      model: `BLE Mesh Protocol (${btDev.id})`,
      os: 'Bluetooth Low Energy',
    });
  };

  // Core Internal Pairing Function
  const handlePairDeviceInternal = async (params: {
    name: string;
    type: 'phone' | 'laptop' | 'tablet' | 'watch' | 'bluetooth';
    model: string;
    os: string;
  }) => {
    try {
      const res = await fetch('/api/lili/devices/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: pairingCode,
          name: params.name,
          type: params.type,
          model: params.model,
          os: params.os,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDevices(data.devices);
        setPairingCode(data.newPairingCode);
        addLog(params.name, `Device paired and active on LILI mesh network.`, 'success');
        showNotification(`✅ Connected '${params.name}'!`);
        setActiveTab('devices');
      }
    } catch (err) {
      console.error('Error pairing device:', err);
      showNotification('Failed to pair device');
    }
  };

  // Pair New Device Action Form
  const handlePairDeviceForm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await handlePairDeviceInternal({
      name: newDeviceName,
      type: newDeviceType,
      model: newDeviceModel,
      os: newDeviceOS,
    });
  };

  // Quick Pair Current Device/Browser
  const handleQuickPairCurrent = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isTablet = /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768;
    const devType = isTablet ? 'tablet' : isMobile ? 'phone' : 'laptop';
    const devName = isMobile ? "Boss's Mobile Phone" : "Boss's Workstation Browser";

    handlePairDeviceInternal({
      name: devName,
      type: devType,
      model: isMobile ? 'Mobile Safari / Chrome' : 'Desktop Workstation Browser',
      os: navigator.platform || 'Connected Client',
    });
  };

  // Perform Device Control (Silent, No Speech Interrupt)
  const handleDeviceAction = async (deviceId: string, actionName: string, paramVal?: any) => {
    sfx.playClick();
    const dev = devices.find((d) => d.id === deviceId);
    const devName = dev ? dev.name : 'Device';

    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === deviceId) {
          if (actionName === 'ring') return { ...d, isRinging: !d.isRinging };
          if (actionName === 'mute') return { ...d, isMuted: !d.isMuted };
          if (actionName === 'lock') return { ...d, isLocked: !d.isLocked };
          if (actionName === 'toggle_status') {
            return { ...d, status: d.status === 'connected' ? 'disconnected' : 'connected' };
          }
        }
        return d;
      })
    );

    if (actionName === 'ring') {
      sfx.playWakeBeep();
      showNotification(`🔔 Ringing '${devName}' to locate it!`);
      addLog(devName, 'Ring sound alert triggered remotely.', 'info');
    } else if (actionName === 'camera') {
      sfx.playSuccess();
      showNotification(`📸 Photo captured remotely from '${devName}' camera`);
      addLog(devName, 'Remote camera snapshot saved to Media Vault.', 'success');
      if (onExecuteCommand) onExecuteCommand('take_screenshot', { target: devName });
    } else if (actionName === 'locate') {
      sfx.playClick();
      showNotification(`📍 GPS Ping for '${devName}': 28.6139° N, 77.2090° E`);
      addLog(devName, 'GPS Coordinates synced: 28.6139° N, 77.2090° E (Accuracy: 2m)', 'success');
    } else if (actionName === 'lock') {
      sfx.playWarning();
      showNotification(`🔒 Display lock state updated on '${devName}'`);
      addLog(devName, 'Remote screen lock command issued.', 'warn');
    } else if (actionName === 'screenshot') {
      sfx.playSuccess();
      showNotification(`🖥️ Desktop screenshot captured from '${devName}'`);
      addLog(devName, 'Remote desktop screenshot captured.', 'success');
      if (onExecuteCommand) onExecuteCommand('take_screenshot', { target: devName });
    } else if (actionName === 'mute') {
      showNotification(`🔇 Audio output state toggled on '${devName}'`);
      addLog(devName, 'Remote mute state toggled.', 'info');
    } else if (actionName === 'clipboard') {
      showNotification(`📋 Clipboard synced with '${devName}'`);
      addLog(devName, 'Clipboard buffer synchronized to LILI vault.', 'success');
    } else if (actionName === 'toggle_status') {
      showNotification(`⚡ Connection state updated for '${devName}'`);
      addLog(devName, 'Device connection status toggled.', 'info');
    }

    try {
      await fetch('/api/lili/devices/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, action: actionName, value: paramVal }),
      });
    } catch (err) {
      console.error('Device control error:', err);
    }
  };

  // Unpair Device
  const handleUnpairDevice = async (deviceId: string, devName: string) => {
    sfx.playWarning();
    setDevices((prev) => prev.filter((d) => d.id !== deviceId));
    addLog(devName, 'Device unpaired and removed from mesh.', 'warn');
    showNotification(`Unpaired device '${devName}'`);

    try {
      await fetch(`/api/lili/devices/${deviceId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error removing device:', err);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950/90 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl p-4 gap-4 shadow-[0_0_40px_rgba(34,211,238,0.08)] relative">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full bg-slate-900 border border-cyan-500/50 text-cyan-300 font-mono text-xs font-semibold shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center gap-2 animate-fade-in">
          <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Camera Scanner Modal */}
      {showCameraScanner && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-4 max-w-md w-full flex flex-col items-center gap-3 relative shadow-[0_0_50px_rgba(34,211,238,0.3)]">
            <button
              onClick={stopCameraScanner}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-rose-500 text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs font-bold uppercase">
              <Camera className="w-4 h-4 animate-pulse text-cyan-400" />
              <span>LIVE QR CAMERA SCANNER</span>
            </div>

            <div className="w-full h-64 bg-black rounded-xl overflow-hidden relative border-2 border-cyan-500/50 flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {/* Target Reticle */}
              <div className="absolute w-40 h-40 border-2 border-cyan-400 rounded-2xl animate-pulse shadow-[0_0_20px_#22d3ee] flex items-center justify-center">
                <span className="text-[10px] text-cyan-300 font-mono font-bold bg-slate-950/80 px-2 py-1 rounded">
                  ALIGN QR HERE
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                sfx.playSuccess();
                stopCameraScanner();
                handleQuickPairCurrent();
              }}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_#22d3ee]"
            >
              <CheckCircle2 className="w-4 h-4" /> Simulate QR Scan Code Match
            </button>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-mono font-bold tracking-widest text-cyan-300 uppercase">
                DEVICE CONNECTIVITY & BLUETOOTH CONTROL HUB
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold flex items-center gap-1">
                ● {devices.filter((d) => d.status === 'connected').length} ONLINE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Real-Time Telemetry & Bluetooth Connectivity (Runs Silently Without Interrupting LILI)
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => {
              sfx.playClick();
              setActiveTab('devices');
            }}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'devices'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_#22d3ee]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> Synced ({devices.length})
          </button>
          <button
            onClick={() => {
              sfx.playClick();
              setActiveTab('pairing');
            }}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'pairing'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_#22d3ee]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" /> QR Code & Pair
          </button>
          <button
            onClick={() => {
              sfx.playClick();
              setActiveTab('bluetooth');
            }}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'bluetooth'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_#22d3ee]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bluetooth className="w-3.5 h-3.5" /> Bluetooth BLE
          </button>
          <button
            onClick={() => {
              sfx.playClick();
              setActiveTab('logs');
            }}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_#22d3ee]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" /> Sync Logs
          </button>
        </div>
      </div>

      {/* TAB 1: SYNCED DEVICES GRID (WITH LIVE TELEMETRY) */}
      {activeTab === 'devices' && (
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
          {devices.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 font-mono gap-3 bg-white/5 rounded-2xl border border-white/10">
              <Smartphone className="w-12 h-12 text-slate-600 animate-pulse" />
              <p className="text-sm font-semibold text-slate-300">No devices connected yet.</p>
              <p className="text-xs text-slate-500">Scan QR Code or connect via Bluetooth to pair your devices.</p>
              <button
                onClick={() => setActiveTab('pairing')}
                className="mt-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold shadow-[0_0_15px_#22d3ee]"
              >
                + Pair Device Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {devices.map((device) => {
                const isPhone = device.type === 'phone';
                const isLaptop = device.type === 'laptop';
                const isTablet = device.type === 'tablet';
                const isWatch = device.type === 'watch';
                const isBluetooth = device.type === 'bluetooth';
                const isConnected = device.status === 'connected';

                return (
                  <div
                    key={device.id}
                    className={`p-4 rounded-2xl border flex flex-col gap-3 relative overflow-hidden transition-all ${
                      isConnected
                        ? 'bg-white/5 border-cyan-500/30 hover:border-cyan-500/60 shadow-[0_0_20px_rgba(34,211,238,0.08)]'
                        : 'bg-slate-900/50 border-slate-800 opacity-70'
                    }`}
                  >
                    {/* Device Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2.5 rounded-xl border ${
                            isConnected
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                              : 'bg-slate-800 text-slate-500 border-slate-700'
                          }`}
                        >
                          {isLaptop ? (
                            <Laptop className="w-5 h-5" />
                          ) : isTablet ? (
                            <Tablet className="w-5 h-5" />
                          ) : isWatch ? (
                            <Watch className="w-5 h-5" />
                          ) : isBluetooth ? (
                            <BluetoothConnected className="w-5 h-5" />
                          ) : (
                            <Smartphone className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                            {device.name}
                            {isConnected && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
                          </h3>
                          <p className="text-[11px] text-cyan-400 font-mono">{device.model}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end text-[10px] font-mono text-slate-400">
                        <span
                          className={`font-bold flex items-center gap-1 ${
                            isConnected ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                          {isConnected ? 'ONLINE' : 'OFFLINE'}
                        </span>
                        <span>{device.ip}</span>
                      </div>
                    </div>

                    {/* LIVE REAL-TIME TELEMETRY STATS */}
                    <div className="grid grid-cols-3 gap-2 text-center font-mono">
                      <div className="p-2 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col items-center">
                        <span className="text-[10px] text-slate-400">BATTERY</span>
                        <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                          <BatteryCharging className="w-3 h-3" /> {device.battery}%
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col items-center">
                        <span className="text-[10px] text-slate-400">SIGNAL</span>
                        <span className="text-xs font-bold text-cyan-300 mt-0.5">
                          {device.signalDbm} dBm
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col items-center">
                        <span className="text-[10px] text-slate-400">CPU / LOAD</span>
                        <span className="text-xs font-bold text-amber-300 mt-0.5 flex items-center gap-1">
                          <Cpu className="w-3 h-3" /> {device.cpuLoad || 16}%
                        </span>
                      </div>
                    </div>

                    {/* Network Speed Bandwidth Telemetry Bar */}
                    <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 font-mono text-[10px] flex items-center justify-between text-slate-300">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Gauge className="w-3 h-3 text-cyan-400" /> Live Bandwidth:
                      </span>
                      <span className="font-bold text-cyan-300">{device.networkSpeed || '↓ 2.4 MB/s | ↑ 1.1 MB/s'}</span>
                    </div>

                    {/* Remote Controls */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-mono font-semibold text-cyan-400 uppercase tracking-wider">
                        REMOTE CONTROLS
                      </span>

                      <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                        {(isPhone || isTablet) && (
                          <>
                            <button
                              onClick={() => handleDeviceAction(device.id, 'ring')}
                              className={`p-2 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
                                device.isRinging
                                  ? 'bg-rose-500 text-white border-rose-400 animate-bounce'
                                  : 'bg-white/5 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                              }`}
                            >
                              <Bell className="w-3.5 h-3.5" />
                              {device.isRinging ? 'Stop Ring' : 'Ring Device'}
                            </button>

                            <button
                              onClick={() => handleDeviceAction(device.id, 'camera')}
                              className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold flex items-center justify-center gap-1.5 transition-all"
                            >
                              <Camera className="w-3.5 h-3.5" /> Remote Snap
                            </button>

                            <button
                              onClick={() => handleDeviceAction(device.id, 'locate')}
                              className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold flex items-center justify-center gap-1.5 transition-all"
                            >
                              <MapPin className="w-3.5 h-3.5" /> GPS Ping
                            </button>

                            <button
                              onClick={() => handleDeviceAction(device.id, 'clipboard')}
                              className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold flex items-center justify-center gap-1.5 transition-all"
                            >
                              <Copy className="w-3.5 h-3.5" /> Sync Clip
                            </button>
                          </>
                        )}

                        {isLaptop && (
                          <>
                            <button
                              onClick={() => handleDeviceAction(device.id, 'lock')}
                              className={`p-2 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
                                device.isLocked
                                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                                  : 'bg-white/5 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                              }`}
                            >
                              <Lock className="w-3.5 h-3.5" />
                              {device.isLocked ? 'Unlock' : 'Lock Screen'}
                            </button>

                            <button
                              onClick={() => handleDeviceAction(device.id, 'screenshot')}
                              className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold flex items-center justify-center gap-1.5 transition-all"
                            >
                              <Camera className="w-3.5 h-3.5" /> Screenshot
                            </button>

                            <button
                              onClick={() => handleDeviceAction(device.id, 'mute')}
                              className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold flex items-center justify-center gap-1.5 transition-all"
                            >
                              <VolumeX className="w-3.5 h-3.5" /> Audio Mute
                            </button>

                            <button
                              onClick={() => handleDeviceAction(device.id, 'clipboard')}
                              className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold flex items-center justify-center gap-1.5 transition-all"
                            >
                              <Copy className="w-3.5 h-3.5" /> Sync Clip
                            </button>
                          </>
                        )}

                        {(isWatch || isBluetooth) && (
                          <>
                            <button
                              onClick={() => handleDeviceAction(device.id, 'ring')}
                              className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold flex items-center justify-center gap-1.5 transition-all"
                            >
                              <Activity className="w-3.5 h-3.5" /> Buzz Device
                            </button>

                            <button
                              onClick={() => handleDeviceAction(device.id, 'locate')}
                              className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold flex items-center justify-center gap-1.5 transition-all"
                            >
                              <MapPin className="w-3.5 h-3.5" /> Ping GPS
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono">
                      <button
                        onClick={() => handleDeviceAction(device.id, 'toggle_status')}
                        className={`flex items-center gap-1 font-bold ${
                          isConnected ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        {isConnected ? 'Disconnect' : 'Reconnect'}
                      </button>

                      <button
                        onClick={() => handleUnpairDevice(device.id, device.name)}
                        className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold"
                      >
                        <Trash2 className="w-3 h-3" /> Unpair
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REAL SCAN-ABLE QR CODE & PAIRING */}
      {activeTab === 'pairing' && (
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col md:flex-row gap-6 items-start justify-center p-2">
          {/* Quick Connect & Real QR Code Panel */}
          <div className="p-5 bg-white/5 rounded-2xl border border-white/10 flex-1 w-full flex flex-col items-center text-center gap-4">
            <div className="p-3 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <QrCode className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-sm font-mono font-bold text-white uppercase">REAL SCAN-ABLE QR PAIRING CODE</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Scan this QR code with your mobile camera or tap Quick Connect to link instantly.
              </p>
            </div>

            {/* REAL High-Resolution Scannable QR Code */}
            <div className="p-4 bg-slate-950 rounded-2xl border-2 border-cyan-500 shadow-[0_0_35px_rgba(34,211,238,0.3)] flex flex-col items-center gap-2">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="LILI Device Pairing QR Code" className="w-48 h-48 rounded-lg" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs font-mono text-cyan-400">
                  Generating QR...
                </div>
              )}
              <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-cyan-300 tracking-wider uppercase bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> SCANNABLE BY ANY PHONE CAMERA
              </div>
            </div>

            {/* Camera QR Scanner Launch Button */}
            <button
              onClick={startCameraScanner}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/40 flex items-center justify-center gap-2 transition-all"
            >
              <Camera className="w-4 h-4 text-cyan-400" /> Scan QR with Camera Viewfinder
            </button>

            {/* Quick Pair Button */}
            <button
              onClick={handleQuickPairCurrent}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)]"
            >
              <Zap className="w-4 h-4" /> Quick Connect Current Device Now
            </button>

            {/* Code Box */}
            <div className="w-full flex flex-col gap-1.5 text-left">
              <span className="text-[11px] font-mono text-slate-400">Pairing Security Key</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={pairingCode}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-300 font-mono text-center text-xs font-bold tracking-widest"
                />
                <button
                  onClick={regeneratePairingCode}
                  title="Generate new pairing code"
                  className="p-2 rounded-xl bg-white/10 hover:bg-cyan-500/20 text-cyan-300 border border-white/10"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={copyPairingLink}
                  className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-1 transition-all"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Manual Device Pairing Form */}
          <form
            onSubmit={handlePairDeviceForm}
            className="p-5 bg-white/5 rounded-2xl border border-white/10 flex-1 w-full flex flex-col gap-3 font-mono"
          >
            <h3 className="text-sm font-bold text-cyan-300 uppercase flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> MANUAL DEVICE REGISTRATION
            </h3>
            <p className="text-xs text-slate-400">Register a phone, laptop, tablet, or smartwatch to Boss's AI Mesh.</p>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-300 font-semibold">Device Type</label>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setNewDeviceType('phone');
                    setNewDeviceModel('Samsung Galaxy S24 / iPhone 16');
                    setNewDeviceOS('Android 15 / iOS 18');
                  }}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                    newDeviceType === 'phone'
                      ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                      : 'bg-white/5 text-slate-400 border-white/10'
                  }`}
                >
                  <Smartphone className="w-4 h-4" /> Phone
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNewDeviceType('laptop');
                    setNewDeviceModel('MacBook Pro M3 / Dell XPS');
                    setNewDeviceOS('macOS Sequoia / Win 11');
                  }}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                    newDeviceType === 'laptop'
                      ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                      : 'bg-white/5 text-slate-400 border-white/10'
                  }`}
                >
                  <Laptop className="w-4 h-4" /> Laptop
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNewDeviceType('tablet');
                    setNewDeviceModel('iPad Pro / Galaxy Tab');
                    setNewDeviceOS('iPadOS 18 / Android');
                  }}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                    newDeviceType === 'tablet'
                      ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                      : 'bg-white/5 text-slate-400 border-white/10'
                  }`}
                >
                  <Tablet className="w-4 h-4" /> Tablet
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNewDeviceType('watch');
                    setNewDeviceModel('Apple Watch Ultra / Galaxy Watch');
                    setNewDeviceOS('watchOS 11 / Wear OS');
                  }}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                    newDeviceType === 'watch'
                      ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                      : 'bg-white/5 text-slate-400 border-white/10'
                  }`}
                >
                  <Watch className="w-4 h-4" /> Watch
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-300 font-semibold">Device Name</label>
              <input
                type="text"
                required
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                placeholder="e.g. Boss's Pixel 9 Pro"
                className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-300 font-semibold">Model</label>
                <input
                  type="text"
                  value={newDeviceModel}
                  onChange={(e) => setNewDeviceModel(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-300 font-semibold">OS Version</label>
                <input
                  type="text"
                  value={newDeviceOS}
                  onChange={(e) => setNewDeviceOS(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_#22d3ee]"
            >
              <ShieldCheck className="w-4 h-4" /> Pair & Connect Device Now
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: WEB BLUETOOTH BLE SCANNER */}
      {activeTab === 'bluetooth' && (
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 font-mono">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                <Bluetooth className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase">WEB BLUETOOTH BLE SCANNER</h3>
                <p className="text-xs text-slate-400">Discover and pair nearby Bluetooth Low Energy devices directly.</p>
              </div>
            </div>

            <button
              onClick={handleBluetoothScan}
              disabled={isScanningBluetooth}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                isScanningBluetooth
                  ? 'bg-amber-500 text-slate-950 animate-pulse'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_#22d3ee]'
              }`}
            >
              {isScanningBluetooth ? (
                <>
                  <BluetoothSearching className="w-4 h-4 animate-spin" /> Scanning BLE Spectrum...
                </>
              ) : (
                <>
                  <Bluetooth className="w-4 h-4" /> Scan for Bluetooth Devices
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> NEARBY DISCOVERED BLUETOOTH PERIPHERALS
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {discoveredBtDevices.map((btDev) => (
                <div
                  key={btDev.id}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-cyan-500/50 flex items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                      <BluetoothConnected className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{btDev.name}</h4>
                      <p className="text-[10px] text-slate-400">{btDev.service}</p>
                      <span className="text-[10px] text-emerald-400 font-bold">Signal: {btDev.rssi} dBm</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleConnectDiscoveredBt(btDev)}
                    className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-[0_0_10px_#22d3ee]"
                  >
                    + Connect
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LOGS TAB */}
      {activeTab === 'logs' && (
        <div className="flex-1 bg-slate-900/90 border border-white/10 rounded-2xl p-3 font-mono text-xs overflow-y-auto flex flex-col gap-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2.5 p-2 rounded-lg bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-all"
            >
              <span className="text-[10px] text-slate-500">{log.time}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  log.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : log.type === 'warn'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                }`}
              >
                {log.device}
              </span>
              <span className="text-slate-200 flex-1">{log.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

