import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Megaphone, Palette, Globe, Monitor,
  ChevronRight, ChevronLeft, MessageSquare,
  CheckCircle2, Loader2, FileText, Printer, ExternalLink,
  ArrowRight, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const SERVICES = [
  {
    id: 'meta_ads',
    icon: Megaphone,
    label: 'Meta Ads Management',
    description: 'Professionally managed Facebook & Instagram ad campaigns with targeting, creative review, and performance tracking.',
    color: 'bg-blue-50 text-blue-600',
    border: 'border-blue-200 hover:border-blue-400',
  },
  {
    id: 'graphic_design',
    icon: Palette,
    label: 'Graphic Design Retainer',
    description: 'Unlimited design requests under a monthly retainer. Social media graphics, posters, flyers, business cards, banners & more.',
    color: 'bg-purple-50 text-purple-600',
    border: 'border-purple-200 hover:border-purple-400',
  },
  {
    id: 'social_media',
    icon: Globe,
    label: 'Social Media Management',
    description: 'Content planning, creation, captions, page management, community engagement, monthly reporting & performance insights.',
    color: 'bg-green-50 text-green-600',
    border: 'border-green-200 hover:border-green-400',
  },
  {
    id: 'web_development',
    icon: Monitor,
    label: 'Web Development',
    description: 'Every website project is unique and requires a tailored quotation based on your specific requirements.',
    color: 'bg-orange-50 text-orange-600',
    border: 'border-orange-200 hover:border-orange-400',
    noQuote: true,
  },
];

function formatMoney(amount, currency) {
  if (!amount) return `${currency} 0`;
  if (currency === 'MWK') return `MK ${amount.toLocaleString()}`;
  if (currency === 'KES') return `KSh ${amount.toLocaleString()}`;
  if (currency === 'ZMW') return `ZK ${amount.toLocaleString()}`;
  if (currency === 'ZAR') return `R ${amount.toLocaleString()}`;
  if (currency === 'TZS') return `TSh ${amount.toLocaleString()}`;
  if (currency === 'USD') return `$${Number(amount).toFixed(2)}`;
  return `${currency} ${amount.toLocaleString()}`;
}

// Step indicator
function Steps({ current, total }) {
  return (
    <div className="flex items-center gap-1 mb-5">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={cn(
          "h-1.5 flex-1 rounded-full transition-all",
          i < current ? "bg-[hsl(var(--primary))]" : "bg-secondary"
        )} />
      ))}
    </div>
  );
}

