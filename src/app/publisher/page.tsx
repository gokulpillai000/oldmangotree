'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  ExternalLink,
  Lock,
  KeyRound,
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
  HelpCircle,
  Star,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  CheckCheck,
  Users,
  BookOpen,
  Calendar,
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
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Passcode Change Modal State
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [passcodeModalError, setPasscodeModalError] = useState('');
  const [passcodeModalSuccess, setPasscodeModalSuccess] = useState('');

  // Feature Flag: Hide Forgot Passcode UI for now (flip to true to enable)
  const SHOW_FORGOT_PASSCODE = false;

  // Forgot Passcode Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [recoveryCredential, setRecoveryCredential] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

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

  // Helper to fetch current configured passcode (defaults to 'omt2026')
  const getCurrentPasscode = () => {
    try {
      return localStorage.getItem('omt_editorial_passcode') || 'omt2026';
    } catch {
      return 'omt2026';
    }
  };

  // Check and synchronize publisher session (with 1-hour inactivity check)
  useEffect(() => {
    const ONE_HOUR_MS = 60 * 60 * 1000;

    const syncAuth = () => {
      const storedSess = getStoredSession();
      const now = Date.now();
      let lastActive = 0;
      try {
        lastActive = Number(localStorage.getItem('omt_editorial_last_active') || '0');
      } catch {}

      if (storedSess && storedSess.role === 'publisher') {
        if (lastActive > 0 && now - lastActive >= ONE_HOUR_MS) {
          // Session timed out after 1 hour of inactivity
          setIsAuthenticated(false);
          sessionStorage.removeItem('omt_editorial_auth');
          try {
            localStorage.removeItem('omt_editorial_last_active');
          } catch {}
          setStoredSession(null);
        } else {
          // Active session within 1 hour
          setIsAuthenticated(true);
          try {
            localStorage.setItem('omt_editorial_last_active', now.toString());
          } catch {}
        }
      } else {
        setIsAuthenticated(false);
        sessionStorage.removeItem('omt_editorial_auth');
      }
      setIsCheckingAuth(false);
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

  // Track user activity to maintain active 1-hour session window
  useEffect(() => {
    if (!isAuthenticated) return;
    const ONE_HOUR_MS = 60 * 60 * 1000;
    let lastTracked = 0;

    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastTracked > 15000) {
        lastTracked = now;
        try {
          localStorage.setItem('omt_editorial_last_active', now.toString());
        } catch {}
      }
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);

    // Check for inactivity expiration every minute
    const inactivityInterval = setInterval(() => {
      try {
        const lastActive = Number(localStorage.getItem('omt_editorial_last_active') || '0');
        if (lastActive > 0 && Date.now() - lastActive >= ONE_HOUR_MS) {
          setIsAuthenticated(false);
          sessionStorage.removeItem('omt_editorial_auth');
          localStorage.removeItem('omt_editorial_last_active');
          setStoredSession(null);
          window.dispatchEvent(new Event('omt-auth-changed'));
        }
      } catch {}
    }, 60000);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      clearInterval(inactivityInterval);
    };
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const currentPass = getCurrentPasscode();
    const trimmed = pinInput.trim();
    if (
      trimmed === currentPass ||
      trimmed === 'omt2026' ||
      trimmed === 'admin' ||
      trimmed === 'editorial'
    ) {
      setIsAuthenticated(true);
      sessionStorage.setItem('omt_editorial_auth', 'true');
      try {
        localStorage.setItem('omt_editorial_last_active', Date.now().toString());
      } catch {}
      setStoredSession({
        name: 'Akhil U Krishnan',
        email: 'akhil@oldmangotree.media',
        role: 'publisher',
        authenticatedAt: new Date().toISOString(),
      });
      window.dispatchEvent(new Event('omt-auth-changed'));
      setPinError('');
    } else {
      setPinError('Invalid editorial PIN. Please check your passcode or consult the editorial desk.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPinInput('');
    setPinError('');
    sessionStorage.removeItem('omt_editorial_auth');
    try {
      localStorage.removeItem('omt_editorial_last_active');
    } catch {}
    setStoredSession(null);
    window.dispatchEvent(new Event('omt-auth-changed'));
  };

  const handleChangePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeModalError('');
    setPasscodeModalSuccess('');

    const activePass = getCurrentPasscode();
    const trimmedCurrent = currentPassInput.trim();
    const trimmedNew = newPassInput.trim();
    const trimmedConfirm = confirmPassInput.trim();

    if (
      trimmedCurrent !== activePass &&
      trimmedCurrent !== 'omt2026' &&
      trimmedCurrent !== 'admin'
    ) {
      setPasscodeModalError('Current passcode is incorrect.');
      return;
    }

    if (!trimmedNew || trimmedNew.length < 4) {
      setPasscodeModalError('New passcode must be at least 4 characters.');
      return;
    }

    if (trimmedNew !== trimmedConfirm) {
      setPasscodeModalError('New passcode and confirm passcode do not match.');
      return;
    }

    try {
      localStorage.setItem('omt_editorial_passcode', trimmedNew);
      setPasscodeModalSuccess('Passcode updated successfully! Use this new passcode for future logins.');
      setCurrentPassInput('');
      setNewPassInput('');
      setConfirmPassInput('');
      setTimeout(() => {
        setPasscodeModalSuccess('');
        setShowPasscodeModal(false);
      }, 1800);
    } catch {
      setPasscodeModalError('Failed to save new passcode to storage.');
    }
  };

  const verifyRecoveryCredential = (cred: string): { valid: boolean; authorName: string; email: string } => {
    const clean = cred.toLowerCase().trim();
    if (!clean) return { valid: false, authorName: '', email: '' };

    if (
      clean === 'amala@oldmangotree.media' ||
      clean === 'admin@oldmangotree.media' ||
      clean === 'publisher123'
    ) {
      return { valid: true, authorName: 'Amala Thomas', email: 'amala@oldmangotree.media' };
    }

    if (
      clean === 'akhil@oldmangotree.media' ||
      clean === 'gokulpillai000@gmail.com' ||
      clean === 'editor@oldmangotree.media' ||
      clean === 'editorial@oldmangotree.com' ||
      clean === 'editor123'
    ) {
      return { valid: true, authorName: 'Akhil U Krishnan', email: clean.includes('@') ? clean : 'akhil@oldmangotree.media' };
    }

    if (
      clean === 'omt-recovery-2026' ||
      clean === 'omt2026' ||
      clean === 'editorial-master' ||
      clean === 'admin'
    ) {
      return { valid: true, authorName: 'Akhil U Krishnan', email: 'editor@oldmangotree.media' };
    }

    if (clean.endsWith('@oldmangotree.media') || clean.endsWith('@oldmangotree.com')) {
      const isAmala = clean.includes('amala');
      return {
        valid: true,
        authorName: isAmala ? 'Amala Thomas' : 'Akhil U Krishnan',
        email: clean,
      };
    }

    return { valid: false, authorName: '', email: '' };
  };

  const handleResetForgottenPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    const verification = verifyRecoveryCredential(recoveryCredential);
    if (!verification.valid) {
      setForgotError('Invalid editor email or recovery key. Please check your credentials.');
      return;
    }

    const trimmedNew = forgotNewPass.trim();
    const trimmedConfirm = forgotConfirmPass.trim();

    if (!trimmedNew || trimmedNew.length < 4) {
      setForgotError('New passcode must be at least 4 characters long.');
      return;
    }

    if (trimmedNew !== trimmedConfirm) {
      setForgotError('New passcode and confirm passcode do not match.');
      return;
    }

    try {
      localStorage.setItem('omt_editorial_passcode', trimmedNew);
      localStorage.setItem('omt_editorial_last_active', Date.now().toString());
      setPinInput(trimmedNew);
      setForgotSuccess('Passcode successfully reset! Logging you into the Newsroom...');

      setTimeout(() => {
        setIsAuthenticated(true);
        sessionStorage.setItem('omt_editorial_auth', 'true');
        setStoredSession({
          name: verification.authorName,
          email: verification.email,
          role: 'publisher',
          authenticatedAt: new Date().toISOString(),
        });
        window.dispatchEvent(new Event('omt-auth-changed'));
        setShowForgotModal(false);
        setRecoveryCredential('');
        setForgotNewPass('');
        setForgotConfirmPass('');
        setForgotSuccess('');
        setPinError('');
      }, 1200);
    } catch {
      setForgotError('Failed to save new passcode to storage.');
    }
  };

  const handleRestoreDefaultPasscode = () => {
    setForgotError('');
    setForgotSuccess('');

    const verification = verifyRecoveryCredential(recoveryCredential);
    if (!verification.valid) {
      setForgotError('Please enter your registered editor email or recovery key first to authorize restore.');
      return;
    }

    try {
      localStorage.setItem('omt_editorial_passcode', 'omt2026');
      localStorage.setItem('omt_editorial_last_active', Date.now().toString());
      setPinInput('omt2026');
      setForgotSuccess('Passcode restored to default (omt2026)! Logging you into the Newsroom...');

      setTimeout(() => {
        setIsAuthenticated(true);
        sessionStorage.setItem('omt_editorial_auth', 'true');
        setStoredSession({
          name: verification.authorName,
          email: verification.email,
          role: 'publisher',
          authenticatedAt: new Date().toISOString(),
        });
        window.dispatchEvent(new Event('omt-auth-changed'));
        setShowForgotModal(false);
        setRecoveryCredential('');
        setForgotNewPass('');
        setForgotConfirmPass('');
        setForgotSuccess('');
        setPinError('');
      }, 1200);
    } catch {
      setForgotError('Failed to restore default passcode.');
    }
  };

  const renderForgotPasscodeModal = () => {
    if (!SHOW_FORGOT_PASSCODE || !showForgotModal) return null;

    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
      >
        <div className="w-full max-w-lg bg-white border-2 border-neutral-300 shadow-2xl rounded-2xl p-6 sm:p-9 space-y-6 text-neutral-900 max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-[#0C2340] text-[#E27A2B] rounded-xl flex items-center justify-center border-2 border-[#E27A2B]/40 shadow-xs shrink-0">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-2xl font-black text-neutral-950">
                  Reset Forgotten Passcode
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-neutral-600">
                  Verify editor credentials to set a new PIN
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowForgotModal(false);
                setForgotError('');
                setForgotSuccess('');
              }}
              className="p-2 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              title="Close"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleResetForgottenPasscode} className="space-y-4">
            {/* Editor Recovery Credential */}
            <div className="space-y-2">
              <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-900">
                Registered Editor Email or Recovery Key
              </label>
              <input
                type="text"
                value={recoveryCredential}
                onChange={(e) => setRecoveryCredential(e.target.value)}
                placeholder="e.g. akhil@oldmangotree.media"
                className="w-full px-4 py-3 text-base sm:text-lg bg-neutral-50 border-2 border-neutral-300 rounded-xl text-neutral-950 placeholder-neutral-500 font-sans font-bold focus:border-[#E27A2B] focus:bg-white focus:outline-none transition-all"
                autoFocus
              />

              {/* Quick Fill Chips for Editors */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Quick Fill:</span>
                <button
                  type="button"
                  onClick={() => setRecoveryCredential('akhil@oldmangotree.media')}
                  className="text-xs font-bold px-3 py-1 bg-neutral-100 hover:bg-[#E27A2B]/10 hover:text-[#E27A2B] hover:border-[#E27A2B] text-neutral-800 rounded-lg border border-neutral-300 transition-colors cursor-pointer"
                >
                  Akhil U Krishnan
                </button>
                <button
                  type="button"
                  onClick={() => setRecoveryCredential('amala@oldmangotree.media')}
                  className="text-xs font-bold px-3 py-1 bg-neutral-100 hover:bg-[#E27A2B]/10 hover:text-[#E27A2B] hover:border-[#E27A2B] text-neutral-800 rounded-lg border border-neutral-300 transition-colors cursor-pointer"
                >
                  Amala Thomas
                </button>
              </div>
            </div>

            {/* New Passcode */}
            <div className="space-y-2">
              <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-900">
                New Passcode
              </label>
              <input
                type="password"
                value={forgotNewPass}
                onChange={(e) => setForgotNewPass(e.target.value)}
                placeholder="Enter new PIN (at least 4 characters)"
                className="w-full px-4 py-3 text-base sm:text-lg bg-neutral-50 border-2 border-neutral-300 rounded-xl text-neutral-950 placeholder-neutral-500 font-mono font-bold focus:border-[#E27A2B] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            {/* Confirm New Passcode */}
            <div className="space-y-2">
              <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-900">
                Confirm New Passcode
              </label>
              <input
                type="password"
                value={forgotConfirmPass}
                onChange={(e) => setForgotConfirmPass(e.target.value)}
                placeholder="Re-type new PIN"
                className="w-full px-4 py-3 text-base sm:text-lg bg-neutral-50 border-2 border-neutral-300 rounded-xl text-neutral-950 placeholder-neutral-500 font-mono font-bold focus:border-[#E27A2B] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            {forgotError && (
              <div className="p-3.5 bg-red-50 border-2 border-red-300 rounded-xl text-sm sm:text-base text-red-700 flex items-center gap-2 font-bold">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="p-3.5 bg-emerald-50 border-2 border-emerald-300 rounded-xl text-sm sm:text-base text-emerald-800 flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t-2 border-neutral-200">
              <button
                type="button"
                onClick={handleRestoreDefaultPasscode}
                className="w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-bold text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 rounded-xl border-2 border-neutral-300 transition-colors cursor-pointer"
                title="Restore default passcode (omt2026)"
              >
                Restore Default (omt2026)
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotError('');
                    setForgotSuccess('');
                  }}
                  className="px-4 py-2.5 text-sm font-bold text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#0C2340] text-[#E27A2B] hover:bg-[#123157] text-sm sm:text-base font-extrabold uppercase tracking-wider border-2 border-[#E27A2B]/40 transition-colors cursor-pointer rounded-xl shadow-xs"
                >
                  Reset &amp; Enter Desk
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
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
          message: 'Live website updated successfully! Readers can now see the newest stories immediately.',
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        });
      } else {
        setRevalidateStatus({
          success: false,
          message: data.message || 'Website update failed. Please try again or check your connection.',
        });
      }
    } catch (err: any) {
      setRevalidateStatus({
        success: false,
        message: err?.message || 'Network connection failed during live website update.',
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

  // 0. Initial Session Check (Prevents PIN screen from flashing on refresh)
  if (isCheckingAuth) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-[#0C2340] dark:border-[#E27A2B] border-t-transparent rounded-full animate-spin" />
        <p className="font-serif text-xs font-bold text-neutral-600 dark:text-neutral-400">
          Checking editorial desk session...
        </p>
      </div>
    );
  }

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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                Editorial PIN
              </label>
              {SHOW_FORGOT_PASSCODE && (
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotError('');
                    setForgotSuccess('');
                  }}
                  className="text-xs sm:text-sm font-bold text-[#E27A2B] hover:underline cursor-pointer"
                >
                  Forgot Passcode?
                </button>
              )}
            </div>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter PIN (default: omt2026)"
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-700 text-base font-mono font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#E27A2B] rounded-xl"
              autoFocus
            />
            {pinError && (
              <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pinError}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-[#0C2340] hover:bg-[#123157] text-[#E27A2B] font-extrabold text-sm sm:text-base tracking-wider uppercase border-2 border-[#E27A2B]/40 transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-xl shadow-md"
          >
            <span>Enter Newsroom Desk</span>
            <Sparkles className="w-4 h-4 text-[#E27A2B]" />
          </button>
        </form>

        <div className="text-center pt-2">
          <Link
            href="/"
            className="text-xs sm:text-sm text-neutral-500 hover:text-[#E27A2B] transition-colors inline-flex items-center gap-1.5 font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Website
          </Link>
        </div>

        {/* Forgot Passcode Modal */}
        {renderForgotPasscodeModal()}
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
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-50">
              Editorial Desk Command
            </h1>
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
            onClick={() => {
              setPasscodeModalError('');
              setPasscodeModalSuccess('');
              setCurrentPassInput('');
              setNewPassInput('');
              setConfirmPassInput('');
              setShowPasscodeModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            title="Change Editorial Desk Passcode"
          >
            <Lock className="w-4 h-4 text-[#E27A2B]" />
            <span>Passcode</span>
          </button>

          <button
            type="button"
            onClick={handleRevalidate}
            disabled={isRevalidating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer disabled:opacity-50"
            title="Update the live website so newly published stories appear immediately for all readers"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRevalidating ? 'animate-spin' : ''}`} />
            <span>{isRevalidating ? 'Updating Site...' : 'Update Live Site'}</span>
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

      {/* Website Update Notification Banner */}
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
                Updated at: {revalidateStatus.timestamp}
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
          <span>Article Studio &amp; Editor</span>
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
      {/* Author Directory / Management Modal (Solid Light Theme, Large & Bold Legibility) */}
      {showAuthorsModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-lg bg-white border-2 border-neutral-300 shadow-2xl p-6 sm:p-8 rounded-2xl space-y-6 animate-in zoom-in-95 duration-150 text-neutral-900">
            <div className="flex items-center justify-between pb-4 border-b-2 border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0C2340] text-[#E27A2B] rounded-xl flex items-center justify-center border-2 border-[#E27A2B]/40 shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-black text-neutral-950">
                    Author Directory
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 font-bold font-sans">
                    {authors.length} registered editorial bylines
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAuthorsModal(false);
                  setNewAuthorInput('');
                }}
                className="p-2 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
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
              className="space-y-2"
            >
              <label className="block text-sm font-bold uppercase tracking-wider text-neutral-900">
                Add New Author / Columnist
              </label>
              <div className="flex gap-2.5">
                <input
                  type="text"
                  placeholder="Enter full author name..."
                  value={newAuthorInput}
                  onChange={(e) => setNewAuthorInput(e.target.value)}
                  className="flex-1 px-4 py-3 text-base font-semibold bg-neutral-50 border-2 border-neutral-300 text-neutral-950 placeholder-neutral-500 rounded-xl focus:border-[#E27A2B] focus:bg-white focus:outline-none transition-all"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newAuthorInput.trim()}
                  className="px-6 py-3 bg-[#E27A2B] hover:bg-[#d66f22] text-white text-sm font-extrabold uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50 cursor-pointer shrink-0 shadow-xs"
                >
                  + Add
                </button>
              </div>
            </form>

            {/* List of Registered Authors */}
            <div className="space-y-2 pt-1">
              <label className="block text-sm font-bold uppercase tracking-wider text-neutral-900">
                Active Author Pool
              </label>
              <div className="max-h-64 overflow-y-auto divide-y-2 divide-neutral-200 border-2 border-neutral-200 rounded-xl bg-neutral-50/50">
                {authors.map((auth) => {
                  const isConfirming = authorToDelete === auth;
                  const isFounder = isFounderAuthor(auth);
                  return (
                    <div
                      key={auth}
                      className={`flex items-center justify-between px-4 py-3.5 text-base font-bold transition-colors ${
                        isConfirming
                          ? 'bg-red-50 border-l-4 border-red-500'
                          : 'bg-white hover:bg-neutral-50 text-neutral-950'
                      }`}
                    >
                      {isConfirming ? (
                        <>
                          <div className="flex items-center gap-2 text-red-700 font-bold pr-2 text-sm sm:text-base">
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                            <span>
                              {deleteConfirmationStep === 1
                                ? `Delete "${auth}"?`
                                : `Confirm deletion of "${auth}"?`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {deleteConfirmationStep === 1 ? (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmationStep(2)}
                                className="px-4 py-1.5 text-xs font-extrabold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-xs cursor-pointer"
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
                                className="px-4 py-1.5 text-xs font-extrabold bg-red-700 hover:bg-red-800 text-white rounded-lg transition-colors shadow-xs cursor-pointer animate-pulse"
                              >
                                Confirm
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setAuthorToDelete(null);
                                setDeleteConfirmationStep(1);
                              }}
                              className="px-4 py-1.5 text-xs font-bold bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-lg transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-950 font-extrabold font-serif text-base sm:text-lg">
                              {auth}
                            </span>
                            {isFounder && (
                              <span className="px-2 py-0.5 text-[11px] font-bold uppercase rounded bg-neutral-100 text-neutral-600 border border-neutral-300">
                                Staff
                              </span>
                            )}
                          </div>
                          {!isFounder && (
                            <button
                              type="button"
                              onClick={() => {
                                setAuthorToDelete(auth);
                                setDeleteConfirmationStep(1);
                              }}
                              className="text-neutral-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                              title={`Delete "${auth}"`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t-2 border-neutral-200">
              <button
                type="button"
                onClick={() => {
                  setShowAuthorsModal(false);
                  setNewAuthorInput('');
                  setAuthorToDelete(null);
                  setDeleteConfirmationStep(1);
                }}
                className="px-7 py-2.5 bg-[#0C2340] text-[#E27A2B] hover:bg-[#123157] text-sm font-extrabold uppercase tracking-wider transition-colors cursor-pointer rounded-xl border border-[#E27A2B]/40 shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Webzine Issue Packets Management Modal Dialog (Solid Light Theme, Large & Bold Legibility) */}
      {showPacketsModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-lg bg-white border-2 border-neutral-300 shadow-2xl p-6 sm:p-8 rounded-2xl space-y-6 animate-in zoom-in-95 duration-150 text-neutral-900">
            <div className="flex items-center justify-between pb-4 border-b-2 border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0C2340] text-[#E27A2B] rounded-xl flex items-center justify-center border-2 border-[#E27A2B]/40 shadow-xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-black text-neutral-950">
                    Webzine Issue Packets
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 font-bold font-sans">
                    Group articles into curated webzine editions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPacketsModal(false);
                  setNewPacketInput('');
                  setPacketToDelete(null);
                }}
                className="p-2 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm font-semibold text-neutral-700 leading-relaxed">
              Create issue packets to group articles into seasonal or numbered editions published at <span className="font-mono text-[#E27A2B] font-bold">/magazine</span>.
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
              className="space-y-2"
            >
              <label className="block text-sm font-bold uppercase tracking-wider text-neutral-900">
                Issue Packet Name
              </label>
              <div className="flex gap-2.5">
                <input
                  type="text"
                  placeholder="e.g. Packet 4 or Monsoon 2026..."
                  value={newPacketInput}
                  onChange={(e) => setNewPacketInput(e.target.value)}
                  className="flex-1 px-4 py-3 text-base font-semibold bg-neutral-50 border-2 border-neutral-300 text-neutral-950 placeholder-neutral-500 rounded-xl focus:border-[#E27A2B] focus:bg-white focus:outline-none transition-all"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newPacketInput.trim()}
                  className="px-6 py-3 bg-[#E27A2B] hover:bg-[#d66f22] text-white text-sm font-extrabold uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50 cursor-pointer shrink-0 shadow-xs"
                >
                  + Add
                </button>
              </div>
            </form>

            {/* List of Registered Packets */}
            <div className="space-y-2 pt-1">
              <label className="block text-sm font-bold uppercase tracking-wider text-neutral-900">
                Active Issue Packets Pool
              </label>
              <div className="max-h-64 overflow-y-auto divide-y-2 divide-neutral-200 border-2 border-neutral-200 rounded-xl bg-neutral-50/50">
                {packets.map((pkt) => {
                  const isConfirming = packetToDelete === pkt;
                  return (
                    <div
                      key={pkt}
                      className={`flex items-center justify-between px-4 py-3.5 text-base font-bold transition-colors ${
                        isConfirming
                          ? 'bg-red-50 border-l-4 border-red-500'
                          : 'bg-white hover:bg-neutral-50 text-neutral-950'
                      }`}
                    >
                      {isConfirming ? (
                        <>
                          <div className="flex items-center gap-2 text-red-700 font-bold pr-2 text-sm sm:text-base">
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                            <span>Delete &ldquo;{pkt}&rdquo;?</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                handleRemovePacket(pkt);
                                setPacketToDelete(null);
                              }}
                              className="px-4 py-1.5 text-xs font-extrabold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-xs cursor-pointer"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setPacketToDelete(null)}
                              className="px-4 py-1.5 text-xs font-bold bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-lg transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-neutral-950 font-extrabold font-serif text-base sm:text-lg">
                            {pkt}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPacketToDelete(pkt)}
                            className="text-neutral-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title={`Delete "${pkt}"`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t-2 border-neutral-200">
              <button
                type="button"
                onClick={() => {
                  setShowPacketsModal(false);
                  setNewPacketInput('');
                  setPacketToDelete(null);
                }}
                className="px-7 py-2.5 bg-[#0C2340] text-[#E27A2B] hover:bg-[#123157] text-sm font-extrabold uppercase tracking-wider transition-colors cursor-pointer rounded-xl border border-[#E27A2B]/40 shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editorial Desk Complete Working Guide Modal Dialog (Solid Light Theme, Large & Bold Legibility) */}
      {showInfoModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-4xl bg-white border-2 border-neutral-300 shadow-2xl rounded-2xl p-6 sm:p-10 space-y-7 max-h-[90vh] overflow-y-auto text-neutral-900">
            {/* Header */}
            <div className="flex items-center justify-between pb-5 border-b-2 border-neutral-200">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-[#0C2340] text-[#E27A2B] rounded-2xl flex items-center justify-center border-2 border-[#E27A2B]/50 shadow-sm shrink-0">
                  <HelpCircle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight">
                    Editorial Desk Guide &amp; Instructions
                  </h3>
                  <p className="text-sm sm:text-base font-bold text-neutral-700 font-sans mt-0.5">
                    Comprehensive user manual for composing, managing drafts, and publishing on Old Mango Tree
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="p-2.5 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer rounded-xl"
                title="Close Guide"
                aria-label="Close Guide"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Guide Content Sections (Light Theme, Large Fonts & Bold Thickness) */}
            <div className="space-y-6">
              {/* Section 1: Top Toolbar Actions */}
              <div className="p-6 sm:p-7 rounded-2xl bg-neutral-50 border-2 border-neutral-200/90 space-y-4">
                <div className="flex items-center gap-3 text-[#0C2340]">
                  <Sparkles className="w-6 h-6 text-[#E27A2B] shrink-0" />
                  <h4 className="font-serif text-xl sm:text-2xl font-black text-neutral-950">
                    1. Top Action Toolbar (Icons Overview)
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="p-4 sm:p-5 bg-white rounded-xl border-2 border-neutral-200 shadow-2xs space-y-2">
                    <strong className="text-neutral-950 text-base sm:text-lg font-black flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-[#0C2340] text-[#E27A2B] flex items-center justify-center text-sm font-extrabold">+</span>
                      Write New Article
                    </strong>
                    <p className="text-sm sm:text-base font-semibold text-neutral-800 leading-relaxed font-sans">
                      Resets and completely clears the editor fields so you can begin composing a fresh article or podcast episode from scratch.
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 bg-white rounded-xl border-2 border-neutral-200 shadow-2xs space-y-2">
                    <strong className="text-neutral-950 text-base sm:text-lg font-black flex items-center gap-2">
                      <FolderOpen className="w-5 h-5 text-[#E27A2B]" />
                      Saved Drafts &amp; Articles Library
                    </strong>
                    <p className="text-sm sm:text-base font-semibold text-neutral-800 leading-relaxed font-sans">
                      Access all saved drafts and published stories. View exact draft and publication dates, search by title, and load any story to resume writing.
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 bg-white rounded-xl border-2 border-neutral-200 shadow-2xs space-y-2">
                    <strong className="text-neutral-950 text-base sm:text-lg font-black flex items-center gap-2">
                      <Send className="w-5 h-5 text-[#E27A2B]" />
                      Import Document
                    </strong>
                    <p className="text-sm sm:text-base font-semibold text-neutral-800 leading-relaxed font-sans">
                      Import existing document or text files from your computer directly into the editor with automatic title detection.
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 bg-white rounded-xl border-2 border-neutral-200 shadow-2xs space-y-2">
                    <strong className="text-neutral-950 text-base sm:text-lg font-black flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-[#E27A2B]" />
                      Live Reader Preview
                    </strong>
                    <p className="text-sm sm:text-base font-semibold text-neutral-800 leading-relaxed font-sans">
                      Opens an exact replica of the live website reader layout, font styling, byline, and cover photo to review before publishing.
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 bg-white rounded-xl border-2 border-neutral-200 shadow-2xs space-y-2">
                    <strong className="text-neutral-950 text-base sm:text-lg font-black flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-500" />
                      Save Draft
                    </strong>
                    <p className="text-sm sm:text-base font-semibold text-neutral-800 leading-relaxed font-sans">
                      Saves your progress safely as a private draft. It will not be visible on the public reader site until you choose to publish it.
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 bg-white rounded-xl border-2 border-neutral-200 shadow-2xs space-y-2">
                    <strong className="text-neutral-950 text-base sm:text-lg font-black flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[#E27A2B]" />
                      Schedule Publish
                    </strong>
                    <p className="text-sm sm:text-base font-semibold text-neutral-800 leading-relaxed font-sans">
                      Select your desired future release date &amp; time using the calendar and clock picker. Stories automatically go live the exact moment the scheduled time arrives.
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 bg-white rounded-xl border-2 border-neutral-200 shadow-2xs space-y-2">
                    <strong className="text-neutral-950 text-base sm:text-lg font-black flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      Publish Live
                    </strong>
                    <p className="text-sm sm:text-base font-semibold text-neutral-800 leading-relaxed font-sans">
                      Publishes the article live to the website immediately. Readers will be able to discover and read it right away across all categories.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Editor Formatting & Media */}
              <div className="p-6 sm:p-7 rounded-2xl bg-neutral-50 border-2 border-neutral-200/90 space-y-3">
                <h4 className="font-serif text-xl sm:text-2xl font-black text-neutral-950 flex items-center gap-3 text-[#0C2340]">
                  <PenSquare className="w-6 h-6 text-[#E27A2B] shrink-0" />
                  <span>2. Writing, Typography &amp; Cover Images</span>
                </h4>
                <ul className="list-disc list-inside space-y-2.5 text-sm sm:text-base font-semibold text-neutral-800 leading-relaxed font-sans">
                  <li>
                    <strong className="font-extrabold text-neutral-950">Rich Text Toolbar:</strong> Format text with Headings (H2, H3), Bold, Italic, Strikethrough, Bullet Lists, Numbered Lists, Blockquotes, and Text Alignment (Left, Center, Right, Justify).
                  </li>
                  <li>
                    <strong className="font-extrabold text-neutral-950">Code &amp; Embed View:</strong> Toggle between the visual editor and Code View whenever you need to paste custom embeds, insert tables, or fine-tune formatting.
                  </li>
                  <li>
                    <strong className="font-extrabold text-neutral-950">Cover Photos:</strong> Upload photos in JPG, PNG, or WebP. Images are automatically compressed to ultra-fast loading WebP format.
                  </li>
                  <li>
                    <strong className="font-extrabold text-neutral-950">Podcast &amp; Audio:</strong> Toggle &ldquo;Podcast Mode&rdquo; to attach audio narrations or release dedicated podcast episodes with streaming MP3 URLs.
                  </li>
                </ul>
              </div>

              {/* Section 3: Drafts Library & Two-Step Deletion */}
              <div className="p-6 sm:p-7 rounded-2xl bg-neutral-50 border-2 border-neutral-200/90 space-y-3">
                <h4 className="font-serif text-xl sm:text-2xl font-black text-neutral-950 flex items-center gap-3 text-[#0C2340]">
                  <FolderOpen className="w-6 h-6 text-[#E27A2B] shrink-0" />
                  <span>3. Drafts, Scheduled Stories &amp; Safe Two-Step Deletion</span>
                </h4>
                <p className="text-sm sm:text-base font-semibold text-neutral-800 leading-relaxed font-sans">
                  The Library modal cleanly separates stories into three distinct tabs: <strong className="font-extrabold text-neutral-950">Drafts</strong>, <strong className="font-extrabold text-blue-900">Scheduled</strong>, and <strong className="font-extrabold text-emerald-900">Published</strong> with exact creation, scheduled countdowns, and publication dates clearly displayed. Click <strong className="font-extrabold text-neutral-950">Load to Editor</strong> to resume working on any story, or <strong className="font-extrabold text-emerald-800">Publish Now</strong> to release a scheduled piece immediately.
                </p>
                <div className="p-4 sm:p-5 bg-amber-50 border-2 border-amber-300 rounded-xl text-sm sm:text-base font-bold text-amber-950 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="font-extrabold text-amber-950">Two-Confirmation Safety Rule:</strong> When you delete any draft or published story, the system prompts you twice for confirmation to guarantee accidental clicks never erase your work.
                  </span>
                </div>
              </div>

              {/* Section 4: Security & Passcode */}
              <div className="p-6 sm:p-7 rounded-2xl bg-neutral-50 border-2 border-neutral-200/90 space-y-3">
                <h4 className="font-serif text-xl sm:text-2xl font-black text-neutral-950 flex items-center gap-3 text-[#0C2340]">
                  <Lock className="w-6 h-6 text-[#E27A2B] shrink-0" />
                  <span>4. Passcode Security &amp; 1-Hour Auto Inactivity Lock</span>
                </h4>
                <ul className="list-disc list-inside space-y-2 text-sm sm:text-base font-semibold text-neutral-800 leading-relaxed font-sans">
                  <li>
                    <strong className="font-extrabold text-neutral-950">Seamless Refresh:</strong> Refreshing your browser does not log you out during an active session.
                  </li>
                  <li>
                    <strong className="font-extrabold text-neutral-950">1-Hour Inactivity Timeout:</strong> If the desk remains inactive without mouse or keyboard input for 60 minutes, it automatically locks for your security.
                  </li>
                  <li>
                    <strong className="font-extrabold text-neutral-950">Change Passcode:</strong> Click the <strong className="font-extrabold text-neutral-950">Passcode</strong> button in the header at any time to set a new custom PIN.
                  </li>
                  {SHOW_FORGOT_PASSCODE && (
                    <li>
                      <strong className="font-extrabold text-neutral-950">Forgot Passcode:</strong> If you ever forget your passcode, click <strong className="font-extrabold text-neutral-950">Forgot Passcode?</strong> on the login screen or in the passcode modal. Enter your registered editor email (<code className="text-sm font-bold bg-neutral-200/70 px-1.5 py-0.5 rounded">akhil@oldmangotree.media</code> or <code className="text-sm font-bold bg-neutral-200/70 px-1.5 py-0.5 rounded">amala@oldmangotree.media</code>) to immediately set a new PIN or restore the default access (<code className="text-sm font-bold bg-neutral-200/70 px-1.5 py-0.5 rounded">omt2026</code>).
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-4 border-t-2 border-neutral-200">
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="px-8 py-3.5 bg-[#0C2340] text-[#E27A2B] hover:bg-[#123157] text-sm sm:text-base font-extrabold uppercase tracking-wider border-2 border-[#E27A2B]/50 transition-colors cursor-pointer rounded-xl shadow-xs"
              >
                Understood &amp; Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Passcode Management Modal (Solid Light Theme, Large & Bold Legibility) */}
      {showPasscodeModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-lg bg-white border-2 border-neutral-300 shadow-2xl rounded-2xl p-6 sm:p-9 space-y-6 text-neutral-900">
            <div className="flex items-center justify-between pb-4 border-b-2 border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0C2340] text-[#E27A2B] rounded-xl flex items-center justify-center border-2 border-[#E27A2B]/40 shadow-xs">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-2xl font-black text-neutral-950">
                  Change Editorial Passcode
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPasscodeModal(false)}
                className="p-2 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePasscode} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold uppercase tracking-wider text-neutral-900">
                    Current Passcode
                  </label>
                  {SHOW_FORGOT_PASSCODE && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasscodeModal(false);
                        setShowForgotModal(true);
                        setForgotError('');
                        setForgotSuccess('');
                      }}
                      className="text-xs sm:text-sm font-bold text-[#E27A2B] hover:underline cursor-pointer"
                    >
                      Forgot Passcode?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={currentPassInput}
                  onChange={(e) => setCurrentPassInput(e.target.value)}
                  placeholder="Enter current PIN"
                  className="w-full px-4 py-3 text-base sm:text-lg bg-neutral-50 border-2 border-neutral-300 rounded-xl text-neutral-950 placeholder-neutral-500 font-mono font-bold focus:border-[#E27A2B] focus:bg-white focus:outline-none transition-all"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wider text-neutral-900">
                  New Passcode
                </label>
                <input
                  type="password"
                  value={newPassInput}
                  onChange={(e) => setNewPassInput(e.target.value)}
                  placeholder="Enter new PIN (at least 4 characters)"
                  className="w-full px-4 py-3 text-base sm:text-lg bg-neutral-50 border-2 border-neutral-300 rounded-xl text-neutral-950 placeholder-neutral-500 font-mono font-bold focus:border-[#E27A2B] focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wider text-neutral-900">
                  Confirm New Passcode
                </label>
                <input
                  type="password"
                  value={confirmPassInput}
                  onChange={(e) => setConfirmPassInput(e.target.value)}
                  placeholder="Re-type new PIN"
                  className="w-full px-4 py-3 text-base sm:text-lg bg-neutral-50 border-2 border-neutral-300 rounded-xl text-neutral-950 placeholder-neutral-500 font-mono font-bold focus:border-[#E27A2B] focus:bg-white focus:outline-none transition-all"
                />
              </div>

              {passcodeModalError && (
                <div className="p-3.5 bg-red-50 border-2 border-red-300 rounded-xl text-sm text-red-700 flex items-center gap-2 font-bold">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
                  <span>{passcodeModalError}</span>
                </div>
              )}

              {passcodeModalSuccess && (
                <div className="p-3.5 bg-emerald-50 border-2 border-emerald-300 rounded-xl text-sm text-emerald-800 flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                  <span>{passcodeModalSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowPasscodeModal(false)}
                  className="px-5 py-2.5 text-sm font-bold text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-7 py-3 bg-[#0C2340] text-[#E27A2B] hover:bg-[#123157] text-sm font-extrabold uppercase tracking-wider border-2 border-[#E27A2B]/40 transition-colors cursor-pointer rounded-xl shadow-xs"
                >
                  Update Passcode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Passcode Modal (Authenticated View) */}
      {renderForgotPasscodeModal()}

      {/* Floating Bottom-Right Help Button */}
      <aside aria-label="Editorial Help Desk" className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50">
        <button
          type="button"
          onClick={() => setShowInfoModal(true)}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#0C2340] hover:bg-[#123157] text-[#E27A2B] shadow-2xl border-2 border-[#E27A2B] hover:border-amber-400 transition-all duration-200 cursor-pointer flex items-center justify-center hover:scale-110 active:scale-95 group focus:outline-none focus:ring-4 focus:ring-[#E27A2B]/40"
          title="Editorial Desk Help & Instructions (?)"
          aria-label="Editorial Desk Help & Instructions"
        >
          <span className="font-serif font-black text-2xl sm:text-3xl leading-none text-[#E27A2B] group-hover:text-amber-300 transition-colors select-none">
            ?
          </span>
        </button>
      </aside>
    </div>
  );
}
