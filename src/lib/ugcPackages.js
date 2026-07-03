// ─── UGC Ads — single source of truth for packages, pricing, and messaging ───
// Both the public Pricing page (PricingPage.jsx) and the UGC ordering wizard
// (UgcAds.jsx) import from here. Previously each file kept its own hardcoded
// copy of the same packages — they happened to be in sync, but any future
// price/copy change made in one place would not automatically reflect in the
// other. Edit prices/features/copy here and both pages update together.

export const UGC_OVERVIEW = {
  title: 'UGC Ads — Brandfletch Studios',
  desc: "We don't just create videos. We create UGC ads designed to help businesses attract customers. Every creative is built Meta Ads-ready.",
  included: [
    'Content creator matching',
    'Feature on Brandfletch Studios network',
    'Creator social media feature',
    'Brand story development',
    'Offer packaging',
    'Meta Ads-ready creatives (hooks, messaging, conversion structure)',
  ],
};

export const UGC_PACKAGES = {
  starter: {
    name: 'Starter',
    videos: 1,
    badge: null,
    priceNote: 'per campaign',
    features: [
      '1 UGC ad creative',
      'Creator matching',
      'Brand story development',
      'Offer packaging session',
      'Meta Ads-ready format',
      'Creator social media feature',
    ],
    prices: {
      Malawi:         { amount: 100000,  currency: 'MWK', symbol: 'MK'  },
      Zambia:         { amount: 3500,    currency: 'ZMW', symbol: 'ZK'  },
      'South Africa': { amount: 1800,    currency: 'ZAR', symbol: 'R'   },
      Kenya:          { amount: 14000,   currency: 'KES', symbol: 'KSh' },
      Tanzania:       { amount: 230000,  currency: 'TZS', symbol: 'TSh' },
      default:        { amount: 60,      currency: 'USD', symbol: '$'   },
    },
  },
  growth: {
    name: 'Growth',
    videos: 3,
    badge: 'Best Value',
    priceNote: 'per campaign',
    features: [
      '3 UGC ad creatives',
      'Multiple message angles',
      'Creator matching',
      'Full brand story development',
      'Offer packaging session',
      'Meta Ads-ready formats',
      'Creator social media feature',
      'A/B testing angles',
    ],
    prices: {
      Malawi:         { amount: 250000,  currency: 'MWK', symbol: 'MK'  },
      Zambia:         { amount: 8500,    currency: 'ZMW', symbol: 'ZK'  },
      'South Africa': { amount: 4500,    currency: 'ZAR', symbol: 'R'   },
      Kenya:          { amount: 33000,   currency: 'KES', symbol: 'KSh' },
      Tanzania:       { amount: 570000,  currency: 'TZS', symbol: 'TSh' },
      default:        { amount: 150,     currency: 'USD', symbol: '$'   },
    },
  },
  brand_campaign: {
    name: 'Brand Campaign',
    videos: 10,
    badge: 'Scaling Brands',
    priceNote: 'per campaign',
    features: [
      '10 UGC ad creatives',
      'Full advertising content library',
      'Multiple creators',
      'Complete brand story development',
      'Offer packaging session',
      'Meta Ads-ready formats',
      'Creator social media features',
      'Designed for scaling campaigns',
    ],
    prices: {
      Malawi:         { amount: 750000,  currency: 'MWK', symbol: 'MK'  },
      Zambia:         { amount: 26000,   currency: 'ZMW', symbol: 'ZK'  },
      'South Africa': { amount: 13500,   currency: 'ZAR', symbol: 'R'   },
      Kenya:          { amount: 100000,  currency: 'KES', symbol: 'KSh' },
      Tanzania:       { amount: 1700000, currency: 'TZS', symbol: 'TSh' },
      default:        { amount: 450,     currency: 'USD', symbol: '$'   },
    },
  },
};

export function getPriceForCountry(pkgKey, country) {
  const p = UGC_PACKAGES[pkgKey];
  return p.prices[country] || p.prices.default;
}

// Malawi/MWK-formatted price string, used on the public Pricing page which
// (like all other static-plan services) always displays MWK regardless of
// the visitor's detected country.
export function getMwkPriceLabel(pkgKey) {
  const { amount } = UGC_PACKAGES[pkgKey].prices.Malawi;
  return `MK ${amount.toLocaleString()}`;
}
