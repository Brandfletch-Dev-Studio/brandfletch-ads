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
};
