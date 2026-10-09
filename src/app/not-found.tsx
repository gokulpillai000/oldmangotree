'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, Compass, BookOpen, Loader2 } from 'lucide-react';
import { ArticleViewClient } from '@/components/ArticleViewClient';
import { fetchLiveArticleBySlug } from '@/lib/liveArticles';
import type { Article } from '@/lib/content';

export default function NotFound() {
  const [detectedSlug, setDetectedSlug] = useState<string | null>(null);
  const [detectedArticle, setDetectedArticle] = useState<Article | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsChecking(false);
      return;
    }

    const path = window.location.pathname;
    const articlesMatch = path.match(/\/articles\/([^\/]+)/);
    let targetSlug: string | null = null;

    if (articlesMatch && articlesMatch[1] && articlesMatch[1] !== '_empty') {
      targetSlug = decodeURIComponent(articlesMatch[1]);
    } else {
      const segments = path.split('/').filter(Boolean);
      const excludedSections = ['magazine', 'podcasts', 'videos', 'series', 'latest', 'publisher', 'the-team', 'search', 'member', 'pages', 'tag'];
      if (segments.length === 1) {
        const seg = decodeURIComponent(segments[0]);
        if (!excludedSections.includes(seg.toLowerCase()) && seg !== '_empty') {
          targetSlug = seg;
        }
      } else if (segments.length >= 2) {
        const first = segments[0].toLowerCase();
        const last = decodeURIComponent(segments[segments.length - 1]);
        if (!excludedSections.includes(first) && last && last !== '_empty') {
          targetSlug = last;
        }
      }
    }

    if (targetSlug) {
      setDetectedSlug(targetSlug);
      fetchLiveArticleBySlug(targetSlug)
        .then((art) => {
          if (art) {
            setDetectedArticle(art);
          }
          setIsChecking(false);
        })
        .catch(() => {
          setIsChecking(false);
        });
    } else {
      setIsChecking(false);
    }
  }, []);

  if (isChecking && detectedSlug) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center py-20 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#E27A2B]" />
        <p className="font-serif text-lg text-neutral-700 dark:text-neutral-300">
          Loading story...
        </p>
      </div>
    );
  }

  if (detectedArticle && detectedSlug) {
    return <ArticleViewClient slug={detectedSlug} initialArticle={detectedArticle} />;
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16 space-y-6 max-w-2xl mx-auto">
      <div className="w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-700 dark:text-brand-300 mx-auto">
        <Compass className="w-8 h-8 animate-pulse" />
      </div>

      <div className="space-y-2">
        <span className="text-xs uppercase tracking-widest font-bold text-brand-600 dark:text-brand-400">
          404 • Page Not Found
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-100">
          Page Not Found
        </h1>
        <p className="font-sans text-neutral-600 dark:text-neutral-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
          The page you are looking for does not exist, has been removed, or is temporarily unavailable.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-700 hover:bg-brand-600 text-white font-medium text-sm transition-colors shadow-sm"
        >
          <Home className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <Link
          href="/magazine"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-paper-card dark:bg-paper-cardDark border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:border-brand-500 font-medium text-sm transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          <span>Webzine</span>
        </Link>
      </div>
    </div>
  );
}
