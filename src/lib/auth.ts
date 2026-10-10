import { cookies } from 'next/headers';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface UserSession {
  email: string;
  name: string;
  role: 'publisher' | 'reader';
  authenticatedAt: string;
  token?: string;
}

const COOKIE_NAME = 'omt_auth_session';
const USERS_FILE_PATH = path.join(process.cwd(), 'content', 'users.json');

// Default salted scrypt hash for editorial desk PIN when EDITORIAL_DESK_PIN env var is not explicitly set
const DEFAULT_PIN_SCRYPT_HASH =
  'scrypt:omt_salt_pin:e467271b0ac0f7c5512c3c24c5df203c2ff843cc1ceaa95a3e05dab7127da411';

// Pre-seeded accounts using salted scrypt password digests (no plaintext passwords in source code)
const DEFAULT_USERS: Record<
  string,
  { name: string; passwordHash: string; role: 'publisher' | 'reader' }
> = {
  'akhil@oldmangotree.media': {
    name: 'Akhil U Krishnan',
    passwordHash:
      'scrypt:omt_salt_akhil:b745b73f2576142c267ad9d2cf5bc064b413004c4e596f7bf289f307e4900a64',
    role: 'publisher',
  },
  'amala@oldmangotree.media': {
    name: 'Amala Thomas',
    passwordHash:
      'scrypt:omt_salt_amala:f9d8f60f4428c7e112c04a1504482081623cd81fd3de705631d22be9f1d9a9fd',
    role: 'publisher',
  },
  'gokulpillai000@gmail.com': {
    name: 'Akhil U Krishnan',
    passwordHash:
      'scrypt:omt_salt_desk:f788611582538e14c5849c38127146ae29782a9ff0f9a946009bc9f78d7aec4f',
    role: 'publisher',
  },
  'editorial@oldmangotree.com': {
    name: 'Akhil U Krishnan',
    passwordHash:
      'scrypt:omt_salt_desk:f788611582538e14c5849c38127146ae29782a9ff0f9a946009bc9f78d7aec4f',
    role: 'publisher',
  },
  'editor@oldmangotree.media': {
    name: 'Akhil U Krishnan',
    passwordHash:
      'scrypt:omt_salt_akhil:b745b73f2576142c267ad9d2cf5bc064b413004c4e596f7bf289f307e4900a64',
    role: 'publisher',
  },
  'admin@oldmangotree.media': {
    name: 'Amala Thomas',
    passwordHash:
      'scrypt:omt_salt_admin:f6bce67b4fa0b0d907d0cee951c46162f1d121c5dfd803773feb5a981a3740eb',
    role: 'publisher',
  },
  'reader@oldmangotree.media': {
    name: 'Ananya Nair',
    passwordHash:
      'scrypt:omt_salt_reader:3924f1e8d465641d06c06882e39a122a63be979cc33402d86b73e0aa54920ab2',
    role: 'reader',
  },
  'subscriber@oldmangotree.media': {
    name: 'Rahul Menon',
    passwordHash:
      'scrypt:omt_salt_sub:d76c6ab600b9413638516d1f3ccf9097a3a51d5a4b86408bd211b3d39f112d58',
    role: 'reader',
  },
};

let userStore: Record<
  string,
  { name: string; passwordHash: string; role: 'publisher' | 'reader' }
> = { ...DEFAULT_USERS };

function getAuthSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.REVALIDATION_SECRET ||
    'omt_hmac_signing_key_v1_change_in_prod'
  );
}

