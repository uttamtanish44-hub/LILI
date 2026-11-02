import React, { useState, useEffect } from 'react';
import {
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  Sun,
  Wind,
  Droplets,
  Thermometer,
  Compass,
  Search,
  RefreshCw,
  Volume2,
  MapPin,
  Calendar,
  Eye,
  Sunrise,
  Sunset,
  Sparkles,
  TrendingUp,
  Snowflake,
  Check,
} from 'lucide-react';
import { sfx } from '../lib/audio';

interface WeatherData {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  tempC: number;
  tempF: number;
  feelsLikeC: number;
  condition: string;
  conditionHindi: string;
  weatherCode: number;
  humidity: number;
  windSpeedKm: number;
  windDirectionDeg: number;
  uvIndex: number;
  pressureHpa: number;
  rainChance: number;
  highTempC: number;
  lowTempC: number;
  dailyForecast: Array<{
    date: string;
    dayName: string;
    maxTempC: number;
    minTempC: number;
    weatherCode: number;
    condition: string;
    rainChance: number;
  }>;
  updatedAt: string;
}

interface WeatherPanelProps {
  onSpeakWeather: (text: string) => void;
}

export const WeatherPanel: React.FC<WeatherPanelProps> = ({ onSpeakWeather }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCity, setCurrentCity] = useState('New Delhi');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<'C' | 'F'>('C');

  // Preset popular global cities
  const popularCities = ['New Delhi', 'Tokyo', 'London', 'New York', 'Dubai', 'Sydney', 'Paris', 'Mumbai'];

  const fetchWeather = async (cityName: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/weather?location=${encodeURIComponent(cityName)}`);
      if (!res.ok) {
        throw new Error('Failed to fetch weather telemetry');
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setWeather(data);
      setCurrentCity(data.city);
    } catch (err: any) {
      console.error('Weather fetch error:', err);
      setError(err.message || 'Unable to fetch weather telemetry for this location');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(currentCity);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      sfx.playClick();
      fetchWeather(searchQuery.trim());
    }
  };

  const handlePresetClick = (city: string) => {
    sfx.playClick();
    setSearchQuery('');
    fetchWeather(city);
  };

  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="w-12 h-12 text-amber-400 animate-spin-slow" />;
    if (code >= 1 && code <= 3) return <CloudSun className="w-12 h-12 text-cyan-300 animate-pulse" />;
    if (code >= 51 && code <= 67) return <CloudRain className="w-12 h-12 text-blue-400" />;
    if (code >= 71 && code <= 77) return <Snowflake className="w-12 h-12 text-indigo-300 animate-bounce" />;
    if (code >= 95) return <CloudLightning className="w-12 h-12 text-purple-400 animate-pulse" />;
    return <Cloud className="w-12 h-12 text-slate-300" />;
  };

  const speakCurrentReport = () => {
    if (!weather) return;
    sfx.playSuccess();
    const temp = unit === 'C' ? `${weather.tempC}°C` : `${weather.tempF}°F`;
    const report = `Real-time weather telemetry for ${weather.city}, ${weather.country}: Currently ${temp}, ${weather.condition}. Humidity is at ${weather.humidity} percent with winds blowing at ${weather.windSpeedKm} kilometers per hour, Boss.`;
    onSpeakWeather(report);
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950/80 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl p-4 gap-4 shadow-[0_0_40px_rgba(34,211,238,0.05)]">
      {/* Top Header & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <CloudSun className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-mono font-bold tracking-widest text-cyan-300 uppercase">
                GLOBAL LIVE WEATHER & CLIMATE TELEMETRY
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold">
                ● OPEN-METEO SATELLITE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Real-time temperature, satellite forecast & environmental metrics worldwide
            </p>
          </div>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" />
            <input
              type="text"
              placeholder="Enter city or country (e.g. Tokyo, Paris, Delhi, New York)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold transition-all shadow-[0_0_12px_#22d3ee] flex items-center gap-1.5"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            Fetch
          </button>
        </form>
      </div>

      {/* Popular Preset City Badges */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
          <MapPin className="w-3 h-3 text-cyan-400" /> Quick Cities:
        </span>
        {popularCities.map((city) => (
          <button
            key={city}
            onClick={() => handlePresetClick(city)}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1 whitespace-nowrap ${
              currentCity.toLowerCase().includes(city.toLowerCase())
                ? 'bg-cyan-500 text-slate-950 border border-cyan-300 shadow-[0_0_10px_#22d3ee]'
                : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-300'
            }`}
          >
            {city}
          </button>
        ))}
      </div>

      {/* Main Weather Content */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-3">
          <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin" />
          <span className="text-xs font-mono text-cyan-300 animate-pulse">
            PINGING OPEN-METEO CLIMATE SATELLITE...
          </span>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-rose-500/10 border border-rose-500/30 rounded-2xl gap-3">
          <Cloud className="w-10 h-10 text-rose-400" />
          <span className="text-sm font-mono text-rose-300 font-bold">{error}</span>
          <button
            onClick={() => fetchWeather('New Delhi')}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs border border-white/20"
          >
            Reset to New Delhi
          </button>
        </div>
      ) : weather ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-y-auto pr-1">
          {/* LEFT 2 COLUMNS: Main Live Weather Card */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Primary Live Temperature Box */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.1)] relative overflow-hidden flex flex-col justify-between gap-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-cyan-400 animate-bounce" />
                    <h3 className="text-2xl font-mono font-bold text-white tracking-wide">
                      {weather.city}, {weather.country}
                    </h3>
                  </div>
                  <p className="text-xs font-mono text-cyan-400 mt-1">
                    Lat: {weather.latitude.toFixed(2)}° | Lon: {weather.longitude.toFixed(2)}°
                  </p>
                </div>

                {/* Unit Switch & Speak Report */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={speakCurrentReport}
                    className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_#22d3ee]"
                    title="Ask LILI to speak weather report"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Listen Report</span>
                  </button>

                  <div className="flex items-center bg-slate-900 border border-white/10 p-1 rounded-xl">
                    <button
                      onClick={() => {
                        sfx.playClick();
                        setUnit('C');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                        unit === 'C' ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_#22d3ee]' : 'text-slate-400'
                      }`}
                    >
                      °C
                    </button>
                    <button
                      onClick={() => {
                        sfx.playClick();
                        setUnit('F');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                        unit === 'F' ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_#22d3ee]' : 'text-slate-400'
                      }`}
                    >
                      °F
                    </button>
                  </div>
                </div>
              </div>

              {/* Huge Temperature Display */}
              <div className="flex flex-wrap items-center justify-between gap-6 my-2">
                <div className="flex items-center gap-6">
                  {getWeatherIcon(weather.weatherCode)}
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-mono font-extrabold text-white tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                        {unit === 'C' ? weather.tempC : weather.tempF}
                      </span>
                      <span className="text-2xl font-mono font-bold text-cyan-400">°{unit}</span>
                    </div>
                    <p className="text-sm font-mono text-cyan-300 font-semibold capitalize mt-1">
                      {weather.condition} ({weather.conditionHindi})
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end text-xs font-mono gap-1.5 text-slate-300 bg-white/5 p-3 rounded-xl border border-white/10">
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    <Thermometer className="w-4 h-4 text-amber-400" /> Feels Like:{' '}
                    <strong className="text-white">
                      {unit === 'C' ? `${weather.feelsLikeC}°C` : `${Math.round((weather.feelsLikeC * 9) / 5 + 32)}°F`}
                    </strong>
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <TrendingUp className="w-4 h-4 text-emerald-400" /> High / Low:{' '}
                    <strong className="text-emerald-400">{weather.highTempC}°C</strong> /{' '}
                    <strong className="text-indigo-400">{weather.lowTempC}°C</strong>
                  </span>
                </div>
              </div>

              {/* Environmental Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" /> HUMIDITY
                  </span>
                  <span className="text-sm font-mono font-bold text-cyan-300">{weather.humidity}%</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-cyan-400" /> WIND SPEED
                  </span>
                  <span className="text-sm font-mono font-bold text-cyan-300">{weather.windSpeedKm} km/h</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <CloudRain className="w-3.5 h-3.5 text-blue-400" /> RAIN CHANCE
                  </span>
                  <span className="text-sm font-mono font-bold text-blue-300">{weather.rainChance}%</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-amber-400" /> PRESSURE
                  </span>
                  <span className="text-sm font-mono font-bold text-amber-300">{weather.pressureHpa} hPa</span>
                </div>
              </div>
            </div>

            {/* Quick Voice Prompt Suggestions */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
              <span className="text-[11px] font-mono font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> VOICE COMMAND SUGGESTIONS
              </span>
              <div className="flex flex-wrap gap-2 text-xs font-mono">
                {[
                  `What is the weather in ${weather.city}?`,
                  `${weather.city} ka mausam kaisa hai?`,
                  'Is it going to rain today?',
                  'Tokyo weather forecast',
                  'London ka mausam batao',
                ].map((promptText) => (
                  <button
                    key={promptText}
                    onClick={() => {
                      sfx.playClick();
                      onSpeakWeather(promptText);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-white/10 transition-all"
                  >
                    "{promptText}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: 7-Day Forecast */}
          <div className="p-4 rounded-2xl bg-white/5 border border-cyan-500/30 flex flex-col gap-3 shadow-[0_0_20px_rgba(34,211,238,0.05)]">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" /> 7-DAY CLIMATE FORECAST
              </h3>
              <span className="text-[10px] font-mono text-slate-400">DAILY HIGH / LOW</span>
            </div>

            <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1">
              {weather.dailyForecast.map((day, idx) => (
                <div
                  key={day.date}
                  className={`p-2.5 rounded-xl border flex items-center justify-between font-mono text-xs transition-all ${
                    idx === 0
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200'
                      : 'bg-slate-900/60 border-white/5 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-14 font-bold text-white">
                      {idx === 0 ? 'Today' : day.dayName}
                    </span>
                    <span className="text-[11px] text-slate-400 truncate max-w-[100px]">
                      {day.condition}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {day.rainChance > 20 && (
                      <span className="text-[10px] text-blue-400 font-semibold flex items-center gap-0.5">
                        <Droplets className="w-3 h-3" /> {day.rainChance}%
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <span className="text-emerald-400">{day.maxTempC}°</span>
                      <span className="text-slate-500">/</span>
                      <span className="text-indigo-300">{day.minTempC}°</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Updated: {weather.updatedAt}</span>
              <span className="text-emerald-400">● Live Open-Meteo Satellite</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
