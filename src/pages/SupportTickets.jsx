import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Ticket, Clock, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function SupportTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    category: 'general'
  });

  useEffect(() => {
    base44.entities.SupportTicket.list('-created_date', 100).then(t => {
      setTickets(t);
      setLoading(false);
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await base44.entities.SupportTicket.create({
        user_id: user.id,
        user_name: user.full_name,
        user_email: user.email,
        ...formData,
        status: 'open'
      });
      toast.success('Ticket created successfully!');
      setCreating(false);
      setFormData({ subject: '', description: '', priority: 'medium', category: 'general' });
      setTickets(prev => [
        { ...prev[0], id: Date.now().toString(), created_date: new Date().toISOString() },
        ...prev.slice(0)
      ]);
    } catch (error) {
      toast.error('Failed to create ticket');
    }
  }

  const getStatusConfig = (status) => {
    const configs = {
      open: { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle, label: 'Open' },
      in_progress: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, label: 'In Progress' },
      resolved: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: 'Resolved' },
      closed: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Ticket, label: 'Closed' }
    };
    return configs[status] || configs.open;
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700'
    };
    return configs[priority] || configs.medium;
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8 max-w-5xl mx-auto">
        <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-32 rounded-xl bg-secondary animate-pulse" />)}</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
            <Ticket className="w-6 h-6" /> Support Tickets
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Track and manage your support requests</p>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={e => setFormData(d => ({ ...d, subject: e.target.value }))}
                  placeholder="Brief summary of your issue"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={v => setFormData(d => ({ ...d, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Inquiry</SelectItem>
                    <SelectItem value="technical">Technical Issue</SelectItem>
                    <SelectItem value="billing">Billing Question</SelectItem>
                    <SelectItem value="feature_request">Feature Request</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={v => setFormData(d => ({ ...d, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData(d => ({ ...d, description: e.target.value }))}
                  placeholder="Describe your issue in detail..."
                  className="min-h-[120px]"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
                <Button type="submit">Submit Ticket</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Ticket className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No tickets yet</p>
            <p className="text-sm mt-1">Create your first support ticket to get help</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => {
            const StatusIcon = getStatusConfig(ticket.status).icon;
            return (
              <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold text-sm truncate">{ticket.subject}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityConfig(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">· {ticket.category.replace('_', ' ')}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{ticket.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Created: {new Date(ticket.created_date).toLocaleDateString()}</span>
                        {ticket.resolved_date && <span>Resolved: {new Date(ticket.resolved_date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${getStatusConfig(ticket.status).color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {getStatusConfig(ticket.status).label}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}