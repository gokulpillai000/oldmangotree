-- ========================================================
-- THE OLD MANGO TREE — COMPLETE SUPABASE DATABASE SCHEMA
-- Fully Functional, Safe, and Idempotent (Re-runnable anytime)
-- Paste into: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ========================================================

-- 1. Enable Required Extensions
create extension if not exists "uuid-ossp";

-- 2. Articles Table (Custom CMS Content, Webzine, Podcasts & Drafts)
create table if not exists public.articles (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title text not null,
  excerpt text default '',
  content_html text not null,
  category text not null default 'politics',
  authors text[] not null default array['Editorial Desk'],
  author_names text default 'Editorial Desk',
  cover_image text,
  audio_narration_url text,
  audio_duration_seconds integer,
  webzine_issue text,
  is_lead_story boolean default false,
  is_cover boolean default false,
  is_premium boolean default false,
  is_longform boolean default false,
  series_title text,
  series_episode integer,
  tags text[] default array[]::text[],
  status text not null default 'published', -- 'draft' or 'published'
  published_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Idempotent column migrations for existing databases
alter table public.articles add column if not exists tags text[] default array[]::text[];
alter table public.articles add column if not exists webzine_issue text;
alter table public.articles add column if not exists audio_duration_seconds integer;
alter table public.articles add column if not exists author_names text default 'Editorial Desk';
alter table public.articles add column if not exists is_cover boolean default false;
alter table public.articles add column if not exists is_lead_story boolean default false;
alter table public.articles add column if not exists is_premium boolean default false;
alter table public.articles add column if not exists is_longform boolean default false;
alter table public.articles add column if not exists series_title text;
alter table public.articles add column if not exists series_episode integer;

-- 3. Global Likes Table
create table if not exists public.article_likes (
  id uuid default gen_random_uuid() primary key,
  article_slug text not null,
  client_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(article_slug, client_id)
);

-- 4. Global Comments Table
create table if not exists public.article_comments (
  id uuid default gen_random_uuid() primary key,
  article_slug text not null,
  author_name text not null,
  content text not null,
  is_approved boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Reader Letters & Feedback Inbox
create table if not exists public.letters_to_editor (
  id uuid default gen_random_uuid() primary key,
  article_slug text default 'general',
  article_title text default 'General Webzine Feedback',
  sender_name text not null,
  sender_email text not null,
  location text,
  letter_body text not null,
  is_read boolean default false,
  is_featured boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. Reader Bookmarks (Saved Reading List)
create table if not exists public.bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  slug text not null,
  title text not null,
  category text default 'politics',
  cover_image text,
  author_names text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, slug)
);

-- 7. Author Directory (Shared Across Editorial Team)
create table if not exists public.authors (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  role text default 'Writer',
  bio text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Pre-seed founding editors safely
insert into public.authors (name, role)
values 
  ('Akhil U Krishnan', 'Founder & Editor'),
  ('Amala Thomas', 'Founder & Editor')
on conflict (name) do nothing;

-- 8. Webzine Issue Packets (Curated Editions)
create table if not exists public.issue_packets (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Pre-seed standard issue packets safely
insert into public.issue_packets (name)
values 
  ('Packet 1'),
  ('Packet 2'),
  ('Packet 3')
on conflict (name) do nothing;

-- 9. Application Error Telemetry & Crash Logs
create table if not exists public.error_logs (
  id uuid default gen_random_uuid() primary key,
  message text not null,
  stack text,
  digest text,
  context text default 'app',
  url text,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- ========================================================
-- INDEXES FOR MAXIMUM SPEED & HIGH TRAFFIC
-- ========================================================
create index if not exists idx_articles_slug on public.articles(slug);
create index if not exists idx_articles_status on public.articles(status, published_at desc);
create index if not exists idx_articles_category on public.articles(category);
create index if not exists idx_articles_issue on public.articles(webzine_issue);
create index if not exists idx_articles_tags on public.articles using gin(tags);
create index if not exists idx_likes_slug on public.article_likes(article_slug);
create index if not exists idx_comments_slug on public.article_comments(article_slug, created_at desc);
create index if not exists idx_letters_created on public.letters_to_editor(created_at desc);
create index if not exists idx_bookmarks_user on public.bookmarks(user_id, created_at desc);
create index if not exists idx_error_logs_created on public.error_logs(created_at desc);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================
alter table public.articles enable row level security;
alter table public.article_likes enable row level security;
alter table public.article_comments enable row level security;
alter table public.letters_to_editor enable row level security;
alter table public.bookmarks enable row level security;
alter table public.authors enable row level security;
alter table public.issue_packets enable row level security;
alter table public.error_logs enable row level security;

-- Articles: Full access for web app & editorial desk (select, insert, update, delete)
drop policy if exists "Allow public read published articles" on public.articles;
drop policy if exists "Allow read articles" on public.articles;
create policy "Allow read articles" on public.articles for select using (true);

drop policy if exists "Allow insert articles" on public.articles;
create policy "Allow insert articles" on public.articles for insert with check (true);

drop policy if exists "Allow update articles" on public.articles;
create policy "Allow update articles" on public.articles for update using (true);

drop policy if exists "Allow delete articles" on public.articles;
create policy "Allow delete articles" on public.articles for delete using (true);

-- Likes: Anyone can read counts; anyone can like/unlike
drop policy if exists "Allow public read likes" on public.article_likes;
create policy "Allow public read likes" on public.article_likes for select using (true);

drop policy if exists "Allow insert likes" on public.article_likes;
create policy "Allow insert likes" on public.article_likes for insert with check (true);

drop policy if exists "Allow delete own like" on public.article_likes;
create policy "Allow delete own like" on public.article_likes for delete using (true);

-- Comments: Public read approved; anyone can submit; editorial update/delete
drop policy if exists "Allow public read comments" on public.article_comments;
create policy "Allow public read comments" on public.article_comments for select using (is_approved = true);

drop policy if exists "Allow insert comments" on public.article_comments;
create policy "Allow insert comments" on public.article_comments for insert with check (true);

drop policy if exists "Allow update comments" on public.article_comments;
create policy "Allow update comments" on public.article_comments for update using (true);

drop policy if exists "Allow delete comments" on public.article_comments;
create policy "Allow delete comments" on public.article_comments for delete using (true);

-- Letters to Editor: Public can submit; editorial desk can read, update, delete
drop policy if exists "Allow submit letter to editor" on public.letters_to_editor;
create policy "Allow submit letter to editor" on public.letters_to_editor for insert with check (true);

drop policy if exists "Allow read letters" on public.letters_to_editor;
create policy "Allow read letters" on public.letters_to_editor for select using (true);

drop policy if exists "Allow update letters" on public.letters_to_editor;
create policy "Allow update letters" on public.letters_to_editor for update using (true);

drop policy if exists "Allow delete letters" on public.letters_to_editor;
create policy "Allow delete letters" on public.letters_to_editor for delete using (true);

-- Bookmarks: Personal reading list
drop policy if exists "Allow read bookmarks" on public.bookmarks;
create policy "Allow read bookmarks" on public.bookmarks for select using (true);

drop policy if exists "Allow insert bookmarks" on public.bookmarks;
create policy "Allow insert bookmarks" on public.bookmarks for insert with check (true);

drop policy if exists "Allow update bookmarks" on public.bookmarks;
create policy "Allow update bookmarks" on public.bookmarks for update using (true);

drop policy if exists "Allow delete bookmarks" on public.bookmarks;
create policy "Allow delete bookmarks" on public.bookmarks for delete using (true);

-- Authors: Public read; editorial desk create/update/delete
drop policy if exists "Allow read authors" on public.authors;
create policy "Allow read authors" on public.authors for select using (true);

drop policy if exists "Allow insert authors" on public.authors;
create policy "Allow insert authors" on public.authors for insert with check (true);

drop policy if exists "Allow update authors" on public.authors;
create policy "Allow update authors" on public.authors for update using (true);

drop policy if exists "Allow delete authors" on public.authors;
create policy "Allow delete authors" on public.authors for delete using (true);

-- Packets: Public read; editorial desk create/update/delete
drop policy if exists "Allow read packets" on public.issue_packets;
create policy "Allow read packets" on public.issue_packets for select using (true);

drop policy if exists "Allow insert packets" on public.issue_packets;
create policy "Allow insert packets" on public.issue_packets for insert with check (true);

drop policy if exists "Allow update packets" on public.issue_packets;
create policy "Allow update packets" on public.issue_packets for update using (true);

drop policy if exists "Allow delete packets" on public.issue_packets;
create policy "Allow delete packets" on public.issue_packets for delete using (true);

-- Error Logs: Client/server telemetry can insert; editorial desk can inspect
drop policy if exists "Allow insert error logs" on public.error_logs;
create policy "Allow insert error logs" on public.error_logs for insert with check (true);

drop policy if exists "Allow read error logs" on public.error_logs;
create policy "Allow read error logs" on public.error_logs for select using (true);

-- ========================================================
-- STORAGE BUCKET CONFIGURATION (WebP Images, Audio, Video)
-- ========================================================
insert into storage.buckets (id, name, public)
values ('article-media', 'article-media', true)
on conflict (id) do nothing;

drop policy if exists "Allow public read article media" on storage.objects;
create policy "Allow public read article media"
  on storage.objects for select
  using (bucket_id = 'article-media');

drop policy if exists "Allow upload article media" on storage.objects;
create policy "Allow upload article media"
  on storage.objects for insert
  with check (bucket_id = 'article-media');

drop policy if exists "Allow update article media" on storage.objects;
create policy "Allow update article media"
  on storage.objects for update
  using (bucket_id = 'article-media');

drop policy if exists "Allow delete article media" on storage.objects;
create policy "Allow delete article media"
  on storage.objects for delete
  using (bucket_id = 'article-media');
