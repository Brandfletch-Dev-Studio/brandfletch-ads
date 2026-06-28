import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Save, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { LOCAL_PRICES } from '@/lib/pricing';
import AdminServicePricingTab from '@/components/settings/AdminServicePricingTab';

const COUNTRIES = ['Malawi', 'Zambia', 'South Africa', 'Kenya', 'Tanzania'];
const DURATIONS = ['daily', 'weekly', 'monthly'];
const CURRENCY_MAP = {
  Malawi: { currency: 'MWK', symbol: 'MK' },
  Zambia: { currency: 'ZMW', symbol: 'ZK' },
  'South Africa': { currency: 'ZAR', symbol: 'R' },
  Kenya: { currency: 'KES', symbol: 'KSh' },
  Tanzania: { currency: 'TZS', symbol: 'TSh' },
};

function buildDefaults() {
  const rows = [];
  for (const country of COUNTRIES) {
    const lp = LOCAL_PRICES[country];
    if (!lp) continue;
    for (const pkg of ['starter', 'growth', 'business', 'premium']) {
      rows.push({
        country,
        currency: lp.currency,
        symbol: lp.symbol,
        package: pkg,
        daily: lp[pkg]?.daily || 0,
        weekly: lp[pkg]?.weekly || 0,
        monthly: lp[pkg]?.monthly || 0,
      });
    }
  }
  return rows;
}

