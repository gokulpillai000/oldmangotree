import React from 'react';
import Image from 'next/image';
import { Author } from '@/lib/content';
import { UserCheck } from 'lucide-react';

interface AuthorBioCardProps {
  author: Author | null;
  authorNameFallback?: string;
}

export function AuthorBioCard({ author, authorNameFallback }: AuthorBioCardProps) {
  const name = author?.name || authorNameFallback || 'Akhil U Krishnan';
  const role = author?.role || 'Contributor & Columnist';
  const bio =
    author?.bio ||
    'Writing for oldmangotree on contemporary society, cultural perspectives, and political developments.';

  return (
    <section className="py-6 border-y border-neutral-200 dark:border-neutral-800 transition-colors my-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {author?.avatar ? (
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 overflow-hidden shrink-0 bg-neutral-100 dark:bg-neutral-800">
            <Image src={author.avatar} alt={name} fill className="object-cover" />
          </div>
        ) : (
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-brand-700 text-white flex items-center justify-center font-bold text-xl shrink-0 shadow">
            <UserCheck className="w-8 h-8" />
          </div>
        )}

        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-50">
              {name}
            </h3>
            <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#E27A2B] underline decoration-[#E27A2B] underline-offset-2 decoration-1">
              Author
            </span>
          </div>

          <p className="text-xs sm:text-sm font-semibold text-[#E27A2B]">
            {role}
          </p>

          <p className="text-sm sm:text-base text-neutral-800 dark:text-neutral-200 leading-relaxed font-sans">
            {bio}
          </p>
        </div>
      </div>
    </section>
  );
}
