import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
  ArrowRight, Megaphone, Palette, Video, Users2, GraduationCap, Code2,
  CheckCircle, TrendingUp, Target, Star, Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSEO } from '@/hooks/useSEO';

const DEPARTMENTS = [
  {
    id: 'ads',
    icon: Megaphone,
    title: 'Brandfletch Ads',
    tagline: "Your customers are already online — let's reach them.",
    body: 'Professionally managed Meta Ads campaigns running today, with Google Ads and TikTok Ads coming soon — all designed to generate qualified leads and measurable growth.',
    color: 'from-blue-600 to-blue-800',
    accent: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
    to: '/pricing',
    live: true,
  },
  {
    id: 'designs',
    icon: Palette,
    title: 'Brandfletch Designs',
    tagline: 'Professional design that makes your business stand out.',
    body: 'Logos, brand identities, social media graphics, print design, and packaging — design that elevates your brand at every touchpoint.',
    color: 'from-purple-600 to-pink-700',
    accent: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    dot: 'bg-purple-500',
    to: '/designs',
    live: true,
  },
  {
    id: 'studios',
    icon: Video,
    title: 'Brandfletch Studios',
    tagline: 'Content that captures attention and drives engagement.',
    body: 'Video production, photography, UGC content, and social media content — the creative engine that powers your marketing.',
    color: 'from-orange-600 to-red-700',
    accent: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    dot: 'bg-orange-500',
    to: '/studios',
    live: true,
  },
  {
    id: 'sales',
    icon: Users2,
    title: 'Brandfletch Sales',
    tagline: 'An outsourced sales team, on demand.',
    body: 'A dedicated sales team for businesses that need help converting leads into customers — without the overhead of hiring in-house.',
    color: 'from-amber-600 to-orange-700',
    accent: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
    to: '/sales',
    live: true,
  },
  {
    id: 'academy',
    icon: GraduationCap,
    title: 'Brandfletch Business Academy',
    tagline: 'Learn the systems behind the growth.',
    body: 'Courses and programs built to teach business owners the marketing, sales, and operations skills we use every day.',
    color: 'from-cyan-600 to-sky-800',
    accent: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    dot: 'bg-cyan-500',
    to: '/academy',
    live: true,
  },
  {
    id: 'dev-studio',
    icon: Code2,
    title: 'Brandfletch Dev Studio',
    tagline: 'Websites, apps, automations, and AI agents built to scale.',
    body: 'From websites and web apps to automations and AI sales agents — the development engine that powers your business.',
    color: 'from-emerald-600 to-teal-800',
    accent: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    to: '/dev-studio',
    live: true,
  },
];

const STATS = [
  { value: '500+', label: 'Businesses served' },
  { value: '6',    label: 'Departments' },
  { value: '5',    label: 'African countries' },
  { value: '98%',  label: 'Client satisfaction' },
];

const HOW = [
  { step: '01', title: 'Book a discovery call', desc: 'We understand your business, your offer, and your growth goals.' },
  { step: '02', title: 'We build your strategy', desc: 'Campaigns and creatives — all designed around your target customer.' },
  { step: '03', title: 'We launch & optimise', desc: 'Your campaigns go live. We track performance and iterate for maximum results.' },
  { step: '04', title: 'You track everything', desc: 'Real-time updates in your client dashboard — see exactly what we\'re doing and how it\'s performing.' },
];

