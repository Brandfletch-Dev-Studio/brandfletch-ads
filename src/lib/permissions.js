/**
 * RBAC Permission System — Brandfletch Media
 *
 * ── Structure ─────────────────────────────────────────────────────────────
 *
 *  Brandfletch Media Platform Team (cross-department, sits above everything)
 *  ├─ CEO                    (role: super_admin / admin) — full control everywhere
 *  ├─ Platform Sales         (role: platform_sales)      — sales across ALL depts
 *  ├─ Platform Finance       (role: platform_finance)     — finance across ALL depts
 *  └─ Director of Operations (role: platform_director_ops) — ops across ALL depts
 *
 *  Each of the 4 departments below is its own "office": a dashboard, an admin
 *  area, and exactly 4 role slots. A staff member belongs to AT MOST ONE
 *  department. Same role slot in the same department = same access (role-based,
 *  not per-person), unless a page explicitly says otherwise.
 *
 *  ┌─ Ads (/ads) ────────────────────┐  ┌─ Designs (/designs) ────────────┐
 *  │ Manager     → ads_manager       │  │ Manager     → creative_ops_dir. │
 *  │ Sales       → ads_sales         │  │ Sales       → designs_sales     │
 *  │ Finance     → ads_finance       │  │ Finance     → designs_finance   │
 *  │ Operations  → campaign_manager  │  │ Operations  → designer          │
 *  └──────────────────────────────────┘  └──────────────────────────────────┘
 *
 *  ┌─ Studios (/studios) ────────────┐  ┌─ Dev Studio (/dev-studio) ──────┐
 *  │ Manager     → studios_manager   │  │ Manager     → devstudio_manager │
 *  │ Sales       → studios_sales     │  │ Sales       → devstudio_sales   │
 *  │ Finance     → studios_finance   │  │ Finance     → devstudio_finance │
 *  │ Operations  → content_creator   │  │ Operations  → developer         │
 *  └──────────────────────────────────┘  └──────────────────────────────────┘
 *
 *  Notes:
 *  - "Operations" roles (designer, campaign_manager, content_creator, developer)
 *    are hands-on production roles. designer/content_creator/developer use a
 *    dedicated portal only (no admin dashboard) — mirrors the existing Designer
 *    Portal pattern. campaign_manager keeps its existing broader admin access
 *    (unchanged from before this restructure) since that was already live.
 *  - Manager roles get a personal department dashboard ("their office") plus
 *    admin access scoped to their department.
 *  - Sales/Finance roles use the filtered /admin/{dept} area, scoped to their
 *    department only.
 *  - Platform-level Sales/Finance/Director of Ops can take the same actions
 *    as a department's own Sales/Finance/Manager, just across all 4 departments
 *    at once (not just view — real action rights, per Arthur's confirmation).
 */

// ── Department registry — single source of truth ────────────────────────────
// ns = permission namespace prefix used for this department's own work items.
export const DEPARTMENTS = {
  ads: {
    label: 'Ads',
    ns: 'campaigns', // pre-existing namespace, kept as-is (unrelated to 'ads.*' which is the separate "In-App Ads" admin feature)
    dashboardPath: '/ads-manager',
    adminPath: '/admin/campaigns',
    portalPath: null, // campaign_manager uses admin access, not a separate portal
    roles: { manager: 'ads_manager', sales: 'ads_sales', finance: 'ads_finance', operations: 'campaign_manager' },
    operationsLabel: 'Campaign Manager',
  },
  designs: {
    label: 'Designs',
    ns: 'designs',
    dashboardPath: '/creative-ops',
    adminPath: '/admin/designs',
    portalPath: '/designer',
    roles: { manager: 'creative_ops_director', sales: 'designs_sales', finance: 'designs_finance', operations: 'designer' },
    operationsLabel: 'Designer',
  },
  studios: {
    label: 'Studios',
    ns: 'studios',
    dashboardPath: '/studios-manager',
    adminPath: '/admin/studios',
    portalPath: '/studio-portal',
    roles: { manager: 'studios_manager', sales: 'studios_sales', finance: 'studios_finance', operations: 'content_creator' },
    operationsLabel: 'Content Creator',
  },
  dev_studio: {
    label: 'Dev Studio',
    ns: 'devstudio',
    dashboardPath: '/devstudio-manager',
    adminPath: '/admin/dev-studio',
    portalPath: '/dev-portal',
    roles: { manager: 'devstudio_manager', sales: 'devstudio_sales', finance: 'devstudio_finance', operations: 'developer' },
    operationsLabel: 'Developer',
  },
};

export const PLATFORM_ROLES = ['super_admin', 'admin', 'platform_sales', 'platform_finance', 'platform_director_ops'];

// Every namespace across all departments, e.g. ['campaigns','designs','studios','devstudio']
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

  creative_ops_director: 'Creative Ops Director',
  designs_sales:         'Designs Sales',
  designs_finance:       'Designs Finance',
  designer:              'Designer',

  studios_manager:       'Studio Manager',
  studios_sales:         'Studios Sales',
  studios_finance:       'Studios Finance',
  content_creator:       'Content Creator',

  devstudio_manager:     'Dev Studio Manager',
  devstudio_sales:       'Dev Studio Sales',
  devstudio_finance:     'Dev Studio Finance',
  developer:             'Developer',

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

  creative_ops_director: 'bg-pink-100 text-pink-700',
  designs_sales:         'bg-pink-50 text-pink-600',
  designs_finance:       'bg-pink-50 text-pink-600',
  designer:              'bg-rose-100 text-rose-700',

  studios_manager:       'bg-amber-100 text-amber-700',
  studios_sales:         'bg-amber-50 text-amber-600',
  studios_finance:       'bg-amber-50 text-amber-600',
  content_creator:       'bg-orange-100 text-orange-700',

  devstudio_manager:     'bg-emerald-100 text-emerald-700',
  devstudio_sales:       'bg-emerald-50 text-emerald-600',
  devstudio_finance:     'bg-emerald-50 text-emerald-600',
  developer:             'bg-green-100 text-green-700',

  user:                  'bg-gray-100 text-gray-600',
};

