'use client';

import type { Article, Podcast } from '@/lib/content';
import {
  fetchSupabaseArticles,
  fetchSupabaseArticleBySlug,
  getSupabase,
  SupabaseArticleRecord,
} from './supabase';

export function mapSupabaseRecordToArticle(rec: SupabaseArticleRecord): Article {
  const plainText = (rec.content_html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = plainText ? plainText.split(' ').length : 0;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const isScheduled =
    rec.status === 'scheduled' ||
    Boolean(rec.published_at && new Date(rec.published_at).getTime() > Date.now());

  return {
    slug: rec.slug,
    title: rec.title,
    excerpt: rec.excerpt || '',
    category: rec.category || 'politics',
    authors: rec.authors?.length ? rec.authors : ['akhil-u-krishnan'],
    authorNames: rec.author_names || 'Akhil U Krishnan',
    publishedAt: rec.published_at || new Date().toISOString(),
    coverImage: rec.cover_image || '',
    audioNarrationUrl: rec.audio_narration_url,
    audioDurationSeconds: rec.audio_duration_seconds,
    webzineIssue: rec.webzine_issue,
    isLeadStory: Boolean(rec.is_lead_story),
    isCover: Boolean(rec.is_cover),
    isPremium: Boolean(rec.is_premium),
    isLongform: Boolean(rec.is_longform),
    tags: rec.tags?.length ? rec.tags : (rec.category ? [rec.category] : []),
    readTimeMinutes,
    isScheduled,
    content: rec.content_html || '',
    contentHtml: rec.content_html || '',
  };
}

export function mapSupabaseRecordToPodcast(rec: SupabaseArticleRecord): Podcast {
  return {
    id: rec.slug,
    title: rec.title,
    slug: rec.slug,
    excerpt: rec.excerpt || '',
    publishedAt: rec.published_at || new Date().toISOString(),
    audioUrl: rec.audio_narration_url || '',
    durationSeconds: rec.audio_duration_seconds || 300,
    speaker: rec.author_names || (rec.authors?.[0] ? rec.authors[0] : 'Editorial Desk'),
    coverImage: rec.cover_image || '',
  };
}

export async function fetchLiveArticlesFromSupabase(includeScheduled: boolean = false): Promise<Article[]> {
  try {
    const raw = await fetchSupabaseArticles();
    if (!raw || raw.length === 0) return [];
    return raw
      .map(mapSupabaseRecordToArticle)
      .filter((a) => (includeScheduled ? true : !a.isScheduled))
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  } catch (err) {
    console.warn('Error fetching live articles from Supabase:', err);
    return [];
  }
}

export async function fetchLiveArticleBySlug(slug: string): Promise<Article | null> {
  if (!slug) return null;
  try {
    const raw = await fetchSupabaseArticleBySlug(slug);
    if (!raw) return null;
    return mapSupabaseRecordToArticle(raw);
  } catch (err) {
    console.warn(`Error fetching live article by slug "${slug}":`, err);
    return null;
  }
}

export async function fetchLivePodcastsFromSupabase(): Promise<Podcast[]> {
  try {
    const raw = await fetchSupabaseArticles();
    if (!raw || raw.length === 0) return [];
    return raw
      .filter(
        (art) =>
          Boolean(art.audio_narration_url) ||
          art.category?.toLowerCase() === 'podcast' ||
          art.tags?.some((t) => t.toLowerCase() === 'podcast' || t.toLowerCase() === 'audio story')
      )
      .map(mapSupabaseRecordToPodcast)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  } catch (err) {
    console.warn('Error fetching live podcasts from Supabase:', err);
    return [];
  }
}

const CONTENT_UPDATE_EVENT = 'omt:content-updated';
const CACHE_STORAGE_KEY = 'omt_content_last_updated';

export function notifyContentUpdated(): void {
  if (typeof window === 'undefined') return;
  try {
    const timestamp = Date.now().toString();
    localStorage.setItem(CACHE_STORAGE_KEY, timestamp);
    window.dispatchEvent(new CustomEvent(CONTENT_UPDATE_EVENT, { detail: { timestamp } }));
  } catch {}
}

export function subscribeToContentUpdates(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = () => callback();
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === CACHE_STORAGE_KEY) {
      callback();
    }
  };

  window.addEventListener(CONTENT_UPDATE_EVENT, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  // Realtime Supabase Subscription for auto-sync across all clients
  let channel: any = null;
  try {
    const client = getSupabase();
    if (client) {
      channel = client
        .channel('public-articles-live-feed')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'articles' },
          () => {
            callback();
          }
        )
        .subscribe();
    }
  } catch {}

  return () => {
    window.removeEventListener(CONTENT_UPDATE_EVENT, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
    if (channel) {
      try {
        const client = getSupabase();
        client?.removeChannel(channel);
      } catch {}
    }
  };
}
