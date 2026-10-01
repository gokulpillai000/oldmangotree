import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllSeries } from '@/lib/content';
import { BookOpen, Layers, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Special Series — Old Mango Tree',
  description: 'In-depth serialized cultural, political, and historical investigations.',
};

export const revalidate = 60;

export default async function SeriesIndexPage() {
  const seriesList = await getAllSeries();

  return (
    <div className="space-y-8 sm:space-y-10 pb-6 sm:pb-8">
      <header className="border-b border-neutral-200 dark:border-neutral-800 pb-6 sm:pb-8 space-y-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
          <Layers className="w-4 h-4" />
          <span>Special Series</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight break-words">
          Investigative Series &amp; Long-Form Columns
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base max-w-3xl leading-relaxed">
          Extended serialized investigations and literary works authored by prominent writers and thinkers across history, politics, ecology, and culture.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {seriesList.map((series) => (
          <article
            key={series.slug}
            className="group flex flex-col justify-between bg-paper-card dark:bg-paper-cardDark rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm hover:shadow-lg transition-all"
          >
            <div>
              <div className="relative h-60 sm:h-72 w-full overflow-hidden bg-neutral-900">
                <Image
                  src={series.coverImage}
                  alt={series.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-600 text-white shadow-md">
                    <BookOpen className="w-3.5 h-3.5" />
                    {series.totalEpisodes} Episodes
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-300">
                    {series.authorName}
                  </p>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold leading-tight mt-1 line-clamp-2 break-words">
                    {series.title}
                  </h2>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                {series.subtitle && (
                  <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">
                    {series.subtitle}
                  </p>
                )}
                <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base line-clamp-3 leading-relaxed">
                  {series.description}
                </p>

                {/* Episode Preview List */}
                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Episodes in this Series:
                  </span>
                  <div className="space-y-1.5">
                    {series.episodes.slice(0, 3).map((ep) => (
                      <div
                        key={ep.slug}
                        className="flex items-center gap-2 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 min-w-0"
                      >
                        <span className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {ep.episodeNumber}
                        </span>
                        <span className="line-clamp-1 min-w-0 flex-1">{ep.title}</span>
                      </div>
                    ))}
                    {series.episodes.length > 3 && (
                      <p className="text-xs text-neutral-400 pl-7 italic">
                        + {series.episodes.length - 3} more episodes...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 pt-0 mt-2 sm:mt-4">
              <Link
                href={`/series/${series.slug}`}
                className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-brand-600 hover:text-white dark:hover:bg-brand-600 text-neutral-900 dark:text-neutral-100 text-sm font-bold transition-colors group-hover:bg-brand-600 group-hover:text-white"
              >
                <span>Read Full Series</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
