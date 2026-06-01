import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Facebook, Plus, CheckCircle2, XCircle, Clock, ExternalLink, AlertCircle, MessageSquare, Mail, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function FacebookPages() {
  const [pages, setPages] = useState([]);
  const [user, setUser] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [form, setForm] = useState({ page_name: '', page_url: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const u = await base44.auth.me();
    setUser(u);
    loadPages(u.id);
  }

  async function loadPages(uid) {
    const data = await base44.entities.FacebookPage.filter({ user_id: uid }, '-created_date');
    setPages(data);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.page_name.trim() || !form.page_url.trim()) return;
    setSubmitting(true);
    await base44.entities.FacebookPage.create({
      ...form,
      user_id: user.id,
      connection_status: 'pending_verification',
    });
    toast.success('Page submitted for verification!');
    setShowAddDialog(false);
    setForm({ page_name: '', page_url: '' });
    loadPages(user.id);
    setSubmitting(false);
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

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Facebook Pages</h1>
          <p className="text-muted-foreground text-sm mt-1">Connect and manage your Facebook Business Pages</p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="gap-2 bg-[hsl(var(--primary))] text-primary-foreground"
        >
          <Plus className="w-4 h-4" /> Add Page
        </Button>
      </div>

      {pages.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="py-16 text-center">
            <Facebook className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No pages connected yet</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              Connect your Facebook Business Page to start creating advertising campaigns.
            </p>
            <Button onClick={() => setShowAddDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Add Your First Page
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pages.map(page => (
            <Card key={page.id} className="shadow-sm">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Facebook className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{page.page_name}</h3>
                      <a href={page.page_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-[hsl(var(--accent))] hover:underline flex items-center gap-1 mt-0.5">
                        {page.page_url} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                    page.connection_status === 'connected' ? 'bg-green-100 text-green-700' :
                    page.connection_status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {page.connection_status === 'connected' ? '✓ Connected' :
                     page.connection_status === 'rejected' ? '✕ Rejected' : '⏳ Pending Verification'}
                  </span>
                </div>

                {/* Checklist */}
                <div className="mt-4 border-t border-border pt-4 space-y-0 divide-y divide-border/50">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-2">Page Checklist</h4>
                  <ChecklistItem label="Page Connection" status={page.connection_status === 'connected'} icon={Facebook} />
                  <ChecklistItem label="WhatsApp Business" status={page.whatsapp_verified} icon={MessageSquare} />
                  <ChecklistItem label="Business Email" status={page.business_email_verified} icon={Mail} />
                  <ChecklistItem label="Campaign Ready" status={page.campaign_ready} icon={Zap} />
                </div>

                {!page.campaign_ready && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-700">
                      <strong>Action Required:</strong> Complete all checklist items to unlock full campaign capabilities.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Page Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Add a Facebook Page</DialogTitle>
            <DialogDescription>Follow these steps to connect your page.</DialogDescription>
          </DialogHeader>

          <div className="bg-secondary/60 rounded-xl p-4 space-y-3 my-2">
            <h4 className="font-semibold text-sm">How to connect your page:</h4>
            <ol className="space-y-2">
              {[
                'Open your Facebook Page Settings',
                'Navigate to Page Setup → Page Access',
                'Grant Arthur Chibondo access to manage the page',
                'Submit your page details below',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <span className="w-5 h-5 rounded-full bg-[hsl(var(--primary))] text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Page Name *</Label>
              <Input
                value={form.page_name}
                onChange={e => setForm(f => ({ ...f, page_name: e.target.value }))}
                placeholder="e.g. My Business Page"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label>Page URL *</Label>
              <Input
                value={form.page_url}
                onChange={e => setForm(f => ({ ...f, page_url: e.target.value }))}
                placeholder="https://facebook.com/yourpage"
                className="mt-1"
                required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
                Cancel
              </Button>
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