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
  { label: 'Pricing', to: '/pricing' },
  { label: 'About',   to: '/about' },
  { label: 'Contact', to: '/contact' },
];

export default function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0A0A0F] backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
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
                className="bg-[#4CAF50] text-white hover:bg-[#4CAF50]/90 font-semibold"
                onClick={() => navigate('/dashboard')}
              >
                Dashboard <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
              </Button>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
                    Log in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-[#4CAF50] text-white hover:bg-[#4CAF50]/90 font-semibold">
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
          <div className="md:hidden border-t border-white/10 bg-[#0A0A0F] px-4 pb-4 pt-2 space-y-1">
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
              {user ? (
                <Link to="/dashboard" onClick={() => setOpen(false)}>
                  <Button size="sm" className="w-full bg-[#4CAF50] text-white font-semibold">Go to dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent">Log in</Button>
                  </Link>
                  <Link to="/register" onClick={() => setOpen(false)}>
                    <Button size="sm" className="w-full bg-[#4CAF50] text-white font-semibold">Get started free</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── Page content ── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#0A0A0F] text-white/70 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/10">
            <div className="flex items-center gap-3">
              <BrandLogo size="sidebar" />
            </div>
            <p className="text-sm text-white/50 max-w-sm text-center md:text-right">
              Managed Facebook & Instagram ads for businesses in Malawi. Sign up, we handle the rest.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-xs text-white/40">
            <p>© {new Date().getFullYear()} Brandfletch Ads. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link to="/about" className="hover:text-white transition-colors">About</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
              <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://app.brandfletch.com" className="hover:text-white transition-colors">Growth Dashboard</a>
              <a href="https://brandfletch.com" className="hover:text-white transition-colors">Brandfletch</a>
            </div>
          </div>
        </div>
      </footer>
      {/* Bottom padding so content isn't hidden behind the mobile nav */}
      <div className="h-16 lg:hidden" aria-hidden="true" />
      <BottomNav />
    </div>
  );
}
