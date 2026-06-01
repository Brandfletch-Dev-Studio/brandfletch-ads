// Pricing engine - clients never see fee breakdowns, only final prices

export const PACKAGES = {
  starter: { label: 'Starter', daily_usd: 1, description: 'Designed for small businesses', color: 'blue' },
  growth: { label: 'Growth', daily_usd: 3, description: 'Designed for growing businesses', color: 'indigo' },
  business: { label: 'Business', daily_usd: 5, description: 'Designed for established businesses', color: 'purple' },
  premium: { label: 'Premium', daily_usd: 10, description: 'Designed for maximum reach', color: 'gold' },
  enterprise: { label: 'Enterprise', daily_usd: null, description: 'Custom advertising solution', color: 'gray' },
};

// International final prices (USD, includes all fees)
export const INTERNATIONAL_PRICES = {
  starter: { weekly: 10.50, monthly: 42 },
  growth: { weekly: 31.50, monthly: 126 },
  business: { weekly: 52.50, monthly: 210 },
  premium: { weekly: 105, monthly: 420 },
};

// Malawi fixed prices (MWK)
export const MALAWI_PRICES = {
  starter: { daily: 6000, weekly: 39000, monthly: 150000 },
  growth: { daily: 18000, weekly: 105000, monthly: 450000 },
  premium: { daily: 25000, weekly: 175000, monthly: 750000 },
};

export const DURATIONS = {
  daily: { label: 'Daily', days: 1 },
  weekly: { label: 'Weekly', days: 7 },
  monthly: { label: 'Monthly', days: 30 },
};

export function calculatePrice(pkg, duration, country, exchangeRate = 1) {
  if (pkg === 'enterprise') return null;
  
  // Malawi fixed pricing
  if (country === 'Malawi') {
    const mwPrices = MALAWI_PRICES[pkg];
    if (!mwPrices) return null;
    return {
      amount: mwPrices[duration] || null,
      currency: 'MWK',
      display: mwPrices[duration] ? `MK${mwPrices[duration].toLocaleString()}` : null,
    };
  }

  // International pricing
  const intPrices = INTERNATIONAL_PRICES[pkg];
  if (!intPrices) return null;
  
  let usdAmount;
  if (duration === 'daily') {
    usdAmount = PACKAGES[pkg].daily_usd * 1.5; // daily rate including fees
  } else {
    usdAmount = intPrices[duration];
  }
  
  if (!usdAmount) return null;

  if (exchangeRate && exchangeRate !== 1) {
    const localAmount = usdAmount * exchangeRate;
    return {
      amount: localAmount,
      currency: 'LOCAL',
      display: `${formatLocalAmount(localAmount)}`,
      usdEquivalent: usdAmount,
    };
  }
  
  return {
    amount: usdAmount,
    currency: 'USD',
    display: `$${usdAmount.toFixed(2)}`,
  };
}

function formatLocalAmount(amount) {
  if (amount >= 1000) {
    return amount.toLocaleString('en', { maximumFractionDigits: 0 });
  }
  return amount.toFixed(2);
}

// Estimated results per day
export const ESTIMATED_RESULTS = {
  starter: { impressions_per_day: 2000, reach_per_day: 1500 },
  growth: { impressions_per_day: 6000, reach_per_day: 4500 },
  business: { impressions_per_day: 10000, reach_per_day: 7500 },
  premium: { impressions_per_day: 20000, reach_per_day: 15000 },
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