/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCodeBaseStore } from '../store';
import { Lock, Mail, Github, LogIn, Sparkles, UserPlus, AlertCircle, ArrowRight } from 'lucide-react';

interface AuthProps {
  onContinueAsGuest: () => void;
}

export default function Auth({ onContinueAsGuest }: AuthProps) {
  const { signUpWithEmail, loginWithEmail, loginWithGoogle } = useCodeBaseStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      let code = err?.code || '';
      let msg = err?.message || 'Authentication failed.';
      if (code === 'auth/invalid-credential') msg = 'Invalid email or password.';
      else if (code === 'auth/email-already-in-use') msg = 'This email is already in use.';
      else if (code === 'auth/weak-password') msg = 'The password is too weak.';
      else if (code === 'auth/invalid-email') msg = 'Please supply a valid email address.';
      
      setError(msg);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err?.message || 'Google sign-in aborted');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-sleek-bg p-4 relative overflow-hidden transition-all duration-300">
      
      {/* Decorative dynamic dots backgrounds */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-600 to-indigo-600 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72rem] pointer-events-none" />
      </div>

      <div className="w-full max-w-sm shrink-0 z-10 font-sans">
        
        {/* Brand identity center */}
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 items-center justify-center text-white font-mono font-black text-xl mb-3 shadow-md border border-blue-500/10 hover:rotate-6 transition-all duration-300 pointer-events-none select-none">
            C
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white leading-tight">
            CodeBase Dashboard
          </h1>
          <p className="text-xs text-gray-500 dark:text-white/40 mt-1 pb-1">
            The professional, self-hosted workspace for programmers.
          </p>
        </div>

        {/* Card containing login forms */}
        <div className="p-6 bg-white dark:bg-sleek-card border border-gray-150 dark:border-white/10 rounded-2xl shadow-xl space-y-4">
          
          <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => { setIsSignUp(false); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                !isSignUp 
                  ? 'bg-white dark:bg-white/10 text-gray-950 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <LogIn size={13} /> Log In
            </button>
            <button
              onClick={() => { setIsSignUp(true); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                isSignUp 
                  ? 'bg-white dark:bg-white/10 text-gray-950 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <UserPlus size={13} /> Create Account
            </button>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/15 flex items-start gap-2 text-xs text-red-500"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-normal">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 text-gray-950 dark:text-white focus:outline-none focus:border-blue-500 font-mono transition-all"
                />
                <Mail className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center bg-transparent">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Password</label>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 text-gray-950 dark:text-white focus:outline-none focus:border-blue-500 font-mono transition-all"
                />
                <Lock className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md enabled:active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isSignUp ? (
                <>Sign Up <ArrowRight size={13} /></>
              ) : (
                <>Log In <ArrowRight size={13} /></>
              )}
            </button>
          </form>

          {/* Slashed OR bar separator */}
          <div className="relative flex py-1 items-center bg-transparent">
            <div className="flex-grow border-t border-gray-150 dark:border-white/10"></div>
            <span className="flex-shrink mx-3 text-[10px] uppercase font-mono text-gray-400">or</span>
            <div className="flex-grow border-t border-gray-150 dark:border-white/10"></div>
          </div>

          {/* Social Sign up */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2 bg-transparent hover:bg-gray-50 dark:hover:bg-white/5 border border-gray-250 dark:border-white/10 rounded-xl text-xs font-semibold text-gray-800 dark:text-white flex items-center justify-center gap-2 transition-all"
          >
            {/* Simple neat SVG for Google identity */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Guest Account option */}
          <div className="pt-2 text-center bg-transparent">
            <button
              onClick={onContinueAsGuest}
              className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors inline-flex items-center gap-1.5 font-sans"
            >
              Demo as Guest (Offline Mode) <ArrowRight size={12} />
            </button>
            <span className="block text-[10px] text-gray-400 dark:text-zinc-500 mt-1 font-sans">
              Does not require login. Fast sandbox mode.
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
