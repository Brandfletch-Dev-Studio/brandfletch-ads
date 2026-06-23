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

// ── Public / marketing pages (eagerly loaded — no auth needed) ──
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

// ── App pages (lazy loaded — only fetched when user is logged in) ──
const Dashboard          = lazy(() => import('@/pages/Dashboard'));
const FacebookPages      = lazy(() => import('@/pages/FacebookPages'));
const CampaignsList      = lazy(() => import('@/pages/campaigns/CampaignsList'));
const CampaignWizard     = lazy(() => import('@/pages/campaigns/CampaignWizard'));
const CampaignDetail     = lazy(() => import('@/pages/campaigns/CampaignDetail'));
const CampaignPayment    = lazy(() => import('@/pages/campaigns/CampaignPayment'));
const SavedAudiences     = lazy(() => import('@/pages/SavedAudiences'));
const ProfileSettings    = lazy(() => import('@/pages/ProfileSettings'));
const Notifications      = lazy(() => import('@/pages/Notifications'));
const SupportTickets     = lazy(() => import('@/pages/SupportTickets'));
const Designs            = lazy(() => import('@/pages/Designs'));
const DesignPayment      = lazy(() => import('@/pages/DesignPayment'));
const LeadsComingSoon    = lazy(() => import('@/pages/LeadsComingSoon'));
const LeadForms          = lazy(() => import('@/pages/LeadForms'));
const DesignerPortal     = lazy(() => import('@/pages/DesignerPortal'));
const CreativeOpsDashboard = lazy(() => import('@/pages/CreativeOpsDashboard'));
const AdsManagerDashboard  = lazy(() => import('@/pages/AdsManagerDashboard'));
const Referrals          = lazy(() => import('@/pages/Referrals'));
const AdminOverview      = lazy(() => import('@/pages/admin/AdminOverview'));
const AdminCampaigns     = lazy(() => import('@/pages/admin/AdminCampaigns'));
const AdminCampaignDetail = lazy(() => import('@/pages/admin/AdminCampaignDetail'));
const AdminPayments      = lazy(() => import('@/pages/admin/AdminPayments'));
const AdminSettings      = lazy(() => import('@/pages/admin/AdminSettings'));
const AdminUsers         = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminPageRequests  = lazy(() => import('@/pages/admin/AdminPageRequests'));
const AdminReports       = lazy(() => import('@/pages/admin/AdminReports'));
const AdminNotifications = lazy(() => import('@/pages/admin/AdminNotifications'));
const AdminAds           = lazy(() => import('@/pages/admin/AdminAds'));
const AdminAuditLog      = lazy(() => import('@/pages/admin/AdminAuditLog'));
const AdminPricing       = lazy(() => import('@/pages/admin/AdminPricing'));
const AdminSupportTickets = lazy(() => import('@/pages/admin/AdminSupportTickets'));
const AdminReferrals     = lazy(() => import('@/pages/admin/AdminReferrals'));
const AdminDesigns       = lazy(() => import('@/pages/admin/AdminDesigns'));
const AdminUgcAds        = lazy(() => import('@/pages/admin/AdminUgcAds'));
const AdminLeads       = lazy(() => import('@/pages/admin/AdminLeads'));
const AdminBlog        = lazy(() => import('@/pages/admin/AdminBlog'));

// ── Route constants ──
const AUTH_ROUTES         = ['/forgot-password', '/reset-password', '/auth/callback'];
const PUBLIC_MARKETING_ROUTES = ['/about', '/pricing', '/contact', '/blog', '/privacy-policy', '/terms', '/forms'];
const SKIP_ONBOARDING_ROUTES  = [...AUTH_ROUTES, '/login', '/register', '/onboarding'];

const getDefaultAuthRoute = () =>
  localStorage.getItem('bf_visited') ? '/login' : '/register';

function getStaffLandingPath(role) {
  if (role === 'designer') return '/designer';
  if (role === 'creative_ops_director') return '/creative-ops';
  if (role === 'ads_manager') return '/ads-manager';
  return '/admin';
}

// Thin spinner used inside Suspense for lazy-loaded app pages
const PageSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-[hsl(var(--primary))]/20 border-t-[hsl(var(--primary))] rounded-full animate-spin" />
  </div>
);

