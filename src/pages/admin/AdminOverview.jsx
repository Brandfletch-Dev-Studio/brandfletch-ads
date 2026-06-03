import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Megaphone, Users, DollarSign, Activity, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import StatusBadge from '@/components/ui/StatusBadge';
import { format, subDays, subMonths, subYears, startOfDay, startOfWeek } from 'date-fns';

const TIME_FILTERS = [
  { label: 'Today',    key: 'today' },
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

// Convert local currency amount to USD using exchange rates
function toUSD(amount, currencyCode, exchangeRates) {
  if (!currencyCode || currencyCode === 'USD') return amount;
  const rate = exchangeRates.find(r => r.currency_code === currencyCode);
  if (!rate?.rate_to_usd) return amount;
  return amount / rate.rate_to_usd;
}

export default function AdminOverview() {
  const [allData, setAllData] = useState({ campaigns: [], users: [], transactions: [], exchangeRates: [] });
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('all');

  useEffect(() => {
    Promise.all([
      base44.entities.Campaign.list('-created_date', 500),
      base44.entities.User.list(),
      base44.entities.WalletTransaction.list('-created_date', 500),
      base44.entities.ExchangeRate.filter({ is_active: true }),
    ]).then(([campaigns, users, transactions, exchangeRates]) => {
      setAllData({ campaigns, users, transactions, exchangeRates });
      setLoading(false);
    });
  }, []);

  const fromDate = getFromDate(timePeriod);
  const { campaigns, users, transactions, exchangeRates } = allData;

  const filteredCampaigns = campaigns.filter(c => inPeriod(c.created_date, fromDate));
  const filteredTransactions = transactions.filter(t => inPeriod(t.created_date, fromDate));

  const pendingReview = filteredCampaigns.filter(c => c.status === 'pending_review').length;
  const active = filteredCampaigns.filter(c => c.status === 'active').length;
  const pendingPayments = filteredTransactions.filter(t => t.status === 'pending').length;

  // Revenue: sum local amounts converted to USD
  const totalRevenueUSD = filteredTransactions
    .filter(t => t.status === 'confirmed' && t.type === 'payment')
    .reduce((sum, t) => sum + toUSD(t.amount || 0, t.currency, exchangeRates), 0);

  const statCards = [
    { label: 'Total Campaigns', value: filteredCampaigns.length, icon: Megaphone, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Review', value: pendingReview, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Active Campaigns', value: active, icon: Activity, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Users', value: users.length, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Pending Payments', value: pendingPayments, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Revenue (USD)', value: `$${totalRevenueUSD.toFixed(2)}`, icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">Admin Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">Platform-wide summary</p>
        </div>
        {/* Time filter */}
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

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="shadow-sm animate-pulse"><CardContent className="p-5 h-20" /></Card>
          ))}
        </div>
      ) : (
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
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent campaigns */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Recent Campaigns</CardTitle>
            <Link to="/admin/campaigns" className="text-xs text-[hsl(var(--accent))] hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filteredCampaigns.slice(0, 6).map(c => (
                <Link key={c.id} to={`/admin/campaigns/${c.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-secondary/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{c.page_name || 'Campaign'}</p>
                    <p className="text-xs text-muted-foreground capitalize">{c.package} · {c.duration}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </Link>
              ))}
              {filteredCampaigns.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No campaigns in this period</p>
              )}
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
            {filteredTransactions.filter(t => t.status === 'pending').length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                All payments verified
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredTransactions.filter(t => t.status === 'pending').slice(0, 5).map(t => (
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