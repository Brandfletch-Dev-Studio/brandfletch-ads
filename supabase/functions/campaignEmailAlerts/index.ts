import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail } from '../_shared/sendEmail.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const APP_URL = 'https://brandfletch.com'
const SUPPORT_EMAIL = 'support@brandfletch.com'
const BRAND_COLOR = '#0f2d6b'
const ACCENT_COLOR = '#3b82f6'
const LOGO_URL = 'https://media.base44.com/images/public/6a1e8f4f079c524483e324a2/0072409c5_file_0000000024d0722fa20034e2dedcbc9e.png'

function emailWrapper(content: string, preheader = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<title>Brandfletch Media</title>
<style>
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
  table,td{mso-table-lspace:0;mso-table-rspace:0}
  img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none}
  body{margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif}
  .email-body{background-color:#f1f5f9;padding:24px 16px}
  .card{background:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08),0 1px 2px rgba(0,0,0,0.04);overflow:hidden}
  .header{background:${BRAND_COLOR};padding:20px 28px;text-align:center}
  .body-content{padding:28px 28px 24px}
  .h1{font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;margin:0 0 8px}
  .subtitle{font-size:15px;color:#64748b;margin:0 0 24px;line-height:1.5}
  .greeting{font-size:15px;color:#334155;margin:0 0 12px}
  .body-text{font-size:14px;color:#475569;line-height:1.6;margin:0 0 20px}
  .info-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px;margin:20px 0}
  .metrics-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:20px 0}
  .metric-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;text-align:center}
  .metric-value{font-size:20px;font-weight:700;color:#0f172a;display:block}
  .metric-label{font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-top:2px;display:block}
  .footer{padding:16px 28px;background:#f8fafc;border-top:1px solid #f1f5f9;text-align:center}
  .footer-brand{font-size:14px;font-weight:700;color:${BRAND_COLOR};margin:0 0 4px}
  .footer-text{font-size:12px;color:#94a3b8;margin:0 0 2px;line-height:1.5}
  .footer-link{color:${ACCENT_COLOR};text-decoration:none}
  @media only screen and (max-width:600px){
    .email-body{padding:12px 8px}
    .body-content{padding:20px 18px 18px}
    .header{padding:16px 18px}
    .footer{padding:14px 18px}
    .h1{font-size:20px}
  }
</style>
</head>
<body>
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#f8fafc;line-height:1px">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ''}
<table width="100%" cellpadding="0" cellspacing="0" border="0" class="email-body">
<tr><td align="center">
<table width="100%" style="max-width:620px" cellpadding="0" cellspacing="0" border="0">
<tr><td>
<div class="card">
  <div class="header">
    <a href="${APP_URL}" style="text-decoration:none;display:inline-flex;align-items:center;gap:10px">
      <img src="${LOGO_URL}" alt="Brandfletch Media" width="36" height="36" style="border-radius:8px;display:block;width:36px;height:36px" />
      <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.3px;vertical-align:middle">Brandfletch <span style="color:#93c5fd">Ads</span></span>
    </a>
  </div>
  ${content}
  <div class="footer">
    <p class="footer-brand">Brandfletch Media</p>
    <p class="footer-text"><a href="mailto:${SUPPORT_EMAIL}" class="footer-link">${SUPPORT_EMAIL}</a></p>
    <p class="footer-text" style="color:#cbd5e1">© ${new Date().getFullYear()} Brandfletch Media. All rights reserved.</p>
    <p class="footer-text" style="color:#e2e8f0;font-size:11px">You received this email because you have an account on Brandfletch Media.</p>
  </div>
</div>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

function badge(text: string, color: string): string {
  const COLORS: Record<string, { bg: string; text: string; border: string }> = {
    amber: { bg: '#fffbeb', text: '#92400e', border: '#fcd34d' },
    blue: { bg: '#eff6ff', text: '#1d4ed8', border: '#93c5fd' },
    green: { bg: '#f0fdf4', text: '#166534', border: '#86efac' },
    darkgreen: { bg: '#052e16', text: '#bbf7d0', border: '#166534' },
    red: { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' },
    purple: { bg: '#faf5ff', text: '#6b21a8', border: '#d8b4fe' },
    gray: { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' },
  }
  const c = COLORS[color] || COLORS.gray
  return `<span style="display:inline-block;background:${c.bg};color:${c.text};border:1px solid ${c.border};border-radius:20px;padding:3px 12px;font-size:12px;font-weight:600;letter-spacing:0.2px">${text}</span>`
}

function infoCard(rows: [string, string][]): string {
  const rowsHtml = rows.map(([label, value]) =>
    `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom:1px solid #f1f5f9">
      <tr>
        <td style="padding:7px 0;font-size:13px;color:#64748b;font-weight:500">${label}</td>
        <td style="padding:7px 0;font-size:13px;color:#1e293b;font-weight:600;text-align:right">${value}</td>
      </tr>
    </table>`
  ).join('')
  return `<div class="info-card">${rowsHtml}</div>`
}

function metricsGrid(metrics: [string, string][]): string {
  const cards = metrics.map(([label, value]) =>
    `<div class="metric-card">
      <span class="metric-value">${value}</span>
      <span class="metric-label">${label}</span>
    </div>`
  ).join('')
  return `<div class="metrics-grid">${cards}</div>`
}

function ctaButton(label: string, url: string): string {
  return `<div style="margin:24px 0 4px"><a href="${url}" style="background:${ACCENT_COLOR};color:#ffffff;display:inline-block;font-size:14px;font-weight:600;text-decoration:none;padding:11px 24px;border-radius:8px">${label} →</a></div>`
}

function fmt(n: any): string {
  if (n === undefined || n === null) return '—'
  return Number(n).toLocaleString()
}

// ─── Template builders ───────────────────────────────────────────────────────

function buildCampaignSubmitted(c: any, u: any, _notes?: string, heading?: string, bodyText?: string, ctaLabel?: string) {
  const name = u?.full_name || 'there'
  const submittedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const content = `
    <div class="body-content">
      <p class="h1">${heading || 'Campaign Submitted'}</p>
      <p class="subtitle">Your campaign is now pending review.</p>
      <p class="greeting">Hi ${name},</p>
      <p class="body-text">${bodyText || "We've received your campaign and it's now in our review queue. Our team verifies and launches campaigns within <strong>1–2 hours</strong>. We'll notify you as soon as there's an update."}</p>
      ${badge('Pending Review', 'amber')}
      ${infoCard([
        ['Campaign Name', c.campaign_name || c.page_name || '—'],
        ['Package', c.package ? c.package.charAt(0).toUpperCase() + c.package.slice(1) : '—'],
        ['Duration', c.duration ? c.duration.charAt(0).toUpperCase() + c.duration.slice(1) : '—'],
        ['Amount', `${c.currency || 'USD'} ${fmt(c.total_cost)}`],
        ['Submitted', submittedDate],
      ])}
      ${ctaButton(ctaLabel || 'View Campaign', `${APP_URL}/campaigns/${c.id}`)}
    </div>`
  return emailWrapper(content, 'Your campaign has been submitted and is now pending review.')
}

function buildCampaignApproved(c: any, u: any, _notes?: string, heading?: string, bodyText?: string, ctaLabel?: string) {
  const name = u?.full_name || 'there'
  const content = `
    <div class="body-content">
      <p class="h1">${heading || 'Campaign Approved! 🎉'}</p>
      <p class="subtitle">Your campaign has been reviewed and approved.</p>
      <p class="greeting">Hi ${name},</p>
      <p class="body-text">${bodyText || 'Great news — your campaign has been approved by our team and will begin running shortly. Keep an eye on your dashboard for live performance updates.'}</p>
      ${badge('Approved', 'blue')}
      ${infoCard([
        ['Campaign', c.campaign_name || c.page_name || '—'],
        ['Package', c.package ? c.package.charAt(0).toUpperCase() + c.package.slice(1) : '—'],
        ['Budget', `${c.currency || 'USD'} ${fmt(c.total_cost)}`],
      ])}
      ${ctaButton(ctaLabel || 'View Campaign', `${APP_URL}/campaigns/${c.id}`)}
    </div>`
  return emailWrapper(content, 'Your campaign has been approved and will start running soon.')
}

function buildCampaignActive(c: any, u: any, _notes?: string, heading?: string, bodyText?: string, ctaLabel?: string) {
  const name = u?.full_name || 'there'
  const content = `
    <div class="body-content">
      <p class="h1">${heading || 'Your Campaign Is Live 🚀'}</p>
      <p class="subtitle">Your ads are now actively running.</p>
      <p class="greeting">Hi ${name},</p>
      <p class="body-text">${bodyText || 'Your campaign is now live and your ads are reaching your target audience. Performance data will begin accumulating — check your dashboard to track impressions, clicks, and results in real time.'}</p>
      ${badge('Active', 'green')}
      ${infoCard([
        ['Campaign', c.campaign_name || c.page_name || '—'],
        ['Package', c.package ? c.package.charAt(0).toUpperCase() + c.package.slice(1) : '—'],
        ['Duration', c.duration ? c.duration.charAt(0).toUpperCase() + c.duration.slice(1) : '—'],
        ['Budget', `${c.currency || 'USD'} ${fmt(c.total_cost)}`],
        ...(c.start_date ? [['Start Date', c.start_date] as [string, string]] : []),
        ...(c.end_date ? [['End Date', c.end_date] as [string, string]] : []),
      ])}
      ${ctaButton(ctaLabel || 'View Performance', `${APP_URL}/campaigns/${c.id}`)}
    </div>`
  return emailWrapper(content, 'Your campaign is now live and reaching your audience.')
}

function buildCampaignCompleted(c: any, u: any, _notes?: string, heading?: string, bodyText?: string, ctaLabel?: string) {
  const name = u?.full_name || 'there'
  const cpr = c.clicks > 0 && c.total_cost ? `${c.currency || 'USD'} ${(c.total_cost / c.clicks).toFixed(2)}` : '—'
  const content = `
    <div class="body-content">
      <p class="h1">${heading || 'Campaign Completed'}</p>
      <p class="subtitle">Your campaign has successfully run its full course.</p>
      <p class="greeting">Hi ${name},</p>
      <p class="body-text">${bodyText || `Your campaign for <strong>${c.campaign_name || c.page_name || 'your page'}</strong> has completed. Here's a summary of your results:`}</p>
      ${badge('Completed', 'darkgreen')}
      ${metricsGrid([
        ['Reach', fmt(c.reach)],
        ['Impressions', fmt(c.impressions)],
        ['Clicks / Results', fmt(c.clicks)],
        ['Amount Spent', `${c.currency || 'USD'} ${fmt(c.total_cost)}`],
      ])}
      ${infoCard([
        ['Cost Per Result', cpr],
        ...(c.completed_date ? [['Completed', c.completed_date] as [string, string]] : []),
      ])}
      ${ctaButton(ctaLabel || 'View Full Report', `${APP_URL}/campaigns/${c.id}`)}
    </div>`
  return emailWrapper(content, 'Your campaign has completed. View your final performance report.')
}

function buildCampaignRejected(c: any, u: any, notes?: string, heading?: string, bodyText?: string, ctaLabel?: string) {
  const name = u?.full_name || 'there'
  const content = `
    <div class="body-content">
      <p class="h1">${heading || 'Campaign Requires Changes'}</p>
      <p class="subtitle">Your campaign could not be approved in its current state.</p>
      <p class="greeting">Hi ${name},</p>
      <p class="body-text">${bodyText || `After reviewing your campaign for <strong>${c.campaign_name || c.page_name || 'your page'}</strong>, our team was unable to approve it. Please review the feedback below and make the necessary adjustments.`}</p>
      ${badge('Rejected', 'red')}
      ${notes ? `<div class="info-card"><p style="margin:0 0 4px;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Reason</p><p style="margin:0;font-size:14px;color:#1e293b;line-height:1.6">${notes}</p></div>` : ''}
      <p class="body-text" style="margin-top:16px">If you have questions, reply to this email or reach out to our support team — we're happy to help.</p>
      ${ctaButton(ctaLabel || 'Edit Campaign', `${APP_URL}/campaigns/${c.id}`)}
    </div>`
  return emailWrapper(content, 'Your campaign requires changes before it can be approved.')
}

function buildCampaignChangesRequested(c: any, u: any, notes?: string, heading?: string, bodyText?: string, ctaLabel?: string) {
  const name = u?.full_name || 'there'
  const content = `
    <div class="body-content">
      <p class="h1">${heading || 'Changes Requested'}</p>
      <p class="subtitle">Our team has reviewed your campaign and needs a few updates.</p>
      <p class="greeting">Hi ${name},</p>
      <p class="body-text">${bodyText || `We've reviewed your campaign for <strong>${c.campaign_name || c.page_name || 'your page'}</strong> and would like to request some adjustments before we can proceed.`}</p>
      ${badge('Changes Requested', 'amber')}
      ${notes ? `<div class="info-card"><p style="margin:0 0 4px;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Requested Changes</p><p style="margin:0;font-size:14px;color:#1e293b;line-height:1.6">${notes}</p></div>` : ''}
      ${ctaButton(ctaLabel || 'Update Campaign', `${APP_URL}/campaigns/${c.id}`)}
    </div>`
  return emailWrapper(content, 'Your campaign needs a few updates before it can be approved.')
}

function buildCampaignRefunded(c: any, u: any, notes?: string, heading?: string, bodyText?: string, ctaLabel?: string) {
  const name = u?.full_name || 'there'
  const refundDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const content = `
    <div class="body-content">
      <p class="h1">${heading || 'Refund Processed'}</p>
      <p class="subtitle">Your refund has been successfully processed.</p>
      <p class="greeting">Hi ${name},</p>
      <p class="body-text">${bodyText || 'A refund has been issued for your campaign. Please allow a few business days for the funds to reflect depending on your payment method.'}</p>
      ${badge('Refunded', 'purple')}
      ${infoCard([
        ['Campaign', c.campaign_name || c.page_name || '—'],
        ['Refund Amount', `${c.currency || 'USD'} ${fmt(c.total_cost)}`],
        ['Date', refundDate],
        ...(notes ? [['Notes', notes] as [string, string]] : []),
      ])}
      <p class="body-text">If you have any questions about your refund, please contact our support team.</p>
      ${ctaButton(ctaLabel || 'View Campaign', `${APP_URL}/campaigns/${c.id}`)}
    </div>`
  return emailWrapper(content, 'Your refund has been processed successfully.')
}

function buildAwaitingPayment(c: any, u: any, _notes?: string, heading?: string, bodyText?: string, ctaLabel?: string) {
  const name = u?.full_name || 'there'
  const content = `
    <div class="body-content">
      <p class="h1">${heading || 'Complete Your Payment'}</p>
      <p class="subtitle">One step left to launch your campaign.</p>
      <p class="greeting">Hi ${name},</p>
      <p class="body-text">${bodyText || 'Your campaign is configured and ready to go! Complete your payment to submit it for review and get your ads running.'}</p>
      ${infoCard([
        ['Campaign', c.campaign_name || c.page_name || '—'],
        ['Package', c.package ? c.package.charAt(0).toUpperCase() + c.package.slice(1) : '—'],
        ['Total Due', `${c.currency || 'USD'} ${fmt(c.total_cost)}`],
      ])}
      ${ctaButton(ctaLabel || 'Complete Payment', `${APP_URL}/campaigns/${c.id}/payment`)}
    </div>`
  return emailWrapper(content, 'Your campaign is ready — complete payment to launch.')
}

function buildPaymentSubmitted(c: any, u: any) {
  const name = u?.full_name || 'there'
  const content = `
    <div class="body-content">
      <p class="h1">Payment Proof Received</p>
      <p class="subtitle">Our team will verify your payment shortly.</p>
      <p class="greeting">Hi ${name},</p>
      <p class="body-text">We've received your payment proof for the campaign below. Our finance team will verify it within <strong>1–2 business days</strong> and notify you once confirmed.</p>
      ${badge('Pending Verification', 'amber')}
      ${infoCard([
        ['Campaign', c.campaign_name || c.page_name || '—'],
        ['Amount', `${c.currency || 'USD'} ${fmt(c.total_cost)}`],
        ['Payment Method', c.payment_method || '—'],
        ...(c.payment_reference ? [['Reference', c.payment_reference] as [string, string]] : []),
      ])}
      ${ctaButton('View Campaign', `${APP_URL}/campaigns/${c.id}`)}
    </div>`
  return emailWrapper(content, "We've received your payment proof and will verify it soon.")
}

function buildPaymentConfirmed(c: any, u: any) {
  const name = u?.full_name || 'there'
  const confirmedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const content = `
    <div class="body-content">
      <p class="h1">Payment Confirmed ✓</p>
      <p class="subtitle">Your payment has been successfully verified.</p>
      <p class="greeting">Hi ${name},</p>
      <p class="body-text">We've confirmed your payment and your campaign is now submitted for review. You'll receive another notification once the review is complete.</p>
      ${badge('Paid', 'green')}
      ${infoCard([
        ['Campaign', c.campaign_name || c.page_name || '—'],
        ['Amount Paid', `${c.currency || 'USD'} ${fmt(c.total_cost)}`],
        ['Payment Date', confirmedDate],
        ['Status', 'Confirmed & In Review'],
      ])}
      ${ctaButton('View Campaign', `${APP_URL}/campaigns/${c.id}`)}
    </div>`
  return emailWrapper(content, 'Your payment has been confirmed. Your campaign is now under review.')
}

function buildPaymentRejected(c: any, u: any, notes?: string) {
  const name = u?.full_name || 'there'
  const content = `
    <div class="body-content">
      <p class="h1">Payment Could Not Be Verified</p>
      <p class="subtitle">There was an issue with your payment proof.</p>
      <p class="greeting">Hi ${name},</p>
      <p class="body-text">We were unable to verify your payment for the campaign below. Please resubmit your payment proof or contact support for assistance.</p>
      ${badge('Verification Failed', 'red')}
      ${notes ? `<div class="info-card"><p style="margin:0 0 4px;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Reason</p><p style="margin:0;font-size:14px;color:#1e293b;line-height:1.6">${notes}</p></div>` : ''}
      ${infoCard([
        ['Campaign', c.campaign_name || c.page_name || '—'],
        ['Amount', `${c.currency || 'USD'} ${fmt(c.total_cost)}`],
      ])}
      ${ctaButton('Resubmit Payment', `${APP_URL}/campaigns/${c.id}/payment`)}
    </div>`
  return emailWrapper(content, "We couldn't verify your payment. Please resubmit your proof.")
}

function buildAdminNotification(subject: string, c: any, clientUser: any) {
  const content = `
    <div class="body-content">
      <p class="h1">${subject}</p>
      <p class="body-text" style="margin-bottom:4px">A campaign action requires your attention.</p>
      ${infoCard([
        ['Client', `${clientUser?.full_name || 'Unknown'} (${clientUser?.email || 'N/A'})`],
        ['Page', c.page_name || '—'],
        ['Package', c.package || '—'],
        ['Duration', c.duration || '—'],
        ['Cost', `${c.currency || 'USD'} ${fmt(c.total_cost)}`],
        ...(c.payment_method ? [['Payment Method', c.payment_method] as [string, string]] : []),
        ...(c.payment_reference ? [['Reference', c.payment_reference] as [string, string]] : []),
      ])}
      ${ctaButton('Review in Admin', `${APP_URL}/admin-campaigns`)}
    </div>`
  return emailWrapper(content)
}

const EVENT_CONFIG: Record<string, {
  clientSubject: string | ((c: any) => string)
  clientHtml: (c: any, u: any, notes?: string, heading?: string, bodyText?: string, ctaLabel?: string) => string
  adminSubject?: (c: any) => string
  adminHtml?: (c: any, u: any) => string
}> = {
  pending_review: {
    clientSubject: 'Campaign Submitted — Pending Review',
    clientHtml: (c, u) => buildCampaignSubmitted(c, u),
    adminSubject: (c) => `New Campaign Submitted — ${c.page_name || c.campaign_name}`,
    adminHtml: (c, u) => buildAdminNotification('New Campaign Submitted', c, u),
  },
  approved: { clientSubject: 'Your Campaign Has Been Approved', clientHtml: (c, u) => buildCampaignApproved(c, u) },
  active: { clientSubject: 'Your Campaign Is Now Live', clientHtml: (c, u) => buildCampaignActive(c, u) },
  completed: { clientSubject: 'Campaign Completed — View Your Results', clientHtml: (c, u) => buildCampaignCompleted(c, u) },
  rejected: { clientSubject: 'Campaign Could Not Be Approved', clientHtml: (c, u, notes) => buildCampaignRejected(c, u, notes) },
  changes_requested: { clientSubject: 'Changes Requested for Your Campaign', clientHtml: (c, u, notes) => buildCampaignChangesRequested(c, u, notes) },
  refunded: { clientSubject: 'Refund Processed for Your Campaign', clientHtml: (c, u, notes) => buildCampaignRefunded(c, u, notes) },
  awaiting_payment: { clientSubject: 'Complete Your Payment to Launch Your Campaign', clientHtml: (c, u) => buildAwaitingPayment(c, u) },
  payment_submitted: {
    clientSubject: 'Payment Proof Received — Pending Verification',
    clientHtml: (c, u) => buildPaymentSubmitted(c, u),
    adminSubject: (c) => `Payment Submitted — ${c.page_name || c.campaign_name}`,
    adminHtml: (c, u) => buildAdminNotification('Payment Submitted — Awaiting Verification', c, u),
  },
  payment_confirmed: { clientSubject: 'Payment Confirmed', clientHtml: (c, u) => buildPaymentConfirmed(c, u) },
  payment_rejected: { clientSubject: 'Payment Could Not Be Verified', clientHtml: (c, u, notes) => buildPaymentRejected(c, u, notes) },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const admin = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json()
    let campaign_id = body.campaign_id
    let event_type = body.event_type
    let notes = body.notes

    if (!campaign_id && body.event?.entity_id) campaign_id = body.event.entity_id
    if (!event_type && body.data?.status) {
      event_type = body.data.status
      if (body.data?.payment_proof_url && !body.old_data?.payment_proof_url) event_type = 'payment_submitted'
    }
    if (!notes && body.data?.manager_notes) notes = body.data.manager_notes

    if (!campaign_id || !event_type) {
      return new Response(JSON.stringify({ error: 'Missing campaign_id or event_type' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const config = EVENT_CONFIG[event_type]
    if (!config) {
      return new Response(JSON.stringify({ error: `Unknown event_type: ${event_type}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const [{ data: campaign }, { data: allUsers }, { data: storedTemplates }] = await Promise.all([
      admin.from('Campaign').select('*').eq('id', campaign_id).single(),
      admin.from('User').select('*'),
      admin.from('EmailTemplate').select('*').eq('event_type', event_type),
    ])

    if (!campaign) {
      return new Response(JSON.stringify({ error: 'Campaign not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const clientUser = allUsers?.find((u: any) => u.id === campaign.user_id)
    const admins = (allUsers || []).filter((u: any) => u.role === 'admin' || u.role === 'super_admin')
    const storedTpl = storedTemplates?.[0]

    const applyTpl = (
      htmlFn: typeof config.clientHtml,
      subject: string | ((c: any) => string),
      c: any, u: any, n?: string,
    ) => {
      if (storedTpl && storedTpl.is_active !== false) {
        const name = u?.full_name || 'there'
        const bodyText = (storedTpl.body_text || '')
          .replace(/\{\{name\}\}/g, name)
          .replace(/\{\{campaign_name\}\}/g, c.campaign_name || c.page_name || '')
          .replace(/\{\{amount\}\}/g, `${c.currency || 'USD'} ${fmt(c.total_cost)}`)
          .replace(/\{\{notes\}\}/g, n || '')
        return { subject: storedTpl.subject || (typeof subject === 'function' ? subject(c) : subject), html: htmlFn(c, u, n, storedTpl.heading, bodyText, storedTpl.cta_label) }
      }
      return { subject: typeof subject === 'function' ? subject(c) : subject, html: htmlFn(c, u, n) }
    }

    const results: { client: string | null; admin: string | null } = { client: null, admin: null }

    if (clientUser?.email && config.clientHtml) {
      const { subject, html } = applyTpl(config.clientHtml, config.clientSubject, campaign, clientUser, notes)
      await sendEmail({ to: clientUser.email, fromName: 'Brandfletch Media', subject, html })
      results.client = `sent to ${clientUser.email}`
    }

    if (config.adminSubject && config.adminHtml) {
      for (const adminUser of admins) {
        if (adminUser.email) {
          await sendEmail({
            to: adminUser.email,
            fromName: 'Brandfletch Media (Internal)',
            subject: config.adminSubject(campaign),
            html: config.adminHtml(campaign, clientUser),
          })
        }
      }
      results.admin = `sent to ${admins.length} admin(s)`
    }

    return new Response(JSON.stringify({ success: true, event_type, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
