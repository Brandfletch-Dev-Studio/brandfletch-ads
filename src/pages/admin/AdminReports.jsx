import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Users, MousePointer, MessageSquare, TrendingUp, DollarSign, Megaphone, CheckCircle2 } from 'lucide-react';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { subMonths, subYears, startOfDay, startOfWeek, format } from 'date-fns';

const TIME_FILTERS = [
  { label: 'Today',     key: 'today' },
  { label: 'This Week', key: 'week' },
  { label: 'This Month', key: 'month' },
  { label: '6 Months', key: '6months' },
  { label: '1 Year',   key: 'year' },
  { label: 'All Time', key: 'all' },
];

function getFromDate(key) {
  const now = new Date();
  switch (key) {
    case 'today':   return startOfDay(now);
    case 'week':    return startOfWeek(now, { weekStartsOn: 1 });
    case 'month':   return new Date(now.getFullYear(), now.getMonth(), 1);
    case '6months': return subMonths(now, 6);
    case 'year':    return subYears(now, 1);
    default:        return null;
  }
}

function inPeriod(dateStr, fromDate) {
  if (!fromDate) return true;
  return new Date(dateStr) >= fromDate;
}

function toUSD(amount, currencyCode, exchangeRates) {
  if (!currencyCode || currencyCode === 'USD') return amount;
  const rate = exchangeRates.find(r => r.currency_code === currencyCode);
  if (!rate?.rate_to_usd) return amount;
  return amount / rate.rate_to_usd;
}

const PACKAGE_COLORS = {
  starter: '#3b82f6',
  growth: '#6366f1',
  business: '#a855f7',
  premium: '#f59e0b',
  enterprise: '#64748b',
};

const PIE_COLORS = ['#3b82f6', '#6366f1', '#a855f7', '#f59e0b', '#64748b'];

