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
import ConfirmDialog from '@/components/ConfirmDialog';
import { format } from 'date-fns';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { cn } from '@/lib/utils';

function compactNum(val) {
  const n = Number(val);
  if (isNaN(n)) return val;
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toLocaleString();
}


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
function OverviewTab({ referrals = [], commissions = [], payouts = [] }) {
  const total = referrals.length;
  const converted = referrals.filter(r => r.status === 'converted').length;
  const convRate = total > 0 ? Math.round((converted / total) * 100) : 0;
  const totalComm = commissions.reduce((s, c) => s + (c.commission_amount || 0), 0);
  const pendingComm = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + (c.commission_amount || 0), 0);
  const pendingPayouts = payouts.filter(p => p.status === 'pending' || p.status === 'processing').reduce((s, p) => s + (p.amount || 0), 0);

  const stats = [
    { label: 'Total Referrals',     value: compactNum(total),                              color: 'text-sky-600',    bg: 'bg-sky-50',    icon: Users },
    { label: 'Converted',           value: compactNum(converted),                          color: 'text-green-600',  bg: 'bg-green-50',  icon: CheckCircle },
    { label: 'Conversion Rate',     value: `${convRate}%`,                                 color: 'text-purple-600', bg: 'bg-purple-50', icon: TrendingUp },
    { label: 'Total Commissions',   value: `MWK ${compactNum(totalComm)}`,                 color: 'text-amber-600',  bg: 'bg-amber-50',  icon: DollarSign },
    { label: 'Pending Commissions', value: `MWK ${compactNum(pendingComm)}`,               color: 'text-orange-600', bg: 'bg-orange-50', icon: Clock },
    { label: 'Pending Payouts',     value: `MWK ${compactNum(pendingPayouts)}`,            color: 'text-rose-600',   bg: 'bg-rose-50',   icon: Wallet },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(({ label, value, color, bg, icon: Icon }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-4 flex flex-col items-start gap-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className={`text-xl font-bold leading-tight ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground leading-tight">{label}</p>
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
function ReferralsTab({ referrals = [], users = [], isLoading }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Referral.update(id, data),
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


const SERVICES_ADMIN = [
  { key: 'meta_ads',       label: 'Meta Ads' },
  { key: 'graphic_design', label: 'Graphic Design' },
  { key: 'social_media',   label: 'Social Media' },
  { key: 'web_dev',        label: 'Web Development' },
];

// ─── Commissions Tab ──────────────────────────────────────────────────
function CommissionsTab({ commissions = [], users = [], affiliateSettings, isLoading }) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AffiliateCommission.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['commissions']),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.AffiliateCommission.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['commissions']); setShowCreate(false); toast.success('Commission created!'); },
    onError: () => toast.error('Failed to create commission'),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [newComm, setNewComm] = useState({
    affiliate_id: '', referred_user_id: '', service_type: 'meta_ads',
    product_name: '', sale_amount: '', commission_type: 'fixed',
    commission_amount: '', commission_rate: '', notes: ''
  });

  const s = affiliateSettings;
  const currency = s?.default_currency || 'MWK';

  function resolveCommission(serviceKey, saleAmt) {
    if (!s) return { type: 'fixed', amount: 0, rate: 0 };
    const typeField = `${serviceKey}_commission_type`;
    const fixedField = `${serviceKey}_fixed_amount`;
    const pctField = `${serviceKey}_percentage`;
    const svcType = s[typeField] || 'global';
    if (svcType === 'fixed') return { type: 'fixed', amount: s[fixedField] || 0, rate: 0 };
    if (svcType === 'percentage') {
      const rate = s[pctField] || 0;
      return { type: 'percentage', amount: Math.round((saleAmt * rate) / 100), rate };
    }
    if (s.default_commission_type === 'fixed') return { type: 'fixed', amount: s.default_fixed_amount || 0, rate: 0 };
    const rate = s.default_percentage || 0;
    return { type: 'percentage', amount: Math.round((saleAmt * rate) / 100), rate };
  }

  function handleSvcChange(serviceKey) {
    const sale = parseFloat(newComm.sale_amount) || 0;
    const r = resolveCommission(serviceKey, sale);
    setNewComm(p => ({ ...p, service_type: serviceKey, commission_type: r.type, commission_amount: r.amount, commission_rate: r.rate }));
  }

  function handleSaleAmt(val) {
    const sale = parseFloat(val) || 0;
    const r = resolveCommission(newComm.service_type, sale);
    setNewComm(p => ({ ...p, sale_amount: val, commission_type: r.type, commission_amount: r.amount, commission_rate: r.rate }));
  }

  async function submitCreate() {
    const affiliate = (users || []).find(u => u.id === newComm.affiliate_id);
    const referred  = (users || []).find(u => u.id === newComm.referred_user_id);
    if (!affiliate) { toast.error('Select an affiliate'); return; }
    if (!referred)  { toast.error('Select a referred client'); return; }
    createMut.mutate({
      affiliate_id: affiliate.id,
      affiliate_name: affiliate.full_name || affiliate.email,
      referred_user_id: referred.id,
      referred_user_name: referred.full_name || '',
      referred_user_email: referred.email || '',
      referral_code: affiliate.referral_code || `BF-${affiliate.id.slice(-6).toUpperCase()}`,
      product_name: newComm.product_name,
      service_type: newComm.service_type,
      sale_amount: parseFloat(newComm.sale_amount) || 0,
      sale_currency: currency,
      commission_type: newComm.commission_type,
      commission_rate: parseFloat(newComm.commission_rate) || null,
      commission_amount: parseFloat(newComm.commission_amount) || 0,
      commission_currency: currency,
      is_recurring: false,
      status: 'pending',
      trigger_event: 'manual',
      notes: newComm.notes,
    });
  }

  const affiliates = (users || []).filter(u => u.is_affiliate);
  const filtered = commissions.filter(c => statusFilter === 'all' || c.status === statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
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
        <Button size="sm" className="h-9 gap-1.5" onClick={() => setShowCreate(v => !v)}>
          + Add Manual Commission
        </Button>
      </div>

      {showCreate && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Create Commission Manually</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Affiliate</Label>
                <Select value={newComm.affiliate_id} onValueChange={v => setNewComm(p => ({ ...p, affiliate_id: v }))}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Select affiliate" /></SelectTrigger>
                  <SelectContent>{affiliates.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Referred Client</Label>
                <Select value={newComm.referred_user_id} onValueChange={v => setNewComm(p => ({ ...p, referred_user_id: v }))}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>{(users||[]).map(u => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Service Type</Label>
                <Select value={newComm.service_type} onValueChange={handleSvcChange}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SERVICES_ADMIN.map(sv => <SelectItem key={sv.key} value={sv.key}>{sv.label}</SelectItem>)}
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Product / Plan Name</Label>
                <Input value={newComm.product_name} onChange={e => setNewComm(p => ({ ...p, product_name: e.target.value }))} className="mt-1 h-8 text-xs" placeholder="e.g. Meta Ads Basic" />
              </div>
              <div>
                <Label className="text-xs">Sale Amount ({currency})</Label>
                <Input type="number" value={newComm.sale_amount} onChange={e => handleSaleAmt(e.target.value)} className="mt-1 h-8 text-xs" placeholder="0" />
              </div>
              <div>
                <Label className="text-xs">Commission Amount ({currency}) <span className="text-muted-foreground text-xs font-normal">auto-calculated</span></Label>
                <Input type="number" value={newComm.commission_amount} onChange={e => setNewComm(p => ({ ...p, commission_amount: e.target.value }))} className="mt-1 h-8 text-xs" placeholder="0" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Input value={newComm.notes} onChange={e => setNewComm(p => ({ ...p, notes: e.target.value }))} className="mt-1 h-8 text-xs" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="h-8" onClick={submitCreate} disabled={createMut.isPending}>
                {createMut.isPending ? 'Creating...' : 'Create Commission'}
              </Button>
              <Button size="sm" variant="outline" className="h-8" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

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
function PayoutsTab({ payouts = [] }) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AffiliatePayout.update(id, data),
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
  const [deleteMaterialId, setDeleteMaterialId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [newMat, setNewMat] = useState({ title: '', description: '', material_type: 'banner', file_url: '', thumbnail_url: '', whatsapp_text: '', dimensions: '', sort_order: 0 });

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['adminMaterials'],
    queryFn: () => base44.entities.AffiliateMarketingMaterial.list({ sort: 'sort_order' }),
  });

  const addMut = useMutation({
    mutationFn: (data) => base44.entities.AffiliateMarketingMaterial.create({ ...data, is_active: true }),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.AffiliateMarketingMaterial.update(id, { is_active }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.AffiliateMarketingMaterial.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMaterials'] });
      toast.success('Material deleted');
    },
    onError: (err) => toast.error(err?.message || 'Failed to delete material'),
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
                <button onClick={() => setDeleteMaterialId(m.id)} className="text-xs text-red-500 hover:text-red-700 transition-colors ml-auto">
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

      <ConfirmDialog
        open={!!deleteMaterialId}
        onOpenChange={(open) => { if (!open) setDeleteMaterialId(null); }}
        title="Delete material"
        description="Delete this marketing material? This cannot be undone."
        onConfirm={() => { deleteMut.mutate(deleteMaterialId); setDeleteMaterialId(null); }}
      />
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
    queryFn: () => base44.entities.AffiliateSettings.list({ limit: 1 }),
  });

  useEffect(() => {
    if (settingsData?.[0] && !settings) {
      setSettings(settingsData[0]);
    } else if (settingsData && settingsData.length === 0 && !settings) {
      setSettings({
        default_commission_type: 'fixed',
        default_fixed_amount: 10000,
        default_percentage: 5,
        default_currency: 'MWK',
        meta_ads_commission_type: 'global',
        graphic_design_commission_type: 'global',
        social_media_commission_type: 'global',
        web_dev_commission_type: 'global',
        recurring_enabled: false,
        recurring_type: 'fixed',
        recurring_fixed_amount: 2000,
        recurring_percentage: 3,
        recurring_max_months: 12,
        recurring_applies_to: [],
        minimum_payout: 5000,
        minimum_payout_currency: 'MWK',
        payout_cooldown_hours: 48,
        program_enabled: true,
        block_self_referrals: true,
        one_commission_per_client: true,
        cookie_duration_days: 30,
        welcome_message: '',
      });
    }
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

  const s = settings;
  if (isLoading || !s) return <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>;

  const SERVICES = [
    { key: 'meta_ads',       label: 'Meta Ads' },
    { key: 'graphic_design', label: 'Graphic Design' },
    { key: 'social_media',   label: 'Social Media' },
    { key: 'web_dev',        label: 'Web Development' },
  ];

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Live warning */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4 flex items-start gap-3">
          <Settings2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">Changes apply immediately — affiliates see updated rates on their dashboard in real time.</p>
        </CardContent>
      </Card>

      {/* Program status */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Program Status</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { field: 'program_enabled',        label: 'Affiliate Program Active',     desc: 'Disable to pause all affiliate signups and earnings' },
            { field: 'block_self_referrals',    label: 'Block Self-Referrals',         desc: 'Prevent users from using their own referral code' },
            { field: 'one_commission_per_client', label: 'One Commission Per Client',  desc: 'Only the first purchase per referred client earns a one-time commission' },
          ].map(({ field, label, desc }) => (
            <div key={field} className="flex items-center justify-between gap-3">
              <div>
                <Label className="text-sm font-medium">{label}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <Switch checked={!!s[field]} onCheckedChange={v => setSettings(p => ({ ...p, [field]: v }))} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Default commission */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Default Commission</CardTitle>
          <CardDescription className="text-xs mt-1">Applies to all services unless overridden below</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Commission Type</Label>
              <Select value={s.default_commission_type || 'fixed'} onValueChange={v => setSettings(p => ({ ...p, default_commission_type: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Amount per Sale</SelectItem>
                  <SelectItem value="percentage">Percentage of Sale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Currency</Label>
              <Select value={s.default_currency || 'MWK'} onValueChange={v => setSettings(p => ({ ...p, default_currency: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['MWK','USD','KES','ZMW','ZAR','TZS'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {s.default_commission_type === 'fixed' ? (
            <div>
              <Label className="text-sm">Fixed Amount ({s.default_currency || 'MWK'})</Label>
              <Input type="number" min={0} className="mt-1.5 max-w-[200px]"
                value={s.default_fixed_amount ?? 10000}
                onChange={e => setSettings(p => ({ ...p, default_fixed_amount: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          ) : (
            <div>
              <Label className="text-sm">Percentage (%)</Label>
              <Input type="number" min={0} max={100} className="mt-1.5 max-w-[120px]"
                value={s.default_percentage ?? 5}
                onChange={e => setSettings(p => ({ ...p, default_percentage: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-service overrides */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Per-Service Commission Overrides</CardTitle>
          <CardDescription className="text-xs mt-1">Custom rates per service. "Use Default" inherits the global rate above.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {SERVICES.map(({ key, label }) => {
            const typeField  = `${key}_commission_type`;
            const fixedField = `${key}_fixed_amount`;
            const pctField   = `${key}_percentage`;
            const oType      = s[typeField] || 'global';
            return (
              <div key={key} className="py-4 first:pt-0 last:pb-0 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{label}</p>
                  <Select value={oType} onValueChange={v => setSettings(p => ({ ...p, [typeField]: v }))}>
                    <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Use Default</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {oType === 'fixed' && (
                  <div>
                    <Label className="text-xs">Fixed Amount ({s.default_currency || 'MWK'})</Label>
                    <Input type="number" min={0} className="mt-1 max-w-[180px] h-8 text-sm"
                      value={s[fixedField] ?? ''}
                      placeholder={String(s.default_fixed_amount || 10000)}
                      onChange={e => setSettings(p => ({ ...p, [fixedField]: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                )}
                {oType === 'percentage' && (
                  <div>
                    <Label className="text-xs">Percentage (%)</Label>
                    <Input type="number" min={0} max={100} className="mt-1 max-w-[120px] h-8 text-sm"
                      value={s[pctField] ?? ''}
                      placeholder={String(s.default_percentage || 5)}
                      onChange={e => setSettings(p => ({ ...p, [pctField]: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                )}
                {oType === 'global' && (
                  <p className="text-xs text-muted-foreground italic">
                    Earns: {s.default_commission_type === 'fixed'
                      ? `${s.default_currency || 'MWK'} ${(s.default_fixed_amount || 10000).toLocaleString()} per sale`
                      : `${s.default_percentage || 5}% of sale amount`}
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Recurring commissions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[hsl(var(--primary))]" />
            Recurring Commissions
          </CardTitle>
          <CardDescription className="text-xs mt-1">Affiliates earn on each renewal/repeat payment, not just the first sale</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label className="text-sm font-medium">Enable Recurring Commissions</Label>
              <p className="text-xs text-muted-foreground mt-0.5">When on, every repeat payment from a referred client earns a commission</p>
            </div>
            <Switch checked={!!s.recurring_enabled} onCheckedChange={v => setSettings(p => ({ ...p, recurring_enabled: v }))} />
          </div>

          {s.recurring_enabled && (
            <div className="space-y-4 pt-3 border-t border-border">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Recurring Type</Label>
                  <Select value={s.recurring_type || 'fixed'} onValueChange={v => setSettings(p => ({ ...p, recurring_type: v }))}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                      <SelectItem value="percentage">% of Each Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">
                    {s.recurring_type === 'percentage' ? 'Rate (%)' : `Amount (${s.default_currency || 'MWK'})`}
                  </Label>
                  <Input type="number" min={0} max={s.recurring_type === 'percentage' ? 100 : undefined}
                    className="mt-1.5"
                    value={s.recurring_type === 'percentage' ? (s.recurring_percentage ?? 3) : (s.recurring_fixed_amount ?? 2000)}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      setSettings(p => s.recurring_type === 'percentage'
                        ? { ...p, recurring_percentage: val }
                        : { ...p, recurring_fixed_amount: val });
                    }}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm">Max Months</Label>
                <p className="text-xs text-muted-foreground mb-1.5">Cap recurring commissions to N months. Set 0 for unlimited.</p>
                <Input type="number" min={0} className="max-w-[120px]"
                  value={s.recurring_max_months ?? 12}
                  onChange={e => setSettings(p => ({ ...p, recurring_max_months: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div>
                <Label className="text-sm">Applies To</Label>
                <p className="text-xs text-muted-foreground mb-2">Which services earn recurring commissions. Leave all unselected = all services.</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'meta_ads', label: 'Meta Ads' },
                    { key: 'graphic_design', label: 'Graphic Design' },
                    { key: 'social_media', label: 'Social Media' },
                    { key: 'web_development', label: 'Web Dev' },
                  ].map(({ key, label }) => {
                    const sel = (s.recurring_applies_to || []).includes(key);
                    return (
                      <button key={key} type="button"
                        onClick={() => setSettings(p => {
                          const curr = p.recurring_applies_to || [];
                          return { ...p, recurring_applies_to: sel ? curr.filter(x => x !== key) : [...curr, key] };
                        })}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                          sel ? "bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]"
                              : "bg-background border-border text-muted-foreground hover:border-[hsl(var(--primary))]/50"
                        )}
                      >{label}</button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-secondary text-xs space-y-1">
                <p className="font-semibold text-foreground">Preview</p>
                <p>
                  Affiliates earn{' '}
                  <strong>
                    {s.recurring_type === 'percentage'
                      ? `${s.recurring_percentage || 3}% of each renewal payment`
                      : `${s.default_currency || 'MWK'} ${(s.recurring_fixed_amount || 2000).toLocaleString()} per renewal`}
                  </strong>{' '}
                  {(s.recurring_max_months ?? 12) > 0
                    ? `for up to ${s.recurring_max_months} months after the initial sale.`
                    : 'indefinitely after the initial sale.'}
                </p>
                {(s.recurring_applies_to || []).length > 0 && (
                  <p className="text-muted-foreground">Only for: {(s.recurring_applies_to).join(', ').replace(/_/g, ' ')}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout settings */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Payout & Cookie Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Minimum Payout Amount</Label>
              <Input type="number" min={0} className="mt-1.5"
                value={s.minimum_payout ?? 5000}
                onChange={e => setSettings(p => ({ ...p, minimum_payout: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label className="text-sm">Payout Currency</Label>
              <Select value={s.minimum_payout_currency || 'MWK'} onValueChange={v => setSettings(p => ({ ...p, minimum_payout_currency: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['MWK','USD','KES','ZMW','ZAR','TZS'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Payout Cooldown (hours)</Label>
              <p className="text-xs text-muted-foreground mb-1.5">Delay after approval before payout can be released</p>
              <Input type="number" min={0} className="w-full"
                value={s.payout_cooldown_hours ?? 48}
                onChange={e => setSettings(p => ({ ...p, payout_cooldown_hours: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label className="text-sm">Cookie Duration (days)</Label>
              <p className="text-xs text-muted-foreground mb-1.5">How long a referral link click is tracked</p>
              <Input type="number" min={1} className="w-full"
                value={s.cookie_duration_days ?? 30}
                onChange={e => setSettings(p => ({ ...p, cookie_duration_days: parseInt(e.target.value) || 30 }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Welcome message */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Welcome Message</CardTitle></CardHeader>
        <CardContent>
          <Textarea placeholder="Shown to affiliates on their dashboard..."
            value={s.welcome_message || ''}
            onChange={e => setSettings(p => ({ ...p, welcome_message: e.target.value }))}
            rows={3} className="text-sm"
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


export default function AdminReferrals() {
  useRoleGuard(null, 'referrals.view');
  const [activeTab, setActiveTab] = useState('overview');

  const { data: referrals = [], isLoading: loadingRefs } = useQuery({
    queryKey: ['adminReferrals'],
    queryFn: () => base44.entities.Referral.list({ sort: '-created_date', limit: 500 }).catch(() => []),
  });
  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list({}).catch(() => []),
  });
  const { data: commissions = [], isLoading: loadingComms } = useQuery({
    queryKey: ['adminCommissions'],
    queryFn: () => base44.entities.AffiliateCommission.list({ sort: '-created_date', limit: 500 }).catch(() => []),
  });
  const { data: payouts = [], isLoading: loadingPayouts } = useQuery({
    queryKey: ['adminPayouts'],
    queryFn: () => base44.entities.AffiliatePayout.list({ sort: '-created_date', limit: 500 }).catch(() => []),
  });
  const { data: settingsList = [] } = useQuery({
    queryKey: ['affiliateSettings'],
    queryFn: () => base44.entities.AffiliateSettings.list({ limit: 1 }).catch(() => []),
  });
  const affiliateSettings = settingsList?.[0] || null;

  const tabProps = { referrals, users, commissions, payouts, affiliateSettings, isLoading: loadingRefs || loadingComms || loadingPayouts };

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
