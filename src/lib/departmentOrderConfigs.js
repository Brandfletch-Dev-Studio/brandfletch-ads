// Shared config for the two new department "order workspace" experiences
// (Studios, Dev Studio). Both entities (UgcOrder, DevStudioOrder) share the
// exact same lifecycle shape, so one generic set of components (see
// src/components/department/) renders all of it — admin list/detail,
// manager dashboard, and the production-staff portal — driven entirely by
// this config. Add a new department order flow by adding a config here, not
// by writing new page code.

export const STATUS_OPTIONS = [
  { value: 'pending_payment',    label: 'Pending Payment' },
  { value: 'awaiting_brief',     label: 'Awaiting Brief' },
  { value: 'in_production',      label: 'In Production' },
  { value: 'review',             label: 'Under Review' },
  { value: 'revision_requested', label: 'Revision Requested' },
  { value: 'completed',          label: 'Completed' },
  { value: 'cancelled',          label: 'Cancelled' },
];

export const STATUS_COLORS = {
  pending_payment:    'bg-yellow-100 text-yellow-700',
  awaiting_brief:     'bg-blue-100 text-blue-700',
  in_production:      'bg-purple-100 text-purple-700',
  review:             'bg-indigo-100 text-indigo-700',
  revision_requested: 'bg-orange-100 text-orange-700',
  completed:          'bg-green-100 text-green-700',
  cancelled:          'bg-gray-100 text-gray-500',
};

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'unpaid',               label: 'Unpaid' },
  { value: 'pending_verification', label: 'Pending Verification' },
  { value: 'paid',                 label: 'Paid' },
  { value: 'refunded',             label: 'Refunded' },
];

export const PAY_COLORS = {
  unpaid:               'bg-red-100 text-red-700',
  pending_verification: 'bg-yellow-100 text-yellow-700',
  paid:                 'bg-green-100 text-green-700',
  refunded:             'bg-gray-100 text-gray-500',
};

export const STUDIOS_CONFIG = {
  entityName:      'UgcOrder',
  department:      'studios',
  title:           'Studios',
  brandField:      'brand_name',
  assigneeIdField:   'assigned_creator_id',
  assigneeNameField: 'assigned_creator_name',
  assigneeRole:      'content_creator',
  assigneeRoleLabel: 'Content Creator',
  managerRoles:      ['studios_manager', 'admin', 'super_admin', 'platform_director_ops'],
  portalRoles:       ['content_creator', 'studios_manager', 'admin', 'super_admin'],
  serviceTypeOptions: [
    { value: 'ugc_ads',           label: 'UGC Ads' },
    { value: 'content_creation',  label: 'Content Creation (Reels)' },
    { value: 'podcast',           label: 'Podcast Feature' },
    { value: 'videography',       label: 'Videography' },
    { value: 'photography',       label: 'Photography' },
  ],
  // Customer checkout wizard config (DeptOrderWizard). UGC Ads keeps its own
  // dedicated flow at /ugc-ads (multi-tier packages, live & unaffected) — this
  // powers the *other* 4 Studios services, which are single-priced via
  // ServiceRate. tx_ref prefix + payment_type reuse the existing 'ugc'
  // handling in the Paychangu edge functions (they only care about the
  // UgcOrder row, not which service_type it is).
  // 'ugc_ads' included here so past/active UGC orders show up in the same
  // "My Orders" history as the other 4 Studios services — one unified view
  // per department. It's excluded from the ServiceRate-driven "new order"
  // tile grid below (no ServiceRate row exists for it); instead
  // externalServiceLink surfaces it as its own tile that deep-links to the
  // dedicated /ugc-ads package wizard (multi-tier packages, untouched).
  orderableServiceTypes: ['ugc_ads', 'content_creation', 'podcast', 'videography', 'photography'],
  externalServiceLink: {
    label: 'UGC Ad Creatives',
    description: 'Starter, Growth & Brand Campaign packages — book via our dedicated UGC flow.',
    to: '/ugc-ads',
  },
  txRefPrefix:     'UGC',
  paymentType:     'ugc',
  briefFields: [
    { key: 'brand_name',           label: 'Brand / Business Name',           type: 'text',     required: true,  placeholder: "e.g. Chisomo's Boutique" },
    { key: 'product_service',      label: 'What are we creating this for?',  type: 'text',     required: true,  placeholder: 'e.g. Product launch, weekly episode, event coverage' },
    { key: 'target_audience',      label: 'Target Audience',                 type: 'text',     required: false, placeholder: 'e.g. Women 18-35 in Malawi' },
    { key: 'key_messages',         label: 'Project Details',                 type: 'textarea', required: true,  placeholder: 'Tell us what you need, the vibe, and any must-haves.' },
    { key: 'reference_links',      label: 'Reference / Inspiration Links',   type: 'text',     required: false, placeholder: 'https://...' },
    { key: 'special_requirements', label: 'Special Requirements',            type: 'textarea', required: false, placeholder: "Any specific dos/don'ts, locations, dates, props?" },
  ],
};

export const DEVSTUDIO_CONFIG = {
  entityName:      'DevStudioOrder',
  department:      'dev_studio',
  title:           'Dev Studio',
  brandField:      'project_name',
  assigneeIdField:   'assigned_developer_id',
  assigneeNameField: 'assigned_developer_name',
  assigneeRole:      'developer',
  assigneeRoleLabel: 'Developer',
  managerRoles:      ['devstudio_manager', 'admin', 'super_admin', 'platform_director_ops'],
  portalRoles:       ['developer', 'devstudio_manager', 'admin', 'super_admin'],
  serviceTypeOptions: [
    { value: 'website',    label: 'Website' },
    { value: 'app',        label: 'App' },
    { value: 'automation', label: 'Automation' },
    { value: 'ai_agent',   label: 'AI Agent' },
  ],
  orderableServiceTypes: ['website', 'app', 'automation', 'ai_agent'],
  txRefPrefix:     'DEVSTUDIO',
  paymentType:     'devstudio',
  briefFields: [
    { key: 'project_name',         label: 'Project Name',              type: 'text',     required: true,  placeholder: 'e.g. Brandfletch Client Portal' },
    { key: 'project_goal',         label: 'What problem are we solving?', type: 'textarea', required: true,  placeholder: 'What should this project achieve?' },
    { key: 'target_audience',      label: 'Who is it for?',            type: 'text',     required: false, placeholder: 'e.g. Internal staff, public customers' },
    { key: 'key_features',         label: 'Key Features / Requirements', type: 'textarea', required: true,  placeholder: 'List the must-have features or pages.' },
    { key: 'reference_links',      label: 'Reference Sites / Apps',    type: 'text',     required: false, placeholder: 'https://...' },
    { key: 'special_requirements', label: 'Special Requirements',      type: 'textarea', required: false, placeholder: 'Integrations, deadlines, tech preferences?' },
  ],
};
