import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, ArrowRight, MessageSquare, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { LOCAL_PRICES, AD_SPEND, ESTIMATED_REACH, PACKAGE_FEATURES, SHARED_FEATURES, calculatePriceFromList } from '@/lib/pricing';
import { detectCountry } from '@/lib/geoCountry';
import { useAuth } from '@/lib/AuthContext';
import { useSEO } from '@/hooks/useSEO';

const PKG_ORDER = ['starter', 'growth', 'premium'];
const PKG_LABELS = { starter: 'Starter', growth: 'Growth', premium: 'Premium' };
const RECOMMENDED = 'growth';

function PlanCard({ pkg, dbPricing, country, onCta }) {
  const isRecommended = pkg === RECOMMENDED;
  const dbRow = dbPricing.find(r => r.country === country && r.package === pkg);
  const local = LOCAL_PRICES[country];
  const symbol = dbRow?.symbol || local?.symbol || 'MK';

  // Get monthly price from DB or fallback
  const monthlyPrice = dbRow?.monthly ?? local?.[pkg]?.monthly ?? 0;
  const monthlyDisplay = monthlyPrice ? `${symbol}${Number(monthlyPrice).toLocaleString()}` : 'Contact us';

  const adSpend = AD_SPEND[pkg];
  const reach = ESTIMATED_REACH[pkg];
  const dbDeliverables = dbPricing.find(r => r.country === country);
  const pkgPrefix = pkg; // starter, growth, premium
  const dbCreatives = dbDeliverables?.[`${pkgPrefix}_creatives`] ?? PACKAGE_FEATURES[pkg].creatives;
  const dbVideos = dbDeliverables?.[`${pkgPrefix}_videos`] ?? PACKAGE_FEATURES[pkg].videos;
  const dbReachLow = dbDeliverables?.[`${pkgPrefix}_reach_low`];
  const dbReachHigh = dbDeliverables?.[`${pkgPrefix}_reach_high`];
  const reachDisplay = (dbReachLow && dbReachHigh)
    ? `${dbReachLow.toLocaleString()} – ${dbReachHigh.toLocaleString()}`
    : reach;

  const allFeatures = [
    'Facebook & Instagram Ads Management',
    `Estimated monthly reach: ${reachDisplay} people`,
    `${dbCreatives} marketing creatives`,
    `${dbVideos} promotional video${dbVideos > 1 ? 's' : ''}`,
    'Campaign setup and optimization',
    'Monthly performance report',
  ];

  return (
    <div className={cn(
      'relative flex flex-col bg-card border rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg',
      isRecommended
        ? 'border-[hsl(var(--accent))] shadow-md ring-1 ring-[hsl(var(--accent))]/30 lg:scale-[1.03]'
        : 'border-border'
    )}>
      {isRecommended && (
        <div className="absolute top-0 inset-x-0 bg-[hsl(var(--accent))] text-white text-center text-xs font-bold py-1.5">
          ⭐ Recommended
        </div>
      )}
      <div className={cn('h-1', isRecommended ? 'bg-[hsl(var(--accent))]' : 'bg-muted')} />

      <div className={cn('p-6 flex flex-col flex-1', isRecommended && 'pt-8')}>
        {/* Package name */}
        <h3 className="font-display font-bold text-lg text-foreground mb-3">{PKG_LABELS[pkg]} Package</h3>

        {/* Ad budget — HERO element */}
        <div className={cn(
          'rounded-xl p-4 mb-4 text-center',
          isRecommended ? 'bg-[hsl(var(--accent))]/10' : 'bg-muted/50'
        )}>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Advertising Budget</p>
          <p className={cn(
            'text-3xl font-display font-extrabold',
            isRecommended ? 'text-[hsl(var(--accent))]' : 'text-foreground'
          )}>
            ${adSpend}<span className="text-lg font-bold text-muted-foreground">/day</span>
          </p>
        </div>

        {/* Monthly price — second most visible */}
        <div className="text-center mb-1">
          <p className="text-2xl font-extrabold text-foreground">{monthlyDisplay}</p>
          <p className="text-sm text-muted-foreground">/month</p>
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-border" />

        {/* Features list */}
        <ul className="space-y-2.5 flex-1 mb-6">
          {allFeatures.map(f => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
              <Check className={cn('w-4 h-4 flex-shrink-0 mt-0.5', isRecommended ? 'text-[hsl(var(--accent))]' : 'text-[hsl(var(--primary))]}')} />
              {f}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Button
          onClick={() => onCta(pkg)}
          className={cn('w-full font-semibold', isRecommended
            ? 'bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent))]/90'
            : 'bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90'
          )}
        >
          Get Started <ArrowRight className="ml-1.5 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function ComparisonTable({ dbPricing, country }) {
  const dbRow = dbPricing.find(r => r.country === country);
  const local = LOCAL_PRICES[country];
  const symbol = dbRow?.symbol || local?.symbol || 'MK';

  const rows = [
    { label: 'Ad Budget', getVal: p => `$${AD_SPEND[p]}/day`, highlight: true },
    { label: 'Monthly Price', getVal: p => {
      const price = dbRow?.[`${p}_monthly`] ?? local?.[p]?.monthly ?? 0;
      return price ? `${symbol}${Number(price).toLocaleString()}` : '—';
    }, highlight: true },
    { label: 'Weekly Price', getVal: p => {
      const price = dbRow?.[`${p}_weekly`] ?? local?.[p]?.weekly ?? 0;
      return price ? `${symbol}${Number(price).toLocaleString()}` : '—';
    }},
    { label: 'Est. Monthly Reach', getVal: p => {
      const low = dbRow?.[`${p}_reach_low`];
      const high = dbRow?.[`${p}_reach_high`];
      if (low && high) return `${low.toLocaleString()} – ${high.toLocaleString()}`;
      return ESTIMATED_REACH[p];
    }, highlight: true },
    { label: 'Marketing Creatives', getVal: p => dbRow?.[`${p}_creatives`] ?? PACKAGE_FEATURES[p].creatives },
    { label: 'Promotional Videos', getVal: p => dbRow?.[`${p}_videos`] ?? PACKAGE_FEATURES[p].videos },
    { label: 'Facebook & Instagram Ads', getVal: () => '✓' },
    { label: 'Campaign Setup & Optimization', getVal: () => '✓' },
    { label: 'Monthly Performance Report', getVal: () => '✓' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Feature</th>
            {PKG_ORDER.map(pkg => (
              <th key={pkg} className={cn(
                'text-center py-4 px-4 text-sm font-bold',
                pkg === RECOMMENDED ? 'text-[hsl(var(--accent))]' : 'text-foreground'
              )}>
                {PKG_LABELS[pkg]}
                {pkg === RECOMMENDED && <span className="block text-xs font-normal text-[hsl(var(--accent))]">Recommended</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label} className={cn('border-b border-border/50', i % 2 === 0 && 'bg-muted/20')}>
              <td className="py-3 px-4 text-sm text-muted-foreground">{row.label}</td>
              {PKG_ORDER.map(pkg => (
                <td key={pkg} className={cn(
                  'text-center py-3 px-4 text-sm',
                  row.highlight ? 'font-bold text-foreground' : 'text-foreground'
                )}>
                  {row.getVal(pkg)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PricingPage() {
  useSEO({
    title:       'Pricing — Brandfletch Ads Management Packages',
    description: 'Transparent Meta Ads management packages. Choose your advertising budget and let us handle the rest.',
  });

  const { user } = useAuth();
  const navigate = useNavigate();
  const [country, setCountry] = useState('Malawi');
  const [dbRows, setDbRows] = useState([]);

  useEffect(() => {
    base44.entities.PackagePricing.list({})
      .then(rows => { if (rows?.length) setDbRows(rows); })
      .catch(() => {});

    detectCountry(user?.country).then(setCountry);
  }, [user?.country]);

  function handlePlanCta(pkg) {
    navigate('/campaigns/new');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-[hsl(var(--primary))] text-white py-16 px-4 text-center">
        <Badge className="mb-4 bg-white/10 text-white border-white/20 text-xs">Transparent pricing</Badge>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold mb-4 leading-tight">
          Choose your advertising budget
        </h1>
        <p className="text-white/60 max-w-xl mx-auto text-base">
          Professionally managed Meta Ads campaigns. Pick your daily ad budget — we handle everything else.
        </p>
      </section>

      {/* Package Cards */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
          {PKG_ORDER.map(pkg => (
            <PlanCard
              key={pkg}
              pkg={pkg}
              dbPricing={dbRows}
              country={country}
              onCta={handlePlanCta}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-6">
          Prices shown in your local currency. <Link to="/contact" className="text-[hsl(var(--accent))] underline">Contact us</Link> for custom requirements.
        </p>
      </section>

      {/* Comparison Table */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="text-center mb-8">
          <Badge className="mb-3 bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/20 text-xs">
            Compare packages
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground">
            Find the right fit
          </h2>
        </div>
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <ComparisonTable dbPricing={dbRows} country={country} />
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
