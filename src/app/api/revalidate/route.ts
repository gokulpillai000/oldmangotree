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
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const secret = searchParams.get('secret');
  const path = searchParams.get('path') || '/';

  const expectedSecret = process.env.REVALIDATION_SECRET || 'oldmangotree-secret';

  // Check authentication secret
  if (secret !== expectedSecret) {
    return NextResponse.json({ message: 'Invalid revalidation secret token' }, { status: 401 });
  }

  try {
    // 1. Clear in-memory deduplication and node cache
    clearBloggerCache();

    // 2. Invalidate Next.js data cache for Blogger posts
    revalidateTag('blogger-posts');

    // 3. Purge edge CDN static cache for specified path and layout
    revalidatePath(path);
    revalidatePath('/', 'layout');

    return NextResponse.json({
      revalidated: true,
      path,
      timestamp: new Date().toISOString(),
      message: `Successfully revalidated cache for ${path} and tagged feeds`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { message: 'Error revalidating cache', error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