export default function Home() {
  useSEO({
    title:       'Brandfletch Media — Digital Systems for African Businesses',
    description: 'A full-service media company for African businesses — Ads, Design, Studios, Sales, Academy, and Dev Studio. Six departments, one team.',
  });

  const { user } = useAuth();

  return (
    <div className="flex flex-col">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[hsl(var(--primary))] text-white min-h-[90vh] flex items-center">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[hsl(var(--accent))]/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">

            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white/80 text-xs font-semibold px-4 py-2 rounded-full mb-8 tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent))] animate-pulse" />
              Six Departments · One Team
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-extrabold leading-[1.05] tracking-tight mb-6">
              Everything your business needs,
              <br />
              <span className="relative inline-block">
                <span className="text-[hsl(var(--accent))]">under one roof</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 400 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M2 9C100 3 200 3 398 9" stroke="hsl(var(--accent))" strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
                </svg>
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-white/65 max-w-2xl mx-auto leading-relaxed mb-10">
              Brandfletch Media is a full-service company for African businesses — Ads, Design, Studios, Sales, Academy, and Dev Studio. Each department built to support the next.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link to="/pricing">
                <Button size="lg" className="bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent))]/90 font-bold px-10 h-13 text-base shadow-xl shadow-[hsl(var(--accent))]/20 rounded-xl">
                  Explore our services <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 font-semibold px-8 h-13 text-base rounded-xl border border-white/15">
                  Talk to us first
                </Button>
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-white/40 text-xs font-medium">
              <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[hsl(var(--accent))]" /> No long-term contracts</span>
              <span className="hidden sm:block w-px h-4 bg-white/15" />
              <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[hsl(var(--accent))]" /> Results-focused approach</span>
              <span className="hidden sm:block w-px h-4 bg-white/15" />
              <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[hsl(var(--accent))]" /> Built for African markets</span>
            </div>
          </div>

          <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/10">
            {STATS.map(s => (
              <div key={s.label} className="bg-white/5 backdrop-blur-sm px-6 py-6 text-center hover:bg-white/10 transition-colors">
                <p className="text-3xl sm:text-4xl font-display font-extrabold text-white mb-1">{s.value}</p>
                <p className="text-xs text-white/45 font-medium">{s.label}</p>
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
                It's not just one service.<br />
                <span className="text-[hsl(var(--accent))]">It's the whole system.</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Most businesses don't fail at running ads — they fail at the pieces around it. A weak creative. An unclear offer. No follow-through. We solve all of that with six departments that work together as one system.
              </p>
              <ul className="space-y-3">
                {[
                  { icon: Target, text: 'Precise audience targeting that reaches your ideal customers' },
                  { icon: TrendingUp, text: 'Campaigns optimised for qualified leads, not just clicks' },
                  { icon: Megaphone, text: 'Creative, content, and design built to convert' },
                  { icon: Smartphone, text: 'Mobile-first campaigns for African markets' },
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

      {/* ── DEPARTMENTS ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/20 text-xs">
              Our Departments
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-foreground">
              Six departments, one goal
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto text-sm">
              Each department is a specialised service — but together, they form a complete growth system for your business.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {DEPARTMENTS.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.id} className={`group bg-card border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-[hsl(var(--accent))]/30`}>
                  <div className={`h-1 bg-gradient-to-r ${s.color}`} />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-11 h-11 rounded-xl ${s.accent} flex items-center justify-center`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <h3 className="font-bold text-base text-foreground mb-1">{s.title}</h3>
                    <p className="text-xs font-semibold text-[hsl(var(--accent))] mb-3 italic">{s.tagline}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{s.body}</p>
                    <Link to={s.to}>
                      <button className="text-xs font-semibold text-[hsl(var(--accent))] hover:underline flex items-center gap-1">
                        {s.id === 'ads' ? 'See pricing' : 'Learn more'} <ArrowRight className="w-3 h-3" />
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
            "We went from zero online presence to consistent leads within 6 weeks. The Meta Ads campaigns performed 3× better than anything we'd tried before."
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
            <span className="text-[hsl(var(--accent))]">growth machine?</span>
          </h2>
          <p className="text-white/60 mb-8 text-base leading-relaxed">
            Explore our departments and find the service that fits your needs — or talk to us and we'll point you in the right direction.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/pricing">
              <Button size="lg" className="bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent))]/90 font-bold px-10 h-12 text-base">
                Explore services <ArrowRight className="ml-2 w-4 h-4" />
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
