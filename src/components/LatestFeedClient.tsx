'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Article } from '@/lib/content';
import { formatDate } from '@/lib/format';
import { Clock, Calendar } from 'lucide-react';
import {
  fetchLiveArticlesFromSupabase,
  subscribeToContentUpdates,
  getCachedLiveArticles,
} from '@/lib/liveArticles';

interface LatestFeedClientProps {
  articles: Article[];
}

export function LatestFeedClient({ articles: initialArticles = [] }: LatestFeedClientProps) {
  const [articles, setArticles] = useState<Article[]>(() => {
    const cached = getCachedLiveArticles();
    return cached !== null ? cached : initialArticles;
  });
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(() => {
    const cached = getCachedLiveArticles();
    if (cached !== null) return false;
    return initialArticles.length === 0;
  });

  useEffect(() => {
    let isMounted = true;

    const loadLive = async () => {
      try {
        const live = await fetchLiveArticlesFromSupabase();
        if (isMounted) {
          setArticles(live);
        }
      } catch (err) {
        console.warn('Error fetching live articles for LatestFeedClient:', err);
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

  if (articles.length === 0) {
    if (isLoadingLive) {
      return (
        <div className="py-16 text-center text-neutral-500 font-serif text-lg animate-pulse">
          Loading latest stories...
        </div>
      );
    }
    return (
      <div className="py-12 text-center text-neutral-500 font-serif text-lg">
        No articles available yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {articles.map((article) => (
        <article
          key={article.slug}
          className="relative group flex flex-col justify-between pb-6 border-b border-neutral-200 dark:border-neutral-800 cursor-pointer transition-colors"
        >
          <div>
            <div style={{ position: 'relative' }} className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
              <Image
                src={article.coverImage || '/images/logo-oldmangotree.jpg'}
                alt={article.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
            </div>

            <div className="pt-3 space-y-1.5">
              <Link
                href={`/${article.category.toLowerCase()}`}
                className="relative z-20 inline-block text-xs sm:text-sm font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 underline decoration-brand-600 dark:decoration-brand-400 underline-offset-2 decoration-1 hover:decoration-2"
              >
                {article.category}
              </Link>
              <Link href={`/articles/${article.slug}`}>
                <span className="absolute inset-0 z-10" aria-hidden="true" />
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2 leading-snug break-words">
                  {article.title}
                </h2>
              </Link>
              <p className="text-sm sm:text-base text-neutral-800 dark:text-neutral-200 line-clamp-3 leading-relaxed">
                {article.excerpt}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 mt-2 space-y-1.5 text-xs sm:text-sm">
            <p className="font-serif font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 line-clamp-1 break-words">
              {article.authorNames || (article.authors?.[0] ? article.authors[0] : 'Akhil U Krishnan')}
            </p>
            <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm font-medium">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                {formatDate(article.publishedAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {article.readTimeMinutes || 6} min read
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
