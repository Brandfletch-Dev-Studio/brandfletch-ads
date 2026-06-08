/**
 * RBAC Permission System — Brandfletch Media
 *
 * Roles (in order of authority):
 *   super_admin       → Full unrestricted access
 *   admin             → Alias for super_admin (legacy / platform default)
 *   ads_manager       → Main operational administrator
 *   campaign_manager  → Campaign delivery & execution
 *   finance           → Payments & financial operations
 *   sales_manager     → Lead gen & sales pipeline
 *   designer          → Assigned design work, no admin access beyond own queue
 *   user              → Client (no admin access)
 */

export const STAFF_ROLES = [
  'super_admin', 'admin', 'ads_manager', 'campaign_manager',
  'finance', 'sales_manager', 'designer',
];

export const ROLE_LABELS = {
  super_admin:      'Super Admin',
  admin:            'Super Admin',
  ads_manager:      'Ads Manager',
  campaign_manager: 'Campaign Manager',
  finance:          'Finance',
  sales_manager:    'Sales Manager',
  designer:         'Designer',
  user:             'Client',
};

export const ROLE_COLORS = {
  super_admin:      'bg-purple-100 text-purple-700',
  admin:            'bg-purple-100 text-purple-700',
  ads_manager:      'bg-blue-100 text-blue-700',
  campaign_manager: 'bg-sky-100 text-sky-700',
  finance:          'bg-green-100 text-green-700',
  sales_manager:    'bg-amber-100 text-amber-700',
  designer:         'bg-pink-100 text-pink-700',
  user:             'bg-gray-100 text-gray-600',
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
    'designs.view', 'designs.manage',
    'leads.view',
    'support.view',
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

  finance: [
    'clients.view',
    'campaigns.view',
    'reports.view', 'reports.generate', 'reports.export',
    'payments.view', 'payments.manage',
    'settings.view',
    'pricing.view', 'pricing.edit',
    'designs.view',
    'support.view',
  ],

  sales_manager: [
    'clients.view', 'clients.create', 'clients.edit',
    'campaigns.view',
    'reports.view',
    'messages.view', 'messages.send',
    'leads.view', 'leads.manage',
    'designs.view',
    'support.view',
  ],

  // Designer: sees only their own assigned design queue via DesignerPortal
  // No access to campaigns, payments, users, or admin-wide views
  designer: [
    'designs.view',
    'designs.work', // custom perm — marks ability to update assigned designs
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
  if (role === 'designer') return ['designer_portal'];
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
  };
  return [
    ...always,
    ...Object.entries(map)
      .filter(([, perm]) => hasPermission(role, perm))
      .map(([key]) => key),
  ];
}
