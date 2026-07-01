// src/pages/admin/AdminUgcAds.jsx
// Admin dashboard for UGC ad orders — full management, status updates, creator assignment, deliverables

import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Video, Search, ArrowLeft, CheckCircle2, Clock,
  ExternalLink, Loader2, FileText,
  DollarSign, User, Play, AlertCircle, Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const UGC_PACKAGES = {
  starter:        { name: 'Starter',        videos: 1  },
  growth:         { name: 'Growth',         videos: 3  },
  brand_campaign: { name: 'Brand Campaign', videos: 10 },
};

const STATUS_OPTIONS = [
  { value: 'pending_payment',    label: 'Pending Payment'    },
  { value: 'awaiting_brief',     label: 'Awaiting Brief'     },
  { value: 'in_production',      label: 'In Production'      },
  { value: 'review',             label: 'Under Review'       },
  { value: 'revision_requested', label: 'Revision Requested' },
  { value: 'completed',          label: 'Completed'          },
  { value: 'cancelled',          label: 'Cancelled'          },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'unpaid',                label: 'Unpaid'                },
  { value: 'pending_verification',  label: 'Pending Verification'  },
  { value: 'paid',                  label: 'Paid'                  },
  { value: 'refunded',              label: 'Refunded'              },
];

const STATUS_COLORS = {
  pending_payment:    'bg-yellow-100 text-yellow-700',
  awaiting_brief:     'bg-blue-100 text-blue-700',
  in_production:      'bg-purple-100 text-purple-700',
  review:             'bg-indigo-100 text-indigo-700',
  revision_requested: 'bg-orange-100 text-orange-700',
  completed:          'bg-green-100 text-green-700',
  cancelled:          'bg-gray-100 text-gray-500',
};

const PAY_COLORS = {
  unpaid:               'bg-red-100 text-red-700',
  pending_verification: 'bg-yellow-100 text-yellow-700',
  paid:                 'bg-green-100 text-green-700',
  refunded:             'bg-gray-100 text-gray-500',
};

