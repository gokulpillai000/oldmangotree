'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Article } from '@/lib/content';
import { formatDate } from '@/lib/format';
import { Lock, BookOpen, Calendar } from 'lucide-react';

interface CategoryFeedClientProps {
  category: string;
  subcategories?: { slug: string; name: string }[];
  articles: Article[];
}

export function CategoryFeedClient({
  category,
  subcategories,
  articles,
}: CategoryFeedClientProps) {
  const [activeSubcategory, setActiveSubcategory] = useState<string>('all');

  const filteredArticles = useMemo(() => {
    if (activeSubcategory === 'all') {
      return articles;
    }

    const selectedSub = subcategories?.find((s) => s.slug === activeSubcategory);
    const subName = selectedSub?.name.toLowerCase() || activeSubcategory.toLowerCase();
    const subSlug = activeSubcategory.toLowerCase().replace(/-/g, ' ');

    return articles.filter((art) => {
      const tags = art.tags?.map((t) => t.toLowerCase()) || [];
      return (
        tags.includes(subName) ||
        tags.includes(subSlug) ||
        tags.some((t) => t.includes(subSlug) || subSlug.includes(t)) ||
        art.title.toLowerCase().includes(subSlug) ||
        art.excerpt.toLowerCase().includes(subSlug)
      );
    });
  }, [activeSubcategory, articles, subcategories]);

  return (
    <div className="space-y-6">

      {/* Subcategory Tabs (e.g. for Literature: Book Review, Short Stories) */}
      {subcategories && subcategories.length > 0 && (
        <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none border-b border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => setActiveSubcategory('all')}
            className={`text-xs sm:text-sm font-bold transition-all shrink-0 underline underline-offset-4 ${
              activeSubcategory === 'all'
                ? 'text-brand-600 dark:text-brand-400 decoration-brand-600 dark:decoration-brand-400 decoration-2'
                : 'text-neutral-600 dark:text-neutral-400 decoration-neutral-300 dark:decoration-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-100 hover:decoration-brand-600 decoration-1'
            }`}
          >
            All Stories ({articles.length})
          </button>
          {subcategories.map((sub) => {
            const count = articles.filter((art) => {
              const tags = art.tags?.map((t) => t.toLowerCase()) || [];
              const subSlug = sub.slug.toLowerCase().replace(/-/g, ' ');
              return (
                tags.includes(sub.name.toLowerCase()) ||
                tags.includes(subSlug) ||
                tags.some((t) => t.includes(subSlug) || subSlug.includes(t)) ||
                art.title.toLowerCase().includes(subSlug)
              );
            }).length;

            return (
              <button
                key={sub.slug}
                type="button"
                onClick={() => setActiveSubcategory(sub.slug)}
                className={`text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-1.5 underline underline-offset-4 ${
                  activeSubcategory === sub.slug
                    ? 'text-brand-600 dark:text-brand-400 decoration-brand-600 dark:decoration-brand-400 decoration-2'
                    : 'text-neutral-600 dark:text-neutral-400 decoration-neutral-300 dark:decoration-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-100 hover:decoration-brand-600 decoration-1'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{sub.name}</span>
                {count > 0 && (
                  <span className="ml-1 text-[11px] font-medium text-neutral-500">
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Articles Grid */}
      {filteredArticles.length === 0 ? (
        <div className="py-16 text-center bg-neutral-50 dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-800 space-y-2">
          <p className="font-serif text-lg font-bold text-neutral-700 dark:text-neutral-300">
            No articles in this section yet.
          </p>
          <p className="text-sm text-neutral-500">
            Our editorial collective is curating new long-form stories and essays.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredArticles.map((article) => (
            <article
              key={article.slug}
              className="relative group flex flex-col justify-between pb-6 border-b border-neutral-200 dark:border-neutral-800 cursor-pointer transition-colors"
            >
              <div>
                <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-neutral-900">
                  <Image
                    src={article.coverImage || '/images/logo-oldmangotree.jpg'}
                    alt={article.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>

                <div className="pt-3 space-y-1.5">
                  <div className="flex items-center gap-2 relative z-20">
                    <span className="text-xs sm:text-sm uppercase font-bold tracking-wider text-[#E27A2B] underline decoration-[#E27A2B] underline-offset-2 decoration-1">
                      {article.category}
                    </span>
                  </div>

                  <Link href={`/articles/${article.slug}`}>
                    <span className="absolute inset-0 z-10" aria-hidden="true" />
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2 leading-snug break-words">
                      {article.title}
                    </h2>
                  </Link>

                  <p className="text-sm sm:text-base text-neutral-800 dark:text-neutral-200 line-clamp-3 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 mt-2 space-y-1 text-xs sm:text-sm">
                <p className="font-serif font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 line-clamp-1">
                  {article.authorNames || (article.authors?.[0] ? article.authors[0] : 'Akhil U Krishnan')}
                </p>
                <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm font-medium">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    {formatDate(article.publishedAt)}
                  </span>
                  <span>{article.readTimeMinutes || 5} min read</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
