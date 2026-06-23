import { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import {
  Ticket, Clock, CheckCircle, AlertCircle, XCircle, Search,
  ArrowLeft, Send, MessageSquare, ChevronRight, RefreshCw, User, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  open:        { color: 'bg-red-100 text-red-700 border-red-200',       icon: AlertCircle, label: 'Open' },
  in_progress: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock,       label: 'In Progress' },
  resolved:    { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: 'Resolved' },
  closed:      { color: 'bg-gray-100 text-gray-600 border-gray-200',    icon: XCircle,     label: 'Closed' },
};

const PRIORITY_DOT = {
  low: 'bg-gray-400', medium: 'bg-blue-500', high: 'bg-orange-500', urgent: 'bg-red-500 animate-pulse',
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-semibold whitespace-nowrap', cfg.color)}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
}

// ── Admin Chat View ────────────────────────────────────────────────────────────
function AdminTicketChat({ ticket, currentUser, onBack, onUpdate }) {
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const first = {
      id: 'original',
      sender_id: ticket.user_id || ticket.created_by,
      sender_name: ticket.user_name || 'Client',
      sender_role: 'client',
      text: ticket.description,
      created_at: ticket.created_date,
    };
    setMessages([first, ...(ticket.messages || [])]);
  }, [ticket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function changeStatus(newStatus) {
    setUpdatingStatus(true);
    try {
      const updated = await base44.entities.SupportTicket.update(ticket.id, {
        status: newStatus,
        ...(newStatus === 'resolved' || newStatus === 'closed'
          ? { resolved_date: new Date().toISOString() } : {}),
      });
      onUpdate(updated);
      toast.success(`Ticket marked as ${newStatus.replace('_', ' ')}`);
    } catch { toast.error('Status update failed'); }
    finally { setUpdatingStatus(false); }
  }

  async function handleSend(e) {
    e.preventDefault();
    const text = reply.trim();
    if (!text || sending) return;
    setSending(true);

    const newMsg = {
      id: `${Date.now()}`,
      sender_id: currentUser.id,
      sender_name: currentUser.full_name || currentUser.email,
      sender_role: 'admin',
      text,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newMsg]);
    setReply('');

    try {
      const storedMessages = [...(ticket.messages || []), newMsg];
      const updated = await base44.entities.SupportTicket.update(ticket.id, {
        messages: storedMessages,
        status: ticket.status === 'open' ? 'in_progress' : ticket.status,
      });
      onUpdate(updated);
    } catch {
      toast.error('Failed to send reply.');
      setMessages(prev => prev.filter(m => m.id !== newMsg.id));
      setReply(text);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[800px] bg-card rounded-2xl border border-border overflow-hidden shadow-sm">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{ticket.subject}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <StatusBadge status={ticket.status} />
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="w-3 h-3" />
              {ticket.user_name || ticket.user_email || 'Unknown'}
            </span>
            <span className="text-xs text-muted-foreground capitalize">
              {(ticket.category || 'general').replace(/_/g, ' ')}
            </span>
          </div>
        </div>
        {/* Status changer */}
        <Select value={ticket.status} onValueChange={changeStatus} disabled={updatingStatus}>
          <SelectTrigger className="w-36 h-8 text-xs shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', PRIORITY_DOT[ticket.priority] || 'bg-blue-500')}
          title={`Priority: ${ticket.priority}`} />
      </div>

      {/* ── Ticket meta strip ── */}
      <div className="px-4 py-2 bg-muted/30 border-b border-border/50 flex gap-4 text-xs text-muted-foreground shrink-0">
        <span>Opened {ticket.created_date ? format(new Date(ticket.created_date), 'MMM d, yyyy · h:mm a') : '—'}</span>
        {ticket.user_email && <span>·</span>}
        {ticket.user_email && <span>{ticket.user_email}</span>}
        <span>· Priority: <span className="capitalize font-medium">{ticket.priority}</span></span>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => {
          const isAdmin = msg.sender_role === 'admin' || msg.sender_role === 'staff';
          const isMe = isAdmin; // admin is always "me" in this view
          const showName = i === 0 || messages[i - 1]?.sender_role !== msg.sender_role;

          return (
            <div key={msg.id} className={cn('flex gap-2', isMe ? 'flex-row-reverse' : 'flex-row')}>
              <div className="w-7 h-7 shrink-0 mt-1">
                {showName && (
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                    isAdmin ? 'bg-[hsl(var(--primary))] text-white' : 'bg-secondary text-foreground'
                  )}>
                    {(msg.sender_name || '?')[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className={cn('flex flex-col max-w-[75%]', isMe ? 'items-end' : 'items-start')}>
                {showName && (
                  <span className="text-[10px] text-muted-foreground mb-1 px-1">
                    {isAdmin ? `${msg.sender_name} (Brandfletch)` : msg.sender_name}
                  </span>
                )}
                <div className={cn(
                  'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
                  isMe
                    ? 'bg-[hsl(var(--primary))] text-white rounded-tr-sm'
                    : 'bg-secondary text-foreground rounded-tl-sm border border-border'
                )}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                  {msg.created_at ? formatDistanceToNow(new Date(msg.created_at), { addSuffix: true }) : ''}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      {ticket.status !== 'closed' ? (
        <form onSubmit={handleSend} className="shrink-0 border-t border-border px-3 py-3 flex gap-2 items-end bg-card">
          <Textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder="Reply to client… (Ctrl+Enter to send)"
            className="min-h-[56px] max-h-[140px] resize-none flex-1 text-sm rounded-xl"
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend(e); }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!reply.trim() || sending}
            className="h-10 w-10 rounded-xl shrink-0 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      ) : (
        <div className="shrink-0 border-t border-border px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">Ticket is closed.</p>
        </div>
      )}
    </div>
  );
}

// ── Ticket Row ─────────────────────────────────────────────────────────────────
function TicketRow({ ticket, onClick }) {
  const lastMsg = (ticket.messages || []).slice(-1)[0];
  const preview = lastMsg?.text || ticket.description || '';
  const unreadAdmin = (ticket.messages || []).filter(m => m.sender_role === 'client' && !m.read_by_admin).length;

  return (
    <button
      onClick={() => onClick(ticket)}
      className="w-full text-left flex items-start gap-3 px-4 py-3.5 hover:bg-accent/50 transition-colors border-b border-border last:border-0 group"
    >
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
        ticket.status === 'open' ? 'bg-red-100' :
        ticket.status === 'in_progress' ? 'bg-amber-100' :
        ticket.status === 'resolved' ? 'bg-green-100' : 'bg-gray-100'
      )}>
        <MessageSquare className={cn(
          'w-4 h-4',
          ticket.status === 'open' ? 'text-red-600' :
          ticket.status === 'in_progress' ? 'text-amber-600' :
          ticket.status === 'resolved' ? 'text-green-600' : 'text-gray-500'
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold truncate text-foreground">{ticket.subject}</p>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {ticket.updated_date ? formatDistanceToNow(new Date(ticket.updated_date), { addSuffix: true }) : ''}
          </span>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
          <User className="w-3 h-3" />{ticket.user_name || ticket.user_email || 'Unknown'}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{preview}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <StatusBadge status={ticket.status} />
          <span className={cn('w-2 h-2 rounded-full shrink-0', PRIORITY_DOT[ticket.priority] || 'bg-blue-500')} />
          {unreadAdmin > 0 && (
            <span className="bg-[hsl(var(--accent))] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unreadAdmin} new
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 self-center group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function AdminSupportTickets() {
  const { user } = useAuth();
  const [tickets, setTickets]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('all');
  const [activeTicket, setActive]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const t = await base44.entities.SupportTicket.list({ sort: '-updated_date', limit: 500 });
      setTickets(t);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = (updated) => {
    setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
    setActive(updated);
  };

  const filtered = tickets.filter(t => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || t.subject?.toLowerCase().includes(q) ||
      t.user_name?.toLowerCase().includes(q) || t.user_email?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts = {
    all: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    closed: tickets.filter(t => t.status === 'closed').length,
  };

  // Chat view
  if (activeTicket) {
    return (
      <div className="p-4 lg:p-6 max-w-3xl mx-auto">
        <AdminTicketChat
          ticket={activeTicket}
          currentUser={user}
          onBack={() => setActive(null)}
          onUpdate={handleUpdate}
        />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display">Support Tickets</h1>
          <p className="text-muted-foreground text-sm">{counts.open} open · {counts.in_progress} in progress</p>
        </div>
        <Button onClick={load} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets…" className="pl-9 h-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all','open','in_progress','resolved','closed'].map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize',
                statusFilter === s
                  ? 'bg-[hsl(var(--primary))] text-white'
                  : 'bg-secondary text-foreground hover:bg-secondary/70'
              )}
            >
              {s.replace('_', ' ')} {counts[s] > 0 && `(${counts[s]})`}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading tickets…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No tickets found.</p>
          </div>
        ) : (
          filtered.map(t => <TicketRow key={t.id} ticket={t} onClick={setActive} />)
        )}
      </div>
    </div>
  );
}
