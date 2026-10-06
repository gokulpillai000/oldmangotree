'use client';

import React from 'react';
import { X, Volume2, Calendar, Tag, ArrowLeft, BookOpen } from 'lucide-react';

interface ArticlePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  excerpt: string;
  contentHtml: string;
  category: string;
  tags?: string[];
  author: string;
  coverImage?: string;
  audioUrl?: string;
  packet?: string;
}

export function ArticlePreviewModal({
  isOpen,
  onClose,
  title,
  excerpt,
  contentHtml,
  category,
  tags = [],
  author,
  coverImage,
  audioUrl,
  packet,
}: ArticlePreviewModalProps) {
  if (!isOpen) return null;

  const plainText = contentHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = plainText ? plainText.split(' ').length : 0;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Main Preview Container - Completely Opaque Solid Paper Background matching reader */}
      <div className="relative z-10 w-full max-w-4xl max-h-[94vh] bg-paper-card dark:bg-paper-cardDark text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 shadow-2xl overflow-y-auto rounded-sm flex flex-col">
        {/* Sticky Preview Top Bar */}
        <div className="sticky top-0 z-20 px-4 sm:px-6 py-3 bg-[#0C2340] text-white flex items-center justify-between border-b border-neutral-700 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 bg-[#E27A2B] text-white text-xs sm:text-sm font-black uppercase tracking-wider rounded-sm shadow-xs">
              Live Reader Preview
            </span>
            <span className="text-xs sm:text-sm text-neutral-200 hidden sm:inline font-mono font-bold">
              Exact typography and layout identical to the live website
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-white/10 rounded-xs transition-colors cursor-pointer"
            title="Close Preview"
            aria-label="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Article Document Canvas - Exact replica of src/app/articles/[slug]/page.tsx */}
        <article className="max-w-3xl mx-auto w-full space-y-6 p-6 sm:p-12">
          {/* Back navigation mockup */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500">
              <ArrowLeft className="w-4 h-4" /> Back to Webzine
            </span>

            {packet && packet !== 'None' && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{packet.toUpperCase()} Issue</span>
              </span>
            )}
          </div>

          {/* Article Header: Category, Title, Excerpt */}
          <header className="space-y-4 sm:space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 underline decoration-brand-600 dark:decoration-brand-400 underline-offset-4 decoration-2">
                {category || 'Politics'}
              </span>
              {packet && packet !== 'None' && (
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 underline decoration-neutral-300 dark:decoration-neutral-700 underline-offset-4 decoration-1">
                  {packet.toUpperCase()} Issue
                </span>
              )}
            </div>

            <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-neutral-50 leading-tight break-words">
              {title || 'Untitled Article'}
            </h1>

            {excerpt && (
              <p className="text-base sm:text-xl lg:text-2xl text-neutral-800 dark:text-neutral-200 font-serif leading-relaxed italic break-words">
                {excerpt}
              </p>
            )}
          </header>

          {/* Featured Image (Rendered right above byline) */}
          {coverImage && (
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border border-neutral-200 dark:border-neutral-800">
              <img
                src={coverImage}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Author Name & Published Date (Displayed below cover image with border-y) */}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 py-2.5 sm:py-3 border-y border-neutral-200 dark:border-neutral-800 text-xs sm:text-sm">
            <span className="font-serif font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100">
              {author || 'Akhil U Krishnan'}
            </span>
            <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 font-medium">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              <span className="text-neutral-400 font-mono ml-2">• {readTimeMin} min read</span>
            </span>
          </div>

          {/* Audio Narration Bar (if audio track attached) */}
          {audioUrl && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-semibold">
                <Volume2 className="w-5 h-5 text-[#E27A2B] shrink-0" />
                <div>
                  <p className="font-bold">Listen to Audio Narration</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 font-mono font-semibold truncate max-w-xs">
                    {audioUrl}
                  </p>
                </div>
              </div>
              <audio controls src={audioUrl} className="h-8 max-w-full sm:max-w-xs w-full" />
            </div>
          )}

          {/* Article Body Content (Exact reader prose styling) */}
          <div
            className="prose dark:prose-invert max-w-none font-text is__text text-lg sm:text-xl leading-relaxed mt-6"
            dangerouslySetInnerHTML={{
              __html:
                contentHtml ||
                '<p class="text-neutral-400 italic">No article content written yet...</p>',
            }}
          />

          {/* Tags at bottom */}
          {tags && tags.length > 0 && (
            <div className="flex items-center gap-2 pt-6 border-t border-neutral-200 dark:border-neutral-800">
              <Tag className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 underline decoration-brand-600 dark:decoration-brand-400 underline-offset-4 decoration-1 font-sans"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sign-off footer */}
          <div className="pt-8 mt-12 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 font-mono flex items-center justify-between">
            <span>oldmangotree Reader Edition</span>
            <span>{wordCount} words</span>
          </div>
        </article>
      </div>
    </div>
  );
}
