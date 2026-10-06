'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Home, RefreshCw, AlertCircle } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Router Caught Error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16 space-y-6 max-w-2xl mx-auto">
      <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-[#E27A2B] mx-auto shadow-inner">
        <AlertCircle className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="text-xs uppercase tracking-widest font-bold text-[#E27A2B]">
          Notice • Page Load Error
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-100">
          Something went wrong
        </h1>
        <p className="font-sans text-neutral-600 dark:text-neutral-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
          An unexpected error occurred while loading this view. You can reload this view or navigate back to the home page.
        </p>
        {process.env.NODE_ENV !== 'production' && error?.message && (
          <p className="text-xs font-mono text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-2.5 rounded-lg border border-red-200 dark:border-red-900/50 max-w-md mx-auto text-left break-words">
            {error.message}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E27A2B] hover:bg-[#cf6b21] text-white font-medium text-sm transition-colors shadow-sm cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-paper-card dark:bg-paper-cardDark border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:border-[#E27A2B] font-medium text-sm transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
}
