import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { PACKAGES, DURATIONS, calculatePriceFromRate, calculateEstimatedResults } from '@/lib/pricing';
import { cn } from '@/lib/utils';
import { CheckCircle2, TrendingUp, MessageSquare, Loader2 } from 'lucide-react';
import { COUNTRIES } from '@/lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function StepPackage({ data, update }) {
  const [selectedCountry, setSelectedCountry] = useState(data.country || '');
  const [exchangeRates, setExchangeRates] = useState([]);
  const [loadingRates, setLoadingRates] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.ExchangeRate.filter({ is_active: true }),
      data.country ? Promise.resolve(null) : base44.auth.me(),
    ]).then(([rates, user]) => {
      setExchangeRates(rates);
      setLoadingRates(false);
      if (user?.country && !selectedCountry) {
        setSelectedCountry(user.country);
        update({ country: user.country });
      }
    });
  }, []);

  function getRateForCountry(country) {
    return exchangeRates.find(r => r.country === country) || null;
  }

  function buildPriceUpdate(pkg, duration, country) {
    const rate = getRateForCountry(country);
    const price = calculatePriceFromRate(pkg, duration, rate);
    const estimated = calculateEstimatedResults(pkg, duration);
    return {
      package: pkg,
      duration,
      country,
      currency: price?.currency || 'USD',
      total_cost: price?.amount || 0,
      estimated_impressions: estimated?.impressions || 0,
      estimated_reach: estimated?.reach || 0,
    };
  }

  function handlePackageSelect(pkg) {
    update(buildPriceUpdate(pkg, data.duration, selectedCountry));
  }

  function handleDurationChange(dur) {
    update(buildPriceUpdate(data.package || '', dur, selectedCountry));
  }

  function handleCountryChange(country) {
    setSelectedCountry(country);
    update(buildPriceUpdate(data.package || '', data.duration, country));
  }

  const packageColors = {
    starter: 'from-blue-500 to-blue-600',
    growth: 'from-indigo-500 to-indigo-600',
    business: 'from-purple-500 to-purple-600',
    premium: 'from-amber-500 to-amber-600',
    enterprise: 'from-slate-600 to-slate-700',
  };

  const activeRate = getRateForCountry(selectedCountry);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold font-heading mb-1">Select Package &amp; Duration</h2>
        <p className="text-muted-foreground text-sm">Choose the budget that works for your business.</p>
      </div>

      {/* Country selector */}
      <div>
        <Label className="mb-2 block">Your Country (for pricing)</Label>
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
      </div>

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
      {loadingRates ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading pricing...
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(PACKAGES).map(([key, pkg]) => {
            const price = calculatePriceFromRate(key, data.duration, activeRate);
            const estimated = calculateEstimatedResults(key, data.duration);

            if (key === 'enterprise') {
              return (
                <div key={key} className="p-4 rounded-xl border-2 border-border bg-secondary/30">
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
                  "w-full p-4 rounded-xl border-2 text-left transition-all",
                  data.package === key
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5"
                    : "border-border hover:border-[hsl(var(--primary))]/40 hover:bg-secondary/50"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${packageColors[key]} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white text-xs font-bold">{pkg.label.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm">{pkg.label}</p>
                      <p className="text-xs text-muted-foreground">{pkg.description}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {price ? (
                      <p className="font-bold text-base text-[hsl(var(--primary))]">{price.display}</p>
                    ) : selectedCountry ? (
                      <p className="text-xs text-muted-foreground">No pricing set</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Select country</p>
                    )}
                    <p className="text-xs text-muted-foreground capitalize">{data.duration}</p>
                  </div>
                </div>

                {estimated && data.duration && (
                  <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      ~{estimated.impressions.toLocaleString()} impressions
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      ~{estimated.reach.toLocaleString()} reach
                    </span>
                  </div>
                )}

                {data.package === key && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-[hsl(var(--primary))]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        * Results are estimates and are not guaranteed.
      </p>
    </div>
  );
}