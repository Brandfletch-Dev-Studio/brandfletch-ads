import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Megaphone, Facebook, Users, Wallet,
  Settings, X, ChevronRight, BarChart3, Shield, Bell, MessageCircle, ShoppingBag
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

import BrandLogo from '@/components/BrandLogo';
import TopBar from '@/components/layout/TopBar';
import BottomNav from '@/components/layout/BottomNav';

const clientNav = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { path: '/pages', label: 'Facebook Pages', icon: Facebook },
  { path: '/audiences', label: 'Audiences', icon: Users },
  { path: '/wallet', label: 'Wallet', icon: Wallet },
  { path: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { path: '/messages', label: 'Messages', icon: MessageCircle },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const adminNav = [
  { path: '/admin', label: 'Overview', icon: LayoutDashboard },
  { path: '/admin/campaigns', label: 'All Campaigns', icon: Megaphone },
  { path: '/admin/pages', label: 'Page Requests', icon: Facebook },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/payments', label: 'Payments', icon: Wallet },
  { path: '/admin/notifications', label: 'Notifications', icon: Bell },
  { path: '/admin/messages', label: 'Messages', icon: MessageCircle },
  { path: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user: currentUser } = useAuth();

  const isAdmin = currentUser?.role === 'admin';
  const isCampaignManager = currentUser?.role === 'campaign_manager';
  const isFinance = currentUser?.role === 'finance';
  const isStaff = isAdmin || isCampaignManager || isFinance;

  const { data: unreadMessages = [] } = useQuery({
    queryKey: ['unread-messages', currentUser?.id, isStaff],
    queryFn: () => isStaff
      ? base44.entities.Message.filter({ is_read: false, sender_role: 'user' })
      : base44.entities.Message.filter({ conversation_user_id: currentUser?.id, is_read: false, sender_role: 'admin' }),
    enabled: !!currentUser?.id,
    refetchInterval: 15000,
  });
  const unreadCount = unreadMessages.length;

  const isAdminView = location.pathname.startsWith('/admin');
  // Admin can switch to client view; use clientNav when in client view even if user is staff
  const navItems = (isStaff && isAdminView) ? adminNav : clientNav;

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
            const isMessages = path === '/messages' || path === '/admin/messages';
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
                <div className="relative flex-shrink-0">
                  <Icon className="w-4 h-4" />
                  {isMessages && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="w-3 h-3 opacity-70" />}
              </Link>
            );
          })}

          {/* Admin ↔ Client view switcher (admin only) */}
          {isAdmin && (
            <div className="pt-3 mt-3 border-t border-[hsl(var(--sidebar-border))]">
              <Link
                to={isAdminView ? '/dashboard' : '/admin'}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-white"
              >
                <Shield className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{isAdminView ? 'Switch to Client View' : 'Switch to Admin View'}</span>
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
        <TopBar
          onMenuToggle={() => setSidebarOpen(true)}
          currentUser={currentUser}
          isStaff={isStaff}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <BottomNav isStaff={isStaff} unreadCount={unreadCount} />
      </div>
    </div>
  );
}