import React, { useState } from 'react';
import {
  Calendar,
  CheckSquare,
  FileText,
  Clock,
  Plus,
  Trash2,
  CheckCircle,
  FileCode,
  Mail,
  UserCheck,
} from 'lucide-react';
import { TaskItem, CalendarEvent } from '../types';
import { sfx } from '../lib/audio';

interface ProductivityPanelProps {
  onAskLili: (prompt: string) => void;
}

export const ProductivityPanel: React.FC<ProductivityPanelProps> = ({ onAskLili }) => {
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: '1', title: 'Review LILI v4.5 System Security Logs', completed: false, priority: 'high' },
    { id: '2', title: 'Optimize Three.js Particle FPS for GPU', completed: true, priority: 'medium' },
    { id: '3', title: 'Test Home Assistant IoT Scene Protocols', completed: false, priority: 'medium' },
    { id: '4', title: 'Sync Google Calendar and Reminders', completed: false, priority: 'low' },
  ]);

  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: 'e1', title: 'AI Engineering Sprint Review', time: '10:00 AM', duration: '45 mins', location: 'Meet / Room 1' },
    { id: 'e2', title: 'Smart Home Firmware Sync', time: '02:30 PM', duration: '30 mins', location: 'Lab' },
    { id: 'e3', title: 'Deep Work: Neural Architecture', time: '04:00 PM', duration: '2 hours', location: 'Workspace' },
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [noteText, setNoteText] = useState(
    '# LILI Operating System Notes\n- Wake word "Lili" triggers voice pipeline\n- Bilingual model automatically detects English or Hindi response\n- Double check AES-256 vault encryption key on server boot'
  );

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    sfx.playSuccess();
    setTasks([
      {
        id: Date.now().toString(),
        title: newTaskTitle.trim(),
        completed: false,
        priority: 'medium',
      },
      ...tasks,
    ]);
    setNewTaskTitle('');
  };

  const toggleTask = (id: string) => {
    sfx.playClick();
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id: string) => {
    sfx.playClick();
    setTasks(tasks.filter((t) => t.id !== id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full overflow-y-auto no-scrollbar p-1">
      {/* Column 1: Tasks & Reminders */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl space-y-3 shadow-[0_0_25px_rgba(34,211,238,0.06)]">
        <div className="flex items-center justify-between font-mono text-xs font-bold text-cyan-400 tracking-[0.15em] uppercase">
          <span className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            TODAY'S TASKS &amp; REMINDERS
          </span>
          <span className="text-[10px] text-white/40">
            {tasks.filter((t) => t.completed).length}/{tasks.length} DONE
          </span>
        </div>

        <form onSubmit={handleAddTask} className="flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add new task..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200 placeholder:text-white/30 outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            ADD
          </button>
        </form>

        <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`p-2.5 rounded-xl border font-mono text-xs flex items-center justify-between gap-2 transition-all backdrop-blur-md ${
                task.completed
                  ? 'bg-white/5 border-white/5 text-white/40 line-through'
                  : 'bg-white/5 border-white/10 text-slate-200'
              }`}
            >
              <div
                onClick={() => toggleTask(task.id)}
                className="flex items-center gap-2.5 cursor-pointer flex-1 truncate"
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center ${
                    task.completed
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                      : 'border-white/20'
                  }`}
                >
                  {task.completed && <CheckCircle className="w-3 h-3" />}
                </div>
                <span className="truncate">{task.title}</span>
              </div>

              <button
                onClick={() => deleteTask(task.id)}
                className="text-white/40 hover:text-rose-400 p-1 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Column 2: Calendar & Schedule */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl space-y-3 shadow-[0_0_25px_rgba(34,211,238,0.06)]">
        <div className="flex items-center justify-between font-mono text-xs font-bold text-amber-400 tracking-[0.15em] uppercase">
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            INTELLIGENT CALENDAR
          </span>
          <button
            onClick={() => {
              sfx.playClick();
              onAskLili('Lili, schedule a 30 min team meeting tomorrow at 11 AM.');
            }}
            className="text-[10px] text-cyan-400 hover:underline"
          >
            + SCHEDULE WITH LILI
          </button>
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="p-3 rounded-xl bg-white/5 border border-white/10 font-mono text-xs flex flex-col gap-1 backdrop-blur-md"
            >
              <div className="flex items-center justify-between font-bold text-slate-200">
                <span>{evt.title}</span>
                <span className="text-cyan-400 text-[10px]">{evt.time}</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-white/40">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-white/50" />
                  {evt.duration}
                </span>
                {evt.location && <span>📍 {evt.location}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Column 3: Quick Scratchpad Notes & AI Summarizer */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl space-y-3 shadow-[0_0_25px_rgba(34,211,238,0.06)]">
        <div className="flex items-center justify-between font-mono text-xs font-bold text-purple-400 tracking-[0.15em] uppercase">
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            SMART SCRATCHPAD &amp; NOTES
          </span>
          <button
            onClick={() => {
              sfx.playClick();
              onAskLili(`Summarize these notes for me: ${noteText}`);
            }}
            className="text-[10px] text-purple-300 bg-purple-500/20 border border-purple-500/40 px-2 py-0.5 rounded hover:bg-purple-500/30 transition-all"
          >
            AI SUMMARIZE
          </button>
        </div>

        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={10}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-mono text-slate-200 outline-none focus:border-cyan-400 resize-none leading-relaxed placeholder:text-white/30"
        />
      </div>
    </div>
  );
};
