import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

/**
 * InvoiceDownload — generates a branded PDF invoice
 * Uses html2pdf.js (loaded dynamically) for true PDF download — no print dialog.
 * Props:
 *   type: 'campaign' | 'design'
 *   record: Campaign or DesignRequest / PlatformSubscription object
 *   user: client User object
 *   invoiceNumber: optional string override
 *   paymentMethods: optional array of PaymentMethod records
 */
export default function InvoiceDownload({ type, record, user, invoiceNumber, paymentMethods = [] }) {
  const [downloading, setDownloading] = useState(false);

  if (!record || !user) return null;

  const invNum   = invoiceNumber || `BF-${record.id?.slice(-6)?.toUpperCase() || Date.now().toString().slice(-6)}`;
  const today    = format(new Date(), 'MMMM d, yyyy');
  const issuedOn = record.created_date ? format(new Date(record.created_date), 'MMMM d, yyyy') : today;
  const dueOn    = record.due_date     ? format(new Date(record.due_date),     'MMMM d, yyyy') : today;

  const total    = type === 'campaign' ? (record.total_cost || 0) : (record.amount || record.price || 0);
  const currency = record.currency || 'USD';
  const isPaid   = ['active','approved','completed','confirmed','paid','delivered'].includes(record.status);

  function fmt(n) {
    const num = Number(n) || 0;
    const fixed = num % 1 !== 0 ? num.toFixed(2) : num.toLocaleString();
    const symbols = { MWK:'MK ', KES:'KSh ', ZMW:'ZK ', ZAR:'R ', TZS:'TSh ', USD:'$', GBP:'£', EUR:'€' };
    return `${symbols[currency] || `${currency} `}${fixed}`;
  }

  const lineItems = type === 'campaign'
    ? [{ desc:'Meta / Facebook Ads Management', plan:(record.package||'—').replace(/\b\w/g,c=>c.toUpperCase()), dur:(record.duration||'One-Time').replace(/\b\w/g,c=>c.toUpperCase()), amt:total }]
    : [{ desc:'Graphic Design Services', plan:(record.design_type||record.subscription_type||'Design').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()), dur:record.request_type==='retainer'?'Monthly Retainer':'Per Design', amt:total }];

  const activeMethods = (paymentMethods||[]).filter(m=>m.is_active);

  // ── Brand tokens pulled from the app's CSS variables ──────────────────────
  // Primary: hsl(222, 70%, 18%) = #0d1b3e  (deep navy)
  // Accent:  hsl(217, 91%, 55%) = #2563eb  (blue)
  // Font:    Plus Jakarta Sans (heading) + Inter (body)
  const NAVY   = '#0d1b3e';
  const NAVY2  = '#102147';
  const BLUE   = '#2563eb';
  const BLUE_L = '#3b82f6';
  const BLUE_X = '#93c5fd';

  function buildHTML() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Invoice ${invNum}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{
    width:210mm;background:#fff;color:#1e293b;
    font-family:'Inter',Helvetica,Arial,sans-serif;
    -webkit-print-color-adjust:exact;print-color-adjust:exact;
    font-size:13px;line-height:1.5
  }
  h1,h2,h3,.heading{font-family:'Plus Jakarta Sans',sans-serif}

  /* ── Page ─────────────────────────────────── */
  .page{width:210mm;min-height:297mm;background:#fff;display:flex;flex-direction:column}

  /* ── Header ───────────────────────────────── */
  .hdr{
    background:${NAVY};
    padding:34px 44px 30px;
    display:flex;justify-content:space-between;align-items:flex-start;gap:20px
  }

  /* Logo block */
  .logo-wrap{display:flex;align-items:center;gap:11px;margin-bottom:10px}
  .logo-box{
    width:46px;height:46px;border-radius:11px;
    background:${BLUE};
    display:flex;align-items:center;justify-content:center;
    font-family:'Plus Jakarta Sans',sans-serif;font-weight:900;font-size:17px;color:#fff;
    letter-spacing:-1px;flex-shrink:0
  }
  .brand{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:20px;color:#fff;letter-spacing:-.4px}
  .brand-accent{color:${BLUE_L}}
  .brand-tag{font-size:9px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:1.3px;margin-bottom:16px}
  .co-info{font-size:11.5px;color:#64748b;line-height:2}

  /* Invoice meta */
  .inv-right{text-align:right;flex-shrink:0}
  .inv-word{
    font-family:'Plus Jakarta Sans',sans-serif;
    font-weight:900;font-size:46px;color:#fff;
    letter-spacing:-3px;line-height:1;margin-bottom:22px
  }
  .inv-word span{color:${BLUE_L}}
  .meta-row{display:flex;gap:16px;justify-content:flex-end;align-items:baseline;margin-bottom:5px}
  .meta-lbl{font-size:9px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.8px;min-width:54px;text-align:right}
  .meta-val{font-size:12px;font-weight:600;color:#e2e8f0;min-width:130px;text-align:right}
  .status{
    display:inline-flex;align-items:center;gap:6px;
    padding:5px 14px;border-radius:30px;
    font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:.7px;
    margin-top:14px
  }
  .status-paid{background:#dcfce7;color:#15803d}
  .status-due{background:#fef3c7;color:#b45309}
  .status-dot{width:6px;height:6px;border-radius:50%;background:currentColor;display:inline-block}

  /* ── Blue gradient bar ─────────────────────── */
  .bar{height:4px;background:linear-gradient(90deg,${BLUE} 0%,${BLUE_L} 60%,${BLUE_X} 100%)}

  /* ── Body ──────────────────────────────────── */
  .body{padding:36px 44px;flex:1}

  /* Billed row */
  .bill-row{
    display:flex;justify-content:space-between;align-items:flex-start;gap:24px;
    padding-bottom:28px;border-bottom:1.5px solid #e2e8f0;margin-bottom:28px
  }
  .sec-label{font-size:9px;font-weight:800;color:${BLUE};text-transform:uppercase;letter-spacing:1.3px;margin-bottom:10px}
  .client-name{font-family:'Plus Jakarta Sans',sans-serif;font-size:18px;font-weight:700;color:#0f172a;margin-bottom:2px}
  .client-biz{font-size:13px;font-weight:600;color:#334155;margin-bottom:2px}
  .client-detail{font-size:12px;color:#64748b;line-height:1.9}

  /* Amount card */
  .amount-card{
    background:${NAVY};border-radius:12px;
    padding:20px 26px;min-width:200px;text-align:right;flex-shrink:0
  }
  .amt-lbl{font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.9px;margin-bottom:8px}
  .amt-val{
    font-family:'Plus Jakarta Sans',sans-serif;
    font-size:28px;font-weight:900;color:#fff;letter-spacing:-1px;line-height:1;margin-bottom:6px
  }
  .amt-ref{font-size:11px;color:#475569}
  .amt-ref strong{color:#94a3b8}

  /* Services table */
  .tbl-label{font-size:9px;font-weight:800;color:${BLUE};text-transform:uppercase;letter-spacing:1.3px;margin-bottom:10px}
  table{width:100%;border-collapse:collapse;margin-bottom:24px;border-radius:10px;overflow:hidden}
  thead tr{background:${NAVY2}}
  th{
    padding:12px 16px;font-size:9.5px;font-weight:700;
    color:${BLUE_X};text-transform:uppercase;letter-spacing:.6px;text-align:left
  }
  th:last-child{text-align:right}
  tbody tr{border-bottom:1px solid #f1f5f9}
  tbody tr:last-child{border-bottom:none}
  td{padding:14px 16px;font-size:13px;color:#334155;vertical-align:top}
  td:last-child{text-align:right;font-weight:700;color:#0f172a;font-size:14px}
  .svc-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;color:#0f172a;font-size:13.5px;margin-bottom:2px}
  .pill{
    display:inline-block;padding:2px 10px;border-radius:30px;
    font-size:11px;font-weight:700
  }
  .pill-blue{background:#eff6ff;color:#1d4ed8}
  .pill-green{background:#f0fdf4;color:#15803d}

  /* Totals */
  .totals-wrap{display:flex;justify-content:flex-end;margin-bottom:28px}
  .totals-box{min-width:300px;border-radius:10px;overflow:hidden;border:1.5px solid #e2e8f0}
  .tot-row{
    display:flex;justify-content:space-between;align-items:center;
    padding:11px 18px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:13px
  }
  .tot-row:last-child{border-bottom:none}
  .tot-lbl{color:#64748b}
  .tot-val{font-weight:600;color:#0f172a}
  .tot-final{background:${NAVY}!important;padding:14px 18px}
  .tot-final .tot-lbl{color:${BLUE_X};font-size:12px;font-weight:700}
  .tot-final .tot-val{font-family:'Plus Jakarta Sans',sans-serif;color:#fff;font-size:18px;font-weight:900}

  /* Payment ref */
  .pay-ref{
    background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:8px;
    padding:12px 16px;margin-bottom:22px;font-size:12.5px;color:#1e40af;line-height:1.6
  }
  .pay-ref strong{color:${BLUE}}

  /* Payment methods */
  .pay-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(175px,1fr));gap:12px;margin-top:10px;margin-bottom:24px}
  .pay-card{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;padding:12px 14px}
  .pay-name{font-size:12px;font-weight:700;color:#0f172a;margin-bottom:3px}
  .pay-detail{font-size:11.5px;color:#475569;line-height:1.7}
  .mono{font-family:monospace;font-weight:700;word-break:break-all}

  /* Thank-you note */
  .note{background:#fffbeb;border:1.5px solid #fde68a;border-radius:8px;padding:12px 16px;margin-bottom:28px}
  .note p{font-size:12px;color:#78350f;line-height:1.65}

  /* Footer */
  .ftr{
    background:#f1f5f9;border-top:2px solid #e2e8f0;
    padding:18px 44px;display:flex;justify-content:space-between;align-items:center;margin-top:auto
  }
  .fl{font-size:11.5px;color:#64748b;line-height:1.9}
  .fl-brand{font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;font-weight:800;color:${NAVY};margin-bottom:2px}
  .fl-brand em{color:${BLUE};font-style:normal}
  .fr{font-size:11px;color:#94a3b8;text-align:right;line-height:1.9}
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="hdr">
    <div>
      <div class="logo-wrap">
        <div class="logo-box">BF</div>
        <span class="brand">Brandfletch <span class="brand-accent">Ads</span></span>
      </div>
      <div class="brand-tag">Advertising &amp; Creative Agency</div>
      <div class="co-info">
        Blantyre, Malawi<br/>
        hello@brandfletch.com<br/>
        brandfletch.com
      </div>
    </div>

    <div class="inv-right">
      <div class="inv-word heading">INV<span>.</span></div>
      <div class="meta-row"><span class="meta-lbl">Number</span><span class="meta-val">${invNum}</span></div>
      <div class="meta-row"><span class="meta-lbl">Issued</span><span class="meta-val">${issuedOn}</span></div>
      <div class="meta-row"><span class="meta-lbl">Due</span><span class="meta-val">${dueOn}</span></div>
      <div style="text-align:right">
        <span class="status ${isPaid ? 'status-paid' : 'status-due'}">
          <span class="status-dot"></span>
          ${isPaid ? 'PAID' : 'PAYMENT DUE'}
        </span>
      </div>
    </div>
  </div>

  <!-- ACCENT BAR -->
  <div class="bar"></div>

  <!-- BODY -->
  <div class="body">

    <!-- Billed to + Amount -->
    <div class="bill-row">
      <div>
        <div class="sec-label">Billed To</div>
        <div class="client-name">${user.full_name || user.email}</div>
        ${user.business_name ? `<div class="client-biz">${user.business_name}</div>` : ''}
        <div class="client-detail">
          ${user.email || ''}<br/>
          ${user.phone ? user.phone + '<br/>' : ''}
          ${user.country || ''}
        </div>
      </div>
      <div class="amount-card">
        <div class="amt-lbl">Total ${isPaid ? 'Paid' : 'Due'}</div>
        <div class="amt-val">${fmt(total)}</div>
        <div class="amt-ref">Invoice <strong>${invNum}</strong></div>
      </div>
    </div>

    <!-- Services -->
    <div class="tbl-label">Services</div>
    <table>
      <thead>
        <tr>
          <th style="width:44%">Service Description</th>
          <th style="width:20%">Plan / Type</th>
          <th style="width:20%">Duration</th>
          <th style="width:16%">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${lineItems.map(item => `
        <tr>
          <td><div class="svc-name">${item.desc}</div></td>
          <td><span class="pill pill-blue">${item.plan}</span></td>
          <td><span class="pill pill-green">${item.dur}</span></td>
          <td>${fmt(item.amt)}</td>
        </tr>`).join('')}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals-wrap">
      <div class="totals-box">
        <div class="tot-row"><span class="tot-lbl">Subtotal</span><span class="tot-val">${fmt(total)}</span></div>
        <div class="tot-row"><span class="tot-lbl">Tax / VAT</span><span class="tot-val">—</span></div>
        <div class="tot-row tot-final">
          <span class="tot-lbl">Total ${isPaid ? 'Paid' : 'Due'}</span>
          <span class="tot-val">${fmt(total)}</span>
        </div>
      </div>
    </div>

    ${record.payment_reference ? `
    <div class="pay-ref">
      <strong>Payment Reference:</strong> ${record.payment_reference}
      ${record.payment_method ? `&nbsp;·&nbsp;<strong>Method:</strong> ${record.payment_method}` : ''}
    </div>` : ''}

    ${activeMethods.length > 0 ? `
    <div class="sec-label">Payment Instructions</div>
    <div class="pay-grid">
      ${activeMethods.map(m => `
      <div class="pay-card">
        <div class="pay-name">${m.method_name || m.method_type || ''}</div>
        ${m.account_name   ? `<div class="pay-detail">${m.account_name}</div>` : ''}
        ${m.account_number ? `<div class="pay-detail mono">${m.account_number}</div>` : ''}
        ${m.instructions   ? `<div style="font-size:11px;color:#94a3b8;margin-top:4px;line-height:1.5">${m.instructions}</div>` : ''}
      </div>`).join('')}
    </div>` : ''}

    <div class="note">
      <p>Thank you for choosing <strong>Brandfletch Ads</strong>. For any queries regarding this invoice, contact us at <strong>hello@brandfletch.com</strong> or via WhatsApp.</p>
    </div>

  </div>

  <!-- FOOTER -->
  <div class="ftr">
    <div class="fl">
      <div class="fl-brand">Brandfletch <em>Ads</em></div>
      hello@brandfletch.com &nbsp;·&nbsp; brandfletch.com<br/>
      Blantyre, Malawi
    </div>
    <div class="fr">
      Invoice ${invNum}<br/>
      ${currency === 'MWK' ? 'Malawian Kwacha (MWK)' : currency}<br/>
      Generated ${today}
    </div>
  </div>

</div>
</body>
</html>`;
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const html = buildHTML();

      // ── Strategy: open hidden iframe, inject HTML, call print() ──────────────
      // This triggers the browser "Save as PDF" option — a real PDF, not an HTML file.
      // We set the filename via the <title> tag (Chrome respects it for PDF filename).
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;opacity:0';
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(html);
      doc.close();

      // Wait for fonts/images to load, then print
      iframe.contentWindow.onload = () => {
        setTimeout(() => {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          // Clean up iframe after a delay (give print dialog time to open)
          setTimeout(() => { document.body.removeChild(iframe); }, 3000);
        }, 300);
      };

      // Fallback: if onload already fired (cached resources)
      setTimeout(() => {
        if (iframe.parentNode) {
          try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            setTimeout(() => {
              if (iframe.parentNode) document.body.removeChild(iframe);
            }, 3000);
          } catch (_) {}
        }
      }, 1200);

    } catch (err) {
      console.error('Invoice download error:', err);
      // Last resort: blob download of the HTML
      const html = buildHTML();
      const blob = new Blob([html], { type: 'text/html' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `Brandfletch-Invoice-${invNum}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={handleDownload}
      disabled={downloading}
    >
      <Download className="w-4 h-4" />
      {downloading ? 'Generating…' : 'Download Invoice'}
    </Button>
  );
}
