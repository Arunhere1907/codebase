/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  User, 
  Moon, 
  Sun, 
  Bell, 
  RefreshCw, 
  Download, 
  Check, 
  Database,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { useCodeBaseStore } from '../store';
import UserAvatar from './UserAvatar';

export default function SettingsSection() {
  const { settings, updateSettings, problemLogs, portfolio } = useCodeBaseStore();
  const [isSaved, setIsSaved] = useState(false);

  const [cfHandle, setCfHandle] = useState(settings.usernames.codeforces);
  const [lcHandle, setLcHandle] = useState(settings.usernames.leetcode);
  const [ccHandle, setCcHandle] = useState(settings.usernames.codechef);
  const [acHandle, setAcHandle] = useState(settings.usernames.atcoder);
  const [ghHandle, setGhHandle] = useState(settings.usernames.github);
  const [displayName, setDisplayName] = useState(settings.displayName || '');
  const [reminders, setReminders] = useState(settings.contestReminders);
  const [refreshPeriod, setRefreshPeriod] = useState(settings.refreshInterval);

  useEffect(() => {
    setCfHandle(settings.usernames.codeforces);
    setLcHandle(settings.usernames.leetcode);
    setCcHandle(settings.usernames.codechef);
    setAcHandle(settings.usernames.atcoder);
    setGhHandle(settings.usernames.github);
    setDisplayName(settings.displayName || '');
    setReminders(settings.contestReminders);
    setRefreshPeriod(settings.refreshInterval);
  }, [settings]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      usernames: {
        codeforces: cfHandle.trim(),
        leetcode: lcHandle.trim(),
        codechef: ccHandle.trim(),
        atcoder: acHandle.trim(),
        github: ghHandle.trim()
      },
      displayName: displayName.trim() || undefined,
      contestReminders: reminders,
      refreshInterval: Number(refreshPeriod) || 15
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  // Export backup data as formatted JSON
  const handleExportDataBackup = () => {
    const backupContent = {
      settings,
      problemLogs,
      portfolio,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(backupContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `codebase_dashboard_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="max-w-3xl space-y-6"
    >
      {/* Header section */}
      <div className="border-b border-gray-150 dark:border-white/10 pb-5">
        <h1 className="text-2xl sm:text-3xl font-sans font-bold text-gray-900 dark:text-white tracking-tight">
          System Settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-white/40 mt-1">
          Configure platform handles, background caching periods, reminders, and data persistence backups.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">

        {/* Profile & avatar */}
        <div className="p-5 bg-white dark:bg-sleek-card border border-gray-100 dark:border-white/10 rounded-xl space-y-4 shadow-sm">
          <h2 className="text-sm font-sans font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <User size={16} className="text-blue-500" /> Profile & Avatar
          </h2>
          <div className="flex items-center gap-4">
            <UserAvatar size="lg" editable />
            <div className="flex-1 space-y-3">
              <div className="space-y-1">
                <label className="text-gray-500 dark:text-white/40 font-semibold text-xs">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name (shown in header)"
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-gray-100"
                />
              </div>
              <p className="text-[10px] text-gray-400">Click the avatar to upload a photo (max 500 KB). Google sign-in photos are used by default.</p>
              {settings.avatarUrl && (
                <button
                  type="button"
                  onClick={() => updateSettings({ avatarUrl: undefined })}
                  className="text-[10px] text-red-400 hover:text-red-500 font-semibold"
                >
                  Remove custom avatar
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Handles configurations */}
        <div className="p-5 bg-white dark:bg-sleek-card border border-gray-100 dark:border-white/10 rounded-xl space-y-4 shadow-sm">
          <h2 className="text-sm font-sans font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <User size={16} className="text-blue-500" /> Platform Username Configurations
          </h2>
          <p className="text-xs text-gray-400 dark:text-white/40">
            Configure accurate handles to query live profiles and rating updates.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
            <div className="space-y-1">
              <label className="text-gray-500 dark:text-white/40 font-semibold">Codeforces Handle</label>
              <input
                id="settings-cf-input"
                type="text"
                value={cfHandle}
                onChange={(e) => setCfHandle(e.target.value)}
                placeholder="e.g. tourist"
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-gray-500 dark:text-white/40 font-semibold">LeetCode Handle</label>
              <input
                id="settings-lc-input"
                type="text"
                value={lcHandle}
                onChange={(e) => setLcHandle(e.target.value)}
                placeholder="e.g. arun_here"
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-gray-500 dark:text-white/40 font-semibold">CodeChef Handle</label>
              <input
                id="settings-cc-input"
                type="text"
                value={ccHandle}
                onChange={(e) => setCcHandle(e.target.value)}
                placeholder="e.g. chef_arun"
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-gray-500 dark:text-white/40 font-semibold">AtCoder Handle</label>
              <input
                id="settings-ac-input"
                type="text"
                value={acHandle}
                onChange={(e) => setAcHandle(e.target.value)}
                placeholder="e.g. atcoder_user"
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-gray-500 dark:text-white/40 font-semibold">GitHub Username</label>
              <input
                id="settings-gh-input"
                type="text"
                value={ghHandle}
                onChange={(e) => setGhHandle(e.target.value)}
                placeholder="e.g. arun-github"
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {/* System Settings & caching */}
        <div className="p-5 bg-white dark:bg-sleek-card border border-gray-100 dark:border-white/10 rounded-xl space-y-4 shadow-sm">
          <h2 className="text-sm font-sans font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <RefreshCw size={16} className="text-emerald-500" /> Caching & Operations Preferences
          </h2>

          <div className="space-y-4 text-xs font-sans">
            {/* Interval */}
            <div className="space-y-1">
              <label className="text-gray-500 dark:text-white/40 font-semibold">Platform Refetch Interval (minutes)</label>
              <select
                id="settings-refresh-interval"
                value={refreshPeriod}
                onChange={(e) => setRefreshPeriod(Number(e.target.value))}
                className="w-full sm:w-1/2 bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/10 rounded-lg px-3 py-2 text-gray-800 dark:text-white"
              >
                <option value={5}>5 minutes</option>
                <option value={15}>15 minutes (Highly recommended)</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
              </select>
              <p className="text-[10px] text-gray-400 dark:text-white/40 italic">
                Decreasing period increases API requests, making dashboard stats tighter but prone to platform rate limits.
              </p>
            </div>

            {/* Notifications */}
            <div className="flex items-center gap-3 pt-2">
              <input
                id="settings-reminders-checkbox"
                type="checkbox"
                checked={reminders}
                onChange={(e) => setReminders(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <label htmlFor="settings-reminders-checkbox" className="text-xs font-semibold text-gray-700 dark:text-white/80 font-sans cursor-pointer">
                  Enable Contest Reminders & Countdown Notifications
                </label>
                <span className="text-[10px] text-gray-400 dark:text-white/40 block">Sends browser indicators when registered contest approaches under 1 hour.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Save Button */}
        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {isSaved && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1"
                >
                  <Check size={14} /> Handle settings updated! Offline caches rebuilt.
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <button
            id="settings-save-btn"
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-sans text-xs font-semibold rounded-lg shadow-md transition-all active:scale-[0.97]"
          >
            Save All Configurations
          </button>
        </div>

      </form>

      {/* System Backup Database tools */}
      <div className="p-5 bg-white dark:bg-sleek-card border border-gray-100 dark:border-white/10 rounded-xl space-y-4 shadow-sm">
        <h2 className="text-sm font-sans font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Database size={16} className="text-indigo-500" /> Database Backup & Local Data Control
        </h2>
        <p className="text-xs text-gray-550 dark:text-white/40">
          CodeBase runs completely client-side. Export a JSON dump of your local state history to migrate between machines.
        </p>

        <div className="flex items-center gap-3 pt-1">
          <button
            id="settings-export-json"
            onClick={handleExportDataBackup}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-zinc-200 rounded-lg text-xs font-semibold transition-colors"
          >
            <Download size={13} /> Export Database (JSON)
          </button>
        </div>
      </div>
    </motion.div>
  );
}
