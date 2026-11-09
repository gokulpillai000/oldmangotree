'use client';

export const AUTH_STORAGE_KEY = 'omt_auth_session';

export interface UserSession {
  email: string;
  name: string;
  role: 'publisher' | 'reader';
  authenticatedAt: string;
}

/**
 * Verifies active session on the server via HTTP-only cookie.
 * Never relies on client-side state alone for security decisions.
 */
export async function checkServerSession(): Promise<UserSession | null> {
  if (typeof window === 'undefined') return null;

  try {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const res = await fetch(`${basePath}/api/auth`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.session && data.session.role) {
        setStoredSession(data.session);
        return data.session;
      }
    }
  } catch (err) {
    console.warn('Failed to verify session with server:', err);
  }

  // If server check fails or returns null, clear optimistic cache
  setStoredSession(null);
  return null;
}

/**
 * Optimistic client-side cached session display (for UI header names/avatars).
 * Security gates MUST verify with checkServerSession() or server-side API.
 */
export function getStoredSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.email && parsed.role) {
      return {
        email: parsed.email,
        name: parsed.name,
        role: parsed.role,
        authenticatedAt: parsed.authenticatedAt || new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function setStoredSession(session: UserSession | null) {
  if (typeof window === 'undefined') return;
  try {
    if (!session) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem('omt_editorial_auth');
    } else {
      // Store only non-sensitive display profile; secret tokens are kept in HttpOnly cookies
      const safeDisplaySession: UserSession = {
        email: session.email,
        name: session.name,
        role: session.role,
        authenticatedAt: session.authenticatedAt || new Date().toISOString(),
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(safeDisplaySession));
      sessionStorage.setItem('omt_editorial_auth', 'true');
    }
    window.dispatchEvent(new Event('omt-auth-changed'));
  } catch {}
}

export function getAuthHeaders(): HeadersInit {
  // Session cookies are automatically included via credentials: 'include'.
  return {};
}
