/**
 * Facebook Pages — Simplified (Agency-Powered)
 *
 * Shows connected Facebook Pages and a simple "Grant Partner Access" flow.
 * No OAuth, no token exchange, no API calls.
 *
 * The user copies Brandfletch's Business ID, opens Meta Business Settings,
 * grants partner access, then enters their Page name/URL here.
 */
import { useState, useEffect, useCallback } from 'react';
import { useAppConfigValue } from '@/lib/useAppConfig';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import {
  Facebook, Plus, CheckCircle2, XCircle, ExternalLink,
  Copy, ClipboardCheck, Building2, Link as LinkIcon, Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const META_BUSINESS_SETTINGS_URL = 'https://business.facebook.com/settings/partners';

export default function FacebookPages() {
  const { user, isLoadingAuth } = useAuth();
  const { value: businessId } = useAppConfigValue('meta_business_id');

  const [pages, setPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pageName, setPageName] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const loadPages = useCallback(async () => {
    try {
      const data = await base44.entities.FacebookPage.list({ sort: '-created_date' });
      setPages(data);
    } catch (err) {
      console.error('Failed to load pages:', err);
    } finally {
      setLoadingPages(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoadingAuth) loadPages();
  }, [isLoadingAuth, loadPages]);

  function copyBusinessId() {
    if (!businessId) {
      toast.error('Business ID not configured. Contact support.');
      return;
    }
    navigator.clipboard.writeText(businessId).then(() => {
      setCopied(true);
      toast.success('Business ID copied to clipboard!');
    }).catch(() => toast.error('Copy failed — long-press the ID to select it'));
  }

  async function handleSave() {
    if (!pageName.trim()) {
      toast.error('Please enter your Facebook Page name');
      return;
    }
    setSaving(true);
    try {
      const existing = pages.find(p => p.page_name?.toLowerCase() === pageName.trim().toLowerCase());
      if (existing) {
        await base44.entities.FacebookPage.update(existing.id, {
          page_name: pageName.trim(),
          page_url: pageUrl.trim() || `https://facebook.com/${pageName.trim().replace(/\s+/g, '')}`,
          connection_status: 'connected',
        });
      } else {
        await base44.entities.FacebookPage.create({
          page_name: pageName.trim(),
          page_url: pageUrl.trim() || `https://facebook.com/${pageName.trim().replace(/\s+/g, '')}`,
          connection_status: 'connected',
        });
      }
      toast.success(`${pageName.trim()} connected!`);
      setPageName('');
      setPageUrl('');
      setShowAddForm(false);
      await loadPages();
    } catch (err) {
      console.error('Failed to save page:', err);
      const msg = err?.message || err?.error_description || err?.error || 'Failed to save page.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function deletePage(id) {
    try {
      await base44.entities.FacebookPage.delete(id);
      setPages(ps => ps.filter(p => p.id !== id));
      toast.success('Page removed');
    } catch (err) {
      toast.error(err?.message || 'Failed to remove page.');
    }
  }

  if (isLoadingAuth || loadingPages) {
    return (
      <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-3">
        {[1, 2].map(i => <div key={i} className="h-28 rounded-xl bg-secondary animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Facebook Pages</h1>
          <p className="text-muted-foreground text-sm mt-1">Connect your Facebook pages to run ad campaigns</p>
        </div>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Page
          </Button>
        )}
      </div>

      {/* Add page form — simplified partner access flow */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Facebook className="w-4 h-4 text-blue-600" /> Connect Your Facebook Page
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Page info first */}
            <div className="space-y-2">
              <Input
                value={pageName}
                onChange={e => setPageName(e.target.value)}
                placeholder="Page name (e.g. My Business Page)"
              />
              <Input
                value={pageUrl}
                onChange={e => setPageUrl(e.target.value)}
                placeholder="Page URL (optional)"
              />
            </div>

            {/* Business ID + instructions */}
            <div className="rounded-lg bg-muted/60 border border-border p-3 space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">1. Copy Brandfletch's Business ID</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 rounded-md bg-background font-mono text-xs select-all break-all border border-border">
                    {businessId || 'Not configured — contact support'}
                  </code>
                  <Button variant="outline" size="icon" onClick={copyBusinessId} className="shrink-0 h-8 w-8">
                    {copied ? <ClipboardCheck className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">2. Grant access in Meta Business Settings</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Partners → Add → Give a partner access → paste the ID → select your Page → grant <strong>Advertise</strong> permission → Save.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(META_BUSINESS_SETTINGS_URL, '_blank', 'noopener,noreferrer')}
                  className="gap-1.5 h-8 text-xs w-full"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Meta Business Settings
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleSave}
                disabled={!pageName.trim() || saving}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white flex-1"
              >
                {saving ? 'Saving…' : 'Save Page'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connected pages list */}
      {!showAddForm && (
        <>
          {pages.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Facebook className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No Facebook Pages connected yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click "Add Page" to grant Brandfletch partner access to your Facebook Page.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {pages.map(page => (
                <Card key={page.id} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                          <Facebook className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{page.page_name}</p>
                          {page.page_url && (
                            <a
                              href={page.page_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:text-primary truncate block"
                            >
                              {page.page_url}
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {page.connection_status === 'connected' ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
                            <XCircle className="w-3.5 h-3.5" /> Not connected
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletePage(page.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
