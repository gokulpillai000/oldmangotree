'use client';

import React, { useState } from 'react';
import { Type, Share2, Bookmark } from 'lucide-react';

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
    <div className="relative z-10 border-y border-neutral-200 dark:border-neutral-800 py-2.5 my-4 flex items-center justify-between gap-2 transition-colors">
      <span className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400">Long-form Reader</span>

      {/* Font Size Adjuster & Share */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-0.5 border border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => handleSizeClick('sm')}
            className={`px-2.5 py-1 text-xs sm:text-sm font-serif ${
              activeSize === 'sm' ? 'bg-white dark:bg-neutral-700 font-bold shadow-xs text-neutral-900 dark:text-neutral-100' : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            A-
          </button>
          <button
            onClick={() => handleSizeClick('md')}
            className={`px-2.5 py-1 text-xs sm:text-sm font-serif ${
              activeSize === 'md' ? 'bg-white dark:bg-neutral-700 font-bold shadow-xs text-neutral-900 dark:text-neutral-100' : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            A
          </button>
          <button
            onClick={() => handleSizeClick('lg')}
            className={`px-2.5 py-1 text-xs sm:text-sm font-serif ${
              activeSize === 'lg' ? 'bg-white dark:bg-neutral-700 font-bold shadow-xs text-neutral-900 dark:text-neutral-100' : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            A+
          </button>
        </div>

        <button
          onClick={handleShare}
          className="p-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
          title="Share Article Link"
        >
          <Share2 className="w-4 h-4" />
        </button>
        {copied && <span className="text-xs text-[#E27A2B] font-bold">Copied!</span>}
      </div>
    </div>
  );
}
