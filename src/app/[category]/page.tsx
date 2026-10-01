import React from 'react';
import { notFound } from 'next/navigation';
import { getArticlesByCategory, getAllCategories } from '@/lib/content';
import { CategoryFeedClient } from '@/components/CategoryFeedClient';
import type { Metadata } from 'next';

interface CategoryPageProps {
  params: {
    category: string;
  };
}

export function generateStaticParams() {
  const categories = getAllCategories();
  return categories.map((cat) => ({
    category: cat.slug,
  }));
}

export function generateMetadata({ params }: CategoryPageProps): Metadata {
  const categories = getAllCategories();
  const catObj = categories.find((c) => c.slug === params.category);
  if (!catObj) return { title: 'Category Not Found' };

  return {
    title: `${catObj.name} — Old Mango Tree`,
    description: catObj.description,
  };
}

export const revalidate = 60;

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = params;
  const categories = getAllCategories();
  const catObj = categories.find((c) => c.slug === category);

  if (!catObj) {
    notFound();
  }

  const articles = await getArticlesByCategory(category);

  return (
    <div className="space-y-8 pb-6 sm:pb-8 max-w-7xl mx-auto">
      <header className="border-b border-neutral-200 dark:border-neutral-800 pb-6 space-y-2.5">
        <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 px-3 py-1 rounded-full border border-brand-200 dark:border-brand-900">
          <span>{catObj.icon || '📖'}</span>
          <span>Section Feed</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-navy-950 dark:text-neutral-50 tracking-tight break-words">
          {catObj.name}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base max-w-2xl leading-relaxed">
          {catObj.description}
        </p>
      </header>

      <CategoryFeedClient
        category={category}
        subcategories={catObj.subcategories}
        articles={articles}
      />
    </div>
  );
}
