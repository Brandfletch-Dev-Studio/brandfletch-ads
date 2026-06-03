import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Save, RefreshCw } from 'lucide-react';
import { LOCAL_PRICES } from '@/lib/pricing';

const COUNTRIES = ['Malawi', 'Zambia', 'South Africa', 'Kenya', 'Tanzania'];
const PACKAGES = ['starter', 'growth', 'business', 'premium'];
const DURATIONS = ['daily', 'weekly', 'monthly'];

// Build the seed defaults from the hardcoded LOCAL_PRICES
function buildDefaults() {
  const rows = [];
  for (const country of COUNTRIES) {
    const lp = LOCAL_PRICES[country];
    if (!lp) continue;
    for (const pkg of PACKAGES) {
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
  useRoleGuard(['admin']);
  const [pricing, setPricing] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeCountry, setActiveCountry] = useState('Malawi');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const data = await base44.entities.PackagePricing.list();
    if (data.length === 0) {
      // Seed with defaults
      setPricing(buildDefaults());
    } else {
      setPricing(data);
    }
    setLoading(false);
  }

  function getRow(country, pkg) {
    return pricing.find(r => r.country === country && r.package === pkg);
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
    const lp = LOCAL_PRICES[country];

    for (const row of countryRows) {
      const payload = {
        country: row.country,
        currency: row.currency || lp?.currency || 'USD',
        symbol: row.symbol || lp?.symbol || '$',
        package: row.package,
        daily: row.daily,
        weekly: row.weekly,
        monthly: row.monthly,
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

  async function resetToDefaults(country) {
    const defaults = buildDefaults().filter(r => r.country === country);
    const existing = pricing.filter(r => r.country === country);

    setPricing(prev => prev.map(r => {
      if (r.country !== country) return r;
      const def = defaults.find(d => d.package === r.package);
      return def ? { ...r, daily: def.daily, weekly: def.weekly, monthly: def.monthly } : r;
    }));

    toast.info(`${country} reset to default values — click Save to persist`);
  }

  const countryData = pricing.filter(r => r.country === activeCountry);
  const currencyInfo = countryData[0] ? `${countryData[0].currency} (${countryData[0].symbol})` : '';

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading pricing...</div>;

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Package Pricing</h1>
        <p className="text-muted-foreground text-sm mt-1">Edit prices per country. Changes are saved to the database and used immediately.</p>
      </div>

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
          <div>
            <CardTitle className="text-base">{activeCountry} — Prices in {currencyInfo}</CardTitle>
          </div>
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
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide w-28">Package</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Daily</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Weekly</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Monthly</th>
              </tr>
            </thead>
            <tbody>
              {PACKAGES.map((pkg, i) => {
                const row = getRow(activeCountry, pkg);
                if (!row) return null;
                return (
                  <tr key={pkg} className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                    <td className="px-5 py-3">
                      <span className="font-semibold capitalize">{pkg}</span>
                    </td>
                    {DURATIONS.map(dur => (
                      <td key={dur} className="px-4 py-2 text-right">
                        <Input
                          type="number"
                          min="0"
                          value={row[dur]}
                          onChange={e => updateValue(activeCountry, pkg, dur, e.target.value)}
                          className="w-32 text-right ml-auto h-8 text-sm"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Preview of all countries */}
      <div>
        <h2 className="text-base font-semibold mb-3 font-heading">All Countries Overview</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {COUNTRIES.map(country => {
            const rows = pricing.filter(r => r.country === country);
            const sym = rows[0]?.symbol || '';
            return (
              <Card key={country} className="shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveCountry(country)}>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold">{country} <span className="text-muted-foreground font-normal text-xs">({rows[0]?.currency})</span></CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-1">
                  {rows.map(r => (
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
    </div>
  );
}