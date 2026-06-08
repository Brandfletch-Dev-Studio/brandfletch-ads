import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Gift, Users, TrendingUp, CheckCircle, Clock, Search,
  DollarSign, Wallet, Image, Settings2, Plus, Trash2,
  Upload, Save, Loader2, ExternalLink, BarChart3, XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'overview',    label: 'Overview',            icon: BarChart3 },
  { id: 'referrals',   label: 'All Referrals',       icon: Users },
  { id: 'commissions', label: 'Commissions',         icon: DollarSign },
  { id: 'payouts',     label: 'Payouts',             icon: Wallet },
  { id: 'materials',   label: 'Marketing Materials', icon: Image },
  { id: 'settings',    label: 'Program Settings',    icon: Settings2 },
];

const COMMISSION_STATUS_COLORS = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  paid:     'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const PAYOUT_STATUS_COLORS = {
  pending:    'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  completed:  'bg-green-100 text-green-700',
  rejected:   'bg-red-100 text-red-700',
};

// ─── Overview Tab ─────────────────────────────────────────────────────
function OverviewTab({ referrals, commissions, payouts }) {
  const total = referrals.length;
  const converted = referrals.filter(r => r.status === 'converted').length;
  const convRate = total > 0 ? Math.round((converted / total) * 100) : 0;
  const totalComm = commissions.reduce((s, c) => s + (c.commission_amount || 0), 0);
  const pendingComm = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + (c.commission_amount || 0), 0);
  const pendingPayouts = payouts.filter(p => p.status === 'pending' || p.status === 'processing').reduce((s, p) => s + (p.amount || 0), 0);

  const stats = [
    { label: 'Total Referrals',      value: total,                                         color: 'text-sky-600',    bg: 'bg-sky-50',    icon: Users },
    { label: 'Converted',            value: converted,                                      color: 'text-green-600',  bg: 'bg-green-50',  icon: CheckCircle },
    { label: 'Conversion Rate',      value: `${convRate}%`,                                 color: 'text-purple-600', bg: 'bg-purple-50', icon: TrendingUp },
    { label: 'Total Commissions',    value: `MWK ${totalComm.toLocaleString()}`,            color: 'text-amber-600',  bg: 'bg-amber-50',  icon: DollarSign },
    { label: 'Pending Commissions',  value: `MWK ${pendingComm.toLocaleString()}`,          color: 'text-orange-600', bg: 'bg-orange-50', icon: Clock },
    { label: 'Pending Payouts',      value: `MWK ${pendingPayouts.toLocaleString()}`,       color: 'text-rose-600',   bg: 'bg-rose-50',   icon: Wallet },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(({ label, value, color, bg, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground leading-tight">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Recent Referrals</CardTitle></CardHeader>
          <CardContent className="p-0">
            {referrals.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{r.referred_name || r.referred_email || '—'}</p>
                  <p className="text-xs text-muted-foreground">{r.created_date ? format(new Date(r.created_date), 'MMM d') : ''}</p>
                </div>
                <Badge className={r.status === 'converted' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                  {r.status === 'converted' ? 'Converted' : 'Signed Up'}
                </Badge>
              </div>
            ))}
            {referrals.length === 0 && <p className="px-4 py-6 text-sm text-center text-muted-foreground">No referrals yet</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Pending Payouts</CardTitle></CardHeader>
          <CardContent className="p-0">
            {payouts.filter(p => ['pending','processing'].includes(p.status)).slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{p.affiliate_name || '—'}</p>
                  <p className="text-xs text-muted-foreground capitalize">{(p.payment_method || '').replace(/_/g,' ')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{p.currency} {(p.amount||0).toLocaleString()}</p>
                  <Badge className={PAYOUT_STATUS_COLORS[p.status]}>{p.status}</Badge>
                </div>
              </div>
            ))}
            {payouts.filter(p => ['pending','processing'].includes(p.status)).length === 0 &&
              <p className="px-4 py-6 text-sm text-center text-muted-foreground">No pending payouts</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Referrals Tab ────────────────────────────────────────────────────
function ReferralsTab({ referrals, users, isLoading }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Referral.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminReferrals'] }); toast.success('Updated'); },
  });

  const getReferrer = (code) => {
    const u = users.find(u => `BF-${u.id?.slice(-6)?.toUpperCase()}` === code || u.referral_code === code);
    return u ? (u.full_name || u.email) : code;
  };

  const filtered = referrals.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !search || r.referred_name?.toLowerCase().includes(q) || r.referred_email?.toLowerCase().includes(q) || r.referral_code?.toLowerCase().includes(q);
    return matchSearch && (statusFilter === 'all' || r.status === statusFilter);
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-9 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Signed Up</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              {['Referred User','Referred By','Code','Date','Status','Actions'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.referred_name || '—'}</p>
                    <p className="text-xs text-muted-foreground">{r.referred_email}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">{getReferrer(r.referral_code)}</td>
                  <td className="px-4 py-3"><code className="text-xs bg-secondary px-2 py-0.5 rounded font-mono">{r.referral_code}</code></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.created_date ? format(new Date(r.created_date), 'MMM d, yyyy') : '—'}</td>
                  <td className="px-4 py-3">
                    <Badge className={r.status === 'converted' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                      {r.status === 'converted' ? 'Converted' : 'Signed Up'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {r.status !== 'converted' && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateMut.mutate({ id: r.id, data: { status: 'converted' } })}>
                        Mark Converted
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No referrals found</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Commissions Tab ──────────────────────────────────────────────────
function CommissionsTab({ commissions, isLoading }) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AffiliateCommission.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminCommissions'] }); toast.success('Updated'); },
  });

  const filtered = commissions.filter(c => statusFilter === 'all' || c.status === statusFilter);

  return (
    <div className="space-y-4">
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-40 h-9 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              {['Date','Affiliate','Referral','Product','Amount','Status','Actions'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.created_date ? format(new Date(c.created_date), 'MMM d, yyyy') : '—'}</td>
                  <td className="px-4 py-3 font-medium">{c.affiliate_name || '—'}</td>
                  <td className="px-4 py-3 text-xs">{c.referred_user_name || c.referred_user_email || '—'}</td>
                  <td className="px-4 py-3 text-xs">{c.product_name || c.product_type || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-green-600">{c.commission_currency || 'MWK'} {(c.commission_amount||0).toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${COMMISSION_STATUS_COLORS[c.status] || ''}`}>{c.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {c.status === 'pending' && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateMut.mutate({ id: c.id, data: { status: 'approved' } })}>Approve</Button>}
                      {c.status === 'approved' && <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => updateMut.mutate({ id: c.id, data: { status: 'paid', paid_date: new Date().toISOString() } })}>Mark Paid</Button>}
                      {['pending','approved'].includes(c.status) && <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200" onClick={() => updateMut.mutate({ id: c.id, data: { status: 'rejected' } })}>Reject</Button>}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No commissions found</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Payouts Tab ──────────────────────────────────────────────────────
function PayoutsTab({ payouts }) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AffiliatePayout.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminPayouts'] }); toast.success('Updated'); },
  });

  const filtered = payouts.filter(p => statusFilter === 'all' || p.status === statusFilter);

  return (
    <div className="space-y-4">
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-44 h-9 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="processing">Processing</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              {['Date','Affiliate','Amount','Method','Payment Details','Status','Actions'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.created_date ? format(new Date(p.created_date), 'MMM d, yyyy') : '—'}</td>
                  <td className="px-4 py-3 font-medium">{p.affiliate_name || '—'}</td>
                  <td className="px-4 py-3 font-bold text-green-600">{p.currency} {(p.amount||0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs capitalize">{(p.payment_method||'').replace(/_/g,' ')}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate">{p.payment_details || '—'}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${PAYOUT_STATUS_COLORS[p.status] || ''}`}>{p.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {p.status === 'pending' && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateMut.mutate({ id: p.id, data: { status: 'processing' } })}>Process</Button>}
                      {p.status === 'processing' && <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => updateMut.mutate({ id: p.id, data: { status: 'completed', processed_date: new Date().toISOString() } })}>Complete</Button>}
                      {['pending','processing'].includes(p.status) && <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200" onClick={() => updateMut.mutate({ id: p.id, data: { status: 'rejected' } })}>Reject</Button>}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No payouts found</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Marketing Materials Tab ──────────────────────────────────────────
function MaterialsTab() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newMat, setNewMat] = useState({ title: '', description: '', material_type: 'banner', file_url: '', thumbnail_url: '', whatsapp_text: '', dimensions: '', sort_order: 0 });

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['adminMaterials'],
    queryFn: () => base44.entities.AffiliateMarketingMaterial.list('sort_order'),
  });

  const addMut = useMutation({
    mutationFn: (data) => base44.entities.AffiliateMarketingMaterial.create({ ...data, is_active: true }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminMaterials'] }); toast.success('Material added'); setShowAdd(false); setNewMat({ title: '', description: '', material_type: 'banner', file_url: '', thumbnail_url: '', whatsapp_text: '', dimensions: '', sort_order: 0 }); },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.AffiliateMarketingMaterial.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminMaterials'] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.AffiliateMarketingMaterial.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminMaterials'] }); toast.success('Deleted'); },
  });

  async function handleUpload(e, field) {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setNewMat(m => ({ ...m, [field]: file_url }));
    setUploading(false);
    toast.success('Uploaded');
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{materials.length} material{materials.length !== 1 ? 's' : ''}</p>
        <Button size="sm" onClick={() => setShowAdd(s => !s)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Material
        </Button>
      </div>

      {showAdd && (
        <Card className="border-[hsl(var(--primary))]/30">
          <CardHeader className="pb-3"><CardTitle className="text-sm">New Marketing Material</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Title</Label>
                <Input value={newMat.title} onChange={e => setNewMat(m => ({ ...m, title: e.target.value }))} className="mt-1 h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={newMat.material_type} onValueChange={v => setNewMat(m => ({ ...m, material_type: v }))}>
                  <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['banner','social_graphic','whatsapp_message','promotional_image','video','other'].map(t => (
                      <SelectItem key={t} value={t}>{t.replace(/_/g,' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Input value={newMat.description} onChange={e => setNewMat(m => ({ ...m, description: e.target.value }))} className="mt-1 h-8 text-sm" />
            </div>
            {newMat.material_type === 'whatsapp_message' ? (
              <div>
                <Label className="text-xs">Message Text (use {'{link}'} and {'{code}'} as placeholders)</Label>
                <Textarea value={newMat.whatsapp_text} onChange={e => setNewMat(m => ({ ...m, whatsapp_text: e.target.value }))} className="mt-1 text-sm" rows={4} />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">File Upload</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <input type="file" id="mat-file" className="hidden" onChange={e => handleUpload(e, 'file_url')} />
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 flex-1" onClick={() => document.getElementById('mat-file').click()} disabled={uploading}>
                      {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      {newMat.file_url ? 'Re-upload' : 'Upload File'}
                    </Button>
                    {newMat.file_url && <a href={newMat.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[hsl(var(--primary))]"><ExternalLink className="w-3.5 h-3.5" /></a>}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Dimensions (optional)</Label>
                  <Input value={newMat.dimensions} onChange={e => setNewMat(m => ({ ...m, dimensions: e.target.value }))} placeholder="1200x628" className="mt-1 h-8 text-sm" />
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={() => addMut.mutate(newMat)} disabled={!newMat.title || addMut.isPending} className="gap-1.5">
                {addMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Material
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.map(m => (
          <Card key={m.id} className={cn("shadow-sm", !m.is_active && "opacity-50")}>
            {m.thumbnail_url && <img src={m.thumbnail_url} alt={m.title} className="w-full h-32 object-cover rounded-t-lg" />}
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-semibold leading-tight">{m.title}</p>
                <Badge className="text-xs shrink-0">{m.material_type.replace(/_/g,' ')}</Badge>
              </div>
              {m.description && <p className="text-xs text-muted-foreground mb-2">{m.description}</p>}
              {m.dimensions && <p className="text-xs text-muted-foreground">{m.dimensions}</p>}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => toggleMut.mutate({ id: m.id, is_active: !m.is_active })}
                  className={cn("text-xs px-2.5 py-1 rounded-full font-medium transition-colors", m.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}
                >
                  {m.is_active ? 'Active' : 'Hidden'}
                </button>
                <button onClick={() => { if (confirm('Delete this material?')) deleteMut.mutate(m.id); }} className="text-xs text-red-500 hover:text-red-700 transition-colors ml-auto">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
        {materials.length === 0 && !isLoading && (
          <div className="col-span-full p-10 text-center text-muted-foreground border-2 border-dashed rounded-xl">
            <Image className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No materials yet — add your first one above</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Program Settings Tab ─────────────────────────────────────────────
function SettingsTab() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['affiliateSettings'],
    queryFn: () => base44.entities.AffiliateSettings.list(null, 1),
  });

  useEffect(() => {
    if (settingsData?.[0] && !settings) setSettings(settingsData[0]);
  }, [settingsData]);

  async function save() {
    if (!settings) return;
    setSaving(true);
    try {
      if (settings.id) {
        await base44.entities.AffiliateSettings.update(settings.id, settings);
      } else {
        const created = await base44.entities.AffiliateSettings.create(settings);
        setSettings(created);
      }
      queryClient.invalidateQueries({ queryKey: ['affiliateSettings'] });
      toast.success('Affiliate program settings saved!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  const form = settings || { commission_rate: 20, minimum_payout: 5000, minimum_payout_currency: 'MWK', program_enabled: true, welcome_message: '', cookie_duration_days: 30 };

  return (
    <div className="space-y-5 max-w-xl">
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4 flex items-start gap-3">
          <Settings2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">Changes here immediately affect what affiliates see on their dashboard — commission rates, minimum payout, and program status are all live.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Commission & Payouts</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label className="text-sm font-medium">Program Status</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Disable to pause all affiliate signups and earnings</p>
            </div>
            <Switch
              checked={!!form.program_enabled}
              onCheckedChange={v => setSettings(s => ({ ...s, program_enabled: v }))}
            />
          </div>
          <hr className="border-border" />
          <div>
            <Label className="text-sm">Commission Rate (%)</Label>
            <p className="text-xs text-muted-foreground mb-1.5">Percentage of each sale paid to the affiliate</p>
            <Input
              type="number" min={0} max={100}
              value={form.commission_rate}
              onChange={e => setSettings(s => ({ ...s, commission_rate: parseFloat(e.target.value) || 0 }))}
              className="max-w-[120px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Minimum Payout Amount</Label>
              <Input
                type="number" min={0}
                value={form.minimum_payout}
                onChange={e => setSettings(s => ({ ...s, minimum_payout: parseFloat(e.target.value) || 0 }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm">Payout Currency</Label>
              <Select value={form.minimum_payout_currency} onValueChange={v => setSettings(s => ({ ...s, minimum_payout_currency: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['MWK','USD','KES','ZMW','ZAR','TZS'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-sm">Cookie Duration (days)</Label>
            <p className="text-xs text-muted-foreground mb-1.5">How long a referral cookie stays active after clicking the link</p>
            <Input
              type="number" min={1}
              value={form.cookie_duration_days}
              onChange={e => setSettings(s => ({ ...s, cookie_duration_days: parseInt(e.target.value) || 30 }))}
              className="max-w-[120px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Welcome Message</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            placeholder="Welcome message shown to affiliates on their dashboard..."
            value={form.welcome_message || ''}
            onChange={e => setSettings(s => ({ ...s, welcome_message: e.target.value }))}
            rows={3}
            className="text-sm"
          />
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving} className="w-full gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────
export default function AdminReferrals() {
  useRoleGuard(null, 'referrals.view');
  const [activeTab, setActiveTab] = useState('overview');

  const { data: referrals = [], isLoading: loadingRefs } = useQuery({
    queryKey: ['adminReferrals'],
    queryFn: () => base44.entities.Referral.list('-created_date', 500).catch(() => []),
  });
  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list().catch(() => []),
  });
  const { data: commissions = [], isLoading: loadingComms } = useQuery({
    queryKey: ['adminCommissions'],
    queryFn: () => base44.entities.AffiliateCommission.list('-created_date', 500).catch(() => []),
  });
  const { data: payouts = [], isLoading: loadingPayouts } = useQuery({
    queryKey: ['adminPayouts'],
    queryFn: () => base44.entities.AffiliatePayout.list('-created_date', 500).catch(() => []),
  });

  const tabProps = { referrals, users, commissions, payouts, isLoading: loadingRefs || loadingComms || loadingPayouts };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background sticky top-0 z-10">
        <div className="px-4 lg:px-8 pt-5 pb-0 max-w-6xl mx-auto">
          <h1 className="text-xl font-bold font-heading flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-[hsl(var(--accent))]" /> Affiliate Program
          </h1>
          <div className="flex gap-1 overflow-x-auto pb-px hide-scrollbar">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0",
                  activeTab === id
                    ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))]"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6 max-w-6xl mx-auto">
        {activeTab === 'overview'    && <OverviewTab {...tabProps} />}
        {activeTab === 'referrals'   && <ReferralsTab {...tabProps} />}
        {activeTab === 'commissions' && <CommissionsTab {...tabProps} />}
        {activeTab === 'payouts'     && <PayoutsTab {...tabProps} />}
        {activeTab === 'materials'   && <MaterialsTab />}
        {activeTab === 'settings'    && <SettingsTab />}
      </div>
    </div>
  );
}
