import React from 'react';
import Image from 'next/image';
import { Author } from '@/lib/content';
import { Award, UserCheck } from 'lucide-react';

interface AuthorBioCardProps {
  author: Author | null;
  authorNameFallback?: string;
}

export function AuthorBioCard({ author, authorNameFallback }: AuthorBioCardProps) {
  const name = author?.name || authorNameFallback || 'Editorial Desk';
  const role = author?.role || 'Contributor & Columnist';
  const bio =
    author?.bio ||
    'Writing for OldmanGoTree media on contemporary society, cultural perspectives, and political developments.';

  return (
    <section className="p-5 sm:p-6 rounded-2xl bg-paper-card dark:bg-paper-cardDark border border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors my-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {author?.avatar ? (
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden shrink-0 border-2 border-brand-500/30 shadow">
            <Image src={author.avatar} alt={name} fill className="object-cover" />
          </div>
        ) : (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brand-700 text-white flex items-center justify-center font-bold text-xl shrink-0 shadow">
            <UserCheck className="w-8 h-8" />
          </div>
        )}

        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-50">
              {name}
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded-full">
              <Award className="w-3 h-3" /> Author
            </span>
          </div>

          <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">
            {role}
          </p>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans">
            {bio}
          </p>
        </div>
      </div>
    </section>
  );
}
