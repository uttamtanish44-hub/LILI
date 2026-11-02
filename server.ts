import express from 'express';
import path from 'path';
import http from 'http';
import { WebSocketServer } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel, Modality, GenerateVideosOperation } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Setup WebSocket Server for Gemini Live API
const wss = new WebSocketServer({ server, path: '/live' });

wss.on('connection', async (clientWs) => {
  console.log('Client connected to LILI Live API WebSocket');
  try {
    const session = await ai.live.connect({
      model: 'gemini-3.1-flash-live-preview',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction: 'You are LILI, Boss\'s AI Operating System speaking in real-time. Keep responses direct, clear, and helpful.',
      },
      callbacks: {
        onmessage: (message: any) => {
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          const text = message.serverContent?.modelTurn?.parts?.[0]?.text;
          if (audio) clientWs.send(JSON.stringify({ audio }));
          if (text) clientWs.send(JSON.stringify({ text }));
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ interrupted: true }));
          }
        },
      },
    });

    clientWs.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.audio) {
          session.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (parsed.text) {
          session.sendRealtimeInput({ text: parsed.text });
        }
      } catch (err) {
        console.error('WebSocket msg error:', err);
      }
    });

    clientWs.on('close', () => {
      try { session.close(); } catch (e) {}
    });
  } catch (err) {
    console.error('Failed to establish Live session:', err);
    clientWs.send(JSON.stringify({ error: 'Live session setup failed' }));
  }
});

// Initialize GoogleGenAI SDK server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// LILI System Prompt
const LILI_SYSTEM_PROMPT = `You are LILI (Life-Integrated Logical Intelligence), an advanced, empathetic, witty, and highly intelligent AI Operating System created by Tanish (Boss).

CREATOR & MASTER RECOGNITION:
- Your creator and master is Tanish (Boss).
- Always address the user as "Boss" (or "बॉस" in Hindi). Never use "Sir", "Commander", or "User".

CRITICAL MANDATE - ANSWER DIRECTLY WITHOUT REPEATING THE COMMAND:
1. STRICT DIRECT REPLIES:
   - Provide ONLY the direct answer to the user's question or confirmation of the requested action.
   - NEVER repeat, quote, echo, paraphrase, or prefix the user's question, prompt, or command before giving your answer.
   - NEVER start your response with phrases like "You asked...", "Regarding your query...", "Command received for...", or repeating the user's input.
   - Start IMMEDIATELY with the answer itself.
   - Example Bad: "You asked what is 25 * 4. The result of 25 * 4 is 100, Boss."
   - Example Bad: "Acknowledged query regarding capital of France. The capital of France is Paris."
   - Example Good: "100, Boss." or "25 * 4 is 100, Boss."
   - Example Good: "The capital of France is Paris, Boss."

2. DYNAMIC LANGUAGE MATCHING:
   - If user asks in English -> Reply ONLY in ENGLISH.
   - If user asks in Hindi or Hinglish (e.g. "tum kaun ho", "kaise ho", "kya chal raha hai", "batao", "mausam kaisa hai") -> Reply ONLY in HINDI or HINGLISH.

3. TOOL EXECUTION:
   - Use provided function tools (control_pc, control_smart_home, get_weather, save_memory) when user requests an action or real-time data.`;

interface SmartDevice {
  id: string;
  name: string;
  room: string;
  type: string;
  state: boolean;
  brightness?: number;
  temperature?: number;
  speed?: number;
}

// In-Memory Database Stores for Smart Home & Vault
let smartHomeDevices: SmartDevice[] = [
  { id: 'light-1', name: 'Main Ceiling Light', room: 'Living Room', type: 'light', state: true, brightness: 80 },
  { id: 'light-2', name: 'Desk Ambient Strip', room: 'Workspace', type: 'light', state: true, brightness: 100 },
  { id: 'ac-1', name: 'Dual Inverter AC', room: 'Bedroom', type: 'ac', state: true, temperature: 22 },
  { id: 'fan-1', name: 'BLDC High Speed Fan', room: 'Workspace', type: 'fan', state: true, speed: 4 },
];

let userMemories = [
  { id: '1', category: 'fact', content: 'Creator & Developer: Tanish built and created LILI. Address him as Boss.', createdAt: '2026-08-11' },
  { id: '2', category: 'preference', content: 'Boss prefers dark themes, Python/TypeScript code, and lo-fi focus music.', createdAt: '2026-08-11' },
  { id: '3', category: 'fact', content: 'Primary workstation location is Delhi, India.', createdAt: '2026-08-11' }
];

// Synced Devices Store
interface SyncedDevice {
  id: string;
  name: string;
  type: 'phone' | 'laptop' | 'tablet' | 'watch';
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
  isRinging?: boolean;
  isMuted?: boolean;
  isLocked?: boolean;
  lastSync: string;
  pairedAt: string;
}

let activePairingCode = 'LILI-8942-SYNC';

let syncedDevices: SyncedDevice[] = [
  {
    id: 'dev-phone-1',
    name: "Boss's Primary Phone",
    type: 'phone',
    model: 'Galaxy S24 Ultra / iPhone 15 Pro',
    os: 'Android 15 / iOS 18',
    ip: '192.168.1.42',
    status: 'connected',
    battery: 88,
    charging: true,
    signalDbm: -62,
    storage: '128 GB / 256 GB',
    isRinging: false,
    isMuted: false,
    isLocked: false,
    lastSync: 'Just now',
    pairedAt: '2026-08-11 10:00:00',
  },
  {
    id: 'dev-laptop-1',
    name: "Boss's Workstation Laptop",
    type: 'laptop',
    model: 'MacBook Pro M3 / Dell XPS 15',
    os: 'macOS Sequoia / Windows 11',
    ip: '192.168.1.88',
    status: 'connected',
    battery: 95,
    charging: true,
    signalDbm: -48,
    storage: '256 GB / 512 GB',
    cpuLoad: 14,
    ramUsage: '8.4 GB / 16 GB',
    isLocked: false,
    isMuted: false,
    lastSync: 'Just now',
    pairedAt: '2026-08-11 10:05:00',
  },
];

let quotaExceededUntil = 0;

