import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateUser,
  authenticateEditorialPin,
  registerUser,
  getCurrentSession,
  signSessionToken,
} from '@/lib/auth';

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
    const body = await req.json();
    const { action, email, password, name, pin } = body;

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

    let result;
    if (action === 'pin_login') {
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
