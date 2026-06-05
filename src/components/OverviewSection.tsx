/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Award,
  Calendar,
  ShieldCheck,
  Bell,
  Terminal,
  Grid,
  Code,
  X,
  Search,
  Home,
  User,
  ClipboardList,
  Briefcase,
  Settings,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useCodeBaseStore } from '../store';
import { format, subDays, isWithinInterval, parseISO } from 'date-fns';
import UserAvatar, { getUserDisplayInfo } from './UserAvatar';

const QUICK_NAV = [
  { id: 'home' as const, label: 'Overview', icon: Home },
  { id: 'profiles' as const, label: 'Profile Dashboard', icon: User },
  { id: 'tracker' as const, label: 'CP Tracker', icon: ClipboardList },
  { id: 'calendar' as const, label: 'Contest Calendar', icon: Calendar },
  { id: 'portfolio' as const, label: 'Dev Portfolio', icon: Briefcase },
  { id: 'settings' as const, label: 'Settings', icon: Settings },
];

const TERMINAL_COMMANDS = [
  { cmd: 'go home', label: 'Navigate to Overview' },
  { cmd: 'go profiles', label: 'Navigate to Profile Dashboard' },
  { cmd: 'go tracker', label: 'Navigate to CP Tracker' },
  { cmd: 'go calendar', label: 'Navigate to Contest Calendar' },
  { cmd: 'go portfolio', label: 'Navigate to Dev Portfolio' },
  { cmd: 'go settings', label: 'Navigate to Settings' },
  { cmd: 'refresh stats', label: 'Force refresh platform stats' },
  { cmd: 'refresh contests', label: 'Refresh contest calendar' },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function OverviewSection() {
  const {
    stats,
    contests,
    problemLogs,
    reminders,
    settings,
    user,
    portfolio,
    loading,
    fetchErrors,
    setTab,
    refreshStats,
    refreshContests,
    removeReminder,
  } = useCodeBaseStore();

  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly'>('weekly');
  const [hoveredBar, setHoveredBar] = useState<{ day: string; solved: number } | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showQuickNav, setShowQuickNav] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [terminalInput, setTerminalInput] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const { displayName } = getUserDisplayInfo(settings, user, portfolio.name);
  const firstName = displayName.split(' ')[0];

  useEffect(() => {
    refreshStats();
    refreshContests();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cfSolved = stats?.codeforces?.solvedCount ?? 0;
  const lcSolved = stats?.leetcode?.totalSolved ?? 0;
  const ccSolved = stats?.codechef?.solvedCount ?? 0;
  const acSolved = stats?.atcoder?.solvedCount ?? 0;
  const otherSolved = ccSolved + acSolved;
  const matchedTotalSolved = cfSolved + lcSolved + ccSolved + acSolved;

  const ratings = [
    stats?.codeforces?.maxRating,
    stats?.leetcode?.contestRating,
    stats?.codechef?.rating,
    stats?.atcoder?.highestRating,
  ].filter((r): r is number => !!r && r > 0);
  const bestRating = ratings.length > 0 ? Math.max(...ratings) : null;

  const ghContributions = stats?.github?.contributionsThisWeek ?? 0;
  const upcomingContestCount = contests.length;

  const weeklyActivityData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    return days.map((day, i) => {
      const targetDate = subDays(now, (now.getDay() + 6 - i) % 7);
      const solved = problemLogs.filter((p) => {
        try {
          const d = parseISO(p.date);
          return format(d, 'yyyy-MM-dd') === format(targetDate, 'yyyy-MM-dd') && p.status === 'Solved';
        } catch {
          return false;
        }
      }).length;
      return { day, solved };
    });
  }, [problemLogs]);

  const monthlyActivityData = useMemo(() => {
    const weeks: { day: string; solved: number }[] = [];
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const weekStart = subDays(now, i * 7 + 6);
      const weekEnd = subDays(now, i * 7);
      const solved = problemLogs.filter((p) => {
        try {
          const d = parseISO(p.date);
          return isWithinInterval(d, { start: weekEnd, end: weekStart }) && p.status === 'Solved';
        } catch {
          return false;
        }
      }).length;
      weeks.push({ day: `W${4 - i}`, solved });
    }
    return weeks;
  }, [problemLogs]);

  const activityData = activeTab === 'weekly' ? weeklyActivityData : monthlyActivityData;
  const maxSolved = Math.max(1, ...activityData.map((d) => d.solved));

  const totalWeight = lcSolved + cfSolved + otherSolved || 1;

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: { type: string; label: string; action: () => void }[] = [];

    QUICK_NAV.forEach((nav) => {
      if (nav.label.toLowerCase().includes(q)) {
        results.push({ type: 'Page', label: nav.label, action: () => { setTab(nav.id); setSearchQuery(''); setShowSearchResults(false); } });
      }
    });

    problemLogs.forEach((log) => {
      if (log.name.toLowerCase().includes(q) || log.platform.toLowerCase().includes(q)) {
        results.push({
          type: 'Problem',
          label: `${log.name} (${log.platform})`,
          action: () => { setTab('tracker'); setSearchQuery(''); setShowSearchResults(false); },
        });
      }
    });

    contests.forEach((c) => {
      if (c.name.toLowerCase().includes(q)) {
        results.push({
          type: 'Contest',
          label: c.name,
          action: () => { setTab('calendar'); setSearchQuery(''); setShowSearchResults(false); },
        });
      }
    });

    return results.slice(0, 8);
  }, [searchQuery, problemLogs, contests, setTab]);

  const recentFeed = problemLogs.slice(0, 5);

  const pendingReminders = reminders.filter((r) => !r.notified);
  const hasNotifications = pendingReminders.length > 0 || contests.length > 0;

  const executeTerminalCommand = (cmd: string) => {
    const normalized = cmd.trim().toLowerCase();
    if (normalized.startsWith('go ')) {
      const target = normalized.replace('go ', '');
      const nav = QUICK_NAV.find((n) => n.id === target || n.label.toLowerCase().includes(target));
      if (nav) setTab(nav.id);
    } else if (normalized === 'refresh stats') {
      refreshStats(true);
    } else if (normalized === 'refresh contests') {
      refreshContests();
    }
    setShowTerminal(false);
    setTerminalInput('');
  };

  const configuredPlatforms = Object.values(settings.usernames).filter(Boolean).length;
  const failedFetches = Object.keys(fetchErrors).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-5 border-b border-gray-150 dark:border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-sans font-black text-gray-900 dark:text-white tracking-tight">
            {getGreeting()}, {firstName}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-mono text-emerald-500 font-extrabold tracking-widest flex items-center gap-1.5 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {loading.stats ? 'Syncing platforms...' : 'Online & Ready'}
            </span>
            {failedFetches > 0 && (
              <span className="text-[10px] font-mono text-amber-500 font-bold flex items-center gap-1">
                <AlertCircle size={10} />
                {failedFetches} platform{failedFetches > 1 ? 's' : ''} failed
              </span>
            )}
          </div>
        </div>

        {/* Search */}
        <div ref={searchRef} className="flex-1 max-w-md relative">
          <div className="px-4 py-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-150 dark:border-white/5 flex items-center gap-3">
            <Search size={14} className="text-gray-400 dark:text-zinc-500 shrink-0" />
            <input
              type="text"
              placeholder="Search problems, contests, pages..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
              onFocus={() => setShowSearchResults(true)}
              className="bg-transparent border-none outline-none text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 w-full font-mono"
            />
          </div>
          <AnimatePresence>
            {showSearchResults && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-gray-150 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
              >
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={r.action}
                    className="w-full px-4 py-2.5 text-left text-xs hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-between gap-2"
                  >
                    <span className="font-semibold text-gray-900 dark:text-white truncate">{r.label}</span>
                    <span className="text-[9px] font-mono text-blue-500 uppercase shrink-0">{r.type}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Header actions */}
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <div className="flex items-center gap-2 bg-transparent">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-500 hover:text-gray-950 dark:text-zinc-400 dark:hover:text-white bg-white dark:bg-white/5 rounded-xl border border-gray-150 dark:border-white/5 transition-all relative"
                title="Notifications"
              >
                {hasNotifications && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                )}
                <Bell size={15} />
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-zinc-900 border border-gray-150 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">Notifications</span>
                      <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {pendingReminders.length === 0 && contests.length === 0 ? (
                        <p className="px-4 py-6 text-xs text-gray-400 text-center">No active reminders. Set them in Calendar.</p>
                      ) : (
                        <>
                          {pendingReminders.map((r) => (
                            <div key={r.id} className="px-4 py-3 border-b border-gray-50 dark:border-white/5 flex items-start justify-between gap-2">
                              <div>
                                <p className="text-[9px] font-mono text-blue-500 uppercase">{r.platform} Reminder</p>
                                <p className="text-xs font-semibold text-gray-900 dark:text-white">{r.contestName}</p>
                                <p className="text-[10px] text-gray-400">{r.reminderTimeOffset} min before start</p>
                              </div>
                              <button
                                onClick={() => removeReminder(r.id)}
                                className="text-[10px] text-red-400 hover:text-red-500 shrink-0"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          {contests.slice(0, 3).map((c) => (
                            <button
                              key={c.id}
                              onClick={() => { setTab('calendar'); setShowNotifications(false); }}
                              className="w-full px-4 py-3 border-b border-gray-50 dark:border-white/5 text-left hover:bg-gray-50 dark:hover:bg-white/5"
                            >
                              <p className="text-[9px] font-mono text-indigo-500 uppercase">{c.platform} Contest</p>
                              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{c.name}</p>
                              <p className="text-[10px] text-gray-400">{format(new Date(c.startTime), 'MMM d, h:mm a')}</p>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => { setTab('calendar'); setShowNotifications(false); }}
                      className="w-full px-4 py-2.5 text-xs font-bold text-blue-500 hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                      Open Contest Calendar
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Terminal command palette */}
            <button
              onClick={() => setShowTerminal(true)}
              className="p-2 text-gray-500 hover:text-gray-950 dark:text-zinc-400 dark:hover:text-white bg-white dark:bg-white/5 rounded-xl border border-gray-150 dark:border-white/5 transition-all"
              title="Command terminal"
            >
              <Terminal size={15} />
            </button>

            {/* Quick navigation grid */}
            <button
              onClick={() => setShowQuickNav(true)}
              className="p-2 text-gray-500 hover:text-gray-950 dark:text-zinc-400 dark:hover:text-white bg-white dark:bg-white/5 rounded-xl border border-gray-150 dark:border-white/5 transition-all"
              title="Quick navigation"
            >
              <Grid size={15} />
            </button>
          </div>

          <div className="h-8 w-[1px] bg-gray-150 dark:bg-white/10 hidden sm:block" />

          <button
            onClick={() => setTab('settings')}
            className="flex items-center gap-2.5 bg-transparent hover:opacity-80 transition-opacity"
            title="Profile settings"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold leading-tight text-gray-950 dark:text-white tracking-tight">{displayName}</p>
              <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-wider mt-0.5">
                {user ? 'Synced' : 'Guest'}
              </p>
            </div>
            <UserAvatar size="md" editable />
          </button>
        </div>
      </div>

      {/* Platform fetch status banner */}
      {configuredPlatforms === 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between gap-3">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            No platform handles configured. Add your usernames in Settings to fetch live stats.
          </p>
          <button onClick={() => setTab('settings')} className="text-xs font-bold text-amber-600 hover:underline shrink-0">
            Go to Settings
          </button>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-sleek-card border border-gray-150 dark:border-white/10 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[140px] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-sans font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest">Total Solved</span>
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-500 border border-teal-500/20">
              <ShieldCheck size={15} />
            </div>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-3xl font-sans font-extrabold text-gray-900 dark:text-white">
                {matchedTotalSolved || '—'}
              </span>
              {matchedTotalSolved > 0 && (
                <span className="text-sm font-sans font-medium text-gray-400 dark:text-zinc-500">problems</span>
              )}
            </div>
          </div>
          {matchedTotalSolved > 0 && (
            <div className="space-y-1">
              <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (matchedTotalSolved / 2500) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-blue-500 font-mono font-bold tracking-tight">
                {((matchedTotalSolved / 2500) * 100).toFixed(1)}% of 2500 goal
              </p>
            </div>
          )}
        </div>

        <div className="p-5 bg-white dark:bg-sleek-card border border-gray-150 dark:border-white/10 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[140px] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-sans font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest">Contest Best</span>
            <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
              <Award size={15} />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-sans font-extrabold text-gray-900 dark:text-white tracking-tight">
              {bestRating ?? '—'}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 dark:text-white/30 font-sans mt-1">
            {bestRating ? 'Peak rating across platforms' : 'Configure handles in Settings'}
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-sleek-card border border-gray-150 dark:border-white/10 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[140px] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-sans font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest">Github Commits</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Code size={15} />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-sans font-extrabold text-gray-900 dark:text-white tracking-tight">
              {settings.usernames.github ? ghContributions : '—'}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 dark:text-white/30 font-sans mt-1">
            {settings.usernames.github ? 'events this week' : 'Add GitHub username in Settings'}
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-sleek-card border border-gray-150 dark:border-white/10 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[140px] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-sans font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest">Next Contests</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <Calendar size={15} />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-sans font-extrabold text-gray-900 dark:text-white tracking-tight">
              {upcomingContestCount}
            </span>
          </div>
          <button
            onClick={() => setTab('calendar')}
            className="text-[10px] text-indigo-500 hover:underline font-sans mt-1 text-left"
          >
            View contest calendar
          </button>
        </div>
      </div>

      {/* Activity + breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 min-w-0 p-5 bg-white dark:bg-sleek-card border border-gray-150 dark:border-white/10 rounded-2xl relative space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-[3px] h-3.5 bg-blue-500" />
              <h2 className="text-xs font-sans font-extrabold text-gray-900 dark:text-white uppercase tracking-widest">
                {activeTab === 'weekly' ? 'Weekly' : 'Monthly'} Activity
              </h2>
            </div>
            <div className="flex p-0.5 bg-gray-150 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-lg text-[9px] font-mono font-bold uppercase">
              <button
                onClick={() => setActiveTab('weekly')}
                className={`px-2.5 py-1 rounded-md transition-all ${activeTab === 'weekly' ? 'bg-white dark:bg-white/10 text-gray-950 dark:text-white shadow-xs' : 'text-zinc-500'}`}
              >
                Weekly
              </button>
              <button
                onClick={() => setActiveTab('monthly')}
                className={`px-2.5 py-1 rounded-md transition-all ${activeTab === 'monthly' ? 'bg-white dark:bg-white/10 text-gray-950 dark:text-white shadow-xs' : 'text-zinc-500'}`}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="relative pt-6 min-h-[175px]">
            {activityData.every((d) => d.solved === 0) ? (
              <p className="text-xs text-gray-400 text-center py-12">No solved problems in this period. Log problems in CP Tracker.</p>
            ) : (
              <div className={`grid gap-2 sm:gap-3 items-end h-[140px] px-1 relative ${activeTab === 'weekly' ? 'grid-cols-7' : 'grid-cols-4'}`}>
                {hoveredBar && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-zinc-950/95 border border-white/10 text-white rounded-lg p-2.5 text-[10px] shadow-xl z-20">
                    <span className="font-bold text-blue-400">{hoveredBar.day}</span>
                    <span className="ml-2">Solved: <strong>{hoveredBar.solved}</strong></span>
                  </div>
                )}
                {activityData.map((d) => {
                  const heightPct = Math.max(8, (d.solved / maxSolved) * 100);
                  return (
                    <div
                      key={d.day}
                      className="flex flex-col items-center group cursor-pointer"
                      onMouseEnter={() => setHoveredBar(d)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      <div
                        className="w-full sm:w-10 rounded-t-lg bg-gradient-to-t from-blue-600 to-indigo-500 transition-all duration-300"
                        style={{ height: `${heightPct}px` }}
                      />
                      <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase mt-2.5">{d.day}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-sleek-card border border-gray-150 dark:border-white/10 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-[3px] h-3.5 bg-blue-500" />
            <h2 className="text-xs font-sans font-extrabold text-gray-900 dark:text-white uppercase tracking-widest">Platform Breakdown</h2>
          </div>

          {matchedTotalSolved === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No platform data yet.</p>
          ) : (
            <>
              <div className="relative flex items-center justify-center p-2">
                <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#1f2937" strokeWidth="11" strokeOpacity="0.4" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#2563eb" strokeWidth="12"
                    strokeDasharray="251.2" strokeDashoffset={`${251.2 * (1 - lcSolved / totalWeight)}`} strokeLinecap="round" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#06b6d4" strokeWidth="12"
                    strokeDashoffset={`${251.2 * (1 - (lcSolved + cfSolved) / totalWeight)}`}
                    strokeDasharray={`${(cfSolved / totalWeight) * 251.2} 251.2`} strokeLinecap="round" className="opacity-70" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[9px] font-mono uppercase text-gray-400">Total</span>
                  <strong className="text-2xl font-extrabold text-gray-950 dark:text-white">{matchedTotalSolved}</strong>
                </div>
              </div>
              <div className="space-y-2 text-[11px] border-t border-gray-150 dark:border-white/5 pt-3">
                <div className="flex justify-between"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-600" />LeetCode</span><strong className="font-mono">{lcSolved}</strong></div>
                <div className="flex justify-between"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-400" />Codeforces</span><strong className="font-mono">{cfSolved}</strong></div>
                <div className="flex justify-between"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" />CodeChef + AtCoder</span><strong className="font-mono">{otherSolved}</strong></div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent submissions */}
      <div className="p-5 bg-white dark:bg-sleek-card border border-gray-150 dark:border-white/10 rounded-2xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-150 dark:border-white/10 pb-3">
          <h2 className="text-xs font-sans font-extrabold text-gray-900 dark:text-white uppercase tracking-widest">Recent Submissions</h2>
          <button onClick={() => setTab('tracker')} className="text-[10px] font-mono uppercase font-bold text-blue-500 hover:underline">
            View All Logs
          </button>
        </div>

        {recentFeed.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">No problem logs yet. Use + New Project or CP Tracker to add entries.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest border-b border-gray-100 dark:border-white/5">
                  <th className="pb-3 font-semibold">Problem Title</th>
                  <th className="pb-3 font-semibold">Difficulty</th>
                  <th className="pb-3 font-semibold">Platform</th>
                  <th className="pb-3 font-semibold">Time</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-xs">
                {recentFeed.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5">
                    <td className="py-3.5 font-semibold text-gray-950 dark:text-white">{log.name}</td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                        log.difficulty === 'Easy' ? 'text-blue-500 bg-blue-500/10' :
                        log.difficulty === 'Medium' ? 'text-amber-500 bg-amber-500/10' :
                        'text-red-500 bg-red-500/10'
                      }`}>{log.difficulty}</span>
                    </td>
                    <td className="py-3.5 font-mono text-zinc-500">{log.platform}</td>
                    <td className="py-3.5 font-mono text-zinc-500">{log.timeTaken} min</td>
                    <td className="py-3.5">
                      <span className={`font-bold ${log.status === 'Solved' ? 'text-emerald-500' : log.status === 'Revisit' ? 'text-amber-500' : 'text-gray-400'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-mono text-zinc-500">{log.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Terminal modal */}
      <AnimatePresence>
        {showTerminal && (
          <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs flex items-start justify-center pt-24 p-4 z-[9999]">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-2">
                  <Terminal size={14} /> DevOS Terminal
                </span>
                <button onClick={() => setShowTerminal(false)} className="text-zinc-400 hover:text-white"><X size={16} /></button>
              </div>
              <div className="p-4 space-y-2 max-h-48 overflow-y-auto">
                {TERMINAL_COMMANDS.map((c) => (
                  <button
                    key={c.cmd}
                    onClick={() => executeTerminalCommand(c.cmd)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-xs font-mono text-zinc-300 flex justify-between"
                  >
                    <span className="text-emerald-400">{c.cmd}</span>
                    <span className="text-zinc-500">{c.label}</span>
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); executeTerminalCommand(terminalInput); }}
                className="px-4 py-3 border-t border-white/10 flex items-center gap-2"
              >
                <span className="text-emerald-400 font-mono text-xs">$</span>
                <input
                  autoFocus
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  placeholder="Type a command..."
                  className="flex-1 bg-transparent text-xs font-mono text-white outline-none"
                />
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick nav grid modal */}
      <AnimatePresence>
        {showQuickNav && (
          <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]" onClick={() => setShowQuickNav(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-zinc-900 border border-gray-150 dark:border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Quick Navigation</h3>
                <button onClick={() => setShowQuickNav(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {QUICK_NAV.map((nav) => {
                  const Icon = nav.icon;
                  return (
                    <button
                      key={nav.id}
                      onClick={() => { setTab(nav.id); setShowQuickNav(false); }}
                      className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/10 hover:border-blue-500/50 transition-all flex flex-col items-center gap-2"
                    >
                      <Icon size={20} className="text-blue-500" />
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">{nav.label}</span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => { refreshStats(true); setShowQuickNav(false); }}
                className="w-full mt-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} /> Refresh Platform Stats
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