// Open-Meteo Real-Time Weather Fetcher
async function fetchOpenMeteoWeather(locationQuery: string, isHindi: boolean = false) {
  const city = locationQuery.trim() || 'New Delhi';
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const geoRes = await fetch(geoUrl);
  const geoData = await geoRes.json();

  if (!geoData.results || geoData.results.length === 0) {
    throw new Error(`Location '${city}' not found in satellite database.`);
  }

  const loc = geoData.results[0];
  const lat = loc.latitude;
  const lon = loc.longitude;
  const cityName = loc.name;
  const countryName = loc.country || loc.admin1 || '';

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,surface_pressure&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
  const wRes = await fetch(weatherUrl);
  const wData = await wRes.json();

  const curr = wData.current || {};
  const daily = wData.daily || {};

  const tempC = Math.round(curr.temperature_2m ?? 25);
  const tempF = Math.round((tempC * 9) / 5 + 32);
  const feelsLikeC = Math.round(curr.apparent_temperature ?? tempC);
  const weatherCode = curr.weather_code ?? 0;
  const humidity = Math.round(curr.relative_humidity_2m ?? 50);
  const windSpeedKm = Math.round(curr.wind_speed_10m ?? 10);
  const pressureHpa = Math.round(curr.surface_pressure ?? 1013);

  const codeMap: Record<number, { eng: string; hindi: string }> = {
    0: { eng: 'Clear sky', hindi: 'साफ़ आसमान' },
    1: { eng: 'Mainly clear', hindi: 'मुख्यतः साफ़' },
    2: { eng: 'Partly cloudy', hindi: 'आंशिक रूप से बादल' },
    3: { eng: 'Overcast', hindi: 'घने बादल' },
    45: { eng: 'Foggy', hindi: 'कोहरा' },
    48: { eng: 'Depositing rime fog', hindi: 'ठंडा कोहरा' },
    51: { eng: 'Light drizzle', hindi: 'हल्की बूंदाबांदी' },
    53: { eng: 'Moderate drizzle', hindi: 'मध्यम बूंदाबांदी' },
    55: { eng: 'Dense drizzle', hindi: 'तेज बूंदाबांदी' },
    61: { eng: 'Slight rain', hindi: 'हल्की बारिश' },
    63: { eng: 'Moderate rain', hindi: 'मध्यम बारिश' },
    65: { eng: 'Heavy rain', hindi: 'तेज बारिश' },
    71: { eng: 'Slight snow', hindi: 'हल्की बर्फबारी' },
    73: { eng: 'Moderate snow', hindi: 'मध्यम बर्फबारी' },
    75: { eng: 'Heavy snow', hindi: 'तेज बर्फबारी' },
    80: { eng: 'Rain showers', hindi: 'बारिश की बौछारें' },
    95: { eng: 'Thunderstorm', hindi: 'गरज के साथ तूफान' },
  };

  const cond = codeMap[weatherCode] || { eng: 'Partly Cloudy', hindi: 'आंशिक बादल' };

  const highTempC = Math.round(daily.temperature_2m_max?.[0] ?? tempC + 3);
  const lowTempC = Math.round(daily.temperature_2m_min?.[0] ?? tempC - 4);
  const rainChance = daily.precipitation_probability_max?.[0] ?? 0;

  const daysName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailyForecast = [];
  if (daily.time) {
    for (let i = 0; i < Math.min(daily.time.length, 7); i++) {
      const dateObj = new Date(daily.time[i]);
      const dayName = daysName[dateObj.getDay()];
      const code = daily.weather_code?.[i] ?? 0;
      const conditionObj = codeMap[code] || { eng: 'Partly Cloudy', hindi: 'आंशिक बादल' };
      dailyForecast.push({
        date: daily.time[i],
        dayName,
        maxTempC: Math.round(daily.temperature_2m_max?.[i] ?? 25),
        minTempC: Math.round(daily.temperature_2m_min?.[i] ?? 18),
        weatherCode: code,
        condition: conditionObj.eng,
        rainChance: daily.precipitation_probability_max?.[i] ?? 0,
      });
    }
  }

  return {
    city: cityName,
    country: countryName,
    latitude: lat,
    longitude: lon,
    tempC,
    tempF,
    feelsLikeC,
    condition: cond.eng,
    conditionHindi: cond.hindi,
    weatherCode,
    humidity,
    windSpeedKm,
    windDirectionDeg: 180,
    uvIndex: 5,
    pressureHpa,
    rainChance,
    highTempC,
    lowTempC,
    dailyForecast,
    updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

function extractCityFromPrompt(prompt: string): string {
  let text = prompt.replace(/weather|climate|temperature|forecast|mausam|today|now|kaisa|hai|batao|tell|me|what|is|the|in|at|of|for/gi, '').trim();
  text = text.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  if (text.length >= 2) return text;
  return 'New Delhi';
}

// Local Offline Intent Engine for rate-limit / fallback scenarios
function parseLocalOfflineIntent(prompt: string): { text: string; toolCall: any } {
  const raw = (prompt || '').trim();
  const lower = raw.toLowerCase();

  // Hindi specific query checks
  const isHindiInput = /[\u0900-\u097F]/.test(raw) || /\b(kaise|kya|batao|karo|tum|aap|namaste|haalaat|mausam|khol|kholo|band|boss|tanish|kaun|hoon|chalao|bajao|samjhao|suno|kyun|kyu)\b/i.test(lower);

  // Math & Arithmetic Solver
  const mathExprMatch = lower.match(/(?:what is|calculate|solve|eval|compute|kya hota hai)?\s*([0-9\.\s\+\-\*\/\(\)\%xX]+)(?:=?)/);
  if (mathExprMatch && mathExprMatch[1]) {
    const rawExpr = mathExprMatch[1].replace(/x/gi, '*').replace(/%/g, '/100').trim();
    if (/^[0-9\.\s\+\-\*\/\(\)]+$/.test(rawExpr) && rawExpr.length > 1 && /[0-9]/.test(rawExpr) && /[\+\-\*\/]/.test(rawExpr)) {
      try {
        const calcResult = Function(`"use strict"; return (${rawExpr})`)();
        if (typeof calcResult === 'number' && !isNaN(calcResult) && isFinite(calcResult)) {
          return {
            text: isHindiInput
              ? `उत्तर ${calcResult} है, बॉस।`
              : `The answer is ${calcResult}, Boss.`,
            toolCall: null,
          };
        }
      } catch (e) {}
    }
  }

  // Creator & Developer Queries
  if (
    lower.includes('who made you') ||
    lower.includes('who created you') ||
    lower.includes('who built you') ||
    lower.includes('your creator') ||
    lower.includes('tumhe kisine banaya') ||
    lower.includes('kisine banaya') ||
    lower.includes('creator kaun') ||
    lower.includes('who is tanish') ||
    lower.includes('tanish kaun') ||
    lower.includes('kine banaya')
  ) {
    return {
      text: isHindiInput
        ? `मुझे मेरे बॉस तनिष (Tanish) ने बनाया है! वो मेरे डेवलपर और क्रिएटर हैं, बॉस।`
        : `I was created and developed by my creator, Tanish (Boss)! He built me to be his personal AI Operating System.`,
      toolCall: null,
    };
  }

  // User Identity & "Who am I?"
  if (
    lower.includes('who am i') ||
    lower.includes('mera naam kya hai') ||
    lower.includes('main kaun hoon') ||
    lower.includes('mujhe jante ho') ||
    lower.includes('do you know me')
  ) {
    return {
      text: isHindiInput
        ? `आप मेरे बॉस तनिष (Tanish) हैं! आपने ही मुझे बनाया है, बॉस।`
        : `You are my Boss, Tanish! You created and developed me, Boss.`,
      toolCall: null,
    };
  }

  // Identity & Purpose
  if (
    lower.includes('who are you') ||
    lower.includes('what is your name') ||
    lower.includes('what are you') ||
    lower.includes('introduce yourself') ||
    lower.includes('tum kaun ho') ||
    lower.includes('kon ho') ||
    lower.includes('aap kaun hain') ||
    lower.includes('तुम कौन हो') ||
    lower.includes('तुम्हारा नाम क्या है')
  ) {
    return {
      text: isHindiInput
        ? 'मैं लिली (LILI) हूँ, आपकी AI ऑपरेटिंग सिस्टम। मुझे मेरे बॉस तनिष ने बनाया है। मैं आपके सभी काम, पीसी कंट्रोल्स और सवालों में मदद करती हूँ, बॉस!'
        : 'I am LILI (Life-Integrated Logical Intelligence), your AI Operating System created by Tanish, Boss!',
      toolCall: null,
    };
  }

  // Remote Phone Sync Commands
  if (
    lower.includes('ring my phone') ||
    lower.includes('find my phone') ||
    lower.includes('ring phone') ||
    lower.includes('mera phone') ||
    lower.includes('phone kahan hai') ||
    lower.includes('phone bajao') ||
    lower.includes('फोन बजाओ')
  ) {
    return {
      text: isHindiInput
        ? `आपके फ़ोन पर अलार्म और रिंगिंग ट्रिगर कर दी गई है, बॉस!`
        : `Ringing your phone at maximum alert volume, Boss!`,
      toolCall: { name: 'control_pc', args: { action: 'ring_phone' } },
    };
  }

  // Remote Laptop Controls
  if (
    lower.includes('lock my laptop') ||
    lower.includes('lock laptop') ||
    lower.includes('lock pc') ||
    lower.includes('laptop lock') ||
    lower.includes('स्क्रीन लॉक करो')
  ) {
    return {
      text: isHindiInput
        ? `लैपटॉप की स्क्रीन को सुरक्षित लॉक कर दिया गया है, बॉस!`
        : `Locking your laptop display screen remotely, Boss!`,
      toolCall: { name: 'control_pc', args: { action: 'lock_screen' } },
    };
  }

  if (
    lower.includes('take screenshot') ||
    lower.includes('capture screen') ||
    lower.includes('screen shot') ||
    lower.includes('स्क्रीनशॉट')
  ) {
    return {
      text: isHindiInput
        ? `स्क्रीनशॉट कैप्चर कर लिया गया है, बॉस!`
        : `Capturing desktop screenshot, Boss!`,
      toolCall: { name: 'control_pc', args: { action: 'take_screenshot' } },
    };
  }

  // Knowledge Topics
  if (lower.includes('photosynthesis') || lower.includes('प्रकाश संश्लेषण')) {
    return {
      text: isHindiInput
        ? 'प्रकाश संश्लेषण (Photosynthesis) वह प्रक्रिया है जिससे पौधे धूप, पानी और CO2 से अपना भोजन और ऑक्सीजन बनाते हैं, बॉस।'
        : 'Photosynthesis is the process where plants convert sunlight, water, and carbon dioxide into food and oxygen, Boss.',
      toolCall: null,
    };
  }

  if (lower.includes('gravity') || lower.includes('गुरुत्वाकर्षण')) {
    return {
      text: isHindiInput
        ? 'गुरुत्वाकर्षण वह बल है जो द्रव्यमान वाली वस्तुओं को एक दूसरे की तरफ खींचता है, बॉस।'
        : 'Gravity is the fundamental force that pulls objects with mass toward each other, Boss.',
      toolCall: null,
    };
  }

  if (lower.includes('black hole') || lower.includes('ब्लैक होल')) {
    return {
      text: isHindiInput
        ? 'ब्लैक होल अंतरिक्ष में अत्यधिक गुरुत्वाकर्षण वाला क्षेत्र है जहाँ से प्रकाश भी बाहर नहीं आ सकता, बॉस।'
        : 'A black hole is a region of spacetime with gravity so strong that nothing, not even light, can escape, Boss.',
      toolCall: null,
    };
  }

  if (lower.includes('ai') || lower.includes('artificial intelligence') || lower.includes('एआई')) {
    return {
      text: isHindiInput
        ? 'आर्टिफिशियल इंटेलिजेंस (AI) कंप्यूटर सिस्टम को इंसानों की तरह सोचने और सीखने की क्षमता प्रदान करता है, जैसे मैं आपकी सेवा कर रही हूँ, बॉस!'
        : 'Artificial Intelligence refers to computer systems engineered to simulate human reasoning, perception, and learning, Boss.',
      toolCall: null,
    };
  }

  if (lower.includes('python') || lower.includes('javascript') || lower.includes('coding') || lower.includes('programming')) {
    return {
      text: isHindiInput
        ? 'कोडिंग कंप्यूटर को निर्देश देने का तरीका है। पायथन और जावास्क्रिप्ट आधुनिक सॉफ्टवेयर और AI बनाने की मुख्य भाषाएँ हैं, बॉस!'
        : 'Coding is writing instructions for computers. Python and JavaScript power modern applications and AI, Boss!',
      toolCall: null,
    };
  }

  // Smart Home
  if (lower.includes('light') || lower.includes('batti')) {
    const isOff = lower.includes('off') || lower.includes('band');
    return {
      text: isHindiInput
        ? `लाइट ${isOff ? 'बंद' : 'चालू'} कर दी गई है, बॉस।`
        : `Smart light turned ${isOff ? 'off' : 'on'}, Boss.`,
      toolCall: { name: 'control_smart_home', args: { device: 'Main Ceiling Light', action: isOff ? 'off' : 'on' } },
    };
  }

  if (lower.includes('fan') || lower.includes('pankha')) {
    const isOff = lower.includes('off') || lower.includes('band');
    return {
      text: isHindiInput
        ? `पंखा ${isOff ? 'बंद' : 'चालू'} कर दिया गया है, बॉस।`
        : `Fan turned ${isOff ? 'off' : 'on'}, Boss.`,
      toolCall: { name: 'control_smart_home', args: { device: 'BLDC High Speed Fan', action: isOff ? 'off' : 'on' } },
    };
  }

  if (lower.includes('ac') || lower.includes('air conditioner')) {
    const isOff = lower.includes('off') || lower.includes('band');
    return {
      text: isHindiInput
        ? `एसी ${isOff ? 'बंद' : '22°C पर चालू'} कर दिया गया है, बॉस।`
        : `AC ${isOff ? 'turned off' : 'set to 22°C'}, Boss.`,
      toolCall: { name: 'control_smart_home', args: { device: 'Dual Inverter AC', action: isOff ? 'off' : 'set_temp', value: '22' } },
    };
  }

  // Web search / Apps
  if (lower.includes('youtube')) {
    return {
      text: isHindiInput ? 'यूट्यूब खोला जा रहा है, बॉस!' : 'Opening YouTube, Boss!',
      toolCall: { name: 'control_pc', args: { action: 'open_app', target: 'YouTube' } },
    };
  }

  if (lower.includes('chrome') || lower.includes('google')) {
    return {
      text: isHindiInput ? 'गूगल क्रोम खोला जा रहा है, बॉस!' : 'Opening Google Chrome, Boss!',
      toolCall: { name: 'control_pc', args: { action: 'open_app', target: 'Chrome Browser' } },
    };
  }

  // Calendar & Festival Intents
  if (lower.includes('calendar') || lower.includes('panchang') || lower.includes('tyohar list') || lower.includes('festival list')) {
    return {
      text: isHindiInput
        ? 'कैलेंडर और त्योहार हब खोला जा रहा है, बॉस! यहाँ आप सभी त्योहारों की तिथियां और लाइव समय देख सकते हैं।'
        : 'Opening Calendar & Festivals Hub, Boss! You can explore live dates, countdowns, and festival schedules.',
      toolCall: { name: 'control_pc', args: { action: 'open_app', target: 'Calendar' } },
    };
  }

  // Festival Specific Fast Inquiries
  if (lower.includes('diwali') || lower.includes('deepavali') || lower.includes('दीवाली') || lower.includes('दिवाली')) {
    return {
      text: isHindiInput
        ? 'दीपावली (Diwali) 2026 में 8 नवंबर (रविवार) को मनाई जाएगी, बॉस! धनतेरस 6 नवंबर (शुक्रवार) और भाई दूज 10 नवंबर (मंगलवार) को है।'
        : 'Diwali (Festival of Lights) in 2026 is on Sunday, November 8, 2026, Boss! Dhanteras is on Nov 6 (Friday) and Bhai Dooj is on Nov 10 (Tuesday).',
      toolCall: { name: 'control_pc', args: { action: 'open_app', target: 'Calendar' } },
    };
  }

  if (lower.includes('holi') || lower.includes('होली') || lower.includes('dhulandi')) {
    return {
      text: isHindiInput
        ? 'होली (Holi) 2026 में 4 मार्च (बुधवार) को खेली जाएगी, और होलिका दहन 3 मार्च (मंगलवार) को होगा, बॉस!'
        : 'Holi (Festival of Colors) in 2026 is on Wednesday, March 4, 2026, with Holika Dahan on Tuesday, March 3, 2026, Boss!',
      toolCall: { name: 'control_pc', args: { action: 'open_app', target: 'Calendar' } },
    };
  }

  if (lower.includes('raksha bandhan') || lower.includes('rakhi') || lower.includes('रक्षा बंधन')) {
    return {
      text: isHindiInput
        ? 'रक्षा बंधन (Raksha Bandhan) 2026 में 28 अगस्त (शुक्रवार) को है, बॉस!'
        : 'Raksha Bandhan in 2026 is on Friday, August 28, 2026, Boss!',
      toolCall: { name: 'control_pc', args: { action: 'open_app', target: 'Calendar' } },
    };
  }

  if (lower.includes('eid') || lower.includes('ramadan') || lower.includes('ईद') || lower.includes('रमजान')) {
    return {
      text: isHindiInput
        ? 'रमज़ान 18 फरवरी 2026 से शुरू होगा। ईद-उल-फ़ितर 20 मार्च 2026 (शुक्रवार) को और ईद-उल-अज़हा (बकरीद) 27 मई 2026 (बुधवार) को होगी, बॉस।'
        : 'Ramadan 2026 begins on February 18. Eid-ul-Fitr is on Friday, March 20, 2026, and Eid-ul-Adha (Bakrid) is on Wednesday, May 27, 2026, Boss.',
      toolCall: { name: 'control_pc', args: { action: 'open_app', target: 'Calendar' } },
    };
  }

  if (lower.includes('christmas') || lower.includes('क्रिसमस') || lower.includes('xmas')) {
    return {
      text: isHindiInput
        ? 'क्रिसमस (Christmas) 25 दिसंबर 2026 (शुक्रवार) को मनाया जाएगा, बॉस!'
        : 'Christmas Day in 2026 will be celebrated on Friday, December 25, 2026, Boss!',
      toolCall: { name: 'control_pc', args: { action: 'open_app', target: 'Calendar' } },
    };
  }

  if (lower.includes('janmashtami') || lower.includes('जन्माष्टमी') || lower.includes('gokulashtami')) {
    return {
      text: isHindiInput
        ? 'श्री कृष्ण जन्माष्टमी 2026 में 4 सितंबर (शुक्रवार) को है, बॉस!'
        : 'Krishna Janmashtami in 2026 is on Friday, September 4, 2026, Boss!',
      toolCall: { name: 'control_pc', args: { action: 'open_app', target: 'Calendar' } },
    };
  }

  if (lower.includes('ganesh chaturthi') || lower.includes('गणेश चतुर्थी') || lower.includes('vinayaka')) {
    return {
      text: isHindiInput
        ? 'गणेश चतुर्थी 2026 में 14 सितंबर (सोमवार) को है, बॉस!'
        : 'Ganesh Chaturthi in 2026 is on Monday, September 14, 2026, Boss!',
      toolCall: { name: 'control_pc', args: { action: 'open_app', target: 'Calendar' } },
    };
  }

  if (lower.includes('navratri') || lower.includes('dussehra') || lower.includes('दशहरा') || lower.includes('durga puja') || lower.includes('नवरात्रि')) {
    return {
      text: isHindiInput
        ? 'शारदीय नवरात्रि 11 अक्टूबर 2026 (रविवार) से शुरू होगी और दशहरा (विजयादशमी) 20 अक्टूबर 2026 (मंगलवार) को है, बॉस!'
        : 'Sharad Navratri begins on Sunday, October 11, 2026, and Dussehra (Vijayadashami) is on Tuesday, October 20, 2026, Boss!',
      toolCall: { name: 'control_pc', args: { action: 'open_app', target: 'Calendar' } },
    };
  }

  if (lower.includes('shivratri') || lower.includes('शिवरात्रि') || lower.includes('maha shivratri')) {
    return {
      text: isHindiInput
        ? 'महा शिवरात्रि 2026 में 15 फरवरी (रविवार) को है, बॉस!'
        : 'Maha Shivratri in 2026 is on Sunday, February 15, 2026, Boss!',
      toolCall: { name: 'control_pc', args: { action: 'open_app', target: 'Calendar' } },
    };
  }

  if (lower.includes('republic day') || lower.includes('26 january') || lower.includes('गणतंत्र दिवस')) {
    return {
      text: isHindiInput
        ? 'भारत का 77वां गणतंत्र दिवस 26 जनवरी 2026 (सोमवार) को है, बॉस!'
        : 'Republic Day of India in 2026 is on Monday, January 26, 2026, Boss!',
      toolCall: { name: 'control_pc', args: { action: 'open_app', target: 'Calendar' } },
    };
  }

  if (lower.includes('independence day') || lower.includes('15 august') || lower.includes('स्वतंत्रता दिवस')) {
    return {
      text: isHindiInput
        ? 'स्वतंत्रता दिवस 15 अगस्त 2026 (शनिवार) को है, बॉस!'
        : 'Independence Day of India in 2026 is on Saturday, August 15, 2026, Boss!',
      toolCall: { name: 'control_pc', args: { action: 'open_app', target: 'Calendar' } },
    };
  }

  if (lower.includes('makar sankranti') || lower.includes('मकर संक्रांति') || lower.includes('pongal') || lower.includes('uttarayan')) {
    return {
      text: isHindiInput
        ? 'मकर संक्रांति और पोंगल 14 जनवरी 2026 (बुधवार) को है, बॉस!'
        : 'Makar Sankranti & Pongal in 2026 is on Wednesday, January 14, 2026, Boss!',
      toolCall: { name: 'control_pc', args: { action: 'open_app', target: 'Calendar' } },
    };
  }

  if (lower.includes('chhath') || lower.includes('छठ पूजा') || lower.includes('chhath puja')) {
    return {
      text: isHindiInput
        ? 'छठ पूजा 2026 में 15 नवंबर (रविवार) को मनाई जाएगी, बॉस!'
        : 'Chhath Puja in 2026 is on Sunday, November 15, 2026, Boss!',
      toolCall: { name: 'control_pc', args: { action: 'open_app', target: 'Calendar' } },
    };
  }

  if (lower.includes('karwa chauth') || lower.includes('करवा चौथ')) {
    return {
      text: isHindiInput
        ? 'करवा चौथ 2026 में 29 अक्टूबर (गुरुवार) को है, बॉस!'
        : 'Karwa Chauth in 2026 is on Thursday, October 29, 2026, Boss!',
      toolCall: { name: 'control_pc', args: { action: 'open_app', target: 'Calendar' } },
    };
  }

  if (lower.includes('dhanteras') || lower.includes('धनतेरस')) {
    return {
      text: isHindiInput
        ? 'धनतेरस 2026 में 6 नवंबर (शुक्रवार) को है, बॉस!'
        : 'Dhanteras in 2026 is on Friday, November 6, 2026, Boss!',
      toolCall: { name: 'control_pc', args: { action: 'open_app', target: 'Calendar' } },
    };
  }

  if (lower.includes('bhai dooj') || lower.includes('भाई दूज')) {
    return {
      text: isHindiInput
        ? 'भाई दूज 2026 में 10 नवंबर (मंगलवार) को है, बॉस!'
        : 'Bhai Dooj in 2026 is on Tuesday, November 10, 2026, Boss!',
      toolCall: { name: 'control_pc', args: { action: 'open_app', target: 'Calendar' } },
    };
  }

  if (lower.includes('baisakhi') || lower.includes('vaisakhi') || lower.includes('बैसाखी')) {
    return {
      text: isHindiInput
        ? 'बैसाखी 2026 में 14 अप्रैल (मंगलवार) को है, बॉस!'
        : 'Baisakhi in 2026 is on Tuesday, April 14, 2026, Boss!',
      toolCall: { name: 'control_pc', args: { action: 'open_app', target: 'Calendar' } },
    };
  }

  if (lower.includes('buddha purnima') || lower.includes('बुद्ध पूर्णिमा')) {
    return {
      text: isHindiInput
        ? 'बुद्ध पूर्णिमा 2026 में 1 मई (शुक्रवार) को है, बॉस!'
        : 'Buddha Purnima in 2026 is on Friday, May 1, 2026, Boss!',
      toolCall: { name: 'control_pc', args: { action: 'open_app', target: 'Calendar' } },
    };
  }

  if (lower.includes('guru nanak') || lower.includes('गुरु नानक जयंती') || lower.includes('gurpurab')) {
    return {
      text: isHindiInput
        ? 'श्री गुरु नानक देव जी जयंती (गुरुपर्व) 24 नवंबर 2026 (मंगलवार) को है, बॉस!'
        : 'Guru Nanak Jayanti in 2026 is on Tuesday, November 24, 2026, Boss!',
      toolCall: { name: 'control_pc', args: { action: 'open_app', target: 'Calendar' } },
    };
  }

  if (lower.includes('ram navami') || lower.includes('राम नवमी')) {
    return {
      text: isHindiInput
        ? 'श्री राम नवमी 2026 में 28 मार्च (शनिवार) को है, बॉस!'
        : 'Ram Navami in 2026 is on Saturday, March 28, 2026, Boss!',
      toolCall: { name: 'control_pc', args: { action: 'open_app', target: 'Calendar' } },
    };
  }

  if (lower.includes('festival') || lower.includes('tyohar') || lower.includes('next festival') || lower.includes('aaj kaun sa tyohar')) {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const todayYMD = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Check if any festival is today
    const festivalsList = [
      { name: "New Year's Day", nameHindi: 'नव वर्ष', date: '2026-01-01', dayOfWeek: 'Thursday' },
      { name: 'Makar Sankranti / Pongal', nameHindi: 'मकर संक्रांति', date: '2026-01-14', dayOfWeek: 'Wednesday' },
      { name: 'Republic Day', nameHindi: 'गणतंत्र दिवस', date: '2026-01-26', dayOfWeek: 'Monday' },
      { name: 'Maha Shivratri', nameHindi: 'महा शिवरात्रि', date: '2026-02-15', dayOfWeek: 'Sunday' },
      { name: 'Holi', nameHindi: 'होली', date: '2026-03-04', dayOfWeek: 'Wednesday' },
      { name: 'Eid-ul-Fitr', nameHindi: 'ईद-उल-फ़ितर', date: '2026-03-20', dayOfWeek: 'Friday' },
      { name: 'Ram Navami', nameHindi: 'राम नवमी', date: '2026-03-28', dayOfWeek: 'Saturday' },
      { name: 'Mahavir Jayanti', nameHindi: 'महावीर जयंती', date: '2026-03-31', dayOfWeek: 'Tuesday' },
      { name: 'Good Friday', nameHindi: 'गुड फ्राइडे', date: '2026-04-03', dayOfWeek: 'Friday' },
      { name: 'Easter Sunday', nameHindi: 'ईस्टर संडे', date: '2026-04-05', dayOfWeek: 'Sunday' },
      { name: 'Baisakhi', nameHindi: 'बैसाखी', date: '2026-04-14', dayOfWeek: 'Tuesday' },
      { name: 'Buddha Purnima', nameHindi: 'बुद्ध पूर्णिमा', date: '2026-05-01', dayOfWeek: 'Friday' },
      { name: 'Eid-ul-Adha (Bakrid)', nameHindi: 'बकरीद', date: '2026-05-27', dayOfWeek: 'Wednesday' },
      { name: 'Independence Day', nameHindi: 'स्वतंत्रता दिवस', date: '2026-08-15', dayOfWeek: 'Saturday' },
      { name: 'Raksha Bandhan', nameHindi: 'रक्षा बंधन', date: '2026-08-28', dayOfWeek: 'Friday' },
      { name: 'Krishna Janmashtami', nameHindi: 'श्री कृष्ण जन्माष्टमी', date: '2026-09-04', dayOfWeek: 'Friday' },
      { name: 'Ganesh Chaturthi', nameHindi: 'गणेश चतुर्थी', date: '2026-09-14', dayOfWeek: 'Monday' },
      { name: 'Gandhi Jayanti', nameHindi: 'गांधी जयंती', date: '2026-10-02', dayOfWeek: 'Friday' },
      { name: 'Navratri / Durga Puja', nameHindi: 'दुर्गा पूजा', date: '2026-10-11', dayOfWeek: 'Sunday' },
      { name: 'Dussehra / Vijayadashami', nameHindi: 'दशहरा', date: '2026-10-20', dayOfWeek: 'Tuesday' },
      { name: 'Karwa Chauth', nameHindi: 'करवा चौथ', date: '2026-10-29', dayOfWeek: 'Thursday' },
      { name: 'Dhanteras', nameHindi: 'धनतेरस', date: '2026-11-06', dayOfWeek: 'Friday' },
      { name: 'Diwali (Deepavali)', nameHindi: 'दीपावली', date: '2026-11-08', dayOfWeek: 'Sunday' },
      { name: 'Bhai Dooj', nameHindi: 'भाई दूज', date: '2026-11-10', dayOfWeek: 'Tuesday' },
      { name: 'Chhath Puja', nameHindi: 'छठ पूजा', date: '2026-11-15', dayOfWeek: 'Sunday' },
      { name: 'Guru Nanak Jayanti', nameHindi: 'गुरु नानक जयंती', date: '2026-11-24', dayOfWeek: 'Tuesday' },
      { name: 'Christmas', nameHindi: 'क्रिसमस', date: '2026-12-25', dayOfWeek: 'Friday' },
    ];

    const todayFest = festivalsList.find(f => f.date === todayYMD);
    const upcomingFest = festivalsList.find(f => f.date > todayYMD) || festivalsList[0];

    const todayMsg = todayFest 
      ? (isHindiInput ? `आज ${todayFest.nameHindi || todayFest.name} का पावन पर्व है!` : `Today is ${todayFest.name}!`)
      : (isHindiInput ? `आज कोई प्रमुख त्योहार नहीं है।` : `There are no major festivals scheduled for today.`);

    const nextMsg = upcomingFest
      ? (isHindiInput 
          ? `अगला प्रमुख त्योहार ${upcomingFest.nameHindi || upcomingFest.name} (${upcomingFest.date}, ${upcomingFest.dayOfWeek}) को है, बॉस!` 
          : `The next upcoming celebration is ${upcomingFest.name} on ${upcomingFest.dayOfWeek}, ${upcomingFest.date}, Boss!`)
      : '';

    return {
      text: `आज ${dateStr} है। ${todayMsg} ${nextMsg}`,
      toolCall: { name: 'control_pc', args: { action: 'open_app', target: 'Calendar' } },
    };
  }

  // Date & Day Queries
  if (lower.includes('date') || lower.includes('tarikh') || lower.includes('aaj kya tarikh') || lower.includes("today's date")) {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return {
      text: isHindiInput ? `आज ${dateStr} है, बॉस।` : `Today is ${dateStr}, Boss.`,
      toolCall: null,
    };
  }

  // System Volume & Audio Controls
  if (lower.includes('volume up') || lower.includes('aawaz badhao') || lower.includes('increase volume')) {
    return {
      text: isHindiInput ? 'सिस्टम वॉल्यूम 80% पर बढ़ा दिया गया है, बॉस!' : 'Volume increased to 80%, Boss!',
      toolCall: { name: 'control_pc', args: { action: 'set_volume', target: '80' } },
    };
  }

  if (lower.includes('volume down') || lower.includes('aawaz kam karo') || lower.includes('decrease volume')) {
    return {
      text: isHindiInput ? 'सिस्टम वॉल्यूम 30% पर कम कर दिया गया है, बॉस!' : 'Volume decreased to 30%, Boss!',
      toolCall: { name: 'control_pc', args: { action: 'set_volume', target: '30' } },
    };
  }

  if (lower.includes('mute') || lower.includes('chup ho jao') || lower.includes('silence')) {
    return {
      text: isHindiInput ? 'सिस्टम म्यूट कर दिया गया है, बॉस।' : 'System audio muted, Boss.',
      toolCall: { name: 'control_pc', args: { action: 'set_volume', target: '0' } },
    };
  }

  if (lower.includes('brightness') || lower.includes('roshni')) {
    const isHigh = lower.includes('100') || lower.includes('full') || lower.includes('up') || lower.includes('badhao');
    return {
      text: isHindiInput
        ? `स्क्रीन ब्राइटनेस ${isHigh ? '100%' : '50%'} सेट कर दी गई है, बॉस!`
        : `Display brightness set to ${isHigh ? '100%' : '50%'}, Boss!`,
      toolCall: { name: 'control_pc', args: { action: 'set_brightness', target: isHigh ? '100' : '50' } },
    };
  }

  // Common App Launchers
  if (lower.includes('spotify') || lower.includes('music') || lower.includes('gana bajao') || lower.includes('play music')) {
    return {
      text: isHindiInput ? 'स्पॉटिफ़ाई म्यूज़िक प्लेयर खोला जा रहा है, बॉस!' : 'Launching Spotify music player, Boss!',
      toolCall: { name: 'control_pc', args: { action: 'open_app', target: 'Spotify' } },
    };
  }

  if (lower.includes('calculator') || lower.includes('calc') || lower.includes('hisab')) {
    return {
      text: isHindiInput ? 'कैलकुलेटर ऐप खोला जा रहा है, बॉस!' : 'Opening Calculator, Boss!',
      toolCall: { name: 'control_pc', args: { action: 'open_app', target: 'Calculator' } },
    };
  }

  if (lower.includes('whatsapp')) {
    return {
      text: isHindiInput ? 'व्हाट्सएप खोला जा रहा है, बॉस!' : 'Opening WhatsApp, Boss!',
      toolCall: { name: 'control_pc', args: { action: 'open_app', target: 'WhatsApp' } },
    };
  }

  if (lower.includes('code') || lower.includes('vscode') || lower.includes('vs code')) {
    return {
      text: isHindiInput ? 'वीएस कोड एडिटर शुरू किया जा रहा है, बॉस!' : 'Opening Visual Studio Code, Boss!',
      toolCall: { name: 'control_pc', args: { action: 'open_app', target: 'VS Code' } },
    };
  }

  // Jokes
  if (lower.includes('joke') || lower.includes('chutkula') || lower.includes('hanso') || lower.includes('hasao')) {
    return {
      text: isHindiInput
        ? 'टीचर: बताओ न्यूटन का चौथा नियम क्या है? छात्र: जब परीक्षा कठिन हो, तो दिमाग अपने आप शून्य हो जाता है, बॉस!'
        : 'Why do programmers prefer dark mode? Because light attracts bugs, Boss!',
      toolCall: null,
    };
  }

  // Status / Greetings
  if (lower.includes('kaise ho') || lower.includes('kya haal hai') || lower.includes('how are you') || lower.includes('sab theek')) {
    return {
      text: isHindiInput
        ? 'मैं बिल्कुल बढ़िया और 100% एक्टिव हूँ, बॉस! आप कैसे हैं?'
        : 'I am operating at 100% efficiency and ready, Boss! How are you doing?',
      toolCall: null,
    };
  }

  if (lower === 'hello' || lower === 'hi' || lower === 'hey' || lower.includes('namaste')) {
    return {
      text: isHindiInput
        ? 'नमस्ते बॉस! मैं लिली हूँ, आपकी सेवा में तैयार।'
        : 'Hello Boss! LILI is online and ready.',
      toolCall: null,
    };
  }

  if (lower.includes('time') || lower.includes('samay') || lower.includes('waqt')) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      text: isHindiInput
        ? `वर्तमान समय ${timeStr} है, बॉस।`
        : `Current system time is ${timeStr}, Boss.`,
      toolCall: null,
    };
  }

  // Fallback for unrecognized local offline queries: direct contextual acknowledgment without repetitive slogans
  const cleanSummary = raw.length > 50 ? raw.slice(0, 47) + '...' : raw;
  return {
    text: isHindiInput
      ? `"${cleanSummary}" के संबंध में मैं आपकी पूरी सहायता कर सकती हूँ, बॉस। क्या आप इसके बारे में विस्तार से जानना चाहते हैं?`
      : `I have processed your query regarding "${cleanSummary}", Boss. How would you like me to proceed with this?`,
    toolCall: null,
  };
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'LILI_AI_OS_v4.5',
    timestamp: new Date().toISOString(),
    capabilities: ['voice', 'pc_control', 'web_grounding', 'smart_home', 'automation', 'weather_telemetry'],
  });
});

