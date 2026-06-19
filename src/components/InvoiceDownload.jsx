import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

/**
 * InvoiceDownload — generates a fully styled, print-ready HTML invoice
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
    ? [{ service: 'Meta / Facebook Ads Management', plan: record.package || '—', duration: record.duration || 'One-Time', amount: total }]
    : [{ service: 'Graphic Design Services', plan: (record.design_type || record.subscription_type || 'Design').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()), duration: record.request_type === 'retainer' ? 'Monthly Retainer' : 'Per Design', amount: total }];

  const activeMethods = paymentMethods.filter(m => m.is_active);

  function handleDownload() {
    setDownloading(true);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Invoice ${invNum} — Brandfletch Media</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Helvetica,Arial,sans-serif;background:#f1f5f9;-webkit-print-color-adjust:exact;print-color-adjust:exact;color:#1e293b}
  @page{size:A4;margin:0}
  @media print{body{background:#fff}.page{box-shadow:none;max-width:100%}}

  .page{max-width:820px;margin:32px auto;background:#fff;border-radius:12px;box-shadow:0 8px 40px rgba(0,0,0,.14);overflow:hidden}

  /* HEADER */
  .hdr{background:#0f1f3d;padding:36px 48px;display:flex;justify-content:space-between;align-items:flex-start;gap:24px}
  .logo-row{display:flex;align-items:center;gap:10px;margin-bottom:10px}
  .logo-img{width:42px;height:42px;border-radius:9px;background:#fff;padding:3px;object-fit:contain}
  .brand{font-size:19px;font-weight:800;color:#fff;letter-spacing:-.3px}
  .brand em{color:#60a5fa;font-style:normal}
  .tagline{font-size:10px;font-weight:500;color:#94a3b8;letter-spacing:.7px;text-transform:uppercase;margin-bottom:14px}
  .co-detail{font-size:12px;color:#94a3b8;line-height:1.9}
  .inv-right{text-align:right;flex-shrink:0}
  .inv-title{font-size:36px;font-weight:900;color:#fff;letter-spacing:-1.5px;margin-bottom:18px;line-height:1}
  .meta-row{display:flex;gap:12px;justify-content:flex-end;align-items:center;margin-bottom:6px}
  .ml{font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.6px;min-width:70px;text-align:right}
  .mv{font-size:12.5px;font-weight:600;color:#e2e8f0;min-width:110px;text-align:right}
  .badge{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.3px;margin-top:8px}
  .badge-paid{background:#dcfce7;color:#15803d}
  .badge-pending{background:#fef3c7;color:#b45309}
  .dot{width:5px;height:5px;border-radius:50%;background:currentColor;display:inline-block}

  /* BODY */
  .body{padding:36px 48px}
  .billed-row{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;padding-bottom:28px;border-bottom:2px solid #e2e8f0;margin-bottom:28px}
  .slabel{font-size:10px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
  .cn{font-size:17px;font-weight:700;color:#0f172a;margin-bottom:3px}
  .co{font-size:13px;font-weight:500;color:#475569;margin-bottom:2px}
  .ce{font-size:12.5px;color:#64748b}

  /* SUMMARY BOX */
  .summary-box{background:#0f1f3d;border-radius:10px;padding:18px 22px;min-width:180px;text-align:right}
  .sdl{font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.7px;margin-bottom:6px}
  .sda{font-size:26px;font-weight:900;color:#fff;letter-spacing:-1px;margin-bottom:6px}
  .sdd{font-size:11.5px;color:#94a3b8}

  /* TABLE */
  .table-title{font-size:11px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px}
  table{width:100%;border-collapse:collapse;margin-bottom:24px}
  thead tr{background:#0f2d5e}
  th{padding:11px 14px;font-size:11px;font-weight:700;color:#93c5fd;text-transform:uppercase;letter-spacing:.5px;text-align:left}
  th:last-child{text-align:right}
  tbody tr{border-bottom:1px solid #f1f5f9}
  tbody tr:hover{background:#f8fafc}
  td{padding:13px 14px;font-size:13.5px;color:#334155;vertical-align:top}
  td:last-child{text-align:right;font-weight:600;color:#0f172a}
  .svc{font-weight:600;color:#0f172a}
  .pill{background:#eff6ff;color:#1d4ed8;border-radius:20px;padding:3px 10px;font-size:11.5px;font-weight:600}
  .dur{background:#f0fdf4;color:#166534;border-radius:20px;padding:3px 10px;font-size:11.5px;font-weight:600}

  /* TOTALS */
  .totals-wrap{display:flex;justify-content:flex-end;margin-bottom:32px}
  .totals-box{min-width:280px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;overflow:hidden}
  .tr-row{display:flex;justify-content:space-between;align-items:center;padding:10px 18px;border-bottom:1px solid #f1f5f9;font-size:13.5px}
  .tr-row:last-child{border-bottom:none}
  .tl{color:#64748b}
  .tv{font-weight:600;color:#0f172a}
  .tdue{background:#0f2d5e;padding:14px 18px}
  .tdue .tl{color:#93c5fd;font-weight:700;font-size:13px}
  .tdue .tv{color:#fff;font-size:17px;font-weight:800}

  /* PAYMENT REF */
  .pay-ref{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:13px 16px;margin-bottom:24px;font-size:13px;color:#1e40af}

  /* PAYMENT INSTRUCTIONS */
  .pay-section{margin-bottom:28px}
  .pay-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-top:10px}
  .pi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px}
  .pl{font-size:12px;font-weight:700;color:#0f172a;margin-bottom:4px}
  .pv{font-size:12px;color:#475569}
  .mono{font-family:monospace;font-size:12px;color:#1e293b;font-weight:600;word-break:break-all}

  /* NOTES */
  .notes{background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:13px 16px;margin-bottom:28px}
  .notes p{font-size:12.5px;color:#78350f;line-height:1.6}

  /* FOOTER */
  .footer{background:#f1f5f9;border-top:2px solid #e2e8f0;padding:20px 48px;display:flex;justify-content:space-between;align-items:center}
  .fl{font-size:12px;color:#64748b;line-height:1.7}
  .fl strong{color:#0f172a}
  .fr{font-size:12px;color:#94a3b8;text-align:right;line-height:1.7}
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="hdr">
    <div>
      <div class="logo-row">
        <img class="logo-img" src="https://media.base44.com/images/public/6a1e8f4f079c524483e324a2/0072409c5_file_0000000024d0722fa20034e2dedcbc9e.png" alt="Brandfletch"/>
        <span class="brand">Brandfletch <em>Ads</em></span>
      </div>
      <div class="tagline">Advertising &amp; Creative Agency</div>
      <div class="co-detail">
        Blantyre, Malawi<br/>
        hello@brandfletch.com<br/>
        brandfletch.com
      </div>
    </div>
    <div class="inv-right">
      <div class="inv-title">INVOICE</div>
      <div class="meta-row"><span class="ml">Invoice #</span><span class="mv">${invNum}</span></div>
      <div class="meta-row"><span class="ml">Issued</span><span class="mv">${issuedOn}</span></div>
      <div class="meta-row"><span class="ml">Due</span><span class="mv">${dueOn}</span></div>
      <div>
        <span class="badge ${isPaid ? 'badge-paid' : 'badge-pending'}">
          <span class="dot"></span>
          ${isPaid ? 'PAID' : 'PAYMENT DUE'}
        </span>
      </div>
    </div>
  </div>

  <!-- BODY -->
  <div class="body">

    <!-- BILLED TO + SUMMARY -->
    <div class="billed-row">
      <div>
        <div class="slabel">Billed To</div>
        <div class="cn">${user.full_name || user.email}</div>
        ${user.business_name ? `<div class="co">${user.business_name}</div>` : ''}
        <div class="ce">${user.email || ''}</div>
        ${user.phone ? `<div class="ce">${user.phone}</div>` : ''}
        <div class="ce">${user.country || ''}</div>
      </div>
      <div class="summary-box">
        <div class="sdl">Total ${isPaid ? 'Paid' : 'Due'}</div>
        <div class="sda">${fmt(total)}</div>
        <div class="sdd">Invoice <strong style="color:#e2e8f0">${invNum}</strong></div>
      </div>
    </div>

    <!-- SERVICES TABLE -->
    <div class="table-title">Services</div>
    <table>
      <thead>
        <tr>
          <th>Service Description</th>
          <th>Plan / Type</th>
          <th>Duration</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${lineItems.map(item => `
        <tr>
          <td><span class="svc">${item.service}</span></td>
          <td><span class="pill">${item.plan}</span></td>
          <td><span class="dur">${item.duration}</span></td>
          <td>${fmt(item.amount)}</td>
        </tr>`).join('')}
      </tbody>
    </table>

    <!-- TOTALS -->
    <div class="totals-wrap">
      <div class="totals-box">
        <div class="tr-row"><span class="tl">Subtotal</span><span class="tv">${fmt(total)}</span></div>
        <div class="tr-row"><span class="tl">Tax / VAT</span><span class="tv">${fmt(0)}</span></div>
        <div class="tr-row tdue"><span class="tl">Total Due</span><span class="tv">${fmt(total)}</span></div>
      </div>
    </div>

    <!-- PAYMENT REFERENCE -->
    ${record.payment_reference ? `
    <div class="pay-ref">
      Payment Reference: <strong>${record.payment_reference}</strong>
      ${record.payment_method ? ` &nbsp;·&nbsp; Method: <strong>${record.payment_method}</strong>` : ''}
    </div>` : ''}

    <!-- PAYMENT INSTRUCTIONS -->
    ${activeMethods.length > 0 ? `
    <div class="pay-section">
      <div class="slabel">Payment Instructions</div>
      <div class="pay-grid">
        ${activeMethods.map(m => `
        <div class="pi">
          <div class="pl">${m.method_name || m.method_type}</div>
          ${m.account_name ? `<div class="pv">${m.account_name}</div>` : ''}
          ${m.account_number ? `<div class="pv mono">${m.account_number}</div>` : ''}
          ${m.instructions ? `<div style="font-size:11px;color:#94a3b8;margin-top:4px;line-height:1.5">${m.instructions}</div>` : ''}
        </div>`).join('')}
      </div>
    </div>` : ''}

    <!-- NOTES -->
    <div class="notes">
      <p>Thank you for choosing Brandfletch Media. For any queries regarding this invoice, please contact us at <strong>hello@brandfletch.com</strong>.</p>
    </div>

  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="fl">
      <strong>Brandfletch Media Ltd.</strong><br/>
      hello@brandfletch.com &nbsp;·&nbsp; brandfletch.com
    </div>
    <div class="fr">
      Invoice ${invNum}<br/>
      All amounts in ${currency === 'MWK' ? 'Malawian Kwacha (MWK)' : currency}
    </div>
  </div>

</div>
</body>
</html>`;

    try {
      const blob = new Blob([html], { type: 'text/html' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
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
      {downloading ? 'Generating…' : 'Invoice'}
    </Button>
  );
}
