import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, MessageSquare, Calculator } from 'lucide-react';

export default function CustomBudget({ data, selectedCountry, dbPricing, onUpdate }) {
  const [dailySpend, setDailySpend] = useState(10);
  const [days, setDays] = useState(3);
  const [dailyRate, setDailyRate] = useState(15);
  const [currency, setCurrency] = useState('USD');
  const [symbol, setSymbol] = useState('$');

  useEffect(() => {
    if (!selectedCountry) return;

    const getDailyRate = () => {
      const premiumPricing = dbPricing.find(r => 
        r.country === selectedCountry && 
        r.package === 'premium'
      );

      if (premiumPricing && premiumPricing.daily) {
        return { rate: premiumPricing.daily, currency: premiumPricing.currency, symbol: premiumPricing.symbol };
      }

      const localRates = {
        Malawi: { rate: 55000, currency: 'MWK', symbol: 'MK' },
        Zambia: { rate: 400, currency: 'ZMW', symbol: 'ZK' },
        'South Africa': { rate: 280, currency: 'ZAR', symbol: 'R' },
        Kenya: { rate: 2000, currency: 'KES', symbol: 'KSh' },
        Tanzania: { rate: 40000, currency: 'TZS', symbol: 'TSh' },
      };

      const fallback = localRates[selectedCountry] || { rate: 15, currency: 'USD', symbol: '$' };
      return fallback;
    };

    const rateInfo = getDailyRate();
    setDailyRate(rateInfo.rate);
    setCurrency(rateInfo.currency);
    setSymbol(rateInfo.symbol);

    if (dailySpend === 10 && rateInfo.rate !== 15) {
      setDailySpend(Math.round(rateInfo.rate / 1000) * 1000);
    }
  }, [selectedCountry, dbPricing]);

  useEffect(() => {
    const totalCost = dailySpend * days;
    const spendRatio = dailySpend / dailyRate;
    
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
  }, [dailySpend, days, selectedCountry, currency, dailyRate, onUpdate]);

  const formatCurrency = (amount) => {
    if (currency === 'USD') return `$${amount.toFixed(2)}`;
    return `${symbol}${amount.toLocaleString()}`;
  };

  const getStepSize = () => {
    if (currency === 'USD') return 1;
    if (currency === 'MWK' || currency === 'TZS') return 1000;
    if (currency === 'KES') return 100;
    if (currency === 'ZAR' || currency === 'ZMW') return 10;
    return 1;
  };

  const stepSize = getStepSize();
  const maxDailySpend = dailyRate * 3;
  const totalCost = dailySpend * days;
  const spendRatio = dailySpend / dailyRate;
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
              onValueChange={([value]) => setDailySpend(value)}
              min={stepSize}
              max={maxDailySpend}
              step={stepSize}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(stepSize)}</span>
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
        💡 Rates are calculated based on the prevailing daily rate for premium plans in your region.
      </p>
    </div>
  );
}