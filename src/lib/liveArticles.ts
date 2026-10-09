'use client';

import type { Article, Podcast, IssuePacket, Series, SeriesEpisode } from '@/lib/content';
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

  const isFutureDate = Boolean(rec.published_at && new Date(rec.published_at).getTime() > Date.now());
  const isScheduled = rec.status === 'draft' ? false : isFutureDate;

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
    webzineIssue: rec.webzine_issue || (rec.category?.toLowerCase() === 'webzine' ? 'Packet 1' : undefined),
    isLeadStory: Boolean(rec.is_lead_story),
    isCover: Boolean(rec.is_cover),
    isPremium: Boolean(rec.is_premium),
    isLongform: Boolean(rec.is_longform),
    seriesTitle: rec.series_title || undefined,
    seriesEpisode: rec.series_episode ? String(rec.series_episode) : undefined,
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

export function filterCategoryArticles(all: Article[], categorySlug: string): Article[] {
  const target = (categorySlug || '').toLowerCase().trim();

  // 1. Audio & Podcast dedicated section
  if (
    target === 'podcasts' ||
    target === 'podcast' ||
    target === 'audio-and-podcast' ||
    target === 'audio & podcast' ||
    target === 'audio-podcast'
  ) {
    return all.filter(
      (a) =>
        Boolean(a.audioNarrationUrl) ||
        a.category?.toLowerCase() === 'podcast' ||
        a.category?.toLowerCase() === 'podcasts' ||
        a.category?.toLowerCase() === 'audio-and-podcast' ||
        a.category?.toLowerCase() === 'audio & podcast' ||
        a.tags?.some((t) => {
          const tl = t.toLowerCase().trim();
          return tl === 'podcast' || tl === 'audio story' || tl === 'audio & podcast' || tl === 'audio';
        })
    );
  }

  // 2. Webzine section
  if (target === 'webzine' || target === 'magazine') {
    return all.filter((a) => {
      const artCat = a.category?.toLowerCase().trim();
      const isDedicatedPodcast =
        artCat === 'podcast' ||
        artCat === 'podcasts' ||
        artCat === 'audio-and-podcast' ||
        artCat === 'audio & podcast';
      if (isDedicatedPodcast) return false;

      return (
        artCat === 'webzine' ||
        Boolean(a.webzineIssue && a.webzineIssue.trim() && a.webzineIssue !== 'None') ||
        a.tags?.some((t) => t.toLowerCase() === 'webzine')
      );
    });
  }

  // 3. Special Series section
  if (target === 'series' || target === 'special-series' || target === 'special series') {
    return all.filter((a) => {
      const artCat = a.category?.toLowerCase().trim();
      const isDedicatedPodcast =
        artCat === 'podcast' ||
        artCat === 'podcasts' ||
        artCat === 'audio-and-podcast' ||
        artCat === 'audio & podcast';
      if (isDedicatedPodcast) return false;

      return (
        artCat === 'series' ||
        artCat === 'special series' ||
        Boolean(a.seriesTitle && a.seriesTitle.trim()) ||
        a.tags?.some((t) => t.toLowerCase() === 'series' || t.toLowerCase() === 'special series')
      );
    });
  }

  const aliasTargets =
    target === 'fallen-mangoes' || target === 'miscellaneous' || target === 'fallen mangoes'
      ? ['fallen-mangoes', 'fallen mangoes', 'miscellaneous']
      : target === 'the-shade' || target === 'the shade' || target === 'arts-culture' || target === 'arts & culture' || target === 'art & culture'
      ? ['the-shade', 'the shade', 'arts-culture', 'arts & culture', 'art & culture']
      : [target];

  return all.filter((a) => {
    const artCat = a.category?.toLowerCase().trim();

    // Dedicated Audio & Podcast items are isolated to their own section
    const isDedicatedPodcast =
      artCat === 'podcast' ||
      artCat === 'podcasts' ||
      artCat === 'audio-and-podcast' ||
      artCat === 'audio & podcast' ||
      artCat === 'audio-podcast';
    if (isDedicatedPodcast) return false;

    if (artCat && aliasTargets.includes(artCat)) return true;
    if (a.tags && Array.isArray(a.tags)) {
      return a.tags.some((t) => {
        const cleanTag = t.toLowerCase().trim().replace(/\s*&\s*|\s+/g, '-');
        return aliasTargets.includes(cleanTag) || aliasTargets.includes(t.toLowerCase().trim());
      });
    }
    return false;
  });
}

