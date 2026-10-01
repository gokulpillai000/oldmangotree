'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Bookmark,
  Clock,
  Trash2,
  BookOpen,
  ArrowRight,
  Mail,
  ChevronRight,
} from 'lucide-react';
import {
  getBookmarks,
  removeBookmark,
  getReadingHistory,
  clearReadingHistory,
  SavedArticle,
} from '@/lib/readerStore';

interface MyLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MyLibraryModal({ isOpen, onClose }: MyLibraryModalProps) {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'history' | 'letters'>('bookmarks');
  const [bookmarks, setBookmarks] = useState<SavedArticle[]>([]);
  const [history, setHistory] = useState<SavedArticle[]>([]);
  const [letters, setLetters] = useState<any[]>([]);

  const loadData = () => {
    setBookmarks(getBookmarks());
    setHistory(getReadingHistory());
    try {
      const raw = localStorage.getItem('omt_reader_letters');
      setLetters(raw ? JSON.parse(raw) : []);
    } catch {
      setLetters([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
    const handleUpdate = () => {
      loadData();
    };
    window.addEventListener('omt-reader-updated', handleUpdate);
    return () => {
      window.removeEventListener('omt-reader-updated', handleUpdate);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRemove = (slug: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeBookmark(slug);
    loadData();
  };

  const handleClearHistory = () => {
    clearReadingHistory();
    loadData();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-paper-card dark:bg-paper-cardDark rounded-t-3xl sm:rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden max-h-[90vh] sm:max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-800 shrink-0">
              <Bookmark className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-serif text-base sm:text-xl font-bold text-neutral-900 dark:text-neutral-50 truncate">
                My Library
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                Your saved articles, reading history &amp; letters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center px-2 sm:px-6 overflow-x-auto scrollbar-none border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/40 text-xs sm:text-sm shrink-0">
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex items-center gap-1.5 sm:gap-2 py-3 px-2.5 sm:px-3 font-semibold border-b-2 shrink-0 transition-colors ${
              activeTab === 'bookmarks'
                ? 'border-brand-700 text-brand-700 dark:border-brand-400 dark:text-brand-400'
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <Bookmark className="w-4 h-4 shrink-0" />
            <span>Saved Stories ({bookmarks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 sm:gap-2 py-3 px-2.5 sm:px-3 font-semibold border-b-2 shrink-0 transition-colors ${
              activeTab === 'history'
                ? 'border-brand-700 text-brand-700 dark:border-brand-400 dark:text-brand-400'
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>History ({history.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('letters')}
            className={`flex items-center gap-1.5 sm:gap-2 py-3 px-2.5 sm:px-3 font-semibold border-b-2 shrink-0 transition-colors ${
              activeTab === 'letters'
                ? 'border-brand-700 text-brand-700 dark:border-brand-400 dark:text-brand-400'
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <Mail className="w-4 h-4 shrink-0" />
            <span>My Letters ({letters.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
          {activeTab === 'bookmarks' && (
            <>
              {bookmarks.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                    <Bookmark className="w-6 h-6" />
                  </div>
                  <p className="font-serif text-base font-bold text-neutral-800 dark:text-neutral-200">
                    No saved articles yet
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                    Click the bookmark icon on any article to save it here for future reading.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookmarks.map((article) => (
                    <div
                      key={article.slug}
                      className="group flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:shadow-sm transition-all"
                    >
                      <Link
                        href={`/articles/${article.slug}`}
                        onClick={onClose}
                        className="flex-1 min-w-0 space-y-1"
                      >
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                          <span>{article.category || 'Article'}</span>
                          {article.publishedAt && <span>• {article.publishedAt}</span>}
                        </div>
                        <h4 className="font-serif text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2 leading-snug">
                          {article.title}
                        </h4>
                        {article.authorNames && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                            {article.authorNames}
                          </p>
                        )}
                      </Link>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => handleRemove(article.slug, e)}
                          title="Remove bookmark"
                          className="p-2 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/articles/${article.slug}`}
                          onClick={onClose}
                          className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 group-hover:bg-brand-700 group-hover:text-white transition-colors"
                        >
                          <span>Read</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'history' && (
            <>
              {history.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                    <Clock className="w-6 h-6" />
                  </div>
                  <p className="font-serif text-base font-bold text-neutral-800 dark:text-neutral-200">
                    No reading history yet
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                    Articles you read on this device will automatically appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                    <span className="text-xs text-neutral-500">Recently read on this device</span>
                    <button
                      onClick={handleClearHistory}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Clear History
                    </button>
                  </div>
                  <div className="space-y-3">
                    {history.map((article) => (
                      <Link
                        key={article.slug}
                        href={`/articles/${article.slug}`}
                        onClick={onClose}
                        className="group flex items-center justify-between gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:shadow-sm transition-all"
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                            <span>{article.category || 'Article'}</span>
                          </div>
                          <h4 className="font-serif text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2 leading-snug">
                            {article.title}
                          </h4>
                          {article.authorNames && (
                            <p className="text-xs text-neutral-500 line-clamp-1">
                              {article.authorNames}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-brand-600 transition-colors shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'letters' && (
            <>
              {letters.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                    <Mail className="w-6 h-6" />
                  </div>
                  <p className="font-serif text-base font-bold text-neutral-800 dark:text-neutral-200">
                    No letters submitted yet
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                    Click the &ldquo;Letter to Editor&rdquo; button on any article to share your perspective with our editorial team.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {letters.map((letter, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs text-neutral-500">
                        <span className="font-bold text-brand-700 dark:text-brand-400">
                          Re: {letter.articleTitle}
                        </span>
                        <span>{new Date(letter.submittedAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed font-sans italic">
                        &ldquo;{letter.message}&rdquo;
                      </p>
                      <div className="text-[11px] text-neutral-400">
                        Sent by: {letter.name} ({letter.location || 'Reader'})
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
