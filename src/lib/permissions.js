/**
 * RBAC Permission System — Brandfletch Media
 *
 * Role Hierarchy:
 *
 *  ┌─ Super Admin ──────────────────────────────────────────────┐
 *  │                                                             │
 *  │  ADS DEPARTMENT              DESIGN DEPARTMENT             │
 *  │  ├─ Ads Manager              ├─ Creative Ops Director       │
 *  │  │  └─ Campaign Manager      │  └─ Designer                 │
 *  │  └─ Sales Manager            └─ (shared below)              │
 *  │     └─ Finance                                              │
 *  └─────────────────────────────────────────────────────────────┘
 *
 *  Notes:
 *  - Sales Manager and Finance serve both departments.
 *  - designer role has NO admin access — they use the Designer Portal only.
 *  - creative_ops_director has admin access scoped to design dept only.
 */

export const STAFF_ROLES = [
  'super_admin', 'admin',
  'ads_manager', 'campaign_manager',
  'creative_ops_director', 'designer',
  'sales_manager', 'finance',
];

export const ROLE_LABELS = {
  super_admin:             'Super Admin',
  admin:                   'Super Admin',
  ads_manager:             'Ads Manager',
  campaign_manager:        'Campaign Manager',
  creative_ops_director:   'Creative Ops Director',
  designer:                'Designer',
  sales_manager:           'Sales Manager',
  finance:                 'Finance',
  user:                    'Client',
};

export const ROLE_COLORS = {
  super_admin:           'bg-purple-100 text-purple-700',
  admin:                 'bg-purple-100 text-purple-700',
  ads_manager:           'bg-blue-100 text-blue-700',
  campaign_manager:      'bg-sky-100 text-sky-700',
  creative_ops_director: 'bg-pink-100 text-pink-700',
  designer:              'bg-rose-100 text-rose-700',
  sales_manager:         'bg-amber-100 text-amber-700',
  finance:               'bg-green-100 text-green-700',
  user:                  'bg-gray-100 text-gray-600',
};

export const ROLE_DEPARTMENTS = {
  ads: {
    label: 'Ads Department',
    color: 'bg-blue-50 border-blue-200',
    roles: ['ads_manager', 'campaign_manager'],
  },
  design: {
    label: 'Design Department',
    color: 'bg-pink-50 border-pink-200',
    roles: ['creative_ops_director', 'designer'],
  },
  shared: {
    label: 'Shared Roles',
    color: 'bg-amber-50 border-amber-200',
    roles: ['sales_manager', 'finance'],
  },
};

const ROLE_PERMISSIONS = {
  // ── SUPER ADMIN — full access ────────────────────────────────────────────
  super_admin: [
    'clients.view', 'clients.create', 'clients.edit', 'clients.delete',
    'campaigns.view', 'campaigns.create', 'campaigns.edit', 'campaigns.manage', 'campaigns.delete',
    'users.view', 'users.create', 'users.edit', 'users.delete', 'users.assign_roles',
    'reports.view', 'reports.generate', 'reports.export',
    'settings.view', 'settings.edit',
    'payments.view', 'payments.manage',
    'messages.view', 'messages.send',
    'notifications.view', 'notifications.send',
    'audit_log.view',
    'ads.view', 'ads.manage',
    'pricing.view', 'pricing.edit',
    'pages.view', 'pages.manage',
    'designs.view', 'designs.manage',
    'leads.view', 'leads.manage',
    'support.view', 'support.manage',
    'referrals.view',
  ],

  // ── ADS DEPARTMENT ────────────────────────────────────────────────────────
  ads_manager: [
    'clients.view', 'clients.create', 'clients.edit',
    'campaigns.view', 'campaigns.create', 'campaigns.edit', 'campaigns.manage',
    'users.view',
    'reports.view', 'reports.generate', 'reports.export',
    'settings.view',
    'payments.view',
    'messages.view', 'messages.send',
    'notifications.view', 'notifications.send',
    'audit_log.view',
    'ads.view',
    'pricing.view',
    'pages.view', 'pages.manage',
    'designs.view',
    'leads.view',
    'support.view',
    'referrals.view',
  ],

  campaign_manager: [
    'clients.view',
    'campaigns.view', 'campaigns.create', 'campaigns.edit', 'campaigns.manage',
    'reports.view',
    'messages.view', 'messages.send',
    'notifications.view',
    'pages.view', 'pages.manage',
    'designs.view',
    'leads.view',
    'support.view',
  ],

  // ── DESIGN DEPARTMENT ─────────────────────────────────────────────────────

  // Creative Ops Director — design dept head
  // Sees: design admin, design team users, design revenue/payments, reports, support
  // Does NOT see: campaigns, ads, referrals, audit log, platform settings
  creative_ops_director: [
    'designs.view', 'designs.manage', 'designs.work',
    'designs.revenue',
    'designs.pricing',
    'designs.team',
    'clients.view',
    'users.view',
    'payments.view',          // can see payments (scoped to design in UI)
    'reports.view', 'reports.generate',
    'messages.view', 'messages.send',
    'notifications.view', 'notifications.send',
    'support.view', 'support.manage',
  ],

  // Designer — NO admin access. Uses /designer portal only.
  // Only permissions needed to do their work via the portal.
  designer: [
    'designs.view',
    'designs.work',
  ],

  // ── SHARED ROLES ─────────────────────────────────────────────────────────
  finance: [
    'clients.view',
    'campaigns.view',
    'designs.view',
    'reports.view', 'reports.generate', 'reports.export',
    'payments.view', 'payments.manage',
    'settings.view',
    'pricing.view', 'pricing.edit',
    'support.view',
  ],

  sales_manager: [
    'clients.view', 'clients.create', 'clients.edit',
    'campaigns.view',
    'designs.view',
    'reports.view',
    'messages.view', 'messages.send',
    'leads.view', 'leads.manage',
    'support.view',
  ],
};

// admin is an alias for super_admin
ROLE_PERMISSIONS.admin = ROLE_PERMISSIONS.super_admin;

export function hasPermission(role, permission) {
  if (!role) return false;
  // 'admin' is a legacy alias for 'super_admin' — every other place in the
  // app (labels, colors, isSuperAdmin, invite form copy) already treats them
  // as identical, but ROLE_PERMISSIONS only ever defined 'super_admin'. That
  // gap meant any user with role 'admin' had ZERO working permissions.
  const effectiveRole = role === 'admin' ? 'super_admin' : role;
  const perms = ROLE_PERMISSIONS[effectiveRole];
  if (!perms) return false;
  return perms.includes(permission);
}

export function isStaffRole(role) {
  return STAFF_ROLES.includes(role);
}

/**
 * Returns which admin nav keys a role is allowed to see.
 * Used by AppLayout to build the sidebar nav.
 *
 * designer → empty array (they use /designer portal, not /admin)
 * creative_ops_director → design-scoped subset
 * all others → derived from ROLE_PERMISSIONS
 */
export function getAllowedAdminNavKeys(role) {
  // Designer has no admin nav — portal only
  if (role === 'designer') return [];

  // Creative Ops Director — design dept scoped nav
  if (role === 'creative_ops_director') return [
    'overview',
    'designs',
    'users',
    'payments',
    'reports',
    'support',
  ];

  const always = ['overview'];
  const permMap = {
    campaigns:     'campaigns.view',
    designs:       'designs.view',
    leads:         'leads.view',
    pages:         'pages.view',
    users:         'users.view',
    payments:      'payments.view',
    notifications: 'notifications.view',
    ads:           'ads.view',
    reports:       'reports.view',
    audit_log:     'audit_log.view',
    pricing:       'pricing.view',
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
