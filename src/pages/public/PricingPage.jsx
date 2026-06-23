import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, ArrowRight, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/api/base44Client';
import { LOCAL_PRICES } from '@/lib/pricing';

const DEFAULT_RATE = 5000;

const TABS = [
  { key: 'meta-ads',        label: 'Meta Ads' },
  { key: 'ugc-ads',         label: 'UGC Ads' },
  { key: 'graphic-design',  label: 'Graphic Design' },
  { key: 'web-design',      label: 'Web Design' },
  { key: 'social-media',    label: 'Social Media' },
  { key: 'online-payments', label: 'Online Payments' },
];

// ── Static plans (non-Meta-Ads services) ─────────────────────────────────────
const STATIC_PLANS = {
  'ugc-ads': {
    title: 'UGC Ads — Brandfletch Studios',
    desc: "We don't just create videos. We create UGC ads designed to help businesses attract customers. Every creative is built Meta Ads-ready.",
    billing: 'one-off',
    included: [
      'Content creator matching',
      'Feature on Brandfletch Studios network',
      'Creator social media feature',
      'Brand story development',
      'Offer packaging',
      'Meta Ads-ready creatives (hooks, messaging, conversion structure)',
    ],
    packages: [
      {
        name: 'Starter',
        price: 'MK 100,000',
        priceNote: 'per campaign',
        badge: null,
        features: ['1 UGC ad creative','Creator matching','Brand story development','Offer packaging session','Meta Ads-ready format','Creator social media feature'],
        cta: 'Place order', ctaLink: '/register',
      },
      {
        name: 'Growth',
        price: 'MK 250,000',
        priceNote: 'per campaign',
        badge: 'Best value',
        features: ['3 UGC ad creatives','Multiple message angles','Creator matching','Full brand story development','Offer packaging session','Meta Ads-ready formats','Creator social media feature','A/B testing angles'],
        cta: 'Place order', ctaLink: '/register',
      },
      {
        name: 'Brand Campaign',
        price: 'MK 750,000',
        priceNote: 'per campaign',
        badge: 'Scaling brands',
        features: ['10 UGC ad creatives','Full advertising content library','Multiple creators','Complete brand story development','Offer packaging session','Meta Ads-ready formats','Creator social media features','Designed for scaling campaigns'],
        cta: 'Place order', ctaLink: '/register',
      },
    ],
  },
  'graphic-design': {
    title: 'Graphic Design — Retainer Packages',
    desc: 'Consistent, professional design output on a monthly retainer. One-off projects also available — contact us for a quote.',
    billing: 'monthly',
    packages: [
      {
        name: 'Starter',
        price: 'MK 100,000', priceNote: '/month', badge: null,
        features: ['10 design requests/month','Static designs only','Posters, flyers, social posts, banners','1 concurrent request','24–48 hour turnaround','Revisions included'],
        cta: 'Get started', ctaLink: '/register',
      },
      {
        name: 'Growth',
        price: 'MK 180,000', priceNote: '/month', badge: 'Most popular',
        features: ['15 design requests/month','Static designs + motion graphics','Animated posts, simple GIFs','2 concurrent requests','12–24 hour turnaround','1–2 short video edits/month','Priority queue'],
        cta: 'Get started', ctaLink: '/register',
      },
      {
        name: 'Premium',
        price: 'MK 280,000', priceNote: '/month', badge: null,
        features: ['20 design requests/month','Full suite: static, motion & video','3 concurrent requests','6–12 hour priority turnaround','Unlimited video content (within cap)','Brand consistency management','Dedicated designer'],
        cta: 'Get started', ctaLink: '/register',
      },
    ],
  },
  'web-design': {
    title: 'Web Design & Development — Brandfletch Designs',
    desc: 'Websites designed around business growth — not just being online. Every package is built to attract and convert visitors into customers.',
    billing: 'one-off',
    packages: [
      {
        name: 'Starter Website',
        price: 'MK 150,000', priceNote: 'one-off', badge: null,
        features: ['Up to 5 pages','Professional business website','Mobile responsive design','Contact form','WhatsApp integration','Basic SEO setup','Social media links','Website launch support'],
        cta: 'Place order', ctaLink: '/register',
        ideal: 'Small businesses, personal brands & startups',
      },
      {
        name: 'Growth Website',
        price: 'MK 350,000', priceNote: 'one-off', badge: 'Most popular',
        features: ['Up to 10 pages','Custom website design','Modern UI/UX','Lead capture forms','WhatsApp/business integrations','Blog/news section','SEO optimisation','Analytics setup','Conversion-focused structure'],
        cta: 'Place order', ctaLink: '/register',
        ideal: 'Growing businesses that need more than just a website',
      },
      {
        name: 'Business Pro',
        price: 'MK 750,000', priceNote: 'one-off', badge: 'Serious brands',
        features: ['Unlimited pages','Fully custom design','Advanced UI/UX','Booking systems / custom features','E-commerce functionality','Payment integrations','Advanced SEO','Speed optimisation','Analytics + tracking','Priority support'],
        cta: 'Place order', ctaLink: '/register',
        ideal: 'Established businesses & brands',
      },
    ],
    customNote: {
      title: 'Need a web app, LMS, marketplace, or complex system?',
      desc: "These go far beyond standard website pricing. We build them — let's talk scope and pricing.",
      cta: 'Request a custom quote',
      link: '/contact',
    },
  },
  'social-media': {
    title: 'Social Media Management — Brandfletch Media',
    desc: 'We help businesses stay visible, build trust, and turn social media into a real growth channel.',
    billing: 'monthly',
    packages: [
      {
        name: 'Starter',
        price: 'MK 150,000', priceNote: '/month', badge: null,
        features: ['16 branded posts/month','Social media page management','Content planning','Caption writing','Content scheduling','Basic community management','Monthly performance insights'],
        cta: 'Get started', ctaLink: '/register',
        ideal: 'Businesses that need consistency and a professional presence',
      },
      {
        name: 'Growth',
        price: 'MK 300,000', priceNote: '/month', badge: 'Popular',
        features: ['32 branded posts/month','Full social media management','Content strategy','Short-form content / Reels','Caption & CTA optimisation','Audience engagement','Monthly content calendar','Performance report'],
        cta: 'Get started', ctaLink: '/register',
        ideal: 'Businesses actively growing their online presence',
      },
      {
        name: 'Brand Growth',
        price: 'MK 450,000', priceNote: '/month', badge: 'Full service',
        features: ['60+ monthly content pieces','Full social media management','Reels/short-form videos','Brand storytelling','Content campaigns','Community management','Growth strategy','Analytics & optimisation'],
        cta: 'Get started', ctaLink: '/register',
        ideal: 'Brands that want social media as a marketing channel',
      },
    ],
  },
};

