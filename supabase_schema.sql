-- ========================================================
-- OLD MANGO TREE — SUPABASE DATABASE SCHEMA
-- Run this in your Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ========================================================

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Articles Table (Custom CMS Content & Drafts)
create table if not exists public.articles (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title text not null,
  excerpt text,
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
  status text not null default 'published', -- 'draft', 'published'
  published_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

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

-- 5. Letters to the Editor Table (Editorial Inbox)
create table if not exists public.letters_to_editor (
  id uuid default gen_random_uuid() primary key,
  article_slug text,
  article_title text,
  sender_name text not null,
  sender_email text not null,
  location text,
  letter_body text not null,
  is_read boolean default false,
  is_featured boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. High-Performance Query Indexes
create index if not exists idx_articles_slug on public.articles(slug);
create index if not exists idx_articles_status on public.articles(status, published_at desc);
create index if not exists idx_likes_slug on public.article_likes(article_slug);
create index if not exists idx_comments_slug on public.article_comments(article_slug, created_at desc);
create index if not exists idx_letters_created on public.letters_to_editor(created_at desc);

-- 7. Row Level Security (RLS) Setup
alter table public.articles enable row level security;
alter table public.article_likes enable row level security;
alter table public.article_comments enable row level security;
alter table public.letters_to_editor enable row level security;

-- Articles: Anyone can read published articles; anyone can insert/update (or editor PIN)
create policy "Allow public read published articles"
  on public.articles for select
  using (status = 'published');

create policy "Allow insert articles"
  on public.articles for insert
  with check (true);

create policy "Allow update articles"
  on public.articles for update
  using (true);

-- Likes: Anyone can read counts; anyone can like/unlike
create policy "Allow public read likes"
  on public.article_likes for select
  using (true);

create policy "Allow insert likes"
  on public.article_likes for insert
  with check (true);

create policy "Allow delete own like"
  on public.article_likes for delete
  using (true);

-- Comments: Anyone can read approved comments; anyone can submit comment
create policy "Allow public read comments"
  on public.article_comments for select
  using (is_approved = true);

create policy "Allow insert comments"
  on public.article_comments for insert
  with check (true);

-- Letters: Anyone can submit a letter; anyone with anon key can read for editorial desk
create policy "Allow submit letter to editor"
  on public.letters_to_editor for insert
  with check (true);

create policy "Allow read letters"
  on public.letters_to_editor for select
  using (true);

create policy "Allow update letters"
  on public.letters_to_editor for update
  using (true);

-- 8. Storage Bucket for WebP Images
insert into storage.buckets (id, name, public)
values ('article-media', 'article-media', true)
on conflict (id) do nothing;

create policy "Allow public read article media"
  on storage.objects for select
  using (bucket_id = 'article-media');

create policy "Allow upload article media"
  on storage.objects for insert
  with check (bucket_id = 'article-media');
