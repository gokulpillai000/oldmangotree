# OldmanGoTree — Headless Blogger.com Architecture & Implementation Plan

> **Project Name:** OldmanGoTree (`oldmangotree`)  
> **Model:** Headless Jamstack (Next.js 14 App Router Frontend + Blogger.com Cloud CMS)  
> **Cost:** 100% Free ($0 / ₹0 Server & Database Costs)  
> **Objective:** Retain the complete visual design, TrueCopy Dzain typography, Deep Wine & Paper color palette, persistent audio player, and interactive webzine layout while using Blogger.com as the content engine.

---

## 1. Executive Summary & Architecture

Instead of managing a custom-built database or committing `.md` and `.json` files to Git, **Blogger.com** serves as the zero-maintenance, multi-author editorial CMS. The Next.js frontend fetches content via Blogger's public JSON feed and renders it with 100% fidelity to the current site.

```
                      CONTENT CREATION
       [ Journalists & Editors on Blogger.com ]
                          │
       ┌──────────────────┴──────────────────┐
       ▼                                     ▼
[ Standard Articles ]               [ Packets & Series ]
Labels: Politics, Packet 2          Labels: Series: Paleri, Part: 1
       │                                     │
       └──────────────────┬──────────────────┘
                          │
                          ▼
            [ Google Blogger Cloud Servers ]
        (Images hosted on Google CDN, $0 cost)
                          │
                          ▼ (HTTPS / JSON Feed: 100% Free)
             [ Next.js Data Adapter Layer ]
                  (src/lib/blogger.ts)
                          │
            Maps Blogger posts to TypeScript
              (Article, IssuePacket, Series)
                          │
                          ▼
         [ OldmanGoTree Frontend Presentation ]
   ┌──────────────────────┬──────────────────────┐
   ▼                      ▼                      ▼
[ Homepage Grid ]   [ Webzine Packets ]   [ Article Reader ]
Deep Wine & Paper   Packet 1, Packet 2    DzainTrueCopy Font
Interactive Hero    Edition Archives      Font Scaling (A/A+)
Persistent Audio    Issue Carousel        Reading Progress
```

---

## 2. Real-World Editorial Workflow (Like Truecopy Think & The Atlantic)

Editorial staff do not write code or touch Git. Everything is controlled directly from Blogger's intuitive post editor using simple **Labels (Tags)**.

### A. Publishing Webzine Issue Packets (Multi-Edition Support)

1. **Step 1: Create the Packet Issue Cover**  
   The Editor creates one post on Blogger:
   * **Title:** `PACKET 2: Modern Political & Cultural Debates`
   * **Labels:** `Packet 2`, `Issue Cover`
   * **Featured Image:** The magazine cover artwork.
   * **Post Body:** The Editor's introduction / theme manifesto.

2. **Step 2: Add Articles to the Packet**  
   Writers publish stories normally and simply add:
   * **Labels:** `Packet 2`, `Politics`

3. **Step 3: Mark the Lead / Centerpiece Story**  
   Add the label `Lead Story` to whichever article should appear as the hero banner in that packet.

---

### B. Publishing Serialized Columns / Special Series (e.g. *Paleri Memoirs*)

1. **Step 1: Create Series Overview**  
   The Editor creates a post describing the series:
   * **Title:** `വിസ്മയം പലേരി: ദേശവും ചരിത്രവും`
   * **Labels:** `Series: Paleri Memoirs`, `Series Info`
   * **Featured Image:** Series banner.
   * **Post Body:** Series synopsis and columnist bio.

2. **Step 2: Publish Episodes**  
   Writers publish chapters with two tags:
   * **Labels:** `Series: Paleri Memoirs`, `Part: 1` *(or `Part: 2`, `Part: 3`, etc.)*
   * *Next.js automatically sorts and renders them in order with chapter navigation.*

---

## 3. Complete Label / Tag Reference for Writers

| Editorial Goal | What Writer Types in Blogger Labels Box | What Happens on Website |
| :--- | :--- | :--- |
| **Department / Category** | `Politics`, `Cinema`, `Sports`, `Literature`, etc. | Routes to `/[category]` and category widgets |
| **Assign to Packet Edition** | `Packet 1`, `Packet 2`, `Packet 3` | Appears in that edition's webzine archive |
| **Make Cover / Hero Story** | `Lead Story` | Pinned as the top lead story of the packet |
| **Add to Special Series** | `Series: Paleri Memoirs`, `Part: 1` | Displays sequentially in `/series/paleri-memoirs` |
| **Attach Audio Narration** | `Audio Story` *(paste MP3 link in post body)* | Feeds audio into the persistent bottom player |
| **Attach Video Essay** | `Video` *(paste YouTube link in post body)* | Appears in `/videos` multimedia grid |
| **Lock Behind Paywall** | `Premium` | Restricts full text to subscribers |

