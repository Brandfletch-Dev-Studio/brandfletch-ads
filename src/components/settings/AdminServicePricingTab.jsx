import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Trash2, Save, Star } from 'lucide-react';

const SERVICE_TYPES = [
  { value: 'ugc_ads',                  label: '🎥 UGC Ads' },
  { value: 'web_development',          label: '💻 Web Development' },
  { value: 'social_media_management',  label: '📱 Social Media Management' },
];

const COUNTRIES = ['Malawi','Zambia','South Africa','Kenya','Tanzania'];
const CURRENCY_MAP = {
  Malawi: { currency:'MWK', symbol:'MK' },
  Zambia: { currency:'ZMW', symbol:'ZK' },
  'South Africa': { currency:'ZAR', symbol:'R' },
  Kenya: { currency:'KES', symbol:'KSh' },
  Tanzania: { currency:'TZS', symbol:'TSh' },
};

const BLANK = {
  service_type: 'ugc_ads', plan_name: '', plan_slug: '',
  country: 'Malawi', monthly_price: '', annual_price: '',
  credits: '', features: '', description: '',
  is_popular: false, is_active: true, sort_order: 0, cta_label: '',
};

export default function AdminServicePricing() {
  const [plans, setPlans]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState(BLANK);
  const [editId, setEditId]   = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await base44.entities.ServicePricing.list();
      setPlans(data);
    } catch (e) { toast.error('Failed to load service pricing'); }
    setLoading(false);
  }

  function update(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function save() {
    if (!form.plan_name || !form.country) {
      toast.error('Plan name and country are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        plan_slug: form.plan_slug || form.plan_name.toLowerCase().replace(/\s+/g,'_'),
        monthly_price: Number(form.monthly_price) || 0,
        annual_price:  Number(form.annual_price)  || 0,
        credits:       Number(form.credits)       || 0,
        sort_order:    Number(form.sort_order)     || 0,
        currency:      CURRENCY_MAP[form.country]?.currency || 'MWK',
        symbol:        CURRENCY_MAP[form.country]?.symbol   || 'MK',
        features:      typeof form.features === 'string'
          ? form.features.split('\n').map(s => s.trim()).filter(Boolean)
          : form.features,
      };

      if (editId) {
        await base44.entities.ServicePricing.update(editId, payload);
        toast.success('Plan updated');
      } else {
        await base44.entities.ServicePricing.create(payload);
        toast.success('Plan created');
      }
      setForm(BLANK);
      setEditId(null);
      await load();
    } catch (e) { toast.error(e?.message || 'Failed to save'); }
    setSaving(false);
  }

  async function deletePlan(id) {
    if (!confirm('Delete this plan?')) return;
    try {
      await base44.entities.ServicePricing.delete(id);
      setPlans(prev => prev.filter(p => p.id !== id));
      toast.success('Plan deleted');
    } catch (e) { toast.error('Failed to delete'); }
  }

  function startEdit(plan) {
    setEditId(plan.id);
    setForm({
      ...plan,
      features: Array.isArray(plan.features) ? plan.features.join('\n') : (plan.features || ''),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() { setForm(BLANK); setEditId(null); }

  const filtered = plans.filter(p =>
    (filterType === 'all' || p.service_type === filterType) &&
    (filterCountry === 'all' || p.country === filterCountry)
  );

  const sym = CURRENCY_MAP[form.country]?.symbol || 'MK';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-heading">Service Pricing</h2>
        <p className="text-muted-foreground text-sm">Manage UGC Ads, Web Development, and Social Media pricing per country.</p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{editId ? 'Edit Plan' : 'Add Plan'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>Service Type *</Label>
              <Select value={form.service_type} onValueChange={v => update('service_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SERVICE_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Country *</Label>
              <Select value={form.country} onValueChange={v => update('country', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plan Name *</Label>
              <Input value={form.plan_name} onChange={e => update('plan_name', e.target.value)} placeholder="e.g. Growth" />
            </div>
            <div>
              <Label>Monthly Price ({sym})</Label>
              <Input type="number" value={form.monthly_price} onChange={e => update('monthly_price', e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Annual / One-off Price ({sym})</Label>
              <Input type="number" value={form.annual_price} onChange={e => update('annual_price', e.target.value)} placeholder="0" />
            </div>
            {form.service_type === 'ugc_ads' && (
              <div>
                <Label>Credits</Label>
                <Input type="number" value={form.credits} onChange={e => update('credits', e.target.value)} placeholder="1" />
              </div>
            )}
            <div>
              <Label>CTA Label (optional)</Label>
              <Input value={form.cta_label} onChange={e => update('cta_label', e.target.value)} placeholder="e.g. Buy Now" />
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input type="number" value={form.sort_order} onChange={e => update('sort_order', e.target.value)} placeholder="0" />
            </div>
            <div className="flex items-center gap-6 pt-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_popular} onCheckedChange={v => update('is_popular', v)} id="popular" />
                <Label htmlFor="popular" className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-500" /> Popular</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => update('is_active', v)} id="active" />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>
          </div>

          <div>
            <Label>Features (one per line)</Label>
            <Textarea
              value={form.features}
              onChange={e => update('features', e.target.value)}
              rows={4}
              placeholder={"30 posts per month\nDedicated account manager\nMonthly report"}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={save} disabled={saving} className="gap-1.5">
              <Save className="w-4 h-4" /> {saving ? 'Saving…' : editId ? 'Update Plan' : 'Add Plan'}
            </Button>
            {editId && <Button variant="outline" onClick={cancelEdit}>Cancel</Button>}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-52"><SelectValue placeholder="All service types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Service Types</SelectItem>
            {SERVICE_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCountry} onValueChange={setFilterCountry}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All countries" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Plans list */}
      {loading ? <p className="text-muted-foreground text-sm">Loading...</p> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0
            ? <p className="text-muted-foreground text-sm col-span-3 py-8 text-center">No plans found — add one above.</p>
            : filtered.map(plan => (
              <Card key={plan.id} className={`relative ${!plan.is_active ? 'opacity-50' : ''}`}>
                {plan.is_popular && (
                  <div className="absolute top-3 right-3">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-sm">{plan.plan_name}</p>
                      <p className="text-xs text-muted-foreground">{SERVICE_TYPES.find(s=>s.value===plan.service_type)?.label} · {plan.country}</p>
                    </div>
                  </div>
                  <p className="text-lg font-black">
                    {CURRENCY_MAP[plan.country]?.symbol}{(plan.monthly_price || plan.annual_price || 0).toLocaleString()}
                    <span className="text-xs text-muted-foreground font-normal">{plan.monthly_price ? '/mo' : '/yr'}</span>
                  </p>
                  {plan.credits > 0 && <p className="text-xs text-primary">{plan.credits} credits</p>}
                  {plan.features?.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {plan.features.slice(0,3).map((f,i) => <li key={i} className="text-xs text-muted-foreground">· {f}</li>)}
                      {plan.features.length > 3 && <li className="text-xs text-muted-foreground">+ {plan.features.length - 3} more</li>}
                    </ul>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => startEdit(plan)}>Edit</Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" onClick={() => deletePlan(plan.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          }
        </div>
      )}
    </div>
  );
}