export default function AdminUgcAds() {
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['adminUgcOrders'],
    queryFn: () => base44.entities.UgcOrder.list({ sort: '-created_date' }),
  });

  // Stats
  const stats = {
    total:    orders.length,
    pending:  orders.filter(o => o.payment_status === 'pending_verification').length,
    active:   orders.filter(o => ['awaiting_brief','in_production','review'].includes(o.status)).length,
    completed:orders.filter(o => o.status === 'completed').length,
    revenue:  orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + (o.amount || 0), 0),
  };

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      o.order_ref?.toLowerCase().includes(q) ||
      o.user_name?.toLowerCase().includes(q) ||
      o.user_email?.toLowerCase().includes(q) ||
      o.brand_name?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UgcOrder.update(id, data),
    onSuccess: () => {
      toast.success('Order updated');
      queryClient.invalidateQueries({ queryKey: ['adminUgcOrders'] });
    },
    onError: (e) => toast.error('Update failed: ' + e.message),
  });

  // ── Detail view ───────────────────────────────────────────────────────────
  if (selectedOrder) {
    return (
      <OrderDetail
        order={orders.find(o => o.id === selectedOrder) || selectedOrder}
        onBack={() => setSelectedOrder(null)}
        onUpdate={(data) => {
          updateMutation.mutate({ id: selectedOrder.id || selectedOrder, data });
          setSelectedOrder(prev => ({ ...prev, ...data }));
        }}
        updating={updateMutation.isPending}
      />
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Video className="w-6 h-6 text-[hsl(var(--accent))]" /> UGC Orders
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage all UGC ad orders, briefs, production and delivery</p>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders',      value: stats.total,     icon: Package,      color: 'text-[hsl(var(--accent))]'  },
          { label: 'Awaiting Review',   value: stats.pending,   icon: AlertCircle,  color: 'text-yellow-600'             },
          { label: 'In Production',     value: stats.active,    icon: Play,         color: 'text-purple-600'             },
          { label: 'Completed',         value: stats.completed, icon: CheckCircle2, color: 'text-green-600'              },
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

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search orders, clients, brands…" className="pl-9 h-9 text-sm" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 h-9 text-sm"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading orders…</span>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No UGC orders found{search || statusFilter !== 'all' ? ' matching your filters' : ' yet'}.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(order => (
            <Card key={order.id} className="hover:shadow-sm transition-shadow cursor-pointer"
              onClick={() => setSelectedOrder(order)}>
              <CardContent className="py-3.5 flex items-center gap-4 flex-wrap">
                <div className="w-9 h-9 rounded-xl bg-[hsl(var(--accent))]/10 flex items-center justify-center flex-shrink-0">
                  <Video className="w-4.5 h-4.5 text-[hsl(var(--accent))]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{order.order_ref}</span>
                    <Badge className={cn('text-[10px] px-2', STATUS_COLORS[order.status])}>
                      {STATUS_OPTIONS.find(s => s.value === order.status)?.label || order.status}
                    </Badge>
                    <Badge className={cn('text-[10px] px-2', PAY_COLORS[order.payment_status])}>
                      {PAYMENT_STATUS_OPTIONS.find(p => p.value === order.payment_status)?.label || order.payment_status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {order.user_name || order.user_email} · {UGC_PACKAGES[order.package]?.name} ·{' '}
                    {order.brand_name || '—'} · {order.currency} {order.amount?.toLocaleString()}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground flex-shrink-0 hidden sm:block">
                  {new Date(order.created_date).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Order Detail Panel ────────────────────────────────────────────────────────
function OrderDetail({ order, onBack, onUpdate, updating }) {
  const [status, setStatus]             = useState(order.status);
  const [payStatus, setPayStatus]       = useState(order.payment_status);
  const [adminNotes, setAdminNotes]     = useState(order.admin_notes || '');
  const [deliverablesUrl, setDelUrl]    = useState(order.deliverables_url || '');
  const [assignedCreator, setCreator]   = useState(order.assigned_creator_name || '');
  const [revisionNotes, setRevNotes]    = useState(order.revision_notes || '');
  const [saving, setSaving]             = useState(false);

  async function save() {
    try {
      setSaving(true);
      await onUpdate({
        status,
        payment_status:        payStatus,
        admin_notes:           adminNotes,
        deliverables_url:      deliverablesUrl,
        assigned_creator_name: assignedCreator,
        revision_notes:        revisionNotes,
        ...(status === 'in_production' && !order.production_started_at
          ? { production_started_at: new Date().toISOString() }
          : {}),
        ...(status === 'completed' && !order.completed_at
          ? { completed_at: new Date().toISOString() }
          : {}),
      });
      setSaving(false);
    } catch (err) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
    }
  }

  const pkg = UGC_PACKAGES[order.package] || {};

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to orders
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">{order.order_ref}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pkg.name} Package · {order.num_videos} video{order.num_videos > 1 ? 's' : ''} ·{' '}
            {order.currency} {order.amount?.toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge className={cn('text-xs px-3', STATUS_COLORS[order.status])}>
            {STATUS_OPTIONS.find(s => s.value === order.status)?.label}
          </Badge>
          <Badge className={cn('text-xs px-3', PAY_COLORS[order.payment_status])}>
            {PAYMENT_STATUS_OPTIONS.find(p => p.value === order.payment_status)?.label}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Brief + Payment info */}
        <div className="lg:col-span-2 space-y-4">

          {/* Client info */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><User className="w-4 h-4" />Client</CardTitle></CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              {[
                ['Name',  order.user_name],
                ['Email', order.user_email],
              ].map(([k,v]) => v ? (
                <div key={k} className="flex gap-3">
                  <span className="text-muted-foreground w-16 flex-shrink-0">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ) : null)}
            </CardContent>
          </Card>

          {/* Creative Brief */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><FileText className="w-4 h-4" />Creative Brief</CardTitle></CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              {[
                ['Brand',        order.brand_name],
                ['Product',      order.product_service],
                ['Audience',     order.target_audience],
                ['Goal',         order.campaign_goal?.replace('_', ' ')],
                ['Tone',         order.tone_style],
                ['References',   order.reference_links],
                ['Key Messages', order.key_messages],
                ['Special Req.', order.special_requirements],
              ].map(([k,v]) => v ? (
                <div key={k} className="flex gap-3">
                  <span className="text-muted-foreground w-28 flex-shrink-0 font-medium">{k}</span>
                  <span className="text-foreground break-words">{v}</span>
                </div>
              ) : null)}
              {order.script_provided && order.script_content && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Provided Script</p>
                  <div className="bg-muted rounded-lg p-3 text-xs whitespace-pre-wrap font-mono">{order.script_content}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment proof */}
          {(order.payment_reference || order.payment_proof_url) && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><DollarSign className="w-4 h-4" />Payment Proof</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {order.payment_method    && <div className="flex gap-3"><span className="text-muted-foreground w-28">Method</span><span>{order.payment_method}</span></div>}
                {order.payment_reference && <div className="flex gap-3"><span className="text-muted-foreground w-28">Reference</span><span className="font-mono font-semibold">{order.payment_reference}</span></div>}
                {order.payment_proof_url && (
                  <a href={order.payment_proof_url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[hsl(var(--accent))] text-xs font-medium hover:underline">
                    <ExternalLink className="w-3.5 h-3.5" /> View proof
                  </a>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Admin controls */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Update Order</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs mb-1 block">Order Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Payment Status</Label>
                <Select value={payStatus} onValueChange={setPayStatus}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{PAYMENT_STATUS_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Assigned Creator</Label>
                <Input value={assignedCreator} onChange={e => setCreator(e.target.value)}
                  placeholder="Creator name" className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Deliverables URL</Label>
                <Input value={deliverablesUrl} onChange={e => setDelUrl(e.target.value)}
                  placeholder="https://drive.google.com/..." className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Admin Notes</Label>
                <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
                  placeholder="Internal notes…" className="text-sm min-h-20 resize-none" />
              </div>
              {status === 'revision_requested' && (
                <div>
                  <Label className="text-xs mb-1 block">Revision Notes</Label>
                  <Textarea value={revisionNotes} onChange={e => setRevNotes(e.target.value)}
                    placeholder="What needs to be revised?" className="text-sm min-h-16 resize-none" />
                </div>
              )}
              <Button onClick={save} disabled={saving || updating}
                className="w-full h-9 text-sm font-semibold bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent))]/90">
                {saving ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Saving…</> : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Clock className="w-4 h-4" />Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              {[
                ['Ordered',    order.created_date],
                ['Brief',      order.brief_submitted_at],
                ['Production', order.production_started_at],
                ['Completed',  order.completed_at],
              ].map(([k,v]) => v ? (
                <div key={k} className="flex justify-between">
                  <span className="font-medium">{k}</span>
                  <span>{new Date(v).toLocaleDateString()}</span>
                </div>
              ) : null)}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}