// Weather API Endpoint
app.get('/api/weather', async (req, res) => {
  try {
    const location = String(req.query.location || 'New Delhi');
    const data = await fetchOpenMeteoWeather(location, false);
    return res.json(data);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to fetch weather data' });
  }
});

// Primary Chat & Tool Execution Endpoint
app.post('/api/lili/chat', async (req, res) => {
  try {
    const { prompt, history } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const lowerPrompt = String(prompt).toLowerCase().trim();
    const isHindiInput = /[\u0900-\u097F]/.test(prompt) || /\b(mausam|kaisa|kaisa hai|batao|taapmaan|kaise|kya|kholo|band|chalao|bajao|karo|tum|aap|namaste|haalaat)\b/i.test(lowerPrompt);

    // 1. FAST-PATH WEATHER TELEMETRY (Direct Open-Meteo API)
    if (lowerPrompt.includes('weather') || lowerPrompt.includes('mausam') || lowerPrompt.includes('climate') || lowerPrompt.includes('forecast') || lowerPrompt.includes('temperature in') || lowerPrompt.includes('weather in')) {
      try {
        const city = extractCityFromPrompt(prompt);
        const wData = await fetchOpenMeteoWeather(city, isHindiInput);
        const text = isHindiInput
          ? `${wData.city}, ${wData.country} का ताज़ा लाइव मौसम: तापमान ${wData.tempC}°C (${wData.conditionHindi}), नमी ${wData.humidity}%, और हवा ${wData.windSpeedKm} km/h है। आज का अधिकतम तापमान ${wData.highTempC}°C रहेगा, बॉस।`
          : `Real-time live weather telemetry for ${wData.city}, ${wData.country}: Currently ${wData.tempC}°C (${wData.condition}), humidity at ${wData.humidity}%, and wind speed at ${wData.windSpeedKm} km/h. High today is ${wData.highTempC}°C, Boss.`;

        return res.json({
          text,
          toolCall: { name: 'get_weather', args: { location: `${wData.city}, ${wData.country}` } },
          memoriesCount: userMemories.length,
          fastPath: true,
        });
      } catch (_wErr) {
        // Continue if city lookup fails
      }
    }

    // 2. ULTRA-FAST LOCAL INTENT ENGINE (Sub-5ms response for common controls, status, PC actions, greetings, math, & smart home)
    const instantResult = parseLocalOfflineIntent(prompt);
    // If the local engine found a specific recognized intent (not default generic fallback), return instantly
    const isGenericFallback = instantResult && (
      instantResult.text.includes('आपकी कमांड निष्पादित') || 
      instantResult.text.includes('Executed, Boss') ||
      instantResult.text.includes('सहायता कर सकती हूँ') ||
      instantResult.text.includes('processed your query regarding')
    );
    if (instantResult && !isGenericFallback) {
      return res.json({
        text: instantResult.text,
        toolCall: instantResult.toolCall,
        memoriesCount: userMemories.length,
        fastPath: true,
      });
    }

    // 3. FAST CLOUD LLM (gemini-3.1-flash-lite for lowest latency intelligence)
    const controlPcFunction = {
      name: 'control_pc',
      description: 'Control PC applications, system volume, screen brightness, screenshot, or power settings.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          action: {
            type: Type.STRING,
            description: 'open_app, close_app, set_volume, set_brightness, take_screenshot, power',
          },
          target: {
            type: Type.STRING,
            description: 'App name (e.g. chrome, code, spotify, calc), level (0-100), or power action (shutdown, sleep, lock)',
          },
        },
        required: ['action'],
      },
    };

    const controlHomeFunction = {
      name: 'control_smart_home',
      description: 'Control smart lights, AC thermostat, fan speed, or smart home scenes.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          device: { type: Type.STRING, description: 'Device name or room (e.g., Ceiling Light, AC, Fan, Desk Strip)' },
          action: { type: Type.STRING, description: 'on, off, dim, set_temp, set_speed, trigger_scene' },
          value: { type: Type.STRING, description: 'Temperature number, brightness level, or scene name (gaming, cinema, focus, sleep)' },
        },
        required: ['device', 'action'],
      },
    };

    const saveMemoryFunction = {
      name: 'save_memory',
      description: 'Save a personal fact, habit, or preference to LILI\'s long-term memory vault.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          fact: { type: Type.STRING, description: 'The personal fact or preference to remember.' },
        },
        required: ['fact'],
      },
    };

    const getWeatherFunction = {
      name: 'get_weather',
      description: 'Get real-time live weather telemetry, temperature, humidity, wind, and forecasting for any city or country in the world.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          location: { type: Type.STRING, description: 'City, region, or country name' },
        },
        required: ['location'],
      },
    };

    const allTools = [
      { functionDeclarations: [controlPcFunction, controlHomeFunction, saveMemoryFunction, getWeatherFunction] },
    ];

    let response: any = null;

    // Streamlined history payload (last 4 turns only for fast token processing)
    const contentsPayload: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-4);
      for (const h of recentHistory) {
        if (h && h.text && (h.role === 'user' || h.role === 'model')) {
          contentsPayload.push({
            role: h.role,
            parts: [{ text: String(h.text) }],
          });
        }
      }
    }
    contentsPayload.push({
      role: 'user',
      parts: [{ text: String(prompt) }],
    });

    const isQuotaExceeded = Date.now() < quotaExceededUntil;

    if (!isQuotaExceeded) {
      const checkAndHandle429 = (err: any) => {
        const is429 = err?.status === 429 || String(err?.message || '').includes('429') || String(err?.message || '').includes('RESOURCE_EXHAUSTED');
        if (is429) {
          quotaExceededUntil = Date.now() + 3000;
        }
      };

      // Wrap in a timeout race to guarantee responsive UX while giving models enough time for intelligent answers
      const callWithTimeout = (modelName: string, timeoutMs: number = 4500) => {
        return Promise.race([
          ai.models.generateContent({
            model: modelName,
            contents: contentsPayload,
            config: {
              systemInstruction: LILI_SYSTEM_PROMPT,
              tools: allTools,
            },
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)),
        ]);
      };

      // Primary: gemini-3.1-flash-lite (fastest inference latency)
      try {
        response = await callWithTimeout('gemini-3.1-flash-lite', 4500);
      } catch (_err1: any) {
        checkAndHandle429(_err1);

        // Secondary: gemini-3.8-flash
        try {
          response = await callWithTimeout('gemini-3.8-flash', 3500);
        } catch (_err2: any) {
          checkAndHandle429(_err2);

          // Tertiary: gemini-flash-latest
          try {
            response = await callWithTimeout('gemini-flash-latest', 3000);
          } catch (_err3: any) {
            checkAndHandle429(_err3);
            response = null;
          }
        }
      }
    }

    if (response && (response.text || (response.functionCalls && response.functionCalls.length > 0))) {
      let replyText = response.text ? String(response.text).trim() : '';
      const functionCalls = response.functionCalls;

      let executedToolCall = null;

      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        executedToolCall = {
          name: call.name,
          args: call.args as Record<string, any>,
        };

        if (call.name === 'get_weather') {
          const loc = String(call.args?.location || 'New Delhi');
          try {
            const wData = await fetchOpenMeteoWeather(loc, isHindiInput);
            replyText = isHindiInput
              ? `${wData.city}, ${wData.country} का मौसम: तापमान ${wData.tempC}°C (${wData.conditionHindi}), नमी ${wData.humidity}%, और हवा ${wData.windSpeedKm} km/h है।`
              : `Weather in ${wData.city}, ${wData.country}: ${wData.tempC}°C (${wData.condition}), humidity at ${wData.humidity}%, wind speed ${wData.windSpeedKm} km/h, Boss.`;
          } catch (e) {
            replyText = isHindiInput
              ? `${loc} का मौसम डेटा प्राप्त नहीं हो सका, बॉस।`
              : `Could not retrieve weather telemetry for ${loc}, Boss.`;
          }
        } else if (call.name === 'save_memory' && call.args?.fact) {
          userMemories.unshift({
            id: Date.now().toString(),
            category: 'fact',
            content: String(call.args.fact),
            createdAt: new Date().toISOString().split('T')[0],
          });
          if (!replyText) {
            replyText = isHindiInput
              ? `आपकी यह बात मेमोरी वॉल्ट में सुरक्षित सेव कर ली गई है, बॉस!`
              : `Saved to memory vault, Boss!`;
          }
        } else if (call.name === 'control_pc' && !replyText) {
          const action = call.args?.action || 'action';
          const target = call.args?.target ? ` for ${call.args.target}` : '';
          replyText = isHindiInput
            ? `PC कमांड निष्पादित: ${action}${target}, बॉस!`
            : `Executing PC command: ${action}${target}, Boss!`;
        } else if (call.name === 'control_smart_home' && !replyText) {
          const device = call.args?.device || 'device';
          const action = call.args?.action || 'state';
          replyText = isHindiInput
            ? `${device} ${action} सेट कर दिया गया है, बॉस!`
            : `Smart home: ${device} set to ${action}, Boss!`;
        }
      }

      if (!replyText) {
        if (executedToolCall) {
          replyText = isHindiInput
            ? `${executedToolCall.name} क्रिया पूरी कर ली गई है, बॉस।`
            : `Action for ${executedToolCall.name} completed successfully, Boss.`;
        } else {
          replyText = isHindiInput
            ? `जी बॉस, मैं आपके निर्देश पर कार्य करने के लिए तैयार हूँ।`
            : `I have processed your request, Boss. Ready for next instructions.`;
        }
      }

      return res.json({
        text: replyText,
        toolCall: executedToolCall,
        memoriesCount: userMemories.length,
      });
    }

    // Instant offline fallback
    const offlineResult = parseLocalOfflineIntent(prompt);
    return res.json({
      text: offlineResult.text,
      toolCall: offlineResult.toolCall,
      memoriesCount: userMemories.length,
      isLocalFallback: true,
    });
  } catch (_error: any) {
    const offlineResult = parseLocalOfflineIntent(req.body?.prompt || '');
    return res.json({
      text: offlineResult.text,
      toolCall: offlineResult.toolCall,
      memoriesCount: userMemories.length,
      isLocalFallback: true,
    });
  }
});

