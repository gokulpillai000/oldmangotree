import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getArticleBySlug, getAllArticles, getAuthorById, getRelatedArticles } from '@/lib/content';
import { formatDate } from '@/lib/format';
import { CommentSection } from '@/components/CommentSection';
import { ArticleBody } from '@/components/ArticleBody';
import { ReadingProgressBar } from '@/components/ReadingProgressBar';
import { SocialShareBar } from '@/components/SocialShareBar';
import { Calendar, ArrowLeft, Tag, BookOpen } from 'lucide-react';

interface CategoryArticlePageProps {
  params: {
    category: string;
    slug: string;
  };
}

export const revalidate = 60;

export async function generateStaticParams() {
  const articles = await getAllArticles();
  if (articles.length === 0) return [{ category: 'politics', slug: '_empty' }];
  return articles.map((a) => ({
    category: a.category.toLowerCase(),
    slug: a.slug,
  }));
}

export default async function CategoryArticlePage({ params }: CategoryArticlePageProps) {
  const { slug, category } = params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const allArticles = await getAllArticles();
  const primaryAuthorId = article.authors && article.authors.length > 0 ? article.authors[0] : null;
  const authorObj = primaryAuthorId ? getAuthorById(primaryAuthorId) : null;
  const relatedArticles = getRelatedArticles(article, 3, allArticles);

  return (
    <>
      {/* Top Reading Progress Bar */}
      <ReadingProgressBar />

      <article className="max-w-4xl mx-auto space-y-6 py-2 sm:py-4">
        {/* Back navigation */}
        <div className="flex items-center justify-between">
          <Link
            href={`/${category}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to {category.toUpperCase()}
          </Link>

          {article.webzineIssue && (
            <Link
              href={`/magazine/${article.webzineIssue}`}
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{article.webzineIssue.toUpperCase()} Issue</span>
            </Link>
          )}
        </div>

        {/* Article Header */}
        <header className="space-y-4 sm:space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/${article.category.toLowerCase()}`}
              className="text-xs sm:text-sm font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 underline decoration-brand-600 dark:decoration-brand-400 underline-offset-4 decoration-2 hover:decoration-brand-700 transition-all"
            >
              {article.category}
            </Link>
            {article.webzineIssue && (
              <Link
                href={`/magazine/${article.webzineIssue}`}
                className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 underline decoration-neutral-300 dark:decoration-neutral-700 underline-offset-4 decoration-1 hover:decoration-brand-600 transition-all"
              >
                {article.webzineIssue.toUpperCase()} Issue
              </Link>
            )}
            {article.isPremium && (
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 underline decoration-amber-600 underline-offset-4 decoration-1">
                Premium Read
              </span>
            )}
          </div>

          <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-neutral-50 leading-tight break-words">
            {article.title}
          </h1>

          <p className="text-base sm:text-xl lg:text-2xl text-neutral-800 dark:text-neutral-200 font-serif leading-relaxed italic break-words">
            {article.excerpt}
          </p>
        </header>

        {/* Featured Image */}
        {article.coverImage && (
          <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-md">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Author Name & Published Date (Displayed below cover image) */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 py-2.5 sm:py-3 border-y border-neutral-200 dark:border-neutral-800 text-xs sm:text-sm">
          <span className="font-serif font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100">
            {article.authorNames || authorObj?.name || (article.authors?.[0] ? article.authors[0] : 'Akhil U Krishnan')}
          </span>
          <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 font-medium">
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            {formatDate(article.publishedAt)}
          </span>
        </div>

        {/* Top Social Sharing Bar */}
        <SocialShareBar
          title={article.title}
          slug={article.slug}
          category={article.category}
          excerpt={article.excerpt}
          authorNames={article.authorNames || authorObj?.name}
          coverImage={article.coverImage}
          publishedAt={article.publishedAt}
        />

        {/* Interactive Reader Toolbar & Content */}
        <ArticleBody
          title={article.title}
          slug={article.slug}
          audioNarrationUrl={article.audioNarrationUrl}
          audioDurationSeconds={article.audioDurationSeconds}
          contentHtml={article.contentHtml || ''}
        />

        {/* Bottom Social Sharing Bar */}
        <SocialShareBar
          title={article.title}
          slug={article.slug}
          category={article.category}
          excerpt={article.excerpt}
          authorNames={article.authorNames || authorObj?.name}
          coverImage={article.coverImage}
          publishedAt={article.publishedAt}
        />

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex items-center gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <Tag className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {article.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tag/${encodeURIComponent(tag)}`}
                  className="text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-brand-600 dark:hover:text-brand-400 underline decoration-brand-600 dark:decoration-brand-400 underline-offset-4 decoration-1 hover:decoration-2 transition-all font-sans"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Articles / More from this Webzine Packet */}
        {relatedArticles.length > 0 && (
          <div className="pt-10 border-t border-neutral-200 dark:border-neutral-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                  Further Reading
                </span>
                <h3 className="font-serif text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                  {article.webzineIssue ? `More from ${article.webzineIssue.toUpperCase()} & Related` : 'Related Stories'}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              {relatedArticles.map((rel) => (
                <article
                  key={rel.slug}
                  className="group relative flex flex-col justify-between pb-6 border-b border-neutral-200 dark:border-neutral-800 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                      <Image
                        src={rel.coverImage}
                        alt={rel.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="pt-3 space-y-1.5">
                      <Link
                        href={`/${rel.category.toLowerCase()}`}
                        className="relative z-20 inline-block text-xs sm:text-sm font-bold uppercase tracking-wider text-[#E27A2B] underline decoration-[#E27A2B] underline-offset-2 decoration-1 hover:decoration-2"
                      >
                        {rel.category}
                      </Link>
                      <Link href={`/${rel.category.toLowerCase()}/${rel.slug}`}>
                        <span className="absolute inset-0 z-10" aria-hidden="true" />
                        <h4 className="font-serif text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2 leading-snug">
                          {rel.title}
                        </h4>
                      </Link>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-1 text-xs sm:text-sm">
                    <p className="font-serif font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 line-clamp-1">
                      {rel.authorNames}
                    </p>
                    <p className="text-neutral-600 dark:text-neutral-400 font-medium">{formatDate(rel.publishedAt)}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Reader Comments */}
        <div className="pt-8">
          <CommentSection articleSlug={article.slug} />
        </div>
      </article>
    </>
  );
}
