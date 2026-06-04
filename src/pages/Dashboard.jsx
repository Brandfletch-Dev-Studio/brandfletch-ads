import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';

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
  const [designs, setDesigns] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { init(); }, []);

  async function init() {
    const u = await base44.auth.me();
    setUser(u);
    const [camps, pgs, des, lds] = await Promise.all([
      base44.entities.Campaign.filter({ user_id: u.id }, '-created_date', 10),
      base44.entities.FacebookPage.filter({ user_id: u.id }, '-created_date'),
      base44.entities.DesignRequest.filter({ user_id: u.id }, '-created_date', 5),
      base44.entities.Lead.filter({ user_id: u.id }, '-created_date', 5),
    ]);
    setCampaigns(camps);
    setPages(pgs);
    setDesigns(des);
    setLeads(lds);
    setLoading(false);
  }

  const activeCampaigns   = campaigns.filter(c => c.status === 'active').length;
  const pendingCampaigns  = campaigns.filter(c => ['pending_review', 'awaiting_payment'].includes(c.status)).length;
  const connectedPages    = pages.filter(p => p.connection_status === 'connected').length;
  const totalCampaigns    = campaigns.length;
  const activeDesigns     = designs.filter(d => d.status === 'in_progress' || d.status === 'submitted').length;
  const activeLeads       = leads.filter(l => !['won', 'lost'].includes(l.stage)).length;

  const stats = [
    { label: 'Active Campaigns',  value: activeCampaigns,  to: '/campaigns', accent: 'border-l-green-500' },
    { label: 'Awaiting Review',   value: pendingCampaigns, to: '/campaigns', accent: 'border-l-amber-400' },
    { label: 'Connected Pages',   value: connectedPages,   to: '/pages',     accent: 'border-l-blue-500' },
    { label: 'Total Campaigns',   value: totalCampaigns,   to: '/campaigns', accent: 'border-l-[hsl(var(--primary))]' },
    { label: 'Designs in Progress', value: activeDesigns,   to: '/designs',   accent: 'border-l-purple-500' },
    { label: 'Active Leads',      value: activeLeads,      to: '/leads',     accent: 'border-l-orange-500' },
  ];

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.full_name || user?.email}</p>
        </div>
        <Link to="/campaigns/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.to}>
            <Card className={`border-l-4 ${stat.accent} hover:shadow-md transition-shadow cursor-pointer`}>
              <CardContent className="p-4">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaigns */}
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

        {/* Design Requests */}
        {designs.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Design Requests</CardTitle>
              <Link to="/designs" className="text-xs text-[hsl(var(--accent))] hover:underline font-medium">View all</Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {designs.slice(0, 5).map(d => (
                  <Link
                    key={d.id}
                    to="/designs"
                    className="flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition-colors gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{d.title}</p>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">{d.design_type.replace('_', ' ')}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        d.status === 'completed' || d.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        d.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {d.status.replace('_', ' ')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leads */}
        {leads.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent Leads</CardTitle>
              <Link to="/leads" className="text-xs text-[hsl(var(--accent))] hover:underline font-medium">View all</Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {leads.slice(0, 5).map(l => (
                  <Link
                    key={l.id}
                    to="/leads"
                    className="flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition-colors gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{l.lead_name}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{l.company || 'No company'}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        l.stage === 'won' ? 'bg-green-100 text-green-700' :
                        l.stage === 'lost' ? 'bg-red-100 text-red-700' :
                        l.stage === 'new_lead' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {l.stage.replace('_', ' ')}
                      </span>
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

      {/* Empty state prompts */}
      {campaigns.length === 0 && designs.length === 0 && leads.length === 0 && pages.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">No campaigns yet</p>
              <Link to="/campaigns/new">
                <Button>Create Campaign</Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">No design requests</p>
              <Link to="/designs">
                <Button variant="outline">Request Design</Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">No leads yet</p>
              <Link to="/leads/forms">
                <Button variant="outline">Create Lead Form</Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">No pages connected</p>
              <Link to="/pages">
                <Button variant="outline">Connect Page</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}