---

## 4. Technical Implementation Blueprint for New Project

### Step 1: Environment Configuration (`.env.local`)
Create a single environment variable in your Next.js project root:

```bash
# Your Blogger Blog URL (Public feed - No API key needed)
NEXT_PUBLIC_BLOGGER_URL="https://yourblogname.blogspot.com"
```

---

### Step 2: Blogger Adapter (`src/lib/blogger.ts`)
This adapter fetches from Blogger's public JSON feed, parses the data, and maps it directly into your website's data structures:

```typescript
// src/lib/blogger.ts
import { Article, IssuePacket, Series, SeriesEpisode } from './content';

const BLOG_URL = process.env.NEXT_PUBLIC_BLOGGER_URL || 'https://oldmangotree.blogspot.com';

export interface BloggerEntry {
  id: { $t: string };
  published: { $t: string };
  updated: { $t: string };
  title: { $t: string };
  content: { $t: string };
  category?: Array<{ term: string }>;
  author: Array<{ name: { $t: string }; gd$image?: { src: string } }>;
  link: Array<{ rel: string; href: string }>;
  media$thumbnail?: { url: string };
}

// 1. Fetch All Articles
export async function fetchBloggerPosts(): Promise<Article[]> {
  try {
    const url = `${BLOG_URL.replace(/\/$/, '')}/feeds/posts/default?alt=json&max-results=500`;
    const res = await fetch(url, { next: { revalidate: 60 } }); // Incremental Static Regeneration (1 min cache)
    
    if (!res.ok) return [];
    const data = await res.json();
    const entries: BloggerEntry[] = data.feed?.entry || [];

    return entries.map(entry => parseBloggerEntry(entry));
  } catch (error) {
    console.error('Error fetching Blogger posts:', error);
    return [];
  }
}

// 2. Parse Single Entry to OldmanGoTree Article
export function parseBloggerEntry(entry: BloggerEntry): Article {
  const title = entry.title.$t;
  const contentHtml = entry.content.$t;
  const publishedAt = entry.published.$t;
  const labels = entry.category ? entry.category.map(c => c.term) : [];
  
  // Extract Slug from link
  const alternateLink = entry.link.find(l => l.rel === 'alternate')?.href || '';
  const slugMatch = alternateLink.match(/\/([^/]+)\.html$/);
  const slug = slugMatch ? slugMatch[1] : title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // Author details
  const authorName = entry.author?.[0]?.name?.$t || 'Editorial Desk';

  // High-Resolution Cover Image extraction
  let coverImage = '';
  if (entry.media$thumbnail?.url) {
    // Convert Blogger thumbnail (s72-c) to full HD resolution (s1600)
    coverImage = entry.media$thumbnail.url.replace(/\/s[0-9]+-c\//, '/s1600/');
  } else {
    const imgMatch = contentHtml.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch) coverImage = imgMatch[1];
  }

  // Audio link extraction (e.g. [audio: https://...mp3] or <audio src="...">)
  let audioNarrationUrl: string | undefined;
  const audioMatch = contentHtml.match(/(?:\[audio:\s*|<audio[^>]+src=")(https?:\/\/[^"\]\s]+)/i);
  if (audioMatch) audioNarrationUrl = audioMatch[1];

  // Category determination
  const standardCategories = ['politics', 'cinema', 'sports', 'literature', 'media', 'society', 'environment'];
  const matchedCategory = labels.find(l => standardCategories.includes(l.toLowerCase())) || 'politics';

  // Packet & Series tags
  const packetLabel = labels.find(l => l.toLowerCase().startsWith('packet'));
  const isPremium = labels.some(l => l.toLowerCase() === 'premium');

  return {
    title,
    slug,
    excerpt: contentHtml.replace(/<[^>]+>/g, '').slice(0, 180).trim() + '...',
    category: matchedCategory.toLowerCase(),
    authors: [authorName],
    authorNames: authorName,
    publishedAt,
    coverImage: coverImage || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80',
    content: contentHtml,
    contentHtml: contentHtml,
    audioNarrationUrl,
    isPremium,
    webzineIssue: packetLabel ? packetLabel.toLowerCase().replace(/\s+/g, '-') : undefined,
    tags: labels,
  };
}

// 3. Extract Webzine Packets from Posts
export async function fetchBloggerPackets(): Promise<IssuePacket[]> {
  const articles = await fetchBloggerPosts();
  const packetMap = new Map<string, Article[]>();

  articles.forEach(art => {
    if (art.webzineIssue) {
      const existing = packetMap.get(art.webzineIssue) || [];
      existing.push(art);
      packetMap.set(art.webzineIssue, existing);
    }
  });

  const packets: IssuePacket[] = [];
  packetMap.forEach((arts, packetId) => {
    const coverPost = arts.find(a => a.tags?.some(t => t.toLowerCase() === 'issue cover'));
    const leadStory = arts.find(a => a.tags?.some(t => t.toLowerCase() === 'lead story')) || arts[0];
    const issueNum = parseInt(packetId.replace(/[^0-9]/g, '')) || 1;

    packets.push({
      id: packetId,
      title: coverPost?.title || `PACKET ${issueNum}`,
      issueNumber: issueNum,
      theme: coverPost?.excerpt || 'Contemporary Cultural & Political Analysis',
      publishedAt: coverPost?.publishedAt || arts[0].publishedAt,
      coverImage: coverPost?.coverImage || leadStory.coverImage,
      isPremium: arts.some(a => a.isPremium),
      featuredArticleSlug: leadStory.slug,
      articleSlugs: arts.map(a => a.slug),
    });
  });

  return packets.sort((a, b) => b.issueNumber - a.issueNumber);
}
```

