import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getAllSeries, getSeriesBySlug } from '@/lib/content';
import { formatDate } from '@/lib/format';
import { ArrowLeft, BookOpen, Calendar } from 'lucide-react';

interface SeriesPageProps {
  params: {
    slug: string;
  };
}

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const series = await getAllSeries();
  if (series.length === 0) return [{ slug: '_empty' }];
  return series.map((s) => ({
    slug: s.slug,
  }));
}

export default async function SeriesDetailPage({ params }: SeriesPageProps) {
  const series = await getSeriesBySlug(params.slug);

  if (!series) {
    notFound();
  }

  const latestEpisode =
    series.episodes && series.episodes.length > 0
      ? [...series.episodes].sort(
          (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        )[0]
      : null;
  const latestDate = latestEpisode?.publishedAt;

  return (
    <div className="space-y-8 sm:space-y-12 pb-6 sm:pb-8 max-w-5xl mx-auto">
      {/* Back Button */}
      <div className="pt-2">
        <Link
          href="/series"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Series</span>
        </Link>
      </div>

      {/* Series Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start pb-8 border-b border-neutral-200 dark:border-neutral-800">
        <div className="md:col-span-5 relative aspect-[4/3] md:aspect-square w-full rounded-none overflow-hidden">
          <Image
            src={series.coverImage || '/images/logo-oldmangotree.jpg'}
            alt={series.title}
            fill
            className="object-cover rounded-none"
            priority
          />
        </div>

        <div className="md:col-span-7 space-y-3 min-w-0">
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 dark:text-neutral-50 leading-tight break-words">
            {series.title}
          </h1>

          {latestDate && (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400 py-2 border-y border-neutral-200 dark:border-neutral-800">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              <span>{formatDate(latestDate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Episodes Table of Contents */}
      <div className="space-y-6">
        <div className="border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2 break-words">
            <span>Episodes Directory</span>
          </h2>
          <p className="text-neutral-700 dark:text-neutral-300 text-sm sm:text-base mt-1">
            Click on any chapter below to begin reading in sequence.
          </p>
        </div>

        <div className="space-y-4">
          {series.episodes.map((episode) => (
            <div
              key={episode.slug}
              className="group relative pb-6 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <span className="font-serif text-2xl sm:text-3xl font-bold text-neutral-300 dark:text-neutral-700 group-hover:text-brand-600 transition-colors shrink-0">
                  {String(episode.episodeNumber).padStart(2, '0')}
                </span>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#E27A2B]">
                      Episode {episode.episodeNumber}
                    </span>
                    <span className="text-neutral-300 dark:text-neutral-700">•</span>
                    <span className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(episode.publishedAt)}
                    </span>
                  </div>
                  <Link href={`/articles/${episode.slug}`}>
                    <span className="absolute inset-0 z-10" aria-hidden="true" />
                    <h3 className="font-serif text-base sm:text-xl font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors break-words">
                      {episode.title}
                    </h3>
                  </Link>
                  {episode.excerpt && (
                    <p className="text-sm sm:text-base text-neutral-800 dark:text-neutral-200 line-clamp-2 leading-relaxed break-words">
                      {episode.excerpt}
                    </p>
                  )}
                </div>
              </div>

              <div className="shrink-0 w-full sm:w-auto">
                <span
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-[#E27A2B] group-hover:underline transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Read Chapter</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
