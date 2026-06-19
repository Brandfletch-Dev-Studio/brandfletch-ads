import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { LOCAL_PRICES, PACKAGES } from '@/lib/pricing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Megaphone, Video, Palette, Globe, Smartphone, ChevronRight, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'ads',     label: 'Ads',                icon: Megaphone,   emoji: '📢' },
  { id: 'ugc',     label: 'UGC Ads',            icon: Video,       emoji: '🎥' },
  { id: 'designs', label: 'Designs',            icon: Palette,     emoji: '🎨' },
  { id: 'web',     label: 'Web Development',    icon: Globe,       emoji: '💻' },
  { id: 'social',  label: 'Social Media',       icon: Smartphone,  emoji: '📱' },
];

const COUNTRIES_LIST = ['Malawi','Zambia','South Africa','Kenya','Tanzania'];
const CURRENCY_MAP = {
  Malawi: { currency:'MWK', symbol:'MK ' },
  Zambia: { currency:'ZMW', symbol:'ZK ' },
  'South Africa': { currency:'ZAR', symbol:'R ' },
  Kenya: { currency:'KES', symbol:'KSh ' },
  Tanzania: { currency:'TZS', symbol:'TSh ' },
};

function fmt(n, symbol='') {
  if (!n && n !== 0) return `${symbol}—`;
  return `${symbol}${Number(n).toLocaleString()}`;
}

