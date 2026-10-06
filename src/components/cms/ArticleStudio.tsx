'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Save,
  Send,
  Eye,
  Copy,
  Check,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  Volume2,
  Tag,
  User,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  FolderOpen,
  X,
  Search,
  UploadCloud,
  FileText,
  Clock,
  Radio,
  Play,
  Pause,
  Mic,
  Headphones,
  Music,
  FileAudio,
  VolumeX,
  Users,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';
import { ArticlePreviewModal } from './ArticlePreviewModal';
import {
  saveSupabaseArticle,
  fetchSupabaseArticlesAndDrafts,
  deleteSupabaseArticle,
  SupabaseArticleRecord,
} from '@/lib/supabase';
import { compressAndUploadImage, uploadAudioFile } from '@/lib/imageUpload';

const STANDARD_CATEGORIES = [
  'Politics',
  'Cinema',
  'Literature',
  'Sports',
  'The shade',
  'Fallen mangoes',
  'Media',
  'Society',
  'Environment',
  'Economy',
  'Science',
  'Interview',
  'Opinion',
  'Podcast',
  'Webzine',
];

interface ArticleStudioProps {
  authors: string[];
  packets: string[];
  onAddAuthor: (name: string) => void;
  onAddPacket?: (name: string) => void;
}

export function ArticleStudio({
  authors,
  packets,
  onAddAuthor,
  onAddPacket,
}: ArticleStudioProps) {
  // Article Content Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugCustomized, setSlugCustomized] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [category, setCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [author, setAuthor] = useState('');
  const [localAuthors, setLocalAuthors] = useState<string[]>(
    Array.isArray(authors) && authors.length > 0 ? authors : ['Akhil U Krishnan', 'Amala Thomas']
  );
  const [isAddingAuthorModalOpen, setIsAddingAuthorModalOpen] = useState(false);
  const [newAuthorNameInput, setNewAuthorNameInput] = useState('');

  useEffect(() => {
    if (Array.isArray(authors) && authors.length > 0) {
      setLocalAuthors((prev) => Array.from(new Set([...(prev || []), ...authors])));
    }
  }, [authors]);
  const [packet, setPacket] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [seriesTitle, setSeriesTitle] = useState('');
  const [seriesEpisode, setSeriesEpisode] = useState('1');

  // Incremented on Write New+ to force complete editor remount
  const [editorKey, setEditorKey] = useState(0);

  // Format Switcher: Standard Article vs Dedicated Podcast / Audio Story
  const [isPodcastMode, setIsPodcastMode] = useState(false);

  // Audio & Podcast Dedicated Suite States
  const [audioUrl, setAudioUrl] = useState('');
  const [audioSpeaker, setAudioSpeaker] = useState('');
  const [audioDurationSeconds, setAudioDurationSeconds] = useState<number>(0);
  const [audioFileName, setAudioFileName] = useState('');
  const [audioFileSize, setAudioFileSize] = useState('');
  const [audioSourceTab, setAudioSourceTab] = useState<'upload' | 'url'>('upload');
  const [googleDriveDetected, setGoogleDriveDetected] = useState(false);

  // In-Studio Audio Player Preview State
  const studioAudioRef = useRef<HTMLAudioElement>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);

  // Editorial Flags
  const [isLeadStory, setIsLeadStory] = useState(false);
  const [isCover, setIsCover] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isLongform, setIsLongform] = useState(false);

  // Studio States
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Upload States
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Library / Drafts Modal
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [savedArticles, setSavedArticles] = useState<SupabaseArticleRecord[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryFilter, setLibraryFilter] = useState<'draft' | 'scheduled' | 'published'>('draft');

  // Schedule Publish States
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [loadedArticleStatus, setLoadedArticleStatus] = useState<'draft' | 'published' | 'scheduled' | null>(null);
  const [loadedScheduledAt, setLoadedScheduledAt] = useState<string | null>(null);

  // Editing Uploaded Article & Audio Date State
  const [editingArticleSlug, setEditingArticleSlug] = useState<string | null>(null);
  const [audioPublishDate, setAudioPublishDate] = useState(() => new Date().toISOString().split('T')[0]);
  const articleFileInputRef = useRef<HTMLInputElement>(null);

  // Inline Packet Modal
  const [newPacketName, setNewPacketName] = useState('');
  const [isAddingPacket, setIsAddingPacket] = useState(false);

  // 1. Auto-slug generation from title
  useEffect(() => {
    if (!slugCustomized && title.trim()) {
      const generated = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setSlug(generated);
    }
  }, [title, slugCustomized]);

  // 2. Draft Auto-restore on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('omt_cms_draft_v1');
      if (savedDraft) {
        const d = JSON.parse(savedDraft);
        if (d.title) setTitle(d.title);
        if (d.slug) setSlug(d.slug);
        if (d.excerpt) setExcerpt(d.excerpt);
        if (d.contentHtml) setContentHtml(d.contentHtml);
        if (d.category) setCategory(d.category);
        if (Array.isArray(d.tags)) setSelectedTags(d.tags);
        if (d.author) setAuthor(d.author);
        if (d.packet) setPacket(d.packet);
        if (d.coverImage) setCoverImage(d.coverImage);
        if (d.audioUrl) {
          setAudioUrl(d.audioUrl);
          if (d.audioDurationSeconds) setAudioDurationSeconds(d.audioDurationSeconds);
          if (d.audioSpeaker) setAudioSpeaker(d.audioSpeaker);
          if (d.isPodcastMode) setIsPodcastMode(true);
        }
        if (d.isLeadStory !== undefined) setIsLeadStory(d.isLeadStory);
        if (d.isCover !== undefined) setIsCover(d.isCover);
        if (d.isPremium !== undefined) setIsPremium(d.isPremium);
        if (d.isLongform !== undefined) setIsLongform(d.isLongform);
        if (d.seriesTitle) setSeriesTitle(d.seriesTitle);
        if (d.seriesEpisode) setSeriesEpisode(d.seriesEpisode);
        setLastSavedTime('Draft restored from previous session');
      }
    } catch {}
  }, []);

  // 3. Draft Auto-save every 15 seconds to local browser cache
  useEffect(() => {
    const timer = setInterval(() => {
      if (title.trim() || contentHtml.trim() || audioUrl.trim()) {
        try {
          localStorage.setItem(
            'omt_cms_draft_v1',
            JSON.stringify({
              title,
              slug,
              excerpt,
              contentHtml,
              category,
              tags: selectedTags,
              author,
              packet,
              coverImage,
              audioUrl,
              audioSpeaker,
              audioDurationSeconds,
              isPodcastMode,
              isLeadStory,
              isCover,
              isPremium,
              isLongform,
              seriesTitle,
              seriesEpisode,
              savedAt: new Date().toISOString(),
            })
          );
          const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setLastSavedTime(`Auto-saved locally at ${time}`);
        } catch {}
      }
    }, 15000);

    return () => clearInterval(timer);
  }, [
    title,
    slug,
    excerpt,
    contentHtml,
    category,
    selectedTags,
    author,
    packet,
    coverImage,
    audioUrl,
    audioSpeaker,
    audioDurationSeconds,
    isPodcastMode,
    isLeadStory,
    isCover,
    isPremium,
    isLongform,
    seriesTitle,
    seriesEpisode,
  ]);

  // Helper to add and select a new author
  const handleAddNewAuthorConfirm = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newAuthorNameInput.trim();
    if (!trimmed) return;
    if (!localAuthors.includes(trimmed)) {
      setLocalAuthors((prev) => [...prev, trimmed]);
      onAddAuthor(trimmed);
    }
    setAuthor(trimmed);
    setAudioSpeaker(trimmed);
    setNewAuthorNameInput('');
    setIsAddingAuthorModalOpen(false);
    setStatusMessage({
      text: `Author "${trimmed}" added and selected!`,
      type: 'success',
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Audio Duration Detection Helper (from File)
  const detectDurationFromFile = (file: File) => {
    try {
      const audio = new Audio();
      const objUrl = URL.createObjectURL(file);
      audio.preload = 'metadata';
      audio.src = objUrl;
      const onLoaded = () => {
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
          setAudioDurationSeconds(Math.round(audio.duration));
        }
      };
      audio.onloadedmetadata = onLoaded;
      audio.ondurationchange = onLoaded;
      audio.oncanplay = onLoaded;
    } catch (err) {
      console.warn('Error reading audio duration from file:', err);
    }
  };

  // Audio Duration Detection Helper (from URL)
  const detectDurationFromUrl = (url: string) => {
    if (!url || !url.trim()) return;
    try {
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.src = url;
      const onLoaded = () => {
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
          setAudioDurationSeconds(Math.round(audio.duration));
        }
      };
      audio.onloadedmetadata = onLoaded;
      audio.ondurationchange = onLoaded;
      audio.oncanplay = onLoaded;
    } catch {}
  };

  // Google Drive URL Auto-converter & Stream Duration Auto-fetch
  const handleAudioUrlChange = (val: string) => {
    const trimmed = val.trim();
    const today = new Date().toISOString().split('T')[0];
    if (!audioPublishDate) setAudioPublishDate(today);

    const idMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      const streamUrl = `https://docs.google.com/uc?export=download&id=${idMatch[1]}`;
      setAudioUrl(streamUrl);
      setGoogleDriveDetected(true);
      detectDurationFromUrl(streamUrl);
      setStatusMessage({ text: 'Auto-converted Google Drive sharing link to direct audio stream URL!', type: 'success' });
      setTimeout(() => setStatusMessage(null), 3500);
      return;
    }
    setGoogleDriveDetected(false);
    setAudioUrl(val);
    if (val.trim()) {
      detectDurationFromUrl(val.trim());
    }
  };

  // Audio Upload handler (Direct to Supabase Storage)
  const handleAudioFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFileName(file.name);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setAudioFileSize(`${sizeMb} MB`);

    // 1. Auto-fetch duration from the file
    detectDurationFromFile(file);

    // 2. Auto-fetch publish date (today's date in YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    setAudioPublishDate(today);

    setIsUploadingAudio(true);
    try {
      const res = await uploadAudioFile(file);
      if (res.url) {
        setAudioUrl(res.url);
        // Ensure Podcast / Audio Story tags exist
        if (!selectedTags.includes('Podcast')) {
          setSelectedTags((prev) => [...prev, 'Podcast']);
        }
        if (!selectedTags.includes('Audio Story')) {
          setSelectedTags((prev) => [...prev, 'Audio Story']);
        }
        setStatusMessage({ text: `Audio file "${file.name}" uploaded successfully!`, type: 'success' });
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        alert(res.error || 'Audio upload failed');
      }
    } catch (err: any) {
      alert(`Audio upload error: ${err?.message || 'Error'}`);
    } finally {
      setIsUploadingAudio(false);
      if (audioInputRef.current) audioInputRef.current.value = '';
    }
  };

  // In-Studio Audio Player Controls
  const toggleStudioAudioPlayback = () => {
    if (!studioAudioRef.current) return;
    if (isPlayingAudio) {
      studioAudioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      studioAudioRef.current.play().then(() => setIsPlayingAudio(true)).catch(console.warn);
    }
  };

  const handleStudioAudioTimeUpdate = () => {
    if (studioAudioRef.current) {
      setAudioCurrentTime(studioAudioRef.current.currentTime);
      if (studioAudioRef.current.duration && !audioDurationSeconds) {
        setAudioDurationSeconds(Math.round(studioAudioRef.current.duration));
      }
    }
  };

  const handleStudioAudioSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setAudioCurrentTime(val);
    if (studioAudioRef.current) {
      studioAudioRef.current.currentTime = val;
    }
  };

  const formatSeconds = (sec: number) => {
    if (!sec || isNaN(sec) || !isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Load Saved Articles & Drafts
  const loadSavedArticles = async () => {
    setLoadingLibrary(true);
    try {
      const records = await fetchSupabaseArticlesAndDrafts();
      setSavedArticles(records);
    } catch (err) {
      console.warn('Error loading library:', err);
    } finally {
      setLoadingLibrary(false);
    }
  };

  const handleOpenLibrary = () => {
    setIsLibraryOpen(true);
    loadSavedArticles();
  };

  useEffect(() => {
    loadSavedArticles();
  }, []);

  const handleLoadArticleIntoStudio = (rec: SupabaseArticleRecord) => {
    if (confirm(`Load "${rec.title}" into the editor? Any unsaved changes in current editor will be replaced.`)) {
      setTitle(rec.title || '');
      setSlug(rec.slug || '');
      setSlugCustomized(true);
      setExcerpt(rec.excerpt || '');
      setContentHtml(rec.content_html || '');
      setCategory(rec.category ? rec.category.charAt(0).toUpperCase() + rec.category.slice(1) : 'Politics');
      setSelectedTags(rec.tags && rec.tags.length > 0 ? rec.tags : [rec.category || 'Politics']);
      setAuthor(rec.author_names || (rec.authors && rec.authors[0]) || authors[0]);
      setPacket(rec.webzine_issue || 'None');
      setCoverImage(rec.cover_image || '');
      setAudioUrl(rec.audio_narration_url || '');
      setAudioDurationSeconds(rec.audio_duration_seconds || 0);
      setAudioSpeaker(rec.author_names || author);
      setLoadedArticleStatus(rec.status);
      setLoadedScheduledAt(rec.published_at || null);
      if (rec.published_at) {
        setAudioPublishDate(rec.published_at.split('T')[0]);
        try {
          const d = new Date(rec.published_at);
          if (!isNaN(d.getTime())) {
            setScheduledDateTime(dateToDateTimeLocalString(d));
          }
        } catch {}
      }
      if (rec.audio_narration_url || rec.category === 'podcast') {
        setIsPodcastMode(true);
      } else {
        setIsPodcastMode(false);
      }
      setIsLeadStory(Boolean(rec.is_lead_story));
      setIsCover(Boolean(rec.is_cover));
      setIsPremium(Boolean(rec.is_premium));
      setIsLongform(Boolean(rec.is_longform));
      setSeriesTitle(rec.series_title || '');
      setSeriesEpisode(rec.series_episode ? rec.series_episode.toString() : '1');
      setEditingArticleSlug(rec.slug);
      setIsLibraryOpen(false);
      const statusLabel =
        rec.status === 'draft'
          ? 'Draft'
          : rec.status === 'scheduled' || (rec.published_at && new Date(rec.published_at).getTime() > Date.now())
          ? 'Scheduled'
          : 'Published';
      setStatusMessage({
        text: `Loaded "${rec.title}" into Studio for editing (${statusLabel})`,
        type: 'success',
      });
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleArticleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      let parsedTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      let parsedContent = text;

      if (file.name.endsWith('.md')) {
        const headingMatch = text.match(/^#\s+(.+)$/m);
        if (headingMatch) {
          parsedTitle = headingMatch[1].trim();
        }
      } else if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
        const titleMatch = text.match(/<title>([^<]+)<\/title>/i) || text.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        if (titleMatch) {
          parsedTitle = titleMatch[1].trim();
        }
      }

      setTitle(parsedTitle);
      setContentHtml(parsedContent);
      setEditingArticleSlug(null);
      setStatusMessage({
        text: `Uploaded "${file.name}" into editor! You can now review, edit, and publish.`,
        type: 'success',
      });
      setTimeout(() => setStatusMessage(null), 5000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Format date cleanly for library list
  const formatLibraryDate = (dateStr?: string) => {
    if (!dateStr) return 'Date unavailable';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return (
        d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) +
        ' at ' +
        d.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      );
    } catch {
      return dateStr;
    }
  };

  // Convert Date object to YYYY-MM-DDTHH:mm for datetime-local input
  const dateToDateTimeLocalString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Format date for scheduled release display
  const formatScheduledDisplay = (dateStr?: string): string => {
    if (!dateStr) return 'Date not set';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return (
        d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) +
        ' at ' +
        d.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      );
    } catch {
      return dateStr;
    }
  };

  // Calculate live countdown to scheduled date
  const getRelativeCountdown = (targetIso?: string): string => {
    if (!targetIso) return '';
    try {
      const targetMs = new Date(targetIso).getTime();
      const nowMs = Date.now();
      const diffMs = targetMs - nowMs;
      if (diffMs <= 0) return 'Ready to publish / Live';
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      const days = Math.floor(hours / 24);
      const remHours = hours % 24;

      if (days > 0) {
        return `Goes live in ${days}d ${remHours}h`;
      }
      if (hours > 0) {
        return `Goes live in ${hours}h ${mins}m`;
      }
      return `Goes live in ${mins} mins`;
    } catch {
      return '';
    }
  };

  // Article classification helpers
  const isArticleScheduled = (a: SupabaseArticleRecord): boolean => {
    if (a.status === 'scheduled') return true;
    if (a.status !== 'draft' && a.published_at && new Date(a.published_at).getTime() > Date.now()) {
      return true;
    }
    return false;
  };

  const isArticlePublished = (a: SupabaseArticleRecord): boolean => {
    if (a.status === 'draft') return false;
    if (isArticleScheduled(a)) return false;
    return a.status === 'published' || (Boolean(a.published_at) && new Date(a.published_at!).getTime() <= Date.now());
  };

  const isCurrentlyScheduled = Boolean(
    loadedArticleStatus === 'scheduled' ||
    (loadedScheduledAt && new Date(loadedScheduledAt).getTime() > Date.now())
  );

  const handleOpenScheduleModal = () => {
    if (!title.trim()) {
      alert('Please enter an article title before scheduling.');
      return;
    }
    const now = new Date();
    const d = new Date(now.getTime() + 60 * 60 * 1000);
    const m = d.getMinutes();
    d.setMinutes(Math.ceil(m / 5) * 5, 0, 0);

    if (loadedScheduledAt) {
      try {
        const existing = new Date(loadedScheduledAt);
        if (existing.getTime() > Date.now()) {
          setScheduledDateTime(dateToDateTimeLocalString(existing));
          setIsScheduleModalOpen(true);
          return;
        }
      } catch {}
    }

    setScheduledDateTime(dateToDateTimeLocalString(d));
    setIsScheduleModalOpen(true);
  };



  const handleConfirmSchedule = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!scheduledDateTime) {
      alert('Please select a scheduled date and time.');
      return;
    }
    const targetDate = new Date(scheduledDateTime);
    if (isNaN(targetDate.getTime())) {
      alert('Invalid date format selected.');
      return;
    }
    if (targetDate.getTime() <= Date.now()) {
      alert('Scheduled date & time must be in the future. To publish immediately, use the "Publish to Site" button.');
      return;
    }

    setIsScheduleModalOpen(false);
    await handleSaveToDatabase('scheduled', targetDate.toISOString());
  };

  const handlePublishNow = async (targetSlug: string) => {
    const article = savedArticles.find((a) => a.slug === targetSlug);
    if (!article) return;
    if (
      !confirm(
        `Publish "${article.title}" live right now?\n\nIt will immediately become visible to all readers across the website.`
      )
    ) {
      return;
    }

    const updatedRecord: SupabaseArticleRecord = {
      ...article,
      status: 'published',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const res = await saveSupabaseArticle(updatedRecord);
    if (res.success) {
      setSavedArticles((prev) =>
        prev.map((a) => (a.slug === targetSlug ? updatedRecord : a))
      );
      if (editingArticleSlug === targetSlug) {
        setLoadedArticleStatus('published');
        setLoadedScheduledAt(null);
      }
      setStatusMessage({
        text: `"${article.title}" has been published live immediately!`,
        type: 'success',
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } else {
      alert(`Failed to publish article: ${res.error || 'Database error'}`);
    }
  };

  const handleDeleteArticle = async (delSlug: string, articleTitle?: string) => {
    const itemLabel = articleTitle ? `"${articleTitle}"` : `article "${delSlug}"`;

    // 1st Confirmation
    const firstConfirm = confirm(
      `Are you sure you want to delete ${itemLabel}?\n\nClick OK to proceed or Cancel to keep this story.`
    );
    if (!firstConfirm) return;

    // 2nd Confirmation (Double Confirmation requirement)
    const secondConfirm = confirm(
      `⚠️ FINAL CONFIRMATION (Step 2 of 2):\n\nAre you completely sure you want to permanently delete ${itemLabel} from the database?\n\nThis action CANNOT be undone.`
    );
    if (!secondConfirm) return;

    const ok = await deleteSupabaseArticle(delSlug);
    if (ok) {
      setSavedArticles((prev) => prev.filter((a) => a.slug !== delSlug));
      if (editingArticleSlug === delSlug) {
        setEditingArticleSlug(null);
        setLoadedArticleStatus(null);
        setLoadedScheduledAt(null);
      }
      setStatusMessage({
        text: `Permanently deleted ${itemLabel} from database.`,
        type: 'success',
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } else {
      alert(`Failed to delete ${itemLabel}. Please check your connection.`);
    }
  };

  // Tag Management
  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    );
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customTagInput.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
      setCustomTagInput('');
    }
  };

  // Cover Image upload handler
  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    try {
      const res = await compressAndUploadImage(file);
      if (res.url) {
        setCoverImage(res.url);
      } else if (res.error) {
        alert(`Cover upload error: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Cover upload failed: ${err?.message || 'Error'}`);
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  // Save to Supabase Helper (Draft vs Scheduled vs Published)
  const handleSaveToDatabase = async (
    status: 'draft' | 'published' | 'scheduled',
    customPublishAt?: string
  ) => {
    if (!title.trim()) {
      alert('Please enter an article title first.');
      return;
    }
    if (!contentHtml.trim() && !audioUrl.trim()) {
      alert('Please write article content or attach an audio track first.');
      return;
    }
    if ((status === 'published' || status === 'scheduled') && !category.trim() && !isPodcastMode) {
      alert('Please select a category for the article.');
      return;
    }
    if ((status === 'published' || status === 'scheduled') && !author.trim() && !audioSpeaker.trim()) {
      alert('Please select an author or columnist for the article.');
      return;
    }

    const finalSlug = slug.trim() || `article-${Date.now()}`;
    if (status === 'published') {
      setIsPublishing(true);
    } else if (status === 'draft') {
      setIsSavingDraft(true);
    } else {
      setIsScheduling(true);
    }
    setStatusMessage(null);

    // Auto-include Podcast tags if audio is attached
    let finalTags = [...selectedTags];
    if (audioUrl.trim() || isPodcastMode) {
      if (!finalTags.includes('Podcast')) finalTags.push('Podcast');
      if (!finalTags.includes('Audio Story')) finalTags.push('Audio Story');
    }

    const effectiveCategory = isPodcastMode
      ? 'podcast'
      : (category.trim() || 'Uncategorized').toLowerCase().replace(/\s*&\s*|\s+/g, '-');

    const effectiveAuthor = audioSpeaker.trim() || author.trim() || 'Akhil U Krishnan';

    // Determine target publication timestamp
    let publishedAtIso: string;
    if (customPublishAt) {
      publishedAtIso = customPublishAt;
    } else if (status === 'scheduled') {
      publishedAtIso = scheduledDateTime
        ? new Date(scheduledDateTime).toISOString()
        : new Date(Date.now() + 3600000).toISOString();
    } else if (status === 'published') {
      publishedAtIso = new Date().toISOString();
    } else {
      // draft
      publishedAtIso = audioPublishDate ? new Date(audioPublishDate).toISOString() : new Date().toISOString();
    }

    const record: SupabaseArticleRecord = {
      slug: finalSlug,
      title: title.trim(),
      excerpt: excerpt.trim(),
      content_html: contentHtml,
      category: effectiveCategory,
      tags: finalTags,
      authors: [effectiveAuthor],
      author_names: effectiveAuthor,
      cover_image: coverImage.trim() || undefined,
      audio_narration_url: audioUrl.trim() || undefined,
      audio_duration_seconds: audioDurationSeconds || undefined,
      webzine_issue: packet && packet !== 'None' ? packet : undefined,
      is_lead_story: isLeadStory,
      is_cover: isCover,
      is_premium: isPremium,
      is_longform: isLongform,
      series_title: seriesTitle.trim() || undefined,
      series_episode: seriesTitle.trim() ? parseInt(seriesEpisode, 10) || 1 : undefined,
      status,
      published_at: publishedAtIso,
    };

    try {
      const res = await saveSupabaseArticle(record);
      if (res.success) {
        setEditingArticleSlug(finalSlug);
        setLoadedArticleStatus(status);
        setLoadedScheduledAt(status === 'scheduled' ? publishedAtIso : null);

        // Update local saved articles list
        setSavedArticles((prev) => {
          const existingIdx = prev.findIndex((a) => a.slug === finalSlug);
          if (existingIdx >= 0) {
            const updated = [...prev];
            updated[existingIdx] = record;
            return updated;
          }
          return [record, ...prev];
        });

        if (status === 'published') {
          setPublishedUrl(`/articles/${finalSlug}`);
          setStatusMessage({
            text: isPodcastMode
              ? editingArticleSlug
                ? 'Podcast episode updated successfully!'
                : 'Podcast episode published live! Readers can stream it on /podcasts.'
              : editingArticleSlug
                ? 'Article updated live on the website!'
                : 'Article published live to website!',
            type: 'success',
          });
        } else if (status === 'scheduled') {
          const friendly = formatScheduledDisplay(publishedAtIso);
          const countdown = getRelativeCountdown(publishedAtIso);
          setStatusMessage({
            text: `Story scheduled to go live on ${friendly} (${countdown})! Readers will see it automatically when that time arrives.`,
            type: 'success',
          });
        } else {
          setStatusMessage({
            text: editingArticleSlug
              ? 'Draft updated in database! Click the Saved Drafts folder icon above to view all drafts.'
              : 'Draft saved to database! Click the Saved Drafts folder icon above to view and resume anytime.',
            type: 'success',
          });
        }
        localStorage.removeItem('omt_cms_draft_v1');
      } else {
        setStatusMessage({ text: res.error || 'Failed to save to database', type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'Saving error', type: 'error' });
    } finally {
      setIsPublishing(false);
      setIsSavingDraft(false);
      setIsScheduling(false);
    }
  };

  const handleClear = () => {
    if (confirm('Start a new blank article? Make sure to save your draft first.')) {
      setTitle('');
      setSlug('');
      setSlugCustomized(false);
      setExcerpt('');
      setContentHtml('');
      setCategory('');
      setSelectedTags([]);
      setCustomTagInput('');
      setAuthor('');
      setPacket('');
      setCoverImage('');
      setAudioUrl('');
      setAudioSpeaker('');
      setAudioDurationSeconds(0);
      setAudioFileName('');
      setAudioFileSize('');
      setIsPodcastMode(false);
      setSeriesTitle('');
      setSeriesEpisode('1');
      setIsLeadStory(false);
      setIsCover(false);
      setIsPremium(false);
      setIsLongform(false);
      setEditingArticleSlug(null);
      setLoadedArticleStatus(null);
      setLoadedScheduledAt(null);
      setScheduledDateTime('');
      setAudioPublishDate(new Date().toISOString().split('T')[0]);
      setPublishedUrl(null);
      setStatusMessage(null);
      setLastSavedTime(null);
      setEditorKey((prev) => prev + 1);
      localStorage.removeItem('omt_cms_draft_v1');
    }
  };

  // Filtered Library list (Memoized for optimal performance)
  const filteredLibrary = useMemo(() => {
    return savedArticles.filter((a) => {
      const matchesSearch =
        a.title.toLowerCase().includes(librarySearch.toLowerCase()) ||
        a.slug.toLowerCase().includes(librarySearch.toLowerCase());
      if (!matchesSearch) return false;

      if (libraryFilter === 'draft') return a.status === 'draft';
      if (libraryFilter === 'scheduled') return isArticleScheduled(a);
      if (libraryFilter === 'published') return isArticlePublished(a);
      return true;
    });
  }, [savedArticles, librarySearch, libraryFilter]);

  return (
    <div className="space-y-6">
      {/* Hidden file input for uploading local article files (.md, .html, .txt) */}
      <input
        type="file"
        ref={articleFileInputRef}
        onChange={handleArticleFileUpload}
        accept=".md,.html,.htm,.txt"
        className="hidden"
      />

      {/* Studio Header Command Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded shadow-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#0C2340] text-white dark:bg-[#E27A2B] text-[10px] font-bold uppercase tracking-wider rounded">
              {isPodcastMode ? '🎙️ Podcast Studio' : '✍️ Article Studio'}
            </span>
            <h2 className="text-lg font-serif font-bold text-neutral-900 dark:text-neutral-50">
              {isPodcastMode ? 'Dedicated Podcast Episode & Audio Story' : 'Editor'}
            </h2>
          </div>
          {editingArticleSlug ? (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Editing uploaded story: &ldquo;{title || editingArticleSlug}&rdquo;
            </p>
          ) : lastSavedTime ? (
            <p className="text-xs text-neutral-500 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#E27A2B]" /> {lastSavedTime}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* 1. Write New+ (Icon Only) */}
          <button
            type="button"
            onClick={handleClear}
            className={`p-2.5 border rounded-md transition-all cursor-pointer ${
              !editingArticleSlug
                ? 'bg-[#0C2340] text-[#E27A2B] border-[#0C2340] dark:border-[#E27A2B] shadow-xs'
                : 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700'
            }`}
            title="Write New Article (Clears editor)"
            aria-label="Write New Article"
          >
            <Plus className="w-5 h-5 text-[#E27A2B]" />
          </button>

          {/* 2. Saved Drafts & Uploaded Articles Library (Icon Only) */}
          <button
            type="button"
            onClick={handleOpenLibrary}
            className={`relative p-2.5 border rounded-md transition-all cursor-pointer ${
              editingArticleSlug
                ? 'bg-amber-100 dark:bg-amber-950/70 border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 shadow-xs'
                : 'bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border-neutral-300 dark:border-neutral-600 text-neutral-800 dark:text-neutral-200'
            }`}
            title={`Saved Drafts & Articles Library (${savedArticles.length} items)`}
            aria-label="Saved Drafts and Uploaded Articles"
          >
            <FolderOpen className="w-5 h-5 text-[#E27A2B]" />
            {savedArticles.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#E27A2B] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                {savedArticles.length}
              </span>
            )}
          </button>

          {/* 3. Upload File (Icon Only) */}
          <button
            type="button"
            onClick={() => articleFileInputRef.current?.click()}
            className="p-2.5 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-md transition-colors cursor-pointer"
            title="Upload article file from computer (.md, .html, .txt)"
            aria-label="Upload Article File"
          >
            <UploadCloud className="w-5 h-5 text-[#E27A2B]" />
          </button>

          {/* 4. Live Reader Preview (Icon Only) */}
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="p-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 rounded-md transition-colors cursor-pointer"
            title="Preview Article (Exact Reader View)"
            aria-label="Preview Article"
          >
            <Eye className="w-5 h-5 text-[#E27A2B]" />
          </button>

          {/* 5. Save Draft to Database (Icon Only) */}
          <button
            type="button"
            onClick={() => handleSaveToDatabase('draft')}
            disabled={isSavingDraft || isPublishing || isScheduling}
            className="p-2.5 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-md transition-all cursor-pointer disabled:opacity-50"
            title="Save Draft to Database"
            aria-label="Save Draft to Database"
          >
            {isSavingDraft ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#E27A2B]" />
            ) : (
              <Save className="w-5 h-5 text-[#E27A2B]" />
            )}
          </button>

          {/* 6. Schedule Publish (Icon Only) */}
          <button
            type="button"
            onClick={handleOpenScheduleModal}
            disabled={isSavingDraft || isPublishing || isScheduling}
            className={`p-2.5 border rounded-md transition-all cursor-pointer ${
              isCurrentlyScheduled
                ? 'bg-blue-100 dark:bg-blue-950/70 border-blue-400 dark:border-blue-700 text-blue-900 dark:text-blue-200 shadow-xs'
                : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
            }`}
            title="Schedule Publish (Set automated future release date & time)"
            aria-label="Schedule Publish"
          >
            {isScheduling ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            ) : (
              <Calendar className="w-5 h-5 text-[#E27A2B]" />
            )}
          </button>

          {/* Publish / Update Button (Signature Blogger Orange at Far Right) */}
          <button
            type="button"
            onClick={() => handleSaveToDatabase('published')}
            disabled={isPublishing || isSavingDraft || isScheduling}
            className="flex items-center gap-2 px-5 py-2 bg-[#E27A2B] hover:bg-[#d46a1d] active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xs shadow-md uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> {editingArticleSlug ? 'Updating...' : 'Publishing...'}
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> {editingArticleSlug ? 'Update Live Article' : 'Publish to Site'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scheduled Story Notification Banner */}
      {isCurrentlyScheduled && (
        <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm animate-in fade-in shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <span className="font-black text-blue-950 uppercase tracking-wide">
                Scheduled Story:
              </span>{' '}
              <span className="font-bold text-blue-900">
                Goes live on {formatScheduledDisplay(scheduledDateTime || loadedScheduledAt || '')}{' '}
                <span className="text-blue-700 font-extrabold">
                  ({getRelativeCountdown(scheduledDateTime || loadedScheduledAt || '')})
                </span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenScheduleModal}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase rounded-lg shadow-xs cursor-pointer transition-colors"
            >
              Reschedule
            </button>
            <button
              type="button"
              onClick={() => handleSaveToDatabase('published')}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase rounded-lg shadow-xs cursor-pointer transition-colors"
            >
              Publish Now
            </button>
          </div>
        </div>
      )}

      {/* Editing Uploaded Story Notification Banner */}
      {editingArticleSlug && !isCurrentlyScheduled && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#E27A2B] shrink-0" />
            <div>
              <span className="font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                Currently Editing Uploaded Story:
              </span>{' '}
              <span className="font-serif font-bold text-neutral-900 dark:text-neutral-100">
                &ldquo;{title || editingArticleSlug}&rdquo;
              </span>
              <span className="text-neutral-500 font-mono ml-2 hidden sm:inline">
                (/articles/{slug})
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-1 bg-white dark:bg-neutral-800 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-neutral-700 text-amber-900 dark:text-amber-200 font-bold rounded cursor-pointer self-start sm:self-auto shrink-0"
          >
            + Switch to Write New Story
          </button>
        </div>
      )}

      {/* Format Switcher: Standard Article vs Podcast Episode */}
      <div className="flex items-center gap-2 p-1.5 bg-neutral-100 dark:bg-neutral-800/80 rounded border border-neutral-200 dark:border-neutral-700">
        <button
          type="button"
          onClick={() => {
            setIsPodcastMode(false);
          }}
          className={`flex-1 py-2 px-4 rounded text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            !isPodcastMode
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 shadow-xs border border-neutral-300 dark:border-neutral-700'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
          }`}
        >
          <FileText className="w-4 h-4 text-[#E27A2B]" />
          <span>Standard Article / Longform Story</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setIsPodcastMode(true);
            if (category !== 'Podcast') setCategory('Podcast');
            if (!selectedTags.includes('Podcast')) setSelectedTags((prev) => [...prev, 'Podcast']);
          }}
          className={`flex-1 py-2 px-4 rounded text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isPodcastMode
              ? 'bg-[#0C2340] text-white dark:bg-[#E27A2B] shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
          }`}
        >
          <Mic className="w-4 h-4 text-[#E27A2B] dark:text-white" />
          <span>Dedicated Podcast Episode &amp; Audio Story</span>
          <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-500 dark:text-white text-[10px] font-mono rounded">
            Featured on /podcasts
          </span>
        </button>
      </div>

      {/* Status Messages */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded flex items-center justify-between text-xs sm:text-sm font-medium border animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
              : 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#E27A2B]" />
            <span>{statusMessage.text}</span>
          </div>
          {publishedUrl && (
            <a
              href={publishedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-bold underline hover:text-[#E27A2B]"
            >
              <span>View Live Article</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {isPodcastMode ? (
        /* ========================================================
            DEDICATED PODCAST EPISODE & AUDIO STORY
            Only needs: Cover image, Title, Date, Duration, Author name, About it in one sentence, and Audio upload
            ======================================================== */
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="p-6 sm:p-8 bg-white dark:bg-neutral-900 border-2 border-amber-300 dark:border-amber-700/80 rounded-lg shadow-md space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0C2340] text-[#E27A2B] flex items-center justify-center shrink-0 shadow-sm">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                    Dedicated Podcast Episode &amp; Audio Story
                  </h3>
                  <p className="text-xs text-neutral-500">
                    High-fidelity audio publishing for spoken-word stories and podcast episodes.
                  </p>
                </div>
              </div>
              {audioUrl && (
                <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase rounded-full border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 font-mono">
                  <Check className="w-3.5 h-3.5" /> Audio Attached
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Field 1: Cover Image */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  1. Cover Image (Artwork)
                </label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={coverInputRef}
                    onChange={handleCoverSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={isUploadingCover}
                    className="px-3.5 py-2 bg-[#0C2340] text-white dark:bg-[#E27A2B] hover:bg-[#123157] text-xs font-bold rounded flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingCover ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5 text-[#E27A2B] dark:text-white" />
                    )}
                    <span>{isUploadingCover ? 'Uploading...' : 'Upload Cover'}</span>
                  </button>
                  <input
                    type="text"
                    placeholder="Or paste cover URL..."
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100 focus:ring-1 focus:ring-[#E27A2B]"
                  />
                </div>
                {coverImage ? (
                  <div className="relative mt-2 rounded overflow-hidden border border-neutral-300 dark:border-neutral-700 aspect-video shadow-xs max-h-48 group">
                    <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setCoverImage('')}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Cover
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded text-center text-xs text-neutral-400">
                    No cover image selected yet. Upload an image (16:9 or 1:1 artwork).
                  </div>
                )}
              </div>

              {/* Right Side: Fields 2, 3, 4, 5, 6 */}
              <div className="space-y-4">
                {/* Field 2: Title */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                    2. Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Podcast Episode / Audio Story Title..."
                    className="w-full px-3.5 py-2.5 text-base font-serif font-bold bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-50 focus:ring-1 focus:ring-[#E27A2B]"
                  />
                </div>

                {/* Field 3: Date & Field 4: Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                        3. Date (Auto-fetched)
                      </label>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Auto-set to today</span>
                    </div>
                    <input
                      type="date"
                      value={audioPublishDate}
                      onChange={(e) => setAudioPublishDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100 focus:ring-1 focus:ring-[#E27A2B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                        4. Duration (Auto-fetched)
                      </label>
                      {audioDurationSeconds > 0 && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium font-mono">
                          Auto: {formatSeconds(audioDurationSeconds)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={audioDurationSeconds ? formatSeconds(audioDurationSeconds) : ''}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw.includes(':')) {
                            const [m, s] = raw.split(':').map((p) => parseInt(p, 10) || 0);
                            setAudioDurationSeconds(m * 60 + s);
                          } else {
                            setAudioDurationSeconds(parseInt(raw, 10) || 0);
                          }
                        }}
                        placeholder="Auto-detected on audio attach (e.g. 14:35)"
                        className="flex-1 px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100 focus:ring-1 focus:ring-[#E27A2B]"
                      />
                      <span className="self-center px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                        {audioDurationSeconds ? `${audioDurationSeconds}s` : 'auto'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Field 5: Author Name */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                      5. Author Name (Narrator / Host)
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddingAuthorModalOpen(true)}
                      className="text-xs text-[#E27A2B] hover:underline font-bold cursor-pointer flex items-center gap-1"
                    >
                      + Add New Author
                    </button>
                  </div>
                  <select
                    value={author}
                    onChange={(e) => {
                      if (e.target.value === '__ADD_NEW__') {
                        setIsAddingAuthorModalOpen(true);
                      } else {
                        setAuthor(e.target.value);
                        setAudioSpeaker(e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100 focus:ring-1 focus:ring-[#E27A2B]"
                  >
                    <optgroup label="Registered Authors">
                      {localAuthors.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Actions">
                      <option value="__ADD_NEW__">+ Add New Author...</option>
                    </optgroup>
                  </select>
                </div>

                {/* Field 6: About it in one sentence */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                    6. About it in one sentence
                  </label>
                  <input
                    type="text"
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="About this podcast episode / audio story in one sentence..."
                    className="w-full px-3.5 py-2.5 text-xs italic bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100 focus:ring-1 focus:ring-[#E27A2B]"
                  />
                </div>
              </div>
            </div>

            {/* Field 7: Audio Track Upload & In-Studio Player */}
            <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  7. Audio Track
                </label>
                {audioUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setAudioUrl('');
                      setAudioDurationSeconds(0);
                      setAudioFileName('');
                      setIsPlayingAudio(false);
                    }}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Audio
                  </button>
                )}
              </div>

              {/* Audio Source Method Tabs */}
              <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 text-xs">
                <button
                  type="button"
                  onClick={() => setAudioSourceTab('upload')}
                  className={`pb-2 px-3 font-bold transition-all border-b-2 cursor-pointer ${
                    audioSourceTab === 'upload'
                      ? 'border-[#E27A2B] text-[#E27A2B]'
                      : 'border-transparent text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Upload Audio File (.mp3, .m4a)
                </button>
                <button
                  type="button"
                  onClick={() => setAudioSourceTab('url')}
                  className={`pb-2 px-3 font-bold transition-all border-b-2 cursor-pointer ${
                    audioSourceTab === 'url'
                      ? 'border-[#E27A2B] text-[#E27A2B]'
                      : 'border-transparent text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Stream URL / Google Drive Auto-Converter
                </button>
              </div>

              {/* Tab 1: Upload */}
              {audioSourceTab === 'upload' && (
                <div className="space-y-3">
                  <input
                    type="file"
                    ref={audioInputRef}
                    onChange={handleAudioFileSelect}
                    accept="audio/*"
                    className="hidden"
                  />
                  <div
                    onClick={() => audioInputRef.current?.click()}
                    className="border-2 border-dashed border-amber-300 dark:border-neutral-700 hover:border-[#E27A2B] bg-white/70 dark:bg-neutral-900/60 p-6 rounded text-center cursor-pointer transition-colors space-y-2"
                  >
                    <div className="w-12 h-12 bg-amber-100 dark:bg-neutral-800 text-[#E27A2B] rounded-full mx-auto flex items-center justify-center">
                      {isUploadingAudio ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <UploadCloud className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        {isUploadingAudio ? 'Uploading audio file to Supabase...' : 'Click to select or drag & drop audio track'}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Supported: MP3, M4A, WAV, AAC (Auto-detects duration and attaches streaming player)
                      </p>
                    </div>
                    {audioFileName && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-neutral-800 text-amber-900 dark:text-amber-200 text-xs font-mono font-bold rounded-full">
                        <FileAudio className="w-3.5 h-3.5 text-[#E27A2B]" />
                        <span>{audioFileName}</span>
                        {audioFileSize && <span>({audioFileSize})</span>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: URL */}
              {audioSourceTab === 'url' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={audioUrl}
                    onChange={(e) => handleAudioUrlChange(e.target.value)}
                    placeholder="https://drive.google.com/file/d/... or https://domain.com/episode.mp3"
                    className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded focus:ring-1 focus:ring-[#E27A2B]"
                  />
                  {googleDriveDetected && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                      <Check className="w-3.5 h-3.5" />
                      <span>Google Drive link detected and converted to instant direct streaming format!</span>
                    </p>
                  )}
                </div>
              )}

              {/* Player Preview */}
              {audioUrl ? (
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-300 dark:border-neutral-700 rounded space-y-3 shadow-xs">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">
                        Live In-Studio Player Preview
                      </span>
                    </div>
                    <span className="font-mono text-xs text-[#E27A2B] font-bold">
                      {formatSeconds(audioCurrentTime)} / {formatSeconds(audioDurationSeconds || (studioAudioRef.current?.duration || 0))}
                    </span>
                  </div>

                  <audio
                    ref={studioAudioRef}
                    src={audioUrl}
                    onTimeUpdate={handleStudioAudioTimeUpdate}
                    onEnded={() => setIsPlayingAudio(false)}
                    preload="metadata"
                  />

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleStudioAudioPlayback}
                      className="w-10 h-10 rounded-full bg-[#0C2340] dark:bg-[#E27A2B] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer shrink-0"
                      title={isPlayingAudio ? 'Pause Audio' : 'Play Audio'}
                    >
                      {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>

                    <div className="flex-1 space-y-1">
                      <input
                        type="range"
                        min={0}
                        max={audioDurationSeconds || (studioAudioRef.current?.duration || 100)}
                        value={audioCurrentTime}
                        onChange={handleStudioAudioSeek}
                        className="w-full accent-[#E27A2B] cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded"
                      />
                      <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                        <span>{author || 'Akhil U Krishnan'}</span>
                        <span>{audioUrl.includes('drive.google.com') ? 'Google Drive Stream' : 'Supabase Audio Media'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        /* Standard Article 3-col Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Title, Excerpt, Exact Blogger Editor */}
          <div className="lg:col-span-2 space-y-5">
            {/* Article Title */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Article Title..."
                className="w-full px-4 py-3 text-xl sm:text-3xl font-serif font-bold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-1 focus:ring-[#E27A2B] rounded shadow-2xs placeholder:text-neutral-400"
              />
            </div>

            {/* Standfirst / Excerpt */}
            <div>
              <textarea
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Standfirst / Excerpt summary (Shown on homepage, search cards, and article header)..."
                className="w-full px-4 py-2 text-sm sm:text-base font-serif bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#E27A2B] rounded shadow-2xs italic placeholder:text-neutral-400"
              />
            </div>

            {/* Rich Text Editor */}
            <div>
              <RichTextEditor
                key={editorKey}
                content={contentHtml}
                onChange={(html) => setContentHtml(html)}
                placeholder="Compose your story here..."
              />
            </div>
          </div>

        {/* Right Sidebar: 1. Cover Photo, 2. Categories & Tags, 3. Byline & Packets, 4. Special Series & Flags */}
        <div className="space-y-6">
          {/* 1. Cover Photo & Art Card (Placed at the very top as requested) */}
          <div className="p-5 sm:p-6 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded shadow-xs space-y-4 text-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#E27A2B]" />
                <span>Cover Photo &amp; Art</span>
              </span>
              <span className="text-xs text-neutral-400 font-mono">16:9 WebP</span>
            </h3>

            <div className="space-y-3">
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Upload a high-resolution cover image. It is automatically compressed to lightweight WebP.
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="file"
                  ref={coverInputRef}
                  onChange={handleCoverSelect}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={isUploadingCover}
                  className="px-4 py-2 bg-[#0C2340] text-white dark:bg-[#E27A2B] hover:bg-[#123157] text-xs font-bold rounded transition-colors cursor-pointer flex items-center justify-center gap-2 shrink-0"
                >
                  {isUploadingCover ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4 text-[#E27A2B] dark:text-white" /> Upload Photo
                    </>
                  )}
                </button>
                <input
                  type="text"
                  placeholder="Or paste external image URL..."
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded text-xs focus:ring-1 focus:ring-[#E27A2B]"
                />
              </div>

              {coverImage && (
                <div className="relative mt-2 rounded overflow-hidden border border-neutral-300 dark:border-neutral-700 aspect-video shadow-xs group">
                  <img
                    src={coverImage}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setCoverImage('')}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove Photo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Categories & Multi-Tag Taxonomy Card (High Visibility & Legibility) */}
          <div className="p-5 sm:p-6 bg-white dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg shadow-xs space-y-5">
            <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#E27A2B]" />
                <span>Categories &amp; Tags</span>
              </span>
              <span className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 font-mono font-bold bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                {selectedTags.length} active
              </span>
            </h3>

            {/* Primary Category Selector */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 block">
                Primary Category
              </label>
              <select
                value={category}
                onChange={(e) => {
                  const val = e.target.value;
                  setCategory(val);
                  if (val && !selectedTags.includes(val)) {
                    setSelectedTags([val, ...selectedTags]);
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 rounded-md text-sm sm:text-base font-bold focus:ring-1 focus:ring-[#E27A2B] focus:border-[#E27A2B]"
              >
                <option value="">-- Select Category --</option>
                {STANDARD_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Selected Tags Display */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 block">
                Selected Story Tags
              </label>
              <div className="flex flex-wrap gap-2 min-h-[42px] p-2.5 bg-neutral-50 dark:bg-neutral-800/80 border-2 border-neutral-200 dark:border-neutral-700 rounded-md">
                {selectedTags.length === 0 ? (
                  <span className="text-neutral-500 italic text-xs sm:text-sm py-1">No tags selected yet. Click pills below or add custom.</span>
                ) : (
                  selectedTags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0C2340] text-white dark:bg-[#E27A2B] text-xs sm:text-sm font-bold rounded shadow-xs"
                    >
                      <span>{t}</span>
                      <button
                        type="button"
                        onClick={() => toggleTag(t)}
                        className="hover:text-red-300 cursor-pointer p-0.5"
                        title={`Remove "${t}"`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Quick Toggle Standard Presets */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 block">
                Quick Category Presets (Click to toggle):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {STANDARD_CATEGORIES.map((cat) => {
                  const isSelected = selectedTags.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleTag(cat)}
                      className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-md transition-all cursor-pointer border-2 ${
                        isSelected
                          ? 'bg-[#E27A2B] text-white border-[#E27A2B] shadow-xs'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-600 hover:border-[#E27A2B]'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add Custom Tag Form */}
            <form onSubmit={handleAddCustomTag} className="space-y-1.5 pt-1">
              <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 block">
                Add Custom Tag
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  placeholder="e.g. Kerala Elections, Memoir..."
                  className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 rounded-md text-xs sm:text-sm font-medium focus:ring-1 focus:ring-[#E27A2B]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0C2340] text-white hover:bg-[#123157] font-bold rounded-md text-xs sm:text-sm cursor-pointer transition-colors"
                >
                  + Add
                </button>
              </div>
            </form>
          </div>

          {/* 3. Byline, Webzine Issue Packet & URL Slug Card */}
          <div className="p-5 sm:p-6 bg-white dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg shadow-xs space-y-5">
            <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-2.5 flex items-center gap-2">
              <User className="w-4 h-4 text-[#E27A2B]" />
              <span>Byline, Issue Packet &amp; Slug</span>
            </h3>

            {/* Primary Author / Columnist */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                  Primary Author / Columnist
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingAuthorModalOpen(true)}
                  className="text-xs sm:text-sm text-[#E27A2B] hover:underline font-bold cursor-pointer flex items-center gap-1"
                >
                  + Add New Author
                </button>
              </div>
              <select
                value={author}
                onChange={(e) => {
                  if (e.target.value === '__ADD_NEW__') {
                    setIsAddingAuthorModalOpen(true);
                  } else {
                    setAuthor(e.target.value);
                    setAudioSpeaker(e.target.value);
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 rounded-md text-sm sm:text-base font-bold focus:ring-1 focus:ring-[#E27A2B]"
              >
                <option value="">-- Select Author / Columnist --</option>
                <optgroup label="Registered Authors">
                  {localAuthors.map((auth) => (
                    <option key={auth} value={auth}>
                      {auth}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Actions">
                  <option value="__ADD_NEW__">+ Add New Author...</option>
                </optgroup>
              </select>
            </div>

            {/* Webzine Issue Packet Selector */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#E27A2B]" />
                  <span>Webzine Issue Packet</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingPacket(!isAddingPacket)}
                  className="text-xs sm:text-sm text-[#E27A2B] hover:underline font-bold cursor-pointer"
                >
                  {isAddingPacket ? 'Cancel' : '+ New Packet'}
                </button>
              </div>

              {isAddingPacket ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Packet 4 or Monsoon 2026..."
                    value={newPacketName}
                    onChange={(e) => setNewPacketName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 rounded-md text-xs sm:text-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = newPacketName.trim();
                      if (trimmed) {
                        const formatted = trimmed.toLowerCase().startsWith('packet')
                          ? trimmed
                          : `Packet ${trimmed}`;
                        if (onAddPacket) onAddPacket(formatted);
                        setPacket(formatted);
                        setNewPacketName('');
                        setIsAddingPacket(false);
                      }
                    }}
                    className="px-4 py-2 bg-[#0C2340] text-white dark:bg-[#E27A2B] rounded-md font-bold text-xs sm:text-sm cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <select
                  value={packet}
                  onChange={(e) => setPacket(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 rounded-md text-sm sm:text-base font-semibold focus:ring-1 focus:ring-[#E27A2B]"
                >
                  <option value="">-- None (General Feed) --</option>
                  {packets.map((pkt) => (
                    <option key={pkt} value={pkt}>
                      {pkt}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                Articles assigned to a packet are bundled in the Webzine reader edition at <span className="font-mono text-[#E27A2B] font-bold">/magazine</span>.
              </p>
            </div>

            {/* URL Slug */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 block">
                URL Slug (Web address)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugCustomized(true);
                }}
                placeholder="article-url-slug"
                className="w-full px-3.5 py-2 font-mono text-xs sm:text-sm bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 rounded-md focus:ring-1 focus:ring-[#E27A2B]"
              />
            </div>
          </div>

          {/* 4. Special Series & Editorial Flags Card */}
          <div className="p-5 sm:p-6 bg-white dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg shadow-xs space-y-5">
            <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#E27A2B]" />
                <span>Special Series &amp; Placement</span>
              </span>
            </h3>

            {/* Dedicated Multi-Part Series Builder */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-md border-2 border-neutral-200 dark:border-neutral-700 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 block">
                  📚 Multi-Part Special Series
                </label>
                <span className="text-xs font-mono text-[#E27A2B] font-bold">Series Hub</span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                Articles with a Series Title are cataloged under <span className="font-mono text-[#E27A2B] font-bold">/series</span> in sequential episode order.
              </p>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Series Title (e.g. Paleri Memoirs)..."
                  value={seriesTitle}
                  onChange={(e) => setSeriesTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 rounded-md text-xs sm:text-sm font-medium focus:ring-1 focus:ring-[#E27A2B]"
                />

                {seriesTitle && (
                  <div className="flex items-center gap-2.5 pt-1">
                    <span className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200">
                      Episode / Part:
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={seriesEpisode}
                      onChange={(e) => setSeriesEpisode(e.target.value)}
                      className="w-24 px-3 py-1.5 bg-white dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 rounded-md text-xs sm:text-sm font-mono font-bold"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Editorial Placement Flags */}
            <div className="space-y-2 pt-1">
              <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 block">
                Editorial Display Flags
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer p-2.5 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-md transition-colors">
                  <input
                    type="checkbox"
                    checked={isLeadStory}
                    onChange={(e) => setIsLeadStory(e.target.checked)}
                    className="accent-[#E27A2B] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100">Lead Story</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer p-2.5 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-md transition-colors">
                  <input
                    type="checkbox"
                    checked={isCover}
                    onChange={(e) => setIsCover(e.target.checked)}
                    className="accent-[#E27A2B] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100">Issue Cover</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer p-2.5 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-md transition-colors">
                  <input
                    type="checkbox"
                    checked={isPremium}
                    onChange={(e) => setIsPremium(e.target.checked)}
                    className="accent-[#E27A2B] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100">Premium Story</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer p-2.5 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-md transition-colors">
                  <input
                    type="checkbox"
                    checked={isLongform}
                    onChange={(e) => setIsLongform(e.target.checked)}
                    className="accent-[#E27A2B] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100">Longform Essay</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Live Reader Preview Modal (Solid Paper Background) */}
      <ArticlePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={title}
        excerpt={excerpt}
        contentHtml={contentHtml}
        category={isPodcastMode ? 'Podcast' : category}
        tags={selectedTags}
        author={audioSpeaker || author}
        coverImage={coverImage}
        audioUrl={audioUrl}
        packet={packet}
      />

      {/* Saved Articles & Drafts Library Modal (Solid Light Theme, Large & Bold Legibility) */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-4xl max-h-[88vh] bg-white border-2 border-neutral-300 shadow-2xl rounded-2xl p-6 sm:p-8 flex flex-col space-y-6 text-neutral-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-2 border-neutral-200 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#0C2340] text-[#E27A2B] flex items-center justify-center border-2 border-[#E27A2B]/40 shadow-xs shrink-0">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight">
                    Drafts &amp; Published Stories Library
                  </h3>
                  <p className="text-sm sm:text-base font-bold text-neutral-700 font-sans mt-0.5">
                    Switch between your drafts and published stories. Click &ldquo;Load to Editor&rdquo; to resume writing.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLibraryOpen(false)}
                className="p-2.5 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 cursor-pointer rounded-xl transition-colors"
                aria-label="Close Library"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Filter Tabs & Search Bar (Drafts, Scheduled, Published - Solid Light Theme) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 p-1.5 bg-neutral-100 rounded-xl border-2 border-neutral-200 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={() => setLibraryFilter('draft')}
                  className={`px-4 sm:px-5 py-2.5 font-extrabold text-sm sm:text-base rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                    libraryFilter === 'draft'
                      ? 'bg-[#0C2340] text-[#E27A2B] border-2 border-[#E27A2B]/50 shadow-sm'
                      : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-200/60'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                  <span>Drafts</span>
                  <span className="px-2 py-0.5 text-xs sm:text-sm font-mono rounded-full bg-amber-500/20 text-amber-800 font-bold">
                    {savedArticles.filter((a) => a.status === 'draft').length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setLibraryFilter('scheduled')}
                  className={`px-4 sm:px-5 py-2.5 font-extrabold text-sm sm:text-base rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                    libraryFilter === 'scheduled'
                      ? 'bg-[#0C2340] text-[#E27A2B] border-2 border-[#E27A2B]/50 shadow-sm'
                      : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-200/60'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
                  <span>Scheduled</span>
                  <span className="px-2 py-0.5 text-xs sm:text-sm font-mono rounded-full bg-blue-500/20 text-blue-800 font-bold">
                    {savedArticles.filter(isArticleScheduled).length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setLibraryFilter('published')}
                  className={`px-4 sm:px-5 py-2.5 font-extrabold text-sm sm:text-base rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                    libraryFilter === 'published'
                      ? 'bg-[#0C2340] text-[#E27A2B] border-2 border-[#E27A2B]/50 shadow-sm'
                      : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-200/60'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span>Published</span>
                  <span className="px-2 py-0.5 text-xs sm:text-sm font-mono rounded-full bg-emerald-500/20 text-emerald-800 font-bold">
                    {savedArticles.filter(isArticlePublished).length}
                  </span>
                </button>
              </div>

              <div className="relative">
                <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder={
                    libraryFilter === 'draft'
                      ? 'Search drafts...'
                      : libraryFilter === 'scheduled'
                      ? 'Search scheduled...'
                      : 'Search published...'
                  }
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  className="pl-11 pr-4 py-2.5 text-sm sm:text-base bg-white border-2 border-neutral-300 rounded-xl w-full sm:w-72 focus:border-[#E27A2B] focus:outline-none text-neutral-950 placeholder-neutral-500 font-semibold shadow-2xs transition-all"
                />
              </div>
            </div>

            {/* Stories List (Solid Light Theme, Large Text, Clear Dates & Thickness) */}
            <div className="flex-1 overflow-y-auto space-y-3.5 min-h-[320px] pr-1">
              {loadingLibrary ? (
                <div className="py-20 text-center text-base text-neutral-600 font-bold flex items-center justify-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-[#E27A2B]" />
                  <span>Loading library stories...</span>
                </div>
              ) : filteredLibrary.length === 0 ? (
                <div className="py-20 text-center text-neutral-600 space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400">
                    <FolderOpen className="w-7 h-7" />
                  </div>
                  <p className="font-black text-lg text-neutral-900">
                    {libraryFilter === 'draft'
                      ? 'No saved drafts found.'
                      : libraryFilter === 'scheduled'
                      ? 'No scheduled stories found.'
                      : 'No published stories found.'}
                  </p>
                  <p className="text-sm font-medium text-neutral-600 max-w-md mx-auto leading-relaxed">
                    {libraryFilter === 'draft'
                      ? 'Click the Save Draft icon in the top toolbar to store your work in progress. It will appear here with the exact saved date.'
                      : libraryFilter === 'scheduled'
                      ? 'Click the Calendar icon in the top toolbar to schedule a future release date & time. It will appear here with a live countdown.'
                      : 'Articles and podcast episodes you publish will appear here with live publication dates.'}
                  </p>
                </div>
              ) : (
                filteredLibrary.map((rec) => {
                  const isScheduled = isArticleScheduled(rec);
                  const isPublished = isArticlePublished(rec);
                  const dateToDisplay =
                    rec.status === 'draft'
                      ? rec.updated_at || rec.published_at || rec.created_at
                      : rec.published_at || rec.updated_at || rec.created_at;

                  return (
                    <div
                      key={rec.slug}
                      className="p-5 sm:p-6 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border-2 border-neutral-200 shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="min-w-0 space-y-2 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span
                            className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-md border-2 flex items-center gap-1.5 ${
                              isScheduled
                                ? 'bg-blue-100 text-blue-950 border-blue-400'
                                : isPublished
                                ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                                : 'bg-amber-100 text-amber-950 border-amber-300'
                            }`}
                          >
                            {isScheduled ? (
                              <>
                                <Clock className="w-3.5 h-3.5 text-blue-600" />
                                <span>Scheduled</span>
                              </>
                            ) : isPublished ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Published</span>
                              </>
                            ) : (
                              <>
                                <Save className="w-3.5 h-3.5 text-amber-600" />
                                <span>Draft</span>
                              </>
                            )}
                          </span>
                          <h4 className="font-serif font-black text-base sm:text-lg text-neutral-950 truncate leading-snug">
                            {rec.title}
                          </h4>
                          {rec.audio_narration_url && (
                            <span className="text-xs font-extrabold text-[#E27A2B] bg-amber-50 px-2 py-0.5 rounded-md border border-[#E27A2B]/40 flex items-center gap-1">
                              <Volume2 className="w-3.5 h-3.5" /> Audio Track
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-neutral-700 flex items-center gap-3.5 flex-wrap font-sans font-bold">
                          {isScheduled ? (
                            <div className="flex items-center gap-2 text-blue-950 font-extrabold flex-wrap">
                              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                              <span>
                                Scheduled: {formatScheduledDisplay(rec.published_at)}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs font-bold border border-blue-300">
                                {getRelativeCountdown(rec.published_at)}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-neutral-950 font-extrabold">
                              <Calendar className="w-4 h-4 text-[#E27A2B] shrink-0" />
                              <span>
                                {rec.status === 'draft' ? 'Drafted:' : 'Published:'}{' '}
                                {formatLibraryDate(dateToDisplay)}
                              </span>
                            </div>
                          )}
                          <span>•</span>
                          <div className="flex items-center gap-1.5 font-bold text-neutral-800">
                            <User className="w-4 h-4 text-neutral-500" />
                            <span>{rec.author_names || 'Akhil U Krishnan'}</span>
                          </div>
                          {rec.category && (
                            <>
                              <span>•</span>
                              <span className="px-2.5 py-0.5 rounded-md bg-neutral-200 text-xs uppercase font-black text-neutral-800 tracking-wide">
                                {rec.category}
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span className="font-mono text-xs font-semibold text-neutral-500">/{rec.slug}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleLoadArticleIntoStudio(rec)}
                          className="px-4 py-2 bg-[#0C2340] hover:bg-[#123157] text-[#E27A2B] text-xs sm:text-sm font-extrabold uppercase tracking-wider rounded-xl border border-[#E27A2B]/40 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                          title="Load this story into the editor"
                        >
                          <FolderOpen className="w-4 h-4" />
                          <span>Load</span>
                        </button>
                        {isScheduled && (
                          <button
                            type="button"
                            onClick={() => handlePublishNow(rec.slug)}
                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-extrabold uppercase tracking-wider rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                            title="Promote and publish this story live immediately"
                          >
                            <Send className="w-4 h-4" />
                            <span>Publish Now</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteArticle(rec.slug, rec.title)}
                          className="p-2.5 text-neutral-400 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-red-300"
                          title="Delete permanently (prompts twice for confirmation)"
                          aria-label={`Delete ${rec.title}`}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-4 border-t-2 border-neutral-200">
              <button
                type="button"
                onClick={() => setIsLibraryOpen(false)}
                className="px-7 py-3 bg-neutral-200 hover:bg-neutral-300 text-sm font-extrabold uppercase tracking-wider text-neutral-950 rounded-xl cursor-pointer transition-colors"
              >
                Close Library
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SCHEDULE PUBLISH MODAL DIALOG (Solid Light Theme, Large & Bold Legibility)
          ======================================================== */}
      {isScheduleModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-2xl bg-white border-2 border-neutral-300 shadow-2xl rounded-2xl p-6 sm:p-9 space-y-6 max-h-[92vh] overflow-y-auto text-neutral-900">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-neutral-200">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-[#0C2340] text-[#E27A2B] rounded-2xl flex items-center justify-center border-2 border-[#E27A2B]/50 shadow-xs shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-black text-neutral-950">
                    Schedule Publish
                  </h3>
                  <p className="text-sm sm:text-base font-bold text-neutral-700 font-sans mt-0.5">
                    Set an exact future date &amp; time for this story to automatically go live.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-2.5 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Target Article Summary */}
            <div className="p-4 bg-neutral-50 rounded-xl border-2 border-neutral-200 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Story to Schedule
              </span>
              <h4 className="font-serif text-lg sm:text-xl font-black text-neutral-950 truncate">
                {title || 'Untitled Story'}
              </h4>
              <p className="text-xs font-semibold text-neutral-600 font-mono">
                Slug: /{slug || 'auto-generated'} • By: {audioSpeaker || author || 'Akhil U Krishnan'}
              </p>
            </div>

            {/* Current Local Time Reference */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs sm:text-sm font-bold text-amber-950">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Your Current Local Time:</span>
              </div>
              <span className="font-mono font-extrabold text-amber-950">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
                {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
              </span>
            </div>

            {/* Custom Date & Time Picker */}
            <div className="space-y-2">
              <label className="block text-sm font-bold uppercase tracking-wider text-neutral-900">
                Select Publish Date &amp; Time
              </label>
              <input
                type="datetime-local"
                value={scheduledDateTime}
                onChange={(e) => setScheduledDateTime(e.target.value)}
                min={dateToDateTimeLocalString(new Date())}
                className="w-full px-4 py-3.5 text-base sm:text-lg font-bold font-mono bg-neutral-50 border-2 border-neutral-300 rounded-xl text-neutral-950 focus:border-[#E27A2B] focus:bg-white focus:outline-none transition-all cursor-pointer shadow-2xs"
              />
            </div>

            {/* Live Scheduled Confirmation Box */}
            {scheduledDateTime && (
              <div className="p-4 sm:p-5 bg-blue-50 border-2 border-blue-300 rounded-xl space-y-2 text-blue-950">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                    <span className="font-black text-sm sm:text-base">
                      {formatScheduledDisplay(scheduledDateTime)}
                    </span>
                  </div>
                  <span className="px-3 py-1 bg-blue-600 text-white font-extrabold text-xs uppercase rounded-full shadow-xs">
                    {getRelativeCountdown(new Date(scheduledDateTime).toISOString())}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-blue-900 leading-relaxed">
                  Readers will not see this story until this exact date and time. When the scheduled moment arrives, the website automatically displays it across all feeds with zero manual action needed.
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-neutral-200">
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-5 py-2.5 text-sm font-bold text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSchedule}
                disabled={isScheduling || !scheduledDateTime}
                className="px-7 py-3 bg-[#0C2340] text-[#E27A2B] hover:bg-[#123157] text-sm sm:text-base font-extrabold uppercase tracking-wider border-2 border-[#E27A2B]/40 transition-colors cursor-pointer rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-2"
              >
                {isScheduling ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="w-5 h-5" /> Schedule Story
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          QUICK ADD AUTHOR MODAL (Solid Light Theme, Large & Bold Legibility)
          ======================================================== */}
      {isAddingAuthorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in select-none">
          <form
            onSubmit={handleAddNewAuthorConfirm}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-neutral-300 p-6 sm:p-8 space-y-5 animate-in zoom-in-95 text-neutral-900"
          >
            <div className="flex items-center justify-between border-b-2 border-neutral-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0C2340] text-[#E27A2B] rounded-xl flex items-center justify-center border-2 border-[#E27A2B]/40">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-black text-xl text-neutral-950">
                  Add New Author / Host
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingAuthorModalOpen(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-950 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold uppercase tracking-wider text-neutral-900">
                Author Full Name
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Arundhati Roy, John Mathew"
                value={newAuthorNameInput}
                onChange={(e) => setNewAuthorNameInput(e.target.value)}
                className="w-full px-4 py-3 text-base font-semibold bg-neutral-50 border-2 border-neutral-300 rounded-xl text-neutral-950 placeholder-neutral-500 focus:border-[#E27A2B] focus:bg-white focus:outline-none transition-all"
              />
              <p className="text-xs sm:text-sm font-medium text-neutral-700 leading-relaxed">
                This author will be added to your persistent roster and selected immediately for this piece.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t-2 border-neutral-200">
              <button
                type="button"
                onClick={() => setIsAddingAuthorModalOpen(false)}
                className="px-5 py-2.5 text-sm text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 rounded-xl font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#E27A2B] hover:bg-[#d46a1d] text-white text-sm font-extrabold uppercase rounded-xl shadow-xs cursor-pointer"
              >
                + Add &amp; Select
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
