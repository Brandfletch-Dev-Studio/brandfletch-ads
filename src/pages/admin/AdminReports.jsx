import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Users, MousePointer, MessageSquare, TrendingUp } from 'lucide-react';
import { useRoleGuard } from '@/hooks/useRoleGuard';

export default function AdminReports() {
  useRoleGuard(['admin', 'campaign_manager', 'finance']);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Campaign.filter({ status: 'completed' }, '-updated_date', 50).then(c => {
      setCampaigns(c);
      setLoading(false);
    });
  }, []);

  const totals = campaigns.reduce((acc, c) => ({
    impressions: acc.impressions + (c.impressions || 0),
    reach: acc.reach + (c.reach || 0),
    clicks: acc.clicks + (c.clicks || 0),
    messages: acc.messages + (c.messages || 0),
    leads: acc.leads + (c.leads || 0),
    revenue: acc.revenue + (c.total_cost || 0),
  }), { impressions: 0, reach: 0, clicks: 0, messages: 0, leads: 0, revenue: 0 });

  const chartData = campaigns.slice(0, 10).map(c => ({
    name: c.page_name?.slice(0, 12) || 'Campaign',
    impressions: c.impressions || 0,
    reach: c.reach || 0,
    clicks: c.clicks || 0,
  }));

  const packageBreakdown = ['starter', 'growth', 'business', 'premium'].map(pkg => ({
    name: pkg.charAt(0).toUpperCase() + pkg.slice(1),
    count: campaigns.filter(c => c.package === pkg).length,
    revenue: campaigns.filter(c => c.package === pkg).reduce((s, c) => s + (c.total_cost || 0), 0),
  }));

  const stats = [
    { label: 'Total Impressions', value: totals.impressions.toLocaleString(), icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Reach', value: totals.reach.toLocaleString(), icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Total Clicks', value: totals.clicks.toLocaleString(), icon: MousePointer, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Messages', value: totals.messages.toLocaleString(), icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Revenue', value: `$${totals.revenue.toFixed(0)}`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Completed Campaigns', value: campaigns.length, icon: TrendingUp, color: 'text-pink-600', bg: 'bg-pink-50' },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-heading">Platform Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">Performance across all completed campaigns</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
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

      {chartData.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Campaign Performance (Recent)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="impressions" fill="hsl(217,91%,55%)" name="Impressions" radius={[4,4,0,0]} />
                <Bar dataKey="reach" fill="hsl(222,70%,35%)" name="Reach" radius={[4,4,0,0]} />
                <Bar dataKey="clicks" fill="hsl(43,96%,56%)" name="Clicks" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Package Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {packageBreakdown.map(p => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="w-16 text-sm font-medium">{p.name}</span>
                <div className="flex-1 bg-secondary rounded-full h-2">
                  <div
                    className="bg-[hsl(var(--accent))] h-2 rounded-full transition-all"
                    style={{ width: `${campaigns.length > 0 ? (p.count / campaigns.length) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground w-24 text-right">
                  {p.count} campaign{p.count !== 1 ? 's' : ''} · ${p.revenue.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}