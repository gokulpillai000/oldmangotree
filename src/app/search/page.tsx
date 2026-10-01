import React from 'react';
import { getAllArticles } from '@/lib/content';
import { SearchClient } from '@/components/SearchClient';

export default async function SearchPage() {
  const articles = await getAllArticles();
  const searchableArticles = articles.map((a) => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    category: a.category,
    tags: a.tags,
    publishedAt: a.publishedAt,
    content: a.content,
  }));

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      <header className="text-center space-y-3">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-50">
          Search Webzine Archive
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 text-sm">
          Search across articles, topics, tags, and webzine issues.
        </p>
      </header>

      <SearchClient initialArticles={searchableArticles} />
    </div>
  );
}
