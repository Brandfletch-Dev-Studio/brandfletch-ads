import { toast } from 'sonner';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Send, MessageCircle, Paperclip, X, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';

function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

function Avatar({ name, size = 'md' }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  const sz = size === 'md' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs';
  return (
    <div className={cn('rounded-full bg-[hsl(var(--primary))] text-primary-foreground flex items-center justify-center font-semibold flex-shrink-0', sz)}>
      {initials}
    </div>
  );
}

export default function AdminMessages() {
  const [allMessages, setAllMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [users, setUsers] = useState({});
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [adminUser, // setAdminUser] = useState(null);
  const [search, setSearch] = useState('');
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'
  const bottomRef = useRef(null);

  const { user: adminUser } = useAuth();

  useEffect(() => {
    base44.entities.User.list({}).then(us => {
      const map = {};
      us.forEach(u => { map[u.id] = u; });
      setUsers(map);
    });
    base44.entities.Message.list({ sort: '-created_date', limit: 500 }).then(msgs => {
      setAllMessages(msgs.reverse());
    });

    const unsub = base44.entities.Message.subscribe(event => {
      if (event.type === 'create') setAllMessages(prev => [...prev, event.data]);
      if (event.type === 'update') setAllMessages(prev => prev.map(m => m.id === event.id ? event.data : m));
    });
    return () => unsub();
  }, []);

  // Build conversation list from messages
  useEffect(() => {
    const map = {};
    allMessages.forEach(msg => {
      const uid = msg.conversation_user_id;
      if (!uid) return;
      if (!map[uid]) map[uid] = { userId: uid, messages: [], unread: 0 };
      map[uid].messages.push(msg);
      if (msg.sender_role === 'user' && !msg.is_read) map[uid].unread++;
    });
    const list = Object.values(map).sort((a, b) => {
      const aLast = a.messages[a.messages.length - 1]?.created_date || 0;
      const bLast = b.messages[b.messages.length - 1]?.created_date || 0;
      return new Date(bLast) - new Date(aLast);
    });
    setConversations(list);
    // Do NOT auto-select — let admin choose from the list
  }, [allMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedUserId, allMessages]);

  // Mark messages as read when selecting a conversation
  useEffect(() => {
    if (!selectedUserId) return;
    allMessages
      .filter(m => m.conversation_user_id === selectedUserId && m.sender_role === 'user' && !m.is_read)
      .forEach(m => base44.entities.Message.update(m.id, { is_read: true }).catch((err) => toast.error('Failed to mark messages as read')));
  }, [selectedUserId]);

  async function handleUpload(e) {
    try {
      const file = e.target.files[0];
      if (!file) return;
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAttachment(file_url);
      setUploading(false);
    } catch (err) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
    }
  }

  async function handleSend(e) {
    try {
      e.preventDefault();
      if (!input.trim() && !attachment) return;
      if (!selectedUserId) return;
      setSending(true);
      await base44.entities.Message.create({
        sender_id: adminUser.id,
        sender_name: adminUser.full_name || 'Support',
        sender_role: 'admin',
        content: input.trim(),
        attachment_url: attachment || '',
        is_read: false,
        conversation_user_id: selectedUserId,
      });
      setInput('');
      setAttachment(null);
      setSending(false);
    } catch (err) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
    }
  }

  const selectedConvo = conversations.find(c => c.userId === selectedUserId);
  const selectedUser = users[selectedUserId];
  const threadMessages = selectedConvo?.messages || [];

  const filteredConvos = conversations.filter(c => {
    const u = users[c.userId];
    const name = u?.full_name || u?.email || c.userId;
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Sidebar - conversation list */}
      <div className={cn(
        "flex flex-col border-r border-border bg-card w-full md:w-80 flex-shrink-0",
        mobileView === 'chat' ? 'hidden md:flex' : 'flex'
      )}>
        {/* Sidebar header */}
        <div className="px-4 pt-4 pb-3 border-b border-border flex-shrink-0">
          <h1 className="font-bold text-lg mb-3">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="pl-9 h-9 bg-secondary border-0 rounded-xl text-sm"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filteredConvos.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-12 px-4">
              <MessageCircle className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
            </div>
          )}
          {filteredConvos.map(convo => {
            const u = users[convo.userId];
            const name = u?.full_name || u?.email || 'Unknown User';
            const lastMsg = convo.messages[convo.messages.length - 1];
            const isSelected = selectedUserId === convo.userId;
            return (
              <button
                key={convo.userId}
                onClick={() => {
                  setSelectedUserId(convo.userId);
                  setMobileView('chat');
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors text-left",
                  isSelected && "bg-secondary"
                )}
              >
                <Avatar name={name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">{name}</span>
                    <span className="text-[11px] text-muted-foreground flex-shrink-0">
                      {formatTime(lastMsg?.created_date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground truncate flex-1">
                      {lastMsg?.sender_role === 'admin' ? 'You: ' : ''}{lastMsg?.content || 'Attachment'}
                    </p>
                    {convo.unread > 0 && (
                      <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-[hsl(var(--primary))] text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
                        {convo.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat panel */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0",
        mobileView === 'list' ? 'hidden md:flex' : 'flex'
      )}>
        {!selectedUserId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 text-muted-foreground">
            <MessageCircle className="w-14 h-14 text-muted-foreground/20" />
            <div>
              <p className="font-medium">Select a conversation</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Choose a business from the list to start chatting</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
              <button onClick={() => setMobileView('list')} className="md:hidden p-1 -ml-1 text-muted-foreground">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Avatar name={selectedUser?.full_name || selectedUser?.email} size="sm" />
              <div>
                <p className="font-semibold text-sm">{selectedUser?.full_name || selectedUser?.email || 'Unknown'}</p>
                <p className="text-xs text-muted-foreground">{selectedUser?.email}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {threadMessages.map((msg, idx) => {
                const isAdmin = msg.sender_role === 'admin';
                const showDate = idx === 0 || (
                  new Date(msg.created_date).toDateString() !== new Date(threadMessages[idx - 1]?.created_date).toDateString()
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
                    <div className={cn("flex gap-2", isAdmin ? "justify-end" : "justify-start")}>
                      {!isAdmin && <Avatar name={selectedUser?.full_name || selectedUser?.email} size="sm" />}
                      <div className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                        isAdmin
                          ? "bg-[hsl(var(--primary))] text-primary-foreground rounded-br-sm"
                          : "bg-card border border-border rounded-bl-sm"
                      )}>
                        {msg.content && <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                        {msg.attachment_url && (
                          <a href={msg.attachment_url} target="_blank" rel="noreferrer" className="mt-2 block">
                            <img src={msg.attachment_url} alt="attachment" className="rounded-lg max-h-48 w-auto" />
                          </a>
                        )}
                        <p className={cn("text-[10px] mt-1 text-right", isAdmin ? "text-primary-foreground/60" : "text-muted-foreground")}>
                          {msg.created_date ? format(new Date(msg.created_date), 'HH:mm') : ''}
                          {isAdmin && msg.is_read && <span className="ml-1 text-primary-foreground/80">✓✓</span>}
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
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e); }}
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
          </>
        )}
      </div>
    </div>
  );
}