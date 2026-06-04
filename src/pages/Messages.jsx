import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import SupportConversationList from '@/components/support/SupportConversationList';
import SupportChatPanel from '@/components/support/SupportChatPanel';

export default function Messages() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    loadConversations();
    const unsub = base44.entities.Message.subscribe(event => {
      if (event.type === 'create') {
        loadConversations();
        if (activeConversation) {
          loadMessages(activeConversation);
        }
      }
    });
    return () => unsub();
  }, [activeConversation]);

  async function loadConversations() {
    try {
      const u = await base44.auth.me();
      setUser(u);
      const allMessages = await base44.entities.Message.filter({ conversation_user_id: u.id }, '-created_date', 500);
      
      const grouped = {};
      allMessages.forEach(msg => {
        const date = msg.created_date?.split('T')[0] || 'unknown';
        if (!grouped[date]) {
          grouped[date] = {
            id: date,
            subject: `Support - ${date}`,
            status: 'open',
            created_date: msg.created_date,
            updated_date: msg.created_date,
            message_count: 0,
            last_message: null,
            _messages: [],
          };
        }
        grouped[date].message_count++;
        grouped[date].last_message = msg;
        grouped[date].updated_date = msg.created_date;
        grouped[date]._messages.push(msg);
      });

      const convs = Object.values(grouped).sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));
      setConversations(convs);
      
      if (convs.length > 0 && !activeConversation) {
        setActiveConversation(convs[0]);
        setMessages(convs[0]._messages.reverse());
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(conv) {
    try {
      const msgs = conv._messages || await base44.entities.Message.filter({ conversation_user_id: user.id }, '-created_date', 100);
      setMessages(msgs.reverse());
      msgs.filter(m => m.sender_role === 'admin' && !m.is_read).forEach(m => {
        base44.entities.Message.update(m.id, { is_read: true }).catch(() => {});
      });
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }

  async function handleSend(content, attachment) {
    try {
      await base44.entities.Message.create({
        sender_id: user.id,
        sender_name: user.full_name || user.email,
        sender_role: 'user',
        content,
        attachment_url: attachment || '',
        is_read: false,
        conversation_user_id: user.id,
      });
      loadConversations();
      if (activeConversation) {
        loadMessages(activeConversation);
      }
    } catch (err) {
      toast.error('Failed to send message');
    }
  }

  function handleSelect(conv) {
    setActiveConversation(conv);
    loadMessages(conv);
  }

  function handleBack() {
    setActiveConversation(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[hsl(var(--primary))] flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">Support</h1>
            <p className="text-xs text-muted-foreground">Get help with your campaigns</p>
          </div>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          New Request
        </Button>
      </div>

      {/* Content */}
      <div className="flex h-full">
        {/* Conversation list */}
        <div className={cn(
          "w-full lg:w-80 border-r border-border bg-card flex-shrink-0",
          isMobile && activeConversation && "hidden"
        )}>
          <SupportConversationList
            conversations={conversations}
            activeId={activeConversation?.id}
            onSelect={handleSelect}
          />
        </div>

        {/* Chat panel */}
        <div className={cn(
          "flex-1",
          isMobile && !activeConversation && "hidden"
        )}>
          <SupportChatPanel
            conversation={activeConversation}
            messages={messages}
            onSend={handleSend}
            onBack={handleBack}
            isMobile={isMobile}
          />
        </div>
      </div>
    </div>
  );
}