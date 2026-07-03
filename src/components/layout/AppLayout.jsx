import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, LayoutGrid, Megaphone, Facebook, Users, Wallet as WalletIcon,
  Settings, X, ChevronRight, BarChart3, Shield, Bell, Tv2, ClipboardList,
  Tags, Palette, Target, Gift, FileText, Video, Code2
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { ROLE_LABELS } from '@/lib/permissions';
import { CLIENT_DEPARTMENTS, findActiveDepartment } from '@/lib/clientDepartments';

import BrandLogo from '@/components/BrandLogo';
import TopBar from '@/components/layout/TopBar';
import AppBottomNav from '@/components/layout/AppBottomNav';

// ── Client nav (role='user') ─────────────────────────────────────────────────
// Two-layered nav (2026-07-03), driven by src/lib/clientDepartments.js:
//   Layer 1 — this flat list's first 4 entries (one per department) double
//   as the mobile bottom nav's quick-access icons (AppBottomNav takes the
//   first 4) and are ALWAYS present, so a client can jump to any department
//   from anywhere. Facebook Pages / Audiences / Leads are no longer flat
//   top-level items — they now live only inside the Ads department's own
//   subNav (see CLIENT_DEPARTMENTS), reachable once you're inside Ads.
//   Layer 2 — once a client is actually inside a department's pages, the
//   sidebar/drawer switches to that department's own subNav instead of this
//   flat list (see the `activeDept` branch in the render below) — like
//   walking into that department's own dedicated mini-menu.
const clientNav = [
  ...CLIENT_DEPARTMENTS.map(d => ({ path: d.homePath, label: d.label, icon: d.icon, matchPaths: d.matchPaths })),
  { path: '/dashboard', label: 'Dashboard',    icon: LayoutDashboard },
  { path: '/referrals', label: 'Refer & Earn', icon: Gift },
  { path: '/settings',  label: 'Settings',     icon: Settings },
];

// ── Designer nav — ONLY their portal, messages, settings ────────────────────
// Designers never see the admin dashboard. They work exclusively in their portal.
const designerNav = [
  { path: '/designer',  label: 'My Projects',     icon: Palette },
  { path: '/settings',  label: 'Settings',         icon: Settings },
];

// ── Studio Portal nav — content creators, portal-only (mirrors designerNav) ──
const studioPortalNav = [
  { path: '/studio-portal', label: 'My Projects',  icon: Video },
  { path: '/settings',      label: 'Settings',      icon: Settings },
];

// ── Dev Portal nav — developers, portal-only (mirrors designerNav) ──
const devPortalNav = [
  { path: '/dev-portal', label: 'My Projects',      icon: Code2 },
  { path: '/settings',   label: 'Settings',          icon: Settings },
];

// ── Creative Ops Director nav ─────────────────────────────────────────────────
// COD has their own dashboard + focused admin access
const codNav = [
  { path: '/creative-ops',    label: 'My Dashboard',       icon: LayoutDashboard },
  { path: '/admin/designs',   label: 'Design Requests',    icon: Palette },
  { path: '/admin/ugc-ads',   label: 'UGC Orders',         icon: Video },
  { path: '/admin/users',     label: 'Design Team',        icon: Users },
  { path: '/admin/payments',  label: 'Payments',           icon: WalletIcon },
  { path: '/admin/reports',   label: 'Reports',            icon: BarChart3 },
  { path: '/settings',        label: 'Settings',           icon: Settings },
];

// ── Ads Manager nav ───────────────────────────────────────────────────────────
// Ads Manager has their own dashboard + focused admin access
const adsManagerNav = [
  { path: '/ads-manager',          label: 'My Dashboard',      icon: LayoutDashboard },
  { path: '/admin/campaigns',      label: 'All Campaigns',     icon: Megaphone },
  { path: '/admin/pages',          label: 'Page Requests',     icon: Facebook },
  { path: '/admin/users',          label: 'Clients',           icon: Users },
  { path: '/admin/payments',       label: 'Payments',          icon: WalletIcon },
  { path: '/admin/reports',        label: 'Reports',           icon: BarChart3 },
  { path: '/settings',             label: 'Settings',          icon: Settings },
];

