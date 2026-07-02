import { format } from 'date-fns';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  Plus, Pencil, Trash2, Eye, MousePointer, X as XIcon,
  Megaphone, TrendingUp, Users, ToggleLeft, ExternalLink,
  Calendar, Palette, Play, Pause, BarChart2
} from 'lucide-react';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useAuditLog } from '@/hooks/useAuditLog';
import { cn } from '@/lib/utils';

const PLACEMENTS = [
  { value: 'dashboard_top',    label: 'Dashboard — Top' },
  { value: 'dashboard_bottom', label: 'Dashboard — Bottom' },
  { value: 'campaigns_top',    label: 'Campaigns — Top' },
  { value: 'pages_top',        label: 'Pages — Top' },
];

const AUDIENCES = [
  { value: 'all',           label: 'All users' },
  { value: 'no_campaigns',  label: 'No campaigns yet' },
  { value: 'no_pages',      label: 'No pages connected' },
  { value: 'has_campaigns', label: 'Has campaigns' },
];

const COLORS = ['blue', 'green', 'purple', 'amber', 'red', 'dark'];

const CS = {
  blue:   { bar: 'bg-blue-500',   grad: 'from-blue-700 via-blue-600 to-blue-500',       ring: 'ring-blue-400',   hex: '#3b82f6' },
  green:  { bar: 'bg-green-500',  grad: 'from-green-700 via-green-600 to-emerald-500',  ring: 'ring-green-400',  hex: '#22c55e' },
  purple: { bar: 'bg-purple-500', grad: 'from-purple-700 via-purple-600 to-violet-500', ring: 'ring-purple-400', hex: '#a855f7' },
  amber:  { bar: 'bg-amber-500',  grad: 'from-amber-600 via-amber-500 to-yellow-400',   ring: 'ring-amber-400',  hex: '#f59e0b' },
  red:    { bar: 'bg-red-500',    grad: 'from-red-700 via-red-600 to-rose-500',         ring: 'ring-red-400',    hex: '#ef4444' },
  dark:   { bar: 'bg-gray-800',   grad: 'from-gray-900 via-gray-800 to-gray-700',       ring: 'ring-gray-500',   hex: '#374151' },
};

const EMPTY_FORM = {
  title: '', body: '', image_url: '', cta_label: '', cta_url: '',
  cta_external: false, placement: 'dashboard_top', target_audience: 'all',
  background_color: 'blue', is_active: true, is_dismissable: true,
  start_date: '', end_date: '', sort_order: 0,
};

