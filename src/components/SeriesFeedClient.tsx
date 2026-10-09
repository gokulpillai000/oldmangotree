'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Series } from '@/lib/content';
import { formatDate } from '@/lib/format';
import { Calendar } from 'lucide-react';
import { fetchLiveSeriesFromSupabase, subscribeToContentUpdates } from '@/lib/liveArticles';

interface SeriesFeedClientProps {
  initialSeries: Series[];
}

export function SeriesFeedClient({ initialSeries }: SeriesFeedClientProps) {
  const [seriesList, setSeriesList] = useState<Series[]>(initialSeries);

  useEffect(() => {
    let isMounted = true;

    const loadLive = async () => {
      try {
        const live = await fetchLiveSeriesFromSupabase();
        if (isMounted && live.length > 0) {
          setSeriesList(live);
        }
      } catch (err) {
        console.warn('Error fetching live series:', err);
      }
    };

    loadLive();

    const unsubscribe = subscribeToContentUpdates(() => {
      loadLive();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  if (seriesList.length === 0) {
    return (
      <div className="py-16 text-center text-neutral-500 font-serif text-lg">
        No special series published yet.
      </div>
    );
  }

  return (
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
  );
}
