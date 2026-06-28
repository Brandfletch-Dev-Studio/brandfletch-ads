import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Loader2, CheckCircle2, ChevronRight, ChevronLeft,
  Megaphone, Video, Palette, Globe, Share2, Layers,
  ArrowRight, Lock, LogIn, UserPlus
} from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

// ── Service catalogue — prices match PricingPage ──────────────────────────────
// Prices in MWK, same packages as the public Pricing page
const SERVICES = [
  {
    key: 'meta_ads',
    label: 'Meta Ads',
    icon: Megaphone,
    color: 'bg-blue-500/10 text-blue-600',
    desc: "Facebook & Instagram ad campaigns managed end-to-end. Prices shown in MWK — use the calculator on our Pricing page for USD.",
    plans: [
      { slug: 'starter',  name: 'Starter',        price: 'MK 100,000', priceNote: '/month',       billing: 'monthly',  desc: 'Up to 2 campaigns, basic audience targeting' },
      { slug: 'growth',   name: 'Growth',          price: 'MK 250,000', priceNote: '/month',       billing: 'monthly',  desc: 'Up to 4 campaigns, A/B testing, retargeting' },
      { slug: 'scale',    name: 'Scale',           price: 'MK 750,000', priceNote: '/month',       billing: 'monthly',  desc: 'Unlimited campaigns, full funnel strategy' },
    ],
  },
  {
    key: 'ugc_ads',
    label: 'UGC Ads',
    icon: Video,
    color: 'bg-purple-500/10 text-purple-600',
    desc: "We don't just create videos. We create UGC ads designed to help businesses attract customers — Meta Ads-ready.",
    plans: [
      { slug: 'starter',         name: 'Starter',        price: 'MK 100,000', priceNote: 'per campaign', billing: 'once-off', desc: '1 UGC ad creative, creator matching, brand story, Meta Ads-ready format' },
      { slug: 'growth',          name: 'Growth',         price: 'MK 250,000', priceNote: 'per campaign', billing: 'once-off', desc: '3 UGC ad creatives, multiple angles, A/B testing, full brand story' },
      { slug: 'brand-campaign',  name: 'Brand Campaign', price: 'MK 750,000', priceNote: 'per campaign', billing: 'once-off', desc: '10 UGC ad creatives, multiple creators, full advertising content library' },
    ],
  },
  {
    key: 'graphic_design',
    label: 'Graphic Design',
    icon: Palette,
    color: 'bg-pink-500/10 text-pink-600',
    desc: 'Consistent, professional design output on a monthly retainer — posters, social posts, motion graphics & more.',
    plans: [
      { slug: 'starter',  name: 'Starter',  price: 'MK 100,000', priceNote: '/month', billing: 'monthly',  desc: '10 design requests/month, static designs, 24–48hr turnaround' },
      { slug: 'growth',   name: 'Growth',   price: 'MK 180,000', priceNote: '/month', billing: 'monthly',  desc: '15 design requests/month, static + motion, 12–24hr turnaround' },
      { slug: 'premium',  name: 'Premium',  price: 'MK 280,000', priceNote: '/month', billing: 'monthly',  desc: '20 design requests/month, full suite, dedicated designer, 6–12hr turnaround' },
    ],
  },
  {
    key: 'social_media',
    label: 'Social Media',
    icon: Share2,
    color: 'bg-green-500/10 text-green-600',
    desc: 'Full social media management — content, strategy, scheduling, and community engagement.',
    plans: [
      { slug: 'starter',      name: 'Starter',      price: 'MK 150,000', priceNote: '/month', billing: 'monthly',  desc: '16 branded posts/month, page management, content planning, basic engagement' },
      { slug: 'growth',       name: 'Growth',       price: 'MK 300,000', priceNote: '/month', billing: 'monthly',  desc: '32 branded posts/month, full management, Reels, content calendar, report' },
      { slug: 'brand-growth', name: 'Brand Growth', price: 'MK 450,000', priceNote: '/month', billing: 'monthly',  desc: '32+ posts/month, paid ads integration, influencer coordination, full strategy' },
    ],
  },
  {
    key: 'web_design',
    label: 'Web Design',
    icon: Globe,
    color: 'bg-orange-500/10 text-orange-600',
    desc: 'Websites designed around business growth — mobile-first, conversion-focused, built for African businesses.',
    plans: [
      { slug: 'starter',  name: 'Starter Website',  price: 'MK 150,000', priceNote: 'one-off', billing: 'once-off', desc: 'Up to 5 pages, mobile responsive, contact form, WhatsApp integration, basic SEO' },
      { slug: 'growth',   name: 'Growth Website',   price: 'MK 350,000', priceNote: 'one-off', billing: 'once-off', desc: 'Up to 10 pages, lead capture, blog/news, SEO optimisation, analytics setup' },
      { slug: 'pro',      name: 'Business Pro',     price: 'MK 750,000', priceNote: 'one-off', billing: 'once-off', desc: 'Unlimited pages, e-commerce, booking systems, payment integrations, advanced SEO' },
    ],
  },
  {
    key: 'branding',
    label: 'Branding',
    icon: Layers,
    color: 'bg-amber-500/10 text-amber-600',
    desc: 'Logo, brand identity, and brand guidelines — built to make your business look the part.',
    plans: [
      { slug: 'logo',      name: 'Logo Only',      price: 'MK 150,000', priceNote: 'one-off', billing: 'once-off', desc: 'Logo + 3 concepts, 2 revisions, all file formats' },
      { slug: 'identity',  name: 'Brand Identity', price: 'MK 350,000', priceNote: 'one-off', billing: 'once-off', desc: 'Logo + colour palette + typography + brand guidelines' },
      { slug: 'full',      name: 'Full Brand',     price: 'MK 750,000', priceNote: 'one-off', billing: 'once-off', desc: 'Complete brand system + social media templates + all assets' },
    ],
  },
];

