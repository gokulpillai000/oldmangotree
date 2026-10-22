import type { Article, Podcast, IssuePacket, Series, SeriesEpisode } from './content';
import type { SupabaseArticleRecord } from './supabase';

/**
 * Checks whether an article or record belongs exclusively to the Audio & Podcast section.
 */
export function isAudioArticle(
  article?: {
    audioNarrationUrl?: string;
    audio_narration_url?: string;
    category?: string;
    tags?: string[];
    [key: string]: any;
  } | null
): boolean {
  if (!article) return false;
  const audioUrl = article.audioNarrationUrl ?? article.audio_narration_url;
  if (Boolean(audioUrl && String(audioUrl).trim())) return true;

  const cat = (article.category || '').toLowerCase().trim();
  if (
    cat === 'podcast' ||
    cat === 'podcasts' ||
    cat === 'audio-and-podcast' ||
    cat === 'audio & podcast' ||
    cat === 'audio-podcast'
  ) {
    return true;
  }

  if (article.tags && Array.isArray(article.tags)) {
    return article.tags.some((t: string) => {
      const tl = String(t).toLowerCase().trim();
      return (
        tl === 'podcast' ||
        tl === 'audio story' ||
        tl === 'audio & podcast' ||
        tl === 'audio narration' ||
        tl === 'audio'
      );
    });
  }
  return false;
}

export const isAudioStory = isAudioArticle;

/**
 * Maps a raw Supabase article row into the application's normalized Article model.
 */
