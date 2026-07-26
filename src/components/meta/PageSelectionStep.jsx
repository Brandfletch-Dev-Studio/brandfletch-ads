/**
 * PageSelectionStep — first post-payment step of the onboarding flow.
 *
 * Lists the user's existing connected FacebookPage records plus any
 * pages returned by a fresh Facebook OAuth callback. The user can:
 *   - Select an existing connected page → continue to verify_access
 *   - Select an OAuth-returned page → continue to verify_access
 *   - Connect via Facebook (OAuth) → returns with real Meta pages to pick
 *
 * Pages are NOT added manually here — that's done exclusively via the
 * Facebook OAuth flow. /pages is used to manage already-connected pages.
 *
 * Props:
 *   - onboardingId
 *   - userId
 *   - campaignId
 *   - initialPages       (OAuth-returned pages, if callback just happened)
 *   - initialBusinesses  (OAuth-returned businesses)
 *   - onPageSelected: ({ page, business }) => void
 *   - onError: (err) => void
 */
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Facebook, Loader2, ArrowRight, CheckCircle2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { metaClient } from '@/lib/metaClient';
import { toast } from 'sonner';

export default function PageSelectionStep({
  onboardingId,
  userId,
  campaignId,
  initialPages,
  initialBusinesses,
  onPageSelected,
  onError,
}) {
  const [savedPages, setSavedPages] = useState([]);
  const [oauthPages, setOauthPages] = useState(initialPages || []);
  const [businesses, setBusinesses] = useState(initialBusinesses || []);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  // ── Load pre-connected pages from the FacebookPage entity ──
  useEffect(() => {
    if (!userId) return;
    loadSavedPages(userId);
  }, [userId]);

  // ── If OAuth pages arrive after mount, update ──
  useEffect(() => {
    if (initialPages && initialPages.length) {
      setOauthPages(initialPages);
      setBusinesses(initialBusinesses || []);
      toast.success(`Found ${initialPages.length} Facebook Page${initialPages.length === 1 ? '' : 's'}`);
    }
  }, [initialPages, initialBusinesses]);

  async function loadSavedPages(uid) {
    setLoadingSaved(true);
    try {
      const data = await base44.entities.FacebookPage
        .filter({ created_by: uid }, { sort: '-created_date' })
        .catch(() => []);
      setSavedPages(data || []);
    } catch (err) {
      console.error('Failed to load saved pages:', err);
    } finally {
      setLoadingSaved(false);
    }
  }

  // ── Start Facebook OAuth flow (redirects to Facebook) ──
  async function handleConnectFacebook() {
    setConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/campaigns/${campaignId}/onboarding`;
      let uid = userId || '';
      if (!uid) {
        try {
          const { supabase } = await import('@/api/base44Client');
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.id) uid = session.user.id;
        } catch (_) {}
      }
      const res = await metaClient.initiate(campaignId, uid || 'unknown', redirectUri);
      sessionStorage.setItem('meta_onboarding_id', res.onboarding_id);
      sessionStorage.setItem('meta_redirect_uri', redirectUri);
      window.location.href = res.oauth_url;
    } catch (err) {
      toast.error(err.message || 'Failed to start Facebook login');
      onError?.(err);
    } finally {
      setConnecting(false);
    }
  }

  async function handleContinue() {
    if (!selectedPage) {
      toast.error('Please select a Facebook Page');
      return;
    }
    const business = businesses.find(b => b.id === selectedBusiness) || businesses[0] || null;

    // Save the selected page to the FacebookPage entity so it shows in /pages
    // Only save if it came from OAuth and doesn't already exist
    if (selectedPage._source === 'oauth' && userId) {
      try {
        const existing = await base44.entities.FacebookPage
          .filter({ user_id: userId, page_id: selectedPage.id })
          .catch(() => []);
        if (!existing || existing.length === 0) {
          await base44.entities.FacebookPage.create({
            user_id: userId,
            page_name: selectedPage.name,
            page_url: `https://facebook.com/${selectedPage.id}`,
            page_id: selectedPage.id,
            connection_status: 'connected',
          });
        }
      } catch (err) {
        console.error('Failed to save page to FacebookPage entity:', err);
        // Non-fatal — continue with onboarding
      }
    }

    onPageSelected({ page: selectedPage, business });
  }

  // ── Combine all selectable pages into one list ──
  // OAuth pages (real Meta page IDs) are always selectable.
  // Saved FacebookPage records are selectable only if they have a page_id
  // and are connected.
  const selectablePages = [
    ...oauthPages.map(p => ({ ...p, _source: 'oauth' })),
    ...savedPages
      .filter(p => p.page_id && p.connection_status === 'connected')
      .map(p => ({
        id: p.page_id,
        name: p.page_name,
        _source: 'saved',
        _url: p.page_url,
      })),
  ];

  const hasOauthPages = oauthPages.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Select your Facebook Page</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Pick the Page you want to run ads from. Connect via Facebook to load your pages.
        </p>
      </div>

      {/* Selectable pages (OAuth-returned or pre-connected with Meta page_id) */}
      {selectablePages.length > 0 && (
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

          <RadioGroup
            value={selectedPage?.id || ''}
            onValueChange={val => setSelectedPage(selectablePages.find(p => p.id === val))}
          >
            <div className="space-y-2">
              {selectablePages.map(page => (
                <Label
                  key={`${page._source}-${page.id}`}
                  htmlFor={`${page._source}-${page.id}`}
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                    selectedPage?.id === page.id
                      ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5'
                      : 'border-border hover:border-[hsl(var(--primary))]/40'
                  )}
                >
                  <RadioGroupItem value={page.id} id={`${page._source}-${page.id}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Facebook className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <p className="font-semibold text-sm truncate">{page.name}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {page._source === 'oauth' && (
                        <Badge variant="secondary" className="text-xs">
                          {page.category || 'Facebook Page'}
                        </Badge>
                      )}
                      {page._source === 'saved' && (
                        <Badge className="text-xs bg-green-100 text-green-700">Connected</Badge>
                      )}
                      {page.has_instagram && <Badge variant="outline" className="text-xs">Instagram linked</Badge>}
                    </div>
                  </div>
                  {selectedPage?.id === page.id && (
                    <CheckCircle2 className="w-5 h-5 text-[hsl(var(--primary))] flex-shrink-0" />
                  )}
                </Label>
              ))}
            </div>
          </RadioGroup>

          <Button onClick={handleContinue} disabled={!selectedPage} className="w-full gap-2">
            Continue with selected Page <ArrowRight className="w-4 h-4" />
          </Button>
        </>
      )}

      {/* Connect via Facebook — the only way to add new pages */}
      <div className="pt-2 border-t border-border">
        <Button
          onClick={handleConnectFacebook}
          disabled={connecting}
          className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {connecting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Connecting…</>
          ) : (
            <><Facebook className="w-4 h-4" /> {hasOauthPages ? 'Reconnect Facebook' : 'Connect via Facebook'}</>
          )}
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Log in with Facebook to load your Business Pages. We only request the permissions needed to manage your ads.
        </p>
      </div>

      {loadingSaved && (
        <p className="text-xs text-muted-foreground text-center">Loading your pages…</p>
      )}
    </div>
  );
}
