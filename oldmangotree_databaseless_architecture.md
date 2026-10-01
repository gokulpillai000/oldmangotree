# OldmanGoTree — Database-Less Media Platform Architecture & Plan

> **Platform Name:** OldmanGoTree (`oldmangotree`)  
> **Type:** Database-Less Webzine, Long-Form Media & Audio Streaming Platform  
> **Model:** Flat-File / Jamstack / Git-Based CMS + Third-Party Managed Auth & Subscriptions  

---

## 1. Architectural Concept

`oldmangotree` is designed to deliver all the capabilities of high-volume digital media platforms like *TrueCopy Think*—including long-form articles, issue-based webzine packets, audio podcast streaming, responsive hero widgets, categories, and subscription paywalls—**without deploying, hosting, or maintaining a SQL/NoSQL database**.

### How It Works Without a Database

```
+-----------------------------------------------------------------------------------+
|                                  CONTENT CREATION                                 |
|                                                                                   |
|  [ Content Editors ] ---> ( Keystatic / TinaCMS Admin UI )                        |
|                                        |                                          |
|                                        v                                          |
|                     Commits `.md` & `.json` files to Git                          |
+----------------------------------------+------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                              GITHUB REPOSITORY (`oldmangotree`)                  |
|                                                                                   |
|   /content                                                                        |
|     ├── /articles      (Markdown files + YAML frontmatter)                        |
|     ├── /issues        (Webzine Packet JSON specifications)                       |
|     ├── /authors       (Author profiles & avatars JSON)                           |
|     ├── /categories    (Taxonomy metadata JSON)                                   |
|     └── /podcasts      (Audio metadata & Cloudflare R2 links)                      |
+----------------------------------------+------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                               BUILD & DEPLOYMENT PIPELINE                         |
|                                                                                   |
|   Static Site Generator (Next.js / Astro)                                         |
|   ├── Compiles Markdown & JSON into static HTML/JS pages                          |
|   ├── Generates Pagefind Search Index                                             |
|   └── Pushes static site to Edge CDN (Cloudflare Pages / Vercel)                  |
+----------------------------------------+------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                               LIVE USER ACCESS                                    |
|                                                                                   |
|  [ End User ] ---> ( Global Edge CDN: Instant Page Load < 100ms )                 |
|       │                                                                           |
|       ├── Audio Streaming  ---> Directly from Cloudflare R2 / AWS S3              |
|       ├── Search Engine    ---> Local static search via Pagefind                    |
|       ├── Sign-in/Paywall  ---> Managed via Memberstack / Outseta (No DB needed)  |
|       └── Reader Comments  ---> Handled via Giscus (GitHub Discussions API)       |
+-----------------------------------------------------------------------------------+
```

---

## 2. Core Feature Mapping (Database vs Database-Less)

| Feature | Traditional Approach (With DB) | Database-Less Approach (`oldmangotree`) |
| :--- | :--- | :--- |
| **Article Publishing** | SQL Insert into `articles` table | `.md` / `.mdx` file in Git repository with frontmatter metadata |
| **Webzine Issues ("Packets")** | Relational `issues` + join tables | `issues/packet-298.json` mapping list of article slugs |
| **Content Editor Dashboard** | Custom Admin panel connected to DB API | **Keystatic** or **TinaCMS** visual editor overlaying local Git files |
| **Audio Narration & Podcasts** | Audio metadata DB row + Blob storage | Audio URL in Markdown frontmatter + MP3 host on Cloudflare R2 |
| **Global Search** | PostgreSQL Full-Text / Algolia / Elastic | Static **Pagefind** index generated automatically during deployment build |
| **User Sign-In & Paywall** | Custom JWT auth + DB users table | **Memberstack** or **Outseta** client-side script + serverless edge rules |
| **Comments & Discussion** | Custom DB `comments` table | **Giscus** widget using GitHub Discussions as storage |
| **Dynamic Image Resizing** | Dedicated image processing backend server | **Next.js Image Optimization** / **Cloudflare Images CDN** |

---

## 3. Recommended Tech Stack Selection

```
+-----------------------------------------------------------------------+
|  FRONTEND FRAMEWORK   :  Next.js 14+ (App Router) / Astro 4+          |
|  VISUAL CMS (GIT)     :  Keystatic or TinaCMS                         |
|  STYLING & UI         :  Tailwind CSS v4 + Shadcn UI + Lucide Icons   |
|  STATIC SEARCH        :  Pagefind (Zero-config, fast multilingual)    |
|  MEDIA STORAGE        :  Cloudflare R2 Storage ($0 egress fees)      |
|  AUTH & PAYWALL       :  Memberstack / Outseta / Clerk + Stripe       |
|  COMMENTS             :  Giscus (Powered by GitHub Discussions)       |
|  HOSTING & EDGE CDN   :  Vercel / Cloudflare Pages                    |
+-----------------------------------------------------------------------+
```

---

## 4. File Structure Specification

Here is the complete folder structure for the `oldmangotree` codebase:

