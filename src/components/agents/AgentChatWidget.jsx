import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function AgentChatWidget({ agentName = 'campaign_setup_assistant', triggerPrompt = "Need help starting your first campaign?" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && !conversation) {
      startConversation();
    }
  }, [isOpen]);

  useEffect(() => {
    if (conversation?.id) {
      const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
        setMessages(data.messages || []);
      });
      return () => unsubscribe();
    }
  }, [conversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function startConversation() {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: agentName,
        metadata: {
          name: 'Campaign Setup Help',
          description: 'User needs help with campaign creation',
        },
      });
      setConversation(conv);
    } catch (err) {
      console.error('Failed to start conversation:', err);
    }
  }

  async function sendMessage() {
    if (!input.trim() || !conversation) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: userMessage,
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 lg:bottom-8 right-4 lg:right-8 z-40 h-14 w-14 rounded-full bg-[hsl(var(--primary))] text-white shadow-lg hover:bg-[hsl(var(--primary))/90] transition-all flex items-center justify-center gap-2 group"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="max-w-0 group-hover:max-w-[200px] overflow-hidden whitespace-nowrap transition-all duration-300 text-sm font-medium">
          {triggerPrompt}
        </span>
      </button>

      {/* Chat panel */}
      {isOpen && (
        <Card className="fixed bottom-24 lg:bottom-24 right-4 lg:right-8 z-50 w-[90vw] lg:w-[400px] max-h-[600px] flex flex-col shadow-2xl border-2 border-[hsl(var(--primary))/20]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary))/90] text-white rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-sm">Campaign Assistant</p>
                <p className="text-xs text-white/80">Here to help you get started</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background min-h-[300px]">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-8">
                <Sparkles className="w-8 h-8 mb-3 opacity-30" />
                <p className="text-sm font-medium">Start a conversation</p>
                <p className="text-xs mt-1 opacity-70">Ask about packages, targeting, or campaign setup</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex gap-2",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role !== 'user' && (
                    <div className="h-7 w-7 rounded-full bg-[hsl(var(--primary))/10] flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                      msg.role === 'user'
                        ? "bg-[hsl(var(--primary))] text-white"
                        : "bg-secondary text-foreground"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Assistant is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t bg-background rounded-b-xl">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                rows={1}
                className="flex-1 resize-none bg-secondary border-0 rounded-xl px-3 py-2.5 text-sm focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))] min-h-[40px] max-h-[120px]"
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="h-10 w-10 rounded-xl flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}