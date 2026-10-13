'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, Compass, BookOpen, Loader2 } from 'lucide-react';
import { ArticleViewClient } from '@/components/ArticleViewClient';
import { MagazinePacketClient } from '@/components/MagazinePacketClient';
import { SeriesDetailClient } from '@/components/SeriesDetailClient';
import {
  fetchLiveArticleBySlug,
  fetchLiveArticlesFromSupabase,
  buildIssuesFromArticles,
  buildSeriesFromArticles,
} from '@/lib/liveArticles';
import type { Article, IssuePacket, Series } from '@/lib/content';

export default function NotFound() {
  const [detectedSlug, setDetectedSlug] = useState<string | null>(null);
  const [detectedArticle, setDetectedArticle] = useState<Article | null>(null);

  const [detectedIssue, setDetectedIssue] = useState<IssuePacket | null>(null);
  const [detectedIssueArticles, setDetectedIssueArticles] = useState<Article[]>([]);

  const [detectedSeriesSlug, setDetectedSeriesSlug] = useState<string | null>(null);
  const [detectedSeries, setDetectedSeries] = useState<Series | null>(null);

  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [loadingLabel, setLoadingLabel] = useState<string>('Loading story...');

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsChecking(false);
      return;
    }

    const path = window.location.pathname;

    // 1. Check for Magazine Packet URLs (/magazine/:packet)
    const magazineMatch = path.match(/\/magazine\/([^\/]+)/);
    if (magazineMatch && magazineMatch[1] && magazineMatch[1] !== '_empty') {
      const rawPacket = decodeURIComponent(magazineMatch[1]);
      const cleanTarget = rawPacket.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      setLoadingLabel('Loading webzine issue...');

      fetchLiveArticlesFromSupabase()
        .then((liveArticles) => {
          const liveIssues = buildIssuesFromArticles(liveArticles);
          const matched = liveIssues.find((i) => {
            const cleanId = i.id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            return (
              cleanId === cleanTarget ||
              i.id.toLowerCase() === rawPacket.toLowerCase() ||
              i.title.toLowerCase() === rawPacket.toLowerCase()
            );
          });

          if (matched) {
            setDetectedIssue(matched);
            const matchedArticles = liveArticles.filter((a) => matched.articleSlugs.includes(a.slug));
            setDetectedIssueArticles(matchedArticles);
          } else if (cleanTarget) {
            const numMatch = cleanTarget.match(/\d+/);
            const issueNumber = numMatch ? parseInt(numMatch[0], 10) : 1;
            const formattedTitle = rawPacket
              .replace(/[-_]+/g, ' ')
              .trim()
              .replace(/\b\w/g, (char) => char.toUpperCase());
            const title = formattedTitle.toLowerCase().startsWith('packet')
              ? formattedTitle
              : `Packet ${formattedTitle}`;
            const matchingArticles = liveArticles.filter((art) => {
              const artIssue = (art.webzineIssue || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
              return artIssue === cleanTarget || (art.webzineIssue || '').toLowerCase() === rawPacket.toLowerCase();
            });
            setDetectedIssue({
              id: cleanTarget,
              title: title || `Packet ${cleanTarget}`,
              issueNumber,
              theme: matchingArticles[0]?.title || `${title}: Webzine Edition`,
              publishedAt: matchingArticles[0]?.publishedAt || new Date().toISOString(),
              coverImage: matchingArticles[0]?.coverImage || '/images/logo-oldmangotree.jpg',
              isPremium: matchingArticles.some((a) => a.isPremium),
              featuredArticleSlug: matchingArticles[0]?.slug || '',
              articleSlugs: matchingArticles.map((a) => a.slug),
            });
            setDetectedIssueArticles(matchingArticles);
          }
          setIsChecking(false);
        })
        .catch(() => {
          setIsChecking(false);
        });
      return;
    }

    // 2. Check for Series URLs (/series/:slug)
    const seriesMatch = path.match(/\/series\/([^\/]+)/);
    if (seriesMatch && seriesMatch[1] && seriesMatch[1] !== '_empty') {
      const rawSeriesSlug = decodeURIComponent(seriesMatch[1]);
      const cleanSeriesTarget = rawSeriesSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      setLoadingLabel('Loading special series...');
      setDetectedSeriesSlug(cleanSeriesTarget);

      fetchLiveArticlesFromSupabase()
        .then((liveArticles) => {
          const liveSeriesList = buildSeriesFromArticles(liveArticles);
          const matched = liveSeriesList.find((s) => {
            const cleanId = s.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            return cleanId === cleanSeriesTarget || s.slug.toLowerCase() === rawSeriesSlug.toLowerCase();
          });

          if (matched) {
            setDetectedSeries(matched);
          }
          setIsChecking(false);
        })
        .catch(() => {
          setIsChecking(false);
        });
      return;
    }

    // 3. Check for Articles (/articles/:slug or /:category/:slug)
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
      setLoadingLabel('Loading story...');
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

  if (isChecking && (detectedSlug || detectedIssue || detectedSeriesSlug)) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center py-20 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#E27A2B]" />
        <p className="font-serif text-lg text-neutral-700 dark:text-neutral-300">
          {loadingLabel}
        </p>
      </div>
    );
  }

  if (detectedIssue) {
    return (
      <MagazinePacketClient
        initialIssue={detectedIssue}
        initialArticles={detectedIssueArticles}
      />
    );
  }

  if (detectedSeriesSlug) {
    return (
      <SeriesDetailClient
        slug={detectedSeriesSlug}
        initialSeries={detectedSeries}
      />
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
