import { useState, useEffect } from 'react';
import { Save, Loader2, Package, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

// Admin can only configure local-currency prices (daily / weekly / monthly).
// Reach numbers and package descriptions are hardcoded in pricing.js.

const COUNTRIES = ['Malawi', 'Zambia', 'South Africa', 'Kenya', 'Tanzania'];
const CURRENCY_MAP = {
  Malawi:         { code: 'MWK', symbol: 'MK' },
  Zambia:         { code: 'ZMW', symbol: 'ZK' },
  'South Africa': { code: 'ZAR', symbol: 'R'  },
  Kenya:          { code: 'KES', symbol: 'KSh' },
  Tanzania:       { code: 'TZS', symbol: 'TSh' },
};
const PACKAGES = [
  { key: 'starter', label: 'Starter', daily_usd: 1 },
  { key: 'growth',  label: 'Growth',  daily_usd: 3 },
  { key: 'premium', label: 'Premium', daily_usd: 5 },
];
const EMPTY_PKG = { daily: '', weekly: '', monthly: '' };

function PackageCard({ pkg, sym, data, onChange, saving, onSave, onDelete }) {
  function field(name, label, placeholder) {
    return (
      <div>
        <label className="text-xs text-muted-foreground block mb-1">{label}</label>
        <Input
          type="number"
          value={data[name] ?? ''}
          onChange={e => onChange(name, e.target.value === '' ? '' : Number(e.target.value))}
          placeholder={placeholder}
          className="h-9 text-sm"
        />
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            ${pkg.daily_usd}
          </span>
          {pkg.label}
        </h4>
        <span className="text-xs text-muted-foreground">${pkg.daily_usd}/day</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {field('daily',   `Daily (${sym})`,   'e.g. 6000')}
        {field('weekly',  `Weekly (${sym})`,  'e.g. 42000')}
        {field('monthly', `Monthly (${sym})`, 'e.g. 180000')}
      </div>

      <div className="flex items-center justify-between pt-1">
        <Button size="sm" onClick={onSave} disabled={saving} className="gap-1 h-8">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          Save
        </Button>
        {data.id && (
          <Button size="sm" variant="ghost" onClick={onDelete} className="gap-1 h-8 text-destructive hover:bg-destructive/10">
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
      toast.error('Failed to load pricing data');
    }
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    const next = {};
    for (const pkg of PACKAGES) {
      const row = allRows.find(r => r.country === selectedCountry && r.package === pkg.key);
      next[pkg.key] = row
        ? { id: row.id, daily: row.daily ?? '', weekly: row.weekly ?? '', monthly: row.monthly ?? '' }
        : { ...EMPTY_PKG };
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
      const e   = edits[pkgKey];
      const payload = {
        package:  pkgKey,
        country:  selectedCountry,
        currency: cur.code,
        symbol:   cur.symbol,
        daily:    e.daily   === '' ? null : Number(e.daily),
        weekly:   e.weekly  === '' ? null : Number(e.weekly),
        monthly:  e.monthly === '' ? null : Number(e.monthly),
      };

      let saved;
      if (e.id) {
        saved = await base44.entities.PackagePricing.update(e.id, payload);
      } else {
        saved = await base44.entities.PackagePricing.create(payload);
      }
      setAllRows(prev => {
        const filtered = prev.filter(r => !(r.country === selectedCountry && r.package === pkgKey));
        return [...filtered, saved];
      });
      toast.success(`${pkgKey.charAt(0).toUpperCase() + pkgKey.slice(1)} pricing saved!`, { duration: 1500 });
    } catch (err) {
      toast.error(err?.message || 'Failed to save — make sure you are logged in as admin');
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

  const sym = CURRENCY_MAP[selectedCountry]?.symbol || '';

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4" /> Package Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
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
            <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">{sym} ({CURRENCY_MAP[selectedCountry]?.code})</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PACKAGES.map(pkg => (
            <PackageCard
              key={pkg.key}
              pkg={pkg}
              sym={sym}
              data={edits[pkg.key]}
              onChange={(field, value) => handleChange(pkg.key, field, value)}
              saving={!!savingPkg[pkg.key]}
              onSave={() => handleSave(pkg.key)}
              onDelete={() => handleDelete(pkg.key)}
            />
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Reach estimates and package descriptions are fixed — edit them in <code>src/lib/pricing.js</code>.
        </p>
      </CardContent>
    </Card>
  );
}
