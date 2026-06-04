/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  List, 
  Clock, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  CalendarPlus,
  RefreshCw,
  Bell,
  BellRing,
  X,
  Plus
} from 'lucide-react';
import { useCodeBaseStore } from '../store';
import { Contest } from '../types';
import { format, parseISO, addSeconds, differenceInSeconds } from 'date-fns';
import { SkeletonContestListItem, SkeletonContestCardItem } from './Skeleton';

export default function CalendarSection() {
  const { contests, loading, refreshContests, reminders, addReminder, removeReminder } = useCodeBaseStore();
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
  const [activeFilters, setActiveFilters] = useState<string[]>(['CF', 'LC', 'CC', 'AC', 'HR', 'GFG']);
  const [currentTime, setCurrentTime] = useState<Date>(new Date('2026-06-04T05:02:44Z'));
  
  // Reminder setup modal state
  const [reminderModalContest, setReminderModalContest] = useState<Contest | null>(null);
  const [selectedOffset, setSelectedOffset] = useState<number>(60);

  useEffect(() => {
    refreshContests();
  }, []);

  // Set up live countdown ticking
  useEffect(() => {
    const timer = setInterval(() => {
      // Simulate real time progression ticking matching current session
      setCurrentTime((prev) => addSeconds(prev, 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter and parse contests
  const filteredContests = useMemo(() => {
    return contests.filter((c) => activeFilters.includes(c.platform));
  }, [contests, activeFilters]);

  // Find next closest upcoming contest
  const nextContest = useMemo(() => {
    const upcoming = contests.filter((c) => new Date(c.startTime).getTime() > currentTime.getTime());
    if (upcoming.length === 0) return null;
    return upcoming[0]; // Already sorted in store
  }, [contests, currentTime]);

  // Active Countdown display computation
  const countdownDisplay = useMemo(() => {
    if (!nextContest) return 'No upcoming contests logged';
    const diffSecs = differenceInSeconds(new Date(nextContest.startTime), currentTime);
    if (diffSecs <= 0) return 'Contest in progress!';

    const days = Math.floor(diffSecs / 86400);
    const hrs = Math.floor((diffSecs % 86400) / 3600);
    const mins = Math.floor((diffSecs % 3600) / 60);
    const secs = diffSecs % 60;

    let displayStr = '';
    if (days > 0) displayStr += `${days}d `;
    displayStr += `${hrs.toString().padStart(2, '0')}h : ${mins.toString().padStart(2, '0')}m : ${secs.toString().padStart(2, '0')}s`;
    return displayStr;
  }, [nextContest, currentTime]);

  // Format link for general Calendar integrations
  const formatGCalLink = (contest: Contest) => {
    const formatGCalDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d\d\d/g, ''); // Convert to YYYYMMDDTHHMMSSZ
    };
    const start = new Date(contest.startTime);
    const end = new Date(start.getTime() + contest.durationSeconds * 1000);
    
    const detailsStr = `Register and details here: ${contest.registrationUrl}`;
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `CompCode: ${contest.name}`
    )}&dates=${formatGCalDate(start)}/${formatGCalDate(end)}&details=${encodeURIComponent(detailsStr)}&sf=true&output=xml`;
  };

  const toggleFilter = (platform: string) => {
    setActiveFilters((prev) => 
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  // Month rendering computations (June 2026)
  const juneDaysCount = 30;
  const prevMonthDaysOffset = 1; 

  const platformMeta: Record<string, { bg: string; text: string; dot: string; hover: string }> = {
    CF: { bg: 'bg-red-500/10', text: 'text-red-500', dot: 'bg-red-500', hover: 'hover:border-red-500/30' },
    LC: { bg: 'bg-amber-500/10', text: 'text-amber-500', dot: 'bg-amber-500', hover: 'hover:border-amber-500/30' },
    CC: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', dot: 'bg-emerald-500', hover: 'hover:border-emerald-500/30' },
    AC: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', dot: 'bg-indigo-500', hover: 'hover:border-indigo-500/30' },
    HR: { bg: 'bg-teal-500/10', text: 'text-teal-500', dot: 'bg-teal-500', hover: 'hover:border-teal-500/30' },
    GFG: { bg: 'bg-green-500/10', text: 'text-green-500', dot: 'bg-green-500', hover: 'hover:border-green-500/30' }
  };

  const getContestsOnJuneDay = (dayNum: number) => {
    return filteredContests.filter((contest) => {
      const cDate = new Date(contest.startTime);
      return cDate.getMonth() === 5 && cDate.getFullYear() === 2026 && cDate.getDate() === dayNum; // 5 is June
    });
  };

  const handleSetReminderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderModalContest) return;

    addReminder(
      reminderModalContest.id,
      reminderModalContest.name,
      reminderModalContest.startTime,
      reminderModalContest.platform,
      selectedOffset
    );
    setReminderModalContest(null);
  };

  const pastContests = [
    { name: 'LeetCode Weekly Contest 398', rank: '1240 / 22000', delta: '+22', date: '2026-05-24', points: '3/4 solved', rating: 1912 },
    { name: 'Codeforces Round #1012 (Div.2)', rank: '450 / 9400', delta: '+56', date: '2026-05-22', points: '4/6 solved', rating: 1756 },
    { name: 'CodeChef Starters 135 (Div.2)', rank: '184 / 4500', delta: '+84', date: '2026-05-18', points: '5/6 solved', rating: 1845 }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Set Reminder Configuration Dialog Popover */}
      <AnimatePresence>
        {reminderModalContest && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="p-6 bg-white dark:bg-sleek-card border border-gray-150 dark:border-white/10 rounded-2xl shadow-xl w-full max-w-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Bell className="text-blue-500 fill-blue-500/10 w-4.5 h-4.5" /> Configure Contest Reminder
                </h3>
                <button
                  onClick={() => setReminderModalContest(null)}
                  className="p-1 rounded bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-blue-500 uppercase tracking-wide">
                  {reminderModalContest.platform} Contest
                </span>
                <p className="text-sm font-bold text-gray-950 dark:text-white leading-tight">
                  {reminderModalContest.name}
                </p>
                <p className="text-xs text-gray-400 dark:text-white/40">
                  Starts: {format(new Date(reminderModalContest.startTime), 'eee, MMM dd, yyyy @ hh:mm a')}
                </p>
              </div>

              <form onSubmit={handleSetReminderSubmit} className="space-y-4">
                <div className="space-y-2">
                  <span className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wide block">Reminder Offset Time</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: 5, label: '5 minutes before' },
                      { val: 15, label: '15 minutes before' },
                      { val: 60, label: '1 hour before' },
                      { val: 1440, label: '1 day before' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setSelectedOffset(opt.val)}
                        className={`p-2 rounded-xl text-center border text-xs font-semibold font-sans transition-all ${
                          selectedOffset === opt.val
                            ? 'bg-blue-600 border-transparent text-white shadow-sm'
                            : 'bg-gray-50 dark:bg-white/5 border-gray-150 dark:border-white/10 text-gray-700 dark:text-white/60 hover:bg-gray-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReminderModalContest(null)}
                    className="flex-1 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-semibold text-gray-700 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
                  >
                    Save Alarm
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header section toggle view */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 dark:border-white/10 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-sans font-bold text-gray-900 dark:text-white tracking-tight">
            Contest Schedule Calendar
          </h1>
          <p className="text-sm text-gray-500 dark:text-white/40 mt-1">
            Stay on track. View schedules, verify registrations, and set automatic reminders.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Calendar / List Mode select */}
          <div className="flex items-center bg-gray-100 dark:bg-white/5 p-1 rounded-lg border border-gray-200 dark:border-white/10">
            <button
              id="view-list-toggle"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'list' 
                  ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <List size={14} /> List View
            </button>
            <button
              id="view-calendar-toggle"
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'calendar' 
                  ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <CalendarIcon size={14} /> Month Grid
            </button>
          </div>

          <button
            id="force-refresh-contests"
            onClick={refreshContests}
            className="p-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-100 text-zinc-500 dark:hover:bg-white/10 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Countdown Card */}
      {nextContest && (
        <div className="p-5 bg-blue-600 border border-blue-500/20 text-white rounded-xl shadow-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.3),transparent_60%)] pointer-events-none" />
          
          <div className="space-y-1 z-10 text-center md:text-left">
            <span className="text-[10px] uppercase tracking-wider font-mono bg-blue-500 font-bold px-2 py-0.5 rounded">
              Next Contest Countdown • {nextContest.platform}
            </span>
            <h3 className="text-base sm:text-lg font-sans font-bold mt-1 leading-snug">
              {nextContest.name}
            </h3>
            <p className="text-xs text-blue-100 flex items-center justify-center md:justify-start gap-1 font-mono">
              <Clock size={13} /> {format(new Date(nextContest.startTime), 'MMM dd | hh:mm a (IST)')} • Duration: {Math.round(nextContest.durationSeconds / 3600)}h
            </p>
          </div>

          {/* Draggable Active ticking count */}
          <div className="bg-zinc-950/25 border border-white/10 p-4 rounded-xl text-center z-10 shrink-0 min-w-[220px]">
            <span className="text-[9px] uppercase tracking-wider text-blue-200 font-mono block">Countdown Timer</span>
            <span className="text-xl sm:text-2xl font-mono font-bold tracking-tight block mt-1 text-white">
              {countdownDisplay}
            </span>
          </div>
        </div>
      )}

      {/* Platform Filter Options Tag pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 dark:border-white/10 pb-3">
        <span className="text-xs font-sans text-gray-400 font-medium mr-2">Filter Platforms:</span>
        {['CF', 'LC', 'CC', 'AC', 'HR', 'GFG'].map((plat) => {
          const isActive = activeFilters.includes(plat);
          const meta = platformMeta[plat];
          return (
            <button
              key={plat}
              onClick={() => toggleFilter(plat)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-sans font-medium transition-all ${
                isActive 
                  ? `${meta.bg} ${meta.text} border-transparent shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]`
                  : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/15'
              }`}
            >
              {plat === 'CF' && 'Codeforces'}
              {plat === 'LC' && 'LeetCode'}
              {plat === 'CC' && 'CodeChef'}
              {plat === 'AC' && 'AtCoder'}
              {plat === 'HR' && 'HackerRank'}
              {plat === 'GFG' && 'GeeksForGeeks'}
            </button>
          );
        })}
      </div>

      {loading && contests.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonContestCardItem />
          <SkeletonContestCardItem />
          <SkeletonContestCardItem />
        </div>
      ) : (
        <>
          {/* List View Model rendering */}
          {viewMode === 'list' && (
            <div className="space-y-3" id="contest-list-container">
              {filteredContests.length === 0 ? (
                <div className="py-12 border border-dashed border-gray-150 dark:border-white/10 rounded-xl text-center text-gray-500 dark:text-zinc-500">
                  No upcoming contests matched the filtered platforms.
                </div>
              ) : (
                filteredContests.map((contestObj) => {
                  const meta = platformMeta[contestObj.platform] || { bg: 'bg-zinc-500/10', text: 'text-zinc-500', dot: 'bg-zinc-500', hover: 'hover:border-zinc-500/20' };
                  const durationHrs = Math.round(contestObj.durationSeconds / 3600 * 10) / 10;
                  
                  // Highlight alerts set for this contest
                  const activeConReminders = reminders.filter(r => r.contestId === contestObj.id);

                  return (
                    <div
                      key={contestObj.id}
                      className={`p-4 bg-white dark:bg-sleek-card border border-gray-100 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 transition-all rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${meta.hover}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg shrink-0 mt-0.5 font-mono font-bold text-center text-xs min-w-[50px] ${meta.bg} ${meta.text}`}>
                          {contestObj.platform}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-sans font-bold text-gray-900 dark:text-white leading-tight">
                            {contestObj.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-white/40 font-mono">
                            <span>Start: <strong>{format(new Date(contestObj.startTime), 'eee, MMM dd, yyyy @ hh:mm a')}</strong></span>
                            <span>•</span>
                            <span>Length: <strong>{durationHrs} hours</strong></span>
                          </div>

                          {/* Render reminders tags as beautiful standalone badges */}
                          {activeConReminders.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1 bg-transparent">
                              {activeConReminders.map((rem) => (
                                <div
                                  key={rem.id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold bg-blue-500/10 border border-blue-500/20 text-blue-500 hover:bg-blue-500/15 selection:bg-transparent shadow-xs transition-all"
                                >
                                  <BellRing size={10} className="shrink-0 text-blue-500" />
                                  <span>
                                    {rem.reminderTimeOffset === 1440 
                                      ? '1d before' 
                                      : rem.reminderTimeOffset === 60 
                                      ? '1h before' 
                                      : `${rem.reminderTimeOffset}m before`
                                    }
                                  </span>
                                  <button
                                    onClick={() => removeReminder(rem.id)}
                                    className="ml-1 text-blue-400 hover:text-red-500 cursor-pointer transition-colors"
                                    title="Cancel Reminder"
                                  >
                                    <X size={10} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center bg-transparent">
                        
                        {/* Interactive Contest Reminder Action setter */}
                        <button
                          onClick={() => setReminderModalContest(contestObj)}
                          className={`p-2 border rounded-lg flex items-center justify-center transition-all duration-300 relative ${
                            activeConReminders.length > 0
                              ? 'bg-blue-500/10 border-blue-500/20 text-blue-500 hover:bg-blue-500/20'
                              : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/45 hover:text-blue-500 hover:border-blue-500/20 hover:bg-blue-500/5'
                          }`}
                          title="Set Alert Reminder"
                        >
                          <Bell size={16} className={activeConReminders.length > 0 ? 'fill-blue-500/10' : ''} />
                          {activeConReminders.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-zinc-950 animate-pulse" />
                          )}
                        </button>

                        <a
                          href={formatGCalLink(contestObj)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/40 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-center"
                          title="Save to Google Calendar"
                        >
                          <CalendarPlus size={16} />
                        </a>
                        <a
                          href={contestObj.registrationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-sm font-sans"
                        >
                          Register <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Month Calendar Grid Selection view (June 2026) */}
          {viewMode === 'calendar' && (
            <div className="space-y-4" id="monthly-grid-container">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/10 rounded-xl font-sans text-xs">
                <span className="font-bold text-gray-900 dark:text-white">June 2026</span>
                <span className="text-gray-400 dark:text-white/40">All dates shown as IST</span>
              </div>

              {/* Month Grid */}
              <div className="overflow-x-auto w-full rounded-xl border border-gray-100 dark:border-white/10">
                <div className="bg-white dark:bg-sleek-card overflow-hidden shadow-sm min-w-[650px] md:min-w-0">
                  <div className="grid grid-cols-7 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 text-center text-[10px] font-mono text-gray-400 p-2 uppercase">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                  </div>

                  <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 dark:divide-white/10 min-h-[380px]">
                    {/* Prev Month Offsets */}
                    {Array.from({ length: prevMonthDaysOffset }).map((_, idx) => (
                      <div key={`offset-${idx}`} className="p-2 bg-gray-50/30 dark:bg-white/5 text-gray-300 dark:text-zinc-700 text-[10px] font-mono" />
                    ))}

                    {/* June Days */}
                    {Array.from({ length: juneDaysCount }).map((_, dIdx) => {
                      const dayNum = dIdx + 1;
                      const daysContests = getContestsOnJuneDay(dayNum);
                      
                      return (
                        <div key={dayNum} className="p-2 min-h-[75px] flex flex-col justify-between space-y-1 hover:bg-zinc-100/10 transition-colors">
                          <span className="text-[10px] font-mono text-gray-500 font-semibold">{dayNum}</span>
                          
                          <div className="space-y-1">
                            {daysContests.map((c) => {
                              const meta = platformMeta[c.platform] || { bg: 'bg-zinc-500/10', text: 'text-zinc-500', dot: 'bg-zinc-500' };
                              const cReminders = reminders.filter(r => r.contestId === c.id);

                              return (
                                <div
                                  key={c.id}
                                  className={`block px-1.5 py-0.5 rounded text-[8px] font-mono font-bold leading-tight truncate relative select-none cursor-pointer ${meta.bg} ${meta.text}`}
                                  title={`${c.name} (Click to set reminder)`}
                                  onClick={() => setReminderModalContest(c)}
                                >
                                  {cReminders.length > 0 && (
                                    <span className="absolute right-1 top-[3px] w-1 h-1 bg-blue-500 rounded-full" />
                                  )}
                                  {c.platform}: {c.name.substring(0, 11)}...
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Historically attended section */}
      <div className="p-5 bg-white dark:bg-sleek-card border border-gray-100 dark:border-white/10 rounded-xl space-y-3">
        <h2 className="text-sm font-sans font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Award size={16} className="text-emerald-500" /> Past Subscribed Performances ({pastContests.length})
        </h2>
        <p className="text-xs text-gray-400 dark:text-white/40">
          Syncs from platform submissions automatically after each rating update.
        </p>

        <div className="divide-y divide-gray-100 dark:divide-white/10 text-xs text-gray-700 dark:text-sleek-text">
          {pastContests.map((p, idx) => (
            <div key={idx} className="py-3 flex sm:items-center justify-between gap-3 flex-col sm:flex-row">
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">{p.name}</span>
                <span className="text-gray-400 dark:text-white/40 text-[10px] block mt-0.5 font-mono">{p.date} • {p.points}</span>
              </div>
              <div className="flex items-center gap-4 text-right font-mono self-end sm:self-center">
                <div>
                  <span className="text-[9px] text-gray-400 dark:text-white/40 block">Classified Score</span>
                  <span className="font-bold text-gray-900 dark:text-white">Rank {p.rank}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 dark:text-white/40 block">Delta</span>
                  <span className="font-semibold text-emerald-500">{p.delta}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
