'use client';

import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, Loader2 } from 'lucide-react';
import {
  fetchArticleComments,
  postArticleComment,
  ArticleComment,
  subscribeToArticleComments,
} from '@/lib/supabase';

function formatTimeAgo(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Recent';
  }
}

export function CommentSection({ articleSlug }: { articleSlug: string }) {
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [authorName, setAuthorName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadComments() {
      setIsLoading(true);
      const data = await fetchArticleComments(articleSlug);
      if (mounted) {
        setComments(data);
        setIsLoading(false);
      }
    }

    if (articleSlug) {
      loadComments();
    }

    // Dynamic realtime listener for new comments from other readers
    const unsubscribe = subscribeToArticleComments(articleSlug, () => {
      fetchArticleComments(articleSlug).then((data) => {
        if (mounted) {
          setComments(data);
        }
      });
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [articleSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;

    const author = authorName.trim() || 'Reader';
    const text = commentText.trim();
    setIsSubmitting(true);

    // Optimistic comment
    const tempComment: ArticleComment = {
      id: 'temp_' + Date.now(),
      article_slug: articleSlug,
      author_name: author,
      content: text,
      created_at: new Date().toISOString(),
    };

    setComments((prev) => [tempComment, ...prev]);
    setCommentText('');

    try {
      const res = await postArticleComment(articleSlug, author, text);
      if (res.success && res.comment) {
        // Replace temp comment with confirmed DB comment
        setComments((prev) =>
          prev.map((c) => (c.id === tempComment.id ? res.comment! : c))
        );
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#E27A2B]" />
          <span>Reader Discussions &amp; Comments</span>
        </h3>
        <span className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-medium">
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 bg-neutral-50 dark:bg-neutral-900 p-4 border border-neutral-200 dark:border-neutral-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Your Name (Optional)"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            disabled={isSubmitting}
            className="w-full px-3 py-2 text-sm sm:text-base bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#E27A2B]"
          />
        </div>
        <textarea
          rows={3}
          placeholder="Share your thoughts on this piece..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          disabled={isSubmitting}
          className="w-full px-3 py-2 text-sm sm:text-base bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#E27A2B]"
        />
        <div className="flex items-center justify-between">
          {submitSuccess && (
            <span className="text-xs text-green-600 dark:text-green-400 font-semibold animate-in fade-in">
              Comment posted successfully!
            </span>
          )}
          <div className="ml-auto">
            <button
              type="submit"
              disabled={isSubmitting || !commentText.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-brand-700 hover:bg-brand-600 active:scale-95 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold shadow transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Posting...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Post Comment
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <div className="space-y-3">
        {isLoading ? (
          <div className="py-8 text-center text-neutral-500 text-xs sm:text-sm flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#E27A2B]" /> Loading reader discussion...
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center text-neutral-500 text-xs sm:text-sm">
            Be the first to share your thoughts on this piece.
          </div>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className="pb-4 border-b border-neutral-200 dark:border-neutral-800 space-y-1 animate-in fade-in"
            >
              <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                <span className="font-bold text-neutral-900 dark:text-neutral-100 truncate">{c.author_name}</span>
                <span className="text-neutral-500 dark:text-neutral-400 text-xs shrink-0 font-mono">
                  {formatTimeAgo(c.created_at)}
                </span>
              </div>
              <p className="text-sm sm:text-base text-neutral-800 dark:text-neutral-200 font-sans break-words leading-relaxed whitespace-pre-wrap">
                {c.content}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
