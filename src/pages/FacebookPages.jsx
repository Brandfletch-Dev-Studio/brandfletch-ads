/**
 * Facebook Pages — Meta OAuth onboarding flow
 *
 * "Connect a Page" → Facebook Login for Business OAuth
 * → Page selection → access verification → saved to FacebookPage table
 *
 * The OAuth callback lands back on this same page (/pages?code=...&state=...)
 * and is handled inline here.
 */
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { base44, supabase } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { metaClient } from '@/lib/metaClient';
import {
  Facebook, Plus, CheckCircle2, XCircle, Clock,
  ExternalLink, Loader2, ArrowRight, Building2, RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const REDIRECT_URI_KEY = 'bf_fb_pages_redirect_uri';
const ONBOARDING_ID_KEY = 'bf_fb_pages_onboarding_id';

function StatusBadge({ status }) {
  if (status === 'connected')
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
        <CheckCircle2 className="w-3.5 h-3.5" /> Connected
      </span>
    );
  if (status === 'pending_verification')
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full">
        <Clock className="w-3.5 h-3.5" /> Verifying…
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
      <XCircle className="w-3.5 h-3.5" /> Not connected
    </span>
  );
}

export default function FacebookPages() {
  const { user, isLoadingAuth } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [pages, setPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(true);

  const [flowStep, setFlowStep] = useState('idle');
  const [oauthPages, setOAuthPages] = useState([]);
  const [oauthBusinesses, setOAuthBusinesses] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [onboardingId, setOnboardingId] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const loadPages = useCallback(async (uid) => {
    try {
      const data = await base44.entities.FacebookPage.filter(
        { created_by: uid },
        { sort: '-created_date' }
      );
      setPages(data);
    } catch (err) {
      console.error('Failed to load pages:', err);
    } finally {
      setLoadingPages(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoadingAuth && user?.id) loadPages(user.id);
  }, [user?.id, isLoadingAuth, loadPages]);

  // ── Handle OAuth callback ────────────────────────────────────────────────
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const fbError = searchParams.get('error');
    const fbErrorDesc = searchParams.get('error_description');

    // Facebook returned an error (e.g. user denied permissions)
    if (fbError) {
      navigate('/pages', { replace: true });
      const msg = fbErrorDesc || fbError || 'Facebook authorization was cancelled or failed.';
      setErrorMsg(msg);
      setFlowStep('error');
      toast.error(msg);
      return;
    }

    if (!code || !state) return;

    navigate('/pages', { replace: true });

    const savedRedirectUri = sessionStorage.getItem(REDIRECT_URI_KEY);
    if (!savedRedirectUri) {
      const msg = 'Session expired. Please try connecting again.';
      setErrorMsg(msg);
      setFlowStep('error');
      toast.error(msg);
      return;
    }

    setOnboardingId(state);
    setFlowStep('selecting');
    setErrorMsg('');

    (async () => {
      try {
        const res = await metaClient.callback(code, state, savedRedirectUri);
        setOAuthPages(res.pages || []);
        setOAuthBusinesses(res.businesses || []);
        if ((res.pages || []).length === 0) {
          toast.info('No Facebook Pages found. Make sure you have a Business Page.');
        } else {
          toast.success(`Found ${res.pages.length} Facebook Page${res.pages.length !== 1 ? 's' : ''}`);
        }
      } catch (err) {
        console.error('OAuth callback failed:', err);
        const msg = err.message || 'Facebook login failed. Please try again.';
        setErrorMsg(msg);
        setFlowStep('error');
        toast.error(msg);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [], [searchParams, navigate]);

  // ── Step 1: Start Facebook Login ─────────────────────────────────────────
  async function handleConnect() {
    setFlowStep('connecting');
    setErrorMsg('');
    try {
      const redirectUri = `${window.location.origin}/pages`;
      sessionStorage.setItem(REDIRECT_URI_KEY, redirectUri);

      let userId = user?.id || '';
      if (!userId) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) userId = session.user.id;
      }

      const res = await metaClient.initiate('standalone', userId || 'unknown', redirectUri);
      sessionStorage.setItem(ONBOARDING_ID_KEY, res.onboarding_id);

      window.location.href = res.oauth_url;
    } catch (err) {
      console.error('Failed to start Facebook login:', err);
      const msg = err.message || 'Failed to start Facebook login.';
      setErrorMsg(msg);
      setFlowStep('error');
      toast.error(msg);
    }
  }

  // ── Step 2: Verify access ───────────────────────────────────────────────
  async function handleVerifyAccess() {
    if (!selectedPage) { toast.error('Please select a Facebook Page'); return; }
    setFlowStep('verifying');
    try {
      const res = await metaClient.checkAccess(
        selectedPage.id,
        selectedBusiness || oauthBusinesses[0]?.id || null,
        onboardingId
      );
      setVerifyResult(res);
      if (res.has_access) {
        await savePageToDb(res);
      } else {
        setFlowStep('selecting');
      }
    } catch (err) {
      console.error('Verify access failed:', err);
      const msg = err.message || 'Failed to verify page access.';
      setErrorMsg(msg);
      setFlowStep('error');
      toast.error(msg);
    }
  }

  // ── Step 3: Save to DB ───────────────────────────────────────────────────
  async function savePageToDb(accessResult) {
    setFlowStep('saving');
    try {
      const existing = await base44.entities.FacebookPage.filter({ page_id: selectedPage.id });
      if (existing?.length > 0) {
        await base44.entities.FacebookPage.update(existing[0].id, {
          page_name: selectedPage.name || accessResult.page_name,
          connection_status: 'connected',
          page_id: selectedPage.id,
          user_id: user?.id,
        });
      } else {
        await base44.entities.FacebookPage.create({
          page_name: selectedPage.name || accessResult.page_name || 'Facebook Page',
          page_url: `https://facebook.com/${selectedPage.id}`,
          page_id: selectedPage.id,
          connection_status: 'connected',
          user_id: user?.id,
        });
      }
      toast.success(`${selectedPage.name} connected successfully!`);
      setFlowStep('done');
      await loadPages(user.id);
    } catch (err) {
      console.error('Failed to save page:', err);
      const msg = err.message || 'Failed to save page.';
      setErrorMsg(msg);
      setFlowStep('error');
      toast.error(msg);
    }
  }

  function resetFlow() {
    setFlowStep('idle');
    setOAuthPages([]);
    setOAuthBusinesses([]);
    setSelectedPage(null);
    setSelectedBusiness('');
    setOnboardingId(null);
    setVerifyResult(null);
    setErrorMsg('');
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Facebook Pages</h1>
          <p className="text-muted-foreground text-sm mt-1">Connect your Facebook pages to run ad campaigns</p>
        </div>
        {flowStep === 'idle' && pages.length > 0 && (
          <Button onClick={handleConnect} className="gap-2">
            <Plus className="w-4 h-4" /> Add Page
          </Button>
        )}
      </div>

      {flowStep !== 'idle' && flowStep !== 'done' && (
        <Card>
          <CardContent className="p-6">
            {flowStep === 'connecting' && (
              <div className="flex flex-col items-center py-10 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
                <p className="text-muted-foreground">Redirecting to Facebook…</p>
              </div>
            )}

            {flowStep === 'selecting' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Select your Facebook Page</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Choose the page you want to run ads from.
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={resetFlow}>Cancel</Button>
                </div>

                {verifyResult && !verifyResult.has_access && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-2">
                    <p className="font-semibold text-sm text-amber-800 dark:text-amber-300">
                      Brandfletch needs access to this page
                    </p>
                    <ol className="text-sm text-amber-700 dark:text-amber-400 space-y-1 list-decimal list-inside">
                      {(verifyResult.instructions?.steps || []).map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                    <a
                      href="https://business.facebook.com/settings/partners"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 dark:text-amber-300 underline mt-1"
                    >
                      Open Meta Business Settings <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {oauthBusinesses.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" /> Business (optional)
                    </Label>
                    <select
                      className="w-full p-2.5 rounded-lg border border-border bg-card text-sm"
                      value={selectedBusiness}
                      onChange={e => setSelectedBusiness(e.target.value)}
                    >
                      <option value="">No business selected</option>
                      {oauthBusinesses.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {oauthPages.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground text-sm">No Facebook Pages found on this account.</p>
                    <Button variant="outline" className="mt-4 gap-2" onClick={handleConnect}>
                      <RefreshCw className="w-4 h-4" /> Try Again
                    </Button>
                  </div>
                ) : (
                  <>
                    <RadioGroup
                      value={selectedPage?.id || ''}
                      onValueChange={val => setSelectedPage(oauthPages.find(p => p.id === val))}
                    >
                      <div className="space-y-2">
                        {oauthPages.map(page => (
                          <Label
                            key={page.id}
                            htmlFor={`page-${page.id}`}
                            className={cn(
                              'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                              selectedPage?.id === page.id
                                ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5'
                                : 'border-border hover:border-[hsl(var(--primary))]/40'
                            )}
                          >
                            <RadioGroupItem value={page.id} id={`page-${page.id}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Facebook className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                <p className="font-semibold text-sm truncate">{page.name}</p>
                              </div>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge variant="secondary" className="text-xs">{page.category || 'Page'}</Badge>
                                {page.has_instagram && (
                                  <Badge variant="outline" className="text-xs">Instagram linked</Badge>
                                )}
                              </div>
                            </div>
                            {selectedPage?.id === page.id && (
                              <CheckCircle2 className="w-5 h-5 text-[hsl(var(--primary))] flex-shrink-0" />
                            )}
                          </Label>
                        ))}
                      </div>
                    </RadioGroup>

                    <Button
                      onClick={handleVerifyAccess}
                      disabled={!selectedPage}
                      className="w-full gap-2"
                    >
                      Connect this Page <ArrowRight className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            )}

            {flowStep === 'verifying' && (
              <div className="flex flex-col items-center py-10 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
                <p className="font-medium">Verifying page access…</p>
                <p className="text-sm text-muted-foreground">Checking if Brandfletch has permissions on this page</p>
              </div>
            )}

            {flowStep === 'saving' && (
              <div className="flex flex-col items-center py-10 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
                <p className="text-muted-foreground">Saving your page…</p>
              </div>
            )}

            {flowStep === 'error' && (
              <div className="text-center py-8 space-y-4">
                <XCircle className="w-10 h-10 text-destructive mx-auto" />
                <p className="font-medium">Something went wrong</p>
                {errorMsg && (
                  <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20 max-w-md mx-auto text-left">
                    {errorMsg}
                  </p>
                )}
                <div className="flex items-center justify-center gap-3">
                  <Button variant="outline" onClick={resetFlow}>Cancel</Button>
                  <Button onClick={handleConnect} className="gap-2">
                    <RefreshCw className="w-4 h-4" /> Try Again
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Done state */}
      {flowStep === 'done' && (
        <Card className="border-green-200 dark:border-green-900">
          <CardContent className="p-6 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
            <p className="font-medium">Page connected successfully!</p>
            <Button variant="outline" onClick={resetFlow}>Back to pages</Button>
          </CardContent>
        </Card>
      )}

      {/* Connected pages list */}
      {pages.length === 0 && flowStep === 'idle' ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
              <Facebook className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No pages connected yet</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Connect your Facebook Business Page to start running ads.
            </p>
            <Button onClick={handleConnect} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Facebook className="w-4 h-4" /> Connect with Facebook
            </Button>
          </CardContent>
        </Card>
      ) : pages.length > 0 ? (
        <div className="space-y-4">
          {pages.map(page => (
            <Card key={page.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                      <Facebook className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{page.page_name}</p>
                      {page.page_url && (
                        <a
                          href={page.page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-0.5"
                        >
                          {page.page_url} <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={page.connection_status} />
                </div>
              </CardContent>
            </Card>
          ))}

          {flowStep === 'idle' && (
            <Button variant="outline" onClick={handleConnect} className="w-full gap-2">
              <Plus className="w-4 h-4" /> Connect Another Page
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