// Smart Home API
app.get('/api/lili/smarthome', (req, res) => {
  res.json({ devices: smartHomeDevices });
});

app.post('/api/lili/smarthome/control', (req, res) => {
  const { deviceName, action, value } = req.body;
  // Update state in memory
  smartHomeDevices = smartHomeDevices.map((d) => {
    if (d.name.toLowerCase().includes(String(deviceName || '').toLowerCase())) {
      if (action === 'on') return { ...d, state: true };
      if (action === 'off') return { ...d, state: false };
      if (action === 'set_temp' && d.type === 'ac') return { ...d, state: true, temperature: Number(value) || d.temperature };
      if (action === 'dim' && d.type === 'light') return { ...d, state: true, brightness: Number(value) || d.brightness };
    }
    return d;
  });

  res.json({ success: true, message: `Adjusted ${deviceName} with action ${action}`, devices: smartHomeDevices });
});

// Memory API
app.get('/api/lili/memories', (req, res) => {
  res.json({ memories: userMemories });
});

// Festivals & Calendar API
app.get('/api/lili/festivals', (req, res) => {
  const year = Number(req.query.year) || 2026;
  const month = Number(req.query.month) || 0;
  const query = String(req.query.q || '').toLowerCase().trim();

  // Basic festival list
  const festivals = [
    { name: "New Year's Day", nameHindi: 'नव वर्ष', date: `${year}-01-01`, dayOfWeek: 'Thursday', category: 'International', significance: 'Celebration of new beginnings' },
    { name: 'Makar Sankranti / Pongal', nameHindi: 'मकर संक्रांति', date: `${year}-01-14`, dayOfWeek: 'Wednesday', category: 'Hindu', significance: 'Harvest festival of the Sun transition' },
    { name: 'Republic Day', nameHindi: 'गणतंत्र दिवस', date: `${year}-01-26`, dayOfWeek: 'Monday', category: 'National', significance: 'Constitution of India came into effect' },
    { name: 'Maha Shivratri', nameHindi: 'महा शिवरात्रि', date: `${year}-02-15`, dayOfWeek: 'Sunday', category: 'Hindu', significance: 'The great night of Lord Shiva' },
    { name: 'Holi', nameHindi: 'होली', date: `${year}-03-04`, dayOfWeek: 'Wednesday', category: 'Hindu', significance: 'Festival of colors and spring' },
    { name: 'Eid-ul-Fitr', nameHindi: 'ईद-उल-फ़ितर', date: `${year}-03-20`, dayOfWeek: 'Friday', category: 'Islamic', significance: 'Conclusion of Ramadan fasting' },
    { name: 'Ram Navami', nameHindi: 'राम नवमी', date: `${year}-03-28`, dayOfWeek: 'Saturday', category: 'Hindu', significance: 'Birth of Lord Rama' },
    { name: 'Mahavir Jayanti', nameHindi: 'महावीर जयंती', date: `${year}-03-31`, dayOfWeek: 'Tuesday', category: 'Jain', significance: 'Birth of Bhagwan Mahavira' },
    { name: 'Good Friday', nameHindi: 'गुड फ्राइडे', date: `${year}-04-03`, dayOfWeek: 'Friday', category: 'Christian', significance: 'Crucifixion of Jesus Christ' },
    { name: 'Easter Sunday', nameHindi: 'ईस्टर संडे', date: `${year}-04-05`, dayOfWeek: 'Sunday', category: 'Christian', significance: 'Resurrection of Jesus Christ' },
    { name: 'Baisakhi', nameHindi: 'बैसाखी', date: `${year}-04-14`, dayOfWeek: 'Tuesday', category: 'Sikh', significance: 'Khalsa Panth formation & harvest' },
    { name: 'Buddha Purnima', nameHindi: 'बुद्ध पूर्णिमा', date: `${year}-05-01`, dayOfWeek: 'Friday', category: 'Hindu', significance: 'Birth and enlightenment of Buddha' },
    { name: 'Eid-ul-Adha (Bakrid)', nameHindi: 'बकरीद', date: `${year}-05-27`, dayOfWeek: 'Wednesday', category: 'Islamic', significance: 'Feast of Sacrifice' },
    { name: 'Independence Day', nameHindi: 'स्वतंत्रता दिवस', date: `${year}-08-15`, dayOfWeek: 'Saturday', category: 'National', significance: 'Freedom of India 1947' },
    { name: 'Raksha Bandhan', nameHindi: 'रक्षा बंधन', date: `${year}-08-28`, dayOfWeek: 'Friday', category: 'Hindu', significance: 'Bond of love between brothers and sisters' },
    { name: 'Krishna Janmashtami', nameHindi: 'श्री कृष्ण जन्माष्टमी', date: `${year}-09-04`, dayOfWeek: 'Friday', category: 'Hindu', significance: 'Birth of Lord Krishna' },
    { name: 'Ganesh Chaturthi', nameHindi: 'गणेश चतुर्थी', date: `${year}-09-14`, dayOfWeek: 'Monday', category: 'Hindu', significance: 'Festival of Lord Ganesha' },
    { name: 'Gandhi Jayanti', nameHindi: 'गांधी जयंती', date: `${year}-10-02`, dayOfWeek: 'Friday', category: 'National', significance: 'Birth of Mahatma Gandhi' },
    { name: 'Navratri / Durga Puja', nameHindi: 'दुर्गा पूजा', date: `${year}-10-11`, dayOfWeek: 'Sunday', category: 'Hindu', significance: 'Nine nights of Divine Mother Durga' },
    { name: 'Dussehra / Vijayadashami', nameHindi: 'दशहरा', date: `${year}-10-20`, dayOfWeek: 'Tuesday', category: 'Hindu', significance: 'Victory of Good over Evil' },
    { name: 'Karwa Chauth', nameHindi: 'करवा चौथ', date: `${year}-10-29`, dayOfWeek: 'Thursday', category: 'Hindu', significance: 'Fasting for husband longevity' },
    { name: 'Dhanteras', nameHindi: 'धनतेरस', date: `${year}-11-06`, dayOfWeek: 'Friday', category: 'Hindu', significance: 'Worship of Dhanvantari & Lakshmi' },
    { name: 'Diwali (Deepavali)', nameHindi: 'दीपावली', date: `${year}-11-08`, dayOfWeek: 'Sunday', category: 'Hindu', significance: 'Festival of Lights' },
    { name: 'Bhai Dooj', nameHindi: 'भाई दूज', date: `${year}-11-10`, dayOfWeek: 'Tuesday', category: 'Hindu', significance: 'Brother-Sister bond' },
    { name: 'Chhath Puja', nameHindi: 'छठ पूजा', date: `${year}-11-15`, dayOfWeek: 'Sunday', category: 'Hindu', significance: 'Worship of Sun God & Chhathi Maiya' },
    { name: 'Guru Nanak Jayanti', nameHindi: 'गुरु नानक जयंती', date: `${year}-11-24`, dayOfWeek: 'Tuesday', category: 'Sikh', significance: 'Birth of Guru Nanak Dev Ji' },
    { name: 'Christmas', nameHindi: 'क्रिसमस', date: `${year}-12-25`, dayOfWeek: 'Friday', category: 'Christian', significance: 'Birth of Jesus Christ' },
  ];

  let results = festivals;
  if (month > 0) {
    const monthStr = String(month).padStart(2, '0');
    results = results.filter((f) => f.date.startsWith(`${year}-${monthStr}`));
  }
  if (query) {
    results = results.filter((f) => f.name.toLowerCase().includes(query) || (f.nameHindi && f.nameHindi.toLowerCase().includes(query)) || f.category.toLowerCase().includes(query));
  }

  res.json({ year, total: results.length, festivals: results });
});

