'use client';

import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export function CommentSection({ articleSlug }: { articleSlug: string }) {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author: 'Anil Kumar',
      text: 'A profound reading and perceptive analysis! Looking forward to the next webzine edition.',
      timestamp: '2 hours ago',
    },
  ]);
  const [authorName, setAuthorName] = useState('');
  const [commentText, setCommentText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      author: authorName.trim() || 'Reader',
      text: commentText.trim(),
      timestamp: 'Just now',
    };

    setComments([newComment, ...comments]);
    setCommentText('');
  };

  return (
    <section className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <span>Reader Discussions &amp; Comments</span>
        </h3>
        <span className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-medium">
          Community Comments
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 bg-neutral-50 dark:bg-neutral-900 p-4 border border-neutral-200 dark:border-neutral-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Your Name (Optional)"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="w-full px-3 py-2 text-sm sm:text-base bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#E27A2B]"
          />
        </div>
        <textarea
          rows={3}
          placeholder="Share your thoughts on this piece..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="w-full px-3 py-2 text-sm sm:text-base bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#E27A2B]"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-brand-700 hover:bg-brand-600 text-white text-xs sm:text-sm font-semibold shadow transition-colors"
          >
            <Send className="w-3.5 h-3.5" /> Post Comment
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {comments.map((c) => (
          <div
            key={c.id}
            className="pb-4 border-b border-neutral-200 dark:border-neutral-800 space-y-1"
          >
            <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
              <span className="font-bold text-neutral-900 dark:text-neutral-100 truncate">{c.author}</span>
              <span className="text-neutral-600 dark:text-neutral-400 font-medium shrink-0">{c.timestamp}</span>
            </div>
            <p className="text-sm sm:text-base text-neutral-800 dark:text-neutral-200 font-sans break-words leading-relaxed">{c.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
