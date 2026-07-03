// Generic personal "department office" dashboard for a Manager role.
// Used by StudiosManagerDashboard.jsx and DevStudioManagerDashboard.jsx.
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useAuth } from '@/lib/AuthContext';
import { Loader2, Package, AlertCircle, Play, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_OPTIONS, STATUS_COLORS } from '@/lib/departmentOrderConfigs';

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function DeptManagerDashboard({ config, adminPath }) {
  useRoleGuard(config.managerRoles);
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['deptManagerOrders', config.entityName],
    queryFn: () => base44.entities[config.entityName].list({ sort: '-created_date', limit: 200 }),
  });

  const { data: team = [] } = useQuery({
    queryKey: ['deptTeam', config.assigneeRole],
    queryFn: () => base44.entities.User.filter({ role: config.assigneeRole }),
  });

  const stats = {
    total:     orders.length,
    actionable: orders.filter(o => ['pending_payment', 'review', 'revision_requested'].includes(o.status)).length,
    active:    orders.filter(o => ['awaiting_brief', 'in_production'].includes(o.status)).length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  const queue = orders
    .filter(o => ['pending_payment', 'awaiting_brief', 'in_production', 'review', 'revision_requested'].includes(o.status))
    .slice(0, 8);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" /> <span className="text-sm">Loading your dashboard…</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{config.title} — My Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Welcome back, {user?.full_name || user?.email}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders',  value: stats.total,      icon: Package,      color: 'text-[hsl(var(--accent))]' },
          { label: 'Needs Action',  value: stats.actionable, icon: AlertCircle,  color: 'text-orange-600' },
          { label: 'In Production', value: stats.active,     icon: Play,         color: 'text-purple-600' },
          { label: 'Completed',     value: stats.completed,  icon: CheckCircle2, color: 'text-green-600' },
        ].map(s => (
          <Card key={s.label} className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate(adminPath)}>
            <CardContent className="py-4 flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-xl bg-current/10 flex items-center justify-center', s.color)}>
                <s.icon className={cn('w-5 h-5', s.color)} />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardContent className="py-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-foreground">Needs Your Attention</h2>
              <button onClick={() => navigate(adminPath)} className="text-xs text-primary flex items-center gap-1 hover:underline">
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {queue.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">All caught up — nothing needs action right now.</p>
            ) : (
              <div className="divide-y divide-border/50">
                {queue.map(o => (
                  <div key={o.id} className="py-2.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-accent/30 -mx-2 px-2 rounded"
                    onClick={() => navigate(adminPath)}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{o.order_ref} · {o[config.brandField] || o.user_name}</p>
                      <p className="text-xs text-muted-foreground">{o.user_name || o.user_email}</p>
                    </div>
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0', STATUS_COLORS[o.status])}>
                      {STATUS_OPTIONS.find(s => s.value === o.status)?.label || o.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-5">
            <h2 className="text-sm font-bold text-foreground mb-3">{config.assigneeRoleLabel} Team</h2>
            {team.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No {config.assigneeRoleLabel.toLowerCase()}s on the team yet.</p>
            ) : (
              <div className="space-y-3">
                {team.map(t => {
                  const myWork = orders.filter(o => o[config.assigneeIdField] === t.id);
                  const active = myWork.filter(o => ['awaiting_brief', 'in_production'].includes(o.status)).length;
                  return (
                    <div key={t.id} className="flex items-center gap-2.5">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">{initials(t.full_name || t.email)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{t.full_name || t.email}</p>
                        <p className="text-[11px] text-muted-foreground">{active} active</p>
                      </div>
                      <div className={cn('w-2 h-2 rounded-full', active > 0 ? 'bg-green-500' : 'bg-gray-300')} />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