// Legacy export kept for anything still reading a flat dept→roles map.
export const ROLE_DEPARTMENTS = Object.fromEntries(
  Object.entries(DEPARTMENTS).map(([key, d]) => [key, { label: d.label + ' Department', roles: Object.values(d.roles) }])
);

// ── Permission templates per role slot, applied per department namespace ────
const commonSalesPerms = (ns) => [
  `${ns}.view`,
  'clients.view', 'clients.create', 'clients.edit',
  'leads.view', 'leads.manage',
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
  'leads.view',
];

const ROLE_PERMISSIONS = {
  // ── CEO — full access everywhere ─────────────────────────────────────────
  super_admin: [
    'clients.view', 'clients.create', 'clients.edit', 'clients.delete',
    'campaigns.view', 'campaigns.create', 'campaigns.edit', 'campaigns.manage', 'campaigns.delete', 'campaigns.work', 'campaigns.pricing', 'campaigns.team',
    'designs.view', 'designs.manage', 'designs.work', 'designs.revenue', 'designs.pricing', 'designs.team',
    'studios.view', 'studios.manage', 'studios.work', 'studios.pricing', 'studios.team',
    'devstudio.view', 'devstudio.manage', 'devstudio.work', 'devstudio.pricing', 'devstudio.team',
    'users.view', 'users.create', 'users.edit', 'users.delete', 'users.assign_roles',
    'reports.view', 'reports.generate', 'reports.export',
    'settings.view', 'settings.edit',
    'payments.view', 'payments.manage',
    'messages.view', 'messages.send',
    'notifications.view', 'notifications.send',
    'audit_log.view',
    'ads.view', 'ads.manage', // "In-App Ads" admin feature, distinct from the Ads department
    'pricing.view', 'pricing.edit',
    'pages.view', 'pages.manage',
    'leads.view', 'leads.manage',
    'support.view', 'support.manage',
    'referrals.view',
  ],

  // ── Platform team (cross-department) ─────────────────────────────────────
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
      'leads.view',
    ]),
  ],

  // ── Ads department ────────────────────────────────────────────────────────
  // ads_manager / campaign_manager kept exactly as before this restructure.
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
    'pricing.view',
    'pages.view', 'pages.manage',
    'designs.view',
    'leads.view',
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
    'designs.view',
    'leads.view',
    'support.view',
  ],
  ads_sales:   commonSalesPerms('campaigns'),
  ads_finance: commonFinancePerms('campaigns'),

  // ── Designs department ───────────────────────────────────────────────────
  // creative_ops_director / designer kept exactly as before this restructure.
  creative_ops_director: [
    'designs.view', 'designs.manage', 'designs.work',
    'designs.revenue', 'designs.pricing', 'designs.team',
    'clients.view',
    'users.view',
    'payments.view',
    'reports.view', 'reports.generate',
    'messages.view', 'messages.send',
    'notifications.view', 'notifications.send',
    'support.view', 'support.manage',
  ],
  designer: [
    'designs.view',
    'designs.work',
  ],
  designs_sales:   commonSalesPerms('designs'),
  designs_finance: commonFinancePerms('designs'),

  // ── Studios department (new) ─────────────────────────────────────────────
  studios_manager: commonManagerPerms('studios'),
  content_creator: [
    'studios.view',
    'studios.work',
  ],
  studios_sales:   commonSalesPerms('studios'),
  studios_finance: commonFinancePerms('studios'),

  // ── Dev Studio department (new) ──────────────────────────────────────────
  devstudio_manager: commonManagerPerms('devstudio'),
  developer: [
    'devstudio.view',
    'devstudio.work',
  ],
  devstudio_sales:   commonSalesPerms('devstudio'),
  devstudio_finance: commonFinancePerms('devstudio'),
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

/** Which department (key into DEPARTMENTS) a role belongs to, or null for platform/client roles. */
export function getDepartmentForRole(role) {
  for (const [key, dept] of Object.entries(DEPARTMENTS)) {
    if (Object.values(dept.roles).includes(role)) return key;
  }
  return null;
}

/** Is this role the "operations" (hands-on production, portal-only) slot for its department? */
export function isOperationsRole(role) {
  return Object.values(DEPARTMENTS).some(d => d.roles.operations === role);
}

/** Is this role a department Manager (gets a personal department dashboard)? */
export function isDepartmentManagerRole(role) {
  return Object.values(DEPARTMENTS).some(d => d.roles.manager === role);
}

/**
 * Returns which admin nav keys a role is allowed to see.
 * Used by AppLayout to build the sidebar nav.
 *
 * designer / content_creator / developer → empty array (portal only)
 * creative_ops_director → design dept scoped nav (unchanged from before)
 * all others → derived from ROLE_PERMISSIONS
 */
export function getAllowedAdminNavKeys(role) {
  // Pure production/operations roles have no admin nav — portal only.
  if (role === 'designer' || role === 'content_creator' || role === 'developer') return [];

  // Creative Ops Director — design dept scoped nav (existing, unchanged)
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
    studios:       'studios.view',
    devstudio:     'devstudio.view',
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
