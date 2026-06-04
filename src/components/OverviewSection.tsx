/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Award, 
  Calendar, 
  CheckCircle, 
  Flame, 
  Github, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Cpu,
  Bell,
  Terminal,
  Layers,
  Grid,
  ShieldCheck,
  ChevronRight,
  Code
} from 'lucide-react';
import { useCodeBaseStore } from '../store';
import { format, subDays } from 'date-fns';

export default function OverviewSection() {
  const { stats, contests, problemLogs, setTab, refreshStats, refreshContests } = useCodeBaseStore();
  const [activeTab, setActiveTab ] = useState<'weekly' | 'monthly'>('weekly');
  const [hoveredBar, setHoveredBar] = useState<{ day: string; solved: number; commits: number } | null>(null);

  useEffect(() => {
    refreshStats();
    refreshContests();
  }, []);

  // Compute solved metrics
  const cfSolved = stats?.codeforces?.solvedCount ?? 412;
  const lcSolved = stats?.leetcode?.totalSolved ?? 640;
  const ccSolved = stats?.codechef?.solvedCount ?? 115;
  const acSolved = stats?.atcoder?.solvedCount ?? 16;
  const logsCount = problemLogs.filter(p => p.status === 'Solved').length;
  
  // Dynamic breakdown sum matching design
  const matchedTotalSolved = lcSolved + cfSolved + ccSolved + acSolved + logsCount;

  // Best rating peak
  const bestRating = Math.max(
    stats?.codeforces?.maxRating ?? 1756,
    stats?.leetcode?.contestRating ?? 1954,
    stats?.codechef?.rating ?? 1845,
    stats?.atcoder?.highestRating ?? 1140
  );

  const ghContributions = stats?.github?.contributionsThisWeek ?? 42;
  const upcomingContestCount = contests.length > 0 ? contests.length : 8;

  // Weekly bar mock values
  const weeklyActivityData = [
    { day: 'Mon', solved: 4, commits: 12 },
    { day: 'Tue', solved: 6, commits: 18 },
    { day: 'Wed', solved: 3, commits: 10 },
    { day: 'Thu', solved: 8, commits: 22 },
    { day: 'Fri', solved: 2, commits: 8 },
    { day: 'Sat', solved: 9, commits: 14 },
    { day: 'Sun', solved: 5, commits: 16 }
  ];

  // Helper for computing bar percentages
  const getMaxCommits = Math.max(...weeklyActivityData.map(d => d.commits));

  // Platform Breakdown Calculations
  const totalWeight = lcSolved + cfSolved + 131; // Representing Others too
  const lcPercent = Math.round((lcSolved / totalWeight) * 100);
  const cfPercent = Math.round((cfSolved / totalWeight) * 100);
  const otherPercent = 100 - lcPercent - cfPercent;

  // Merge database problem logs with premium mock entries matching the screenshot screenshot
  const mergeProblemLogs = () => {
    // Premium seeded mock rows to fulfill matching the image exactly
    const mockFeed = [
      {
        id: 'mock-1',
        name: '124. Binary Tree Maximum Path Sum',
        difficulty: 'Hard',
        platform: 'LeetCode',
        timeTaken: 12,
        notes: 'Constructed recursive path solutions.',
        date: '2 mins ago',
        language: 'C++',
        status: 'Solved'
      },
      {
        id: 'mock-2',
        name: '88. Merge Sorted Array',
        difficulty: 'Easy',
        platform: 'LeetCode',
        timeTaken: 32,
        notes: 'Three pointers backwards allocation.',
        date: '1 hour ago',
        language: 'Python 3',
        status: 'Solved'
      },
      {
        id: 'mock-3',
        name: '322. Coin Change',
        difficulty: 'Medium',
        platform: 'LeetCode',
        timeTaken: 24,
        notes: 'DP bottom up knapsack derivative.',
        date: 'Yesterday',
        language: 'C++',
        status: 'Solved'
      }
    ];

    // Combine user logs + mock logs to populate the feed beautifully
    const list: any[] = [];
    
    // Add real database solved logs if they exist
    problemLogs.forEach(log => {
      list.push({
        id: log.id,
        name: log.name,
        difficulty: log.difficulty,
        platform: log.platform,
        timeTaken: log.timeTaken,
        notes: log.notes,
        date: log.date,
        language: log.platform === 'Codeforces' ? 'Gnu C++' : 'Python 3',
        status: log.status
      });
    });

    // Make sure we have the design model rows
    mockFeed.forEach(mockItem => {
      if (!list.some(item => item.name.includes(mockItem.name.split('.')[1]?.trim() || mockItem.name))) {
        list.push(mockItem);
      }
    });

    return list.slice(0, 5); // Return top 5 logs
  };

  const finalFeed = mergeProblemLogs();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* 1. Header with User greet & System status matching DevOS UI */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-5 border-b border-gray-150 dark:border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-sans font-black text-gray-900 dark:text-white tracking-tight">
            Good morning, Arun
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-mono text-emerald-500 font-extrabold tracking-widest flex items-center gap-1.5 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online & Ready
            </span>
          </div>
        </div>

        {/* Middle terminal search console bar */}
        <div className="flex-1 max-w-md px-4 py-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-150 dark:border-white/5 flex items-center gap-3">
          <span className="text-gray-400 dark:text-zinc-500 text-xs shrink-0">🔍</span>
          <input
            type="text"
            placeholder="Search system terminal..."
            className="bg-transparent border-none outline-none text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 w-full font-mono"
            disabled
          />
        </div>

        {/* Right Admin console items */}
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <div className="flex items-center gap-2 bg-transparent">
            <button className="p-2 text-gray-500 hover:text-gray-950 dark:text-zinc-400 dark:hover:text-white bg-white dark:bg-white/5 rounded-xl border border-gray-150 dark:border-white/5 transition-all relative">
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
              <Bell size={15} />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-950 dark:text-zinc-400 dark:hover:text-white bg-white dark:bg-white/5 rounded-xl border border-gray-150 dark:border-white/5 transition-all">
              <Terminal size={15} />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-950 dark:text-zinc-400 dark:hover:text-white bg-white dark:bg-white/5 rounded-xl border border-gray-150 dark:border-white/5 transition-all">
              <Grid size={15} />
            </button>
          </div>

          <div className="h-8 w-[1px] bg-gray-150 dark:bg-white/10 hidden sm:block" />

          {/* Connected Identity */}
          <div className="flex items-center gap-2.5 bg-transparent">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold leading-tight text-gray-950 dark:text-white tracking-tight">Arun Dev</p>
              <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-wider mt-0.5">Admin</p>
            </div>
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120"
              alt="Arun Dev Admin Avatar"
              className="w-9 h-9 rounded-full object-cover border-2 border-blue-600 shadow-md"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>

      {/* 2. Four Grid Stats Section inspired directly from high-end mockup */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Solved Card */}
        <div className="p-5 bg-white dark:bg-sleek-card border border-gray-150 dark:border-white/10 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[140px] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-sans font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest">
              Total Solved
            </span>
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-500 border border-teal-500/20">
              <ShieldCheck size={15} />
            </div>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-3xl font-sans font-extrabold text-gray-900 dark:text-white">
                {matchedTotalSolved}
              </span>
              <span className="text-sm font-sans font-medium text-gray-400 dark:text-zinc-500">
                / 2500
              </span>
            </div>
          </div>
          {/* Progress bar and completed indicator tag */}
          <div className="space-y-1 bg-transparent">
            <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (matchedTotalSolved / 2500) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-blue-500 font-mono font-bold tracking-tight">
              {((matchedTotalSolved / 2500) * 100).toFixed(1)}% Completed
            </p>
          </div>
        </div>

        {/* Contest Best Card */}
        <div className="p-5 bg-white dark:bg-sleek-card border border-gray-150 dark:border-white/10 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[140px] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-sans font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest">
              Contest Best
            </span>
            <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
              <Award size={15} />
            </div>
          </div>
          <div className="my-2 select-none">
            <span className="text-3xl font-sans font-extrabold text-gray-900 dark:text-white tracking-tight">
              {bestRating}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 dark:text-white/30 flex items-center gap-1.5 font-sans mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            LeetCode / Codeforces peak
          </p>
        </div>

        {/* GitHub Commits Card with small +12% bump ticker */}
        <div className="p-5 bg-white dark:bg-sleek-card border border-gray-150 dark:border-white/10 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[140px] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-sans font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest">
              Github Commits
            </span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6" /></svg>
            </div>
          </div>
          <div className="my-2 flex items-center gap-2">
            <span className="text-3xl font-sans font-extrabold text-gray-900 dark:text-white tracking-tight">
              {ghContributions}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/15">
              +12% ↑
            </span>
          </div>
          <p className="text-[10px] text-gray-500 dark:text-white/30 font-sans mt-1">
            active this week
          </p>
        </div>

        {/* Next Contests Scheduled Card */}
        <div className="p-5 bg-white dark:bg-sleek-card border border-gray-150 dark:border-white/10 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[140px] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-sans font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest">
              Next Contests
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <Calendar size={15} />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-sans font-extrabold text-gray-900 dark:text-white tracking-tight">
              {upcomingContestCount}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 dark:text-white/30 font-sans mt-1">
            registered runs this month
          </p>
        </div>

      </div>

      {/* 3. Mid Grid Section representing Weekly Chart progress and Platform Donut breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Activity Progress Bars */}
        <div className="lg:col-span-2 min-w-0 p-5 bg-white dark:bg-sleek-card border border-gray-150 dark:border-white/10 rounded-2xl relative space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-[3px] h-3.5 bg-blue-500" />
              <h2 className="text-xs font-sans font-extrabold text-gray-900 dark:text-white uppercase tracking-widest">
                Weekly Activity
              </h2>
            </div>

            {/* Simple switch triggers */}
            <div className="flex p-0.5 bg-gray-150 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-lg text-[9px] font-mono font-bold uppercase select-none">
              <button 
                onClick={() => setActiveTab('weekly')}
                className={`px-2.5 py-1 rounded-md transition-all ${activeTab === 'weekly' ? 'bg-white dark:bg-white/10 text-gray-950 dark:text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-800'}`}
              >
                Weekly
              </button>
              <button 
                onClick={() => setActiveTab('monthly')}
                className={`px-2.5 py-1 rounded-md transition-all ${activeTab === 'monthly' ? 'bg-white dark:bg-white/10 text-gray-950 dark:text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-800'}`}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* Bar Diagram with Glow effects */}
          <div className="relative pt-6 min-h-[175px] flex flex-col justify-between">
            <div className="grid grid-cols-7 gap-2 sm:gap-3 md:gap-4 items-end flex-1 h-[140px] px-1 sm:px-2 relative" id="weekly-bars-diagram">
              
              {/* Overlay floating micro tooltip */}
              {hoveredBar && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-zinc-950/95 border border-white/10 text-white rounded-lg p-2.5 text-[10px] font-sans shadow-xl z-20 flex flex-col gap-0.5">
                  <span className="font-bold text-blue-400">{hoveredBar.day} Statistics</span>
                  <span>Problems solved: <strong>{hoveredBar.solved}</strong></span>
                  <span>Terminal commits: <strong>{hoveredBar.commits}</strong></span>
                </div>
              )}

              {weeklyActivityData.map((d) => {
                const heightPct = Math.max(10, (d.commits / getMaxCommits) * 100);
                return (
                  <div 
                    key={d.day}
                    className="flex flex-col items-center group cursor-pointer relative"
                    onMouseEnter={() => setHoveredBar(d)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {/* Bar graphic */}
                    <div 
                      className="w-full sm:w-10 rounded-t-lg bg-gradient-to-t from-blue-600 to-indigo-500 dark:from-blue-600/60 dark:to-cyan-400/80 hover:scale-[1.03] hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
                      style={{ height: `${heightPct}px` }}
                    />
                    
                    {/* Label */}
                    <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase mt-2.5">
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Platform breakdown card with custom SVG donut visualization */}
        <div className="p-5 bg-white dark:bg-sleek-card border border-gray-150 dark:border-white/10 rounded-2xl space-y-4 shadow-sm flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-[3px] h-3.5 bg-blue-500" />
              <h2 className="text-xs font-sans font-extrabold text-gray-900 dark:text-white uppercase tracking-widest">
                Platform Breakdown
              </h2>
            </div>
          </div>

          <div className="relative flex items-center justify-center p-2 bg-transparent select-none">
            {/* Donut ring SVG representing the gauge */}
            <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle track */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#1f2937" strokeWidth="11" strokeOpacity="0.4" />
              
              {/* LeetCode Segments (Blue) */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#2563eb" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={`${251.2 * (1 - lcSolved / totalWeight)}`} strokeLinecap="round" className="transition-all duration-700" />
              
              {/* Codeforces Segment (Teal) */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#06b6d4" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={`${251.2 * (1 - cfSolved / totalWeight)}`} strokeLinecap="round" className="opacity-70 transition-all duration-700" />
            </svg>

            {/* Donut Center total solved text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400 dark:text-zinc-500">Total</span>
              <strong className="text-2xl font-sans font-extrabold text-gray-950 dark:text-white mt-0.5">{matchedTotalSolved}</strong>
            </div>
          </div>

          {/* Color legend metrics directly below */}
          <div className="space-y-2 bg-transparent pt-3 pb-1 border-t border-gray-150 dark:border-white/5 text-[11px] font-sans text-gray-700 dark:text-slate-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>LeetCode</span>
              </div>
              <strong className="font-mono text-xs text-gray-900 dark:text-white">{lcSolved}</strong>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Codeforces</span>
              </div>
              <strong className="font-mono text-xs text-gray-900 dark:text-white">{cfSolved}</strong>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>GitHub / Others</span>
              </div>
              <strong className="font-mono text-xs text-gray-900 dark:text-white">131</strong>
            </div>
          </div>
        </div>

      </div>

      {/* 4. Bottom Section: RECENT SUBMISSIONS table */}
      <div className="p-5 bg-white dark:bg-sleek-card border border-gray-150 dark:border-white/10 rounded-2xl relative space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-150 dark:border-white/10 pb-3">
          <h2 className="text-xs font-sans font-extrabold text-gray-900 dark:text-white uppercase tracking-widest">
            Recent Submissions
          </h2>
          <button 
            onClick={() => setTab('tracker')} 
            className="text-[10px] font-mono uppercase font-bold text-blue-500 hover:text-blue-600 hover:underline tracking-wider select-none shrink-0"
          >
            View All Logs
          </button>
        </div>

        {/* Responsive Table Grid layout */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-widest border-b border-gray-100 dark:border-white/5 bg-transparent">
                <th className="pb-3 pt-1 font-semibold">Problem Title</th>
                <th className="pb-3 pt-1 font-semibold">Difficulty</th>
                <th className="pb-3 pt-1 font-semibold">Language</th>
                <th className="pb-3 pt-1 font-semibold">Runtime</th>
                <th className="pb-3 pt-1 font-semibold">Status</th>
                <th className="pb-3 pt-1 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-sans text-xs text-gray-800 dark:text-white/80">
              {finalFeed.map((feedItem) => {
                
                // Difficulty badges matching design
                let diffBadge = (
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold text-blue-500 bg-blue-500/10 border border-blue-500/15 uppercase">
                    Easy
                  </span>
                );
                if (feedItem.difficulty === 'Medium') {
                  diffBadge = (
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold text-amber-500 bg-amber-500/10 border border-amber-500/15 uppercase">
                      Medium
                    </span>
                  );
                } else if (feedItem.difficulty === 'Hard') {
                  diffBadge = (
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold text-red-500 bg-red-500/10 border border-red-500/15 uppercase">
                      Hard
                    </span>
                  );
                }

                // Simulated runtime
                const runtimeStr = feedItem.timeTaken ? `${feedItem.timeTaken}ms` : '16ms';

                return (
                  <tr key={feedItem.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3.5 pr-3 font-semibold text-gray-950 dark:text-white">
                      {feedItem.name}
                    </td>
                    <td className="py-3.5 pr-3">
                      {diffBadge}
                    </td>
                    <td className="py-3.5 pr-3 font-mono text-zinc-500 dark:text-zinc-400">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-gray-100 dark:bg-white/5 border border-gray-150 dark:border-white/5 text-[10px]">
                        <Code size={11} className="text-zinc-400" />
                        {feedItem.language || 'C++'}
                      </span>
                    </td>
                    <td className="py-3.5 pr-3 font-mono text-zinc-500 dark:text-zinc-400">
                      {runtimeStr}
                    </td>
                    <td className="py-3.5 pr-3">
                      <div className="flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400 font-extrabold font-sans">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Accepted
                      </div>
                    </td>
                    <td className="py-3.5 text-right font-mono text-zinc-500 dark:text-zinc-400">
                      {feedItem.date}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </motion.div>
  );
}