---

### Step 3: Wire into Existing Content Engine (`src/lib/content.ts`)
Simply update your getters in `src/lib/content.ts` to call `fetchBloggerPosts()` with a local fallback:

```typescript
import { fetchBloggerPosts, fetchBloggerPackets } from './blogger';

export async function getAllArticles(): Promise<Article[]> {
  if (process.env.NEXT_PUBLIC_BLOGGER_URL) {
    const liveArticles = await fetchBloggerPosts();
    if (liveArticles.length > 0) return liveArticles;
  }
  return getLocalArticles(); // Offline fallback
}

export async function getAllIssuePackets(): Promise<IssuePacket[]> {
  if (process.env.NEXT_PUBLIC_BLOGGER_URL) {
    const livePackets = await fetchBloggerPackets();
    if (livePackets.length > 0) return livePackets;
  }
  return getLocalPackets(); // Offline fallback
}
```

---

## 5. Design & Token Assets to Keep in the New Project

Ensure your new project retains these exact files from OldmanGoTree for 100% visual parity:

1. **Custom Malayalam Web Fonts (`public/fonts/`):**
   * `DzainTrueCopy-Light.woff2`
   * `DzainTrueCopy-Regular.woff2`
   * `DzainTrueCopy-Bold.woff2`
   * `Dzain-TrueCopyText-Regular.woff2`
   * `DzainTrueCopy-Inline.woff2`
2. **Design Palette (`tailwind.config.js`):**
   * Deep Wine Brand: `#4a0e17` to `#8b1a2b`
   * Editorial Paper Backgrounds: `#faf8f5` (Light), `#1a1918` (Dark)
3. **Core Interactive Components (`src/components/`):**
   * `AudioPlayer.tsx` & `AudioContext.tsx` (Persistent audio bar)
   * `ArticleReaderToolbar.tsx` (Font sizing controls: `A-` / `A+`)
   * `WidgetGrid.tsx` (Truecopy Think multi-column magazine layout)
   * `ReadingProgressBar.tsx` (Scroll progress tracker)

---

## 6. Pre-Launch Checklist for Your New Project

- [ ] Create your free blog on [Blogger.com](https://www.blogger.com).
- [ ] Add your editorial team members via **Blogger Settings → Permissions → Invite Authors**.
- [ ] Add `NEXT_PUBLIC_BLOGGER_URL="https://yourblog.blogspot.com"` to `.env.local`.
- [ ] Publish 1 test article with tags `Politics`, `Packet 1`, `Lead Story`.
- [ ] Run `npm run build` to verify the static site compiles cleanly.
- [ ] Deploy frontend to **Vercel** or **Cloudflare Pages** ($0 free tier).
