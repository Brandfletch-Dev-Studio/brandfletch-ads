/// <reference lib="deno.ns" />
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const APP_URL = 'https://brandfletchads.base44.app';
const BRAND_COLOR = '#0f2d6b';
const ACCENT_COLOR = '#3b82f6';
const LOGO_URL = 'https://media.base44.com/images/public/6a1e8f4f079c524483e324a2/0072409c5_file_0000000024d0722fa20034e2dedcbc9e.png';

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Brandfletch Designs</title>
<style>
  body{margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif}
  .card{background:#fff;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,0.07);overflow:hidden;max-width:620px;margin:0 auto}
  .hdr{background:${BRAND_COLOR};padding:26px 36px;text-align:center}
  .body{padding:32px 36px}
  .footer{background:#f8fafc;border-top:1px solid #f1f5f9;padding:16px 36px;text-align:center}
  .info-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:9px;padding:14px 18px;margin:18px 0}
  .badge{display:inline-block;border-radius:20px;padding:3px 12px;font-size:12px;font-weight:600}
  @media(max-width:600px){.body,.hdr,.footer{padding-left:20px;padding-right:20px}}
</style>
</head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px">
<tr><td>
<div class="card">
  <div class="hdr">
    <a href="${APP_URL}" style="display:inline-flex;align-items:center;gap:10px;text-decoration:none">
      <img src="${LOGO_URL}" width="38" height="38" style="border-radius:9px" alt="Brandfletch Ads"/>
      <span style="color:#fff;font-size:19px;font-weight:700">Brandfletch <span style="color:#93c5fd">Designs</span></span>
    </a>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <p style="color:#94a3b8;font-size:12px;margin:0">© ${new Date().getFullYear()} Brandfletch Media · <a href="mailto:support@brandfletch.com" style="color:${ACCENT_COLOR};text-decoration:none">support@brandfletch.com</a></p>
  </div>
</div>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function infoRows(rows: [string,string][]): string {
  return `<div class="info-card">${rows.map(([l,v]) => `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #f1f5f9">
      <tr>
        <td style="padding:7px 0;font-size:13px;color:#64748b">${l}</td>
        <td style="padding:7px 0;font-size:13px;color:#1e293b;font-weight:600;text-align:right">${v}</td>
      </tr>
    </table>`).join('')}</div>`;
}

function cta(label: string, url: string, color = ACCENT_COLOR): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 6px"><tr><td align="center">
    <a href="${url}" style="display:inline-block;background:${color};color:#fff;font-size:14px;font-weight:700;padding:12px 32px;border-radius:9px;text-decoration:none">${label} →</a>
  </td></tr></table>`;
}

function badge(text: string, bg: string, color: string, border: string): string {
  return `<span class="badge" style="background:${bg};color:${color};border:1px solid ${border}">${text}</span>`;
}

function designTypeLabel(t: string): string {
  return (t || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Templates ───────────────────────────────────────────────────────────────

const EVENTS: Record<string, {
  subject: string;
  notifTitle: string;
  notifMsg: (d: any) => string;
  badge: () => string;
  html: (d: any, u: any) => string;
}> = {

  submitted: {
    subject: 'Design Request Received',
    notifTitle: 'Design request submitted',
    notifMsg: (d) => `Your design request "${d.title}" has been received and is under review.`,
    badge: () => badge('Submitted', '#fffbeb', '#92400e', '#fcd34d'),
    html: (design, user) => emailWrapper(`
      <h2 style="color:#0f172a;font-size:21px;font-weight:800;margin:0 0 6px">Design Request Received 🎨</h2>
      <p style="color:#64748b;font-size:14px;margin:0 0 20px">Our team will review your request and assign a designer shortly.</p>
      <p style="color:#334155;font-size:14px;margin:0 0 16px">Hi <strong>${user?.full_name || 'there'}</strong>,</p>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px">
        We've received your design request and it's now in our queue. We'll assign a designer and kick things off within <strong>1 business day</strong>.
      </p>
      ${badge('Submitted', '#fffbeb', '#92400e', '#fcd34d')}
      ${infoRows([
        ['Request Title', design.title],
        ['Design Type', designTypeLabel(design.design_type)],
        ['Brand Name', design.brand_name || '—'],
        ['Priority', (design.priority || 'medium').charAt(0).toUpperCase() + (design.priority || 'medium').slice(1)],
        ['Submitted', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
      ])}
      ${cta('View My Request', `${APP_URL}/designs`)}
    `),
  },

  in_progress: {
    subject: 'Your Design is In Progress',
    notifTitle: 'Design work started',
    notifMsg: (d) => `A designer is now working on "${d.title}". You'll be notified when it's ready for review.`,
    badge: () => badge('In Progress', '#eff6ff', '#1d4ed8', '#93c5fd'),
    html: (design, user) => emailWrapper(`
      <h2 style="color:#0f172a;font-size:21px;font-weight:800;margin:0 0 6px">Your Design is In Progress ✏️</h2>
      <p style="color:#64748b;font-size:14px;margin:0 0 20px">A designer has picked up your request and is working on it now.</p>
      <p style="color:#334155;font-size:14px;margin:0 0 16px">Hi <strong>${user?.full_name || 'there'}</strong>,</p>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px">
        Great news — a designer has been assigned and is actively working on your design for <strong>${design.title}</strong>. 
        We'll notify you as soon as a draft is ready for your review.
      </p>
      ${badge('In Progress', '#eff6ff', '#1d4ed8', '#93c5fd')}
      ${infoRows([
        ['Request', design.title],
        ['Type', designTypeLabel(design.design_type)],
        ...(design.due_date ? [['Target Delivery', design.due_date] as [string,string]] : []),
      ])}
      ${cta('Track Progress', `${APP_URL}/designs`)}
    `),
  },

  awaiting_feedback: {
    subject: 'Your Design Draft is Ready — Feedback Needed',
    notifTitle: 'Draft ready — your feedback needed',
    notifMsg: (d) => `A draft for "${d.title}" is ready. Please review and share your feedback.`,
    badge: () => badge('Awaiting Your Feedback', '#faf5ff', '#6b21a8', '#d8b4fe'),
    html: (design, user) => emailWrapper(`
      <h2 style="color:#0f172a;font-size:21px;font-weight:800;margin:0 0 6px">Draft Ready — Your Feedback Needed 👀</h2>
      <p style="color:#64748b;font-size:14px;margin:0 0 20px">Your designer has completed a draft. Please review and let us know your thoughts.</p>
      <p style="color:#334155;font-size:14px;margin:0 0 16px">Hi <strong>${user?.full_name || 'there'}</strong>,</p>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px">
        Your designer has finished a draft for <strong>${design.title}</strong>. Log in to review the draft and share your feedback so we can refine it to perfection.
      </p>
      ${badge('Awaiting Your Feedback', '#faf5ff', '#6b21a8', '#d8b4fe')}
      ${infoRows([
        ['Request', design.title],
        ['Type', designTypeLabel(design.design_type)],
        ['Revisions Used', `${design.revision_count || 0} / ${design.max_revisions || 2}`],
      ])}
      ${cta('Review Draft Now', `${APP_URL}/designs`, '#7c3aed')}
    `),
  },

  revision_requested: {
    subject: 'Revision Received — We\'re On It',
    notifTitle: 'Revision request received',
    notifMsg: (d) => `Your revision for "${d.title}" has been noted. We'll update the design shortly.`,
    badge: () => badge('Revision In Progress', '#fff7ed', '#9a3412', '#fed7aa'),
    html: (design, user) => emailWrapper(`
      <h2 style="color:#0f172a;font-size:21px;font-weight:800;margin:0 0 6px">Revision Received 🔄</h2>
      <p style="color:#64748b;font-size:14px;margin:0 0 20px">Our designer is working on your requested changes.</p>
      <p style="color:#334155;font-size:14px;margin:0 0 16px">Hi <strong>${user?.full_name || 'there'}</strong>,</p>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px">
        We've received your revision notes for <strong>${design.title}</strong>. The designer is incorporating your feedback and the updated version will be ready soon.
      </p>
      ${badge('Revision In Progress', '#fff7ed', '#9a3412', '#fed7aa')}
      ${infoRows([
        ['Request', design.title],
        ['Revision #', String((design.revision_count || 0))],
        ['Revisions Remaining', String(Math.max(0, (design.max_revisions || 2) - (design.revision_count || 0)))],
      ])}
      ${design.revision_comments ? `<div class="info-card" style="border-color:#fed7aa"><p style="margin:0 0 4px;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Your Notes</p><p style="margin:0;font-size:14px;color:#1e293b;line-height:1.6">${design.revision_comments}</p></div>` : ''}
      ${cta('View Request', `${APP_URL}/designs`)}
    `),
  },

  delivered: {
    subject: '🎉 Your Design is Delivered!',
    notifTitle: 'Design delivered!',
    notifMsg: (d) => `Your design "${d.title}" has been delivered. Download your files now.`,
    badge: () => badge('Delivered', '#f0fdf4', '#166534', '#86efac'),
    html: (design, user) => emailWrapper(`
      <div style="text-align:center;margin-bottom:24px">
        <div style="font-size:44px;margin-bottom:8px">🎉</div>
        <h2 style="color:#0f172a;font-size:22px;font-weight:800;margin:0 0 6px">Your Design is Delivered!</h2>
        <p style="color:#64748b;font-size:14px;margin:0">Your files are ready to download and use.</p>
      </div>
      <p style="color:#334155;font-size:14px;margin:0 0 16px">Hi <strong>${user?.full_name || 'there'}</strong>,</p>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px">
        Your design for <strong>${design.title}</strong> is complete! Log in to download your final files. Please approve the delivery to close out the request.
      </p>
      ${badge('Delivered', '#f0fdf4', '#166534', '#86efac')}
      ${infoRows([
        ['Request', design.title],
        ['Type', designTypeLabel(design.design_type)],
        ['Delivered', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
      ])}
      ${cta('Download My Files', `${APP_URL}/designs`, '#16a34a')}
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:12px 0 0">
        Not satisfied? You can still request a revision if you have revisions remaining.
      </p>
    `),
  },

  completed: {
    subject: 'Design Request Completed ✓',
    notifTitle: 'Design request completed',
    notifMsg: (d) => `"${d.title}" has been marked complete. Thank you for using Brandfletch Designs!`,
    badge: () => badge('Completed', '#052e16', '#bbf7d0', '#166534'),
    html: (design, user) => emailWrapper(`
      <h2 style="color:#0f172a;font-size:21px;font-weight:800;margin:0 0 6px">Design Request Completed ✓</h2>
      <p style="color:#64748b;font-size:14px;margin:0 0 20px">Thanks for choosing Brandfletch Designs — we hope you love the result!</p>
      <p style="color:#334155;font-size:14px;margin:0 0 16px">Hi <strong>${user?.full_name || 'there'}</strong>,</p>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px">
        Your design request for <strong>${design.title}</strong> has been marked complete. We hope the result exceeds your expectations. Start your next campaign!
      </p>
      ${badge('Completed', '#052e16', '#bbf7d0', '#166534')}
      ${infoRows([
        ['Request', design.title],
        ['Type', designTypeLabel(design.design_type)],
        ['Completed', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
        ...(design.price ? [['Amount', `${design.currency || 'USD'} ${design.price}`] as [string,string]] : []),
      ])}
      ${cta('Order Another Design', `${APP_URL}/designs`, ACCENT_COLOR)}
    `),
  },
};

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    let design_id = body.design_id;
    let event_type = body.event_type;

    // Support entity automation trigger format
    if (!design_id && body.event?.entity_id) design_id = body.event.entity_id;
    if (!event_type && body.data?.status) event_type = body.data.status;

    if (!design_id || !event_type) {
      return Response.json({ error: 'Missing design_id or event_type' }, { status: 400 });
    }

    const config = EVENTS[event_type];
    if (!config) {
      return Response.json({ skipped: true, reason: `No email configured for status: ${event_type}` });
    }

    const [designs, allUsers] = await Promise.all([
      base44.asServiceRole.entities.DesignRequest.filter({ id: design_id }),
      base44.asServiceRole.entities.User.list(),
    ]);

    const design = designs[0];
    if (!design) return Response.json({ error: 'Design request not found' }, { status: 404 });

    const user = allUsers.find((u: any) => u.id === design.user_id);

    // Send email to client
    if (user?.email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        from_name: 'Brandfletch Designs',
        subject: config.subject,
        body: config.html(design, user),
      });
    }

    // Create in-app notification
    await base44.asServiceRole.entities.Notification.create({
      recipient_id: design.user_id,
      type: `design_${event_type}`,
      title: config.notifTitle,
      message: config.notifMsg(design),
      link: '/designs',
      is_read: false,
    });

    // Notify admin for submitted + awaiting_feedback
    if (['submitted', 'awaiting_feedback'].includes(event_type)) {
      const admins = allUsers.filter((u: any) => u.role === 'admin');
      for (const admin of admins) {
        if (admin.email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: admin.email,
            from_name: 'Brandfletch Ads (Internal)',
            subject: `Design ${event_type === 'submitted' ? 'Request Submitted' : 'Awaiting Feedback'} — ${design.title}`,
            body: emailWrapper(`
              <p style="font-size:15px;font-weight:700;color:#0f172a;margin:0 0 8px">Design Alert: ${event_type === 'submitted' ? 'New Request' : 'Client Feedback Needed'}</p>
              ${infoRows([
                ['Client', `${user?.full_name || 'Unknown'} (${user?.email || 'N/A'})`],
                ['Title', design.title],
                ['Type', designTypeLabel(design.design_type)],
                ['Priority', design.priority || 'medium'],
              ])}
              ${cta('Open in Admin', `${APP_URL}/admin-designs`)}
            `),
          });
        }
      }
    }

    return Response.json({ success: true, event_type, sent_to: user?.email });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
