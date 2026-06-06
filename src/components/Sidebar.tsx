/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Home, 
  User, 
  ClipboardList, 
  Calendar, 
  Briefcase, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Moon, 
  Sun,
  Layout,
  BookOpen,
  LogOut,
  CloudLightning
} from 'lucide-react';
import { useCodeBaseStore } from '../store';
import UserAvatar, { getUserDisplayInfo } from './UserAvatar';

export default function Sidebar() {
  const { 
    currentTab, 
    setTab, 
    sidebarCollapsed, 
    toggleSidebar, 
    settings, 
    updateSettings,
    portfolioMode,
    setPortfolioMode,
    user,
    logout,
    portfolio,
    refreshStats
  } = useCodeBaseStore();

  const menuItems = [
    { id: 'home' as const, label: 'Overview', icon: Home },
    { id: 'profiles' as const, label: 'Profile Dashboard', icon: User },
    { id: 'tracker' as const, label: 'CP Tracker', icon: ClipboardList },
    { id: 'calendar' as const, label: 'Contest Calendar', icon: Calendar },
    { id: 'portfolio' as const, label: 'Dev Portfolio', icon: Briefcase },
    { id: 'settings' as const, label: 'Settings', icon: Settings }
  ];

  const handleThemeToggle = () => {
    updateSettings({
      theme: settings.theme === 'dark' ? 'light' : 'dark'
    });
  };

  return (
    <aside 
      id="main-sidebar"
      className={`fixed top-0 left-0 h-screen bg-white dark:bg-sleek-sidebar border-r border-gray-100 dark:border-white/10 flex flex-col justify-between transition-all duration-300 z-50 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Logo / Brand */}
      <div>
        <div className={`flex flex-col justify-center border-b border-gray-100 dark:border-white/10 relative ${sidebarCollapsed ? 'h-24 px-2' : 'h-20 px-4'}`}>
          <div className={`flex items-center ${sidebarCollapsed ? 'flex-col gap-1.5' : 'justify-between'}`}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 font-mono font-bold tracking-tight shadow-lg">
                <Layout size={16} />
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col">
                  <span className="font-sans font-extrabold text-sm text-gray-900 dark:text-white tracking-tight leading-none uppercase">
                    DevOS v2.4
                  </span>
                  <span className="text-[9px] font-mono font-semibold text-emerald-500 uppercase tracking-widest mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    System Active
                  </span>
                </div>
              )}
            </div>
            <button 
              id="sidebar-toggle-btn"
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 border dark:border-white/10 transition-colors hidden md:block"
            >
              {sidebarCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5" id="sidebar-nav">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentTab === item.id;
            
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-left font-sans text-sm font-medium transition-all group relative ${
                  isActive 
                    ? 'text-blue-600 dark:text-white bg-blue-50/50 dark:bg-white/5 border-l-2 border-blue-600 dark:border-blue-500 rounded-r' 
                    : 'text-gray-600 hover:text-gray-900 dark:text-white/50 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
              >
                <IconComponent className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 shrink-0 ${
                  isActive ? 'text-blue-600 dark:text-white' : 'text-gray-400 dark:text-zinc-500 group-hover:text-gray-600 dark:group-hover:text-zinc-300'
                }`} />
                
                {!sidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}

                {/* Micro-interaction tooltip on collapsed sidebar */}
                {sidebarCollapsed && (
                  <div className="absolute left-18 px-2 py-1 rounded bg-zinc-900 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 font-sans shadow-md">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Floating action: + New Project */}
        <div className="px-3" id="sidebar-action-new-project">
          {sidebarCollapsed ? (
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-new-project-modal'));
              }}
              className="w-10 h-10 mx-auto rounded-xl bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white shadow-lg active:scale-95 transition-all cursor-pointer"
              title="New Project / Solved Log"
            >
              <span className="text-lg font-bold">+</span>
            </button>
          ) : (
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-new-project-modal'));
              }}
              className="w-full h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 text-white font-sans text-xs font-bold shadow-lg active:scale-95 transition-all cursor-pointer select-none"
            >
              <span className="text-sm font-bold">+</span> New Project
            </button>
          )}
        </div>

        {/* Quiet footer utilities */}
        <div className="px-3 pt-2.5 space-y-0.5 border-t border-gray-100/50 dark:border-white/5 mt-3">
          <button
            onClick={() => setTab('settings')}
            className="w-full flex items-center gap-3 py-1.5 px-3 rounded-lg text-left text-xs font-sans font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <BookOpen size={14} className="text-gray-400 dark:text-zinc-500 shrink-0" />
            {!sidebarCollapsed && <span className="truncate">Platform Setup Guide</span>}
          </button>
          <button
            onClick={() => {
              refreshStats(true);
              setTab('profiles');
            }}
            className="w-full flex items-center gap-3 py-1.5 px-3 rounded-lg text-left text-xs font-sans font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <CloudLightning size={14} className="text-gray-400 dark:text-zinc-500 shrink-0" />
            {!sidebarCollapsed && <span className="truncate">Sync Platform Data</span>}
          </button>
        </div>
      </div>

      {/* Sidebar Footer Area */}
      <div className="p-3 border-t border-gray-100 dark:border-white/10 space-y-2 select-none">
        {/* Quick Theme Toggle Icon */}
        <button
          id="sidebar-theme-toggle"
          onClick={handleThemeToggle}
          className="w-full flex items-center gap-3 py-2 px-3 rounded-lg text-left text-gray-500 hover:text-gray-950 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          {settings.theme === 'dark' ? (
            <>
              <Sun className="w-5 h-5 text-amber-500 shrink-0" />
              {!sidebarCollapsed && <span className="text-xs font-sans font-medium">Light Mode</span>}
            </>
          ) : (
            <>
              <Moon className="w-5 h-5 text-indigo-500 shrink-0" />
              {!sidebarCollapsed && <span className="text-xs font-sans font-medium">Dark Mode</span>}
            </>
          )}
        </button>

        {/* Account Sync Status indicators */}
        <div className="pt-2 border-t border-gray-100 dark:border-white/5">
          {user ? (
            <div className="flex items-center justify-between gap-1.5 p-1.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-transparent">
              <div className="flex items-center gap-2 overflow-hidden">
                <UserAvatar size="sm" />
                {!sidebarCollapsed && (
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-sans font-bold text-gray-900 dark:text-white truncate">
                      {getUserDisplayInfo(settings, user, portfolio.name).displayName}
                    </p>
                    <p className="text-[8px] font-mono text-emerald-500 font-semibold uppercase tracking-tight">
                      Synced Cloud
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={logout}
                className="p-1 rounded-md hover:bg-red-550/10 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                title="Log Out"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1 p-1.5 rounded-lg bg-yellow-500/5 border border-yellow-500/10 text-center">
              {!sidebarCollapsed ? (
                <>
                  <p className="text-[9px] font-mono text-yellow-600 dark:text-amber-400 font-semibold uppercase tracking-wider block">
                    ⚡ Guest (Offline)
                  </p>
                  <button
                    onClick={() => {
                      localStorage.removeItem('codebase_guest_mode');
                      window.location.reload();
                    }}
                    className="mt-1 w-full py-1 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold rounded-md font-sans uppercase tracking-tight shadow-sm transition-colors cursor-pointer"
                  >
                    Connect Cloud
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    localStorage.removeItem('codebase_guest_mode');
                    window.location.reload();
                  }}
                  className="w-full p-1 rounded bg-yellow-500/10 text-yellow-600 dark:text-amber-400 flex items-center justify-center font-mono text-[8px] font-bold uppercase transition-transform active:scale-95"
                  title="Connect Cloud Account"
                >
                  Guest
                </button>
              )}
            </div>
          )}
        </div>

        {/* Dashboard Mode Badge representation */}
        {!sidebarCollapsed && (
          <div className="px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                Mode Profile
              </span>
              <span className={`text-[9px] font-mono font-semibold uppercase tracking-wider rounded px-1.5 py-0.5 ${
                portfolioMode === 'public' 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400'
              }`}>
                {portfolioMode}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
