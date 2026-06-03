import { Eye, Users, MousePointer, MessageSquare, TrendingUp, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const PENDING_STATUSES = ['pending_review', 'approved', 'changes_requested'];

function MetricCard({ icon: Icon, label, value, sub, color, bg, pending }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <p className={`text-2xl font-bold font-heading tabular-nums ${pending ? 'text-muted-foreground' : ''}`}>
          {pending ? '—' : value}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        {sub && !pending && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function CampaignMetricsPanel({ campaign }) {
  const isPending = PENDING_STATUSES.includes(campaign.status);

  const cost = campaign.total_cost || 0;
  const currency = campaign.currency || 'USD';
  const costLabel = currency === 'USD' ? `$${cost.toFixed(2)}` : `${currency} ${cost.toLocaleString()}`;

  const totalResults = (campaign.messages || 0) + (campaign.leads || 0) + (campaign.clicks || 0);
  const cpr = totalResults > 0 ? (cost / totalResults).toFixed(2) : null;
  const cprLabel = cpr ? (currency === 'USD' ? `$${cpr}` : `${currency} ${cpr}`) : '—';

  const metrics = [
    {
      icon: Eye,
      label: 'Impressions',
      value: (campaign.impressions || 0).toLocaleString(),
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: Users,
      label: 'Reach',
      value: (campaign.reach || 0).toLocaleString(),
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      icon: MousePointer,
      label: 'Clicks',
      value: (campaign.clicks || 0).toLocaleString(),
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      icon: MessageSquare,
      label: 'Messages',
      value: (campaign.messages || 0).toLocaleString(),
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      icon: TrendingUp,
      label: 'Leads',
      value: (campaign.leads || 0).toLocaleString(),
      color: 'text-pink-600',
      bg: 'bg-pink-50',
    },
    {
      icon: DollarSign,
      label: 'Cost per Result',
      value: cprLabel,
      sub: `Total spent: ${costLabel}`,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Campaign Performance</h2>
        {isPending && (
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">Results will appear once the campaign is live</span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {metrics.map(m => (
          <MetricCard key={m.label} {...m} pending={isPending} />
        ))}
      </div>
    </div>
  );
}