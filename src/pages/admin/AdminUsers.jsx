import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Search, Shield, UserPlus, Mail, MoreVertical,
  UserX, UserCheck, Key, Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useAuth } from '@/lib/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { ROLE_LABELS, ROLE_COLORS, STAFF_ROLES } from '@/lib/permissions';

const INVITABLE_ROLES = [
  { value: 'campaign_manager',      label: 'Campaign Manager' },
  { value: 'sales_manager',         label: 'Sales Manager' },
  { value: 'finance',               label: 'Finance' },
  { value: 'ads_manager',           label: 'Ads Manager' },
  { value: 'creative_ops_director', label: 'Creative Ops Director' },
  { value: 'designer',              label: 'Designer' },
  { value: 'admin',                 label: 'Super Admin' },
  { value: 'user',                  label: 'Client' },
];

const ASSIGNABLE_ROLES = [
  { value: 'user',                  label: 'Client' },
  { value: 'campaign_manager',      label: 'Campaign Manager' },
  { value: 'sales_manager',         label: 'Sales Manager' },
  { value: 'finance',               label: 'Finance' },
  { value: 'ads_manager',           label: 'Ads Manager' },
  { value: 'creative_ops_director', label: 'Creative Ops Director' },
  { value: 'designer',              label: 'Designer' },
  { value: 'admin',                 label: 'Super Admin' },
];

