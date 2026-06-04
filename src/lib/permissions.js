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
 *   user              → Client (no admin access)
 */

export const STAFF_ROLES = ['super_admin', 'admin', 'ads_manager', 'campaign_manager', 'finance', 'sales_manager'];

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Super Admin',
  ads_manager: 'Ads Manager',
  campaign_manager: 'Campaign Manager',
  finance: 'Finance',
  sales_manager: 'Sales Manager',
  user: 'Client',
};

export const ROLE_COLORS = {
  super_admin: 'bg-purple-100 text-purple-700',
  admin: 'bg-purple-100 text-purple-700',
  ads_manager: 'bg-blue-100 text-blue-700',
  campaign_manager: 'bg-sky-100 text-sky-700',
  finance: 'bg-green-100 text-green-700',
  sales_manager: 'bg-amber-100 text-amber-700',
  user: 'bg-gray-100 text-gray-600',
};

/**
 * Permission definitions per role.
 * A permission absent from a role = denied.
 */
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
  ],

  campaign_manager: [
    'clients.view',
    'campaigns.view', 'campaigns.create', 'campaigns.edit', 'campaigns.manage',
    'reports.view',
    'messages.view', 'messages.send',
    'notifications.view',
    'pages.view', 'pages.manage',
  ],

  finance: [
    'clients.view',
    'campaigns.view',
    'reports.view', 'reports.generate', 'reports.export',
    'payments.view', 'payments.manage',
    'settings.view',
    'pricing.view', 'pricing.edit',
  ],

  sales_manager: [
    'clients.view', 'clients.create', 'clients.edit',
    'campaigns.view',
    'reports.view',
    'messages.view', 'messages.send',
  ],
};

// super_admin and admin are identical
ROLE_PERMISSIONS.admin = ROLE_PERMISSIONS.super_admin;

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role, permission) {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes(permission);
}

/**
 * Check if a role is a staff (admin-side) role.
 */
export function isStaffRole(role) {
  return STAFF_ROLES.includes(role);
}

/**
 * Get nav items visible to a role.
 * Returns keys — layout maps them to routes.
 */
export function getAllowedAdminNavKeys(role) {
  const always = ['overview'];
  const map = {
    campaigns:    'campaigns.view',
    pages:        'pages.view',
    users:        'users.view',
    payments:     'payments.view',
    notifications:'notifications.view',
    messages:     'messages.view',
    ads:          'ads.view',
    reports:      'reports.view',
    audit_log:    'audit_log.view',
    pricing:      'pricing.view',
    settings:     'settings.view',
  };
  return [
    ...always,
    ...Object.entries(map).filter(([, perm]) => hasPermission(role, perm)).map(([key]) => key),
  ];
}