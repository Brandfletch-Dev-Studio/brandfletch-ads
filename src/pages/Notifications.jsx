import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, CheckCheck, Megaphone, DollarSign, AlertCircle, Info, Filter, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const TYPE_CONFIG = {
  campaign_approved:  { icon: Megaphone,   color: 'text-green-600',  bg: 'bg-green-50',  label: 'Campaign' },
  campaign_rejected:  { icon: Megaphone,   color: 'text-red-600',    bg: 'bg-red-50',    label: 'Campaign' },
  campaign_submitted: { icon: Megaphone,   color: 'text-blue-600',   bg: 'bg-blue-50',   label: 'Campaign' },
  campaign_completed: { icon: CheckCheck,  color: 'text-green-600',  bg: 'bg-green-50',  label: 'Campaign' },
  payment_confirmed:  { icon: DollarSign,  color: 'text-green-600',  bg: 'bg-green-50',  label: 'Payment' },
  payment_rejected:   { icon: DollarSign,  color: 'text-red-600',    bg: 'bg-red-50',    label: 'Payment' },
  changes_requested:  { icon: AlertCircle, color: 'text-amber-600',  bg: 'bg-amber-50',  label: 'Action' },
  page_connected:     { icon: Info,        color: 'text-blue-600',   bg: 'bg-blue-50',   label: 'Page' },
  page_rejected:      { icon: Info,        color: 'text-red-600',    bg: 'bg-red-50',    label: 'Page' },
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'campaign', label: 'Campaign' },
  { key: 'payment', label: 'Payment' },
  { key: 'action', label: 'Action Required' },
];

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(u => {
      if (!u) return;
      setUserId(u.id);
      base44.entities.Notification.filter({ recipient_id: u.id }, '-created_date', 100)
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

  function handleNotificationClick(n) {
    if (!n.is_read) markRead(n.id);
    if (n.campaign_id) navigate(`/campaigns/${n.campaign_id}`);
    else if (n.link) navigate(n.link);
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const filtered = notifications.filter(n => {
    const cfg = TYPE_CONFIG[n.type] || {};
    if (filter === 'unread') return !n.is_read;
    if (filter === 'campaign') return cfg.label === 'Campaign';
    if (filter === 'payment') return cfg.label === 'Payment';
    if (filter === 'action') return cfg.label === 'Action';
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 lg:px-8 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-heading leading-tight">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
              )}
            </div>
            {unreadCount > 0 && (
              <Badge className="ml-1 h-5 min-w-5 text-xs px-1.5">{unreadCount}</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5 text-xs">
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </Button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="max-w-2xl mx-auto mt-3 flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {f.label}
              {f.key === 'unread' && unreadCount > 0 && (
                <span className="ml-1.5 bg-primary-foreground/20 rounded-full px-1">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 lg:px-8 py-4 space-y-2">
        {loading ? (
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 rounded-xl bg-secondary animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="font-semibold text-muted-foreground">
              {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              {filter === 'all' ? "You're all caught up!" : 'Try a different filter'}
            </p>
          </div>
        ) : (
          <>
            {filtered.map((n, idx) => {
              const cfg = TYPE_CONFIG[n.type] || { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', label: '' };
              const Icon = cfg.icon;
              const isClickable = !!(n.campaign_id || n.link);
              return (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-xl border transition-all",
                    isClickable && "cursor-pointer",
                    !n.is_read
                      ? "bg-[hsl(var(--primary))]/5 border-[hsl(var(--primary))]/20 hover:bg-[hsl(var(--primary))]/8"
                      : "bg-card border-border hover:bg-secondary/30"
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5", cfg.bg)}>
                    <Icon className={cn("w-5 h-5", cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-sm leading-snug", !n.is_read ? "font-semibold" : "font-medium")}>{n.title}</p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-[hsl(var(--accent))] flex-shrink-0" />}
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {n.created_date ? formatDistanceToNow(new Date(n.created_date), { addSuffix: true }) : ''}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                    {cfg.label && (
                      <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
                        {cfg.label}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <p className="text-center text-xs text-muted-foreground py-4">
              Showing {filtered.length} notification{filtered.length !== 1 ? 's' : ''}
            </p>
          </>
        )}
      </div>
    </div>
  );
}