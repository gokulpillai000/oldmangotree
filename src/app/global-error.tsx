'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Home, RefreshCw, AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Root Global Error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#FFFDF9] dark:bg-[#121212] text-neutral-900 dark:text-neutral-100 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1a1a1a] shadow-xl">
          <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-[#E27A2B] mx-auto shadow-inner">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest font-bold text-[#E27A2B]">
              System Notification
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold">
              Application Error
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              A temporary layout error occurred. You can retry loading or return to the main publication.
            </p>
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-neutral-300 dark:border-neutral-700 font-medium text-sm transition-colors hover:border-[#E27A2B]"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
