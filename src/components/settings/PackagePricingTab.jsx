import { useState, useEffect } from 'react';
import { Save, Loader2, Package, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const COUNTRIES = ['Malawi', 'Zambia', 'South Africa', 'Kenya', 'Tanzania'];
const CURRENCY_MAP = {
  Malawi: { code: 'MWK', symbol: 'MK' },
  Zambia: { code: 'ZMW', symbol: 'ZK' },
  'South Africa': { code: 'ZAR', symbol: 'R' },
  Kenya: { code: 'KES', symbol: 'KSh' },
  Tanzania: { code: 'TZS', symbol: 'TSh' },
};
const PACKAGES = ['starter', 'growth', 'premium'];
const PKG_LABELS = { starter: 'Starter', growth: 'Growth', premium: 'Premium' };
const AD_SPEND = { starter: 1, growth: 3, premium: 5 };

function PackageEditor({ pkg, data, onChange }) {
  const prefix = pkg;
  function update(field, value) {
    onChange(`${prefix}_${field}`, value);
  }

  return (
    <div className="border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-[hsl(var(--accent))]/10 flex items-center justify-center text-xs font-bold text-[hsl(var(--accent))]">
            ${AD_SPEND[pkg]}
          </span>
          {PKG_LABELS[pkg]} Package
        </h4>
        <span className="text-xs text-muted-foreground">${AD_SPEND[pkg]}/day ad spend</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Monthly Price</label>
          <Input
            type="number"
            value={data[`${prefix}_monthly`] ?? ''}
            onChange={e => update('monthly', e.target.value ? Number(e.target.value) : '')}
            placeholder="e.g. 299000"
            className="h-8 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Weekly Price</label>
          <Input
            type="number"
            value={data[`${prefix}_weekly`] ?? ''}
            onChange={e => update('weekly', e.target.value ? Number(e.target.value) : '')}
            placeholder="e.g. 75000"
            className="h-8 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Reach Low</label>
          <Input
            type="number"
            value={data[`${prefix}_reach_low`] ?? ''}
            onChange={e => update('reach_low', e.target.value ? Number(e.target.value) : '')}
            placeholder="e.g. 60000"
            className="h-8 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Reach High</label>
          <Input
            type="number"
            value={data[`${prefix}_reach_high`] ?? ''}
            onChange={e => update('reach_high', e.target.value ? Number(e.target.value) : '')}
            placeholder="e.g. 150000"
            className="h-8 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Creatives</label>
          <Input
            type="number"
            value={data[`${prefix}_creatives`] ?? ''}
            onChange={e => update('creatives', e.target.value ? Number(e.target.value) : '')}
            placeholder="e.g. 4"
            className="h-8 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Videos</label>
          <Input
            type="number"
            value={data[`${prefix}_videos`] ?? ''}
            onChange={e => update('videos', e.target.value ? Number(e.target.value) : '')}
            placeholder="e.g. 1"
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

export default function PackagePricingTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('Malawi');
  const [editData, setEditData] = useState({});

  async function loadPricing() {
    setLoading(true);
    try {
      const list = await base44.entities.PackagePricing.list({});
      setRows(list || []);
      const row = list?.find(r => r.country === selectedCountry);
      if (row) setEditData({ ...row });
    } catch (err) {
      console.error('Failed to load pricing', err);
    }
    setLoading(false);
  }

  useEffect(() => { loadPricing(); }, []);

  useEffect(() => {
    const row = rows.find(r => r.country === selectedCountry);
    if (row) setEditData({ ...row });
  }, [selectedCountry, rows]);

  function handleFieldChange(field, value) {
    setEditData(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const currency = CURRENCY_MAP[selectedCountry];
      const payload = {
        ...editData,
        country: selectedCountry,
        currency: currency.code,
        symbol: currency.symbol,
        package: 'all',
      };

      if (editData.id) {
        await base44.entities.PackagePricing.update(editData.id, payload);
      } else {
        await base44.entities.PackagePricing.create(payload);
      }
      toast.success('Package pricing saved');
      await loadPricing();
    } catch (err) {
      console.error('Save failed', err);
      toast.error('Failed to save pricing');
    }
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!confirm('Delete pricing for this country?')) return;
    try {
      await base44.entities.PackagePricing.delete(id);
      toast.success('Pricing deleted');
      await loadPricing();
    } catch (err) {
      toast.error('Failed to delete');
    }
  }

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Package className="w-4 h-4" /> Package Pricing</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading pricing…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="w-4 h-4" /> Package Pricing Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground">Country:</label>
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="w-48 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">
            {CURRENCY_MAP[selectedCountry]?.symbol} ({CURRENCY_MAP[selectedCountry]?.code})
          </span>
          {editData.id && (
            <Button variant="ghost" size="sm" className="ml-auto text-destructive gap-1" onClick={() => handleDelete(editData.id)}>
              <Trash2 className="w-3 h-3" /> Delete
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PACKAGES.map(pkg => (
            <PackageEditor
              key={pkg}
              pkg={pkg}
              data={editData}
              onChange={handleFieldChange}
            />
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saving} className="gap-2 bg-[hsl(var(--primary))] text-primary-foreground">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Pricing
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
