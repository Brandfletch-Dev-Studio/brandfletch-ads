import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Facebook, Plus, CheckCircle2, XCircle, Clock, ExternalLink, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function isFacebookUrl(url) {
  return /^https?:\/\/(www\.)?(facebook\.com|fb\.com)(\/.*)?$/i.test(url.trim());
}

export default function FacebookPages() {
  // Bug fix: use AuthContext user instead of re-calling base44.auth.me()
  const { user, isLoadingAuth } = useAuth();
  const [pages, setPages] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [form, setForm] = useState({ page_name: '', page_url: '' });
  const [urlTouched, setUrlTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const urlValid = isFacebookUrl(form.page_url);
  const showUrlError = urlTouched && form.page_url && !urlValid;
  const showUrlSuccess = form.page_url && urlValid;

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!user?.id) return;
    loadPages(user.id);
  }, [user?.id, isLoadingAuth]);

  async function loadPages(uid) {
    try {
      const data = await base44.entities.FacebookPage.filter({ created_by: uid }, { sort: '-created_date' });
      setPages(data);
    } catch (err) {
      console.error('Failed to load pages:', err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.page_name.trim() || !form.page_url.trim()) return;
    if (!urlValid) { toast.error('Please enter a valid Facebook page URL'); return; }
    setSubmitting(true);
    try {
      await base44.entities.FacebookPage.create({
        ...form,
        user_id: user.id,
        connection_status: 'pending_verification',
      });
      toast.success('Page submitted for verification!');
      setShowAddDialog(false);
      setForm({ page_name: '', page_url: '' });
      setUrlTouched(false);
      loadPages(user.id);
    } catch (err) {
      toast.error('Failed to submit page. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const ChecklistItem = ({ label, status, icon: Icon }) => (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm">{label}</span>
      </div>
      {status ? (
        <span className="flex items-center gap-1 text-xs font-medium text-green-600">
          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
        </span>
      ) : (
        <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
          <AlertCircle className="w-3.5 h-3.5" /> Action Required
        </span>
      )}
    </div>
  );

  if (isLoadingAuth) {
    return (
      <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-3">
        {[1, 2].map(i => <div key={i} className="h-28 rounded-xl bg-secondary animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Facebook Pages</h1>
          <p className="text-muted-foreground text-sm mt-1">Connect your Facebook pages to run ad campaigns</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2 bg-[hsl(var(--primary))] text-primary-foreground">
          <Plus className="w-4 h-4" /> Add Page
        </Button>
      </div>

      {pages.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Facebook className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No pages connected yet</h3>
            <p className="text-muted-foreground text-sm mb-6">Connect your Facebook Business Page to start running ads.</p>
            <Button onClick={() => setShowAddDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Connect a Page
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pages.map(page => (
            <Card key={page.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Facebook className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{page.page_name}</p>
                      <a href={page.page_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-[hsl(var(--accent))] flex items-center gap-1 mt-0.5">
                        {page.page_url} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {page.connection_status === 'connected' && (
                      <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                      </span>
                    )}
                    {page.connection_status === 'pending_verification' && (
                      <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                        <Clock className="w-3.5 h-3.5" /> Pending
                      </span>
                    )}
                    {page.connection_status === 'rejected' && (
                      <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                        <XCircle className="w-3.5 h-3.5" /> Rejected
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Page Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect a Facebook Page</DialogTitle>
            <DialogDescription>Enter your Facebook Business Page details for verification.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <Label className="mb-1.5 block">Page Name *</Label>
              <Input
                value={form.page_name}
                onChange={e => setForm(f => ({ ...f, page_name: e.target.value }))}
                placeholder="e.g. Chisomo's Boutique"
                required
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Facebook Page URL *</Label>
              <Input
                value={form.page_url}
                onChange={e => setForm(f => ({ ...f, page_url: e.target.value }))}
                onBlur={() => setUrlTouched(true)}
                placeholder="https://facebook.com/yourpage"
                required
                className={cn(
                  showUrlError && 'border-destructive focus-visible:ring-destructive',
                  showUrlSuccess && 'border-green-500 focus-visible:ring-green-500'
                )}
              />
              {showUrlError && <p className="text-xs text-destructive mt-1">Please enter a valid Facebook URL</p>}
              {showUrlSuccess && <p className="text-xs text-green-600 mt-1">✓ Valid Facebook URL</p>}
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting} className="flex-1 bg-[hsl(var(--primary))] text-primary-foreground">
                {submitting ? 'Submitting...' : 'Submit for Verification'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