export async function fetchLiveArticlesFromSupabase(
  includeScheduled: boolean = false,
  forceRefresh: boolean = false
): Promise<Article[]> {
  const now = Date.now();
  if (!forceRefresh && memoryArticlesCache && (now - lastFetchTime < CACHE_TTL_MS)) {
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
      ? (includeScheduled ? memoryArticlesCache : memoryArticlesCache.filter((a) => !a.isScheduled))
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
  if (!forceRefresh && memoryPodcastsCache && (now - lastFetchTime < CACHE_TTL_MS)) {
    return memoryPodcastsCache;
  }

  try {
    const raw = await fetchSupabaseArticles();
    const podcasts = (raw || [])
      .filter(
        (art) =>
          Boolean(art.audio_narration_url) ||
          art.category?.toLowerCase() === 'podcast' ||
          art.category?.toLowerCase() === 'podcasts' ||
          art.category?.toLowerCase() === 'audio-and-podcast' ||
          art.category?.toLowerCase() === 'audio & podcast' ||
          art.tags?.some((t) => {
            const tl = t.toLowerCase().trim();
            return tl === 'podcast' || tl === 'audio story' || tl === 'audio & podcast' || tl === 'audio';
          })
      )
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

export function buildIssuesFromArticles(articles: Article[]): IssuePacket[] {
  const webzineArticles = articles.filter((a) => {
    if (a.webzineIssue && a.webzineIssue.trim() && a.webzineIssue !== 'None') return true;
    if (a.category?.toLowerCase() === 'webzine') return true;
    if (a.tags?.some((t) => t.toLowerCase() === 'webzine')) return true;
    return false;
  });

  const packetMap = new Map<
    string,
    {
      packetName: string;
      slug: string;
      articles: Article[];
    }
  >();

  for (const art of webzineArticles) {
    const rawPacket =
      art.webzineIssue && art.webzineIssue.trim() && art.webzineIssue !== 'None'
        ? art.webzineIssue.trim()
        : 'Packet 1';

    const slug =
      rawPacket
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'packet-1';

    if (!packetMap.has(slug)) {
      packetMap.set(slug, {
        packetName: rawPacket,
        slug,
        articles: [],
      });
    }
    packetMap.get(slug)!.articles.push(art);
  }

  const liveIssues: IssuePacket[] = [];

  packetMap.forEach(({ packetName, slug, articles: pArticles }) => {
    const sorted = [...pArticles].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    const numMatch = packetName.match(/\d+/);
    const issueNumber = numMatch ? parseInt(numMatch[0], 10) : 1;

    const featured = sorted.find((a) => a.isCover || a.isLeadStory) || sorted[0];
    const coverImage =
      featured?.coverImage ||
      sorted.find((a) => Boolean(a.coverImage))?.coverImage ||
      '/images/logo-oldmangotree.jpg';
    const isPremium = sorted.some((a) => a.isPremium);

    const title = packetName.toLowerCase().startsWith('packet')
      ? packetName
      : `Packet ${packetName}`;

    liveIssues.push({
      id: slug,
      title,
      issueNumber,
      theme: featured?.title || `${title}: Webzine Edition`,
      publishedAt: sorted[0]?.publishedAt || new Date().toISOString(),
      coverImage,
      isPremium,
      featuredArticleSlug: featured?.slug || sorted[0]?.slug || '',
      articleSlugs: sorted.map((a) => a.slug),
    });
  });

  return liveIssues.sort((a, b) => b.issueNumber - a.issueNumber);
}

export function buildSeriesFromArticles(articles: Article[]): Series[] {
  const seriesArticles = articles.filter((a) => {
    if (a.seriesTitle && a.seriesTitle.trim()) return true;
    if (a.category?.toLowerCase() === 'series' || a.category?.toLowerCase() === 'special series') return true;
    if (a.tags?.some((t) => t.toLowerCase() === 'series' || t.toLowerCase() === 'special series')) return true;
    return false;
  });

  const seriesMap = new Map<
    string,
    {
      title: string;
      slug: string;
      articles: Article[];
    }
  >();

  for (const art of seriesArticles) {
    const hasCustomSeriesTitle =
      art.seriesTitle &&
      art.seriesTitle.trim() &&
      art.seriesTitle.trim().toLowerCase() !== 'special series' &&
      art.seriesTitle.trim().toLowerCase() !== 'none';

    const rawTitle = hasCustomSeriesTitle ? art.seriesTitle!.trim() : art.title;
    const slug = hasCustomSeriesTitle
      ? rawTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') || 'special-series'
      : art.slug;

    if (!seriesMap.has(slug)) {
      seriesMap.set(slug, {
        title: rawTitle,
        slug,
        articles: [],
      });
    }
    seriesMap.get(slug)!.articles.push(art);
  }

  const liveSeries: Series[] = [];

  seriesMap.forEach(({ title, slug, articles: sArticles }) => {
    const sorted = [...sArticles].sort((a, b) => {
      const epA = parseInt(a.seriesEpisode || '1', 10) || 1;
      const epB = parseInt(b.seriesEpisode || '1', 10) || 1;
      if (epA !== epB) return epA - epB;
      return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
    });

    const episodes: SeriesEpisode[] = sorted.map((art, idx) => ({
      episodeNumber: parseInt(art.seriesEpisode || String(idx + 1), 10) || idx + 1,
      title: art.title,
      slug: art.slug,
      publishedAt: art.publishedAt,
      excerpt: art.excerpt,
    }));

    const coverImage =
      sorted.find((a) => Boolean(a.coverImage))?.coverImage ||
      '/images/logo-oldmangotree.jpg';

    const firstArticle = sorted[0];
    const authorName =
      firstArticle?.authorNames ||
      (firstArticle?.authors?.[0] ? firstArticle.authors[0] : 'Editorial Desk');
    const authorId = firstArticle?.authors?.[0] || 'editorial-desk';

    liveSeries.push({
      title,
      slug,
      description: firstArticle?.excerpt || `Special investigative serialized column: ${title}`,
      coverImage,
      authorId,
      authorName,
      category: firstArticle?.category || 'Special Series',
      totalEpisodes: episodes.length,
      episodes,
    });
  });

  return liveSeries.sort((a, b) => {
    const latestA = a.episodes[a.episodes.length - 1]?.publishedAt || '';
    const latestB = b.episodes[b.episodes.length - 1]?.publishedAt || '';
    return new Date(latestB).getTime() - new Date(latestA).getTime();
  });
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
