import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, Zap, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/api/base44Client';
import { LOCAL_PRICES, PACKAGES, DURATIONS } from '@/lib/pricing';
import { cn } from '@/lib/utils';

const COUNTRIES    = ['Malawi', 'Zambia', 'South Africa', 'Kenya', 'Tanzania'];
const CURRENCY_MAP = {
  Malawi:         { currency: 'MWK', symbol: 'MK' },
  Zambia:         { currency: 'ZMW', symbol: 'ZK' },
  'South Africa': { currency: 'ZAR', symbol: 'R' },
  Kenya:          { currency: 'KES', symbol: 'KSh' },
  Tanzania:       { currency: 'TZS', symbol: 'TSh' },
};

const PKG_ORDER    = ['starter', 'growth', 'business', 'premium'];
const DURATION_OPTS = [
  { key: 'monthly', label: 'Monthly' },
  { key: 'weekly',  label: 'Weekly' },
  { key: 'daily',   label: 'Daily' },
];

const PKG_FEATURES = {
  starter:    ['1 active campaign', 'Basic targeting', '3 ad creatives', 'Monthly performance report', 'Email support'],
  growth:     ['3 active campaigns', 'Advanced targeting', '8 ad creatives', 'Weekly reports', 'Priority email support', 'Audience insights'],
  business:   ['5 active campaigns', 'Custom audiences', '15 ad creatives', 'Daily reports', 'Dedicated account manager', 'A/B testing'],
  premium:    ['10 active campaigns', 'Lookalike audiences', 'Unlimited creatives', 'Real-time dashboard', '24/7 support', 'Monthly strategy call'],
};

const PKG_BADGE = {
  starter:  null,
  growth:   null,
  business: 'Most Popular',
  premium:  null,
};

const SERVICES = [
  { emoji: '🎬', title: 'UGC Ads',               desc: 'Content creator campaigns that build social proof and authentic brand connection.',           cta: 'Get a quote' },
  { emoji: '🎨', title: 'Graphic Design',         desc: 'Promotional posters, social creatives, flyers, and ad designs built for conversion.',        cta: 'Get a quote' },
  { emoji: '💻', title: 'Web Development',        desc: 'Websites that build trust, showcase your products, and unlock digital marketing.',            cta: 'Get a quote' },
  { emoji: '💳', title: 'Online Payments',        desc: 'Simple, reliable payment solutions including dollar-based options for your business.',        cta: 'Get a quote' },
  { emoji: '📱', title: 'Social Media Management',desc: 'Content strategy, planning, and consistency — so you stay visible while running your business.', cta: 'Get a quote' },
];

function fmt(n, symbol) {
  if (!n && n !== 0) return '—';
  return `${symbol}${Number(n).toLocaleString()}`;
}

