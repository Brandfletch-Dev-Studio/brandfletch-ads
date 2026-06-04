import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Ticket, Clock, CheckCircle, AlertCircle, XCircle, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function AdminSupportTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    try {
      const all = await base44.entities.SupportTicket.list('-created_date', 200);
      setTickets(all);
    } catch (error) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(ticketId, newStatus) {
    setUpdatingId(ticketId);
    try {
      const updates = { status: newStatus };
      if (newStatus === 'resolved' || newStatus === 'closed') {
        updates.resolved_date = new Date().toISOString();
      }
      await base44.entities.SupportTicket.update(ticketId, updates);
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updates } : t));
      toast.success(`Ticket marked as ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  }

  const getStatusConfig = (status) => {
    const configs = {
      open: { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle, label: 'Open' },
      in_progress: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, label: 'In Progress' },
      resolved: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: 'Resolved' },
      closed: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: XCircle, label: 'Closed' }
    };
    return configs[status] || configs.open;
  };

  const filtered = tickets.filter(t => {
    const matchSearch = !search || 
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.user_email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    total: tickets.length
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8 max-w-6xl mx-auto">
        <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-32 rounded-xl bg-secondary animate-pulse" />)}</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
          <Ticket className="w-6 h-6" /> Support Tickets
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Manage and track all support requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-xs text-red-600 mb-1">Open</p>
            <p className="text-2xl font-bold text-red-700">{stats.open}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <p className="text-xs text-amber-600 mb-1">In Progress</p>
            <p className="text-2xl font-bold text-amber-700">{stats.in_progress}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <p className="text-xs text-green-600 mb-1">Resolved</p>
            <p className="text-2xl font-bold text-green-700">{stats.resolved}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by subject, user name, or email..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tickets List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Ticket className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No tickets found</p>
            <p className="text-sm mt-1">Adjust your filters or search query</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(ticket => {
            const StatusIcon = getStatusConfig(ticket.status).icon;
            return (
              <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold text-sm truncate">{ticket.subject}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            ticket.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                            ticket.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                            ticket.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {ticket.priority}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground mb-2">
                          <div>
                            <span className="font-medium">User:</span> {ticket.user_name} ({ticket.user_email})
                          </div>
                          <div>
                            <span className="font-medium">Category:</span> {ticket.category?.replace('_', ' ')}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
                        {ticket.admin_notes && (
                          <div className="mt-2 p-2 bg-secondary/50 rounded-lg">
                            <p className="text-xs font-medium mb-1">Admin Notes:</p>
                            <p className="text-xs text-muted-foreground">{ticket.admin_notes}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span>Created: {new Date(ticket.created_date).toLocaleDateString()}</span>
                          {ticket.resolved_date && <span>Resolved: {new Date(ticket.resolved_date).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Select
                          value={ticket.status}
                          onValueChange={(v) => updateStatus(ticket.id, v)}
                          disabled={updatingId === ticket.id}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">
                              <span className="flex items-center gap-2">
                                <AlertCircle className="w-3 h-3" /> Open
                              </span>
                            </SelectItem>
                            <SelectItem value="in_progress">
                              <span className="flex items-center gap-2">
                                <Clock className="w-3 h-3" /> In Progress
                              </span>
                            </SelectItem>
                            <SelectItem value="resolved">
                              <span className="flex items-center gap-2">
                                <CheckCircle className="w-3 h-3" /> Resolved
                              </span>
                            </SelectItem>
                            <SelectItem value="closed">
                              <span className="flex items-center gap-2">
                                <XCircle className="w-3 h-3" /> Closed
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}