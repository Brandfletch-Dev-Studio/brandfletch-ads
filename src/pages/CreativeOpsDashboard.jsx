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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { format, formatDistanceToNow, isAfter, subDays } from 'date-fns';
import {
  Palette, Clock, CheckCircle2, AlertTriangle, Users, BarChart3,
  MessageSquare, Search, ChevronRight, TrendingUp, Zap, Star,
  ArrowRight, RefreshCw, Eye, UserCheck, FileText, Bell, Filter,
  Layers, Award, Target, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_META = {
  draft:              { label: 'Draft',             color: 'bg-gray-100 text-gray-600',       dot: 'bg-gray-400'   },
  submitted:          { label: 'Submitted',          color: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-500'   },
  under_review:       { label: 'Under Review',       color: 'bg-indigo-100 text-indigo-700',   dot: 'bg-indigo-500' },
  assigned:           { label: 'Assigned',           color: 'bg-purple-100 text-purple-700',   dot: 'bg-purple-500' },
  in_progress:        { label: 'In Progress',        color: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-500'  },
  awaiting_feedback:  { label: 'Awaiting Feedback',  color: 'bg-orange-100 text-orange-700',   dot: 'bg-orange-500' },
  revision_requested: { label: 'Revision Requested', color: 'bg-red-100 text-red-700',         dot: 'bg-red-500'    },
  approved:           { label: 'Approved',           color: 'bg-teal-100 text-teal-700',       dot: 'bg-teal-500'   },
  delivered:          { label: 'Delivered',          color: 'bg-green-100 text-green-700',     dot: 'bg-green-500'  },
  completed:          { label: 'Completed',          color: 'bg-green-200 text-green-800',     dot: 'bg-green-600'  },
  cancelled:          { label: 'Cancelled',          color: 'bg-gray-100 text-gray-500',       dot: 'bg-gray-400'   },
};

const PRIORITY_META = {
  low:    { label: 'Low',    color: 'text-gray-500'  },
  medium: { label: 'Medium', color: 'text-blue-600'  },
  high:   { label: 'High',   color: 'text-orange-600'},
  urgent: { label: 'Urgent', color: 'text-red-600'   },
};

const DESIGN_TYPE_LABELS = {
  social_media_post: 'Social Post', flyer: 'Flyer', poster: 'Poster',
  banner: 'Banner', business_card: 'Business Card', logo: 'Logo',
  brochure: 'Brochure', presentation: 'Presentation', custom: 'Custom', other: 'Other',
};

const ACTIONABLE = ['submitted','under_review','awaiting_feedback','revision_requested'];
const ACTIVE     = ['assigned','in_progress'];
const DONE       = ['delivered','completed'];

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.draft;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold', m.color)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', m.dot)} />
      {m.label}
    </span>
  );
}

function PriorityDot({ priority }) {
  const m = PRIORITY_META[priority] || PRIORITY_META.medium;
  return <span className={cn('text-xs font-bold', m.color)}>{m.label}</span>;
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
}

// ── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, icon: Icon, color, trend, onClick }) {
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
          {trend !== undefined && (
            <span className={cn('text-xs font-semibold', trend >= 0 ? 'text-green-600' : 'text-red-500')}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}
            </span>
          )}
        </div>
        <p className="text-2xl font-black text-foreground">{value ?? '—'}</p>
        <p className="text-sm font-medium text-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ── Request Row ──────────────────────────────────────────────────────────────
