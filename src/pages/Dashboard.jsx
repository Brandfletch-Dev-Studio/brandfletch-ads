import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import AdPlacement from '@/components/ads/AdPlacement';
import AgentChatWidget from '@/components/agents/AgentChatWidget';

const PAGE_STATUS_STYLES = {
  connected:            'bg-green-100 text-green-700',
  rejected:             'bg-red-100 text-red-700',
  pending_verification: 'bg-amber-100 text-amber-700',
};

const PAGE_STATUS_LABELS = {
  connected:            'Connected',
  rejected:             'Rejected',
  pending_verification: 'Pending',
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { init(); }, []);

  async function init() {
    const u = await base44.auth.me();
    setUser(u);
    const [camps, pgs] = await Promise.all([
      base44.entities.Campaign.filter({ user_id: u.id }, '-created_date', 10),
      base44.entities.FacebookPage.filter({ user_id: u.id }, '-created_date'),
    ]);
    setCampaigns(camps);
    setPages(pgs);
    setLoading(false);
  }

  const activeCampaigns   = campaigns.filter(c => c.status === 'active').length;
  const pendingCampaigns  = campaigns.filter(c => ['pending_review', 'awaiting_payment'].includes(c.status)).length;
  const connectedPages    = pages.filter(p => p.connection_status === 'connected').length;
  const totalCampaigns    = campaigns.length;

  const stats = [
    { label: 'Active Campaigns',  value: activeCampaigns,  to: '/campaigns', accent: 'border-l-green-500' },
    { label: 'Awaiting Review',   value: pendingCampaigns, to: '/campaigns', accent: 'border-l-amber-400' },
    { label: 'Connected Pages',   value: connectedPages,   to: '/pages',     accent: 'border-l-blue-500' },
    { label: 'Total Campaigns',   value: totalCampaigns,   to: '/campaigns', accent: 'border-l-[hsl(var(--primary))]' },
  ];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest mb-1">Dashboard</p>
          <h1 className="text-2xl lg:text-3xl font-bold font-heading">
            {greeting()}{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {loading ? 'Loading your account...' : `You have ${activeCampaigns} active campaign${activeCampaigns !== 1 ? 's' : ''} running right now.`}
          </p>
        </div>
        <Link to="/campaigns/new">
          <Button className="gap-2 font-semibold">
            <Plus className="w-4 h-4" /> New Campaign
          </Button>
        </Link>
      </div>

      <AdPlacement placement="dashboard_top" userId={user?.id} hasCampaigns={campaigns.length > 0} hasPages={pages.length > 0} />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, to, accent }) => (
          <Link key={label} to={to}>
            <Card className={`shadow-sm border-l-4 ${accent} hover:shadow-md transition-shadow cursor-pointer h-full`}>
              <CardContent className="p-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
                <p className="text-3xl font-bold font-heading mt-2 tabular-nums">{loading ? '—' : value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* No page CTA */}
      {!loading && pages.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-border bg-secondary/30 px-6 py-8 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-base">Connect a Facebook Page to get started</h3>
            <p className="text-sm text-muted-foreground mt-1">You need at least one connected page before you can create campaigns.</p>
          </div>
          <Link to="/pages" className="flex-shrink-0">
            <Button variant="outline" className="gap-2">
              Connect a Page <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}

      <AdPlacement placement="dashboard_bottom" userId={user?.id} hasCampaigns={campaigns.length > 0} hasPages={pages.length > 0} />

      {/* Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Campaigns */}
        {campaigns.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent Campaigns</CardTitle>
              <Link to="/campaigns" className="text-xs text-[hsl(var(--accent))] hover:underline font-medium">View all</Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {campaigns.slice(0, 5).map(c => (
                  <Link
                    key={c.id}
                    to={`/campaigns/${c.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition-colors gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{c.page_name || 'Campaign'}</p>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">{c.package} · {c.duration}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <StatusBadge status={c.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Facebook Pages */}
        {pages.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Facebook Pages</CardTitle>
              <Link to="/pages" className="text-xs text-[hsl(var(--accent))] hover:underline font-medium">Manage</Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {pages.slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3 gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{p.page_name}</p>
                      {p.page_url && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{p.page_url}</p>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${PAGE_STATUS_STYLES[p.connection_status] || PAGE_STATUS_STYLES.pending_verification}`}>
                      {PAGE_STATUS_LABELS[p.connection_status] || 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* AI Assistant Chat Widget */}
      <AgentChatWidget 
        agentName="campaign_setup_assistant" 
        triggerPrompt="Need help starting your first campaign?" 
      />
    </div>
  );
}