import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getArticlesByTag, getAllTags } from '@/lib/content';
import { formatDate } from '@/lib/format';
import { Hash, Lock, Clock, ArrowLeft } from 'lucide-react';

interface TagPageProps {
  params: {
    tag: string;
  };
}

export const revalidate = 60;

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map((tag) => ({
    tag: encodeURIComponent(tag),
  }));
}

export default async function TagPage({ params }: TagPageProps) {
  const rawTag = decodeURIComponent(params.tag);
  const articles = await getArticlesByTag(rawTag);

  return (
    <div className="space-y-8 pb-6 sm:pb-8">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      <header className="border-b border-neutral-200 dark:border-neutral-800 pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-widest text-[#E27A2B]">
          <span>Topic Tag</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-neutral-900 dark:text-neutral-50 break-words">
          <span className="underline decoration-[#E27A2B] underline-offset-8 decoration-2">
            #{rawTag}
          </span>
        </h1>
        <p className="text-neutral-800 dark:text-neutral-200 text-base sm:text-lg max-w-2xl leading-relaxed">
          All articles, essays, and stories published under #{rawTag}.
        </p>
      </header>

      {articles.length === 0 ? (
        <div className="py-12 text-center text-neutral-500">
          No articles found for this tag.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {articles.map((article) => (
            <article
              key={article.slug}
              className="relative group flex flex-col justify-between pb-6 border-b border-neutral-200 dark:border-neutral-800 cursor-pointer transition-colors"
            >
              <div>
                <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                  <Image
                    src={article.coverImage}
                    alt={article.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>

                <div className="pt-3 space-y-2">
                  <Link href={`/articles/${article.slug}`}>
                    <span className="absolute inset-0 z-10" aria-hidden="true" />
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2 leading-snug break-words">
                      {article.title}
                    </h2>
                  </Link>
                  <p className="text-neutral-800 dark:text-neutral-200 text-sm sm:text-base line-clamp-3 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 mt-2 space-y-1.5 text-xs sm:text-sm">
                <p className="font-serif font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 line-clamp-1 break-words">
                  {article.authorNames}
                </p>
                <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm font-medium">
                  <span>{formatDate(article.publishedAt)}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {article.readTimeMinutes || 5} min read
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
