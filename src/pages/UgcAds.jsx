// src/pages/UgcAds.jsx
// Client-side UGC Ads ordering — wizard + brief + payment + order tracking

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44, supabase } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Video, ArrowRight, ArrowLeft, CheckCircle2, Upload, Copy,
  ExternalLink, Loader2, Clock, FileText, Star, Package,
  Play, Users, Target, Megaphone, ChevronRight, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LOCAL_PRICES, COUNTRY_CURRENCY } from '@/lib/pricing';
import InvoiceDownload from '@/components/InvoiceDownload';

// ── UGC Pricing ──────────────────────────────────────────────────────────────
const UGC_PACKAGES = {
  starter: {
    name: 'Starter',
    videos: 1,
    badge: null,
    features: [
      '1 UGC ad creative',
      'Creator matching',
      'Brand story development',
      'Offer packaging session',
      'Meta Ads-ready format',
      'Creator social media feature',
    ],
    prices: {
      Malawi:        { amount: 100000,  currency: 'MWK', symbol: 'MK' },
      Zambia:        { amount: 3500,    currency: 'ZMW', symbol: 'ZK' },
      'South Africa':{ amount: 1800,    currency: 'ZAR', symbol: 'R'  },
      Kenya:         { amount: 14000,   currency: 'KES', symbol: 'KSh'},
      Tanzania:      { amount: 230000,  currency: 'TZS', symbol: 'TSh'},
      default:       { amount: 60,      currency: 'USD', symbol: '$'  },
    },
  },
  growth: {
    name: 'Growth',
    videos: 3,
    badge: 'Best Value',
    features: [
      '3 UGC ad creatives',
      'Multiple message angles',
      'Creator matching',
      'Full brand story development',
      'Offer packaging session',
      'Meta Ads-ready formats',
      'Creator social media feature',
      'A/B testing angles',
    ],
    prices: {
      Malawi:        { amount: 250000,  currency: 'MWK', symbol: 'MK' },
      Zambia:        { amount: 8500,    currency: 'ZMW', symbol: 'ZK' },
      'South Africa':{ amount: 4500,    currency: 'ZAR', symbol: 'R'  },
      Kenya:         { amount: 33000,   currency: 'KES', symbol: 'KSh'},
      Tanzania:      { amount: 570000,  currency: 'TZS', symbol: 'TSh'},
      default:       { amount: 150,     currency: 'USD', symbol: '$'  },
    },
  },
  brand_campaign: {
    name: 'Brand Campaign',
    videos: 10,
    badge: 'Scaling Brands',
    features: [
      '10 UGC ad creatives',
      'Full advertising content library',
      'Multiple creators',
      'Complete brand story development',
      'Offer packaging session',
      'Meta Ads-ready formats',
      'Creator social media features',
      'Designed for scaling campaigns',
    ],
    prices: {
      Malawi:        { amount: 750000,  currency: 'MWK', symbol: 'MK' },
      Zambia:        { amount: 26000,   currency: 'ZMW', symbol: 'ZK' },
      'South Africa':{ amount: 13500,   currency: 'ZAR', symbol: 'R'  },
      Kenya:         { amount: 100000,  currency: 'KES', symbol: 'KSh'},
      Tanzania:      { amount: 1700000, currency: 'TZS', symbol: 'TSh'},
      default:       { amount: 450,     currency: 'USD', symbol: '$'  },
    },
  },
};

function getPriceForCountry(pkg, country) {
  const p = UGC_PACKAGES[pkg];
  return p.prices[country] || p.prices.default;
}

