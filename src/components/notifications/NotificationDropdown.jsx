import { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, Megaphone, DollarSign, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const TYPE_CONFIG = {
  campaign_approved:          { icon: Megaphone,     color: 'text-green-600',  bg: 'bg-green-50' },
  campaign_rejected:          { icon: Megaphone,     color: 'text-red-600',    bg: 'bg-red-50' },
  campaign_submitted:         { icon: Megaphone,     color: 'text-blue-600',   bg: 'bg-blue-50' },
  campaign_completed:         { icon: CheckCheck,    color: 'text-green-600',  bg: 'bg-green-50' },
  payment_confirmed:          { icon: DollarSign,    color: 'text-green-600',  bg: 'bg-green-50' },
  payment_rejected:           { icon: DollarSign,    color: 'text-red-600',    bg: 'bg-red-50' },
  changes_requested:          { icon: AlertCircle,   color: 'text-amber-600',  bg: 'bg-amber-50' },
  page_connected:             { icon: Info,          color: 'text-blue-600',   bg: 'bg-blue-50' },
  page_rejected:              { icon: Info,          color: 'text-red-600',    bg: 'bg-red-50' },
  design_submitted:           { icon: Info,          color: 'text-blue-600',   bg: 'bg-blue-50' },
  design_in_progress:         { icon: Info,          color: 'text-blue-600',   bg: 'bg-blue-50' },
  design_awaiting_feedback:   { icon: AlertCircle,   color: 'text-purple-600', bg: 'bg-purple-50' },
  design_revision_requested:  { icon: AlertCircle,   color: 'text-orange-600', bg: 'bg-orange-50' },
  design_delivered:           { icon: CheckCheck,    color: 'text-green-600',  bg: 'bg-green-50' },
  design_completed:           { icon: CheckCheck,    color: 'text-green-600',  bg: 'bg-green-50' },
  welcome:                    { icon: Info,          color: 'text-blue-600',   bg: 'bg-blue-50' },
};

function LiveTime({ date }) {
  const [label, setLabel] = useState('');

  useEffect(() => {
    function update() {
      if (!date) return;
      setLabel(formatDistanceToNow(new Date(date), { addSuffix: true }));
    }
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [date]);

  return <span className="text-[11px] text-muted-foreground">{label}</span>;
}

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      if (!u) return;
      setUserId(u.id);
      loadNotifications(u.id);
    }).catch(() => {});
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Real-time subscription
  useEffect(() => {
    const unsub = base44.entities.Notification.subscribe(event => {
      if (event.type === 'create' && event.data?.recipient_id === userId) {
        setNotifications(prev => [event.data, ...prev]);
      }
      if (event.type === 'update') {
        setNotifications(prev => prev.filter(n => n.id !== event.id || !event.data?.is_read));
      }
    });
    return () => unsub();
  }, [userId]);

  async function loadNotifications(uid) {
    const data = await base44.entities.Notification.filter(
      { recipient_id: uid, is_read: false }, '-created_date', 20
    );
    setNotifications(data);
  }

  async function markRead(id) {
    await base44.entities.Notification.update(id, { is_read: true });
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  async function markAllRead() {
    await Promise.all(notifications.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications([]);
  }

  const unread = notifications.length;

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="relative w-10 h-10"
        onClick={() => setOpen(o => !o)}
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold px-1">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-12 w-96 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unread > 0 && <p className="text-xs text-muted-foreground">{unread} unread</p>}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-muted-foreground" onClick={markAllRead}>
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[440px] overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">All caught up</p>
                <p className="text-xs text-muted-foreground/70 mt-1">No new notifications</p>
              </div>
            ) : (
              notifications.map(n => {
                const cfg = TYPE_CONFIG[n.type] || { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' };
                const Icon = cfg.icon;
                return (
                  <div
                    key={n.id}
                    className={cn("flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors cursor-pointer group")}
                    onClick={() => markRead(n.id)}
                  >
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5", cfg.bg)}>
                      <Icon className={cn("w-4 h-4", cfg.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                      <LiveTime date={n.created_date} />
                    </div>
                    <button
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-secondary"
                      onClick={e => { e.stopPropagation(); markRead(n.id); }}
                    >
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}