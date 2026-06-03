import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Megaphone, Users, DollarSign, Activity, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import StatusBadge from '@/components/ui/StatusBadge';
import { format } from 'date-fns';

export default function AdminOverview() {
  const [stats, setStats] = useState({ campaigns: [], users: [], transactions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Campaign.list('-created_date', 100),
      base44.entities.User.list(),
      base44.entities.WalletTransaction.list('-created_date', 100),
    ]).then(([campaigns, users, transactions]) => {
      setStats({ campaigns, users, transactions });
      setLoading(false);
    });
  }, []);

  const { campaigns, users, transactions } = stats;
  const pendingReview = campaigns.filter(c => c.status === 'pending_review').length;
  const active = campaigns.filter(c => c.status === 'active').length;
  const pendingPayments = transactions.filter(t => t.status === 'pending' && t.type === 'top_up').length;
  const totalRevenue = transactions.filter(t => t.status === 'confirmed' && t.type === 'payment').reduce((sum, t) => sum + (t.amount || 0), 0);

  const statCards = [
    { label: 'Total Campaigns', value: campaigns.length, icon: Megaphone, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Review', value: pendingReview, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Active Campaigns', value: active, icon: Activity, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Users', value: users.length, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Pending Payments', value: pendingPayments, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Total Revenue (confirmed)', value: totalRevenue.toLocaleString(), icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-heading">Admin Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform-wide summary</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="shadow-sm">
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

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent campaigns */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Recent Campaigns</CardTitle>
            <Link to="/admin/campaigns" className="text-xs text-[hsl(var(--accent))] hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {campaigns.slice(0, 6).map(c => (
                <Link key={c.id} to={`/admin/campaigns/${c.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-secondary/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{c.page_name || 'Campaign'}</p>
                    <p className="text-xs text-muted-foreground capitalize">{c.package} · {c.duration}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending payments */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Pending Payment Verifications</CardTitle>
            <Link to="/admin/payments" className="text-xs text-[hsl(var(--accent))] hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="p-0">
            {transactions.filter(t => t.status === 'pending').length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                All payments verified
              </div>
            ) : (
              <div className="divide-y divide-border">
                {transactions.filter(t => t.status === 'pending').slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium">{t.description || 'Payment'}</p>
                      <p className="text-xs text-muted-foreground">{t.payment_reference} · {t.type.replace('_', ' ')}</p>
                    </div>
                    <span className="text-sm font-bold text-amber-600">
                      {t.currency && t.currency !== 'USD'
                        ? `${t.currency} ${(t.amount || 0).toLocaleString()}`
                        : `$${(t.amount || 0).toFixed(2)}`}
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