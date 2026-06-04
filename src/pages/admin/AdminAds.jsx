import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, Pencil, Trash2, Eye, MousePointer, X, BarChart2,
  Megaphone, TrendingUp, Users, ToggleLeft, ExternalLink, Calendar, Palette
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

const COLOR_STYLES = {
  blue:   { dot: 'bg-blue-500',   gradient: 'from-blue-600 to-blue-500',     preview: 'bg-gradient-to-r from-blue-600 to-blue-400' },
  green:  { dot: 'bg-green-500',  gradient: 'from-green-600 to-green-500',   preview: 'bg-gradient-to-r from-green-600 to-green-400' },
  purple: { dot: 'bg-purple-500', gradient: 'from-purple-600 to-purple-500', preview: 'bg-gradient-to-r from-purple-600 to-purple-400' },
  amber:  { dot: 'bg-amber-500',  gradient: 'from-amber-500 to-amber-400',   preview: 'bg-gradient-to-r from-amber-500 to-amber-400' },
  red:    { dot: 'bg-red-500',    gradient: 'from-red-600 to-red-500',       preview: 'bg-gradient-to-r from-red-600 to-red-400' },
  dark:   { dot: 'bg-gray-800',   gradient: 'from-gray-900 to-gray-700',     preview: 'bg-gradient-to-r from-gray-900 to-gray-700' },
};

const EMPTY_FORM = {
  title: '', body: '', image_url: '', cta_label: '', cta_url: '',
  cta_external: false, placement: 'dashboard_top', target_audience: 'all',
  background_color: 'blue', is_active: true, is_dismissable: true,
  start_date: '', end_date: '', sort_order: 0,
};

