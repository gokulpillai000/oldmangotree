import { NextRequest, NextResponse } from 'next/server';
import { feedbackSchema, escapeHtml } from '@/lib/validations';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting: Max 5 feedback submissions per 10 minutes per IP (Check 16)
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`feedback:${clientIp}`, 5, 600);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many submissions. Please wait before sending another letter to the editor.' },
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

    // 2. Strict Input Validation via Zod (Check 11)
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request payload' }, { status: 400 });
    }

    const parseResult = feedbackSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Invalid input data';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { articleTitle, articleSlug, senderName, senderEmail, location, message } = parseResult.data;

    const destinationEmail = process.env.EDITORIAL_FEEDBACK_EMAIL || 'editorial@oldmangotree.media';
    const emailSubject = `[Letter to Editor] ${articleTitle || 'General Feedback'} — from ${senderName}`;

    // HTML-escape user inputs to prevent HTML/XSS injection into the editorial inbox (Check 13)
    const safeName = escapeHtml(senderName);
    const safeEmail = escapeHtml(senderEmail);
    const safeTitle = escapeHtml(articleTitle || 'General Webzine Feedback');
    const safeSlug = articleSlug ? escapeHtml(articleSlug) : '';
    const safeLocation = location ? escapeHtml(location) : '';
    const safeMessage = escapeHtml(message);

    const formattedHtml = `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="border-bottom: 2px solid #E27A2B; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #0C2340; margin: 0; font-size: 24px;">oldmangotree Editorial Desk</h2>
          <p style="color: #6b7280; margin: 4px 0 0 0; font-size: 14px;">Incoming Letter to the Editor</p>
        </div>

        <div style="background-color: #f9fafb; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
          <p style="margin: 4px 0;"><strong>Article:</strong> ${safeTitle}</p>
          ${safeSlug ? `<p style="margin: 4px 0;"><strong>Slug:</strong> ${safeSlug}</p>` : ''}
          <p style="margin: 4px 0;"><strong>From:</strong> ${safeName} &lt;${safeEmail}&gt;</p>
          ${safeLocation ? `<p style="margin: 4px 0;"><strong>Location:</strong> ${safeLocation}</p>` : ''}
          <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST</p>
        </div>

        <div style="font-size: 16px; line-height: 1.6; color: #1f2937; white-space: pre-wrap; margin-bottom: 24px;">
${safeMessage}
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 13px; color: #6b7280;">
          <p style="margin: 0;">Hit <em>Reply</em> in your email client to respond directly to ${safeName} (${safeEmail}).</p>
        </div>
      </div>
    `;

    // 1. Dispatch via Resend API if configured
    if (process.env.RESEND_API_KEY) {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'oldmangotree Reader <onboarding@resend.dev>',
          to: [destinationEmail],
          reply_to: senderEmail,
          subject: emailSubject,
          html: formattedHtml,
        }),
      });

      if (!resendRes.ok) {
        const errorData = await resendRes.text();
        console.error('Resend delivery failed:', errorData);
      }
    }
    // 2. Dispatch via Web3Forms if configured
    else if (process.env.WEB3FORMS_ACCESS_KEY) {
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: process.env.WEB3FORMS_ACCESS_KEY,
          subject: emailSubject,
          from_name: senderName,
          email: senderEmail,
          to_email: destinationEmail,
          message: `Article: ${articleTitle || 'General'}\nFrom: ${senderName} (${senderEmail})\nLocation: ${location || 'N/A'}\n\nMessage:\n${message}`,
        }),
      });
    } else {
      // Zero-config fallback: Log to server runtime
      console.log(`[LETTER TO EDITOR] From: ${senderName} <${senderEmail}> | Article: ${articleTitle}\nMessage: ${message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Your letter has been sent directly to the editorial desk. Thank you for your thoughts!',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Feedback submission error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to dispatch letter to editor.' },
      { status: 500 }
    );
  }
}
