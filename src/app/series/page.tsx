import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllSeries } from '@/lib/content';
import { BookOpen, Layers, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Special Series — oldmangotree',
  description: 'In-depth serialized cultural, political, and historical investigations.',
};

export const revalidate = 60;

export default async function SeriesIndexPage() {
  const seriesList = await getAllSeries();

  return (
    <div className="space-y-8 sm:space-y-10 pb-6 sm:pb-8">
      <header className="border-b border-neutral-200 dark:border-neutral-800 pb-6 sm:pb-8 space-y-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-widest text-[#E27A2B]">
          <span>Special Series</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight break-words">
          <span className="underline decoration-[#E27A2B] underline-offset-8 decoration-2">
            Investigative Series &amp; Long-Form Columns
          </span>
        </h1>
        <p className="text-neutral-800 dark:text-neutral-200 text-base sm:text-lg max-w-3xl leading-relaxed">
          Extended serialized investigations and literary works authored by prominent writers and thinkers across history, politics, ecology, and culture.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
        {seriesList.map((series) => (
          <article
            key={series.slug}
            className="group relative flex flex-col justify-between pb-6 border-b border-neutral-200 dark:border-neutral-800 cursor-pointer transition-colors"
          >
            <div>
              {/* Picture Card */}
              <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                <Image
                  src={series.coverImage}
                  alt={series.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Content Below Picture */}
              <div className="pt-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-xs sm:text-sm uppercase font-bold tracking-wider text-[#E27A2B] underline decoration-[#E27A2B] underline-offset-2 decoration-1">
                    {series.category || 'Special Series'}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                    {series.totalEpisodes} Parts
                  </span>
                </div>

                <Link href={`/series/${series.slug}`}>
                  <span className="absolute inset-0 z-10" aria-hidden="true" />
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2 leading-snug break-words">
                    {series.title}
                  </h2>
                </Link>

                {series.subtitle && (
                  <p className="text-xs sm:text-sm font-semibold text-[#E27A2B] line-clamp-1">
                    {series.subtitle}
                  </p>
                )}

                <p className="text-neutral-800 dark:text-neutral-200 text-sm sm:text-base line-clamp-3 leading-relaxed">
                  {series.description}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 mt-3 flex items-center justify-between text-xs sm:text-sm">
              <span className="font-serif font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 line-clamp-1">
                {series.authorName}
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#E27A2B] group-hover:text-[#c9661d] flex items-center gap-1 transition-colors shrink-0">
                <span>Read Series</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
