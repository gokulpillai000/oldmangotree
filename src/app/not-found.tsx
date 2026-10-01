import React from 'react';
import Link from 'next/link';
import { Home, Compass, BookOpen } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16 space-y-6 max-w-2xl mx-auto">
      <div className="w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-700 dark:text-brand-300 mx-auto">
        <Compass className="w-8 h-8 animate-pulse" />
      </div>

      <div className="space-y-2">
        <span className="text-xs uppercase tracking-widest font-bold text-brand-600 dark:text-brand-400">
          404 • Page Not Found
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-100">
          Page Not Found
        </h1>
        <p className="font-sans text-neutral-600 dark:text-neutral-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
          The page you are looking for does not exist, has been removed, or is temporarily unavailable.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-700 hover:bg-brand-600 text-white font-medium text-sm transition-colors shadow-sm"
        >
          <Home className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <Link
          href="/magazine"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-paper-card dark:bg-paper-cardDark border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:border-brand-500 font-medium text-sm transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          <span>Webzine Editions</span>
        </Link>
      </div>
    </div>
  );
}
