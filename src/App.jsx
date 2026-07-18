import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import React, { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import PageNotFound from "@/lib/PageNotFound";
// Layout
import AppLayout from '@/components/layout/AppLayout';

// ── Public / marketing pages ──
import PublicLayout from '@/components/layout/PublicLayout';
import Home from '@/pages/public/Home';
import AboutPage from '@/pages/public/AboutPage';
import PricingPage from '@/pages/public/PricingPage';
import ContactPage from '@/pages/public/ContactPage';
import BlogIndex from '@/pages/public/BlogIndex';
import BlogPost from '@/pages/public/BlogPost';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import Terms from '@/pages/Terms';

// ── Auth pages ──
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AuthCallback from '@/pages/AuthCallback';
import ScrollToTop from '@/components/ScrollToTop';
import { STAFF_ROLES, DEPARTMENTS, getDepartmentForRole, isOperationsRole, isDepartmentManagerRole } from '@/lib/permissions';

// ── App pages (lazy) ──
const Dashboard            = lazy(() => import('@/pages/Dashboard'));
const FacebookPages        = lazy(() => import('@/pages/FacebookPages'));
const CampaignsList        = lazy(() => import('@/pages/campaigns/CampaignsList'));
const CampaignWizard       = lazy(() => import('@/pages/campaigns/CampaignWizard'));
const CampaignDetail       = lazy(() => import('@/pages/campaigns/CampaignDetail'));
const CampaignPayment      = lazy(() => import('@/pages/campaigns/CampaignPayment'));
const SavedAudiences       = lazy(() => import('@/pages/SavedAudiences'));
const ProfileSettings      = lazy(() => import('@/pages/ProfileSettings'));
const Notifications        = lazy(() => import('@/pages/Notifications'));
const AdsManagerDashboard  = lazy(() => import('@/pages/AdsManagerDashboard'));
const Referrals            = lazy(() => import('@/pages/Referrals'));
const AdminOverview        = lazy(() => import('@/pages/admin/AdminOverview'));
const AdminCampaigns       = lazy(() => import('@/pages/admin/AdminCampaigns'));
const AdminCampaignDetail  = lazy(() => import('@/pages/admin/AdminCampaignDetail'));
const AdminPayments        = lazy(() => import('@/pages/admin/AdminPayments'));
const AdminSettings        = lazy(() => import('@/pages/admin/AdminSettings'));
const AdminUsers           = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminReports         = lazy(() => import('@/pages/admin/AdminReports'));
const AdminNotifications   = lazy(() => import('@/pages/admin/AdminNotifications'));
const AdminAds             = lazy(() => import('@/pages/admin/AdminAds'));
const AdminAuditLog        = lazy(() => import('@/pages/admin/AdminAuditLog'));
const AdminReferrals       = lazy(() => import('@/pages/admin/AdminReferrals'));
const AdminBlog            = lazy(() => import('@/pages/admin/AdminBlog'));


// ── ErrorBoundary ─────────────────────────────────────────────────────────────
// Catches render-phase errors in the route tree and shows a fallback instead
// of a blank white screen. Must be a class component — React requirement.
// A stale-chunk failure happens when the browser has an old page open, we ship
// a new deploy (new hashed asset filenames), and the old page then tries to
// lazy-load a chunk that no longer exists on the server. It's not a real bug —
// the fix is just "load the current version" — so we detect it and reload
// automatically once, instead of dead-ending the user on a generic error page.
function isChunkLoadError(error) {
  const msg = error?.message || '';
  return (
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    (error?.name === 'TypeError' && /dynamically imported module/i.test(msg))
  );
}

const CHUNK_RELOAD_FLAG = 'bf_chunk_reload_attempted';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, isStaleChunk: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error, isStaleChunk: isChunkLoadError(error) };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught render error:', error, info);

    if (isChunkLoadError(error)) {
      // Only auto-reload once per session — if it happens again right after a
      // fresh reload, it's a real network/offline issue, not a stale chunk,
      // so we fall through to the visible fallback UI instead of looping.
      const alreadyTried = sessionStorage.getItem(CHUNK_RELOAD_FLAG);
      if (!alreadyTried) {
        sessionStorage.setItem(CHUNK_RELOAD_FLAG, '1');
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.state.isStaleChunk) {
        return (
          <div className="fixed inset-0 flex flex-col items-center justify-center bg-background text-foreground gap-4 p-8">
            <div className="w-8 h-8 border-4 border-[hsl(var(--primary))]/20 border-t-[hsl(var(--primary))] rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm text-center max-w-sm">
              Loading the latest version…
            </p>
          </div>
        );
      }
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-background text-foreground gap-4 p-8">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground text-sm text-center max-w-sm">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Go to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Helpers ──
// STAFF_ROLES now lives in permissions.js (single source of truth) — this used
// to be a second, separately-maintained copy that could silently drift out of
// sync with the real role list.

function staffHome(role) {
  // Portal-only production roles (designer, content_creator, developer) go
  // straight to their portal.
  if (isOperationsRole(role)) {
    const dept = getDepartmentForRole(role);
    if (dept && DEPARTMENTS[dept].portalPath) return DEPARTMENTS[dept].portalPath;
  }
  // Department Managers get their own personal department dashboard.
  if (isDepartmentManagerRole(role)) {
    const dept = getDepartmentForRole(role);
    if (dept) return DEPARTMENTS[dept].dashboardPath;
  }
  // Everyone else (Sales/Finance in any department, platform team) lands on
  // the shared admin overview, filtered to whatever they have access to.
  return '/admin';
}

function defaultAuthRoute() {
  return localStorage.getItem('bf_visited') ? '/login' : '/register';
}

const PageSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-[hsl(var(--primary))]/20 border-t-[hsl(var(--primary))] rounded-full animate-spin" />
  </div>
);

