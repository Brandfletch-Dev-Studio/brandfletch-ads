import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u) loadNotifications(u.id);
    }).catch(() => {});
  }, []);

  async function loadNotifications(userId) {
    const data = await base44.entities.Notification.filter(
      { recipient_id: userId, is_read: false }, '-created_date', 10
    );
    setNotifications(data);
  }

  async function markRead(id) {
    await base44.entities.Notification.update(id, { is_read: true });
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[hsl(var(--accent))] text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="font-semibold">Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No new notifications
          </div>
        ) : (
          notifications.slice(0, 6).map(n => (
            <DropdownMenuItem
              key={n.id}
              onClick={() => markRead(n.id)}
              className="flex flex-col items-start gap-1 py-3 cursor-pointer"
            >
              <p className="text-sm font-medium leading-tight">{n.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(n.created_date), { addSuffix: true })}
              </p>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}