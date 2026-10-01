'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Article, IssuePacket, Podcast, Series, Video } from '@/lib/content';
import { formatDate } from '@/lib/format';
import { useAudio } from './AudioContext';
import { Lock, Volume2, ArrowRight, Calendar, Clock, Sparkles, Newspaper } from 'lucide-react';

interface WidgetGridProps {
  articles: Article[];
  featuredIssue?: IssuePacket | null;
  podcasts?: Podcast[];
  series?: Series[];
  videos?: Video[];
}

const CATEGORY_TABS = [
  { slug: 'all', label: 'All Latest' },
  { slug: 'cinema', label: 'Cinema' },
  { slug: 'sports', label: 'Sports' },
  { slug: 'politics', label: 'Politics' },
  { slug: 'arts-culture', label: 'Arts & Culture' },
  { slug: 'literature', label: 'Literature' },
  { slug: 'miscellaneous', label: 'Miscellaneous' },
];

export function WidgetGrid({ articles }: WidgetGridProps) {
  const { playTrack } = useAudio();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!articles || articles.length === 0) {
    return (
      <div className="py-16 text-center text-neutral-500 font-serif text-lg">
        No articles published yet.
      </div>
    );
  }

  // Pure latest items sorted chronologically
  const leadArticle = articles[0];
  const highlightArticles = articles.slice(1, 4);
  const remainingArticles = articles.slice(4);

  // Dynamic category filter on the latest stories feed
  const displayArticles =
    selectedCategory === 'all'
      ? remainingArticles
      : articles.filter(
          (a) =>
            a.category.toLowerCase() === selectedCategory.toLowerCase() ||
            a.tags?.some((t) => t.toLowerCase() === selectedCategory.toLowerCase())
        );

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* 1. Lead & Top Highlights Section (Latest 4 Items) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: Top Latest Lead Story (7 cols) */}
        <div className="lg:col-span-7 bg-paper-card dark:bg-paper-cardDark rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm hover:shadow-lg transition-shadow group flex flex-col justify-between">
          <div>
            <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
              <Image
                src={leadArticle.coverImage}
                alt={leadArticle.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                priority
              />
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider bg-brand-600 text-white shadow">
                {leadArticle.category}
              </span>
              {leadArticle.isPremium && (
                <span className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-neutral-900/90 text-neutral-100 border border-neutral-700/80 backdrop-blur-sm shadow-sm">
                  <Lock className="w-3 h-3 text-brand-400" /> Premium
                </span>
              )}
            </div>

            <div className="p-5 sm:p-7 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-neutral-500">
                <span className="font-serif font-bold text-neutral-800 dark:text-neutral-200">
                  {leadArticle.authorNames}
                </span>
                <span>•</span>
                <span>{formatDate(leadArticle.publishedAt)}</span>
                {leadArticle.readTimeMinutes && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {leadArticle.readTimeMinutes} min read
                    </span>
                  </>
                )}
              </div>

              <Link href={`/articles/${leadArticle.slug}`}>
                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-neutral-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-tight">
                  {leadArticle.title}
                </h2>
              </Link>

              <p className="text-neutral-600 dark:text-neutral-300 text-base sm:text-lg line-clamp-3 leading-relaxed">
                {leadArticle.excerpt}
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-7 pt-0 border-t border-neutral-100 dark:border-neutral-800/80 mt-2">
            <div className="flex items-center justify-between pt-4">
              <Link
                href={`/articles/${leadArticle.slug}`}
                className="inline-flex items-center gap-2 text-sm sm:text-base font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 group-hover:translate-x-1 transition-transform"
              >
                <span>Read Full Story</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {leadArticle.audioNarrationUrl && (
                <button
                  type="button"
                  onClick={() =>
                    playTrack({
                      title: leadArticle.title,
                      speaker: leadArticle.authorNames || 'Editorial Audio',
                      url: leadArticle.audioNarrationUrl!,
                      durationSeconds: leadArticle.audioDurationSeconds,
                      articleSlug: leadArticle.slug,
                    })
                  }
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow transition-all shrink-0"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Listen</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Next 3 Latest Stories (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h3 className="font-serif text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-50">
              Latest Highlights
            </h3>
          </div>

          <div className="space-y-4">
            {highlightArticles.map((art) => (
              <article
                key={art.slug}
                className="flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl bg-paper-card dark:bg-paper-cardDark border border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow group"
              >
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden shrink-0 bg-neutral-100 dark:bg-neutral-800">
                  <Image
                    src={art.coverImage}
                    alt={art.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/75 text-white">
                    {art.category}
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <Link href={`/articles/${art.slug}`}>
                    <h4 className="font-serif text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2 leading-snug">
                      {art.title}
                    </h4>
                  </Link>
                  <p className="text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 line-clamp-1">
                    {art.authorNames}
                  </p>
                  <p className="text-xs text-neutral-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(art.publishedAt)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Latest Stories Feed Grid */}
      {displayArticles.length > 0 && (
        <section className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
            <div className="flex items-center gap-2.5">
              <Newspaper className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-50">
                  {selectedCategory === 'all'
                    ? 'More Latest Stories'
                    : `${CATEGORY_TABS.find((t) => t.slug === selectedCategory)?.label || selectedCategory}`}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                  Chronological essays, critiques, and narratives from Old Mango Tree.
                </p>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.slug}
                  type="button"
                  onClick={() => setSelectedCategory(tab.slug)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    selectedCategory === tab.slug
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayArticles.map((art) => (
              <article
                key={art.slug}
                className="group flex flex-col justify-between bg-paper-card dark:bg-paper-cardDark rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="relative h-48 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    <Image
                      src={art.coverImage}
                      alt={art.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <Link
                        href={`/${art.category}`}
                        className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/75 text-white hover:bg-brand-600 transition-colors"
                      >
                        {art.category}
                      </Link>
                    </div>
                    {art.isPremium && (
                      <span className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-neutral-900/90 text-neutral-100 border border-neutral-700/80 backdrop-blur-sm shadow-sm">
                        <Lock className="w-3 h-3 text-brand-400" /> Premium
                      </span>
                    )}
                  </div>

                  <div className="p-5 space-y-2">
                    <Link href={`/articles/${art.slug}`}>
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2 leading-snug">
                        {art.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                      {art.excerpt}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-neutral-100 dark:border-neutral-800 mt-2 space-y-1.5 text-xs sm:text-sm">
                  <p className="font-serif font-bold text-neutral-800 dark:text-neutral-200 line-clamp-1">
                    {art.authorNames}
                  </p>
                  <div className="flex items-center justify-between text-neutral-500 text-xs">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(art.publishedAt)}
                    </span>
                    <Link
                      href={`/articles/${art.slug}`}
                      className="font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5"
                    >
                      <span>Read</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* 3. Link to Full Chronological Archive */}
      <div className="flex justify-center pt-4 pb-2">
        <Link
          href="/latest"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-serif font-bold text-sm sm:text-base hover:bg-brand-600 dark:hover:bg-brand-500 dark:hover:text-white shadow-md hover:shadow-lg transition-all"
        >
          <span>View All Chronological Stories</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
