'use client';

import React, { useState } from 'react';
import { X, Send, Mail, CheckCircle2, MessageSquare } from 'lucide-react';

interface LetterToEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  articleTitle?: string;
  articleSlug?: string;
}

export function LetterToEditorModal({
  isOpen,
  onClose,
  articleTitle,
  articleSlug,
}: LetterToEditorModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    try {
      const lettersKey = 'omt_reader_letters';
      const raw = localStorage.getItem(lettersKey);
      const list = raw ? JSON.parse(raw) : [];
      list.unshift({
        articleSlug: articleSlug || 'general',
        articleTitle: articleTitle || 'General Feedback',
        name: name.trim(),
        email: email.trim(),
        location: location.trim(),
        message: message.trim(),
        submittedAt: new Date().toISOString(),
      });
      localStorage.setItem(lettersKey, JSON.stringify(list));
    } catch {}

    setSubmitted(true);
    setTimeout(() => {
      setName('');
      setEmail('');
      setLocation('');
      setMessage('');
    }, 1000);
  };

  const handleClose = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-paper-card dark:bg-paper-cardDark rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-5 sm:p-7 overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-brand-700 dark:text-brand-400">
              <Mail className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Reader Dialogue</span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50">
              Letter to the Editor
            </h2>
            {articleTitle && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 italic font-serif">
                Re: &ldquo;{articleTitle}&rdquo;
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 -mr-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-10 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-50">
                Letter Forwarded to Editorial Desk
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
                Thank you for your response. Selected letters will be reviewed and published in the webzine edition.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="mt-4 px-6 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-600 text-white font-medium text-xs sm:text-sm transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@domain.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                City / Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Kozhikode, Thrissur, Dubai, Bengaluru"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Your Letter / Perspective *
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your critiques, agreements, or new observations on this article..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 leading-relaxed font-sans"
              />
            </div>

            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Selected reader letters will be reviewed and featured on Old Mango Tree editorial pages.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-600 text-white font-medium text-xs sm:text-sm shadow-sm transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Send Letter</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
