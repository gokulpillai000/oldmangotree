import { createClient, SupabaseClient } from '@supabase/supabase-js';

function cleanEnvValue(raw?: string): string {
  if (!raw) return '';
  return raw
    .trim()
    .replace(/^[A-Z_][A-Z0-9_]*\s*=\s*/, '')
    .replace(/^['"]+|['"]+$/g, '')
    .trim();
}

const supabaseUrl = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey =
  cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

let supabaseInstance: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && /^https?:\/\//i.test(supabaseUrl) && supabaseAnonKey);
}

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return supabaseInstance;
}

// ----------------- Global Likes -----------------

export async function fetchArticleLikes(slug: string, clientId?: string): Promise<{ count: number; hasLiked: boolean }> {
  const client = getSupabase();
  if (!client || !slug) return { count: 0, hasLiked: false };

  try {
    const { count, error } = await client
      .from('article_likes')
      .select('*', { count: 'exact', head: true })
      .eq('article_slug', slug);

    if (error) throw error;

    let hasLiked = false;
    if (clientId) {
      const { data } = await client
        .from('article_likes')
        .select('id')
        .eq('article_slug', slug)
        .eq('client_id', clientId)
        .limit(1);
      hasLiked = Boolean(data && data.length > 0);
    }

    return { count: count || 0, hasLiked };
  } catch (err) {
    console.warn('Error fetching article likes:', err);
    return { count: 0, hasLiked: false };
  }
}

export async function toggleArticleLike(slug: string, clientId: string): Promise<{ count: number; hasLiked: boolean }> {
  const client = getSupabase();
  if (!client || !slug || !clientId) return { count: 0, hasLiked: false };

  try {
    // Check if already liked
    const { data: existing } = await client
      .from('article_likes')
      .select('id')
      .eq('article_slug', slug)
      .eq('client_id', clientId)
      .limit(1);

    if (existing && existing.length > 0) {
      // Remove like
      await client
        .from('article_likes')
        .delete()
        .eq('article_slug', slug)
        .eq('client_id', clientId);
    } else {
      // Add like
      await client
        .from('article_likes')
        .insert({
          article_slug: slug,
          client_id: clientId,
        });
    }

    // Return refreshed count
    return await fetchArticleLikes(slug, clientId);
  } catch (err) {
    console.warn('Error toggling article like:', err);
    return { count: 0, hasLiked: false };
  }
}

// ----------------- Global Comments -----------------

export interface ArticleComment {
  id: string;
  article_slug: string;
  author_name: string;
  content: string;
  created_at: string;
  is_approved?: boolean;
}

export async function fetchArticleComments(slug: string): Promise<ArticleComment[]> {
  const client = getSupabase();
  if (!client || !slug) return [];

  try {
    const { data, error } = await client
      .from('article_comments')
      .select('*')
      .eq('article_slug', slug)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Error fetching comments:', err);
    return [];
  }
}

export async function postArticleComment(slug: string, authorName: string, content: string): Promise<{ success: boolean; comment?: ArticleComment; error?: string }> {
  const client = getSupabase();
  if (!client) return { success: false, error: 'Database not connected' };

  try {
    const { data, error } = await client
      .from('article_comments')
      .insert({
        article_slug: slug,
        author_name: authorName.trim() || 'Reader',
        content: content.trim(),
        is_approved: true,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, comment: data };
  } catch (err: any) {
    console.error('Error posting comment:', err);
    return { success: false, error: err?.message || 'Failed to post comment' };
  }
}

// ----------------- Letters to Editor (Editorial Desk) -----------------

export interface ReaderLetter {
  id: string;
  article_slug?: string;
  article_title?: string;
  sender_name: string;
  sender_email: string;
  location?: string;
  letter_body: string;
  is_read: boolean;
  is_featured: boolean;
  created_at: string;
}

export async function submitLetterToEditor(data: {
  articleSlug?: string;
  articleTitle?: string;
  senderName: string;
  senderEmail: string;
  location?: string;
  letterBody: string;
}) {
  const client = getSupabase();
  if (!client) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const { error } = await client.from('letters_to_editor').insert({
      article_slug: data.articleSlug || 'general',
      article_title: data.articleTitle || 'General Webzine Feedback',
      sender_name: data.senderName.trim(),
      sender_email: data.senderEmail.trim(),
      location: data.location?.trim() || null,
      letter_body: data.letterBody.trim(),
      is_read: false,
      is_featured: false,
    });

    if (error) throw error;
    return { success: true, mode: 'supabase' };
  } catch (err: any) {
    console.error('Error submitting letter to Supabase:', err);
    return { success: false, error: err?.message || 'Failed to submit letter' };
  }
}

