import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Megaphone, Facebook, Wallet, Settings, BarChart3, Users } from 'lucide-react';

const clientItems = [
  { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { path: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { path: '/pages', label: 'Pages', icon: Facebook },
  { path: '/wallet', label: 'Wallet', icon: Wallet },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const adminItems = [
  { path: '/admin', label: 'Overview', icon: LayoutDashboard },
  { path: '/admin/campaigns', label: 'Campaigns', icon: Megaphone },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/payments', label: 'Payments', icon: Wallet },
  { path: '/admin/reports', label: 'Reports', icon: BarChart3 },
];

export default function BottomNav({ isStaff }) {
  const location = useLocation();
  const items = isStaff ? adminItems : clientItems;

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
                'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] transition-colors',
                active
                  ? 'text-[hsl(var(--primary))]'
                  : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('w-5 h-5', active && 'stroke-[2.5]')} />
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