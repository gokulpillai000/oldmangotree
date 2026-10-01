'use client';

import React, { useState } from 'react';
import { useAudio } from './AudioContext';
import { Volume2, Type, Share2, Bookmark } from 'lucide-react';

interface ArticleReaderToolbarProps {
  title: string;
  audioNarrationUrl?: string;
  audioDurationSeconds?: number;
  slug: string;
  onFontSizeChange: (size: 'sm' | 'md' | 'lg') => void;
}

export function ArticleReaderToolbar({
  title,
  audioNarrationUrl,
  audioDurationSeconds,
  slug,
  onFontSizeChange,
}: ArticleReaderToolbarProps) {
  const { playTrack } = useAudio();
  const [activeSize, setActiveSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [copied, setCopied] = useState(false);

  const handleSizeClick = (size: 'sm' | 'md' | 'lg') => {
    setActiveSize(size);
    onFontSizeChange(size);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative z-10 bg-paper-card dark:bg-paper-cardDark border border-neutral-200 dark:border-neutral-800 py-2.5 px-3.5 sm:px-4 my-4 flex items-center justify-between gap-2 shadow-xs rounded-xl">
      {/* Audio Play Trigger */}
      {audioNarrationUrl ? (
        <button
          onClick={() =>
            playTrack({
              title,
              url: audioNarrationUrl,
              durationSeconds: audioDurationSeconds,
              articleSlug: slug,
            })
          }
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-700 hover:bg-brand-600 active:scale-95 text-white text-xs font-bold shadow transition-all"
        >
          <Volume2 className="w-4 h-4" /> Listen Audio
        </button>
      ) : (
        <span className="text-xs font-medium text-neutral-500">Long-form Reader</span>
      )}

      {/* Font Size Adjuster & Share */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5 border border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => handleSizeClick('sm')}
            className={`px-2 py-1 text-xs font-serif rounded ${
              activeSize === 'sm' ? 'bg-white dark:bg-neutral-700 font-bold shadow-xs' : 'text-neutral-500'
            }`}
          >
            A-
          </button>
          <button
            onClick={() => handleSizeClick('md')}
            className={`px-2 py-1 text-xs font-serif rounded ${
              activeSize === 'md' ? 'bg-white dark:bg-neutral-700 font-bold shadow-xs' : 'text-neutral-500'
            }`}
          >
            A
          </button>
          <button
            onClick={() => handleSizeClick('lg')}
            className={`px-2 py-1 text-xs font-serif rounded ${
              activeSize === 'lg' ? 'bg-white dark:bg-neutral-700 font-bold shadow-xs' : 'text-neutral-500'
            }`}
          >
            A+
          </button>
        </div>

        <button
          onClick={handleShare}
          className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 transition-colors"
          title="Share Article Link"
        >
          <Share2 className="w-4 h-4" />
        </button>
        {copied && <span className="text-[10px] text-brand-700 dark:text-brand-300 font-bold">Copied!</span>}
      </div>
    </div>
  );
}
