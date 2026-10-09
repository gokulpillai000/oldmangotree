import React from 'react';
import Link from 'next/link';
import { getAllArticles, getAllCategories } from '@/lib/content';
import { Newspaper } from 'lucide-react';
import { LatestFeedClient } from '@/components/LatestFeedClient';

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

      {/* Articles Feed */}
      <LatestFeedClient articles={articles} />
    </div>
  );
}
