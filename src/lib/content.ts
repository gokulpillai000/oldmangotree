import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import {
  fetchBloggerPosts,
  fetchBloggerPostBySlug,
  fetchBloggerPackets,
  fetchBloggerSeries,
  fetchBloggerVideos,
  fetchBloggerPodcasts,
} from './blogger';
import {
  fetchSupabaseArticles,
  fetchSupabaseArticleBySlug,
  SupabaseArticleRecord,
} from './supabase';

const contentDirectory = path.join(process.cwd(), 'content');

/**
 * DUMMY CONTENT VISIBILITY TOGGLE:
 * Permanently set to `true` to ensure dummy/sample content is never displayed.
 */
export const HIDE_DUMMY_CONTENT: boolean = true;


export interface ArticleFrontmatter {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  authors: string[];
  authorNames?: string;
  publishedAt: string;
  coverImage: string;
  audioNarrationUrl?: string;
  audioDurationSeconds?: number;
  isPremium?: boolean;
  isLeadStory?: boolean;
  isCover?: boolean;
  isLongform?: boolean;
  seriesTitle?: string;
  seriesEpisode?: string;
  webzineIssue?: string;
  readTimeMinutes?: number;
  tags?: string[];
  isScheduled?: boolean;
}

export interface Article extends ArticleFrontmatter {
  content: string;
  contentHtml?: string;
}

export interface IssuePacket {
  id: string;
  title: string;
  issueNumber: number;
  theme: string;
  publishedAt: string;
  coverImage: string;
  isPremium: boolean;
  featuredArticleSlug: string;
  articleSlugs: string[];
}

export interface Author {
  id: string;
  name: string;
  role: string;
  avatar: string;
  bio: string;
}

export interface Category {
  slug: string;
  name: string;
  description: string;
  color: string;
  icon?: string;
  subcategories?: { slug: string; name: string }[];
}

export interface Podcast {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  audioUrl: string;
  durationSeconds: number;
  speaker: string;
  coverImage: string;
}

export interface SeriesEpisode {
  episodeNumber: number;
  title: string;
  slug: string;
  publishedAt: string;
  excerpt?: string;
}

export interface Series {
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  coverImage: string;
  authorId: string;
  authorName?: string;
  category?: string;
  totalEpisodes: number;
  episodes: SeriesEpisode[];
}

export interface Video {
  id: string;
  title: string;
  excerpt: string;
  youtubeId: string;
  playlist?: string;
  category: string;
  publishedAt: string;
  duration: string;
  speaker?: string;
  coverImage?: string;
  isFeatured?: boolean;
}

export interface PageContent {
  slug: string;
  title: string;
  subtitle?: string;
  publishedAt?: string;
  content: string;
  contentHtml?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  englishName?: string;
  role: string;
  bio?: string;
  avatar?: string;
  department?: string;
}

// -------------------------------------------------------------
// LOCAL CONTENT LOADERS (With In-Memory Cache for Instant Routing)
// -------------------------------------------------------------

interface ContentMemoryCache {
  articles?: Article[];
  articlesWithScheduled?: Article[];
  authorsMap?: Record<string, string>;
  categories?: Category[];
  issues?: IssuePacket[];
  authors?: Author[];
  series?: Series[];
  podcasts?: Podcast[];
  videos?: Video[];
  htmlBySlug: Map<string, string>;
}

const memoryCache: ContentMemoryCache = {
  htmlBySlug: new Map<string, string>(),
};

export function clearLocalContentCache(): void {
  memoryCache.articles = undefined;
  memoryCache.articlesWithScheduled = undefined;
  memoryCache.authorsMap = undefined;
  memoryCache.categories = undefined;
  memoryCache.issues = undefined;
  memoryCache.authors = undefined;
  memoryCache.series = undefined;
  memoryCache.podcasts = undefined;
  memoryCache.videos = undefined;
  memoryCache.htmlBySlug.clear();
}

