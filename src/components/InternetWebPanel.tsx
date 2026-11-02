import React, { useState } from 'react';
import {
  Globe,
  Search,
  CloudSun,
  Newspaper,
  TrendingUp,
  BookOpen,
  ExternalLink,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { WeatherData, NewsArticle, StockQuote } from '../types';
import { sfx } from '../lib/audio';

interface InternetWebPanelProps {
  onSearchWeb: (query: string) => void;
}

export const InternetWebPanel: React.FC<InternetWebPanelProps> = ({ onSearchWeb }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Delhi');

  const weatherMap: Record<string, WeatherData> = {
    Delhi: {
      city: 'Delhi, India',
      tempC: 32,
      condition: 'Sunny & Hazy',
      humidity: 58,
      windKm: 12,
      highC: 35,
      lowC: 26,
      icon: '☀️',
    },
    Mumbai: {
      city: 'Mumbai, India',
      tempC: 29,
      condition: 'Humid & Partly Cloudy',
      humidity: 78,
      windKm: 18,
      highC: 31,
      lowC: 25,
      icon: '⛅',
    },
    'New York': {
      city: 'New York, USA',
      tempC: 24,
      condition: 'Clear Blue Sky',
      humidity: 45,
      windKm: 10,
      highC: 26,
      lowC: 18,
      icon: '🌤️',
    },
    London: {
      city: 'London, UK',
      tempC: 19,
      condition: 'Light Showers',
      humidity: 82,
      windKm: 22,
      highC: 21,
      lowC: 14,
      icon: '🌧️',
    },
    Tokyo: {
      city: 'Tokyo, Japan',
      tempC: 27,
      condition: 'Pleasant',
      humidity: 62,
      windKm: 14,
      highC: 29,
      lowC: 21,
      icon: '☀️',
    },
  };

  const newsList: NewsArticle[] = [
    {
      id: '1',
      title: 'Gemini 3.6 Models Revolutionize Autonomous AI Operating Systems',
      source: 'TechCrunch',
      category: 'AI & Robotics',
      timeAgo: '15m ago',
    },
    {
      id: '2',
      title: 'Global Renewable Energy Grid Achieves Record Efficiency Milestone',
      source: 'Reuters',
      category: 'Energy',
      timeAgo: '1h ago',
    },
    {
      id: '3',
      title: 'Quantum Microprocessors Enter Mass Commercial Production',
      source: 'Wired',
      category: 'Hardware',
      timeAgo: '2h ago',
    },
    {
      id: '4',
      title: 'Commercial Space Station Docking Protocol Successfully Verified',
      source: 'BBC Tech',
      category: 'Aerospace',
      timeAgo: '3h ago',
    },
  ];

  const stocks: StockQuote[] = [
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.5, changePercent: +3.42 },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 128.9, changePercent: +2.18 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 178.2, changePercent: +1.05 },
    { symbol: 'AAPL', name: 'Apple Inc.', price: 224.1, changePercent: -0.45 },
    { symbol: 'BTC/USD', name: 'Bitcoin', price: 68450.0, changePercent: +4.85 },
    { symbol: 'ETH/USD', name: 'Ethereum', price: 3520.0, changePercent: +2.90 },
  ];

  const currentWeather = weatherMap[selectedCity] || weatherMap['Delhi'];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    sfx.playClick();
    onSearchWeb(searchQuery.trim());
  };

  return (
    <div className="space-y-4 h-full overflow-y-auto no-scrollbar p-1">
      {/* Search Header Bar */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-[0_0_25px_rgba(34,211,238,0.06)]">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search live web with LILI (e.g., 'Latest SpaceX launch status', 'Tesla Q3 earnings')..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs font-mono text-slate-200 placeholder:text-white/30 outline-none focus:border-cyan-400"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_12px_#22d3ee]"
          >
            <Globe className="w-4 h-4" />
            <span>SEARCH WEB</span>
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weather Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl space-y-3 shadow-[0_0_25px_rgba(34,211,238,0.06)]">
          <div className="flex items-center justify-between font-mono text-xs font-bold text-amber-400 tracking-[0.15em] uppercase">
            <span className="flex items-center gap-2">
              <CloudSun className="w-4 h-4" />
              REAL-TIME WEATHER SENSOR
            </span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] font-mono text-cyan-300 outline-none"
            >
              {Object.keys(weatherMap).map((city) => (
                <option key={city} value={city} className="bg-slate-900 text-slate-100">
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="flex flex-col">
              <span className="text-3xl">{currentWeather.icon}</span>
              <span className="text-2xl font-bold font-mono text-cyan-300 mt-1">
                {currentWeather.tempC}°C
              </span>
              <span className="text-xs font-mono text-slate-300">{currentWeather.condition}</span>
              <span className="text-[10px] font-mono text-white/40">{currentWeather.city}</span>
            </div>

            <div className="text-right font-mono text-xs space-y-1 text-white/60">
              <div>Humidity: <span className="text-slate-200">{currentWeather.humidity}%</span></div>
              <div>Wind: <span className="text-slate-200">{currentWeather.windKm} km/h</span></div>
              <div>High: <span className="text-emerald-400">{currentWeather.highC}°C</span></div>
              <div>Low: <span className="text-cyan-400">{currentWeather.lowC}°C</span></div>
            </div>
          </div>
        </div>

        {/* Live News Feed */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl space-y-3 lg:col-span-2 shadow-[0_0_25px_rgba(34,211,238,0.06)]">
          <div className="flex items-center justify-between font-mono text-xs font-bold text-cyan-400 tracking-[0.15em] uppercase">
            <span className="flex items-center gap-2">
              <Newspaper className="w-4 h-4" />
              GLOBAL NEWS TICKER
            </span>
            <span className="text-[10px] text-white/40">LIVE FEED</span>
          </div>

          <div className="space-y-2 max-h-[160px] overflow-y-auto no-scrollbar">
            {newsList.map((news) => (
              <div
                key={news.id}
                onClick={() => onSearchWeb(`Read full article: ${news.title}`)}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer flex items-center justify-between gap-2 backdrop-blur-md"
              >
                <div className="flex flex-col truncate">
                  <span className="text-xs font-mono font-medium text-slate-200 truncate">
                    {news.title}
                  </span>
                  <span className="text-[10px] font-mono text-white/40">
                    {news.source} • {news.category} • {news.timeAgo}
                  </span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-white/40 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stock & Crypto Live Market Ticker */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl space-y-3 shadow-[0_0_25px_rgba(34,211,238,0.06)]">
        <div className="flex items-center justify-between font-mono text-xs font-bold text-purple-400 tracking-[0.15em] uppercase">
          <span className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            GLOBAL FINANCIAL &amp; CRYPTO MARKETS
          </span>
          <span className="text-[10px] text-emerald-400 animate-pulse">● MARKETS OPEN</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {stocks.map((stk, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col font-mono text-xs backdrop-blur-md"
            >
              <div className="flex justify-between items-center text-white/60">
                <span className="font-bold text-slate-200">{stk.symbol}</span>
                <span
                  className={`text-[10px] font-bold ${
                    stk.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {stk.changePercent >= 0 ? '+' : ''}
                  {stk.changePercent}%
                </span>
              </div>
              <span className="text-cyan-300 font-bold mt-1">
                ${stk.price.toLocaleString()}
              </span>
              <span className="text-[9px] text-white/40 truncate">{stk.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
