// v2 — branded 404
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Search, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';

const QUICK_LINKS = [
  { label: 'Home',       href: '/',        desc: 'Back to the main site' },
  { label: 'Blog',       href: '/blog',    desc: 'Tips & strategies for African businesses' },
  { label: 'Pricing',    href: '/pricing', desc: 'See our ad management packages' },
  { label: 'Contact',    href: '/contact', desc: 'Talk to our team' },
];

export default function PageNotFound() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const badPath = location.pathname;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="px-6 py-5 border-b border-border">
        <Link to="/" className="inline-flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Megaphone className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm text-foreground">Brandfletch Media</span>
        </Link>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl">

          {/* Big 404 */}
          <div className="relative mb-10 select-none">
            <p className="text-[160px] sm:text-[220px] font-black leading-none text-foreground/[0.04] text-center tracking-tighter">
              404
            </p>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-center">
                Page not found
              </h1>
              <p className="mt-3 text-muted-foreground text-center text-sm sm:text-base max-w-sm leading-relaxed">
                <span className="font-mono text-xs bg-muted text-foreground/70 px-2 py-0.5 rounded mr-1">{badPath}</span>
                doesn't exist or may have moved.
              </p>
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {QUICK_LINKS.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className="group flex flex-col gap-1.5 p-4 rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {link.label}
                </span>
                <span className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                  {link.desc}
                </span>
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Go back
            </Button>
            <Button asChild className="gap-2">
              <Link to={user ? '/dashboard' : '/'}>
                <Home className="w-4 h-4" />
                {user ? 'Dashboard' : 'Go home'}
              </Link>
            </Button>
          </div>

          {/* Admin hint */}
          {user?.role === 'admin' && (
            <p className="mt-8 text-center text-xs text-muted-foreground/60">
              Admin: this route may not be implemented yet. Ask the AI to build it.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
