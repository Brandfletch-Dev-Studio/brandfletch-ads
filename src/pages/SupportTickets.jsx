import { useState, useEffect, useCallback, useRef } from 'react';
import { base44, supabase } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import {
  Plus, Ticket, Clock, CheckCircle, AlertCircle,
  ArrowLeft, Send, MessageSquare, ChevronRight, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  open:        { color: 'bg-red-100 text-red-700 border-red-200',       icon: AlertCircle,  label: 'Open' },
  in_progress: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock,        label: 'In Progress' },
  resolved:    { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle,  label: 'Resolved' },
  closed:      { color: 'bg-gray-100 text-gray-600 border-gray-200',    icon: Ticket,       label: 'Closed' },
};

const PRIORITY_DOT = {
  low:    'bg-gray-400',
  medium: 'bg-blue-500',
  high:   'bg-orange-500',
  urgent: 'bg-red-500',
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-semibold', cfg.color)}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
}

// ── Chat View ──────────────────────────────────────────────────────────────────
function TicketChat({ ticket, currentUser, onBack, onTicketUpdate }) {
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // Build message list: first message = original description
  useEffect(() => {
    const first = {
      id: 'original',
      sender_id: ticket.user_id || ticket.created_by,
      sender_name: ticket.user_name || 'You',
      sender_role: 'client',
      text: ticket.description,
      created_at: ticket.created_date,
    };
    setMessages([first, ...(ticket.messages || [])]);
  }, [ticket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    const text = reply.trim();
    if (!text || sending) return;
    setSending(true);

    const newMsg = {
      id: `${Date.now()}`,
      sender_id: currentUser.id,
      sender_name: currentUser.full_name || currentUser.email,
      sender_role: 'client',
      text,
      created_at: new Date().toISOString(),
    };

    // Optimistic update
    setMessages(prev => [...prev, newMsg]);
    setReply('');

    try {
      const storedMessages = [...(ticket.messages || []), newMsg];
      const updated = await base44.entities.SupportTicket.update(ticket.id, {
        messages: storedMessages,
        status: ticket.status === 'resolved' || ticket.status === 'closed'
          ? 'open' : ticket.status,
      });
      onTicketUpdate(updated);
    } catch {
      toast.error('Failed to send. Please try again.');
      setMessages(prev => prev.filter(m => m.id !== newMsg.id));
      setReply(text);
    } finally {
      setSending(false);
    }
  }

  const isClosed = ticket.status === 'closed';
  const myId = currentUser.id;

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-h-[700px] bg-card rounded-2xl border border-border overflow-hidden shadow-sm">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{ticket.subject}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <StatusBadge status={ticket.status} />
            <span className="text-xs text-muted-foreground capitalize">
              {(ticket.category || 'general').replace(/_/g, ' ')}
            </span>
          </div>
        </div>
        <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', PRIORITY_DOT[ticket.priority] || 'bg-blue-500')}
          title={`Priority: ${ticket.priority}`} />
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => {
          const isMine = msg.sender_id === myId || msg.sender_role === 'client';
          const isAdmin = msg.sender_role === 'admin' || msg.sender_role === 'staff';
          const showName = i === 0 || messages[i - 1]?.sender_role !== msg.sender_role;

          return (
            <div key={msg.id} className={cn('flex gap-2', isMine ? 'flex-row-reverse' : 'flex-row')}>
              {/* Avatar — only shown for first in a run */}
              <div className="w-7 h-7 shrink-0 mt-1">
                {showName && (
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                    isAdmin ? 'bg-[hsl(var(--primary))] text-white' : 'bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))]'
                  )}>
                    {(msg.sender_name || '?')[0].toUpperCase()}
                  </div>
                )}
              </div>

              <div className={cn('flex flex-col max-w-[75%]', isMine ? 'items-end' : 'items-start')}>
                {showName && (
                  <span className="text-[10px] text-muted-foreground mb-1 px-1 flex items-center gap-1">
                    {isAdmin && <span className="bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-[10px] px-1.5 py-0.5 rounded-full font-semibold">Brandfletch</span>}
                    {!isAdmin && (msg.sender_name || 'You')}
                  </span>
                )}
                <div className={cn(
                  'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
                  isMine
                    ? 'bg-[hsl(var(--primary))] text-white rounded-tr-sm'
                    : isAdmin
                      ? 'bg-[hsl(var(--accent))]/10 text-foreground border border-[hsl(var(--accent))]/20 rounded-tl-sm'
                      : 'bg-secondary text-foreground rounded-tl-sm'
                )}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                  {msg.created_at
                    ? formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })
                    : ''}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      {!isClosed ? (
        <form onSubmit={handleSend} className="shrink-0 border-t border-border px-3 py-3 flex gap-2 items-end bg-card">
          <Textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder="Type a message… (Ctrl+Enter to send)"
            className="min-h-[56px] max-h-[140px] resize-none flex-1 text-sm rounded-xl border-border focus-visible:ring-1"
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend(e);
            }}
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
          <p className="text-xs text-muted-foreground">
            This ticket is closed. <button onClick={() => {}} className="text-[hsl(var(--accent))] hover:underline">Open a new ticket</button> for further help.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Ticket List Item ───────────────────────────────────────────────────────────
