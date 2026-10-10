'use client';

import type { Article, Podcast, IssuePacket, Series } from '@/lib/content';
import {
  fetchSupabaseArticles,
  fetchSupabaseArticleBySlug,
  getSupabase,
} from './supabase';
import {
  mapSupabaseRecordToArticle,
  mapSupabaseRecordToPodcast,
  isAudioArticle,
  filterCategoryArticles,
  buildIssuesFromArticles,
  buildSeriesFromArticles,
} from './articleHelpers';

export {
  mapSupabaseRecordToArticle,
  mapSupabaseRecordToPodcast,
  isAudioArticle,
  filterCategoryArticles,
  buildIssuesFromArticles,
  buildSeriesFromArticles,
};

let memoryArticlesCache: Article[] | null = null;
let memoryPodcastsCache: Podcast[] | null = null;
let memoryIssuesCache: IssuePacket[] | null = null;
let memorySeriesCache: Series[] | null = null;
let lastFetchTime: number = 0;
const CACHE_TTL_MS = 60000; // 60 seconds fresh cache

export function getCachedLiveArticles(): Article[] | null {
  if (memoryArticlesCache) return memoryArticlesCache;
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem('omt_live_articles_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          memoryArticlesCache = parsed;
          return memoryArticlesCache;
        }
      }
    } catch {}
  }
  return null;
}

export function getCachedLivePodcasts(): Podcast[] | null {
  if (memoryPodcastsCache) return memoryPodcastsCache;
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem('omt_live_podcasts_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          memoryPodcastsCache = parsed;
          return memoryPodcastsCache;
        }
      }
    } catch {}
  }
  return null;
}

export async function fetchLiveArticlesFromSupabase(
  includeScheduled: boolean = false,
  forceRefresh: boolean = false
): Promise<Article[]> {
  const now = Date.now();
  if (!forceRefresh && memoryArticlesCache && now - lastFetchTime < CACHE_TTL_MS) {
    return includeScheduled
      ? memoryArticlesCache
      : memoryArticlesCache.filter((a) => !a.isScheduled);
  }

  try {
    const raw = await fetchSupabaseArticles();
    const articles = (raw || [])
      .map(mapSupabaseRecordToArticle)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    memoryArticlesCache = articles;
    lastFetchTime = now;
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('omt_live_articles_v2', JSON.stringify(articles));
      } catch {}
    }

    return includeScheduled ? articles : articles.filter((a) => !a.isScheduled);
  } catch (err) {
    console.warn('Error fetching live articles from Supabase:', err);
    return memoryArticlesCache
      ? includeScheduled
        ? memoryArticlesCache
        : memoryArticlesCache.filter((a) => !a.isScheduled)
      : [];
  }
}

export async function fetchLiveArticleBySlug(
  slug: string,
  includeScheduled: boolean = false
): Promise<Article | null> {
  if (!slug) return null;

  // Check memory cache first
  if (memoryArticlesCache) {
    const found = memoryArticlesCache.find((a) => a.slug === slug);
    if (found && (includeScheduled || (!found.isScheduled && (found as any).status !== 'draft'))) {
      return found;
    }
  }

  try {
    const raw = await fetchSupabaseArticleBySlug(slug);
    if (!raw) return null;
    if (!includeScheduled && raw.status === 'draft') {
      return null;
    }
    const article = mapSupabaseRecordToArticle(raw);
    if (!includeScheduled && article.isScheduled) {
      return null;
    }
    return article;
  } catch (err) {
    console.warn(`Error fetching live article by slug "${slug}":`, err);
    return null;
  }
}

export async function fetchLivePodcastsFromSupabase(forceRefresh: boolean = false): Promise<Podcast[]> {
  const now = Date.now();
  if (!forceRefresh && memoryPodcastsCache && now - lastFetchTime < CACHE_TTL_MS) {
    return memoryPodcastsCache;
  }

  try {
    const raw = await fetchSupabaseArticles();
    const podcasts = (raw || [])
      .filter((art) => isAudioArticle(art))
      .map(mapSupabaseRecordToPodcast)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    memoryPodcastsCache = podcasts;
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('omt_live_podcasts_v2', JSON.stringify(podcasts));
      } catch {}
    }

    return podcasts;
  } catch (err) {
    console.warn('Error fetching live podcasts from Supabase:', err);
    return memoryPodcastsCache || [];
  }
}

export async function fetchLiveIssuesFromSupabase(): Promise<IssuePacket[]> {
  const articles = await fetchLiveArticlesFromSupabase();
  return buildIssuesFromArticles(articles);
}

export async function fetchLiveSeriesFromSupabase(): Promise<Series[]> {
  const articles = await fetchLiveArticlesFromSupabase();
  return buildSeriesFromArticles(articles);
}

const CONTENT_UPDATE_EVENT = 'omt:content-updated';
const CACHE_STORAGE_KEY = 'omt_content_last_updated';

export function notifyContentUpdated(): void {
  if (typeof window === 'undefined') return;
  memoryArticlesCache = null;
  memoryPodcastsCache = null;
  memoryIssuesCache = null;
  memorySeriesCache = null;
  lastFetchTime = 0;
  try {
    sessionStorage.removeItem('omt_live_articles_v2');
    sessionStorage.removeItem('omt_live_podcasts_v2');
    const timestamp = Date.now().toString();
    localStorage.setItem(CACHE_STORAGE_KEY, timestamp);
    window.dispatchEvent(new CustomEvent(CONTENT_UPDATE_EVENT, { detail: { timestamp } }));
  } catch {}
}

export function subscribeToContentUpdates(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const invalidateAndCall = () => {
    memoryArticlesCache = null;
    memoryPodcastsCache = null;
    memoryIssuesCache = null;
    memorySeriesCache = null;
    lastFetchTime = 0;
    try {
      sessionStorage.removeItem('omt_live_articles_v2');
      sessionStorage.removeItem('omt_live_podcasts_v2');
    } catch {}
    callback();
  };

  const handleCustomEvent = () => invalidateAndCall();
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === CACHE_STORAGE_KEY) {
      invalidateAndCall();
    }
  };

  window.addEventListener(CONTENT_UPDATE_EVENT, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  // Auto-release heartbeat: checks periodically (every 30s) so scheduled articles go live automatically
  const heartbeatTimer = setInterval(() => {
    invalidateAndCall();
  }, 30000);

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
            invalidateAndCall();
          }
        )
        .subscribe();
    }
  } catch {}

  return () => {
    clearInterval(heartbeatTimer);
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
