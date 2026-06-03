// Pricing engine — prices come from ExchangeRate entity (admin-managed)
// Hardcoded tables are kept only as a last-resort fallback

export const PACKAGES = {
  starter:    { label: 'Starter',    description: 'Designed for small businesses',       color: 'blue' },
  growth:     { label: 'Growth',     description: 'Designed for growing businesses',     color: 'indigo' },
  business:   { label: 'Business',   description: 'Designed for established businesses', color: 'purple' },
  premium:    { label: 'Premium',    description: 'Designed for maximum reach',          color: 'gold' },
  enterprise: { label: 'Enterprise', description: 'Custom advertising solution',         color: 'gray' },
};

export const DURATIONS = {
  daily:   { label: 'Daily',   days: 1 },
  weekly:  { label: 'Weekly',  days: 7 },
  monthly: { label: 'Monthly', days: 30 },
};

/**
 * Calculate price from a live ExchangeRate DB record.
 * Returns { amount, currency, symbol, display } or null.
 */
export function calculatePriceFromRate(pkg, duration, exchangeRate) {
  if (!exchangeRate || pkg === 'enterprise') return null;

  const symbol = exchangeRate.currency_symbol || exchangeRate.currency_code;
  const code = exchangeRate.currency_code;

  // 1. Use the admin-defined pricing table if available
  if (exchangeRate.use_fixed_pricing && exchangeRate.pricing_table?.[pkg]?.[duration]) {
    const amount = exchangeRate.pricing_table[pkg][duration];
    return {
      amount,
      currency: code,
      symbol,
      display: `${symbol} ${amount.toLocaleString()}`,
    };
  }

  // 2. Fallback: convert from USD_PRICES using the exchange rate
  const usdAmount = USD_PRICES[pkg]?.[duration];
  if (!usdAmount || !exchangeRate.rate_to_usd) return null;
  const amount = Math.round(usdAmount * exchangeRate.rate_to_usd);
  return {
    amount,
    currency: code,
    symbol,
    display: `${symbol} ${amount.toLocaleString()}`,
  };
}

// USD base prices — used as fallback when no exchange rate record exists
export const USD_PRICES = {
  starter:  { daily: 1.50,  weekly: 10.50,  monthly: 42 },
  growth:   { daily: 4.50,  weekly: 31.50,  monthly: 126 },
  business: { daily: 7.50,  weekly: 52.50,  monthly: 210 },
  premium:  { daily: 15.00, weekly: 105,    monthly: 420 },
};

/**
 * Legacy synchronous helper (uses hardcoded tables — kept for non-wizard use).
 * Prefer calculatePriceFromRate() where possible.
 */
export function calculatePrice(pkg, duration, country) {
  if (pkg === 'enterprise') return null;
  const usd = USD_PRICES[pkg];
  if (!usd) return null;
  const amount = usd[duration];
  if (!amount) return null;
  return { amount, currency: 'USD', symbol: '$', display: `$${amount.toFixed(2)}` };
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