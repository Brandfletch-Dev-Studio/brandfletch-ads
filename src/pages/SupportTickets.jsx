import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import {
  Plus, Ticket, Clock, CheckCircle, AlertCircle,
  ArrowLeft, Send, MessageSquare, ChevronRight, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  open:        { color: 'bg-red-100 text-red-700 border-red-200',       icon: AlertCircle,  label: 'Open' },
  in_progress: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock,        label: 'In Progress' },
  resolved:    { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle,  label: 'Resolved' },
  closed:      { color: 'bg-gray-100 text-gray-600 border-gray-200',    icon: Ticket,       label: 'Closed' },
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
    <span className={cn('inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-semibold', cfg.color)}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

// ── Ticket Detail / Conversation View ────────────────────────────────────────
function TicketDetail({ ticket, currentUser, onBack, onTicketUpdate }) {
  const [messages, setMessages] = useState(ticket.messages || []);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  async function sendReply(e) {
    e.preventDefault();
    if (!reply.trim() || sending) return;
    setSending(true);
    const newMsg = {
      id: Date.now().toString(),
      sender_id: currentUser.id,
      sender_name: currentUser.full_name || currentUser.email,
      sender_role: 'client',
      text: reply.trim(),
      created_at: new Date().toISOString(),
    };
    const updatedMessages = [...messages, newMsg];
    try {
      const updated = await base44.entities.SupportTicket.update(ticket.id, {
        messages: updatedMessages,
        status: ticket.status === 'resolved' || ticket.status === 'closed' ? 'open' : ticket.status,
      });
      setMessages(updatedMessages);
      onTicketUpdate(updated);
      setReply('');
      toast.success('Message sent');
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-accent transition-colors"
        >
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
      </div>

      {/* Conversation thread */}
      <Card>
        <CardContent className="p-0">
          {/* Original description as first message */}
          <div className="p-4 border-b border-border/60 bg-accent/20 rounded-t-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">
                  {(currentUser.full_name || currentUser.email || '?')[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{currentUser.full_name || currentUser.email}</p>
                <p className="text-[10px] text-muted-foreground">
                  {ticket.created_date ? format(new Date(ticket.created_date), 'MMM d, yyyy · h:mm a') : ''}
                </p>
              </div>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
          </div>

          {/* Reply messages */}
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
                          {isAdmin && <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">Brandfletch</span>}
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
              <p className="text-xs text-muted-foreground">No replies yet — our team will respond shortly.</p>
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
            placeholder="Type a reply..."
            className="min-h-[80px] resize-none flex-1 text-sm"
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendReply(e);
            }}
          />
          <Button
            type="submit"
            disabled={!reply.trim() || sending}
            className="self-end gap-2 shrink-0"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </form>
      )}
      {ticket.status === 'closed' && (
        <p className="text-xs text-center text-muted-foreground py-2">This ticket is closed. Open a new ticket if you need further help.</p>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SupportTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [formData, setFormData] = useState({
    subject: '', description: '', priority: 'medium', category: 'general',
  });

  const loadTickets = useCallback(async () => {
    try {
      const t = await base44.entities.SupportTicket.list({ sort: '-created_date', limit: 100 });
      setTickets(t);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const newTicket = await base44.entities.SupportTicket.create({
        user_id: user.id,
        user_name: user.full_name || user.email,
        user_email: user.email,
        ...formData,
        status: 'open',
        messages: [],
      });
      toast.success('Ticket created successfully!');
      setCreating(false);
      setFormData({ subject: '', description: '', priority: 'medium', category: 'general' });
      setTickets(prev => [newTicket, ...prev]);
      // Open the new ticket immediately
      setSelectedTicket(newTicket);
    } catch (error) {
      toast.error('Failed to create ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleTicketUpdate(updatedTicket) {
    setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    setSelectedTicket(updatedTicket);
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-8 max-w-2xl mx-auto">
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-secondary animate-pulse" />)}
        </div>
      </div>
    );
  }

  // ── Detail view ──────────────────────────────────────────────────────────
  if (selectedTicket) {
    return (
      <div className="p-4 lg:p-8 max-w-2xl mx-auto">
        <TicketDetail
          ticket={selectedTicket}
          currentUser={user}
          onBack={() => setSelectedTicket(null)}
          onTicketUpdate={handleTicketUpdate}
        />
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────
  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
            <Ticket className="w-6 h-6" /> Support Tickets
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Track and manage your support requests</p>
        </div>

        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={formData.subject} onChange={e => setFormData(d => ({ ...d, subject: e.target.value }))} placeholder="Brief summary of your issue" required />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={v => setFormData(d => ({ ...d, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Inquiry</SelectItem>
                    <SelectItem value="technical">Technical Issue</SelectItem>
                    <SelectItem value="billing">Billing Question</SelectItem>
                    <SelectItem value="feature_request">Feature Request</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={v => setFormData(d => ({ ...d, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={e => setFormData(d => ({ ...d, description: e.target.value }))} placeholder="Describe your issue in detail..." className="min-h-[120px]" required />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Ticket'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Ticket className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No tickets yet</p>
            <p className="text-sm mt-1">Create your first support ticket to get help</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => {
            const { color, icon: StatusIcon, label: statusLabel } = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
            const messageCount = (ticket.messages || []).length;
            const hasAdminReply = (ticket.messages || []).some(m => m.sender_role === 'admin' || m.sender_role === 'staff');
            return (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="w-full text-left"
              >
                <Card className="hover:shadow-md hover:border-primary/30 transition-all active:scale-[0.99] cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <h3 className="font-semibold text-sm text-foreground truncate">{ticket.subject}</h3>
                          {hasAdminReply && (
                            <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0">Reply</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn('text-xs px-2 py-0.5 rounded-full capitalize', PRIORITY_COLOR[ticket.priority] || PRIORITY_COLOR.medium)}>
                            {ticket.priority}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">
                            · {(ticket.category || '').replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{ticket.description}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>Created: {ticket.created_date ? format(new Date(ticket.created_date), 'M/d/yyyy') : '—'}</span>
                          {messageCount > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> {messageCount}
                            </span>
                          )}
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
