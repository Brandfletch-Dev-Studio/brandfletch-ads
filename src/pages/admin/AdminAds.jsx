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
import { Plus, Pencil, Trash2, Eye, MousePointer, X, BarChart2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useAuditLog } from '@/hooks/useAuditLog';

const PLACEMENTS = [
  { value: 'dashboard_top', label: 'Dashboard — Top' },
  { value: 'dashboard_bottom', label: 'Dashboard — Bottom' },
  { value: 'campaigns_top', label: 'Campaigns — Top' },
  { value: 'pages_top', label: 'Pages — Top' },
];

const AUDIENCES = [
  { value: 'all', label: 'All users' },
  { value: 'no_campaigns', label: 'No campaigns yet' },
  { value: 'no_pages', label: 'No pages connected' },
  { value: 'has_campaigns', label: 'Has campaigns' },
];

const COLORS = ['blue', 'green', 'purple', 'amber', 'red', 'dark'];

const COLOR_PREVIEW = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  dark: 'bg-gray-800',
};

const EMPTY_FORM = {
  title: '', body: '', image_url: '', cta_label: '', cta_url: '',
  cta_external: false, placement: 'dashboard_top', target_audience: 'all',
  background_color: 'blue', is_active: true, is_dismissable: true,
  start_date: '', end_date: '', sort_order: 0,
};

export default function AdminAds() {
  useRoleGuard(['admin']);
  const auditLog = useAuditLog();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);

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
    onSuccess: (result, vars) => {
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
  function openEdit(ad) {
    setForm({ ...EMPTY_FORM, ...ad });
    setEditId(ad.id);
    setOpen(true);
  }

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

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">In-App Ads</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create and manage promotional banners shown to app users</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> New Ad
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Impressions', value: totalImpressions, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Clicks', value: totalClicks, icon: MousePointer, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Overall CTR', value: `${ctr}%`, icon: BarChart2, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="shadow-sm">
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
        ))}
      </div>

      {/* Ads list */}
      <div className="space-y-3">
        {ads.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No ads yet. Create one to start promoting to users.</p>
            </CardContent>
          </Card>
        )}
        {ads.map(ad => {
          const s = statsFor(ad.id);
          const adCtr = s.impressions > 0 ? ((s.clicks / s.impressions) * 100).toFixed(1) : '0.0';
          const placement = PLACEMENTS.find(p => p.value === ad.placement);
          return (
            <Card key={ad.id} className="shadow-sm">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className={`w-4 h-10 rounded-full flex-shrink-0 ${COLOR_PREVIEW[ad.background_color] || 'bg-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{ad.title}</p>
                    <Badge variant={ad.is_active ? 'default' : 'secondary'} className="text-xs">
                      {ad.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">{placement?.label || ad.placement}</Badge>
                  </div>
                  {ad.body && <p className="text-xs text-muted-foreground mt-0.5 truncate">{ad.body}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{s.impressions}</span>
                    <span className="flex items-center gap-1"><MousePointer className="w-3 h-3" />{s.clicks}</span>
                    <span className="flex items-center gap-1"><X className="w-3 h-3" />{s.dismissals}</span>
                    <span className="font-medium text-foreground">CTR {adCtr}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Switch
                    checked={ad.is_active}
                    onCheckedChange={(v) => toggle.mutate({ id: ad.id, is_active: v })}
                  />
                  <Button size="icon" variant="ghost" onClick={() => openEdit(ad)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"
                    onClick={() => { if (confirm('Delete this ad?')) remove.mutate(ad.id); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Ad' : 'New Ad'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="mb-1.5 block">Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. 🚀 Upgrade your campaign today!" />
            </div>
            <div>
              <Label className="mb-1.5 block">Body text</Label>
              <Input value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Short supporting message..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">CTA Label</Label>
                <Input value={form.cta_label} onChange={e => setForm(f => ({ ...f, cta_label: e.target.value }))} placeholder="Get Started" />
              </div>
              <div>
                <Label className="mb-1.5 block">CTA URL</Label>
                <Input value={form.cta_url} onChange={e => setForm(f => ({ ...f, cta_url: e.target.value }))} placeholder="/campaigns/new" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">Placement *</Label>
                <Select value={form.placement} onValueChange={v => setForm(f => ({ ...f, placement: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLACEMENTS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">Target Audience</Label>
                <Select value={form.target_audience} onValueChange={v => setForm(f => ({ ...f, target_audience: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AUDIENCES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Background Color</Label>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, background_color: c }))}
                    className={`w-8 h-8 rounded-full ${COLOR_PREVIEW[c]} transition-all ${form.background_color === c ? 'ring-2 ring-offset-2 ring-ring scale-110' : 'opacity-60 hover:opacity-100'}`}
                    title={c}
                  />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">Start Date</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div>
                <Label className="mb-1.5 block">End Date</Label>
                <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Image URL (optional)</Label>
              <Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.is_dismissable} onCheckedChange={v => setForm(f => ({ ...f, is_dismissable: v }))} />
                <Label>Dismissable</Label>
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