// ── Authenticated section of the app ──
const AuthenticatedApp = () => {
  const { isLoadingAuth, authError, user: currentUser } = useAuth();
  const { pathname: path } = useLocation();

  const isOnAuthRoute    = AUTH_ROUTES.some(r => path.startsWith(r));
  const isOnPublicRoute  = PUBLIC_MARKETING_ROUTES.some(r => path === r || path.startsWith(r + '/'));
  const isOnSkipRoute    = SKIP_ONBOARDING_ROUTES.some(r => path.startsWith(r));

  // ── Public marketing & auth routes render immediately — no auth gate ──
  if (isOnPublicRoute || isOnAuthRoute) {
    return (
      <Suspense fallback={<PageSpinner />}>
        <ScrollToTop />
        <Routes>
          {/* Auth — only true bypass routes land here */}
          <Route path="/auth/callback"    element={<AuthCallback />} />
          <Route path="/forgot-password"  element={<ForgotPassword />} />
          <Route path="/reset-password"   element={<ResetPassword />} />

          {/* Marketing */}
          <Route element={<PublicLayout />}>
            <Route path="/"               element={<Home />} />
            <Route path="/about"          element={<AboutPage />} />
            <Route path="/pricing"        element={<PricingPage />} />
            <Route path="/contact"        element={<ContactPage />} />
            <Route path="/blog"           element={<BlogIndex />} />
            <Route path="/blog/:slug"     element={<BlogPost />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms"          element={<Terms />} />
          </Route>
          <Route path="/forms/:formId"    element={<PublicFormView />} />
          <Route path="*"                 element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    );
  }

  // ── Protected app routes — wait for auth check ──
  if (isLoadingAuth) return <PageSpinner />;

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    window.location.href = getDefaultAuthRoute();
    return null;
  }

  if (!currentUser && !isOnSkipRoute) {
    // "/" always shows the marketing home page for unauthenticated visitors
    if (path === '/') {
      return (
        <Suspense fallback={<PageSpinner />}>
          <ScrollToTop />
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      );
    }
    return <Navigate to={getDefaultAuthRoute()} replace />;
  }

  // Only redirect to onboarding if onboarded is explicitly false.
  // null/undefined means the field hasn't loaded yet or is a legacy account — do NOT redirect.
  if (currentUser && currentUser.onboarded === false && !isOnSkipRoute) {
    return <Navigate to="/onboarding" replace />;
  }

  const STAFF_ROLES = ['admin','super_admin','ads_manager','campaign_manager','finance','sales_manager','creative_ops_director','designer'];
  const isStaff = currentUser && STAFF_ROLES.includes(currentUser.role);

  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route path="/login"           element={
          currentUser
            ? <Navigate to={isStaff ? getStaffLandingPath(currentUser?.role) : '/dashboard'} replace />
            : <Login />
        } />
        <Route path="/register"        element={
          currentUser
            ? <Navigate to={isStaff ? getStaffLandingPath(currentUser?.role) : '/dashboard'} replace />
            : <Register />
        } />
        <Route path="/auth/callback"   element={<AuthCallback />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/onboarding"      element={<Onboarding />} />

        {/* Marketing (accessible even when logged in) */}
        <Route element={<PublicLayout />}>
          <Route path="/"              element={
            isStaff
              ? <Navigate to={getStaffLandingPath(currentUser?.role)} replace />
              : <Navigate to="/dashboard" replace />
          } />
          <Route path="/about"         element={<AboutPage />} />
          <Route path="/pricing"       element={<PricingPage />} />
          <Route path="/contact"       element={<ContactPage />} />
          <Route path="/blog"          element={<BlogIndex />} />
          <Route path="/blog/:slug"    element={<BlogPost />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms"         element={<Terms />} />
        </Route>
        <Route path="/forms/:formId"   element={<PublicFormView />} />

        <Route element={<AppLayout />}>
          <Route path="/dashboard"            element={<Dashboard />} />
          <Route path="/pages"                element={<FacebookPages />} />
          <Route path="/campaigns"            element={<CampaignsList />} />
          <Route path="/campaigns/new"        element={<CampaignWizard />} />
          <Route path="/campaigns/:id"        element={<CampaignDetail />} />
          <Route path="/campaigns/:id/payment" element={<CampaignPayment />} />
          <Route path="/audiences"            element={<SavedAudiences />} />
          <Route path="/settings"             element={<ProfileSettings />} />
          <Route path="/designs"              element={<Designs />} />
          <Route path="/designs/payment"      element={<DesignPayment />} />
          <Route path="/ugc-ads"              element={<UgcAds />} />
          <Route path="/leads"                element={<LeadsComingSoon />} />
          <Route path="/leads/forms"          element={<LeadForms />} />
          <Route path="/referrals"            element={<Referrals />} />
          <Route path="/notifications"        element={<Notifications />} />
          <Route path="/support"              element={<SupportTickets />} />
          <Route path="/messages"             element={<Navigate to="/support" replace />} />
          <Route path="/designer"             element={<DesignerPortal />} />
          <Route path="/creative-ops"         element={<CreativeOpsDashboard />} />
          <Route path="/ads-manager"          element={<AdsManagerDashboard />} />
          <Route path="/admin"                element={<AdminOverview />} />
          <Route path="/admin/campaigns"      element={<AdminCampaigns />} />
          <Route path="/admin/campaigns/:id"  element={<AdminCampaignDetail />} />
          <Route path="/admin/payments"       element={<AdminPayments />} />
          <Route path="/admin/pages"          element={<AdminPageRequests />} />
          <Route path="/admin/users"          element={<AdminUsers />} />
          <Route path="/admin/reports"        element={<AdminReports />} />
          <Route path="/admin/notifications"  element={<AdminNotifications />} />
          <Route path="/admin/settings"       element={<AdminSettings />} />
          <Route path="/admin/ads"            element={<AdminAds />} />
          <Route path="/admin/designs"        element={<AdminDesigns />} />
          <Route path="/admin/ugc-ads"        element={<AdminUgcAds />} />
          <Route path="/admin/leads"          element={<AdminLeads />} />
          <Route path="/admin/audit-log"      element={<AdminAuditLog />} />
          <Route path="/admin/pricing"        element={<AdminPricing />} />
          <Route path="/admin/support"        element={<AdminSupportTickets />} />
          <Route path="/admin/referrals"      element={<AdminReferrals />} />
          <Route path="/admin/messages"       element={<Navigate to="/admin/support" replace />} />
          <Route path="/admin/blog"           element={<AdminBlog />} />
        </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