const STATUS_CONFIG = {
  pending_payment:      { label: 'Awaiting Payment',   color: 'bg-yellow-100 text-yellow-700',  dot: 'bg-yellow-500'  },
  awaiting_brief:       { label: 'Brief Needed',        color: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-500'    },
  in_production:        { label: 'In Production',       color: 'bg-purple-100 text-purple-700',  dot: 'bg-purple-500'  },
  review:               { label: 'Under Review',        color: 'bg-indigo-100 text-indigo-700',  dot: 'bg-indigo-500'  },
  revision_requested:   { label: 'Revision Requested',  color: 'bg-orange-100 text-orange-700',  dot: 'bg-orange-500'  },
  completed:            { label: 'Completed',            color: 'bg-green-100 text-green-700',    dot: 'bg-green-500'   },
  cancelled:            { label: 'Cancelled',            color: 'bg-gray-100 text-gray-500',      dot: 'bg-gray-400'    },
};

const GOALS = [
  { value: 'brand_awareness',   label: 'Brand Awareness' },
  { value: 'product_launch',    label: 'Product Launch' },
  { value: 'sales_conversion',  label: 'Sales / Conversion' },
  { value: 'engagement',        label: 'Engagement' },
  { value: 'testimonial',       label: 'Testimonial / Social Proof' },
  { value: 'other',             label: 'Other' },
];

// ── Order status tracker ──────────────────────────────────────────────────────
const STAGES = ['pending_payment','awaiting_brief','in_production','review','completed'];
function OrderTracker({ order }) {
  const idx = STAGES.indexOf(order.status);
  return (
    <div className="flex items-center gap-0 w-full overflow-x-auto py-2">
      {STAGES.map((stage, i) => {
        const cfg = STATUS_CONFIG[stage] || {};
        const done   = i < idx;
        const active = i === idx;
        return (
          <div key={stage} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                done   ? 'bg-[hsl(var(--accent))] border-[hsl(var(--accent))]' :
                active ? 'border-[hsl(var(--accent))] bg-background' :
                         'border-border bg-muted'
              )}>
                {done
                  ? <CheckCircle2 className="w-4 h-4 text-white" />
                  : <div className={cn('w-2.5 h-2.5 rounded-full', active ? 'bg-[hsl(var(--accent))]' : 'bg-muted-foreground/30')} />
                }
              </div>
              <span className={cn(
                'text-[10px] font-medium text-center leading-tight whitespace-nowrap',
                active ? 'text-[hsl(var(--accent))]' : done ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {cfg.label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div className={cn('flex-1 h-0.5 mx-1', done ? 'bg-[hsl(var(--accent))]' : 'bg-border')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Package selector card ─────────────────────────────────────────────────────
function PackageCard({ pkg, pkgKey, country, selected, onSelect }) {
  const price = getPriceForCountry(pkgKey, country);
  const popular = pkg.badge === 'Best Value';
  return (
    <div
      onClick={() => onSelect(pkgKey)}
      className={cn(
        'relative cursor-pointer border-2 rounded-2xl p-5 transition-all hover:shadow-md',
        selected
          ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/5 shadow-md ring-1 ring-[hsl(var(--accent))]/20'
          : 'border-border hover:border-[hsl(var(--accent))]/40'
      )}
    >
      {pkg.badge && (
        <Badge className="absolute -top-2.5 right-4 bg-[hsl(var(--accent))] text-white text-[10px] font-bold px-2.5">
          {pkg.badge}
        </Badge>
      )}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-foreground">{pkg.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{pkg.videos} UGC video{pkg.videos > 1 ? 's' : ''}</p>
        </div>
        <div className="text-right">
          <div className="font-extrabold text-lg text-foreground">
            {price.symbol}{price.amount.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">one-off</div>
        </div>
      </div>
      <ul className="space-y-1.5">
        {pkg.features.slice(0, 4).map(f => (
          <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--accent))] flex-shrink-0" />
            {f}
          </li>
        ))}
        {pkg.features.length > 4 && (
          <li className="text-xs text-[hsl(var(--accent))] font-medium">+{pkg.features.length - 4} more included</li>
        )}
      </ul>
      {selected && (
        <div className="mt-3 pt-3 border-t border-[hsl(var(--accent))]/20 flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--accent))]">
          <CheckCircle2 className="w-3.5 h-3.5" /> Selected
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function UgcAds() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // View: list | new_order | brief | payment | detail
  const [view, setView]     = useState('list');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // New order wizard state
  const [step, setStep]           = useState(1); // 1=package, 2=brief, 3=payment
  const [selectedPkg, setSelectedPkg] = useState(searchParams.get('package') || null);
  const [country, setCountry]     = useState('Malawi');

  const [brief, setBrief] = useState({
    brand_name: '', product_service: '', target_audience: '',
    campaign_goal: '', key_messages: '', tone_style: '',
    reference_links: '', special_requirements: '',
    script_provided: false, script_content: '',
  });

  // Payment
  const [paymentMethods, setPaymentMethods]   = useState([]);
  const [selectedMethod, setSelectedMethod]   = useState(null);
  const [payRef, setPayRef]                   = useState('');
  const [proofFile, setProofFile]             = useState(null);
  const [uploading, setUploading]             = useState(false);
  const [submittingPay, setSubmittingPay]     = useState(false);
  const [paychanguLoading, setPaychanguLoading] = useState(false);
  const [createdOrder, setCreatedOrder]       = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['ugcOrders'],
    queryFn: () => base44.entities.UgcOrder.filter({ user_id: user?.id }, { sort: '-created_date' }),
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
        payment_type: 'ugc',
      }).then(res => {
        if (res?.data?.verified) {
          toast.success('Payment confirmed! Your order is now active.');
          queryClient.invalidateQueries({ queryKey: ['ugcOrders'] });
        } else {
          toast.error('Payment could not be verified — please contact support.');
        }
        window.history.replaceState({}, '', '/ugc-ads');
      }).finally(() => setVerifying(false));
    }

    // Pre-fill country from user
    if (user?.country) setCountry(user.country);
  }, [user?.id]);

  // Load payment methods when we reach payment step
  useEffect(() => {
    if (step === 3 && country) {
      const isMW = country === 'Malawi';
      if (!isMW) {
        base44.entities.PaymentMethod.filter({ country, is_active: true }, { sort: 'sort_order' })
          .then(setPaymentMethods)
          .catch(() => setPaymentMethods([]));
      }
    }
  }, [step, country]);

  // Create order record
  const createOrder = useMutation({
    mutationFn: async () => {
      const price = getPriceForCountry(selectedPkg, country);
      const pkg   = UGC_PACKAGES[selectedPkg];
      const seq   = Date.now().toString().slice(-5);
      return base44.entities.UgcOrder.create({
        order_ref:    `BF-UGC-${seq}`,
        user_id:      user.id,
        user_name:    user.full_name || user.email,
        user_email:   user.email,
        package:      selectedPkg,
        num_videos:   pkg.videos,
        amount:       price.amount,
        currency:     price.currency,
        status:       'pending_payment',
        payment_status: 'unpaid',
        brand_name:   brief.brand_name,
        product_service:  brief.product_service,
        target_audience:  brief.target_audience,
        campaign_goal:    brief.campaign_goal,
        key_messages:     brief.key_messages,
        tone_style:       brief.tone_style,
        reference_links:  brief.reference_links,
        special_requirements: brief.special_requirements,
        script_provided:  brief.script_provided,
        script_content:   brief.script_content,
        brief_submitted_at: new Date().toISOString(),
      });
    },
    onSuccess: (order) => {
      setCreatedOrder(order);
      setStep(3);
    },
  });

  async function handlePaychangu() {
    if (!createdOrder) return;
    setPaychanguLoading(true);
    const txRef  = `BF-UGC-${createdOrder.id}-${Date.now()}`;
    const appUrl = window.location.origin;
    try {
      const res = await base44.functions.invoke('paychanguCheckout', {
        amount:       createdOrder.amount,
        currency:     createdOrder.currency,
        tx_ref:       txRef,
        description:  `UGC Ad Order - ${UGC_PACKAGES[createdOrder.package]?.name} Package`,
        callback_url: `${appUrl}/ugc-ads?paychangu_tx=${txRef}&order_id=${createdOrder.id}`,
        return_url:   `${appUrl}/ugc-ads`,
      });
      if (res?.data?.checkout_url) {
        await base44.entities.UgcOrder.update(createdOrder.id, { paychangu_tx_ref: txRef });
        window.location.href = res.data.checkout_url;
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
        const { data } = await base44.storage.uploadFile(proofFile, {
          folder: 'ugc_payment_proofs',
          public: true,
        });
        proofUrl = data?.url;
        setUploading(false);
      }

      await base44.entities.UgcOrder.update(createdOrder.id, {
        payment_method:    selectedMethod.method_name,
        payment_reference: payRef.trim(),
        payment_proof_url: proofUrl,
        payment_status:    'pending_verification',
        status:            'awaiting_brief',
      });

      toast.success('Payment proof submitted! We\'ll verify and start your order shortly.');
      queryClient.invalidateQueries({ queryKey: ['ugcOrders'] });
      setView('list');
      resetWizard();
    } catch (e) {
      toast.error('Submission failed — ' + (e.message || 'please try again'));
    } finally {
      setSubmittingPay(false);
    }
  }

  function resetWizard() {
    setStep(1); setSelectedPkg(null); setCreatedOrder(null);
    setPayRef(''); setProofFile(null); setSelectedMethod(null);
    setBrief({ brand_name:'',product_service:'',target_audience:'',campaign_goal:'',key_messages:'',tone_style:'',reference_links:'',special_requirements:'',script_provided:false,script_content:'' });
  }

  const isMalawi = country === 'Malawi';

  // ── VIEWS ─────────────────────────────────────────────────────────────────

  if (verifying) return (
    <div className="flex flex-col items-center justify-center min-h-64 gap-4 text-muted-foreground">
      <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--accent))]" />
      <p className="text-sm font-medium">Verifying your payment…</p>
    </div>
  );

  // ── Order detail view
  if (view === 'detail' && selectedOrder) {
    const cfg = STATUS_CONFIG[selectedOrder.status] || {};
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <button onClick={() => setView('list')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to orders
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-foreground">{selectedOrder.order_ref}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{UGC_PACKAGES[selectedOrder.package]?.name} Package · {selectedOrder.num_videos} video{selectedOrder.num_videos > 1 ? 's' : ''}</p>
          </div>
          <Badge className={cn('text-xs font-semibold px-3 py-1', cfg.color)}>{cfg.label}</Badge>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Order Progress</CardTitle></CardHeader>
          <CardContent><OrderTracker order={selectedOrder} /></CardContent>
        </Card>

        {selectedOrder.status === 'pending_payment' && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-5 text-center space-y-3">
              <p className="text-sm font-medium text-yellow-800">Complete your payment to start production</p>
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
                <p className="font-semibold text-green-800 text-sm">Your videos are ready!</p>
                <p className="text-xs text-green-700 mt-0.5">Click to download your deliverables</p>
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
            {[
              ['Brand / Business', selectedOrder.brand_name],
              ['Product / Service', selectedOrder.product_service],
              ['Target Audience', selectedOrder.target_audience],
              ['Campaign Goal', selectedOrder.campaign_goal],
              ['Key Messages', selectedOrder.key_messages],
              ['Tone & Style', selectedOrder.tone_style],
              ['Reference Links', selectedOrder.reference_links],
              ['Special Requirements', selectedOrder.special_requirements],
            ].map(([label, val]) => val ? (
              <div key={label} className="flex gap-3">
                <span className="text-muted-foreground font-medium w-36 flex-shrink-0">{label}</span>
                <span className="text-foreground">{val}</span>
              </div>
            ) : null)}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── New order wizard
  if (view === 'new_order') {
    const price = selectedPkg ? getPriceForCountry(selectedPkg, country) : null;
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => { if (step === 1) { setView('list'); resetWizard(); } else setStep(s => s-1); }}
            className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Order UGC Ads</h1>
            <p className="text-xs text-muted-foreground">Step {step} of 3</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2">
          {['Package','Brief','Payment'].map((s, i) => (
            <div key={s} className={cn(
              'flex-1 h-1.5 rounded-full transition-all',
              i < step ? 'bg-[hsl(var(--accent))]' : 'bg-border'
            )} />
          ))}
        </div>

        {/* ── Step 1: Package ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-foreground mb-1">Choose a package</h2>
              <p className="text-sm text-muted-foreground">Prices shown for your country.</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium">Pricing for:</span>
              {['Malawi','Zambia','South Africa','Kenya','Tanzania'].map(c => (
                <button key={c} onClick={() => setCountry(c)}
                  className={cn('px-3 py-1 rounded-lg text-xs font-medium border transition-all',
                    country === c ? 'bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]' : 'border-border text-muted-foreground hover:text-foreground'
                  )}>{c}</button>
              ))}
            </div>

            <div className="grid gap-4">
              {Object.entries(UGC_PACKAGES).map(([key, pkg]) => (
                <PackageCard key={key} pkgKey={key} pkg={pkg} country={country}
                  selected={selectedPkg === key} onSelect={setSelectedPkg} />
              ))}
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!selectedPkg}
              className="w-full h-11 font-semibold bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent))]/90"
            >
              Continue to Brief <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        )}

        {/* ── Step 2: Brief ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-foreground mb-1">Creative Brief</h2>
              <p className="text-sm text-muted-foreground">Tell us about your brand so we can create the perfect UGC ads.</p>
            </div>
            <Card>
              <CardContent className="pt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs mb-1 block">Brand / Business Name *</Label>
                    <Input value={brief.brand_name} onChange={e => setBrief(b => ({...b, brand_name: e.target.value}))}
                      placeholder="e.g. Chisomo's Boutique" className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Product / Service Being Advertised *</Label>
                    <Input value={brief.product_service} onChange={e => setBrief(b => ({...b, product_service: e.target.value}))}
                      placeholder="e.g. Women's fashion clothing" className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Target Audience *</Label>
                    <Input value={brief.target_audience} onChange={e => setBrief(b => ({...b, target_audience: e.target.value}))}
                      placeholder="e.g. Women 18-35 in Malawi" className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Campaign Goal *</Label>
                    <Select value={brief.campaign_goal} onValueChange={v => setBrief(b => ({...b, campaign_goal: v}))}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select goal" /></SelectTrigger>
                      <SelectContent>{GOALS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Tone &amp; Style</Label>
                    <Input value={brief.tone_style} onChange={e => setBrief(b => ({...b, tone_style: e.target.value}))}
                      placeholder="e.g. Energetic, relatable, authentic" className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Reference Videos / Inspiration Links</Label>
                    <Input value={brief.reference_links} onChange={e => setBrief(b => ({...b, reference_links: e.target.value}))}
                      placeholder="https://..." className="h-9 text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Key Messages / Talking Points *</Label>
                  <Textarea value={brief.key_messages} onChange={e => setBrief(b => ({...b, key_messages: e.target.value}))}
                    placeholder="What should the creator say or highlight? What makes your product/service special?"
                    className="text-sm min-h-24 resize-none" />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Special Requirements</Label>
                  <Textarea value={brief.special_requirements} onChange={e => setBrief(b => ({...b, special_requirements: e.target.value}))}
                    placeholder="Any specific dos/don'ts, languages, locations, props needed?"
                    className="text-sm min-h-16 resize-none" />
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/40">
                  <input type="checkbox" id="has_script" checked={brief.script_provided}
                    onChange={e => setBrief(b => ({...b, script_provided: e.target.checked}))}
                    className="mt-0.5 w-4 h-4 accent-[hsl(var(--accent))]" />
                  <div>
                    <label htmlFor="has_script" className="text-sm font-medium cursor-pointer">I have a script ready</label>
                    <p className="text-xs text-muted-foreground mt-0.5">Check this to paste your script below</p>
                  </div>
                </div>
                {brief.script_provided && (
                  <div>
                    <Label className="text-xs mb-1 block">Your Script</Label>
                    <Textarea value={brief.script_content} onChange={e => setBrief(b => ({...b, script_content: e.target.value}))}
                      placeholder="Paste your full script here..." className="text-sm min-h-32 resize-none" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Button
              onClick={() => {
                if (!brief.brand_name || !brief.product_service || !brief.target_audience || !brief.campaign_goal || !brief.key_messages) {
                  toast.error('Please fill in all required fields.'); return;
                }
                createOrder.mutate();
              }}
              disabled={createOrder.isPending}
              className="w-full h-11 font-semibold bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent))]/90"
            >
              {createOrder.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving Brief…</>
                : <>Continue to Payment <ArrowRight className="w-4 h-4 ml-1.5" /></>
              }
            </Button>
          </div>
        )}

        {/* ── Step 3: Payment ── */}
        {step === 3 && createdOrder && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-foreground mb-1">Payment</h2>
              <p className="text-sm text-muted-foreground">Complete payment to start your UGC production.</p>
            </div>

            {/* Summary */}
            <Card className="border-[hsl(var(--accent))]/20 bg-[hsl(var(--accent))]/5">
              <CardContent className="pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Package</span>
                  <span className="font-semibold">{UGC_PACKAGES[createdOrder.package]?.name} ({createdOrder.num_videos} videos)</span>
                </div>
                <div className="flex justify-between text-sm border-t border-[hsl(var(--accent))]/10 pt-2">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-extrabold text-lg text-[hsl(var(--accent))]">
                    {createdOrder.currency} {createdOrder.amount.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Invoice */}
            {user && (
              <InvoiceDownload
                type="ugc"
                reference={createdOrder.order_ref}
                amount={createdOrder.amount}
                currency={createdOrder.currency}
                description={`UGC Ads - ${UGC_PACKAGES[createdOrder.package]?.name} Package (${createdOrder.num_videos} videos)`}
                clientName={user.full_name || user.email}
                clientEmail={user.email}
              />
            )}

            {/* Paychangu (Malawi) */}
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
                      : <>Pay {createdOrder.currency} {createdOrder.amount.toLocaleString()} <ExternalLink className="w-4 h-4 ml-1.5" /></>
                    }
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Manual payment methods (non-Malawi) */}
            {!isMalawi && paymentMethods.length > 0 && (
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
                          <Badge variant="outline" className="text-[10px]">{m.method_type?.replace('_',' ')}</Badge>
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
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:bg-muted text-xs text-muted-foreground transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            {proofFile ? proofFile.name : 'Choose file'}
                            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => setProofFile(e.target.files[0])} />
                          </label>
                        </div>
                      </div>
                      <Button onClick={handleManualPayment} disabled={submittingPay || uploading}
                        className="w-full h-10 font-semibold bg-[hsl(var(--primary))] text-primary-foreground">
                        {submittingPay
                          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting…</>
                          : 'Submit Payment Proof'
                        }
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

  // ── Order list (default view) ─────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Video className="w-6 h-6 text-[hsl(var(--accent))]" /> UGC Ads
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            User-generated content ads crafted by real creators — built for Meta Ads performance.
          </p>
        </div>
        <Button onClick={() => setView('new_order')}
          className="bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent))]/90 font-semibold gap-2">
          <Play className="w-4 h-4" /> Order UGC Ads
        </Button>
      </div>

      {/* Orders */}
      {loadingOrders ? (
        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading orders…</span>
        </div>
      ) : orders.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--accent))]/10 flex items-center justify-center mx-auto">
              <Video className="w-8 h-8 text-[hsl(var(--accent))]" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No UGC orders yet</p>
              <p className="text-sm text-muted-foreground mt-1">Order your first UGC ad campaign and let real creators tell your brand story.</p>
            </div>
            <Button onClick={() => setView('new_order')}
              className="bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent))]/90 gap-2 mx-auto">
              <Play className="w-4 h-4" /> Order UGC Ads
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const cfg = STATUS_CONFIG[order.status] || {};
            const pkg = UGC_PACKAGES[order.package];
            return (
              <Card key={order.id} className="hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => { setSelectedOrder(order); setView('detail'); }}>
                <CardContent className="py-4 flex items-center gap-4 flex-wrap">
                  <div className="w-10 h-10 rounded-xl bg-[hsl(var(--accent))]/10 flex items-center justify-center flex-shrink-0">
                    <Video className="w-5 h-5 text-[hsl(var(--accent))]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{order.order_ref}</span>
                      <Badge className={cn('text-[10px] font-semibold px-2', cfg.color)}>{cfg.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {pkg?.name} Package · {order.num_videos} video{order.num_videos > 1 ? 's' : ''} ·{' '}
                      {order.currency} {order.amount?.toLocaleString()} ·{' '}
                      {order.brand_name || '—'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