// ── Studios Manager nav ────────────────────────────────────────────────────
const studiosManagerNav = [
  { path: '/studios-manager',  label: 'My Dashboard', icon: LayoutDashboard },
  { path: '/admin/studios',    label: 'Studio Orders', icon: Video },
  { path: '/admin/users',      label: 'Studio Team',   icon: Users },
  { path: '/admin/payments',   label: 'Payments',      icon: WalletIcon },
  { path: '/admin/reports',    label: 'Reports',       icon: BarChart3 },
  { path: '/settings',         label: 'Settings',      icon: Settings },
];

// ── Dev Studio Manager nav ─────────────────────────────────────────────────
const devstudioManagerNav = [
  { path: '/devstudio-manager', label: 'My Dashboard',  icon: LayoutDashboard },
  { path: '/admin/dev-studio',  label: 'Dev Orders',    icon: Code2 },
  { path: '/admin/users',       label: 'Dev Team',      icon: Users },
  { path: '/admin/payments',    label: 'Payments',      icon: WalletIcon },
  { path: '/admin/reports',     label: 'Reports',       icon: BarChart3 },
  { path: '/settings',          label: 'Settings',      icon: Settings },
];

// ── Admin nav (all staff except designer/COD/Ads Manager) ────────────────────
const ALL_ADMIN_NAV = [
  { key: 'overview',      path: '/admin',                label: 'Overview',          icon: LayoutDashboard, permission: null },
  { key: 'campaigns',     path: '/admin/campaigns',      label: 'All Campaigns',     icon: Megaphone,       permission: 'campaigns.view' },
  { key: 'designs',       path: '/admin/designs',        label: 'Design Requests',   icon: Palette,         permission: 'designs.view' },
  { key: 'studios',       path: '/admin/studios',        label: 'Studio Orders',     icon: Video,           permission: 'studios.view' },
  { key: 'devstudio',     path: '/admin/dev-studio',     label: 'Dev Studio Orders', icon: Code2,           permission: 'devstudio.view' },
  { key: 'leads',         path: '/admin/leads',          label: 'Leads & CRM (Soon)',icon: Target,          permission: 'leads.view', disabled: true },
  { key: 'pages',         path: '/admin/pages',          label: 'Page Requests',     icon: Facebook,        permission: 'pages.view' },
  { key: 'users',         path: '/admin/users',          label: 'Team & Users',      icon: Users,           permission: 'users.view' },
  { key: 'payments',      path: '/admin/payments',       label: 'Payments',          icon: WalletIcon,      permission: 'payments.view' },
  { key: 'notifications', path: '/admin/notifications',  label: 'Notifications',     icon: Bell,            permission: 'notifications.view' },
  { key: 'ads',           path: '/admin/ads',            label: 'In-App Ads',        icon: Tv2,             permission: 'ads.view' },
  { key: 'reports',       path: '/admin/reports',        label: 'Reports',           icon: BarChart3,       permission: 'reports.view' },
  { key: 'audit_log',     path: '/admin/audit-log',      label: 'Audit Log',         icon: ClipboardList,   permission: 'audit_log.view' },
  { key: 'pricing',       path: '/admin/pricing',        label: 'Pricing',           icon: Tags,            permission: 'pricing.view' },
  { key: 'referrals',     path: '/admin/referrals',      label: 'Referrals',         icon: Gift,            permission: 'referrals.view' },
  { key: 'portfolio',   path: '/admin/portfolio',     label: 'Portfolio',          icon: LayoutGrid,      permission: null },
  { key: 'blog',          path: '/admin/blog',           label: 'Blog',              icon: FileText,        permission: null },
  { key: 'settings',      path: '/admin/settings',       label: 'Settings',          icon: Settings,        permission: 'settings.view' },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const { isStaff, isSuperAdmin, can } = usePermissions();

  const isDesigner        = currentUser?.role === 'designer';
  const isCOD             = currentUser?.role === 'creative_ops_director';
  const isAdsManager       = currentUser?.role === 'ads_manager';
  const isStudiosManager   = currentUser?.role === 'studios_manager';
  const isDevstudioManager = currentUser?.role === 'devstudio_manager';
  const isContentCreator   = currentUser?.role === 'content_creator';
  const isDeveloper        = currentUser?.role === 'developer';
  const isAdminView = location.pathname.startsWith('/admin')
    || location.pathname.startsWith('/creative-ops')
    || location.pathname.startsWith('/ads-manager')
    || location.pathname.startsWith('/studios-manager')
    || location.pathname.startsWith('/devstudio-manager');

  // Layer 2 of the client nav: when a client (never staff — staff have their
  // own dedicated navs above) is inside one of a department's own pages,
  // the sidebar/drawer below switches to that department's subNav instead
  // of the flat clientNav list.
  const activeDept = !isStaff ? findActiveDepartment(location.pathname) : null;
  const DeptIcon = activeDept?.icon;

  // Determine which nav to show:
  // - designer / content_creator / developer → dedicated portal-only nav (production roles)
  // - creative_ops_director / ads_manager / studios_manager / devstudio_manager → their department's focused Manager nav
  // - other staff on /admin/* (Sales, Finance, platform team) → filtered admin nav
  // - clients (or staff on client routes) → client nav
  let navItems;
  if (isDesigner) {
    navItems = designerNav;
  } else if (isContentCreator) {
    navItems = studioPortalNav;
  } else if (isDeveloper) {
    navItems = devPortalNav;
  } else if (isCOD) {
    navItems = codNav;
  } else if (isAdsManager) {
    navItems = adsManagerNav;
  } else if (isStudiosManager) {
    navItems = studiosManagerNav;
  } else if (isDevstudioManager) {
    navItems = devstudioManagerNav;
  } else if (isStaff && isAdminView) {
    navItems = ALL_ADMIN_NAV.filter(item => !item.permission || can(item.permission));
  } else {
    navItems = clientNav;
  }

  // Renders one sidebar/drawer row — a normal Link, or a greyed-out
  // disabled row for "coming soon" items. Shared by every nav branch below.
  const renderNavItem = ({ path, label, icon: Icon, disabled }) => {
    const active = path === '/admin'
      ? location.pathname === '/admin'
      : location.pathname === path || location.pathname.startsWith(path + '/');
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
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1">{label}</span>
        {active && <ChevronRight className="w-3 h-3 opacity-70" />}
      </Link>
    );
  };

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
          {activeDept ? (
            <>
              {/* Department header — you're "inside" this department now */}
              <div className="flex items-center gap-2 px-3 pb-2 mb-1">
                <DeptIcon className="w-4 h-4 text-[hsl(var(--sidebar-primary))]" />
                <span className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--sidebar-foreground))]/70">
                  {activeDept.label}
                </span>
              </div>
              {activeDept.subNav.map(item => renderNavItem(item))}

              {/* Divider — jump to another department or back to the global menu */}
              <div className="pt-3 mt-3 border-t border-[hsl(var(--sidebar-border))] space-y-1">
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[hsl(var(--sidebar-foreground))]/50">
                  Switch Department
                </p>
                {clientNav.filter(item => item.path !== activeDept.homePath).map(item => renderNavItem(item))}
              </div>
            </>
          ) : (
            navItems.map(item => renderNavItem(item))
          )}

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
        <AppBottomNav navItems={navItems} activePath={location.pathname} onMore={() => setSidebarOpen(true)} />
      </div>
    </div>
  );
}

