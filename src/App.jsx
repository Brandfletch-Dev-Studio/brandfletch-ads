import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

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
import PublicFormView from '@/pages/PublicFormView';

// ── Auth pages ──
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AuthCallback from '@/pages/AuthCallback';
import Onboarding from '@/pages/Onboarding';
import ScrollToTop from '@/components/ScrollToTop';

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
const SupportTickets       = lazy(() => import('@/pages/SupportTickets'));
const Designs              = lazy(() => import('@/pages/Designs'));
const DesignPayment        = lazy(() => import('@/pages/DesignPayment'));
const LeadsComingSoon      = lazy(() => import('@/pages/LeadsComingSoon'));
const LeadForms            = lazy(() => import('@/pages/LeadForms'));
const DesignerPortal       = lazy(() => import('@/pages/DesignerPortal'));
const CreativeOpsDashboard = lazy(() => import('@/pages/CreativeOpsDashboard'));
const AdsManagerDashboard  = lazy(() => import('@/pages/AdsManagerDashboard'));
const Referrals            = lazy(() => import('@/pages/Referrals'));
const UgcAds               = lazy(() => import('@/pages/UgcAds'));
const AdminOverview        = lazy(() => import('@/pages/admin/AdminOverview'));
const AdminCampaigns       = lazy(() => import('@/pages/admin/AdminCampaigns'));
const AdminCampaignDetail  = lazy(() => import('@/pages/admin/AdminCampaignDetail'));
const AdminPayments        = lazy(() => import('@/pages/admin/AdminPayments'));
const AdminSettings        = lazy(() => import('@/pages/admin/AdminSettings'));
const AdminUsers           = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminPageRequests    = lazy(() => import('@/pages/admin/AdminPageRequests'));
const AdminReports         = lazy(() => import('@/pages/admin/AdminReports'));
const AdminNotifications   = lazy(() => import('@/pages/admin/AdminNotifications'));
const AdminAds             = lazy(() => import('@/pages/admin/AdminAds'));
const AdminAuditLog        = lazy(() => import('@/pages/admin/AdminAuditLog'));
const AdminPricing         = lazy(() => import('@/pages/admin/AdminPricing'));
const AdminSupportTickets  = lazy(() => import('@/pages/admin/AdminSupportTickets'));
const AdminReferrals       = lazy(() => import('@/pages/admin/AdminReferrals'));
const AdminDesigns         = lazy(() => import('@/pages/admin/AdminDesigns'));
const AdminUgcAds          = lazy(() => import('@/pages/admin/AdminUgcAds'));
const AdminLeads           = lazy(() => import('@/pages/admin/AdminLeads'));
const AdminBlog            = lazy(() => import('@/pages/admin/AdminBlog'));

// ── Helpers ──
const STAFF_ROLES = [
  'admin','super_admin','ads_manager','campaign_manager',
  'finance','sales_manager','creative_ops_director','designer',
];

function staffHome(role) {
  if (role === 'designer')              return '/designer';
  if (role === 'creative_ops_director') return '/creative-ops';
  if (role === 'ads_manager')           return '/ads-manager';
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
  const { pathname } = useLocation();

  if (isLoadingAuth) return <PageSpinner />;

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    window.location.href = defaultAuthRoute();
    return null;
  }

  if (!user) {
    return <Navigate to={defaultAuthRoute()} replace />;
  }

  // Onboarding gate (only if explicitly false — not null/undefined = legacy)
  if (user.onboarded === false && pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

// ── Route tree ────────────────────────────────────────────────────────────────
const AppRoutes = () => (
  <>
    <ScrollToTop />
    <Suspense fallback={<PageSpinner />}>
      <Routes>

        {/* ── Auth utility pages ── */}
        <Route path="/auth/callback"   element={<AuthCallback />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/onboarding"      element={<Onboarding />} />
        <Route path="/login"    element={<AuthPageRoute><Login /></AuthPageRoute>} />
        <Route path="/register" element={<AuthPageRoute><Register /></AuthPageRoute>} />

        {/* ── Public form (no nav chrome) ── */}
        <Route path="/forms/:formId" element={<PublicFormView />} />

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
        <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
          <Route path="/dashboard"             element={<Dashboard />} />
          <Route path="/pages"                 element={<FacebookPages />} />
          <Route path="/campaigns"             element={<CampaignsList />} />
          <Route path="/campaigns/new"         element={<CampaignWizard />} />
          <Route path="/campaigns/:id"         element={<CampaignDetail />} />
          <Route path="/campaigns/:id/payment" element={<CampaignPayment />} />
          <Route path="/audiences"             element={<SavedAudiences />} />
          <Route path="/settings"              element={<ProfileSettings />} />
          <Route path="/designs"               element={<Designs />} />
          <Route path="/designs/payment"       element={<DesignPayment />} />
          <Route path="/ugc-ads"               element={<UgcAds />} />
          <Route path="/leads"                 element={<LeadsComingSoon />} />
          <Route path="/leads/forms"           element={<LeadForms />} />
          <Route path="/referrals"             element={<Referrals />} />
          <Route path="/notifications"         element={<Notifications />} />
          <Route path="/support"               element={<SupportTickets />} />
          <Route path="/messages"              element={<Navigate to="/support" replace />} />
          <Route path="/designer"              element={<DesignerPortal />} />
          <Route path="/creative-ops"          element={<CreativeOpsDashboard />} />
          <Route path="/ads-manager"           element={<AdsManagerDashboard />} />

          {/* Admin */}
          <Route path="/admin"                 element={<AdminOverview />} />
          <Route path="/admin/campaigns"       element={<AdminCampaigns />} />
          <Route path="/admin/campaigns/:id"   element={<AdminCampaignDetail />} />
          <Route path="/admin/payments"        element={<AdminPayments />} />
          <Route path="/admin/pages"           element={<AdminPageRequests />} />
          <Route path="/admin/users"           element={<AdminUsers />} />
          <Route path="/admin/reports"         element={<AdminReports />} />
          <Route path="/admin/notifications"   element={<AdminNotifications />} />
          <Route path="/admin/settings"        element={<AdminSettings />} />
          <Route path="/admin/ads"             element={<AdminAds />} />
          <Route path="/admin/designs"         element={<AdminDesigns />} />
          <Route path="/admin/ugc-ads"         element={<AdminUgcAds />} />
          <Route path="/admin/leads"           element={<AdminLeads />} />
          <Route path="/admin/audit-log"       element={<AdminAuditLog />} />
          <Route path="/admin/pricing"         element={<AdminPricing />} />
          <Route path="/admin/support"         element={<AdminSupportTickets />} />
          <Route path="/admin/referrals"       element={<AdminReferrals />} />
          <Route path="/admin/messages"        element={<Navigate to="/admin/support" replace />} />
          <Route path="/admin/blog"            element={<AdminBlog />} />
        </Route>

        {/* ── 404 ── */}
        <Route path="*" element={<PageNotFound />} />

      </Routes>
    </Suspense>
  </>
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
