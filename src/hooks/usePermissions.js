import { useAuth } from '@/lib/AuthContext';
import { hasPermission, isStaffRole } from '@/lib/permissions';

/**
 * Returns helpers to check the current user's permissions.
 *
 * Usage:
 *   const { can, isStaff, role } = usePermissions();
 *   if (can('campaigns.manage')) { ... }
 */
export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role || 'user';

  return {
    role,
    isStaff: isStaffRole(role),
    isSuperAdmin: role === 'super_admin' || role === 'admin',
    can: (permission) => hasPermission(role, permission),
  };
}