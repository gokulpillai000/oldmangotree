'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Article } from '@/lib/content';
import { formatDate } from '@/lib/format';
import { Lock, BookOpen } from 'lucide-react';

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
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => setActiveSubcategory('all')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 ${
              activeSubcategory === 'all'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
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
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeSubcategory === sub.slug
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{sub.name}</span>
                {count > 0 && (
                  <span
                    className={`ml-1 text-[11px] px-1.5 py-0.2 rounded-full font-medium ${
                      activeSubcategory === sub.slug
                        ? 'bg-brand-700 text-white'
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Articles Grid */}
      {filteredArticles.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-800 space-y-2">
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
              className="group flex flex-col justify-between bg-paper-card dark:bg-paper-cardDark rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-neutral-900">
                  <Image
                    src={article.coverImage}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {article.isPremium && (
                    <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-neutral-900/90 text-neutral-100 border border-neutral-700/80 backdrop-blur-sm flex items-center gap-1 shadow">
                      <Lock className="w-3 h-3 text-brand-400" /> Member
                    </span>
                  )}
                </div>

                <div className="p-4 sm:p-5 space-y-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {article.tags?.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-900"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <Link href={`/articles/${article.slug}`}>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2 leading-snug break-words">
                      {article.title}
                    </h2>
                  </Link>

                  <p className="text-neutral-600 dark:text-neutral-400 text-sm line-clamp-3 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-5 pt-0 border-t border-neutral-100 dark:border-neutral-800 mt-2 space-y-1 text-xs sm:text-sm">
                <p className="font-serif font-bold text-neutral-800 dark:text-neutral-200 line-clamp-1">
                  {article.authorNames}
                </p>
                <div className="flex items-center justify-between text-neutral-500 text-xs">
                  <span>{formatDate(article.publishedAt)}</span>
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
