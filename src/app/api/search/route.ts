import { NextResponse } from 'next/server';
import { getAllArticles } from '@/lib/content';


export async function GET() {
  try {
    const articles = await getAllArticles();
    const searchable = articles.map((a) => ({
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      category: a.category,
      tags: a.tags || [],
      publishedAt: a.publishedAt,
      authorNames: a.authorNames || '',
    }));

    return NextResponse.json({ articles: searchable });
  } catch (error) {
    return NextResponse.json({ articles: [], error: 'Failed to load articles' }, { status: 500 });
  }
}
