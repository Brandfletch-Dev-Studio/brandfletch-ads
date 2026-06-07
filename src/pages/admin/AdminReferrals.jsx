import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Gift, Users, TrendingUp, CheckCircle, Clock, Search, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useRoleGuard } from '@/hooks/useRoleGuard';

const STATUS_CONFIG = {
  pending:   { label: 'Signed Up',  color: 'bg-amber-100 text-amber-700' },
  converted: { label: 'Converted',  color: 'bg-green-100 text-green-700' },
  expired:   { label: 'Expired',    color: 'bg-gray-100 text-gray-500' },
};

export default function AdminReferrals() {
  useRoleGuard(null, 'referrals.view');
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['adminReferrals'],
    queryFn: () => base44.entities.Referral.list('-created_date', 500),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Referral.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReferrals'] });
      toast.success('Referral updated');
    },
  });

  const getUserName = (referrals) => {
    // Build referrer lookup from users
    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });
    return (referralCode) => {
      const u = users.find(u => u.referral_code === referralCode ||
        `BF-${u.id?.slice(-6)?.toUpperCase()}` === referralCode);
      return u ? (u.full_name || u.email) : referralCode;
    };
  };
  const getReferrerName = getUserName(referrals);

  const filtered = referrals.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      r.referred_email?.toLowerCase().includes(q) ||
      r.referred_name?.toLowerCase().includes(q) ||
      r.referral_code?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Stats
  const total = referrals.length;
  const converted = referrals.filter(r => r.status === 'converted').length;
  const pending = referrals.filter(r => r.status === 'pending').length;
  const convRate = total > 0 ? Math.round((converted / total) * 100) : 0;

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
          <Gift className="w-6 h-6 text-[hsl(var(--accent))]" /> Referrals
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Track all client referrals and manage rewards</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Referrals', value: total, icon: Users, color: 'bg-blue-100 text-blue-700' },
          { label: 'Converted', value: converted, icon: CheckCircle, color: 'bg-green-100 text-green-700' },
          { label: 'Pending', value: pending, icon: Clock, color: 'bg-amber-100 text-amber-700' },
          { label: 'Conversion Rate', value: `${convRate}%`, icon: TrendingUp, color: 'bg-purple-100 text-purple-700' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email or name..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-14 bg-secondary rounded-lg animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Gift className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No referrals found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">Referred User</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">Referred By</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">Code</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">Date</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">Reward</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(r => {
                    const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
                    return (
                      <tr key={r.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium">{r.referred_name || '—'}</p>
                          <p className="text-xs text-muted-foreground">{r.referred_email || '—'}</p>
                        </td>
                        <td className="px-4 py-3 text-sm">{getReferrerName(r.referral_code)}</td>
                        <td className="px-4 py-3">
                          <code className="text-xs bg-secondary px-2 py-1 rounded font-mono">{r.referral_code}</code>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {r.created_date ? format(new Date(r.created_date), 'MMM d, yyyy') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-green-600">
                          {r.reward_amount ? `${r.reward_currency || ''} ${r.reward_amount}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {r.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7"
                              onClick={() => updateMutation.mutate({ id: r.id, data: { status: 'converted' } })}
                            >
                              Mark Converted
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
