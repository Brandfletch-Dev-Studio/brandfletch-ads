import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

const ACTION_COLORS = {
  campaign_approved: 'bg-green-100 text-green-700',
  campaign_rejected: 'bg-red-100 text-red-700',
  campaign_set_active: 'bg-blue-100 text-blue-700',
  campaign_paused: 'bg-amber-100 text-amber-700',
  campaign_completed: 'bg-purple-100 text-purple-700',
  payment_confirmed: 'bg-green-100 text-green-700',
  payment_rejected: 'bg-red-100 text-red-700',
  page_approved: 'bg-green-100 text-green-700',
  page_rejected: 'bg-red-100 text-red-700',
  user_role_changed: 'bg-purple-100 text-purple-700',
  ad_created: 'bg-blue-100 text-blue-700',
  ad_updated: 'bg-blue-100 text-blue-700',
  ad_deleted: 'bg-red-100 text-red-700',
};

export default function AdminAuditLog() {
  const { allowed } = useRoleGuard(null, 'audit_log.view');
  const [search, setSearch] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => base44.entities.AuditLog.list({ sort: '-created_date', limit: 200 }),
    enabled: allowed,
  });

  const filtered = logs.filter(l =>
    !search ||
    l.actor_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.details?.toLowerCase().includes(search.toLowerCase())
  );

  if (!allowed) return null;

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-[hsl(var(--primary))]" />
        <div>
          <h1 className="text-2xl font-bold font-heading">Audit Log</h1>
          <p className="text-sm text-muted-foreground mt-0.5">All staff actions recorded for accountability</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, action, or details..." className="pl-9" />
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-14 rounded-xl bg-secondary animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No audit log entries found</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(log => (
            <Card key={log.id} className="shadow-sm">
              <CardContent className="p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ACTION_COLORS[log.action] || 'bg-secondary text-muted-foreground'}`}>
                      {log.action?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-medium">{log.actor_name}</span>
                    <Badge variant="outline" className="text-xs capitalize">{log.actor_role?.replace('_', ' ')}</Badge>
                  </div>
                  {log.details && <p className="text-sm text-muted-foreground mt-1">{log.details}</p>}
                  <p className="text-xs text-muted-foreground mt-1 font-mono">{log.entity_type} · {log.entity_id?.slice(0, 12)}...</p>
                </div>
                <p className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                  {log.created_date ? format(new Date(log.created_date), 'MMM d, HH:mm') : ''}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}