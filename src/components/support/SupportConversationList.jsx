import { format } from 'date-fns';
import { MessageCircle, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SupportConversationList({ conversations, activeId, onSelect }) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <MessageCircle className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <p className="font-medium text-muted-foreground text-sm">No conversations yet</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Start a new conversation to get support</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {conversations.map((conv) => {
        const isActive = conv.id === activeId;
        const lastMsg = conv.last_message;
        const statusConfig = {
          open: { color: 'text-green-600', bg: 'bg-green-500', label: 'Open' },
          pending: { color: 'text-amber-600', bg: 'bg-amber-500', label: 'Pending' },
          resolved: { color: 'text-muted-foreground', bg: 'bg-muted-foreground', label: 'Resolved' },
        };
        const status = statusConfig[conv.status] || statusConfig.open;

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={cn(
              "w-full p-4 text-left hover:bg-secondary/50 transition-colors",
              isActive && "bg-secondary"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn("w-2 h-2 rounded-full mt-2 flex-shrink-0", status.bg)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className={cn("font-medium text-sm truncate", isActive ? "text-foreground" : "text-foreground")}>
                    {conv.subject}
                  </h3>
                  <span className={cn("text-xs font-medium", status.color)}>
                    {status.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mb-2">
                  {lastMsg?.content || 'No messages'}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(conv.updated_date), 'MMM d, HH:mm')}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    {conv.message_count} {conv.message_count === 1 ? 'msg' : 'msgs'}
                  </span>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}