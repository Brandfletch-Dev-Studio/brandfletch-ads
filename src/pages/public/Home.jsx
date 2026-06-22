import { Link } from 'react-router-dom';
import {
  ArrowRight, Megaphone, Video, Palette, Globe, CreditCard,
  Smartphone, ChevronDown, Zap, Star, CheckCircle, Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

/* ── Services content (from Brandfletch brand brief) ─────────────────────── */
const SERVICES = [
  {
    id: 'meta-ads',
    emoji: '📣',
    icon: Megaphone,
    title: 'Meta Ads Management',
    tagline: 'Your customers are already on Facebook & Instagram.',
    body: `We help your business reach them through professionally managed advertising campaigns designed to increase visibility, generate leads, and drive action.`,
    points: [],
    color: 'from-blue-600 to-blue-800',
    accent: 'bg-blue-500/10 text-blue-600',
  },
  {
    id: 'ugc-ads',
    emoji: '🎬',
    icon: Video,
    title: 'UGC Ads',
    tagline: 'People trust people.',
    body: `We work with carefully selected content creators to craft authentic brand stories that connect with your audience.`,
    points: ['Brand storytelling', 'Offer packaging', 'Clear call-to-action strategies', 'Professional creator content'],
    color: 'from-purple-600 to-purple-800',
    accent: 'bg-purple-500/10 text-purple-600',
  },
  {
    id: 'graphic-design',
    emoji: '🎨',
    icon: Palette,
    title: 'Graphic Design',
    tagline: 'Your creatives are often the first interaction customers have with your brand.',
    body: `A good design does more than look attractive — it communicates value and encourages people to take action.`,
    points: ['Promotional posters', 'Social media creatives', 'Flyers', 'Ad designs built with conversion in mind'],
    color: 'from-pink-600 to-rose-700',
    accent: 'bg-pink-500/10 text-pink-600',
  },
  {
    id: 'web-dev',
    emoji: '💻',
    icon: Globe,
    title: 'Web Development',
    tagline: 'A professional online presence changes how customers see your business.',
    body: `We build websites that become growth tools — not just pages.`,
    points: ['Build trust & showcase products', 'Conversion-focused landing pages', 'Email marketing integration', 'Affiliate systems & automation'],
    color: 'from-teal-600 to-teal-800',
    accent: 'bg-teal-500/10 text-teal-600',
  },
  {
    id: 'online-payments',
    emoji: '💳',
    icon: CreditCard,
    title: 'Online Payments',
    tagline: 'Online payments should be simple.',
    body: `We provide practical solutions for businesses and individuals who need reliable access to online payment methods, including dollar-based options for specific transactions.`,
    points: [],
    color: 'from-green-600 to-emerald-700',
    accent: 'bg-green-500/10 text-green-600',
  },
  {
    id: 'social-media',
    emoji: '📱',
    icon: Smartphone,
    title: 'Social Media Management',
    tagline: 'Your social media presence is part of your brand reputation.',
    body: `We handle your content strategy, planning, and consistency so you can focus on running your business while we keep you visible online.`,
    points: [],
    color: 'from-orange-500 to-orange-700',
    accent: 'bg-orange-500/10 text-orange-600',
  },
];

const STATS = [
  { value: '500+', label: 'Businesses served' },
  { value: '5',    label: 'African countries' },
  { value: '6',    label: 'Services offered' },
  { value: '98%',  label: 'Client satisfaction' },
];

function ServiceCard({ s, index }) {
  return (
    <div className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:border-[hsl(var(--accent))]/30 transition-all duration-300">
      {/* Top accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${s.color}`} />
      <div className="p-6">
        <div className={`w-12 h-12 rounded-xl ${s.accent} flex items-center justify-center mb-4 text-xl`}>
          {s.emoji}
        </div>
        <h3 className="font-bold text-lg font-display text-foreground mb-1">{s.title}</h3>
        <p className="text-sm font-medium text-[hsl(var(--accent))] mb-3 italic">{s.tagline}</p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{s.body}</p>
        {s.points.length > 0 && (
          <ul className="space-y-1.5">
            {s.points.map(p => (
              <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-3.5 h-3.5 text-[hsl(var(--accent))] mt-0.5 shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative bg-[hsl(var(--primary))] text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(222,70%,6%)]" />
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-[hsl(var(--accent))]/8 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
          <div className="max-w-3xl">
            <Badge className="mb-6 bg-[hsl(var(--accent))]/20 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/30 text-sm px-4 py-1.5 font-medium">
              🔥 Welcome to Brandfletch Media
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-[1.1] mb-6">
              We don't just create<br />
              marketing materials —<br />
              <span className="text-[hsl(var(--accent))]">we build digital systems.</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/70 mb-4 leading-relaxed max-w-2xl">
              Helping businesses attract customers, build trust, and grow — with a suite of digital solutions built for the African market.
            </p>
            <p className="text-sm text-white/50 mb-10 max-w-xl">
              We'd rather work with 10 businesses and deliver exceptional results than work with 1,000 and provide average service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/contact">
                <Button size="lg" className="bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90 text-white font-bold text-base px-8 h-12 shadow-lg shadow-[hsl(var(--accent))]/25">
                  Start a conversation <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent text-base h-12">
                  View our services
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Down arrow */}
        <div className="relative flex justify-center pb-8 text-white/30">
          <ChevronDown className="w-6 h-6 animate-bounce" />
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────────── */}
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

      {/* ── OUR SUITE OF SOLUTIONS ───────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/30">Our suite of solutions</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground">
              Everything your business needs to grow online
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              From advertising to web development to payments — we've built an integrated digital ecosystem for African businesses.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((s, i) => <ServiceCard key={s.id} s={s} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── WHY BRANDFLETCH ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-[hsl(var(--primary))] text-white overflow-hidden relative">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[hsl(var(--accent))]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="mb-5 bg-white/10 text-white/80 border-white/20">Why Brandfletch Media?</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold font-display leading-tight mb-6">
              Quality creates long-term partnerships.
            </h2>
            <p className="text-white/70 leading-relaxed mb-5">
              We are not focused on working with the highest number of clients.
            </p>
            <p className="text-white/70 leading-relaxed mb-5">
              We believe quality creates long-term partnerships. We would rather work with <span className="text-white font-semibold">10 businesses every month and deliver exceptional results</span> than work with 1,000 businesses and provide average service.
            </p>
            <p className="text-white/70 leading-relaxed">
              Every business deserves attention, strategy, and a solution built around its goals.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {[
              { icon: '🎯', title: 'Strategy-first', desc: 'Every solution starts with understanding your business, your customers, and your goals.' },
              { icon: '🤝', title: 'Long-term partnerships', desc: 'We\'re not a transactional service. We invest in your growth the same way you do.' },
              { icon: '🌍', title: 'Built for Africa', desc: 'Local currencies, local insights, and local support — we understand your market.' },
              { icon: '⚡', title: 'Integrated systems', desc: 'Ads, design, web, and payments — all working together under one roof.' },
            ].map(v => (
              <div key={v.title} className="flex items-start gap-4 bg-white/5 rounded-xl p-4 border border-white/10">
                <span className="text-2xl shrink-0">{v.icon}</span>
                <div>
                  <p className="font-semibold text-white">{v.title}</p>
                  <p className="text-white/60 text-sm mt-0.5">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW WE START ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <Badge variant="outline" className="mb-5 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/30">Ready to grow?</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground mb-5">
            We start with a conversation.
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-4 max-w-2xl mx-auto">
            Through chat or a call, we take time to understand your business, identify opportunities, and create a strategy designed around your specific needs.
          </p>
          <p className="text-muted-foreground mb-10">
            Thank you for trusting Brandfletch Media 🔥❤️
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button size="lg" className="bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90 text-white font-bold px-10 h-12 shadow-lg shadow-[hsl(var(--accent))]/25">
                Start your discovery call <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="font-semibold h-12">
                Explore pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
