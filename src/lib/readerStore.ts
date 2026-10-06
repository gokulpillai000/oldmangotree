export interface SavedArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  coverImage?: string;
  authorNames?: string;
  publishedAt: string;
  savedAt?: string;
}

const BOOKMARKS_KEY = 'omt_bookmarks';
const HISTORY_KEY = 'omt_reading_history';
const REACTIONS_KEY = 'omt_reactions';

function isClient(): boolean {
  return typeof window !== 'undefined';
}

function notifyUpdate(): void {
  if (isClient()) {
    window.dispatchEvent(new CustomEvent('omt-reader-updated'));
  }
}

// ================= BOOKMARKS =================

export function getBookmarks(): SavedArticle[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isBookmarked(slug: string): boolean {
  const list = getBookmarks();
  return list.some((a) => a.slug === slug);
}

export function toggleBookmark(article: SavedArticle): boolean {
  if (!isClient()) return false;
  try {
    const list = getBookmarks();
    const index = list.findIndex((a) => a.slug === article.slug);
    let nowBookmarked = false;

    if (index >= 0) {
      list.splice(index, 1);
      nowBookmarked = false;
    } else {
      list.unshift({
        ...article,
        savedAt: new Date().toISOString(),
      });
      nowBookmarked = true;
    }

    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list));
    notifyUpdate();
    return nowBookmarked;
  } catch {
    return false;
  }
}

export function removeBookmark(slug: string): void {
  if (!isClient()) return;
  try {
    const list = getBookmarks().filter((a) => a.slug !== slug);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list));
    notifyUpdate();
  } catch {}
}

// ================= READING HISTORY =================

export function getReadingHistory(): SavedArticle[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordReadArticle(article: SavedArticle): void {
  if (!isClient() || !article.slug) return;
  try {
    const list = getReadingHistory().filter((a) => a.slug !== article.slug);
    list.unshift({
      ...article,
      savedAt: new Date().toISOString(),
    });
    // Keep last 30 read articles
    const trimmed = list.slice(0, 30);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    notifyUpdate();
  } catch {}
}

export function clearReadingHistory(): void {
  if (!isClient()) return;
  try {
    localStorage.removeItem(HISTORY_KEY);
    notifyUpdate();
  } catch {}
}

// ================= ARTICLE REACTIONS =================

import { fetchArticleLikes, toggleArticleLike } from './supabase';

export interface ReactionState {
  count: number;
  hasReacted: boolean;
}

export function getOrCreateClientId(): string {
  if (!isClient()) return 'server';
  try {
    let id = localStorage.getItem('omt_client_id');
    if (!id) {
      id = 'reader_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem('omt_client_id', id);
    }
    return id;
  } catch {
    return 'anon_reader';
  }
}

export function getArticleReactions(slug: string): ReactionState {
  if (!isClient()) return { count: 0, hasReacted: false };
  try {
    const raw = localStorage.getItem(`${REACTIONS_KEY}_${slug}`);
    if (raw) {
      return JSON.parse(raw);
    }
    return { count: 0, hasReacted: false };
  } catch {
    return { count: 0, hasReacted: false };
  }
}

export async function syncArticleReactions(slug: string): Promise<ReactionState> {
  if (!isClient() || !slug) return { count: 0, hasReacted: false };
  const clientId = getOrCreateClientId();
  try {
    const remote = await fetchArticleLikes(slug, clientId);
    const updated: ReactionState = { count: remote.count, hasReacted: remote.hasLiked };
    localStorage.setItem(`${REACTIONS_KEY}_${slug}`, JSON.stringify(updated));
    notifyUpdate();
    return updated;
  } catch {
    return getArticleReactions(slug);
  }
}

export async function toggleReactionRemote(slug: string): Promise<ReactionState> {
  if (!isClient() || !slug) return { count: 0, hasReacted: false };
  const clientId = getOrCreateClientId();
  
  // Instant optimistic local update
  const current = getArticleReactions(slug);
  const optimistic: ReactionState = {
    count: current.hasReacted ? Math.max(0, current.count - 1) : current.count + 1,
    hasReacted: !current.hasReacted,
  };
  localStorage.setItem(`${REACTIONS_KEY}_${slug}`, JSON.stringify(optimistic));
  notifyUpdate();

  // Background sync with Supabase
  try {
    const remote = await toggleArticleLike(slug, clientId);
    const finalized: ReactionState = { count: remote.count, hasReacted: remote.hasLiked };
    localStorage.setItem(`${REACTIONS_KEY}_${slug}`, JSON.stringify(finalized));
    notifyUpdate();
    return finalized;
  } catch {
    return optimistic;
  }
}

export function toggleReaction(slug: string): ReactionState {
  // Synchronous wrapper that triggers the remote toggle
  toggleReactionRemote(slug);
  const current = getArticleReactions(slug);
  return {
    count: current.hasReacted ? Math.max(0, current.count - 1) : current.count + 1,
    hasReacted: !current.hasReacted,
  };
}