export default function GetQuoteModal({ open, onClose }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [service, setService] = useState(null);
  const [businessForm, setBusinessForm] = useState({ business_name: '', business_activity: '', description: '' });
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [packages, setPackages] = useState([]);
  const [designPricing, setDesignPricing] = useState(null);
  const [socialPricing, setSocialPricing] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPayMethod, setSelectedPayMethod] = useState(null);
  const [proofRef, setProofRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [quoteRecord, setQuoteRecord] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState(() => `BF-Q-${Date.now().toString().slice(-8)}`);

  const country = user?.country || 'Malawi';

  useEffect(() => {
    if (!open) return;
    // Reset on open
    setStep(1); setService(null); setSelectedPackage(null);
    setSubmitted(false); setQuoteRecord(null); setProofRef(''); setProofFile(null);
    setInvoiceNumber(`BF-Q-${Date.now().toString().slice(-8)}`);
    setBusinessForm({ business_name: user?.business_name || '', business_activity: '', description: '' });
  }, [open, user]);

  useEffect(() => {
    if (!service || !user) return;
    // Load relevant pricing data for the selected service
    if (service === 'meta_ads') {
      base44.entities.PackagePricing.filter({ country }).then(data => setPackages(data)).catch(() => {});
    }
    if (service === 'graphic_design') {
      base44.entities.DesignPricing.filter({ country, is_active: true, pricing_type: 'retainer' })
        .then(data => setDesignPricing(data[0] || null)).catch(() => {});
    }
    if (service === 'social_media') {
      // Pull from Service entity (admin-configured)
      base44.entities.Service.filter({ category: 'social_media', is_active: true })
        .then(data => setSocialPricing(data[0] || null)).catch(() => {});
    }
    // Payment methods for user's country
    base44.entities.PaymentMethod.filter({ country, is_active: true }, 'sort_order')
      .then(data => { setPaymentMethods(data); if (data[0]) setSelectedPayMethod(data[0].id); })
      .catch(() => {});
  }, [service, country]);

  // Auto-select package when single-option services load
  useEffect(() => {
    if (service === 'graphic_design' && designPricing && !selectedPackage) {
      setSelectedPackage({ package: 'retainer', duration: 'monthly', amount: designPricing.price, currency: designPricing.currency || 'MWK' });
    }
  }, [designPricing, service]);

  useEffect(() => {
    if (service === 'social_media' && !selectedPackage) {
      const amount = socialPricing?.price_usd ? socialPricing.price_usd * 1700 : 150000;
      setSelectedPackage({ package: 'social_media', duration: 'monthly', amount, currency: 'MWK' });
    }
  }, [socialPricing, service]);

  function openWhatsApp() {
    const msg = encodeURIComponent("Hello Brandfletch Media. I would like a quotation for a website project.");
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  }

  function getAmount() {
    if (service === 'meta_ads' && selectedPackage) {
      const pkg = packages.find(p => p.package === selectedPackage?.package && p.country === country);
      if (pkg) return { amount: pkg[selectedPackage.duration] || pkg.weekly, currency: pkg.currency || 'MWK' };
    }
    if (service === 'graphic_design' && designPricing) {
      return { amount: designPricing.price, currency: designPricing.currency || 'MWK' };
    }
    if (service === 'social_media') {
      const curr = country === 'Malawi' ? 'MWK' : 'USD';
      const amt = socialPricing?.price_usd
        ? (curr === 'MWK' ? socialPricing.price_usd * 1700 : socialPricing.price_usd)
        : 150000;
      return { amount: amt, currency: curr };
    }
    return { amount: 0, currency: 'MWK' };
  }

  async function handleSubmit() {
    const { amount, currency } = getAmount();
    if (!amount || amount === 0) {
      toast.error('Could not determine quote amount. Please go back and select a package.');
      return;
    }
    if (!service) {
      toast.error('Please select a service.');
      return;
    }
    setSubmitting(true);
    try {
      const payMethod = paymentMethods.find(m => m.id === selectedPayMethod);
      const record = await base44.entities.QuoteRequest.create({
        user_id: user.id,
        user_name: user.full_name || user.email,
        user_email: user.email,
        business_name: businessForm.business_name,
        business_activity: businessForm.business_activity,
        description: businessForm.description,
        service_type: service,
        selected_package: selectedPackage?.package || '',
        selected_duration: selectedPackage?.duration || '',
        amount,
        currency,
        country,
        status: 'invoiced',
        invoice_number: invoiceNumber,
        payment_method: payMethod?.method_name || '',
        payment_reference: proofRef,
      });
      setQuoteRecord({ ...record, amount, currency, payMethod });
      setSubmitted(true);
      setStep(5);
    } catch (err) {
      console.error('Quote submit error:', err);
      toast.error(err?.message || 'Failed to submit quote. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handlePrint() {
    const { amount, currency } = getAmount();
    const svc = SERVICES.find(s => s.id === service);
    const payMethod = paymentMethods.find(m => m.id === selectedPayMethod);
    const today = format(new Date(), 'MMMM d, yyyy');
    const dueDate = format(new Date(Date.now() + 7 * 86400000), 'MMMM d, yyyy');

    const win = window.open('', '_blank', 'width=820,height=1000');
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Invoice ${invoiceNumber}</title>
      <meta charset="utf-8"/>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Segoe UI',Arial,sans-serif;color:#111;background:#fff}
        .page{max-width:760px;margin:40px auto;padding:40px}
        .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px;padding-bottom:24px;border-bottom:3px solid #2563eb}
        .brand h1{font-size:24px;font-weight:800;color:#2563eb;letter-spacing:-0.5px}
        .brand p{font-size:12px;color:#666;margin-top:4px;line-height:1.6}
        .inv-label{text-align:right}
        .inv-label h2{font-size:32px;font-weight:800;color:#111;letter-spacing:-1px}
        .inv-label p{font-size:12px;color:#666;margin-top:2px}
        .meta{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px}
        .meta-box h4{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:8px;font-weight:600}
        .meta-box p{font-size:13px;color:#222;line-height:1.7}
        table{width:100%;border-collapse:collapse;margin-bottom:24px}
        th{background:#f8fafc;font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:#888;padding:10px 14px;text-align:left;font-weight:600}
        td{padding:14px;border-bottom:1px solid #f1f5f9;font-size:13px}
        .amt{text-align:right;font-weight:700}
        .totals{margin-left:auto;width:260px}
        .trow{display:flex;justify-content:space-between;padding:7px 0;font-size:13px;border-bottom:1px solid #f1f5f9}
        .trow.total{font-size:18px;font-weight:800;border-top:2px solid #111;border-bottom:none;padding-top:12px;margin-top:4px}
        .status{display:inline-block;padding:3px 12px;border-radius:99px;font-size:11px;font-weight:700;background:#fef3c7;color:#d97706}
        .payment{margin-top:32px;padding:16px;background:#f8fafc;border-radius:8px}
        .payment h3{font-size:13px;font-weight:700;margin-bottom:10px}
        .payment p{font-size:12px;color:#555;line-height:1.7}
        .footer{margin-top:40px;text-align:center;color:#aaa;font-size:11px;padding-top:20px;border-top:1px solid #f1f5f9}
        @media print{body{-webkit-print-color-adjust:exact}}
      </style>
    </head><body>
    <div class="page">
      <div class="header">
        <div class="brand">
          <h1>Brandfletch Media</h1>
          <p>Professional Digital Marketing &amp; Technology Solutions<br/>
          📞 +265 888 000 000 &nbsp;|&nbsp; ✉ hello@brandfletchmedia.com<br/>
          🌐 www.brandfletchmedia.com</p>
        </div>
        <div class="inv-label">
          <h2>INVOICE</h2>
          <p>#${invoiceNumber}</p>
          <p style="margin-top:8px">Issued: ${today}</p>
          <p>Due: ${dueDate}</p>
        </div>
      </div>

      <div class="meta">
        <div class="meta-box">
          <h4>Billed To</h4>
          <p><strong>${user?.full_name || user?.email}</strong><br/>
          ${businessForm.business_name ? businessForm.business_name + '<br/>' : ''}
          ${user?.email}<br/>
          ${user?.phone || ''}<br/>
          ${country}</p>
        </div>
        <div class="meta-box">
          <h4>Invoice Details</h4>
          <p>Invoice No: <strong>${invoiceNumber}</strong><br/>
          Issue Date: ${today}<br/>
          Due Date: ${dueDate}<br/>
          Status: <span class="status">PENDING PAYMENT</span></p>
        </div>
      </div>

      <table>
        <thead><tr><th style="width:60%">Service Description</th><th>Duration</th><th class="amt">Amount</th></tr></thead>
        <tbody>
          <tr>
            <td>
              <strong>${svc?.label}</strong><br/>
              <span style="color:#666;font-size:12px">${businessForm.business_activity ? 'Industry: ' + businessForm.business_activity : ''}</span>
              ${selectedPackage ? '<br/><span style="color:#666;font-size:12px">Package: ' + selectedPackage.package + '</span>' : ''}
            </td>
            <td style="color:#666">${selectedPackage?.duration || 'Monthly'}</td>
            <td class="amt">${formatMoney(amount, currency)}</td>
          </tr>
        </tbody>
      </table>

      <div class="totals">
        <div class="trow"><span style="color:#666">Subtotal</span><span>${formatMoney(amount, currency)}</span></div>
        <div class="trow"><span style="color:#666">Tax (0%)</span><span>${formatMoney(0, currency)}</span></div>
        <div class="trow total"><span>Total Due</span><span>${formatMoney(amount, currency)}</span></div>
      </div>

      ${payMethod ? `<div class="payment">
        <h3>Payment Instructions</h3>
        <p><strong>Method:</strong> ${payMethod.method_name}<br/>
        ${payMethod.account_number ? '<strong>Account:</strong> ' + payMethod.account_number + '<br/>' : ''}
        ${payMethod.account_name ? '<strong>Name:</strong> ' + payMethod.account_name + '<br/>' : ''}
        ${payMethod.instructions ? payMethod.instructions : ''}</p>
      </div>` : ''}

      <div class="footer">
        <p>Thank you for choosing Brandfletch Media. We look forward to working with you.</p>
        <p style="margin-top:4px">Questions? Contact us at hello@brandfletchmedia.com</p>
      </div>
    </div>
    </body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); }, 400);
  }

  const totalSteps = service === 'web_development' ? 2 : 4;
  const svcObj = SERVICES.find(s => s.id === service);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {step === 1 && 'Get a Quote'}
            {step === 2 && 'Business Information'}
            {step === 3 && 'Select Package'}
            {step === 4 && 'Review & Pay'}
            {step === 5 && 'Your Invoice'}
          </DialogTitle>
          {step < 5 && <Steps current={step} total={totalSteps} />}
        </DialogHeader>

        {/* ── Step 1: Service Selection ── */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Select the service you need a quote for:</p>
            {SERVICES.map(svc => {
              const Icon = svc.icon;
              return (
                <button
                  key={svc.id}
                  onClick={() => { setService(svc.id); setStep(svc.noQuote ? 2 : 2); }}
                  className={cn(
                    "w-full text-left border-2 rounded-xl p-4 transition-all flex items-start gap-4",
                    service === svc.id ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5" : svc.border + " bg-white"
                  )}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${svc.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{svc.label}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{svc.description}</p>
                    {svc.noQuote && (
                      <Badge className="mt-2 bg-orange-100 text-orange-700 text-xs">Custom Quote via WhatsApp</Badge>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                </button>
              );
            })}
          </div>
        )}

        {/* ── Step 2: Web Dev → WhatsApp CTA ── */}
        {step === 2 && service === 'web_development' && (
          <div className="space-y-5 text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto">
              <Monitor className="w-8 h-8 text-orange-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Custom Quotation Required</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                Every website project is unique. Our team will assess your requirements and provide a tailored quotation within 24 hours.
              </p>
            </div>
            <Button
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white gap-3 w-full max-w-xs mx-auto"
              onClick={openWhatsApp}
            >
              <MessageSquare className="w-5 h-5" />
              Talk to Sales on WhatsApp
              <ExternalLink className="w-4 h-4" />
            </Button>
            <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to services
            </button>
          </div>
        )}

        {/* ── Step 2: Business Info (non-web-dev) ── */}
        {step === 2 && service !== 'web_development' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Tell us about your business so we can tailor this quote for you.</p>
            <div className="space-y-3">
              <div>
                <Label className="text-sm">Business Name</Label>
                <Input
                  value={businessForm.business_name}
                  onChange={e => setBusinessForm(f => ({ ...f, business_name: e.target.value }))}
                  placeholder="Your business name"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm">Business Activity / Industry</Label>
                <Input
                  value={businessForm.business_activity}
                  onChange={e => setBusinessForm(f => ({ ...f, business_activity: e.target.value }))}
                  placeholder="e.g. Restaurant, Retail, Real Estate, FMCG..."
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm">Project Description</Label>
                <Textarea
                  value={businessForm.description}
                  onChange={e => setBusinessForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Briefly describe your business and what you need help with."
                  className="mt-1.5"
                  rows={3}
                />
              </div>
              <div className="p-3 bg-secondary/60 rounded-lg text-xs text-muted-foreground">
                📍 Pricing will be shown in your currency for <strong>{country}</strong>. Country is set in your profile.
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-1.5"><ChevronLeft className="w-4 h-4" /> Back</Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!businessForm.business_name}
                className="flex-1 gap-1.5"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Package / Pricing Selection ── */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Meta Ads */}
            {service === 'meta_ads' && (
              <>
                <p className="text-sm text-muted-foreground">Select your preferred package and duration for {country}:</p>
                {packages.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 bg-secondary rounded-lg">Loading packages...</p>
                ) : (
                  <div className="space-y-3">
                    {packages.map(pkg => (
                      <div key={pkg.id} className="space-y-2">
                        <p className="text-sm font-semibold capitalize">{pkg.package} Package</p>
                        <div className="grid grid-cols-3 gap-2">
                          {['daily','weekly','monthly'].filter(d => pkg[d]).map(dur => (
                            <button
                              key={dur}
                              onClick={() => setSelectedPackage({ package: pkg.package, duration: dur, amount: pkg[dur], currency: pkg.currency })}
                              className={cn(
                                "border-2 rounded-lg p-3 text-center transition-all",
                                selectedPackage?.package === pkg.package && selectedPackage?.duration === dur
                                  ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5"
                                  : "border-border hover:border-[hsl(var(--primary))]/50"
                              )}
                            >
                              <p className="text-xs text-muted-foreground capitalize">{dur}</p>
                              <p className="text-sm font-bold mt-0.5">{formatMoney(pkg[dur], pkg.currency)}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Graphic Design */}
            {service === 'graphic_design' && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Our Graphic Design Retainer gives you unlimited design requests per month:</p>
                {designPricing ? (
                  <Card className="border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold">Monthly Retainer</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {designPricing.monthly_quota ? `Up to ${designPricing.monthly_quota} designs/month` : 'Unlimited designs'}
                            {designPricing.max_revisions ? ` • ${designPricing.max_revisions} revisions each` : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[hsl(var(--primary))]">{formatMoney(designPricing.price, designPricing.currency)}</p>
                          <p className="text-xs text-muted-foreground">per month</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {['Social media graphics','Posters','Flyers','Business cards','Marketing materials','Banner designs'].map(item => (
                          <span key={item} className="text-xs bg-white border border-border rounded-full px-2.5 py-0.5">{item}</span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground">Contact us for design retainer pricing in your country.</p>
                  </div>
                )}
{/* auto-selection handled via useEffect */}
              </div>
            )}

            {/* Social Media */}
            {service === 'social_media' && (
              <div className="space-y-3">
                <Card className="border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-bold">Social Media Management Retainer</p>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[hsl(var(--primary))]">
                          {socialPricing ? formatMoney(socialPricing.price_usd * 1700, 'MWK') : 'MK 150,000'}
                        </p>
                        <p className="text-xs text-muted-foreground">starting from / month</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {(socialPricing?.description ? socialPricing.description.split('\n') : [
                        'Content planning & strategy',
                        'Content creation & design',
                        'Caption writing',
                        'Page management',
                        'Community engagement',
                        'Monthly reporting',
                        'Performance insights',
                      ]).filter(Boolean).map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          {item.replace(/^[-•]\s*/, '')}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
{/* auto-selection handled via useEffect */}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-1.5"><ChevronLeft className="w-4 h-4" /> Back</Button>
              <Button
                onClick={() => setStep(4)}
                disabled={!selectedPackage}
                className="flex-1 gap-1.5"
              >
                Review Quote <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 4: Summary + Payment ── */}
        {step === 4 && (
          <div className="space-y-4">
            {/* Quote summary */}
            <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Quote Summary</p>
              {[
                { label: 'Service',        value: svcObj?.label },
                { label: 'Package',        value: selectedPackage?.package ? `${selectedPackage.package} (${selectedPackage.duration})` : null },
                { label: 'Business',       value: businessForm.business_name },
                { label: 'Industry',       value: businessForm.business_activity },
                { label: 'Country',        value: country },
              ].filter(r => r.value).map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-right">{value}</span>
                </div>
              ))}
              <div className="border-t border-border pt-3 flex justify-between items-center">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-[hsl(var(--primary))]">
                  {formatMoney(selectedPackage?.amount, selectedPackage?.currency || 'MWK')}
                </span>
              </div>
            </div>

            {/* Payment method */}
            {paymentMethods.length > 0 && (
              <div>
                <Label className="text-sm font-semibold">Payment Method</Label>
                <div className="space-y-2 mt-2">
                  {paymentMethods.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedPayMethod(m.id)}
                      className={cn(
                        "w-full text-left border-2 rounded-lg p-3 transition-all",
                        selectedPayMethod === m.id ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5" : "border-border hover:border-[hsl(var(--primary))]/40"
                      )}
                    >
                      <p className="text-sm font-medium">{m.method_name}</p>
                      {m.account_number && <p className="text-xs text-muted-foreground mt-0.5">Account: {m.account_number}</p>}
                      {m.account_name && <p className="text-xs text-muted-foreground">{m.account_name}</p>}
                      {m.instructions && <p className="text-xs text-muted-foreground mt-1">{m.instructions}</p>}
                    </button>
                  ))}
                </div>
                <div className="mt-3">
                  <Label className="text-sm">Payment Reference (optional)</Label>
                  <Input
                    value={proofRef}
                    onChange={e => setProofRef(e.target.value)}
                    placeholder="Transaction ID or reference number"
                    className="mt-1.5"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(3)} className="gap-1.5"><ChevronLeft className="w-4 h-4" /> Back</Button>
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1 gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {submitting ? 'Generating Invoice...' : 'Generate Invoice & Submit'}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 5: Invoice ── */}
        {step === 5 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-800 text-sm">Quote submitted successfully!</p>
                <p className="text-xs text-green-700 mt-0.5">Invoice #{invoiceNumber} has been generated. Our team will reach out shortly.</p>
              </div>
            </div>

            {/* Invoice preview */}
            <div className="border-2 border-border rounded-xl p-5 space-y-4 bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-bold text-[hsl(var(--primary))]">Brandfletch Media</p>
                  <p className="text-xs text-muted-foreground mt-1">Professional Digital Marketing & Technology Solutions</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">INVOICE</p>
                  <p className="text-xs text-muted-foreground">#{invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground mt-1">{format(new Date(), 'MMM d, yyyy')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Billed To</p>
                  <p className="text-sm font-medium">{user?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{businessForm.business_name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">{country}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Service</p>
                  <p className="text-sm font-medium">{svcObj?.label}</p>
                  {selectedPackage?.package && <p className="text-xs text-muted-foreground capitalize">{selectedPackage.package} • {selectedPackage.duration}</p>}
                  <p className="text-xs text-muted-foreground">{businessForm.business_activity}</p>
                </div>
              </div>

              <div className="border-t border-border pt-3 flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold text-[hsl(var(--primary))] mt-0.5">
                    {formatMoney(selectedPackage?.amount, selectedPackage?.currency || 'MWK')}
                  </p>
                </div>
                <Badge className="bg-amber-100 text-amber-700">Pending Payment</Badge>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handlePrint} variant="outline" className="flex-1 gap-2">
                <Printer className="w-4 h-4" /> Print / Download PDF
              </Button>
              <Button onClick={onClose} className="flex-1">Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
