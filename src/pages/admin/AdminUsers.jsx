import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Shield, UserPlus, X, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useAuditLog } from '@/hooks/useAuditLog';

export default function AdminUsers() {
  useRoleGuard(['admin']);
  const auditLog = useAuditLog();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('campaign_manager');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    base44.entities.User.list().then(u => { setUsers(u); setLoading(false); });
  }, []);

  async function handleInvite(e) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await base44.users.inviteUser(inviteEmail.trim(), inviteRole);
      toast.success(`Invite sent to ${inviteEmail}`);
      setShowInvite(false);
      setInviteEmail('');
      setInviteRole('campaign_manager');
    } catch (err) {
      toast.error(err?.message || 'Failed to send invite. Please try again.');
    } finally {
      setInviting(false);
    }
  }

  async function updateRole(userId, newRole) {
    const target = users.find(u => u.id === userId);
    try {
      await base44.entities.User.update(userId, { role: newRole });
      auditLog('user_role_changed', 'User', userId,
        `${target?.full_name || target?.email} role changed to "${newRole}"`);
      setUsers(us => us.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success('Role updated');
    } catch (err) {
      toast.error(err?.message || 'Failed to update role');
    }
  }

  const roleColors = {
    admin: 'bg-purple-100 text-purple-700',
    campaign_manager: 'bg-blue-100 text-blue-700',
    finance: 'bg-green-100 text-green-700',
    user: 'bg-gray-100 text-gray-600',
  };

  const filtered = users.filter(u =>
    !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">Users</h1>
          <p className="text-muted-foreground text-sm mt-1">{users.length} registered users</p>
        </div>
        <Button onClick={() => setShowInvite(true)} size="sm" className="flex-shrink-0">
          <UserPlus className="w-4 h-4 mr-2" /> Invite Team Member
        </Button>
      </div>

      {/* Invite dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5" /> Invite Team Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  required
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="campaign_manager">Campaign Manager</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowInvite(false)}>Cancel</Button>
              <Button type="submit" disabled={inviting} className="flex-1">
                {inviting ? 'Sending...' : 'Send Invite'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="pl-9" />
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-secondary animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(u => (
            <Card key={u.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-sm text-[hsl(var(--primary))]">
                      {u.full_name?.charAt(0) || u.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{u.full_name || 'No name'}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                    {u.created_date && (
                      <p className="text-xs text-muted-foreground mt-0.5">Joined {format(new Date(u.created_date), 'MMM d, yyyy')}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={`text-xs ${roleColors[u.role] || roleColors.user}`}>
                      <Shield className="w-3 h-3 mr-1" />
                      {u.role || 'user'}
                    </Badge>
                    <Select value={u.role || 'user'} onValueChange={v => updateRole(u.id, v)}>
                      <SelectTrigger className="w-36 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Client</SelectItem>
                        <SelectItem value="campaign_manager">Campaign Manager</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}