function TicketRow({ ticket, onClick }) {
  const unread = (ticket.messages || []).filter(m => m.sender_role === 'admin' && !m.read_by_client).length;
  const lastMsg = (ticket.messages || []).slice(-1)[0];
  const preview = lastMsg?.text || ticket.description || '';

  return (
    <button
      onClick={() => onClick(ticket)}
      className="w-full text-left flex items-start gap-3 px-4 py-3.5 hover:bg-accent/50 transition-colors border-b border-border last:border-0 group"
    >
      {/* Icon */}
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

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn('text-sm font-semibold truncate', unread > 0 ? 'text-foreground' : 'text-foreground/80')}>
            {ticket.subject}
          </p>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {ticket.updated_date
              ? formatDistanceToNow(new Date(ticket.updated_date), { addSuffix: true })
              : ''}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{preview}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <StatusBadge status={ticket.status} />
          {unread > 0 && (
            <span className="bg-[hsl(var(--accent))] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unread} new
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 self-center group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SupportTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [formData, setFormData] = useState({
    subject: '', description: '', priority: 'medium', category: 'general',
  });

  const load = useCallback(async () => {
    try {
      const t = await base44.entities.SupportTicket.list({ sort: '-updated_date', limit: 100 });
      setTickets(t);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const created = await base44.entities.SupportTicket.create({
        user_id: user.id,
        user_name: user.full_name || user.email,
        user_email: user.email,
        ...formData,
        status: 'open',
        messages: [],
      });
      toast.success('Ticket created — you can now chat with our team.');
      setCreating(false);
      setFormData({ subject: '', description: '', priority: 'medium', category: 'general' });
      setTickets(prev => [created, ...prev]);
      setActiveTicket(created);
      // Fire email alert to admin (non-blocking)
      try {
        await supabase.functions.invoke('notify-new-ticket', {
          body: { ticket: created },
        });
      } catch { /* email failure is non-critical */ }
    } catch {
      toast.error('Failed to create ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const handleUpdate = (updated) => {
    setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
    setActiveTicket(updated);
  };

  // ── Chat view ──
  if (activeTicket) {
    return (
      <div className="p-4 lg:p-6 max-w-3xl mx-auto">
        <TicketChat
          ticket={activeTicket}
          currentUser={user}
          onBack={() => setActiveTicket(null)}
          onTicketUpdate={handleUpdate}
        />
      </div>
    );
  }

  // ── Ticket list ──
  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display">Support</h1>
          <p className="text-muted-foreground text-sm">Chat with our team about any issue.</p>
        </div>
        <Button
          onClick={() => setCreating(true)}
          className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white gap-2"
          size="sm"
        >
          <Plus className="w-4 h-4" /> New ticket
        </Button>
      </div>

      {/* List */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading tickets…</div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No tickets yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create a ticket to start a conversation with our team.</p>
            <Button onClick={() => setCreating(true)} size="sm" className="mt-4">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Open a ticket
            </Button>
          </div>
        ) : (
          tickets.map(t => (
            <TicketRow key={t.id} ticket={t} onClick={setActiveTicket} />
          ))
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Open a support ticket</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-1">
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={e => setFormData(f => ({ ...f, subject: e.target.value }))}
                placeholder="Brief summary of your issue"
                required
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={v => setFormData(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['general','billing','campaign','technical','design','other'].map(c => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={v => setFormData(f => ({ ...f, priority: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['low','medium','high','urgent'].map(p => (
                      <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="desc">Describe your issue *</Label>
              <Textarea
                id="desc"
                value={formData.description}
                onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                placeholder="Tell us what's happening…"
                rows={4}
                required
                className="mt-1 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
              <Button
                type="submit"
                disabled={submitting || !formData.subject || !formData.description}
                className="bg-[hsl(var(--primary))] text-white"
              >
                {submitting ? 'Submitting…' : 'Submit ticket'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