export default function AdminPricing() {
  const [confirmRow, setConfirmRow] = useState(null);
  const [confirmRow, setConfirmRow] = useState(null);
  useRoleGuard(['admin']);
  const [pricing, setPricing] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pricingTab, setPricingTab] = useState('ads');
  const [activeCountry, setActiveCountry] = useState('Malawi');
  const [newPkg, setNewPkg] = useState({ package: '', daily: '', weekly: '', monthly: '' });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await base44.entities.PackagePricing.list({});
      if (data.length === 0) {
        setPricing(buildDefaults());
      } else {
        setPricing(data);
      }
    } catch (e) {
      setPricing(buildDefaults());
    }
    setLoading(false);
  }

  function getCountryRows(country) {
    return pricing.filter(r => r.country === country);
  }

  function updateValue(country, pkg, duration, value) {
    setPricing(prev => prev.map(r =>
      r.country === country && r.package === pkg
        ? { ...r, [duration]: Number(value) || 0 }
        : r
    ));
  }

  async function saveCountry(country) {
    setSaving(true);
    const countryRows = pricing.filter(r => r.country === country);
    const curr = CURRENCY_MAP[country] || { currency: 'USD', symbol: '$' };

    for (const row of countryRows) {
      const payload = {
        country: row.country,
        currency: row.currency || curr.currency,
        symbol: row.symbol || curr.symbol,
        package: row.package,
        daily: Number(row.daily) || 0,
        weekly: Number(row.weekly) || 0,
        monthly: Number(row.monthly) || 0,
      };

      if (row.id) {
        await base44.entities.PackagePricing.update(row.id, payload);
      } else {
        const created = await base44.entities.PackagePricing.create(payload);
        setPricing(prev => prev.map(r =>
          r.country === row.country && r.package === row.package ? { ...r, id: created.id } : r
        ));
      }
    }
    toast.success(`${country} pricing saved!`);
    setSaving(false);
  }

  async function deletePackage(row) {
    if (row.id) {
      await base44.entities.PackagePricing.delete(row.id);
    }
    setPricing(prev => prev.filter(r => !(r.country === row.country && r.package === row.package)));
    toast.success(`Package "${row.package}" removed from ${row.country}`);
  }

  async function addPackage() {
    if (!newPkg.package) return;
    const curr = CURRENCY_MAP[activeCountry] || { currency: 'USD', symbol: '$' };
    const existing = pricing.find(r => r.country === activeCountry && r.package === newPkg.package);
    if (existing) { toast.error('Package already exists for this country'); return; }

    const payload = {
      country: activeCountry,
      currency: curr.currency,
      symbol: curr.symbol,
      package: newPkg.package.toLowerCase().replace(/\s+/g, '_'),
      daily: Number(newPkg.daily) || 0,
      weekly: Number(newPkg.weekly) || 0,
      monthly: Number(newPkg.monthly) || 0,
    };
    const created = await base44.entities.PackagePricing.create(payload);
    setPricing(prev => [...prev, { ...payload, id: created.id }]);
    setNewPkg({ package: '', daily: '', weekly: '', monthly: '' });
    toast.success('Package added!');
  }

  async function resetToDefaults(country) {
    const defaults = buildDefaults().filter(r => r.country === country);
    setPricing(prev => [
      ...prev.filter(r => r.country !== country),
      ...defaults.map(d => {
        const existing = prev.find(r => r.country === d.country && r.package === d.package);
        return existing ? { ...existing, daily: d.daily, weekly: d.weekly, monthly: d.monthly } : d;
      }),
    ]);
    toast.info(`${country} reset to defaults — click Save to persist`);
  }

  const countryRows = getCountryRows(activeCountry);
  const currencyLabel = countryRows[0] ? `${countryRows[0].currency} (${countryRows[0].symbol})` : (CURRENCY_MAP[activeCountry]?.currency || '');

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading pricing...</div>;

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-heading">Pricing Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage all service pricing per country.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPricingTab('ads')} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${pricingTab === 'ads' ? 'bg-[hsl(var(--primary))] text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>📢 Ads Packages</button>
          <button onClick={() => setPricingTab('services')} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${pricingTab === 'services' ? 'bg-[hsl(var(--primary))] text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>🎯 Other Services</button>
        </div>
      </div>

      {pricingTab === 'services' && <AdminServicePricingTab />}
      {pricingTab !== 'services' && <>

      {/* Country tabs */}
      <div className="flex gap-2 flex-wrap">
        {COUNTRIES.map(c => (
          <button
            key={c}
            onClick={() => setActiveCountry(c)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeCountry === c
                ? 'bg-[hsl(var(--primary))] text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Pricing table for active country */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3 pb-3">
          <CardTitle className="text-base">{activeCountry} — {currencyLabel}</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => resetToDefaults(activeCountry)} className="gap-1.5 text-xs">
              <RefreshCw className="w-3.5 h-3.5" /> Reset Defaults
            </Button>
            <Button size="sm" onClick={() => saveCountry(activeCountry)} disabled={saving} className="gap-1.5 text-xs">
              <Save className="w-3.5 h-3.5" /> Save {activeCountry}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Package</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Daily</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Weekly</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Monthly</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {countryRows.map((row, i) => (
                <tr key={row.package} className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                  <td className="px-5 py-3">
                    <span className="font-semibold capitalize">{row.package}</span>
                  </td>
                  {DURATIONS.map(dur => (
                    <td key={dur} className="px-4 py-2 text-right">
                      <Input
                        type="number"
                        min="0"
                        value={row[dur]}
                        onChange={e => updateValue(activeCountry, row.package, dur, e.target.value)}
                        className="w-32 text-right ml-auto h-8 text-sm"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setConfirmRow(row)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Add new package row */}
          <div className="p-4 border-t border-border bg-secondary/10">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Add Package</p>
            <div className="flex flex-wrap gap-2 items-end">
              <div>
                <Label className="text-xs mb-1 block">Name</Label>
                <Input
                  value={newPkg.package}
                  onChange={e => setNewPkg(p => ({ ...p, package: e.target.value }))}
                  placeholder="e.g. ultra"
                  className="h-8 w-32 text-sm"
                />
              </div>
              {DURATIONS.map(dur => (
                <div key={dur}>
                  <Label className="text-xs mb-1 block capitalize">{dur}</Label>
                  <Input
                    type="number"
                    value={newPkg[dur]}
                    onChange={e => setNewPkg(p => ({ ...p, [dur]: e.target.value }))}
                    placeholder="0"
                    className="h-8 w-28 text-sm"
                  />
                </div>
              ))}
              <Button size="sm" onClick={addPackage} disabled={!newPkg.package} className="gap-1.5 h-8">
                <Plus className="w-3.5 h-3.5" /> Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All countries overview */}
      <div>
        <h2 className="text-base font-semibold mb-3 font-heading">All Countries Overview</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {COUNTRIES.map(country => {
            const rows = pricing.filter(r => r.country === country);
            const sym = rows[0]?.symbol || CURRENCY_MAP[country]?.symbol || '';
            return (
              <Card key={country} className="shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveCountry(country)}>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold">{country} <span className="text-muted-foreground font-normal text-xs">({rows[0]?.currency || CURRENCY_MAP[country]?.currency})</span></CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-1">
                  {rows.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No packages — click to add</p>
                  ) : rows.map(r => (
                    <div key={r.package} className="flex justify-between text-xs">
                      <span className="capitalize text-muted-foreground">{r.package}</span>
                      <span className="font-medium">{sym}{r.daily?.toLocaleString()} / day</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      </> }
    </div>
  );
}