function RequestRow({ req, designers, onAssign, onStatusChange, onView }) {
  const [assigning, setAssigning] = useState(false);
  const designer = designers.find(d => d.id === req.designer_id);

  return (
    <div className="flex items-center gap-3 py-3 px-4 border-b border-border/50 hover:bg-accent/30 transition-colors group">
      {/* Priority indicator */}
      <div className={cn('w-1 h-10 rounded-full shrink-0',
        req.priority === 'urgent' ? 'bg-red-500' :
        req.priority === 'high' ? 'bg-orange-400' :
        req.priority === 'medium' ? 'bg-blue-400' : 'bg-gray-300'
      )} />

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-semibold text-sm text-foreground truncate">{req.title}</p>
          {req.priority === 'urgent' && (
            <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full shrink-0">URGENT</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{DESIGN_TYPE_LABELS[req.design_type] || req.design_type}</span>
          <span>·</span>
          <span>{req.created_date ? formatDistanceToNow(new Date(req.created_date), { addSuffix: true }) : '—'}</span>
          {req.due_date && (
            <>
              <span>·</span>
              <span className={cn(isAfter(new Date(), new Date(req.due_date)) ? 'text-red-600 font-semibold' : '')}>
                Due {format(new Date(req.due_date), 'MMM d')}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Designer assignment */}
      <div className="shrink-0 w-36 hidden md:block">
        {designer ? (
          <div className="flex items-center gap-1.5">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{initials(designer.full_name || designer.email)}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-foreground font-medium truncate">{designer.full_name || designer.email}</span>
          </div>
        ) : (
          <Select onValueChange={val => onAssign(req.id, val)}>
            <SelectTrigger className="h-7 text-xs border-dashed">
              <SelectValue placeholder="Assign..." />
            </SelectTrigger>
            <SelectContent>
              {designers.map(d => (
                <SelectItem key={d.id} value={d.id} className="text-xs">
                  {d.full_name || d.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Status */}
      <div className="shrink-0 hidden sm:block">
        <StatusBadge status={req.status} />
      </div>

      {/* Actions */}
      <button
        onClick={() => onView(req)}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-accent"
      >
        <Eye className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}

// ── Designer Card ─────────────────────────────────────────────────────────────
function DesignerCard({ designer, requests }) {
  const myWork = requests.filter(r => r.designer_id === designer.id);
  const active   = myWork.filter(r => ACTIVE.includes(r.status)).length;
  const done     = myWork.filter(r => DONE.includes(r.status)).length;
  const pending  = myWork.filter(r => ACTIONABLE.includes(r.status)).length;

  return (
    <Card className="hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
              {initials(designer.full_name || designer.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{designer.full_name || designer.email}</p>
            <p className="text-xs text-muted-foreground">Designer</p>
          </div>
          <div className={cn('w-2.5 h-2.5 rounded-full', active > 0 ? 'bg-green-500' : 'bg-gray-300')} title={active > 0 ? 'Active' : 'Idle'} />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[['Active', active, 'text-amber-600'], ['Done', done, 'text-green-600'], ['Needs Action', pending, 'text-red-600']].map(([l,v,c]) => (
            <div key={l} className="bg-accent/40 rounded-lg py-2">
              <p className={cn('text-lg font-black', c)}>{v}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{l}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CreativeOpsDashboard() {
  useRoleGuard(['creative_ops_director', 'admin', 'super_admin']);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const { data: requests = [], isLoading: reqLoading } = useQuery({
    queryKey: ['cod-design-requests'],
    queryFn: () => base44.entities.DesignRequest.list({ sort: '-created_date', limit: 500 }).catch(() => []),
    refetchInterval: 60000,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['cod-all-users'],
    queryFn: () => base44.entities.User.list({ limit: 500 }).catch(() => []),
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['cod-support-tickets'],
    queryFn: () => base44.entities.SupportTicket.list({ sort: '-created_date', limit: 100 }).catch(() => []),
  });

  const designers = allUsers.filter(u => u.role === 'designer');
  const clients   = allUsers.filter(u => u.role === 'user');

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DesignRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cod-design-requests'] });
      toast.success('Updated');
    },
    onError: e => toast.error(e?.message || 'Failed to save'),
  });

  function handleAssign(reqId, designerId) {
    const designer = designers.find(d => d.id === designerId);
    updateMutation.mutate({
      id: reqId,
      data: {
        designer_id: designerId,
        designer_name: designer?.full_name || designer?.email || '',
        status: 'assigned',
      },
    });
    // Fire email alert
    base44.functions.designEmailAlerts({ design_id: reqId, event_type: 'in_progress' }).catch(() => {});
  }

  // ── Metrics ──────────────────────────────────────────────────────────────
  const actionable  = requests.filter(r => ACTIONABLE.includes(r.status));
  const active      = requests.filter(r => ACTIVE.includes(r.status));
  const delivered   = requests.filter(r => DONE.includes(r.status));
  const unassigned  = requests.filter(r => !r.designer_id && r.status !== 'draft' && r.status !== 'cancelled');
  const overdue     = requests.filter(r => r.due_date && isAfter(new Date(), new Date(r.due_date)) && !DONE.includes(r.status));
  const openTickets = tickets.filter(t => ['open','in_progress'].includes(t.status));
  const thisWeek    = requests.filter(r => r.created_date && isAfter(new Date(r.created_date), subDays(new Date(), 7)));

  // ── Filtered list ────────────────────────────────────────────────────────
  const filtered = requests.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      r.title?.toLowerCase().includes(q) ||
      r.brand_name?.toLowerCase().includes(q) ||
      r.design_type?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || r.status === statusFilter ||
      (statusFilter === 'actionable' && ACTIONABLE.includes(r.status)) ||
      (statusFilter === 'active'     && ACTIVE.includes(r.status)) ||
      (statusFilter === 'unassigned' && !r.designer_id && !['draft','cancelled'].includes(r.status));
    return matchSearch && matchStatus;
  });

  const firstName = (user?.full_name || 'Director').split(' ')[0];

  return (
    <div className="min-h-screen bg-background">

      {/* TOP HEADER */}
      <div className="border-b border-border bg-card px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Palette className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-black text-foreground tracking-tight">Creative Ops</h1>
              {overdue.length > 0 && (
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {overdue.length} overdue
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Good {getGreeting()}, {firstName} — here's where things stand.</p>
          </div>
          <div className="flex items-center gap-2">
            {unassigned.length > 0 && (
              <Button variant="destructive" size="sm" className="gap-2 text-xs"
                onClick={() => setStatusFilter('unassigned')}>
                <Zap className="w-3.5 h-3.5" /> {unassigned.length} Unassigned
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-2 text-xs"
              onClick={() => queryClient.invalidateQueries()}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
            <Link to="/admin/designs">
              <Button size="sm" className="gap-2 text-xs">
                Full Design Board <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <MetricCard label="Need Action"   value={actionable.length}  icon={AlertTriangle} color="bg-orange-100 text-orange-700" onClick={() => setStatusFilter('actionable')} />
          <MetricCard label="In Progress"   value={active.length}      icon={Activity}      color="bg-blue-100 text-blue-700"     onClick={() => setStatusFilter('active')} />
          <MetricCard label="Unassigned"    value={unassigned.length}  icon={UserCheck}     color="bg-red-100 text-red-600"       onClick={() => setStatusFilter('unassigned')} />
          <MetricCard label="Overdue"       value={overdue.length}     icon={Clock}         color="bg-red-50 text-red-500"        onClick={() => setStatusFilter('all')} />
          <MetricCard label="This Week"     value={thisWeek.length}    icon={TrendingUp}    color="bg-green-100 text-green-700" />
          <MetricCard label="Open Tickets"  value={openTickets.length} icon={MessageSquare} color="bg-purple-100 text-purple-700"  onClick={() => navigate('/admin/support')} />
        </div>

        {/* MAIN TABS */}
        <Tabs defaultValue="requests">
          <TabsList className="mb-4">
            <TabsTrigger value="requests" className="gap-2">
              <Layers className="w-4 h-4" /> Requests
              {actionable.length > 0 && <span className="bg-orange-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{actionable.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="w-4 h-4" /> Design Team
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <BarChart3 className="w-4 h-4" /> Stats
            </TabsTrigger>
          </TabsList>

          {/* ── REQUESTS TAB ─── */}
          <TabsContent value="requests" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search requests..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { v:'all',        l:'All' },
                  { v:'actionable', l:'🔥 Needs Action' },
                  { v:'unassigned', l:'⚠️ Unassigned' },
                  { v:'active',     l:'In Progress' },
                  { v:'delivered',  l:'Delivered' },
                  { v:'completed',  l:'Completed' },
                ].map(({ v, l }) => (
                  <button key={v} onClick={() => setStatusFilter(v)}
                    className={cn('px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                      statusFilter === v
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/70'
                    )}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Request list */}
            <Card>
              <div className="divide-y divide-border/30">
                {reqLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-7 h-7 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="py-12 text-center">
                    <Palette className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">No requests match your filter</p>
                  </div>
                ) : filtered.map(req => (
                  <RequestRow
                    key={req.id}
                    req={req}
                    designers={designers}
                    onAssign={handleAssign}
                    onStatusChange={(id, status) => updateMutation.mutate({ id, data: { status } })}
                    onView={r => navigate('/admin/designs')}
                  />
                ))}
              </div>
              {filtered.length > 0 && (
                <div className="px-4 py-3 border-t border-border/40 bg-accent/20 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{filtered.length} request{filtered.length !== 1 ? 's' : ''}</p>
                  <Link to="/admin/designs" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                    Open full board <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ── TEAM TAB ─── */}
          <TabsContent value="team" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{designers.length} designer{designers.length !== 1 ? 's' : ''} on your team</p>
              <Link to="/admin/users">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Users className="w-3.5 h-3.5" /> Manage Team
                </Button>
              </Link>
            </div>
            {designers.length === 0 ? (
              <Card><CardContent className="p-8 text-center">
                <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No designers assigned yet</p>
                <Link to="/admin/users"><Button size="sm" className="mt-3">Add Designers</Button></Link>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {designers.map(d => (
                  <DesignerCard key={d.id} designer={d} requests={requests} />
                ))}
              </div>
            )}

            {/* Unassigned requests needing attention */}
            {unassigned.length > 0 && (
              <Card className="border-orange-200 bg-orange-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-orange-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> {unassigned.length} unassigned request{unassigned.length > 1 ? 's' : ''}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {unassigned.slice(0,4).map(r => (
                    <div key={r.id} className="flex items-center justify-between text-sm">
                      <span className="truncate text-foreground font-medium">{r.title}</span>
                      <Select onValueChange={val => handleAssign(r.id, val)}>
                        <SelectTrigger className="h-7 w-32 text-xs ml-3 shrink-0">
                          <SelectValue placeholder="Assign" />
                        </SelectTrigger>
                        <SelectContent>
                          {designers.map(d => <SelectItem key={d.id} value={d.id} className="text-xs">{d.full_name || d.email}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                  {unassigned.length > 4 && <p className="text-xs text-muted-foreground">+{unassigned.length - 4} more</p>}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── STATS TAB ─── */}
          <TabsContent value="reports" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Status breakdown */}
              <Card className="sm:col-span-2">
                <CardHeader className="pb-3"><CardTitle className="text-sm">Requests by Status</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(STATUS_META).map(([status, meta]) => {
                    const count = requests.filter(r => r.status === status).length;
                    if (!count) return null;
                    const pct = Math.round((count / requests.length) * 100);
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
                    { label: 'Full Design Board',  path: '/admin/designs',    icon: Palette },
                    { label: 'All Payments',       path: '/admin/payments',   icon: FileText },
                    { label: 'Support Tickets',    path: '/admin/support',    icon: MessageSquare },
                    { label: 'Team & Users',       path: '/admin/users',      icon: Users },
                    { label: 'Reports',            path: '/admin/reports',    icon: BarChart3 },
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

            {/* Design type breakdown */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Volume by Design Type</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                  {Object.entries(DESIGN_TYPE_LABELS).map(([type, label]) => {
                    const count = requests.filter(r => r.design_type === type).length;
                    if (!count) return null;
                    return (
                      <div key={type} className="bg-accent/40 rounded-xl p-3 text-center">
                        <p className="text-xl font-black text-foreground">{count}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
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
