import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Palette, Target, Megaphone, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import CompleteProfileChecklist from '@/components/dashboard/OnboardingChecklist';

export default function Dashboard() {
  const { user, isLoadingAuth } = useAuth();

  const [designs, setDesigns] = useState([]);
  const [leads, setLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fix #1: wait for auth to finish loading before attempting data fetch
    // Without this guard, user is null on first render and data never loads
    if (isLoadingAuth) return;
    if (!user?.id) return;

    async function loadData() {
      setLoading(true);
      try {
        // Fix #1b: use correct filter API — no extra sort/limit positional args
        // Base44 SDK filter: (query, options?) — sort & limit go in options object
        const [des, lds, camps] = await Promise.all([
          base44.entities.DesignRequest.filter({ created_by: user.id }, { sort: '-created_date', limit: 5 }).catch(() => []),
          base44.entities.Lead.filter({ created_by: user.id }, { sort: '-created_date', limit: 5 }).catch(() => []),
          base44.entities.Campaign.filter({ created_by: user.id }, { sort: '-created_date', limit: 5 }).catch(() => []),
        ]);
        setDesigns(des);
        setLeads(lds);
        setCampaigns(camps);
      } catch (err) {
        console.error('Dashboard load error:', err);
        toast.error('Failed to load dashboard data. Please refresh.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.id, isLoadingAuth]); // Fix #1c: depend on isLoadingAuth so it retries once auth resolves

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) return 'Good night';
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const pendingCampaigns = campaigns.filter(c => ['pending_review', 'awaiting_payment', 'draft'].includes(c.status)).length;
  const activeDesigns = designs.filter(d => d.status === 'in_progress' || d.status === 'submitted').length;
  const activeLeads = leads.filter(l => !['won', 'lost'].includes(l.stage)).length;

  // Show skeleton while auth is loading OR data is loading
  if (isLoadingAuth || loading || !user) {
    return (
      <div className="p-4 lg:p-8 space-y-6">
        <div className="h-40 rounded-2xl bg-secondary animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-xl bg-secondary animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-40 rounded-xl bg-secondary animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] p-6 md:p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold font-heading mb-2 pl-5">
            {getGreeting()}, {user?.full_name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-white/90 mb-6 max-w-2xl pl-5">
            Ready to grow your business with high-performing Facebook ad campaigns?
          </p>
          <div className="pl-5">
            <Link to="/campaigns/new">
              <Button size="lg" className="bg-white text-[hsl(var(--primary))] hover:bg-white/90">
                <Megaphone className="w-5 h-5 mr-2" />
                Create Ad Campaign
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Onboarding Checklist — shown to new users until all steps complete */}
      <CompleteProfileChecklist />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/campaigns">
          <Card className="hover:shadow-lg transition-all cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
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
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
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
        <Link to="/designs">
          <Card className="hover:shadow-lg transition-all cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Palette className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeDesigns}</p>
                  <p className="text-xs text-muted-foreground">Designs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/leads">
          <Card className="hover:shadow-lg transition-all cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-orange-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeLeads}</p>
                  <p className="text-xs text-muted-foreground">Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Explore Services CTA */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-foreground mb-1">Explore all Brandfletch services</p>
          <p className="text-sm text-muted-foreground">Ads, designs, websites, UGC content and social media management — transparent pricing, no surprises.</p>
        </div>
        <Link to="/pricing">
          <Button variant="default" size="sm" className="shrink-0 gap-2 whitespace-nowrap">
            View Pricing →
          </Button>
        </Link>
      </div>

</div>
  );
}
