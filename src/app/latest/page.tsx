import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllArticles, getAllCategories } from '@/lib/content';
import { formatDate } from '@/lib/format';
import { Newspaper, Clock, Lock, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Latest Stories — Old Mango Tree',
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
        <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base max-w-2xl leading-relaxed">
          Chronological archive of all reports, investigative essays, cultural perspectives, and interviews published by Old Mango Tree.
        </p>

        {/* Category Quick Filter Chips */}
        <div className="w-full min-w-0 flex items-center gap-2 overflow-x-auto scrollbar-none pt-4">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 shrink-0">
            Sections:
          </span>
          <Link
            href="/latest"
            className="shrink-0 px-3 py-1 rounded-full text-xs font-bold bg-brand-600 text-white"
          >
            All
          </Link>
          {categories.slice(0, 8).map((cat) => (
            <Link
              key={cat.slug}
              href={`/${cat.slug}`}
              className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <article
              key={article.slug}
              className="group flex flex-col justify-between bg-paper-card dark:bg-paper-cardDark rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <div className="relative h-48 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                  <Image
                    src={article.coverImage}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <Link
                      href={`/${article.category}`}
                      className="px-2.5 py-1 rounded-full text-xs font-bold bg-black/75 backdrop-blur-sm text-white uppercase tracking-wider hover:bg-brand-600 transition-colors"
                    >
                      {article.category}
                    </Link>
                  </div>
                  {article.isPremium && (
                    <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded text-[11px] font-serif font-bold uppercase tracking-wider bg-neutral-900/90 text-neutral-100 border border-neutral-700/80 backdrop-blur-sm flex items-center gap-1 shadow">
                      <Lock className="w-3 h-3 text-brand-300" /> Member
                    </span>
                  )}
                </div>

                <div className="p-4 sm:p-5 space-y-3">
                  <Link href={`/articles/${article.slug}`}>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2 leading-snug break-words">
                      {article.title}
                    </h2>
                  </Link>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base line-clamp-3 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-5 pt-0 border-t border-neutral-100 dark:border-neutral-800 mt-3 sm:mt-4 space-y-1.5 text-xs sm:text-sm">
                <p className="font-serif text-base font-bold text-neutral-800 dark:text-neutral-200 line-clamp-1 break-words">
                  {article.authorNames}
                </p>
                <div className="flex items-center justify-between text-neutral-500 text-xs">
                  <span>{formatDate(article.publishedAt)}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
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
