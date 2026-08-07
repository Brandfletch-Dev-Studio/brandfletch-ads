import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, ArrowRight, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { LOCAL_PRICES, AD_SPEND, ESTIMATED_REACH } from '@/lib/pricing';
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

  const monthlyPrice = dbRow?.monthly ?? local?.[pkg]?.monthly ?? 0;
  const monthlyDisplay = monthlyPrice ? `${symbol}${Number(monthlyPrice).toLocaleString()}` : 'Contact us';

  const adSpend = AD_SPEND[pkg];
  const reachDisplay = ESTIMATED_REACH[pkg];

  const features = [
    `$${adSpend}/day Meta ad spend`,
    `Total reach: ${reachDisplay}/month`,
    'Facebook & Instagram ads',
    'Campaign setup & management',
    'Performance dashboard',
  ];

  return (
    <div className={cn(
      'relative flex flex-col rounded-3xl overflow-hidden transition-all',
      isRecommended
        ? 'bg-gradient-to-br from-[#3B2FC9] to-[#5B4FE8] text-white shadow-2xl lg:scale-[1.05] border-2 border-white/20'
        : 'bg-[#13131F] border border-gray-800 text-white'
    )}>
      {isRecommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#4CAF50] text-white px-4 py-1 rounded-full text-xs font-black tracking-widest uppercase">
          Popular
        </div>
      )}

      <div className="p-7 flex flex-col flex-1">
        <span className={cn('text-xs font-bold uppercase tracking-widest', isRecommended ? 'text-white/70' : 'text-gray-500')}>
          {PKG_LABELS[pkg]}
        </span>
        <h3 className="text-3xl font-black mt-2 mb-1">
          {monthlyDisplay}<span className={cn('text-sm font-normal', isRecommended ? 'text-white/70' : 'text-gray-400')}>/mo</span>
        </h3>
        <p className={cn('text-sm font-semibold mb-6', isRecommended ? 'text-yellow-300' : 'text-[#4CAF50]')}>
          {pkg === 'starter' ? 'For small businesses' : pkg === 'growth' ? 'For growing businesses' : 'Maximum reach'}
        </p>

        <hr className={cn('mb-5', isRecommended ? 'border-white/10' : 'border-gray-800')} />

        <ul className="space-y-3 text-sm mb-7 flex-1">
          {features.map(f => (
            <li key={f} className="flex items-start gap-2.5">
              <Check className={cn('w-4 h-4 shrink-0 mt-0.5', isRecommended ? 'text-white' : 'text-[#4CAF50]')} strokeWidth={isRecommended ? 3 : 2} />
              <span className={isRecommended ? 'text-white' : 'text-gray-300'}>{f}</span>
            </li>
          ))}
        </ul>

        <Button
          onClick={() => onCta(pkg)}
          className={cn('w-full font-bold rounded-xl', isRecommended
            ? 'bg-white text-[#3B2FC9] hover:bg-gray-100'
            : 'border border-gray-700 hover:border-white bg-transparent text-white'
          )}
        >
          Get Started <ArrowRight className="ml-1.5 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function ComparisonTable({ dbPricing, country }) {
  const local = LOCAL_PRICES[country];
  const firstRow = dbPricing.find(r => r.country === country);
  const symbol = firstRow?.symbol || local?.symbol || 'MK';

  const rows = [
    { label: 'Daily Ad Budget', getVal: p => `$${AD_SPEND[p]}/day`, highlight: true },
    { label: 'Daily Price', getVal: p => {
      const pkgRow = dbPricing.find(r => r.country === country && r.package === p);
      const price = pkgRow?.daily ?? local?.[p]?.daily ?? 0;
      return price ? `${symbol}${Number(price).toLocaleString()}` : '—';
    }, highlight: true },
    { label: 'Weekly Price', getVal: p => {
      const pkgRow = dbPricing.find(r => r.country === country && r.package === p);
      const price = pkgRow?.weekly ?? local?.[p]?.weekly ?? 0;
      return price ? `${symbol}${Number(price).toLocaleString()}` : '—';
    }, highlight: true },
    { label: 'Monthly Price', getVal: p => {
      const pkgRow = dbPricing.find(r => r.country === country && r.package === p);
      const price = pkgRow?.monthly ?? local?.[p]?.monthly ?? 0;
      return price ? `${symbol}${Number(price).toLocaleString()}` : '—';
    }, highlight: true },
    { label: 'Total Monthly Reach', getVal: p => ESTIMATED_REACH[p] },
    { label: 'Facebook & Instagram Ads', getVal: () => '✓' },
    { label: 'Campaign Setup & Management', getVal: () => '✓' },
    { label: 'Performance Dashboard', getVal: () => '✓' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">What's included</th>
            {PKG_ORDER.map(pkg => (
              <th key={pkg} className={cn(
                'text-center py-4 px-4 text-sm font-bold',
                pkg === RECOMMENDED ? 'text-[#3B2FC9]' : 'text-foreground'
              )}>
                {PKG_LABELS[pkg]}
                {pkg === RECOMMENDED && <span className="block text-xs font-normal text-[#4CAF50]">Popular</span>}
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
    title:       'Pricing — Brandfletch Ads',
    description: 'Three packages. All include Meta ad spend and management. Pick your budget, we do the rest.',
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
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Hero */}
      <section className="bg-[#0A0A0F] text-white py-20 px-4 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#3B2FC9]/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative">
          <span className="text-xs font-bold uppercase tracking-wider text-white/60 bg-white/10 px-3 py-1 rounded-full">
            Pricing
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white mt-4 mb-4 leading-tight">
            Pick your budget. We do the rest.
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto text-lg">
            All packages include Meta ad spend and Brandfletch management. No hidden fees.
          </p>
        </div>
      </section>

      {/* Package Cards */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
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
        <p className="text-xs text-gray-500 text-center mt-6">
          Prices in your local currency. <Link to="/contact" className="text-[#4CAF50] underline">Contact us</Link> for custom requirements.
        </p>
      </section>

      {/* What your payment covers */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div className="bg-[#13131F] border border-gray-800 rounded-2xl p-7">
          <h2 className="text-xl font-bold text-white mb-5">What your payment covers</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-bold text-[#3B2FC9] mb-2">Meta Ad Spend</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Money paid to Facebook to promote your advert. Goes directly to Meta.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#4CAF50] mb-2">Brandfletch Management Fees</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                What you pay us to set up, launch, and manage your campaigns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <ComparisonTable dbPricing={dbRows} country={country} />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-br from-[#3B2FC9] to-[#5B4FE8] py-14 text-center px-4">
        <h2 className="text-2xl font-black text-white mb-3">Not sure which package?</h2>
        <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
          Talk to us. We'll look at what you're advertising and recommend what fits.
        </p>
        <Link to="/contact">
          <Button size="lg" className="bg-[#4CAF50] hover:bg-[#4CAF50]/90 text-white font-bold gap-2">
            <MessageSquare className="w-4 h-4" /> Talk to us
          </Button>
        </Link>
      </section>
    </div>
  );
}
