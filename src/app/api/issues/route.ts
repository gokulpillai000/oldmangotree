import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { isPublisherAuthenticated } from '@/lib/auth';
import { getAllIssues } from '@/lib/content';
import { issuePacketSchema } from '@/lib/validations';

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
    if (!isPublisherAuthenticated(req)) {
      return NextResponse.json(
        { error: 'Publisher authorization is required to manage issue packets.' },
        { status: 403 }
      );
    }

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Strict schema validation using Zod (Check 11 & Path Traversal Prevention)
    const parseResult = issuePacketSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Invalid issue packet data';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const {
      id,
      title,
      issueNumber,
      theme,
      publishedAt,
      coverImage,
      isPremium,
      featuredArticleSlug,
      articleSlugs,
    } = parseResult.data;

    const cleanId = id.toLowerCase().trim();
    const issuesDir = path.join(process.cwd(), 'content', 'issues');
    if (!fs.existsSync(issuesDir)) {
      fs.mkdirSync(issuesDir, { recursive: true });
    }

    const issueObj = {
      id: cleanId,
      title,
      issueNumber: issueNumber || 1,
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
