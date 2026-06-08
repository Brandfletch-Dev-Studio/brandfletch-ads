import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

// Layout
import AppLayout from '@/components/layout/AppLayout';

// Client pages
import Dashboard from '@/pages/Dashboard';
import FacebookPages from '@/pages/FacebookPages';
import CampaignsList from '@/pages/campaigns/CampaignsList';
import CampaignWizard from '@/pages/campaigns/CampaignWizard';
import CampaignDetail from '@/pages/campaigns/CampaignDetail';
import CampaignPayment from '@/pages/campaigns/CampaignPayment';
import SavedAudiences from '@/pages/SavedAudiences';
import ProfileSettings from '@/pages/ProfileSettings';
import Notifications from '@/pages/Notifications';
import SupportTickets from '@/pages/SupportTickets';
import Designs from '@/pages/Designs';
import DesignPayment from '@/pages/DesignPayment';
import LeadsComingSoon from '@/pages/LeadsComingSoon';
import LeadForms from '@/pages/LeadForms';
import DesignerPortal from '@/pages/DesignerPortal';
import Referrals from '@/pages/Referrals';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import Terms from '@/pages/Terms';
import PublicFormView from '@/pages/PublicFormView';

// Admin pages
import AdminOverview from '@/pages/admin/AdminOverview';
import AdminCampaigns from '@/pages/admin/AdminCampaigns';
import AdminCampaignDetail from '@/pages/admin/AdminCampaignDetail';
import AdminPayments from '@/pages/admin/AdminPayments';
import AdminSettings from '@/pages/admin/AdminSettings';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminPageRequests from '@/pages/admin/AdminPageRequests';
import AdminReports from '@/pages/admin/AdminReports';
import AdminNotifications from '@/pages/admin/AdminNotifications';
import AdminAds from '@/pages/admin/AdminAds';
import AdminAuditLog from '@/pages/admin/AdminAuditLog';
import AdminPricing from '@/pages/admin/AdminPricing';
import AdminSupportTickets from '@/pages/admin/AdminSupportTickets';
import AdminReferrals from '@/pages/admin/AdminReferrals';
import AdminQuotes from '@/pages/admin/AdminQuotes';
import AdminDesigns from '@/pages/admin/AdminDesigns';
import AdminLeads from '@/pages/admin/AdminLeads';
import Onboarding from '@/pages/Onboarding';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];
const SKIP_ONBOARDING_ROUTES = [...AUTH_ROUTES, '/onboarding'];

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user: currentUser } = useAuth();
  const isOnAuthRoute = AUTH_ROUTES.some(r => window.location.pathname.startsWith(r));

  if ((isLoadingPublicSettings || isLoadingAuth) && !isOnAuthRoute) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[hsl(var(--primary))]/20 border-t-[hsl(var(--primary))] rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Loading Brandfletch Ads...</p>
        </div>
      </div>
    );
  }

  const isOnSkipRoute = SKIP_ONBOARDING_ROUTES.some(r => window.location.pathname.startsWith(r));

  if (!isOnAuthRoute) {
    if (authError) {
      if (authError.type === 'user_not_registered') {
        return <UserNotRegisteredError />;
      } else {
        navigateToLogin();
        return null;
      }
    }

    if (!isLoadingAuth && !currentUser) {
      navigateToLogin();
      return null;
    }

    // Fix #4: Use React Router <Navigate> instead of window.location.href
    // This avoids a full page reload and preserves React state/context
    if (!isLoadingAuth && currentUser && !currentUser.onboarded && !isOnSkipRoute) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  // Fix #5: Removed unused `isAdmin` variable
  const isStaff = currentUser && ['admin', 'super_admin', 'ads_manager', 'campaign_manager', 'finance', 'sales_manager', 'creative_ops_director', 'designer'].includes(currentUser.role);

  return (
    <Routes>
      {/* Auth routes - always accessible */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/forms/:formId" element={<PublicFormView />} />

      <Route element={<AppLayout />}>
        {/* Client routes */}
        <Route path="/" element={<Navigate to={isStaff ? "/admin" : "/dashboard"} replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pages" element={<FacebookPages />} />
        <Route path="/campaigns" element={<CampaignsList />} />
        <Route path="/campaigns/new" element={<CampaignWizard />} />
        <Route path="/campaigns/:id" element={<CampaignDetail />} />
        <Route path="/campaigns/:id/payment" element={<CampaignPayment />} />
        <Route path="/audiences" element={<SavedAudiences />} />
        <Route path="/settings" element={<ProfileSettings />} />
        <Route path="/designs" element={<Designs />} />
        <Route path="/designs/payment" element={<DesignPayment />} />
        <Route path="/leads" element={<LeadsComingSoon />} />
        <Route path="/leads/forms" element={<LeadForms />} />
        <Route path="/designer" element={<DesignerPortal />} />
        <Route path="/referrals" element={<Referrals />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/support" element={<SupportTickets />} />
        <Route path="/messages" element={<Navigate to="/support" replace />} />

        {/* Admin/Staff routes */}
        <Route path="/admin" element={<AdminOverview />} />
        <Route path="/admin/campaigns" element={<AdminCampaigns />} />
        <Route path="/admin/campaigns/:id" element={<AdminCampaignDetail />} />
        <Route path="/admin/payments" element={<AdminPayments />} />
        <Route path="/admin/pages" element={<AdminPageRequests />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/notifications" element={<AdminNotifications />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/ads" element={<AdminAds />} />
        <Route path="/admin/designs" element={<AdminDesigns />} />
        <Route path="/admin/leads" element={<LeadsComingSoon />} />
        <Route path="/admin/audit-log" element={<AdminAuditLog />} />
        <Route path="/admin/pricing" element={<AdminPricing />} />
        <Route path="/admin/support" element={<AdminSupportTickets />} />
        <Route path="/admin/referrals" element={<AdminReferrals />} />
        <Route path="/admin/quotes" element={<AdminQuotes />} />
        <Route path="/admin/messages" element={<Navigate to="/admin/support" replace />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
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
