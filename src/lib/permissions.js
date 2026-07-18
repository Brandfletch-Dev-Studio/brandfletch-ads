/**
 * RBAC Permission System — Brandfletch Ads
 *
 * Simplified to ads-only after removing designs, studios, dev studio, leads,
 * portfolio, UGC, and pricing modules.
 */

// ── Department registry — single source of truth ────────────────────────────
export const DEPARTMENTS = {
  ads: {
    label: 'Ads',
    ns: 'campaigns',
    dashboardPath: '/ads-manager',
    adminPath: '/admin/campaigns',
    portalPath: null,
    roles: { manager: 'ads_manager', sales: 'ads_sales', finance: 'ads_finance', operations: 'campaign_manager' },
    operationsLabel: 'Campaign Manager',
  },
};

export const PLATFORM_ROLES = ['super_admin', 'admin', 'platform_sales', 'platform_finance', 'platform_director_ops'];

const ALL_NS = Object.values(DEPARTMENTS).map(d => d.ns);

export const STAFF_ROLES = [
  ...PLATFORM_ROLES,
  ...Object.values(DEPARTMENTS).flatMap(d => Object.values(d.roles)),
];

export const ROLE_LABELS = {
  super_admin:            'CEO',
  admin:                  'CEO',
  platform_sales:         'Platform Sales',
  platform_finance:       'Platform Finance',
  platform_director_ops:  'Director of Operations',

  ads_manager:            'Ads Manager',
  ads_sales:              'Ads Sales',
  ads_finance:            'Ads Finance',
  campaign_manager:       'Campaign Manager',

  user:                  'Client',
};

export const ROLE_COLORS = {
  super_admin:           'bg-purple-100 text-purple-700',
  admin:                 'bg-purple-100 text-purple-700',
  platform_sales:        'bg-purple-100 text-purple-700',
  platform_finance:      'bg-purple-100 text-purple-700',
  platform_director_ops: 'bg-purple-100 text-purple-700',

  ads_manager:           'bg-blue-100 text-blue-700',
  ads_sales:             'bg-blue-50 text-blue-600',
  ads_finance:           'bg-blue-50 text-blue-600',
  campaign_manager:      'bg-sky-100 text-sky-700',

  user:                  'bg-gray-100 text-gray-600',
};

// Legacy export kept for anything still reading a flat dept→roles map.
export const ROLE_DEPARTMENTS = Object.fromEntries(
  Object.entries(DEPARTMENTS).map(([key, d]) => [key, { label: d.label + ' Department', roles: Object.values(d.roles) }])
);

// ── Permission templates per role slot ────────────────────────────────────────
const commonSalesPerms = (ns) => [
  `${ns}.view`,
  'clients.view', 'clients.create', 'clients.edit',
  'reports.view',
  'messages.view', 'messages.send',
  'support.view',
];

const commonFinancePerms = (ns) => [
  `${ns}.view`,
  `${ns}.pricing`,
  'payments.view', 'payments.manage',
  'reports.view', 'reports.generate', 'reports.export',
  'settings.view',
  'clients.view',
];

const commonManagerPerms = (ns) => [
  `${ns}.view`, `${ns}.manage`, `${ns}.work`,
  `${ns}.pricing`, `${ns}.team`,
  'clients.view', 'clients.create', 'clients.edit',
  'users.view',
  'payments.view',
  'reports.view', 'reports.generate', 'reports.export',
  'settings.view',
  'messages.view', 'messages.send',
  'notifications.view', 'notifications.send',
  'support.view', 'support.manage',
];

