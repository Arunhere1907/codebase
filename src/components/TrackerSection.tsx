/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Filter, 
  CheckCircle, 
  HelpCircle, 
  ArrowLeftRight, 
  Calendar,
  AlertCircle,
  Tag,
  Search,
  BookOpen,
  TrendingUp,
  Award,
  Zap,
  Edit2
} from 'lucide-react';
import { useCodeBaseStore } from '../store';
import { ProblemLog, Platform, Difficulty, ProblemStatus } from '../types';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, parseISO, isWithinInterval } from 'date-fns';

export default function TrackerSection() {
  const { problemLogs, addProblemLog, deleteProblemLog, updateProblemLog } = useCodeBaseStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<Platform | 'All'>('All');
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<ProblemStatus | 'All'>('All');
  const [filterTag, setFilterTag] = useState<string>('All');

  // New problem log form state
  const [fieldName, setFieldName] = useState('');
  const [fieldPlatform, setFieldPlatform] = useState<Platform>('LeetCode');
  const [fieldDifficulty, setFieldDifficulty] = useState<Difficulty>('Medium');
  const [fieldStatus, setFieldStatus] = useState<ProblemStatus>('Solved');
  const [fieldTimeTaken, setFieldTimeTaken] = useState(30);
  const [fieldTags, setFieldTags] = useState('');
  const [fieldNotes, setFieldNotes] = useState('');
  const [fieldDate, setFieldDate] = useState('2026-06-04');

  // Available pre-set tags for selection
  const standardTags = ['Dynamic Programming', 'Graphs', 'Trees', 'Implementation', 'Math', 'Greedy', 'Segment Tree', 'Strings', 'Hash Table', 'Two Pointers', 'Binary Search'];

  // Track edits
  const [editLogId, setEditLogId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldName.trim()) return;

    const tagsArray = fieldTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const logPayload = {
      name: fieldName,
      platform: fieldPlatform,
      difficulty: fieldDifficulty,
      topicTags: tagsArray.length > 0 ? tagsArray : ['General'],
      status: fieldStatus,
      timeTaken: Number(fieldTimeTaken) || 30,
      notes: fieldNotes,
      date: fieldDate || '2026-06-04'
    };

    if (editLogId) {
      updateProblemLog(editLogId, logPayload);
      setEditLogId(null);
    } else {
      addProblemLog(logPayload);
    }

    // Reset Form & Close Modal
    setFieldName('');
    setFieldTags('');
    setFieldNotes('');
    setIsModalOpen(false);
  };

  const handleEditClick = (log: ProblemLog) => {
    setEditLogId(log.id);
    setFieldName(log.name);
    setFieldPlatform(log.platform);
    setFieldDifficulty(log.difficulty);
    setFieldStatus(log.status);
    setFieldTimeTaken(log.timeTaken);
    setFieldTags(log.topicTags.join(', '));
    setFieldNotes(log.notes);
    setFieldDate(log.date);
    setIsModalOpen(true);
  };

  const handleAddNewClick = () => {
    setEditLogId(null);
    setFieldName('');
    setFieldPlatform('LeetCode');
    setFieldDifficulty('Medium');
    setFieldStatus('Solved');
    setFieldTimeTaken(30);
    setFieldTags('');
    setFieldNotes('');
    setFieldDate('2026-06-04');
    setIsModalOpen(true);
  };

  // Extract all unique tags across logs for filtering
  const allUniqueTags = useMemo(() => {
    const tags = new Set<string>();
    problemLogs.forEach(log => {
      log.topicTags.forEach(t => tags.add(t));
    });
    return Array.from(tags);
  }, [problemLogs]);

  // Combined filters application
  const filteredLogs = useMemo(() => {
    return problemLogs.filter((log) => {
      const matchSearch = log.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.notes.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPlatform = filterPlatform === 'All' || log.platform === filterPlatform;
      const matchDifficulty = filterDifficulty === 'All' || log.difficulty === filterDifficulty;
      const matchStatus = filterStatus === 'All' || log.status === filterStatus;
      const matchTag = filterTag === 'All' || log.topicTags.includes(filterTag);

      return matchSearch && matchPlatform && matchDifficulty && matchStatus && matchTag;
    });
  }, [problemLogs, searchQuery, filterPlatform, filterDifficulty, filterStatus, filterTag]);

  // Compute stats metrics
  const today = new Date('2026-06-04T05:02:44Z');
  const startOfThisWeek = startOfWeek(today);
  const endOfThisWeek = endOfWeek(today);
  const startOfThisMonth = startOfMonth(today);

  const trackerMeta = useMemo(() => {
    let weekCount = 0;
    let monthCount = 0;
    let totalMinutes = 0;
    const difficulties: Record<Difficulty, number> = { Easy: 0, Medium: 0, Hard: 0 };
    const tagFrequencies: Record<string, number> = {};

    problemLogs.forEach((log) => {
      const logDate = parseISO(log.date);
      
      // Calculate times
      if (isWithinInterval(logDate, { start: startOfThisWeek, end: endOfThisWeek })) {
        weekCount++;
      }
      if (logDate >= startOfThisMonth) {
        monthCount++;
      }

      totalMinutes += log.timeTaken;
      difficulties[log.difficulty]++;

      log.topicTags.forEach((t) => {
        tagFrequencies[t] = (tagFrequencies[t] || 0) + 1;
      });
    });

    // Most practiced topic
    let topTopic = 'N/A';
    let topTopicFreq = 0;
    Object.entries(tagFrequencies).forEach(([topic, count]) => {
      if (count > topTopicFreq) {
        topTopic = topic;
        topTopicFreq = count;
      }
    });

    const averageTime = problemLogs.length > 0 ? Math.round(totalMinutes / problemLogs.length) : 0;

    return {
      weekCount,
      monthCount,
      totalCount: problemLogs.length,
      averageTime,
      topTopic,
      difficulties
    };
  }, [problemLogs]);

  // Revisit queue (problems flagged revisit)
  const revisitQueue = useMemo(() => {
    return problemLogs
      .filter((log) => log.status === 'Revisit')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [problemLogs]);

  // Topic Heatmap data aggregates
  const dsaHeatmap = [
    { name: 'Dynamic Programming', count: problemLogs.filter(p => p.topicTags.includes('Dynamic Programming')).length },
    { name: 'Graphs', count: problemLogs.filter(p => p.topicTags.includes('Graphs') || p.topicTags.includes('Graphs & DFS/BFS')).length },
    { name: 'Trees', count: problemLogs.filter(p => p.topicTags.includes('Trees') || p.topicTags.includes('Segment Tree')).length },
    { name: 'Strings', count: problemLogs.filter(p => p.topicTags.includes('Strings')).length },
    { name: 'Implementation', count: problemLogs.filter(p => p.topicTags.includes('Implementation')).length },
    { name: 'Math & Bitwise', count: problemLogs.filter(p => p.topicTags.includes('Math') || p.topicTags.includes('Bitwise')).length },
    { name: 'Greedy', count: problemLogs.filter(p => p.topicTags.includes('Greedy')).length },
    { name: 'Binary Search', count: problemLogs.filter(p => p.topicTags.includes('Binary Search')).length },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Header index */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 dark:border-white/10 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-sans font-bold text-gray-900 dark:text-white tracking-tight">
            CP Tracker & Problem Log
          </h1>
          <p className="text-sm text-gray-500 dark:text-white/40 mt-1">
            Log your daily practice solves, analyze weaknesses, and review flagged questions.
          </p>
        </div>

        <button
          id="add-log-btn"
          onClick={handleAddNewClick}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-sans text-xs font-semibold rounded-lg shadow-sm transition-all active:scale-[0.97]"
        >
          <Plus size={16} /> Log New Solve
        </button>
      </div>

      {/* Stats row KPI overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 bg-white dark:bg-sleek-card border border-gray-100 dark:border-white/10 rounded-xl">
          <span className="text-[10px] font-mono text-gray-400 dark:text-white/40 uppercase tracking-wider block">Solved This Week</span>
          <span className="text-2xl font-mono font-bold text-gray-900 dark:text-white block mt-1">{trackerMeta.weekCount}</span>
        </div>
        <div className="p-4 bg-white dark:bg-sleek-card border border-gray-100 dark:border-white/10 rounded-xl">
          <span className="text-[10px] font-mono text-gray-400 dark:text-white/40 uppercase tracking-wider block">Logged This Month</span>
          <span className="text-2xl font-mono font-bold text-gray-900 dark:text-white block mt-1">{trackerMeta.monthCount}</span>
        </div>
        <div className="p-4 bg-white dark:bg-sleek-card border border-gray-100 dark:border-white/10 rounded-xl">
          <span className="text-[10px] font-mono text-gray-400 dark:text-white/40 uppercase tracking-wider block">Total Logs</span>
          <span className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400 block mt-1">{trackerMeta.totalCount}</span>
        </div>
        <div className="p-4 bg-white dark:bg-sleek-card border border-gray-100 dark:border-white/10 rounded-xl">
          <span className="text-[10px] font-mono text-gray-400 dark:text-white/40 uppercase tracking-wider block">Avg Time Logged</span>
          <span className="text-2xl font-mono font-bold text-gray-900 dark:text-white block mt-1">{trackerMeta.averageTime} m</span>
        </div>
        <div className="p-4 bg-white dark:bg-sleek-card border border-gray-100 dark:border-white/10 rounded-xl">
          <span className="text-[10px] font-mono text-gray-400 dark:text-white/40 uppercase tracking-wider block">Top Practiced Tag</span>
          <span className="text-xs font-sans font-semibold text-teal-600 dark:text-teal-400 block mt-2.5 truncate">{trackerMeta.topTopic}</span>
        </div>
      </div>

      {/* Grid: Topic Heatmap & Revisit Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* DSA Topic Heatmap */}
        <div className="p-5 bg-white dark:bg-sleek-card border border-gray-100 dark:border-white/10 rounded-xl space-y-3 lg:col-span-2">
          <h2 className="text-sm font-sans font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen size={16} className="text-indigo-500" /> Topic Practice Distribution
          </h2>
          <p className="text-xs text-gray-400 dark:text-white/40">
            Grid intensity indicates relative volumes of logged problems. Click filters downstream.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {dsaHeatmap.map((topic, i) => {
              const weight = topic.count;
              let intensity = 'bg-gray-50 dark:bg-white/5 text-gray-400 border dark:border-white/10';
              if (weight === 1) intensity = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
              else if (weight === 2) intensity = 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/30';
              else if (weight >= 3) intensity = 'bg-blue-600 text-white font-semibold';

              return (
                <div
                  key={i}
                  onClick={() => setFilterTag(filterTag === topic.name ? 'All' : topic.name)}
                  className={`p-3 rounded-lg text-center cursor-pointer transition-all ${intensity} hover:scale-[1.02]`}
                >
                  <p className="text-xs truncate font-medium">{topic.name}</p>
                  <strong className="text-sm font-mono block mt-1">{weight} solves</strong>
                </div>
              );
            })}
          </div>
        </div>

        {/* Focused Revisit Queue */}
        <div className="p-5 bg-white dark:bg-sleek-card border border-gray-100 dark:border-white/10 rounded-xl space-y-3">
          <h2 className="text-sm font-sans font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500" /> Revisit Queue ({revisitQueue.length})
          </h2>
          <p className="text-xs text-gray-400 dark:text-white/40">
            Problems flagged for structural review later.
          </p>

          <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
            {revisitQueue.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400 dark:text-white/40 font-sans">
                Review queue is empty!
              </div>
            ) : (
              revisitQueue.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-lg flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-semibold text-gray-900 dark:text-white truncate block">{item.name}</span>
                    <span className="text-[10px] font-mono text-gray-400 dark:text-white/40 block mt-0.5">{item.platform} • {item.difficulty}</span>
                  </div>
                  <button
                    onClick={() => handleEditClick(item)}
                    className="p-1 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                  >
                    <Edit2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Main Table filters bar */}
      <div className="p-4 bg-gray-50 dark:bg-sleek-card border border-gray-150 dark:border-white/10 rounded-xl space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-2.5 text-gray-400 dark:text-white/40" size={16} />
            <input
              id="search-tracker-input"
              type="text"
              placeholder="Search problems or logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg pl-9 pr-3 py-1.5 font-sans text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Filter by platform */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-400 font-sans">Platform:</span>
              <select
                id="filter-platform-select"
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value as any)}
                className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded px-2 py-1 text-xs text-gray-800 dark:text-white"
              >
                <option value="All">All</option>
                <option value="LeetCode">LeetCode</option>
                <option value="Codeforces">Codeforces</option>
                <option value="CodeChef">CodeChef</option>
                <option value="AtCoder">AtCoder</option>
              </select>
            </div>

            {/* Filter by difficulty */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-400 font-sans">Diff:</span>
              <select
                id="filter-difficulty-select"
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value as any)}
                className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded px-2 py-1 text-xs text-gray-800 dark:text-white"
              >
                <option value="All">All</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            {/* Filter by status */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-400 font-sans">Status:</span>
              <select
                id="filter-status-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded px-2 py-1 text-xs text-gray-800 dark:text-white font-sans"
              >
                <option value="All">All</option>
                <option value="Solved">Solved</option>
                <option value="Attempted">Attempted</option>
                <option value="Revisit">Revisit</option>
              </select>
            </div>

            {/* Reset Filter Button */}
            {(filterPlatform !== 'All' || filterDifficulty !== 'All' || filterStatus !== 'All' || filterTag !== 'All' || searchQuery !== '') && (
              <button
                onClick={() => {
                  setFilterPlatform('All');
                  setFilterDifficulty('All');
                  setFilterStatus('All');
                  setFilterTag('All');
                  setSearchQuery('');
                }}
                className="text-[10px] uppercase font-bold text-red-500 hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Selected tag highlight chip */}
        {filterTag !== 'All' && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-400">Filtering tag:</span>
            <span className="px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 font-sans font-medium flex items-center gap-1.5">
              {filterTag}
              <button onClick={() => setFilterTag('All')} className="hover:text-red-500 font-bold font-sans">×</button>
            </span>
          </div>
        )}
      </div>

      {/* Main filterable table */}
      <div className="bg-white dark:bg-sleek-card border border-gray-100 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]" id="tracker-table-element">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10 text-[10px] font-mono text-gray-400 dark:text-white/40 uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Problem</th>
                <th className="py-3 px-4 font-semibold">Platform</th>
                <th className="py-3 px-4 font-semibold">Difficulty</th>
                <th className="py-3 px-4 font-semibold">Topic Tags</th>
                <th className="py-3 px-4 font-semibold">Time</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Logged On</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/10 w-full text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500 dark:text-zinc-500 font-sans">
                    No logged problems match current filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  let difficultyColor = 'text-green-500';
                  if (log.difficulty === 'Medium') difficultyColor = 'text-amber-500';
                  else if (log.difficulty === 'Hard') difficultyColor = 'text-red-500';

                  let statusBadge = 'bg-blue-500/10 text-blue-500';
                  if (log.status === 'Solved') statusBadge = 'bg-emerald-500/10 text-emerald-500';
                  else if (log.status === 'Revisit') statusBadge = 'bg-red-500/10 text-red-500';

                  return (
                    <tr 
                      key={log.id} 
                      className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
                      id={`tracker-row-${log.id}`}
                    >
                      {/* Name / Notes */}
                      <td className="py-3.5 px-4 font-sans text-gray-900 dark:text-zinc-100 max-w-[200px]">
                        <span className="font-semibold block truncate" title={log.name}>{log.name}</span>
                        {log.notes && (
                          <span className="text-[10px] text-gray-400 dark:text-white/40 truncate block mt-0.5" title={log.notes}>
                            {log.notes}
                          </span>
                        )}
                      </td>

                      {/* Platform */}
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-500 dark:text-white/60">
                        {log.platform}
                      </td>

                      {/* Difficulty */}
                      <td className={`py-3.5 px-4 font-mono font-semibold ${difficultyColor}`}>
                        {log.difficulty}
                      </td>

                      {/* Topic chips */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {log.topicTags.map((tag) => (
                            <span 
                              key={tag} 
                              onClick={() => setFilterTag(tag)}
                              className="text-[9px] font-sans font-medium px-1.5 py-0.5 bg-gray-100 hover:bg-blue-500/15 hover:text-blue-500 dark:bg-white/5 rounded border border-gray-150/50 dark:border-white/10 cursor-pointer"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Time taken */}
                      <td className="py-3.5 px-4 font-mono text-gray-900 dark:text-zinc-100">
                        {log.timeTaken} min
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded font-medium ${statusBadge}`}>
                          {log.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-gray-400 dark:text-zinc-500">
                        {log.date}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right shrink-0">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(log)}
                            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                            title="Edit entry"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => deleteProblemLog(log.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Overlay / Popup solve Logger */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-white dark:bg-sleek-card border border-gray-100 dark:border-white/10 rounded-xl max-w-xl w-full overflow-hidden shadow-2xl relative p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
                <h3 className="text-base font-sans font-bold text-gray-900 dark:text-white">
                  {editLogId ? 'Edit Solve Log Entry' : 'Log Competitive Coding Solve'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 text-lg font-sans"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-gray-500 dark:text-zinc-400 font-medium">Problem Name / ID *</label>
                  <input
                    id="modal-name-input"
                    type="text"
                    required
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    placeholder="e.g. 154A - Segment Updates / Two Sum"
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Grid attributes */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-gray-500 dark:text-zinc-400 font-medium">Platform</label>
                    <select
                      id="modal-platform-select"
                      value={fieldPlatform}
                      onChange={(e) => setFieldPlatform(e.target.value as Platform)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-155 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none"
                    >
                      <option value="LeetCode">LeetCode</option>
                      <option value="Codeforces">Codeforces</option>
                      <option value="CodeChef">CodeChef</option>
                      <option value="AtCoder">AtCoder</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-500 dark:text-zinc-400 font-medium">Difficulty</label>
                    <select
                      id="modal-diff-select"
                      value={fieldDifficulty}
                      onChange={(e) => setFieldDifficulty(e.target.value as Difficulty)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-155 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-gray-500 dark:text-zinc-400 font-medium">Status</label>
                    <select
                      id="modal-status-select"
                      value={fieldStatus}
                      onChange={(e) => setFieldStatus(e.target.value as ProblemStatus)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-155 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none"
                    >
                      <option value="Solved">Solved</option>
                      <option value="Attempted">Attempted</option>
                      <option value="Revisit">Revisit</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-500 dark:text-zinc-400 font-medium">Time Taken (minutes)</label>
                    <input
                      id="modal-time-input"
                      type="number"
                      min="1"
                      required
                      value={fieldTimeTaken}
                      onChange={(e) => setFieldTimeTaken(Number(e.target.value) || 30)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Tags array */}
                <div className="space-y-1">
                  <label className="text-gray-500 dark:text-zinc-400 font-medium">Topic Tags (comma-separated)</label>
                  <input
                    id="modal-tags-input"
                    type="text"
                    value={fieldTags}
                    onChange={(e) => setFieldTags(e.target.value)}
                    placeholder="e.g. Dynamic Programming, Graphs, Segment Tree"
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
                  />
                  <div className="pt-1 flex flex-wrap gap-1">
                    {standardTags.slice(0, 5).map((ct) => (
                      <button
                        type="button"
                        key={ct}
                        onClick={() => {
                          const current = fieldTags.trim();
                          if (!current) setFieldTags(ct);
                          else if (!current.includes(ct)) setFieldTags(`${current}, ${ct}`);
                        }}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 border dark:border-white/10 text-gray-500 dark:text-white/40"
                      >
                        + {ct}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date solve */}
                <div className="space-y-1">
                  <label className="text-gray-500 dark:text-zinc-400 font-medium">Logged Date</label>
                  <input
                    id="modal-date-input"
                    type="date"
                    required
                    value={fieldDate}
                    onChange={(e) => setFieldDate(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-gray-500 dark:text-zinc-400 font-medium">Strategic Notes / Highlights</label>
                  <textarea
                    id="modal-notes-input"
                    rows={3}
                    value={fieldNotes}
                    onChange={(e) => setFieldNotes(e.target.value)}
                    placeholder="Describe DP segment optimization constraints or other structural caveats encountered..."
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
                  />
                </div>

                {/* Submission CTA buttons */}
                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
                  >
                    Save Log Entry
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
