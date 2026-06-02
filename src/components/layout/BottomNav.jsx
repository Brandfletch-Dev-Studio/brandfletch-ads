import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Megaphone, Facebook, Wallet, MessageCircle, BarChart3, Users, Bell } from 'lucide-react';

const clientItems = [
  { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { path: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { path: '/pages', label: 'Pages', icon: Facebook },
  { path: '/wallet', label: 'Wallet', icon: Wallet },
  { path: '/messages', label: 'Messages', icon: MessageCircle },
];

const adminItems = [
  { path: '/admin', label: 'Overview', icon: LayoutDashboard },
  { path: '/admin/campaigns', label: 'Campaigns', icon: Megaphone },
  { path: '/admin/payments', label: 'Payments', icon: Wallet },
  { path: '/admin/notifications', label: 'Notifs', icon: Bell },
  { path: '/admin/messages', label: 'Messages', icon: MessageCircle },
];

export default function BottomNav({ isStaff, unreadCount = 0 }) {
  const location = useLocation();
  const isAdminView = location.pathname.startsWith('/admin');
  const items = (isStaff && isAdminView) ? adminItems : clientItems;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border safe-bottom">
      <div className="flex items-stretch">
        {items.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path || (path !== '/dashboard' && path !== '/admin' && location.pathname.startsWith(path));
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] transition-colors relative',
                active
                  ? 'text-[hsl(var(--primary))]'
                  : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <Icon className={cn('w-5 h-5', active && 'stroke-[2.5]')} />
                {(path === '/messages' || path === '/admin/messages') && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className={cn('text-[10px] font-medium', active ? 'text-[hsl(var(--primary))]' : 'text-muted-foreground')}>
                {label}
              </span>
              {active && <span className="absolute bottom-0 w-5 h-0.5 rounded-full bg-[hsl(var(--primary))]" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}