import React from 'react';
import { getAllIssues } from '@/lib/content';
import { MagazineFeedClient } from '@/components/MagazineFeedClient';

export const revalidate = 60;

export default async function MagazineArchivesPage() {
  const issues = await getAllIssues();

  return (
    <div className="space-y-8 py-4 sm:py-6">
      {/* Page Header */}
      <header className="space-y-3 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#E27A2B] uppercase tracking-widest">
          <span>Webzine Archives</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-neutral-50">
          <span className="underline decoration-[#E27A2B] underline-offset-8 decoration-2">
            Webzine
          </span>
        </h1>
        <p className="text-neutral-800 dark:text-neutral-200 text-base sm:text-lg max-w-2xl leading-relaxed">
          Comprehensive collection of digital webzine editions. In-depth reading on political, cultural, and social topics in every curated issue.
        </p>
      </header>

      {/* Issues Grid with Live Sync */}
      <MagazineFeedClient initialIssues={issues} />
    </div>
  );
}