// ── HomeRoute ─────────────────────────────────────────────────────────────────
// "/" → dashboard for authenticated users, Home page for guests.
// Auth check happens here so the rest of the public route tree is instant.
function HomeRoute() {
  const { isLoadingAuth, user } = useAuth();
  // While auth resolves, show spinner (only on "/", not all public pages)
  if (isLoadingAuth) return <PageSpinner />;
  if (!user) return <Home />;
  const isStaff = STAFF_ROLES.includes(user.role);
  return <Navigate to={isStaff ? staffHome(user.role) : '/dashboard'} replace />;
}

// ── AuthPageRoute ─────────────────────────────────────────────────────────────
// /login and /register → redirect authenticated users to their home
function AuthPageRoute({ children }) {
  const { isLoadingAuth, user } = useAuth();
  if (isLoadingAuth) return <PageSpinner />;
  if (!user) return children;
  const isStaff = STAFF_ROLES.includes(user.role);
  return <Navigate to={isStaff ? staffHome(user.role) : '/dashboard'} replace />;
}

// ── AuthGuard ─────────────────────────────────────────────────────────────────
// Wraps all authenticated app routes (/dashboard, /campaigns, /admin, etc.)
// Public pages are NOT wrapped by this — they render freely for everyone.
function AuthGuard({ children }) {
  const { isLoadingAuth, authError, user } = useAuth();
  const { pathname, search } = useLocation();

  if (isLoadingAuth) return <PageSpinner />;

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    window.location.href = defaultAuthRoute();
    return null;
  }

  if (!user) {
    // Preserve exactly where they were headed (e.g. a guest-created order's
    // payment page) so Login/Register can bounce them straight back after
    // auth instead of dropping them on the dashboard. Login.jsx, Register.jsx
    // and AuthCallback.jsx already read this `redirect` param generically.
    const target = pathname + search;
    return <Navigate to={`${defaultAuthRoute()}?redirect=${encodeURIComponent(target)}`} replace />;
  }

  return children;
}

