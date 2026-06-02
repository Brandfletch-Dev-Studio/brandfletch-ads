import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, Send, Users, Eye, Trash2, Plus, BarChart2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';

const TYPE_OPTIONS = [
  { value: 'campaign_approved', label: 'Campaign Approved' },
  { value: 'campaign_rejected', label: 'Campaign Rejected' },
  { value: 'payment_confirmed', label: 'Payment Confirmed' },
  { value: 'payment_rejected', label: 'Payment Rejected' },
  { value: 'changes_requested', label: 'Changes Requested' },
  { value: 'campaign_completed', label: 'Campaign Completed' },
  { value: 'page_connected', label: 'Page Connected' },
];

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ title: '', message: '', type: 'campaign_approved', recipient_id: 'all' });
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState('send'); // 'send' | 'history'

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const [notifs, us] = await Promise.all([
      base44.entities.Notification.list('-created_date', 100),
      base44.entities.User.list(),
    ]);
    setNotifications(notifs);
    setUsers(us);
  }

  async function handleSend() {
    if (!form.title || !form.message) {
      toast.error('Title and message are required.');
      return;
    }
    setSending(true);
    const recipients = form.recipient_id === 'all'
      ? users.filter(u => !['admin', 'campaign_manager', 'finance'].includes(u.role))
      : users.filter(u => u.id === form.recipient_id);

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
    setSending(false);
  }

  async function deleteNotif(id) {
    await base44.entities.Notification.delete(id);
    setNotifications(n => n.filter(x => x.id !== id));
    toast.success('Deleted');
  }

  const totalSent = notifications.length;
  const totalRead = notifications.filter(n => n.is_read).length;
  const readRate = totalSent > 0 ? Math.round((totalRead / totalSent) * 100) : 0;

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Notification Centre</h1>
        <p className="text-muted-foreground text-sm mt-1">Send site-wide notifications and track engagement.</p>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[hsl(var(--primary))]">{totalSent}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Sent</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{totalRead}</p>
            <p className="text-xs text-muted-foreground mt-1">Read</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[hsl(var(--accent))]">{readRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">Read Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {[{ key: 'send', label: 'Send Notification', icon: Send }, { key: 'history', label: 'History', icon: BarChart2 }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'send' && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4" /> Compose Notification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">Recipient</Label>
                <Select value={form.recipient_id} onValueChange={v => setForm(f => ({ ...f, recipient_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users (clients)</SelectItem>
                    {users.filter(u => !['admin', 'campaign_manager', 'finance'].includes(u.role)).map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">Notification Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Notification title..." />
            </div>
            <div>
              <Label className="mb-1.5 block">Message *</Label>
              <Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Write your notification message..." rows={3} />
            </div>
            <Button onClick={handleSend} disabled={sending} className="gap-2 bg-[hsl(var(--primary))] text-primary-foreground">
              <Send className="w-4 h-4" /> {sending ? 'Sending...' : 'Send Notification'}
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          {notifications.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">No notifications sent yet</div>
          )}
          {notifications.map(n => {
            const recipient = users.find(u => u.id === n.recipient_id);
            return (
              <Card key={n.id} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-sm">{n.title}</p>
                        <Badge variant="outline" className={`text-xs ${n.is_read ? 'text-green-700 border-green-300' : 'text-amber-700 border-amber-300'}`}>
                          {n.is_read ? '✓ Read' : 'Unread'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{n.message}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {recipient?.full_name || recipient?.email || 'Unknown'}</span>
                        <span>{n.created_date ? format(new Date(n.created_date), 'MMM d, yyyy HH:mm') : ''}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteNotif(n.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
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