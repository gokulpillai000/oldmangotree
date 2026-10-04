import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase Client & Helper Functions
 * 
 * Recommended SQL Schema to run in Supabase SQL Editor:
 * 
 * create table public.profiles (
 *   id uuid references auth.users on delete cascade primary key,
 *   email text,
 *   full_name text,
 *   role text default 'reader', -- 'reader', 'contributor', 'editor', 'admin'
 *   is_subscriber boolean default false,
 *   created_at timestamp with time zone default timezone('utc'::text, now())
 * );
 * 
 * create table public.bookmarks (
 *   id uuid default gen_random_uuid() primary key,
 *   user_id uuid references auth.users on delete cascade,
 *   slug text not null,
 *   title text not null,
 *   category text,
 *   cover_image text,
 *   author_names text,
 *   created_at timestamp with time zone default timezone('utc'::text, now()),
 *   unique(user_id, slug)
 * );
 * 
 * create table public.letters_to_editor (
 *   id uuid default gen_random_uuid() primary key,
 *   article_slug text,
 *   article_title text,
 *   sender_name text not null,
 *   sender_email text not null,
 *   letter_body text not null,
 *   created_at timestamp with time zone default timezone('utc'::text, now())
 * );
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
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

// ----------------- Auth Helpers -----------------

export async function getCurrentUser() {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data: { session } } = await client.auth.getSession();
    return session?.user || null;
  } catch {
    return null;
  }
}

// ----------------- Bookmarks Sync -----------------

export async function fetchRemoteBookmarks(userId: string) {
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Error fetching Supabase bookmarks:', err);
    return [];
  }
}

export async function saveRemoteBookmark(userId: string, article: {
  slug: string;
  title: string;
  category?: string;
  coverImage?: string;
  authorNames?: string;
}) {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('bookmarks').upsert({
      user_id: userId,
      slug: article.slug,
      title: article.title,
      category: article.category || 'politics',
      cover_image: article.coverImage || '',
      author_names: article.authorNames || '',
    });
    return !error;
  } catch (err) {
    console.warn('Error saving bookmark to Supabase:', err);
    return false;
  }
}

export async function removeRemoteBookmark(userId: string, slug: string) {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('slug', slug);
    return !error;
  } catch (err) {
    console.warn('Error deleting bookmark from Supabase:', err);
    return false;
  }
}

// ----------------- Letters to Editor -----------------

export async function submitLetterToEditor(data: {
  articleSlug?: string;
  articleTitle?: string;
  senderName: string;
  senderEmail: string;
  letterBody: string;
}) {
  const client = getSupabase();
  if (!client) {
    // If Supabase not configured, log locally
    console.log('[LOCAL FALLBACK] Letter submitted:', data);
    return { success: true, mode: 'local' };
  }

  try {
    const { error } = await client.from('letters_to_editor').insert({
      article_slug: data.articleSlug,
      article_title: data.articleTitle,
      sender_name: data.senderName,
      sender_email: data.senderEmail,
      letter_body: data.letterBody,
    });
    if (error) throw error;
    return { success: true, mode: 'supabase' };
  } catch (err: any) {
    console.error('Error submitting letter to Supabase:', err);
    return { success: false, error: err?.message || 'Failed to submit' };
  }
}
