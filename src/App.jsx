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
import Messages from '@/pages/Messages';
import Marketplace from '@/pages/Marketplace';

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
import AdminMessages from '@/pages/admin/AdminMessages';
import AdminAds from '@/pages/admin/AdminAds';
import AdminAuditLog from '@/pages/admin/AdminAuditLog';
import AdminPricing from '@/pages/admin/AdminPricing';
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

    // Redirect to onboarding if user hasn't completed it
    if (!isLoadingAuth && currentUser && !currentUser.onboarded && !isOnSkipRoute) {
      window.location.href = '/onboarding';
      return null;
    }
  }

  const isStaff = currentUser && ['admin', 'super_admin', 'ads_manager', 'campaign_manager', 'finance', 'sales_manager'].includes(currentUser.role);
  const isAdmin = currentUser?.role === 'admin';

  return (
    <Routes>
      {/* Auth routes - always accessible */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/onboarding" element={<Onboarding />} />
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
        <Route path="/messages" element={<Messages />} />
        <Route path="/marketplace" element={<Marketplace />} />

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
        <Route path="/admin/messages" element={<AdminMessages />} />
        <Route path="/admin/ads" element={<AdminAds />} />
        <Route path="/admin/audit-log" element={<AdminAuditLog />} />
        <Route path="/admin/pricing" element={<AdminPricing />} />
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
  )
}

export default App