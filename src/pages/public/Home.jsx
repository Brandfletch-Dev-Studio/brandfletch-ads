import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
  ArrowRight, Megaphone, Target, TrendingUp, Check, CheckCircle,
  Users, Smartphone, Eye, MousePointerClick, Zap, Shield, BarChart3,
  Facebook, Instagram, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSEO } from '@/hooks/useSEO';

const HOW_STEPS = [
  { step: '01', title: 'Create your account', desc: 'Sign up in 2 minutes. No contracts, no setup fees. Pick your ad budget and go.' },
  { step: '02', title: 'We set up your ads', desc: 'Our team builds your campaigns on Brandfletch ad accounts — targeting, creatives, copy, everything.' },
  { step: '03', title: 'We manage & optimise', desc: 'We monitor performance daily, test new creatives, and optimise for the best cost-per-lead.' },
  { step: '04', title: 'Track in your dashboard', desc: 'See impressions, reach, clicks, and results in real-time from your own dashboard.' },
];

const STATS = [
  { value: '750K+', label: 'Monthly reach potential' },
  { value: '500+', label: 'Businesses advertised' },
  { value: '3x–5x', label: 'Average ad ROI' },
  { value: '100%', label: 'Done for you' },
];

const FEATURES = [
  { icon: Target, title: 'Precise targeting', desc: 'We target your ideal customers by location, age, interests, and buying behaviour.' },
  { icon: Megaphone, title: 'Professional creatives', desc: 'Our team designs scroll-stopping ad creatives that convert viewers into customers.' },
  { icon: TrendingUp, title: 'Daily optimisation', desc: 'We don\'t just set and forget. We test, tweak, and scale what works — every single day.' },
  { icon: BarChart3, title: 'Full transparency', desc: 'Your dashboard shows exactly what you\'re spending, what you\'re reaching, and what results you\'re getting.' },
  { icon: Shield, title: 'Brandfletch ad accounts', desc: 'Your ads run on our verified Meta ad accounts — no risk of your account getting banned.' },
  { icon: Zap, title: 'Fast launch', desc: 'From sign-up to live campaigns in as little as 48 hours. No long onboarding process.' },
];

const PLATFORMS = [
  { icon: Facebook, name: 'Facebook Ads', status: 'Live' },
  { icon: Instagram, name: 'Instagram Ads', status: 'Live' },
  { icon: Megaphone, name: 'Google Ads', status: 'Coming soon' },
  { icon: Megaphone, name: 'TikTok Ads', status: 'Coming soon' },
];

const FAQS = [
  { q: 'How does it work?', a: 'You sign up, choose your ad budget, and our team handles everything — campaign setup, creative design, targeting, and daily optimisation. Your ads run on Brandfletch\'s verified Meta ad accounts.' },
  { q: 'Do I need my own Facebook ad account?', a: 'No. Your ads run on Brandfletch\'s verified ad accounts. This means no setup headaches, no risk of account bans, and our team has full access to manage and optimise your campaigns.' },
  { q: 'How much does it cost?', a: 'You pay a monthly management fee plus your ad budget. Plans start at MK160,000/month (Starter), MK450,000/month (Growth), and MK750,000/month (Premium). The ad budget is separate and goes directly to Facebook/Meta.' },
  { q: 'When will my ads start running?', a: 'Typically within 48 hours of signing up. Our team builds your campaigns, creates your first set of ad creatives, and launches as soon as you approve.' },
  { q: 'Can I see how my ads are performing?', a: 'Yes. You get access to a dashboard showing impressions, reach, clicks, spend, and results — updated in real-time. No guessing, no waiting for reports.' },
  { q: 'Can I cancel anytime?', a: 'Yes. Plans are month-to-month. No long-term contracts, no lock-in. If you\'re not seeing value, you can cancel anytime.' },
  { q: 'What if I already have my own ad account?', a: 'That\'s fine too. We can either run ads on your existing account or on ours — whichever works better for you. Running on our accounts means we can manage everything without needing access permissions.' },
];

function FaqItem({ faq, isOpen, onClick }) {
  return (
    <div className="border-b border-border">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between text-left py-5 font-bold text-base text-foreground hover:text-[hsl(var(--primary))] transition-colors"
      >
        <span>{faq.q}</span>
        <span className="text-xl text-[hsl(var(--primary))] ml-4">{isOpen ? '−' : '+'}</span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-5' : 'max-h-0'}`}>
        <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
      </div>
    </div>
  );
}

