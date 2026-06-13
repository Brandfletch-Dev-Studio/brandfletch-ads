import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Megaphone, Facebook, Users, Wallet as WalletIcon,
  Settings, X, ChevronRight, BarChart3, Shield, Bell, Tv2, ClipboardList,
  Tags, LifeBuoy, Palette, Target, Gift, FileText, MessageSquare
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { ROLE_LABELS } from '@/lib/permissions';

import BrandLogo from '@/components/BrandLogo';
import TopBar from '@/components/layout/TopBar';
import BottomNav from '@/components/layout/BottomNav';

// ── Client nav (role='user') ─────────────────────────────────────────────────
const clientNav = [
  { path: '/dashboard', label: 'Dashboard',       icon: LayoutDashboard },
  { path: '/campaigns', label: 'Campaigns',        icon: Megaphone },
  { path: '/designs',   label: 'Designs',          icon: Palette },
  { path: '/leads',     label: 'Leads (Coming Soon)', icon: Target, disabled: true },
  { path: '/pages',     label: 'Facebook Pages',   icon: Facebook },
  { path: '/audiences', label: 'Audiences',        icon: Users },
  { path: '/referrals', label: 'Refer & Earn',     icon: Gift },
  { path: '/support',   label: 'Support',          icon: LifeBuoy },
  { path: '/settings',  label: 'Settings',         icon: Settings },
];

// ── Designer nav — ONLY their portal, messages, settings ────────────────────
// Designers never see the admin dashboard. They work exclusively in their portal.
const designerNav = [
  { path: '/designer',  label: 'My Projects',     icon: Palette },
  { path: '/support',   label: 'Messages',         icon: MessageSquare },
  { path: '/settings',  label: 'Settings',         icon: Settings },
];

// ── Admin nav (all staff except designer) ────────────────────────────────────
const ALL_ADMIN_NAV = [
  { key: 'overview',      path: '/admin',                label: 'Overview',          icon: LayoutDashboard, permission: null },
  { key: 'campaigns',     path: '/admin/campaigns',      label: 'All Campaigns',     icon: Megaphone,       permission: 'campaigns.view' },
  { key: 'designs',       path: '/admin/designs',        label: 'Design Requests',   icon: Palette,         permission: 'designs.view' },
  { key: 'leads',         path: '/admin/leads',          label: 'Leads & CRM (Soon)',icon: Target,          permission: 'leads.view', disabled: true },
  { key: 'pages',         path: '/admin/pages',          label: 'Page Requests',     icon: Facebook,        permission: 'pages.view' },
  { key: 'users',         path: '/admin/users',          label: 'Team & Users',      icon: Users,           permission: 'users.view' },
  { key: 'payments',      path: '/admin/payments',       label: 'Payments',          icon: WalletIcon,      permission: 'payments.view' },
  { key: 'notifications', path: '/admin/notifications',  label: 'Notifications',     icon: Bell,            permission: 'notifications.view' },
  { key: 'ads',           path: '/admin/ads',            label: 'In-App Ads',        icon: Tv2,             permission: 'ads.view' },
  { key: 'reports',       path: '/admin/reports',        label: 'Reports',           icon: BarChart3,       permission: 'reports.view' },
  { key: 'audit_log',     path: '/admin/audit-log',      label: 'Audit Log',         icon: ClipboardList,   permission: 'audit_log.view' },
  { key: 'pricing',       path: '/admin/pricing',        label: 'Pricing',           icon: Tags,            permission: 'pricing.view' },
  { key: 'support',       path: '/admin/support',        label: 'Support Tickets',   icon: LifeBuoy,        permission: 'support.view' },
  { key: 'referrals',     path: '/admin/referrals',      label: 'Referrals',         icon: Gift,            permission: 'referrals.view' },
  { key: 'quotes',        path: '/admin/quotes',         label: 'Quotes',            icon: FileText,        permission: 'quotes.view' },
  { key: 'settings',      path: '/admin/settings',       label: 'Settings',          icon: Settings,        permission: 'settings.view' },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const { isStaff, isSuperAdmin, can } = usePermissions();

  const isDesigner = currentUser?.role === 'designer';
  const isAdminView = location.pathname.startsWith('/admin');

  // Determine which nav to show:
  // - designer → dedicated designer nav (portal + messages + settings)
  // - other staff on /admin/* → filtered admin nav
  // - clients (or staff on client routes) → client nav
  let navItems;
  if (isDesigner) {
    navItems = designerNav;
  } else if (isStaff && isAdminView) {
    navItems = ALL_ADMIN_NAV.filter(item => !item.permission || can(item.permission));
  } else {
    navItems = clientNav;
  }

  // Unread messages badge — staff see client-sent messages; clients see admin replies
  const { data: unreadMessages = [] } = useQuery({
    queryKey: ['unread-messages', currentUser?.id, isStaff],
    queryFn: () => isStaff
      ? base44.entities.Message.filter({ is_read: false, sender_role: 'user' }, { limit: 100 })
      : base44.entities.Message.filter({ conversation_user_id: currentUser?.id, is_read: false, sender_role: 'admin' }, { limit: 100 }),
    enabled: !!currentUser?.id,
    refetchInterval: 15000,
  });
  const unreadCount = unreadMessages.length;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto",
        "bg-[hsl(var(--sidebar-background))]",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[hsl(var(--sidebar-border))]">
          <BrandLogo size="sidebar" />
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-[hsl(var(--sidebar-foreground))] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role badge — shown for all staff */}
        {isStaff && (
          <div className="px-4 py-3 border-b border-[hsl(var(--sidebar-border))]">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[hsl(var(--sidebar-accent))]">
              <Shield className="w-3 h-3 text-[hsl(var(--sidebar-primary))]" />
              <span className="text-xs font-medium text-[hsl(var(--sidebar-primary-foreground))]">
                {ROLE_LABELS[currentUser?.role] || currentUser?.role}
              </span>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon, disabled }) => {
            const active = path === '/admin'
              ? location.pathname === '/admin'
              : location.pathname === path || location.pathname.startsWith(path + '/');
            // Show unread badge on support/messages nav items
            const showBadge = (path === '/support' || path === '/admin/support') && unreadCount > 0;

            if (disabled) {
              return (
                <div key={path}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[hsl(var(--sidebar-foreground))] opacity-40 cursor-not-allowed">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{label}</span>
                </div>
              );
            }

            return (
              <Link key={path} to={path} onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  active
                    ? "bg-[hsl(var(--sidebar-primary))] text-white"
                    : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-white"
                )}
              >
                <div className="relative flex-shrink-0">
                  <Icon className="w-4 h-4" />
                  {showBadge && (
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

          {/* Admin ↔ Client view switcher — super admin only */}
          {isSuperAdmin && !isDesigner && (
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

        {/* User footer */}
        <div className="p-4 border-t border-[hsl(var(--sidebar-border))]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[hsl(var(--accent))] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {currentUser?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{currentUser?.full_name || 'User'}</p>
              <p className="text-[10px] text-[hsl(var(--sidebar-foreground))] truncate">{currentUser?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuToggle={() => setSidebarOpen(true)} currentUser={currentUser} isStaff={isStaff} />
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <Outlet />
        </main>
        <BottomNav isStaff={isStaff} unreadCount={unreadCount} />
      </div>
    </div>
  );
}