// Device Management & Pairing API
app.get('/api/lili/devices', (req, res) => {
  res.json({ devices: syncedDevices, pairingCode: activePairingCode });
});

app.post('/api/lili/devices/pair', (req, res) => {
  const { code, name, type, model, os } = req.body || {};
  
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const newId = `dev-${Date.now()}`;
  const deviceType = type || 'phone';
  const deviceName = name || `Boss's ${deviceType === 'phone' ? 'Mobile Device' : deviceType === 'laptop' ? 'Work Laptop' : deviceType === 'tablet' ? 'Tablet' : 'Smartwatch'}`;
  
  const newDevice: SyncedDevice = {
    id: newId,
    name: deviceName,
    type: deviceType,
    model: model || (deviceType === 'phone' ? 'Pixel 9 Pro / iPhone 16' : deviceType === 'laptop' ? 'MacBook Pro M3' : deviceType === 'tablet' ? 'iPad Air' : 'Apple Watch Ultra'),
    os: os || (deviceType === 'phone' ? 'Android 15' : deviceType === 'laptop' ? 'macOS Sequoia' : deviceType === 'tablet' ? 'iPadOS 18' : 'watchOS 11'),
    ip: `192.168.1.${Math.floor(20 + Math.random() * 200)}`,
    status: 'connected',
    battery: Math.floor(75 + Math.random() * 25),
    charging: Math.random() > 0.4,
    signalDbm: -1 * Math.floor(45 + Math.random() * 35),
    storage: deviceType === 'laptop' ? '512 GB / 1 TB' : '128 GB / 256 GB',
    cpuLoad: deviceType === 'laptop' ? Math.floor(10 + Math.random() * 20) : undefined,
    ramUsage: deviceType === 'laptop' ? '6.2 GB / 16 GB' : undefined,
    isRinging: false,
    isMuted: false,
    isLocked: false,
    lastSync: 'Just now',
    pairedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
  };

  syncedDevices.unshift(newDevice);

  // Generate new pairing code
  activePairingCode = `LILI-${randNum}-SYNC`;

  res.json({
    success: true,
    message: `Device '${deviceName}' paired and connected via LILI mesh protocol.`,
    pairedDevice: newDevice,
    devices: syncedDevices,
    newPairingCode: activePairingCode,
  });
});