const COUNTRIES = ['Malawi','Zambia','Kenya','Tanzania','South Africa','Nigeria','Ghana','Uganda','Other'];
const STEPS = ['Service','Plan','Details','Review'];

export default function GuestOrderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Pre-fill from URL params (?service=meta_ads&plan=growth)
  const preService = searchParams.get('service') || '';
  const prePlan    = searchParams.get('plan')    || '';

  const [step, setStep] = useState(preService ? (prePlan ? 2 : 1) : 0);
  const [selectedService, setSelectedService] = useState(preService || '');
  const [selectedPlan,    setSelectedPlan]    = useState(null);
  const [form, setForm] = useState({
    name: user?.full_name || '',
    email: user?.email    || '',
    phone: user?.phone    || '',
    country: user?.country || '',
    business_name: user?.business_name || '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [showAuthGate, setShowAuthGate] = useState(false);

  // Pre-select plan from URL
  useEffect(() => {
    if (preService && prePlan) {
      const svc = SERVICES.find(s => s.key === preService);
      if (svc) {
        const plan = svc.plans.find(p => p.slug === prePlan);
        if (plan) setSelectedPlan(plan);
      }
    }
  }, []);

  // If user just logged in and there's a pending intent, recover it
  useEffect(() => {
    if (user && searchParams.get('intent')) {
      try {
        const intent = JSON.parse(atob(searchParams.get('intent')));
        setSelectedService(intent.service_type || '');
        const svc = SERVICES.find(s => s.key === intent.service_type);
        if (svc) {
          const plan = svc.plans.find(p => p.slug === intent.plan_slug);
          if (plan) setSelectedPlan(plan);
        }
        setForm(prev => ({ ...prev, ...intent.form }));
        setStep(3);
      } catch {}
    }
  }, [user]);

  const serviceObj = SERVICES.find(s => s.key === selectedService);

  function setFormField(k, v) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  // Step 0 → 1: pick service
  function handleSelectService(key) {
    setSelectedService(key);
    setSelectedPlan(null);
    setStep(1);
  }

  // Step 1 → 2: pick plan
  function handleSelectPlan(plan) {
    setSelectedPlan(plan);
    setStep(2);
  }

  // Step 2 → 3: details filled
  function handleDetailsNext(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Please fill in your name and email.');
      return;
    }
    setStep(3);
  }

  // Step 3: submit order → show auth gate if not logged in
  async function handleSubmitOrder() {
    if (!selectedPlan || !selectedService) return;
    setSubmitting(true);
    try {
      // Save guest order record (anon insert allowed by RLS)
      const { data, error } = await supabase
        .from('GuestOrder')
        .insert({
          name:         form.name.trim(),
          email:        form.email.trim(),
          phone:        form.phone || null,
          country:      form.country || null,
          business_name:form.business_name || null,
          notes:        form.notes || null,
          service_type: selectedService,
          plan_name:    selectedPlan.name,
          plan_slug:    selectedPlan.slug,
          currency:     'MWK',
          price:        selectedPlan.price,
          billing_cycle:selectedPlan.billing,
          status:       'pending',
          user_id:      user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      setOrderId(data.id);

      if (user) {
        // Already logged in — go straight to the right flow
        routeToPayment(data.id);
      } else {
        // Show the auth gate
        setShowAuthGate(true);
      }
    } catch (e) {
      toast.error('Could not save order: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  }

  function routeToPayment(id) {
    // For now route to support/contact; in future, direct payment flow per service
    navigate(`/register?intent=${encodeURIComponent(btoa(JSON.stringify({
      service_type: selectedService,
      plan_name: selectedPlan?.name,
      plan_slug: selectedPlan?.slug,
      form: { name: form.name, email: form.email, phone: form.phone, country: form.country, business_name: form.business_name },
      order_id: id,
    })))}&email=${encodeURIComponent(form.email)}`);
  }

  // ── Auth gate modal ────────────────────────────────────────────────────────
  if (showAuthGate) {
    const intentB64 = btoa(JSON.stringify({
      service_type: selectedService,
      plan_name: selectedPlan?.name,
      plan_slug: selectedPlan?.slug,
      form: { name: form.name, email: form.email, phone: form.phone, country: form.country, business_name: form.business_name },
      order_id: orderId,
    }));
    const emailParam = encodeURIComponent(form.email);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-[hsl(var(--primary))]" />
            </div>
          </div>

          <div className="mb-2 flex justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-2 mt-0.5" />
            <span className="text-sm text-muted-foreground">Your order has been saved.</span>
          </div>

          <h1 className="text-2xl font-bold mb-2">One last step</h1>
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
            Create a free account or log in to confirm your order for{' '}
            <strong className="text-foreground">{serviceObj?.label} — {selectedPlan?.name}</strong> and proceed to payment.
          </p>

          {/* Order summary pill */}
          <div className="mb-8 inline-flex items-center gap-2 bg-muted rounded-full px-4 py-2 text-sm">
            <span className="font-semibold">{serviceObj?.label}</span>
            <span className="text-muted-foreground">·</span>
            <span>{selectedPlan?.name}</span>
            <span className="text-muted-foreground">·</span>
            <span className="font-bold text-foreground">{selectedPlan?.price} {selectedPlan?.priceNote}</span>
          </div>

          <div className="space-y-3">
            <Link
              to={`/register?email=${emailParam}&intent=${intentB64}`}
              className="block"
            >
              <Button className="w-full h-12 text-base font-semibold bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90">
                <UserPlus className="w-5 h-5 mr-2" />
                Create a free account
              </Button>
            </Link>
            <Link
              to={`/login?email=${emailParam}&intent=${intentB64}`}
              className="block"
            >
              <Button variant="outline" className="w-full h-12 text-base font-semibold">
                <LogIn className="w-5 h-5 mr-2" />
                Log in to my account
              </Button>
            </Link>
          </div>

          <button
            className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowAuthGate(false)}
          >
            ← Back to order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="bg-[hsl(var(--primary))] px-4 py-3 flex items-center justify-between">
        <Link to="/"><BrandLogo size="sidebar" /></Link>
        <div className="hidden sm:flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <button
                onClick={() => i < step && setStep(i)}
                disabled={i >= step}
                className={cn(
                  'text-xs font-semibold px-2.5 py-1 rounded-full transition-all',
                  i === step
                    ? 'bg-white text-[hsl(var(--primary))]'
                    : i < step
                    ? 'bg-white/20 text-white cursor-pointer hover:bg-white/30'
                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                )}
              >
                {s}
              </button>
              {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-white/30" />}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {!user && (
            <Link to="/login">
              <Button size="sm" variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 text-xs">
                Log in
              </Button>
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* ── Step 0: Pick service ── */}
        {step === 0 && (
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">What service do you need?</h1>
            <p className="text-muted-foreground mb-8">Pick the service that fits your goal best.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SERVICES.map(svc => (
                <button
                  key={svc.key}
                  onClick={() => handleSelectService(svc.key)}
                  className="text-left rounded-xl border border-border/60 bg-card hover:border-[hsl(var(--primary))]/50 hover:shadow-md transition-all p-5 group"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', svc.color)}>
                      <svc.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{svc.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{svc.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[hsl(var(--primary))] transition-colors mt-1" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 1: Pick plan ── */}
        {step === 1 && serviceObj && (
          <div>
            <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6" onClick={() => setStep(0)}>
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', serviceObj.color)}>
                <serviceObj.icon className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold">{serviceObj.label}</h1>
            </div>
            <p className="text-muted-foreground mb-8">{serviceObj.desc}</p>
            <div className="space-y-3">
              {serviceObj.plans.map(plan => (
                <button
                  key={plan.slug}
                  onClick={() => handleSelectPlan(plan)}
                  className="w-full text-left rounded-xl border border-border/60 bg-card hover:border-[hsl(var(--primary))]/50 hover:shadow-md transition-all p-5 group flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold">{plan.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{plan.desc}</p>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <p className="font-bold text-lg">{plan.price}</p>
                    {plan.priceNote && <p className="text-xs text-muted-foreground">{plan.priceNote}</p>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Your details ── */}
        {step === 2 && selectedPlan && (
          <div>
            <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6" onClick={() => setStep(1)}>
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            {/* Selected plan pill */}
            <div className="mb-6 inline-flex items-center gap-2 bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] rounded-full px-4 py-1.5 text-sm font-semibold">
              <serviceObj.icon className="w-4 h-4" />
              {serviceObj.label} — {selectedPlan.name} · {selectedPlan.price} {selectedPlan.priceNote}
            </div>
            <h1 className="text-2xl font-bold mb-1">Your details</h1>
            <p className="text-muted-foreground mb-8 text-sm">We'll use this to set up your account and reach out about your order.</p>
            <form onSubmit={handleDetailsNext} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Full name *</Label>
                  <Input value={form.name} onChange={e => setFormField('name', e.target.value)} placeholder="Your name" className="mt-1" required />
                </div>
                <div>
                  <Label>Email address *</Label>
                  <Input type="email" value={form.email} onChange={e => setFormField('email', e.target.value)} placeholder="you@example.com" className="mt-1" required />
                </div>
                <div>
                  <Label>Phone number</Label>
                  <Input value={form.phone} onChange={e => setFormField('phone', e.target.value)} placeholder="+265 99 000 0000" className="mt-1" />
                </div>
                <div>
                  <Label>Country</Label>
                  <Select value={form.country} onValueChange={v => setFormField('country', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label>Business name</Label>
                  <Input value={form.business_name} onChange={e => setFormField('business_name', e.target.value)} placeholder="Your business or brand name" className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Any extra context? <span className="text-muted-foreground">(optional)</span></Label>
                  <Textarea value={form.notes} onChange={e => setFormField('notes', e.target.value)} placeholder="Tell us your goals, current situation, or anything helpful..." className="mt-1 h-24 resize-none" />
                </div>
              </div>
              <Button type="submit" className="w-full sm:w-auto h-11 font-semibold">
                Review order <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          </div>
        )}

        {/* ── Step 3: Review & submit ── */}
        {step === 3 && selectedPlan && serviceObj && (
          <div className="max-w-lg mx-auto">
            <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6" onClick={() => setStep(2)}>
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-2xl font-bold mb-6">Review your order</h1>

            <div className="rounded-xl border border-border bg-card p-6 space-y-5">
              {/* Service + plan */}
              <div className="flex items-start justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', serviceObj.color)}>
                    <serviceObj.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{serviceObj.label}</p>
                    <p className="text-sm text-muted-foreground">{selectedPlan.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">{selectedPlan.price}</p>
                  <p className="text-xs text-muted-foreground">{selectedPlan.priceNote}</p>
                </div>
              </div>

              {/* Contact summary */}
              <div className="space-y-2 text-sm">
                {[
                  ['Name', form.name],
                  ['Email', form.email],
                  form.phone && ['Phone', form.phone],
                  form.country && ['Country', form.country],
                  form.business_name && ['Business', form.business_name],
                ].filter(Boolean).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium text-right max-w-[60%] truncate">{v}</span>
                  </div>
                ))}
              </div>

              {form.notes && (
                <div className="pt-2 border-t border-border text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Notes</p>
                  <p className="leading-relaxed">{form.notes}</p>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-4 mb-6 text-center">
              After placing your order you'll be prompted to{' '}
              <strong className="text-foreground">create a free account or log in</strong> to confirm and proceed to payment.
            </p>

            <Button
              onClick={handleSubmitOrder}
              disabled={submitting}
              className="w-full h-12 text-base font-bold bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90"
            >
              {submitting
                ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving order…</>
                : <>Place order & continue <ArrowRight className="w-5 h-5 ml-2" /></>
              }
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}