// Role hierarchy row sub-component
function HierarchyRow({ role, desc, level, color }) {
  return (
    <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 16}px` }}>
      {level > 0 && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <div className="w-3 h-px bg-border" />
          <div className="w-1.5 h-1.5 rounded-full bg-border" />
        </div>
      )}
      <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${color}`}>
        <span className="font-semibold whitespace-nowrap">{ROLE_LABELS[role]}</span>
        <span className="text-[11px] opacity-60 hidden sm:block">·</span>
        <span className="opacity-70 hidden sm:block leading-tight">{desc}</span>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  useRoleGuard(null, 'users.view');
  const auditLog = useAuditLog();
  const { isSuperAdmin, can } = usePermissions();
  const { user: currentUser } = useAuth();
  const isDesignDeptHead = currentUser?.role === 'creative_ops_director';

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('campaign_manager');
  const [inviting, setInviting] = useState(false);
  const [activeTab, setActiveTab] = useState('staff');

  useEffect(() => {
    base44.entities.User.list().then(u => {
      // COD can only see design dept members (designers + other CODs) + client accounts
      const filtered = currentUser?.role === 'creative_ops_director'
        ? u.filter(x => ['designer', 'creative_ops_director', 'user'].includes(x.role))
        : u;
      setUsers(filtered);
      setLoading(false);
    });
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
      toast.error(err?.message || 'Failed to send invite.');
    } finally {
      setInviting(false);
    }
  }

  async function updateRole(userId, newRole) {
    const target = users.find(u => u.id === userId);
    await base44.entities.User.update(userId, { role: newRole });
    auditLog('user_role_changed', 'User', userId,
      `${target?.full_name || target?.email} role changed to "${ROLE_LABELS[newRole] || newRole}"`);
    setUsers(us => us.map(u => u.id === userId ? { ...u, role: newRole } : u));
    toast.success('Role updated');
  }

  async function toggleSuspend(userId, suspend) {
    const target = users.find(u => u.id === userId);
    await base44.entities.User.update(userId, { is_suspended: suspend });
    setUsers(us => us.map(u => u.id === userId ? { ...u, is_suspended: suspend } : u));
    toast.success(suspend ? `${target?.full_name || 'User'} suspended` : `${target?.full_name || 'User'} reinstated`);
  }

  const staffUsers = users.filter(u => STAFF_ROLES.includes(u.role));
  const clientUsers = users.filter(u => !STAFF_ROLES.includes(u.role));

  const displayList = (activeTab === 'staff' ? staffUsers : clientUsers).filter(u => {
    const matchSearch = !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
            <Users className="w-6 h-6" /> Team & Users
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Brandfletch Media — {staffUsers.length} staff · {clientUsers.length} clients
          </p>
        </div>
        {can('users.create') && (
          <Button onClick={() => setShowInvite(true)} size="sm" className="flex-shrink-0 gap-1.5">
            <UserPlus className="w-4 h-4" /> Invite Member
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
        {[{ key: 'staff', label: `Staff (${staffUsers.length})` }, { key: 'clients', label: `Clients (${clientUsers.length})` }].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === t.key ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="pl-9" />
        </div>
        {activeTab === 'staff' && (
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {ASSIGNABLE_ROLES.filter(r => r.value !== 'user').map(r => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Role legend for staff tab — hierarchical */}
      {activeTab === 'staff' && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4" /> Role Hierarchy — Brandfletch Media
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {/* Super Admin — top of everything */}
              <HierarchyRow role="admin" desc="Full system access — all departments report here" level={0} color="bg-purple-100 border-purple-300 text-purple-800" />

              {/* ADS DEPARTMENT */}
              <div className="mt-3 mb-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1 mb-1.5 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-400" /> Ads Department
                </p>
                <div className="border-l-2 border-blue-200 ml-2 pl-2 space-y-1">
                  <HierarchyRow role="ads_manager"      desc="Campaigns, clients, reports & approvals" level={0} color="bg-blue-100 border-blue-300 text-blue-800" />
                  <HierarchyRow role="campaign_manager" desc="Campaign delivery & client comms"         level={1} color="bg-sky-100 border-sky-300 text-sky-800" />
                </div>
              </div>

              {/* DESIGN DEPARTMENT */}
              <div className="mt-3 mb-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1 mb-1.5 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-pink-400" /> Design Department
                </p>
                <div className="border-l-2 border-pink-200 ml-2 pl-2 space-y-1">
                  <HierarchyRow role="creative_ops_director" desc="Heads design dept — manages designers & approves work" level={0} color="bg-pink-100 border-pink-300 text-pink-800" />
                  <HierarchyRow role="designer"              desc="Assigned design queue — no broader admin access"       level={1} color="bg-rose-100 border-rose-300 text-rose-800" />
                </div>
              </div>

              {/* SHARED ROLES */}
              <div className="mt-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1 mb-1.5 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400" /> Shared Roles
                </p>
                <div className="border-l-2 border-amber-200 ml-2 pl-2 space-y-1">
                  <HierarchyRow role="sales_manager" desc="Leads, onboarding & sales pipeline"        level={0} color="bg-amber-100 border-amber-300 text-amber-800" />
                  <HierarchyRow role="finance"       desc="Payments, transactions & financial reports" level={0} color="bg-green-100 border-green-300 text-green-800" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User list */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-secondary animate-pulse" />)}</div>
      ) : displayList.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">No users found</div>
      ) : (
        <div className="space-y-2">
          {displayList.map(u => (
            <Card key={u.id} className={`shadow-sm ${u.is_suspended ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-sm text-[hsl(var(--primary))]">
                      {u.full_name?.charAt(0) || u.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{u.full_name || 'No name'}</p>
                      {u.is_suspended && (
                        <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">Suspended</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                    {u.created_date && (
                      <p className="text-xs text-muted-foreground mt-0.5">Joined {format(new Date(u.created_date), 'MMM d, yyyy')}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={`text-xs hidden sm:flex ${ROLE_COLORS[u.role] || ROLE_COLORS.user}`}>
                      <Shield className="w-3 h-3 mr-1" />
                      {ROLE_LABELS[u.role] || u.role}
                    </Badge>

                    {/* Role changer — only for users with assign_roles permission */}
                    {can('users.assign_roles') && (
                      <Select value={u.role || 'user'} onValueChange={v => updateRole(u.id, v)}>
                        <SelectTrigger className="w-40 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(isDesignDeptHead ? ASSIGNABLE_ROLES.filter(r => ['designer','creative_ops_director'].includes(r.value)) : ASSIGNABLE_ROLES).map(r => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {/* Actions menu */}
                    {can('users.edit') && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {u.is_suspended ? (
                            <DropdownMenuItem onClick={() => toggleSuspend(u.id, false)}>
                              <UserCheck className="w-4 h-4 mr-2 text-green-600" /> Reinstate User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => toggleSuspend(u.id, true)} className="text-destructive focus:text-destructive">
                              <UserX className="w-4 h-4 mr-2" /> Suspend User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Invite Dialog */}
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
                <Input type="email" required placeholder="colleague@example.com"
                  value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INVITABLE_ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground pt-1">
                {inviteRole === 'admin' && '⚠️ Super Admin has full unrestricted access.'}
                {inviteRole === 'ads_manager' && 'Can manage campaigns, clients, and approve content.'}
                {inviteRole === 'campaign_manager' && 'Can create and manage campaigns and communicate with clients.'}
                {inviteRole === 'finance' && 'Can manage payments and financial settings.'}
                {inviteRole === 'sales_manager' && 'Can manage leads and sales pipeline.'}
              </p>
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
    </div>
  );
}