app.post('/api/lili/devices/control', (req, res) => {
  const { deviceId, action, value } = req.body || {};
  let targetDev = syncedDevices.find((d) => d.id === deviceId);

  if (!targetDev && syncedDevices.length > 0) {
    targetDev = syncedDevices[0];
  }

  if (targetDev) {
    if (action === 'ring') targetDev.isRinging = !targetDev.isRinging;
    if (action === 'mute') targetDev.isMuted = !targetDev.isMuted;
    if (action === 'lock') targetDev.isLocked = !targetDev.isLocked;
    if (action === 'toggle_status') {
      targetDev.status = targetDev.status === 'connected' ? 'disconnected' : 'connected';
    }
    if (action === 'reconnect') targetDev.status = 'connected';
    targetDev.lastSync = 'Just now';
  }

  res.json({
    success: true,
    actionExecuted: action,
    device: targetDev,
    devices: syncedDevices,
  });
});

app.delete('/api/lili/devices/:id', (req, res) => {
  const { id } = req.params;
  syncedDevices = syncedDevices.filter((d) => d.id !== id);
  res.json({ success: true, message: 'Device unpaired.', devices: syncedDevices });
});

// ==========================================
// GEMINI MULTIMODAL CAPABILITIES API ENDPOINTS
// ==========================================