export function mapSupabaseRecordToArticle(rec: SupabaseArticleRecord): Article {
  const plainText = (rec.content_html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const wordCount = plainText ? plainText.split(' ').length : 0;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const isFutureDate = Boolean(
    rec.published_at && new Date(rec.published_at).getTime() > Date.now()
  );
  const isScheduled = rec.status === 'draft' ? false : isFutureDate;

  return {
    slug: rec.slug,
    title: rec.title,
    excerpt: rec.excerpt || '',
    category: rec.category || '',
    authors: rec.authors?.length ? rec.authors : ['akhil-u-krishnan'],
    authorNames: rec.author_names || 'Akhil U Krishnan',
    publishedAt: rec.published_at || new Date().toISOString(),
    coverImage: rec.cover_image || '',
    audioNarrationUrl: rec.audio_narration_url,
    audioDurationSeconds: rec.audio_duration_seconds,
    webzineIssue:
      rec.webzine_issue ||
      (rec.category?.toLowerCase() === 'webzine' ? 'Packet 1' : undefined),
    isLeadStory: Boolean(rec.is_lead_story),
    isCover: Boolean(rec.is_cover),
    isPremium: Boolean(rec.is_premium),
    isLongform: Boolean(rec.is_longform),
    seriesTitle: rec.series_title || undefined,
    seriesEpisode: rec.series_episode ? String(rec.series_episode) : undefined,
    tags: rec.tags?.length ? rec.tags : rec.category ? [rec.category] : [],
    readTimeMinutes,
    isScheduled,
    content: rec.content_html || '',
    contentHtml: rec.content_html || '',
  };
}

/**
 * Maps an Article object (from API or fallback) into a SupabaseArticleRecord for the CMS editor.
 */
export function mapArticleToSupabaseRecord(art: any): SupabaseArticleRecord {
  return {
    slug: art.slug,
    title: art.title,
    excerpt: art.excerpt || '',
    content_html: art.contentHtml || art.content || '',
    category: art.category || '',
    authors:
      Array.isArray(art.authors) && art.authors.length > 0
        ? art.authors
        : [art.authorNames || 'Akhil U Krishnan'],
    author_names:
      art.authorNames ||
      (Array.isArray(art.authors) ? art.authors.join(', ') : 'Akhil U Krishnan'),
    cover_image: art.coverImage || undefined,
    audio_narration_url: art.audioNarrationUrl || undefined,
    audio_duration_seconds: art.audioDurationSeconds || undefined,
    webzine_issue: art.webzineIssue || undefined,
    is_lead_story: Boolean(art.isLeadStory),
    is_cover: Boolean(art.isCover),
    is_premium: Boolean(art.isPremium),
    is_longform: Boolean(art.isLongform),
    series_title: art.seriesTitle || undefined,
    series_episode: art.seriesEpisode ? parseInt(String(art.seriesEpisode), 10) : undefined,
    tags: Array.isArray(art.tags) && art.tags.length > 0 ? art.tags : [],
    status: art.status || (art.isScheduled ? 'scheduled' : 'published'),
    published_at: art.publishedAt || undefined,
  };
}

/**
 * Maps a raw Supabase article row into a Podcast item.
 */
export function mapSupabaseRecordToPodcast(rec: SupabaseArticleRecord): Podcast {
  return {
    id: rec.slug,
    title: rec.title,
    slug: rec.slug,
    excerpt: rec.excerpt || '',
    publishedAt: rec.published_at || new Date().toISOString(),
    audioUrl: rec.audio_narration_url || '',
    durationSeconds: rec.audio_duration_seconds || 300,
    speaker: rec.author_names || (rec.authors?.[0] ? rec.authors[0] : 'Akhil U Krishnan'),
    coverImage: rec.cover_image || '/images/default-podcast.jpg',
  };
}

/**
 * Filters a list of articles by category slug while strictly isolating Audio & Podcast items.
 */
export function filterCategoryArticles(all: Article[], categorySlug: string): Article[] {
  const target = (categorySlug || '').toLowerCase().trim();

  // 1. Audio & Podcast dedicated section (Only audio items)
  if (
    target === 'podcasts' ||
    target === 'podcast' ||
    target === 'audio-and-podcast' ||
    target === 'audio & podcast' ||
    target === 'audio-podcast'
  ) {
    return all.filter((a) => isAudioArticle(a));
  }

  // 2. Webzine section
  if (target === 'webzine' || target === 'magazine') {
    return all.filter((a) => {
      if (isAudioArticle(a)) return false;
      const artCat = a.category?.toLowerCase().trim();
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
      if (isAudioArticle(a)) return false;
      const artCat = a.category?.toLowerCase().trim();
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
      : target === 'the-shade' ||
        target === 'the shade' ||
        target === 'arts-culture' ||
        target === 'arts & culture' ||
        target === 'art & culture'
      ? ['the-shade', 'the shade', 'arts-culture', 'arts & culture', 'art & culture']
      : [target];

  return all.filter((a) => {
    // Audio & Podcast items are isolated EXCLUSIVELY to their own section
    if (isAudioArticle(a)) return false;

    const artCat = a.category?.toLowerCase().trim();
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

/**
 * Groups webzine articles into IssuePacket editions.
 */
export function buildIssuesFromArticles(articles: Article[]): IssuePacket[] {
  const webzineArticles = articles.filter((a) => {
    if (isAudioArticle(a)) return false;
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

/**
 * Groups serialized articles into Series collections.
 */
export function buildSeriesFromArticles(articles: Article[]): Series[] {
  const seriesArticles = articles.filter((a) => {
    if (isAudioArticle(a)) return false;
    if (a.seriesTitle && a.seriesTitle.trim()) return true;
    if (a.category?.toLowerCase() === 'series' || a.category?.toLowerCase() === 'special series')
      return true;
    if (a.tags?.some((t) => t.toLowerCase() === 'series' || t.toLowerCase() === 'special series'))
      return true;
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
      (firstArticle?.authors?.[0] ? firstArticle.authors[0] : 'Akhil U Krishnan');
    const authorId = firstArticle?.authors?.[0] || 'akhil-u-krishnan';

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

// -------------------------------------------------------------
// DELETED SLUGS MANAGEMENT & FLICKER PREVENTION
// -------------------------------------------------------------

const DELETED_SLUGS_STORAGE_KEY = 'omt_deleted_slugs_v1';
const MAX_DELETED_SLUG_AGE_MS = 14 * 24 * 60 * 60 * 1000; // 14 days retention

interface DeletedSlugRecord {
  slug: string;
  deletedAt: number;
}

/**
 * Returns a Set of lowercase slugs that have been deleted in this browser.
 */
export function getDeletedSlugs(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DELETED_SLUGS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: (string | DeletedSlugRecord)[] = JSON.parse(raw);
    const set = new Set<string>();
    const now = Date.now();
    const valid: DeletedSlugRecord[] = [];

    for (const item of parsed) {
      if (typeof item === 'string') {
        const clean = item.trim().toLowerCase();
        if (clean) {
          set.add(clean);
          valid.push({ slug: clean, deletedAt: now });
        }
      } else if (item && item.slug) {
        const clean = item.slug.trim().toLowerCase();
        if (clean && (!item.deletedAt || now - item.deletedAt < MAX_DELETED_SLUG_AGE_MS)) {
          set.add(clean);
          valid.push({ slug: clean, deletedAt: item.deletedAt || now });
        }
      }
    }

    if (valid.length !== parsed.length) {
      localStorage.setItem(DELETED_SLUGS_STORAGE_KEY, JSON.stringify(valid));
    }
    return set;
  } catch {
    return new Set();
  }
}

/**
 * Records a slug as deleted and immediately injects a CSS rule to hide its cards.
 */
export function recordDeletedSlug(slug: string): void {
  if (typeof window === 'undefined' || !slug) return;
  try {
    const cleanSlug = slug.trim().toLowerCase();
    if (!cleanSlug) return;

    const raw = localStorage.getItem(DELETED_SLUGS_STORAGE_KEY);
    const parsed: DeletedSlugRecord[] = raw ? JSON.parse(raw) : [];
    const filtered = parsed.filter(
      (item) => (typeof item === 'string' ? item : item.slug).toLowerCase() !== cleanSlug
    );
    filtered.push({ slug: cleanSlug, deletedAt: Date.now() });
    localStorage.setItem(DELETED_SLUGS_STORAGE_KEY, JSON.stringify(filtered));

    // Dynamically inject/extend CSS hiding rule immediately for instant zero-frame hiding
    const styleId = 'omt-deleted-content-guard';
    let style = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }
    const rule = `[data-article-slug="${cleanSlug}"], [data-podcast-slug="${cleanSlug}"] { display: none !important; }`;
    if (!style.textContent?.includes(cleanSlug)) {
      style.textContent = (style.textContent || '') + '\n' + rule;
    }
  } catch {}
}

/**
 * Removes a slug from the deleted list (e.g. when republished or created anew).
 */
export function removeDeletedSlug(slug: string): void {
  if (typeof window === 'undefined' || !slug) return;
  try {
    const cleanSlug = slug.trim().toLowerCase();
    if (!cleanSlug) return;
    const raw = localStorage.getItem(DELETED_SLUGS_STORAGE_KEY);
    if (!raw) return;
    const parsed: DeletedSlugRecord[] = JSON.parse(raw);
    const filtered = parsed.filter(
      (item) => (typeof item === 'string' ? item : item.slug).toLowerCase() !== cleanSlug
    );
    localStorage.setItem(DELETED_SLUGS_STORAGE_KEY, JSON.stringify(filtered));
  } catch {}
}

/**
 * Filters out any items whose slug has been recorded as deleted.
 */
export function filterDeletedArticles<T extends { slug: string }>(items: T[]): T[] {
  if (!items || items.length === 0) return items || [];
  if (typeof window === 'undefined') return items;
  const deleted = getDeletedSlugs();
  if (deleted.size === 0) return items;
  return items.filter((item) => item && item.slug && !deleted.has(item.slug.trim().toLowerCase()));
}

