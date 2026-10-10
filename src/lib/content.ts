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
import {
  isAudioArticle,
  mapSupabaseRecordToArticle,
  mapSupabaseRecordToPodcast,
  filterCategoryArticles,
  buildIssuesFromArticles,
  buildSeriesFromArticles,
} from './articleHelpers';

export {
  isAudioArticle,
  mapSupabaseRecordToArticle,
  mapSupabaseRecordToPodcast,
  filterCategoryArticles,
  buildIssuesFromArticles,
  buildSeriesFromArticles,
};

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

export async function getAllArticles(includeScheduled: boolean = false): Promise<Article[]> {
  // 1. Fetch live articles from Supabase Custom CMS
  let supabaseArticles: Article[] = [];
  try {
    const rawSupabase = await fetchSupabaseArticles();
    if (rawSupabase && rawSupabase.length > 0) {
      supabaseArticles = rawSupabase
        .map(mapSupabaseRecordToArticle)
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
      if (!includeScheduled && supArticle.status === 'draft') {
        return null;
      }
      const mapped = mapSupabaseRecordToArticle(supArticle);
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
  return filterCategoryArticles(articles, categorySlug);
}

export async function getArticlesByTag(tag: string, includeScheduled: boolean = false): Promise<Article[]> {
  const articles = await getAllArticles(includeScheduled);
  const cleanTag = tag.toLowerCase().trim();
  const isAudioTag = ['podcast', 'podcasts', 'audio & podcast', 'audio story', 'audio'].includes(cleanTag);
  return articles.filter((a) => {
    const isAudio = isAudioArticle(a);
    if (!isAudioTag && isAudio) return false;
    if (isAudioTag && !isAudio) return false;
    return a.tags?.some((t) => t.toLowerCase().trim() === cleanTag);
  });
}

export function getRelatedArticles(article: Article, limit: number = 3, pool?: Article[]): Article[] {
  const isCurrentAudio = isAudioArticle(article);
  const allArticles = (pool || getLocalArticles(false))
    .filter((a) => a.slug !== article.slug)
    .filter((a) => (isCurrentAudio ? isAudioArticle(a) : !isAudioArticle(a)));

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
  const allArticles = await getAllArticles(false);
  const liveIssues = buildIssuesFromArticles(allArticles);

  let bloggerPackets: IssuePacket[] = [];
  if (process.env.NEXT_PUBLIC_BLOGGER_URL) {
    try {
      bloggerPackets = await fetchBloggerPackets();
    } catch (err) {
      console.warn('Error fetching live Blogger packets:', err);
    }
  }

  for (const bp of bloggerPackets) {
    if (!liveIssues.some((li) => li.id === bp.id || li.issueNumber === bp.issueNumber)) {
      liveIssues.push(bp);
    }
  }

  if (liveIssues.length > 0) {
    return liveIssues.sort((a, b) => b.issueNumber - a.issueNumber);
  }

  if (HIDE_DUMMY_CONTENT) return [];
  return getLocalIssues();
}

export async function getIssueById(id: string): Promise<IssuePacket | null> {
  const issues = await getAllIssues();
  const cleanTarget = id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return (
    issues.find((i) => {
      const cleanId = i.id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      return cleanId === cleanTarget || i.id.toLowerCase() === id.toLowerCase();
    }) || null
  );
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
      .filter((art) => isAudioArticle(art))
      .map(mapSupabaseRecordToPodcast);
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
  const allArticles = await getAllArticles(false);
  const liveSeries = buildSeriesFromArticles(allArticles);

  let bloggerSeries: Series[] = [];
  if (process.env.NEXT_PUBLIC_BLOGGER_URL) {
    try {
      bloggerSeries = await fetchBloggerSeries();
    } catch (err) {
      console.warn('Error fetching live Blogger series:', err);
    }
  }

  for (const bs of bloggerSeries) {
    if (!liveSeries.some((ls) => ls.slug === bs.slug)) {
      liveSeries.push(bs);
    }
  }

  if (liveSeries.length > 0) {
    return liveSeries.sort((a, b) => {
      const latestA = a.episodes[a.episodes.length - 1]?.publishedAt || '';
      const latestB = b.episodes[b.episodes.length - 1]?.publishedAt || '';
      return new Date(latestB).getTime() - new Date(latestA).getTime();
    });
  }

  if (HIDE_DUMMY_CONTENT) return [];
  return getLocalSeries();
}

export async function getSeriesBySlug(slug: string): Promise<Series | null> {
  const allSeries = await getAllSeries();
  const cleanTarget = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return (
    allSeries.find((s) => {
      const cleanSlug = s.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      return cleanSlug === cleanTarget || s.slug.toLowerCase() === slug.toLowerCase();
    }) || null
  );
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
