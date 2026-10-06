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
          className="w-full min-w-0 pl-11 sm:pl-12 pr-4 py-3 sm:py-3.5 text-sm sm:text-base bg-paper-card dark:bg-paper-cardDark border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand-500 font-sans"
          autoFocus
        />
      </div>

      {/* Popular Tag Quick Filters */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:text-sm">
        <span className="text-neutral-600 dark:text-neutral-400 font-medium">Quick Tags:</span>
        {['Kerala', 'Politics', 'Ecology', 'Football', 'Culture'].map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleTagClick(tag)}
            className="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-200 hover:text-[#E27A2B] underline decoration-[#E27A2B] underline-offset-4 decoration-1 transition-colors"
          >
            #{tag}
          </button>
        ))}
      </div>

      {/* Results List */}
      <div className="space-y-6 pt-4">
        {query.trim() !== '' && (
          <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 font-medium">
            Found {results.length} result{results.length === 1 ? '' : 's'} for &ldquo;{query}&rdquo;
          </p>
        )}

        {results.map((res) => (
          <div
            key={res.slug}
            className="group relative pb-6 border-b border-neutral-200 dark:border-neutral-800 space-y-2.5 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-bold uppercase tracking-wider text-[#E27A2B] underline decoration-[#E27A2B] underline-offset-2 decoration-1">
                {res.category}
              </span>
              <span className="text-neutral-600 dark:text-neutral-400 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {formatDate(res.publishedAt)}
              </span>
            </div>

            <Link href={`/${res.category.toLowerCase()}/${res.slug}`}>
              <span className="absolute inset-0 z-10" aria-hidden="true" />
              <h2 className="font-serif text-lg sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-snug break-words">
                {res.title}
              </h2>
            </Link>

            <p className="text-sm sm:text-base text-neutral-800 dark:text-neutral-200 line-clamp-2 leading-relaxed break-words">
              {res.excerpt}
            </p>

            <div className="pt-2 flex items-center justify-between text-xs sm:text-sm border-t border-neutral-200 dark:border-neutral-800">
              <span className="font-serif font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 line-clamp-1 break-words">{res.authorNames || 'Akhil U Krishnan'}</span>
              <span className="text-neutral-600 dark:text-neutral-400 font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                {formatDate(res.publishedAt)}
              </span>
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
