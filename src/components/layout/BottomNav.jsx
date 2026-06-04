import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Home, Palette, Megaphone, Target, LifeBuoy, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';

export default function BottomNav({ isStaff, unreadCount }) {
  const location = useLocation();
  const { user } = useAuth();

  if (isStaff) return null;

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: Home },
    { path: '/designs', label: 'Designs', icon: Palette },
    { path: '/campaigns', label: 'Campaigns', icon: Megaphone },
    { path: '/leads', label: 'Leads', icon: Target },
    { path: '/support', label: 'Support', icon: LifeBuoy },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border safe-area-bottom">
      <nav className="grid grid-cols-5 h-16">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path || 
            (path !== '/dashboard' && location.pathname.startsWith(path + '/'));
          
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}