import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { PACKAGES, DURATIONS, calculatePriceFromList, calculateEstimatedResults } from '@/lib/pricing';
import { cn } from '@/lib/utils';
import { CheckCircle2, TrendingUp, MessageSquare, Sliders } from 'lucide-react';
import { COUNTRIES } from '@/lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CustomBudget from './CustomBudget';

export default function StepPackage({ data, update }) {
  const [selectedCountry, setSelectedCountry] = useState(data.country || '');
  const [dbPricing, setDbPricing] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    base44.entities.PackagePricing.list().then(list => setDbPricing(list || [])).catch(() => {});
    base44.auth.me().then(u => {
      if (u?.role === 'admin') setIsAdmin(true);
      if (!selectedCountry && u?.country) {
        setSelectedCountry(u.country);
        update({ country: u.country });
      }
    });
  }, []);

  function calcPrice(pkg, duration, country) {
    return calculatePriceFromList(pkg, duration, country, dbPricing);
  }

  function handlePackageSelect(pkg) {
    const price = calcPrice(pkg, data.duration, selectedCountry);
    const estimated = calculateEstimatedResults(pkg, data.duration);
    update({
      package: pkg,
      country: selectedCountry,
      currency: price?.currency || 'USD',
      total_cost: price?.amount || 0,
      total_cost_usd: price?.usd || 0,
      estimated_impressions: estimated?.impressions || 0,
      estimated_reach: estimated?.reach || 0,
    });
  }

  function handleDurationChange(dur) {
    if (data.package) {
      const price = calcPrice(data.package, dur, selectedCountry);
      const estimated = calculateEstimatedResults(data.package, dur);
      update({
        duration: dur,
        country: selectedCountry,
        currency: price?.currency || 'USD',
        total_cost: price?.amount || 0,
        total_cost_usd: price?.usd || 0,
        estimated_impressions: estimated?.impressions || 0,
        estimated_reach: estimated?.reach || 0,
      });
    } else {
      update({ duration: dur });
    }
  }

  function handleCountryChange(country) {
    setSelectedCountry(country);
    if (data.package) {
      const price = calcPrice(data.package, data.duration, country);
      const estimated = calculateEstimatedResults(data.package, data.duration);
      update({
        country,
        currency: price?.currency || 'USD',
        total_cost: price?.amount || 0,
        total_cost_usd: price?.usd || 0,
        estimated_impressions: estimated?.impressions || 0,
        estimated_reach: estimated?.reach || 0,
      });
    } else {
      update({ country });
    }
  }

  function handleCustomBudgetUpdate(customData) {
    update(customData);
  }

  const packageColors = {
    starter: 'from-blue-500 to-blue-600',
    growth: 'from-indigo-500 to-indigo-600',
    business: 'from-purple-500 to-purple-600',
    premium: 'from-amber-500 to-amber-600',
    enterprise: 'from-slate-600 to-slate-700',
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold font-heading mb-1">Select Package & Duration</h2>
        <p className="text-muted-foreground text-sm">Choose the budget that works for your business.</p>
      </div>

      {/* Country selector — admin only */}
      <div>
        <Label className="mb-2 block">Your Country (for pricing)</Label>
        {isAdmin ? (
          <Select value={selectedCountry} onValueChange={handleCountryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select your country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex h-9 w-full items-center rounded-md border border-input bg-secondary/50 px-3 text-sm text-muted-foreground">
            {selectedCountry || 'No country set on your profile'}
          </div>
        )}
      </div>

      <Tabs defaultValue="preset" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preset" className="gap-2">
            <TrendingUp className="w-4 h-4" /> Preset Plans
          </TabsTrigger>
          <TabsTrigger value="custom" className="gap-2">
            <Sliders className="w-4 h-4" /> Custom Budget
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preset" className="mt-4 space-y-4">
          {/* Duration tabs */}
          <div>
            <Label className="mb-2 block">Duration</Label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(DURATIONS).map(([key, d]) => (
                <button
                  key={key}
                  onClick={() => handleDurationChange(key)}
                  className={cn(
                    "py-2.5 rounded-xl border-2 text-sm font-semibold transition-all",
                    data.duration === key
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 text-[hsl(var(--primary))]"
                      : "border-border hover:border-[hsl(var(--primary))]/40"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Packages */}
          <div className="space-y-3">
            {Object.entries(PACKAGES).map(([key, pkg]) => {
              const price = calcPrice(key, data.duration, selectedCountry);
              const estimated = calculateEstimatedResults(key, data.duration);

              if (key === 'enterprise') {
                return (
                  <div
                    key={key}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all",
                      "border-border bg-secondary/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${packageColors[key]} flex items-center justify-center`}>
                        <span className="text-white text-xs font-bold">E</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm">Enterprise</p>
                        <p className="text-xs text-muted-foreground">Custom advertising solution</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      📞 Speak with our sales team for a custom advertising solution tailored to your business.
                    </p>
                  </div>
                );
              }

              return (
                <button
                  key={key}
                  onClick={() => handlePackageSelect(key)}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 transition-all text-left",
                    data.package === key
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5"
                      : "border-border hover:border-[hsl(var(--primary))]/40 hover:bg-secondary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${packageColors[key]} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white text-xs font-bold">{pkg.label.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm">{pkg.label}</p>
                        {data.package === key && <CheckCircle2 className="w-4 h-4 text-[hsl(var(--primary))]" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{pkg.description}</p>
                    </div>
                  </div>
                  {price && (
                    <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Cost</p>
                        <p className="font-bold text-[hsl(var(--primary))]">{price.display}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Est. Reach</p>
                        <p className="font-semibold text-xs">{estimated?.reach?.toLocaleString()} people</p>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="mt-4">
          <CustomBudget
            data={data}
            selectedCountry={selectedCountry}
            dbPricing={dbPricing}
            onUpdate={handleCustomBudgetUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}