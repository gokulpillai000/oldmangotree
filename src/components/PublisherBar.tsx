'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  PenTool,
  ArrowRight,
  PlusCircle,
  Edit3,
  ShieldCheck,
} from 'lucide-react';
import { getStoredSession, UserSession } from '@/lib/clientAuth';

export function PublisherBar() {
  const [session, setSession] = useState<UserSession | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const syncSession = () => {
      const sess = getStoredSession();
      if (sess && sess.role === 'publisher') {
        setSession(sess);
      } else {
        setSession(null);
      }
    };
    syncSession();

    window.addEventListener('omt-auth-changed', syncSession);
    window.addEventListener('storage', syncSession);
    return () => {
      window.removeEventListener('omt-auth-changed', syncSession);
      window.removeEventListener('storage', syncSession);
    };
  }, []);

  const currentPath = pathname || '';

  // Normal users never see this. Only signed-in publishers on public pages see it.
  if (!session || session.role !== 'publisher' || currentPath.startsWith('/publisher')) {
    return null;
  }

  // Detect if currently on an article page
  const isArticlePage = currentPath.startsWith('/articles/');
  const articleSlug = isArticlePage ? currentPath.replace(/^\/articles\//, '').replace(/\/$/, '') : null;

  // Detect if currently on a category page (e.g. /literature, /politics, /cinema)
  const isCategoryPage =
    currentPath !== '' &&
    currentPath !== '/' &&
    !currentPath.startsWith('/articles/') &&
    !currentPath.startsWith('/pages') &&
    !currentPath.startsWith('/tag') &&
    !currentPath.startsWith('/search') &&
    !currentPath.startsWith('/the-team');

  const currentCategorySlug = isCategoryPage ? currentPath.replace(/^\//, '').split('/')[0] : null;
  const currentCategoryName = currentCategorySlug
    ? currentCategorySlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : null;

  return (
    <aside
      aria-label="Editorial Desk Bar"
      className="fixed bottom-16 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl transition-all duration-300"
    >
      <div className="bg-neutral-900/95 dark:bg-neutral-950/95 backdrop-blur-md text-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-2xl border border-neutral-700/80 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        {/* Left: Publisher View Badge */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>

          <div className="flex items-center gap-1.5 flex-wrap">
            <ShieldCheck className="w-4 h-4 text-[#E27A2B] shrink-0" />
            <span className="text-xs font-bold tracking-wide">
              Publisher View Active
            </span>
            <span className="hidden md:inline-block text-[11px] text-neutral-400">
              • {session.name}
            </span>
            {currentCategorySlug && currentCategoryName && (
              <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-md bg-[#E27A2B]/20 text-[#E27A2B] font-bold border border-[#E27A2B]/40">
                {currentCategoryName}
              </span>
            )}
          </div>
        </div>

        {/* Center / Right Actions */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Edit current article if on an article page */}
          {isArticlePage && articleSlug && (
            <Link
              href={`/publisher?edit=${articleSlug}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E27A2B] hover:bg-[#c9661d] text-white font-bold text-xs shadow-sm transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit this Story</span>
            </Link>
          )}

          {/* New article button if on category page */}
          {currentCategorySlug && (
            <Link
              href={`/publisher?category=${currentCategorySlug}&tab=editor`}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#E27A2B]" />
              <span>+ New Story</span>
            </Link>
          )}

          {/* Open Main Desk */}
          <Link
            href="/publisher"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-xs shadow-sm transition-colors"
          >
            <PenTool className="w-3.5 h-3.5 text-[#E27A2B]" />
            <span>Open Desk</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
