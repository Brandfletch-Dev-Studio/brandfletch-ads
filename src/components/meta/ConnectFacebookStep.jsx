/**
 * Connect Facebook Step
 *
 * Shows a "Connect Facebook Page" button that starts Facebook Login for Business.
 * After login, displays the list of the user's Facebook Pages for selection.
 *
 * Props: { onboardingId, onPageSelected, onError }
 */
import { useState } from 'react';
import { Facebook, Loader2, ArrowRight, Building2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { metaClient } from '@/lib/metaClient';
import { toast } from 'sonner';

export default function ConnectFacebookStep({ onboardingId, onPageSelected, onError }) {
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [showPages, setShowPages] = useState(false);

  // Handle the Facebook Login button
  async function handleConnect() {
    setLoading(true);
    try {
      const redirectUri = `${window.location.origin}/campaigns/${getCampaignId()}/onboarding`;
      const user = JSON.parse(localStorage.getItem('bf_user') || '{}');

      const res = await metaClient.initiate(getCampaignId(), user.id || 'unknown', redirectUri);

      // Store onboarding_id for callback
      sessionStorage.setItem('meta_onboarding_id', res.onboarding_id);
      sessionStorage.setItem('meta_redirect_uri', redirectUri);

      // Redirect to Facebook OAuth
      window.location.href = res.oauth_url;
    } catch (err) {
      toast.error(err.message || 'Failed to start Facebook login');
      onError?.(err);
    } finally {
      setLoading(false);
    }
  }

  function getCampaignId() {
    const match = window.location.pathname.match(/\/campaigns\/([^/]+)\/onboarding/);
    return match?.[1] || '';
  }

  // Handle OAuth callback (called from MetaOnboarding when code is in URL)
  async function handleCallback(code, state) {
    setLoading(true);
    try {
      const redirectUri = sessionStorage.getItem('meta_redirect_uri') || window.location.origin;
      const res = await metaClient.callback(code, state, redirectUri);
      setPages(res.pages || []);
      setBusinesses(res.businesses || []);
      setShowPages(true);
      toast.success(`Found ${res.pages?.length || 0} Facebook Pages`);
    } catch (err) {
      toast.error(err.message || 'Facebook login failed');
      onError?.(err);
    } finally {
      setLoading(false);
    }
  }

  // Expose callback handler to parent
  if (typeof window !== 'undefined') {
    window.__metaOnboardingCallback = handleCallback;
  }

  function handlePageSelect() {
    if (!selectedPage) {
      toast.error('Please select a Facebook Page');
      return;
    }
    onPageSelected({
      page: selectedPage,
      business: businesses.find(b => b.id === selectedBusiness) || businesses[0] || null,
    });
  }

  // Loading state during OAuth redirect
  if (loading && !showPages) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
        <p className="text-muted-foreground">Connecting to Facebook…</p>
      </div>
    );
  }

  // Page selection screen
  if (showPages) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Select your Facebook Page</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Choose the Page you want to run ads from. We'll check if Brandfletch has the right permissions.
          </p>
        </div>

        {pages.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No Facebook Pages found on this account.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Make sure you have a Facebook Business Page, then try again.
              </p>
              <Button variant="outline" className="mt-4" onClick={handleConnect}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {businesses.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Business (optional)
                </Label>
                <select
                  className="w-full p-2.5 rounded-lg border border-border bg-card text-sm"
                  value={selectedBusiness || ''}
                  onChange={e => setSelectedBusiness(e.target.value)}
                >
                  <option value="">No business selected</option>
                  {businesses.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            <RadioGroup value={selectedPage?.id || ''} onValueChange={val => setSelectedPage(pages.find(p => p.id === val))}>
              <div className="space-y-2">
                {pages.map(page => (
                  <Label
                    key={page.id}
                    htmlFor={page.id}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                      selectedPage?.id === page.id
                        ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5'
                        : 'border-border hover:border-[hsl(var(--primary))]/40'
                    )}
                  >
                    <RadioGroupItem value={page.id} id={page.id} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Facebook className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <p className="font-semibold text-sm truncate">{page.name}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">{page.category || 'Page'}</Badge>
                        {page.has_instagram && <Badge variant="outline" className="text-xs">Instagram linked</Badge>}
                      </div>
                    </div>
                    {selectedPage?.id === page.id && <CheckCircle2 className="w-5 h-5 text-[hsl(var(--primary))] flex-shrink-0" />}
                  </Label>
                ))}
              </div>
            </RadioGroup>

            <Button
              onClick={handlePageSelect}
              disabled={!selectedPage}
              className="w-full gap-2"
            >
              Continue with selected Page <ArrowRight className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    );
  }

  // Initial state — Connect Facebook button
  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
          <Facebook className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold">Connect your Facebook Page</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Log in with Facebook to select your Business Page. We'll handle the rest —
          permissions, campaign setup, and going live.
        </p>
      </div>

      <Button
        onClick={handleConnect}
        disabled={loading}
        className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Connecting…</>
        ) : (
          <><Facebook className="w-4 h-4" /> Connect Facebook Page</>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        We only request the permissions needed to manage your ads.
        You can revoke access at any time from Facebook Settings.
      </p>
    </div>
  );
}
