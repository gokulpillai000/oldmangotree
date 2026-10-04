import { NextRequest, NextResponse } from 'next/server';

interface FeedbackPayload {
  articleTitle?: string;
  articleSlug?: string;
  senderName: string;
  senderEmail: string;
  location?: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: FeedbackPayload = await request.json();
    const { articleTitle, articleSlug, senderName, senderEmail, location, message } = body;

    // Validate required fields
    if (!senderName?.trim() || !senderEmail?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'Name, email, and message are required fields.' },
        { status: 400 }
      );
    }

    const destinationEmail = process.env.EDITORIAL_FEEDBACK_EMAIL || 'editorial@oldmangotree.media';
    const emailSubject = `[Letter to Editor] ${articleTitle || 'General Feedback'} — from ${senderName.trim()}`;

    const formattedHtml = `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="border-bottom: 2px solid #E27A2B; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #0C2340; margin: 0; font-size: 24px;">oldmangotree Editorial Desk</h2>
          <p style="color: #6b7280; margin: 4px 0 0 0; font-size: 14px;">Incoming Letter to the Editor</p>
        </div>

        <div style="background-color: #f9fafb; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
          <p style="margin: 4px 0;"><strong>Article:</strong> ${articleTitle || 'General Webzine Feedback'}</p>
          ${articleSlug ? `<p style="margin: 4px 0;"><strong>Slug:</strong> ${articleSlug}</p>` : ''}
          <p style="margin: 4px 0;"><strong>From:</strong> ${senderName.trim()} &lt;${senderEmail.trim()}&gt;</p>
          ${location?.trim() ? `<p style="margin: 4px 0;"><strong>Location:</strong> ${location.trim()}</p>` : ''}
          <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST</p>
        </div>

        <div style="font-size: 16px; line-height: 1.6; color: #1f2937; white-space: pre-wrap; margin-bottom: 24px;">
${message.trim()}
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 13px; color: #6b7280;">
          <p style="margin: 0;">Hit <em>Reply</em> in your email client to respond directly to ${senderName.trim()} (${senderEmail.trim()}).</p>
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
          reply_to: senderEmail.trim(),
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
          from_name: senderName.trim(),
          email: senderEmail.trim(),
          to_email: destinationEmail,
          message: `Article: ${articleTitle || 'General'}\nFrom: ${senderName.trim()} (${senderEmail.trim()})\nLocation: ${location || 'N/A'}\n\nMessage:\n${message.trim()}`,
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
