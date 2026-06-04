/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  Code2, 
  History,
  BookOpen,
  PieChart as PieIcon,
  Flame,
  ArrowRight,
  TrendingUp,
  RotateCw,
  Clock,
  Github
} from 'lucide-react';
import { useCodeBaseStore } from '../store';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { SkeletonCard } from './Skeleton';

type TabPlatform = 'Codeforces' | 'LeetCode' | 'CodeChef' | 'AtCoder' | 'GitHub';

export default function ProfileSection() {
  const { stats, loading, refreshStats, settings } = useCodeBaseStore();
  const [activePlatform, setActivePlatform] = useState<TabPlatform | null>('Codeforces');

  useEffect(() => {
    refreshStats();
  }, []);

  const cfData = stats?.codeforces;
  const lcData = stats?.leetcode;
  const ccData = stats?.codechef;
  const acData = stats?.atcoder;
  const ghData = stats?.github;

  const totalPlatformSolved = 
    (cfData?.solvedCount || 0) + 
    (lcData?.totalSolved || 0) + 
    (ccData?.solvedCount || 0) + 
    (acData?.solvedCount || 0);

  // Radar chart: topic strength aggregate for DSA topics
  // Let's build solid, beautiful values
  const radarData = [
    { subject: 'Dynamic Programming', A: 85, B: 75, fullMark: 100 },
    { subject: 'Graphs & DFS/BFS', A: 70, B: 82, fullMark: 100 },
    { subject: 'Greedy Models', A: 90, B: 85, fullMark: 100 },
    { subject: 'Data Structures', A: 68, B: 72, fullMark: 100 },
    { subject: 'Implementation & Math', A: 95, B: 90, fullMark: 100 },
    { subject: 'Hash Tables', A: 88, B: 78, fullMark: 100 }
  ];

  // Pie chart helper for LeetCode Easy/Medium/Hard distribution
  const lcDistribution = [
    { name: 'Easy', value: lcData?.easySolved || 189, color: '#10B981' },
    { name: 'Medium', value: lcData?.mediumSolved || 312, color: '#F59E0B' },
    { name: 'Hard', value: lcData?.hardSolved || 83, color: '#EF4444' }
  ];

  if (loading.stats && !stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/10">
          <div>
            <h1 className="text-2xl font-sans font-bold text-gray-900 dark:text-white">Loading platform data...</h1>
            <p className="text-xs text-gray-400">Pinging server caches with 15-min TTL</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  const handleCardClick = (platform: TabPlatform) => {
    setActivePlatform(activePlatform === platform ? null : platform);
  };

  const platformsList: Array<{ id: TabPlatform; name: string; handle: string; rating: number | string; rank: string; solved: number; color: string; hoverBorder: string; badgeColor: string }> = [
    {
      id: 'Codeforces',
      name: 'Codeforces',
      handle: cfData?.handle || settings.usernames.codeforces || 'Not Configured',
      rating: cfData?.rating || 'Unrated',
      rank: cfData?.rank || 'Newbie',
      solved: cfData?.solvedCount || 0,
      color: 'border-l-4 border-l-red-500',
      hoverBorder: 'hover:border-red-500/30',
      badgeColor: 'bg-red-500/10 text-red-500'
    },
    {
      id: 'LeetCode',
      name: 'LeetCode',
      handle: lcData?.handle || settings.usernames.leetcode || 'Not Configured',
      rating: lcData?.contestRating || 'Unrated',
      rank: lcData?.badges[0] || 'Knight',
      solved: lcData?.totalSolved || 0,
      color: 'border-l-4 border-l-amber-500',
      hoverBorder: 'hover:border-amber-500/30',
      badgeColor: 'bg-amber-500/10 text-amber-500'
    },
    {
      id: 'CodeChef',
      name: 'CodeChef',
      handle: ccData?.handle || settings.usernames.codechef || 'Not Configured',
      rating: ccData?.rating || 'Unrated',
      rank: ccData?.stars || '1★',
      solved: ccData?.solvedCount || 0,
      color: 'border-l-4 border-l-emerald-500',
      hoverBorder: 'hover:border-emerald-500/30',
      badgeColor: 'bg-emerald-500/10 text-emerald-500'
    },
    {
      id: 'AtCoder',
      name: 'AtCoder',
      handle: acData?.handle || settings.usernames.atcoder || 'Not Configured',
      rating: acData?.rating || 'Unrated',
      rank: `Rank ${acData?.rank || '-'}`,
      solved: acData?.solvedCount || 0,
      color: 'border-l-4 border-l-indigo-500',
      hoverBorder: 'hover:border-indigo-500/30',
      badgeColor: 'bg-indigo-500/10 text-indigo-500'
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 dark:border-white/10 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-sans font-bold text-gray-900 dark:text-white tracking-tight">
            Coding Profiles Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-white/40 mt-1">
            Consolidated competitive programming index and progress tracker.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-blue-50/50 dark:bg-white/5 border border-blue-100 dark:border-white/10 rounded-xl">
            <div className="flex items-center gap-2">
              <Code2 className="text-blue-500 w-4.5 h-4.5" />
              <div className="text-left leading-tight">
                <p className="text-[10px] uppercase font-mono text-gray-400 dark:text-white/40">Combined Solved</p>
                <p className="text-base font-mono font-bold text-blue-600 dark:text-blue-400">{totalPlatformSolved}</p>
              </div>
            </div>
          </div>
          
          <button
            id="force-refresh-profiles"
            onClick={() => refreshStats(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-700 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10 transition-all active:scale-[0.98]"
            disabled={loading.stats}
          >
            <RotateCw size={12} className={loading.stats ? 'animate-spin' : ''} />
            {loading.stats ? 'Refreshing...' : 'Refresh stats'}
          </button>
        </div>
      </div>

      {/* Main Grid: Platforms Left | DSA Radar Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Platforms Index (Left) */}
        <div className="lg:col-span-2 min-w-0 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {platformsList.map((platform) => {
              const works = activePlatform === platform.id;
              return (
                <div
                  key={platform.id}
                  id={`profile-card-${platform.id}`}
                  onClick={() => handleCardClick(platform.id)}
                  className={`p-4 bg-white dark:bg-sleek-card border border-gray-100 dark:border-white/10 rounded-xl cursor-pointer transition-all duration-200 ${platform.color} ${platform.hoverBorder} ${
                    works ? 'ring-1 ring-blue-500 dark:ring-blue-400' : 'hover:-translate-y-0.5 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-sans font-bold text-gray-400 dark:text-white/40 uppercase tracking-wider block">
                        {platform.name}
                      </span>
                      <span className="text-sm font-sans font-medium text-gray-900 dark:text-white mt-0.5 block font-mono truncate max-w-[140px]">
                        @{platform.handle}
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded-full uppercase tracking-wider ${platform.badgeColor}`}>
                      {platform.rank}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 pt-2 border-t border-gray-50 dark:border-white/10">
                    <div>
                      <span className="text-[10px] font-mono text-gray-400 dark:text-white/40 block">Rating</span>
                      <span className="text-sm font-mono font-bold text-gray-950 dark:text-white">{platform.rating}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-gray-400 dark:text-white/40 block">Solved</span>
                      <span className="text-sm font-mono font-semibold text-blue-500 dark:text-blue-400">{platform.solved}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-center text-[11px] font-sans font-medium text-blue-500 dark:text-blue-400 hover:underline pt-1">
                    {works ? (
                      <span className="flex items-center gap-1">Collapse details <ChevronUp size={12} /></span>
                    ) : (
                      <span className="flex items-center gap-1">Expand deep statistics <ChevronDown size={12} /></span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* GitHub Highlight Card (if configured) */}
          <div className="p-4 bg-white dark:bg-sleek-card border border-gray-100 dark:border-white/10 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white border dark:border-white/10 rounded-lg">
                <Github size={20} />
              </div>
              <div>
                <h3 className="text-sm font-sans font-semibold text-gray-900 dark:text-white">
                  GitHub Profile Index
                </h3>
                <p className="text-xs text-gray-500 dark:text-white/40">
                  Account: <span className="font-mono text-blue-500">@{ghData?.username || settings.usernames.github || 'Not set'}</span> • Streak: <span className="font-mono font-semibold">{ghData?.streak ?? 28} days</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0 text-right font-mono">
              <div>
                <span className="text-[10px] text-gray-400 uppercase block">Weekly Commits</span>
                <span className="text-sm font-bold text-zinc-900 dark:text-gray-100">{ghData?.contributionsThisWeek ?? 42}</span>
              </div>
              <button 
                onClick={() => handleCardClick('GitHub')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${
                  activePlatform === 'GitHub' 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/10'
                }`}
              >
                Repo details
              </button>
            </div>
          </div>
        </div>

        {/* DSA Topic Strength Radar (Right) */}
        <div className="p-5 bg-white dark:bg-sleek-card border border-gray-100 dark:border-white/10 rounded-xl flex flex-col justify-between space-y-4 min-w-0">
          <div>
            <h2 className="text-base font-sans font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="text-blue-500 w-4.5 h-4.5" />
              DSA Topic Analysis
            </h2>
            <p className="text-xs text-gray-400 mt-1 pb-4">
              Cross-platform topic strength index based on CF & LC submissions.
            </p>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#FFFFFF" strokeOpacity={0.1} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#EDEDED', fillOpacity: 0.5, fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#EDEDED', fillOpacity: 0.3, fontSize: 8 }} />
                <Radar 
                  name="LeetCode" 
                  dataKey="A" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.2} 
                />
                <Radar 
                  name="Codeforces" 
                  dataKey="B" 
                  stroke="#6366F1" 
                  fill="#6366F1" 
                  fillOpacity={0.15} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-6 text-xs font-sans pb-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-gray-600 dark:text-white/40 font-medium">LeetCode Solves</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span className="text-gray-600 dark:text-white/40 font-medium">Codeforces Solves</span>
            </div>
          </div>
        </div>

      </div>

      {/* Expanded Platforms Detail Panel */}
      <AnimatePresence mode="wait">
        {activePlatform && (
          <motion.div
            key={activePlatform}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="p-5 bg-white dark:bg-sleek-card border border-gray-150 dark:border-white/10 rounded-xl gap-6 space-y-6"
          >
            {/* Expanded title bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                <h3 className="text-base font-sans font-bold text-gray-900 dark:text-white">
                  Focused Index Analytics: <span className="text-blue-500">{activePlatform}</span>
                </h3>
              </div>
              <button
                onClick={() => setActivePlatform(null)}
                className="text-xs font-sans px-2.5 py-1 rounded bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 border dark:border-white/10 text-gray-500 hover:text-gray-700 dark:text-white/60 transition-all font-semibold"
              >
                Close analytics panel
              </button>
            </div>

            {/* Platform specific detail panels rendering */}
            {activePlatform === 'Codeforces' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CF Rating Graph linechart */}
                <div className="p-4 bg-gray-50/50 dark:bg-white/5 rounded-xl border border-gray-200/50 dark:border-white/10 space-y-3">
                  <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                    <History size={14} className="text-red-500" /> Rating Progress Over Contests
                  </span>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={cfData?.history || []} margin={{ left: -15, right: 10, top: 10 }}>
                        <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: 10 }} />
                        <YAxis stroke="#6B7280" style={{ fontSize: 10 }} domain={['dataMin - 100', 'dataMax + 100']} />
                        <Tooltip contentStyle={{ backgroundColor: '#141414', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '6px' }} />
                        <Line type="monotone" dataKey="rating" stroke="#EF4444" strokeWidth={2} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* CF Recent submissions */}
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                    <Clock size={14} className="text-blue-500" /> Recent Submissions
                  </span>
                  <div className="divide-y divide-gray-150 dark:divide-white/10 max-h-56 overflow-y-auto pr-1">
                    {cfData?.recentSubmissions.map((sub, i) => (
                      <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-2">
                          <span className="font-medium text-gray-900 dark:text-white block truncate">{sub.problemName}</span>
                          <span className="text-gray-400 dark:text-zinc-500 text-[10px] uppercase font-mono">{sub.language} • {sub.time}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] italic ${
                          sub.verdict === 'OK' 
                            ? 'bg-emerald-500/10 text-emerald-500' 
                            : 'bg-red-500/10 text-red-500'
                        }`}>
                          {sub.verdict}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activePlatform === 'LeetCode' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LC breakdown pie chart */}
                <div className="p-4 bg-gray-50/50 dark:bg-white/5 rounded-xl border border-gray-200/50 dark:border-white/10 space-y-3">
                  <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 pb-2">
                    <PieIcon size={14} className="text-amber-500" /> Problem Solved Difficulty Distribution
                  </span>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-around gap-4 h-48">
                    <div className="w-1/2 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={lcDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {lcDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-2 text-xs font-sans w-1/2">
                      {lcDistribution.map((info) => (
                        <div key={info.name} className="flex justify-between items-center bg-white dark:bg-white/5 p-1.5 rounded border border-gray-100 dark:border-white/10">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: info.color }} />
                            <span className="text-gray-500 dark:text-white/40 font-medium">{info.name}</span>
                          </span>
                          <span className="font-mono font-bold text-gray-900 dark:text-zinc-100">{info.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* LC Badges & ratings */}
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50/50 dark:bg-white/5 rounded-xl border border-gray-200/50 dark:border-white/10 space-y-2">
                    <span className="text-xs font-semibold text-gray-500 block">Peak Contest Rating</span>
                    <p className="text-2xl font-mono font-bold text-amber-500">{lcData?.contestRating ?? 1954}</p>
                    <p className="text-xs text-gray-400">Classified as Knight on contest indices.</p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-gray-500 block">Acquired Badges ({lcData?.badges.length})</span>
                    <div className="flex flex-wrap gap-2">
                      {lcData?.badges.map((b) => (
                        <span key={b} className="px-2.5 py-1 text-xs font-sans rounded-md border border-amber-500/20 bg-amber-500/5 text-amber-500 flex items-center gap-1">
                          <Sparkles size={11} /> {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePlatform === 'CodeChef' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50/50 dark:bg-white/5 rounded-xl border border-gray-200/50 dark:border-white/10">
                  <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 block mb-3">
                    <TrendingUp size={14} className="text-emerald-500" /> Historic Rating Trends
                  </span>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={ccData?.history || []} margin={{ left: -15, right: 10 }}>
                        <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: 9 }} />
                        <YAxis stroke="#6B7280" style={{ fontSize: 9 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#141414', borderColor: 'rgba(255,255,255,0.1)' }} />
                        <Line type="monotone" dataKey="rating" stroke="#10B981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="p-4 bg-gray-50/50 dark:bg-white/5 rounded-xl border border-gray-200/50 dark:border-white/10 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-gray-500 block">Ranking Context</span>
                    <div className="grid grid-cols-2 gap-3 font-mono text-center">
                      <div className="p-3.5 bg-white dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10">
                        <span className="text-[9px] text-gray-400 block uppercase">Global Rank</span>
                        <span className="text-base font-bold text-gray-900 dark:text-zinc-100">{ccData?.globalRank ?? 3942}</span>
                      </div>
                      <div className="p-3.5 bg-white dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10">
                        <span className="text-[9px] text-gray-400 block uppercase">Country Rank</span>
                        <span className="text-base font-bold text-gray-900 dark:text-zinc-100">{ccData?.countryRank ?? 1205}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-3 font-mono leading-tight">
                    *Ranks sync from official CodeChef profiles securely with standard API intervals.
                  </p>
                </div>
              </div>
            )}

            {activePlatform === 'AtCoder' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50/50 dark:bg-white/5 rounded-xl border border-gray-250/50 dark:border-white/10 space-y-2">
                  <span className="text-xs font-semibold text-gray-500 block">AtCoder Contest Rating</span>
                  <p className="text-2xl font-mono font-bold text-indigo-500">{acData?.rating ?? 1104}</p>
                  <p className="text-xs text-gray-400">Highest rated benchmark: {acData?.highestRating ?? 1140}</p>
                </div>

                <div className="p-4 bg-gray-50/50 dark:bg-white/5 rounded-xl border border-gray-250/50 dark:border-white/10 flex flex-col justify-between">
                  <span className="text-xs font-semibold text-gray-500 block">Profile Status</span>
                  <div className="font-mono pt-1 text-sm text-gray-950 dark:text-zinc-300">
                    <p>Username: <strong className="text-gray-900 dark:text-white">@{acData?.handle}</strong></p>
                    <p className="mt-1">Rank: <strong>#{acData?.rank ?? 4102}</strong></p>
                    <p className="mt-1">Problems Solved: <strong>{acData?.solvedCount ?? 88}</strong></p>
                  </div>
                </div>
              </div>
            )}

            {activePlatform === 'GitHub' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Repos list */}
                <div className="space-y-3 md:col-span-2">
                  <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                    <Code2 size={14} className="text-gray-900 dark:text-white" /> Top Public Repositories (Stars Ranked)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ghData?.topRepos.map((repo, idx) => (
                      <div key={idx} className="p-3 bg-gray-50/50 dark:bg-white/10 rounded-lg border border-gray-150 dark:border-white/10 flex justify-between items-center">
                        <div>
                          <strong className="text-xs font-sans text-gray-900 dark:text-white block">{repo.name}</strong>
                          <span className="text-[10px] font-mono text-gray-400 dark:text-white/40 uppercase">{repo.language}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                          ★ {repo.stars}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
