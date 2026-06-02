import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';

/**
 * Returns a `log(action, entityType, entityId, details, meta?)` function.
 * Fire-and-forget — never throws.
 */
export function useAuditLog() {
  const { user } = useAuth();

  return function log(action, entityType, entityId, details = '', meta = {}) {
    if (!user?.id) return;
    base44.entities.AuditLog.create({
      actor_id: user.id,
      actor_name: user.full_name || user.email,
      actor_role: user.role,
      action,
      entity_type: entityType,
      entity_id: String(entityId),
      details,
      meta,
    }).catch(() => {});
  };
}