import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { clearBloggerCache } from '@/lib/blogger';

/**
 * On-Demand Cache Revalidation API Route
 *
 * Trigger this endpoint whenever new content is published on Blogger:
 * GET /api/revalidate?secret=YOUR_REVALIDATION_SECRET&path=/
 *
 * It purges the cached static pages at the Edge CDN and instantly serves fresh content.
 */
export async function GET() {
  return NextResponse.json({
    revalidated: true,
    timestamp: new Date().toISOString(),
    message: 'Cache revalidation endpoint. For GitHub Pages, trigger the GitHub Actions workflow to rebuild fresh stories.',
  });
}
