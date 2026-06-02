import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

/**
 * Redirects away if the current user's role is not in `allowedRoles`.
 * Usage: useRoleGuard(['admin', 'campaign_manager'])
 */
export function useRoleGuard(allowedRoles) {
  const { user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!user || !allowedRoles.includes(user.role)) {
      navigate('/admin', { replace: true });
    }
  }, [user, isLoadingAuth]);

  if (isLoadingAuth || !user) return { allowed: false };
  return { allowed: allowedRoles.includes(user.role) };
}