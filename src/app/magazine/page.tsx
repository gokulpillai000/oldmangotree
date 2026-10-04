import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllIssues } from '@/lib/content';
import { formatDate } from '@/lib/format';
import { BookOpen, Calendar, ArrowRight } from 'lucide-react';

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

      {/* Issues Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {issues.map((issue) => (
          <article
            key={issue.id}
            className="group relative flex flex-col justify-between pb-6 border-b border-neutral-200 dark:border-neutral-800 cursor-pointer transition-colors"
          >
            <div>
              <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                <Image
                  src={issue.coverImage}
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
    </div>
  );
}
