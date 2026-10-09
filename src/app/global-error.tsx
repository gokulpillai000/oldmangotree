'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Home, RefreshCw, AlertTriangle } from 'lucide-react';

function resolveFriendlyErrorInfo(error?: Error & { digest?: string }): {
  badge: string;
  title: string;
  description: string;
  suggestion: string;
} {
  const raw = (error?.message || '').toLowerCase();

  if (raw.includes('unexpected token') || raw.includes('doctype') || raw.includes('is not valid json')) {
    return {
      badge: 'Data Formatting Notice',
      title: 'Content Loading Notice',
      description: 'The server returned an unexpected response while retrieving published content.',
      suggestion: 'The live site cache may be syncing. Please click Try Again below to reload the latest stories.',
    };
  }

  if (raw.includes('failed to fetch') || raw.includes('network') || raw.includes('timeout') || raw.includes('offline')) {
    return {
      badge: 'Network Connection Notice',
      title: 'Unable to Reach Service',
      description: 'We could not establish a connection to load this content. Please check your internet connection.',
      suggestion: 'Verify your network connection and click Try Again.',
    };
  }

  if (raw.includes('chunkloaderror') || raw.includes('loading chunk')) {
    return {
      badge: 'Update Available',
      title: 'New Version Available',
      description: 'The publication has been updated with new assets and improvements.',
      suggestion: 'Please reload or click Try Again to load the newest version.',
    };
  }

  return {
    badge: 'System Notification',
    title: 'Application Error',
    description: 'A temporary layout error occurred.',
    suggestion: 'You can retry loading or return to the main publication.',
  };
}

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

  const info = resolveFriendlyErrorInfo(error);

  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#FFFDF9] dark:bg-[#121212] text-neutral-900 dark:text-neutral-100 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1a1a1a] shadow-xl">
          <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-[#E27A2B] mx-auto shadow-inner">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest font-bold text-[#E27A2B]">
              {info.badge}
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold">
              {info.title}
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {info.description}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {info.suggestion}
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
