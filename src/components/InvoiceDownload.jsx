import { useRef, useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';

/**
 * InvoiceDownload
 * Props:
 *   type: 'campaign' | 'design'
 *   record: Campaign or PlatformSubscription object
 *   user: client User object
 *   invoiceNumber: optional string
 *   paymentMethods: optional array of PaymentMethod records
 */
export default function InvoiceDownload({ type, record, user, invoiceNumber, paymentMethods = [] }) {
  const [open, setOpen] = useState(false);
  const printRef = useRef(null);

  if (!record || !user) return null;

  const invNum = invoiceNumber || `BF-${Date.now().toString().slice(-8)}`;
  const today = format(new Date(), 'MMMM d, yyyy');
  const createdDate = record.created_date
    ? format(new Date(record.created_date), 'MMMM d, yyyy')
    : today;

  const total = type === 'campaign' ? (record.total_cost || 0) : (record.amount || 0);
  const currency = record.currency || 'USD';
  const isPaid = ['active', 'approved', 'completed', 'confirmed'].includes(record.status);

  const formatMoney = (n) => {
    if (!n && n !== 0) return `${currency} 0`;
    if (currency === 'MWK') return `MK ${Number(n).toLocaleString()}`;
    if (currency === 'KES') return `KSh ${Number(n).toLocaleString()}`;
    if (currency === 'ZMW') return `ZK ${Number(n).toLocaleString()}`;
    if (currency === 'ZAR') return `R ${Number(n).toLocaleString()}`;
    if (currency === 'TZS') return `TSh ${Number(n).toLocaleString()}`;
    if (currency === 'USD') return `$${Number(n).toFixed(2)}`;
    return `${currency} ${Number(n).toLocaleString()}`;
  };

  // Build line items based on type
  const lineItems = type === 'campaign'
    ? [{
        service: 'Meta Ads Management',
        plan: record.package || '—',
        duration: record.duration ? `${record.duration}` : 'One-Time',
        amount: total,
      }]
    : [{
        service: 'Graphic Design Retainer',
        plan: (record.subscription_type || 'design_retainer').replace(/_/g, ' '),
        duration: 'Monthly',
        amount: total,
      }];

  // Payment method details — use passed methods or fallback
  const userCountryMethods = paymentMethods.filter(m => m.is_active);

  function handleDownload() {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Invoice ${invNum} — Brandfletch Media</title>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;background:#f1f5f9;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .page{max-width:800px;margin:0 auto;background:#fff;box-shadow:0 4px 32px rgba(0,0,0,.12)}
    /* HEADER */
    .header{background:#0f1f3d;padding:36px 48px;display:flex;justify-content:space-between;align-items:flex-start;gap:24px}
    .logo-row{display:flex;align-items:center;gap:10px;margin-bottom:12px}
    .logo-img{width:40px;height:40px;border-radius:8px;background:white;padding:3px;object-fit:contain}
    .brand{font-size:18px;font-weight:800;color:#fff;letter-spacing:-.3px}
    .brand-accent{color:#60a5fa}
    .tagline{font-size:10px;font-weight:500;color:#94a3b8;letter-spacing:.6px;text-transform:uppercase;margin-bottom:14px}
    .co-detail{font-size:12px;color:#94a3b8;line-height:1.8}
    .inv-right{text-align:right;flex-shrink:0}
    .inv-title{font-size:34px;font-weight:800;color:#fff;letter-spacing:-1px;margin-bottom:18px}
    .meta-row{display:flex;gap:12px;justify-content:flex-end;align-items:center;margin-bottom:5px}
    .ml{font-size:10.5px;font-weight:500;color:#64748b;text-transform:uppercase;letter-spacing:.5px;min-width:76px;text-align:right}
    .mv{font-size:12.5px;font-weight:600;color:#e2e8f0;min-width:108px;text-align:right}
    .badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.3px}
    .badge-paid{background:#dcfce7;color:#15803d}
    .badge-unpaid{background:#fef3c7;color:#b45309}
    .dot{width:5px;height:5px;border-radius:50%;background:currentColor;display:inline-block}
    /* BODY */
    .body{padding:36px 48px}
    .billed-row{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;padding-bottom:28px;border-bottom:1px solid #e2e8f0;margin-bottom:28px}
    .slabel{font-size:10px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
    .cn{font-size:17px;font-weight:700;color:#0f172a;margin-bottom:3px}
    .co{font-size:13px;font-weight:500;color:#64748b;margin-bottom:2px}
    .ce{font-size:12.5px;color:#64748b;margin-bottom:2px}
    .cc{font-size:12.5px;color:#64748b}
    .summary-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px 22px;min-width:200px;text-align:right}
    .sdl{font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.6px;margin-bottom:5px}
    .sda{font-size:26px;font-weight:800;color:#2563eb;letter-spacing:-1px;line-height:1;margin-bottom:10px}
    .sdd{font-size:11.5px;color:#64748b}
    .sdd strong{color:#0f172a;font-weight:600}
    /* TABLE */
    .table-title{font-size:10px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}
    table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px}
    thead tr{background:#0f1f3d}
    thead th{padding:11px 14px;text-align:left;font-size:10.5px;font-weight:600;color:white;text-transform:uppercase;letter-spacing:.6px}
    thead th:last-child{text-align:right}
    tbody tr{border-bottom:1px solid #e2e8f0}
    tbody tr:last-child{border-bottom:none}
    tbody tr:nth-child(even){background:#f8fafc}
    tbody td{padding:13px 14px;vertical-align:middle}
    tbody td:last-child{text-align:right;font-weight:600}
    .svc{font-weight:600;color:#0f172a}
    .pill{display:inline-block;background:#eff6ff;color:#2563eb;font-size:10.5px;font-weight:600;padding:2px 8px;border-radius:20px}
    .dur{font-size:11.5px;color:#64748b;font-weight:500}
    /* TOTALS */
    .totals-wrap{display:flex;justify-content:flex-end;margin-bottom:32px}
    .totals-box{min-width:268px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden}
    .tr{display:flex;justify-content:space-between;padding:11px 18px;font-size:13px;border-bottom:1px solid #e2e8f0}
    .tr:last-child{border-bottom:none}
    .tl{color:#64748b;font-weight:500}
    .tv{font-weight:600}
    .tr.tdue{background:#0f1f3d}
    .tr.tdue .tl{color:#94a3b8;font-size:12.5px;font-weight:600}
    .tr.tdue .tv{color:white;font-weight:800;font-size:17px}
    /* PAYMENT */
    .pay-section{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:22px 26px;margin-bottom:32px}
    .pay-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px 28px;margin-top:14px}
    .pi .pl{font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.6px;margin-bottom:3px}
    .pi .pv{font-size:13.5px;font-weight:600;color:#0f172a}
    .pi .pv.mono{font-family:'Courier New',monospace;font-size:14px;color:#2563eb;letter-spacing:1px}
    /* FOOTER */
    .footer{border-top:1px solid #e2e8f0;padding:18px 48px;display:flex;justify-content:space-between;align-items:center;gap:16px}
    .fl{font-size:11px;color:#64748b;line-height:1.6}
    .fl strong{color:#0f172a}
    .fr{font-size:11px;color:#94a3b8;text-align:right;line-height:1.6}
    @media print{body{background:white}.page{box-shadow:none}}
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="logo-row">
        <img class="logo-img" src="https://media.base44.com/images/public/6a1df082a0de66cf554f8fdd/eeb543716_file_0000000024d0722fa20034e2dedcbc9e.png" alt="Brandfletch"/>
        <div><span class="brand">Brandfletch<span class="brand-accent"> Ads</span></span></div>
      </div>
      <div class="tagline">Shooting Your Brand to Success</div>
      <div class="co-detail">
        <div>Brandfletch Media Ltd.</div>
        <div>Lilongwe, Malawi</div>
        <div>hello@brandfletch.com</div>
        <div>brandfletch.com</div>
      </div>
    </div>
    <div class="inv-right">
      <div class="inv-title">INVOICE</div>
      <div class="meta-row"><span class="ml">Invoice #</span><span class="mv">${invNum}</span></div>
      <div class="meta-row"><span class="ml">Date</span><span class="mv">${today}</span></div>
      <div class="meta-row"><span class="ml">Order Date</span><span class="mv">${createdDate}</span></div>
      <div class="meta-row"><span class="ml">Status</span><span class="mv">
        <span class="badge ${isPaid ? 'badge-paid' : 'badge-unpaid'}"><span class="dot"></span> ${isPaid ? 'Paid' : 'Unpaid'}</span>
      </span></div>
    </div>
  </div>

  <div class="body">
    <div class="billed-row">
      <div>
        <div class="slabel">Billed To</div>
        <div class="cn">${user.full_name || user.email}</div>
        ${user.business_name ? `<div class="co">${user.business_name}</div>` : ''}
        <div class="ce">${user.email || ''}</div>
        ${user.phone ? `<div class="cc">${user.phone}</div>` : ''}
        <div class="cc">${user.country || ''}</div>
      </div>
      <div class="summary-box">
        <div class="sdl">Total Due</div>
        <div class="sda">${formatMoney(total)}</div>
        <div class="sdd">Invoice <strong>${invNum}</strong></div>
      </div>
    </div>

    <div class="table-title">Services</div>
    <table>
      <thead>
        <tr>
          <th>Service Description</th>
          <th>Plan</th>
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
          <td>${formatMoney(item.amount)}</td>
        </tr>`).join('')}
      </tbody>
    </table>

    <div class="totals-wrap">
      <div class="totals-box">
        <div class="tr"><span class="tl">Subtotal</span><span class="tv">${formatMoney(total)}</span></div>
        <div class="tr"><span class="tl">Tax (0%)</span><span class="tv">${formatMoney(0)}</span></div>
        <div class="tr tdue"><span class="tl">Total Due</span><span class="tv">${formatMoney(total)}</span></div>
      </div>
    </div>

    ${record.payment_reference ? `
    <div style="margin-bottom:24px;padding:14px 18px;background:#eff6ff;border-radius:8px;font-size:13px;color:#1e40af">
      Payment Reference: <strong>${record.payment_reference}</strong>
      ${record.payment_method ? ` &nbsp;·&nbsp; Method: <strong>${record.payment_method}</strong>` : ''}
    </div>` : ''}

    ${userCountryMethods.length > 0 ? `
    <div class="pay-section">
      <div class="slabel">Payment Instructions</div>
      <div class="pay-grid">
        ${userCountryMethods.map(m => `
        <div class="pi">
          <div class="pl">${m.method_name}</div>
          <div class="pv">${m.method_type === 'bank' ? m.account_name || '' : ''}</div>
          ${m.account_number ? `<div class="pv mono">${m.account_number}</div>` : ''}
          ${m.instructions ? `<div style="font-size:11px;color:#64748b;margin-top:3px">${m.instructions}</div>` : ''}
        </div>`).join('')}
      </div>
    </div>` : ''}
  </div>

  <div class="footer">
    <div class="fl"><strong>Brandfletch Media Ltd.</strong><br/>hello@brandfletch.com · brandfletch.com</div>
    <div class="fr">Invoice ${invNum}<br/>All amounts in ${currency === 'MWK' ? 'Malawian Kwacha (MWK)' : currency}</div>
  </div>
</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Brandfletch-Invoice-${invNum}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={handleDownload}
      >
        <Download className="w-4 h-4" />
        Invoice
      </Button>
    </>
  );
}
