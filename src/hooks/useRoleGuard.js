import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { hasPermission, isStaffRole } from '@/lib/permissions';

/**
 * Redirects away if the current user's role is not in `allowedRoles`,
 * OR if `requiredPermission` is provided and the user lacks it.
 *
 * Bug fixes:
 *  1. roleOk check had broken operator precedence:
 *     `allowedRoles.includes('admin') && user.role === 'super_admin'` evaluated BEFORE `||`
 *     causing super_admin to only pass if 'admin' was in allowedRoles AND role === 'super_admin'.
 *     Fixed by wrapping in parens.
 *  2. Non-staff users (role='user') hitting admin routes now redirect to /dashboard, not /admin.
 *  3. Redirect waits for auth to fully settle before firing.
 */
export function useRoleGuard(allowedRoles, requiredPermission) {
  const { user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  const roleOk = allowedRoles
    ? (user && (
        allowedRoles.includes(user.role) ||
        (allowedRoles.includes('admin') && user.role === 'super_admin')
      ))
    : true;

  const permOk = requiredPermission
    ? hasPermission(user?.role, requiredPermission)
    : true;

  const allowed = !!(roleOk && permOk);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!user) return; // still loading or not authed — App.jsx handles auth redirect
    if (!allowed) {
      // Staff go back to admin overview; clients go to their dashboard
      const fallback = isStaffRole(user.role) ? '/admin' : '/dashboard';
      navigate(fallback, { replace: true });
    }
  }, [user?.role, isLoadingAuth, allowed]);

  return { allowed: !isLoadingAuth && !!user && allowed };
}
