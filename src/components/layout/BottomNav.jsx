import { useLocation, Link } from 'react-router-dom';
import { Home, LayoutGrid, DollarSign, BookOpen, Phone, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';

// Public bottom nav — shown to ALL visitors on mobile (lg:hidden)
// Authenticated users get a 5th item linking to their dashboard
const PUBLIC_NAV = [
  { path: '/',          label: 'Home',      icon: Home },
  { path: '/portfolio', label: 'Portfolio', icon: LayoutGrid },
  { path: '/pricing',   label: 'Pricing',   icon: DollarSign },
  { path: '/blog',      label: 'Blog',      icon: BookOpen },
  { path: '/contact',   label: 'Contact',   icon: Phone },
];

export default function BottomNav({ isStaff }) {
  const location = useLocation();
  const { user } = useAuth();

  // Never show on staff/admin routes
  if (isStaff) return null;

  // If the current path is an authenticated app route, don't render
  // (AppLayout renders its own bottom nav for those routes)
  const isAppRoute = location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/campaigns') ||
    location.pathname.startsWith('/designs') ||
    location.pathname.startsWith('/referrals') ||
    location.pathname.startsWith('/support') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/designer') ||
    location.pathname.startsWith('/notifications') ||
    location.pathname.startsWith('/settings');
  if (isAppRoute) return null;

  // If user is logged in, swap 'Contact' for 'Dashboard'
  const navItems = user
    ? [...PUBLIC_NAV.slice(0, 4), { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }]
    : PUBLIC_NAV;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[hsl(var(--primary))] border-t border-white/10 safe-area-bottom z-50">
      <nav className="grid grid-cols-5 h-16">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive =
            path === '/'
              ? location.pathname === '/'
              : location.pathname === path || location.pathname.startsWith(path + '/');

          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                isActive
                  ? "text-white"
                  : "text-white/50 hover:text-white/80"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "drop-shadow-sm")} />
              <span className={cn("text-[10px] font-medium", isActive ? "text-white" : "text-white/50")}>
                {label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[hsl(var(--accent))]" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
