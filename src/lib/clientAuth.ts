'use client';

export const AUTH_STORAGE_KEY = 'omt_auth_session';

export interface UserSession {
  email: string;
  name: string;
  role: 'publisher' | 'reader';
  authenticatedAt: string;
}

// Pre-seeded accounts for static hosting (e.g. GitHub Pages without Node backend)
export const STATIC_AUTH_ACCOUNTS: Record<string, { name: string; passwordHash: string; role: 'publisher' | 'reader' }> = {
  'gokulpillai000@gmail.com': {
    name: 'Gokul Krishnan',
    passwordHash: 'editorial123',
    role: 'publisher',
  },
  'editor@oldmangotree.media': {
    name: 'Kamalram Sajeev',
    passwordHash: 'editor123',
    role: 'publisher',
  },
  'editorial@oldmangotree.com': {
    name: 'Editorial Desk',
    passwordHash: 'editorial123',
    role: 'publisher',
  },
  'manila@oldmangotree.media': {
    name: 'Manila C. Mohan',
    passwordHash: 'publisher123',
    role: 'publisher',
  },
  'admin@oldmangotree.media': {
    name: 'Publisher Admin',
    passwordHash: 'admin123',
    role: 'publisher',
  },
  // Readers / Subscribers
  'reader@oldmangotree.media': {
    name: 'Ananya Nair',
    passwordHash: 'reader123',
    role: 'reader',
  },
  'subscriber@oldmangotree.media': {
    name: 'Rahul Menon',
    passwordHash: 'subscriber123',
    role: 'reader',
  },
};

export function clientAuthenticate(
  email: string,
  pass: string,
  name?: string,
  requestedRole: 'publisher' | 'reader' = 'reader'
): UserSession | { error: string } {
  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { error: 'Please enter a valid email address.' };
  }
  if (!pass || pass.length < 3) {
    return { error: 'Password must be at least 3 characters long.' };
  }

  const account = STATIC_AUTH_ACCOUNTS[cleanEmail];
  if (account) {
    const isMatch =
      account.passwordHash === pass ||
      account.passwordHash.toLowerCase() === pass.toLowerCase();
    if (!isMatch) {
      if (cleanEmail === 'gokulpillai000@gmail.com' && (pass === 'editor123' || pass === 'gokul123')) {
        // match
      } else {
        return { error: 'Incorrect password for this account.' };
      }
    }
    return {
      email: cleanEmail,
      name: account.name,
      role: account.role,
      authenticatedAt: new Date().toISOString(),
    };
  }

  const isStaffDomain =
    cleanEmail.endsWith('@oldmangotree.media') ||
    cleanEmail.endsWith('@oldmangotree.com') ||
    cleanEmail === 'gokulpillai000@gmail.com';
  const role: 'publisher' | 'reader' =
    isStaffDomain || requestedRole === 'publisher' ? 'publisher' : 'reader';

  const displayName = name && name.trim() ? name.trim() : cleanEmail.split('@')[0];
  const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
  return {
    email: cleanEmail,
    name: capitalizedName,
    role,
    authenticatedAt: new Date().toISOString(),
  };
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
    // Dispatch custom event for cross-component sync
    window.dispatchEvent(new Event('omt-auth-changed'));
  } catch {}
}

export function getAuthHeaders(): HeadersInit {
  const session = getStoredSession();
  if (session) {
    try {
      const base64Token = btoa(unescape(encodeURIComponent(JSON.stringify(session))));
      return {
        'Authorization': `Bearer ${base64Token}`,
      };
    } catch {
      return {};
    }
  }
  return {};
}
