import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Upload, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function DesignChatComponent({ designRequestId, readOnly = false }) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: messages, isLoading } = useQuery({
    queryKey: ['designChat', designRequestId],
    queryFn: () => base44.entities.DesignChat.filter({ design_request_id: designRequestId }, 'created_date'),
    enabled: !!designRequestId,
    initialData: [],
  });

  // BUG FIX (2026-07-03): this mutation had no onSuccess/onError at all, and
  // handleSend called toast.success('Message sent!') unconditionally right
  // after firing .mutate() (not inside onSuccess) — so a message that failed
  // to actually send (network blip, DB error) still told the user it was
  // sent. It also never cleared the message/file input afterwards and never
  // invalidated the chat query, so the composer stayed pre-filled and the
  // new message could take a while to actually show up on screen.
  const sendMessageMutation = useMutation({
    mutationFn: async (msgData) => {
      await base44.entities.DesignChat.create(msgData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designChat', designRequestId] });
      setMessage('');
      setFiles([]);
      toast.success('Message sent!');
    },
    onError: () => toast.error('Message could not be sent — please try again.'),
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() && files.length === 0) return;

    let fileUrls = [];
    if (files.length > 0) {
      try {
        const uploadPromises = files.map(f => base44.integrations.Core.UploadFile({ file: f }));
        const results = await Promise.all(uploadPromises);
        fileUrls = results.map(r => r.file_url);
      } catch {
        toast.error('One or more files failed to upload — please try again.');
        return;
      }
    }

    sendMessageMutation.mutate({
      design_request_id: designRequestId,
      sender_id: user.id,
      sender_role: user.role === 'designer' ? 'designer' : user.role === 'admin' ? 'admin' : 'client',
      message: message.trim(),
      file_urls: fileUrls,
      is_read: false,
    });
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (isLoading) return <div className="p-4 text-center text-muted-foreground">Loading chat...</div>;

  return (
    <div className="flex flex-col h-[500px] border rounded-xl bg-background">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-xl p-3 ${
                  isMe ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                }`}>
                  {msg.sender_role && !isMe && (
                    <p className="text-xs font-semibold mb-1 capitalize opacity-70">{msg.sender_role}</p>
                  )}
                  {msg.message && <p className="text-sm">{msg.message}</p>}
                  {msg.file_urls?.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.file_urls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs bg-background/20 rounded px-2 py-1 hover:opacity-80"
                        >
                          <File className="w-3 h-3" />
                          Attachment {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                  <p className="text-xs opacity-60 mt-1">
                    {new Date(msg.created_date).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!readOnly && (
        <div className="border-t p-3 space-y-2">
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center gap-1 bg-secondary px-2 py-1 rounded text-xs">
                  <File className="w-3 h-3" />
                  {file.name.slice(0, 20)}
                  <button onClick={() => removeFile(idx)} className="hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <label className="cursor-pointer">
              <input type="file" multiple className="hidden" onChange={handleFileSelect} />
              <Button type="button" variant="outline" size="icon" className="flex-shrink-0">
                <Upload className="w-4 h-4" />
              </Button>
            </label>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            />
            <Button onClick={handleSend} size="icon" disabled={sendMessageMutation.isPending}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}