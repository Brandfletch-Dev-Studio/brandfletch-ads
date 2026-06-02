import { useState, useEffect, useRef } from 'react';
import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Upload, MessageCircle, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      base44.entities.Message.list('-created_date', 100).then(msgs => {
        setMessages(msgs.reverse());
        // Mark unread messages (from admin) as read
        msgs.filter(m => m.sender_id !== u.id && !m.is_read).forEach(m => {
          base44.entities.Message.update(m.id, { is_read: true }).catch(() => {});
        });
      });
    });

    const unsub = base44.entities.Message.subscribe(event => {
      if (event.type === 'create') {
        setMessages(prev => [...prev, event.data]);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setAttachment(file_url);
    setUploading(false);
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() && !attachment) return;
    setSending(true);
    const isStaff = ['admin', 'campaign_manager', 'finance'].includes(user?.role);
    await base44.entities.Message.create({
      sender_id: user.id,
      sender_name: user.full_name || user.email,
      sender_role: isStaff ? 'admin' : 'user',
      content: input.trim(),
      attachment_url: attachment || '',
      is_read: false,
    });
    setInput('');
    setAttachment(null);
    setSending(false);
  }

  const isStaff = ['admin', 'campaign_manager', 'finance'].includes(user?.role);

  function isMyMessage(msg) {
    return isStaff ? msg.sender_role === 'admin' : msg.sender_role === 'user';
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] lg:h-[calc(100vh-4rem)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-[hsl(var(--primary))] flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-semibold text-sm">Brandfletch Media</h1>
          <p className="text-xs text-muted-foreground">Your campaign team</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-green-600 font-medium">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Online
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
            <MessageCircle className="w-12 h-12 text-muted-foreground/30" />
            <div>
              <p className="font-medium text-muted-foreground">No messages yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Send us a message and we'll respond shortly.</p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => {
          const mine = isMyMessage(msg);
          const showDate = idx === 0 || (
            new Date(msg.created_date).toDateString() !== new Date(messages[idx - 1]?.created_date).toDateString()
          );
          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-2">
                  <span className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                    {format(new Date(msg.created_date), 'MMMM d, yyyy')}
                  </span>
                </div>
              )}
              <div className={cn("flex gap-2", mine ? "justify-end" : "justify-start")}>
                {!mine && (
                  <div className="w-7 h-7 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0 mt-auto">
                    B
                  </div>
                )}
                <div className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                  mine
                    ? "bg-[hsl(var(--primary))] text-primary-foreground rounded-br-sm"
                    : "bg-card border border-border rounded-bl-sm"
                )}>
                  {msg.content && <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                  {msg.attachment_url && (
                    <a href={msg.attachment_url} target="_blank" rel="noreferrer" className="mt-2 block">
                      <img src={msg.attachment_url} alt="attachment" className="rounded-lg max-h-48 w-auto" />
                    </a>
                  )}
                  <p className={cn("text-[10px] mt-1", mine ? "text-primary-foreground/60 text-right" : "text-muted-foreground text-right")}>
                    {msg.created_date ? format(new Date(msg.created_date), 'HH:mm') : ''}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-card flex-shrink-0">
        {attachment && (
          <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-secondary text-xs">
            <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground truncate flex-1">Attachment ready</span>
            <button onClick={() => setAttachment(null)}><X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" /></button>
          </div>
        )}
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <label className="flex-shrink-0 cursor-pointer text-muted-foreground hover:text-foreground transition-colors p-2">
            <Paperclip className="w-5 h-5" />
            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full h-10 bg-secondary border-0 focus-visible:ring-1"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { handleSend(e); } }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={sending || uploading || (!input.trim() && !attachment)}
            className="rounded-full w-10 h-10 bg-[hsl(var(--primary))] text-primary-foreground flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}