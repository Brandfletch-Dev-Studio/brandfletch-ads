import { Link, useNavigate } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import BrandLogo from '@/components/BrandLogo';

export default function TopBar({ onMenuToggle, currentUser, isStaff }) {
  const navigate = useNavigate();
  const initials = currentUser?.full_name
    ? currentUser.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : (currentUser?.email?.[0] || 'U').toUpperCase();

  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ['unread-notifications', currentUser?.id],
    queryFn: () => base44.entities.Notification.filter({ recipient_id: currentUser?.id, is_read: false }, '-created_date', 1),
    enabled: !!currentUser?.id,
    refetchInterval: 30000,
  });
  const unreadCount = unreadNotifications.length;

  return (
    <header className="h-16 relative flex items-center justify-between px-4 lg:px-8 border-b border-border bg-card flex-shrink-0 z-30">
      {/* Left: hamburger (mobile) */}
      <div className="flex items-center w-12">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2.5 rounded-lg hover:bg-secondary transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Center: logo + name */}
      <div className="absolute left-1/2 -translate-x-1/2 lg:hidden flex items-center gap-2">
        <img
          src="https://media.base44.com/images/public/6a1df082a0de66cf554f8fdd/eeb543716_file_0000000024d0722fa20034e2dedcbc9e.png"
          alt="Brandfletch Ads"
          className="w-7 h-7 rounded-xl object-contain"
        />
        <span className="font-display font-bold text-sm text-foreground leading-none">Brandfletch</span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* New campaign CTA for clients */}
        {!isStaff && (
          <Link to="/campaigns/new" className="hidden sm:block mr-2">
            <Button size="sm" className="bg-[hsl(var(--accent))] hover:bg-[hsl(217,91%,48%)] text-white font-semibold text-xs h-8 px-3 gap-1.5">
              + New Campaign
            </Button>
          </Link>
        )}

        {/* Notifications — navigate to dedicated page */}
        <Button
          variant="ghost"
          size="icon"
          className="relative w-10 h-10"
          onClick={() => navigate(isStaff ? '/admin/notifications' : '/notifications')}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        {/* Profile — direct click to settings */}
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 pl-2.5 pr-2 py-2 rounded-lg hover:bg-secondary transition-colors ml-1"
          title="Profile Settings"
        >
          <div className="w-7 h-7 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="hidden sm:block text-left max-w-[120px]">
            <p className="text-xs font-semibold truncate leading-tight">{currentUser?.full_name || 'Account'}</p>
            <p className="text-[10px] text-muted-foreground truncate leading-tight">{currentUser?.email}</p>
          </div>
        </button>
      </div>
    </header>
  );
}