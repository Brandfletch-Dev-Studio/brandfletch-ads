import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { User, Search, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.User.list().then(u => { setUsers(u); setLoading(false); });
  }, []);

  async function updateRole(id, role) {
    await base44.entities.User.update(id, { role });
    setUsers(us => us.map(u => u.id === id ? { ...u, role } : u));
    toast.success('Role updated');
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
      <div>
        <h1 className="text-2xl font-bold font-heading">Users</h1>
        <p className="text-muted-foreground text-sm mt-1">{users.length} registered users</p>
      </div>

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