// ── GuestAppRoute ─────────────────────────────────────────────────────────────
// Like AppLayout but accessible without login. Used for ordering flows that
// work with or without an account (e.g. /campaigns/new).
function GuestAppRoute({ children }) {
  return <AppLayout />;
}

// ── Route tree ────────────────────────────────────────────────────────────────
const AppRoutes = () => (
  <ErrorBoundary>
    <ScrollToTop />
    <Suspense fallback={<PageSpinner />}>
      <Routes>

        {/* ── Auth utility pages ── */}
        <Route path="/auth/callback"   element={<AuthCallback />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/login"    element={<AuthPageRoute><Login /></AuthPageRoute>} />
        <Route path="/register" element={<AuthPageRoute><Register /></AuthPageRoute>} />

        {/* ── Public form (no nav chrome) ── */}
        {/* ── Guest order flow (no nav chrome) ── */}

        {/* ── Public marketing pages ─────────────────────────────────────────
            These render for EVERYONE — authenticated or not.
            "/" is special: authenticated users are redirected to /dashboard.
            All other marketing pages (/pricing, /about, etc.) always show
            their content regardless of auth state.
        ─────────────────────────────────────────────────────────────────── */}
        <Route element={<PublicLayout />}>
          <Route path="/"               element={<HomeRoute />} />
          <Route path="/about"          element={<AboutPage />} />
          <Route path="/pricing"        element={<PricingPage />} />
          <Route path="/contact"        element={<ContactPage />} />
          <Route path="/blog"           element={<BlogIndex />} />
          <Route path="/blog/:slug"     element={<BlogPost />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms"          element={<Terms />} />
        </Route>

        {/* ── Authenticated app pages ────────────────────────────────────────
            AuthGuard waits for auth and redirects to login if not logged in.
            These are completely separate from the public route tree above.
        ─────────────────────────────────────────────────────────────────── */}
        {/* Semi-public ordering flows — accessible with or without login */}
        <Route element={<GuestAppRoute />}>
          <Route path="/campaigns/new" element={<CampaignWizard />} />
        </Route>

        <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
          <Route path="/dashboard"             element={<Dashboard />} />
          <Route path="/pages"                 element={<FacebookPages />} />
          <Route path="/campaigns"             element={<CampaignsList />} />
          <Route path="/campaigns/:id"         element={<CampaignDetail />} />
          <Route path="/campaigns/:id/payment" element={<CampaignPayment />} />
          <Route path="/audiences"             element={<SavedAudiences />} />
          <Route path="/settings"              element={<ProfileSettings />} />
          <Route path="/referrals"             element={<Referrals />} />
          <Route path="/notifications"         element={<Notifications />} />
          <Route path="/ads-manager"           element={<AdsManagerDashboard />} />

          {/* Admin */}
          <Route path="/admin"                 element={<AdminOverview />} />
          <Route path="/admin/campaigns"       element={<AdminCampaigns />} />
          <Route path="/admin/campaigns/:id"   element={<AdminCampaignDetail />} />
          <Route path="/admin/payments"        element={<AdminPayments />} />
          <Route path="/admin/users"           element={<AdminUsers />} />
          <Route path="/admin/reports"         element={<AdminReports />} />
          <Route path="/admin/notifications"   element={<AdminNotifications />} />
          <Route path="/admin/settings"        element={<AdminSettings />} />
          <Route path="/admin/ads"             element={<AdminAds />} />
          <Route path="/admin/audit-log"       element={<AdminAuditLog />} />
          <Route path="/admin/referrals"       element={<AdminReferrals />} />
          <Route path="/admin/blog"            element={<AdminBlog />} />
        </Route>

        {/* ── 404 — wrapped in PublicLayout so header/footer show ── */}
        <Route element={<PublicLayout />}>
          <Route path="*" element={<PageNotFound />} />
        </Route>

      </Routes>
    </Suspense>
  </ErrorBoundary>
);

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;







