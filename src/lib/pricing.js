// Pricing engine - clients see ad budget as the main differentiator
import { COUNTRY_CURRENCY } from './constants';

export const PACKAGES = {
  starter:  { label: 'Starter',  daily_usd: 1, description: 'For small businesses getting started with ads',  color: 'blue' },
  growth:  { label: 'Growth',   daily_usd: 3, description: 'For growing businesses scaling their reach',     color: 'indigo' },
  premium: { label: 'Premium',  daily_usd: 5, description: 'For established businesses expanding fast',     color: 'purple' },
};

// Base USD prices (international pricing)
const USD_PRICES = {
  starter:  { weekly: 7,   monthly: 30 },
  growth:   { weekly: 21,  monthly: 90 },
  premium:  { weekly: 35,  monthly: 150 },
};

// Fixed local-currency prices per country
// Malawi is the base; other countries use official exchange rate equivalents
export const LOCAL_PRICES = {
  Malawi: {
    currency: 'MWK', symbol: 'MK',
    starter:  { daily: 6000,  weekly: 42000,  monthly: 180000 },
    growth:   { daily: 18000, weekly: 126000, monthly: 540000 },
    premium:  { daily: 30000, weekly: 210000, monthly: 900000 },
  },
  Zambia: {
    currency: 'ZMW', symbol: 'ZK',
    starter:  { weekly: 95,    monthly: 2880 },
    growth:   { weekly: 290,   monthly: 8640 },
    premium:  { weekly: 480,   monthly: 14400 },
  },
  'South Africa': {
    currency: 'ZAR', symbol: 'R',
    starter:  { weekly: 65,    monthly: 1905 },
    growth:   { weekly: 190,   monthly: 5710 },
    premium:  { weekly: 315,   monthly: 9515 },
  },
  Kenya: {
    currency: 'KES', symbol: 'KSh',
    starter:  { weekly: 450,   monthly: 13250 },
    growth:   { weekly: 1350,  monthly: 39800 },
    premium:  { weekly: 2200,  monthly: 66350 },
  },
  Tanzania: {
    currency: 'TZS', symbol: 'TSh',
    starter:  { weekly: 9000,   monthly: 261000 },
    growth:   { weekly: 26000,  monthly: 782000 },
    premium:  { weekly: 43000,  monthly: 1304000 },
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
  // Monthly totals (daily reach × 30 days)
  starter:  '60K – 150K',
  growth:   '180K – 450K',
  premium:  '300K – 750K',
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
      // Reach numbers are always sourced from the hardcoded ESTIMATED_REACH
      // constants — never from the database.
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
  starter:  { impressions_per_day: 2000,  reach_per_day_low: 2000,  reach_per_day_high: 5000  },
  growth:   { impressions_per_day: 6000,  reach_per_day_low: 6000,  reach_per_day_high: 15000 },
  premium:  { impressions_per_day: 10000, reach_per_day_low: 10000, reach_per_day_high: 25000 },
};

export function calculateEstimatedResults(pkg, duration) {
  const base = ESTIMATED_RESULTS[pkg];
  if (!base) return null;
  const days = DURATIONS[duration]?.days || 1;
  return {
    impressions: base.impressions_per_day * days,
    reach_low: base.reach_per_day_low * days,
    reach_high: base.reach_per_day_high * days,
  };
}

// Custom budget minimum and step (in MWK)
export const CUSTOM_BUDGET = {
  min: 6000,
  step: 6000,
};
