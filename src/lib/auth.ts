import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

export interface UserSession {
  email: string;
  name: string;
  role: 'publisher' | 'reader';
  authenticatedAt: string;
}

const COOKIE_NAME = 'omt_auth_session';
const USERS_FILE_PATH = path.join(process.cwd(), 'content', 'users.json');

// Default editorial publisher & subscriber accounts
const DEFAULT_USERS: Record<string, { name: string; passwordHash: string; role: 'publisher' | 'reader' }> = {
  // Staff / Editorial Publishers
  'editor@oldmangotree.media': {
    name: 'Kamalram Sajeev',
    passwordHash: 'editor123',
    role: 'publisher',
  },
  'gokulpillai000@gmail.com': {
    name: 'Gokul Krishnan',
    passwordHash: 'editorial123',
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

// In-memory cache
let userStore: Record<string, { name: string; passwordHash: string; role: 'publisher' | 'reader' }> = { ...DEFAULT_USERS };

function loadUsers(): void {
  try {
    if (fs.existsSync(USERS_FILE_PATH)) {
      const data = fs.readFileSync(USERS_FILE_PATH, 'utf8');
      const loaded = JSON.parse(data);
      userStore = { ...DEFAULT_USERS, ...loaded };
    }
  } catch (err) {
    // If running in readonly/serverless environment, in-memory store remains active
  }
}

function saveUsers(): void {
  try {
    const dir = path.dirname(USERS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(userStore, null, 2), 'utf8');
  } catch (err) {
    // Graceful fallback if filesystem is readonly in serverless
  }
}

// Initial load
loadUsers();

export function registerUser(
  email: string,
  pass: string,
  name?: string,
  requestedRole: 'publisher' | 'reader' = 'reader'
): UserSession | { error: string } {
  loadUsers();
  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { error: 'Please enter a valid email address.' };
  }
  if (!pass || pass.length < 3) {
    return { error: 'Password must be at least 3 characters long.' };
  }

  const isStaffDomain =
    cleanEmail.endsWith('@oldmangotree.media') ||
    cleanEmail.endsWith('@oldmangotree.com') ||
    cleanEmail === 'gokulpillai000@gmail.com';
  const role: 'publisher' | 'reader' =
    isStaffDomain || requestedRole === 'publisher' ? 'publisher' : 'reader';

  const displayName = name && name.trim() ? name.trim() : cleanEmail.split('@')[0];
  const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

  userStore[cleanEmail] = {
    name: capitalizedName,
    passwordHash: pass,
    role,
  };

  saveUsers();

  return {
    email: cleanEmail,
    name: capitalizedName,
    role,
    authenticatedAt: new Date().toISOString(),
  };
}

export function authenticateUser(email: string, pass: string): UserSession | { error: string } {
  loadUsers();
  const cleanEmail = email.toLowerCase().trim();
  const account = userStore[cleanEmail];

  if (!account) {
    // Auto-register new accounts seamlessly on sign in if valid
    return registerUser(cleanEmail, pass);
  }

  // Check password (also support trimmed / lowercase fallback in case of mobile virtual keyboard caps)
  const isMatch = account.passwordHash === pass || account.passwordHash.toLowerCase() === pass.toLowerCase();

  if (!isMatch) {
    // If account was pre-seeded with editorial123 or editor123, allow common fallback
    if (cleanEmail === 'gokulpillai000@gmail.com' && (pass === 'editor123' || pass === 'gokul123')) {
      // Allow
    } else if (cleanEmail === 'editorial@oldmangotree.com' && pass === 'editor123') {
      // Allow
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

export function getCurrentSession(req?: Request): UserSession | null {
  // 1. Check Authorization Bearer header if request is provided
  if (req) {
    try {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const rawToken = authHeader.substring(7).trim();
        let decoded = '';
        try {
          decoded = Buffer.from(rawToken, 'base64').toString('utf8');
        } catch {
          decoded = rawToken;
        }
        const session = JSON.parse(decoded);
        if (session && session.email && session.role) {
          return session;
        }
      }
    } catch {}
  }

  // 2. Check cookies
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);
    if (sessionCookie && sessionCookie.value) {
      const sessionData = JSON.parse(decodeURIComponent(sessionCookie.value)) as UserSession;
      return sessionData;
    }
  } catch (err) {
    // cookies() may throw outside Next request context
  }

  return null;
}

export function isPublisherAuthenticated(req?: Request): boolean {
  const session = getCurrentSession(req);
  return session !== null && session.role === 'publisher';
}
