// Shared, config-driven pricing manager for the department-scoped
// ServiceRate catalog. New department services ship inactive/price=0 —
// this is the screen that lets a dept Manager/Finance (or admin) turn a
// service on and set its real price per country. Embedded as a "Pricing"
// tab inside each department's admin page (AdminStudios, AdminDevStudio,
// and can be reused for Ads/Designs later without new code).
//
// RLS on ServiceRate already scopes INSERT/UPDATE/DELETE to admin/super_admin
// plus each department's Manager+Finance roles (see
// supabase/migrations/20260703_departments_service_rate.sql) — this
// component just needs to call the entity API; permission enforcement
// happens server-side.

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { COUNTRIES, COUNTRY_CURRENCY } from '@/lib/constants';
import ConfirmDialog from '@/components/ConfirmDialog';

const BILLING_TYPES = [
  { value: 'one_off',      label: 'One-off' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'custom_quote', label: 'Custom Quote (no fixed price)' },
];

const emptyDraft = (serviceKey, country) => ({
  service_key:  serviceKey,
  service_name: '',
  plan_name:    '',
  billing_type: 'one_off',
  price:        '',
  currency:     COUNTRY_CURRENCY[country]?.code || 'MWK',
  symbol:       COUNTRY_CURRENCY[country]?.symbol || 'MK',
  country,
  sort_order:   0,
  is_active:    false,
});

export default function ServiceRateManager({ config }) {
  const queryClient = useQueryClient();
  const [country, setCountry] = useState('Malawi');
  const [addingFor, setAddingFor] = useState(null); // service_key currently adding a rate for
  const [draft, setDraft] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data: rates = [], isLoading } = useQuery({
    queryKey: ['serviceRatesAdmin', config.department, country],
    queryFn: () => base44.entities.ServiceRate.filter({ department: config.department, country }, { sort: 'sort_order' }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['serviceRatesAdmin', config.department, country] });

  const createMut = useMutation({
    mutationFn: (payload) => base44.entities.ServiceRate.create(payload),
    onSuccess: () => { toast.success('Rate added.'); setAddingFor(null); setDraft(null); invalidate(); },
    onError: (e) => toast.error('Could not add rate — ' + (e.message || 'try again')),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ServiceRate.update(id, data),
    onSuccess: () => { toast.success('Rate updated.'); setEditingId(null); setEditDraft(null); invalidate(); },
    onError: (e) => toast.error('Could not update — ' + (e.message || 'try again')),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.ServiceRate.update(id, { is_active }),
    onSuccess: () => invalidate(),
    onError: (e) => toast.error('Could not toggle — ' + (e.message || 'try again')),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.ServiceRate.delete(id),
    onSuccess: () => { toast.success('Rate deleted.'); setConfirmDelete(null); invalidate(); },
    onError: (e) => toast.error('Could not delete — ' + (e.message || 'try again')),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Pricing</h2>
          <p className="text-sm text-muted-foreground">Set prices and turn services on for each country. Inactive services show "Coming soon" to customers.</p>
        </div>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="w-44 h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-4">
          {config.serviceTypeOptions
            .filter(svc => (config.orderableServiceTypes || config.serviceTypeOptions.map(s => s.value)).includes(svc.value))
            .map(svc => {
            const svcRates = rates.filter(r => r.service_key === svc.value);
            const isAdding = addingFor === svc.value;
            return (
              <Card key={svc.value}>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold">{svc.label}</CardTitle>
                  {!isAdding && (
                    <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs"
                      onClick={() => { setAddingFor(svc.value); setDraft(emptyDraft(svc.value, country)); }}>
                      <Plus className="w-3.5 h-3.5" /> Add rate
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {svcRates.length === 0 && !isAdding && (
                    <p className="text-xs text-muted-foreground italic">No pricing set for {country} yet — shows as "Coming soon".</p>
                  )}

                  {svcRates.map(rate => {
                    const isEditing = editingId === rate.id;
                    return isEditing ? (
                      <RateForm
                        key={rate.id}
                        value={editDraft}
                        onChange={setEditDraft}
                        onCancel={() => { setEditingId(null); setEditDraft(null); }}
                        onSave={() => updateMut.mutate({ id: rate.id, data: editDraft })}
                        saving={updateMut.isPending}
                      />
                    ) : (
                      <div key={rate.id} className="flex items-center justify-between gap-3 border border-border rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <Switch checked={rate.is_active} onCheckedChange={(v) => toggleMut.mutate({ id: rate.id, is_active: v })} />
                          <div>
                            <p className="text-sm font-medium">
                              {rate.plan_name || rate.service_name}
                              {!rate.is_active && <Badge variant="outline" className="ml-2 text-[10px]">Inactive</Badge>}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {rate.billing_type === 'custom_quote'
                                ? 'Custom quote'
                                : `${rate.symbol || rate.currency} ${Number(rate.price || 0).toLocaleString()} · ${rate.billing_type === 'subscription' ? 'per month' : 'one-off'}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditingId(rate.id); setEditDraft({ ...rate }); }}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setConfirmDelete(rate)}
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {isAdding && (
                    <RateForm
                      value={draft}
                      onChange={setDraft}
                      onCancel={() => { setAddingFor(null); setDraft(null); }}
                      onSave={() => createMut.mutate(draft)}
                      saving={createMut.isPending}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Delete this rate?"
        description={`This removes "${confirmDelete?.plan_name || confirmDelete?.service_name}" from ${confirmDelete?.country}. This can't be undone.`}
        onConfirm={() => deleteMut.mutate(confirmDelete.id)}
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}

function RateForm({ value, onChange, onCancel, onSave, saving }) {
  if (!value) return null;
  const set = (k, v) => onChange({ ...value, [k]: v });
  return (
    <div className="border border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent))]/5 rounded-lg p-3 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1 block">Plan / Tier Name</Label>
          <Input value={value.plan_name || ''} onChange={e => set('plan_name', e.target.value)} placeholder="e.g. Standard" className="h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Billing Type</Label>
          <Select value={value.billing_type} onValueChange={v => set('billing_type', v)}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {BILLING_TYPES.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      {value.billing_type !== 'custom_quote' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs mb-1 block">Price</Label>
            <Input type="number" value={value.price || ''} onChange={e => set('price', e.target.value)} placeholder="0" className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Sort Order</Label>
            <Input type="number" value={value.sort_order || 0} onChange={e => set('sort_order', Number(e.target.value))} className="h-8 text-sm" />
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Switch checked={!!value.is_active} onCheckedChange={v => set('is_active', v)} />
        <Label className="text-xs">Active (visible to customers)</Label>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button size="sm" variant="ghost" className="h-8 text-xs gap-1" onClick={onCancel}><X className="w-3.5 h-3.5" /> Cancel</Button>
        <Button size="sm" className="h-8 text-xs gap-1 bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90" onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
        </Button>
      </div>
    </div>
  );
}