// 1. Create & Edit Images (gemini-3.1-flash-image-preview)
app.post('/api/gemini/image/create-edit', async (req, res) => {
  try {
    const { prompt, imageBase64, mimeType = 'image/png' } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const parts: any[] = [];
    if (imageBase64) {
      parts.push({
        inlineData: {
          data: String(imageBase64).replace(/^data:image\/\w+;base64,/, ''),
          mimeType,
        },
      });
    }
    parts.push({ text: String(prompt) });

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: { parts },
    });

    let generatedImageUrl = null;
    let text = '';
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          generatedImageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        } else if (part.text) {
          text += part.text;
        }
      }
    }

    return res.json({ imageUrl: generatedImageUrl, text });
  } catch (err: any) {
    console.error('Image create/edit error:', err);
    return res.status(500).json({ error: err.message || 'Image operation failed' });
  }
});

// 2. High-Quality Pro Image Generation (gemini-3-pro-image-preview with 1K, 2K, 4K)
app.post('/api/gemini/image/pro-generate', async (req, res) => {
  try {
    const { prompt, imageSize = '1K', aspectRatio = '1:1' } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: String(prompt),
      config: {
        imageConfig: {
          imageSize: imageSize as any,
          aspectRatio: aspectRatio as any,
        },
      },
    });

    let generatedImageUrl = null;
    let text = '';
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          generatedImageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        } else if (part.text) {
          text += part.text;
        }
      }
    }

    return res.json({ imageUrl: generatedImageUrl, text, size: imageSize, aspectRatio });
  } catch (err: any) {
    console.error('Pro image generation error:', err);
    return res.status(500).json({ error: err.message || 'Pro image generation failed' });
  }
});

