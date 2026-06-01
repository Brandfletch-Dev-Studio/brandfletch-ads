export const COUNTRIES = [
  'Malawi', 'Kenya', 'Zambia', 'Zimbabwe', 'Tanzania', 'Uganda', 'Rwanda',
  'Ghana', 'Nigeria', 'South Africa', 'Mozambique', 'Botswana', 'Namibia',
  'Ethiopia', 'Senegal', 'Ivory Coast', 'Cameroon', 'Angola', 'Egypt',
  'Morocco', 'Tunisia', 'Algeria', 'Sudan', 'Somalia', 'DRC',
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
  'France', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Finland',
  'Other'
];

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
};

export const OBJECTIVES = [
  { value: 'whatsapp_messages', label: 'WhatsApp Messages', icon: '💬', desc: 'Drive conversations on WhatsApp' },
  { value: 'messenger_conversations', label: 'Messenger Conversations', icon: '📨', desc: 'Drive conversations on Messenger' },
  { value: 'website_traffic', label: 'Website Traffic', icon: '🌐', desc: 'Send people to your website' },
  { value: 'brand_awareness', label: 'Brand Awareness', icon: '📣', desc: 'Reach a broad audience' },
];

export const PROMOTE_TYPES = [
  { value: 'boost_post', label: 'Boost an existing Facebook post', icon: '🚀' },
  { value: 'product', label: 'Promote a product', icon: '🛍️' },
  { value: 'service', label: 'Promote a service', icon: '⚡' },
  { value: 'whatsapp_messages', label: 'Get WhatsApp messages', icon: '💬' },
  { value: 'messenger_messages', label: 'Get Messenger messages', icon: '📨' },
  { value: 'website_traffic', label: 'Drive website traffic', icon: '🌐' },
];