export function hashPassword(password: string, salt?: string): string {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, actualSalt, 32).toString('hex');
  return `scrypt:${actualSalt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;

  if (storedHash.startsWith('scrypt:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 3) return false;
    const [, salt, expectedHex] = parts;
    const actualHex = crypto.scryptSync(password, salt, 32).toString('hex');
    try {
      return crypto.timingSafeEqual(
        Buffer.from(actualHex, 'hex'),
        Buffer.from(expectedHex, 'hex')
      );
    } catch {
      return false;
    }
  }

  // Legacy fallback if a custom hash wasn't migrated yet
  return storedHash === password;
}

export function signSessionToken(session: UserSession): string {
  const cleanPayload: UserSession = {
    email: session.email,
    name: session.name,
    role: session.role,
    authenticatedAt: session.authenticatedAt,
  };
  const payloadBase64 = Buffer.from(JSON.stringify(cleanPayload), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', getAuthSecret())
    .update(payloadBase64)
    .digest('hex');
  return `${payloadBase64}.${signature}`;
}

export function verifySessionToken(rawToken: string): UserSession | null {
  if (!rawToken || !rawToken.includes('.')) return null;
  const [payloadBase64, signature] = rawToken.split('.');
  if (!payloadBase64 || !signature) return null;

  const expectedSig = crypto
    .createHmac('sha256', getAuthSecret())
    .update(payloadBase64)
    .digest('hex');

  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSig, 'hex')
    );
    if (!isValid) return null;

    const decoded = Buffer.from(payloadBase64, 'base64url').toString('utf8');
    const parsed = JSON.parse(decoded) as UserSession;
    if (parsed && parsed.email && parsed.role) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

function loadUsers(): void {
  try {
    if (fs.existsSync(USERS_FILE_PATH)) {
      const data = fs.readFileSync(USERS_FILE_PATH, 'utf8');
      const loaded = JSON.parse(data);
      userStore = { ...DEFAULT_USERS, ...loaded };
    }
  } catch {
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
  } catch {
    // Graceful fallback if filesystem is readonly in serverless
  }
}

loadUsers();

export function registerUser(
  email: string,
  pass: string,
  name?: string
): UserSession | { error: string } {
  loadUsers();
  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { error: 'Please enter a valid email address.' };
  }
  if (!pass || pass.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  // Prevent overwriting existing accounts
  if (userStore[cleanEmail]) {
    return { error: 'An account with this email already exists. Please sign in.' };
  }

  // Public self-registration is strictly restricted to 'reader' role
  const role: 'publisher' | 'reader' = 'reader';

  const displayName = name && name.trim() ? name.trim() : cleanEmail.split('@')[0];
  const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

  userStore[cleanEmail] = {
    name: capitalizedName,
    passwordHash: hashPassword(pass),
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
    return { error: 'No account found with this email address.' };
  }

  const envAdminPass = process.env.EDITORIAL_ADMIN_PASSWORD;
  const isEnvMatch =
    Boolean(envAdminPass) && account.role === 'publisher' && pass === envAdminPass;

  const isHashMatch =
    verifyPassword(pass, account.passwordHash) ||
    verifyPassword(pass.toLowerCase(), account.passwordHash);

  if (!isEnvMatch && !isHashMatch) {
    return { error: 'Incorrect password for this account.' };
  }

  return {
    email: cleanEmail,
    name: account.name,
    role: account.role,
    authenticatedAt: new Date().toISOString(),
  };
}

export function authenticateEditorialPin(pin: string): UserSession | { error: string } {
  const trimmed = (pin || '').trim();
  if (!trimmed) {
    return { error: 'Please enter the editorial PIN.' };
  }

  const configuredPin = process.env.EDITORIAL_DESK_PIN;
  const isValid = configuredPin
    ? trimmed === configuredPin
    : verifyPassword(trimmed, DEFAULT_PIN_SCRYPT_HASH);

  if (!isValid) {
    return {
      error: 'Invalid editorial PIN. Please check your passcode or consult the editorial desk.',
    };
  }

  return {
    email: 'akhil@oldmangotree.media',
    name: 'Akhil U Krishnan',
    role: 'publisher',
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
        const verified = verifySessionToken(rawToken);
        if (verified) {
          return verified;
        }
      }
    } catch {}
  }

  // 2. Check signed HTTP-only cookie
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);
    if (sessionCookie && sessionCookie.value) {
      const rawValue = decodeURIComponent(sessionCookie.value);
      const verified = verifySessionToken(rawValue);
      if (verified) {
        return verified;
      }
    }
  } catch {
    // cookies() may throw outside Next request context
  }

  return null;
}

export function isPublisherAuthenticated(req?: Request): boolean {
  const session = getCurrentSession(req);
  return session !== null && session.role === 'publisher';
}
