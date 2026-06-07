import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Palette, Users, TrendingUp, Activity, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function AdminOverview() {
  const [stats, setStats] = useState({
    totalDesigns: null,
    totalLeads: null,
    activeCampaigns: null,
    revenue: null,
    totalUsers: null,
    pendingCampaigns: null,
    openTickets: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [designs, leads, campaigns, payments, users, tickets] = await Promise.all([
          base44.entities.DesignRequest.list('-created_date', 1000).catch(() => []),
          base44.entities.Lead.list('-created_date', 1000).catch(() => []),
          base44.entities.Campaign.list('-created_date', 1000).catch(() => []),
          base44.entities.Payment.list('-created_date', 1000).catch(() => []),
          base44.entities.User.list('-created_date', 1000).catch(() => []),
          base44.entities.SupportTicket.list('-created_date', 1000).catch(() => []),
        ]);

        const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
        const pendingCampaigns = campaigns.filter(c => ['pending_review', 'awaiting_payment'].includes(c.status)).length;
        const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;

        // Sum revenue from completed/verified payments
        const totalRevenue = payments
          .filter(p => p.status === 'completed' || p.status === 'verified')
          .reduce((sum, p) => sum + (p.amount_usd || p.amount || 0), 0);

        setStats({
          totalDesigns: designs.length,
          totalLeads: leads.length,
          activeCampaigns,
          pendingCampaigns,
          revenue: totalRevenue,
          totalUsers: users.length,
          openTickets,
        });
      } catch (err) {
        console.error('AdminOverview stats error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const fmt = (val) => (val === null ? '—' : val.toLocaleString());

  const statCards = [
    {
      title: 'Active Campaigns',
      value: fmt(stats.activeCampaigns),
      sub: stats.pendingCampaigns !== null ? `${stats.pendingCampaigns} pending review` : '',
      icon: Activity,
      color: 'bg-green-100 text-green-700',
      link: '/admin/campaigns',
    },
    {
      title: 'Total Designs',
      value: fmt(stats.totalDesigns),
      sub: '',
      icon: Palette,
      color: 'bg-purple-100 text-purple-700',
      link: '/admin/designs',
    },
    {
      title: 'Total Leads',
      value: fmt(stats.totalLeads),
      sub: '',
      icon: Users,
      color: 'bg-blue-100 text-blue-700',
      link: '/admin/leads',
    },
    {
      title: 'Total Revenue (USD)',
      value: stats.revenue !== null ? `$${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—',
      sub: '',
      icon: TrendingUp,
      color: 'bg-amber-100 text-amber-700',
      link: '/admin/payments',
    },
  ];

  return (
    <div className="p-[15px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading mb-2">Admin Overview</h1>
        <p className="text-muted-foreground">Platform statistics and quick access</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} to={stat.link}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      {loading ? (
                        <div className="h-8 w-16 bg-secondary rounded animate-pulse mb-1" />
                      ) : (
                        <p className="text-3xl font-bold">{stat.value}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
                      {stat.sub && !loading && (
                        <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
                      )}
                    </div>
                    <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link to="/admin/designs" className="block p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                <p className="font-medium">Manage Design Requests</p>
                <p className="text-sm text-muted-foreground">Review and assign design tasks</p>
              </Link>
              <Link to="/admin/leads" className="block p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                <p className="font-medium">View All Leads</p>
                <p className="text-sm text-muted-foreground">Monitor lead pipeline across users</p>
              </Link>
              <Link to="/admin/campaigns" className="block p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                <p className="font-medium">Campaign Management</p>
                <p className="text-sm text-muted-foreground">Approve and track ad campaigns</p>
              </Link>
              <Link to="/admin/users" className="block p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                <p className="font-medium">User Management</p>
                <p className="text-sm text-muted-foreground">Manage platform users</p>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">System Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Platform Status</span>
                <span className="text-sm font-medium text-green-600">● Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Users</span>
                {loading ? (
                  <div className="h-4 w-8 bg-secondary rounded animate-pulse" />
                ) : (
                  <span className="text-sm font-medium">{fmt(stats.totalUsers)}</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Open Support Tickets</span>
                {loading ? (
                  <div className="h-4 w-8 bg-secondary rounded animate-pulse" />
                ) : (
                  <span className={`text-sm font-medium ${stats.openTickets > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                    {fmt(stats.openTickets)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending Campaigns</span>
                {loading ? (
                  <div className="h-4 w-8 bg-secondary rounded animate-pulse" />
                ) : (
                  <span className={`text-sm font-medium ${stats.pendingCampaigns > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                    {fmt(stats.pendingCampaigns)}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
