import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllSeries } from '@/lib/content';
import { formatDate } from '@/lib/format';
import { Calendar } from 'lucide-react';

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

      {seriesList.length === 0 ? (
        <div className="py-16 text-center text-neutral-500 font-serif text-lg">
          No special series published yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          {seriesList.map((series) => {
            const latestEpisode =
              series.episodes && series.episodes.length > 0
                ? [...series.episodes].sort(
                    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
                  )[0]
                : null;
            const latestDate = latestEpisode?.publishedAt;

            return (
              <article
                key={series.slug}
                className="group relative flex flex-col pb-5 border-b border-neutral-200 dark:border-neutral-800 cursor-pointer transition-colors"
              >
                {/* Picture Card */}
                <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                  <Image
                    src={series.coverImage || '/images/logo-oldmangotree.jpg'}
                    alt={series.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>

                {/* Title & Latest Episode Release Date */}
                <div className="pt-3.5 space-y-2">
                  <Link href={`/series/${series.slug}`}>
                    <span className="absolute inset-0 z-10" aria-hidden="true" />
                    <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-neutral-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-tight break-words">
                      {series.title}
                    </h2>
                  </Link>

                  {latestDate && (
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{formatDate(latestDate)}</span>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