/* ── Mini bar chart for per-ad analytics ── */
function AdMiniChart({ impressions, clicks, dismissals }) {
  const data = [
    { name: 'Views', value: impressions, color: '#3b82f6' },
    { name: 'Clicks', value: clicks, color: '#22c55e' },
    { name: 'Dismissed', value: dismissals, color: '#f59e0b' },
  ];
  return (
    <ResponsiveContainer width="100%" height={52}>
      <BarChart data={data} barCategoryGap="30%">
        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}
          formatter={(v, n) => [v.toLocaleString(), n]}
        />
        <Bar dataKey="value" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Live ad preview banner ── */
function AdPreview({ form }) {
  const cs = CS[form.background_color] || CS.blue;
  return (
    <div className={cn('rounded-xl p-4 text-white bg-gradient-to-br', cs.grad)}>
      <p className="text-[10px] font-semibold opacity-60 uppercase tracking-widest mb-1.5">Preview</p>
      <p className="font-bold text-base leading-snug">{form.title || 'Your ad title here'}</p>
      {form.body && <p className="text-sm opacity-80 mt-1 leading-relaxed">{form.body}</p>}
      {form.cta_label && (
        <span className="inline-block mt-3 px-3 py-1.5 bg-white/25 rounded-lg text-xs font-semibold">
          {form.cta_label}
        </span>
      )}
    </div>
  );
}

/* ── Individual Ad Card ── */
function AdCard({ ad, stats, onEdit, onToggle, onDelete }) {
  const placement = PLACEMENTS.find(p => p.value === ad.placement)?.label || ad.placement;
  const audience  = AUDIENCES.find(a => a.value === ad.target_audience)?.label || ad.target_audience;
  const ctr       = stats.impressions > 0 ? ((stats.clicks / stats.impressions) * 100).toFixed(1) : '0.0';
  const cs        = CS[ad.background_color] || CS.blue;

  return (
    <Card className={cn('overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col', !ad.is_active && 'opacity-70')}>
      {/* Gradient header — acts as the visual banner preview */}
      <div className={cn('bg-gradient-to-br text-white px-4 pt-4 pb-5 relative', cs.grad)}>
        {/* Status pill */}
        <span className={cn(
          'absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1',
          ad.is_active ? 'bg-white/20 ring-white/30' : 'bg-black/30 ring-white/20'
        )}>
          {ad.is_active ? '● Live' : '⏸ Paused'}
        </span>
        <p className="font-bold text-sm leading-snug pr-16">{ad.title}</p>
        {ad.body && <p className="text-xs opacity-75 mt-1 line-clamp-2 leading-relaxed">{ad.body}</p>}
        {ad.cta_label && (
          <span className="inline-block mt-2.5 px-2.5 py-1 bg-white/25 rounded-md text-[11px] font-semibold">
            {ad.cta_label}
          </span>
        )}
      </div>

      <CardContent className="p-0 flex-1 flex flex-col">
        {/* Meta tags */}
        <div className="px-4 pt-3 pb-2 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
            <Megaphone className="w-3 h-3" />{placement}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
            <Users className="w-3 h-3" />{audience}
          </span>
          {(ad.start_date || ad.end_date) && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
              <Calendar className="w-3 h-3" />{ad.start_date ? format(new Date(ad.start_date), 'dd MMM yy') : '—'} → {ad.end_date ? format(new Date(ad.end_date), 'dd MMM yy') : '∞'}
            </span>
          )}
        </div>

        {/* Analytics — 4 stat pills */}
        <div className="px-4 grid grid-cols-4 gap-1 mt-1">
          {[
            { label: 'Views', value: stats.impressions, icon: Eye, color: 'text-blue-600' },
            { label: 'Clicks', value: stats.clicks, icon: MousePointer, color: 'text-green-600' },
            { label: 'Dismissed', value: stats.dismissals, icon: XIcon, color: 'text-amber-600' },
            { label: 'CTR', value: `${ctr}%`, icon: TrendingUp, color: 'text-purple-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-lg bg-secondary/60 px-2 py-2 text-center">
              <Icon className={cn('w-3 h-3 mx-auto mb-0.5', color)} />
              <p className="text-[11px] font-bold leading-none">{typeof value === 'number' ? value.toLocaleString() : value}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5 leading-none">{label}</p>
            </div>
          ))}
        </div>

        {/* Mini bar chart */}
        <div className="px-3 mt-2">
          <AdMiniChart impressions={stats.impressions} clicks={stats.clicks} dismissals={stats.dismissals} />
        </div>

        {/* Action row */}
        <div className="px-4 pb-3 pt-2 mt-auto flex items-center justify-between border-t border-border">
          <div className="flex items-center gap-1.5">
            <Switch
              checked={ad.is_active}
              onCheckedChange={(v) => onToggle(ad.id, v)}
              className="scale-[0.8] origin-left"
            />
            <span className="text-xs text-muted-foreground">{ad.is_active ? 'Active' : 'Paused'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm" variant="outline"
              className="h-7 px-2.5 text-xs gap-1"
              onClick={() => onEdit(ad)}
            >
              <Pencil className="w-3 h-3" /> Edit
            </Button>
            <Button
              size="sm" variant="outline"
              className="h-7 px-2.5 text-xs gap-1"
              onClick={() => onToggle(ad.id, !ad.is_active)}
            >
              {ad.is_active ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {ad.is_active ? 'Pause' : 'Resume'}
            </Button>
            <Button
              size="sm" variant="ghost"
              className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => { if (confirm('Delete this ad?')) onDelete(ad.id); }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Main Page ── */
export default function AdminAds() {
  useRoleGuard(['admin']);
  const auditLog = useAuditLog();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [tab, setTab] = useState('all');

  const { data: ads = [] } = useQuery({
    queryKey: ['app-ads'],
    queryFn: () => base44.entities.AppAd.list({ sort: '-created_date' }),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['ad-events'],
    queryFn: () => base44.entities.AdEvent.list({}),
  });

  const save = useMutation({
    mutationFn: ({ id, data }) => id
      ? base44.entities.AppAd.update(id, data)
      : base44.entities.AppAd.create(data),
    onSuccess: (result, { id, data }) => {
      qc.invalidateQueries({ queryKey: ['app-ads'] });
      auditLog(id ? 'ad_updated' : 'ad_created', 'AppAd', id || result?.id, data?.title || '');
      toast.success(id ? 'Ad updated' : 'Ad created');
      setOpen(false);
    },
    onError: (err) => toast.error(err?.message || 'Failed to save ad'),
  });

  const remove = useMutation({
    mutationFn: (id) => base44.entities.AppAd.delete(id),
  onSuccess: (_, id) => {
    qc.invalidateQueries({ queryKey: ['app-ads'] });
    auditLog('ad_deleted', 'AppAd', id);
    toast.success("Ad deleted");
    // no confirm-state to reset (delete has no confirmation step here)
  },
  onError: (err) => toast.error(err?.message || "Failed to delete ad"),
  });

  const toggle = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.AppAd.update(id, { is_active }),
  onSuccess: (_, { id, is_active }) => {
    qc.invalidateQueries({ queryKey: ['app-ads'] });
    auditLog('ad_toggled', 'AppAd', id, is_active ? 'activated' : 'deactivated');
    toast.success("Ad status updated");
  },
  onError: (err) => toast.error(err?.message || "Failed to update ad"),
  });

  function openNew() { setForm(EMPTY_FORM); setEditId(null); setOpen(true); }
  function openEdit(ad) { setForm({ ...EMPTY_FORM, ...ad }); setEditId(ad.id); setOpen(true); }

  const statsFor = useMemo(() => (adId) => {
    const e = events.filter(e => e.ad_id === adId);
    return {
      impressions: e.filter(x => x.event_type === 'impression').length,
      clicks:      e.filter(x => x.event_type === 'click').length,
      dismissals:  e.filter(x => x.event_type === 'dismiss').length,
    };
  }, [events]);

  const totalImpressions = events.filter(e => e.event_type === 'impression').length;
  const totalClicks      = events.filter(e => e.event_type === 'click').length;
  const totalDismissals  = events.filter(e => e.event_type === 'dismiss').length;
  const ctr              = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0';
  const activeCount      = ads.filter(a => a.is_active).length;

  const visibleAds = tab === 'active' ? ads.filter(a => a.is_active)
    : tab === 'paused' ? ads.filter(a => !a.is_active)
    : ads;

  const TABS = [
    { key: 'all',    label: 'All',    count: ads.length },
    { key: 'active', label: 'Active', count: activeCount },
    { key: 'paused', label: 'Paused', count: ads.length - activeCount },
  ];

  const SUMMARY = [
    { label: 'Active Ads',    value: activeCount,                        icon: ToggleLeft,   color: 'text-green-600',  bg: 'bg-green-50' },
    { label: 'Impressions',   value: totalImpressions.toLocaleString(),  icon: Eye,          color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: 'Clicks',        value: totalClicks.toLocaleString(),       icon: MousePointer, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'CTR',           value: `${ctr}%`,                         icon: TrendingUp,   color: 'text-amber-600',  bg: 'bg-amber-50' },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">In-App Ads</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create and manage promotional banners shown to app users</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> New Ad
        </Button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {SUMMARY.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-bold font-heading mt-0.5">{value}</p>
              </div>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bg)}>
                <Icon className={cn('w-5 h-5', color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border pb-0">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
            <span className={cn('ml-1.5 text-xs', tab === t.key ? 'text-primary' : 'text-muted-foreground')}>
              ({t.count})
            </span>
          </button>
        ))}
      </div>

      {/* Ad grid */}
      {visibleAds.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-muted-foreground">
            <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No ads here</p>
            <p className="text-xs mt-1 opacity-60">
              {tab === 'all' ? 'Create your first ad to promote to users.' : `No ${tab} ads.`}
            </p>
            {tab === 'all' && (
              <Button size="sm" className="mt-4 gap-1.5" onClick={openNew}>
                <Plus className="w-3.5 h-3.5" /> Create Ad
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleAds.map(ad => (
            <AdCard
              key={ad.id}
              ad={ad}
              stats={statsFor(ad.id)}
              onEdit={openEdit}
              onToggle={(id, v) => toggle.mutate({ id, is_active: v })}
              onDelete={(id) => remove.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Ad' : 'New Ad'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <AdPreview form={form} />

            {/* Content */}
            <fieldset className="space-y-3 p-3 border rounded-lg bg-secondary/30">
              <legend className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1">Content</legend>
              <div>
                <Label className="mb-1 block text-xs">Title *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. 🚀 Upgrade your campaign!" />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Body text</Label>
                <Input value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Short supporting message..." />
              </div>
            </fieldset>

            {/* CTA */}
            <fieldset className="space-y-3 p-3 border rounded-lg bg-secondary/30">
              <legend className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1">Call to Action</legend>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1 block text-xs">Button label</Label>
                  <Input value={form.cta_label} onChange={e => setForm(f => ({ ...f, cta_label: e.target.value }))} placeholder="Get Started" />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">URL</Label>
                  <Input value={form.cta_url} onChange={e => setForm(f => ({ ...f, cta_url: e.target.value }))} placeholder="/campaigns/new" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.cta_external} onCheckedChange={v => setForm(f => ({ ...f, cta_external: v }))} />
                <Label className="text-xs flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Open in new tab</Label>
              </div>
            </fieldset>

            {/* Targeting */}
            <fieldset className="p-3 border rounded-lg bg-secondary/30">
              <legend className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1">Targeting</legend>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <Label className="mb-1 block text-xs">Placement</Label>
                  <Select value={form.placement} onValueChange={v => setForm(f => ({ ...f, placement: v }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{PLACEMENTS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1 block text-xs">Audience</Label>
                  <Select value={form.target_audience} onValueChange={v => setForm(f => ({ ...f, target_audience: v }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{AUDIENCES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1 block text-xs">Start date</Label>
                  <Input type="date" className="h-8 text-xs" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">End date</Label>
                  <Input type="date" className="h-8 text-xs" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
                </div>
              </div>
            </fieldset>

            {/* Style */}
            <fieldset className="p-3 border rounded-lg bg-secondary/30 space-y-3">
              <legend className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1">Style</legend>
              <div>
                <Label className="mb-2 block text-xs flex items-center gap-1"><Palette className="w-3 h-3" /> Background color</Label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, background_color: c }))}
                      className={cn(
                        'w-8 h-8 rounded-full transition-all border-2',
                        CS[c].bar,
                        form.background_color === c ? 'border-foreground scale-110 shadow-md' : 'border-transparent opacity-50 hover:opacity-80'
                      )}
                      title={c}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-1 block text-xs">Image URL (optional)</Label>
                <Input className="h-8 text-xs" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />
              </div>
            </fieldset>

            {/* Options */}
            <div className="flex items-center justify-between p-3 border rounded-lg bg-secondary/30">
              <div className="flex items-center gap-2.5">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label className="text-sm">Active</Label>
              </div>
              <div className="flex items-center gap-2.5">
                <Switch checked={form.is_dismissable} onCheckedChange={v => setForm(f => ({ ...f, is_dismissable: v }))} />
                <Label className="text-sm">Dismissable</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate({ id: editId, data: form })} disabled={!form.title || save.isPending}>
              {save.isPending ? 'Saving...' : editId ? 'Save Changes' : 'Create Ad'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}