export function getLocalArticles(includeScheduled: boolean = false): Article[] {
  if (HIDE_DUMMY_CONTENT) {
    return [];
  }
  if (includeScheduled && memoryCache.articlesWithScheduled) {
    return memoryCache.articlesWithScheduled;
  }
  if (!includeScheduled && memoryCache.articles) {
    return memoryCache.articles;
  }

  const articlesDir = path.join(contentDirectory, 'articles');
  if (!fs.existsSync(articlesDir)) return [];

  const authorsMap = getAuthorsMap();
  const now = new Date().getTime();
  const fileNames = fs.readdirSync(articlesDir);

  const allArticles = fileNames
    .filter((file) => file.endsWith('.md'))
    .map((fileName) => {
      const fullPath = path.join(articlesDir, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      const pubTime = new Date(data.publishedAt || Date.now()).getTime();
      const isScheduled = pubTime > now;

      const authorIds = Array.isArray(data.authors)
        ? data.authors
        : data.authors
        ? [data.authors]
        : [];

      const authorNamesList = authorIds.map(
        (id: string) => authorsMap[id] || id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      );
      const authorNames = authorNamesList.length > 0 ? authorNamesList.join(', ') : 'Akhil U Krishnan';

      return {
        ...(data as ArticleFrontmatter),
        authors: authorIds,
        authorNames,
        slug: data.slug || fileName.replace(/\.md$/, ''),
        content,
        isScheduled,
      };
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  memoryCache.articlesWithScheduled = allArticles;
  memoryCache.articles = allArticles.filter((article) => !article.isScheduled);

  return includeScheduled ? memoryCache.articlesWithScheduled : memoryCache.articles;
}

/**
 * Normalizes an author's display name to ensure only ONE language/name is shown.
 * If a name contains both Malayalam and English separated by '/' (e.g. "കമൽറാം സജീവ് / Kamalram Sajeev"),
 * it selects a single clean name instead of showing both.
 */
export function formatSingleAuthorName(rawName: string): string {
  if (!rawName) return 'Akhil U Krishnan';
  const trimmed = rawName.trim();
  if (!trimmed.includes('/')) return trimmed;

  const parts = trimmed.split('/').map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return 'Akhil U Krishnan';

  // If one of the parts is English, prefer it; otherwise take the first part
  const englishPart = parts.find((p) => /^[A-Za-z0-9\s.,'-]+$/.test(p));
  return englishPart || parts[0];
}

export function getAllArticlesSync(includeScheduled: boolean = false): Article[] {
  return getLocalArticles(includeScheduled);
}

function getAuthorsMap(): Record<string, string> {
  if (memoryCache.authorsMap) return memoryCache.authorsMap;

  const authorsDir = path.join(contentDirectory, 'authors');
  const authorsMap: Record<string, string> = {};
  if (fs.existsSync(authorsDir)) {
    const authorFiles = fs.readdirSync(authorsDir).filter((f) => f.endsWith('.json'));
    for (const f of authorFiles) {
      try {
        const aObj = JSON.parse(fs.readFileSync(path.join(authorsDir, f), 'utf8'));
        if (aObj.id && aObj.name) {
          authorsMap[aObj.id] = formatSingleAuthorName(aObj.name);
        }
      } catch {}
    }
  }
  memoryCache.authorsMap = authorsMap;
  return authorsMap;
}

// -------------------------------------------------------------
// LIVE ARTICLES (Supabase Custom CMS + Blogger + Local Fallback)
// -------------------------------------------------------------

function mapSupabaseToArticle(rec: SupabaseArticleRecord): Article {
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
    authors: rec.authors || ['akhil-u-krishnan'],
    authorNames: rec.author_names || 'Akhil U Krishnan',
    publishedAt: rec.published_at || new Date().toISOString(),
    coverImage: rec.cover_image || '',
    audioNarrationUrl: rec.audio_narration_url,
    audioDurationSeconds: rec.audio_duration_seconds,
    webzineIssue: rec.webzine_issue,
    isLeadStory: rec.is_lead_story,
    isCover: rec.is_cover,
    isPremium: rec.is_premium,
    tags: rec.tags || (rec.category ? [rec.category] : []),
    readTimeMinutes,
    isScheduled,
    content: rec.content_html,
    contentHtml: rec.content_html,
  };
}

export async function getAllArticles(includeScheduled: boolean = false): Promise<Article[]> {
  // 1. Fetch live articles from Supabase Custom CMS
  let supabaseArticles: Article[] = [];
  try {
    const rawSupabase = await fetchSupabaseArticles();
    if (rawSupabase && rawSupabase.length > 0) {
      supabaseArticles = rawSupabase
        .map(mapSupabaseToArticle)
        .filter((a) => (includeScheduled ? true : !a.isScheduled));
    }
  } catch (err) {
    console.warn('Error fetching Supabase articles:', err);
  }

  // 2. Fetch live articles from Blogger Feed (if configured)
  let bloggerArticles: Article[] = [];
  if (process.env.NEXT_PUBLIC_BLOGGER_URL) {
    try {
      const liveArticles = await fetchBloggerPosts();
      if (liveArticles && liveArticles.length > 0) {
        bloggerArticles = liveArticles;
      }
    } catch (err) {
      console.warn('Error fetching live Blogger posts:', err);
    }
  }

  // 3. Fallback to local markdown articles if both remote sources are empty
  if (supabaseArticles.length === 0 && bloggerArticles.length === 0) {
    if (HIDE_DUMMY_CONTENT) return [];
    return getLocalArticles(includeScheduled);
  }

  // 4. Merge articles (Supabase articles take priority if slug matches)
  const combined: Article[] = [...supabaseArticles];
  for (const b of bloggerArticles) {
    if (!combined.some((a) => a.slug === b.slug)) {
      if (includeScheduled || !b.isScheduled) {
        combined.push(b);
      }
    }
  }

  // Sort by published date descending (latest first)
  return combined.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export async function getArticleBySlug(slug: string, includeScheduled: boolean = false): Promise<Article | null> {
  // 1. Check Supabase first
  try {
    const supArticle = await fetchSupabaseArticleBySlug(slug);
    if (supArticle) {
      const mapped = mapSupabaseToArticle(supArticle);
      if (!includeScheduled && mapped.isScheduled) {
        return null;
      }
      return mapped;
    }
  } catch (err) {
    console.warn(`Error checking Supabase article by slug "${slug}":`, err);
  }

  // 2. Check Blogger
  if (process.env.NEXT_PUBLIC_BLOGGER_URL) {
    try {
      const liveArticle = await fetchBloggerPostBySlug(slug);
      if (liveArticle) return liveArticle;
    } catch (err) {
      console.warn(`Error fetching Blogger post by slug "${slug}":`, err);
    }
  }

  // 3. Check local content files
  if (HIDE_DUMMY_CONTENT) return null;

  const articles = getLocalArticles(includeScheduled);
  const article = articles.find((a) => a.slug === slug);
  if (!article) return null;

  if (article.contentHtml) return article;

  const cachedHtml = memoryCache.htmlBySlug.get(slug);
  if (cachedHtml) {
    return {
      ...article,
      contentHtml: cachedHtml,
    };
  }

  const processedContent = await remark().use(html).process(article.content);
  const contentHtml = processedContent.toString();
  memoryCache.htmlBySlug.set(slug, contentHtml);

  return {
    ...article,
    contentHtml,
  };
}

export async function getArticlesByCategory(categorySlug: string, includeScheduled: boolean = false): Promise<Article[]> {
  const articles = await getAllArticles(includeScheduled);
  const target = categorySlug.toLowerCase().trim();
  const aliasTargets =
    target === 'fallen-mangoes' || target === 'miscellaneous' || target === 'fallen mangoes'
      ? ['fallen-mangoes', 'fallen mangoes', 'miscellaneous']
      : target === 'the-shade' || target === 'the shade' || target === 'arts-culture' || target === 'arts & culture' || target === 'art & culture'
      ? ['the-shade', 'the shade', 'arts-culture', 'arts & culture', 'art & culture']
      : [target];

  return articles.filter((a) => {
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

export async function getArticlesByTag(tag: string, includeScheduled: boolean = false): Promise<Article[]> {
  const articles = await getAllArticles(includeScheduled);
  const cleanTag = tag.toLowerCase().trim();
  return articles.filter((a) => a.tags?.some((t) => t.toLowerCase() === cleanTag));
}

export function getRelatedArticles(article: Article, limit: number = 3, pool?: Article[]): Article[] {
  const allArticles = (pool || getLocalArticles(false)).filter((a) => a.slug !== article.slug);

  // Prioritize articles from the same webzine issue packet
  const sameIssue = article.webzineIssue
    ? allArticles.filter((a) => a.webzineIssue === article.webzineIssue)
    : [];

  // Next prioritize same category
  const sameCategory = allArticles.filter(
    (a) => a.category === article.category && !sameIssue.some((si) => si.slug === a.slug)
  );

  // Fallback to latest remaining
  const remaining = allArticles.filter(
    (a) => !sameIssue.some((si) => si.slug === a.slug) && !sameCategory.some((sc) => sc.slug === a.slug)
  );

  return [...sameIssue, ...sameCategory, ...remaining].slice(0, limit);
}

// -------------------------------------------------------------
// WEBZINE ISSUES & PACKETS
// -------------------------------------------------------------

export function getLocalIssues(): IssuePacket[] {
  if (HIDE_DUMMY_CONTENT) return [];
  if (memoryCache.issues) return memoryCache.issues;

  const issuesDir = path.join(contentDirectory, 'issues');
  if (!fs.existsSync(issuesDir)) return [];

  const fileNames = fs.readdirSync(issuesDir);
  const issues = fileNames
    .filter((file) => file.endsWith('.json'))
    .map((fileName) => {
      const fullPath = path.join(issuesDir, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      return JSON.parse(fileContents) as IssuePacket;
    })
    .sort((a, b) => b.issueNumber - a.issueNumber);

  memoryCache.issues = issues;
  return issues;
}

export async function getAllIssues(): Promise<IssuePacket[]> {
  if (HIDE_DUMMY_CONTENT) return [];
  if (process.env.NEXT_PUBLIC_BLOGGER_URL) {
    try {
      const livePackets = await fetchBloggerPackets();
      if (livePackets.length > 0) return livePackets;
    } catch (err) {
      console.warn('Error fetching live Blogger packets, falling back to local issues:', err);
    }
  }
  return getLocalIssues();
}

export async function getIssueById(id: string): Promise<IssuePacket | null> {
  const issues = await getAllIssues();
  return issues.find((i) => i.id === id) || null;
}

// -------------------------------------------------------------
// AUTHORS
// -------------------------------------------------------------

export function getAllAuthors(): Author[] {
  if (memoryCache.authors) return memoryCache.authors;

  const authorsDir = path.join(contentDirectory, 'authors');
  if (!fs.existsSync(authorsDir)) return [];

  const fileNames = fs.readdirSync(authorsDir);
  const authors = fileNames
    .filter((file) => file.endsWith('.json'))
    .map((fileName) => {
      const fullPath = path.join(authorsDir, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const author = JSON.parse(fileContents) as Author;
      return {
        ...author,
        name: formatSingleAuthorName(author.name),
      };
    });

  memoryCache.authors = authors;
  return authors;
}

export function getAuthorById(id: string): Author | null {
  const authors = getAllAuthors();
  if (!id) return authors[0] || null;
  const direct = authors.find((a) => a.id.toLowerCase() === id.toLowerCase());
  if (direct) {
    return {
      ...direct,
      name: formatSingleAuthorName(direct.name),
    };
  }

  return authors[0] || null;
}

// -------------------------------------------------------------
// CATEGORIES
// -------------------------------------------------------------

export function getAllCategories(): Category[] {
  if (memoryCache.categories) return memoryCache.categories;

  const categoriesDir = path.join(contentDirectory, 'categories');
  if (!fs.existsSync(categoriesDir)) return [];

  const fileNames = fs.readdirSync(categoriesDir);
  const categories = fileNames
    .filter((file) => file.endsWith('.json'))
    .map((fileName) => {
      const fullPath = path.join(categoriesDir, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      return JSON.parse(fileContents) as Category;
    });

  memoryCache.categories = categories;
  return categories;
}

// -------------------------------------------------------------
// PODCASTS & AUDIO
// -------------------------------------------------------------

export function getLocalPodcasts(): Podcast[] {
  if (HIDE_DUMMY_CONTENT) return [];
  if (memoryCache.podcasts) return memoryCache.podcasts;

  const podcastsDir = path.join(contentDirectory, 'podcasts');
  if (!fs.existsSync(podcastsDir)) return [];

  const authorsMap = getAuthorsMap();
  const fileNames = fs.readdirSync(podcastsDir);
  const podcasts = fileNames
    .filter((file) => file.endsWith('.json'))
    .map((fileName) => {
      const fullPath = path.join(podcastsDir, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const pod = JSON.parse(fileContents) as Podcast;
      const speakerName = pod.speaker
        ? (authorsMap[pod.speaker] || formatSingleAuthorName(pod.speaker))
        : 'Akhil U Krishnan';
      return {
        ...pod,
        speaker: speakerName,
      };
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  memoryCache.podcasts = podcasts;
  return podcasts;
}

export async function getAllPodcasts(): Promise<Podcast[]> {
  const list: Podcast[] = [];

  // 1. Fetch live podcasts from Supabase (articles with audio_narration_url or category/tag podcast)
  try {
    const supaArticles = await fetchSupabaseArticles();
    const supaPodcasts = supaArticles
      .filter(
        (art) =>
          Boolean(art.audio_narration_url) ||
          art.category?.toLowerCase() === 'podcast' ||
          art.tags?.some((t) => t.toLowerCase() === 'podcast' || t.toLowerCase() === 'audio story')
      )
      .map((art) => ({
        id: art.slug,
        title: art.title,
        slug: art.slug,
        excerpt: art.excerpt || '',
        publishedAt: art.published_at || new Date().toISOString(),
        audioUrl: art.audio_narration_url || '',
        durationSeconds: art.audio_duration_seconds || 300,
        speaker: art.author_names || (art.authors && art.authors[0]) || 'Akhil U Krishnan',
        coverImage: art.cover_image || '/images/default-podcast.jpg',
      }));
    list.push(...supaPodcasts);
  } catch (err) {
    console.warn('Error fetching Supabase podcasts:', err);
  }

  // 2. Fetch Blogger / local podcasts (only if dummy content is not hidden)
  if (!HIDE_DUMMY_CONTENT) {
    if (process.env.NEXT_PUBLIC_BLOGGER_URL) {
      try {
        const livePodcasts = await fetchBloggerPodcasts();
        if (livePodcasts.length > 0) {
          list.push(...livePodcasts);
        }
      } catch (err) {
        console.warn('Error fetching live Blogger podcasts, falling back to local podcasts:', err);
        list.push(...getLocalPodcasts());
      }
    } else {
      list.push(...getLocalPodcasts());
    }
  }

  // Deduplicate by slug and sort newest first
  const seen = new Set<string>();
  const merged: Podcast[] = [];
  for (const item of list) {
    if (!seen.has(item.slug)) {
      seen.add(item.slug);
      merged.push(item);
    }
  }

  return merged.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

// -------------------------------------------------------------
// SPECIAL SERIES
// -------------------------------------------------------------

export function getLocalSeries(): Series[] {
  if (HIDE_DUMMY_CONTENT) return [];
  if (memoryCache.series) return memoryCache.series;

  const seriesDir = path.join(contentDirectory, 'series');
  if (!fs.existsSync(seriesDir)) return [];

  const fileNames = fs.readdirSync(seriesDir);
  const series = fileNames
    .filter((file) => file.endsWith('.json'))
    .map((fileName) => {
      const fullPath = path.join(seriesDir, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      return JSON.parse(fileContents) as Series;
    });

  memoryCache.series = series;
  return series;
}

export async function getAllSeries(): Promise<Series[]> {
  if (HIDE_DUMMY_CONTENT) return [];
  if (process.env.NEXT_PUBLIC_BLOGGER_URL) {
    try {
      const liveSeries = await fetchBloggerSeries();
      if (liveSeries.length > 0) return liveSeries;
    } catch (err) {
      console.warn('Error fetching live Blogger series, falling back to local series:', err);
    }
  }
  return getLocalSeries();
}

export async function getSeriesBySlug(slug: string): Promise<Series | null> {
  const allSeries = await getAllSeries();
  return allSeries.find((s) => s.slug === slug) || null;
}

// -------------------------------------------------------------
// VIDEOS
// -------------------------------------------------------------

export function getLocalVideos(): Video[] {
  if (HIDE_DUMMY_CONTENT) return [];
  if (memoryCache.videos) return memoryCache.videos;

  const filePath = path.join(contentDirectory, 'videos.json');
  if (!fs.existsSync(filePath)) return [];
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const videos = JSON.parse(fileContents) as Video[];
    memoryCache.videos = videos;
    return videos;
  } catch {
    return [];
  }
}

export async function getAllVideos(): Promise<Video[]> {
  if (HIDE_DUMMY_CONTENT) return [];
  if (process.env.NEXT_PUBLIC_BLOGGER_URL) {
    try {
      const liveVideos = await fetchBloggerVideos();
      if (liveVideos.length > 0) return liveVideos;
    } catch (err) {
      console.warn('Error fetching live Blogger videos, falling back to local videos:', err);
    }
  }
  return getLocalVideos();
}

export async function getVideoById(id: string): Promise<Video | null> {
  const videos = await getAllVideos();
  return videos.find((v) => v.id === id) || null;
}

// -------------------------------------------------------------
// TAGS
// -------------------------------------------------------------

export async function getAllTags(includeScheduled: boolean = false): Promise<string[]> {
  const articles = await getAllArticles(includeScheduled);
  const tagSet = new Set<string>();
  for (const a of articles) {
    if (a.tags && Array.isArray(a.tags)) {
      for (const t of a.tags) {
        if (t.trim()) tagSet.add(t.trim());
      }
    }
  }
  return Array.from(tagSet);
}

// -------------------------------------------------------------
// STATIC PAGES
// -------------------------------------------------------------

export async function getPageContent(slug: string): Promise<PageContent | null> {
  const filePath = path.join(contentDirectory, 'pages', `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const pageData = JSON.parse(fileContents) as PageContent;
    const processedContent = await remark().use(html).process(pageData.content);
    return {
      ...pageData,
      contentHtml: processedContent.toString(),
    };
  } catch {
    return null;
  }
}

export function getAllPages(): string[] {
  const pagesDir = path.join(contentDirectory, 'pages');
  if (!fs.existsSync(pagesDir)) return [];
  return fs.readdirSync(pagesDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''));
}

// -------------------------------------------------------------
// TEAM
// -------------------------------------------------------------

export function getTeamMembers(): TeamMember[] {
  const filePath = path.join(contentDirectory, 'team.json');
  if (!fs.existsSync(filePath)) return [];
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents) as TeamMember[];
  } catch {
    return [];
  }
}
