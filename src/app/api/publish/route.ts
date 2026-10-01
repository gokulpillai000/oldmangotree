import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { getCurrentSession } from '@/lib/auth';
import { determineCategoryFromTags } from '@/lib/categoryMapper';
import { getAllArticles, getArticleBySlug } from '@/lib/content';

function htmlToMarkdown(htmlContent: string): string {
  if (!htmlContent) return '';

  let md = htmlContent;
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n\n');
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  md = md.replace(/<ul[^>]*>/gi, '\n');
  md = md.replace(/<\/ul>/gi, '\n');
  md = md.replace(/<[^>]+>/g, '');

  return md.trim();
}

// ================= POST: Create New Article =================
export async function POST(req: NextRequest) {
  try {
    const session = getCurrentSession(req);
    const authHeader = req.headers.get('authorization');
    const isAppsScriptAuth = authHeader && (authHeader.includes('omt_publish_token'));

    if (!session && !isAppsScriptAuth) {
      return NextResponse.json(
        { error: 'Please sign in to publish articles.' },
        { status: 401 }
      );
    }
    if (session && session.role !== 'publisher') {
      return NextResponse.json(
        { error: 'Access denied: Editorial staff privileges required.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      slug: customSlug,
      excerpt,
      category: explicitCategory,
      authors = ['kamalram-sajeev'],
      publishedAt: inputPublishedAt,
      coverImage = 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80',
      audioNarrationUrl,
      audioDurationSeconds,
      isPremium = false,
      webzineIssue,
      readTimeMinutes = 5,
      tags = ['Kerala', 'Politics'],
      htmlContent,
      markdownContent,
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Article title is required' }, { status: 400 });
    }

    const parsedTags = Array.isArray(tags) ? tags : String(tags).split(',').map((t) => t.trim());
    const category = explicitCategory || determineCategoryFromTags(parsedTags);

    let slug = (customSlug || title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!slug || slug.length < 2) {
      const today = new Date().toISOString().slice(0, 10);
      const rand = Math.random().toString(36).substring(2, 8);
      slug = `${today}-${category || 'article'}-${rand}`;
    }

    const publishedAt = inputPublishedAt || new Date().toISOString();
    const finalBodyMarkdown = markdownContent || htmlToMarkdown(htmlContent || '');

    const frontmatterObj = {
      title,
      slug,
      excerpt: excerpt || title,
      category,
      authors: Array.isArray(authors) ? authors : [authors],
      publishedAt,
      coverImage,
      ...(audioNarrationUrl ? { audioNarrationUrl, audioDurationSeconds: Number(audioDurationSeconds) || 300 } : {}),
      isPremium: Boolean(isPremium),
      ...(webzineIssue ? { webzineIssue } : {}),
      readTimeMinutes: Number(readTimeMinutes) || 5,
      tags: parsedTags,
    };

    const yamlFrontmatter = Object.entries(frontmatterObj)
      .map(([key, val]) => {
        if (Array.isArray(val)) {
          return `${key}:\n` + val.map((v) => `  - "${v}"`).join('\n');
        }
        if (typeof val === 'string') {
          return `${key}: "${val.replace(/"/g, '\\"')}"`;
        }
        return `${key}: ${val}`;
      })
      .join('\n');

    const fullArticleMarkdown = `---\n${yamlFrontmatter}\n---\n\n# ${title}\n\n${finalBodyMarkdown}\n`;

    const articlesDir = path.join(process.cwd(), 'content', 'articles');
    if (!fs.existsSync(articlesDir)) {
      fs.mkdirSync(articlesDir, { recursive: true });
    }

    const fileName = `${slug}.md`;
    const filePath = path.join(articlesDir, fileName);
    fs.writeFileSync(filePath, fullArticleMarkdown, 'utf8');

    if (webzineIssue) {
      const issuePath = path.join(process.cwd(), 'content', 'issues', `${webzineIssue}.json`);
      if (fs.existsSync(issuePath)) {
        const issueData = JSON.parse(fs.readFileSync(issuePath, 'utf8'));
        if (!issueData.articleSlugs.includes(slug)) {
          issueData.articleSlugs.push(slug);
          fs.writeFileSync(issuePath, JSON.stringify(issueData, null, 2), 'utf8');
        }
      }
    }

    const isScheduled = new Date(publishedAt).getTime() > Date.now();

    return NextResponse.json({
      success: true,
      message: isScheduled
        ? `Article scheduled for ${new Date(publishedAt).toLocaleString()}`
        : 'Article published successfully!',
      article: {
        slug,
        title,
        category,
        publishedAt,
        isScheduled,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to publish article' }, { status: 500 });
  }
}

// ================= PUT: Edit Existing Article =================
export async function PUT(req: NextRequest) {
  try {
    const session = getCurrentSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Please sign in to edit articles.' }, { status: 401 });
    }
    if (session.role !== 'publisher') {
      return NextResponse.json({ error: 'Access denied: Editorial staff privileges required.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      slug,
      title,
      excerpt,
      category: explicitCategory,
      authors = ['kamalram-sajeev'],
      publishedAt,
      coverImage,
      audioNarrationUrl,
      audioDurationSeconds,
      isPremium,
      webzineIssue,
      readTimeMinutes,
      tags,
      markdownContent,
    } = body;

    if (!slug) {
      return NextResponse.json({ error: 'Article slug is required for updating.' }, { status: 400 });
    }

    const articlesDir = path.join(process.cwd(), 'content', 'articles');
    const filePath = path.join(articlesDir, `${slug}.md`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Article file not found.' }, { status: 404 });
    }

    // Read existing file to retain fields if omitted
    const existingFile = fs.readFileSync(filePath, 'utf8');
    const parsed = matter(existingFile);

    const parsedTags = tags
      ? (Array.isArray(tags) ? tags : String(tags).split(',').map((t) => t.trim()))
      : parsed.data.tags || [];

    const category = explicitCategory || determineCategoryFromTags(parsedTags) || parsed.data.category;

    const frontmatterObj = {
      ...parsed.data,
      title: title || parsed.data.title,
      slug,
      excerpt: excerpt !== undefined ? excerpt : parsed.data.excerpt,
      category,
      authors: authors ? (Array.isArray(authors) ? authors : [authors]) : parsed.data.authors,
      publishedAt: publishedAt || parsed.data.publishedAt,
      coverImage: coverImage || parsed.data.coverImage,
      audioNarrationUrl: audioNarrationUrl !== undefined ? audioNarrationUrl : parsed.data.audioNarrationUrl,
      audioDurationSeconds: audioDurationSeconds !== undefined ? Number(audioDurationSeconds) : parsed.data.audioDurationSeconds,
      isPremium: isPremium !== undefined ? Boolean(isPremium) : parsed.data.isPremium,
      webzineIssue: webzineIssue !== undefined ? webzineIssue : parsed.data.webzineIssue,
      readTimeMinutes: readTimeMinutes !== undefined ? Number(readTimeMinutes) : parsed.data.readTimeMinutes,
      tags: parsedTags,
    };

    const yamlFrontmatter = Object.entries(frontmatterObj)
      .map(([key, val]) => {
        if (val === undefined) return null;
        if (Array.isArray(val)) {
          return `${key}:\n` + val.map((v) => `  - "${v}"`).join('\n');
        }
        if (typeof val === 'string') {
          return `${key}: "${val.replace(/"/g, '\\"')}"`;
        }
        return `${key}: ${val}`;
      })
      .filter(Boolean)
      .join('\n');

    const bodyContent = markdownContent !== undefined ? markdownContent : parsed.content;
    const fullArticleMarkdown = `---\n${yamlFrontmatter}\n---\n\n${bodyContent.trim()}\n`;

    fs.writeFileSync(filePath, fullArticleMarkdown, 'utf8');

    // Update Issue Packet links if changed
    if (webzineIssue && webzineIssue !== parsed.data.webzineIssue) {
      // Remove from old issue
      if (parsed.data.webzineIssue) {
        const oldPath = path.join(process.cwd(), 'content', 'issues', `${parsed.data.webzineIssue}.json`);
        if (fs.existsSync(oldPath)) {
          const oldData = JSON.parse(fs.readFileSync(oldPath, 'utf8'));
          oldData.articleSlugs = (oldData.articleSlugs || []).filter((s: string) => s !== slug);
          fs.writeFileSync(oldPath, JSON.stringify(oldData, null, 2), 'utf8');
        }
      }
      // Add to new issue
      const newPath = path.join(process.cwd(), 'content', 'issues', `${webzineIssue}.json`);
      if (fs.existsSync(newPath)) {
        const newData = JSON.parse(fs.readFileSync(newPath, 'utf8'));
        if (!newData.articleSlugs.includes(slug)) {
          newData.articleSlugs.push(slug);
          fs.writeFileSync(newPath, JSON.stringify(newData, null, 2), 'utf8');
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Article updated successfully!',
      article: frontmatterObj,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update article: ' + err.message }, { status: 500 });
  }
}

// ================= DELETE: Delete Article =================
export async function DELETE(req: NextRequest) {
  try {
    const session = getCurrentSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Please sign in to delete articles.' }, { status: 401 });
    }
    if (session.role !== 'publisher') {
      return NextResponse.json({ error: 'Access denied: Editorial staff privileges required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Article slug parameter is required.' }, { status: 400 });
    }

    const articlesDir = path.join(process.cwd(), 'content', 'articles');
    const filePath = path.join(articlesDir, `${slug}.md`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Article not found.' }, { status: 404 });
    }

    fs.unlinkSync(filePath);

    // Remove from any issue packets
    const issuesDir = path.join(process.cwd(), 'content', 'issues');
    if (fs.existsSync(issuesDir)) {
      const issueFiles = fs.readdirSync(issuesDir).filter((f) => f.endsWith('.json'));
      for (const file of issueFiles) {
        const issuePath = path.join(issuesDir, file);
        const data = JSON.parse(fs.readFileSync(issuePath, 'utf8'));
        if (data.articleSlugs && data.articleSlugs.includes(slug)) {
          data.articleSlugs = data.articleSlugs.filter((s: string) => s !== slug);
          fs.writeFileSync(issuePath, JSON.stringify(data, null, 2), 'utf8');
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Article ${slug} deleted successfully.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete article: ' + err.message }, { status: 500 });
  }
}

// ================= GET: Fetch Articles Catalog or Single Article =================
export async function GET(req: NextRequest) {
  try {
    const session = getCurrentSession(req);
    if (!session) {
      return NextResponse.json(
        { error: 'Please sign in to view editorial data.' },
        {
          status: 401,
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        }
      );
    }
    if (session.role !== 'publisher') {
      return NextResponse.json(
        { error: 'Access denied: Editorial staff privileges required.' },
        {
          status: 403,
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        }
      );
    }

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    // Return single article source for editing
    if (slug) {
      const articlesDir = path.join(process.cwd(), 'content', 'articles');
      const filePath = path.join(articlesDir, `${slug}.md`);
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 });
      }

      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = matter(raw);

      return NextResponse.json(
        {
          article: {
            ...parsed.data,
            markdownContent: parsed.content.trim(),
          },
        },
        {
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        }
      );
    }

    // Return all articles catalog
    const articles = await getAllArticles(true);
    return NextResponse.json(
      { articles },
      {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to load articles' }, { status: 500 });
  }
}
