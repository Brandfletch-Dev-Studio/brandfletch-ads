import { useNavigate } from 'react-router-dom';
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
    // Bug fix: filter() options must be an object, not positional args
    queryFn: () => base44.entities.Notification.filter(
      { recipient_id: currentUser?.id, is_read: false },
      { sort: '-created_date', limit: 20 }
    ),
    enabled: !!currentUser?.id,
    refetchInterval: 30000,
  });
  // Bug fix: was using .length which counts ALL returned — but we fetch with limit:20
  // The actual unread count is correctly the length here since we filter is_read: false
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

      {/* Center: logo + name (mobile only) */}
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
        {/* Notifications */}
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

        {/* Profile avatar — click to settings */}
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 pl-2.5 pr-2 py-2 rounded-lg hover:bg-secondary transition-colors ml-1"
          title="Profile Settings"
        >
          <div className="w-7 h-7 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-primary-foreground text-xs font-bold">
            {initials}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-medium leading-tight truncate max-w-[120px]">
              {currentUser?.full_name || currentUser?.email || 'Account'}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight capitalize">
              {currentUser?.role === 'user' ? 'Client' : (currentUser?.role?.replace(/_/g, ' ') || 'Client')}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
}
