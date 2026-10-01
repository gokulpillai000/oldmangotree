import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, registerUser, getCurrentSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getCurrentSession(req);
  return NextResponse.json(
    { session },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, password, name } = body;

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

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    let result;
    if (action === 'signup') {
      result = registerUser(email, password, name);
    } else {
      result = authenticateUser(email, password);
    }

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const token = Buffer.from(JSON.stringify(result)).toString('base64');
    const response = NextResponse.json(
      { success: true, session: result, token },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );

    // Only mark secure if actually served via HTTPS
    const isHttps = req.headers.get('x-forwarded-proto') === 'https' || req.nextUrl.protocol === 'https:';

    response.cookies.set('omt_auth_session', encodeURIComponent(JSON.stringify(result)), {
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
