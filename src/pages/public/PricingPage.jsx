import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ArrowRight, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase, base44 } from '@/api/base44Client';
import { LOCAL_PRICES, AD_SPEND, ESTIMATED_REACH } from '@/lib/pricing';
import { detectCountry } from '@/lib/geoCountry';
import { useAuth } from '@/lib/AuthContext';
import { useSEO } from '@/hooks/useSEO';

const DEFAULT_RATE = 5000;

// ── Pkg features (static descriptions for Meta Ads) ─────────────────────────
// Same perks across all packages — the service is identical, only the ad spend changes
const SHARED_PERKS = [
  'Advanced audience targeting',
  'Professional ad management',
  'Facebook & Instagram ads',
  'Ad creative design included',
  'Campaign setup & launch',
  'Performance reports',
  'Continuous optimisation',
  'No long-term contracts',
];

const META_PKG_BADGES = { starter: null, growth: 'Popular', business: 'Best Value', premium: null };

// ── Plan card ─────────────────────────────────────────────────────────────────
function PlanCard({ plan, popular, onCta }) {
  const content = (
    <div className={cn(
      'relative flex flex-col bg-card border rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg',
      popular ? 'border-[hsl(var(--accent))] shadow-md ring-1 ring-[hsl(var(--accent))]/30' : 'border-border'
    )}>
      {plan.badge && (
        <div className="absolute top-0 right-0">
          <Badge className="rounded-tl-none rounded-br-none rounded-tr-xl rounded-bl-xl bg-[hsl(var(--accent))] text-white text-[10px] font-bold px-3 py-1">
            {plan.badge}
          </Badge>
        </div>
      )}
      <div className={cn('h-1', popular ? 'bg-[hsl(var(--accent))]' : 'bg-muted')} />
      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-display font-bold text-lg text-foreground mb-1">{plan.name}</h3>
        <p className="text-xs font-semibold text-[hsl(var(--accent))] mb-3">
          Ad spend: {plan.adSpend}
        </p>
        <div className="mb-4">
          <span className="text-2xl font-extrabold text-foreground">{plan.price}</span>
          {plan.priceNote && <span className="text-sm text-muted-foreground ml-1">{plan.priceNote}</span>}
        </div>
        {plan.reach && (
          <p className="text-xs text-muted-foreground mb-4 pb-4 border-b border-border">
            Est. reach: {plan.reach} people/day
          </p>
        )}
        <ul className="space-y-2.5 flex-1 mb-6">
          {plan.features.map(f => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
              <Check className="w-4 h-4 text-[hsl(var(--accent))] flex-shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>
        <Button
          onClick={onCta}
          className={cn('w-full font-semibold', popular
            ? 'bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent))]/90'
            : 'bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90'
          )}
        >
          {plan.cta} <ArrowRight className="ml-1.5 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
  return content;
}

// ── USD → MWK calculator ──────────────────────────────────────────────────────
function DollarCalculator({ defaultRate }) {
  const [usd, setUsd] = useState('');
  const [rate, setRate] = useState(defaultRate || DEFAULT_RATE);
  const mwk = usd ? Math.round(parseFloat(usd) * rate) : null;

  useEffect(() => { if (defaultRate) setRate(defaultRate); }, [defaultRate]);

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-card border border-border rounded-2xl p-6">
        <label className="text-sm font-medium text-muted-foreground block mb-2">Amount (USD)</label>
        <div className="flex gap-3 items-center">
          <input
            type="number"
            value={usd}
            onChange={e => setUsd(e.target.value)}
            placeholder="Enter USD amount"
            className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]/40"
          />
          <span className="text-muted-foreground text-sm">× {rate.toLocaleString()}</span>
        </div>
        {mwk !== null && (
          <div className="mt-4 p-4 bg-[hsl(var(--accent))]/5 rounded-lg text-center">
            <span className="text-2xl font-extrabold text-foreground">MK {mwk.toLocaleString()}</span>
            <p className="text-xs text-muted-foreground mt-1">Approximate MWK equivalent</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Meta Ads section — pulls from DB ─────────────────────────────────────────
function MetaAdsPricing({ dbRows, loading, country, onPlanSelect }) {
  const PKG_ORDER = ['starter', 'growth', 'business', 'premium'];
  const DURATION_OPTS = [
    { key: 'monthly', label: 'Monthly' },
    { key: 'weekly',  label: 'Weekly' },
    { key: 'daily',   label: 'Daily'  },
  ];
  const [duration, setDuration] = useState('monthly');

  const countryRows = dbRows.filter(r => r.country === country);
  const symbol = countryRows[0]?.symbol || LOCAL_PRICES[country]?.symbol || 'MK';

  const packages = PKG_ORDER.map(pkg => {
    const dbRow = countryRows.find(r => r.package === pkg);
    const local  = LOCAL_PRICES[country]?.[pkg];
    const price  = dbRow?.[duration] ?? local?.[duration];
    const formatted = price ? `${symbol}${Number(price).toLocaleString()}` : 'Contact us';

    return {
      name:      pkg.charAt(0).toUpperCase() + pkg.slice(1),
      adSpend:   `$${AD_SPEND[pkg]}/day`,
      price:     formatted,
      priceNote: `/${duration}`,
      badge:     META_PKG_BADGES[pkg] || null,
      features:  SHARED_PERKS,
      reach:     ESTIMATED_REACH[pkg] || null,
      cta:       pkg === 'premium' ? 'Talk to us' : 'Get started',
      ctaLink:   pkg === 'premium' ? '/contact' : '/campaigns/new',
      pkgSlug:   pkg,
    };
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs font-semibold text-muted-foreground">Billing:</span>
          <div className="flex gap-1">
            {DURATION_OPTS.map(d => (
              <button key={d.key} onClick={() => setDuration(d.key)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                  duration === d.key
                    ? 'bg-[hsl(var(--accent))] text-white border-[hsl(var(--accent))]'
                    : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >{d.label}</button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading prices…</span>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {packages.map((p, i) => (
            <PlanCard
              key={p.name}
              plan={p}
              popular={p.badge?.toLowerCase().includes('pop') ?? false}
              onCta={() => onPlanSelect && onPlanSelect(p)}
            />
          ))}
        </div>
      )}

      {!loading && countryRows.length > 0 && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          Prices are managed by our team and updated in real time.
        </p>
      )}
      {!loading && countryRows.length === 0 && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          Showing standard pricing. <Link to="/contact" className="text-[hsl(var(--accent))] underline">Contact us</Link> for a custom quote.
        </p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PricingPage() {
  useSEO({
    title:       'Pricing — Brandfletch Ads Management Packages',
    description: 'Flexible Meta Ads management packages. Clear pricing in USD and MWK for African businesses.',
  });

  const { user } = useAuth();
  const navigate = useNavigate();
  const [country, setCountry] = useState('Malawi');
  const [dbRows, setDbRows] = useState([]);
  const [mwkRate, setMwkRate] = useState(DEFAULT_RATE);

  useEffect(() => {
    base44.entities.ExchangeRate.filter({ country: 'Malawi', is_active: true })
      .then(rows => { if (rows?.[0]?.rate_to_usd) setMwkRate(rows[0].rate_to_usd); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    supabase
      .from('PackagePricing')
      .select('*')
      .then(({ data }) => { if (data?.length) setDbRows(data); })
      .catch(() => {});

    detectCountry(user?.country).then(setCountry);
  }, [user?.country]);

  function handlePlanCta(plan) {
    const route = plan.ctaLink || '/campaigns/new';
    navigate(route);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-[hsl(var(--primary))] text-white py-16 px-4 text-center">
        <Badge className="mb-4 bg-white/10 text-white border-white/20 text-xs">Transparent pricing</Badge>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold mb-4 leading-tight">
          Simple, honest pricing
        </h1>
        <p className="text-white/60 max-w-xl mx-auto text-base">
          Professionally managed Meta Ads campaigns designed to generate qualified leads. Prices shown in your local currency.
        </p>
      </section>

      {/* Content */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {/* META ADS */}
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground mb-2">Meta Ads Management</h2>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            Professionally managed Facebook & Instagram campaigns designed to generate qualified leads. Prices shown in your local currency, detected automatically.
          </p>
          <Badge className="mt-3 text-[10px] bg-muted text-muted-foreground border-border">📅 Monthly, weekly, or daily billing</Badge>
        </div>
        <MetaAdsPricing
          dbRows={dbRows}
          loading={false}
          country={country}
          onPlanSelect={(plan) => handlePlanCta(plan)}
        />

        {/* USD → MWK Calculator */}
        <div className="mt-16 pt-10 border-t border-border">
          <div className="mb-10">
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground mb-2">USD → MWK Calculator</h2>
            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
              Quick reference for converting USD pricing to Malawian Kwacha at the current rate.
            </p>
          </div>
          <DollarCalculator defaultRate={mwkRate} />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-muted/40 border-t border-border py-14 text-center px-4">
        <h2 className="text-2xl font-display font-extrabold text-foreground mb-3">Not sure which package is right?</h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
          Start a conversation. We'll look at your goals and recommend exactly what you need — nothing more.
        </p>
        <Link to="/contact">
          <Button size="lg" className="bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90 font-semibold gap-2">
            <MessageSquare className="w-4 h-4" /> Start a discussion
          </Button>
        </Link>
      </section>
    </div>
  );
}
