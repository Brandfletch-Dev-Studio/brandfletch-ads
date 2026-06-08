/**
 * RBAC Permission System — Brandfletch Media
 *
 * Role Hierarchy:
 *
 *  ┌─ Super Admin ──────────────────────────────────────────┐
 *  │                                                         │
 *  │  ADS DEPARTMENT            DESIGN DEPARTMENT           │
 *  │  ├─ Ads Manager            ├─ Creative Ops Director     │
 *  │  │  └─ Campaign Manager    │  ├─ Designer               │
 *  │  └─ Sales Manager          │  ├─ Sales Manager          │
 *  │     └─ Finance             │  └─ Finance                │
 *  └─────────────────────────────────────────────────────────┘
 *
 *  Note: Sales Manager and Finance serve both departments.
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

// Department groupings for hierarchy display
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
    'quotes.view',
  ],

  // ADS DEPARTMENT ──────────────────────────────────────────────
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
    'quotes.view',
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

  // DESIGN DEPARTMENT ───────────────────────────────────────────
  // Creative Ops Director: head of the Design department
  // Manages all designers, approves design work, sees financials for design
  // Creative Ops Director — Design department head.
  // Can: run own design work, manage design team, see design-specific revenue + pricing + quotes
  // Cannot: campaigns, ads, leads, referrals, platform settings, general pricing, general payments
  creative_ops_director: [
    'designs.view', 'designs.manage', 'designs.work',
    'designs.revenue',   // design-specific payment records
    'designs.pricing',   // manage design pricing only
    'designs.team',      // manage designers under them
    'clients.view',      // see clients who have design requests
    'users.view',        // see team members (filtered to design dept in UI)
    'reports.view', 'reports.generate',
    'messages.view', 'messages.send',
    'notifications.view', 'notifications.send',
    'support.view', 'support.manage',
    'quotes.view',       // see design quotes
  ],

  // Designer: assigned design work only — no admin access beyond own queue
  designer: [
    'designs.view',
    'designs.work',
  ],

  // SHARED ROLES ────────────────────────────────────────────────
  finance: [
    'clients.view',
    'campaigns.view',
    'designs.view',
    'reports.view', 'reports.generate', 'reports.export',
    'payments.view', 'payments.manage',
    'settings.view',
    'pricing.view', 'pricing.edit',
    'support.view',
    'quotes.view',
  ],

  sales_manager: [
    'clients.view', 'clients.create', 'clients.edit',
    'campaigns.view',
    'designs.view',
    'reports.view',
    'messages.view', 'messages.send',
    'leads.view', 'leads.manage',
    'support.view',
    'quotes.view',
  ],
};

ROLE_PERMISSIONS.admin = ROLE_PERMISSIONS.super_admin;

export function hasPermission(role, permission) {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes(permission);
}

export function isStaffRole(role) {
  return STAFF_ROLES.includes(role);
}

export function getAllowedAdminNavKeys(role) {
  // Designer — dedicated portal only
  if (role === 'designer') return ['designer_portal'];

  // Creative Ops Director — design department head
  // Only sees design-relevant nav: no campaigns, no ads, no referrals, no platform settings
  if (role === 'creative_ops_director') return [
    'overview',    // dashboard overview
    'designs',     // design requests management
    'users',       // team management (filtered to designers in UI)
    'payments',    // design revenue only (filtered in UI by service_type)
    'reports',     // design performance reports
    'support',     // client support for design issues
    'quotes',      // design service quotes
  ];

  const always = ['overview'];
  const map = {
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
    quotes:        'quotes.view',
  };
  return [
    ...always,
    ...Object.entries(map)
      .filter(([, perm]) => hasPermission(role, perm))
      .map(([key]) => key),
  ];
}
