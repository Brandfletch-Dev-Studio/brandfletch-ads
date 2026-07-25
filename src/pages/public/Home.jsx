import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
  ArrowRight, Check, CheckCircle, Facebook, Star,
  FileText, CreditCard, Link2, Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSEO } from '@/hooks/useSEO';

const REQUIREMENTS = [
  {
    icon: Facebook,
    title: 'Business Facebook Page',
    desc: 'You need a Facebook page for your business. If you don\'t have one, we\'ll help you set it up.',
  },
  {
    icon: FileText,
    title: 'An Offer',
    desc: 'Something to advertise — a product, a service, a promotion. This is carried in your ad, like a flyer or a video that we\'ll use to run the advert.',
  },
  {
    icon: CreditCard,
    title: 'Ndalama',
    desc: 'You need to be paid to do this. Your payment covers the money paid to Facebook to promote your advert (Meta ad spend) plus Brandfletch management fees.',
  },
];

const STEPS = [
  {
    icon: FileText,
    step: '01',
    title: 'Create your ad brief',
    desc: 'Follow the step-by-step campaign setup flow. Tell us what you\'re advertising, who you want to reach, and pick your budget. That\'s your ad brief.',
  },
  {
    icon: CreditCard,
    step: '02',
    title: 'Make payment',
    desc: 'Pay for your campaign. Your money covers Meta ad spend (what Facebook charges to promote your advert) and Brandfletch management fees.',
  },
  {
    icon: Link2,
    step: '03',
    title: 'Connect your Facebook page',
    desc: 'If it\'s not already connected, link your business Facebook page. Takes 30 seconds.',
  },
  {
    icon: Rocket,
    step: '04',
    title: 'We launch your ads',
    desc: 'That\'s all. The Brandfletch team takes it from here and launches your ads within 30 minutes. You sit back and watch the results come in.',
  },
];

const FAQS = [
  { q: 'What do I need to run ads?', a: 'Three things: a business Facebook page, an offer (something to advertise — carried in ad creatives like a flyer or video), and ndalama. You need to be paid to do this.' },
  { q: 'What does my payment cover?', a: 'Two things: Meta ad spend — the money paid to Facebook to promote your advert — and Brandfletch management fees for setting up, launching, and managing your campaigns.' },
  { q: 'How does the process work?', a: 'You create an advertising brief by following the step-by-step campaign setup flow. Then you make payment. Then you connect your Facebook page if it\'s not already connected. That\'s all. The Brandfletch team takes it from there and launches your ads within 30 minutes.' },
  { q: 'Do I need my own Facebook ad account?', a: 'No. Your ads run on Brandfletch ad accounts. You just need a Facebook page for your business — we handle the advertising side.' },
  { q: 'Do you make the ad creatives?', a: 'No. You bring your offer — a flyer, a video, whatever you want to advertise with. We take that and run the ads for you.' },
  { q: 'How fast do ads go live?', a: 'Within 30 minutes of you completing the setup. Once you\'ve created your ad brief, paid, and connected your Facebook page, our team launches your ads.' },
  { q: 'Can I see how my ads are performing?', a: 'Yes. Your dashboard shows impressions, reach, clicks, and spend — updated in real-time.' },
  { q: 'Can I cancel anytime?', a: 'Yes. No long-term contracts. If it\'s not working for you, you can stop anytime.' },
];

