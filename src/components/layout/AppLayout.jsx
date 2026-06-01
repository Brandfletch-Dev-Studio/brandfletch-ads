import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Megaphone, Facebook, Users, Wallet,
  Settings, Bell, Menu, X, ChevronRight, BarChart3, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/AuthContext';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import BrandLogo from '@/components/BrandLogo';

const clientNav = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { path: '/pages', label: 'Facebook Pages', icon: Facebook },
  { path: '/audiences', label: 'Audiences', icon: Users },
  { path: '/wallet', label: 'Wallet', icon: Wallet },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const adminNav = [
  { path: '/admin', label: 'Overview', icon: LayoutDashboard },
  { path: '/admin/campaigns', label: 'All Campaigns', icon: Megaphone },
  { path: '/admin/pages', label: 'Page Requests', icon: Facebook },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/payments', label: 'Payments', icon: Wallet },
  { path: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { currentUser } = useAuth();

  const isAdmin = currentUser?.role === 'admin';
  const isCampaignManager = currentUser?.role === 'campaign_manager';
  const isFinance = currentUser?.role === 'finance';
  const isStaff = isAdmin || isCampaignManager || isFinance;

  const navItems = isStaff ? adminNav : clientNav;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto",
        "bg-[hsl(var(--sidebar-background))]",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[hsl(var(--sidebar-border))]">
          <BrandLogo size="sidebar" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-[hsl(var(--sidebar-foreground))] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role badge */}
        {isStaff && (
          <div className="px-4 py-3 border-b border-[hsl(var(--sidebar-border))]">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[hsl(var(--sidebar-accent))]">
              <Shield className="w-3 h-3 text-[hsl(var(--sidebar-primary))]" />
              <span className="text-xs font-medium text-[hsl(var(--sidebar-primary-foreground))] capitalize">
                {currentUser?.role?.replace('_', ' ')}
              </span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path || location.pathname.startsWith(path + '/');
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  active
                    ? "bg-[hsl(var(--sidebar-primary))] text-white"
                    : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-white"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="w-3 h-3 opacity-70" />}
              </Link>
            );
          })}

          {/* Admin ↔ Client view switcher (admin only) */}
          {isAdmin && (
            <div className="pt-3 mt-3 border-t border-[hsl(var(--sidebar-border))]">
              <Link
                to={isStaff && location.pathname.startsWith('/admin') ? '/dashboard' : '/admin'}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-white"
              >
                <Shield className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">
                  {location.pathname.startsWith('/admin') ? 'Switch to Client View' : 'Switch to Admin View'}
                </span>
              </Link>
            </div>
          )}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-[hsl(var(--sidebar-border))]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[hsl(var(--accent))] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {currentUser?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{currentUser?.full_name || 'User'}</p>
              <p className="text-xs text-[hsl(var(--sidebar-foreground))] truncate">{currentUser?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-border bg-card flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md hover:bg-secondary"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <NotificationDropdown />
            {!isStaff && (
              <Link to="/campaigns/new">
                <Button size="sm" className="bg-[hsl(var(--accent))] hover:bg-[hsl(217,91%,48%)] text-white font-semibold">
                  + New Campaign
                </Button>
              </Link>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}