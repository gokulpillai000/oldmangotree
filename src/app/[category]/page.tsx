import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getArticlesByCategory, getAllCategories } from '@/lib/content';
import { CategoryFeedClient } from '@/components/CategoryFeedClient';
import type { Metadata } from 'next';

interface CategoryPageProps {
  params: {
    category: string;
  };
}

export const dynamicParams = true;

function resolveCategorySlug(slug: string): string {
  const s = slug.toLowerCase().trim();
  if (s === 'miscellaneous' || s === 'fallen mangoes') return 'fallen-mangoes';
  if (s === 'arts-culture' || s === 'art-culture' || s === 'the shade') return 'the-shade';
  if (
    s === 'podcast' ||
    s === 'podcasts' ||
    s === 'audio-and-podcast' ||
    s === 'audio & podcast' ||
    s === 'audio-podcast'
  ) {
    return 'podcasts';
  }
  return s;
}

export function generateStaticParams() {
  const categories = getAllCategories();
  const paramsList = categories.map((cat) => ({
    category: cat.slug,
  }));
  paramsList.push({ category: 'miscellaneous' });
  paramsList.push({ category: 'arts-culture' });
  return paramsList;
}

export function generateMetadata({ params }: CategoryPageProps): Metadata {
  const categories = getAllCategories();
  const resolvedSlug = resolveCategorySlug(params.category);
  const catObj = categories.find((c) => c.slug === resolvedSlug);
  if (!catObj) return { title: 'Category Not Found' };

  return {
    title: `${catObj.name} — oldmangotree`,
    description: catObj.description,
  };
}

export const revalidate = 60;

export default async function CategoryPage({ params }: CategoryPageProps) {
  const resolvedCategory = resolveCategorySlug(params.category);

  if (resolvedCategory === 'podcasts') {
    redirect('/podcasts');
  }

  const categories = getAllCategories();
  const catObj = categories.find((c) => c.slug === resolvedCategory);

  if (!catObj) {
    // If this URL matches a published article slug, redirect to its article page
    const { getArticleBySlug } = await import('@/lib/content');
    const article = await getArticleBySlug(params.category);
    if (article) {
      redirect(`/articles/${article.slug}`);
    }
    notFound();
  }

  const articles = await getArticlesByCategory(resolvedCategory);

  return (
    <div className="space-y-8 pb-6 sm:pb-8 max-w-7xl mx-auto">
      <header className="border-b border-neutral-200 dark:border-neutral-800 pb-6 space-y-2.5">
        <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-widest text-[#E27A2B]">
          <span>Section Feed</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-navy-950 dark:text-neutral-50 tracking-tight break-words">
          <span className="inline-block underline decoration-[#E27A2B] underline-offset-4 decoration-2">
            {catObj.name}
          </span>
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base max-w-2xl leading-relaxed">
          {catObj.description}
        </p>
      </header>

      <CategoryFeedClient
        category={resolvedCategory}
        subcategories={catObj.subcategories}
        articles={articles}
      />
    </div>
  );
}
