import { Article, IssuePacket, Series, SeriesEpisode, Video, Podcast, formatSingleAuthorName } from './content';

const BLOG_URL = process.env.NEXT_PUBLIC_BLOGGER_URL || 'https://oldmangotree.blogspot.com';

export interface BloggerAuthor {
  name: { $t: string };
  gd$image?: { src: string };
  uri?: { $t: string };
}

export interface BloggerCategory {
  term: string;
  scheme?: string;
}

export interface BloggerLink {
  rel: string;
  href: string;
  type?: string;
  title?: string;
}

export interface BloggerEntry {
  id: { $t: string };
  published: { $t: string };
  updated: { $t: string };
  title: { $t: string };
  content?: { $t: string };
  summary?: { $t: string };
  category?: BloggerCategory[];
  author?: BloggerAuthor[];
  link: BloggerLink[];
  media$thumbnail?: { url: string; height?: number; width?: number };
}

export interface BloggerFeedResponse {
  feed?: {
    title?: { $t: string };
    entry?: BloggerEntry[];
  };
}

// Global in-memory cache and in-flight request deduplication for instant dev/prod routing
const globalForBlogger = globalThis as unknown as {
  cachedBloggerArticles?: Article[];
  lastBloggerFetchTime?: number;
  inFlightBloggerFetch?: Promise<Article[]> | null;
};

const CACHE_TTL_MS = 120 * 1000; // 120 seconds in-memory cache

export function clearBloggerCache(): void {
  globalForBlogger.cachedBloggerArticles = undefined;
  globalForBlogger.lastBloggerFetchTime = 0;
  globalForBlogger.inFlightBloggerFetch = null;
}

function cleanSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * 1. Fetch All Articles from Blogger JSON Feed
 */
export async function fetchBloggerPosts(): Promise<Article[]> {
  const now = Date.now();
  if (
    globalForBlogger.cachedBloggerArticles &&
    now - (globalForBlogger.lastBloggerFetchTime || 0) < CACHE_TTL_MS
  ) {
    return globalForBlogger.cachedBloggerArticles;
  }

  // Deduplicate concurrent requests so only 1 network fetch runs
  if (globalForBlogger.inFlightBloggerFetch) {
    return globalForBlogger.inFlightBloggerFetch;
  }

  const cleanUrl = BLOG_URL.replace(/\/+$/, '');
  const feedUrl = `${cleanUrl}/feeds/posts/default?alt=json&max-results=500`;

  globalForBlogger.inFlightBloggerFetch = (async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout for reliability

    try {
      const res = await fetch(feedUrl, {
        signal: controller.signal,
        next: { revalidate: 120, tags: ['blogger-posts'] },
        headers: {
          Accept: 'application/json',
        },
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        console.warn(`Blogger feed returned status ${res.status} for ${feedUrl}`);
        globalForBlogger.cachedBloggerArticles = [];
        globalForBlogger.lastBloggerFetchTime = now;
        return [];
      }

      const data: BloggerFeedResponse = await res.json();
      const entries = data.feed?.entry || [];

      const articles = entries.map((entry) => parseBloggerEntry(entry));
      globalForBlogger.cachedBloggerArticles = articles;
      globalForBlogger.lastBloggerFetchTime = now;
      return articles;
    } catch (error) {
      clearTimeout(timeoutId);
      // On network timeout or error, cache empty array for 60s so local fallback is instant
      globalForBlogger.cachedBloggerArticles = globalForBlogger.cachedBloggerArticles || [];
      globalForBlogger.lastBloggerFetchTime = now;
      return globalForBlogger.cachedBloggerArticles;
    } finally {
      globalForBlogger.inFlightBloggerFetch = null;
    }
  })();

  return globalForBlogger.inFlightBloggerFetch;
}

/**
 * 2. Parse Single Entry to oldmangotree Article
 */
