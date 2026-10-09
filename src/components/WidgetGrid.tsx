'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Article, IssuePacket, Podcast, Series, Video } from '@/lib/content';
import { formatDate } from '@/lib/format';
import { ArrowRight, Calendar, Clock, Sparkles, Newspaper } from 'lucide-react';
import { fetchLiveArticlesFromSupabase, subscribeToContentUpdates } from '@/lib/liveArticles';

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
  { slug: 'the-shade', label: 'The shade' },
  { slug: 'literature', label: 'Literature' },
  { slug: 'fallen-mangoes', label: 'Fallen mangoes' },
];

export function WidgetGrid({ articles: initialArticles = [] }: WidgetGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(initialArticles.length === 0);

  useEffect(() => {
    let isMounted = true;

    const loadLive = async () => {
      try {
        const live = await fetchLiveArticlesFromSupabase();
        if (isMounted && live && live.length > 0) {
          setArticles(live);
        }
      } catch (err) {
        console.warn('Error fetching live articles in WidgetGrid:', err);
      } finally {
        if (isMounted) setIsLoadingLive(false);
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

  if (!articles || articles.length === 0) {
    if (isLoadingLive) {
      return (
        <div className="py-20 text-center text-neutral-500 font-serif text-lg animate-pulse">
          Loading stories...
        </div>
      );
    }
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
      : articles.filter((a) => {
          const cat = a.category?.toLowerCase() || '';
          if (selectedCategory === 'the-shade') {
            return (
              cat === 'the-shade' ||
              cat === 'the shade' ||
              cat === 'arts-culture' ||
              cat === 'arts & culture' ||
              a.tags?.some((t) => ['the-shade', 'the shade', 'arts-culture', 'arts & culture'].includes(t.toLowerCase()))
            );
          }
          if (selectedCategory === 'fallen-mangoes') {
            return (
              cat === 'fallen-mangoes' ||
              cat === 'fallen mangoes' ||
              cat === 'miscellaneous' ||
              a.tags?.some((t) => ['fallen-mangoes', 'fallen mangoes', 'miscellaneous'].includes(t.toLowerCase()))
            );
          }
          return (
            cat === selectedCategory.toLowerCase() ||
            a.tags?.some((t) => t.toLowerCase() === selectedCategory.toLowerCase())
          );
        });

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* 1. Lead & Top Highlights Section (Latest 4 Items) */}
      <section className={`grid grid-cols-1 ${highlightArticles.length > 0 ? 'lg:grid-cols-12' : ''} gap-6 sm:gap-8 items-start`}>
        {/* Left Column: Top Latest Lead Story */}
        <div className={`relative ${highlightArticles.length > 0 ? 'lg:col-span-7 lg:border-r lg:pr-8' : 'w-full'} pb-6 border-b lg:border-b-0 border-neutral-200 dark:border-neutral-800 group flex flex-col justify-between cursor-pointer transition-colors`}>
          <div>
            <div style={{ position: 'relative' }} className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
              <Image
                src={leadArticle.coverImage || '/images/logo-oldmangotree.jpg'}
                alt={leadArticle.title}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
                priority
              />
            </div>

            <div className="pt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={`/${leadArticle.category.toLowerCase()}`}
                  className="text-sm sm:text-base font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 underline decoration-brand-600 dark:decoration-brand-400 underline-offset-4 decoration-2 hover:decoration-brand-700 transition-all"
                >
                  {leadArticle.category}
                </Link>
                <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base text-neutral-700 dark:text-neutral-300 font-medium">
                  <span className="font-serif font-bold text-neutral-900 dark:text-neutral-100">
                    {leadArticle.authorNames || (leadArticle.authors?.[0] ? leadArticle.authors[0] : 'Akhil U Krishnan')}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    {formatDate(leadArticle.publishedAt)}
                  </span>
                  {leadArticle.readTimeMinutes && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {leadArticle.readTimeMinutes} min read
                      </span>
                    </>
                  )}
                </div>
              </div>

              <Link href={`/articles/${leadArticle.slug}`}>
                <span className="absolute inset-0 z-10" aria-hidden="true" />
                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-neutral-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-tight">
                  {leadArticle.title}
                </h2>
              </Link>

              <p className="text-neutral-800 dark:text-neutral-200 text-base sm:text-lg lg:text-xl line-clamp-3 leading-relaxed">
                {leadArticle.excerpt}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/80 mt-4">
            <div className="flex items-center justify-between">
              <span
                className="inline-flex items-center gap-2 text-sm sm:text-base font-bold text-brand-600 dark:text-brand-400 group-hover:text-brand-700 dark:group-hover:text-brand-300 group-hover:translate-x-1 transition-transform"
              >
                <span>Read Full Story</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Next 3 Latest Stories (5 cols) */}
        {highlightArticles.length > 0 && (
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
                className="relative flex items-center gap-3 sm:gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800 last:border-b-0 group cursor-pointer transition-colors"
              >
                <div style={{ position: 'relative' }} className="relative w-24 h-24 sm:w-28 sm:h-28 overflow-hidden shrink-0 bg-neutral-100 dark:bg-neutral-800">
                  <Image
                    src={art.coverImage || '/images/logo-oldmangotree.jpg'}
                    alt={art.title}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <Link
                    href={`/${art.category.toLowerCase()}`}
                    className="relative z-20 inline-block text-xs sm:text-sm font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 underline decoration-brand-600 dark:decoration-brand-400 underline-offset-2 decoration-1"
                  >
                    {art.category}
                  </Link>
                  <Link href={`/articles/${art.slug}`}>
                    <span className="absolute inset-0 z-10" aria-hidden="true" />
                    <h4 className="font-serif text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2 leading-snug">
                      {art.title}
                    </h4>
                  </Link>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">
                    {art.authorNames || (art.authors?.[0] ? art.authors[0] : 'Akhil U Krishnan')}
                  </p>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(art.publishedAt)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>

      {/* 2. Latest Stories Feed Grid */}
      {displayArticles.length > 0 && (
        <section className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-50">
                <span className="inline-block underline decoration-[#E27A2B] underline-offset-4 decoration-2">
                  {selectedCategory === 'all'
                    ? 'More Latest Stories'
                    : `${CATEGORY_TABS.find((t) => t.slug === selectedCategory)?.label || selectedCategory}`}
                </span>
              </h2>
                <p className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300">
                  Chronological essays, critiques, and narratives from oldmangotree.
                </p>
              </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-none py-1">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.slug}
                  type="button"
                  onClick={() => setSelectedCategory(tab.slug)}
                  className={`shrink-0 text-sm sm:text-base font-semibold transition-all underline underline-offset-4 ${
                    selectedCategory === tab.slug
                      ? 'text-brand-600 dark:text-brand-400 decoration-brand-600 dark:decoration-brand-400 decoration-2 font-bold'
                      : 'text-neutral-600 dark:text-neutral-400 decoration-neutral-300 dark:decoration-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-100 hover:decoration-brand-600 decoration-1'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {displayArticles.map((art) => (
              <article
                key={art.slug}
                className="relative group flex flex-col justify-between pb-6 border-b border-neutral-200 dark:border-neutral-800 cursor-pointer transition-colors"
              >
                <div>
                  <div style={{ position: 'relative' }} className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    <Image
                      src={art.coverImage || '/images/logo-oldmangotree.jpg'}
                      alt={art.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>

                  <div className="pt-3 space-y-1.5">
                    <Link
                      href={`/${art.category.toLowerCase()}`}
                      className="relative z-20 inline-block text-xs sm:text-sm font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 underline decoration-brand-600 dark:decoration-brand-400 underline-offset-2 decoration-1 hover:decoration-2"
                    >
                      {art.category}
                    </Link>
                    <Link href={`/articles/${art.slug}`}>
                      <span className="absolute inset-0 z-10" aria-hidden="true" />
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2 leading-snug">
                        {art.title}
                      </h3>
                    </Link>
                    <p className="text-sm sm:text-base text-neutral-800 dark:text-neutral-200 line-clamp-3 leading-relaxed">
                      {art.excerpt}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 mt-2 space-y-1.5 text-xs sm:text-sm">
                  <p className="font-serif font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 line-clamp-1">
                    {art.authorNames || (art.authors?.[0] ? art.authors[0] : 'Akhil U Krishnan')}
                  </p>
                  <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(art.publishedAt)}
                    </span>
                    {art.readTimeMinutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {art.readTimeMinutes} min read
                      </span>
                    )}
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
