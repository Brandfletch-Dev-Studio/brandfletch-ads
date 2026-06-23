import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const ADMIN_EMAIL    = Deno.env.get('ADMIN_EMAIL') ?? 'admin@brandfletch.com';
const APP_URL        = Deno.env.get('APP_URL') ?? 'https://brandfletch.com';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    // Called from a Supabase trigger or our app with ticket data
    const { ticket } = body;

    if (!ticket) {
      return new Response(JSON.stringify({ error: 'Missing ticket data' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set — skipping email');
      return new Response(JSON.stringify({ skipped: true, reason: 'No RESEND_API_KEY' }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    const priorityColor = {
      low: '#6b7280', medium: '#3b82f6', high: '#f97316', urgent: '#ef4444',
    }[ticket.priority || 'medium'] || '#3b82f6';

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#0f2044;padding:24px 32px;">
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Brandfletch Ads</p>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:13px;">Support Notification</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0f2044;">New Support Ticket</p>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">A client just opened a support ticket and is waiting for your response.</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;padding:20px;margin-bottom:24px;">
              <tr>
                <td style="padding:6px 0;">
                  <span style="font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Subject</span><br/>
                  <span style="font-size:15px;font-weight:600;color:#111827;">${ticket.subject || '—'}</span>
                </td>
              </tr>
              <tr><td style="height:12px;"></td></tr>
              <tr>
                <td style="padding:6px 0;">
                  <span style="font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">From</span><br/>
                  <span style="font-size:14px;color:#374151;">${ticket.user_name || '—'} · ${ticket.user_email || '—'}</span>
                </td>
              </tr>
              <tr><td style="height:12px;"></td></tr>
              <tr>
                <td style="padding:6px 0;">
                  <span style="font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Priority</span><br/>
                  <span style="display:inline-block;margin-top:4px;padding:2px 10px;border-radius:9999px;background:${priorityColor}20;color:${priorityColor};font-size:12px;font-weight:600;text-transform:capitalize;">${ticket.priority || 'medium'}</span>
                </td>
              </tr>
              <tr><td style="height:12px;"></td></tr>
              <tr>
                <td style="padding:6px 0;">
                  <span style="font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Category</span><br/>
                  <span style="font-size:14px;color:#374151;text-transform:capitalize;">${(ticket.category || 'general').replace(/_/g, ' ')}</span>
                </td>
              </tr>
              <tr><td style="height:16px;"></td></tr>
              <tr>
                <td style="padding:6px 0;border-top:1px solid #e5e7eb;padding-top:16px;">
                  <span style="font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Message</span><br/>
                  <span style="font-size:14px;color:#374151;line-height:1.6;white-space:pre-wrap;">${ticket.description || '—'}</span>
                </td>
              </tr>
            </table>

            <a href="${APP_URL}/admin/support" style="display:inline-block;background:#0f2044;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">
              Open ticket in dashboard →
            </a>

            <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">
              You received this because you are an admin on Brandfletch Ads. 
              Reply directly in the platform at <a href="${APP_URL}/admin/support" style="color:#3b82f6;">${APP_URL}/admin/support</a>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">Brandfletch Media · brandfletch.com</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Brandfletch Ads <noreply@brandfletch.com>',
        to: [ADMIN_EMAIL],
        subject: `[Support] New ticket: ${ticket.subject || 'No subject'} — ${ticket.priority?.toUpperCase() || 'MEDIUM'} priority`,
        html,
      }),
    });

    const emailData = await emailRes.json();

    if (!emailRes.ok) {
      console.error('Resend error:', emailData);
      return new Response(JSON.stringify({ error: emailData }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, id: emailData.id }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
});