function FaqItem({ faq, isOpen, onClick }) {
  return (
    <div className="border-b border-border">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between text-left py-5 font-bold text-base text-foreground hover:text-[#3B2FC9] transition-colors"
      >
        <span>{faq.q}</span>
        <span className="text-xl text-[#3B2FC9] ml-4 shrink-0">{isOpen ? '−' : '+'}</span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-5' : 'max-h-0'}`}>
        <p className="text-sm text-muted-foreground leading-relaxed pr-8">{faq.a}</p>
      </div>
    </div>
  );
}

export default function Home() {
  useSEO({
    title:       'Brandfletch Ads — We Run Your Facebook & Instagram Ads',
    description: 'Sign up, create your ad brief, pay, connect your Facebook page. We launch your ads within 30 minutes. Managed Facebook & Instagram ads for businesses.',
  });

  const { user } = useAuth();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="flex flex-col">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0A0A0F] text-white min-h-[88vh] flex items-center">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#3B2FC9]/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#4CAF50]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-4xl mx-auto px-4 sm:px-6 py-20 lg:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-[#3B2FC9]/20 border border-[#3B2FC9]/40 rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse" />
            <span className="text-xs font-semibold tracking-wide uppercase text-white">Managed Ads</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black leading-[1.1] tracking-tight mb-6">
            We run your ads.
            <br />
            <span className="text-[#4CAF50]">You run your business.</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed mb-8">
            Sign up, create your ad brief, pay, and connect your Facebook page.
            The Brandfletch team launches your ads within 30 minutes. That's it.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            {!user ? (
              <Button
                size="lg"
                className="bg-[#4CAF50] hover:bg-[#4CAF50]/90 text-white font-bold px-10 h-14 text-base shadow-xl rounded-xl"
                onClick={() => navigate('/register')}
              >
                Get Started <ArrowRight className="ml-2 w-4 h-4" />
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
            <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#4CAF50]" /> No contracts</span>
            <span className="hidden sm:block w-px h-4 bg-white/15" />
            <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#4CAF50]" /> Live in 30 minutes</span>
            <span className="hidden sm:block w-px h-4 bg-white/15" />
            <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#4CAF50]" /> Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* ── WHAT YOU NEED ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#3B2FC9] bg-[#3B2FC9]/10 px-3 py-1 rounded-full">
              What you need
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight mt-4 mb-4">
              Three things. That's all.
            </h2>
            <p className="text-lg text-muted-foreground">
              No marketing degree. No complicated tools. Just these three.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {REQUIREMENTS.map((r, i) => {
              const Icon = r.icon;
              return (
                <div key={r.title} className="bg-white border border-border rounded-2xl p-7 hover:shadow-md hover:border-[#3B2FC9]/30 transition-all">
                  <div className="w-14 h-14 rounded-2xl bg-[#3B2FC9]/10 text-[#3B2FC9] flex items-center justify-center mb-5">
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="text-xs font-bold text-muted-foreground mb-2">0{i + 1}</div>
                  <h3 className="font-bold text-lg text-foreground mb-2">{r.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#F4F4F6]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4CAF50] bg-[#4CAF50]/10 px-3 py-1 rounded-full">
              How it works
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight mt-4 mb-4">
              Four steps. Then we take over.
            </h2>
            <p className="text-lg text-muted-foreground">
              You do the first three. We handle the rest.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="bg-white border border-border rounded-2xl p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#3B2FC9] text-white flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-3xl font-black text-border">{s.step}</span>
                  </div>
                  <h3 className="font-bold text-base text-foreground mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 bg-white border border-border rounded-full px-6 py-3">
              <div className="w-8 h-8 rounded-full bg-[#4CAF50]/10 flex items-center justify-center">
                <Rocket className="w-4 h-4 text-[#4CAF50]" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                Average launch time: <span className="text-[#4CAF50]">30 minutes</span> after setup
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT YOUR PAYMENT COVERS ─────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#3B2FC9] bg-[#3B2FC9]/10 px-3 py-1 rounded-full">
              Your payment
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight mt-4 mb-4">
              What your money covers
            </h2>
            <p className="text-lg text-muted-foreground">
              One payment. Two parts. No hidden fees.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-[#3B2FC9]/5 border border-[#3B2FC9]/20 rounded-2xl p-7">
              <div className="w-12 h-12 rounded-xl bg-[#3B2FC9] text-white flex items-center justify-center mb-4">
                <Facebook className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2">Meta Ad Spend</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The money paid to Facebook to promote your advert. This goes directly to Meta — it's what they charge to show your ads to people.
              </p>
            </div>
            <div className="bg-[#4CAF50]/5 border border-[#4CAF50]/20 rounded-2xl p-7">
              <div className="w-12 h-12 rounded-xl bg-[#4CAF50] text-white flex items-center justify-center mb-4">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2">Brandfletch Management Fees</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                What you pay us to set up, launch, and manage your campaigns. Targeting, optimisation, monitoring — all handled.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING PREVIEW ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#0A0A0F] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-white/60 bg-white/10 px-3 py-1 rounded-full">
              Pricing
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-4 mb-4">
              Pick your budget. We do the rest.
            </h2>
            <p className="text-gray-400 text-lg">
              Three packages. All include Meta ad spend and management.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
            {/* STARTER */}
            <div className="bg-[#13131F] border border-gray-800 rounded-3xl p-7 flex flex-col">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">STARTER</span>
              <h3 className="text-3xl font-black text-white mt-2 mb-1">MK160K<span className="text-sm text-gray-400 font-normal">/mo</span></h3>
              <p className="text-sm text-[#4CAF50] font-semibold mb-6">For small businesses</p>
              <hr className="border-gray-800 mb-5" />
              <ul className="space-y-3 text-sm text-gray-300 mb-7 flex-1">
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-[#4CAF50] shrink-0 mt-0.5" /><span>$1/day Meta ad spend</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-[#4CAF50] shrink-0 mt-0.5" /><span>Reach: 60K–150K/month</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-[#4CAF50] shrink-0 mt-0.5" /><span>Facebook & Instagram ads</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-[#4CAF50] shrink-0 mt-0.5" /><span>Campaign setup & management</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-[#4CAF50] shrink-0 mt-0.5" /><span>Performance dashboard</span></li>
              </ul>
              <Link to="/pricing" className="block text-center border border-gray-700 hover:border-white text-white py-3 rounded-xl text-sm font-bold transition-all mt-auto">
                Get Started
              </Link>
            </div>

            {/* GROWTH */}
            <div className="bg-gradient-to-br from-[#3B2FC9] to-[#5B4FE8] rounded-3xl p-7 flex flex-col shadow-2xl lg:scale-105 border-2 border-white/20 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#4CAF50] text-white px-4 py-1 rounded-full text-xs font-black tracking-widest uppercase">
                Popular
              </div>
              <span className="text-xs font-bold text-white/70 uppercase tracking-widest mt-2">GROWTH</span>
              <h3 className="text-3xl font-black text-white mt-2 mb-1">MK450K<span className="text-sm text-white/70 font-normal">/mo</span></h3>
              <p className="text-sm text-yellow-300 font-semibold mb-6">For growing businesses</p>
              <hr className="border-white/10 mb-5" />
              <ul className="space-y-3 text-sm text-white mb-7 flex-1">
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-white shrink-0 mt-0.5 stroke-[3px]" /><span>$3/day Meta ad spend</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-white shrink-0 mt-0.5 stroke-[3px]" /><span>Reach: 180K–450K/month</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-white shrink-0 mt-0.5 stroke-[3px]" /><span>Facebook & Instagram ads</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-white shrink-0 mt-0.5 stroke-[3px]" /><span>Campaign setup & management</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-white shrink-0 mt-0.5 stroke-[3px]" /><span>Performance dashboard</span></li>
              </ul>
              <Link to="/pricing" className="block text-center bg-white text-[#3B2FC9] py-3 rounded-xl text-sm font-bold transition-all hover:bg-gray-100 mt-auto">
                Get Started
              </Link>
            </div>

            {/* PREMIUM */}
            <div className="bg-[#13131F] border border-gray-800 rounded-3xl p-7 flex flex-col">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">PREMIUM</span>
              <h3 className="text-3xl font-black text-white mt-2 mb-1">MK750K<span className="text-sm text-gray-400 font-normal">/mo</span></h3>
              <p className="text-sm text-[#4CAF50] font-semibold mb-6">Maximum reach</p>
              <hr className="border-gray-800 mb-5" />
              <ul className="space-y-3 text-sm text-gray-300 mb-7 flex-1">
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-[#4CAF50] shrink-0 mt-0.5" /><span>$5/day Meta ad spend</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-[#4CAF50] shrink-0 mt-0.5" /><span>Reach: 300K–750K/month</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-[#4CAF50] shrink-0 mt-0.5" /><span>Facebook & Instagram ads</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-[#4CAF50] shrink-0 mt-0.5" /><span>Campaign setup & management</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-[#4CAF50] shrink-0 mt-0.5" /><span>Performance dashboard</span></li>
              </ul>
              <Link to="/pricing" className="block text-center border border-gray-700 hover:border-white text-white py-3 rounded-xl text-sm font-bold transition-all mt-auto">
                Talk to Us
              </Link>
            </div>
          </div>

          <div className="text-center">
            <Link to="/pricing">
              <Button size="lg" className="bg-white text-[#3B2FC9] hover:bg-gray-100 font-bold px-8 h-12">
                See full pricing <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ─────────────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
          </div>
          <blockquote className="text-xl sm:text-2xl font-bold text-foreground mb-4 leading-relaxed">
            "We went from zero online presence to consistent leads within 6 weeks. The ads just worked."
          </blockquote>
          <p className="text-sm text-muted-foreground font-medium">— Business owner, Blantyre</p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#F4F4F6]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#3B2FC9] bg-[#3B2FC9]/10 px-3 py-1 rounded-full">
              FAQ
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mt-4">
              Questions?
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
      <section className="py-20 bg-gradient-to-br from-[#3B2FC9] to-[#5B4FE8] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.15) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-5xl font-black mb-4 leading-tight">
            Ready to run ads?
          </h2>
          <p className="text-white/80 mb-8 text-lg leading-relaxed">
            Sign up. Create your ad brief. Pay. Connect your page.
            We launch within 30 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!user ? (
              <Button size="lg" className="bg-[#4CAF50] hover:bg-[#4CAF50]/90 text-white font-bold px-10 h-14 text-base" onClick={() => navigate('/register')}>
                Get Started <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <Button size="lg" className="bg-[#4CAF50] hover:bg-[#4CAF50]/90 text-white font-bold px-10 h-14 text-base" onClick={() => navigate('/dashboard')}>
                Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            )}
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-white/25 text-white bg-white/5 hover:bg-white/10 px-8 h-14 text-base">
                Talk to Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
