import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Megaphone, Clock, Facebook, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import CompleteProfileChecklist from '@/components/dashboard/OnboardingChecklist';

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

      {/* Facebook Page connection prompt — only if no connected pages */}
      {connectedPages === 0 && (
        <Card className="border-2 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Facebook className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-foreground mb-0.5">Connect your Facebook Page</p>
                <p className="text-sm text-muted-foreground">
                  Grant Brandfletch access to manage your ads — do this before creating a campaign.
                </p>
              </div>
            </div>
            <Link to="/pages">
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shrink-0 whitespace-nowrap">
                <Facebook className="w-4 h-4" /> Connect Page
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
