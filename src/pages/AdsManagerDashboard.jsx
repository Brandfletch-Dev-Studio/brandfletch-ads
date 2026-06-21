import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format, formatDistanceToNow, isAfter, subDays } from 'date-fns';
import {
  Megaphone, Clock, CheckCircle2, AlertTriangle, Users, BarChart3,
  MessageSquare, Search, ChevronRight, TrendingUp, Zap,
  ArrowRight, RefreshCw, Eye, DollarSign, Activity, Target,
  Filter, Globe, Phone, Eye as EyeIcon, ThumbsUp, Send
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_META = {
  draft:              { label: 'Draft',              color: 'bg-gray-100 text-gray-600',      dot: 'bg-gray-400'   },
  awaiting_payment:   { label: 'Awaiting Payment',   color: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-500'  },
  pending_review:     { label: 'Pending Review',     color: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-500'   },
  approved:           { label: 'Approved',           color: 'bg-teal-100 text-teal-700',      dot: 'bg-teal-500'   },
  active:             { label: 'Active',             color: 'bg-green-100 text-green-700',    dot: 'bg-green-500'  },
  paused:             { label: 'Paused',             color: 'bg-yellow-100 text-yellow-700',  dot: 'bg-yellow-500' },
  completed:          { label: 'Completed',          color: 'bg-green-200 text-green-800',    dot: 'bg-green-600'  },
  rejected:           { label: 'Rejected',           color: 'bg-red-100 text-red-700',        dot: 'bg-red-500'    },
  changes_requested:  { label: 'Changes Requested',  color: 'bg-orange-100 text-orange-700',  dot: 'bg-orange-500' },
  refunded:           { label: 'Refunded',           color: 'bg-red-50 text-red-400',         dot: 'bg-red-300'    },
};

const GOAL_META = {
  messages:         { label: 'Messages',       icon: MessageSquare },
  website_traffic:  { label: 'Website Visits', icon: Globe },
  phone_calls:      { label: 'Phone Calls',    icon: Phone },
  brand_awareness:  { label: 'Awareness',      icon: EyeIcon },
  page_followers:   { label: 'Followers',      icon: ThumbsUp },
  boost_post:       { label: 'Boost Post',     icon: Zap },
};

const PACKAGE_LABELS = { starter: 'Starter', growth: 'Growth', business: 'Business', premium: 'Premium', enterprise: 'Enterprise' };

const ACTIONABLE = ['pending_review', 'awaiting_payment', 'changes_requested'];
const ACTIVE     = ['active'];
const NEEDS_ADULT = ['approved', 'paused'];

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.draft;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap', m.color)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', m.dot)} />
      {m.label}
    </span>
  );
}

function fmtMoney(n, currency) {
  if (!n && n !== 0) return '—';
  const symbols = { MWK: 'MK ', KES: 'KSh ', ZMW: 'ZK ', ZAR: 'R ', TZS: 'TSh ', USD: '$' };
  const sym = symbols[currency] || `${currency} `;
  return `${sym}${Number(n).toLocaleString()}`;
}

// ── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, icon: Icon, color, onClick }) {
  return (
    <Card
      className={cn('relative overflow-hidden cursor-pointer hover:shadow-md transition-all', onClick && 'hover:-translate-y-0.5')}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <p className="text-2xl font-black text-foreground">{value ?? '—'}</p>
        <p className="text-sm font-medium text-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ── Campaign Row ──────────────────────────────────────────────────────────────
function CampaignRow({ camp, onView }) {
  const goal = GOAL_META[camp.goal] || GOAL_META[camp.objective] || GOAL_META.boost_post;
  const GoalIcon = goal.icon;
  const isPending = camp.status === 'pending_review';
  const isUnpaid = camp.status === 'awaiting_payment';

  return (
    <div className="flex items-center gap-3 py-3 px-4 border-b border-border/50 hover:bg-accent/30 transition-colors group">
      {/* Priority indicator */}
      <div className={cn('w-1 h-10 rounded-full shrink-0',
        isPending ? 'bg-blue-500' :
        isUnpaid ? 'bg-amber-500' :
        camp.status === 'active' ? 'bg-green-500' :
        camp.status === 'rejected' ? 'bg-red-500' : 'bg-gray-300'
      )} />

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-semibold text-sm text-foreground truncate">{camp.campaign_name || 'Untitled Campaign'}</p>
          {camp.package && (
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full shrink-0 uppercase">
              {PACKAGE_LABELS[camp.package] || camp.package}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <GoalIcon className="w-3 h-3" />
          <span>{goal.label}</span>
          <span>·</span>
          <span>{camp.page_name || 'No page'}</span>
          <span>·</span>
          <span>{camp.created_date ? formatDistanceToNow(new Date(camp.created_date), { addSuffix: true }) : '—'}</span>
        </div>
      </div>

      {/* Budget */}
      <div className="shrink-0 hidden md:block text-right">
        <p className="text-sm font-bold text-foreground">{fmtMoney(camp.total_cost, camp.currency)}</p>
        <p className="text-xs text-muted-foreground">{camp.duration || '—'}</p>
      </div>

      {/* Performance mini-stats (for active campaigns) */}
      {camp.status === 'active' && (camp.impressions > 0 || camp.reach > 0) && (
        <div className="shrink-0 hidden lg:flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><EyeIcon className="w-3 h-3" /> {(camp.impressions || 0).toLocaleString()}</span>
          <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {(camp.reach || 0).toLocaleString()}</span>
          {camp.clicks > 0 && <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {camp.clicks}</span>}
        </div>
      )}

      {/* Status */}
      <div className="shrink-0">
        <StatusBadge status={camp.status} />
      </div>

      {/* View */}
      <button
        onClick={() => onView(camp)}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-accent"
      >
        <Eye className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}

// ── Client Card ───────────────────────────────────────────────────────────────
function ClientCard({ client, campaigns }) {
  const myCamp = campaigns.filter(c => c.user_id === client.id);
  const active   = myCamp.filter(c => c.status === 'active').length;
  const pending  = myCamp.filter(c => ACTIONABLE.includes(c.status)).length;
  const totalSpend = myCamp.reduce((s, c) => s + (c.total_cost_usd || c.total_cost || 0), 0);

  return (
    <Card className="hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-primary">
              {(client.full_name || client.email || '?')[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{client.full_name || client.email}</p>
            <p className="text-xs text-muted-foreground">{client.country || '—'}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-accent/40 rounded-lg py-2">
            <p className="text-lg font-black text-blue-600">{myCamp.length}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className="bg-accent/40 rounded-lg py-2">
            <p className="text-lg font-black text-green-600">{active}</p>
            <p className="text-[10px] text-muted-foreground">Active</p>
          </div>
          <div className="bg-accent/40 rounded-lg py-2">
            <p className="text-lg font-black text-orange-600">{pending}</p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </div>
        </div>
        {totalSpend > 0 && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Total spend: <span className="font-semibold text-foreground">${totalSpend.toFixed(0)}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdsManagerDashboard() {
  useRoleGuard(['ads_manager', 'admin', 'super_admin']);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: campaigns = [], isLoading: campLoading } = useQuery({
    queryKey: ['am-campaigns'],
    queryFn: () => base44.entities.Campaign.list({ sort: '-created_date', limit: 500 }).catch(() => []),
    refetchInterval: 60000,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['am-all-users'],
    queryFn: () => base44.functions.getAllUsers({}).then(r => r?.users || []).catch(() => []),
  });

  const { data: walletTxns = [] } = useQuery({
    queryKey: ['am-wallet'],
    queryFn: () => base44.entities.WalletTransaction.list({ sort: '-created_date', limit: 200 }).catch(() => []),
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['am-support'],
    queryFn: () => base44.entities.SupportTicket.list({ sort: '-created_date', limit: 50 }).catch(() => []),
  });

  const clients = allUsers.filter(u => u.role === 'user');

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Campaign.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['am-campaigns'] });
      toast.success('Campaign updated');
    },
    onError: e => toast.error(e?.message || 'Failed to save'),
  });

  // ── Metrics ──────────────────────────────────────────────────────────────
  const actionable  = campaigns.filter(c => ACTIONABLE.includes(c.status));
  const active      = campaigns.filter(c => c.status === 'active');
  const pendingPay  = campaigns.filter(c => c.status === 'awaiting_payment');
  const pendingRev  = campaigns.filter(c => c.status === 'pending_review');
  const completed   = campaigns.filter(c => c.status === 'completed');
  const thisWeek    = campaigns.filter(c => c.created_date && isAfter(new Date(c.created_date), subDays(new Date(), 7)));
  const openTickets = tickets.filter(t => ['open','in_progress'].includes(t.status));

  // Revenue
  const revenue = campaigns
    .filter(c => ['active','completed','approved'].includes(c.status))
    .reduce((s, c) => s + (c.total_cost_usd || c.total_cost || 0), 0);

  // Performance totals (for active campaigns)
  const totalImpressions = active.reduce((s, c) => s + (c.impressions || 0), 0);
  const totalReach       = active.reduce((s, c) => s + (c.reach || 0), 0);
  const totalClicks      = active.reduce((s, c) => s + (c.clicks || 0), 0);
  const totalMessages    = active.reduce((s, c) => s + (c.messages || 0), 0);

  // ── Filtered list ────────────────────────────────────────────────────────
  const filtered = campaigns.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      c.campaign_name?.toLowerCase().includes(q) ||
      c.page_name?.toLowerCase().includes(q) ||
      c.country?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter ||
      (statusFilter === 'actionable' && ACTIONABLE.includes(c.status)) ||
      (statusFilter === 'active'     && c.status === 'active') ||
      (statusFilter === 'pending_pay' && c.status === 'awaiting_payment') ||
      (statusFilter === 'pending_rev' && c.status === 'pending_review');
    return matchSearch && matchStatus;
  });

  const firstName = (user?.full_name || 'Manager').split(' ')[0];

  // Quick approve
  function quickApprove(id) {
    updateMutation.mutate({ id, data: { status: 'approved' } });
    toast.success('Campaign approved — ready to go live');
  }

  function quickReject(id) {
    updateMutation.mutate({ id, data: { status: 'rejected' } });
    toast.success('Campaign rejected');
  }

  return (
    <div className="min-h-screen bg-background">

      {/* TOP HEADER */}
      <div className="border-b border-border bg-card px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Megaphone className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-black text-foreground tracking-tight">Ads Manager</h1>
              {pendingRev.length > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {pendingRev.length} to review
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Good {getGreeting()}, {firstName} — here's your ads operation at a glance.</p>
          </div>
          <div className="flex items-center gap-2">
            {pendingRev.length > 0 && (
              <Button variant="default" size="sm" className="gap-2 text-xs"
                onClick={() => setStatusFilter('pending_rev')}>
                <Zap className="w-3.5 h-3.5" /> {pendingRev.length} Need Review
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-2 text-xs"
              onClick={() => queryClient.invalidateQueries()}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
            <Link to="/admin/campaigns">
              <Button size="sm" className="gap-2 text-xs">
                All Campaigns <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <MetricCard label="Need Action"    value={actionable.length}  icon={AlertTriangle} color="bg-orange-100 text-orange-700" onClick={() => setStatusFilter('actionable')} />
          <MetricCard label="Active Campaigns" value={active.length}    icon={Activity}      color="bg-green-100 text-green-700"   onClick={() => setStatusFilter('active')} />
          <MetricCard label="Pending Review" value={pendingRev.length}  icon={Eye}           color="bg-blue-100 text-blue-700"    onClick={() => setStatusFilter('pending_rev')} />
          <MetricCard label="Awaiting Pay"   value={pendingPay.length}  icon={DollarSign}    color="bg-amber-100 text-amber-700"  onClick={() => setStatusFilter('pending_pay')} />
          <MetricCard label="This Week"      value={thisWeek.length}    icon={TrendingUp}    color="bg-purple-100 text-purple-700" />
          <MetricCard label="Revenue (USD)"  value={`$${revenue.toFixed(0)}`} icon={DollarSign} color="bg-green-50 text-green-600" />
        </div>

        {/* ACTIVE CAMPAIGNS PERFORMANCE STRIP */}
        {active.length > 0 && (
          <Card className="border-green-200 bg-green-50/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-green-600" />
                <p className="text-sm font-bold text-green-800">Live Campaign Performance</p>
                <span className="text-xs text-muted-foreground">({active.length} running)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  ['Impressions', totalImpressions, EyeIcon],
                  ['Reach',       totalReach,       Target],
                  ['Clicks',      totalClicks,      Zap],
                  ['Messages',    totalMessages,    MessageSquare],
                ].map(([label, value, Icon]) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-green-700" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-foreground">{Number(value).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* MAIN TABS */}
        <Tabs defaultValue="campaigns">
          <TabsList className="mb-4">
            <TabsTrigger value="campaigns" className="gap-2">
              <Megaphone className="w-4 h-4" /> Campaigns
              {actionable.length > 0 && <span className="bg-orange-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{actionable.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-2">
              <Users className="w-4 h-4" /> Clients
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <BarChart3 className="w-4 h-4" /> Stats
            </TabsTrigger>
          </TabsList>

          {/* ── CAMPAIGNS TAB ─── */}
          <TabsContent value="campaigns" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { v:'all',         l:'All' },
                  { v:'actionable',  l:'🔥 Needs Action' },
                  { v:'pending_rev', l:'📋 Pending Review' },
                  { v:'pending_pay', l:'💳 Awaiting Payment' },
                  { v:'active',      l:'▶ Active' },
                  { v:'completed',   l:'✓ Completed' },
                ].map(({ v, l }) => (
                  <button key={v} onClick={() => setStatusFilter(v)}
                    className={cn('px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap',
                      statusFilter === v
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/70'
                    )}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Pending review quick actions banner */}
            {pendingRev.length > 0 && statusFilter !== 'pending_rev' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <p className="text-sm text-blue-800 font-medium">{pendingRev.length} campaign{pendingRev.length > 1 ? 's' : ''} waiting for your review</p>
                </div>
                <Button size="sm" variant="outline" className="text-xs h-7 border-blue-300 text-blue-700 hover:bg-blue-100"
                  onClick={() => setStatusFilter('pending_rev')}>
                  Review Now <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            )}

            {/* Campaign list */}
            <Card>
              <div className="divide-y divide-border/30">
                {campLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-7 h-7 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="py-12 text-center">
                    <Megaphone className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">No campaigns match your filter</p>
                  </div>
                ) : filtered.map(camp => (
                  <div key={camp.id} className="relative">
                    <CampaignRow camp={camp} onView={c => navigate(`/admin/campaigns/${c.id}`)} />
                    {/* Quick actions for pending_review */}
                    {camp.status === 'pending_review' && (
                      <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden md:flex gap-1.5 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={(e) => { e.stopPropagation(); quickApprove(camp.id); }}
                          className="px-2 py-1 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 text-xs font-bold transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); quickReject(camp.id); }}
                          className="px-2 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {filtered.length > 0 && (
                <div className="px-4 py-3 border-t border-border/40 bg-accent/20 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{filtered.length} campaign{filtered.length !== 1 ? 's' : ''}</p>
                  <Link to="/admin/campaigns" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                    Open full list <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ── CLIENTS TAB ─── */}
          <TabsContent value="clients" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{clients.length} client{clients.length !== 1 ? 's' : ''} with ad campaigns</p>
              <Link to="/admin/users">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Users className="w-3.5 h-3.5" /> Manage Users
                </Button>
              </Link>
            </div>
            {clients.length === 0 ? (
              <Card><CardContent className="p-8 text-center">
                <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No clients yet</p>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {clients.slice(0, 12).map(c => (
                  <ClientCard key={c.id} client={c} campaigns={campaigns} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── STATS TAB ─── */}
          <TabsContent value="reports" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Status breakdown */}
              <Card className="sm:col-span-2">
                <CardHeader className="pb-3"><CardTitle className="text-sm">Campaigns by Status</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(STATUS_META).map(([status, meta]) => {
                    const count = campaigns.filter(c => c.status === status).length;
                    if (!count) return null;
                    const pct = campaigns.length > 0 ? Math.round((count / campaigns.length) * 100) : 0;
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-32 shrink-0">{meta.label}</span>
                        <div className="flex-1 bg-secondary rounded-full h-2">
                          <div className={cn('h-2 rounded-full', meta.dot)} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-semibold w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Quick links */}
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Quick Links</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { label: 'All Campaigns',      path: '/admin/campaigns',  icon: Megaphone },
                    { label: 'Page Requests',      path: '/admin/pages',      icon: Globe },
                    { label: 'Payments',           path: '/admin/payments',   icon: DollarSign },
                    { label: 'Reports',            path: '/admin/reports',    icon: BarChart3 },
                    { label: 'Support Tickets',    path: '/admin/support',    icon: MessageSquare },
                    { label: 'Team & Users',       path: '/admin/users',      icon: Users },
                  ].map(({ label, path, icon: Icon }) => (
                    <Link key={path} to={path}>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent text-sm text-left transition-colors">
                        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="flex-1">{label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Package distribution */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Campaigns by Package</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {Object.entries(PACKAGE_LABELS).map(([pkg, label]) => {
                    const count = campaigns.filter(c => c.package === pkg).length;
                    if (!count) return null;
                    return (
                      <div key={pkg} className="bg-accent/40 rounded-xl p-3 text-center">
                        <p className="text-xl font-black text-foreground">{count}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Goal distribution */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Campaigns by Goal</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {Object.entries(GOAL_META).map(([goal, meta]) => {
                    const count = campaigns.filter(c => c.goal === goal || c.objective === goal).length;
                    if (!count) return null;
                    const Icon = meta.icon;
                    return (
                      <div key={goal} className="bg-accent/40 rounded-xl p-3 text-center">
                        <Icon className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                        <p className="text-lg font-black text-foreground">{count}</p>
                        <p className="text-xs text-muted-foreground">{meta.label}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
