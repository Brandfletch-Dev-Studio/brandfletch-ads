// Generic, config-driven customer ordering experience for the new
// department services (Studios: content creation/podcast/videography/
// photography, Dev Studio: websites/apps/automations/AI agents).
//
// UGC Ads keeps its own dedicated flow at /ugc-ads (multi-tier packages,
// live & untouched) — this powers everything else, priced via the
// admin-editable ServiceRate catalog instead of a hardcoded packages file.
// One component + a config object (see src/lib/departmentOrderConfigs.js)
// serves both departments — add a new department order flow by adding a
// config, not by writing a new page.

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowRight, ArrowLeft, CheckCircle2, Upload, Copy,
  ExternalLink, Loader2, Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import InvoiceDownload from '@/components/InvoiceDownload';

const STATUS_CONFIG = {
  pending_payment:      { label: 'Awaiting Payment',  color: 'bg-yellow-100 text-yellow-700' },
  awaiting_brief:       { label: 'Awaiting Quote/Start', color: 'bg-blue-100 text-blue-700' },
  in_production:        { label: 'In Production',      color: 'bg-purple-100 text-purple-700' },
  review:               { label: 'Under Review',       color: 'bg-indigo-100 text-indigo-700' },
  revision_requested:   { label: 'Revision Requested', color: 'bg-orange-100 text-orange-700' },
  completed:            { label: 'Completed',           color: 'bg-green-100 text-green-700' },
  cancelled:            { label: 'Cancelled',           color: 'bg-gray-100 text-gray-500' },
};

function formatMoney(amount, currency, symbol) {
  if (!amount) return 'Custom Quote';
  return `${symbol || currency || ''} ${Number(amount).toLocaleString()}`;
}

