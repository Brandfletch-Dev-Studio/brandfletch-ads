// Pricing engine - clients never see fee breakdowns, only final prices
import { COUNTRY_CURRENCY } from './constants';

export const PACKAGES = {
  starter:    { label: 'Starter',    daily_usd: 1,    description: 'For small businesses getting started with ads', color: 'blue' },
  growth:     { label: 'Growth',     daily_usd: 3,    description: 'For growing businesses scaling their reach',    color: 'indigo' },
  business:   { label: 'Business',   daily_usd: 5,    description: 'For established businesses expanding fast',    color: 'purple' },
  premium:    { label: 'Premium',    daily_usd: 10,   description: 'For maximum reach and full-scale campaigns',   color: 'gold' },
  enterprise: { label: 'Enterprise', daily_usd: null, description: 'Custom advertising solution',                   color: 'gray' },
};

// Base USD prices (includes all fees)
const USD_PRICES = {
  starter:  { daily: 1,   weekly: 7,    monthly: 28 },
  growth:   { daily: 3,   weekly: 21,   monthly: 80 },
  business: { daily: 5,   weekly: 35,   monthly: 130 },
  premium:  { daily: 10,  weekly: 70,   monthly: 260 },
};

// Fixed local-currency prices per country
// Daily = base_rate * ad_spend_multiplier
// Weekly = daily * 7
// Monthly: starter = daily * 26.67, others = daily * 25 (volume discount)
export const LOCAL_PRICES = {
  Malawi: {
    currency: 'MWK', symbol: 'MK',
    starter:  { daily: 6000,   weekly: 42000,   monthly: 160000 },
    growth:   { daily: 18000,  weekly: 126000,  monthly: 450000 },
    business: { daily: 30000,  weekly: 210000,  monthly: 750000 },
    premium:  { daily: 60000,  weekly: 420000,  monthly: 1500000 },
  },
  Zambia: {
    currency: 'ZMW', symbol: 'ZK',
    starter:  { daily: 40,    weekly: 280,    monthly: 1100 },
    growth:   { daily: 120,   weekly: 840,    monthly: 3000 },
    business: { daily: 200,   weekly: 1400,   monthly: 5000 },
    premium:  { daily: 400,   weekly: 2800,   monthly: 10000 },
  },
  'South Africa': {
    currency: 'ZAR', symbol: 'R',
    starter:  { daily: 28,    weekly: 196,    monthly: 750 },
    growth:   { daily: 84,    weekly: 588,    monthly: 2100 },
    business: { daily: 140,   weekly: 980,    monthly: 3500 },
    premium:  { daily: 280,   weekly: 1960,   monthly: 7000 },
  },
  Kenya: {
    currency: 'KES', symbol: 'KSh',
    starter:  { daily: 200,   weekly: 1400,   monthly: 5300 },
    growth:   { daily: 600,   weekly: 4200,   monthly: 15000 },
    business: { daily: 1000,  weekly: 7000,   monthly: 25000 },
    premium:  { daily: 2000,  weekly: 14000,  monthly: 50000 },
  },
  Tanzania: {
    currency: 'TZS', symbol: 'TSh',
    starter:  { daily: 4000,  weekly: 28000,  monthly: 107000 },
    growth:   { daily: 12000, weekly: 84000,  monthly: 300000 },
    business: { daily: 20000, weekly: 140000, monthly: 500000 },
    premium:  { daily: 40000, weekly: 280000, monthly: 1000000 },
  },
};

export const DURATIONS = {
  daily:   { label: 'Daily',   days: 1 },
  weekly:  { label: 'Weekly',  days: 7 },
  monthly: { label: 'Monthly', days: 30 },
};

// Ad spend per package (USD per day)
export const AD_SPEND = {
  starter: 1,
  growth: 3,
  business: 5,
  premium: 10,
};

// Estimated reach per day
export const ESTIMATED_REACH = {
  starter:  '2K – 5K',
  growth:   '6K – 15K',
  business: '10K – 25K',
  premium:  '20K – 50K',
};

/**
 * Calculate price from a preloaded DB pricing list (array of PackagePricing records).
 * Falls back to hardcoded LOCAL_PRICES / USD_PRICES if no DB record found.
 */
export function calculatePriceFromList(pkg, duration, country, dbPricingList = []) {
  if (pkg === 'enterprise') return null;

  const dbRow = dbPricingList.find(r => r.country === country && r.package === pkg);
  if (dbRow && dbRow[duration] != null) {
    const usdAmount = USD_PRICES[pkg]?.[duration] || null;
    return {
      amount: dbRow[duration],
      currency: dbRow.currency,
      symbol: dbRow.symbol,
      display: `${dbRow.symbol}${dbRow[duration].toLocaleString()}`,
      usd: usdAmount,
    };
  }

  return calculatePrice(pkg, duration, country);
}

/**
 * Returns { amount, currency, symbol, display, usdEquivalent? }
 */
export function calculatePrice(pkg, duration, country) {
  if (pkg === 'enterprise') return null;

  const local = LOCAL_PRICES[country];
  if (local && local[pkg]) {
    const amount = local[pkg][duration];
    if (!amount) return null;
    const usdAmount = USD_PRICES[pkg]?.[duration] || null;
    return {
      amount,
      currency: local.currency,
      symbol: local.symbol,
      display: `${local.symbol}${amount.toLocaleString()}`,
      usd: usdAmount,
    };
  }

  const usd = USD_PRICES[pkg];
  if (!usd) return null;
  const amount = usd[duration];
  if (!amount) return null;
  return {
    amount,
    currency: 'USD',
    symbol: '$',
    display: `$${amount.toFixed(2)}`,
    usd: amount,
  };
}

/** Get the currency info for a country */
export function getCurrencyForCountry(country) {
  const local = LOCAL_PRICES[country];
  if (local) return { code: local.currency, symbol: local.symbol };
  return COUNTRY_CURRENCY[country] || { code: 'USD', symbol: '$' };
}

// Estimated results per day
export const ESTIMATED_RESULTS = {
  starter:  { impressions_per_day: 2000,  reach_per_day: 1500 },
  growth:   { impressions_per_day: 6000,  reach_per_day: 4500 },
  business: { impressions_per_day: 10000, reach_per_day: 7500 },
  premium:  { impressions_per_day: 20000, reach_per_day: 15000 },
};

export function calculateEstimatedResults(pkg, duration) {
  const base = ESTIMATED_RESULTS[pkg];
  if (!base) return null;
  const days = DURATIONS[duration]?.days || 1;
  return {
    impressions: base.impressions_per_day * days,
    reach: base.reach_per_day * days,
  };
}
