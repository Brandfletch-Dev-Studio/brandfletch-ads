import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import {
  Ticket, Clock, CheckCircle, AlertCircle, XCircle, Search, Filter,
  ArrowLeft, Send, MessageSquare, ChevronRight, RefreshCw, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  open:        { color: 'bg-red-100 text-red-700 border-red-200',       icon: AlertCircle,  label: 'Open' },
  in_progress: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock,        label: 'In Progress' },
  resolved:    { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle,  label: 'Resolved' },
  closed:      { color: 'bg-gray-100 text-gray-600 border-gray-200',    icon: XCircle,      label: 'Closed' },
};

const PRIORITY_COLOR = {
  low:    'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high:   'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-semibold whitespace-nowrap', cfg.color)}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

// ── Ticket Detail / Conversation View ────────────────────────────────────────
function TicketDetail({ ticket, currentUser, onBack, onUpdate }) {
  const [messages, setMessages] = useState(ticket.messages || []);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  async function updateStatus(newStatus) {
    setUpdatingStatus(true);
    try {
      const updates = { status: newStatus };
      if (newStatus === 'resolved' || newStatus === 'closed') {
        updates.resolved_date = new Date().toISOString();
      }
      const updated = await base44.entities.SupportTicket.update(ticket.id, updates);
      onUpdate(updated);
      toast.success(`Ticket marked as ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function sendReply(e) {
    e.preventDefault();
    if (!reply.trim() || sending) return;
    setSending(true);
    const newMsg = {
      id: Date.now().toString(),
      sender_id: currentUser.id,
      sender_name: currentUser.full_name || currentUser.email,
      sender_role: 'admin',
      text: reply.trim(),
      created_at: new Date().toISOString(),
    };
    const updatedMessages = [...messages, newMsg];
    try {
      const updated = await base44.entities.SupportTicket.update(ticket.id, {
        messages: updatedMessages,
        status: ticket.status === 'open' ? 'in_progress' : ticket.status,
      });
      setMessages(updatedMessages);
      onUpdate(updated);
      setReply('');
      toast.success('Reply sent');
    } catch (err) {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-accent transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-base text-foreground truncate">{ticket.subject}</h2>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <StatusBadge status={ticket.status} />
            <span className={cn('text-xs px-2 py-0.5 rounded-full capitalize', PRIORITY_COLOR[ticket.priority] || PRIORITY_COLOR.medium)}>
              {ticket.priority}
            </span>
            <span className="text-xs text-muted-foreground capitalize">
              {(ticket.category || 'general').replace('_', ' ')}
            </span>
            <span className="text-xs text-muted-foreground">
              · {ticket.created_date ? format(new Date(ticket.created_date), 'MMM d, yyyy') : '—'}
            </span>
          </div>
        </div>
        <Select value={ticket.status} onValueChange={updateStatus} disabled={updatingStatus}>
          <SelectTrigger className="w-36 h-8 text-xs shrink-0"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="open"><AlertCircle className="w-3 h-3 inline mr-1" /> Open</SelectItem>
            <SelectItem value="in_progress"><Clock className="w-3 h-3 inline mr-1" /> In Progress</SelectItem>
            <SelectItem value="resolved"><CheckCircle className="w-3 h-3 inline mr-1" /> Resolved</SelectItem>
            <SelectItem value="closed"><XCircle className="w-3 h-3 inline mr-1" /> Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Client info banner */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-accent/30 rounded-lg px-3 py-2">
        <User className="w-3.5 h-3.5" />
        <span><strong>{ticket.user_name}</strong> · {ticket.user_email}</span>
      </div>

      {/* Conversation thread */}
      <Card>
        <CardContent className="p-0">
          {/* Original description */}
          <div className="p-4 border-b border-border/60 bg-accent/20 rounded-t-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-foreground">
                  {(ticket.user_name || '?')[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{ticket.user_name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {ticket.created_date ? format(new Date(ticket.created_date), 'MMM d, yyyy · h:mm a') : ''}
                </p>
              </div>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
          </div>

          {/* Messages */}
          {messages.length > 0 && (
            <div className="divide-y divide-border/40">
              {messages.map(msg => {
                const isAdmin = msg.sender_role === 'admin' || msg.sender_role === 'staff';
                return (
                  <div key={msg.id} className={cn('p-4', isAdmin ? 'bg-primary/5' : '')}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                        isAdmin ? 'bg-primary/20' : 'bg-secondary')}>
                        <span className={cn('text-xs font-bold', isAdmin ? 'text-primary' : 'text-foreground')}>
                          {(msg.sender_name || '?')[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                          {msg.sender_name}
                          {isAdmin && <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">Staff</span>}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {msg.created_at ? format(new Date(msg.created_at), 'MMM d · h:mm a') : ''}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed pl-9">{msg.text}</p>
                  </div>
                );
              })}
            </div>
          )}

          {messages.length === 0 && (
            <div className="px-4 py-6 text-center">
              <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No replies yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reply form */}
      {ticket.status !== 'closed' && (
        <form onSubmit={sendReply} className="flex gap-2">
          <Textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder="Type a reply to the client..."
            className="min-h-[80px] resize-none flex-1 text-sm"
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendReply(e);
            }}
          />
          <Button type="submit" disabled={!reply.trim() || sending} className="self-end gap-2 shrink-0">
            <Send className="w-4 h-4" /> {sending ? 'Sending...' : 'Send'}
          </Button>
        </form>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminSupportTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);

  const loadTickets = useCallback(async () => {
    try {
      const all = await base44.entities.SupportTicket.list({ sort: '-created_date', limit: 200 });
      setTickets(all);
    } catch (error) {
      console.error('Failed to load tickets:', error);
      toast.error('Failed to load tickets — ' + (error?.message || 'try refreshing'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  function handleTicketUpdate(updatedTicket) {
    setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    setSelectedTicket(updatedTicket);
  }

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
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-24 rounded-xl bg-secondary animate-pulse" />)}</div>
      </div>
    );
  }

  // ── Detail view ──────────────────────────────────────────────────────────
  if (selectedTicket) {
    return (
      <div className="p-4 lg:p-8 max-w-3xl mx-auto">
        <TicketDetail
          ticket={selectedTicket}
          currentUser={user}
          onBack={() => setSelectedTicket(null)}
          onUpdate={handleTicketUpdate}
        />
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────
  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
            <Ticket className="w-6 h-6" /> Support Tickets
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage and track all support requests</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setLoading(true); loadTickets(); }} className="gap-1.5">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </CardContent></Card>
        <Card className="border-red-200 bg-red-50"><CardContent className="p-4">
          <p className="text-xs text-red-600 mb-1">Open</p>
          <p className="text-2xl font-bold text-red-700">{stats.open}</p>
        </CardContent></Card>
        <Card className="border-amber-200 bg-amber-50"><CardContent className="p-4">
          <p className="text-xs text-amber-600 mb-1">In Progress</p>
          <p className="text-2xl font-bold text-amber-700">{stats.in_progress}</p>
        </CardContent></Card>
        <Card className="border-green-200 bg-green-50"><CardContent className="p-4">
          <p className="text-xs text-green-600 mb-1">Resolved</p>
          <p className="text-2xl font-bold text-green-700">{stats.resolved}</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by subject, user name, or email..." className="pl-9" />
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

      {/* Tickets List — now clickable */}
      {filtered.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">
          <Ticket className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No tickets found</p>
          <p className="text-sm mt-1">Adjust your filters or search query</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(ticket => {
            const messageCount = (ticket.messages || []).length;
            const hasClientReply = (ticket.messages || []).some(m => m.sender_role !== 'admin' && m.sender_role !== 'staff');
            return (
              <button key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="w-full text-left">
                <Card className="hover:shadow-md hover:border-primary/30 transition-all active:scale-[0.99] cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <h3 className="font-semibold text-sm text-foreground truncate">{ticket.subject}</h3>
                          {hasClientReply && (
                            <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0">New Reply</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn('text-xs px-2 py-0.5 rounded-full capitalize', PRIORITY_COLOR[ticket.priority] || PRIORITY_COLOR.medium)}>
                            {ticket.priority}
                          </span>
                          <span className="text-xs text-muted-foreground">{ticket.user_name} · {ticket.user_email}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{ticket.description}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{ticket.created_date ? format(new Date(ticket.created_date), 'M/d/yyyy') : '—'}</span>
                          {messageCount > 0 && <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {messageCount}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <StatusBadge status={ticket.status} />
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
