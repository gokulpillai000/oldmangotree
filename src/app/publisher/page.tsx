'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PenTool,
  Calendar,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Send,
  Tag,
  Folder,
  FileText,
  BookOpen,
  ExternalLink,
  KeyRound,
  ArrowRight,
  Trash2,
  Edit3,
  PlusCircle,
  Layers,
  Film,
  Radio,
  X,
  LogOut,
} from 'lucide-react';
import { POPULAR_TAG_SUGGESTIONS, determineCategoryFromTags } from '@/lib/categoryMapper';
import { formatDate } from '@/lib/format';
import { getStoredSession, setStoredSession, getAuthHeaders, clientAuthenticate } from '@/lib/clientAuth';

export default function EditorialDeskPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // In-place direct login state for unauthenticated users
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Editorial Desk Tabs: 'editor' | 'published' | 'packets' | 'channels'
  const [activeTab, setActiveTab] = useState<'editor' | 'published' | 'packets' | 'channels'>('editor');
  const [recentArticles, setRecentArticles] = useState<any[]>([]);
  const [lastPublishedSlug, setLastPublishedSlug] = useState<string | null>(null);

  // Article Form State
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [webzineIssue, setWebzineIssue] = useState('packet-2');
  const [scheduledTime, setScheduledTime] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Kerala', 'Politics']);
  const [customTagInput, setCustomTagInput] = useState('');
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80');
  const [htmlContent, setHtmlContent] = useState('');
  const [isPremium, setIsPremium] = useState(false);

  // Issue Packets State
  const [issues, setIssues] = useState<any[]>([]);
  const [packetId, setPacketId] = useState('packet-3');
  const [packetTitle, setPacketTitle] = useState('PACKET 3');
  const [packetNumber, setPacketNumber] = useState(3);
  const [packetTheme, setPacketTheme] = useState('Cultural Shifts & Emerging Perspectives');
  const [packetCover, setPacketCover] = useState('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80');
  const [packetLeadStory, setPacketLeadStory] = useState('');
  const [packetSelectedSlugs, setPacketSelectedSlugs] = useState<string[]>([]);

  const [publishing, setPublishing] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadArticles = () => {
    fetch('/api/publish', {
      headers: getAuthHeaders(),
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.articles) {
          setRecentArticles(data.articles);
        }
      })
      .catch(() => {});
  };

  const loadIssues = () => {
    fetch('/api/issues', {
      headers: getAuthHeaders(),
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.issues) {
          setIssues(data.issues);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    // 1. Instantly check localStorage for zero-delay mobile recovery
    const stored = getStoredSession();
    if (stored) {
      setSession(stored);
      setLoading(false);
      loadArticles();
      loadIssues();
    }

    // 2. Sync with server
    fetch('/api/auth', {
      headers: getAuthHeaders(),
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.session) {
          setSession(data.session);
          setStoredSession(data.session);
          loadArticles();
          loadIssues();
        } else if (!stored) {
          setSession(null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDirectLogin = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    const submitEmail = (customEmail || loginEmail).trim();
    const submitPass = customPassword || loginPassword;

    try {
      let sessionData = null;

      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            action: 'signin',
            email: submitEmail,
            password: submitPass,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.session) {
            sessionData = data.session;
          }
        }
      } catch (networkErr) {
        // Fallback for static mode
      }

      if (!sessionData) {
        const fallback = clientAuthenticate(submitEmail, submitPass);
        if ('error' in fallback) {
          throw new Error(fallback.error);
        }
        sessionData = fallback;
      }

      setStoredSession(sessionData);
      setSession(sessionData);
      loadArticles();
      loadIssues();
    } catch (err: any) {
      setLoginError(err.message || 'An error occurred during sign in');
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
    setRecentArticles([]);
    setIssues([]);
  };

  const autoCategory = determineCategoryFromTags(selectedTags);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (customTagInput.trim()) {
        const newTag = customTagInput.trim().replace(/^#/, '');
        if (!selectedTags.includes(newTag)) {
          setSelectedTags([...selectedTags, newTag]);
        }
        setCustomTagInput('');
      }
    }
  };

  // ================= SAVE / UPDATE ARTICLE =================
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !htmlContent) {
      setResultMsg({ type: 'error', text: 'Please fill in both the article title and content body.' });
      return;
    }

    setPublishing(true);
    setResultMsg(null);

    try {
      const publishedAt = scheduledTime ? new Date(scheduledTime).toISOString() : new Date().toISOString();
      const isUpdating = Boolean(editingSlug);
      const method = isUpdating ? 'PUT' : 'POST';

      const payload = {
        ...(isUpdating ? { slug: editingSlug } : {}),
        title,
        excerpt,
        category: autoCategory,
        webzineIssue,
        tags: selectedTags,
        coverImage,
        markdownContent: htmlContent,
        isPremium,
        publishedAt,
      };

      const res = await fetch('/api/publish', {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save article');
      }

      setResultMsg({
        type: 'success',
        text: data.message || (isUpdating ? 'Article updated successfully!' : 'Article published successfully!'),
      });

      if (data.article && data.article.slug) {
        setLastPublishedSlug(data.article.slug);
      }

      loadArticles();

      if (!isUpdating) {
        // Reset form for new story
        setTitle('');
        setExcerpt('');
        setHtmlContent('');
        setScheduledTime('');
        setSelectedTags(['Kerala', 'Politics']);
      }
    } catch (err: any) {
      setResultMsg({ type: 'error', text: err.message || 'Error occurred while saving article.' });
    } finally {
      setPublishing(false);
    }
  };

  // ================= EDIT ARTICLE HANDLER =================
  const handleEditArticle = async (slug: string) => {
    setResultMsg(null);
    try {
      const res = await fetch(`/api/publish?slug=${slug}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.article) {
        throw new Error(data.error || 'Failed to fetch article');
      }

      const a = data.article;
      setEditingSlug(slug);
      setTitle(a.title || '');
      setExcerpt(a.excerpt || '');
      setSelectedTags(a.tags || ['Kerala']);
      setCoverImage(a.coverImage || '');
      setWebzineIssue(a.webzineIssue || 'packet-2');
      setIsPremium(Boolean(a.isPremium));
      setHtmlContent(a.markdownContent || '');
      if (a.publishedAt) {
        setScheduledTime(new Date(a.publishedAt).toISOString().slice(0, 16));
      }

      setActiveTab('editor');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      alert('Could not load article for editing: ' + err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingSlug(null);
    setTitle('');
    setExcerpt('');
    setHtmlContent('');
    setScheduledTime('');
    setSelectedTags(['Kerala', 'Politics']);
    setResultMsg(null);
  };

  // ================= DELETE ARTICLE HANDLER =================
  const handleDeleteArticle = async (slug: string, articleTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${articleTitle}"?`)) return;

    try {
      const res = await fetch(`/api/publish?slug=${slug}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete article');
      }
      setResultMsg({ type: 'success', text: `Article "${articleTitle}" removed.` });
      loadArticles();
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  // ================= SAVE ISSUE PACKET =================
  const handleSavePacket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({
          id: packetId,
          title: packetTitle,
          issueNumber: packetNumber,
          theme: packetTheme,
          coverImage: packetCover,
          featuredArticleSlug: packetLeadStory,
          articleSlugs: packetSelectedSlugs,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save packet');

      setResultMsg({ type: 'success', text: data.message });
      loadIssues();
    } catch (err: any) {
      setResultMsg({ type: 'error', text: err.message });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse font-serif text-lg font-bold text-neutral-500">
          Connecting to Editorial Desk...
        </div>
      </div>
    );
  }

  // Unauthenticated Sign In State
  if (!session) {
    return (
      <div className="max-w-md mx-auto my-6 sm:my-8 p-4 sm:p-8 bg-paper-card dark:bg-paper-cardDark rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
        <div className="space-y-2 text-center">
          <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-950/60 mx-auto flex items-center justify-center text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-900">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            Editorial Desk Access
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Sign in to access editorial tools and content management.
          </p>
        </div>

        {loginError && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
            {loginError}
          </div>
        )}

        {/* 1-Tap Preset Sign-In Buttons */}
        <div className="space-y-2 pt-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block">
            1-Tap Editorial Sign In:
          </label>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              disabled={loginLoading}
              onClick={() => handleDirectLogin(undefined, 'gokulpillai000@gmail.com', 'editorial123')}
              className="w-full text-left px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 hover:border-brand-500 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Gokul Krishnan</p>
                <p className="text-[10px] text-neutral-500">Publisher Desk Admin</p>
              </div>
              <ArrowRight className="w-4 h-4 text-brand-600" />
            </button>
            <button
              type="button"
              disabled={loginLoading}
              onClick={() => handleDirectLogin(undefined, 'editor@oldmangotree.media', 'editor123')}
              className="w-full text-left px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 hover:border-brand-500 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Kamalram Sajeev</p>
                <p className="text-[10px] text-neutral-500">Consulting Editor</p>
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

        <form onSubmit={(e) => handleDirectLogin(e)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Email Address</label>
            <input
              type="email"
              required
              placeholder="editor@oldmangotree.media"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full py-3 rounded-xl bg-brand-700 hover:bg-brand-600 active:scale-[0.99] text-white font-bold text-sm shadow transition-all flex items-center justify-center gap-2"
          >
            {loginLoading ? 'Signing In...' : 'Sign In to Editorial Desk →'}
          </button>
        </form>

        <div className="text-center">
          <Link href="/" className="text-xs font-semibold text-neutral-500 hover:text-brand-600 transition-colors">
            ← Return to Webzine Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Role Gate: Strictly for Editorial / Publisher Staff
  if (session.role !== 'publisher') {
    return (
      <div className="max-w-md mx-auto my-8 sm:my-12 p-4 sm:p-8 bg-paper-card dark:bg-paper-cardDark rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6 text-center">
        <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/60 mx-auto flex items-center justify-center text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            Editorial Staff Access Only
          </h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            You are currently signed in with a subscriber account (<span className="font-semibold text-neutral-800 dark:text-neutral-200">{session.email}</span>). The Editorial Desk is reserved for publication journalists, editors, and administrators.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <Link
            href="/member"
            className="w-full py-3 rounded-xl bg-brand-700 hover:bg-brand-600 text-white font-bold text-xs sm:text-sm shadow transition-colors flex items-center justify-center gap-2"
          >
            <span>Go to Member Lounge</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium text-xs transition-colors flex items-center justify-center gap-2"
          >
            Sign Out / Switch to Staff Account
          </button>
        </div>

        <div className="pt-2 text-center border-t border-neutral-100 dark:border-neutral-800">
          <Link href="/" className="text-xs font-semibold text-neutral-500 hover:text-brand-600 transition-colors">
            ← Return to Webzine Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 py-2 sm:py-4">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-serif font-bold uppercase tracking-wider bg-brand-50 dark:bg-brand-950/60 text-brand-800 dark:text-brand-300 border border-brand-200 dark:border-brand-900 flex items-center gap-1.5">
              <PenTool className="w-3.5 h-3.5 text-brand-700 dark:text-brand-400" /> Editorial Desk
            </span>
            <span className="text-xs text-neutral-500">Editor: {session.name}</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-neutral-50">
            Newsroom &amp; Webzine Management
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-brand-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Live Website
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-red-600 transition-colors px-2.5 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>

      {/* Navigation Segmented Tab Bar (Mobile Thumb-Friendly) */}
      <div className="w-full min-w-0 flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pb-1 border-b border-neutral-200 dark:border-neutral-800">
        <button
          type="button"
          onClick={() => setActiveTab('editor')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition-all ${
            activeTab === 'editor'
              ? 'bg-brand-700 text-white shadow'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{editingSlug ? 'Edit Story' : 'Write Story'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('published')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition-all ${
            activeTab === 'published'
              ? 'bg-brand-700 text-white shadow'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Manage Stories ({recentArticles.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('packets');
            loadIssues();
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition-all ${
            activeTab === 'packets'
              ? 'bg-brand-700 text-white shadow'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Issue Packets ({issues.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('channels')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition-all ${
            activeTab === 'channels'
              ? 'bg-brand-700 text-white shadow'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Media &amp; Series</span>
        </button>
      </div>

      {/* Result Alert Banner */}
      {resultMsg && (
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm font-medium ${
            resultMsg.type === 'success'
              ? 'bg-neutral-50 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100'
              : 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {resultMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-brand-700 dark:text-brand-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{resultMsg.text}</span>
          </div>

          {resultMsg.type === 'success' && lastPublishedSlug && (
            <Link
              href={`/articles/${lastPublishedSlug}`}
              target="_blank"
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-700 hover:bg-brand-600 text-white font-bold text-xs shadow transition-colors"
            >
              <span>View Article Live</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}

      {/* ================= TAB 1: STORY EDITOR ================= */}
      {activeTab === 'editor' && (
        <div className="space-y-6">
          {editingSlug && (
            <div className="p-3.5 rounded-xl bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-900 flex items-center justify-between text-xs sm:text-sm">
              <span className="font-bold text-brand-700 dark:text-brand-400">
                Editing Story: <code className="font-mono">{editingSlug}</code>
              </span>
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-1 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 font-semibold text-xs"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel Edit</span>
              </button>
            </div>
          )}

          <form onSubmit={handlePublish} className="bg-paper-card dark:bg-paper-cardDark p-4 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
            <div className="space-y-5">
              {/* Article Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Article Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modern Development Policies and Ecological Future"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full min-w-0 px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-base font-serif font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Excerpt / Summary */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Article Summary / Excerpt
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief summary or introductory dek for cards and social previews..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="w-full min-w-0 px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Tag Suggestions & Category Auto-Mapping */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-brand-600" />
                    <span>Topic Tags</span>
                  </label>
                  <span className="text-xs font-bold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2.5 py-1 rounded-full border border-brand-200 dark:border-brand-900">
                    Category: {autoCategory.toUpperCase()}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 py-1">
                  {POPULAR_TAG_SUGGESTIONS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-brand-700 text-white shadow-xs'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}#{tag}
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  placeholder="Type custom tag and press Enter..."
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={handleAddCustomTag}
                  className="w-full min-w-0 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Webzine Issue & Scheduling */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                    Magazine Issue Assignment
                  </label>
                  <select
                    value={webzineIssue}
                    onChange={(e) => setWebzineIssue(e.target.value)}
                    className="w-full min-w-0 px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="packet-2">Packet 2 (Current Issue)</option>
                    <option value="packet-1">Packet 1 (Inaugural Issue)</option>
                    <option value="packet-3">Packet 3 (Upcoming Issue)</option>
                    <option value="">Standalone Article (No Packet)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                    Scheduled Publication (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full min-w-0 max-w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Cover Image URL */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Lead Image URL
                </label>
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Markdown Content Body */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Article Body (Markdown / Text) *
                </label>
                <textarea
                  required
                  rows={10}
                  placeholder="Write your long-form story, analysis, or critique here..."
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm font-sans text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono leading-relaxed"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                {editingSlug && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-3 rounded-xl text-xs sm:text-sm font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={publishing}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-700 hover:bg-brand-600 text-white font-bold text-sm shadow transition-all active:scale-[0.99]"
                >
                  <Send className="w-4 h-4" />
                  <span>{publishing ? 'Saving...' : editingSlug ? 'Update Article' : 'Publish Story'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ================= TAB 2: MANAGE STORIES ================= */}
      {activeTab === 'published' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <h2 className="font-serif text-lg font-bold text-neutral-900 dark:text-neutral-100">
                Published &amp; Scheduled Articles
              </h2>
              <p className="text-xs text-neutral-500">
                All articles stored in the flat-file database
              </p>
            </div>
            <button
              onClick={() => {
                handleCancelEdit();
                setActiveTab('editor');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-700 text-white text-xs font-bold shadow-xs hover:bg-brand-600 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Write New</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {recentArticles.map((article) => (
              <div
                key={article.slug}
                className="p-4 rounded-2xl bg-paper-card dark:bg-paper-cardDark border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                      {article.category}
                    </span>
                    {article.webzineIssue && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                        {article.webzineIssue.toUpperCase()}
                      </span>
                    )}
                    <span className="text-[11px] text-neutral-500">
                      {article.publishedAt ? formatDate(article.publishedAt) : ''}
                    </span>
                  </div>

                  <h3 className="font-serif text-base font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1 break-words">
                    {article.title}
                  </h3>

                  <p className="text-xs text-neutral-500 line-clamp-1 font-mono break-all">
                    /{article.slug}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100 dark:border-neutral-800">
                  <button
                    onClick={() => handleEditArticle(article.slug)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-950 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDeleteArticle(article.slug, article.title)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>

                  <Link
                    href={`/articles/${article.slug}`}
                    target="_blank"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-700 text-white text-xs font-bold hover:bg-brand-600 transition-colors"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: ISSUE PACKETS ================= */}
      {activeTab === 'packets' && (
        <div className="space-y-8">
          {/* Create or Update Packet Form */}
          <form onSubmit={handleSavePacket} className="bg-paper-card dark:bg-paper-cardDark p-4 sm:p-7 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-4">
            <h2 className="font-serif text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-600" />
              <span>Create or Update Issue Packet</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">
                  Packet ID (e.g. packet-3)
                </label>
                <input
                  type="text"
                  required
                  value={packetId}
                  onChange={(e) => setPacketId(e.target.value)}
                  className="w-full min-w-0 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-mono text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">
                  Title (e.g. PACKET 3)
                </label>
                <input
                  type="text"
                  required
                  value={packetTitle}
                  onChange={(e) => setPacketTitle(e.target.value)}
                  className="w-full min-w-0 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">
                  Issue Number
                </label>
                <input
                  type="number"
                  required
                  value={packetNumber}
                  onChange={(e) => setPacketNumber(Number(e.target.value))}
                  className="w-full min-w-0 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">
                Theme / Editorial Dek
              </label>
              <input
                type="text"
                required
                value={packetTheme}
                onChange={(e) => setPacketTheme(e.target.value)}
                placeholder="Theme of this magazine packet..."
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">
                Cover Poster Image URL
              </label>
              <input
                type="text"
                value={packetCover}
                onChange={(e) => setPacketCover(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-600 text-white font-bold text-xs shadow-sm transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Save Issue Packet</span>
              </button>
            </div>
          </form>

          {/* Existing Packets List */}
          <div className="space-y-3">
            <h3 className="font-serif text-base font-bold text-neutral-900 dark:text-neutral-100">
              Existing Issue Packets
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {issues.map((iss) => (
                <div
                  key={iss.id}
                  className="p-4 rounded-2xl bg-paper-card dark:bg-paper-cardDark border border-neutral-200 dark:border-neutral-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-xs font-bold">
                      {iss.title}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {(iss.articleSlugs || []).length} articles
                    </span>
                  </div>
                  <h4 className="font-serif text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    {iss.theme}
                  </h4>
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                    <Link
                      href={`/magazine/${iss.id}`}
                      target="_blank"
                      className="text-brand-600 hover:underline flex items-center gap-1 font-bold"
                    >
                      <span>View Live Packet</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                    <button
                      onClick={() => {
                        setPacketId(iss.id);
                        setPacketTitle(iss.title);
                        setPacketNumber(iss.issueNumber || 1);
                        setPacketTheme(iss.theme || '');
                        setPacketCover(iss.coverImage || '');
                        setPacketLeadStory(iss.featuredArticleSlug || '');
                        setPacketSelectedSlugs(iss.articleSlugs || []);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-neutral-600 hover:text-neutral-900 font-semibold"
                    >
                      Load into Editor ↑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: MEDIA & SERIES ================= */}
      {activeTab === 'channels' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-paper-card dark:bg-paper-cardDark border border-neutral-200 dark:border-neutral-800 space-y-3">
            <div className="flex items-center gap-2 text-brand-700 dark:text-brand-400">
              <Film className="w-5 h-5" />
              <h3 className="font-serif text-base font-bold">Video Essays &amp; Documentary Catalog</h3>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Videos are configured via <code className="font-mono">content/videos.json</code>. You can preview all 6 live video essays on the dedicated portal.
            </p>
            <Link
              href="/videos"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-brand-700 hover:text-white transition-colors"
            >
              <span>Open Videos Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-paper-card dark:bg-paper-cardDark border border-neutral-200 dark:border-neutral-800 space-y-3">
            <div className="flex items-center gap-2 text-brand-700 dark:text-brand-400">
              <Radio className="w-5 h-5" />
              <h3 className="font-serif text-base font-bold">Audio &amp; Podcast Episodes</h3>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Podcasts are configured via <code className="font-mono">content/podcasts/</code>. Narration streams across all page navigations.
            </p>
            <Link
              href="/podcasts"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-brand-700 hover:text-white transition-colors"
            >
              <span>Open Audio Hub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
