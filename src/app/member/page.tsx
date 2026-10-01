'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Bookmark,
  Clock,
  Mail,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  LogOut,
  Sparkles,
  Heart,
  ExternalLink,
  ChevronRight,
  Radio,
} from 'lucide-react';
import { getStoredSession, setStoredSession } from '@/lib/clientAuth';
import { getBookmarks, getReadingHistory, SavedArticle } from '@/lib/readerStore';
import { formatDate } from '@/lib/format';

export default function MemberSpacePage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<SavedArticle[]>([]);
  const [history, setHistory] = useState<SavedArticle[]>([]);
  const [letters, setLetters] = useState<any[]>([]);

  // Subscriber Login form state for visitors
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState('');

  const loadMemberData = () => {
    setBookmarks(getBookmarks());
    setHistory(getReadingHistory());
    try {
      const raw = localStorage.getItem('omt_reader_letters');
      setLetters(raw ? JSON.parse(raw) : []);
    } catch {
      setLetters([]);
    }
  };

  useEffect(() => {
    const s = getStoredSession();
    setSession(s);
    setLoading(false);
    loadMemberData();

    const handleUpdate = () => {
      loadMemberData();
    };
    window.addEventListener('omt-reader-updated', handleUpdate);
    return () => {
      window.removeEventListener('omt-reader-updated', handleUpdate);
    };
  }, []);

  const handleSubscriberLogin = async (customEmail?: string, customPass?: string) => {
    setError('');
    setLoginLoading(true);
    const subEmail = (customEmail || email).trim();
    const subPass = customPass || password;

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'signin',
          email: subEmail,
          password: subPass,
        }),
      });

      if (!res.ok) {
        throw new Error('Sign in failed');
      }

      const data = await res.json();
      if (data && data.session) {
        setStoredSession(data.session);
        setSession(data.session);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch {}
    setStoredSession(null);
    setSession(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse font-serif text-lg font-bold text-neutral-500">
          Loading Member Space...
        </div>
      </div>
    );
  }

  // If Not Logged In: Subscriber Access & Login View
  if (!session) {
    return (
      <div className="max-w-md mx-auto my-6 p-4 sm:p-8 bg-paper-card dark:bg-paper-cardDark rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
        <div className="space-y-2 text-center">
          <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-950/60 mx-auto flex items-center justify-center text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-900">
            <User className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            Subscriber Lounge
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Sign in to access your personal reading list, letters, and member benefits.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* 1-Tap Quick Subscriber Preset Buttons */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block">
            1-Tap Subscriber Sign In:
          </label>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              disabled={loginLoading}
              onClick={() => handleSubscriberLogin('reader@oldmangotree.media', 'reader123')}
              className="w-full text-left px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 hover:border-brand-500 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Ananya Nair</p>
                <p className="text-[10px] text-neutral-500">Patron Subscriber • Active</p>
              </div>
              <ArrowRight className="w-4 h-4 text-brand-600" />
            </button>
            <button
              type="button"
              disabled={loginLoading}
              onClick={() => handleSubscriberLogin('subscriber@oldmangotree.media', 'subscriber123')}
              className="w-full text-left px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 hover:border-brand-500 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Rahul Menon</p>
                <p className="text-[10px] text-neutral-500">Digital Member • Active</p>
              </div>
              <ArrowRight className="w-4 h-4 text-brand-600" />
            </button>
          </div>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
          <span className="flex-shrink mx-2 text-[11px] text-neutral-400 uppercase tracking-wider">Or Credentials</span>
          <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubscriberLogin(); }} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Email Address</label>
            <input
              type="email"
              required
              placeholder="reader@oldmangotree.media"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full py-2.5 rounded-xl bg-brand-700 hover:bg-brand-600 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow transition-all"
          >
            {loginLoading ? 'Entering...' : 'Enter Subscriber Lounge →'}
          </button>
        </form>

        <div className="pt-2 text-center border-t border-neutral-100 dark:border-neutral-800">
          <Link href="/" className="text-xs font-semibold text-neutral-500 hover:text-brand-600 transition-colors">
            ← Continue Reading Anonymously
          </Link>
        </div>
      </div>
    );
  }

  // Logged-in Subscriber Dashboard
  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 py-2 sm:py-4">
      {/* Member Header Card */}
      <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-neutral-900 text-white border border-neutral-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-900/60 text-brand-300 text-xs font-bold uppercase tracking-wider border border-brand-800">
              <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span>
              <span>Active Patron • Digital Subscriber</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight break-words">
              Welcome, {session.name}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 break-all">
              Logged in as <span className="font-mono text-neutral-300">{session.email}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {session.role === 'publisher' && (
              <Link
                href="/publisher"
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                <span>Editorial Desk</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-red-900/40 text-neutral-300 hover:text-red-300 font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Member Privileges Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-neutral-800/80 text-xs">
          <div className="space-y-0.5">
            <span className="text-neutral-400 text-[10px] uppercase">Access Status</span>
            <p className="font-bold text-brand-400">100% Unlocked</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-neutral-400 text-[10px] uppercase">Saved Stories</span>
            <p className="font-bold text-white">{bookmarks.length} in Library</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-neutral-400 text-[10px] uppercase">Articles Read</span>
            <p className="font-bold text-white">{history.length} pieces</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-neutral-400 text-[10px] uppercase">Letters Sent</span>
            <p className="font-bold text-white">{letters.length} submissions</p>
          </div>
        </div>
      </div>

      {/* Main Content Sections: Bookmarks & History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Saved Stories Panel */}
        <div className="p-5 sm:p-6 rounded-2xl bg-paper-card dark:bg-paper-cardDark border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-brand-700 dark:text-brand-400" />
              <h2 className="font-serif text-base font-bold text-neutral-900 dark:text-neutral-100">
                My Saved Stories ({bookmarks.length})
              </h2>
            </div>
            <Link href="/latest" className="text-xs font-bold text-brand-600 hover:underline">
              Explore More →
            </Link>
          </div>

          {bookmarks.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500 space-y-1">
              <p>No saved articles yet.</p>
              <p>Click the bookmark icon on any article to save it here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookmarks.slice(0, 5).map((a) => (
                <Link
                  key={a.slug}
                  href={`/articles/${a.slug}`}
                  className="group block p-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-900/60 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-800 transition-all"
                >
                  <span className="text-[10px] font-bold uppercase text-brand-600">
                    {a.category}
                  </span>
                  <h3 className="font-serif text-sm font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-brand-600 transition-colors line-clamp-1 break-words">
                    {a.title}
                  </h3>
                  {a.authorNames && (
                    <p className="text-[11px] text-neutral-500 line-clamp-1 break-words">{a.authorNames}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Reading History Panel */}
        <div className="p-4 sm:p-6 rounded-2xl bg-paper-card dark:bg-paper-cardDark border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-700 dark:text-brand-400" />
              <h2 className="font-serif text-base font-bold text-neutral-900 dark:text-neutral-100">
                Recently Read ({history.length})
              </h2>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500">
              Your reading history will appear here as you read articles.
            </div>
          ) : (
            <div className="space-y-3">
              {history.slice(0, 5).map((a) => (
                <Link
                  key={a.slug}
                  href={`/articles/${a.slug}`}
                  className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-900/60 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-800 transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-sm font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-brand-600 transition-colors line-clamp-1 break-words">
                      {a.title}
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      {a.category} {a.savedAt ? `• ${new Date(a.savedAt).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-brand-600 transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Exclusive Webzine Issues Showcase */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-paper-card dark:bg-paper-cardDark border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-700 dark:text-brand-400" />
            <h2 className="font-serif text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
              Patron Webzine Issues
            </h2>
          </div>
          <span className="text-xs font-bold text-brand-600 bg-brand-50 dark:bg-brand-950 px-2.5 py-1 rounded-full">
            All Packets Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/magazine/packet-2"
            className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-brand-500 bg-neutral-50/50 dark:bg-neutral-900/40 transition-all group"
          >
            <span className="text-[10px] font-bold uppercase text-brand-600">Current Issue</span>
            <h3 className="font-serif text-base font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-brand-600 mt-1 break-words">
              PACKET 2 — Modern Political &amp; Cultural Debates
            </h3>
            <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
              In-depth political, environmental, and cultural discourses and analyses.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 mt-3">
              <span>Read Full Packet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            href="/magazine/packet-1"
            className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-brand-500 bg-neutral-50/50 dark:bg-neutral-900/40 transition-all group"
          >
            <span className="text-[10px] font-bold uppercase text-brand-600">Inaugural Issue</span>
            <h3 className="font-serif text-base font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-brand-600 mt-1 break-words">
              PACKET 1 — Sports Culture &amp; Global Perspectives
            </h3>
            <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
              Global cultural readings of football, sporting philosophy, and athletic chronicles.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 mt-3">
              <span>Read Full Packet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