```
oldmangotree/
├── .github/
│   └── workflows/
│       └── build-search-index.yml
├── content/
│   ├── articles/
│   │   ├── 2026-09-08-kerala-politics-analysis.md
│   │   ├── 2026-09-07-river-dam-management.md
│   │   └── 2026-09-03-messi-international-career.md
│   ├── issues/
│   │   ├── packet-297.json
│   │   └── packet-298.json
│   ├── authors/
│   │   ├── kamalram-sajeev.json
│   │   └── manila-c-mohan.json
│   ├── categories/
│   │   ├── politics.json
│   │   ├── literature.json
│   │   └── sports.json
│   └── podcasts/
│       └── episode-101.json
├── keystatic.config.ts          # Keystatic Git-CMS Configuration
├── public/
│   ├── images/
│   │   └── logo.svg
│   └── pagefind/                # Auto-generated static search index
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Modular Grid Homepage
│   │   ├── [category]/
│   │   │   └── page.tsx         # Category Feed
│   │   ├── articles/
│   │   │   └── [slug]/
│   │   │       └── page.tsx     # Single Article View + Audio Player
│   │   ├── magazine/
│   │   │   └── [packet]/
│   │   │       └── page.tsx     # Webzine Issue View
│   │   ├── podcasts/
│   │   │   └── page.tsx         # Audio Hub
│   │   └── search/
│   │       └── page.tsx         # Search Page
│   ├── components/
│   │   ├── AudioPlayer.tsx      # Persistent Audio Player Bar
│   │   ├── Header.tsx           # Sticky Navigation & Drawer
│   │   ├── Paywall.tsx          # Memberstack Gated Content Guard
│   │   ├── WidgetGrid.tsx       # Dynamic Hero/Banner Layout Engine
│   │   └── CommentSection.tsx   # Giscus Integration
│   └── lib/
│       ├── content.ts           # Helper functions to read local markdown/json
│       └── search.ts            # Pagefind integration helper
├── package.json
└── tailwind.config.js
```

---

## 5. Schema Definitions (Flat-File Formats)

### 5.1 Article Schema (`content/articles/sample-article.md`)

```markdown
---
title: "മതത്തിന്റെ സ്ത്രീയും മതത്തിലെ സ്ത്രീയും"
slug: "the-woman-of-religion-and-the-woman-in-religion"
excerpt: "An in-depth analysis on women, politics, and social structures."
category: "politics"
authors:
  - "kamalram-sajeev"
publishedAt: "2026-09-08T18:30:00Z"
coverImage: "https://r2.oldmangotree.media/images/2026/09/sample-cover.webp"
audioNarrationUrl: "https://r2.oldmangotree.media/audio/2026/09/sample-narration.mp3"
audioDurationSeconds: 420
isPremium: true
webzineIssue: "packet-298"
readTimeMinutes: 8
tags:
  - "Kerala"
  - "Politics"
  - "Society"
---

# Article Content Begins Here

Long-form content written in standard Markdown / MDX format. Supports embedded images, audio blocks, pull quotes, and references.
```

### 5.2 Webzine Packet Schema (`content/issues/packet-298.json`)

```json
{
  "id": "packet-298",
  "title": "PACKET 298",
  "issueNumber": 298,
  "theme": "Modern Political & Cultural Debates",
  "publishedAt": "2026-09-03T00:00:00Z",
  "coverImage": "https://r2.oldmangotree.media/covers/packet-298.webp",
  "isPremium": true,
  "featuredArticleSlug": "messi-international-career",
  "articleSlugs": [
    "messi-international-career",
    "the-woman-of-religion-and-the-woman-in-religion",
    "river-dam-management",
    "old-books-why-read"
  ]
}
```

### 5.3 Author Schema (`content/authors/kamalram-sajeev.json`)

```json
{
  "id": "kamalram-sajeev",
  "name": "കമൽറാം സജീവ് / Kamalram Sajeev",
  "role": "Editor in Chief",
  "avatar": "https://r2.oldmangotree.media/authors/kamalram.webp",
  "bio": "Senior Journalist and Founding Editor of OldmanGoTree media."
}
```

---

## 6. Implementation Roadmap for `oldmangotree`

### Phase 1: Foundation & Git CMS Setup (Days 1–3)
1. Initialize Next.js 14 project with TypeScript & Tailwind CSS.
2. Install & configure **Keystatic** (`keystatic.config.ts`) to manage `/content/articles`, `/content/issues`, and `/content/authors`.
3. Set up GitHub repository `oldmangotree` and connect to Vercel or Cloudflare Pages.

### Phase 2: Dynamic Homepage Layout & Reading Experience (Days 4–7)
1. Create content reader utilities (`src/lib/content.ts`) using `gray-matter` to read and parse Markdown files.
2. Build responsive layout widgets (Jumbo Card, Grid 3-column, Horizontal Card, Sidebar Drawer).
3. Implement dark/light mode toggle and vernacular typography support (Malayalam fonts like Noto Sans Malayalam / Manjari).

### Phase 3: Audio Streaming Engine (Days 8–10)
1. Build global `AudioPlayerContext` / Zustand store for persistent audio playback.
2. Create floating audio bar component (`AudioPlayer.tsx`) sticky at the bottom of the screen.
3. Upload audio files to Cloudflare R2 bucket (`r2.oldmangotree.media`) with instant global streaming.

### Phase 4: Paywall, Subscriptions & Search (Days 11–14)
1. Connect **Memberstack** or **Outseta** for user authentication and membership management.
2. Implement Client/Server middleware guarding `/magazine/packet-*` and articles marked `isPremium: true`.
3. Integrate **Pagefind** to index static HTML files automatically on build and provide instant fuzzy search at `/search`.

---

## 7. Cost & Maintenance Comparison

| Dimension | Traditional DB App | Database-Less `oldmangotree` |
| :--- | :--- | :--- |
| **Hosting Cost** | \$25 – \$100+/month (Database + App Server) | **\$0 – \$5/month** (Free CDN tier + R2 storage) |
| **Database Backups** | Required daily/hourly SQL backups | Automatic Git commit history (GitHub) |
| **Scalability** | Needs connection pooling & DB replica scaling | Unlimited concurrent users via Edge CDN |
| **Maintenance Complexity** | High (DB security, migrations, updates) | Low (Zero server maintenance) |

---

## 8. Summary & Status

The `oldmangotree` platform can be built, published, and maintained **100% database-free** while retaining all feature capabilities of high-profile media websites like TrueCopy Think.