export async function fetchLettersToEditor(): Promise<ReaderLetter[]> {
  const client = getSupabase();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('letters_to_editor')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Error fetching reader letters:', err);
    return [];
  }
}

export async function markLetterAsRead(id: string, isRead: boolean = true): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const { error } = await client
      .from('letters_to_editor')
      .update({ is_read: isRead })
      .eq('id', id);

    return !error;
  } catch {
    return false;
  }
}

export async function toggleLetterFeatured(id: string, isFeatured: boolean): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const { error } = await client
      .from('letters_to_editor')
      .update({ is_featured: isFeatured })
      .eq('id', id);

    return !error;
  } catch {
    return false;
  }
}

// ----------------- Articles (Custom CMS) -----------------

export interface SupabaseArticleRecord {
  id?: string;
  slug: string;
  title: string;
  excerpt?: string;
  content_html: string;
  category: string;
  authors: string[];
  author_names: string;
  cover_image?: string;
  audio_narration_url?: string;
  audio_duration_seconds?: number;
  webzine_issue?: string;
  is_lead_story?: boolean;
  is_cover?: boolean;
  is_premium?: boolean;
  is_longform?: boolean;
  series_title?: string;
  series_episode?: number;
  tags?: string[];
  status: 'draft' | 'published' | 'scheduled';
  published_at?: string;
  updated_at?: string;
  created_at?: string;
}

function promoteMaturedScheduledArticles(client: SupabaseClient, data: SupabaseArticleRecord[] | null) {
  if (!data || data.length === 0) return;
  const nowMs = Date.now();
  const matured = data.filter(
    (a) => a.status === 'scheduled' && a.published_at && new Date(a.published_at).getTime() <= nowMs
  );
  if (matured.length > 0) {
    const maturedSlugs = matured.map((a) => a.slug);
    Promise.resolve(
      client
        .from('articles')
        .update({ status: 'published', updated_at: new Date().toISOString() })
        .in('slug', maturedSlugs)
    ).catch(() => {});

    for (const item of data) {
      if (maturedSlugs.includes(item.slug)) {
        item.status = 'published';
      }
    }
  }
}

export async function fetchSupabaseArticles(): Promise<SupabaseArticleRecord[]> {
  const client = getSupabase();
  if (!client) return [];

  try {
    const nowIso = new Date().toISOString();
    // Query published or scheduled stories whose published_at is in the past or now
    const { data, error } = await client
      .from('articles')
      .select('*')
      .in('status', ['published', 'scheduled'])
      .lte('published_at', nowIso)
      .order('published_at', { ascending: false });

    if (error) {
      console.warn('Error fetching Supabase articles with query, using memory filter:', error);
      const { data: allData, error: err2 } = await client
        .from('articles')
        .select('*')
        .order('published_at', { ascending: false });

      if (err2 || !allData) throw error;

      const nowMs = Date.now();
      return allData.filter((a: any) => {
        if (a.status === 'draft') return false;
        const pubMs = new Date(a.published_at || 0).getTime();
        return pubMs <= nowMs;
      });
    }

    promoteMaturedScheduledArticles(client, data);
    return data || [];
  } catch (err) {
    console.warn('Error fetching Supabase articles:', err);
    return [];
  }
}

export async function fetchSupabaseArticlesAndDrafts(): Promise<SupabaseArticleRecord[]> {
  const client = getSupabase();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('articles')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    promoteMaturedScheduledArticles(client, data);
    return data || [];
  } catch (err) {
    console.warn('Error fetching articles & drafts:', err);
    return [];
  }
}

export async function deleteSupabaseArticle(slug: string): Promise<boolean> {
  const client = getSupabase();
  if (!client || !slug) return false;

  try {
    const { error } = await client
      .from('articles')
      .delete()
      .eq('slug', slug);

    return !error;
  } catch {
    return false;
  }
}

