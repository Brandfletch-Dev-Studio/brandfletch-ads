import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Upload, Paperclip, X, ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function SupportChatPanel({ conversation, messages, onSend, onBack, isMobile }) {
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);

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
    if (e) e.preventDefault();
    if (!input.trim() && !attachment) return;
    await onSend(input.trim(), attachment);
    setInput('');
    setAttachment(null);
  }

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <ArrowLeft className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-1">Select a conversation</h3>
        <p className="text-sm text-muted-foreground">Choose a support thread from the list to view messages.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
        {isMobile && (
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-secondary rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
        <div className="w-9 h-9 rounded-xl bg-[hsl(var(--primary))] flex items-center justify-center">
          <svg className="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0a9 9 0 01-12.728 0m12.728 0V3m0 18a9 9 0 01-12.728 0m12.728 0H3" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm truncate">{conversation.subject || 'Support Request'}</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {format(new Date(conversation.created_date), 'MMM d, yyyy')}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-muted/30">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center">
              <svg className="w-8 h-8 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">No messages yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Start the conversation below.</p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.sender_role === 'user';
            const showDate = idx === 0 || (
              new Date(msg.created_date).toDateString() !== new Date(messages[idx - 1]?.created_date).toDateString()
            );
            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex justify-center my-2">
                    <span className="text-xs text-muted-foreground bg-white px-3 py-1 rounded-full shadow-sm">
                      {format(new Date(msg.created_date), 'MMMM d, yyyy')}
                    </span>
                  </div>
                )}
                <div className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}>
                  {!isUser && (
                    <div className="w-7 h-7 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-auto">
                      S
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                    isUser
                      ? "bg-[hsl(var(--primary))] text-white rounded-br-md"
                      : "bg-white border border-border rounded-bl-md"
                  )}>
                    {msg.content && <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                    {msg.attachment_url && (
                      <a href={msg.attachment_url} target="_blank" rel="noreferrer" className="mt-2 block">
                        <img src={msg.attachment_url} alt="attachment" className="rounded-lg max-h-48 w-auto object-cover" />
                      </a>
                    )}
                    <p className={cn("text-[10px] mt-1.5", isUser ? "text-white/70 text-right" : "text-muted-foreground")}>
                      {format(new Date(msg.created_date), 'HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-card flex-shrink-0">
        {attachment && (
          <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-secondary text-xs">
            <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground truncate flex-1">Attachment ready</span>
            <button onClick={() => setAttachment(null)} className="hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <label className="flex-shrink-0 cursor-pointer text-muted-foreground hover:text-foreground transition-colors p-2">
            <Paperclip className="w-5 h-5" />
            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 h-10 px-4 rounded-full bg-secondary border-0 text-sm focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))] outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() && !attachment}
            className="rounded-full w-10 h-10 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}