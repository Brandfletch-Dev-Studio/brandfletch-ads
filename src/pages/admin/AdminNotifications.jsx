import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { Bell, Send, Users, Eye, Trash2, BarChart2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { STAFF_ROLES } from '@/lib/permissions';

const TYPE_OPTIONS = [
  { value: 'campaign_approved',  label: 'Campaign Approved' },
  { value: 'campaign_rejected',  label: 'Campaign Rejected' },
  { value: 'payment_confirmed',  label: 'Payment Confirmed' },
  { value: 'payment_rejected',   label: 'Payment Rejected' },
  { value: 'changes_requested',  label: 'Changes Requested' },
  { value: 'campaign_completed', label: 'Campaign Completed' },
  { value: 'page_connected',     label: 'Page Connected' },
];

export default function AdminNotifications() {
  // Bug fix: add role guard — only roles with notifications.view permission can access
  useRoleGuard(null, 'notifications.view');
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ title: '', message: '', type: 'campaign_approved', recipient_id: 'all' });
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState('send');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [notifs, us] = await Promise.all([
        // Bug fix: list() options must be object, not positional args
        base44.entities.Notification.list({ sort: '-created_date', limit: 100 }),
        base44.entities.User.list(),
      ]);
      setNotifications(notifs);
      setUsers(us);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!form.title || !form.message) {
      toast.error('Title and message are required.');
      return;
    }
    setSending(true);
    try {
      // Bug fix: was excluding 'finance' + 'campaign_manager' from 'all' recipients with no reason
      // Correct: 'all' means all CLIENT users (role='user'), not staff
      const recipients = form.recipient_id === 'all'
        ? users.filter(u => u.role === 'user') // only business clients
        : users.filter(u => u.id === form.recipient_id);

      if (recipients.length === 0) {
        toast.error('No recipients found for this selection.');
        setSending(false);
        return;
      }

      await Promise.all(recipients.map(u =>
        base44.entities.Notification.create({
          recipient_id: u.id,
          recipient_role: u.role,
          title: form.title,
          message: form.message,
          type: form.type,
          is_read: false,
        })
      ));

      toast.success(`Notification sent to ${recipients.length} user(s).`);
      setForm({ title: '', message: '', type: 'campaign_approved', recipient_id: 'all' });
      await load();
    } catch (err) {
      toast.error('Failed to send notification. Please try again.');
    } finally {
      setSending(false);
    }
  }

  async function deleteNotif(id) {
    await base44.entities.Notification.delete(id);
    setNotifications(n => n.filter(x => x.id !== id));
    toast.success('Deleted');
  }

  const totalSent = notifications.length;
  const totalRead = notifications.filter(n => n.is_read).length;
  const readRate = totalSent > 0 ? Math.round((totalRead / totalSent) * 100) : 0;

  // Only show client users in recipient selector
  const clientUsers = users.filter(u => u.role === 'user');

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
          <Bell className="w-6 h-6" /> Notifications
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Send platform notifications to clients</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Sent', value: totalSent, icon: Send, color: 'bg-blue-100 text-blue-700' },
          { label: 'Read', value: totalRead, icon: Eye, color: 'bg-green-100 text-green-700' },
          { label: 'Read Rate', value: `${readRate}%`, icon: BarChart2, color: 'bg-purple-100 text-purple-700' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center flex-shrink-0`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
        {[{ key: 'send', label: 'Send New' }, { key: 'history', label: 'History' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === t.key ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'send' && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="mb-1.5 block">Recipient</Label>
              <Select value={form.recipient_id} onValueChange={v => setForm(f => ({ ...f, recipient_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients ({clientUsers.length})</SelectItem>
                  {clientUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Notification title..." />
            </div>
            <div>
              <Label className="mb-1.5 block">Message *</Label>
              <Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Notification message..." rows={3} />
            </div>
            <Button onClick={handleSend} disabled={sending} className="w-full gap-2">
              <Send className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send Notification'}
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-secondary animate-pulse" />)
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No notifications sent yet</div>
          ) : notifications.map(n => (
            <Card key={n.id}>
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm truncate">{n.title}</p>
                    <Badge className={n.is_read ? 'bg-green-100 text-green-700 text-xs' : 'bg-amber-100 text-amber-700 text-xs'}>
                      {n.is_read ? 'Read' : 'Unread'}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">{n.type?.replace(/_/g, ' ')}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {n.created_date ? format(new Date(n.created_date), 'MMM d, yyyy HH:mm') : ''}
                  </p>
                </div>
                <button onClick={() => deleteNotif(n.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
