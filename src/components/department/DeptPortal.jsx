// Generic "my assigned work" portal for a department's production/Operations
// role (content_creator, developer) — mirrors the pre-existing Designer
// Portal pattern. Used by StudioPortal.jsx and DevPortal.jsx.
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';
import { STATUS_OPTIONS, STATUS_COLORS } from '@/lib/departmentOrderConfigs';

const PORTAL_STATUS_OPTIONS = STATUS_OPTIONS.filter(s => ['awaiting_brief', 'in_production', 'review', 'completed'].includes(s.value));

export default function DeptPortal({ config }) {
  useRoleGuard(config.portalRoles);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);

  const isProductionStaff = user?.role === config.assigneeRole;

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['deptPortalOrders', config.entityName, user?.id, isProductionStaff],
    queryFn: () => isProductionStaff
      ? base44.entities[config.entityName].filter({ [config.assigneeIdField]: user?.id }, { sort: '-created_date' })
      : base44.entities[config.entityName].list({ sort: '-created_date', limit: 200 }),
    enabled: !!user?.id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities[config.entityName].update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deptPortalOrders'] });
      toast.success('Updated');
    },
    onError: () => toast.error('Update failed'),
  });

  if (selected) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={() => setSelected(null)}>
          <ArrowLeft className="w-4 h-4" /> Back to My Projects
        </Button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold">{selected.order_ref}</h1>
            <p className="text-sm text-muted-foreground">{selected[config.brandField] || selected.user_name}</p>
          </div>
          <Badge className={cn('text-xs px-2.5', STATUS_COLORS[selected.status])}>
            {STATUS_OPTIONS.find(s => s.value === selected.status)?.label || selected.status}
          </Badge>
        </div>

        <Card>
          <CardContent className="py-5 space-y-3 text-sm">
            {(selected.key_features || selected.key_messages) && (
              <div>
                <Label className="text-xs text-muted-foreground">Brief</Label>
                <p className="mt-1 whitespace-pre-wrap">{selected.key_features || selected.key_messages}</p>
              </div>
            )}
            {selected.reference_links && (
              <div><Label className="text-xs text-muted-foreground">Reference Links</Label><p className="mt-1">{selected.reference_links}</p></div>
            )}
            {selected.special_requirements && (
              <div><Label className="text-xs text-muted-foreground">Special Requirements</Label><p className="mt-1">{selected.special_requirements}</p></div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-5 space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Update Status</Label>
              <Select
                value={selected.status}
                onValueChange={(val) => {
                  updateMutation.mutate({ id: selected.id, data: { status: val } });
                  setSelected(prev => ({ ...prev, status: val }));
                }}
              >
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{PORTAL_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Deliverables URL</Label>
              <Input
                defaultValue={selected.deliverables_url || ''}
                placeholder="https://…"
                className="h-9 text-sm"
                onBlur={(e) => updateMutation.mutate({ id: selected.id, data: { deliverables_url: e.target.value } })}
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Notes for client / admin</Label>
              <Textarea
                defaultValue={selected.revision_notes || ''}
                rows={3}
                className="text-sm"
                onBlur={(e) => updateMutation.mutate({ id: selected.id, data: { revision_notes: e.target.value } })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-[hsl(var(--accent))]" /> My Projects
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{config.title} — everything currently assigned to you</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" /> <span className="text-sm">Loading…</span>
        </div>
      ) : orders.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground text-sm">Nothing assigned to you yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {orders.map(o => (
            <Card key={o.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setSelected(o)}>
              <CardContent className="py-3.5 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{o.order_ref}</span>
                    <Badge className={cn('text-[10px] px-2', STATUS_COLORS[o.status])}>
                      {STATUS_OPTIONS.find(s => s.value === o.status)?.label || o.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{o[config.brandField] || '—'} · {o.user_name || o.user_email}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
