'use client';

import React from 'react';
import { X, Volume2, Calendar, User, Clock, Bookmark, Share2, Tag } from 'lucide-react';

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

      {/* Main Preview Container - Completely Opaque Solid Paper Background */}
      <div className="relative z-10 w-full max-w-4xl max-h-[94vh] bg-[#fcfbf7] dark:bg-[#0a1424] text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 shadow-2xl overflow-y-auto rounded-sm flex flex-col">
        {/* Sticky Preview Top Bar */}
        <div className="sticky top-0 z-20 px-4 sm:px-6 py-3 bg-[#0C2340] text-white flex items-center justify-between border-b border-neutral-700 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#E27A2B] text-white text-[10px] font-bold uppercase tracking-wider rounded-xs">
              Live Reader Preview
            </span>
            <span className="text-xs text-neutral-300 hidden sm:inline font-mono">
              Exact typography and styling as seen by readers
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-white/10 rounded-xs transition-colors cursor-pointer"
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Article Document Canvas */}
        <div className="p-6 sm:p-12 max-w-3xl mx-auto w-full space-y-6">
          {/* Top Breadcrumb / Category / Packet */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-bold text-[#E27A2B] uppercase tracking-wider">
              {category || 'Politics'}
            </span>
            {packet && packet !== 'None' && (
              <>
                <span className="text-neutral-400">•</span>
                <span className="px-2 py-0.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold uppercase text-[10px] rounded-xs">
                  {packet}
                </span>
              </>
            )}
            {tags && tags.length > 0 && (
              <div className="flex items-center gap-1 ml-auto flex-wrap">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-[10px] rounded-xs flex items-center gap-0.5"
                  >
                    <Tag className="w-2.5 h-2.5 text-[#E27A2B]" />
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Article Title */}
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-neutral-50 leading-tight">
            {title || 'Untitled Article'}
          </h1>

          {/* Subtitle / Excerpt */}
          {excerpt && (
            <p className="text-base sm:text-xl text-neutral-700 dark:text-neutral-300 font-serif leading-relaxed italic border-l-3 border-[#E27A2B] pl-4 py-1">
              {excerpt}
            </p>
          )}

          {/* Byline & Read-time metadata */}
          <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-y border-neutral-200 dark:border-neutral-800 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            <div className="flex items-center gap-3">
              <span className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#E27A2B]" /> {author || 'Akhil U Krishnan'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />{' '}
                {new Date().toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {readTimeMin} min read
              </span>
            </div>

            <div className="flex items-center gap-3 text-neutral-400">
              <span className="flex items-center gap-1 hover:text-[#E27A2B] transition-colors cursor-pointer">
                <Bookmark className="w-4 h-4" /> Save
              </span>
              <span className="flex items-center gap-1 hover:text-[#E27A2B] transition-colors cursor-pointer">
                <Share2 className="w-4 h-4" /> Share
              </span>
            </div>
          </div>

          {/* Audio Narration Bar */}
          {audioUrl && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-semibold">
                <Volume2 className="w-5 h-5 text-[#E27A2B] shrink-0" />
                <div>
                  <p className="font-bold">Listen to Audio Narration</p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono truncate max-w-xs">
                    {audioUrl}
                  </p>
                </div>
              </div>
              <audio controls src={audioUrl} className="h-8 max-w-full sm:max-w-xs w-full" />
            </div>
          )}

          {/* Cover Photo */}
          {coverImage && (
            <div className="relative overflow-hidden rounded-xs shadow-md border border-neutral-200 dark:border-neutral-800">
              <img
                src={coverImage}
                alt={title}
                className="w-full h-auto max-h-[500px] object-cover"
              />
            </div>
          )}

          {/* Article Body HTML Content */}
          <div
            className="tiptap ProseMirror max-w-none text-neutral-900 dark:text-neutral-100 font-serif text-base sm:text-lg leading-relaxed space-y-4 pt-2"
            dangerouslySetInnerHTML={{
              __html:
                contentHtml ||
                '<p class="text-neutral-400 italic">No content written yet...</p>',
            }}
          />

          {/* Editorial Desk Sign-off */}
          <div className="pt-8 mt-12 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 font-mono flex items-center justify-between">
            <span>oldmangotree Editorial Desk</span>
            <span>{wordCount} words</span>
          </div>
        </div>
      </div>
    </div>
  );
}
