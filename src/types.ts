export type AIState = 'booting' | 'idle' | 'listening' | 'thinking' | 'speaking' | 'warning' | 'private';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'lili' | 'system';
  text: string;
  timestamp: string;
  language?: 'en' | 'hi';
  toolCall?: {
    name: string;
    args: Record<string, any>;
    result?: any;
  };
}

export interface SystemStats {
  cpuUsage: number;
  ramUsage: number;
  gpuUsage: number;
  batteryLevel: number;
  networkSpeedKbps: number;
  temperatureC: number;
  activeProcessesCount: number;
}

export interface SmartDevice {
  id: string;
  name: string;
  room: 'Living Room' | 'Bedroom' | 'Workspace' | 'Kitchen';
  type: 'light' | 'ac' | 'fan' | 'tv' | 'plug';
  state: boolean;
  brightness?: number; // 0-100
  colorRgb?: string;
  temperature?: number; // for AC (16-30)
  speed?: number; // for fan (1-5)
}

export interface UserMemory {
  id: string;
  category: 'preference' | 'fact' | 'habit' | 'relationship' | 'project';
  content: string;
  confidence: number;
  createdAt: string;
  encrypted: boolean;
}

export interface AutomationRoutine {
  id: string;
  name: string;
  triggerPhrase: string;
  iconName: string;
  actions: {
    type: 'open_app' | 'set_volume' | 'set_brightness' | 'smart_home' | 'speak' | 'fetch_weather';
    payload: Record<string, any>;
  }[];
  enabled: boolean;
}

export interface WeatherData {
  city: string;
  tempC: number;
  condition: string;
  humidity: number;
  windKm: number;
  highC: number;
  lowC: number;
  icon: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  category: string;
  timeAgo: string;
  url?: string;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
}

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  duration: string;
  location?: string;
  attendees?: string[];
  date?: string;
  type?: 'event' | 'festival' | 'holiday' | 'reminder';
}

export interface FestivalInfo {
  id: string;
  name: string;
  nameHindi?: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  category: 'National' | 'Hindu' | 'Islamic' | 'Christian' | 'Sikh' | 'Jain' | 'International' | 'Seasonal';
  significance: string;
  traditions: string;
  isMajor: boolean;
  color?: string;
}

export interface VoiceSettings {
  wakeWord: string; // 'Lili' | 'Hey Lili'
  voicePitch: number; // 0.5 - 1.5
  voiceRate: number; // 0.8 - 1.4
  autoListen: boolean;
  themeAccent: 'cyan' | 'emerald' | 'gold' | 'crimson';
  hindiSupport: boolean;
  selectedLanguage: string; // 'hi-IN' | 'en-US' | 'es-ES' | 'fr-FR'
}
