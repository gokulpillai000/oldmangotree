'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { performSearch, SearchableArticle, SearchResult } from '@/lib/search';
import { formatDate } from '@/lib/format';
import { Search, Calendar } from 'lucide-react';

interface SearchClientProps {
  initialArticles: SearchableArticle[];
}

export function SearchClient({ initialArticles }: SearchClientProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
    } else {
      const res = performSearch(initialArticles, query);
      setResults(res);
    }
  }, [query, initialArticles]);

  const handleTagClick = (tag: string) => {
    setQuery(tag);
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 sm:left-4 top-3.5 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          placeholder="Search by title, keyword, or tag (e.g., Kerala, Politics, Messi)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full min-w-0 pl-11 sm:pl-12 pr-4 py-3 sm:py-3.5 text-sm sm:text-base rounded-2xl bg-paper-card dark:bg-paper-cardDark border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm font-sans"
          autoFocus
        />
      </div>

      {/* Popular Tag Quick Filters */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="text-neutral-500 font-medium">Quick Tags:</span>
        {['Kerala', 'Politics', 'Ecology', 'Football', 'Culture'].map((tag) => (
          <button
            key={tag}
            onClick={() => handleTagClick(tag)}
            className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-brand-100 dark:hover:bg-brand-950 text-neutral-700 dark:text-neutral-300 transition-colors"
          >
            #{tag}
          </button>
        ))}
      </div>

      {/* Results List */}
      <div className="space-y-4 pt-4">
        {query.trim() !== '' && (
          <p className="text-xs text-neutral-500 font-medium">
            Found {results.length} result{results.length === 1 ? '' : 's'} for &ldquo;{query}&rdquo;
          </p>
        )}

        {results.map((res) => (
          <div
            key={res.slug}
            className="p-4 sm:p-6 rounded-xl bg-paper-card dark:bg-paper-cardDark border border-neutral-200 dark:border-neutral-800 hover:border-brand-500 transition-colors shadow-sm space-y-2.5"
          >
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                {res.category}
              </span>
              <span className="text-neutral-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {formatDate(res.publishedAt)}
              </span>
            </div>

            <Link href={`/articles/${res.slug}`}>
              <h2 className="font-serif text-lg sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50 hover:text-brand-600 dark:hover:text-brand-400 transition-colors leading-snug break-words">
                {res.title}
              </h2>
            </Link>

            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed break-words">
              {res.excerpt}
            </p>

            <div className="pt-2 flex items-center justify-between text-xs sm:text-sm text-neutral-500 border-t border-neutral-100 dark:border-neutral-800">
              <span className="font-serif font-bold text-neutral-800 dark:text-neutral-200 line-clamp-1 break-words">{res.authorNames || 'Editorial Desk'}</span>
              <span>{formatDate(res.publishedAt)}</span>
            </div>
          </div>
        ))}

        {query.trim() !== '' && results.length === 0 && (
          <div className="text-center py-12 text-neutral-500 space-y-2">
            <p>No matching articles found.</p>
            <p className="text-xs">Try searching for keywords like &ldquo;Kerala&rdquo;, &ldquo;Politics&rdquo;, or &ldquo;Ecology&rdquo;.</p>
          </div>
        )}
      </div>
    </div>
  );
}
