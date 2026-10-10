'use client';

export const AUTH_STORAGE_KEY = 'omt_auth_session';

export interface UserSession {
  email: string;
  name: string;
  role: 'publisher' | 'reader';
  authenticatedAt: string;
  token?: string;
}

// Salted SHA-256 digest used only as an offline/static-export fallback when /api/auth is not running
const DEFAULT_EDITORIAL_PIN_SHA256 =
  process.env.NEXT_PUBLIC_EDITORIAL_PIN_HASH ||
  '4afc8e194930dad59ad3e7d1eb2f7b46fc0da68166df75e16a1e4a8abb60abe1';

export async function hashPinClient(pin: string): Promise<string> {
  const clean = pin.trim();
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const data = new TextEncoder().encode(`omt_pin_v1:${clean}`);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return '';
}

export async function verifyPinWithClientHash(pin: string): Promise<boolean> {
  const digest = await hashPinClient(pin);
  if (!digest) return false;

  try {
    const customHash = localStorage.getItem('omt_editorial_passcode_hash');
    if (customHash && digest === customHash) {
      return true;
    }
  } catch {}

  return digest === DEFAULT_EDITORIAL_PIN_SHA256;
}

export function getStoredSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.email && parsed.role) {
      return parsed;
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
    } else {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    }
    window.dispatchEvent(new Event('omt-auth-changed'));
  } catch {}
}

export function getAuthHeaders(): HeadersInit {
  const session = getStoredSession();
  if (session?.token) {
    return {
      Authorization: `Bearer ${session.token}`,
    };
  }
  return {};
}
