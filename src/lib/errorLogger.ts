import { getSupabase } from './supabase';

export interface FriendlyErrorInfo {
  badge: string;
  title: string;
  description: string;
  suggestion: string;
}

/**
 * Maps runtime errors into user-friendly diagnostic messages.
 * Shared across `src/app/error.tsx` and `src/app/global-error.tsx`.
 */
export function resolveFriendlyErrorInfo(
  error?: (Error & { digest?: string }) | null,
  isGlobal: boolean = false
): FriendlyErrorInfo {
  const raw = (error?.message || '').toLowerCase();

  if (
    raw.includes('unexpected token') ||
    raw.includes('doctype') ||
    raw.includes('is not valid json')
  ) {
    return {
      badge: 'Data Formatting Notice',
      title: 'Content Loading Notice',
      description:
        'The server returned an unexpected response while retrieving published content.',
      suggestion:
        'The live site cache may be syncing. Please click Try Again below to reload the latest stories.',
    };
  }

  if (
    raw.includes('failed to fetch') ||
    raw.includes('network') ||
    raw.includes('timeout') ||
    raw.includes('offline')
  ) {
    return {
      badge: 'Network Connection Notice',
      title: 'Unable to Reach Service',
      description:
        'We could not establish a connection to load this content. Please check your internet connection.',
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

  if (isGlobal) {
    return {
      badge: 'System Notification',
      title: 'Application Error',
      description: 'A temporary layout error occurred.',
      suggestion: 'You can retry loading or return to the main publication.',
    };
  }

  return {
    badge: 'Notice • Page Load Error',
    title: 'Something went wrong',
    description: 'An unexpected issue occurred while rendering this page.',
    suggestion: 'You can reload this view or navigate back to the home page.',
  };
}

/**
 * Reports an application or runtime error to Supabase `error_logs` table
 * (and falls back gracefully if offline or table is not yet provisioned).
 */
export async function reportError(
  error: (Error & { digest?: string }) | unknown,
  context: string = 'app'
): Promise<void> {
  const errObj = error instanceof Error ? error : new Error(String(error ?? 'Unknown error'));
  const digest = (error as any)?.digest || null;

  console.error(`[ErrorTracker:${context}]`, errObj);

  try {
    const client = getSupabase();
    if (!client) return;

    await client.from('error_logs').insert({
      message: errObj.message || 'Unknown error',
      stack: errObj.stack ? String(errObj.stack).slice(0, 4000) : null,
      digest,
      context,
      url: typeof window !== 'undefined' ? window.location.href : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    });
  } catch {
    // Never let error reporting throw a secondary error
  }
}