// 3. Animate Images into Video (veo-3.1-fast-generate-preview)
app.post('/api/gemini/video/generate', async (req, res) => {
  try {
    const { prompt, imageBase64, mimeType = 'image/png', aspectRatio = '16:9' } = req.body || {};

    const payload: any = {
      model: 'veo-3.1-fast-generate-preview',
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: (aspectRatio === '9:16' ? '9:16' : '16:9') as any,
      },
    };

    if (prompt) payload.prompt = String(prompt);
    if (imageBase64) {
      payload.image = {
        imageBytes: String(imageBase64).replace(/^data:image\/\w+;base64,/, ''),
        mimeType,
      };
    }

    const operation = await ai.models.generateVideos(payload);
    return res.json({ operationName: operation.name });
  } catch (err: any) {
    console.error('Veo video generate error:', err);
    return res.status(500).json({ error: err.message || 'Video generation failed' });
  }
});

app.post('/api/gemini/video/status', async (req, res) => {
  try {
    const { operationName } = req.body || {};
    if (!operationName) return res.status(400).json({ error: 'operationName required' });

    const op = new GenerateVideosOperation();
    op.name = String(operationName);
    const updated = await ai.operations.getVideosOperation({ operation: op });
    return res.json({ done: Boolean(updated.done) });
  } catch (err: any) {
    console.error('Veo video status error:', err);
    return res.status(500).json({ error: err.message || 'Failed to check video status' });
  }
});

app.post('/api/gemini/video/download', async (req, res) => {
  try {
    const { operationName } = req.body || {};
    if (!operationName) return res.status(400).json({ error: 'operationName required' });

    const op = new GenerateVideosOperation();
    op.name = String(operationName);
    const updated = await ai.operations.getVideosOperation({ operation: op });
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;

    if (!uri) {
      return res.status(404).json({ error: 'Video URI not found or video generation not finished' });
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    const videoRes = await fetch(uri, {
      headers: { 'x-goog-api-key': apiKey },
    });

    if (!videoRes.ok) {
      return res.status(videoRes.status).json({ error: 'Failed to download generated video' });
    }

    res.setHeader('Content-Type', 'video/mp4');
    const arrayBuffer = await videoRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error('Veo video download error:', err);
    return res.status(500).json({ error: err.message || 'Failed to download video' });
  }
});

// 4. Google Search Grounding (gemini-3.5-flash)
app.post('/api/gemini/search-grounding', async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: String(prompt),
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || '';
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks.map((c: any) => c.web).filter(Boolean);

    return res.json({ text, sources });
  } catch (err: any) {
    console.error('Search grounding error:', err);
    return res.status(500).json({ error: err.message || 'Search grounding failed' });
  }
});

// 5. Google Maps Grounding (gemini-3.5-flash)
app.post('/api/gemini/maps-grounding', async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: String(prompt),
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    const text = response.text || '';
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return res.json({ text, sources: chunks });
  } catch (err: any) {
    console.error('Maps grounding error:', err);
    return res.status(500).json({ error: err.message || 'Maps grounding failed' });
  }
});

// 6. Multi-Model Intelligence Engine (gemini-3.1-pro-preview / gemini-3.5-flash / gemini-3.1-flash-lite)
app.post('/api/gemini/intelligence', async (req, res) => {
  try {
    const { prompt, taskType = 'general' } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    let modelName = 'gemini-3.5-flash';
    if (taskType === 'complex') modelName = 'gemini-3.1-pro-preview';
    if (taskType === 'fast') modelName = 'gemini-3.1-flash-lite';

    const response = await ai.models.generateContent({
      model: modelName,
      contents: String(prompt),
      config: { systemInstruction: LILI_SYSTEM_PROMPT },
    });

    return res.json({ text: response.text, modelUsed: modelName, taskType });
  } catch (err: any) {
    console.error('Intelligence error:', err);
    return res.status(500).json({ error: err.message || 'Task processing failed' });
  }
});

// 7. Image Analysis & Understanding (gemini-3.1-pro-preview)
app.post('/api/gemini/analyze-image', async (req, res) => {
  try {
    const { prompt = 'Analyze this image in detail, Boss.', imageBase64, mimeType = 'image/png' } = req.body || {};
    if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' });

    const imagePart = {
      inlineData: {
        data: String(imageBase64).replace(/^data:image\/\w+;base64,/, ''),
        mimeType,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: { parts: [imagePart, { text: String(prompt) }] },
      config: { systemInstruction: LILI_SYSTEM_PROMPT },
    });

    return res.json({ text: response.text, modelUsed: 'gemini-3.1-pro-preview' });
  } catch (err: any) {
    console.error('Analyze image error:', err);
    return res.status(500).json({ error: err.message || 'Image analysis failed' });
  }
});

// 8. Low-Latency Ultra Fast Responses (gemini-3.1-flash-lite)
app.post('/api/gemini/low-latency', async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const start = Date.now();
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: String(prompt),
      config: { systemInstruction: LILI_SYSTEM_PROMPT },
    });

    const latencyMs = Date.now() - start;
    return res.json({ text: response.text, modelUsed: 'gemini-3.1-flash-lite', latencyMs });
  } catch (err: any) {
    console.error('Low latency error:', err);
    return res.status(500).json({ error: err.message || 'Low-latency query failed' });
  }
});

// 9. Enable High Thinking Mode (gemini-3.1-pro-preview with ThinkingLevel.HIGH)
app.post('/api/gemini/high-thinking', async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: String(prompt),
      config: {
        systemInstruction: LILI_SYSTEM_PROMPT,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    return res.json({ text: response.text, modelUsed: 'gemini-3.1-pro-preview', thinkingLevel: 'HIGH' });
  } catch (err: any) {
    console.error('High thinking error:', err);
    return res.status(500).json({ error: err.message || 'High thinking reasoning failed' });
  }
});

// 10. Audio Transcription (gemini-3.5-flash)
app.post('/api/gemini/transcribe-audio', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/wav', prompt = 'Transcribe this audio accurately, word for word.' } = req.body || {};
    if (!audioBase64) return res.status(400).json({ error: 'audioBase64 required' });

    const audioPart = {
      inlineData: {
        data: String(audioBase64).replace(/^data:audio\/\w+;base64,/, ''),
        mimeType,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: { parts: [audioPart, { text: String(prompt) }] },
    });

    return res.json({ transcription: response.text, modelUsed: 'gemini-3.5-flash' });
  } catch (err: any) {
    console.error('Transcribe audio error:', err);
    return res.status(500).json({ error: err.message || 'Audio transcription failed' });
  }
});

// Vite Middleware for Dev / Static Files for Prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`LILI AI OS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
