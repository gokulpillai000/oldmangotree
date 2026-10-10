# Old Mango Tree — Persistent Engineering & Editorial Standards

These rules are **always active** and must be followed on **every code change** in this repository:

## 1. Zero Duplicate or Dead Code
- **Single Source of Truth for Article Logic**: Always use `src/lib/articleHelpers.ts` for `isAudioArticle` (`isAudioStory`), `mapSupabaseRecordToArticle`, `mapArticleToSupabaseRecord`, `mapSupabaseRecordToPodcast`, `filterCategoryArticles`, `buildIssuesFromArticles`, and `buildSeriesFromArticles`. Never duplicate these helpers across `src/lib/content.ts`, `src/lib/liveArticles.ts`, or UI components.
- **No Redundant Queries**: Avoid sequential double-fetching in server components and duplicate `useEffect` initializations in client components.
- **Clean Up Dead Code**: Whenever replacing or retiring a component, helper, or API route, delete the unused file/function immediately rather than leaving dead code in the repository.

## 2. Zero Hardcoded Secrets
- **Never** hardcode plaintext passwords, PINs, recovery keys, revalidation secrets, or API keys in `src/`, `content/`, `.github/workflows/`, or markdown documentation.
- Read all credentials and secrets from environment variables (`AUTH_SECRET`, `EDITORIAL_DESK_PIN`, `EDITORIAL_ADMIN_PASSWORD`, `REVALIDATION_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- Store user passwords only as salted `scrypt` hashes (`scrypt:<salt>:<hash>`) via `hashPassword` / `verifyPassword` in `src/lib/auth.ts`.

## 3. Strict Access Control & Session Security
- **Signed Sessions**: All session cookies and `Authorization: Bearer` tokens must be cryptographically signed and verified with HMAC-SHA256 (`signSessionToken` and `verifySessionToken` in `src/lib/auth.ts`).
- **Protected Endpoints**: Any API route or query that mutates editorial state or returns unpublished drafts / scheduled articles must verify `isPublisherAuthenticated(request)`.
- **No Unauthenticated Admin Fetches**: Client-side editorial views (`/publisher`) must never fetch reader letters, unpublished drafts, or internal editorial pools until `isAuthenticated` is true.
- **Safe Registration**: Public user registration must never overwrite existing accounts or auto-grant `role: 'publisher'`.

## 4. Connected Error Tracking
- Use `resolveFriendlyErrorInfo` and `reportError(error, context)` from `src/lib/errorLogger.ts` for all error boundaries and critical failure paths so runtime errors are logged to `public.error_logs` in Supabase.

## 5. Living Documentation & Schema Sync
- Whenever a change adds or modifies environment variables, database tables/columns, API routes, or architectural flows, update `README.md`, `.env.example`, and `supabase_schema.sql` as part of the same change.

## 6. Core Product & Editorial Invariants
- **Founding Editors**: Founding editors and default authors are strictly **Akhil U Krishnan** and **Amala Thomas**.
- **Audio & Podcast Isolation**: Content uploaded to `Audio & Podcast` must appear exclusively in the `Audio & Podcast` (`/podcasts`) section and must never appear in general text article categories.
- **Editor Category Selection**: The Primary Category field in `ArticleStudio` must default to `''` (no pre-selected default like `'Politics'`) for new stories and after clearing the editor.
- **Non-Interactable Article Images**: Inline images inside articles (`ArticleBody`, `ArticleViewClient`, `ArticlePreviewModal`, static pages) must remain strictly non-interactable (`pointer-events: none`, `user-select: none`, `draggable={false}`).
- **Type Safety Verification**: Run `npx tsc --noEmit` after making changes to ensure zero TypeScript errors.
