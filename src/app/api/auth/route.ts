import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateUser,
  authenticateEditorialPin,
  registerUser,
  getCurrentSession,
  signSessionToken,
} from '@/lib/auth';
import { authSchema } from '@/lib/validations';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  const session = getCurrentSession(req);
  return NextResponse.json(
    { session },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request payload' }, { status: 400 });
    }

    // 1. Validate payload schema with Zod (Check 11)
    const parseResult = authSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Invalid authentication payload';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { action, email, password, name, pin } = parseResult.data;

    if (action === 'logout') {
      const response = NextResponse.json(
        { success: true, session: null },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
      response.cookies.delete('omt_auth_session');
      return response;
    }

    // 2. Rate Limiting: Max 5 login/pin attempts per 60 seconds per IP (Check 16)
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`auth:${clientIp}`, 5, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many authentication attempts. Please wait 1 minute before trying again.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.resetSeconds),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    let result;
    if (action === 'pin_login') {
      if (!pin) {
        return NextResponse.json({ error: 'PIN is required' }, { status: 400 });
      }
      result = authenticateEditorialPin(pin);
    } else if (action === 'signup') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
      }
      result = registerUser(email, password, name);
    } else {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
      }
      result = authenticateUser(email, password);
    }

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    const token = signSessionToken(result);
    const sessionWithToken = { ...result, token };

    const response = NextResponse.json(
      { success: true, session: sessionWithToken, token },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );

    const isHttps =
      req.headers.get('x-forwarded-proto') === 'https' || req.nextUrl.protocol === 'https:';

    response.cookies.set('omt_auth_session', encodeURIComponent(token), {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Authentication error' }, { status: 500 });
  }
}
