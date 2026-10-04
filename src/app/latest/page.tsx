import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllArticles, getAllCategories } from '@/lib/content';
import { formatDate } from '@/lib/format';
import { Newspaper, Clock, Lock, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Latest Stories — oldmangotree',
  description: 'Chronological feed of all latest investigative journalism, podcasts, and essays.',
};

export const revalidate = 60;

export default async function LatestPage() {
  const articles = await getAllArticles(false);
  const categories = getAllCategories();

  return (
    <div className="space-y-8 pb-6 sm:pb-8">
      <header className="border-b border-neutral-200 dark:border-neutral-800 pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
          <Newspaper className="w-4 h-4" />
          <span>Latest Feed</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight break-words">
          Contemporary Articles &amp; News Analysis
        </h1>
        <p className="text-neutral-800 dark:text-neutral-200 text-base sm:text-lg max-w-3xl leading-relaxed">
          Chronological archive of all reports, investigative essays, cultural perspectives, and interviews published by oldmangotree.
        </p>

        {/* Category Quick Filter Chips */}
        <div className="w-full min-w-0 flex items-center gap-3 overflow-x-auto scrollbar-none pt-4">
          <span className="text-sm font-bold uppercase tracking-wider text-neutral-500 shrink-0">
            Sections:
          </span>
          <Link
            href="/latest"
            className="shrink-0 text-sm sm:text-base font-bold text-brand-600 dark:text-brand-400 underline decoration-brand-600 dark:decoration-brand-400 underline-offset-4 decoration-2"
          >
            All
          </Link>
          {categories.slice(0, 8).map((cat) => (
            <Link
              key={cat.slug}
              href={`/${cat.slug}`}
              className="shrink-0 text-sm sm:text-base font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 underline decoration-neutral-300 dark:decoration-neutral-700 hover:decoration-brand-600 dark:hover:decoration-brand-400 underline-offset-4 decoration-1 transition-colors"
            >
              {cat.slug}
            </Link>
          ))}
        </div>
      </header>

      {articles.length === 0 ? (
        <div className="py-12 text-center text-neutral-500">
          No articles available yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {articles.map((article) => (
            <article
              key={article.slug}
              className="relative group flex flex-col justify-between pb-6 border-b border-neutral-200 dark:border-neutral-800 cursor-pointer transition-colors"
            >
              <div>
                <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                  <Image
                    src={article.coverImage}
                    alt={article.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>

                <div className="pt-3 space-y-1.5">
                  <Link
                    href={`/${article.category.toLowerCase()}`}
                    className="relative z-20 inline-block text-xs sm:text-sm font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 underline decoration-brand-600 dark:decoration-brand-400 underline-offset-2 decoration-1 hover:decoration-2"
                  >
                    {article.category}
                  </Link>
                  <Link href={`/articles/${article.slug}`}>
                    <span className="absolute inset-0 z-10" aria-hidden="true" />
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2 leading-snug break-words">
                      {article.title}
                    </h2>
                  </Link>
                  <p className="text-sm sm:text-base text-neutral-800 dark:text-neutral-200 line-clamp-3 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 mt-2 space-y-1.5 text-xs sm:text-sm">
                <p className="font-serif font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 line-clamp-1 break-words">
                  {article.authorNames}
                </p>
                <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm font-medium">
                  <span>{formatDate(article.publishedAt)}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {article.readTimeMinutes || 6} min read
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