export default function Home() {
  useSEO({
    title:       'Brandfletch Ads — Managed Facebook & Instagram Ads for Businesses',
    description: 'Sign up, set up your ads on Brandfletch ad accounts, and let our team manage everything. Professional Facebook & Instagram ads done for you.',
  });

  const { user } = useAuth();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="flex flex-col">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0A0A0F] text-white min-h-[90vh] flex items-center">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#3B2FC9]/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#4CAF50]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 py-24 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">

            <div className="inline-flex items-center gap-2 bg-[#3B2FC9]/20 border border-[#3B2FC9]/40 rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse" />
              <span className="text-xs sm:text-sm font-semibold tracking-wide text-white uppercase">
                Managed Ads Platform
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold leading-[1.05] tracking-tight mb-6">
              Your ads, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B2FC9] to-[#5B4FE8]">done for you.</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed mb-10">
              Sign up, choose your budget, and our team builds, launches, and manages your Facebook & Instagram ads on Brandfletch ad accounts. You just watch the leads come in.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              {!user ? (
                <Button
                  size="lg"
                  className="bg-[#4CAF50] hover:bg-[#4CAF50]/90 text-white font-bold px-10 h-14 text-base shadow-xl rounded-xl"
                  onClick={() => navigate('/register')}
                >
                  Get Started Free <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="bg-[#4CAF50] hover:bg-[#4CAF50]/90 text-white font-bold px-10 h-14 text-base shadow-xl rounded-xl"
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              )}
              <Link to="/pricing">
                <Button size="lg" variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 font-semibold px-8 h-14 text-base rounded-xl border border-white/20">
                  See Pricing
                </Button>
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-white/40 text-xs font-medium">
              <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#4CAF50]" /> No long-term contracts</span>
              <span className="hidden sm:block w-px h-4 bg-white/15" />
              <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#4CAF50]" /> No setup fees</span>
              <span className="hidden sm:block w-px h-4 bg-white/15" />
              <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#4CAF50]" /> Cancel anytime</span>
            </div>
          </div>

          <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {STATS.map(s => (
              <div key={s.label} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-6 text-center">
                <p className="text-2xl sm:text-3xl font-display font-extrabold text-white mb-1">{s.value}</p>
                <p className="text-xs text-white/45 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 bg-[#3B2FC9]/10 text-[#3B2FC9] border-[#3B2FC9]/20 text-xs">
              How It Works
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-display font-black text-foreground tracking-tight mb-4">
              From sign-up to live ads in 4 steps
            </h2>
            <p className="text-lg text-muted-foreground">
              No marketing degree needed. No complicated tools. Just sign up and let our team handle the rest.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_STEPS.map((h, i) => (
              <div key={h.step} className="bg-white border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#3B2FC9] text-white flex items-center justify-center text-sm font-bold mb-4">
                  {h.step}
                </div>
                <h3 className="font-bold text-base text-foreground mb-2">{h.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{h.desc}</p>
                {i < HOW_STEPS.length - 1 && (
                  <div className="hidden lg:flex items-center mt-4 text-[#3B2FC9]">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORMS ────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-muted/30 border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Ads run on</p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {PLATFORMS.map(p => {
                const Icon = p.icon;
                return (
                  <div key={p.name} className="flex items-center gap-2 bg-white border border-border rounded-xl px-5 py-3">
                    <Icon className="w-5 h-5 text-[#3B2FC9]" />
                    <span className="text-sm font-bold text-foreground">{p.name}</span>
                    {p.status === 'Live' ? (
                      <span className="text-xs font-semibold text-[#4CAF50] bg-[#4CAF50]/10 px-2 py-0.5 rounded-full">Live</span>
                    ) : (
                      <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Soon</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20 text-xs">
              What You Get
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-display font-black text-foreground tracking-tight mb-4">
              Everything managed. Nothing for you to figure out.
            </h2>
            <p className="text-lg text-muted-foreground">
              You run your business. We run your ads. It's that simple.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white border border-border rounded-2xl p-6 hover:shadow-md hover:border-[#3B2FC9]/30 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-[#3B2FC9]/10 text-[#3B2FC9] flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PRICING PREVIEW ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#0A0A0F] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="bg-[#3B2FC9]/30 border border-[#3B2FC9]/50 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Ad Packages
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-4 mb-4">
              Simple pricing. Real results.
            </h2>
            <p className="text-gray-400 text-lg">
              Pick your budget. We handle the rest. No hidden fees, no contracts.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto mb-12">
            {/* STARTER */}
            <div className="bg-[#13131F] border border-gray-800 rounded-3xl p-8 flex flex-col">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">STARTER</span>
              <h3 className="text-3xl font-black text-white mb-1">MK160K<span className="text-xs text-gray-400 font-normal">/month</span></h3>
              <p className="text-sm text-[#4CAF50] font-semibold mb-6">Get started with ads</p>
              <hr className="border-gray-800 mb-6" />
              <ul className="space-y-3 text-sm text-gray-300 mb-8">
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-[#4CAF50] shrink-0 mt-0.5" /><span>Facebook & Instagram Ads</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-[#4CAF50] shrink-0 mt-0.5" /><span>$1/day ad budget included</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-[#4CAF50] shrink-0 mt-0.5" /><span>Reach: 60K–150K/month</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-[#4CAF50] shrink-0 mt-0.5" /><span>4 ad creatives/month</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-[#4CAF50] shrink-0 mt-0.5" /><span>Campaign optimisation</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-[#4CAF50] shrink-0 mt-0.5" /><span>Performance dashboard</span></li>
              </ul>
              <Link to="/pricing" className="block text-center border border-gray-700 hover:border-white text-white py-3 rounded-xl text-sm font-bold transition-all mt-auto">
                Get Started
              </Link>
            </div>

            {/* GROWTH */}
            <div className="bg-gradient-to-br from-[#3B2FC9] to-[#5B4FE8] rounded-3xl p-8 flex flex-col shadow-2xl scale-105 border-2 border-white/20 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#4CAF50] text-white px-4 py-1 rounded-full text-xs font-black tracking-widest uppercase">
                MOST POPULAR
              </div>
              <span className="text-xs font-bold text-white/70 uppercase tracking-widest mb-2">GROWTH</span>
              <h3 className="text-3xl font-black text-white mb-1">MK450K<span className="text-xs text-white/70 font-normal">/month</span></h3>
              <p className="text-sm text-yellow-300 font-semibold mb-6">Scale your reach</p>
              <hr className="border-white/10 mb-6" />
              <ul className="space-y-3 text-sm text-white mb-8">
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-white shrink-0 mt-0.5 stroke-[3px]" /><span>Facebook & Instagram Ads</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-white shrink-0 mt-0.5 stroke-[3px]" /><span>$3/day ad budget included</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-white shrink-0 mt-0.5 stroke-[3px]" /><span>Reach: 180K–450K/month</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-white shrink-0 mt-0.5 stroke-[3px]" /><span>8 ad creatives/month</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-white shrink-0 mt-0.5 stroke-[3px]" /><span>2 promotional videos</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-white shrink-0 mt-0.5 stroke-[3px]" /><span>Advanced optimisation</span></li>
              </ul>
              <Link to="/pricing" className="block text-center bg-white text-[#3B2FC9] py-3 rounded-xl text-sm font-bold transition-all hover:bg-gray-100 mt-auto">
                Get Started
              </Link>
            </div>

            {/* PREMIUM */}
            <div className="bg-[#13131F] border border-gray-800 rounded-3xl p-8 flex flex-col">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">PREMIUM</span>
              <h3 className="text-3xl font-black text-white mb-1">MK750K<span className="text-xs text-gray-400 font-normal">/month</span></h3>
              <p className="text-sm text-[#4CAF50] font-semibold mb-6">Maximum impact</p>
              <hr className="border-gray-800 mb-6" />
              <ul className="space-y-3 text-sm text-gray-300 mb-8">
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-[#4CAF50] shrink-0 mt-0.5" /><span>Facebook & Instagram Ads</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-[#4CAF50] shrink-0 mt-0.5" /><span>$5/day ad budget included</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-[#4CAF50] shrink-0 mt-0.5" /><span>Reach: 300K–750K/month</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-[#4CAF50] shrink-0 mt-0.5" /><span>16 ad creatives/month</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-[#4CAF50] shrink-0 mt-0.5" /><span>4 promotional videos</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-[#4CAF50] shrink-0 mt-0.5" /><span>Priority optimisation</span></li>
              </ul>
              <Link to="/pricing" className="block text-center border border-gray-700 hover:border-white text-white py-3 rounded-xl text-sm font-bold transition-all mt-auto">
                Talk to Us
              </Link>
            </div>
          </div>

          <div className="text-center">
            <Link to="/pricing">
              <Button size="lg" className="bg-white text-[#3B2FC9] hover:bg-gray-100 font-bold px-8 h-12">
                See full pricing details <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
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

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-[#3B2FC9]/10 text-[#3B2FC9] border-[#3B2FC9]/20 text-xs">
              FAQ
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-display font-black text-foreground tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="bg-white rounded-2xl border border-border px-6 sm:px-8">
            {FAQS.map((faq, i) => (
              <FaqItem key={i} faq={faq} isOpen={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? null : i)} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-[#3B2FC9] to-[#5B4FE8] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.15) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-5xl font-black mb-4 leading-tight">
            Ready to start advertising?
          </h2>
          <p className="text-white/80 mb-10 text-lg leading-relaxed">
            Sign up today. Our team will have your ads live within 48 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!user ? (
              <Button size="lg" className="bg-[#4CAF50] hover:bg-[#4CAF50]/90 text-white font-bold px-10 h-14 text-base" onClick={() => navigate('/register')}>
                Create Free Account <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <Button size="lg" className="bg-[#4CAF50] hover:bg-[#4CAF50]/90 text-white font-bold px-10 h-14 text-base" onClick={() => navigate('/dashboard')}>
                Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            )}
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-white/25 text-white bg-white/5 hover:bg-white/10 px-8 h-14 text-base">
                Talk to Us First
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
