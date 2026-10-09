'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { IssuePacket } from '@/lib/content';
import { formatDate } from '@/lib/format';
import { BookOpen, ArrowRight } from 'lucide-react';
import { fetchLiveIssuesFromSupabase, subscribeToContentUpdates } from '@/lib/liveArticles';

interface MagazineFeedClientProps {
  initialIssues: IssuePacket[];
}

export function MagazineFeedClient({ initialIssues }: MagazineFeedClientProps) {
  const [issues, setIssues] = useState<IssuePacket[]>(initialIssues);

  useEffect(() => {
    let isMounted = true;

    const loadLive = async () => {
      try {
        const live = await fetchLiveIssuesFromSupabase();
        if (isMounted && live.length > 0) {
          setIssues(live);
        }
      } catch (err) {
        console.warn('Error fetching live webzine issues:', err);
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

  if (issues.length === 0) {
    return (
      <div className="py-16 text-center text-neutral-500 font-serif text-lg">
        No webzine issues published yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {issues.map((issue) => (
        <article
          key={issue.id}
          className="group relative flex flex-col justify-between pb-6 border-b border-neutral-200 dark:border-neutral-800 cursor-pointer transition-colors"
        >
          <div>
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
              <Image
                src={issue.coverImage || '/images/logo-oldmangotree.jpg'}
                alt={issue.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
            </div>

            <div className="pt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#E27A2B] underline decoration-[#E27A2B] underline-offset-2 decoration-1">
                  PACKET {issue.issueNumber}
                </span>
                <span className="text-neutral-600 dark:text-neutral-400 font-medium font-sans">
                  {formatDate(issue.publishedAt)}
                </span>
              </div>
              <Link href={`/magazine/${issue.id}`}>
                <span className="absolute inset-0 z-10" aria-hidden="true" />
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-snug">
                  {issue.theme}
                </h2>
              </Link>
              <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 font-medium">
                <BookOpen className="w-4 h-4 text-[#E27A2B]" />
                {issue.articleSlugs.length} Articles included in this issue
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 mt-2 flex items-center justify-between text-xs sm:text-sm font-bold text-[#E27A2B]">
            <span>Read Full Webzine</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </article>
      ))}
    </div>
  );
}
