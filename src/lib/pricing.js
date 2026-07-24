// Pricing engine - clients see ad budget as the main differentiator
import { COUNTRY_CURRENCY } from './constants';

export const PACKAGES = {
  starter:  { label: 'Starter',  daily_usd: 1, description: 'For small businesses getting started with ads',  color: 'blue' },
  growth:  { label: 'Growth',   daily_usd: 3, description: 'For growing businesses scaling their reach',     color: 'indigo' },
  premium: { label: 'Premium',  daily_usd: 5, description: 'For established businesses expanding fast',     color: 'purple' },
};

// Base USD prices (includes all fees)
const USD_PRICES = {
  starter:  { weekly: 7,   monthly: 30 },
  growth:   { weekly: 21,  monthly: 65 },
  premium:  { weekly: 35,  monthly: 110 },
};

// Fixed local-currency prices per country — NEW PRICING
export const LOCAL_PRICES = {
  Malawi: {
    currency: 'MWK', symbol: 'MK',
    starter:  { daily: 6000,  weekly: 42000,  monthly: 160000 },
    growth:   { daily: 18000, weekly: 105000, monthly: 450000 },
    premium:  { daily: 25000, weekly: 175000, monthly: 750000 },
  },
  Zambia: {
    currency: 'ZMW', symbol: 'ZK',
    starter:  { weekly: 55,    monthly: 220 },
    growth:   { weekly: 120,   monthly: 480 },
    premium:  { weekly: 200,   monthly: 810 },
  },
  'South Africa': {
    currency: 'ZAR', symbol: 'R',
    starter:  { weekly: 140,   monthly: 560 },
    growth:   { weekly: 300,   monthly: 1200 },
    premium:  { weekly: 500,   monthly: 2000 },
  },
  Kenya: {
    currency: 'KES', symbol: 'KSh',
    starter:  { weekly: 950,   monthly: 3800 },
    growth:   { weekly: 2050,  monthly: 8200 },
    premium:  { weekly: 3400,  monthly: 13600 },
  },
  Tanzania: {
    currency: 'TZS', symbol: 'TSh',
    starter:  { weekly: 19000,   monthly: 76000 },
    growth:   { weekly: 41000,   monthly: 164000 },
    premium:  { weekly: 69000,  monthly: 276000 },
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
  premium: 5,
};

// Estimated monthly reach per package
export const ESTIMATED_REACH = {
  starter:  '60,000 – 150,000',
  growth:   '180,000 – 450,000',
  premium:  '300,000 – 750,000',
};

// Package-specific deliverables
export const PACKAGE_FEATURES = {
  starter: {
    creatives: 4,
    videos: 1,
  },
  growth: {
    creatives: 8,
    videos: 2,
  },
  premium: {
    creatives: 16,
    videos: 4,
  },
};

// Shared features across all packages
export const SHARED_FEATURES = [
  'Facebook & Instagram Ads Management',
  'Campaign setup and optimization',
  'Monthly performance report',
];

/**
 * Calculate price from a preloaded DB pricing list (array of PackagePricing records).
 * Falls back to hardcoded LOCAL_PRICES / USD_PRICES if no DB record found.
 */
export function calculatePriceFromList(pkg, duration, country, dbPricingList = []) {
  const dbRow = dbPricingList.find(r => r.country === country && r.package === pkg);
  if (dbRow && dbRow[duration] != null) {
    return {
      amount: dbRow[duration],
      currency: dbRow.currency,
      symbol: dbRow.symbol,
      display: `${dbRow.symbol}${Number(dbRow[duration]).toLocaleString()}`,
      reach_low: dbRow.reach_low,
      reach_high: dbRow.reach_high,
      creatives: dbRow.creatives,
      videos: dbRow.videos,
      description: dbRow.description,
    };
  }
  return calculatePrice(pkg, duration, country);
}

/**
 * Returns { amount, currency, symbol, display }
 */
export function calculatePrice(pkg, duration, country) {
  const local = LOCAL_PRICES[country];
  if (local && local[pkg]) {
    const amount = local[pkg][duration];
    if (!amount) return null;
    return { amount, currency: local.currency, symbol: local.symbol, display: `${local.symbol}${amount.toLocaleString()}` };
  }

  const usd = USD_PRICES[pkg];
  if (!usd) return null;
  const amount = usd[duration];
  if (!amount) return null;
  return { amount, currency: 'USD', symbol: '$', display: `$${amount.toFixed(2)}` };
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
  premium:  { impressions_per_day: 10000, reach_per_day: 7500 },
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
