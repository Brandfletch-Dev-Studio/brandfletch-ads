import { useEffect, useState } from 'react';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { Card, CardContent } from '@/components/ui/card';
import { Palette, Users, TrendingUp, Activity, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function AdminOverview() {
  // Block designer role — they should be at /designer, not /admin
  useRoleGuard(null, 'clients.view');
  const [stats, setStats] = useState({
    totalDesigns: null,
    totalLeads: null,
    activeCampaigns: null,
    revenue: null,
    totalUsers: null,
    pendingCampaigns: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Bug fix: base44.entities.Payment does not exist — use WalletTransaction for revenue
        // Also fix list() call signature — pass options object, not positional args
        const [designs, leads, campaigns, walletTxns, users] = await Promise.all([
          base44.entities.DesignRequest.list({ sort: '-created_date', limit: 1000 }).catch(() => []),
          base44.entities.Lead.list({ sort: '-created_date', limit: 1000 }).catch(() => []),
          base44.entities.Campaign.list({ sort: '-created_date', limit: 1000 }).catch(() => []),
          base44.entities.WalletTransaction.list({ sort: '-created_date', limit: 1000 }).catch(() => []),
          base44.functions.getAllUsers({}).then(r => r?.users || []).catch(() => []),
        ]);

        const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
        const pendingCampaigns = campaigns.filter(c => ['pending_review', 'awaiting_payment'].includes(c.status)).length;

        // Revenue from wallet credit transactions (deposits/payments)
        const totalRevenue = walletTxns
          .filter(t => t.type === 'credit' && t.status === 'completed')
          .reduce((sum, t) => sum + (t.amount_usd || t.amount || 0), 0);

        setStats({
          totalDesigns: designs.length,
          totalLeads: leads.length,
          activeCampaigns,
          pendingCampaigns,
          revenue: totalRevenue,
          totalUsers: users.filter(u => u.role === 'user').length,
        });
      } catch (err) {
        console.error('AdminOverview stats error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const fmt = (val) => (val === null ? '\u2014' : val.toLocaleString());

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
      title: 'Client Accounts',
      value: fmt(stats.totalUsers),
      sub: '',
      icon: Users,
      color: 'bg-blue-100 text-blue-700',
      link: '/admin/users',
    },
    {
      title: 'Platform Revenue',
      value: stats.revenue !== null ? `$${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '\u2014',
      sub: 'From wallet top-ups',
      icon: TrendingUp,
      color: 'bg-amber-100 text-amber-700',
      link: '/admin/payments',
    },
    {
      title: 'Pending Campaigns',
      value: fmt(stats.pendingCampaigns),
      sub: 'Awaiting review',
      icon: CheckCircle,
      color: 'bg-orange-100 text-orange-700',
      link: '/admin/campaigns',
    },
  ];

  return (
    <div className="p-[15px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading mb-2">Admin Overview</h1>
        <p className="text-muted-foreground">Platform statistics and quick access</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        <p className="text-3xl font-bold font-heading">{stat.value}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
                      {stat.sub && <p className="text-xs text-muted-foreground/70 mt-0.5">{stat.sub}</p>}
                    </div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${stat.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
