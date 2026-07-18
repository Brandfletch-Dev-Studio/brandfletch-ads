// Conversion-focused 404 — guides visitors back into the funnel
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Home, LayoutGrid, DollarSign, BookOpen, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';

// NOTE: these use ?tab= query params, not #hash anchors — PricingPage is a
// tabbed interface (activeTab state), not a single scrolling page, so there
// are no DOM anchors for these ids. ?tab= is read by PricingPage on mount.
const SERVICES = [
  { label: 'Meta Ads',       desc: 'Run Facebook & Instagram ads that actually convert',  href: '/pricing?tab=meta-ads' },
];

const QUICK_LINKS = [
  { label: 'Pricing',    href: '/pricing',   icon: DollarSign,     desc: 'Clear, honest packages' },
  { label: 'Blog',       href: '/blog',      icon: BookOpen,       desc: 'Free growth tips' },
  { label: "Contact us", href: "/contact",   icon: Phone,          desc: "Let's talk" },
];

export default function PageNotFound() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const { isSuperAdmin } = usePermissions();

  const badPath = location.pathname.replace(/^\//, '') || '?';

  return (
    <div className="min-h-screen bg-background">
      {/* Hero section */}
      <section className="bg-[hsl(var(--primary))] text-white py-16 px-4 text-center relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-[hsl(var(--accent))]/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-xl mx-auto">
          <p className="text-7xl font-black text-white/10 mb-0 leading-none select-none">404</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 -mt-4">
            Oops — page not found
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-md mx-auto mb-6">
            <span className="font-mono text-xs bg-white/10 px-2 py-0.5 rounded">/{badPath}</span>
            {" "}doesn't exist. But you're in the right place — let's get you somewhere useful.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant="outline"
              className="border-white/30 text-white bg-white/10 hover:bg-white/20 gap-2"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4" /> Go back
            </Button>
            <Button asChild className="bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent))]/90 font-semibold gap-2">
              <Link to={user ? '/dashboard' : '/'}>
                <Home className="w-4 h-4" />
                {user ? 'My Dashboard' : 'Back to Home'}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Quick navigation */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5 text-center">
          Where would you like to go?
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
          {QUICK_LINKS.map(({ label, href, icon: Icon, desc }) => (
            <Link
              key={href}
              to={href}
              className="group flex flex-col items-center gap-2 p-5 rounded-2xl bg-card border border-border hover:border-[hsl(var(--primary))]/40 hover:shadow-md transition-all text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary))]/8 flex items-center justify-center group-hover:bg-[hsl(var(--primary))]/15 transition-colors">
                <Icon className="w-5 h-5 text-[hsl(var(--primary))]" />
              </div>
              <span className="text-sm font-semibold text-foreground group-hover:text-[hsl(var(--primary))] transition-colors">
                {label}
              </span>
              <span className="text-[11px] text-muted-foreground leading-relaxed">{desc}</span>
            </Link>
          ))}
        </div>

        {/* Services CTA block */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Not sure where to start?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                We help African businesses grow online. Here's what we do:
              </p>
            </div>
            <Link to="/contact" className="shrink-0">
              <Button className="bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent))]/90 font-semibold gap-2 w-full sm:w-auto">
                Start a project <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {SERVICES.map(({ label, desc, href }) => (
              <Link
                key={label}
                to={href}
                className="flex items-start gap-3 p-4 rounded-xl hover:bg-muted/60 transition-colors group"
              >
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--accent))] shrink-0 mt-2" />
                <div>
                  <p className="text-sm font-semibold text-foreground group-hover:text-[hsl(var(--primary))] transition-colors">
                    {label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Admin-only hint */}
        {isSuperAdmin ? (
          <p className="mt-6 text-center text-xs text-muted-foreground/50">
            Admin: route <span className="font-mono">/{badPath}</span> is not implemented yet.
          </p>
        ) : null}
      </section>
    </div>
  );
}
