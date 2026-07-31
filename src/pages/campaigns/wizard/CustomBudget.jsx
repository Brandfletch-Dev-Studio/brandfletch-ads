import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, MessageSquare, Calculator } from 'lucide-react';
import { CUSTOM_BUDGET, getCurrencyForCountry, calculatePrice } from '@/lib/pricing';

export default function CustomBudget({ data, selectedCountry, dbPricing, onUpdate }) {
  const [dailySpend, setDailySpend] = useState(6000);
  const [days, setDays] = useState(3);
  const [currency, setCurrency] = useState('MWK');
  const [symbol, setSymbol] = useState('MK');

  useEffect(() => {
    if (!selectedCountry) return;

    const { code, symbol: sym } = getCurrencyForCountry(selectedCountry);
    setCurrency(code);
    setSymbol(sym);

    // Set minimum based on country
    const minPrice = CUSTOM_BUDGET.min; // base MWK minimum
    if (code === 'USD') {
      setDailySpend(1);
    } else {
      const localMin = calculatePrice('starter', 'daily', selectedCountry);
      if (localMin) {
        setDailySpend(localMin.amount);
      } else {
        setDailySpend(minPrice);
      }
    }
  }, [selectedCountry]);

  useEffect(() => {
    const totalCost = dailySpend * days;

    // Use premium daily rate as the reference for estimates
    const premiumDaily = calculatePrice('premium', 'daily', selectedCountry);
    const referenceRate = premiumDaily?.amount || dailySpend;
    const spendRatio = dailySpend / referenceRate;

    const premiumDailyImpressions = 20000;
    const premiumDailyReach = 15000;

    const estimatedImpressions = Math.round(premiumDailyImpressions * spendRatio * days);
    const estimatedReach = Math.round(premiumDailyReach * spendRatio * days);

    onUpdate({
      package: 'custom',
      duration: 'custom',
      country: selectedCountry,
      currency: currency,
      total_cost: totalCost,
      total_cost_usd: 0,
      estimated_impressions: estimatedImpressions,
      estimated_reach: estimatedReach,
      custom_daily_spend: dailySpend,
      custom_days: days,
    });
  }, [dailySpend, days, selectedCountry, currency, onUpdate]);

  const formatCurrency = (amount) => {
    if (currency === 'USD') return `$${amount.toFixed(2)}`;
    return `${symbol}${amount.toLocaleString()}`;
  };

  // Minimum is starter daily price, step is the same as minimum
  const starterDaily = calculatePrice('starter', 'daily', selectedCountry);
  const minSpend = starterDaily?.amount || CUSTOM_BUDGET.min;
  const stepSize = minSpend; // intervals of minimum (e.g. MK6,000)

  // Max is 5x premium daily
  const premiumDaily = calculatePrice('premium', 'daily', selectedCountry);
  const maxDailySpend = (premiumDaily?.amount || 30000) * 5;

  // Snap value to nearest step
  const snapToStep = (value) => {
    const snapped = Math.round(value / stepSize) * stepSize;
    return Math.max(minSpend, Math.min(snapped, maxDailySpend));
  };

  const totalCost = dailySpend * days;
  const spendRatio = dailySpend / (premiumDaily?.amount || dailySpend);
  const estimatedImpressions = Math.round(20000 * spendRatio * days);
  const estimatedReach = Math.round(15000 * spendRatio * days);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
          <Calculator className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-base">Custom Budget</h3>
          <p className="text-xs text-muted-foreground">Set your own daily spend and duration</p>
        </div>
      </div>

      <Card className="border-2 border-emerald-200 bg-emerald-50/50">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Daily Ad Spend</Label>
              <span className="text-lg font-bold text-emerald-700">
                {formatCurrency(dailySpend)}<span className="text-xs font-normal text-muted-foreground">/day</span>
              </span>
            </div>
            <Slider
              value={[dailySpend]}
              onValueChange={([value]) => setDailySpend(snapToStep(value))}
              min={minSpend}
              max={maxDailySpend}
              step={stepSize}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(minSpend)} (min)</span>
              <span>Steps of {formatCurrency(stepSize)}</span>
              <span>{formatCurrency(maxDailySpend)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Campaign Duration</Label>
              <span className="text-lg font-bold text-emerald-700">
                {days} <span className="text-xs font-normal text-muted-foreground">days</span>
              </span>
            </div>
            <Slider
              value={[days]}
              onValueChange={([value]) => setDays(value)}
              min={1}
              max={30}
              step={1}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 day</span>
              <span>30 days</span>
            </div>
          </div>

          <div className="pt-4 border-t border-emerald-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Total Campaign Cost</span>
              <span className="text-2xl font-bold text-emerald-700">{formatCurrency(totalCost)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(dailySpend)} × {days} days = {formatCurrency(totalCost)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-emerald-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Est. Impressions</p>
                <p className="text-sm font-bold text-emerald-700">~{estimatedImpressions.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Est. Reach</p>
                <p className="text-sm font-bold text-emerald-700">~{estimatedReach.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        💡 Minimum daily spend is {formatCurrency(minSpend)}, in increments of {formatCurrency(stepSize)}.
      </p>
    </div>
  );
}
