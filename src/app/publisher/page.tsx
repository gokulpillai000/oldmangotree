'use client';

import React, { useState, useEffect } from 'react';
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
  MessageSquare
} from 'lucide-react';

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

  // Tag Copy State
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  // Reader Letters State
  const [readerLetters, setReaderLetters] = useState<any[]>([]);

  // Check existing session
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('omt_editorial_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }

    // Load reader letters from localStorage
    try {
      const raw = localStorage.getItem('omt_reader_letters');
      if (raw) {
        setReaderLetters(JSON.parse(raw));
      }
    } catch {}
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default PIN: omt2026 or admin
    if (pinInput.trim() === 'omt2026' || pinInput.trim() === 'admin' || pinInput.trim() === 'editorial') {
      setIsAuthenticated(true);
      sessionStorage.setItem('omt_editorial_auth', 'true');
      setPinError('');
    } else {
      setPinError('Invalid editorial PIN. Please check with the lead editor.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('omt_editorial_auth');
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

  // Cheat Sheet Data
  const categories = [
    'Politics',
    'Cinema',
    'Literature',
    'Sports',
    'Arts & Culture',
    'Media',
    'Society',
    'Miscellaneous',
  ];

  const editions = [
    'Packet 1',
    'Packet 2',
    'Packet 3',
    'Issue Cover',
    'Lead Story',
  ];

  const seriesTags = [
    'Series: Paleri Memoirs',
    'Part: 1',
    'Part: 2',
    'Part: 3',
  ];

  const formatTags = [
    'Audio Story',
    'Video',
    'Premium',
  ];

  const authorTags = [
    'Author: Kamalram Sajeev',
    'Author: Damodhar Prasad',
    'Author: Manila C. Mohan',
    'Author: Editorial Desk',
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
            <LogOut className="w-4 h-4" /> Lock Desk
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

      {/* Section 3: Tag & Label Cheat Sheet (Click-to-Copy) */}
      <section className="p-6 bg-paper-card dark:bg-paper-cardDark border border-neutral-200 dark:border-neutral-800 space-y-6">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-[#E27A2B]" />
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            3. Blogger Label Cheat Sheet (Click-to-Copy)
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 max-w-2xl leading-relaxed">
          Click any label pill to copy it to your clipboard. Paste it directly into the <strong>"Labels"</strong> field in Blogger on the right side of the post editor.
        </p>

        <div className="space-y-5">
          {/* Departments */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Departments &amp; Categories:
            </h4>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
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

          {/* Webzine Issues */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Webzine Editions &amp; Lead Story Placement:
            </h4>
            <div className="flex flex-wrap gap-2">
              {editions.map((ed) => (
                <button
                  key={ed}
                  type="button"
                  onClick={() => copyToClipboard(ed, ed)}
                  className={`px-3 py-1.5 text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    copiedTag === ed
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:border-[#E27A2B]'
                  }`}
                >
                  {copiedTag === ed ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                  <span>{ed}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Series */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Special Investigative Series:
            </h4>
            <div className="flex flex-wrap gap-2">
              {seriesTags.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => copyToClipboard(st, st)}
                  className={`px-3 py-1.5 text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    copiedTag === st
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:border-[#E27A2B]'
                  }`}
                >
                  {copiedTag === st ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                  <span>{st}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Format Badges */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Formats &amp; Feature Flags:
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

          {/* Author Overrides */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Author Overrides (Use when posting on behalf of a columnist):
            </h4>
            <div className="flex flex-wrap gap-2">
              {authorTags.map((at) => (
                <button
                  key={at}
                  type="button"
                  onClick={() => copyToClipboard(at, at)}
                  className={`px-3 py-1.5 text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    copiedTag === at
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:border-[#E27A2B]'
                  }`}
                >
                  {copiedTag === at ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                  <span>{at}</span>
                </button>
              ))}
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
    </div>
  );
}
