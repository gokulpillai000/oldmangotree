'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Article } from '@/lib/content';
import { formatDate } from '@/lib/format';
import { Lock, BookOpen, PlusCircle, Edit3, ShieldCheck, ArrowRight } from 'lucide-react';
import { getStoredSession, UserSession } from '@/lib/clientAuth';

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
  const [publisherSession, setPublisherSession] = useState<UserSession | null>(null);

  useEffect(() => {
    const syncSession = () => {
      const sess = getStoredSession();
      if (sess && sess.role === 'publisher') {
        setPublisherSession(sess);
      } else {
        setPublisherSession(null);
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
      {/* Publisher View Section Toolbar */}
      {publisherSession && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-[#0C2340] text-white border border-slate-700 shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <ShieldCheck className="w-4 h-4 text-[#E27A2B]" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Publisher View Active
                </span>
                <span className="text-slate-400 text-xs hidden md:inline">
                  • Curating {category.replace(/-/g, ' ').toUpperCase()} section
                </span>
              </div>
              <p className="text-[11px] text-slate-400 pt-0.5">
                Click any story below to edit, or write new content for this section.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/publisher?category=${category}&tab=editor`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E27A2B] hover:bg-[#c9661d] text-white font-bold text-xs shadow-sm transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Write in {category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</span>
            </Link>
            <Link
              href="/publisher"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-sm transition-colors"
            >
              <span>Desk</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

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
                    src={article.coverImage}
                    alt={article.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                  {/* In-Context Edit Story Button for Publisher */}
                  {publisherSession && (
                    <div className="absolute top-2.5 right-2.5 z-30">
                      <Link
                        href={`/publisher?edit=${article.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-950/90 hover:bg-[#E27A2B] text-white text-xs font-bold shadow-lg backdrop-blur-md transition-colors border border-white/20"
                        title={`Edit "${article.title}" in Publisher Desk`}
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#E27A2B] group-hover:text-white" />
                        <span>Edit Story</span>
                      </Link>
                    </div>
                  )}
                </div>

                <div className="pt-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 relative z-20">
                    <span className="text-xs sm:text-sm uppercase font-bold tracking-wider text-[#E27A2B] underline decoration-[#E27A2B] underline-offset-2 decoration-1">
                      {article.category}
                    </span>
                    {article.tags && article.tags.length > 0 && (
                      <span className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                        #{article.tags[0]}
                      </span>
                    )}
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
                  {article.authorNames}
                </p>
                <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm font-medium">
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
