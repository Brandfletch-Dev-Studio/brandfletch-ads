import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, X, CheckCheck, Megaphone, DollarSign, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const TYPE_CONFIG = {
  campaign_approved:  { icon: Megaphone,   color: 'text-green-600', bg: 'bg-green-50' },
  campaign_rejected:  { icon: Megaphone,   color: 'text-red-600',   bg: 'bg-red-50' },
  campaign_submitted: { icon: Megaphone,   color: 'text-blue-600',  bg: 'bg-blue-50' },
  campaign_completed: { icon: CheckCheck,  color: 'text-green-600', bg: 'bg-green-50' },
  payment_confirmed:  { icon: DollarSign,  color: 'text-green-600', bg: 'bg-green-50' },
  payment_rejected:   { icon: DollarSign,  color: 'text-red-600',   bg: 'bg-red-50' },
  changes_requested:  { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
  page_connected:     { icon: Info,        color: 'text-blue-600',  bg: 'bg-blue-50' },
  page_rejected:      { icon: Info,        color: 'text-red-600',   bg: 'bg-red-50' },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      if (!u) return;
      setUserId(u.id);
      base44.entities.Notification.filter({ recipient_id: u.id }, '-created_date', 50)
        .then(data => { setNotifications(data); setLoading(false); });
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!userId) return;
    const unsub = base44.entities.Notification.subscribe(event => {
      if (event.type === 'create' && event.data?.recipient_id === userId) {
        setNotifications(prev => [event.data, ...prev]);
      }
      if (event.type === 'update') {
        setNotifications(prev => prev.map(n => n.id === event.id ? { ...n, ...event.data } : n));
      }
    });
    return () => unsub();
  }, [userId]);

  async function markRead(id) {
    await base44.entities.Notification.update(id, { is_read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }

  async function markAllRead() {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
            <Bell className="w-6 h-6" /> Notifications
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-secondary animate-pulse" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="font-medium text-muted-foreground">All caught up</p>
          <p className="text-sm text-muted-foreground/60 mt-1">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const cfg = TYPE_CONFIG[n.type] || { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' };
            const Icon = cfg.icon;
            return (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-xl border bg-card transition-colors cursor-pointer group",
                  !n.is_read ? "border-[hsl(var(--primary))]/20 bg-[hsl(var(--primary))]/5" : "border-border hover:bg-secondary/30"
                )}
                onClick={() => !n.is_read && markRead(n.id)}
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", cfg.bg)}>
                  <Icon className={cn("w-5 h-5", cfg.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{n.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {n.created_date ? formatDistanceToNow(new Date(n.created_date), { addSuffix: true }) : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-[hsl(var(--accent))]" />
                  )}
                  {!n.is_read && (
                    <button
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-secondary"
                      onClick={e => { e.stopPropagation(); markRead(n.id); }}
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}