export default function DeptOrderPage({ config, routePath, icon: Icon, tagline }) {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [view, setView] = useState('list'); // list | new_order | detail
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const [step, setStep] = useState(1); // 1=service, 2=brief, 3=payment/quote
  const [selectedRate, setSelectedRate] = useState(null);
  const [country, setCountry] = useState('Malawi');

  const initialBrief = Object.fromEntries(config.briefFields.map(f => [f.key, '']));
  const [brief, setBrief] = useState(initialBrief);

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [payRef, setPayRef] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submittingPay, setSubmittingPay] = useState(false);
  const [paychanguLoading, setPaychanguLoading] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: rates = [] } = useQuery({
    queryKey: ['serviceRates', config.department],
    queryFn: () => base44.entities.ServiceRate.filter({ department: config.department, is_active: true }, { sort: 'sort_order' }),
  });
  const orderableRates = rates.filter(r => config.orderableServiceTypes.includes(r.service_key));

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['deptOrders', config.entityName, user?.id],
    queryFn: async () => {
      const all = await base44.entities[config.entityName].filter({ user_id: user?.id }, { sort: '-created_date' });
      return all.filter(o => config.orderableServiceTypes.includes(o.service_type));
    },
    enabled: !!user?.id,
  });

  // Payment callback on return from Paychangu
  useEffect(() => {
    const txRef = searchParams.get('paychangu_tx');
    const orderId = searchParams.get('order_id');
    if (txRef && orderId) {
      setVerifying(true);
      base44.functions.invoke('verifyPaychanguPayment', {
        tx_ref: txRef,
        order_id: orderId,
        payment_type: config.paymentType,
      }).then(res => {
        if (res?.verified) {
          toast.success('Payment confirmed! Our team will get started shortly.');
          queryClient.invalidateQueries({ queryKey: ['deptOrders', config.entityName] });
        } else {
          toast.error('Payment could not be verified — please contact support.');
        }
        window.history.replaceState({}, '', routePath);
      }).finally(() => setVerifying(false));
    }
    if (user?.country) setCountry(user.country);
  }, [user?.id]);

  // Manual payment methods — offered alongside Paychangu, for every country.
  useEffect(() => {
    if (step === 3 && country) {
      base44.entities.PaymentMethod.filter({ country, is_active: true }, { sort: 'sort_order' })
        .then(methods => {
          if (methods.length) { setPaymentMethods(methods); return; }
          return base44.entities.PaymentMethod.filter({ is_active: true }, { sort: 'sort_order' }).then(setPaymentMethods);
        })
        .catch(() => setPaymentMethods([]));
    }
  }, [step, country]);

  const isCustomQuote = selectedRate?.billing_type === 'custom_quote';
  const isMalawi = country === 'Malawi';

  const createOrder = useMutation({
    mutationFn: async () => {
      const seq = Date.now().toString().slice(-5);
      const payload = {
        order_ref:  `BF-${config.txRefPrefix}-${seq}`,
        user_id:    user?.id || null,
        user_name:  user?.full_name || user?.email || 'Guest',
        user_email: user?.email || null,
        service_type: selectedRate.service_key,
        package:    selectedRate.plan_name || selectedRate.service_name,
        amount:     isCustomQuote ? null : selectedRate.price,
        currency:   isCustomQuote ? null : selectedRate.currency,
        status:     isCustomQuote ? 'awaiting_brief' : 'pending_payment',
        payment_status: 'unpaid',
        brief_submitted_at: new Date().toISOString(),
        ...brief,
      };
      return base44.entities[config.entityName].create(payload);
    },
    onSuccess: (order) => {
      setCreatedOrder(order);
      if (isCustomQuote) {
        setQuoteSubmitted(true);
      } else {
        setStep(3);
      }
      queryClient.invalidateQueries({ queryKey: ['deptOrders', config.entityName] });
    },
    onError: () => toast.error('Could not submit — please try again.'),
  });

  async function handlePaychangu() {
    if (!createdOrder) return;
    setPaychanguLoading(true);
    const txRef = `BF-${config.txRefPrefix}-${createdOrder.id}-${Date.now()}`;
    const appUrl = window.location.origin;
    try {
      const res = await base44.functions.invoke('paychanguCheckout', {
        amount: createdOrder.amount,
        currency: createdOrder.currency,
        tx_ref: txRef,
        description: `${config.title} Order - ${createdOrder.package || ''}`,
        callback_url: `${appUrl}${routePath}?paychangu_tx=${txRef}&order_id=${createdOrder.id}`,
        return_url: `${appUrl}${routePath}`,
      });
      if (res?.checkout_url) {
        await base44.entities[config.entityName].update(createdOrder.id, { paychangu_tx_ref: txRef });
        window.location.href = res.checkout_url;
      } else {
        toast.error('Could not start payment — please try manual payment.');
      }
    } catch (e) {
      toast.error('Payment gateway error — please try again.');
    } finally {
      setPaychanguLoading(false);
    }
  }

  async function handleManualPayment() {
    if (!createdOrder || !selectedMethod) { toast.error('Select a payment method.'); return; }
    if (!payRef.trim()) { toast.error('Enter your payment reference.'); return; }
    setSubmittingPay(true);
    try {
      let proofUrl = null;
      if (proofFile) {
        setUploading(true);
        const { file_url } = await base44.integrations.Core.UploadFile({ file: proofFile });
        proofUrl = file_url;
        setUploading(false);
      }
      await base44.entities[config.entityName].update(createdOrder.id, {
        payment_method: selectedMethod.method_name,
        payment_reference: payRef.trim(),
        payment_proof_url: proofUrl,
        payment_status: 'pending_verification',
      });
      toast.success('Payment proof submitted! We\'ll verify and get started shortly.');
      queryClient.invalidateQueries({ queryKey: ['deptOrders', config.entityName] });
      setView('list');
      resetWizard();
    } catch (e) {
      toast.error('Submission failed — ' + (e.message || 'please try again'));
    } finally {
      setSubmittingPay(false);
    }
  }

  function resetWizard() {
    setStep(1); setSelectedRate(null); setCreatedOrder(null);
    setPayRef(''); setProofFile(null); setSelectedMethod(null);
    setQuoteSubmitted(false);
    setBrief(initialBrief);
  }

  function briefValid() {
    return config.briefFields.every(f => !f.required || brief[f.key]?.trim());
  }

  if (verifying) return (
    <div className="flex flex-col items-center justify-center min-h-64 gap-4 text-muted-foreground">
      <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--accent))]" />
      <p className="text-sm font-medium">Verifying your payment…</p>
    </div>
  );

  // ── Order detail ──
  if (view === 'detail' && selectedOrder) {
    const cfg = STATUS_CONFIG[selectedOrder.status] || {};
    const rateLabel = config.serviceTypeOptions.find(s => s.value === selectedOrder.service_type)?.label;
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <button onClick={() => setView('list')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to orders
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-foreground">{selectedOrder.order_ref}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{rateLabel} · {selectedOrder.package}</p>
          </div>
          <Badge className={cn('text-xs font-semibold px-3 py-1', cfg.color)}>{cfg.label}</Badge>
        </div>

        {selectedOrder.status === 'pending_payment' && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-5 text-center space-y-3">
              <p className="text-sm font-medium text-yellow-800">Complete your payment to get started</p>
              <Button onClick={() => { setCreatedOrder(selectedOrder); setStep(3); setView('new_order'); }}
                className="bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent))]/90">
                Pay Now <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </CardContent>
          </Card>
        )}

        {selectedOrder.deliverables_url && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-800 text-sm">Your deliverables are ready!</p>
                <p className="text-xs text-green-700 mt-0.5">Click to download</p>
              </div>
              <a href={selectedOrder.deliverables_url} target="_blank" rel="noreferrer">
                <Button size="sm" className="bg-green-600 text-white hover:bg-green-700 gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" /> Download
                </Button>
              </a>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Brief Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {config.briefFields.map(f => selectedOrder[f.key] ? (
              <div key={f.key} className="flex gap-3">
                <span className="text-muted-foreground font-medium w-40 flex-shrink-0">{f.label}</span>
                <span className="text-foreground whitespace-pre-line">{selectedOrder[f.key]}</span>
              </div>
            ) : null)}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── New order wizard ──
  if (view === 'new_order') {
    if (quoteSubmitted) {
      return (
        <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
          <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Request received!</h1>
          <p className="text-sm text-muted-foreground">
            Our {config.title} team will review your brief and follow up with a custom quote shortly.
          </p>
          <Button onClick={() => { setView('list'); resetWizard(); }} className="bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent))]/90">
            Back to my orders
          </Button>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => { if (step === 1) { setView('list'); resetWizard(); } else setStep(s => s - 1); }}
            className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">New {config.title} Order</h1>
            <p className="text-xs text-muted-foreground">Step {step} of {isCustomQuote ? 2 : 3}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {(isCustomQuote ? ['Service', 'Brief'] : ['Service', 'Brief', 'Payment']).map((s, i) => (
            <div key={s} className={cn('flex-1 h-1.5 rounded-full transition-all', i < step ? 'bg-[hsl(var(--accent))]' : 'bg-border')} />
          ))}
        </div>

        {/* Step 1: Service */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-foreground mb-1">Choose a service</h2>
              <p className="text-sm text-muted-foreground">Prices shown for {country}.</p>
            </div>
            {orderableRates.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-6 pb-6 text-center space-y-2">
                  <p className="text-sm font-medium text-foreground">Coming soon!</p>
                  <p className="text-sm text-muted-foreground">
                    These services aren't open for booking yet. Reach out and we'll set you up directly.
                  </p>
                  <a href="mailto:support@brandfletch.com" className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--accent))] hover:underline">
                    <Mail className="w-3.5 h-3.5" /> support@brandfletch.com
                  </a>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {orderableRates.map(rate => {
                  const label = config.serviceTypeOptions.find(s => s.value === rate.service_key)?.label || rate.service_name;
                  const selected = selectedRate?.id === rate.id;
                  return (
                    <div key={rate.id} onClick={() => setSelectedRate(rate)}
                      className={cn('border rounded-xl p-4 cursor-pointer transition-all',
                        selected ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/5' : 'border-border hover:border-[hsl(var(--accent))]/30'
                      )}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">{label}</p>
                          {rate.plan_name && <p className="text-xs text-muted-foreground">{rate.plan_name}</p>}
                        </div>
                        <span className="font-bold text-[hsl(var(--accent))]">{formatMoney(rate.price, rate.currency, rate.symbol)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <Button onClick={() => setStep(2)} disabled={!selectedRate}
              className="w-full h-11 font-semibold bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent))]/90">
              Continue to Brief <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        )}

        {/* Step 2: Brief */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-foreground mb-1">Tell us about the project</h2>
              <p className="text-sm text-muted-foreground">The more detail, the better we can deliver.</p>
            </div>
            <Card>
              <CardContent className="pt-5 space-y-4">
                {config.briefFields.map(f => (
                  <div key={f.key}>
                    <Label className="text-xs mb-1 block">{f.label}{f.required ? ' *' : ''}</Label>
                    {f.type === 'textarea' ? (
                      <Textarea value={brief[f.key]} onChange={e => setBrief(b => ({ ...b, [f.key]: e.target.value }))}
                        placeholder={f.placeholder} className="text-sm min-h-24 resize-none" />
                    ) : (
                      <Input value={brief[f.key]} onChange={e => setBrief(b => ({ ...b, [f.key]: e.target.value }))}
                        placeholder={f.placeholder} className="h-9 text-sm" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
            <Button
              onClick={() => { if (!briefValid()) { toast.error('Please fill in all required fields.'); return; } createOrder.mutate(); }}
              disabled={createOrder.isPending}
              className="w-full h-11 font-semibold bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent))]/90"
            >
              {createOrder.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
                : isCustomQuote
                  ? <>Request Quote <ArrowRight className="w-4 h-4 ml-1.5" /></>
                  : <>Continue to Payment <ArrowRight className="w-4 h-4 ml-1.5" /></>
              }
            </Button>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && createdOrder && !isCustomQuote && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-foreground mb-1">Payment</h2>
              <p className="text-sm text-muted-foreground">Complete payment to get started.</p>
            </div>

            <Card className="border-[hsl(var(--accent))]/20 bg-[hsl(var(--accent))]/5">
              <CardContent className="pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-semibold">{createdOrder.package}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-[hsl(var(--accent))]/10 pt-2">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-extrabold text-lg text-[hsl(var(--accent))]">
                    {createdOrder.currency} {Number(createdOrder.amount).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {user && (
              <InvoiceDownload
                type={config.department}
                reference={createdOrder.order_ref}
                amount={createdOrder.amount}
                currency={createdOrder.currency}
                description={`${config.title} - ${createdOrder.package}`}
                clientName={user.full_name || user.email}
                clientEmail={user.email}
              />
            )}

            {isMalawi && (
              <Card>
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-[hsl(var(--accent))]/10 flex items-center justify-center">
                      <ExternalLink className="w-4 h-4 text-[hsl(var(--accent))]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Pay with Paychangu</p>
                      <p className="text-xs text-muted-foreground">Mobile money, bank transfer & cards</p>
                    </div>
                  </div>
                  <Button onClick={handlePaychangu} disabled={paychanguLoading}
                    className="w-full h-10 font-semibold bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent))]/90">
                    {paychanguLoading
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Opening payment…</>
                      : <>Pay {createdOrder.currency} {Number(createdOrder.amount).toLocaleString()} <ExternalLink className="w-4 h-4 ml-1.5" /></>
                    }
                  </Button>
                </CardContent>
              </Card>
            )}

            {paymentMethods.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Select Payment Method</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-2">
                    {paymentMethods.map(m => (
                      <div key={m.id} onClick={() => setSelectedMethod(m)}
                        className={cn('border rounded-xl p-3 cursor-pointer transition-all',
                          selectedMethod?.id === m.id ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/5' : 'border-border hover:border-[hsl(var(--accent))]/30'
                        )}>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{m.method_name}</p>
                          <Badge variant="outline" className="text-[10px]">{m.method_type?.replace('_', ' ')}</Badge>
                        </div>
                        {selectedMethod?.id === m.id && m.instructions && (
                          <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground whitespace-pre-line">{m.instructions}</div>
                        )}
                        {selectedMethod?.id === m.id && m.account_number && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Account:</span>
                            <span className="text-xs font-mono font-semibold">{m.account_number}</span>
                            <button onClick={() => { navigator.clipboard.writeText(m.account_number); toast.success('Copied!'); }}
                              className="text-muted-foreground hover:text-foreground"><Copy className="w-3 h-3" /></button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {selectedMethod && (
                    <div className="space-y-3 pt-2">
                      <div>
                        <Label className="text-xs mb-1 block">Payment Reference / Transaction ID *</Label>
                        <Input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="e.g. TXN12345678" className="h-9 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Upload Payment Proof (optional)</Label>
                        <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:bg-muted text-xs text-muted-foreground transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          {proofFile ? proofFile.name : 'Choose file'}
                          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => setProofFile(e.target.files[0])} />
                        </label>
                      </div>
                      <Button onClick={handleManualPayment} disabled={submittingPay || uploading}
                        className="w-full h-10 font-semibold bg-[hsl(var(--primary))] text-primary-foreground">
                        {submittingPay ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting…</> : 'Submit Payment Proof'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Order list (default) ──
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            {Icon && <Icon className="w-6 h-6 text-[hsl(var(--accent))]" />} {config.title}
          </h1>
          {tagline && <p className="text-sm text-muted-foreground mt-1">{tagline}</p>}
        </div>
        <Button onClick={() => setView('new_order')}
          className="bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent))]/90 font-semibold gap-2">
          New Order <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {loadingOrders ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : orders.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-2">
            <p className="text-sm text-muted-foreground">No orders yet.</p>
            <Button variant="outline" onClick={() => setView('new_order')}>Start your first order</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {orders.map(order => {
            const cfg = STATUS_CONFIG[order.status] || {};
            const label = config.serviceTypeOptions.find(s => s.value === order.service_type)?.label;
            return (
              <div key={order.id} onClick={() => { setSelectedOrder(order); setView('detail'); }}
                className="border border-border rounded-xl p-4 cursor-pointer hover:border-[hsl(var(--accent))]/30 transition-all flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-sm">{order.order_ref}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label} · {order.package}</p>
                </div>
                <Badge className={cn('text-xs font-semibold px-3 py-1 flex-shrink-0', cfg.color)}>{cfg.label}</Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
