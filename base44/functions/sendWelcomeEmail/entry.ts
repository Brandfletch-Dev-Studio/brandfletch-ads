/// <reference lib="deno.ns" />
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const APP_URL = 'https://brandfletchads.base44.app';
const BRAND_COLOR = '#0f2d6b';
const ACCENT_COLOR = '#3b82f6';
const LOGO_URL = 'https://media.base44.com/images/public/6a1e8f4f079c524483e324a2/0072409c5_file_0000000024d0722fa20034e2dedcbc9e.png';

function emailWrapper(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Welcome to Brandfletch Ads</title>
<style>
  body{margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif}
  .wrap{background:#f1f5f9;padding:32px 16px}
  .card{background:#fff;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,0.07);overflow:hidden;max-width:620px;margin:0 auto}
  .hdr{background:${BRAND_COLOR};padding:28px 36px;text-align:center}
  .body{padding:32px 36px}
  .footer{background:#f8fafc;border-top:1px solid #f1f5f9;padding:18px 36px;text-align:center}
  @media(max-width:600px){.body,.hdr,.footer{padding-left:20px;padding-right:20px}}
</style>
</head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" class="wrap">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px">
<tr><td>
<div class="card">
  <div class="hdr">
    <a href="${APP_URL}" style="display:inline-flex;align-items:center;gap:10px;text-decoration:none">
      <img src="${LOGO_URL}" width="40" height="40" style="border-radius:9px" alt="Brandfletch Ads"/>
      <span style="color:#fff;font-size:20px;font-weight:700">Brandfletch <span style="color:#93c5fd">Ads</span></span>
    </a>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <p style="color:#94a3b8;font-size:12px;margin:0">© ${new Date().getFullYear()} Brandfletch Media · <a href="${APP_URL}" style="color:${ACCENT_COLOR};text-decoration:none">brandfletchads.base44.app</a></p>
  </div>
</div>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { user_id } = body;

    if (!user_id) return Response.json({ error: 'Missing user_id' }, { status: 400 });

    const users = await base44.asServiceRole.entities.User.filter({ id: user_id });
    const user = users[0];
    if (!user?.email) return Response.json({ error: 'User not found or no email' }, { status: 404 });

    const firstName = (user.full_name || 'there').split(' ')[0];

    const features = [
      ['🎯', 'Run Facebook & Instagram Ads', 'Launch targeted ad campaigns to reach your ideal audience.'],
      ['🎨', 'Order Professional Designs', 'Get custom graphics, flyers and creatives built for you.'],
      ['📋', 'Capture Leads with Smart Forms', 'Build AI-powered lead forms and grow your customer list.'],
      ['📊', 'Track Performance in Real-Time', 'Monitor reach, impressions, clicks and results live.'],
    ];

    const featureRows = features.map(([emoji, title, desc]) => `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px">
        <tr>
          <td width="36" style="font-size:22px;vertical-align:top;padding-top:2px">${emoji}</td>
          <td style="padding-left:10px">
            <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#0f172a">${title}</p>
            <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5">${desc}</p>
          </td>
        </tr>
      </table>`).join('');

    const html = emailWrapper(`
      <div style="text-align:center;margin-bottom:28px">
        <div style="font-size:40px;margin-bottom:10px">🚀</div>
        <h1 style="color:#0f172a;font-size:24px;font-weight:800;margin:0 0 8px;letter-spacing:-0.4px">Welcome, ${firstName}!</h1>
        <p style="color:#64748b;font-size:15px;margin:0">Your Brandfletch Ads account is ready. Let's grow your business.</p>
      </div>

      ${featureRows}

      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px 18px;margin:24px 0">
        <p style="color:#1d4ed8;font-size:13px;font-weight:700;margin:0 0 4px">💡 Start here</p>
        <p style="color:#1e40af;font-size:13px;margin:0;line-height:1.5">
          ${user.business_name ? `You've set up <strong>${user.business_name}</strong> — ` : ''}Connect your Facebook page, then launch your first campaign in minutes.
        </p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 8px">
        <tr><td align="center">
          <a href="${APP_URL}/dashboard" style="display:inline-block;background:${ACCENT_COLOR};color:#fff;font-size:15px;font-weight:700;padding:13px 38px;border-radius:9px;text-decoration:none">
            Go to My Dashboard →
          </a>
        </td></tr>
      </table>

      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:16px 0 0">
        Questions? Email us at <a href="mailto:support@brandfletch.com" style="color:${ACCENT_COLOR}">support@brandfletch.com</a>
      </p>
    `);

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      from_name: 'Brandfletch Ads',
      subject: `Welcome to Brandfletch Ads, ${firstName}! 🚀`,
      body: html,
    });

    // Create welcome in-app notification
    await base44.asServiceRole.entities.Notification.create({
      recipient_id: user_id,
      type: 'welcome',
      title: 'Welcome to Brandfletch Ads!',
      message: "Your account is set up. Connect your Facebook page to launch your first campaign.",
      link: '/facebook-pages',
      is_read: false,
    });

    return Response.json({ success: true, sent_to: user.email });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
