import { useState, useEffect } from 'react';
import { Save, Loader2, Package, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

// DB schema: one row per (country × package) with columns:
//   package, country, currency, symbol, daily, weekly, monthly,
//   reach_low, reach_high, creatives, videos, description

const COUNTRIES = ['Malawi', 'Zambia', 'South Africa', 'Kenya', 'Tanzania'];
const CURRENCY_MAP = {
  Malawi:         { code: 'MWK', symbol: 'MK' },
  Zambia:         { code: 'ZMW', symbol: 'ZK' },
  'South Africa': { code: 'ZAR', symbol: 'R' },
  Kenya:          { code: 'KES', symbol: 'KSh' },
  Tanzania:       { code: 'TZS', symbol: 'TSh' },
};
const PACKAGES = [
  { key: 'starter',  label: 'Starter',  daily_usd: 1 },
  { key: 'growth',   label: 'Growth',   daily_usd: 3 },
  { key: 'premium',  label: 'Premium',  daily_usd: 5 },
];

const EMPTY_PKG = { daily: '', weekly: '', monthly: '', reach_low: '', reach_high: '', creatives: '', videos: '', description: '' };

function PackageCard({ pkg, data, onChange, saving, onSave, onDelete }) {
  const sym = data.symbol || CURRENCY_MAP[data.country]?.symbol || '';

  function field(name, label, placeholder) {
    return (
      <div>
        <label className="text-xs text-muted-foreground block mb-1">{label}</label>
        <Input
          type="number"
          value={data[name] ?? ''}
          onChange={e => onChange(name, e.target.value === '' ? '' : Number(e.target.value))}
          placeholder={placeholder}
          className="h-8 text-sm"
        />
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            ${pkg.daily_usd}
          </span>
          {pkg.label}
        </h4>
        <span className="text-xs text-muted-foreground">${pkg.daily_usd}/day ad spend</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {field('daily',      `Daily (${sym})`,   'e.g. 6000')}
        {field('weekly',     `Weekly (${sym})`,  'e.g. 42000')}
        {field('monthly',    `Monthly (${sym})`, 'e.g. 160000')}
        {field('reach_low',  'Reach Low/day',    'e.g. 2000')}
        {field('reach_high', 'Reach High/day',   'e.g. 5000')}
        {field('creatives',  'Creatives',        'e.g. 2')}
        {field('videos',     'Videos',           'e.g. 1')}
      </div>

      <div>
        <label className="text-xs text-muted-foreground block mb-1">Description</label>
        <Input
          value={data.description ?? ''}
          onChange={e => onChange('description', e.target.value)}
          placeholder="Short description shown to clients"
          className="h-8 text-sm"
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <Button
          size="sm"
          onClick={onSave}
          disabled={saving}
          className="gap-1 h-8 bg-primary text-primary-foreground"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          Save {pkg.label}
        </Button>
        {data.id && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="gap-1 h-8 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-3 h-3" /> Delete
          </Button>
        )}
      </div>
    </div>
  );
}

export default function PackagePricingTab() {
  const [allRows, setAllRows]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [savingPkg, setSavingPkg] = useState({});
  const [selectedCountry, setSelectedCountry] = useState('Malawi');
  const [edits, setEdits] = useState({
    starter: { ...EMPTY_PKG },
    growth:  { ...EMPTY_PKG },
    premium: { ...EMPTY_PKG },
  });

  async function loadAll() {
    setLoading(true);
    try {
      const list = await base44.entities.PackagePricing.list({});
      setAllRows(list || []);
    } catch (err) {
      console.error('Failed to load PackagePricing', err);
      toast.error('Failed to load pricing data');
    }
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    const next = {};
    for (const pkg of PACKAGES) {
      const row = allRows.find(r => r.country === selectedCountry && r.package === pkg.key);
      next[pkg.key] = row ? { ...row } : { ...EMPTY_PKG, country: selectedCountry, package: pkg.key };
    }
    setEdits(next);
  }, [selectedCountry, allRows]);

  function handleChange(pkg, field, value) {
    setEdits(prev => ({ ...prev, [pkg]: { ...prev[pkg], [field]: value } }));
  }

  async function handleSave(pkgKey) {
    setSavingPkg(s => ({ ...s, [pkgKey]: true }));
    try {
      const cur = CURRENCY_MAP[selectedCountry] || { code: 'USD', symbol: '$' };
      const payload = {
        ...edits[pkgKey],
        country:  selectedCountry,
        currency: cur.code,
        symbol:   cur.symbol,
        package:  pkgKey,
      };
      // Null out empty numeric fields
      ['daily','weekly','monthly','reach_low','reach_high','creatives','videos'].forEach(f => {
        if (payload[f] === '' || payload[f] === undefined) payload[f] = null;
      });
      // Remove system fields from payload
      delete payload.created_date;
      delete payload.updated_date;
      delete payload.created_by;

      let saved;
      if (payload.id) {
        const { id, ...rest } = payload;
        saved = await base44.entities.PackagePricing.update(id, rest);
      } else {
        const { id, ...rest } = payload;
        saved = await base44.entities.PackagePricing.create(rest);
      }
      setAllRows(prev => {
        const filtered = prev.filter(r => !(r.country === selectedCountry && r.package === pkgKey));
        return [...filtered, saved];
      });
      const label = pkgKey.charAt(0).toUpperCase() + pkgKey.slice(1);
      toast.success(`${label} pricing saved!`, { duration: 1500 });
    } catch (err) {
      console.error('Save failed:', err);
      toast.error(err?.message || 'Failed to save pricing — ensure you are logged in as admin');
    }
    setSavingPkg(s => ({ ...s, [pkgKey]: false }));
  }

  async function handleDelete(pkgKey) {
    const row = edits[pkgKey];
    if (!row?.id) return;
    if (!confirm(`Delete ${pkgKey} pricing for ${selectedCountry}?`)) return;
    try {
      await base44.entities.PackagePricing.delete(row.id);
      setAllRows(prev => prev.filter(r => r.id !== row.id));
      toast.success('Deleted');
    } catch (err) {
      toast.error(err?.message || 'Failed to delete');
    }
  }

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4" /> Package Pricing
          </CardTitle>
        </CardHeader>
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
          <Package className="w-4 h-4" /> Package Pricing by Country
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-3 flex-wrap">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PACKAGES.map(pkg => (
            <PackageCard
              key={pkg.key}
              pkg={pkg}
              data={{ ...edits[pkg.key], country: selectedCountry }}
              onChange={(field, value) => handleChange(pkg.key, field, value)}
              saving={!!savingPkg[pkg.key]}
              onSave={() => handleSave(pkg.key)}
              onDelete={() => handleDelete(pkg.key)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
