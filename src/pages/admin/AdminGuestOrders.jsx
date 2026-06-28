import { useState } from 'react';
import { supabase } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Search, ShoppingBag, CheckCircle2, XCircle, Clock,
  Mail, Phone, MapPin, Building2, StickyNote, Loader2,
  ArrowUpRight, Pencil, Filter
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRoleGuard } from '@/hooks/useRoleGuard';

const STATUS_META = {
  pending:   { label: 'Pending',   color: 'bg-amber-100 text-amber-700',   icon: Clock },
  converted: { label: 'Converted', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-600',       icon: XCircle },
  abandoned: { label: 'Abandoned', color: 'bg-muted text-muted-foreground', icon: Clock },
};

const SERVICE_LABELS = {
  meta_ads:       'Meta Ads',
  ugc_ads:        'UGC Ads',
  graphic_design: 'Graphic Design',
  social_media:   'Social Media',
  web_design:     'Web Design',
  branding:       'Branding',
};

const SERVICE_COLORS = {
  meta_ads:       'bg-blue-100 text-blue-700',
  ugc_ads:        'bg-purple-100 text-purple-700',
  graphic_design: 'bg-pink-100 text-pink-700',
  social_media:   'bg-green-100 text-green-700',
  web_design:     'bg-orange-100 text-orange-700',
  branding:       'bg-amber-100 text-amber-700',
};

export default function AdminGuestOrders() {
  useRoleGuard(['admin', 'super_admin']);
  const qc = useQueryClient();

  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('all');
  const [serviceFilter, setService] = useState('all');
  const [editing, setEditing]       = useState(null); // order being status-edited
  const [newStatus, setNewStatus]   = useState('');
  const [adminNote, setAdminNote]   = useState('');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['adminGuestOrders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('GuestOrder')
        .select('*')
        .order('created_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const update = { status };
      if (status === 'converted') update.converted_at = new Date().toISOString();
      const { data, error } = await supabase.from('GuestOrder').update(update).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminGuestOrders'] });
      toast.success('Order updated');
      setEditing(null);
    },
    onError: e => toast.error(e.message),
  });

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.name?.toLowerCase().includes(q) || o.email?.toLowerCase().includes(q) || o.business_name?.toLowerCase().includes(q);
    const matchStatus  = statusFilter === 'all'  || o.status === statusFilter;
    const matchService = serviceFilter === 'all' || o.service_type === serviceFilter;
    return matchSearch && matchStatus && matchService;
  });

  const stats = {
    total:     orders.length,
    pending:   orders.filter(o => o.status === 'pending').length,
    converted: orders.filter(o => o.status === 'converted').length,
    value:     orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (Number(o.price) || 0), 0),
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-6 h-6" /> Guest Orders
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Orders placed before authentication.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total orders',  value: stats.total,                    color: '' },
          { label: 'Pending',       value: stats.pending,                   color: 'text-amber-600' },
          { label: 'Converted',     value: stats.converted,                 color: 'text-emerald-600' },
          { label: 'Pipeline value',value: `$${stats.value.toLocaleString()}`, color: 'text-[hsl(var(--primary))]' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, business…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(STATUS_META).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={serviceFilter} onValueChange={setService}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Service" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All services</SelectItem>
            {Object.entries(SERVICE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table / cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_,i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
          <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No orders found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const sm = STATUS_META[order.status] || STATUS_META.pending;
            const Icon = sm.icon;
            return (
              <div
                key={order.id}
                className="rounded-xl border border-border/60 bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                {/* Left: badges + name */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    <Badge className={cn('text-[10px] border-0', SERVICE_COLORS[order.service_type] || 'bg-muted text-muted-foreground')}>
                      {SERVICE_LABELS[order.service_type] || order.service_type}
                    </Badge>
                    <Badge className={cn('text-[10px] border-0', sm.color)}>
                      <Icon className="w-3 h-3 mr-1" />
                      {sm.label}
                    </Badge>
                    {order.plan_name && (
                      <Badge variant="outline" className="text-[10px]">{order.plan_name}</Badge>
                    )}
                  </div>
                  <p className="font-semibold truncate">{order.name}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{order.email}</span>
                    {order.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{order.phone}</span>}
                    {order.country && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{order.country}</span>}
                    {order.business_name && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{order.business_name}</span>}
                  </div>
                  {order.notes && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                      <StickyNote className="w-3 h-3 mt-0.5 shrink-0" />
                      <span className="line-clamp-1">{order.notes}</span>
                    </p>
                  )}
                </div>

                {/* Right: price + time + actions */}
                <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1 shrink-0">
                  {order.price && (
                    <p className="text-lg font-bold">
                      ${Number(order.price).toLocaleString()}
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        {order.billing_cycle === 'once-off' ? 'once' : '/mo'}
                      </span>
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(order.created_date), { addSuffix: true })}
                  </p>
                  <div className="flex gap-1 mt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-2"
                      onClick={() => { setEditing(order); setNewStatus(order.status); }}
                    >
                      <Pencil className="w-3 h-3 mr-1" /> Update
                    </Button>
                    <a href={`mailto:${order.email}`}>
                      <Button size="sm" variant="ghost" className="h-7 text-xs px-2">
                        <Mail className="w-3 h-3 mr-1" /> Email
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Status update dialog */}
      {editing && (
        <Dialog open onOpenChange={() => setEditing(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Update order status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-1">
              <div>
                <p className="text-sm font-medium mb-1">{editing.name} — {editing.plan_name}</p>
                <p className="text-xs text-muted-foreground">{editing.email}</p>
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1 block">Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_META).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button
                onClick={() => updateMutation.mutate({ id: editing.id, status: newStatus })}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
