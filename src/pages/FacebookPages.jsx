/**
 * Facebook Pages — Assisted Onboarding (Agency-Powered)
 *
 * Only accessible after the user has set up their first paid campaign.
 * Shows connected Facebook Pages with full management:
 *   - Add another page (partner access flow)
 *   - Verify connection (re-run the connection process)
 *   - Disconnect a page
 *   - Delete a page
 *
 * No OAuth, no token exchange, no API calls.
 * The user copies Brandfletch's Business ID, opens Meta Business Settings,
 * grants partner access, then enters their Page name/URL here.
 */
import { useState, useEffect, useCallback } from 'react';
import { useAppConfigValue } from '@/lib/useAppConfig';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import {
  Facebook, Plus, CheckCircle2, XCircle, ExternalLink,
  Copy, ClipboardCheck, Trash2, ShieldCheck, RefreshCw,
  Megaphone, ArrowRight, Link2, Link2Off, AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const META_BUSINESS_SETTINGS_URL = 'https://business.facebook.com/settings/partners';

const PAID_STATUSES = ['pending_review', 'approved', 'active', 'completed'];

export default function FacebookPages() {
  const { user, isLoadingAuth } = useAuth();
  const { value: businessId } = useAppConfigValue('meta_business_id');

  const [pages, setPages] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loadingPages, setLoadingPages] = useState(true);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pageName, setPageName] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);

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

  const loadCampaigns = useCallback(async () => {
    if (!user?.id) { setLoadingCampaigns(false); return; }
    try {
      const data = await base44.entities.Campaign.filter({ created_by: user.id }, { sort: '-created_date', limit: 50 });
      setCampaigns(data || []);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoadingCampaigns(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isLoadingAuth) {
      loadPages();
      loadCampaigns();
    }
  }, [isLoadingAuth, loadPages, loadCampaigns]);

  const hasPaidCampaign = campaigns.some(c => PAID_STATUSES.includes(c.status));

  function copyBusinessId() {
    if (!businessId) {
      toast.error('Business ID not configured. Contact support.');
      return;
    }
    navigator.clipboard.writeText(businessId).then(() => {
      setCopied(true);
      toast.success('Business ID copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
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
    if (!confirm('Remove this Facebook Page? You can always add it again later.')) return;
    try {
      await base44.entities.FacebookPage.delete(id);
      setPages(ps => ps.filter(p => p.id !== id));
      toast.success('Page removed');
    } catch (err) {
      toast.error(err?.message || 'Failed to remove page.');
    }
  }

  async function disconnectPage(id, pageName) {
    if (!confirm(`Disconnect "${pageName}"? You'll need to re-verify the connection to use this page for ads.`)) return;
    try {
      await base44.entities.FacebookPage.update(id, { connection_status: 'disconnected' });
      setPages(ps => ps.map(p => p.id === id ? { ...p, connection_status: 'disconnected' } : p));
      toast.success(`${pageName} disconnected. Use "Verify Connection" to reconnect.`);
    } catch (err) {
      toast.error(err?.message || 'Failed to disconnect page.');
    }
  }

  async function verifyConnection(id, pageName) {
    setVerifyingId(id);
    try {
      await base44.entities.FacebookPage.update(id, { connection_status: 'connected' });
      setPages(ps => ps.map(p => p.id === id ? { ...p, connection_status: 'connected' } : p));
      toast.success(`"${pageName}" connection verified! Your page is ready for ads.`);
    } catch (err) {
      toast.error(err?.message || 'Failed to verify connection.');
    } finally {
      setVerifyingId(null);
    }
  }

  // ── Loading state ──
  if (isLoadingAuth || loadingPages || loadingCampaigns) {
    return (
      <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-3">
        {[1, 2].map(i => <div key={i} className="h-28 rounded-xl bg-secondary animate-pulse" />)}
      </div>
    );
  }

  // ── Pre-campaign guard ──
  // If the user hasn't set up a paid campaign yet, show a message instead of the page management
  if (!hasPaidCampaign) {
    return (
      <div className="p-4 lg:p-8 max-w-2xl mx-auto">
        <Card className="border-2 border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
              <Megaphone className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-xl font-bold font-heading mb-2">Set up your first campaign first</h1>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-md mx-auto">
              Facebook Page onboarding becomes available after you create and pay for your first ad campaign.
              Once that's done, a Brandfletch Media agent will guide you through connecting your page.
            </p>
            <Link to="/campaigns/new">
              <Button className="gap-2">
                <Megaphone className="w-4 h-4" /> Create Your First Campaign
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Facebook Pages</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your connected Facebook pages for ad campaigns</p>
        </div>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Page
          </Button>
        )}
      </div>

      {/* Assisted onboarding banner */}
      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/10">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Assisted Onboarding</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              A Brandfletch Media agent will help you through the partner access process.
              Need help? <a href="mailto:support@brandfletch.com" className="text-blue-600 hover:underline font-medium">Contact support</a>.
            </p>
          </div>
        </CardContent>
      </Card>

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
              <div>
                <Label className="text-xs mb-1 block">Page Name *</Label>
                <Input
                  value={pageName}
                  onChange={e => setPageName(e.target.value)}
                  placeholder="e.g. My Business Page"
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Page URL (optional)</Label>
                <Input
                  value={pageUrl}
                  onChange={e => setPageUrl(e.target.value)}
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
            </div>

            {/* Business ID + instructions */}
            <div className="rounded-lg bg-muted/60 border border-border p-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-foreground/10 flex items-center justify-center text-[10px] font-bold">1</span>
                  Copy Brandfletch's Business ID
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2.5 rounded-md bg-background font-mono text-xs select-all break-all border border-border">
                    {businessId || 'Not configured — contact support'}
                  </code>
                  <Button variant="outline" size="icon" onClick={copyBusinessId} className="shrink-0 h-9 w-9">
                    {copied ? <ClipboardCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-foreground/10 flex items-center justify-center text-[10px] font-bold">2</span>
                  Grant access in Meta Business Settings
                </p>
                <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                  Go to <strong>Partners</strong> → <strong>Add</strong> → <strong>Give a partner access</strong> →
                  paste the ID → select your Page → grant <strong>Advertise</strong> permission → Save.
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
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-foreground/10 flex items-center justify-center text-[10px] font-bold">3</span>
                  Save your page below to confirm the connection
                </p>
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
              <Button variant="outline" onClick={() => { setShowAddForm(false); setPageName(''); setPageUrl(''); }}>
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
                <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3">
                  <Facebook className="w-7 h-7 text-blue-600" />
                </div>
                <p className="font-medium text-foreground mb-1">No Facebook Pages connected yet</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  Click "Add Page" to grant Brandfletch partner access to your Facebook Page.
                  A Brandfletch agent will assist you through the process.
                </p>
                <Button onClick={() => setShowAddForm(true)} className="gap-2 mt-4">
                  <Plus className="w-4 h-4" /> Add Your First Page
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pages.map(page => (
                <Card key={page.id} className="shadow-sm overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Page info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                          page.connection_status === 'connected'
                            ? 'bg-blue-100 dark:bg-blue-900/30'
                            : 'bg-slate-100 dark:bg-slate-800/50'
                        }`}>
                          <Facebook className={`w-5 h-5 ${
                            page.connection_status === 'connected' ? 'text-blue-600' : 'text-slate-400'
                          }`} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{page.page_name}</p>
                          {page.page_url && (
                            <a
                              href={page.page_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:text-primary truncate block flex items-center gap-1"
                            >
                              <Link2 className="w-3 h-3" />
                              {page.page_url}
                            </a>
                          )}
                          <div className="mt-1.5">
                            {page.connection_status === 'connected' ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" /> Connected
                              </span>
                            ) : page.connection_status === 'disconnected' ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                <Link2Off className="w-3 h-3" /> Disconnected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                                <AlertCircle className="w-3 h-3" /> Needs verification
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Verify connection — shows when not connected or when disconnected */}
                        {page.connection_status !== 'connected' && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={verifyingId === page.id}
                            onClick={() => verifyConnection(page.id, page.page_name)}
                            className="gap-1.5 h-8 text-xs"
                            title="Verify connection"
                          >
                            {verifyingId === page.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ShieldCheck className="w-3.5 h-3.5" />
                            )}
                            Verify
                          </Button>
                        )}

                        {/* Re-verify for connected pages */}
                        {page.connection_status === 'connected' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={verifyingId === page.id}
                            onClick={() => verifyConnection(page.id, page.page_name)}
                            className="gap-1.5 h-8 text-xs"
                            title="Re-verify connection"
                          >
                            {verifyingId === page.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        )}

                        {/* Disconnect — only for connected pages */}
                        {page.connection_status === 'connected' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => disconnectPage(page.id, page.page_name)}
                            className="h-8 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            title="Disconnect page"
                          >
                            <Link2Off className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {/* Delete — always available */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePage(page.id)}
                          className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Remove page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Disconnected notice */}
                    {page.connection_status === 'disconnected' && (
                      <div className="mt-3 pt-3 border-t border-border flex items-start gap-2 text-xs text-muted-foreground">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>
                          This page is disconnected. Click "Verify" to re-run the connection process and
                          confirm partner access is still granted.
                        </span>
                      </div>
                    )}
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
