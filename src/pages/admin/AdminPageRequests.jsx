import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Facebook, Check, X, ExternalLink, Clock } from 'lucide-react';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AdminPageRequests() {
  useRoleGuard(['admin', 'campaign_manager']);
  const auditLog = useAuditLog();
  const [pages, setPages] = useState([]);
  const [notes, setNotes] = useState({});
  const [processing, setProcessing] = useState({});
  const [filter, setFilter] = useState('pending_verification');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
          const data = await base44.entities.FacebookPage.list({ sort: '-created_date', limit: 100 });
          setPages(data);
    } catch (err) {
      toast.error(err?.message || "Something went wrong. Please try again.");
    }
  }

  async function updatePage(id, status, page) {
    try {
          if (page.connection_status !== 'pending_verification') {
            toast.error('This page request has already been processed.');
            return;
          }
          setProcessing(p => ({ ...p, [id]: true }));
          await base44.entities.FacebookPage.update(id, {
            connection_status: status,
            admin_notes: notes[id] || '',
          });
          auditLog(
            status === 'connected' ? 'page_approved' : 'page_rejected',
            'FacebookPage', id,
            `Page "${page.page_name}" ${status === 'connected' ? 'approved' : 'rejected'}. Notes: ${notes[id] || 'none'}`
          );
      
          if (page.user_id) {
            const notif = status === 'connected'
              ? { type: 'page_connected', title: '✅ Page Connected!', msg: `Your Facebook Page "${page.page_name}" has been successfully connected.` }
              : { type: 'page_rejected', title: '❌ Page Not Approved', msg: `Your request to connect "${page.page_name}" was not approved. ${notes[id] || ''}` };
      
            await base44.entities.Notification.create({
              recipient_id: page.user_id,
              type: notif.type,
              title: notif.title,
              message: notif.msg,
              is_read: false,
            });
          }
      
          toast.success(`Page ${status === 'connected' ? 'approved' : 'rejected'}`);
          load();
          setProcessing(p => ({ ...p, [id]: false }));
    } catch (err) {
      toast.error(err?.message || "Something went wrong. Please try again.");
    }
  }

  const filtered = pages.filter(p => filter === 'all' || p.connection_status === filter);

  const statusColors = {
    pending_verification: 'bg-amber-100 text-amber-700',
    connected: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Facebook Page Requests</h1>
        <p className="text-muted-foreground text-sm mt-1">{pages.filter(p => p.connection_status === 'pending_verification').length} pending</p>
      </div>

      <div className="flex gap-2">
        {['all', 'pending_verification', 'connected', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-all ${
              filter === f ? 'bg-[hsl(var(--primary))] text-primary-foreground' : 'bg-secondary text-muted-foreground'
            }`}>
            {f === 'all' ? 'All' : f.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map(page => (
          <Card key={page.id} className={`shadow-sm ${page.connection_status === 'pending_verification' ? 'border-amber-200' : ''}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Facebook className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{page.page_name}</p>
                    <a href={page.page_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-[hsl(var(--accent))] hover:underline flex items-center gap-1 mt-0.5">
                      {page.page_url} <ExternalLink className="w-3 h-3" />
                    </a>
                    <p className="text-xs text-muted-foreground mt-1">
                      User: {page.user_id?.slice(0, 12)}...
                      {page.created_date && ` · ${format(new Date(page.created_date), 'MMM d, yyyy')}`}
                    </p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[page.connection_status]}`}>
                  {page.connection_status?.replace(/_/g, ' ')}
                </span>
              </div>

              {page.connection_status === 'pending_verification' && (
                <div className="space-y-3 pt-3 border-t border-border">
                  <Textarea
                    value={notes[page.id] || ''}
                    onChange={e => setNotes(n => ({ ...n, [page.id]: e.target.value }))}
                    placeholder="Optional notes (sent to client)"
                    rows={2}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => updatePage(page.id, 'connected', page)}
                      disabled={processing[page.id]}
                      className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="w-4 h-4" /> Approve
                    </Button>
                    <Button
                      onClick={() => updatePage(page.id, 'rejected', page)}
                      disabled={processing[page.id]}
                      variant="outline"
                      className="flex-1 gap-2 border-red-400 text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" /> Reject
                    </Button>
                  </div>
                </div>
              )}

              {page.admin_notes && (
                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border italic">{page.admin_notes}</p>
              )}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No page requests found</p>
          </div>
        )}
      </div>
    </div>
  );
}