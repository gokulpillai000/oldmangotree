# Old Mango Tree (`oldmangotree`)

**Old Mango Tree** is a bilingual (Malayalam & English) digital magazine, curated webzine, and audio/podcast publication platform built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

Founded by **Akhil U Krishnan** and **Amala Thomas**.

---

## 1. What This Application Does

- **Editorial Reading Experience**: Delivers long-form journalism, cultural essays, political commentary, cinema & literary criticism, serialized investigations (*Special Series*), and curated issue editions (*Webzine Packets*).
- **Dedicated Audio & Podcast Section**: Audio stories and podcast episodes are strictly isolated to `/podcasts` (`Audio & Podcast`) and streamed through a persistent floating audio player (`AudioContext` + `AudioPlayer`) that continues playing across route transitions.
- **Custom Editorial Desk & CMS (`/publisher`)**:
  - **Story Studio (`ArticleStudio.tsx`)**: Rich-text WYSIWYG & HTML editor (`RichTextEditor.tsx`), live reader preview modal (`ArticlePreviewModal.tsx`), WebP image compression & Supabase Storage upload (`imageUpload.ts`), audio file upload, draft saving, and scheduled future publishing with automatic release promotion.
  - **Reader Letters & Feedback Inbox**: Clean split-pane inbox for reading, searching, filtering, selecting, marking as read, and deleting reader letters submitted from articles.
  - **Contributor & Issue Packet Pools**: Manage founding editors (**Akhil U Krishnan** and **Amala Thomas**), guest writers, and Webzine issue packets.
- **Reader Engagement**: Real-time article likes (`article_likes`), reader comments (`article_comments`), personal reading list bookmarks (`readerStore.ts`), and letters to the editor (`letters_to_editor`).
- **Error Telemetry**: Automatic client and error-boundary crash reporting (`src/lib/errorLogger.ts`) persisted to Supabase (`public.error_logs`).

---

## 2. Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DATA SOURCES (PRIORITY ORDER)                    │
│  1. Supabase PostgreSQL (`articles`, `authors`, `issue_packets`, etc.)  │
│  2. Public Blogger JSON Feed (`src/lib/blogger.ts`, optional)           │
│  3. Local Markdown/JSON Fallback (`content/`, disabled in prod)         │
└───────────────────┬─────────────────────────────────┬───────────────────┘
                    │                                 │
        Server Components (SSR/ISR)         Client Hydration & Live Sync
      (`src/lib/content.ts` +               (`src/lib/liveArticles.ts` +
       `src/lib/articleHelpers.ts`)          Supabase Realtime Channel)
                    │                                 │
                    ▼                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         READER & EDITORIAL UI                           │
│  • Home (`LiveHomeLead`, `LiveHomeGrid`, `LiveWebzineSection`)          │
│  • Article Reader (`ArticleViewClient`, `ArticleBody`, non-interactive  │
│    protected inline images, `ArticleEngagementBar`, `ArticleComments`)  │
│  • Sections (`/[category]`, `/webzine`, `/series`, `/podcasts`)         │
│  • Editorial Desk (`/publisher` -> `ArticleStudio` + Letters Inbox)     │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Flows
1. **Publishing Flow**:
   - Editors authenticate at `/publisher` via `POST /api/auth` (`action: 'pin_login'`), receiving an HMAC-SHA256 signed session cookie and Bearer token.
   - Stories are composed in `ArticleStudio.tsx`, media is uploaded to the Supabase `article-media` bucket, and records are upserted into `public.articles` (`status`: `'draft' | 'scheduled' | 'published'`).
   - Clicking **Update Live Site** broadcasts `notifyContentUpdated()` across client tabs and calls `POST /api/revalidate` with the publisher's signed session token to purge Next.js server caches.
2. **Scheduled Auto-Release**:
   - When `fetchSupabaseArticles()` runs and encounters a `'scheduled'` article whose `published_at <= now()`, `promoteMaturedScheduledArticles()` automatically promotes its status to `'published'`.
3. **Category & Audio Isolation (`src/lib/articleHelpers.ts`)**:
   - `isAudioArticle()` and `filterCategoryArticles()` ensure that stories uploaded under `Audio & Podcast` appear exclusively in `/podcasts` and never leak into regular text article categories.

---

## 3. Project Structure

```text
├── content/                  # Local fallback JSON/Markdown data & salted user hashes
├── public/                   # Static assets, logos, and custom TrueCopy web fonts
├── src/
│   ├── app/                  # Next.js 14 App Router pages & API routes
│   │   ├── [category]/       # Dynamic category feeds & article routes
│   │   ├── api/              # Server API routes (auth, articles, issues, letters, revalidate)
│   │   ├── articles/[slug]/  # Canonical article reader route
│   │   ├── podcasts/         # Dedicated Audio & Podcast hub
│   │   ├── publisher/        # Editorial Desk CMS & Reader Letters Inbox
│   │   ├── series/           # Serialized investigative features
│   │   ├── webzine/          # Curated Webzine Issue Packets
│   │   ├── error.tsx         # Route error boundary (connected to errorLogger)
│   │   └── global-error.tsx  # Root layout error boundary (connected to errorLogger)
│   ├── components/           # UI components
│   │   ├── cms/              # Editorial CMS components (ArticleStudio, RichTextEditor, Preview)
│   │   └── ...               # Reader components (Header, Footer, ArticleBody, AudioPlayer, etc.)
│   └── lib/                  # Core business logic & data clients
│       ├── articleHelpers.ts # Canonical isomorphic mapping, filtering, issue & series builders
│       ├── auth.ts           # Server auth (scrypt hashing, HMAC-SHA256 signed tokens)
│       ├── clientAuth.ts     # Client session storage & SHA-256 PIN digest verification
│       ├── content.ts        # Server-side data loader (Supabase + Blogger + local fallback)
│       ├── errorLogger.ts    # Error formatting & Supabase error_logs telemetry
│       ├── imageUpload.ts    # Client-side WebP image compression & audio upload to Supabase
│       ├── liveArticles.ts   # Client-side live cache & Supabase Realtime subscription manager
│       └── supabase.ts       # Supabase client & database CRUD operations
└── supabase_schema.sql       # Complete idempotent PostgreSQL schema, indexes & RLS policies
```

---

## 4. Getting Started

### Prerequisites
- **Node.js** 18.17+ (Node 20+ recommended)
- **npm** 9+
- A **Supabase** project

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and fill in your credentials:
```bash
cp .env.example .env.local
```

Required variables in `.env.local`:
| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase public anon/publishable key |
| `AUTH_SECRET` | Secret key used to sign session tokens with HMAC-SHA256 |
| `EDITORIAL_DESK_PIN` | Server-side PIN for `/publisher` access |
| `REVALIDATION_SECRET` | Secret token for webhook-triggered `/api/revalidate` calls |
| `NEXT_PUBLIC_HIDE_DUMMY_CONTENT` | Set to `"true"` in production to hide sample content |

### 3. Provision the Supabase Database
Open your **Supabase Dashboard → SQL Editor → New Query**, paste the contents of [`supabase_schema.sql`](./supabase_schema.sql), and click **Run**. This safely creates all tables (`articles`, `article_likes`, `article_comments`, `letters_to_editor`, `bookmarks`, `authors`, `issue_packets`, `error_logs`), storage buckets (`article-media`), indexes, and Row-Level Security (RLS) policies.

### 4. Run the Development Server
```bash
npm run dev
```
Open `http://localhost:3000` to view the publication, or `http://localhost:3000/publisher` to access the Editorial Desk.

### 5. Type-Check & Production Build
```bash
npx tsc --noEmit
npm run build
```
