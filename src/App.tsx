/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import OverviewSection from './components/OverviewSection';
import ProfileSection from './components/ProfileSection';
import TrackerSection from './components/TrackerSection';
import CalendarSection from './components/CalendarSection';
import PortfolioSection from './components/PortfolioSection';
import SettingsSection from './components/SettingsSection';
import Auth from './components/Auth';
import { useCodeBaseStore } from './store';
import { Menu, X, Award, Flame, Star, Bell, Info, ShieldAlert } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Reminder } from './types';
import { format } from 'date-fns';

interface LiveToast {
  id: string;
  title: string;
  platform: string;
  offset: number;
}

export default function App() {
  const { 
    currentTab, 
    settings, 
    sidebarCollapsed, 
    toggleSidebar, 
    portfolioMode,
    user,
    authLoading,
    reminders,
    initAuth,
    markReminderAsNotified
  } = useCodeBaseStore();

  // Expose store globally for navigation from ProfileSection
  useEffect(() => {
    (window as any).__codebaseStore = useCodeBaseStore;
  }, []);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [guestMode, setGuestMode] = useState(() => {
    return localStorage.getItem('codebase_guest_mode') === 'true';
  });
  const [activeToasts, setActiveToasts] = useState<LiveToast[]>([]);

  // Custom modal states for '+ New Project' action
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjPlatform, setNewProjPlatform] = useState('LeetCode');
  const [newProjDifficulty, setNewProjDifficulty] = useState('Medium');
  const [newProjTags, setNewProjTags] = useState('Dynamic Programming, Algorithms');
  const [newProjTime, setNewProjTime] = useState('25');

  // Listen to open project modal event
  useEffect(() => {
    const handleOpenNewProject = () => {
      setShowNewProjectModal(true);
    };
    window.addEventListener('open-new-project-modal', handleOpenNewProject);
    return () => window.removeEventListener('open-new-project-modal', handleOpenNewProject);
  }, []);

  const handleCreateNewProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjTitle.trim()) return;

    try {
      const store = useCodeBaseStore.getState();
      await store.addProblemLog({
        name: newProjTitle.trim(),
        platform: newProjPlatform as any,
        difficulty: newProjDifficulty as any,
        topicTags: newProjTags.split(',').map(t => t.trim()).filter(Boolean),
        status: 'Solved',
        timeTaken: parseInt(newProjTime, 10) || 15,
        notes: 'Logged instantly via the DevOS v2.4 quick launcher console.',
        date: format(new Date(), 'yyyy-MM-dd')
      });

      setNewProjTitle('');
      setShowNewProjectModal(false);
      alert(`Project solve saved successfully: ${newProjTitle}`);
    } catch (err) {
      console.error(err);
      alert('Error logging project submission log task.');
    }
  };

  // Initialize Firebase Auth subscription on app load
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Request browser Notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Sync theme selection class to document Element
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Reminder schedule polling detector (evaluates every 4s)
  useEffect(() => {
    const checkReminders = () => {
      const now = Date.now();
      
      reminders.forEach((rem) => {
        if (rem.notified) return;

        const contestTime = new Date(rem.contestStartTime).getTime();
        const notificationTime = contestTime - rem.reminderTimeOffset * 60 * 1000;

        // Is current timestamp past notification threshold AND within an active 15 min window (to avoid historical noise)
        if (now >= notificationTime && now < contestTime + 15 * 60 * 1000) {
          // 1. Local HTML browser alert notification
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`Contest Reminder: ${rem.contestName}`, {
                body: `Starts in ${rem.reminderTimeOffset} minutes on ${rem.platform}! Prep your templates.`,
                tag: rem.id
              });
            } catch (e) {
              console.warn("Failed to fire browser Notification shell", e);
            }
          }

          // 2. Beautiful sliding in-app overlay toast representation
          setActiveToasts((prev) => [
            ...prev,
            {
              id: rem.id,
              title: rem.contestName,
              platform: rem.platform,
              offset: rem.reminderTimeOffset
            }
          ]);

          // 3. Update database state so it doesn't trigger again
          markReminderAsNotified(rem.id);
        }
      });
    };

    const interval = setInterval(checkReminders, 4000);
    return () => clearInterval(interval);
  }, [reminders, markReminderAsNotified]);

  // Remove toast from list
  const dismissToast = (id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Render main subview dynamically
  const renderSelectedSection = () => {
    switch (currentTab) {
      case 'home':
        return <OverviewSection />;
      case 'profiles':
        return <ProfileSection />;
      case 'tracker':
        return <TrackerSection />;
      case 'calendar':
        return <CalendarSection />;
      case 'portfolio':
        return <PortfolioSection />;
      case 'settings':
        return <SettingsSection />;
      default:
        return <OverviewSection />;
    }
  };

  // Handle setting Guest Mode
  const handleContinueAsGuest = () => {
    setGuestMode(true);
    localStorage.setItem('codebase_guest_mode', 'true');
  };

  // Standalone public Portfolio landing frame
  const isPublicStandalonePreview = portfolioMode === 'public' && currentTab === 'portfolio';

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-sleek-bg flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400 dark:text-zinc-500 font-mono tracking-wider uppercase">
            Loading Secures...
          </p>
        </div>
      </div>
    );
  }

  // Gate app behind Auth if no user logged in AND not overridden by Guest Sandbox mode
  if (!user && !guestMode) {
    return <Auth onContinueAsGuest={handleContinueAsGuest} />;
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-sleek-bg text-gray-800 dark:text-sleek-text transition-colors duration-300 relative">
      
      {/* Dynamic floating micro-toasts notifications */}
      <div className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full space-y-3 font-sans">
        <AnimatePresence>
          {activeToasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className="p-4 bg-zinc-900 border border-white/10 dark:border-white/15 text-white rounded-xl shadow-xl flex items-start gap-3 relative"
            >
              <div className="p-2 bg-blue-600 rounded-lg text-white shrink-0">
                <Bell size={16} className="animate-bounce" />
              </div>
              <div className="space-y-1 pr-6 flex-1">
                <span className="text-[9px] font-mono font-bold tracking-wider text-blue-400 uppercase">
                  ACTIVE REMINDER • {toast.platform}
                </span>
                <h4 className="text-xs font-bold leading-snug">{toast.title}</h4>
                <p className="text-[10px] text-zinc-400">
                  Starts in <strong className="text-yellow-400">{toast.offset} minutes</strong>. Set up your workspace templates now!
                </p>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <X size={12} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ⚠️ Skip menus if previewing standalone personal profile page */}
      {isPublicStandalonePreview ? (
        <div className="p-3 sm:p-6 max-w-4xl mx-auto">
          {/* Subtle exit-preview reminder tool */}
          <div className="mb-4 p-2 px-4 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-between text-xs text-blue-500 font-sans">
            <span className="font-medium">✨ You are viewing the PUBLIC Portfolio Mode frame.</span>
            <button
              onClick={() => {
                const store = useCodeBaseStore.getState();
                store.setPortfolioMode('private');
              }}
              className="px-2.5 py-1 rounded bg-blue-600 text-white font-bold hover:bg-blue-700 font-sans text-[10px] uppercase shadow-sm transition-all text-xs"
            >
              Back to dashboard
            </button>
          </div>
          
          <PortfolioSection />
        </div>
      ) : (
        <>
          {/* Mobile Top Header bar */}
          <header className="h-14 flex items-center justify-between px-4 bg-white dark:bg-sleek-nav border-b border-gray-100 dark:border-white/10 md:hidden sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-mono font-bold text-xs select-none">
                C
              </div>
              <span className="font-sans font-bold text-sm tracking-tight text-gray-950 dark:text-white select-none">
                CodeBase
              </span>
            </div>

            <button
              id="mobile-hamburger-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded bg-gray-50 dark:bg-zinc-950 text-gray-500 dark:text-zinc-400 border border-gray-100 dark:border-white/5"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </header>

          {/* Core App Layout wrap */}
          <div className="flex">
            
            {/* Left Sidebar drawer (visible from md up) */}
            <div className="hidden md:block">
              <Sidebar />
            </div>

            {/* Mobile overlays representation */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex">
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setMobileMenuOpen(false)}
                    className="absolute inset-0 bg-black/40 backdrop-blur-xs"
                  />
                  
                  {/* Sidebar Drawer container */}
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'tween', duration: 0.2 }}
                    className="relative w-64 bg-white dark:bg-sleek-sidebar h-full flex flex-col justify-between border-r border-gray-100 dark:border-white/10 shadow-xl"
                  >
                    <div className="absolute top-4 right-4 md:hidden z-10">
                      <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-1 rounded-full bg-gray-100 dark:bg-zinc-90 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      >
                        <X size={15} />
                      </button>
                    </div>
                    {/* Render same Sidebar content custom styled for Mobile tap selections */}
                    <div className="pt-6 h-full" onClick={() => setMobileMenuOpen(false)}>
                      <Sidebar />
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Main view router area */}
            <main 
              id="app-main-canvas"
              className={`flex-1 min-w-0 min-h-screen px-4 py-6 md:p-8 transition-all duration-300 ${
                sidebarCollapsed ? 'md:pl-24' : 'md:pl-72'
              }`}
            >
              {/* Dynamic core pages slide in */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="max-w-6xl mx-auto"
                >
                  {renderSelectedSection()}
                </motion.div>
              </AnimatePresence>

              {/* Minimal platform credit alignment */}
              <footer className="mt-16 pt-6 border-t border-gray-100 dark:border-white/10 text-center text-[10px] font-mono text-gray-400 dark:text-zinc-600">
                CodeBase Developer Dashboard • Synced with highly interactive zero-trust Cloud Security Architectures.
              </footer>
            </main>

          </div>
        </>
      )}

      {/* Modern Centered Dynamic 'New Project' Popup Modal */}
      <AnimatePresence>
        {showNewProjectModal && (
          <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-sleek-card border border-gray-150 dark:border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 text-gray-800 dark:text-white"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3">
                <h3 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                  Launch New Project Log
                </h3>
                <button
                  onClick={() => setShowNewProjectModal(false)}
                  className="p-1 rounded bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleCreateNewProject} className="space-y-4">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold block">
                    Problem Title / Project Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 15. 3Sum Closest"
                    value={newProjTitle}
                    onChange={(e) => setNewProjTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-zinc-950 border border-gray-150 dark:border-white/10 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-colors"
                  />
                </div>

                {/* Grid platforms & difficulty */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold block">
                      Target Platform
                    </label>
                    <select
                      value={newProjPlatform}
                      onChange={(e) => setNewProjPlatform(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-zinc-950 border border-gray-150 dark:border-white/10 text-gray-950 dark:text-white focus:border-blue-500 outline-none transition-colors"
                    >
                      <option value="LeetCode">LeetCode</option>
                      <option value="Codeforces">Codeforces</option>
                      <option value="CodeChef">CodeChef</option>
                      <option value="AtCoder">AtCoder</option>
                      <option value="HackerRank">HackerRank</option>
                      <option value="GeeksForGeeks">GeeksForGeeks</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold block">
                      Difficulty Rank
                    </label>
                    <select
                      value={newProjDifficulty}
                      onChange={(e) => setNewProjDifficulty(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-zinc-950 border border-gray-150 dark:border-white/10 text-gray-950 dark:text-white focus:border-blue-500 outline-none transition-colors"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                {/* Topic tags */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold block">
                    Topic Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dynamic Programming, Strings"
                    value={newProjTags}
                    onChange={(e) => setNewProjTags(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-zinc-950 border border-gray-150 dark:border-white/10 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-colors"
                  />
                </div>

                {/* Runtime simulation config */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold block">
                    Simulated Runtime (ms)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="9999"
                    value={newProjTime}
                    onChange={(e) => setNewProjTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-zinc-950 border border-gray-150 dark:border-white/10 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-colors"
                  />
                </div>

                {/* Submits */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewProjectModal(false)}
                    className="flex-1 py-2 text-xs font-semibold bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl cursor-pointer text-gray-600 dark:text-white/60 text-center transition-colors font-sans border border-gray-200 dark:border-white/10"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer text-center transition-colors shadow-lg font-sans"
                  >
                    Commit Solved Log
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
