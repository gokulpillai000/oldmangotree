'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  ExternalLink,
  Lock,
  Radio,
  Film,
  ArrowLeft,
  Mail,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  PenSquare,
  LogOut,
  Clock,
  Send,
  MessageSquare,
  Trash2,
  X,
  Info,
  Star,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  CheckCheck,
  Users,
  BookOpen,
} from 'lucide-react';
import { getStoredSession, setStoredSession } from '@/lib/clientAuth';
import {
  fetchLettersToEditor,
  markLetterAsRead,
  toggleLetterFeatured,
  deleteLetterToEditor,
  fetchSupabaseArticlesAndDrafts,
  ReaderLetter,
  fetchSupabaseAuthors,
  saveSupabaseAuthor,
  deleteSupabaseAuthor,
  fetchSupabasePackets,
  saveSupabasePacket,
  deleteSupabasePacket,
} from '@/lib/supabase';
import { ArticleStudio } from '@/components/cms/ArticleStudio';

const INITIAL_AUTHORS = [
  'Akhil U Krishnan',
  'Amala Thomas',
];

const INITIAL_PACKETS = [
  'Packet 1',
  'Packet 2',
  'Packet 3',
];

// Helper to ensure founders remain permanent and protected
const isFounderAuthor = (name: string) => {
  const lower = name.toLowerCase().trim();
  return lower.includes('akhil') || lower.includes('amala');
};

