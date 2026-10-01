'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, X, Calendar, ArrowRight, BookOpen } from 'lucide-react';
import { formatDate } from '@/lib/format';

interface SearchArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags?: string[];
  publishedAt: string;
  authorNames?: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export function SearchModal({ isOpen, onClose, initialQuery = '' }: SearchModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [articles, setArticles] = useState<SearchArticle[]>([]);
  const [results, setResults] = useState<SearchArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync initial query
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      if (articles.length === 0) {
        setIsLoading(true);
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        fetch(`${basePath}/api/search`)
          .then((res) => res.json())
          .then((data) => {
            if (data?.articles) {
              setArticles(data.articles);
            }
          })
          .catch(() => {})
          .finally(() => setIsLoading(false));
      }
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen, initialQuery, articles.length]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Perform search
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults([]);
      return;
    }

    const filtered = articles.filter((a) => {
      const inTitle = a.title?.toLowerCase().includes(q);
      const inExcerpt = a.excerpt?.toLowerCase().includes(q);
      const inCategory = a.category?.toLowerCase().includes(q);
      const inAuthor = a.authorNames?.toLowerCase().includes(q);
      const inTags = a.tags?.some((t) => t.toLowerCase().includes(q));
      return inTitle || inExcerpt || inCategory || inAuthor || inTags;
    });

    setResults(filtered);
  }, [query, articles]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-3 sm:p-6 sm:pt-16 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[85vh] z-10 animate-in zoom-in-95 duration-200">
        {/* Search Input Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3 bg-slate-50/70 dark:bg-slate-900/60">
          <Search className="w-5 h-5 text-slate-400 shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles, topics, politics, literature..."
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 text-sm sm:text-base focus:outline-none font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors text-xs font-semibold px-2.5"
          >
            Esc
          </button>
        </div>

        {/* Quick Suggestion Tags */}
        <div className="px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 shrink-0 font-medium">Quick Tags:</span>
          {['Kerala', 'Politics', 'Ecology', 'Football', 'Literature', 'Cinema'].map((tag) => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              className="px-2.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#E27A2B] hover:text-white transition-colors shrink-0"
            >
              #{tag}
            </button>
          ))}
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {isLoading && (
            <div className="py-12 text-center text-slate-400 text-sm">
              Loading archive...
            </div>
          )}

          {!isLoading && query && results.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-sm space-y-1">
              <p className="font-semibold text-slate-600 dark:text-slate-300">No articles found</p>
              <p className="text-xs">Try searching for keywords like &ldquo;Kerala&rdquo;, &ldquo;Politics&rdquo;, or &ldquo;Literature&rdquo;.</p>
            </div>
          )}

          {!isLoading && !query && (
            <div className="py-10 text-center text-slate-400 text-xs space-y-1">
              <BookOpen className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="font-medium text-slate-600 dark:text-slate-300 text-sm">Search the Old Mango Tree Archive</p>
              <p>Type keywords to search through articles, essays, and reviews</p>
            </div>
          )}

          {results.map((item) => (
            <Link
              key={item.slug}
              href={`/articles/${item.slug}`}
              onClick={onClose}
              className="block p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-800 transition-colors group"
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold uppercase tracking-wider text-[#E27A2B]">
                  {item.category}
                </span>
                <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                  <Calendar className="w-3 h-3" /> {formatDate(item.publishedAt)}
                </span>
              </div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#E27A2B] transition-colors leading-snug">
                {item.title}
              </h3>
              {item.excerpt && (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                  {item.excerpt}
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