export default function AdminReports() {
  useRoleGuard(['admin', 'campaign_manager', 'finance']);
  const [allData, setAllData] = useState({ campaigns: [], transactions: [], exchangeRates: [] });
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('all');

  useEffect(() => {
    Promise.all([
      base44.entities.Campaign.list({ sort: '-created_date', limit: 500 }),
      base44.entities.WalletTransaction.list({ sort: '-created_date', limit: 500 }),
      base44.entities.ExchangeRate.filter({ is_active: true }),
    ]).then(([campaigns, transactions, exchangeRates]) => {
      setAllData({ campaigns, transactions, exchangeRates });
      setLoading(false);
    });
  }, []);

  const fromDate = getFromDate(timePeriod);
  const { campaigns, transactions, exchangeRates } = allData;

  const filteredCampaigns = campaigns.filter(c => inPeriod(c.created_date, fromDate));
  const confirmedPayments = transactions.filter(t =>
    t.status === 'confirmed' && t.type === 'payment' && inPeriod(t.created_date, fromDate)
  );

  const completedCampaigns = filteredCampaigns.filter(c => c.status === 'completed');
  const activeCampaigns = filteredCampaigns.filter(c => c.status === 'active');

  const totals = completedCampaigns.reduce((acc, c) => ({
    impressions: acc.impressions + (c.impressions || 0),
    reach: acc.reach + (c.reach || 0),
    clicks: acc.clicks + (c.clicks || 0),
    messages: acc.messages + (c.messages || 0),
  }), { impressions: 0, reach: 0, clicks: 0, messages: 0 });

  const totalRevenueUSD = confirmedPayments.reduce((sum, t) =>
    sum + toUSD(t.amount || 0, t.currency, exchangeRates), 0
  );

  // Revenue by country (in USD)
  const revenueByCountry = {};
  confirmedPayments.forEach(t => {
    const country = campaigns.find(c => c.id === t.campaign_id)?.country || 'Unknown';
    revenueByCountry[country] = (revenueByCountry[country] || 0) + toUSD(t.amount || 0, t.currency, exchangeRates);
  });
  const revenueCountryData = Object.entries(revenueByCountry)
    .map(([country, usd]) => ({ name: country, usd: parseFloat(usd.toFixed(2)) }))
    .sort((a, b) => b.usd - a.usd);

  // Package breakdown
  const packageBreakdown = ['starter', 'growth', 'business', 'premium', 'enterprise'].map(pkg => ({
    name: pkg.charAt(0).toUpperCase() + pkg.slice(1),
    key: pkg,
    count: filteredCampaigns.filter(c => c.package === pkg).length,
    revenue: confirmedPayments
      .filter(t => campaigns.find(c => c.id === t.campaign_id)?.package === pkg)
      .reduce((s, t) => s + toUSD(t.amount || 0, t.currency, exchangeRates), 0),
  })).filter(p => p.count > 0);

  // Goal breakdown for pie
  const goalBreakdown = {};
  filteredCampaigns.forEach(c => {
    if (c.goal) goalBreakdown[c.goal] = (goalBreakdown[c.goal] || 0) + 1;
  });
  const goalPieData = Object.entries(goalBreakdown).map(([goal, count]) => ({
    name: goal.replace(/_/g, ' '),
    value: count,
  }));

  // Monthly revenue trend (last 6 months)
  const monthlyRevenue = [];
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(new Date(), i);
    const month = format(d, 'MMM yy');
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const rev = transactions
      .filter(t =>
        t.status === 'confirmed' && t.type === 'payment' &&
        new Date(t.created_date) >= monthStart && new Date(t.created_date) <= monthEnd
      )
      .reduce((sum, t) => sum + toUSD(t.amount || 0, t.currency, exchangeRates), 0);
    monthlyRevenue.push({ month, revenue: parseFloat(rev.toFixed(2)) });
  }

  const statCards = [
    { label: 'Total Campaigns', value: filteredCampaigns.length, icon: Megaphone, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Campaigns', value: activeCampaigns.length, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Completed Campaigns', value: completedCampaigns.length, icon: CheckCircle2, color: 'text-slate-600', bg: 'bg-slate-50' },
    { label: 'Total Impressions', value: totals.impressions.toLocaleString(), icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Reach', value: totals.reach.toLocaleString(), icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Total Clicks', value: totals.clicks.toLocaleString(), icon: MousePointer, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Messages', value: totals.messages.toLocaleString(), icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Revenue (USD)', value: `$${totalRevenueUSD.toFixed(2)}`, icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header + time filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">Platform Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Performance analytics across all campaigns</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TIME_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setTimePeriod(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                timePeriod === f.key
                  ? 'bg-[hsl(var(--primary))] text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="shadow-sm animate-pulse"><CardContent className="p-5 h-20" /></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-tight">{label}</p>
                    <p className="text-2xl font-bold font-heading mt-1">{value}</p>
                  </div>
                  <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Monthly Revenue Trend */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Monthly Revenue Trend (USD)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={v => [`$${v}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(217,91%,55%)" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue by Country */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Revenue by Country (USD)</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueCountryData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No revenue data</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueCountryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip formatter={v => [`$${v}`, 'Revenue (USD)']} />
                  <Bar dataKey="usd" fill="hsl(217,91%,55%)" radius={[0,4,4,0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Campaign Goal Distribution */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Campaign Goals</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {goalPieData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={goalPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {goalPieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Package Breakdown */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Package Distribution & Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          {packageBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No data for this period</p>
          ) : (
            <div className="space-y-4">
              {packageBreakdown.map(p => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="w-20 text-sm font-medium">{p.name}</span>
                  <div className="flex-1 bg-secondary rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all"
                      style={{
                        width: `${filteredCampaigns.length > 0 ? (p.count / filteredCampaigns.length) * 100 : 0}%`,
                        backgroundColor: PACKAGE_COLORS[p.key],
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-36 text-right shrink-0">
                    {p.count} campaign{p.count !== 1 ? 's' : ''} · <span className="font-semibold text-foreground">${p.revenue.toFixed(0)}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}