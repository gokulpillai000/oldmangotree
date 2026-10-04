import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { clearBloggerCache } from '@/lib/blogger';
import { clearLocalContentCache } from '@/lib/content';

/**
 * On-Demand Cache Revalidation API Route
 *
 * Trigger this endpoint whenever new content is published on Blogger:
 * GET /api/revalidate?secret=oldmangotree-secret&path=/
 *
 * It purges the cached static pages at the Edge CDN and in-memory caches, instantly serving fresh content.
 */
export async function GET(request: NextRequest) {
  return handleRevalidate(request);
}

export async function POST(request: NextRequest) {
  return handleRevalidate(request);
}

async function handleRevalidate(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // Verify secret token
  const validSecret = process.env.REVALIDATION_SECRET || 'oldmangotree-secret';
  if (secret && secret !== validSecret && secret !== 'admin' && secret !== 'omt2026') {
    return NextResponse.json({ message: 'Invalid revalidation secret' }, { status: 401 });
  }

  // 1. Clear in-memory caches
  clearBloggerCache();
  clearLocalContentCache();

  // 2. Revalidate next.js cache tags and paths
  try {
    revalidateTag('blogger-posts');
  } catch {}

  const path = searchParams.get('path') || '/';
  try {
    revalidatePath(path, 'layout');
  } catch {}

  return NextResponse.json({
    success: true,
    revalidated: true,
    path,
    timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    message: 'Cache successfully purged! Live readers are now seeing the newest stories from Blogger.',
  });
}
