import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Loader2, CheckCircle2, Check, ChevronLeft, ChevronRight,
  Megaphone, Video, Palette, Globe, Share2, Layers,
  Lock, LogIn, UserPlus, ArrowRight,
} from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

// ── Services — prices match PricingPage (MWK) ─────────────────────────────────
const SERVICES = [
  {
    key: 'meta_ads',
    label: 'Meta Ads',
    icon: Megaphone,
    gradient: 'from-blue-500 to-blue-600',
    desc: 'Facebook & Instagram ad campaigns managed end-to-end.',
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
    gradient: 'from-purple-500 to-purple-600',
    desc: "UGC ads designed to help businesses attract customers — Meta Ads-ready.",
    plans: [
      { slug: 'starter',         name: 'Starter',        price: 'MK 100,000', priceNote: 'per campaign', billing: 'once-off', desc: '1 UGC ad creative, creator matching, brand story, Meta Ads-ready' },
      { slug: 'growth',          name: 'Growth',         price: 'MK 250,000', priceNote: 'per campaign', billing: 'once-off', desc: '3 UGC ad creatives, multiple angles, A/B testing, full brand story' },
      { slug: 'brand-campaign',  name: 'Brand Campaign', price: 'MK 750,000', priceNote: 'per campaign', billing: 'once-off', desc: '10 UGC ad creatives, multiple creators, full content library' },
    ],
  },
  {
    key: 'graphic_design',
    label: 'Graphic Design',
    icon: Palette,
    gradient: 'from-pink-500 to-pink-600',
    desc: 'Monthly design retainer — posters, social posts, motion graphics & more.',
    plans: [
      { slug: 'starter',  name: 'Starter',  price: 'MK 100,000', priceNote: '/month', billing: 'monthly',  desc: '10 design requests/month, static designs, 24–48hr turnaround' },
      { slug: 'growth',   name: 'Growth',   price: 'MK 180,000', priceNote: '/month', billing: 'monthly',  desc: '15 requests/month, static + motion, 12–24hr turnaround' },
      { slug: 'premium',  name: 'Premium',  price: 'MK 280,000', priceNote: '/month', billing: 'monthly',  desc: '20 requests/month, full suite, dedicated designer, 6–12hr turnaround' },
    ],
  },
  {
    key: 'social_media',
    label: 'Social Media',
    icon: Share2,
    gradient: 'from-green-500 to-green-600',
    desc: 'Full social media management — content, strategy, scheduling & engagement.',
    plans: [
      { slug: 'starter',      name: 'Starter',      price: 'MK 150,000', priceNote: '/month', billing: 'monthly',  desc: '16 branded posts/month, page management, content planning' },
      { slug: 'growth',       name: 'Growth',       price: 'MK 300,000', priceNote: '/month', billing: 'monthly',  desc: '32 branded posts/month, Reels, full management, monthly report' },
      { slug: 'brand-growth', name: 'Brand Growth', price: 'MK 450,000', priceNote: '/month', billing: 'monthly',  desc: '32+ posts/month, paid ads integration, influencer coordination' },
    ],
  },
  {
    key: 'web_design',
    label: 'Web Design',
    icon: Globe,
    gradient: 'from-orange-500 to-orange-600',
    desc: 'Mobile-first, conversion-focused websites built for African businesses.',
    plans: [
      { slug: 'starter',  name: 'Starter Website',  price: 'MK 150,000', priceNote: 'one-off', billing: 'once-off', desc: 'Up to 5 pages, mobile responsive, contact form, WhatsApp integration' },
      { slug: 'growth',   name: 'Growth Website',   price: 'MK 350,000', priceNote: 'one-off', billing: 'once-off', desc: 'Up to 10 pages, lead capture, blog, SEO optimisation, analytics' },
      { slug: 'pro',      name: 'Business Pro',     price: 'MK 750,000', priceNote: 'one-off', billing: 'once-off', desc: 'Unlimited pages, e-commerce, booking systems, payment integrations' },
    ],
  },
  {
    key: 'branding',
    label: 'Branding',
    icon: Layers,
    gradient: 'from-amber-500 to-amber-600',
    desc: 'Logo, brand identity, and guidelines — make your business look the part.',
    plans: [
      { slug: 'logo',      name: 'Logo Only',      price: 'MK 150,000', priceNote: 'one-off', billing: 'once-off', desc: 'Logo + 3 concepts, 2 revisions, all file formats' },
      { slug: 'identity',  name: 'Brand Identity', price: 'MK 350,000', priceNote: 'one-off', billing: 'once-off', desc: 'Logo + colour palette + typography + brand guidelines' },
      { slug: 'full',      name: 'Full Brand',     price: 'MK 750,000', priceNote: 'one-off', billing: 'once-off', desc: 'Complete brand system + social media templates + all assets' },
    ],
  },
];

