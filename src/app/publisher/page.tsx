'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Lock,
  Radio,
  Film,
  Tag,
  ArrowLeft,
  Mail,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  PenSquare,
  LogOut,
  Clock,
  Send,
  MessageSquare,
  Plus,
  Trash2,
  X,
  Sliders,
  RotateCcw,
  BookOpen,
  Info,
} from 'lucide-react';
import { getStoredSession, setStoredSession } from '@/lib/clientAuth';

const INITIAL_AUTHORS = [
  'Akhil U Krishnan',
  'Amala Thomas',
];

const INITIAL_PACKETS = [
  'Packet 1',
  'Packet 2',
  'Packet 3',
];

const STANDARD_CATEGORIES = [
  'Politics',
  'Cinema',
  'Literature',
  'Sports',
  'Arts & Culture',
  'Media',
  'Society',
  'Environment',
  'Economy',
  'Science',
];

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

  // Audio Converter State
  const [driveUrlInput, setDriveUrlInput] = useState('');
  const [convertedAudioTag, setConvertedAudioTag] = useState('');
  const [copiedAudio, setCopiedAudio] = useState(false);

  // Dynamic Pools (persisted)
  const [authors, setAuthors] = useState<string[]>(INITIAL_AUTHORS);
  const [packets, setPackets] = useState<string[]>(INITIAL_PACKETS);

  // Author inline add & delete confirmation states
  const [isAddingAuthor, setIsAddingAuthor] = useState(false);
  const [newAuthorInline, setNewAuthorInline] = useState('');
  const [authorPendingDelete, setAuthorPendingDelete] = useState<string | null>(null);

  // Packet inline add & delete confirmation states
  const [isAddingPacket, setIsAddingPacket] = useState(false);
  const [newPacketInline, setNewPacketInline] = useState('');
  const [packetPendingDelete, setPacketPendingDelete] = useState<string | null>(null);

  // Multi-Select Categories State (initially empty)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [copiedCategories, setCopiedCategories] = useState(false);

  // Author & Packet selection in Composer (initially None)
  const [composerAuthor, setComposerAuthor] = useState<string>('None');
  const [composerPacket, setComposerPacket] = useState<string>('None');

  // Info Guide Modal State
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Placement & format flags
  const [composerIsLeadStory, setComposerIsLeadStory] = useState(false);
  const [composerIsCover, setComposerIsCover] = useState(false);
  const [composerHasAudio, setComposerHasAudio] = useState(false);
  const [composerHasVideo, setComposerHasVideo] = useState(false);
  const [composerIsPremium, setComposerIsPremium] = useState(false);

  // Series Builder State
  const [composerIsSeries, setComposerIsSeries] = useState(false);
  const [composerSeriesTitle, setComposerSeriesTitle] = useState('');
  const [composerSeriesEpisode, setComposerSeriesEpisode] = useState('1');
  const [composerIsSeriesInfo, setComposerIsSeriesInfo] = useState(false);

  // Standalone Quick Series Generator State
  const [quickSeriesTitle, setQuickSeriesTitle] = useState('');
  const [quickSeriesPart, setQuickSeriesPart] = useState('1');

  // Copy States
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSeriesTag, setCopiedSeriesTag] = useState(false);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  // Reader Letters State
  const [readerLetters, setReaderLetters] = useState<any[]>([]);

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

    // Load reader letters from localStorage
    try {
      const raw = localStorage.getItem('omt_reader_letters');
      if (raw) {
        setReaderLetters(JSON.parse(raw));
      }
    } catch {}

    // Load custom dynamic authors and packets from localStorage v2
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
    // Default PIN: omt2026 or admin
    if (pinInput.trim() === 'omt2026' || pinInput.trim() === 'admin' || pinInput.trim() === 'editorial') {
      setIsAuthenticated(true);
      sessionStorage.setItem('omt_editorial_auth', 'true');
      setStoredSession({
        name: 'Editorial Desk',
        email: 'editor@oldmangotree.media',
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

  // Google Drive URL to Audio Tag Converter
  const handleDriveUrlChange = (val: string) => {
    setDriveUrlInput(val);
    setCopiedAudio(false);

    if (!val.trim()) {
      setConvertedAudioTag('');
      return;
    }

    // Extracts Google Drive file ID from various sharing formats:
    // https://drive.google.com/file/d/1a2b3c4d5e/view?usp=sharing
    // https://drive.google.com/open?id=1a2b3c4d5e
    // https://drive.google.com/uc?id=1a2b3c4d5e
    const idMatch = val.match(/\/d\/([a-zA-Z0-9_-]+)/) || val.match(/[?&]id=([a-zA-Z0-9_-]+)/);

    if (idMatch && idMatch[1]) {
      const fileId = idMatch[1];
      const audioUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;
      setConvertedAudioTag(`[audio: ${audioUrl}]`);
    } else if (val.startsWith('http')) {
      // Direct audio URL
      setConvertedAudioTag(`[audio: ${val.trim()}]`);
    } else {
      setConvertedAudioTag('');
    }
  };

  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    if (identifier === 'audio') {
      setCopiedAudio(true);
      setTimeout(() => setCopiedAudio(false), 2000);
    } else {
      setCopiedTag(text);
      setTimeout(() => setCopiedTag(null), 1800);
    }
  };

  // Multi-Select Categories Handlers
  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleCopySelectedCategories = () => {
    if (selectedCategories.length === 0) return;
    navigator.clipboard.writeText(selectedCategories.join(', '));
    setCopiedCategories(true);
    setTimeout(() => setCopiedCategories(false), 2000);
  };

  // Author inline save & delete confirmation
  const handleSaveInlineAuthor = () => {
    const trimmed = newAuthorInline.trim();
    if (!trimmed) {
      setIsAddingAuthor(false);
      return;
    }
    let updated = authors;
    if (!authors.includes(trimmed)) {
      updated = [...authors, trimmed];
      setAuthors(updated);
      try {
        localStorage.setItem('omt_editor_authors_v2', JSON.stringify(updated));
      } catch {}
    }
    setComposerAuthor(trimmed);
    setIsAddingAuthor(false);
    setNewAuthorInline('');
  };

  const requestDeleteAuthor = (authorName: string) => {
    if (authorName === 'Akhil U Krishnan' || authorName === 'Amala Thomas') return;
    setAuthorPendingDelete(authorName);
  };

  const confirmDeleteAuthor = () => {
    if (!authorPendingDelete) return;
    const authorToRemove = authorPendingDelete;
    const updated = authors.filter((a) => a !== authorToRemove);
    setAuthors(updated);
    try {
      localStorage.setItem('omt_editor_authors_v2', JSON.stringify(updated));
    } catch {}
    if (composerAuthor === authorToRemove) {
      setComposerAuthor(updated[0] || 'Akhil U Krishnan');
    }
    setAuthorPendingDelete(null);
  };

  const cancelDeleteAuthor = () => {
    setAuthorPendingDelete(null);
  };

  // Packet inline save & delete confirmation
  const handleSaveInlinePacket = () => {
    let trimmed = newPacketInline.trim();
    if (!trimmed) {
      setIsAddingPacket(false);
      return;
    }
    if (!trimmed.toLowerCase().startsWith('packet')) {
      trimmed = `Packet ${trimmed}`;
    }
    let updated = packets;
    if (!packets.includes(trimmed)) {
      updated = [...packets, trimmed];
      setPackets(updated);
      try {
        localStorage.setItem('omt_editor_packets_v2', JSON.stringify(updated));
      } catch {}
    }
    setComposerPacket(trimmed);
    setIsAddingPacket(false);
    setNewPacketInline('');
  };

  const requestDeletePacket = (pkt: string) => {
    if (pkt === 'Packet 1' || pkt === 'Packet 2' || pkt === 'Packet 3') return;
    setPacketPendingDelete(pkt);
  };

  const confirmDeletePacket = () => {
    if (!packetPendingDelete) return;
    const pktToRemove = packetPendingDelete;
    const updated = packets.filter((p) => p !== pktToRemove);
    setPackets(updated);
    try {
      localStorage.setItem('omt_editor_packets_v2', JSON.stringify(updated));
    } catch {}
    if (composerPacket === pktToRemove) {
      setComposerPacket(updated[0] || 'None');
    }
    setPacketPendingDelete(null);
  };

  const cancelDeletePacket = () => {
    setPacketPendingDelete(null);
  };

  // Assembled Blogger Labels computation
  const assembledLabels = useMemo(() => {
    const list: string[] = [];

    // 1. Multiple Selected Categories
    selectedCategories.forEach((cat) => {
      if (cat && cat.trim()) {
        list.push(cat.trim());
      }
    });

    // 2. Author override
    if (composerAuthor && composerAuthor !== 'None' && composerAuthor !== '__NEW__') {
      list.push(`Author: ${composerAuthor}`);
    }

    // 3. Webzine Packet
    if (composerPacket && composerPacket !== 'None' && composerPacket !== '__NEW__') {
      const formattedPkt = composerPacket.toLowerCase().startsWith('packet')
        ? composerPacket
        : `Packet ${composerPacket}`;
      list.push(formattedPkt);
    }

    // 4. Special Placement Flags
    if (composerIsLeadStory) list.push('Lead Story');
    if (composerIsCover) list.push('Issue Cover');

    // 5. Content Formats
    if (composerHasAudio) list.push('Audio Story');
    if (composerHasVideo) list.push('Video');
    if (composerIsPremium) list.push('Premium');

    // 6. Multi-Part Series
    if (composerIsSeries && composerSeriesTitle.trim()) {
      list.push(`Series: ${composerSeriesTitle.trim()}`);
      if (composerIsSeriesInfo) {
        list.push('Series Info');
      } else if (composerSeriesEpisode.trim()) {
        list.push(`Part: ${composerSeriesEpisode.trim()}`);
      }
    }

    return list;
  }, [
    selectedCategories,
    composerAuthor,
    composerPacket,
    composerIsLeadStory,
    composerIsCover,
    composerHasAudio,
    composerHasVideo,
    composerIsPremium,
    composerIsSeries,
    composerSeriesTitle,
    composerSeriesEpisode,
    composerIsSeriesInfo,
  ]);

  const assembledLabelsString = assembledLabels.join(', ');

  const handleCopyAllLabels = () => {
    if (!assembledLabelsString) return;
    navigator.clipboard.writeText(assembledLabelsString);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2200);
  };

  const handleResetComposer = () => {
    setSelectedCategories([]);
    setComposerAuthor('None');
    setIsAddingAuthor(false);
    setNewAuthorInline('');
    setComposerPacket('None');
    setIsAddingPacket(false);
    setNewPacketInline('');
    setComposerIsLeadStory(false);
    setComposerIsCover(false);
    setComposerHasAudio(false);
    setComposerHasVideo(false);
    setComposerIsPremium(false);
    setComposerIsSeries(false);
    setComposerSeriesTitle('');
    setComposerSeriesEpisode('1');
    setComposerIsSeriesInfo(false);
    setAuthorPendingDelete(null);
    setPacketPendingDelete(null);
  };

  const handleCopyQuickSeries = () => {
    if (!quickSeriesTitle.trim()) return;
    const tag = `Series: ${quickSeriesTitle.trim()}, Part: ${quickSeriesPart.trim() || '1'}`;
    navigator.clipboard.writeText(tag);
    setCopiedSeriesTag(true);
    setTimeout(() => setCopiedSeriesTag(false), 2000);
  };

  const formatTags = [
    'Audio Story',
    'Video',
    'Premium',
    'Lead Story',
    'Issue Cover',
  ];

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
    <div className="space-y-10 py-2 sm:py-4">
      {/* Top Banner & Navigation */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-widest text-[#E27A2B]">
            <span>Production &amp; Headless Operations</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-50">
            Editorial Desk Command
          </h1>
          <p className="text-neutral-700 dark:text-neutral-300 text-sm sm:text-base max-w-2xl pt-1">
            Publish stories via Blogger, store audio in Google Drive, and instantly refresh the live reader site.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/"
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> View Live Site
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Lock Desk &amp; Sign Out
          </button>
        </div>
      </header>

      {/* Section 1: Quick Action Launchers */}
      <section className="space-y-4">
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <span>1. Production Launchers</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Action 1: New Story on Blogger */}
          <div className="p-5 bg-paper-card dark:bg-paper-cardDark border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between space-y-4 hover:border-[#E27A2B] transition-colors">
            <div className="space-y-2">
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/60 text-[#E27A2B] flex items-center justify-center">
                <PenSquare className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-neutral-900 dark:text-neutral-50">
                Write on Blogger
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Compose long-form stories, embed high-res images, and assign department labels.
              </p>
            </div>
            <a
              href="https://www.blogger.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-between px-4 py-2.5 bg-[#0C2340] hover:bg-[#123157] text-[#E27A2B] text-xs sm:text-sm font-bold tracking-wider uppercase border border-[#E27A2B]/40 transition-colors"
            >
              <span>Open Blogger</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Action 2: Shared Audio Google Drive */}
          <div className="p-5 bg-paper-card dark:bg-paper-cardDark border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between space-y-4 hover:border-[#E27A2B] transition-colors">
            <div className="space-y-2">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-neutral-900 dark:text-neutral-50">
                Shared Audio Drive
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Upload narrated MP3 files and get sharing links for persistent audio streaming.
              </p>
            </div>
            <a
              href="https://drive.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-between px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors"
            >
              <span>Open Google Drive</span>
              <FolderOpen className="w-4 h-4" />
            </a>
          </div>

          {/* Action 3: YouTube Studio / Video Channel */}
          <div className="p-5 bg-paper-card dark:bg-paper-cardDark border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between space-y-4 hover:border-[#E27A2B] transition-colors">
            <div className="space-y-2">
              <div className="w-10 h-10 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
                <Film className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-neutral-900 dark:text-neutral-50">
                Video &amp; Studio Hub
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Manage YouTube video essays, documentaries, and discussion episode uploads.
              </p>
            </div>
            <a
              href="https://studio.youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-between px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors"
            >
              <span>Open YouTube Studio</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Action 4: Instant Live Website Refresh */}
          <div className="p-5 bg-paper-card dark:bg-paper-cardDark border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between space-y-4 hover:border-[#E27A2B] transition-colors">
            <div className="space-y-2">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <RefreshCw className={`w-5 h-5 ${isRevalidating ? 'animate-spin' : ''}`} />
              </div>
              <h3 className="font-serif text-lg font-bold text-neutral-900 dark:text-neutral-50">
                Purge Edge Cache
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Immediately trigger an edge revalidation so freshly published Blogger stories go live.
              </p>
            </div>
            <button
              onClick={handleRevalidate}
              disabled={isRevalidating}
              className="inline-flex items-center justify-between px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>{isRevalidating ? 'Purging...' : 'Force Live Refresh'}</span>
              <RefreshCw className={`w-4 h-4 ${isRevalidating ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Live Revalidate Status Banner */}
        {revalidateStatus && (
          <div
            className={`p-4 border text-xs sm:text-sm flex items-start gap-3 ${
              revalidateStatus.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
            }`}
          >
            {revalidateStatus.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-bold">{revalidateStatus.message}</p>
              {revalidateStatus.timestamp && (
                <p className="text-xs text-neutral-500 font-mono">
                  Timestamp: {revalidateStatus.timestamp}
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Section 2: Audio Link Converter Tool */}
      <section className="p-6 bg-paper-card dark:bg-paper-cardDark border border-neutral-200 dark:border-neutral-800 space-y-4">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-[#E27A2B]" />
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            2. Google Drive Audio Link Converter
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 max-w-2xl leading-relaxed">
          Paste any shareable Google Drive audio link below (set access to <em>"Anyone with the link"</em>). It will instantly convert it to the streaming tag to paste anywhere into your Blogger story.
        </p>

        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
              Paste Google Drive Sharing URL:
            </label>
            <input
              type="text"
              value={driveUrlInput}
              onChange={(e) => handleDriveUrlChange(e.target.value)}
              placeholder="https://drive.google.com/file/d/1XyZ9AbCdEfG/view?usp=sharing"
              className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-sm font-mono text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#E27A2B]"
            />
          </div>

          {convertedAudioTag && (
            <div className="p-4 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#E27A2B]">
                  Generated Blogger Audio Tag:
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(convertedAudioTag, 'audio')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0C2340] text-[#E27A2B] text-xs font-bold uppercase tracking-wider border border-[#E27A2B]/40 hover:bg-[#123157] transition-colors cursor-pointer"
                >
                  {copiedAudio ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Tag</span>
                    </>
                  )}
                </button>
              </div>

              <p className="font-mono text-xs sm:text-sm bg-white dark:bg-neutral-950 p-2.5 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 select-all break-all">
                {convertedAudioTag}
              </p>

              <p className="text-[11px] text-neutral-500">
                💡 Paste this tag at the very top or bottom of your post in Blogger. The oldmangotree reader will automatically mount the high-fidelity audio player and stream it.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Section 3: Blogger Label Composer & Dynamic Taxonomy */}
      <section className="space-y-6">
        <div className="p-6 bg-paper-card dark:bg-paper-cardDark border border-neutral-200 dark:border-neutral-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#E27A2B]" />
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                3. All-in-One Blogger Label Composer
              </h2>
              <button
                type="button"
                onClick={() => setShowInfoModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-[#E27A2B] bg-neutral-100 dark:bg-neutral-800 hover:bg-[#E27A2B]/10 border border-neutral-300 dark:border-neutral-700 transition-colors cursor-pointer ml-1"
                title="How Blogger Labels work (Click for guide)"
              >
                <Info className="w-3.5 h-3.5 text-[#E27A2B]" />
                <span>Info Guide</span>
              </button>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#E27A2B]">
              Real-Time Tag Generator
            </span>
          </div>

          <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 max-w-2xl leading-relaxed">
            Configure the article attributes below. The composer builds the exact comma-separated label string Blogger needs. Click <strong>&quot;Copy All Labels for Blogger&quot;</strong> and paste directly into Blogger&apos;s Labels field.
          </p>

          {/* Generated Label Preview Card */}
          <div className="p-5 bg-neutral-100 dark:bg-neutral-900/90 border-2 border-[#E27A2B]/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#E27A2B]">
                  Generated Blogger Labels:
                </span>
                <button
                  type="button"
                  onClick={() => setShowInfoModal(true)}
                  className="p-1 rounded text-neutral-500 hover:text-[#E27A2B] hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="How Blogger Labels work (Click for guide)"
                  aria-label="Blogger Labels Information"
                >
                  <Info className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono px-2 py-0.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                  {assembledLabels.length} {assembledLabels.length === 1 ? 'tag' : 'tags'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetComposer}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer"
                  title="Reset to defaults"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyAllLabels}
                  disabled={assembledLabels.length === 0}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    copiedAll
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : assembledLabels.length === 0
                      ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 border-neutral-300 dark:border-neutral-700'
                      : 'bg-[#0C2340] hover:bg-[#123157] text-[#E27A2B] border-[#E27A2B]/40 shadow-xs'
                  }`}
                >
                  {copiedAll ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Copied for Blogger!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy All Labels for Blogger</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Visual Pills Preview */}
            <div className="flex flex-wrap gap-1.5 min-h-[32px] pt-1 items-center">
              {assembledLabels.length === 0 ? (
                <span className="text-xs text-neutral-400 dark:text-neutral-500 italic">
                  (No labels selected yet. Select department, author, or packet below to compose your labels)
                </span>
              ) : (
                assembledLabels.map((lbl, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-1 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-xs font-mono font-medium text-neutral-900 dark:text-neutral-100"
                  >
                    {lbl}
                  </span>
                ))
              )}
            </div>

            {/* Comma-Separated Raw Preview / Copy Box */}
            <div
              className={`p-3 bg-white dark:bg-neutral-950 border font-mono text-xs sm:text-sm break-all transition-colors ${
                assembledLabelsString
                  ? 'border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 select-all cursor-text'
                  : 'border-dashed border-neutral-300 dark:border-neutral-800 text-neutral-400 dark:text-neutral-500 italic select-none'
              }`}
            >
              {assembledLabelsString || '(Nothing selected yet. Select department, author, or packet below to generate labels)'}
            </div>

            <p className="text-[11px] text-neutral-500">
              💡 In Blogger&apos;s post editor, paste this directly into the <strong>&quot;Labels&quot;</strong> box in the right sidebar. Blogger will instantly map department category, packet edition, author attribution, and format flags.
            </p>
          </div>

          {/* Composer Controls */}
          <div className="space-y-6 pt-2">
            {/* Control 1: Multi-Select Category Tags */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                    1. Departments / Categories (Multi-Select):
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowInfoModal(true)}
                    className="p-1 rounded text-neutral-400 hover:text-[#E27A2B] hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    title="A story can belong to multiple departments. Click for info."
                    aria-label="Category information"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono px-2 py-0.5 bg-[#E27A2B]/10 text-[#E27A2B] border border-[#E27A2B]/30 font-bold">
                    {selectedCategories.length} selected
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopySelectedCategories}
                  disabled={selectedCategories.length === 0}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    copiedCategories
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : selectedCategories.length === 0
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-300 dark:border-neutral-700'
                      : 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:border-[#E27A2B]'
                  }`}
                >
                  {copiedCategories ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Copied Categories!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Copy Selected Categories</span>
                    </>
                  )}
                </button>
              </div>

              {/* Category Pills Multi-select Grid */}
              <div className="flex flex-wrap gap-2 pt-1">
                {STANDARD_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold tracking-wide border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#E27A2B] text-white border-[#E27A2B] shadow-xs'
                          : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500'
                      }`}
                    >
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Selected Tags Display */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-neutral-600 dark:text-neutral-400">
                <span className="font-bold">Active category tags:</span>
                {selectedCategories.length === 0 ? (
                  <span className="italic text-neutral-400">None selected (Click tags above to select)</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCategories.map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-mono text-xs font-medium"
                      >
                        {cat}
                        <button
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className="hover:text-red-500 cursor-pointer ml-0.5 text-neutral-400"
                          title={`Deselect ${cat}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Author and Packet 2-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Control 2: Author */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                    2. Author / Columnist:
                  </label>
                  {composerAuthor &&
                    composerAuthor !== 'Akhil U Krishnan' &&
                    composerAuthor !== 'Amala Thomas' &&
                    composerAuthor !== 'None' &&
                    composerAuthor !== '__NEW__' &&
                    !isAddingAuthor && (
                      <button
                        type="button"
                        onClick={() => requestDeleteAuthor(composerAuthor)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                        title={`Delete author "${composerAuthor}"`}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete this author</span>
                      </button>
                    )}
                </div>

                <select
                  value={isAddingAuthor ? '__NEW__' : composerAuthor}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      setIsAddingAuthor(true);
                      setNewAuthorInline('');
                    } else {
                      setIsAddingAuthor(false);
                      setComposerAuthor(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-sm font-sans text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#E27A2B]"
                >
                  <option value="None">-- Select Author (Optional) --</option>
                  {authors.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                  <option value="__NEW__">+ New Author...</option>
                </select>

                {/* Inline Add Author input */}
                {isAddingAuthor && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      value={newAuthorInline}
                      onChange={(e) => setNewAuthorInline(e.target.value)}
                      placeholder="Enter author name (e.g. Arundhati Roy)..."
                      className="flex-1 px-2.5 py-1.5 bg-white dark:bg-neutral-950 border border-[#E27A2B] text-xs font-sans text-neutral-900 dark:text-neutral-100 focus:outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveInlineAuthor();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSaveInlineAuthor}
                      className="px-3 py-1.5 bg-[#0C2340] text-[#E27A2B] hover:bg-[#123157] text-xs font-bold uppercase tracking-wider border border-[#E27A2B]/40 transition-colors cursor-pointer shrink-0"
                    >
                      Add &amp; Use
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingAuthor(false);
                        setNewAuthorInline('');
                        setComposerAuthor('None');
                      }}
                      className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Control 3: Webzine Packet */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                    3. Webzine Edition / Packet:
                  </label>
                  {composerPacket &&
                    composerPacket !== 'Packet 1' &&
                    composerPacket !== 'Packet 2' &&
                    composerPacket !== 'Packet 3' &&
                    composerPacket !== 'None' &&
                    composerPacket !== '__NEW__' &&
                    !isAddingPacket && (
                      <button
                        type="button"
                        onClick={() => requestDeletePacket(composerPacket)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                        title={`Delete packet "${composerPacket}"`}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete this packet</span>
                      </button>
                    )}
                </div>

                <select
                  value={isAddingPacket ? '__NEW__' : composerPacket}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      setIsAddingPacket(true);
                      setNewPacketInline('');
                    } else {
                      setIsAddingPacket(false);
                      setComposerPacket(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-sm font-sans text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#E27A2B]"
                >
                  <option value="None">-- Select Packet (Optional / Standalone) --</option>
                  {packets.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                  <option value="__NEW__">+ New Packet...</option>
                </select>

                {/* Inline Add Packet input */}
                {isAddingPacket && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      value={newPacketInline}
                      onChange={(e) => setNewPacketInline(e.target.value)}
                      placeholder="Enter packet (e.g. 4 or Packet 4)..."
                      className="flex-1 px-2.5 py-1.5 bg-white dark:bg-neutral-950 border border-[#E27A2B] text-xs font-sans text-neutral-900 dark:text-neutral-100 focus:outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveInlinePacket();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSaveInlinePacket}
                      className="px-3 py-1.5 bg-[#0C2340] text-[#E27A2B] hover:bg-[#123157] text-xs font-bold uppercase tracking-wider border border-[#E27A2B]/40 transition-colors cursor-pointer shrink-0"
                    >
                      Add &amp; Use
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingPacket(false);
                        setNewPacketInline('');
                        setComposerPacket('None');
                      }}
                      className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Checkboxes Row: Placements & Formats */}
          <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              4. Placement &amp; Format Badges:
            </label>
            <div className="flex flex-wrap gap-3 sm:gap-6">
              <label className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={composerIsLeadStory}
                  onChange={(e) => setComposerIsLeadStory(e.target.checked)}
                  className="w-4 h-4 text-[#E27A2B] accent-[#E27A2B]"
                />
                <span>Lead Story (Packet Hero)</span>
              </label>

              <label className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={composerIsCover}
                  onChange={(e) => setComposerIsCover(e.target.checked)}
                  className="w-4 h-4 text-[#E27A2B] accent-[#E27A2B]"
                />
                <span>Issue Cover (Cover Card)</span>
              </label>

              <label className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={composerHasAudio}
                  onChange={(e) => setComposerHasAudio(e.target.checked)}
                  className="w-4 h-4 text-[#E27A2B] accent-[#E27A2B]"
                />
                <span>Audio Story (Narrated MP3)</span>
              </label>

              <label className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={composerHasVideo}
                  onChange={(e) => setComposerHasVideo(e.target.checked)}
                  className="w-4 h-4 text-[#E27A2B] accent-[#E27A2B]"
                />
                <span>Video (Documentary)</span>
              </label>

              <label className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={composerIsPremium}
                  onChange={(e) => setComposerIsPremium(e.target.checked)}
                  className="w-4 h-4 text-[#E27A2B] accent-[#E27A2B]"
                />
                <span>Premium (Subscribers)</span>
              </label>
            </div>
          </div>

          {/* Series Builder Toggle & Form */}
          <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <label className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={composerIsSeries}
                onChange={(e) => setComposerIsSeries(e.target.checked)}
                className="w-4 h-4 text-[#E27A2B] accent-[#E27A2B]"
              />
              <span>Include in Multi-Part Investigative / Feature Series</span>
            </label>

            {composerIsSeries && (
              <div className="p-4 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                    Series Title:
                  </label>
                  <input
                    type="text"
                    value={composerSeriesTitle}
                    onChange={(e) => setComposerSeriesTitle(e.target.value)}
                    placeholder="e.g. Paleri Memoirs or Kerala Transitions"
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-sm font-sans text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#E27A2B]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                    Episode / Part Number:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={composerSeriesEpisode}
                    onChange={(e) => setComposerSeriesEpisode(e.target.value)}
                    disabled={composerIsSeriesInfo}
                    placeholder="1"
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-sm font-sans text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#E27A2B] disabled:opacity-50"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={composerIsSeriesInfo}
                      onChange={(e) => setComposerIsSeriesInfo(e.target.checked)}
                      className="w-3.5 h-3.5 text-[#E27A2B] accent-[#E27A2B]"
                    />
                    <span>This post is the Series Overview / Introduction (Tags: <code>Series Info</code>)</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Pools & Quick Taxonomy Bank (Clean, No Confusion) */}
        <div className="p-6 bg-paper-card dark:bg-paper-cardDark border border-neutral-200 dark:border-neutral-800 space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-[#E27A2B]" />
              <h3 className="font-serif text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-50">
                Active Editorial Pools &amp; Quick Copy
              </h3>
            </div>
            <span className="text-xs text-neutral-500 font-sans">
              Click any chip to copy; click &times; on custom items to delete
            </span>
          </div>

          <div className="space-y-5">
            {/* Active Authors Pool */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center justify-between">
                <span>Active Authors ({authors.length}):</span>
                <span className="text-[11px] text-neutral-400 font-normal">Founding editors protected</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {authors.map((authorName) => {
                  const tag = `Author: ${authorName}`;
                  const isProtected = authorName === 'Akhil U Krishnan' || authorName === 'Amala Thomas';
                  return (
                    <div
                      key={authorName}
                      className={`inline-flex items-center border transition-all text-xs font-semibold ${
                        copiedTag === tag
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:border-[#E27A2B]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => copyToClipboard(tag, tag)}
                        className="px-2.5 py-1.5 flex items-center gap-1.5 cursor-pointer"
                        title={`Click to copy: ${tag}`}
                      >
                        {copiedTag === tag ? (
                          <Check className="w-3 h-3 text-white" />
                        ) : (
                          <Copy className="w-3 h-3 text-neutral-400" />
                        )}
                        <span>{authorName}</span>
                      </button>
                      {!isProtected && (
                        <button
                          type="button"
                          onClick={() => requestDeleteAuthor(authorName)}
                          className="px-1.5 py-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer border-l border-neutral-300 dark:border-neutral-700"
                          title={`Delete ${authorName} from newsroom pool`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Packets Pool */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Active Webzine Packets ({packets.length}):
              </h4>
              <div className="flex flex-wrap gap-2">
                {packets.map((pkt) => (
                  <div
                    key={pkt}
                    className={`inline-flex items-center border transition-all text-xs font-semibold ${
                      copiedTag === pkt
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:border-[#E27A2B]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => copyToClipboard(pkt, pkt)}
                      className="px-2.5 py-1.5 flex items-center gap-1.5 cursor-pointer"
                      title={`Click to copy: ${pkt}`}
                    >
                      {copiedTag === pkt ? (
                        <Check className="w-3 h-3 text-white" />
                      ) : (
                        <Copy className="w-3 h-3 text-neutral-400" />
                      )}
                      <span>{pkt}</span>
                    </button>
                    {pkt !== 'Packet 1' && pkt !== 'Packet 2' && pkt !== 'Packet 3' && (
                      <button
                        type="button"
                        onClick={() => requestDeletePacket(pkt)}
                        className="px-1.5 py-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer border-l border-neutral-300 dark:border-neutral-700"
                        title={`Delete ${pkt} from webzine packets`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Series Generator */}
            <div className="space-y-2 p-4 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                Quick Series Tag Generator:
              </h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={quickSeriesTitle}
                  onChange={(e) => setQuickSeriesTitle(e.target.value)}
                  placeholder="Series Title (e.g. Paleri Memoirs)..."
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-xs font-sans text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#E27A2B]"
                />
                <input
                  type="number"
                  min="1"
                  value={quickSeriesPart}
                  onChange={(e) => setQuickSeriesPart(e.target.value)}
                  placeholder="Part #"
                  className="w-20 px-3 py-1.5 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-xs font-sans text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#E27A2B]"
                />
                <button
                  type="button"
                  onClick={handleCopyQuickSeries}
                  disabled={!quickSeriesTitle.trim()}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                    copiedSeriesTag
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-[#0C2340] text-[#E27A2B] border-[#E27A2B]/40 hover:bg-[#123157]'
                  }`}
                >
                  {copiedSeriesTag ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSeriesTag ? 'Copied!' : 'Copy Series Tags'}</span>
                </button>
              </div>
            </div>

            {/* Standard Departments */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Departments &amp; Categories ({STANDARD_CATEGORIES.length}):
              </h4>
              <div className="flex flex-wrap gap-2">
                {STANDARD_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => copyToClipboard(cat, cat)}
                    className={`px-3 py-1.5 text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      copiedTag === cat
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:border-[#E27A2B]'
                    }`}
                  >
                    {copiedTag === cat ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                    <span>{cat}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Formats & Placement Badges */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Formats &amp; Placement Badges:
              </h4>
              <div className="flex flex-wrap gap-2">
                {formatTags.map((ft) => (
                  <button
                    key={ft}
                    type="button"
                    onClick={() => copyToClipboard(ft, ft)}
                    className={`px-3 py-1.5 text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      copiedTag === ft
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:border-[#E27A2B]'
                    }`}
                  >
                    {copiedTag === ft ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                    <span>{ft}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Reader Letters & Feedback Inbox */}
      <section className="p-6 bg-paper-card dark:bg-paper-cardDark border border-neutral-200 dark:border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#E27A2B]" />
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50">
              4. Reader Letters &amp; Feedback
            </h2>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            {readerLetters.length} Letters Recorded
          </span>
        </div>

        {readerLetters.length === 0 ? (
          <div className="py-8 text-center text-neutral-500 text-sm">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No reader letters stored in this browser session. Letters submitted via "Letter to Editor" also dispatch directly to the editorial email.
          </div>
        ) : (
          <div className="space-y-4 divide-y divide-neutral-200 dark:divide-neutral-800">
            {readerLetters.map((letter, idx) => (
              <div key={idx} className="pt-4 first:pt-0 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">
                      {letter.name}
                    </span>
                    <a
                      href={`mailto:${letter.email}?subject=Re: Letter to Editor on ${letter.articleTitle}`}
                      className="text-[#E27A2B] hover:underline"
                    >
                      &lt;{letter.email}&gt;
                    </a>
                    {letter.location && (
                      <span className="text-neutral-500">({letter.location})</span>
                    )}
                  </div>
                  <span className="text-neutral-400 font-mono">
                    {letter.submittedAt ? new Date(letter.submittedAt).toLocaleDateString() : 'Recent'}
                  </span>
                </div>

                <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                  Article: <span className="text-neutral-900 dark:text-neutral-100">{letter.articleTitle}</span>
                </p>

                <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 font-serif italic whitespace-pre-wrap leading-relaxed">
                  “{letter.message}”
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Author Delete Confirmation Modal Dialog */}
      {authorPendingDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="w-full max-w-md bg-paper-card dark:bg-paper-cardDark border border-red-500/40 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-serif font-bold text-neutral-900 dark:text-neutral-50">
                  Delete Author Confirmation
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Are you sure you want to delete author{' '}
                  <strong className="text-neutral-900 dark:text-neutral-100">
                    &quot;{authorPendingDelete}&quot;
                  </strong>{' '}
                  from the newsroom pool?
                </p>
              </div>
            </div>

            <p className="text-[11px] text-neutral-500 bg-neutral-100 dark:bg-neutral-900 p-2.5 border border-neutral-200 dark:border-neutral-800">
              💡 Note: This removes the author from your newsroom dropdown and browser presets. Any stories already published in Blogger will not be affected.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={cancelDeleteAuthor}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAuthor}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Author</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Packet Delete Confirmation Modal Dialog */}
      {packetPendingDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="w-full max-w-md bg-paper-card dark:bg-paper-cardDark border border-red-500/40 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-serif font-bold text-neutral-900 dark:text-neutral-50">
                  Delete Packet Confirmation
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Are you sure you want to delete packet edition{' '}
                  <strong className="text-neutral-900 dark:text-neutral-100">
                    &quot;{packetPendingDelete}&quot;
                  </strong>{' '}
                  from the webzine list?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={cancelDeletePacket}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeletePacket}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Packet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editorial Labels Info Guide Modal Dialog */}
      {showInfoModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg bg-paper-card dark:bg-paper-cardDark border border-[#E27A2B]/40 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#0C2340] text-[#E27A2B] flex items-center justify-center border border-[#E27A2B]/40">
                  <Info className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-lg font-bold text-neutral-900 dark:text-neutral-50">
                  Blogger Labels Guide &amp; Taxonomy
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              <p>
                <strong>oldmangotree</strong> connects headlessly to Blogger without requiring any database. All article categories, author attribution, magazine packets, and format badges are parsed automatically from Blogger&apos;s <strong>&quot;Labels&quot;</strong> field.
              </p>

              <div className="space-y-2 pt-1">
                <div className="p-3 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1">
                  <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                    1. Departments &amp; Categories (Multi-Select)
                  </span>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    A story can belong to multiple departments (e.g. <code>Politics</code>, <code>Cinema</code>). The story will automatically appear in all selected department sections and archives.
                  </p>
                </div>

                <div className="p-3 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1">
                  <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                    2. Author Attribution
                  </span>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Adding <code>Author: [Name]</code> links the article to that writer&apos;s profile card, bio, and archive. If left unselected, Blogger&apos;s account default is used.
                  </p>
                </div>

                <div className="p-3 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1">
                  <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                    3. Webzine Edition / Packet
                  </span>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Adding <code>Packet 1</code>, <code>Packet 2</code>, etc. groups the post into a specific digital webzine issue. Leave unselected for standalone stories.
                  </p>
                </div>

                <div className="p-3 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1">
                  <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                    4. Placement &amp; Format Badges
                  </span>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    <code>Lead Story</code> places the story in the top hero spotlight. <code>Audio Story</code> &amp; <code>Video</code> mount streaming players for the reader.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[#E27A2B]/10 border border-[#E27A2B]/30 text-neutral-900 dark:text-neutral-100 text-xs">
                <strong>📋 How to publish:</strong>
                <ol className="list-decimal pl-5 mt-1 space-y-0.5">
                  <li>Manually select your categories, author, or edition below.</li>
                  <li>Click <strong>&quot;Copy All Labels for Blogger&quot;</strong>.</li>
                  <li>In Blogger editor, paste into the <strong>Labels</strong> box on the right sidebar and hit Publish.</li>
                </ol>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 bg-[#0C2340] text-[#E27A2B] hover:bg-[#123157] text-xs font-bold uppercase tracking-wider border border-[#E27A2B]/40 transition-colors cursor-pointer"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
