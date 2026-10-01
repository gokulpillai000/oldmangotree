'use client';

import React, { useState, useEffect } from 'react';
import {
  Share2,
  Check,
  Copy,
  MessageCircle,
  Twitter,
  Facebook,
  Bookmark,
  Heart,
  Mail,
} from 'lucide-react';
import {
  isBookmarked,
  toggleBookmark,
  getArticleReactions,
  toggleReaction,
  recordReadArticle,
} from '@/lib/readerStore';
import { LetterToEditorModal } from './LetterToEditorModal';

interface SocialShareBarProps {
  title: string;
  slug: string;
  category?: string;
  excerpt?: string;
  authorNames?: string;
  coverImage?: string;
  publishedAt?: string;
}

export function SocialShareBar({
  title,
  slug,
  category = 'Article',
  excerpt = '',
  authorNames = '',
  coverImage = '',
  publishedAt = '',
}: SocialShareBarProps) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState('');
  const [bookmarked, setBookmarked] = useState(false);
  const [reaction, setReaction] = useState({ count: 18, hasReacted: false });
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);

  useEffect(() => {
    setUrl(window.location.href);
    setBookmarked(isBookmarked(slug));
    setReaction(getArticleReactions(slug));

    // Automatically record reading history
    recordReadArticle({
      slug,
      title,
      category,
      excerpt,
      authorNames,
      coverImage,
      publishedAt,
    });

    const handleUpdate = () => {
      setBookmarked(isBookmarked(slug));
      setReaction(getArticleReactions(slug));
    };

    window.addEventListener('omt-reader-updated', handleUpdate);
    return () => {
      window.removeEventListener('omt-reader-updated', handleUpdate);
    };
  }, [slug, title, category, excerpt, authorNames, coverImage, publishedAt]);

  const handleBookmarkToggle = () => {
    const newState = toggleBookmark({
      slug,
      title,
      category,
      excerpt,
      authorNames,
      coverImage,
      publishedAt,
    });
    setBookmarked(newState);
  };

  const handleReactionToggle = () => {
    const updated = toggleReaction(slug);
    setReaction(updated);
  };

  const handleCopy = async () => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const shareUrl = url || (typeof window !== 'undefined' ? `${window.location.origin}${basePath}/articles/${slug}` : '');
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const shareUrl = url || (typeof window !== 'undefined' ? `${window.location.origin}${basePath}/articles/${slug}` : '');
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          url: shareUrl,
        });
      } catch {
        // User canceled share
      }
    } else {
      handleCopy();
    }
  };

  const shareUrl = encodeURIComponent(url || `https://oldmangotree.media/articles/${slug}`);
  const shareText = encodeURIComponent(`${title} — OldmanGoTree`);

  return (
    <>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 py-3 px-3.5 sm:px-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs font-medium">
        {/* Reader Engagement Actions (Reactions, Bookmark, Letter) */}
        <div className="flex items-center justify-between sm:justify-start gap-2">
          {/* Reaction / Like */}
          <button
            onClick={handleReactionToggle}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
              reaction.hasReacted
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-bold scale-105'
                : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
            }`}
            title="Applaud this story"
            aria-label="Applaud story"
          >
            <Heart
              className={`w-4 h-4 ${
                reaction.hasReacted ? 'fill-current text-rose-600 dark:text-rose-400' : 'text-neutral-500'
              }`}
            />
            <span>{reaction.count}</span>
          </button>

          {/* Bookmark / Save */}
          <button
            onClick={handleBookmarkToggle}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
              bookmarked
                ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-900 font-bold scale-105'
                : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
            }`}
            title={bookmarked ? 'Saved in My Library' : 'Save to My Library'}
            aria-label="Save story to library"
          >
            <Bookmark
              className={`w-4 h-4 ${
                bookmarked ? 'fill-current text-brand-700 dark:text-brand-400' : 'text-neutral-500'
              }`}
            />
            <span>{bookmarked ? 'Saved' : 'Save'}</span>
          </button>

          {/* Letter to Editor */}
          <button
            onClick={() => setIsLetterModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 transition-colors"
            title="Send letter to editor about this piece"
            aria-label="Send letter to editor"
          >
            <Mail className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Letter</span>
          </button>
        </div>

        {/* Social Share Toolbar */}
        <div className="flex items-center justify-around sm:justify-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-200/60 dark:border-neutral-800">
          <span className="hidden xl:inline text-neutral-500 dark:text-neutral-400 mr-1 text-[11px]">
            Share:
          </span>

          {/* WhatsApp */}
          <a
            href={`https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on WhatsApp"
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden md:inline text-xs">WhatsApp</span>
          </a>

          {/* X / Twitter */}
          <a
            href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on X"
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-neutral-200/80 dark:bg-neutral-800 hover:bg-neutral-300 text-neutral-800 dark:text-neutral-200 transition-colors"
          >
            <Twitter className="w-3.5 h-3.5" />
          </a>

          {/* Facebook */}
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on Facebook"
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 transition-colors"
          >
            <Facebook className="w-3.5 h-3.5" />
          </a>

          {/* Native Share / Copy */}
          <button
            onClick={handleNativeShare}
            aria-label="Copy article link"
            className={`flex items-center gap-1 px-2.5 py-2 rounded-xl transition-colors ${
              copied
                ? 'bg-brand-700 text-white font-bold'
                : 'bg-neutral-200/80 dark:bg-neutral-800 hover:bg-neutral-300 text-neutral-800 dark:text-neutral-200'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span className="text-xs">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Letter to Editor Modal */}
      <LetterToEditorModal
        isOpen={isLetterModalOpen}
        onClose={() => setIsLetterModalOpen(false)}
        articleTitle={title}
        articleSlug={slug}
      />
    </>
  );
}