const COUNTRIES = ['Malawi','Zambia','Kenya','Tanzania','South Africa','Nigeria','Ghana','Uganda','Other'];

const STEPS = [
  { id: 0, label: 'Service' },
  { id: 1, label: 'Plan' },
  { id: 2, label: 'Details' },
  { id: 3, label: 'Review' },
];

export default function GuestOrderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const preService = searchParams.get('service') || '';
  const prePlan    = searchParams.get('plan') || '';

  const [step, setStep] = useState(preService ? (prePlan ? 2 : 1) : 0);
  const [selectedService, setSelectedService] = useState(preService || '');
  const [selectedPlan, setSelectedPlan]       = useState(null);
  const [form, setForm] = useState({
    name:          user?.full_name || '',
    email:         user?.email     || '',
    phone:         user?.phone     || '',
    country:       user?.country   || '',
    business_name: user?.business_name || '',
    notes:         '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId]       = useState(null);
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

  // Recover intent after login
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

  function setFormField(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  function handleSelectService(key) { setSelectedService(key); setSelectedPlan(null); setStep(1); }
  function handleSelectPlan(plan)   { setSelectedPlan(plan); setStep(2); }

  function handleDetailsNext(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { toast.error('Name and email are required.'); return; }
    setStep(3);
  }

  async function handleSubmitOrder() {
    if (!selectedPlan || !selectedService) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('GuestOrder')
        .insert({
          name:          form.name.trim(),
          email:         form.email.trim(),
          phone:         form.phone || null,
          country:       form.country || null,
          business_name: form.business_name || null,
          notes:         form.notes || null,
          service_type:  selectedService,
          plan_name:     selectedPlan.name,
          plan_slug:     selectedPlan.slug,
          currency:      'MWK',
          price:         selectedPlan.price,
          billing_cycle: selectedPlan.billing,
          status:        'pending',
          user_id:       user?.id || null,
        })
        .select().single();

      if (error) throw error;
      setOrderId(data.id);

      if (user) {
        navigate(`/register?intent=${encodeURIComponent(btoa(JSON.stringify({
          service_type: selectedService, plan_name: selectedPlan?.name,
          plan_slug: selectedPlan?.slug, order_id: data.id,
          form: { name: form.name, email: form.email, phone: form.phone, country: form.country, business_name: form.business_name },
        })))}&email=${encodeURIComponent(form.email)}`);
      } else {
        setShowAuthGate(true);
      }
    } catch (e) {
      toast.error('Could not save order: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (showAuthGate) {
    const intentB64  = btoa(JSON.stringify({
      service_type: selectedService, plan_name: selectedPlan?.name,
      plan_slug: selectedPlan?.slug, order_id: orderId,
      form: { name: form.name, email: form.email, phone: form.phone, country: form.country, business_name: form.business_name },
    }));
    const emailParam = encodeURIComponent(form.email);
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="h-14 border-b border-border flex items-center px-4 lg:px-8 shrink-0">
          <Link to="/"><BrandLogo size="sidebar" /></Link>
        </header>
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--primary))]/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-[hsl(var(--primary))]" />
              </div>
            </div>

            {/* Saved notice */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-sm text-muted-foreground">Order saved — just one more step.</span>
            </div>

            <h1 className="text-2xl font-bold font-heading text-center mb-2">Create your account</h1>
            <p className="text-muted-foreground text-sm text-center mb-8 leading-relaxed">
              Sign up or log in to confirm your order for{' '}
              <span className="font-semibold text-foreground">{serviceObj?.label} — {selectedPlan?.name}</span>{' '}
              and proceed to payment.
            </p>

            {/* Order summary */}
            <div className="bg-card rounded-2xl border border-border p-4 mb-8 flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0',
                serviceObj && `from-${serviceObj.gradient.split('-')[1]}-500 to-${serviceObj.gradient.split('-')[3]}-600`
              )} style={{ background: 'hsl(var(--primary))' }}>
                {serviceObj && <serviceObj.icon className="w-5 h-5 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{serviceObj?.label} — {selectedPlan?.name}</p>
                <p className="text-xs text-muted-foreground">{selectedPlan?.desc}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-sm text-[hsl(var(--primary))]">{selectedPlan?.price}</p>
                <p className="text-xs text-muted-foreground">{selectedPlan?.priceNote}</p>
              </div>
            </div>

            <div className="space-y-3">
              <Link to={`/register?email=${emailParam}&intent=${intentB64}`}>
                <Button className="w-full h-11 font-semibold bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90">
                  <UserPlus className="w-4 h-4 mr-2" /> Create a free account
                </Button>
              </Link>
              <Link to={`/login?email=${emailParam}&intent=${intentB64}`}>
                <Button variant="outline" className="w-full h-11 font-semibold">
                  <LogIn className="w-4 h-4 mr-2" /> Log in to my account
                </Button>
              </Link>
            </div>

            <button className="mt-6 w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowAuthGate(false)}>
              ← Back to order
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main wizard ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar — matches AppLayout header style */}
      <header className="h-14 border-b border-border flex items-center px-4 lg:px-8 shrink-0 justify-between">
        <Link to="/"><BrandLogo size="sidebar" /></Link>
        {!user && (
          <Link to="/login">
            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground text-xs gap-1.5">
              <LogIn className="w-3.5 h-3.5" /> Log in
            </Button>
          </Link>
        )}
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 lg:py-12">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-heading">Place an Order</h1>
          <p className="text-muted-foreground text-sm mt-1">Follow the steps to get started.</p>
        </div>

        {/* Step indicator — identical to CampaignWizard */}
        <div className="flex items-center mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  step > s.id  ? 'bg-[hsl(var(--accent))] text-white'    :
                  step === s.id ? 'bg-[hsl(var(--primary))] text-white'  :
                                  'bg-secondary text-muted-foreground'
                )}>
                  {step > s.id ? <Check className="w-4 h-4" /> : s.id + 1}
                </div>
                <span className={cn('text-xs mt-1 font-medium whitespace-nowrap',
                  step === s.id ? 'text-foreground' : 'text-muted-foreground')}>
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={cn('h-0.5 w-8 lg:w-12 mx-1 mb-5 transition-all',
                  step > s.id ? 'bg-[hsl(var(--accent))]' : 'bg-border')} />
              )}
            </div>
          ))}
        </div>

        {/* Step content card */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 lg:p-8">

          {/* ── Step 0: Pick service ── */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold font-heading mb-1">What service do you need?</h2>
                <p className="text-muted-foreground text-sm">Pick the service that fits your goal.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SERVICES.map(svc => (
                  <button key={svc.key} onClick={() => handleSelectService(svc.key)}
                    className={cn(
                      'text-left rounded-xl border-2 p-4 transition-all group',
                      selectedService === svc.key
                        ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5'
                        : 'border-border hover:border-[hsl(var(--primary))]/40 hover:bg-secondary/50'
                    )}>
                    <div className="flex items-center gap-3">
                      <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0', svc.gradient)}>
                        <svc.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm">{svc.label}</p>
                          {selectedService === svc.key && <CheckCircle2 className="w-4 h-4 text-[hsl(var(--primary))] shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{svc.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 1: Pick plan ── */}
          {step === 1 && serviceObj && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0', serviceObj.gradient)}>
                  <serviceObj.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-heading">{serviceObj.label}</h2>
                  <p className="text-muted-foreground text-sm">{serviceObj.desc}</p>
                </div>
              </div>
              <div className="space-y-3">
                {serviceObj.plans.map(plan => (
                  <button key={plan.slug} onClick={() => handleSelectPlan(plan)}
                    className={cn(
                      'w-full p-4 rounded-xl border-2 transition-all text-left',
                      selectedPlan?.slug === plan.slug
                        ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5'
                        : 'border-border hover:border-[hsl(var(--primary))]/40 hover:bg-secondary/50'
                    )}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-bold text-sm">{plan.name}</p>
                          {selectedPlan?.slug === plan.slug && <CheckCircle2 className="w-4 h-4 text-[hsl(var(--primary))] shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground">{plan.desc}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-[hsl(var(--primary))] text-sm">{plan.price}</p>
                        <p className="text-xs text-muted-foreground">{plan.priceNote}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: Contact details ── */}
          {step === 2 && (
            <form onSubmit={handleDetailsNext} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold font-heading mb-1">Your details</h2>
                <p className="text-muted-foreground text-sm">So we know who we're working with.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name <span className="text-destructive">*</span></Label>
                  <Input id="name" value={form.name} onChange={e => setFormField('name', e.target.value)}
                    placeholder="Your full name" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                  <Input id="email" type="email" value={form.email} onChange={e => setFormField('email', e.target.value)}
                    placeholder="you@example.com" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input id="phone" value={form.phone} onChange={e => setFormField('phone', e.target.value)}
                    placeholder="+265 …" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="country">Country</Label>
                  <Select value={form.country} onValueChange={v => setFormField('country', v)}>
                    <SelectTrigger id="country"><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="business">Business / brand name</Label>
                  <Input id="business" value={form.business_name} onChange={e => setFormField('business_name', e.target.value)}
                    placeholder="Your business name" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="notes">Additional notes</Label>
                  <Textarea id="notes" value={form.notes} onChange={e => setFormField('notes', e.target.value)}
                    placeholder="Anything we should know about your project…" rows={3} className="resize-none" />
                </div>
              </div>
              <button type="submit" className="hidden" />
            </form>
          )}

          {/* ── Step 3: Review ── */}
          {step === 3 && selectedPlan && serviceObj && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold font-heading mb-1">Review your order</h2>
                <p className="text-muted-foreground text-sm">Check everything before submitting.</p>
              </div>

              {/* Service + plan summary */}
              <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0', serviceObj.gradient)}>
                    <serviceObj.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{serviceObj.label}</p>
                    <p className="text-xs text-muted-foreground">{selectedPlan.name} · {selectedPlan.billing === 'once-off' ? 'one-off payment' : selectedPlan.priceNote}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[hsl(var(--primary))]">{selectedPlan.price}</p>
                    <p className="text-xs text-muted-foreground">{selectedPlan.priceNote}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-border/50 text-xs text-muted-foreground">
                  {selectedPlan.desc}
                </div>
              </div>

              {/* Contact summary */}
              <div className="rounded-xl border border-border p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Your details</p>
                {[
                  ['Name',     form.name],
                  ['Email',    form.email],
                  ['Phone',    form.phone],
                  ['Country',  form.country],
                  ['Business', form.business_name],
                  ['Notes',    form.notes],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} className="flex gap-3 text-sm">
                    <span className="text-muted-foreground w-20 shrink-0">{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>

              {/* Auth note */}
              {!user && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[hsl(var(--primary))]/5 border border-[hsl(var(--primary))]/15 text-sm">
                  <Lock className="w-4 h-4 text-[hsl(var(--primary))] mt-0.5 shrink-0" />
                  <p className="text-muted-foreground">
                    You'll be asked to <span className="font-semibold text-foreground">create a free account</span> to confirm and pay — takes 30 seconds.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation — identical pattern to CampaignWizard */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" className="gap-2"
            onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/')}>
            <ChevronLeft className="w-4 h-4" />
            {step === 0 ? 'Back' : 'Previous'}
          </Button>

          {step === 0 && (
            <Button onClick={() => selectedService && setStep(1)} disabled={!selectedService} className="gap-2">
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          )}
          {step === 1 && (
            <Button onClick={() => selectedPlan && setStep(2)} disabled={!selectedPlan} className="gap-2">
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          )}
          {step === 2 && (
            <Button onClick={handleDetailsNext} className="gap-2">
              Review order <ChevronRight className="w-4 h-4" />
            </Button>
          )}
          {step === 3 && (
            <Button onClick={handleSubmitOrder} disabled={submitting}
              className="gap-2 bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90 font-semibold">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <>Submit order <ArrowRight className="w-4 h-4" /></>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
