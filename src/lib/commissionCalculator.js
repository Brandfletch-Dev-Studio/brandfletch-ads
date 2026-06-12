/**
 * calculateCommission
 *
 * Resolves the correct commission for a given service sale,
 * using per-service overrides → global defaults from AffiliateSettings.
 *
 * Usage:
 *   const { amount, type, rate } = calculateCommission(settings, 'meta_ads', saleAmount);
 *   const rec = calculateRecurringCommission(settings, 'meta_ads', saleAmount);
 */

const SERVICE_KEY_MAP = {
  meta_ads:        'meta_ads',
  graphic_design:  'graphic_design',
  social_media:    'social_media',
  web_development: 'web_dev',
};

export function calculateCommission(settings, serviceType, saleAmount = 0) {
  if (!settings) return { amount: 0, type: 'fixed', rate: 0 };

  const key      = SERVICE_KEY_MAP[serviceType] || null;
  const typeKey  = key ? `${key}_commission_type` : null;
  const override = typeKey ? settings[typeKey] : 'global';

  // Determine effective type
  const effectiveType =
    (override && override !== 'global') ? override : settings.default_commission_type || 'fixed';

  let amount = 0;
  let rate   = 0;

  if (effectiveType === 'fixed') {
    // Service-level override first, then global default
    amount =
      (override !== 'global' && key && settings[`${key}_fixed_amount`])
        ? Number(settings[`${key}_fixed_amount`])
        : Number(settings.default_fixed_amount || 10000);
  } else {
    // percentage
    rate =
      (override !== 'global' && key && settings[`${key}_percentage`])
        ? Number(settings[`${key}_percentage`])
        : Number(settings.default_percentage || 5);
    amount = Math.round((rate / 100) * saleAmount);
  }

  return {
    amount,
    type: effectiveType,
    rate,
    currency: settings.default_currency || 'MWK',
  };
}

export function calculateRecurringCommission(settings, serviceType, saleAmount = 0) {
  if (!settings?.recurring_enabled) return null;

  // Check if this service qualifies
  const applies = settings.recurring_applies_to;
  if (applies && applies.length > 0 && !applies.includes(serviceType)) return null;

  const recType = settings.recurring_type || 'fixed';
  let amount = 0;
  let rate   = 0;

  if (recType === 'fixed') {
    amount = Number(settings.recurring_fixed_amount || 2000);
  } else {
    rate   = Number(settings.recurring_percentage || 3);
    amount = Math.round((rate / 100) * saleAmount);
  }

  return {
    amount,
    type: recType,
    rate,
    currency: settings.default_currency || 'MWK',
    max_months: settings.recurring_max_months ?? 12,
  };
}

/**
 * isRecurringEligible
 * Returns true if a recurring commission can still be paid for a given referral
 * based on how many months have already been paid.
 */
export function isRecurringEligible(settings, paidMonths) {
  if (!settings?.recurring_enabled) return false;
  const max = settings.recurring_max_months ?? 12;
  if (max === 0) return true; // unlimited
  return paidMonths < max;
}
