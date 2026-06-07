import { useRef } from 'react';
import { FileText, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import { format } from 'date-fns';

/**
 * InvoiceDownload
 * Renders a styled printable invoice. Works for both campaigns and design subscriptions.
 *
 * Props:
 *   type: 'campaign' | 'design'
 *   record: the Campaign or PlatformSubscription object
 *   user: the client User object
 *   invoiceNumber: optional string (auto-generated if omitted)
 */
export default function InvoiceDownload({ type, record, user, invoiceNumber }) {
  const [open, setOpen] = useState(false);
  const printRef = useRef(null);

  if (!record || !user) return null;

  const invNum = invoiceNumber || `BF-${Date.now().toString().slice(-8)}`;
  const today = format(new Date(), 'MMMM d, yyyy');
  const createdDate = record.created_date
    ? format(new Date(record.created_date), 'MMMM d, yyyy')
    : today;

  // Build line items
  const lineItems = type === 'campaign'
    ? [
        { desc: `Facebook Ad Campaign — ${record.page_name || record.campaign_name || 'Campaign'}`, qty: 1, unit: record.total_cost || 0 },
        { desc: `Package: ${record.package || '—'} | Duration: ${record.duration || '—'}`, qty: null, unit: null },
        { desc: `Goal: ${(record.goal || '').replace(/_/g, ' ')}`, qty: null, unit: null },
      ]
    : [
        { desc: `Design Retainer — ${(record.subscription_type || 'design_retainer').replace(/_/g, ' ')}`, qty: 1, unit: record.amount || 0 },
        { desc: `Quota: ${record.monthly_quota || '—'} designs/month | Revisions: ${record.max_revisions ?? 2}`, qty: null, unit: null },
      ];

  const total = type === 'campaign' ? (record.total_cost || 0) : (record.amount || 0);
  const currency = record.currency || 'USD';

  const formatMoney = (n) => {
    if (!n) return `${currency} 0.00`;
    if (currency === 'MWK') return `MK ${n.toLocaleString()}`;
    if (currency === 'KES') return `KSh ${n.toLocaleString()}`;
    if (currency === 'ZMW') return `ZK ${n.toLocaleString()}`;
    if (currency === 'ZAR') return `R ${n.toLocaleString()}`;
    if (currency === 'TZS') return `TSh ${n.toLocaleString()}`;
    if (currency === 'USD') return `$ ${n.toFixed(2)}`;
    return `${currency} ${n.toLocaleString()}`;
  };

  function handlePrint() {
    const printContent = printRef.current?.innerHTML;
    const win = window.open('', '_blank', 'width=800,height=900');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invNum} — Brandfletch Ads</title>
        <meta charset="utf-8" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #111; }
          .invoice { max-width: 750px; margin: 40px auto; padding: 40px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
          .brand { font-size: 22px; font-weight: 800; color: #2563eb; letter-spacing: -0.5px; }
          .brand span { color: #f97316; }
          .invoice-label { text-align: right; }
          .invoice-label h2 { font-size: 28px; font-weight: 700; color: #111; }
          .invoice-label p { color: #666; font-size: 13px; margin-top: 4px; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 36px; }
          .meta-box h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; color: #888; margin-bottom: 8px; }
          .meta-box p { font-size: 14px; color: #222; line-height: 1.6; }
          .divider { border: none; border-top: 2px solid #f1f5f9; margin: 24px 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; color: #888; padding: 10px 12px; background: #f8fafc; border-radius: 6px; }
          td { padding: 14px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .amount { text-align: right; font-weight: 600; }
          .totals { margin-left: auto; width: 280px; }
          .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
          .totals-row.total { font-size: 18px; font-weight: 700; padding-top: 12px; border-top: 2px solid #111; margin-top: 8px; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 600; }
          .status-paid { background: #dcfce7; color: #16a34a; }
          .status-pending { background: #fef3c7; color: #d97706; }
          .footer { margin-top: 48px; text-align: center; color: #aaa; font-size: 12px; }
          @media print { body { -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>${printContent}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  }

  const isPaid = ['active','approved','completed','confirmed'].includes(record.status);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <FileText className="w-4 h-4" />
        Invoice
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Invoice {invNum}</span>
              <Button size="sm" onClick={handlePrint} className="gap-2">
                <Printer className="w-4 h-4" /> Print / Download
              </Button>
            </DialogTitle>
          </DialogHeader>

          {/* Invoice preview — also used for printing */}
          <div ref={printRef} className="invoice">
            <div className="header">
              <div>
                <div className="brand">Brandfletch <span>Ads</span></div>
                <p style={{fontSize:'13px',color:'#666',marginTop:'6px'}}>
                  Professional Digital Marketing<br/>
                  support@brandfletchmedia.com
                </p>
              </div>
              <div className="invoice-label">
                <h2>INVOICE</h2>
                <p>#{invNum}</p>
                <p style={{marginTop:'8px'}}>Date: {today}</p>
              </div>
            </div>

            <div className="meta">
              <div className="meta-box">
                <h4>Billed To</h4>
                <p><strong>{user.full_name || user.email}</strong></p>
                {user.business_name && <p>{user.business_name}</p>}
                {user.email && <p>{user.email}</p>}
                {user.phone && <p>{user.phone}</p>}
                {user.country && <p>{user.country}</p>}
              </div>
              <div className="meta-box">
                <h4>Invoice Details</h4>
                <p>Invoice No: {invNum}</p>
                <p>Date Issued: {today}</p>
                <p>Order Date: {createdDate}</p>
                <p style={{marginTop:'8px'}}>
                  Status:{' '}
                  <span className={`status-badge ${isPaid ? 'status-paid' : 'status-pending'}`}>
                    {isPaid ? 'PAID' : 'PENDING PAYMENT'}
                  </span>
                </p>
              </div>
            </div>

            <hr className="divider" />

            <table>
              <thead>
                <tr>
                  <th style={{width:'70%'}}>Description</th>
                  <th style={{textAlign:'right'}}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, i) => (
                  <tr key={i}>
                    <td style={{color: item.qty ? '#111' : '#888', fontSize: item.qty ? '14px' : '12px'}}>
                      {item.desc}
                    </td>
                    <td className="amount">
                      {item.unit != null ? formatMoney(item.unit) : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="totals">
              <div className="totals-row">
                <span style={{color:'#666'}}>Subtotal</span>
                <span>{formatMoney(total)}</span>
              </div>
              <div className="totals-row">
                <span style={{color:'#666'}}>Tax (0%)</span>
                <span>{formatMoney(0)}</span>
              </div>
              <div className="totals-row total">
                <span>Total Due</span>
                <span>{formatMoney(total)}</span>
              </div>
            </div>

            <hr className="divider" style={{marginTop:'32px'}} />

            {record.payment_reference && (
              <p style={{fontSize:'13px',color:'#666',marginTop:'12px'}}>
                Payment Reference: <strong>{record.payment_reference}</strong>
              </p>
            )}
            {record.payment_method && (
              <p style={{fontSize:'13px',color:'#666',marginTop:'4px'}}>
                Payment Method: <strong>{record.payment_method}</strong>
              </p>
            )}

            <div className="footer">
              <p>Thank you for choosing Brandfletch Ads.</p>
              <p style={{marginTop:'4px'}}>Questions? Email us at support@brandfletchmedia.com</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
