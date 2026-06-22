import { Link } from 'react-router-dom';
import { ArrowRight, Megaphone, Target, TrendingUp, Shield, Globe, Users, CheckCircle, Star, Zap, BarChart3, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const STATS = [
  { value: '500+', label: 'Active businesses' },
  { value: '5', label: 'African countries' },
  { value: '98%', label: 'Client satisfaction' },
  { value: '$2M+', label: 'Ad spend managed' },
];

const FEATURES = [
  { icon: Megaphone, title: 'Campaign Management', desc: 'Launch and manage Facebook & Instagram campaigns with our guided wizard. No experience needed.' },
  { icon: Target,    title: 'Precise Targeting',   desc: 'Reach your ideal customers by location, age, interests, and behaviours across Africa.' },
  { icon: TrendingUp,title: 'Real-time Analytics', desc: 'Track impressions, clicks, reach, and ROI from a single clean dashboard.' },
  { icon: Palette,   title: 'Creative Design',     desc: 'Professional ad creatives and UGC videos crafted by our in-house design team.' },
  { icon: Shield,    title: 'Local Payments',      desc: 'Pay with mobile money, bank transfer, or crypto. MWK, ZMW, KES, ZAR, TZS supported.' },
  { icon: Globe,     title: 'Africa-First',        desc: 'Built specifically for African markets — local insights, local support, local results.' },
];

const TESTIMONIALS = [
  { name: 'Grace M.', role: 'Restaurant Owner, Lilongwe', text: 'We doubled our foot traffic in 6 weeks. The campaign wizard is incredibly easy to use.', rating: 5 },
  { name: 'David K.', role: 'E-commerce, Nairobi',       text: 'Best ROI I\'ve seen from digital advertising. The targeting options are very precise.', rating: 5 },
  { name: 'Amara N.', role: 'Boutique Owner, Lusaka',    text: 'The design team made our ads look world-class. Our brand has never looked better.', rating: 5 },
];

const HOW = [
  { step: '01', title: 'Create an account',   desc: 'Sign up free in 60 seconds. No credit card required to get started.' },
  { step: '02', title: 'Build your campaign', desc: 'Use our wizard to set your goal, audience, budget, and upload your creative.' },
  { step: '03', title: 'Go live & grow',      desc: 'Approve your campaign, pay locally, and watch your business grow in real time.' },
];

export default function Home() {
  return (
    <div className="overflow-x-hidden">
      {/* ── HERO ── */}
      <section className="relative bg-[hsl(var(--primary))] text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(var(--primary))] to-[hsl(222,70%,8%)] opacity-90" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[hsl(var(--accent))]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
          <div className="max-w-3xl">
            <Badge className="mb-6 bg-[hsl(var(--accent))]/20 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/30 text-sm px-3 py-1">
              🚀 Now serving 5 African countries
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6">
              Advertise smarter.<br />
              <span className="text-[hsl(var(--accent))]">Grow faster.</span>
            </h1>
            <p className="text-xl text-white/70 mb-10 leading-relaxed max-w-2xl">
              Professional Facebook & Instagram campaign management built for African businesses.
              Local payments, expert creatives, real results — without the agency price tag.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/register">
                <Button size="lg" className="bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90 text-white font-bold text-base px-8 h-12">
                  Start for free <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent text-base h-12">
                  View pricing
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-white/40">No credit card required · Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-[hsl(var(--accent))] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <p className="text-3xl font-bold font-display">{s.value}</p>
              <p className="text-white/80 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/30">Everything you need</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground">
              One platform. Every tool you need.
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              From campaign creation to payment and reporting — we've built it all in one place.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="p-6 rounded-2xl border border-border bg-card hover:border-[hsl(var(--accent))]/30 hover:shadow-lg transition-all group">
                <div className="w-11 h-11 rounded-xl bg-[hsl(var(--accent))]/10 flex items-center justify-center mb-4 group-hover:bg-[hsl(var(--accent))]/20 transition-colors">
                  <f.icon className="w-5 h-5 text-[hsl(var(--accent))]" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 bg-[hsl(var(--primary))] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-white/10 text-white/80 border-white/20">Simple process</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold font-display">Up and running in minutes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW.map(h => (
              <div key={h.step} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--accent))]/20 flex items-center justify-center mx-auto mb-5">
                  <span className="text-2xl font-bold font-display text-[hsl(var(--accent))]">{h.step}</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{h.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/30">Testimonials</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold font-display">Trusted by businesses across Africa</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <div className="flex mb-3">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[hsl(var(--accent))] text-[hsl(var(--accent))]" />
                  ))}
                </div>
                <p className="text-foreground text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-sm text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-[hsl(var(--accent))]">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <Zap className="w-10 h-10 mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
            Ready to grow your business?
          </h2>
          <p className="text-white/80 mb-8 text-lg">
            Join hundreds of African businesses already running winning campaigns on Brandfletch Ads.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-white text-[hsl(var(--accent))] hover:bg-white/90 font-bold text-base px-10 h-12">
              Create free account <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
