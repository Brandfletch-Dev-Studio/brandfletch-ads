import { Link } from 'react-router-dom';
import {
  ArrowRight, Megaphone, Video, Palette, Globe, CreditCard,
  Smartphone, CheckCircle, TrendingUp, Target, Users, Zap, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const SERVICES = [
  {
    id: 'meta-ads',
    icon: Megaphone,
    title: 'Meta Ads Management',
    tagline: 'Your customers are already on Facebook & Instagram.',
    body: 'We run professionally managed advertising campaigns designed to generate qualified leads, increase visibility, and drive measurable action for your business.',
    color: 'from-blue-600 to-blue-800',
    accent: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  {
    id: 'ugc-ads',
    icon: Video,
    title: 'UGC Ad Creatives',
    tagline: 'People trust people — not brands.',
    body: 'We match your brand with creators who craft authentic stories that convert. Every creative is built Meta Ads-ready with attention-grabbing hooks and conversion-focused structure.',
    color: 'from-purple-600 to-purple-800',
    accent: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    dot: 'bg-purple-500',
  },
  {
    id: 'graphic-design',
    icon: Palette,
    title: 'Graphic Design',
    tagline: 'First impressions drive decisions.',
    body: 'From social creatives to ad designs — every piece is built to communicate value and drive action. Retainer packages for consistent output or one-off projects.',
    color: 'from-pink-600 to-rose-700',
    accent: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    dot: 'bg-pink-500',
  },
  {
    id: 'web-dev',
    icon: Globe,
    title: 'Web Design & Development',
    tagline: 'A professional online presence changes everything.',
    body: 'We build websites that become growth tools — conversion-focused, mobile-ready, and built to turn visitors into leads. From starter sites to full digital platforms.',
    color: 'from-teal-600 to-teal-800',
    accent: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    dot: 'bg-teal-500',
  },
  {
    id: 'social-media',
    icon: Smartphone,
    title: 'Social Media Management',
    tagline: 'Stay visible while you run your business.',
    body: 'Content strategy, branded posts, Reels, and community management — handled consistently so your social presence becomes a real marketing channel.',
    color: 'from-orange-500 to-orange-700',
    accent: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    dot: 'bg-orange-500',
  },
  {
    id: 'online-payments',
    icon: CreditCard,
    title: 'Online Payments',
    tagline: 'Online payments, simplified.',
    body: 'Practical payment solutions for businesses and individuals — including dollar-based options and MWK conversions at competitive rates for specific transactions.',
    color: 'from-green-600 to-emerald-700',
    accent: 'bg-green-500/10 text-green-600 dark:text-green-400',
    dot: 'bg-green-500',
  },
];

const STATS = [
  { value: '500+', label: 'Businesses served' },
  { value: '6',    label: 'Core services' },
  { value: '5',    label: 'African countries' },
  { value: '98%',  label: 'Client satisfaction' },
];

const HOW = [
  { step: '01', title: 'Book a discovery call', desc: 'We understand your business, your offer, and your growth goals.' },
  { step: '02', title: 'We build your strategy', desc: 'Campaigns, creatives, and content — all designed around your target customer.' },
  { step: '03', title: 'We launch & optimise', desc: 'Your campaigns go live. We track performance and iterate for maximum results.' },
  { step: '04', title: 'You track everything', desc: 'Real-time updates in your client dashboard — see exactly what we\'re doing and how it\'s performing.' },
];

export default function Home() {
  return (
    <div className="flex flex-col">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[hsl(var(--primary))] text-white">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.15) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
        {/* Glow orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[hsl(var(--accent))]/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 right-0 w-80 h-80 bg-[hsl(var(--accent))]/10 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
          <Badge className="mb-5 bg-white/10 text-white border-white/20 hover:bg-white/10 text-xs font-medium px-3 py-1">
            🚀 Advertising & Marketing for African Businesses
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold leading-[1.1] tracking-tight mb-6">
            Advertising campaigns that{' '}
            <span className="text-[hsl(var(--accent))]">generate leads</span>
            <br className="hidden sm:block" /> for your business
          </h1>

          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed mb-4">
            We create Meta Ads-ready creatives built to maximise attention, trust, and conversions — backed by UGC content, professional design, and full social media management.
          </p>
          <p className="text-sm text-white/50 max-w-xl mx-auto mb-10">
            The real transformation: <span className="text-white/70 font-medium">Business offer → Better packaging → Story → UGC creative → Meta Ads ready → More qualified leads.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register">
              <Button size="lg" className="bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent))]/90 font-bold px-8 h-12 text-base shadow-lg">
                Get started <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-white/25 text-white bg-white/5 hover:bg-white/10 font-semibold px-8 h-12 text-base">
                Start a discussion
              </Button>
            </Link>
          </div>

          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-white/10 pt-10">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-display font-extrabold text-white">{s.value}</p>
                <p className="text-xs text-white/50 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LEAD GEN PITCH ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/20 text-xs">
                Why Brandfletch Media
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-foreground leading-tight mb-5">
                Lead generation isn't just ads.<br />
                <span className="text-[hsl(var(--accent))]">It's the whole system.</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Most businesses don't fail at running ads — they fail at the pieces around it. A weak creative. An unclear offer. No trust signal. We solve all of that. The advertising campaign is the engine, and every other service we offer is what makes it run.
              </p>
              <ul className="space-y-3">
                {[
                  { icon: Target, text: 'UGC creatives that build trust before the click' },
                  { icon: Palette, text: 'Designs that communicate value at a glance' },
                  { icon: Globe, text: 'Websites that convert visitors into leads' },
                  { icon: Smartphone, text: 'Social media that keeps your brand visible' },
                  { icon: TrendingUp, text: 'Ads that put it all in front of the right people' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-[hsl(var(--accent))]/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3 h-3 text-[hsl(var(--accent))]" />
                    </span>
                    <span className="text-sm text-foreground">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Offer Packaging', desc: 'Your product becomes something customers actually want' },
                { label: 'Brand Story', desc: 'Turn your business into content people connect with' },
                { label: 'Meta Ads Ready', desc: 'Every creative built with hooks & conversion structure' },
                { label: 'Qualified Leads', desc: 'The right people reaching out, not just traffic' },
              ].map(c => (
                <div key={c.label} className="bg-card border border-border rounded-xl p-4">
                  <div className="w-8 h-8 rounded-lg bg-[hsl(var(--accent))]/10 flex items-center justify-center mb-3">
                    <CheckCircle className="w-4 h-4 text-[hsl(var(--accent))]" />
                  </div>
                  <p className="font-semibold text-sm text-foreground mb-1">{c.label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/20 text-xs">
              Our Services
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-foreground">
              Everything your brand needs to grow
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto text-sm">
              Six focused services — each one designed to support the next, all working toward more customers for your business.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.id} className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:border-[hsl(var(--accent))]/30 transition-all duration-300">
                  <div className={`h-1 bg-gradient-to-r ${s.color}`} />
                  <div className="p-6">
                    <div className={`w-11 h-11 rounded-xl ${s.accent} flex items-center justify-center mb-4`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base text-foreground mb-1">{s.title}</h3>
                    <p className="text-xs font-semibold text-[hsl(var(--accent))] mb-3 italic">{s.tagline}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{s.body}</p>
                    <Link to="/pricing">
                      <button className="text-xs font-semibold text-[hsl(var(--accent))] hover:underline flex items-center gap-1">
                        See pricing <ArrowRight className="w-3 h-3" />
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/20 text-xs">
              How it works
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-foreground">
              From discovery to results
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW.map((h, i) => (
              <div key={h.step} className="relative">
                {i < HOW.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-[calc(100%-0px)] w-full h-px bg-border z-0" />
                )}
                <div className="relative z-10 bg-card border border-border rounded-xl p-5">
                  <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary))] text-white flex items-center justify-center text-xs font-bold mb-4">
                    {h.step}
                  </div>
                  <h3 className="font-bold text-sm text-foreground mb-2">{h.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ─────────────────────────────────────────────────────── */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
          </div>
          <blockquote className="text-xl sm:text-2xl font-display font-bold text-foreground mb-5 leading-relaxed">
            "We went from zero online presence to consistent leads within 6 weeks. The UGC creatives performed 3× better than anything we'd tried before."
          </blockquote>
          <p className="text-sm text-muted-foreground font-medium">— Business owner, Blantyre, Malawi</p>
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────────────────────────── */}
      <section className="py-20 bg-[hsl(var(--primary))] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.15) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold mb-4 leading-tight">
            Ready to turn your business into a<br />
            <span className="text-[hsl(var(--accent))]">lead-generating machine?</span>
          </h2>
          <p className="text-white/60 mb-8 text-base leading-relaxed">
            Start with a free discovery conversation. We'll build a strategy around your offer, your audience, and your goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent))]/90 font-bold px-10 h-12 text-base">
                Get started <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-white/25 text-white bg-white/5 hover:bg-white/10 px-8 h-12 text-base">
                Start a discussion
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