// ── Pkg features (static descriptions for Meta Ads) ─────────────────────────
const META_PKG_FEATURES = {
  starter:  ['1 active campaign','Basic audience targeting','3 ad creatives/month','Monthly performance report','Email support','Campaign setup & launch'],
  growth:   ['3 active campaigns','Advanced audience targeting','8 ad creatives/month','Weekly performance reports','Priority support','Audience insights & A/B testing','Retargeting campaigns'],
  business: ['5 active campaigns','Custom audiences','15 ad creatives/month','Daily reports','Dedicated account manager','A/B testing','Lookalike audiences'],
  premium:  ['10 active campaigns','Lookalike & custom audiences','Unlimited ad creatives','Real-time performance dashboard','Dedicated account manager','24/7 priority support','Monthly strategy call','Full funnel campaign management'],
};

const META_PKG_BADGES = { starter: null, growth: 'Popular', business: 'Most Popular', premium: null };

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
        <div className="mb-4">
          <span className="text-2xl font-extrabold text-foreground">{plan.price}</span>
          {plan.priceNote && <span className="text-sm text-muted-foreground ml-1">{plan.priceNote}</span>}
        </div>
        {plan.ideal && (
          <p className="text-xs text-muted-foreground italic mb-4 pb-4 border-b border-border">{plan.ideal}</p>
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
    <div className="max-w-xl mx-auto">
      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
        <h3 className="font-display font-bold text-xl text-foreground mb-2">Dollar → MWK Calculator</h3>
        <p className="text-sm text-muted-foreground mb-6">Enter a USD amount to see the MWK equivalent at our current rate.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">$</span>
              <input type="number" min="0" step="0.01" value={usd} onChange={e => setUsd(e.target.value)}
                placeholder="e.g. 50"
                className="w-full pl-8 pr-4 py-3 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]/40" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Exchange rate (MK per $1)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">MK</span>
              <input type="number" min="1" value={rate} onChange={e => setRate(parseFloat(e.target.value) || DEFAULT_RATE)}
                className="w-full pl-9 pr-4 py-3 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]/40" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Rate managed in admin settings.</p>
          </div>
          {mwk !== null && !isNaN(mwk) && (
            <div className="bg-[hsl(var(--accent))]/10 border border-[hsl(var(--accent))]/20 rounded-xl p-5 text-center">
              <p className="text-xs text-muted-foreground mb-1">You will pay approximately</p>
              <p className="text-3xl font-display font-extrabold text-[hsl(var(--accent))]">MK {mwk.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">for ${parseFloat(usd).toFixed(2)} USD at MK {rate.toLocaleString()}/USD</p>
            </div>
          )}
        </div>
        <div className="mt-6 pt-5 border-t border-border">
          <p className="text-xs text-muted-foreground mb-3">Need to make a payment or set up online payment access?</p>
          <Link to="/contact">
            <Button variant="outline" size="sm" className="w-full gap-2">
              <MessageSquare className="w-4 h-4" /> Start a discussion
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Meta Ads section — pulls from DB ─────────────────────────────────────────
function MetaAdsPricing({ dbRows, loading, country, onCountryChange, onPlanSelect }) {
  const COUNTRIES = ['Malawi', 'Zambia', 'South Africa', 'Kenya', 'Tanzania'];
  const PKG_ORDER = ['starter', 'growth', 'business', 'premium'];
  const DURATION_OPTS = [
    { key: 'monthly', label: 'Monthly' },
    { key: 'weekly',  label: 'Weekly' },
    { key: 'daily',   label: 'Daily'  },
  ];
  const [duration, setDuration] = useState('monthly');

  // Get rows for current country
  const countryRows = dbRows.filter(r => r.country === country);
  const symbol = countryRows[0]?.symbol || LOCAL_PRICES[country]?.symbol || 'MK';

  // Build packages — DB rows take priority, fall back to LOCAL_PRICES
  const packages = PKG_ORDER.map(pkg => {
    const dbRow = countryRows.find(r => r.package === pkg);
    const local  = LOCAL_PRICES[country]?.[pkg];
    const price  = dbRow?.[duration] ?? local?.[duration];
    const formatted = price ? `${symbol}${Number(price).toLocaleString()}` : 'Contact us';

    return {
      name:      pkg.charAt(0).toUpperCase() + pkg.slice(1),
      price:     formatted,
      priceNote: `/${duration}`,
      badge:     META_PKG_BADGES[pkg] || null,
      features:  META_PKG_FEATURES[pkg] || [],
      cta:       pkg === 'premium' ? 'Talk to us' : 'Get started',
      ctaLink:   pkg === 'premium' ? '/contact' : `/register?service=meta-ads&package=${pkg}&duration=${duration}`,
      pkgSlug:   pkg,
    };
  });

  return (
    <div>
      {/* Country + Duration selectors */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Country:</span>
          <div className="flex flex-wrap gap-1">
            {COUNTRIES.map(c => (
              <button key={c} onClick={() => onCountryChange(c)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                  country === c
                    ? 'bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]'
                    : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >{c}</button>
            ))}
          </div>
        </div>
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

      {/* Source notice */}
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const navigate = useNavigate();
  const [activeTab,  setActiveTab]  = useState('meta-ads');
  const [country,    setCountry]    = useState('Malawi');
  const [dbRows,     setDbRows]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [mwkRate,    setMwkRate]    = useState(DEFAULT_RATE);
  const [authedUser, setAuthedUser] = useState(null); // null = unknown, false = guest, object = logged in

  // Fetch Meta Ads prices + MWK exchange rate from DB
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // PackagePricing rows
        const { data: prices } = await supabase
          .from('PackagePricing')
          .select('*')
          .order('package');
        if (prices?.length) setDbRows(prices);

        // ExchangeRate — look for MWK
        const { data: rates } = await supabase
          .from('ExchangeRate')
          .select('*')
          .eq('currency_code', 'MWK')
          .eq('is_active', true)
          .limit(1);
        if (rates?.[0]?.rate_to_usd) {
          // rate_to_usd means how many MWK = 1 USD
          setMwkRate(parseFloat(rates[0].rate_to_usd));
        }
      } catch (e) {
        console.warn('Pricing fetch failed, using defaults', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    // Check if user is already logged in — affects CTA destinations
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthedUser(session?.user || false);
    });
  }, []);

  // Smart CTA handler — auth-aware routing for all plan types
  function handlePlanCta(serviceType, plan) {
    const isLoggedIn = !!authedUser;

    if (serviceType === 'meta-ads') {
      if (isLoggedIn) {
        // Pre-select package + duration in the campaign wizard
        const params = new URLSearchParams();
        if (plan.pkgSlug) params.set('package', plan.pkgSlug);
        navigate(`/campaigns/new${params.toString() ? '?' + params.toString() : ''}`);
      } else {
        // Guest — send to register, preserve package intent
        const slug = plan.pkgSlug || '';
        navigate(`/register${slug ? '?service=meta-ads&package=' + slug : ''}`);
      }
      return;
    }

    // UGC Ads — dedicated ordering page
    if (serviceType === 'ugc-ads') {
      navigate(isLoggedIn ? '/ugc-ads' : '/register?service=ugc-ads');
      return;
    }

    // All other services — logged-in users go to support to place order
    if (isLoggedIn) {
      navigate('/support');
    } else {
      navigate('/register');
    }
  }

  const service = STATIC_PLANS[activeTab];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-[hsl(var(--primary))] text-white py-16 px-4 text-center">
        <Badge className="mb-4 bg-white/10 text-white border-white/20 text-xs">Transparent pricing</Badge>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold mb-4 leading-tight">
          Simple, honest pricing
        </h1>
        <p className="text-white/60 max-w-xl mx-auto text-base">
          Every service priced clearly. Pick the tab for the service you need — or mix and match to build your complete growth package.
        </p>
      </section>

      {/* Sticky tab bar */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 overflow-x-auto">
          <div className="flex gap-1 py-2 min-w-max">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={cn('px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                  activeTab === t.key
                    ? 'bg-[hsl(var(--primary))] text-white shadow'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

        {/* ── META ADS (DB-driven) ── */}
        {activeTab === 'meta-ads' && (
          <>
            <div className="mb-10">
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground mb-2">Meta Ads Management</h2>
              <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
                Professionally managed Facebook & Instagram campaigns designed to generate qualified leads. Prices shown per country — select yours below.
              </p>
              <Badge className="mt-3 text-[10px] bg-muted text-muted-foreground border-border">📅 Monthly, weekly, or daily billing</Badge>
            </div>
            <MetaAdsPricing
              dbRows={dbRows}
              loading={loading}
              country={country}
              onCountryChange={setCountry}
              onPlanSelect={(plan) => handlePlanCta('meta-ads', plan)}
            />
          </>
        )}

        {/* ── ONLINE PAYMENTS (calculator) ── */}
        {activeTab === 'online-payments' && (
          <>
            <div className="mb-10">
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground mb-2">Online Payments</h2>
              <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
                Simple, reliable access to online payment solutions — including dollar-based options. Use the calculator to see your MWK equivalent.
              </p>
            </div>
            <DollarCalculator defaultRate={mwkRate} />
          </>
        )}

        {/* ── STATIC SERVICES ── */}
        {service && (
          <>
            <div className="mb-10">
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground mb-2">{service.title}</h2>
              <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">{service.desc}</p>
              {service.billing && (
                <Badge className="mt-3 text-[10px] bg-muted text-muted-foreground border-border capitalize">
                  {service.billing === 'monthly' ? '📅 Monthly retainer' : '✅ One-off payment'}
                </Badge>
              )}
            </div>

            {/* UGC included list */}
            {service.included && (
              <div className="mb-10 bg-[hsl(var(--accent))]/5 border border-[hsl(var(--accent))]/20 rounded-2xl p-6">
                <p className="text-sm font-bold text-foreground mb-4">Every UGC package includes:</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {service.included.map(f => (
                    <div key={f} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[hsl(var(--accent))] flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {service.packages.map(plan => (
                <PlanCard
                  key={plan.name}
                  plan={plan}
                  popular={plan.badge?.toLowerCase().includes('pop') ?? false}
                  onCta={() => handlePlanCta(activeTab, plan)}
                />
              ))}
            </div>

            {service.customNote && (
              <div className="mt-8 bg-muted border border-border rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-foreground text-sm mb-1">{service.customNote.title}</p>
                  <p className="text-xs text-muted-foreground">{service.customNote.desc}</p>
                </div>
                <Link to={service.customNote.link} className="flex-shrink-0">
                  <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap">
                    <MessageSquare className="w-4 h-4" /> {service.customNote.cta}
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
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