const ROLE_PERMISSIONS = {
  super_admin: [
    'clients.view', 'clients.create', 'clients.edit', 'clients.delete',
    'campaigns.view', 'campaigns.create', 'campaigns.edit', 'campaigns.manage', 'campaigns.delete', 'campaigns.work', 'campaigns.pricing', 'campaigns.team',
    'users.view', 'users.create', 'users.edit', 'users.delete', 'users.assign_roles',
    'reports.view', 'reports.generate', 'reports.export',
    'settings.view', 'settings.edit',
    'payments.view', 'payments.manage',
    'messages.view', 'messages.send',
    'notifications.view', 'notifications.send',
    'audit_log.view',
    'ads.view', 'ads.manage',
    'pages.view', 'pages.manage',
    'support.view', 'support.manage',
    'referrals.view',
  ],

  platform_sales: [
    ...new Set(ALL_NS.flatMap(ns => commonSalesPerms(ns))),
  ],
  platform_finance: [
    ...new Set(ALL_NS.flatMap(ns => commonFinancePerms(ns))),
  ],
  platform_director_ops: [
    ...new Set([
      ...ALL_NS.flatMap(ns => [`${ns}.view`, `${ns}.manage`, `${ns}.work`, `${ns}.team`]),
      'clients.view', 'clients.create', 'clients.edit',
      'users.view',
      'reports.view', 'reports.generate', 'reports.export',
      'messages.view', 'messages.send',
      'notifications.view', 'notifications.send',
      'audit_log.view',
      'support.view', 'support.manage',
    ]),
  ],

  ads_manager: [
    'clients.view', 'clients.create', 'clients.edit',
    'campaigns.view', 'campaigns.create', 'campaigns.edit', 'campaigns.manage', 'campaigns.pricing', 'campaigns.team',
    'users.view',
    'reports.view', 'reports.generate', 'reports.export',
    'settings.view',
    'payments.view',
    'messages.view', 'messages.send',
    'notifications.view', 'notifications.send',
    'audit_log.view',
    'ads.view',
    'pages.view', 'pages.manage',
    'support.view',
    'referrals.view',
  ],
  campaign_manager: [
    'clients.view',
    'campaigns.view', 'campaigns.create', 'campaigns.edit', 'campaigns.manage', 'campaigns.work',
    'reports.view',
    'messages.view', 'messages.send',
    'notifications.view',
    'pages.view', 'pages.manage',
    'support.view',
  ],
  ads_sales:   commonSalesPerms('campaigns'),
  ads_finance: commonFinancePerms('campaigns'),
};

// admin is an alias for super_admin
ROLE_PERMISSIONS.admin = ROLE_PERMISSIONS.super_admin;

export function hasPermission(role, permission) {
  if (!role) return false;
  const effectiveRole = role === 'admin' ? 'super_admin' : role;
  const perms = ROLE_PERMISSIONS[effectiveRole];
  if (!perms) return false;
  return perms.includes(permission);
}

export function isStaffRole(role) {
  return STAFF_ROLES.includes(role);
}

/** Which department (key into DEPARTMENTS) a role belongs to, or null for platform/client roles. */
export function getDepartmentForRole(role) {
  for (const [key, dept] of Object.entries(DEPARTMENTS)) {
    if (Object.values(dept.roles).includes(role)) return key;
  }
  return null;
}

/** Is this role the "operations" (hands-on production) slot for its department? */
export function isOperationsRole(role) {
  return Object.values(DEPARTMENTS).some(d => d.roles.operations === role);
}

/** Is this role a department Manager (gets a personal department dashboard)? */
export function isDepartmentManagerRole(role) {
  return Object.values(DEPARTMENTS).some(d => d.roles.manager === role);
}

/**
 * Returns which admin nav keys a role is allowed to see.
 */
export function getAllowedAdminNavKeys(role) {
  const always = ['overview'];
  const permMap = {
    campaigns:     'campaigns.view',
    pages:         'pages.view',
    users:         'users.view',
    payments:      'payments.view',
    notifications: 'notifications.view',
    ads:           'ads.view',
    reports:       'reports.view',
    audit_log:     'audit_log.view',
    support:       'support.view',
    referrals:     'referrals.view',
    settings:      'settings.view',
  };

  return [
    ...always,
    ...Object.entries(permMap)
      .filter(([, perm]) => hasPermission(role, perm))
      .map(([key]) => key),
  ];
}
