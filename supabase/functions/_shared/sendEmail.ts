// Shared Resend email helper — used by designEmailAlerts and campaignEmailAlerts
// (and any future transactional email function). Resend REST API, no SDK needed.
export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
  fromName?: string
}) {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) {
    console.error('RESEND_API_KEY not configured — email not sent')
    return { error: 'RESEND_API_KEY not configured' }
  }

  const fromName = opts.fromName || 'Brandfletch Ads'
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${fromName} <noreply@brandfletch.com>`,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('Resend send failed:', res.status, errText)
    return { error: errText }
  }

  return { success: true }
}
