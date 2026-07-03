// Generic admin list + detail page for a department's order table.
// Used by AdminStudios.jsx and AdminDevStudio.jsx — same UI/logic, driven by
// config (src/lib/departmentOrderConfigs.js) so a new department order flow
// never needs new admin-page code, just a new config entry.
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Search, ArrowLeft, CheckCircle2, Loader2, Package, AlertCircle, Play, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_OPTIONS, STATUS_COLORS, PAYMENT_STATUS_OPTIONS, PAY_COLORS } from '@/lib/departmentOrderConfigs';

export default function DeptOrderAdmin({ config }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const queryClient = useQueryClient();
  const queryKey = ['adminDeptOrders', config.entityName];

  const { data: orders = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => base44.entities[config.entityName].list({ sort: '-created_date' }),
  });

  const stats = {
    total:     orders.length,
    pending:   orders.filter(o => o.payment_status === 'pending_verification').length,
    active:    orders.filter(o => ['awaiting_brief', 'in_production', 'review'].includes(o.status)).length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      o.order_ref?.toLowerCase().includes(q) ||
      o.user_name?.toLowerCase().includes(q) ||
      o.user_email?.toLowerCase().includes(q) ||
      o[config.brandField]?.toLowerCase().includes(q);
    const matchStatus  = statusFilter === 'all' || o.status === statusFilter;
    const matchService = serviceFilter === 'all' || o.service_type === serviceFilter;
    return matchSearch && matchStatus && matchService;
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities[config.entityName].update(id, data),
    onSuccess: () => {
      toast.success('Order updated');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (e) => toast.error('Update failed: ' + e.message),
  });

  const { data: team = [] } = useQuery({
    queryKey: ['deptTeam', config.assigneeRole],
    queryFn: () => base44.entities.User.filter({ role: config.assigneeRole }),
  });

  if (selected) {
    return (
      <OrderDetail
        config={config}
        order={orders.find(o => o.id === selected) || selected}
        team={team}
        onBack={() => setSelected(null)}
        onUpdate={(data) => {
          updateMutation.mutate({ id: selected.id || selected, data });
          setSelected(prev => ({ ...prev, ...data }));
        }}
        updating={updateMutation.isPending}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{config.title} Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage all {config.title} orders, briefs, production and delivery</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders',    value: stats.total,     icon: Package,      color: 'text-[hsl(var(--accent))]' },
          { label: 'Awaiting Review', value: stats.pending,   icon: AlertCircle,  color: 'text-yellow-600' },
          { label: 'In Production',   value: stats.active,    icon: Play,         color: 'text-purple-600' },
          { label: 'Completed',       value: stats.completed, icon: CheckCircle2, color: 'text-green-600' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="py-4 flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-xl bg-current/10 flex items-center justify-center', s.color)}>
                <s.icon className={cn('w-5 h-5', s.color)} />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search orders, clients…" className="pl-9 h-9 text-sm" />
        </div>
        <Select value={serviceFilter} onValueChange={setServiceFilter}>
          <SelectTrigger className="w-48 h-9 text-sm"><SelectValue placeholder="All services" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {config.serviceTypeOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 h-9 text-sm"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading orders…</span>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No {config.title} orders found{search || statusFilter !== 'all' || serviceFilter !== 'all' ? ' matching your filters' : ' yet'}.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(order => (
            <Card key={order.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setSelected(order)}>
              <CardContent className="py-3.5 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{order.order_ref}</span>
                    <Badge className={cn('text-[10px] px-2', STATUS_COLORS[order.status])}>
                      {STATUS_OPTIONS.find(s => s.value === order.status)?.label || order.status}
                    </Badge>
                    <Badge className={cn('text-[10px] px-2', PAY_COLORS[order.payment_status])}>
                      {PAYMENT_STATUS_OPTIONS.find(p => p.value === order.payment_status)?.label || order.payment_status}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] px-2">
                      {config.serviceTypeOptions.find(s => s.value === order.service_type)?.label || order.service_type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {order.user_name || order.user_email} · {order[config.brandField] || '—'} · {order.currency} {order.amount?.toLocaleString()}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground flex-shrink-0 hidden sm:block">
                  {order.created_date ? new Date(order.created_date).toLocaleDateString() : '—'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function OrderDetail({ config, order, team, onBack, onUpdate, updating }) {
  const [status, setStatus] = useState(order.status);
  const [payStatus, setPayStatus] = useState(order.payment_status);
  const [adminNotes, setAdminNotes] = useState(order.admin_notes || '');
  const [deliverablesUrl, setDeliverablesUrl] = useState(order.deliverables_url || '');
  const [assigneeId, setAssigneeId] = useState(order[config.assigneeIdField] || '');

  const handleSave = () => {
    const assignee = team.find(t => t.id === assigneeId);
    onUpdate({
      status,
      payment_status: payStatus,
      admin_notes: adminNotes,
      deliverables_url: deliverablesUrl,
      [config.assigneeIdField]: assigneeId || null,
      [config.assigneeNameField]: assignee ? (assignee.full_name || assignee.email) : null,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 -ml-2">
        <ArrowLeft className="w-4 h-4" /> Back to {config.title} Orders
      </Button>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-foreground">{order.order_ref}</h1>
          <p className="text-sm text-muted-foreground">{order.user_name || order.user_email}</p>
        </div>
        <Badge className={cn('text-xs px-2.5', STATUS_COLORS[order.status])}>
          {STATUS_OPTIONS.find(s => s.value === order.status)?.label || order.status}
        </Badge>
      </div>

      <Card>
        <CardContent className="py-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">{config.brandField === 'project_name' ? 'Project Name' : 'Brand Name'}</Label>
              <p className="text-sm font-medium mt-1">{order[config.brandField] || '—'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Amount</Label>
              <p className="text-sm font-medium mt-1">{order.currency} {order.amount?.toLocaleString() || '—'}</p>
            </div>
          </div>
          {(order.key_features || order.key_messages) && (
            <div>
              <Label className="text-xs text-muted-foreground">Brief</Label>
              <p className="text-sm mt-1 whitespace-pre-wrap">{order.key_features || order.key_messages}</p>
            </div>
          )}
          {order.brand_assets_url && (
            <a href={order.brand_assets_url} target="_blank" rel="noreferrer" className="text-sm text-primary inline-flex items-center gap-1 hover:underline">
              View assets <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Payment Status</Label>
              <Select value={payStatus} onValueChange={setPayStatus}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENT_STATUS_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Assign {config.assigneeRoleLabel}</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                {team.map(t => <SelectItem key={t.id} value={t.id}>{t.full_name || t.email}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Deliverables URL</Label>
            <Input value={deliverablesUrl} onChange={e => setDeliverablesUrl(e.target.value)} placeholder="https://…" className="h-9 text-sm" />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Admin Notes</Label>
            <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={3} className="text-sm" />
          </div>

          <Button onClick={handleSave} disabled={updating} className="gap-2">
            {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
