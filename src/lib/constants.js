// Brandfletch constants
// Supported countries — 5 focus markets
export const COUNTRIES = [
  'Malawi',
  'Zambia',
  'South Africa',
  'Kenya',
  'Tanzania',
];

// Currency config per country
export const COUNTRY_CURRENCY = {
  Malawi:       { code: 'MWK', symbol: 'MK',  name: 'Malawian Kwacha' },
  Zambia:       { code: 'ZMW', symbol: 'ZK',  name: 'Zambian Kwacha' },
  'South Africa': { code: 'ZAR', symbol: 'R',  name: 'South African Rand' },
  Kenya:        { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  Tanzania:     { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling' },
};

export const CAMPAIGN_STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  awaiting_payment: { label: 'Awaiting Payment', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  pending_review: { label: 'Pending Review', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  active: { label: 'Active', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  paused: { label: 'Paused', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  completed: { label: 'Completed', color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  changes_requested: { label: 'Changes Requested', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  refunded: { label: 'Refunded', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400' },
};

export const GOALS = [
  { value: 'messages', label: 'Get Messages', icon: '💬', desc: 'Drive people to chat with you on WhatsApp, Messenger, or both' },
  { value: 'website_traffic', label: 'Website Traffic', icon: '🌐', desc: 'Send people to your website or landing page' },
  { value: 'phone_calls', label: 'Phone Calls', icon: '📞', desc: 'Get people to call your business directly' },
  { value: 'brand_awareness', label: 'Brand Awareness', icon: '📣', desc: 'Reach a broad audience and grow recognition' },
  { value: 'page_followers', label: 'Page Followers', icon: '👥', desc: 'Grow your Facebook Page audience' },
  { value: 'boost_post', label: 'Boost a Post', icon: '🚀', desc: 'Amplify an existing post on your Facebook Page' },
];

// Format a USD amount into the user's local currency
export function formatLocalCurrency(usdAmount, country) {
  const cfg = COUNTRY_CURRENCY[country];
  if (!cfg) return `$${usdAmount.toFixed(2)}`;

  // Approximate exchange rates (local units per 1 USD)
  const rates = {
    MWK: 1730,
    ZMW: 27,
    ZAR: 18.5,
    KES: 130,
    TZS: 2550,
  };

  const rate = rates[cfg.code] || 1;
  const localAmount = usdAmount * rate;

  // Format with thousands separator
  const formatted = localAmount >= 1000
    ? localAmount.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : localAmount.toFixed(2);

  return `${cfg.symbol} ${formatted}`;
}

// Legacy — kept for backward compatibility
export const OBJECTIVES = [
  { value: 'whatsapp_messages', label: 'WhatsApp Messages', icon: '💬', desc: 'Drive conversations on WhatsApp' },
  { value: 'messenger_conversations', label: 'Messenger Conversations', icon: '📨', desc: 'Drive conversations on Messenger' },
  { value: 'website_traffic', label: 'Website Traffic', icon: '🌐', desc: 'Send people to your website' },
  { value: 'brand_awareness', label: 'Brand Awareness', icon: '📣', desc: 'Reach a broad audience' },
];

export const PROMOTE_TYPES = [
  { value: 'boost_post', label: 'Boost a Facebook post', icon: '🚀', desc: 'Amplify a post already on your Page — needs a Facebook URL' },
  { value: 'product', label: 'Promote a product', icon: '🛍️', desc: 'Showcase a specific item you sell' },
  { value: 'service', label: 'Promote a service', icon: '⚡', desc: 'Advertise a service your business offers' },
  { value: 'whatsapp_messages', label: 'Get WhatsApp messages', icon: '💬', desc: 'Drive people to chat with you on WhatsApp' },
  { value: 'messenger_messages', label: 'Get Messenger messages', icon: '📨', desc: 'Drive people to message you on Messenger' },
  { value: 'website_traffic', label: 'Drive website traffic', icon: '🌐', desc: 'Send people to your website or landing page' },
];