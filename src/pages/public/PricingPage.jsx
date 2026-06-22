import { Link } from 'react-router-dom';
import { Check, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

const COUNTRIES = ['Malawi','Zambia','South Africa','Kenya','Tanzania'];
const CURRENCY = {
  Malawi:       { sym: 'MK ',  code: 'MWK' },
  Zambia:       { sym: 'ZK ',  code: 'ZMW' },
  'South Africa': { sym: 'R ', code: 'ZAR' },
  Kenya:        { sym: 'KSh ', code: 'KES' },
  Tanzania:     { sym: 'TSh ', code: 'TZS' },
};
const RATES = { Malawi:1730, Zambia:26, 'South Africa':18.5, Kenya:129, Tanzania:2530 };

const PACKAGES = [
  { name:'Starter',    usd:29,  features:['1 active campaign','Basic targeting','3 ad creatives','Monthly report','Email support'], recommended:false },
  { name:'Growth',     usd:59,  features:['3 active campaigns','Advanced targeting','8 ad creatives','Weekly reports','Priority support','Audience Insights'], recommended:false },
  { name:'Business',   usd:99,  features:['5 active campaigns','Custom audiences','15 ad creatives','Daily reports','Dedicated manager','A/B testing'], recommended:true },
  { name:'Premium',    usd:199, features:['10 active campaigns','Lookalike audiences','Unlimited creatives','Real-time reports','24/7 support','Campaign strategy call'], recommended:false },
];

function fmt(n, sym) { return `${sym}${Number(n).toLocaleString()}`; }

export default function PricingPage() {
  const [country, setCountry] = useState('Malawi');
  const { sym } = CURRENCY[country];
  const rate = RATES[country];

  return (
    <div>
      {/* Hero */}
      <section className="bg-[hsl(var(--primary))] text-white py-20 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <Badge className="mb-5 bg-white/10 text-white/80 border-white/20">Simple pricing</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold font-display mb-4">
            Transparent prices.<br />
            <span className="text-[hsl(var(--accent))]">Real value.</span>
          </h1>
          <p className="text-white/70 text-lg mb-8">No hidden fees. Pay in your local currency. Cancel anytime.</p>
          {/* Country selector */}
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2 border border-white/20">
            <span className="text-white/60 text-sm">View prices in:</span>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="bg-transparent text-white text-sm font-medium outline-none cursor-pointer"
            >
              {COUNTRIES.map(c => <option key={c} value={c} className="text-black">{c}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PACKAGES.map(p => {
              const localPrice = Math.round(p.usd * rate);
              return (
                <div key={p.name} className={`relative rounded-2xl border p-6 flex flex-col ${p.recommended ? 'border-[hsl(var(--accent))] shadow-xl shadow-[hsl(var(--accent))]/10 ring-2 ring-[hsl(var(--accent))]/20' : 'border-border bg-card'}`}>
                  {p.recommended && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[hsl(var(--accent))] text-white px-3">Most Popular</Badge>
                  )}
                  <h3 className="font-bold text-lg font-display mb-1">{p.name}</h3>
                  <div className="mb-4">
                    <span className="text-2xl font-bold font-display text-foreground">{fmt(localPrice, sym)}</span>
                    <span className="text-muted-foreground text-sm">/month</span>
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {p.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-[hsl(var(--accent))] mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/register">
                    <Button className={`w-full font-semibold ${p.recommended ? 'bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent))]/90' : 'variant-outline'}`}
                      variant={p.recommended ? 'default' : 'outline'}>
                      Get started
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">
            Need something custom? <Link to="/contact" className="text-[hsl(var(--accent))] hover:underline">Talk to us →</Link>
          </p>
        </div>
      </section>

      {/* FAQ strip */}
      <section className="py-16 bg-secondary/30">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold font-display mb-3">Have questions?</h2>
          <p className="text-muted-foreground mb-6">Our team is happy to walk you through the right package for your business size and goals.</p>
          <Link to="/contact">
            <Button variant="outline" className="font-semibold">Contact us <ArrowRight className="ml-2 w-4 h-4" /></Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
