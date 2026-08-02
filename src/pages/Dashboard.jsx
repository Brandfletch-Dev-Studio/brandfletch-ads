import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Megaphone, Clock, Facebook, Users, Rocket, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import CompleteProfileChecklist from '@/components/dashboard/OnboardingChecklist';

// Campaign statuses that indicate the user has paid / is past the payment step
const PAID_STATUSES = ['pending_review', 'approved', 'active', 'completed'];

export default function Dashboard() {
  const { user, isLoadingAuth } = useAuth();

  const [campaigns, setCampaigns] = useState([]);
  const [fbPages, setFbPages] = useState([]);
  const [audiences, setAudiences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!user?.id) return;

    async function loadData() {
      setLoading(true);
      try {
        const [camps, fbPagesData, audiencesData] = await Promise.all([
          base44.entities.Campaign.filter({ created_by: user.id }, { sort: '-created_date', limit: 50 }).catch(() => []),
          base44.entities.FacebookPage.filter({ created_by: user.id }).catch(() => []),
          base44.entities.SavedAudience.filter({ created_by: user.id }).catch(() => []),
        ]);
        setCampaigns(camps || []);
        setFbPages(fbPagesData || []);
        setAudiences(audiencesData || []);
      } catch (err) {
        console.error('Dashboard load error:', err);
        toast.error('Failed to load dashboard data. Please refresh.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.id, isLoadingAuth]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) return 'Good night';
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const activeCampaigns   = campaigns.filter(c => c.status === 'active').length;
  const pendingCampaigns  = campaigns.filter(c => ['pending_review', 'awaiting_payment', 'draft'].includes(c.status)).length;
  const connectedPages    = fbPages.filter(p => p.connection_status === 'connected').length;
  const totalAudiences    = audiences.length;

  // Has the user completed at least one paid campaign?
  const hasPaidCampaign = campaigns.some(c => PAID_STATUSES.includes(c.status));
  const hasAnyCampaign  = campaigns.length > 0;

  if (isLoadingAuth || loading || !user) {
    return (
      <div className="p-4 lg:p-8 space-y-6">
        <div className="h-40 rounded-2xl bg-secondary animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-xl bg-secondary animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] p-6 md:p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold font-heading mb-2">
            {getGreeting()}, {user?.full_name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-white/90 mb-6 max-w-2xl">
            Ready to grow your business with high-performing Facebook ad campaigns?
          </p>
          <Link to="/campaigns/new">
            <Button size="lg" className="bg-white text-[hsl(var(--primary))] hover:bg-white/90">
              <Megaphone className="w-5 h-5 mr-2" />
              Create Ad Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* Onboarding Checklist */}
      <CompleteProfileChecklist />

      {/* ── Pre-campaign onboarding message ── */}
      {/* Shows when user has NOT yet completed a paid campaign */}
      {!hasPaidCampaign && (
        <Card className="border-2 border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <Rocket className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground mb-1">Set up your first campaign to get started</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Create your first ad campaign and complete payment. After that, a Brandfletch Media agent
                  will guide you through the Facebook Page onboarding process — connecting your page,
                  granting partner access, and getting your ads live.
                </p>
                {!hasAnyCampaign && (
                  <Link to="/campaigns/new" className="inline-block mt-3">
                    <Button size="sm" className="gap-2">
                      <Megaphone className="w-4 h-4" /> Create Your First Campaign
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                )}
                {hasAnyCampaign && !hasPaidCampaign && (
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-3 font-medium">
                    You have a campaign in progress. Complete payment to unlock Facebook onboarding.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Facebook Page onboarding section ── */}
      {/* Only shows AFTER the user has a paid campaign */}
      {hasPaidCampaign && (
        <Card className="border-2 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Facebook className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-foreground mb-0.5">
                  {connectedPages > 0
                    ? `${connectedPages} Facebook ${connectedPages === 1 ? 'Page' : 'Pages'} connected`
                    : 'Connect your Facebook Page'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {connectedPages > 0
                    ? 'Manage your connected pages or add another one.'
                    : 'A Brandfletch agent will guide you through granting partner access to your page.'}
                </p>
              </div>
            </div>
            <Link to="/pages">
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shrink-0 whitespace-nowrap">
                <Facebook className="w-4 h-4" /> {connectedPages > 0 ? 'Manage Pages' : 'Start Onboarding'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/campaigns">
          <Card className="hover:shadow-lg transition-all cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeCampaigns}</p>
                  <p className="text-xs text-muted-foreground">Active Campaigns</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/campaigns">
          <Card className="hover:shadow-lg transition-all cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingCampaigns}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Facebook Pages card — only clickable if user has a paid campaign */}
        {hasPaidCampaign ? (
          <Link to="/pages">
            <Card className="hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0">
                    <Facebook className="w-5 h-5 text-indigo-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{connectedPages}</p>
                    <p className="text-xs text-muted-foreground">Pages Connected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Card className="opacity-60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center flex-shrink-0">
                  <Facebook className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-muted-foreground">—</p>
                  <p className="text-xs text-muted-foreground">Pages (after first campaign)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Link to="/audiences">
          <Card className="hover:shadow-lg transition-all cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalAudiences}</p>
                  <p className="text-xs text-muted-foreground">Saved Audiences</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

    </div>
  );
}