export async function deleteLetterToEditor(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client || !id) return false;

  try {
    const { error } = await client
      .from('letters_to_editor')
      .delete()
      .eq('id', id);

    return !error;
  } catch {
    return false;
  }
}

export async function fetchSupabaseArticleBySlug(slug: string): Promise<SupabaseArticleRecord | null> {
  const client = getSupabase();
  if (!client || !slug) return null;

  try {
    const { data, error } = await client
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Error fetching Supabase article by slug:', err);
    return null;
  }
}

export async function saveSupabaseArticle(article: SupabaseArticleRecord): Promise<{ success: boolean; data?: any; error?: string }> {
  const client = getSupabase();
  if (!client) return { success: false, error: 'Database not connected' };

  try {
    const payload: any = {
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt || '',
      content_html: article.content_html,
      category: article.category || '',
      authors: article.authors?.length ? article.authors : ['akhil-u-krishnan'],
      author_names: article.author_names || 'Akhil U Krishnan',
      cover_image: article.cover_image || null,
      audio_narration_url: article.audio_narration_url || null,
      audio_duration_seconds: article.audio_duration_seconds || null,
      webzine_issue: article.webzine_issue || null,
      is_lead_story: Boolean(article.is_lead_story),
      is_cover: Boolean(article.is_cover),
      is_premium: Boolean(article.is_premium),
      is_longform: Boolean(article.is_longform),
      series_title: article.series_title || null,
      series_episode: article.series_episode || null,
      tags: article.tags?.length ? article.tags : (article.category ? [article.category] : []),
      status: article.status || 'published',
      published_at: article.published_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('articles')
      .upsert(payload, { onConflict: 'slug' })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error('Error saving article to Supabase:', err);
    return { success: false, error: err?.message || 'Failed to save article' };
  }
}

// ----------------- Realtime Subscriptions -----------------

export function subscribeToArticleLikes(slug: string, onChange: () => void): () => void {
  const client = getSupabase();
  if (!client || !slug) return () => {};

  try {
    const channel = client
      .channel(`likes-realtime-${slug}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'article_likes',
          filter: `article_slug=eq.${slug}`,
        },
        () => {
          onChange();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch {
    return () => {};
  }
}

export function subscribeToArticleComments(
  slug: string,
  onCommentChange: () => void
): () => void {
  const client = getSupabase();
  if (!client || !slug) return () => {};

  try {
    const channel = client
      .channel(`comments-realtime-${slug}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'article_comments',
          filter: `article_slug=eq.${slug}`,
        },
        () => {
          onCommentChange();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch {
    return () => {};
  }
}

// ----------------- Authors & Packets Directory Sync -----------------

export async function fetchSupabaseAuthors(): Promise<string[]> {
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('authors')
      .select('name')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map((a) => a.name).filter(Boolean);
  } catch (err) {
    console.warn('Error fetching Supabase authors:', err);
    return [];
  }
}

export async function saveSupabaseAuthor(name: string, role: string = 'Writer'): Promise<boolean> {
  const client = getSupabase();
  if (!client || !name.trim()) return false;
  try {
    const { error } = await client
      .from('authors')
      .upsert({ name: name.trim(), role }, { onConflict: 'name' });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteSupabaseAuthor(name: string): Promise<boolean> {
  const client = getSupabase();
  if (!client || !name.trim()) return false;
  try {
    const { error } = await client
      .from('authors')
      .delete()
      .eq('name', name.trim());
    return !error;
  } catch {
    return false;
  }
}

export async function fetchSupabasePackets(): Promise<string[]> {
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('issue_packets')
      .select('name')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map((p) => p.name).filter(Boolean);
  } catch (err) {
    console.warn('Error fetching Supabase issue packets:', err);
    return [];
  }
}

export async function saveSupabasePacket(name: string): Promise<boolean> {
  const client = getSupabase();
  if (!client || !name.trim()) return false;
  try {
    const { error } = await client
      .from('issue_packets')
      .upsert({ name: name.trim() }, { onConflict: 'name' });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteSupabasePacket(name: string): Promise<boolean> {
  const client = getSupabase();
  if (!client || !name.trim()) return false;
  try {
    const { error } = await client
      .from('issue_packets')
      .delete()
      .eq('name', name.trim());
    return !error;
  } catch {
    return false;
  }
}
