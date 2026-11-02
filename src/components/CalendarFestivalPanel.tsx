import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Search,
  Volume2,
  Bell,
  Plus,
  Compass,
  CheckCircle2,
  PartyPopper,
  Flame,
  Globe,
  Sun,
  Moon,
  Trash2,
} from 'lucide-react';
import {
  FESTIVALS_DATABASE,
  getFestivalsForMonth,
  getFestivalOnDate,
  getUpcomingFestivals,
  getTodayFestivals,
  getNextMajorFestival,
  getDaysDifference,
  searchFestivals,
} from '../lib/festivalsData';
import { FestivalInfo, CalendarEvent } from '../types';
import { sfx } from '../lib/audio';

interface CalendarFestivalPanelProps {
  onSpeak: (text: string) => void;
  accentColor?: string;
}

export const CalendarFestivalPanel: React.FC<CalendarFestivalPanelProps> = ({ onSpeak }) => {
  // Live Date & Time States
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [is24Hour, setIs24Hour] = useState<boolean>(false);

  // Calendar Navigation States
  const [selectedYear, setSelectedYear] = useState<number>(currentTime.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentTime.getMonth() + 1); // 1-indexed (1-12)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    `${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, '0')}-${String(currentTime.getDate()).padStart(2, '0')}`
  );

  // Filter & Search States
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'month' | 'upcoming' | 'all'>('month');

  // Custom User Reminders / Events (stored locally)
  const [customEvents, setCustomEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem('lili_custom_calendar_events');
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'ev-1',
              title: 'LILI OS Holographic Calibration',
              date: '2026-08-28',
              time: '10:00 AM',
              duration: '30m',
              type: 'event',
            },
            {
              id: 'ev-2',
              title: 'Family Gathering & Festive Dinner',
              date: '2026-08-28',
              time: '07:30 PM',
              duration: '2h',
              type: 'festival',
            },
          ];
    } catch {
      return [];
    }
  });

  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('12:00 PM');
  const [showAddEventModal, setShowAddEventModal] = useState(false);

  // Live timer tick every 100ms
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Save custom events to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lili_custom_calendar_events', JSON.stringify(customEvents));
    } catch (e) {
      console.error(e);
    }
  }, [customEvents]);

  // Derived Values
  const todayYMD = `${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, '0')}-${String(currentTime.getDate()).padStart(2, '0')}`;
  const todayFestivals = getTodayFestivals(todayYMD);
  const nextMajor = getNextMajorFestival(todayYMD);
  const upcomingList = getUpcomingFestivals(10, todayYMD);

  // Month Festivals
  const monthFestivals = getFestivalsForMonth(selectedYear, selectedMonth);

  // Days in month calculation
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const firstDayOfWeek = new Date(selectedYear, selectedMonth - 1, 1).getDay(); // 0 = Sunday, 1 = Monday...

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const categories = [
    'All',
    'National',
    'Hindu',
    'Islamic',
    'Christian',
    'Sikh',
    'Jain',
    'International',
    'Seasonal',
  ];

  // Filtered List
  const displayedFestivals = (() => {
    let list: FestivalInfo[] = [];
    if (searchQuery.trim()) {
      list = searchFestivals(searchQuery);
    } else if (viewMode === 'month') {
      list = monthFestivals;
    } else if (viewMode === 'upcoming') {
      list = upcomingList.map((u) => u.festival);
    } else {
      list = FESTIVALS_DATABASE.filter((f) => f.date.startsWith(`${selectedYear}-`));
    }

    if (activeCategory !== 'All') {
      list = list.filter((f) => f.category === activeCategory);
    }
    return list;
  })();

  // Selected date details
  const selectedDateFestivals = getFestivalOnDate(selectedDateStr);
  const selectedDateEvents = customEvents.filter((e) => e.date === selectedDateStr);

  const handlePrevMonth = () => {
    sfx.playClick();
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    sfx.playClick();
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    sfx.playClick();
    setSelectedYear(currentTime.getFullYear());
    setSelectedMonth(currentTime.getMonth() + 1);
    setSelectedDateStr(todayYMD);
  };

  const handleSpeakFestival = (f: FestivalInfo) => {
    sfx.playClick();
    const textToSpeak = `${f.name}, also known as ${f.nameHindi || f.name}, will be celebrated on ${f.dayOfWeek}, ${f.date}. ${f.significance} Key traditions include ${f.traditions}.`;
    onSpeak(textToSpeak);
  };

  const handleAddCustomEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const newEv: CalendarEvent = {
      id: `ev-${Date.now()}`,
      title: newEventTitle.trim(),
      date: selectedDateStr,
      time: newEventTime || '12:00 PM',
      duration: '1h',
      type: 'event',
    };

    setCustomEvents((prev) => [newEv, ...prev]);
    setNewEventTitle('');
    setShowAddEventModal(false);
    sfx.playSuccess();
  };

  const handleDeleteEvent = (id: string) => {
    sfx.playClick();
    setCustomEvents((prev) => prev.filter((e) => e.id !== id));
  };

  // Format time display
  const timeHours = is24Hour ? currentTime.getHours() : currentTime.getHours() % 12 || 12;
  const timeMinutes = String(currentTime.getMinutes()).padStart(2, '0');
  const timeSeconds = String(currentTime.getSeconds()).padStart(2, '0');
  const timeAmPm = currentTime.getHours() >= 12 ? 'PM' : 'AM';
  const timeMillis = String(Math.floor(currentTime.getMilliseconds() / 10)).padStart(2, '0');

  return (
    <div id="calendar-festival-panel" className="h-full flex flex-col p-4 space-y-4 text-slate-100 overflow-y-auto">
      {/* Top Live Matrix HUD Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live Clock & Timezone Widget */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 rounded-xl p-4 flex flex-col justify-between shadow-[0_0_20px_rgba(6,182,212,0.15)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-cyan-400 animate-pulse" />
              <span className="text-xs font-mono tracking-widest text-cyan-400 font-semibold uppercase">
                Live Precision Telemetry
              </span>
            </div>
            <button
              onClick={() => {
                sfx.playClick();
                setIs24Hour(!is24Hour);
              }}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50 transition-colors"
            >
              {is24Hour ? '24H' : '12H'} Mode
            </button>
          </div>

          <div className="flex items-baseline space-x-2 my-1">
            <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-white">
              {String(timeHours).padStart(2, '0')}:{timeMinutes}:{timeSeconds}
            </span>
            <span className="text-lg font-mono font-bold text-cyan-400">.{timeMillis}</span>
            {!is24Hour && <span className="text-sm font-mono font-bold text-cyan-500 ml-1">{timeAmPm}</span>}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-cyan-500/20 text-xs text-slate-300 font-mono">
            <div className="flex items-center space-x-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <span className="text-cyan-400 font-bold">
              {Intl.DateTimeFormat().resolvedOptions().timeZone || 'IST'}
            </span>
          </div>
        </div>

        {/* Today's Festival Status */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-amber-500/30 rounded-xl p-4 flex flex-col justify-between shadow-[0_0_20px_rgba(245,158,11,0.15)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <PartyPopper className="w-5 h-5 text-amber-400 animate-bounce" />
              <span className="text-xs font-mono tracking-widest text-amber-400 font-semibold uppercase">
                Today's Festival & Observance
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/30">
              {todayFestivals.length > 0 ? 'FESTIVE DAY' : 'REGULAR DAY'}
            </span>
          </div>

          <div className="my-1">
            {todayFestivals.length > 0 ? (
              todayFestivals.map((fest) => (
                <div key={fest.id} className="space-y-1">
                  <div className="text-lg sm:text-xl font-bold text-amber-300 flex items-center space-x-2">
                    <span>{fest.name}</span>
                    <span className="text-xs text-amber-200/80 font-normal">({fest.nameHindi})</span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">{fest.significance}</p>
                </div>
              ))
            ) : (
              <div className="space-y-1">
                <div className="text-base font-semibold text-slate-200">No official holiday today</div>
                <p className="text-xs text-slate-400">
                  Enjoy your productive day! Check upcoming festivities and celebrations below.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-amber-500/20 text-xs font-mono text-slate-400">
            <span>Day: {currentTime.toLocaleDateString('en-US', { weekday: 'long' })}</span>
            {todayFestivals[0] && (
              <button
                onClick={() => handleSpeakFestival(todayFestivals[0])}
                className="text-amber-400 hover:text-amber-300 flex items-center space-x-1 underline"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Hear Wishes</span>
              </button>
            )}
          </div>
        </div>

        {/* Next Major Festival Countdown */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 rounded-xl p-4 flex flex-col justify-between shadow-[0_0_20px_rgba(16,185,129,0.15)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-mono tracking-widest text-emerald-400 font-semibold uppercase">
                Upcoming Highlight
              </span>
            </div>
            {nextMajor && (
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                {nextMajor.daysRemaining === 0
                  ? 'TODAY'
                  : nextMajor.daysRemaining === 1
                  ? 'TOMORROW'
                  : `IN ${nextMajor.daysRemaining} DAYS`}
              </span>
            )}
          </div>

          {nextMajor ? (
            <div className="my-1">
              <div className="text-lg sm:text-xl font-bold text-emerald-300 flex items-center space-x-2">
                <span>{nextMajor.festival.name}</span>
              </div>
              <div className="text-xs text-emerald-200/90 font-mono flex items-center space-x-2 mt-0.5">
                <span className="font-semibold">{nextMajor.festival.dayOfWeek}</span>
                <span>•</span>
                <span>{nextMajor.festival.date}</span>
                <span>•</span>
                <span className="text-slate-300 font-sans">{nextMajor.festival.category}</span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-1 mt-1">{nextMajor.festival.traditions}</p>
            </div>
          ) : (
            <div className="text-sm text-slate-400">Loading festival schedules...</div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-emerald-500/20 text-xs font-mono text-slate-400">
            <span>Countdown Active</span>
            {nextMajor && (
              <button
                onClick={() => handleSpeakFestival(nextMajor.festival)}
                className="text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 underline"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Tell Details</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Interactive Grid & Explorer Section */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1">
        {/* Left Column: Interactive Month Calendar & Quick Date Finder (7 Columns) */}
        <div className="xl:col-span-7 space-y-4">
          <div className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 rounded-xl p-4 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
            {/* Month & Year Navigation Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg bg-slate-800/80 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/40 transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="text-lg font-bold font-mono text-cyan-300">
                  {monthNames[selectedMonth - 1]} {selectedYear}
                </div>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg bg-slate-800/80 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/40 transition-colors"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Year Selectors & Jump to Today */}
              <div className="flex items-center space-x-2">
                {[2025, 2026, 2027].map((yr) => (
                  <button
                    key={yr}
                    onClick={() => {
                      sfx.playClick();
                      setSelectedYear(yr);
                    }}
                    className={`px-2.5 py-1 text-xs font-mono rounded-md border transition-all ${
                      selectedYear === yr
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
                <button
                  onClick={handleJumpToToday}
                  className="px-2.5 py-1 text-xs font-mono rounded-md bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/30 transition-all"
                >
                  Today
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs font-semibold text-slate-400 mb-2">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, i) => (
                <div key={d} className={`py-1 ${i === 0 || i === 6 ? 'text-amber-400/90' : 'text-slate-400'}`}>
                  {d}
                </div>
              ))}
            </div>

            {/* Month Day Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty padding blocks before first day */}
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-16 rounded-lg bg-slate-950/30 border border-transparent" />
              ))}

              {/* Days of Month */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const formattedDateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const fList = getFestivalOnDate(formattedDateStr);
                const hasCustomEvents = customEvents.some((e) => e.date === formattedDateStr);
                const isSelected = selectedDateStr === formattedDateStr;
                const isToday = todayYMD === formattedDateStr;

                return (
                  <button
                    key={formattedDateStr}
                    onClick={() => {
                      sfx.playClick();
                      setSelectedDateStr(formattedDateStr);
                    }}
                    className={`h-16 p-1 rounded-lg border text-left flex flex-col justify-between transition-all relative overflow-hidden group ${
                      isSelected
                        ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)] ring-1 ring-cyan-400'
                        : isToday
                        ? 'bg-amber-950/40 border-amber-400/60'
                        : fList.length > 0
                        ? 'bg-slate-800/80 border-slate-700 hover:border-cyan-500/50'
                        : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-mono font-bold ${
                          isToday
                            ? 'w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center'
                            : isSelected
                            ? 'text-cyan-300'
                            : 'text-slate-300'
                        }`}
                      >
                        {dayNum}
                      </span>
                      {fList.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                      )}
                    </div>

                    {/* Festival tag if present */}
                    {fList.length > 0 ? (
                      <div className="w-full">
                        <span
                          className="block text-[9px] font-semibold truncate px-1 py-0.5 rounded text-amber-200 bg-amber-950/80 border border-amber-500/30"
                          title={fList[0].name}
                        >
                          {fList[0].name.split('/')[0]}
                        </span>
                      </div>
                    ) : hasCustomEvents ? (
                      <div className="w-full">
                        <span className="block text-[9px] font-semibold truncate px-1 py-0.5 rounded text-cyan-200 bg-cyan-950/80 border border-cyan-500/30">
                          Event
                        </span>
                      </div>
                    ) : (
                      <div className="h-3" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400">
              <div className="flex items-center space-x-3">
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span>Festival / Holiday</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span>Selected Date</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span>Today</span>
                </span>
              </div>
              <button
                onClick={() => setShowAddEventModal(true)}
                className="flex items-center space-x-1 px-2 py-1 rounded bg-cyan-500/20 border border-cyan-400 text-cyan-300 hover:bg-cyan-500/30 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add Event on {selectedDateStr}</span>
              </button>
            </div>
          </div>

          {/* Selected Date Inspector Card */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 rounded-xl p-4 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-sm font-bold text-cyan-300">
                  Inspector: {(() => {
                    const [y, m, d] = selectedDateStr.split('-').map(Number);
                    return !isNaN(y) && !isNaN(m) && !isNaN(d)
                      ? new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                      : selectedDateStr;
                  })()}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {getDaysDifference(selectedDateStr, todayYMD) === 0
                  ? 'Today'
                  : getDaysDifference(selectedDateStr, todayYMD) > 0
                  ? `In ${getDaysDifference(selectedDateStr, todayYMD)} days`
                  : `${Math.abs(getDaysDifference(selectedDateStr, todayYMD))} days ago`}
              </span>
            </div>

            {selectedDateFestivals.length > 0 || selectedDateEvents.length > 0 ? (
              <div className="space-y-3">
                {selectedDateFestivals.map((fest) => (
                  <div
                    key={fest.id}
                    className="bg-slate-950/70 border border-amber-500/40 rounded-lg p-3 space-y-2 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-base font-bold text-amber-300">{fest.name}</span>
                          {fest.nameHindi && (
                            <span className="text-xs font-semibold text-amber-200/90">({fest.nameHindi})</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono mt-0.5">
                          <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                            {fest.category}
                          </span>
                          <span>{fest.dayOfWeek}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSpeakFestival(fest)}
                        className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-300 hover:bg-amber-500/30 transition-colors"
                        title="Voice Explanation"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1">
                      <p>
                        <strong className="text-amber-400/90 font-mono">Significance: </strong>
                        {fest.significance}
                      </p>
                      <p>
                        <strong className="text-amber-400/90 font-mono">Rituals & Traditions: </strong>
                        {fest.traditions}
                      </p>
                    </div>
                  </div>
                ))}

                {selectedDateEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="bg-slate-950/70 border border-cyan-500/40 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-400/30">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-cyan-200">{ev.title}</div>
                        <div className="text-xs text-slate-400 font-mono">
                          {ev.time} ({ev.duration})
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="text-rose-400 hover:text-rose-300 p-1.5 rounded hover:bg-rose-950/50 transition-colors"
                      title="Delete Reminder"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs font-mono">
                No major festival recorded on this exact date. Click "Add Event" to schedule your own reminder.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Festival Day List & Directory Explorer (5 Columns) */}
        <div className="xl:col-span-5 space-y-4 flex flex-col">
          <div className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 rounded-xl p-4 shadow-[0_0_20px_rgba(6,182,212,0.1)] flex-1 flex flex-col">
            {/* Explorer Controls */}
            <div className="space-y-3 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span className="font-mono text-sm font-bold text-cyan-300">Festival Directory</span>
                </div>
                <div className="flex items-center space-x-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => {
                      sfx.playClick();
                      setViewMode('month');
                    }}
                    className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
                      viewMode === 'month' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                    }`}
                  >
                    Month ({monthFestivals.length})
                  </button>
                  <button
                    onClick={() => {
                      sfx.playClick();
                      setViewMode('upcoming');
                    }}
                    className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
                      viewMode === 'upcoming' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                    }`}
                  >
                    Upcoming
                  </button>
                  <button
                    onClick={() => {
                      sfx.playClick();
                      setViewMode('all');
                    }}
                    className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
                      viewMode === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {selectedYear} All
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search festival, Diwali, Eid, Christmas, Holi..."
                  className="w-full bg-slate-950/80 border border-cyan-500/30 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-thin">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      sfx.playClick();
                      setActiveCategory(cat);
                    }}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono whitespace-nowrap transition-all border ${
                      activeCategory === cat
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Festival List */}
            <div className="space-y-2.5 overflow-y-auto flex-1 max-h-[520px] pr-1">
              {displayedFestivals.length > 0 ? (
                displayedFestivals.map((fest) => {
                  const daysLeft = getDaysDifference(fest.date, todayYMD);
                  const isToday = daysLeft === 0;

                  return (
                    <motion.div
                      key={fest.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-lg border transition-all ${
                        isToday
                          ? 'bg-amber-950/60 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                          : 'bg-slate-950/60 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-100">{fest.name}</span>
                            {fest.nameHindi && (
                              <span className="text-xs text-amber-300 font-medium">({fest.nameHindi})</span>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400 mt-1">
                            <span className="text-cyan-400 font-semibold">{fest.dayOfWeek}</span>
                            <span>•</span>
                            <span className="text-slate-300 font-bold">{fest.date}</span>
                            <span>•</span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-700 text-[10px]">
                              {fest.category}
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 mt-1.5 line-clamp-2">{fest.significance}</p>
                        </div>

                        <div className="flex flex-col items-end space-y-2">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                              isToday
                                ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                                : daysLeft > 0 && daysLeft <= 7
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                                : daysLeft > 0
                                ? 'bg-slate-900 text-slate-400 border-slate-700'
                                : 'bg-slate-950 text-slate-500 border-slate-800'
                            }`}
                          >
                            {isToday ? 'TODAY' : daysLeft > 0 ? `${daysLeft}d left` : 'Passed'}
                          </span>

                          <button
                            onClick={() => handleSpeakFestival(fest)}
                            className="p-1 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/40 transition-colors"
                            title="Speak with LILI"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs font-mono">
                  No festivals found matching your filter criteria.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add Custom Event */}
      <AnimatePresence>
        {showAddEventModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-cyan-500/50 rounded-xl p-5 w-full max-w-md shadow-[0_0_30px_rgba(6,182,212,0.3)] space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span className="font-mono text-sm font-bold text-cyan-300">Schedule Custom Event</span>
                </div>
                <button
                  onClick={() => setShowAddEventModal(false)}
                  className="text-slate-400 hover:text-slate-200 text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddCustomEvent} className="space-y-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Event Title / Celebration</label>
                  <input
                    type="text"
                    required
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="e.g. Birthday, Anniversary, Puja, Trip..."
                    className="w-full bg-slate-950 border border-cyan-500/30 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Date</label>
                    <input
                      type="date"
                      value={selectedDateStr}
                      onChange={(e) => setSelectedDateStr(e.target.value)}
                      className="w-full bg-slate-950 border border-cyan-500/30 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Time</label>
                    <input
                      type="text"
                      value={newEventTime}
                      onChange={(e) => setNewEventTime(e.target.value)}
                      placeholder="e.g. 06:00 PM"
                      className="w-full bg-slate-950 border border-cyan-500/30 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddEventModal(false)}
                    className="px-3 py-1.5 text-xs font-mono text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-300 hover:bg-cyan-500/30 font-mono text-xs font-bold transition-all"
                  >
                    Save Event
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
