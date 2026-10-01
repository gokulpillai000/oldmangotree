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
        <div className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest">
          <BookOpen className="w-4 h-4" /> Webzine Packet Archives
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-neutral-50">
          Webzine Issues &amp; Packets
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base max-w-2xl leading-relaxed">
          Comprehensive collection of digital webzine packets. In-depth reading on political, cultural, and social topics in every curated issue.
        </p>
      </header>

      {/* Issues Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {issues.map((issue) => (
          <article
            key={issue.id}
            className="group flex flex-col justify-between bg-paper-card dark:bg-paper-cardDark rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div>
              <div className="relative h-64 sm:h-72 w-full overflow-hidden">
                <Image
                  src={issue.coverImage}
                  alt={issue.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold tracking-wider bg-brand-600 text-white shadow">
                  PACKET {issue.issueNumber}
                </span>
                {issue.isPremium && (
                  <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded text-[11px] font-serif font-bold uppercase tracking-wider bg-neutral-900/90 text-neutral-100 border border-neutral-700/80 backdrop-blur-sm shadow">
                    Member Pass
                  </span>
                )}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="text-xs text-neutral-300 font-sans flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(issue.publishedAt)}
                  </p>
                  <h2 className="font-serif text-xl font-bold leading-tight mt-1">
                    {issue.theme}
                  </h2>
                </div>
              </div>

              <div className="p-5 space-y-2">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 font-medium">
                  <BookOpen className="w-4 h-4 text-brand-600" />
                  {issue.articleSlugs.length} Articles included in this issue
                </p>
              </div>
            </div>

            <div className="p-5 pt-0">
              <Link
                href={`/magazine/${issue.id}`}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-brand-600 text-neutral-800 hover:text-white dark:bg-neutral-800 dark:hover:bg-brand-600 dark:text-neutral-200 dark:hover:text-white text-xs font-bold transition-colors shadow-sm"
              >
                <span>Read Full Packet</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
