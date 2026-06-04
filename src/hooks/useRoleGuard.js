import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { hasPermission } from '@/lib/permissions';

/**
 * Redirects away if the current user's role is not in `allowedRoles`,
 * OR if `requiredPermission` is provided and the user lacks it.
 *
 * Usage:
 *   useRoleGuard(['admin', 'ads_manager'])
 *   useRoleGuard(null, 'users.view')
 */
export function useRoleGuard(allowedRoles, requiredPermission) {
  const { user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  const roleOk = allowedRoles
    ? (user && (allowedRoles.includes(user.role) || allowedRoles.includes('admin') && user.role === 'super_admin'))
    : true;
  const permOk = requiredPermission
    ? hasPermission(user?.role, requiredPermission)
    : true;
  const allowed = !!(roleOk && permOk);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!allowed) {
      navigate('/admin', { replace: true });
    }
  }, [user, isLoadingAuth, allowed]);

  if (isLoadingAuth || !user) return { allowed: false };
  return { allowed };
}