function AdPreview({ form }) {
  const cs = COLOR_STYLES[form.background_color] || COLOR_STYLES.blue;
  return (
    <div className={cn("rounded-xl p-4 text-white", cs.preview)}>
      <p className="text-xs font-medium opacity-70 uppercase tracking-wide mb-1">Ad Preview</p>
      <p className="font-bold text-base leading-snug">{form.title || 'Your ad title here'}</p>
      {form.body && <p className="text-sm opacity-80 mt-1">{form.body}</p>}
      {form.cta_label && (
        <button className="mt-3 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold">
          {form.cta_label}
        </button>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold font-heading mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function AdCard({ ad, stats, onEdit, onToggle, onDelete }) {
  const placement = PLACEMENTS.find(p => p.value === ad.placement);
  const audience = AUDIENCES.find(a => a.value === ad.target_audience);
  const ctr = stats.impressions > 0 ? ((stats.clicks / stats.impressions) * 100).toFixed(1) : '0.0';
  const cs = COLOR_STYLES[ad.background_color] || COLOR_STYLES.blue;

  return (
    <Card className={cn("shadow-sm transition-all hover:shadow-md", !ad.is_active && "opacity-60")}>
      <CardContent className="p-0">
        {/* Color bar + header */}
        <div className={cn("h-1.5 rounded-t-xl", cs.dot.replace('bg-', 'bg-'))} />
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">{ad.title}</p>
                <Badge variant={ad.is_active ? 'default' : 'secondary'} className="text-xs h-5">
                  {ad.is_active ? 'Active' : 'Paused'}
                </Badge>
              </div>
              {ad.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ad.body}</p>}
            </div>
            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Switch
                checked={ad.is_active}
                onCheckedChange={(v) => onToggle(ad.id, v)}
                className="scale-90"
              />
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(ad)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon" variant="ghost"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => { if (confirm('Delete this ad?')) onDelete(ad.id); }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Meta */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
              <Megaphone className="w-3 h-3" />{placement?.label || ad.placement}
            </span>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
              <Users className="w-3 h-3" />{audience?.label || ad.target_audience}
            </span>
            {(ad.start_date || ad.end_date) && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {ad.start_date || '—'} → {ad.end_date || '∞'}
              </span>
            )}
          </div>

          {/* Stats bar */}
          <div className="mt-3 pt-3 border-t border-border grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-0.5"><Eye className="w-3 h-3" /> Views</p>
              <p className="text-sm font-semibold">{stats.impressions.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-0.5"><MousePointer className="w-3 h-3" /> Clicks</p>
              <p className="text-sm font-semibold">{stats.clicks.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-0.5"><X className="w-3 h-3" /> Dismissed</p>
              <p className="text-sm font-semibold">{stats.dismissals.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-0.5"><TrendingUp className="w-3 h-3" /> CTR</p>
              <p className="text-sm font-semibold text-green-600">{ctr}%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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
    queryFn: () => base44.entities.AppAd.list('-created_date'),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['ad-events'],
    queryFn: () => base44.entities.AdEvent.list(),
  });

  const save = useMutation({
    mutationFn: ({ id, data }) => id
      ? base44.entities.AppAd.update(id, data)
      : base44.entities.AppAd.create(data),
    onSuccess: (_, vars) => {
      auditLog(vars.id ? 'ad_updated' : 'ad_created', 'AppAd', vars.id || 'new', `Ad "${vars.data.title}" ${vars.id ? 'updated' : 'created'}`);
      qc.invalidateQueries({ queryKey: ['app-ads'] });
      setOpen(false);
    },
  });

  const remove = useMutation({
    mutationFn: (id) => base44.entities.AppAd.delete(id),
    onSuccess: (_, id) => {
      auditLog('ad_deleted', 'AppAd', id, `Ad deleted`);
      qc.invalidateQueries({ queryKey: ['app-ads'] });
    },
  });

  const toggle = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.AppAd.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['app-ads'] }),
  });

  function openNew() { setForm(EMPTY_FORM); setEditId(null); setOpen(true); }
  function openEdit(ad) { setForm({ ...EMPTY_FORM, ...ad }); setEditId(ad.id); setOpen(true); }

  function statsFor(adId) {
    const e = events.filter(e => e.ad_id === adId);
    return {
      impressions: e.filter(x => x.event_type === 'impression').length,
      clicks: e.filter(x => x.event_type === 'click').length,
      dismissals: e.filter(x => x.event_type === 'dismiss').length,
    };
  }

  const totalImpressions = events.filter(e => e.event_type === 'impression').length;
  const totalClicks = events.filter(e => e.event_type === 'click').length;
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0';
  const activeCount = ads.filter(a => a.is_active).length;

  const visibleAds = tab === 'active' ? ads.filter(a => a.is_active)
    : tab === 'paused' ? ads.filter(a => !a.is_active)
    : ads;

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Ads" value={activeCount} icon={ToggleLeft} color="text-green-600" bg="bg-green-50" />
        <StatCard label="Total Impressions" value={totalImpressions.toLocaleString()} icon={Eye} color="text-blue-600" bg="bg-blue-50" />
        <StatCard label="Total Clicks" value={totalClicks.toLocaleString()} icon={MousePointer} color="text-purple-600" bg="bg-purple-50" />
        <StatCard label="Overall CTR" value={`${ctr}%`} icon={TrendingUp} color="text-amber-600" bg="bg-amber-50" />
      </div>

      {/* Tabs + list */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All <span className="ml-1.5 text-muted-foreground">({ads.length})</span></TabsTrigger>
          <TabsTrigger value="active">Active <span className="ml-1.5 text-muted-foreground">({activeCount})</span></TabsTrigger>
          <TabsTrigger value="paused">Paused <span className="ml-1.5 text-muted-foreground">({ads.length - activeCount})</span></TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-0">
          {visibleAds.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-14 text-center text-muted-foreground">
                <Megaphone className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No ads here</p>
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
            <div className="grid md:grid-cols-2 gap-4">
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
        </TabsContent>
      </Tabs>

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Ad' : 'New Ad'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Live preview */}
            <AdPreview form={form} />

            {/* Content */}
            <div className="space-y-3">
              <div>
                <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Content</Label>
                <div className="space-y-3 p-3 border rounded-lg bg-secondary/30">
                  <div>
                    <Label className="mb-1 block text-xs">Title *</Label>
                    <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. 🚀 Upgrade your campaign!" />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs">Body text</Label>
                    <Input value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Short supporting message..." />
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div>
                <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Call to Action</Label>
                <div className="space-y-3 p-3 border rounded-lg bg-secondary/30">
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
                    <Label className="text-xs flex items-center gap-1"><ExternalLink className="w-3 h-3" />Open in new tab</Label>
                  </div>
                </div>
              </div>

              {/* Targeting */}
              <div>
                <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Targeting</Label>
                <div className="grid grid-cols-2 gap-3 p-3 border rounded-lg bg-secondary/30">
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
              </div>

              {/* Style */}
              <div>
                <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Style</Label>
                <div className="p-3 border rounded-lg bg-secondary/30 space-y-3">
                  <div>
                    <Label className="mb-2 block text-xs flex items-center gap-1"><Palette className="w-3 h-3" />Background color</Label>
                    <div className="flex gap-2">
                      {COLORS.map(c => (
                        <button key={c} onClick={() => setForm(f => ({ ...f, background_color: c }))}
                          className={cn(
                            "w-8 h-8 rounded-full transition-all",
                            COLOR_STYLES[c].dot,
                            form.background_color === c ? "ring-2 ring-offset-2 ring-ring scale-110" : "opacity-50 hover:opacity-100"
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
                </div>
              </div>

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