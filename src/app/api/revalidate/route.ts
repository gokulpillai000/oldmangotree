import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { clearBloggerCache } from '@/lib/blogger';
import { clearLocalContentCache } from '@/lib/content';
import { isPublisherAuthenticated } from '@/lib/auth';

/**
 * On-Demand Cache Revalidation API Route
 *
 * Trigger this endpoint when new content is published:
 * - Authenticated publisher session (cookie or Authorization: Bearer token), OR
 * - GET/POST /api/revalidate?secret=<REVALIDATION_SECRET>&path=/
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

  const validSecret = process.env.REVALIDATION_SECRET;
  const hasValidSecret = Boolean(validSecret && secret && secret === validSecret);
  const isAuthorizedPublisher = isPublisherAuthenticated(request);

  if (!hasValidSecret && !isAuthorizedPublisher) {
    return NextResponse.json({ message: 'Unauthorized revalidation request' }, { status: 401 });
  }

  // 1. Clear in-memory caches
  clearBloggerCache();
  clearLocalContentCache();

  // 2. Revalidate Next.js cache tags and paths
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
    timestamp: new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    message:
      'Cache successfully purged! Live readers are now seeing the newest stories immediately.',
  });
}
