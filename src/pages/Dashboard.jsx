import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Megaphone, Facebook, Wallet, Plus, ArrowRight, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import OnboardingChecklist from '@/components/dashboard/OnboardingChecklist';
import { formatLocalCurrency } from '@/lib/constants';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [pages, setPages] = useState([]);
  const [wallet, setWallet] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const u = await base44.auth.me();
    setUser(u);
    const [camps, pgs, txns] = await Promise.all([
      base44.entities.Campaign.filter({ user_id: u.id }, '-created_date', 10),
      base44.entities.FacebookPage.filter({ user_id: u.id }, '-created_date'),
      base44.entities.WalletTransaction.filter({ user_id: u.id, status: 'confirmed' }),
    ]);
    setCampaigns(camps);
    setPages(pgs);
    const bal = txns.reduce((sum, t) => {
      if (t.type === 'top_up') return sum + (t.amount || 0);
      if (t.type === 'payment') return sum - (t.amount || 0);
      if (t.type === 'refund') return sum + (t.amount || 0);
      return sum;
    }, 0);
    setWallet(bal);
    setLoading(false);
  }

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const pendingCampaigns = campaigns.filter(c => ['pending_review', 'awaiting_payment'].includes(c.status)).length;
  const connectedPages = pages.filter(p => p.connection_status === 'connected').length;

  const stats = [
    { label: 'Active Campaigns', value: activeCampaigns, icon: Activity, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Pending Review', value: pendingCampaigns, icon: Megaphone, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Connected Pages', value: connectedPages, icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Wallet Balance', value: formatLocalCurrency(wallet, user?.country), icon: Wallet, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-heading">
            Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your campaigns.</p>
        </div>
        <Link to="/campaigns/new">
          <Button className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--navy-light))] text-primary-foreground font-semibold gap-2">
            <Plus className="w-4 h-4" /> Create Campaign
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="shadow-sm border-border/50">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
                  <p className="text-2xl font-bold font-heading mt-1">{value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Onboarding checklist */}
      {!loading && (
        <OnboardingChecklist user={user} pages={pages} campaigns={campaigns} wallet={wallet} />
      )}

      {/* No page warning */}
      {!loading && pages.length === 0 && (
        <Card className="border-2 border-dashed border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent))]/5">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[hsl(var(--accent))]/10 flex items-center justify-center flex-shrink-0">
              <Facebook className="w-6 h-6 text-[hsl(var(--accent))]" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-semibold text-foreground">Connect a Facebook Page to get started</h3>
              <p className="text-sm text-muted-foreground mt-0.5">You need at least one connected page before creating campaigns.</p>
            </div>
            <Link to="/pages">
              <Button variant="outline" className="border-[hsl(var(--accent))] text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/10 gap-2 flex-shrink-0">
                Add Page <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Campaigns */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Recent Campaigns</CardTitle>
            <Link to="/campaigns" className="text-xs text-[hsl(var(--accent))] hover:underline font-medium">View all</Link>
          </CardHeader>
          <CardContent className="p-0">
            {campaigns.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <Megaphone className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No campaigns yet</p>
                <Link to="/campaigns/new">
                  <Button size="sm" variant="outline" className="mt-3">Create your first campaign</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {campaigns.slice(0, 5).map(c => (
                  <Link key={c.id} to={`/campaigns/${c.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-secondary/50 transition-colors group">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.page_name || 'Campaign'}</p>
                      <p className="text-xs text-muted-foreground capitalize">{c.package} · {c.duration}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <StatusBadge status={c.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pages Summary */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Facebook Pages</CardTitle>
            <Link to="/pages" className="text-xs text-[hsl(var(--accent))] hover:underline font-medium">Manage</Link>
          </CardHeader>
          <CardContent className="p-0">
            {pages.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <Facebook className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No pages connected yet</p>
                <Link to="/pages">
                  <Button size="sm" variant="outline" className="mt-3">Add a Page</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {pages.slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Facebook className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.page_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{p.connection_status?.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
                      p.connection_status === 'connected' ? 'bg-green-100 text-green-700' :
                      p.connection_status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {p.connection_status === 'connected' ? 'Connected' :
                       p.connection_status === 'rejected' ? 'Rejected' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}