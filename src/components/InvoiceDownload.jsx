import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

/**
 * InvoiceDownload — generates a branded PDF invoice via print dialog
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

  const invNum   = invoiceNumber || `BF-${Date.now().toString().slice(-6)}`;
  const today    = format(new Date(), 'MMMM d, yyyy');
  const issuedOn = record.created_date ? format(new Date(record.created_date), 'MMMM d, yyyy') : today;
  const dueOn    = record.due_date ? format(new Date(record.due_date), 'MMMM d, yyyy') : today;

  const total    = type === 'campaign' ? (record.total_cost || 0) : (record.amount || record.price || 0);
  const currency = record.currency || 'USD';
  const isPaid   = ['active','approved','completed','confirmed','paid','delivered'].includes(record.status);

  function fmt(n) {
    const num = Number(n) || 0;
    const fixed = num % 1 !== 0 ? num.toFixed(2) : num.toLocaleString();
    const symbols = { MWK: 'MK ', KES: 'KSh ', ZMW: 'ZK ', ZAR: 'R ', TZS: 'TSh ', USD: '$', GBP: '£', EUR: '€' };
    return `${symbols[currency] || `${currency} `}${fixed}`;
  }

  const lineItems = type === 'campaign'
    ? [{ service: 'Meta / Facebook Ads Management', plan: (record.package || '—').replace(/\b\w/g,c=>c.toUpperCase()), duration: (record.duration || 'One-Time').replace(/\b\w/g,c=>c.toUpperCase()), amount: total }]
    : [{ service: 'Graphic Design Services', plan: (record.design_type || record.subscription_type || 'Design').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()), duration: record.request_type === 'retainer' ? 'Monthly Retainer' : 'Per Design', amount: total }];

  const activeMethods = (paymentMethods || []).filter(m => m.is_active);

  function buildHTML() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Invoice ${invNum} — Brandfletch</title>
<style>
  /* ── Reset ─────────────────────────────── */
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{width:210mm;background:#ffffff;color:#1e293b;
    font-family:'Segoe UI',Helvetica,Arial,sans-serif;
    -webkit-print-color-adjust:exact;print-color-adjust:exact}

  /* ── Print setup ────────────────────────── */
  @page{size:A4 portrait;margin:0}
  @media screen{body{background:#e5e7eb;padding:24px 0}
    .page{max-width:210mm;margin:0 auto;box-shadow:0 8px 48px rgba(0,0,0,.18)}}
  @media print{body{background:#fff;padding:0}.page{box-shadow:none}}

  /* ── Page wrapper ───────────────────────── */
  .page{width:210mm;min-height:297mm;background:#ffffff;position:relative;display:flex;flex-direction:column}

  /* ── Header band ────────────────────────── */
  .hdr{background:#0d1b3e;padding:32px 44px 28px;display:flex;justify-content:space-between;align-items:flex-start;gap:20px}

  /* Logo + company */
  .logo-block{display:flex;flex-direction:column}
  .logo-row{display:flex;align-items:center;gap:10px;margin-bottom:6px}
  .logo-circle{width:44px;height:44px;border-radius:10px;background:#1e40af;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#fff;letter-spacing:-1px;flex-shrink:0}
  .brand-name{font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-.4px}
  .brand-name em{color:#60a5fa;font-style:normal}
  .brand-tag{font-size:9.5px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:14px}
  .co-info{font-size:11.5px;color:#94a3b8;line-height:1.9}

  /* Invoice meta */
  .inv-block{text-align:right;flex-shrink:0}
  .inv-word{font-size:42px;font-weight:900;color:#ffffff;letter-spacing:-2px;line-height:1;margin-bottom:20px}
  .inv-word span{color:#3b82f6}
  .meta-row{display:flex;gap:16px;justify-content:flex-end;align-items:baseline;margin-bottom:5px}
  .meta-label{font-size:9.5px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.7px;min-width:58px;text-align:right}
  .meta-val{font-size:12px;font-weight:600;color:#e2e8f0;min-width:120px;text-align:right}
  .status-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:30px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.6px;margin-top:12px}
  .badge-paid{background:#dcfce7;color:#15803d}
  .badge-due{background:#fef3c7;color:#b45309}
  .badge-dot{width:6px;height:6px;border-radius:50%;background:currentColor}

  /* ── Accent bar ─────────────────────────── */
  .accent-bar{height:4px;background:linear-gradient(90deg,#1d4ed8 0%,#3b82f6 50%,#60a5fa 100%)}

  /* ── Body ───────────────────────────────── */
  .body{padding:36px 44px;flex:1}

  /* Billed + Amount row */
  .bill-row{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;margin-bottom:32px;padding-bottom:28px;border-bottom:1.5px solid #e2e8f0}
  .section-label{font-size:9.5px;font-weight:800;color:#1d4ed8;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:10px}
  .client-name{font-size:18px;font-weight:700;color:#0f172a;margin-bottom:3px}
  .client-biz{font-size:13px;font-weight:600;color:#334155;margin-bottom:2px}
  .client-detail{font-size:12px;color:#64748b;line-height:1.8}

  .amount-card{background:#0d1b3e;border-radius:12px;padding:20px 26px;min-width:190px;text-align:right;flex-shrink:0}
  .amount-label{font-size:9.5px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px}
  .amount-value{font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-1px;line-height:1;margin-bottom:6px}
  .amount-inv{font-size:11px;color:#64748b}
  .amount-inv strong{color:#94a3b8}

  /* Services table */
  .table-label{font-size:9.5px;font-weight:800;color:#1d4ed8;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:10px}
  table{width:100%;border-collapse:collapse;margin-bottom:24px;border-radius:10px;overflow:hidden}
  thead tr{background:#0d1b3e}
  th{padding:12px 16px;font-size:10px;font-weight:700;color:#93c5fd;text-transform:uppercase;letter-spacing:.6px;text-align:left}
  th:last-child{text-align:right}
  tbody tr{border-bottom:1px solid #f1f5f9}
  tbody tr:last-child{border-bottom:none}
  td{padding:14px 16px;font-size:13px;color:#334155;vertical-align:top;line-height:1.4}
  td:last-child{text-align:right;font-weight:700;color:#0f172a;font-size:14px}
  .svc-name{font-weight:700;color:#0f172a;font-size:13.5px;margin-bottom:2px}
  .pill{display:inline-block;background:#eff6ff;color:#1d4ed8;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700}
  .pill-green{background:#f0fdf4;color:#15803d}

  /* Totals */
  .totals-wrap{display:flex;justify-content:flex-end;margin-bottom:28px}
  .totals-box{min-width:300px;border-radius:10px;overflow:hidden;border:1.5px solid #e2e8f0}
  .tot-row{display:flex;justify-content:space-between;align-items:center;padding:11px 18px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:13px}
  .tot-row:last-child{border-bottom:none}
  .tot-label{color:#64748b}
  .tot-val{font-weight:600;color:#0f172a}
  .tot-total{background:#0d1b3e!important;padding:14px 18px}
  .tot-total .tot-label{color:#93c5fd;font-size:12px;font-weight:700}
  .tot-total .tot-val{color:#ffffff;font-size:18px;font-weight:900}

  /* Payment reference */
  .pay-ref{background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:8px;padding:12px 16px;margin-bottom:22px;font-size:12.5px;color:#1e40af;line-height:1.6}
  .pay-ref strong{color:#1d4ed8}

  /* Payment methods */
  .pay-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-top:10px;margin-bottom:24px}
  .pay-card{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;padding:12px 14px}
  .pay-method-name{font-size:12px;font-weight:700;color:#0f172a;margin-bottom:3px}
  .pay-detail{font-size:11.5px;color:#475569;line-height:1.7}
  .mono{font-family:monospace;font-weight:700;color:#1e293b;word-break:break-all}

  /* Thank-you note */
  .note{background:#fffbeb;border:1.5px solid #fde68a;border-radius:8px;padding:12px 16px;margin-bottom:28px}
  .note p{font-size:12px;color:#78350f;line-height:1.65}

  /* Footer */
  .ftr{background:#f1f5f9;border-top:2px solid #e2e8f0;padding:18px 44px;display:flex;justify-content:space-between;align-items:center;margin-top:auto}
  .fl{font-size:11.5px;color:#64748b;line-height:1.8}
  .fl strong{color:#0f172a}
  .fr{font-size:11px;color:#94a3b8;text-align:right;line-height:1.8}
  .ftr-brand{font-size:13px;font-weight:800;color:#0d1b3e}
  .ftr-brand em{color:#2563eb;font-style:normal}
</style>
</head>
<body>
<div class="page">

  <!-- ── HEADER ─────────────────────────── -->
  <div class="hdr">
    <div class="logo-block">
      <div class="logo-row">
        <div class="logo-circle">BF</div>
        <span class="brand-name">Brandfletch <em>Ads</em></span>
      </div>
      <div class="brand-tag">Advertising &amp; Creative Agency</div>
      <div class="co-info">
        Blantyre, Malawi<br/>
        hello@brandfletch.com<br/>
        brandfletch.com
      </div>
    </div>
    <div class="inv-block">
      <div class="inv-word">INV<span>.</span></div>
      <div class="meta-row"><span class="meta-label">Number</span><span class="meta-val">${invNum}</span></div>
      <div class="meta-row"><span class="meta-label">Issued</span><span class="meta-val">${issuedOn}</span></div>
      <div class="meta-row"><span class="meta-label">Due</span><span class="meta-val">${dueOn}</span></div>
      <div style="text-align:right">
        <span class="status-badge ${isPaid ? 'badge-paid' : 'badge-due'}">
          <span class="badge-dot"></span>
          ${isPaid ? 'PAID' : 'PAYMENT DUE'}
        </span>
      </div>
    </div>
  </div>

  <!-- ── ACCENT BAR ─────────────────────── -->
  <div class="accent-bar"></div>

  <!-- ── BODY ───────────────────────────── -->
  <div class="body">

    <!-- Billed to + Amount -->
    <div class="bill-row">
      <div>
        <div class="section-label">Billed To</div>
        <div class="client-name">${user.full_name || user.email}</div>
        ${user.business_name ? `<div class="client-biz">${user.business_name}</div>` : ''}
        <div class="client-detail">
          ${user.email || ''}<br/>
          ${user.phone ? user.phone + '<br/>' : ''}
          ${user.country || ''}
        </div>
      </div>
      <div class="amount-card">
        <div class="amount-label">Total ${isPaid ? 'Paid' : 'Due'}</div>
        <div class="amount-value">${fmt(total)}</div>
        <div class="amount-inv">Invoice <strong>${invNum}</strong></div>
      </div>
    </div>

    <!-- Services table -->
    <div class="table-label">Services</div>
    <table>
      <thead>
        <tr>
          <th style="width:45%">Service Description</th>
          <th style="width:20%">Plan / Type</th>
          <th style="width:20%">Duration</th>
          <th style="width:15%">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${lineItems.map(item => `
        <tr>
          <td><div class="svc-name">${item.service}</div></td>
          <td><span class="pill">${item.plan}</span></td>
          <td><span class="pill pill-green">${item.duration}</span></td>
          <td>${fmt(item.amount)}</td>
        </tr>`).join('')}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals-wrap">
      <div class="totals-box">
        <div class="tot-row">
          <span class="tot-label">Subtotal</span>
          <span class="tot-val">${fmt(total)}</span>
        </div>
        <div class="tot-row">
          <span class="tot-label">Tax / VAT</span>
          <span class="tot-val">—</span>
        </div>
        <div class="tot-row tot-total">
          <span class="tot-label">Total ${isPaid ? 'Paid' : 'Due'}</span>
          <span class="tot-val">${fmt(total)}</span>
        </div>
      </div>
    </div>

    <!-- Payment reference -->
    ${record.payment_reference ? `
    <div class="pay-ref">
      <strong>Payment Reference:</strong> ${record.payment_reference}
      ${record.payment_method ? `&nbsp;·&nbsp;<strong>Method:</strong> ${record.payment_method}` : ''}
    </div>` : ''}

    <!-- Payment instructions -->
    ${activeMethods.length > 0 ? `
    <div class="section-label">Payment Instructions</div>
    <div class="pay-grid">
      ${activeMethods.map(m => `
      <div class="pay-card">
        <div class="pay-method-name">${m.method_name || m.method_type || ''}</div>
        ${m.account_name   ? `<div class="pay-detail">${m.account_name}</div>` : ''}
        ${m.account_number ? `<div class="pay-detail mono">${m.account_number}</div>` : ''}
        ${m.instructions   ? `<div style="font-size:11px;color:#94a3b8;margin-top:4px;line-height:1.5">${m.instructions}</div>` : ''}
      </div>`).join('')}
    </div>` : ''}

    <!-- Note -->
    <div class="note">
      <p>Thank you for choosing <strong>Brandfletch Ads</strong>. For any queries regarding this invoice, please reach us at <strong>hello@brandfletch.com</strong> or via WhatsApp.</p>
    </div>

  </div>

  <!-- ── FOOTER ─────────────────────────── -->
  <div class="ftr">
    <div class="fl">
      <div class="ftr-brand">Brandfletch <em>Ads</em></div>
      hello@brandfletch.com &nbsp;·&nbsp; brandfletch.com<br/>
      Blantyre, Malawi
    </div>
    <div class="fr">
      Invoice ${invNum}<br/>
      All amounts in ${currency === 'MWK' ? 'Malawian Kwacha (MWK)' : currency}<br/>
      Generated ${today}
    </div>
  </div>

</div>

<script>
  // Auto-trigger print dialog so user can Save as PDF
  window.onload = function() {
    setTimeout(function() { window.print(); }, 400);
  };
</script>
</body>
</html>`;
  }

  function handleDownload() {
    setDownloading(true);
    try {
      const html = buildHTML();
      // Open in a new tab and auto-trigger the browser's Save as PDF dialog
      const printWin = window.open('', '_blank', 'width=900,height=700');
      if (!printWin) {
        // Popup blocked — fall back to blob download
        const blob = new Blob([html], { type: 'text/html' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `Brandfletch-Invoice-${invNum}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }
      printWin.document.write(html);
      printWin.document.close();
      // window.print() is called inside the opened page via onload script above
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
