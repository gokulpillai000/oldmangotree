import { NextResponse } from 'next/server';

/**
 * Legacy Publish API Route (Deprecated)
 * 
 * Local file writing has been retired in favor of the headless Blogger architecture.
 * Stories are published on Blogger.com and pulled live via Google Cloud CDN.
 */
export async function GET() {
  return NextResponse.json(
    { message: 'The local publish API has been retired in favor of Headless Blogger integration.' },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { message: 'The local publish API has been retired in favor of Headless Blogger integration.' },
    { status: 410 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: 'The local publish API has been retired in favor of Headless Blogger integration.' },
    { status: 410 }
  );
}
