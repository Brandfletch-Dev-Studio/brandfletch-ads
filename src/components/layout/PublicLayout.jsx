import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BrandLogo from '@/components/BrandLogo';
import { cn } from '@/lib/utils';
import BottomNav from '@/components/layout/BottomNav';

const NAV = [
  { label: 'Home',    to: '/' },
  { label: 'About',   to: '/about' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Blog',      to: '/blog' },
  { label: 'Portfolio', to: '/portfolio' },
  { label: 'Contact',   to: '/contact' },
];

export default function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-[hsl(var(--primary))] backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" onClick={() => setOpen(false)}>
            <BrandLogo size="sidebar" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(n => (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  pathname === n.to
                    ? 'bg-white/10 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Button
                size="sm"
                className="bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent))]/90 font-semibold"
                onClick={() => navigate('/dashboard')}
              >
                Go to dashboard <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
              </Button>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
                    Log in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent))]/90 font-semibold">
                    Get started <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-white p-2 rounded-lg hover:bg-white/10"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-white/10 bg-[hsl(var(--primary))] px-4 pb-4 pt-2 space-y-1">
            {NAV.map(n => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={cn(
                  'block px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === n.to ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white'
                )}
              >
                {n.label}
              </Link>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <Link to="/login" onClick={() => setOpen(false)}>
                <Button variant="outline" size="sm" className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent">Log in</Button>
              </Link>
              <Link to="/register" onClick={() => setOpen(false)}>
                <Button size="sm" className="w-full bg-[hsl(var(--accent))] text-white font-semibold">Get started free</Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Page content ── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[hsl(var(--primary))] text-white/70 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div className="col-span-2 sm:col-span-1">
            <BrandLogo size="sidebar" />
            <p className="mt-3 text-sm leading-relaxed text-white/50">
              We build digital systems that help businesses attract customers, build trust, and grow. 🔥
            </p>
          </div>
          <div>
            <p className="text-white font-semibold text-sm mb-3">Services</p>
            <ul className="space-y-2 text-sm">
              {[['Meta Ads','/pricing'],['UGC Ads','/pricing'],['Graphic Design','/pricing'],['Web Development','/pricing'],['Social Media','/pricing'],['Studios','/studios'],['Dev Studio','/dev-studio']].map(([l,h])=>(
                <li key={l}><Link to={h} className="hover:text-white transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-white font-semibold text-sm mb-3">Company</p>
            <ul className="space-y-2 text-sm">
              {[['About','/about'],['Blog','/blog'],['Contact','/contact'],['Privacy Policy','/privacy-policy'],['Terms','/terms']].map(([l,h])=>(
                <li key={l}><Link to={h} className="hover:text-white transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-white font-semibold text-sm mb-3">Get started</p>
            <p className="text-white/50 text-xs mb-3 leading-relaxed">Start with a discovery conversation — we'll create a strategy built around your goals.</p>
            <Link to="/contact">
              <Button size="sm" className="bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent))]/90 font-semibold w-full">
                Start a discussion
              </Button>
            </Link>
          </div>
        </div>
        <div className="border-t border-white/10 text-center py-4 text-xs text-white/40">
          © {new Date().getFullYear()} Brandfletch Media. All rights reserved.
        </div>
      </footer>
      {/* Bottom padding so content isn't hidden behind the mobile nav */}
      <div className="h-16 lg:hidden" aria-hidden="true" />
      <BottomNav />
    </div>
  );
}
