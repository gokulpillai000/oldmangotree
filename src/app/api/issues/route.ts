import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCurrentSession } from '@/lib/auth';
import { getAllIssues } from '@/lib/content';

export async function GET(req: NextRequest) {
  try {
    const issues = await getAllIssues();
    return NextResponse.json(
      { issues },
      {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to load issues' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getCurrentSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Please sign in to manage issue packets.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      title,
      issueNumber,
      theme,
      publishedAt,
      coverImage,
      isPremium = false,
      featuredArticleSlug,
      articleSlugs = [],
    } = body;

    if (!id || !title) {
      return NextResponse.json({ error: 'Packet ID and Title are required.' }, { status: 400 });
    }

    const cleanId = id.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
    const issuesDir = path.join(process.cwd(), 'content', 'issues');
    if (!fs.existsSync(issuesDir)) {
      fs.mkdirSync(issuesDir, { recursive: true });
    }

    const issueObj = {
      id: cleanId,
      title,
      issueNumber: Number(issueNumber) || 1,
      theme: theme || title,
      publishedAt: publishedAt || new Date().toISOString(),
      coverImage: coverImage || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80',
      isPremium: Boolean(isPremium),
      featuredArticleSlug: featuredArticleSlug || (articleSlugs.length > 0 ? articleSlugs[0] : ''),
      articleSlugs: Array.isArray(articleSlugs) ? articleSlugs : [],
    };

    const filePath = path.join(issuesDir, `${cleanId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(issueObj, null, 2), 'utf8');

    return NextResponse.json({
      success: true,
      message: `Issue packet ${cleanId} saved successfully!`,
      issue: issueObj,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to save issue packet: ' + err.message }, { status: 500 });
  }
}