export default function PricingPage() {
  const [country,  setCountry]  = useState('Malawi');
  const [duration, setDuration] = useState('monthly');
  const [dbPrices, setDbPrices] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    supabase
      .from('PackagePricing')
      .select('*')
      .then(({ data }) => { setDbPrices(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const getPrice = (pkg) => {
    // Try DB first
    const row = dbPrices.find(r => r.country === country && r.package === pkg);
    if (row && row[duration] != null && row[duration] > 0) {
      return { amount: row[duration], symbol: row.symbol || CURRENCY_MAP[country]?.symbol || '$' };
    }
    // Fallback to hardcoded
    const local = LOCAL_PRICES[country];
    if (local?.[pkg]?.[duration]) {
      return { amount: local[pkg][duration], symbol: local.symbol };
    }
    return null;
  };

  const { symbol } = CURRENCY_MAP[country] || { symbol: '$' };

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="bg-[hsl(var(--primary))] text-white py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(222,70%,6%)]" />
        <div className="relative max-w-3xl mx-auto px-4">
          <Badge className="mb-5 bg-white/10 text-white/80 border-white/20">Simple pricing</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold font-display mb-4">
            Transparent prices.<br />
            <span className="text-[hsl(var(--accent))]">Real value.</span>
          </h1>
          <p className="text-white/70 text-lg mb-8">No hidden fees. Pay in your local currency. Start and stop anytime.</p>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            {/* Country */}
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5 border border-white/20">
              <span className="text-white/60 text-sm">Country:</span>
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="bg-transparent text-white text-sm font-medium outline-none cursor-pointer"
              >
                {COUNTRIES.map(c => <option key={c} value={c} className="text-black">{c}</option>)}
              </select>
            </div>
            {/* Duration */}
            <div className="flex bg-white/10 rounded-xl border border-white/20 overflow-hidden">
              {DURATION_OPTS.map(d => (
                <button
                  key={d.key}
                  onClick={() => setDuration(d.key)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium transition-colors',
                    duration === d.key ? 'bg-[hsl(var(--accent))] text-white' : 'text-white/70 hover:text-white'
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Meta Ads Packages ────────────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/30">📣 Meta Ads Management</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold font-display">Facebook & Instagram Advertising Packages</h2>
            <p className="text-muted-foreground mt-2 text-sm">Prices shown in {CURRENCY_MAP[country]?.currency || 'USD'} · {DURATION_OPTS.find(d=>d.key===duration)?.label} billing</p>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => <div key={i} className="h-80 rounded-2xl bg-muted animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {PKG_ORDER.map(pkg => {
                const price = getPrice(pkg);
                const isPopular = PKG_BADGE[pkg];
                const info = PACKAGES[pkg];
                return (
                  <div key={pkg} className={cn(
                    'relative rounded-2xl border p-6 flex flex-col bg-card transition-all hover:shadow-lg',
                    isPopular
                      ? 'border-[hsl(var(--accent))] shadow-xl shadow-[hsl(var(--accent))]/10 ring-2 ring-[hsl(var(--accent))]/20'
                      : 'border-border hover:border-[hsl(var(--accent))]/30'
                  )}>
                    {isPopular && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[hsl(var(--accent))] text-white text-xs px-3 whitespace-nowrap">
                        ⭐ {isPopular}
                      </Badge>
                    )}
                    <h3 className="font-bold text-lg font-display capitalize mb-1">{info?.label || pkg}</h3>
                    <p className="text-xs text-muted-foreground mb-4">{info?.description}</p>
                    {price ? (
                      <div className="mb-5">
                        <span className="text-2xl font-bold font-display">{fmt(price.amount, price.symbol)}</span>
                        <span className="text-muted-foreground text-sm"> /{duration === 'daily' ? 'day' : duration === 'weekly' ? 'week' : 'month'}</span>
                      </div>
                    ) : (
                      <div className="mb-5">
                        <span className="text-lg font-semibold text-muted-foreground">Contact us</span>
                      </div>
                    )}
                    <ul className="space-y-2 mb-6 flex-1">
                      {(PKG_FEATURES[pkg] || []).map(f => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-[hsl(var(--accent))] mt-0.5 shrink-0" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link to="/register">
                      <Button
                        className={cn('w-full font-semibold', isPopular ? 'bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent))]/90' : '')}
                        variant={isPopular ? 'default' : 'outline'}
                      >
                        Get started
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Other Services ───────────────────────────────────────────────────── */}
      <section className="py-16 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/30">Other services</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold font-display">Custom-quoted solutions</h2>
            <p className="text-muted-foreground mt-2">These are tailored to your business needs. We'll discuss scope and provide a personalised quote.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map(s => (
              <div key={s.title} className="bg-card border border-border rounded-2xl p-5 flex flex-col hover:border-[hsl(var(--accent))]/30 hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{s.emoji}</span>
                  <h3 className="font-bold text-foreground">{s.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{s.desc}</p>
                <Link to="/contact" className="mt-4">
                  <Button variant="outline" size="sm" className="w-full">
                    {s.cta} <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-[hsl(var(--primary))] text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <MessageSquare className="w-10 h-10 mx-auto mb-4 text-[hsl(var(--accent))]" />
          <h2 className="text-3xl font-bold font-display mb-4">Not sure which package?</h2>
          <p className="text-white/70 mb-7 leading-relaxed">
            Start with a discovery conversation. We'll understand your goals and recommend exactly what makes sense for your business.
          </p>
          <Link to="/contact">
            <Button className="bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90 text-white font-bold px-8 h-11">
              Book a discovery call <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
