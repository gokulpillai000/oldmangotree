import { NextRequest, NextResponse } from 'next/server';
import { getArticleBySlug, getAllArticles } from '@/lib/content';
import { isPublisherAuthenticated } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    let slug: string | null = null;
    try {
      slug = request.nextUrl.searchParams.get('slug');
    } catch {
      // Static export prerendering does not provide dynamic searchParams
    }
    const canViewDrafts = isPublisherAuthenticated(request);

    if (!slug) {
      const articles = await getAllArticles(canViewDrafts);
      return NextResponse.json({ articles });
    }

    const article = await getArticleBySlug(slug, canViewDrafts);
    if (!article) {
      return NextResponse.json({ error: `Article "${slug}" not found` }, { status: 404 });
    }

    return NextResponse.json({ article });
  } catch (error: any) {
    console.error('Error in /api/articles GET:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch article' },
      { status: 500 }
    );
  }
}