export function parseBloggerEntry(entry: BloggerEntry): Article {
  const title = entry.title?.$t || 'Untitled';
  const contentHtml = entry.content?.$t || entry.summary?.$t || '';
  const publishedAt = entry.published?.$t || new Date().toISOString();
  const labels = entry.category ? entry.category.map((c) => c.term.trim()) : [];

  // Extract Slug from alternate link (e.g., https://.../2026/09/slug-name.html)
  const alternateLink = entry.link?.find((l) => l.rel === 'alternate')?.href || '';
  const slugMatch = alternateLink.match(/\/([^/]+)\.html(?:[?#].*)?$/);
  let slug = slugMatch ? slugMatch[1] : '';

  if (!slug) {
    slug = cleanSlug(title) || `post-${Date.now()}`;
  }

  // Author details (Supports logged-in Blogger author OR custom "Author: <Name>" label override)
  const authorTag = labels.find((l) => /^(?:author|by):\s*(.+)$/i.test(l));
  let authorName = '';
  if (authorTag) {
    const match = authorTag.match(/^(?:author|by):\s*(.+)$/i);
    if (match) authorName = match[1].trim();
  }
  if (!authorName) {
    authorName = entry.author?.[0]?.name?.$t || 'Akhil U Krishnan';
  }
  authorName = formatSingleAuthorName(authorName);

  // Map author strictly to either Amala Thomas or Akhil U Krishnan
  let authorId = 'akhil-u-krishnan';
  const lowerAuthor = authorName.toLowerCase();
  if (lowerAuthor.includes('amala') || lowerAuthor.includes('അമല')) {
    authorId = 'amala-thomas';
    authorName = 'Amala Thomas';
  } else {
    authorId = 'akhil-u-krishnan';
    authorName = 'Akhil U Krishnan';
  }

  // High-Resolution Cover Image extraction
  let coverImage = '';
  if (entry.media$thumbnail?.url) {
    // Convert Blogger thumbnail (s72-c, s72, w72-h72-p-k-no-nu) to full HD resolution (s1600)
    coverImage = entry.media$thumbnail.url
      .replace(/\/s[0-9]+(-[a-zA-Z0-9_-]+)?\//, '/s1600/')
      .replace(/\/w[0-9]+-h[0-9]+[^/]*\//, '/s1600/');
  }

  if (!coverImage) {
    const imgMatch = contentHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch) {
      coverImage = imgMatch[1];
    }
  }

  // Fallback cover image
  if (!coverImage) {
    coverImage = 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80';
  }

  // Excerpt generation (strip HTML, max 180 chars)
  const plainText = contentHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const excerpt = plainText.length > 180 ? `${plainText.slice(0, 180).trim()}...` : plainText;

  // Estimated read time (avg 200 words per minute)
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Audio link extraction (Supports: [audio: URL], <audio src="URL">, direct MP3/M4A/WAV, and Google Drive audio links)
  let audioNarrationUrl: string | undefined;
  const audioMatch = contentHtml.match(/(?:\[audio:\s*|<audio[^>]+src=["'])(https?:\/\/[^"\]\s]+)/i);
  if (audioMatch) {
    audioNarrationUrl = audioMatch[1];
  } else {
    // Direct audio link detection (.mp3, .m4a, .wav, .aac, .ogg)
    const directAudioMatch = contentHtml.match(/https?:\/\/[^\s"'<>]+\.(?:mp3|m4a|wav|aac|ogg)(?:\?[^\s"'<>]*)?/i);
    if (directAudioMatch) {
      audioNarrationUrl = directAudioMatch[0];
    } else {
      // Check for Google Drive audio link
      const driveMatch = contentHtml.match(/https?:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
      if (driveMatch) {
        audioNarrationUrl = `https://docs.google.com/uc?export=download&id=${driveMatch[1]}`;
      }
    }
  }

  // If audio URL is a Google Drive share link, convert it to direct stream
  if (audioNarrationUrl && /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i.test(audioNarrationUrl)) {
    const dMatch = audioNarrationUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
    if (dMatch) {
      audioNarrationUrl = `https://docs.google.com/uc?export=download&id=${dMatch[1]}`;
    }
  }

  // Category determination
  const standardCategories = ['politics', 'cinema', 'sports', 'literature', 'media', 'society', 'environment', 'economy', 'science', 'the shade', 'the-shade', 'fallen mangoes', 'fallen-mangoes', 'arts & culture', 'arts-culture', 'culture', 'miscellaneous'];
  const matchedCategory = labels.find((l) => standardCategories.includes(l.toLowerCase()));
  let category = 'politics';
  if (matchedCategory) {
    const norm = matchedCategory.toLowerCase();
    if (norm === 'arts & culture' || norm === 'arts-culture' || norm === 'culture' || norm === 'the shade' || norm === 'the-shade') {
      category = 'the-shade';
    } else if (norm === 'miscellaneous' || norm === 'fallen mangoes' || norm === 'fallen-mangoes') {
      category = 'fallen-mangoes';
    } else {
      category = norm.replace(/\s*&\s*|\s+/g, '-');
    }
  }

  // Packet & Issue tags (e.g. "Packet 1", "Packet 2", "packet-2")
  let webzineIssue: string | undefined;
  const packetLabel = labels.find((l) => /^packet\s*[0-9]+/i.test(l) || /^packet-[0-9]+/i.test(l));
  if (packetLabel) {
    const numMatch = packetLabel.match(/[0-9]+/);
    if (numMatch) {
      webzineIssue = `packet-${numMatch[0]}`;
    }
  }

  // Premium & Special flags
  const isPremium = labels.some((l) => l.toLowerCase() === 'premium');

  return {
    title,
    slug,
    excerpt,
    category,
    authors: [authorId],
    authorNames: authorName,
    publishedAt,
    coverImage,
    content: plainText,
    contentHtml,
    audioNarrationUrl,
    readTimeMinutes,
    isPremium,
    webzineIssue,
    tags: labels,
  };
}

/**
 * 3. Fetch Single Article by Slug
 */
export async function fetchBloggerPostBySlug(slug: string): Promise<Article | null> {
  const articles = await fetchBloggerPosts();
  return articles.find((a) => a.slug === slug) || null;
}

/**
 * 4. Extract Webzine Packets from Posts
 */
export async function fetchBloggerPackets(): Promise<IssuePacket[]> {
  const articles = await fetchBloggerPosts();
  const packetMap = new Map<string, Article[]>();

  articles.forEach((art) => {
    if (art.webzineIssue) {
      const existing = packetMap.get(art.webzineIssue) || [];
      existing.push(art);
      packetMap.set(art.webzineIssue, existing);
    }
  });

  const packets: IssuePacket[] = [];
  packetMap.forEach((arts, packetId) => {
    const coverPost = arts.find((a) => a.tags?.some((t) => t.toLowerCase() === 'issue cover'));
    const leadStory = arts.find((a) => a.tags?.some((t) => t.toLowerCase() === 'lead story')) || arts[0];
    const issueNum = parseInt(packetId.replace(/[^0-9]/g, ''), 10) || 1;

    // Filter out pure cover posts from the article list if tagged as issue cover
    const contentArticles = arts.filter((a) => !a.tags?.some((t) => t.toLowerCase() === 'issue cover'));
    const finalArticles = contentArticles.length > 0 ? contentArticles : arts;

    packets.push({
      id: packetId,
      title: coverPost?.title || `PACKET ${issueNum}`,
      issueNumber: issueNum,
      theme: coverPost?.excerpt || 'Contemporary Cultural & Political Analysis',
      publishedAt: coverPost?.publishedAt || arts[0].publishedAt,
      coverImage: coverPost?.coverImage || leadStory.coverImage,
      isPremium: arts.some((a) => a.isPremium),
      featuredArticleSlug: leadStory.slug,
      articleSlugs: finalArticles.map((a) => a.slug),
    });
  });

  return packets.sort((a, b) => b.issueNumber - a.issueNumber);
}

/**
 * 5. Extract Special Columns / Series from Posts
 * Label convention:
 * - "Series: <Name>"
 * - "Part: <N>"
 * - "Series Info" (Overview post)
 */
export async function fetchBloggerSeries(): Promise<Series[]> {
  const articles = await fetchBloggerPosts();
  const seriesMap = new Map<string, { infoPost?: Article; parts: { partNum: number; article: Article }[] }>();

  articles.forEach((art) => {
    const seriesLabel = art.tags?.find((t) => /^series:\s*(.+)$/i.test(t));
    if (!seriesLabel) return;

    const seriesNameMatch = seriesLabel.match(/^series:\s*(.+)$/i);
    const seriesTitle = seriesNameMatch ? seriesNameMatch[1].trim() : seriesLabel;
    const seriesKey = cleanSlug(seriesTitle);

    const isInfo = art.tags?.some((t) => t.toLowerCase() === 'series info');
    const partLabel = art.tags?.find((t) => /^part:\s*([0-9]+)/i.test(t));
    const partNum = partLabel ? parseInt(partLabel.replace(/[^0-9]/g, ''), 10) : 1;

    const entry = seriesMap.get(seriesKey) || { parts: [] };
    if (isInfo) {
      entry.infoPost = art;
    } else {
      entry.parts.push({ partNum, article: art });
    }
    seriesMap.set(seriesKey, entry);
  });

  const seriesList: Series[] = [];

  seriesMap.forEach((entry, seriesKey) => {
    // Sort parts ascending
    entry.parts.sort((a, b) => a.partNum - b.partNum);

    const leadPart = entry.parts[0]?.article;
    const info = entry.infoPost;
    const title = info?.title || leadPart?.title || seriesKey.replace(/-/g, ' ');

    const episodes: SeriesEpisode[] = entry.parts.map((p) => ({
      episodeNumber: p.partNum,
      title: p.article.title,
      slug: p.article.slug,
      publishedAt: p.article.publishedAt,
      excerpt: p.article.excerpt,
    }));

    seriesList.push({
      slug: seriesKey,
      title,
      subtitle: info?.excerpt,
      description: info?.content || leadPart?.excerpt || '',
      coverImage: info?.coverImage || leadPart?.coverImage || '',
      authorId: leadPart?.authors?.[0] || 'akhil-u-krishnan',
      authorName: leadPart?.authorNames || 'Akhil U Krishnan',
      category: leadPart?.category || 'literature',
      totalEpisodes: episodes.length,
      episodes,
    });
  });

  return seriesList;
}

/**
 * 6. Extract Videos from Posts (Tagged "Video" or with YouTube links)
 */
export async function fetchBloggerVideos(): Promise<Video[]> {
  const articles = await fetchBloggerPosts();
  const videoArticles = articles.filter(
    (art) =>
      art.tags?.some((t) => t.toLowerCase() === 'video') ||
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i.test(art.contentHtml || '') ||
      /(?:blogger\.com\/video\.g\?token=|video\.google\.com)/i.test(art.contentHtml || '')
  );

  return videoArticles.map((art) => {
    const ytMatch = (art.contentHtml || '').match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
    );
    const youtubeId = ytMatch ? ytMatch[1] : '';

    return {
      id: art.slug,
      title: art.title,
      excerpt: art.excerpt,
      youtubeId,
      category: art.category,
      publishedAt: art.publishedAt,
      duration: '10:00',
      speaker: art.authorNames,
      coverImage: art.coverImage || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : ''),
      isFeatured: art.tags?.some((t) => t.toLowerCase() === 'lead story'),
    };
  });
}

/**
 * 7. Extract Podcasts from Posts (Tagged "Audio Story", "Podcast", or with audioNarrationUrl)
 */
export async function fetchBloggerPodcasts(): Promise<Podcast[]> {
  const articles = await fetchBloggerPosts();
  const podcastArticles = articles.filter(
    (art) =>
      Boolean(art.audioNarrationUrl) ||
      art.tags?.some((t) => t.toLowerCase() === 'audio story' || t.toLowerCase() === 'podcast')
  );

  return podcastArticles.map((art) => ({
    id: art.slug,
    title: art.title,
    slug: art.slug,
    excerpt: art.excerpt,
    publishedAt: art.publishedAt,
    audioUrl: art.audioNarrationUrl || '',
    durationSeconds: (art.readTimeMinutes || 5) * 60,
    speaker: art.authorNames || 'Akhil U Krishnan',
    coverImage: art.coverImage,
  }));
}
