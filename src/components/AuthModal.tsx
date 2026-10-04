'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, Lock, UserCheck, KeyRound, LogOut, CheckCircle2, ArrowRight, Sparkles, PenTool, User } from 'lucide-react';
import { setStoredSession, clientAuthenticate } from '@/lib/clientAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: any;
  onSessionChange: (session: any) => void;
}

export function AuthModal({ isOpen, onClose, session, onSessionChange }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    const submitEmail = (customEmail || email).trim();
    const submitPass = customPassword || password;

    try {
      let sessionData = null;

      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            action: isSignUp ? 'signup' : 'signin',
            email: submitEmail,
            password: submitPass,
            name: name.trim(),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.session) {
            sessionData = data.session;
          }
        }
      } catch (networkErr) {
        // Node API route unavailable on static GitHub Pages
      }

      // Seamless fallback for static hosting / GitHub Pages
      if (!sessionData) {
        const fallback = clientAuthenticate(submitEmail, submitPass, name);
        if ('error' in fallback) {
          throw new Error(fallback.error);
        }
        sessionData = fallback;
      }

      setStoredSession(sessionData);
      onSessionChange(sessionData);
      setJustLoggedIn(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    handleSubmit(undefined, quickEmail, quickPass);
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'logout' }),
      });
      setStoredSession(null);
      onSessionChange(null);
      setJustLoggedIn(false);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div
        className="fixed inset-0"
        onClick={() => {
          setJustLoggedIn(false);
          onClose();
        }}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md max-h-[92vh] overflow-y-auto bg-paper-card dark:bg-paper-cardDark rounded-2xl p-5 sm:p-8 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          onClick={() => {
            setJustLoggedIn(false);
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {justLoggedIn && session ? (
          /* Immediate Post-Login Confirmation on Mobile & Desktop */
          <div className="space-y-6 text-center py-2">
            <div className="w-16 h-16 rounded-full bg-amber-600 text-white flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Subscriber Welcome
              </span>
              <h3 className="font-serif text-2xl font-bold text-neutral-900 dark:text-neutral-50 pt-2">
                Welcome, {session.name}!
              </h3>
              <p className="text-xs text-neutral-500">{session.email}</p>
            </div>

            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Your Subscriber Pass is active. Enjoy unlimited access to all Webzine issues, saved library bookmarks, and ad-free reading.
            </p>

            <div className="flex flex-col gap-2.5">
              <Link
                href="/member"
                onClick={() => {
                  setJustLoggedIn(false);
                  onClose();
                }}
                className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Go to Member Space</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  setJustLoggedIn(false);
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium text-xs transition-colors"
              >
                Continue Reading
              </button>
            </div>
          </div>
        ) : session ? (
          /* Active Session View */
          <div className="space-y-6 text-center">
            <div className="w-14 h-14 rounded-full bg-amber-600 text-white flex items-center justify-center mx-auto shadow-md">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                Active Patron Subscriber
              </span>
              <h3 className="font-serif text-2xl font-bold text-neutral-900 dark:text-neutral-50 pt-2">
                {session.name}
              </h3>
              <p className="text-xs text-neutral-500">{session.email}</p>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-xl text-left border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs text-neutral-700 dark:text-neutral-300">
              <p className="font-semibold text-amber-600 dark:text-amber-400">Subscriber Privileges Active:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Unlimited access to all Webzine issues</li>
                <li>Personal library of saved bookmarks</li>
                <li>Reading history &amp; letters to editor</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href="/member"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Open Member Space</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                onClick={handleLogout}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        ) : (
          /* Reader / Subscriber Sign In / Sign Up Form */
          <div className="space-y-5">
            {/* Subscriber Header */}
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <User className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                {isSignUp ? 'Become a Subscriber' : 'Subscriber Lounge Access'}
              </h3>
              <p className="text-xs text-neutral-500">
                {isSignUp
                  ? 'Unlock unlimited Webzine reading, audio stories & saved library.'
                  : 'Sign in to access your reading history, saved articles & member perks.'}
              </p>
            </div>

            {/* Quick 1-Tap Reader Login Presets for Immediate Testing */}
            {!isSignUp && (
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  1-Tap Subscriber Sign In:
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickLogin('reader@oldmangotree.media', 'reader123')}
                    className="flex-1 px-3 py-2 text-xs font-semibold text-left rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-brand-500 hover:text-brand-600 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold">Ananya Nair</p>
                      <p className="text-[10px] text-neutral-400">Patron Subscriber</p>
                    </div>
                    <span className="text-[10px] text-brand-600 font-bold">Tap →</span>
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickLogin('subscriber@oldmangotree.media', 'subscriber123')}
                    className="flex-1 px-3 py-2 text-xs font-semibold text-left rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-brand-500 hover:text-brand-600 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold">Rahul Menon</p>
                      <p className="text-[10px] text-neutral-400">Digital Member</p>
                    </div>
                    <span className="text-[10px] text-brand-600 font-bold">Tap →</span>
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs text-center font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ananya Nair"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoCapitalize="words"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="reader@oldmangotree.media"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="email"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-[0.99] text-white font-bold text-sm shadow transition-all flex items-center justify-center gap-2"
              >
                {loading
                  ? 'Processing...'
                  : isSignUp
                  ? 'Join as Subscriber →'
                  : 'Enter Subscriber Lounge →'}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="text-xs text-neutral-500 hover:text-brand-600 dark:hover:text-brand-400 font-medium underline"
                >
                  {isSignUp
                    ? 'Already a subscriber? Sign In'
                    : 'Not a member? Join oldmangotree'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
