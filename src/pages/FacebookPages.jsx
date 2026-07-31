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

const BRANDFLETCH_BUSINESS_ID = import.meta.env.VITE_META_BUSINESS_ID || '';
const META_BUSINESS_SETTINGS_URL = 'https://business.facebook.com/settings/partners';

export default function FacebookPages() {
  const { user, isLoadingAuth } = useAuth();

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
    if (!BRANDFLETCH_BUSINESS_ID) {
      toast.error('Business ID not configured. Contact support.');
      return;
    }
    navigator.clipboard.writeText(BRANDFLETCH_BUSINESS_ID).then(() => {
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
      toast.error(err.message || 'Failed to save page.');
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
              <Facebook className="w-4 h-4 text-blue-600" /> Grant Brandfletch Partner Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Step 1: Copy Business ID */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">Step 1 — Copy Brandfletch's Business ID</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 rounded-lg bg-muted font-mono text-xs sm:text-sm select-all break-all">
                  {BRANDFLETCH_BUSINESS_ID || 'Not configured — contact support'}
                </code>
                <Button variant="outline" size="icon" onClick={copyBusinessId} className="shrink-0">
                  {copied ? <ClipboardCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Step 2: Open Meta Business Settings */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">Step 2 — Grant Access in Meta Business Settings</Label>
              <div className="space-y-2 mb-3">
                {[
                  'Go to Partners in the left sidebar',
                  'Click Add → Give a partner access to your assets',
                  'Paste the Business ID and click Next',
                  'Select your Facebook Page and grant Advertise permission',
                  'Click Save and come back here',
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-sm text-muted-foreground">{text}</p>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => window.open(META_BUSINESS_SETTINGS_URL, '_blank', 'noopener,noreferrer')}
                className="w-full gap-2"
              >
                <ExternalLink className="w-4 h-4" /> Open Meta Business Settings
              </Button>
            </div>

            {/* Step 3: Enter page info */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">Step 3 — Tell us your Facebook Page</Label>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs flex items-center gap-1.5 mb-1.5">
                    <Building2 className="w-3 h-3" /> Page Name
                  </Label>
                  <Input
                    value={pageName}
                    onChange={e => setPageName(e.target.value)}
                    placeholder="e.g. My Business Page"
                  />
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1.5 mb-1.5">
                    <LinkIcon className="w-3 h-3" /> Page URL (optional)
                  </Label>
                  <Input
                    value={pageUrl}
                    onChange={e => setPageUrl(e.target.value)}
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={!pageName.trim() || saving}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
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
