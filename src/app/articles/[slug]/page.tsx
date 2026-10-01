import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getArticleBySlug, getAllArticles, getAuthorById, getRelatedArticles } from '@/lib/content';
import { formatDate } from '@/lib/format';
import { Paywall } from '@/components/Paywall';
import { CommentSection } from '@/components/CommentSection';
import { ArticleBody } from '@/components/ArticleBody';
import { ReadingProgressBar } from '@/components/ReadingProgressBar';
import { SocialShareBar } from '@/components/SocialShareBar';
import { AuthorBioCard } from '@/components/AuthorBioCard';
import { Calendar, Clock, ArrowLeft, User, Tag, BookOpen } from 'lucide-react';

interface ArticlePageProps {
  params: {
    slug: string;
  };
}

export const revalidate = 60;

export async function generateStaticParams() {
  const articles = await getAllArticles();
  return articles.map((a) => ({
    slug: a.slug,
  }));
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = params;
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
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Webzine
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
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
              {article.category}
            </span>
            {article.webzineIssue && (
              <Link
                href={`/magazine/${article.webzineIssue}`}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:underline"
              >
                {article.webzineIssue.toUpperCase()}
              </Link>
            )}
            {article.isPremium && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                Premium Read
              </span>
            )}
          </div>

          <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-neutral-50 leading-tight break-words">
            {article.title}
          </h1>

          <p className="text-base sm:text-xl lg:text-2xl text-neutral-600 dark:text-neutral-300 font-serif leading-relaxed italic break-words">
            {article.excerpt}
          </p>

          {/* Author & Metadata Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 py-3 sm:py-4 border-y border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 min-w-0">
              {authorObj?.avatar ? (
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden shrink-0 border border-neutral-200 shadow-sm">
                  <Image src={authorObj.avatar} alt={authorObj.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-brand-700 text-white flex items-center justify-center font-bold shrink-0">
                  <User className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-serif font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 truncate">
                  {authorObj ? authorObj.name : article.authors?.[0] || 'Editorial Desk'}
                </p>
                <p className="text-xs text-neutral-500 truncate">{authorObj?.role || 'Contributor'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(article.publishedAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {article.readTimeMinutes || 6} min read
              </span>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {article.coverImage && (
          <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-lg">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

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

        {/* Paywall Guard for Premium Content */}
        {article.isPremium ? <Paywall articleTitle={article.title} /> : null}

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

        {/* Author Bio Card */}
        <AuthorBioCard author={authorObj} authorNameFallback={article.authors?.[0]} />

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex items-center gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <Tag className="w-4 h-4 text-neutral-400" />
            <div className="flex flex-wrap gap-1.5">
              {article.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}`}
                  className="px-2.5 py-1 rounded-md text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-sans hover:bg-brand-50 hover:text-brand-600 transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Articles / More from this Webzine Packet */}
        {relatedArticles.length > 0 && (
          <section className="space-y-4 pt-8 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                More Stories
              </h2>
              {article.webzineIssue && (
                <Link
                  href={`/magazine/${article.webzineIssue}`}
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  View Full Packet →
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/articles/${rel.slug}`}
                  className="group flex flex-col justify-between p-4 rounded-xl bg-paper-card dark:bg-paper-cardDark border border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-all"
                >
                  <div className="space-y-2">
                    <div className="relative h-28 w-full rounded-lg overflow-hidden">
                      <Image
                        src={rel.coverImage}
                        alt={rel.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/70 text-white">
                        {rel.category}
                      </span>
                    </div>
                    <h3 className="font-serif text-base font-bold text-neutral-900 dark:text-neutral-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2 leading-snug">
                      {rel.title}
                    </h3>
                  <div className="mt-2 space-y-0.5 text-xs sm:text-sm">
                    <p className="font-serif font-bold text-neutral-800 dark:text-neutral-200 line-clamp-1">{rel.authorNames}</p>
                    <p className="text-xs text-neutral-500">{formatDate(rel.publishedAt)}</p>
                  </div>
                </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Comments Section */}
        <CommentSection articleSlug={article.slug} />
      </article>
    </>
  );
}
