import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import BrandLogo from '@/components/BrandLogo';
import { cn } from '@/lib/utils';

// Nav links shown in the logged-in top bar (desktop)
const NAV = [
  { label: 'Dashboard',      to: '/dashboard' },
  { label: 'Facebook Pages', to: '/pages' },
  { label: 'Campaigns',      to: '/campaigns' },
  { label: 'Audiences',      to: '/audiences' },
];

export default function TopBar({ onMenuToggle, currentUser, isStaff }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = currentUser?.full_name
    ? currentUser.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : (currentUser?.email?.[0] || 'U').toUpperCase();

  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ['unread-notifications', currentUser?.id],
    queryFn: () => base44.entities.Notification.filter(
      { recipient_id: currentUser?.id, is_read: false },
      { sort: '-created_date', limit: 20 }
    ),
    enabled: !!currentUser?.id,
    refetchInterval: 30000,
  });
  const unreadCount = unreadNotifications.length;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0A0A0F] backdrop-blur-sm flex-shrink-0">
        <div className="h-16 flex items-center justify-between px-4 lg:px-8">

          {/* Left: hamburger (mobile) + logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to={isStaff ? '/admin' : '/dashboard'}>
              <BrandLogo size="sidebar" />
            </Link>
          </div>

          {/* Centre: nav links (desktop, non-admin) */}
          {!isStaff && (
            <nav className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
              {NAV.map(n => (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    pathname === n.to || pathname.startsWith(n.to + '/')
                      ? 'bg-white/10 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  )}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Right: bell + avatar */}
          <div className="flex items-center gap-1">
            <button
              className="relative p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => navigate(isStaff ? '/admin/notifications' : '/notifications')}
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold px-0.5">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors ml-1"
              title="Profile Settings"
            >
              <div className="w-7 h-7 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-medium text-white leading-tight truncate max-w-[120px]">
                  {currentUser?.full_name || currentUser?.email || 'Account'}
                </p>
                <p className="text-[10px] text-white/50 leading-tight capitalize">
                  {currentUser?.role === 'user' ? 'Client' : (currentUser?.role?.replace(/_/g, ' ') || 'Client')}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown (non-admin) */}
        {mobileOpen && !isStaff && (
          <div className="lg:hidden border-t border-white/10 bg-[#0A0A0F] px-4 pb-4 pt-2 space-y-1">
            {NAV.map(n => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === n.to ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white'
                )}
              >
                {n.label}
              </Link>
            ))}
          </div>
        )}
      </header>
    </>
  );
}