function PricingCard({ name, price, period, currency, features, recommended, ctaLabel, onCta, description, badge, credits }) {
  return (
    <div className={cn(
      'relative flex flex-col rounded-2xl border bg-card transition-all duration-200',
      recommended
        ? 'border-primary shadow-xl shadow-primary/10 scale-[1.02] ring-2 ring-primary/20'
        : 'border-border hover:border-primary/30 hover:shadow-lg'
    )}>
      {recommended && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5">
            <Star className="w-3 h-3 fill-current" /> Most Popular
          </span>
        </div>
      )}
      <div className={cn('p-6 rounded-t-2xl', recommended ? 'bg-primary/5' : '')}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">{badge || 'Plan'}</p>
            <h3 className="text-xl font-bold text-foreground">{name}</h3>
          </div>
          {recommended && <Zap className="w-5 h-5 text-primary mt-1" />}
        </div>
        {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
        <div className="flex items-end gap-1 mb-1">
          <span className="text-3xl font-black text-foreground tracking-tight">{fmt(price, currency)}</span>
          {period && <span className="text-muted-foreground text-sm mb-1">/{period}</span>}
        </div>
        {credits > 0 && (
          <p className="text-xs text-primary font-semibold mt-1">{credits} credit{credits > 1 ? 's' : ''} · Never expire</p>
        )}
      </div>
      <div className="px-6 py-4 flex-1">
        <ul className="space-y-2.5">
          {(features || []).map((f, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80">
              <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </div>
      <div className="p-6 pt-2">
        <Button
          onClick={onCta}
          className={cn('w-full font-semibold', recommended ? '' : 'variant-outline')}
          variant={recommended ? 'default' : 'outline'}
          size="lg"
        >
          {ctaLabel || 'Get Started'} <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ── ADS TAB ─────────────────────────────────────────────────────────────────
function AdsTab({ country, dbPricing, onCta }) {
  const localP = LOCAL_PRICES[country] || LOCAL_PRICES['Malawi'];
  const sym = localP.symbol;
  const pkgRows = dbPricing.length > 0 ? dbPricing : null;

  const pkgs = ['starter','growth','business','premium'];
  return (
    <div>
      <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
        Run Facebook &amp; Instagram ads that reach your ideal customers. Pay only for the days your campaign runs.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {pkgs.map((pkg, i) => {
          const meta = PACKAGES[pkg];
          const row = pkgRows?.find(r => r.package === pkg && r.country === country);
          const monthly = row?.monthly || localP[pkg]?.monthly || 0;
          return (
            <PricingCard
              key={pkg}
              name={meta.label}
              price={monthly}
              period="month"
              currency={sym}
              description={meta.description}
              badge="Ads Package"
              recommended={pkg === 'growth'}
              features={[
                `${sym}${(row?.daily || localP[pkg]?.daily || 0).toLocaleString()} daily budget`,
                `${sym}${(row?.weekly || localP[pkg]?.weekly || 0).toLocaleString()} weekly budget`,
                'Facebook & Instagram placement',
                'Audience targeting included',
                pkg !== 'starter' ? 'Priority support' : 'Standard support',
                pkg === 'business' || pkg === 'premium' ? 'Custom creative strategy' : null,
                pkg === 'premium' ? 'Dedicated campaign manager' : null,
              ].filter(Boolean)}
              ctaLabel="Start Campaign"
              onCta={() => onCta('campaign')}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── UGC TAB ─────────────────────────────────────────────────────────────────
function UGCTab({ country, servicePricing, onCta }) {
  const sym = CURRENCY_MAP[country]?.symbol || 'MK ';
  const dbPlans = servicePricing.filter(p => p.service_type === 'ugc_ads' && p.country === country && p.is_active !== false);

  const fallback = [
    { plan_slug:'starter', plan_name:'Starter', monthly_price:75000, credits:1, features:['1 UGC Ad Credit','Professional creator content','Usage rights included','Delivered within 7 days'], is_popular:false },
    { plan_slug:'growth',  plan_name:'Growth',  monthly_price:150000, credits:3, features:['3 UGC Ad Credits','Creator Page Feature','Professional creator content','Usage rights included','Priority delivery'], is_popular:true },
    { plan_slug:'scale',   plan_name:'Scale',   monthly_price:450000, credits:10, features:['10 UGC Ad Credits','Creator Page Feature','Bulk discount','Dedicated creative brief','Priority delivery'], is_popular:false },
  ];
  const plans = dbPlans.length >= 2 ? dbPlans.sort((a,b) => (a.sort_order||0)-(b.sort_order||0)) : fallback;

  return (
    <div>
      <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-center mb-8 max-w-2xl mx-auto">
        <p className="text-sm font-semibold text-primary mb-1">💡 How UGC Credits Work</p>
        <p className="text-sm text-muted-foreground">UGC Ads are purchased as credits. Credits <strong>never expire</strong> and can be used whenever you need authentic creator content for your ads.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
        {plans.map(plan => (
          <PricingCard
            key={plan.plan_slug || plan.plan_name}
            name={plan.plan_name}
            price={plan.monthly_price}
            currency={sym}
            credits={plan.credits}
            badge="UGC Credits"
            recommended={plan.is_popular}
            features={plan.features || []}
            ctaLabel="Buy UGC Credits"
            onCta={() => onCta('ugc')}
          />
        ))}
      </div>
    </div>
  );
}

// ── DESIGNS TAB ──────────────────────────────────────────────────────────────
function DesignsTab({ country, designPricing, onCta }) {
  const sym = CURRENCY_MAP[country]?.symbol || 'MK ';
  const active = designPricing.filter(p => p.country === country && p.is_active !== false);

  const fallback = [
    { id:'f1', pricing_type:'per_design', price:25000, monthly_quota:null, max_revisions:2 },
    { id:'f2', pricing_type:'retainer',   price:85000, monthly_quota:5,    max_revisions:3 },
  ];
  const plans = active.length >= 1 ? active : fallback;

  return (
    <div>
      <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
        Professional graphics, flyers, social media content and brand visuals — crafted by our in-house designers.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
        {plans.map((plan, i) => (
          <PricingCard
            key={plan.id || i}
            name={plan.pricing_type === 'retainer' ? 'Design Retainer' : 'Per Design'}
            badge={plan.pricing_type === 'retainer' ? 'Monthly Plan' : 'One-Off'}
            price={plan.price}
            period={plan.pricing_type === 'retainer' ? 'month' : 'design'}
            currency={sym}
            recommended={plan.pricing_type === 'retainer'}
            features={plan.pricing_type === 'retainer' ? [
              `${plan.monthly_quota || 5} designs per month`,
              `${plan.max_revisions || 3} revisions per design`,
              'Social media posts, flyers, banners',
              'Dedicated designer',
              'Turnaround within 48 hours',
              'Commercial usage rights',
            ] : [
              'Single design request',
              `${plan.max_revisions || 2} revisions included`,
              'Social post, flyer, or banner',
              'Commercial usage rights',
              'Delivered within 3 business days',
            ]}
            ctaLabel="Order Design"
            onCta={() => onCta('design')}
          />
        ))}
      </div>
    </div>
  );
}

// ── WEB DEV TAB ──────────────────────────────────────────────────────────────
function WebDevTab({ country, servicePricing, onCta }) {
  const sym = CURRENCY_MAP[country]?.symbol || 'MK ';
  const dbPlans = servicePricing.filter(p => p.service_type === 'web_development' && p.country === country && p.is_active !== false);

  const fallback = [
    { plan_slug:'monthly', plan_name:'Monthly Website Plan', monthly_price:50000, annual_price:0, features:['Professional business website','Mobile responsive design','Monthly updates included','Hosting managed for you','SSL certificate','WhatsApp chat button'], is_popular:false },
    { plan_slug:'annual',  plan_name:'Annual Website Plan',  monthly_price:0,     annual_price:500000, features:['Everything in Monthly plan','Full year upfront — save 17%','Priority support','Custom domain setup','SEO optimisation included','Analytics dashboard'], is_popular:true },
  ];
  const plans = dbPlans.length >= 1 ? dbPlans.sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)) : fallback;

  return (
    <div>
      <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
        Get a professional website for your business — fully managed, mobile-ready, and built to convert visitors into customers.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
        {plans.map((plan, i) => (
          <PricingCard
            key={plan.plan_slug || i}
            name={plan.plan_name}
            price={plan.annual_price > 0 ? plan.annual_price : plan.monthly_price}
            period={plan.annual_price > 0 ? 'year' : 'month'}
            currency={sym}
            badge="Website"
            recommended={plan.is_popular}
            features={plan.features || []}
            ctaLabel="Get Website"
            onCta={() => onCta('web')}
          />
        ))}
      </div>
    </div>
  );
}

// ── SOCIAL MEDIA TAB ─────────────────────────────────────────────────────────
function SocialMediaTab({ country, servicePricing, onCta }) {
  const sym = CURRENCY_MAP[country]?.symbol || 'MK ';
  const dbPlans = servicePricing.filter(p => p.service_type === 'social_media_management' && p.country === country && p.is_active !== false);

  const fallback = [
    { plan_slug:'starter', plan_name:'Starter', monthly_price:150000, features:['15 posts per month','Facebook & Instagram','Content creation included','Basic hashtag strategy','Monthly report'], is_popular:false },
    { plan_slug:'growth',  plan_name:'Growth',  monthly_price:250000, features:['30 posts per month','Facebook, Instagram & TikTok','Dedicated account manager','Engagement monitoring','Story content included','Bi-weekly performance report'], is_popular:true },
  ];
  const plans = dbPlans.length >= 1 ? dbPlans.sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)) : fallback;

  return (
    <div>
      <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
        Let us handle your social media presence. Consistent, engaging content that grows your following and drives customers to your business.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
        {plans.map((plan, i) => (
          <PricingCard
            key={plan.plan_slug || i}
            name={plan.plan_name}
            price={plan.monthly_price}
            period="month"
            currency={sym}
            badge="Social Media"
            recommended={plan.is_popular}
            features={plan.features || []}
            ctaLabel={plan.cta_label || 'Get Started'}
            onCta={() => onCta('social')}
          />
        ))}
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('ads');
  const [country, setCountry] = useState('Malawi');
  const [dbPricing, setDbPricing] = useState([]);
  const [designPricing, setDesignPricing] = useState([]);
  const [servicePricing, setServicePricing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.PackagePricing.list().catch(() => []),
      base44.entities.DesignPricing.list().catch(() => []),
      base44.entities.ServicePricing.list().catch(() => []),
    ]).then(([pkg, des, svc]) => {
      setDbPricing(pkg);
      setDesignPricing(des);
      setServicePricing(svc);
      setLoading(false);
    });
    // Auto-detect country from profile or IP
    if (user?.country) {
      const match = COUNTRIES_LIST.find(c => c.toLowerCase() === user.country.toLowerCase());
      if (match) setCountry(match);
    } else {
      fetch('https://ipapi.co/json/').then(r => r.json()).then(d => {
        const match = COUNTRIES_LIST.find(c => c.toLowerCase() === (d.country_name || '').toLowerCase());
        if (match) setCountry(match);
      }).catch(() => {});
    }
  }, [user?.country]);

  function handleCta(serviceType) {
    if (!user) { navigate('/register'); return; }
    const routes = {
      campaign: '/campaigns/new',
      ugc: '/dashboard',
      design: '/designs',
      web: '/support-tickets',
      social: '/support-tickets',
    };
    navigate(routes[serviceType] || '/dashboard');
  }

  const activeTabMeta = TABS.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-background">

      {/* HERO */}
      <div className="bg-gradient-to-b from-primary/5 to-background border-b border-border/40 pt-16 pb-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-5">
            <Zap className="w-3.5 h-3.5" /> Transparent Pricing
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight mb-4">
            Choose the service that helps<br className="hidden sm:block" /> your business grow
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-6">
            From advertising and content creation to websites and social media management — choose the solution that fits your goals.
          </p>

          {/* Country selector */}
          <div className="inline-flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5 shadow-sm">
            <span className="text-sm text-muted-foreground">Pricing for:</span>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="text-sm font-semibold bg-transparent text-foreground focus:outline-none cursor-pointer"
            >
              {COUNTRIES_LIST.map(c => <option key={c} value={c}>{c} ({CURRENCY_MAP[c]?.currency})</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-hide gap-1 py-2">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-200 shrink-0',
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <span>{tab.emoji}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
                <span>{activeTabMeta?.emoji}</span> {activeTabMeta?.label}
              </h2>
            </div>

            {activeTab === 'ads'     && <AdsTab     country={country} dbPricing={dbPricing}       onCta={handleCta} />}
            {activeTab === 'ugc'     && <UGCTab     country={country} servicePricing={servicePricing} onCta={handleCta} />}
            {activeTab === 'designs' && <DesignsTab country={country} designPricing={designPricing}   onCta={handleCta} />}
            {activeTab === 'web'     && <WebDevTab  country={country} servicePricing={servicePricing} onCta={handleCta} />}
            {activeTab === 'social'  && <SocialMediaTab country={country} servicePricing={servicePricing} onCta={handleCta} />}
          </>
        )}
      </div>

      {/* BOTTOM CTA STRIP */}
      <div className="bg-primary/5 border-t border-primary/10 py-10 px-4 mt-4">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-xl font-bold text-foreground mb-2">Not sure which service to choose?</h3>
          <p className="text-muted-foreground text-sm mb-6">Talk to our team — we'll help you pick the right package for your business goals and budget.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button size="lg" onClick={() => navigate(user ? '/support-tickets' : '/register')}>
              Talk to Us <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate(user ? '/dashboard' : '/register')}>
              {user ? 'Go to Dashboard' : 'Create Free Account'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
