import React from 'react';
import { getAllSeries } from '@/lib/content';
import { SeriesFeedClient } from '@/components/SeriesFeedClient';

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

      {/* Series Grid with Live Sync */}
      <SeriesFeedClient initialSeries={seriesList} />
    </div>
  );
}