export default function EditorialDeskPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Cache Revalidation State
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [revalidateStatus, setRevalidateStatus] = useState<{
    success: boolean;
    message: string;
    timestamp?: string;
  } | null>(null);

  // Dynamic Pools (persisted)
  const [authors, setAuthors] = useState<string[]>(INITIAL_AUTHORS);
  const [packets, setPackets] = useState<string[]>(INITIAL_PACKETS);

  // Navigation Tab State
  const [activePublisherTab, setActivePublisherTab] = useState<'studio' | 'letters'>('studio');

  // Info Guide Modal State
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Author Management Modal State
  const [showAuthorsModal, setShowAuthorsModal] = useState(false);
  const [newAuthorInput, setNewAuthorInput] = useState('');
  const [authorToDelete, setAuthorToDelete] = useState<string | null>(null);
  const [deleteConfirmationStep, setDeleteConfirmationStep] = useState<1 | 2>(1);

  // Issue Packet Management Modal State
  const [showPacketsModal, setShowPacketsModal] = useState(false);
  const [newPacketInput, setNewPacketInput] = useState('');
  const [packetToDelete, setPacketToDelete] = useState<string | null>(null);

  // Synchronize persisted author and packet pools on initial mount
  useEffect(() => {
    try {
      const savedAuthors = localStorage.getItem('omt_editor_authors_v2');
      if (savedAuthors) {
        const parsed = JSON.parse(savedAuthors);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const combined = Array.from(new Set([...INITIAL_AUTHORS, ...parsed]));
          setAuthors(combined);
        }
      }
      const savedPackets = localStorage.getItem('omt_editor_packets_v1');
      if (savedPackets) {
        const parsed = JSON.parse(savedPackets);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const combined = Array.from(new Set([...INITIAL_PACKETS, ...parsed]));
          setPackets(combined);
        }
      }
    } catch {}

    // Also scan articles & drafts from Supabase to auto-discover any contributor names
    fetchSupabaseArticlesAndDrafts()
      .then((records) => {
        if (records && records.length > 0) {
          const found = new Set<string>();
          records.forEach((r) => {
            if (typeof r?.author_names === 'string') {
              r.author_names.split(/[,&]/).forEach((n) => {
                const trimmed = n.trim();
                if (trimmed) found.add(trimmed);
              });
            }
            if (Array.isArray(r?.authors)) {
              r.authors.forEach((a) => {
                if (typeof a === 'string') {
                  const trimmed = a.trim();
                  if (trimmed) found.add(trimmed);
                }
              });
            }
          });
          if (found.size > 0) {
            setAuthors((prev) => {
              const combined = Array.from(new Set([...prev, ...Array.from(found)]));
              try {
                localStorage.setItem('omt_editor_authors_v2', JSON.stringify(combined));
              } catch {}
              return combined;
            });
          }
        }
      })
    // Fetch live author & packet pools from Supabase
    fetchSupabaseAuthors()
      .then((dbAuthors) => {
        if (dbAuthors && dbAuthors.length > 0) {
          setAuthors((prev) => {
            const combined = Array.from(new Set([...prev, ...dbAuthors]));
            try {
              localStorage.setItem('omt_editor_authors_v2', JSON.stringify(combined));
            } catch {}
            return combined;
          });
        }
      })
      .catch(() => {});

    fetchSupabasePackets()
      .then((dbPackets) => {
        if (dbPackets && dbPackets.length > 0) {
          setPackets((prev) => {
            const combined = Array.from(new Set([...prev, ...dbPackets]));
            try {
              localStorage.setItem('omt_editor_packets_v1', JSON.stringify(combined));
            } catch {}
            return combined;
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleAddAuthor = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    saveSupabaseAuthor(trimmed).catch(() => {});
    if (!authors.includes(trimmed)) {
      const updated = [...authors, trimmed];
      setAuthors(updated);
      try {
        localStorage.setItem('omt_editor_authors_v2', JSON.stringify(updated));
      } catch {}
    }
  };

  const handleRemoveAuthor = (name: string) => {
    if (isFounderAuthor(name)) {
      alert(`"${name}" is a founding editor and cannot be removed.`);
      return;
    }
    if (authors.length <= 2) {
      alert('You must keep at least the founding authors.');
      return;
    }
    deleteSupabaseAuthor(name).catch(() => {});
    const updated = authors.filter((a) => a !== name);
    setAuthors(updated);
    try {
      localStorage.setItem('omt_editor_authors_v2', JSON.stringify(updated));
    } catch {}
  };

  const handleAddPacket = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const formatted = trimmed.toLowerCase().startsWith('packet')
      ? trimmed
      : `Packet ${trimmed}`;
    saveSupabasePacket(formatted).catch(() => {});
    if (!packets.includes(formatted)) {
      const updated = [...packets, formatted];
      setPackets(updated);
      try {
        localStorage.setItem('omt_editor_packets_v1', JSON.stringify(updated));
      } catch {}
    }
  };

  const handleRemovePacket = (name: string) => {
    if (packets.length <= 1) {
      alert('You must keep at least one issue packet.');
      return;
    }
    deleteSupabasePacket(name).catch(() => {});
    const updated = packets.filter((p) => p !== name);
    setPackets(updated);
    try {
      localStorage.setItem('omt_editor_packets_v1', JSON.stringify(updated));
    } catch {}
  };

  // Reader Letters State
  const [readerLetters, setReaderLetters] = useState<ReaderLetter[]>([]);
  const [loadingLetters, setLoadingLetters] = useState(false);
  const [expandedLetterId, setExpandedLetterId] = useState<string | null>(null);
  const [lettersFilter, setLettersFilter] = useState<'all' | 'unread' | 'featured'>('all');
  const [lettersSearch, setLettersSearch] = useState('');

  const loadLettersFromSource = async () => {
    setLoadingLetters(true);
    try {
      const remote = await fetchLettersToEditor();
      if (remote && remote.length > 0) {
        setReaderLetters(remote);
        setLoadingLetters(false);
        return;
      }
    } catch (err) {
      console.warn('Failed to load letters from Supabase:', err);
    }

    // Fallback to localStorage
    try {
      const raw = localStorage.getItem('omt_reader_letters');
      if (raw) {
        setReaderLetters(JSON.parse(raw));
      }
    } catch {}
    setLoadingLetters(false);
  };

  // Check and synchronize publisher session
  useEffect(() => {
    const syncAuth = () => {
      const storedSess = getStoredSession();
      if (storedSess && storedSess.role === 'publisher') {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        sessionStorage.removeItem('omt_editorial_auth');
      }
    };

    syncAuth();
    window.addEventListener('omt-auth-changed', syncAuth);
    window.addEventListener('storage', syncAuth);

    // Initial load of letters from Supabase
    loadLettersFromSource();

    // Load custom dynamic authors and packets from localStorage
    try {
      const rawAuthors = localStorage.getItem('omt_editor_authors_v2');
      if (rawAuthors) {
        const parsed = JSON.parse(rawAuthors);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAuthors(parsed);
        }
      } else {
        setAuthors(INITIAL_AUTHORS);
        localStorage.setItem('omt_editor_authors_v2', JSON.stringify(INITIAL_AUTHORS));
      }

      const rawPackets = localStorage.getItem('omt_editor_packets_v2');
      if (rawPackets) {
        const parsed = JSON.parse(rawPackets);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPackets(parsed);
        }
      } else {
        setPackets(INITIAL_PACKETS);
        localStorage.setItem('omt_editor_packets_v2', JSON.stringify(INITIAL_PACKETS));
      }
    } catch {}

    return () => {
      window.removeEventListener('omt-auth-changed', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === 'omt2026' || pinInput.trim() === 'admin' || pinInput.trim() === 'editorial') {
      setIsAuthenticated(true);
      sessionStorage.setItem('omt_editorial_auth', 'true');
      setStoredSession({
        name: 'Akhil U Krishnan',
        email: 'akhil@oldmangotree.media',
        role: 'publisher',
        authenticatedAt: new Date().toISOString(),
      });
      window.dispatchEvent(new Event('omt-auth-changed'));
      setPinError('');
    } else {
      setPinError('Invalid editorial PIN. Please check with the lead editor.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPinInput('');
    setPinError('');
    sessionStorage.removeItem('omt_editorial_auth');
    setStoredSession(null);
    window.dispatchEvent(new Event('omt-auth-changed'));
  };

  // Live Edge Cache Revalidation
  const handleRevalidate = async () => {
    setIsRevalidating(true);
    setRevalidateStatus(null);

    try {
      const res = await fetch('/api/revalidate?secret=oldmangotree-secret&path=/');
      const data = await res.json();

      if (res.ok) {
        setRevalidateStatus({
          success: true,
          message: 'Website edge cache purged successfully! Live readers are now seeing the newest stories.',
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        });
      } else {
        setRevalidateStatus({
          success: false,
          message: data.message || 'Cache purge failed. Check your revalidation secret.',
        });
      }
    } catch (err: any) {
      setRevalidateStatus({
        success: false,
        message: err?.message || 'Network connection failed during cache purge.',
      });
    } finally {
      setIsRevalidating(false);
    }
  };

  // Reader Letters Action Handlers
  const handleToggleLetterRead = async (id: string, currentRead: boolean) => {
    const nextRead = !currentRead;
    setReaderLetters((prev) =>
      prev.map((l) => (l.id === id ? { ...l, is_read: nextRead } : l))
    );
    await markLetterAsRead(id, nextRead);
  };

  const handleToggleLetterFeatured = async (id: string, currentFeatured: boolean) => {
    const nextFeatured = !currentFeatured;
    setReaderLetters((prev) =>
      prev.map((l) => (l.id === id ? { ...l, is_featured: nextFeatured } : l))
    );
    await toggleLetterFeatured(id, nextFeatured);
  };

  const handleDeleteLetter = async (id: string) => {
    if (confirm('Permanently delete this reader letter from the inbox?')) {
      setReaderLetters((prev) => prev.filter((l) => l.id !== id));
      await deleteLetterToEditor(id);
    }
  };

  // Reader Letters Counts & Filtered List
  const totalLettersCount = readerLetters.length;
  const unreadLettersCount = readerLetters.filter((l) => !l.is_read).length;
  const featuredLettersCount = readerLetters.filter((l) => l.is_featured).length;

  const filteredLetters = useMemo(() => {
    return readerLetters.filter((letter) => {
      // 1. Filter by status
      if (lettersFilter === 'unread' && letter.is_read) return false;
      if (lettersFilter === 'featured' && !letter.is_featured) return false;

      // 2. Search query filter
      if (lettersSearch.trim()) {
        const q = lettersSearch.toLowerCase();
        const sender = (letter.sender_name || '').toLowerCase();
        const email = (letter.sender_email || '').toLowerCase();
        const title = (letter.article_title || '').toLowerCase();
        const body = (letter.letter_body || '').toLowerCase();
        return sender.includes(q) || email.includes(q) || title.includes(q) || body.includes(q);
      }

      return true;
    });
  }, [readerLetters, lettersFilter, lettersSearch]);

  // 1. PIN Guard Screen
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-paper-card dark:bg-paper-cardDark border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
        <div className="space-y-2 text-center">
          <div className="w-14 h-14 bg-[#0C2340] text-[#E27A2B] mx-auto flex items-center justify-center border border-[#E27A2B]/40 shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-neutral-900 dark:text-neutral-50 pt-2">
            Editorial Desk Access
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            Private portal for oldmangotree editors, columnists, and production managers.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">
              Editorial PIN
            </label>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter PIN (default: omt2026)"
              className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-sm font-mono text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#E27A2B]"
              autoFocus
            />
            {pinError && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{pinError}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#0C2340] hover:bg-[#123157] text-[#E27A2B] font-bold text-sm tracking-wider uppercase border border-[#E27A2B]/40 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Enter Newsroom Desk</span>
            <Sparkles className="w-4 h-4 text-[#E27A2B]" />
          </button>
        </form>

        <div className="text-center pt-2">
          <Link
            href="/"
            className="text-xs text-neutral-500 hover:text-[#E27A2B] transition-colors inline-flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Website
          </Link>
        </div>
      </div>
    );
  }

  // 2. Authenticated Editorial Desk
  return (
    <div className="space-y-8 py-2 sm:py-4">
      {/* Top Banner & Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-widest text-[#E27A2B]">
            <span>Production &amp; Headless Operations</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-50">
              Editorial Desk Command
            </h1>
            <button
              type="button"
              onClick={() => setShowInfoModal(true)}
              className="p-1.5 rounded text-neutral-500 hover:text-[#E27A2B] bg-neutral-100 dark:bg-neutral-800 hover:bg-[#E27A2B]/10 border border-neutral-300 dark:border-neutral-700 transition-colors cursor-pointer"
              title="Editorial Desk Guide"
              aria-label="Editorial Desk Guide"
            >
              <Info className="w-4 h-4 text-[#E27A2B]" />
            </button>
          </div>
          <p className="text-neutral-700 dark:text-neutral-300 text-sm sm:text-base max-w-2xl pt-1">
            Write, preview, and publish articles with rich text, WebP images, direct audio uploads, and reader letters.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => setShowAuthorsModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            title="Manage registered authors"
          >
            <Users className="w-4 h-4 text-[#E27A2B]" />
            <span>Authors ({authors.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPacketsModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            title="Manage webzine issue packets"
          >
            <BookOpen className="w-4 h-4 text-[#E27A2B]" />
            <span>Issue Packets ({packets.length})</span>
          </button>

          <button
            type="button"
            onClick={handleRevalidate}
            disabled={isRevalidating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer disabled:opacity-50"
            title="Purge Next.js edge cache so published articles go live immediately"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRevalidating ? 'animate-spin' : ''}`} />
            <span>{isRevalidating ? 'Purging Cache...' : 'Purge Edge Cache'}</span>
          </button>

          <Link
            href="/"
            className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> View Site
          </Link>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      {/* Cache Revalidation Notification Banner */}
      {revalidateStatus && (
        <div
          className={`p-3.5 border text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in ${
            revalidateStatus.success
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
          }`}
        >
          {revalidateStatus.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 space-y-0.5">
            <p className="font-bold">{revalidateStatus.message}</p>
            {revalidateStatus.timestamp && (
              <p className="text-[11px] text-neutral-500 font-mono">
                Purged at: {revalidateStatus.timestamp}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setRevalidateStatus(null)}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Editorial Mode Navigation: Exactly Two Clean Tabs */}
      <nav className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-px overflow-x-auto">
        <button
          type="button"
          onClick={() => setActivePublisherTab('studio')}
          className={`flex items-center gap-2 px-6 py-3 font-serif text-sm sm:text-base font-bold transition-all border-b-2 cursor-pointer shrink-0 ${
            activePublisherTab === 'studio'
              ? 'border-[#E27A2B] text-[#E27A2B] bg-neutral-100/50 dark:bg-neutral-800/50'
              : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#E27A2B]" />
          <span>Article Studio (Custom CMS)</span>
        </button>

        <button
          type="button"
          onClick={() => setActivePublisherTab('letters')}
          className={`flex items-center gap-2 px-6 py-3 font-serif text-sm sm:text-base font-bold transition-all border-b-2 cursor-pointer shrink-0 ${
            activePublisherTab === 'letters'
              ? 'border-[#E27A2B] text-[#E27A2B] bg-neutral-100/50 dark:bg-neutral-800/50'
              : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Reader Letters &amp; Feedback Inbox</span>
          <span className="ml-1.5 px-2 py-0.5 bg-[#0C2340] text-white dark:bg-neutral-800 text-xs font-mono font-bold rounded-full">
            {totalLettersCount}
          </span>
          {unreadLettersCount > 0 && (
            <span className="px-2 py-0.5 bg-[#E27A2B] text-white text-[10px] font-bold uppercase rounded-full">
              {unreadLettersCount} new
            </span>
          )}
        </button>
      </nav>

      {/* Mode 1: Article Studio (Custom CMS Editor) */}
      {activePublisherTab === 'studio' && (
        <ArticleStudio
          authors={authors}
          packets={packets}
          onAddAuthor={handleAddAuthor}
          onAddPacket={(pkt) => {
            handleAddPacket(pkt);
          }}
        />
      )}

      {/* Mode 2: Reader Letters & Feedback Inbox (Single-Line Compact Accordion UI) */}
      {activePublisherTab === 'letters' && (
        <section className="space-y-4 animate-in fade-in duration-150">
          {/* Inbox Filter & Refresh Controls Bar */}
          <div className="p-3 sm:p-4 bg-paper-card dark:bg-paper-cardDark border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xs">
            {/* Filter Pills: All, Unread */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLettersFilter('all')}
                className={`px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer rounded-xs ${
                  lettersFilter === 'all'
                    ? 'bg-[#0C2340] text-white dark:bg-[#E27A2B] shadow-xs'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                All ({totalLettersCount})
              </button>
              <button
                type="button"
                onClick={() => setLettersFilter('unread')}
                className={`px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer rounded-xs flex items-center gap-1.5 ${
                  lettersFilter === 'unread'
                    ? 'bg-[#E27A2B] text-white shadow-xs'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                <span>Unread</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    lettersFilter === 'unread'
                      ? 'bg-white/20 text-white'
                      : 'bg-[#E27A2B]/15 text-[#E27A2B]'
                  }`}
                >
                  {unreadLettersCount}
                </span>
              </button>
            </div>

            {/* Search and Refresh */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search sender, article, letter..."
                  value={lettersSearch}
                  onChange={(e) => setLettersSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#E27A2B] rounded-xs w-full sm:w-60"
                />
              </div>

              <button
                type="button"
                onClick={loadLettersFromSource}
                disabled={loadingLetters}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0C2340] dark:bg-neutral-800 hover:bg-[#1a3a60] dark:hover:bg-neutral-700 text-white text-xs font-semibold rounded-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                title="Refresh letters list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLetters ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Single-Line Letters List */}
          <div className="bg-paper-card dark:bg-paper-cardDark border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
            {filteredLetters.length === 0 ? (
              <div className="py-12 text-center text-neutral-500 text-sm space-y-2">
                <MessageSquare className="w-10 h-10 mx-auto text-neutral-400/60" />
                <p className="font-semibold text-neutral-700 dark:text-neutral-300">
                  {lettersSearch ? 'No letters match your search query.' : 'No reader letters found.'}
                </p>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  When readers click &quot;Letter to Editor&quot; on any published story, their letters will appear here in this single-line inbox.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filteredLetters.map((letter) => {
                  const id = letter.id;
                  const isExpanded = expandedLetterId === id;
                  const sender = letter.sender_name || 'Anonymous Reader';
                  const email = letter.sender_email || '';
                  const title = letter.article_title || 'General Webzine Feedback';
                  const body = letter.letter_body || '';
                  const dateStr = letter.created_at;
                  const isRead = Boolean(letter.is_read);
                  const isFeatured = Boolean(letter.is_featured);

                  return (
                    <div
                      key={id}
                      className={`transition-colors ${
                        !isRead
                          ? 'bg-amber-50/40 dark:bg-amber-950/20'
                          : 'hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40'
                      }`}
                    >
                      {/* Single Line Header Row */}
                      <div
                        onClick={() => setExpandedLetterId(isExpanded ? null : id)}
                        className="px-3 sm:px-4 py-3 flex items-center gap-3 cursor-pointer select-none text-xs"
                      >
                        {/* Status Dot */}
                        <div className="shrink-0 flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              !isRead ? 'bg-[#E27A2B] ring-2 ring-[#E27A2B]/20' : 'bg-neutral-300 dark:bg-neutral-600'
                            }`}
                            title={!isRead ? 'Unread message' : 'Read'}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleLetterFeatured(id, isFeatured);
                            }}
                            className={`p-1 rounded-xs transition-colors ${
                              isFeatured
                                ? 'text-amber-500 hover:text-amber-600'
                                : 'text-neutral-300 dark:text-neutral-600 hover:text-amber-400'
                            }`}
                            title={isFeatured ? 'Featured in Webzine (Click to unfeature)' : 'Mark as Featured in Webzine'}
                          >
                            <Star className={`w-3.5 h-3.5 ${isFeatured ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        {/* Sender Name */}
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100 min-w-[110px] max-w-[150px] truncate shrink-0">
                          {sender}
                        </div>

                        {/* Sender Email (hidden on small screens) */}
                        <div className="text-neutral-400 font-mono text-[11px] min-w-[130px] max-w-[180px] truncate hidden md:inline shrink-0">
                          {email ? `<${email}>` : ''}
                        </div>

                        {/* Article Title Tag */}
                        <div className="shrink-0 max-w-[140px] sm:max-w-[200px] truncate">
                          <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium text-[10px] rounded-xs truncate inline-block max-w-full">
                            {title}
                          </span>
                        </div>

                        {/* Message Preview (Truncated to single line) */}
                        <div className="flex-1 min-w-0 text-neutral-600 dark:text-neutral-400 font-serif italic truncate">
                          &ldquo;{body.replace(/\n+/g, ' ')}&rdquo;
                        </div>

                        {/* Date */}
                        <div className="text-neutral-400 font-mono text-[11px] shrink-0 whitespace-nowrap hidden sm:inline">
                          {dateStr
                            ? new Date(dateStr).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'Recent'}
                        </div>

                        {/* Expand / Collapse Chevron */}
                        <div className="text-neutral-400 shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-[#E27A2B]" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Letter Details Panel */}
                      {isExpanded && (
                        <div className="px-4 sm:px-6 py-4 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 space-y-4 animate-in fade-in duration-100">
                          {/* Metadata Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-neutral-100 dark:border-neutral-800 pb-3">
                            <div className="space-y-1">
                              <p className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                                {sender} {letter.location && <span className="font-normal text-neutral-500">from {letter.location}</span>}
                              </p>
                              <div className="flex items-center gap-2 text-neutral-500">
                                <span>Email:</span>
                                <a
                                  href={`mailto:${email}?subject=Re: Letter to Editor on ${encodeURIComponent(title)}`}
                                  className="text-[#E27A2B] hover:underline font-mono"
                                >
                                  {email}
                                </a>
                              </div>
                              <p className="text-neutral-500">
                                Article:{' '}
                                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                                  {title}
                                </span>
                              </p>
                            </div>

                            <div className="text-right space-y-1">
                              <span className="text-xs text-neutral-400 font-mono block">
                                {dateStr ? new Date(dateStr).toLocaleString() : 'Recent'}
                              </span>
                              {isFeatured && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold uppercase border border-amber-300 dark:border-amber-800 rounded-xs">
                                  <Star className="w-3 h-3 fill-current" /> Featured in Webzine
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Full Letter Body */}
                          <div className="p-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 font-serif text-sm sm:text-base leading-relaxed text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap italic">
                            &ldquo;{body}&rdquo;
                          </div>

                          {/* Action Buttons Toolbar */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                            <div className="flex items-center gap-2">
                              {/* Reply via Email */}
                              <a
                                href={`mailto:${email}?subject=Re: Letter to Editor on ${encodeURIComponent(title)}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0C2340] hover:bg-[#123157] text-white text-xs font-bold rounded-xs transition-colors"
                              >
                                <Send className="w-3.5 h-3.5 text-[#E27A2B]" />
                                <span>Reply via Email</span>
                              </a>

                              {/* Toggle Read / Unread */}
                              <button
                                type="button"
                                onClick={() => handleToggleLetterRead(id, isRead)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 text-xs font-medium rounded-xs transition-colors cursor-pointer"
                              >
                                {isRead ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-neutral-400" />
                                    <span>Mark as Unread</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Mark as Read</span>
                                  </>
                                )}
                              </button>

                              {/* Toggle Feature */}
                              <button
                                type="button"
                                onClick={() => handleToggleLetterFeatured(id, isFeatured)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xs border transition-colors cursor-pointer ${
                                  isFeatured
                                    ? 'bg-amber-500 text-white border-amber-600'
                                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:text-[#E27A2B]'
                                }`}
                              >
                                <Star className={`w-3.5 h-3.5 ${isFeatured ? 'fill-current' : ''}`} />
                                <span>{isFeatured ? 'Featured ★' : 'Feature in Webzine'}</span>
                              </button>
                            </div>

                            {/* Delete Letter */}
                            <button
                              type="button"
                              onClick={() => handleDeleteLetter(id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xs transition-colors cursor-pointer"
                              title="Delete letter"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Author Directory / Management Modal */}
      {showAuthorsModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="w-full max-w-md bg-paper-card dark:bg-paper-cardDark border border-[#E27A2B]/40 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-[#0C2340] text-[#E27A2B] flex items-center justify-center border border-[#E27A2B]/40">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-neutral-900 dark:text-neutral-50">
                    Author Directory
                  </h3>
                  <p className="text-[11px] text-neutral-500 font-mono">
                    {authors.length} registered bylines
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAuthorsModal(false);
                  setNewAuthorInput('');
                }}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Add New Author Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newAuthorInput.trim()) {
                  handleAddAuthor(newAuthorInput.trim());
                  setNewAuthorInput('');
                }
              }}
              className="space-y-1.5"
            >
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                Add New Author / Columnist
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter full author name..."
                  value={newAuthorInput}
                  onChange={(e) => setNewAuthorInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded focus:ring-1 focus:ring-[#E27A2B]"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newAuthorInput.trim()}
                  className="px-4 py-2 bg-[#E27A2B] hover:bg-[#d66f22] text-white text-xs font-bold rounded transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                >
                  + Add
                </button>
              </div>
            </form>

            {/* List of Registered Authors */}
            <div className="space-y-1 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                Active Author Pool
              </label>
              <div className="max-h-60 overflow-y-auto divide-y divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded">
                {authors.map((auth) => {
                  const isConfirming = authorToDelete === auth;
                  const isFounder = isFounderAuthor(auth);
                  return (
                    <div
                      key={auth}
                      className={`flex items-center justify-between px-3 py-2.5 text-xs transition-colors ${
                        isConfirming
                          ? 'bg-red-50 dark:bg-red-950/40 border-l-4 border-red-500'
                          : 'bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                      }`}
                    >
                      {isConfirming ? (
                        <>
                          <div className="flex items-center gap-1.5 text-red-700 dark:text-red-300 font-semibold pr-2">
                            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            <span>
                              {deleteConfirmationStep === 1
                                ? `Delete "${auth}"?`
                                : `Are you sure? Confirm delete.`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Delete / Confirm Button on Left Side */}
                            {deleteConfirmationStep === 1 ? (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmationStep(2)}
                                className="px-3 py-1 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded transition-colors shadow-xs cursor-pointer"
                              >
                                Delete
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  handleRemoveAuthor(auth);
                                  setAuthorToDelete(null);
                                  setDeleteConfirmationStep(1);
                                }}
                                className="px-3 py-1 text-xs font-bold bg-red-700 hover:bg-red-800 text-white rounded transition-colors shadow-xs cursor-pointer animate-pulse"
                              >
                                Confirm Delete
                              </button>
                            )}
                            {/* Back / Cancel Button on Right Side */}
                            <button
                              type="button"
                              onClick={() => {
                                setAuthorToDelete(null);
                                setDeleteConfirmationStep(1);
                              }}
                              className="px-3 py-1 text-xs font-semibold bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded transition-colors cursor-pointer"
                            >
                              {deleteConfirmationStep === 1 ? 'Back' : 'Cancel'}
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                              {auth}
                            </span>
                          </div>
                          {!isFounder && (
                            <button
                              type="button"
                              onClick={() => {
                                setAuthorToDelete(auth);
                                setDeleteConfirmationStep(1);
                              }}
                              className="text-neutral-400 hover:text-red-500 p-1.5 rounded transition-colors cursor-pointer"
                              title={`Delete "${auth}"`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setShowAuthorsModal(false);
                  setNewAuthorInput('');
                  setAuthorToDelete(null);
                  setDeleteConfirmationStep(1);
                }}
                className="px-4 py-1.5 bg-[#0C2340] text-white hover:bg-[#123157] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Webzine Issue Packets Management Modal Dialog */}
      {showPacketsModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-[#E27A2B]/40 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-[#0C2340] text-[#E27A2B] flex items-center justify-center border border-[#E27A2B]/40">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-lg font-bold text-neutral-900 dark:text-neutral-50">
                  Webzine Issue Packets
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPacketsModal(false);
                  setNewPacketInput('');
                  setPacketToDelete(null);
                }}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Create new issue packets to group articles into seasonal or numbered editions published at <span className="font-mono text-[#E27A2B]">/webzine</span>.
            </p>

            {/* Add New Packet Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newPacketInput.trim()) {
                  handleAddPacket(newPacketInput.trim());
                  setNewPacketInput('');
                }
              }}
              className="space-y-1.5"
            >
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                Issue Packet Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Packet 4 or Monsoon 2026..."
                  value={newPacketInput}
                  onChange={(e) => setNewPacketInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded focus:ring-1 focus:ring-[#E27A2B]"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newPacketInput.trim()}
                  className="px-4 py-2 bg-[#E27A2B] hover:bg-[#d66f22] text-white text-xs font-bold rounded transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                >
                  + Add
                </button>
              </div>
            </form>

            {/* List of Registered Packets */}
            <div className="space-y-1 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                Active Issue Packets Pool
              </label>
              <div className="max-h-60 overflow-y-auto divide-y divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded">
                {packets.map((pkt) => {
                  const isConfirming = packetToDelete === pkt;
                  return (
                    <div
                      key={pkt}
                      className={`flex items-center justify-between px-3 py-2.5 text-xs transition-colors ${
                        isConfirming
                          ? 'bg-red-50 dark:bg-red-950/40 border-l-4 border-red-500'
                          : 'bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                      }`}
                    >
                      {isConfirming ? (
                        <>
                          <div className="flex items-center gap-1.5 text-red-700 dark:text-red-300 font-semibold pr-2">
                            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            <span>Delete &ldquo;{pkt}&rdquo;?</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                handleRemovePacket(pkt);
                                setPacketToDelete(null);
                              }}
                              className="px-3 py-1 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded transition-colors shadow-xs cursor-pointer"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setPacketToDelete(null)}
                              className="px-3 py-1 text-xs font-semibold bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded transition-colors cursor-pointer"
                            >
                              Back
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {pkt}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPacketToDelete(pkt)}
                            className="text-neutral-400 hover:text-red-500 p-1.5 rounded transition-colors cursor-pointer"
                            title={`Delete "${pkt}"`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setShowPacketsModal(false);
                  setNewPacketInput('');
                  setPacketToDelete(null);
                }}
                className="px-4 py-1.5 bg-[#0C2340] text-white hover:bg-[#123157] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editorial Desk Quick Working Guide Modal Dialog */}
      {showInfoModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="w-full max-w-md bg-paper-card dark:bg-paper-cardDark border border-[#E27A2B]/40 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-[#0C2340] text-[#E27A2B] flex items-center justify-center border border-[#E27A2B]/40">
                  <Info className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-lg font-bold text-neutral-900 dark:text-neutral-50">
                  Editorial Desk Guide
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Your integrated in-house publishing system:
              </p>

              <ol className="space-y-2 text-xs">
                <li className="flex items-start gap-2.5 p-2 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
                  <span className="w-5 h-5 bg-[#0C2340] text-[#E27A2B] font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                  <div>
                    <strong className="text-neutral-900 dark:text-neutral-100 block">Article Studio</strong>
                    Write in rich text or HTML mode, upload compressed WebP photos, and upload podcasts/narrations.
                  </div>
                </li>
                <li className="flex items-start gap-2.5 p-2 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
                  <span className="w-5 h-5 bg-[#0C2340] text-[#E27A2B] font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                  <div>
                    <strong className="text-neutral-900 dark:text-neutral-100 block">Save Drafts &amp; Resume</strong>
                    Hit <em>Save Draft</em> anytime to persist in the database, and load via <em>Library &amp; Drafts</em>.
                  </div>
                </li>
                <li className="flex items-start gap-2.5 p-2 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
                  <span className="w-5 h-5 bg-[#0C2340] text-[#E27A2B] font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
                  <div>
                    <strong className="text-neutral-900 dark:text-neutral-100 block">Publish Live</strong>
                    Publish directly to the reader site, or keep your work safely stored in the database.
                  </div>
                </li>
                <li className="flex items-start gap-2.5 p-2 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
                  <span className="w-5 h-5 bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center shrink-0">4</span>
                  <div>
                    <strong className="text-neutral-900 dark:text-neutral-100 block">Reader Letters Mailbox</strong>
                    Review reader letters in a single-line inbox, reply directly via email, and feature letters in the webzine.
                  </div>
                </li>
              </ol>
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-1.5 bg-[#0C2340] text-[#E27A2B] hover:bg-[#123157] text-xs font-bold uppercase tracking-wider border border-[#E27A2B]/40 transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
