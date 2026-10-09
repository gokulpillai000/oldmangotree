'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Home, RefreshCw, AlertCircle } from 'lucide-react';

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

  if (raw.includes('supabase') || raw.includes('database') || raw.includes('relation')) {
    return {
      badge: 'Database Notice',
      title: 'Temporary Content Delay',
      description: 'Our content database took longer than usual to respond.',
      suggestion: 'Please click Try Again to re-fetch the latest articles.',
    };
  }

  return {
    badge: 'Notice • Page Load Error',
    title: 'Something went wrong',
    description: 'An unexpected issue occurred while rendering this page.',
    suggestion: 'You can reload this view or navigate back to the home page.',
  };
}

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = React.useState(false);

  useEffect(() => {
    console.error('App Router Caught Error:', error);
  }, [error]);

  const info = resolveFriendlyErrorInfo(error);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16 space-y-6 max-w-2xl mx-auto">
      <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-[#E27A2B] mx-auto shadow-inner">
        <AlertCircle className="w-8 h-8" />
      </div>

      <div className="space-y-3">
        <span className="text-xs uppercase tracking-widest font-bold text-[#E27A2B]">
          {info.badge}
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-100">
          {info.title}
        </h1>
        <p className="font-sans text-neutral-600 dark:text-neutral-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
          {info.description}
        </p>
        <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
          {info.suggestion}
        </p>

        {error?.message && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 underline transition-colors"
            >
              {showDetails ? 'Hide diagnostic details' : 'View diagnostic details'}
            </button>
            {showDetails && (
              <div className="mt-2 text-xs font-mono text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-200 dark:border-red-900/50 max-w-lg mx-auto text-left break-words">
                <p className="font-semibold">Diagnostic details:</p>
                <p className="mt-1">{error.message}</p>
                {error.digest && <p className="mt-1 text-neutral-500">Digest: {error.digest}</p>}
              </div>
            )}
          </div>
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
