// Pricing engine - clients never see fee breakdowns, only final prices
import { COUNTRY_CURRENCY } from './constants';

export const PACKAGES = {
  starter:    { label: 'Starter',    daily_usd: 1,    description: 'Designed for small businesses',       color: 'blue' },
  growth:     { label: 'Growth',     daily_usd: 3,    description: 'Designed for growing businesses',     color: 'indigo' },
  business:   { label: 'Business',   daily_usd: 5,    description: 'Designed for established businesses', color: 'purple' },
  premium:    { label: 'Premium',    daily_usd: 10,   description: 'Designed for maximum reach',          color: 'gold' },
  enterprise: { label: 'Enterprise', daily_usd: null, description: 'Custom advertising solution',         color: 'gray' },
};

// Base USD prices (includes all fees)
const USD_PRICES = {
  starter:  { daily: 1.50,  weekly: 10.50,  monthly: 42 },
  growth:   { daily: 4.50,  weekly: 31.50,  monthly: 126 },
  business: { daily: 7.50,  weekly: 52.50,  monthly: 210 },
  premium:  { daily: 15.00, weekly: 105,    monthly: 420 },
};

// Fixed local-currency prices per country
export const LOCAL_PRICES = {
  Malawi: {
    currency: 'MWK', symbol: 'MK',
    starter:  { daily: 6000,   weekly: 39000,   monthly: 150000 },
    growth:   { daily: 18000,  weekly: 105000,  monthly: 450000 },
    business: { daily: 30000,  weekly: 175000,  monthly: 700000 },
    premium:  { daily: 55000,  weekly: 350000,  monthly: 1400000 },
  },
  Zambia: {
    currency: 'ZMW', symbol: 'ZK',
    starter:  { daily: 40,    weekly: 280,    monthly: 1100 },
    growth:   { daily: 120,   weekly: 840,    monthly: 3300 },
    business: { daily: 200,   weekly: 1400,   monthly: 5500 },
    premium:  { daily: 400,   weekly: 2800,   monthly: 11000 },
  },
  'South Africa': {
    currency: 'ZAR', symbol: 'R',
    starter:  { daily: 28,    weekly: 195,    monthly: 770 },
    growth:   { daily: 84,    weekly: 585,    monthly: 2310 },
    business: { daily: 140,   weekly: 975,    monthly: 3850 },
    premium:  { daily: 280,   weekly: 1950,   monthly: 7700 },
  },
  Kenya: {
    currency: 'KES', symbol: 'KSh',
    starter:  { daily: 200,   weekly: 1400,   monthly: 5500 },
    growth:   { daily: 600,   weekly: 4200,   monthly: 16500 },
    business: { daily: 1000,  weekly: 7000,   monthly: 27500 },
    premium:  { daily: 2000,  weekly: 14000,  monthly: 55000 },
  },
  Tanzania: {
    currency: 'TZS', symbol: 'TSh',
    starter:  { daily: 4000,  weekly: 28000,  monthly: 110000 },
    growth:   { daily: 12000, weekly: 84000,  monthly: 330000 },
    business: { daily: 20000, weekly: 140000, monthly: 550000 },
    premium:  { daily: 40000, weekly: 280000, monthly: 1100000 },
  },
};

export const DURATIONS = {
  daily:   { label: 'Daily',   days: 1 },
  weekly:  { label: 'Weekly',  days: 7 },
  monthly: { label: 'Monthly', days: 30 },
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

  // Fallback to hardcoded
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
    // USD equivalent from USD_PRICES for admin reference
    const usdAmount = USD_PRICES[pkg]?.[duration] || null;
    return {
      amount,
      currency: local.currency,
      symbol: local.symbol,
      display: `${local.symbol}${amount.toLocaleString()}`,
      usd: usdAmount,
    };
  }

  // Fallback to USD
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