/**
 * Meta Onboarding — Main Orchestrator
 *
 * Route: /campaigns/:id/onboarding
 *
 * Orchestrates the full Facebook onboarding flow:
 * 1. Payment → (entry point, shown as complete)
 * 2. Page Selection → list existing FacebookPage records + connect new page
 * 3. Connect Facebook → Facebook Login for Business (triggered from page selection)
 * 4. Verify Access → Auto-check or guided manual grant wizard
 * 5. Campaign Creation → Meta Marketing API campaign setup
 * 6. Live → Success state
 *
 * The flow is resumable: if the user leaves and returns, the onboarding
 * record is fetched from the backend and the flow resumes at the correct step.
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, PartyPopper } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { metaClient } from '@/lib/metaClient';

import OnboardingProgress from '@/components/meta/OnboardingProgress';
import PageSelectionStep from '@/components/meta/PageSelectionStep';
import ConnectFacebookStep from '@/components/meta/ConnectFacebookStep';
import VerifyAccessStep from '@/components/meta/VerifyAccessStep';
import CampaignCreationStep from '@/components/meta/CampaignCreationStep';

export default function MetaOnboarding() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [onboardingId, setOnboardingId] = useState(null);
  const [step, setStep] = useState('page_selection');
  const [status, setStatus] = useState('pending');
  const [pageInfo, setPageInfo] = useState(null);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [isLive, setIsLive] = useState(false);

  // ── OAuth callback state ──
  const [oauthPages, setOAuthPages] = useState([]);
  const [oauthBusinesses, setOAuthBusinesses] = useState([]);
  const [oauthCallbackDone, setOAuthCallbackDone] = useState(false);

  // ── Load campaign + resume onboarding state ──────────────────────
  const loadState = useCallback(async () => {
    try {
      // Fetch campaign
      const results = await base44.entities.Campaign.filter({ id });
      const camp = results?.[0];
      if (!camp) {
        toast.error('Campaign not found');
        navigate('/campaigns');
        return;
      }
      setCampaign(camp);

      // ── Check OAuth callback FIRST — if there's a code in the URL,
      // process it immediately before loading (potentially stale) existing state
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      if (code && state) {
        // Clean URL immediately so we don't re-process on refresh
        window.history.replaceState({}, '', `/campaigns/${id}/onboarding`);
        setOnboardingId(state);
        // Stay on page_selection — the OAuth pages will appear there
        setStep('page_selection');
        setStatus('awaiting_page_selection');
        setLoading(false);

        // Exchange the OAuth code for pages + businesses
        try {
          const redirectUri = `${window.location.origin}/campaigns/${id}/onboarding`;
          const res = await metaClient.callback(code, state, redirectUri);
          // Store pages for PageSelectionStep to render
          setOAuthPages(res.pages || []);
          setOAuthBusinesses(res.businesses || []);
          setOAuthCallbackDone(true);
          if ((res.pages || []).length === 0) {
            toast.info('No Facebook Pages found — make sure you have a Business Page.');
          } else {
            toast.success(`Found ${(res.pages || []).length} Facebook Pages`);
          }
        } catch (err) {
          console.error('OAuth callback failed:', err);
          toast.error(err.message || 'Facebook login failed');
          setStatus('error');
        }
        return; // Don't continue loading state — we just handled the callback
      }

      // ── No OAuth callback — check for existing onboarding (resumability) ──
      try {
        const existing = await metaClient.getStatusByCampaign(id);
        if (existing) {
          setOnboardingId(existing.id);
          setStep(existing.step || 'page_selection');
          setStatus(existing.status || 'pending');
          setPageInfo(existing.fb_page_id ? {
            id: existing.fb_page_id,
            name: existing.fb_page_name,
          } : null);
          setBusinessInfo(existing.fb_business_id ? {
            id: existing.fb_business_id,
            name: existing.fb_business_name,
          } : null);
          if (existing.step === 'campaign_creation' && existing.status === 'campaign_created') {
            setIsLive(true);
          }
        }
      } catch (_) {
        // No existing onboarding — start fresh at page_selection
      }
    } catch (err) {
      console.error('Failed to load onboarding state:', err);
      toast.error('Failed to load onboarding state');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, searchParams]);

  useEffect(() => { loadState(); }, [loadState]);

  // ── Step handlers ────────────────────────────────────────────────
  function handlePageSelected({ page, business }) {
    setPageInfo(page);
    setBusinessInfo(business);
    setStep('verify_access');
    setStatus('checking');
  }

  function handleAccessGranted() {
    setStep('campaign_creation');
    setStatus('creating');
  }

  function handleCampaignComplete() {
    setStep('live');
    setStatus('live');
    setIsLive(true);
  }

  function handleError(err) {
    console.error('Onboarding error:', err);
    setStatus('error');
  }

  // ── Loading state ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-4 lg:p-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // ── Live / Success state ──────────────────────────────────────────
  if (isLive) {
    return (
      <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
        <OnboardingProgress currentStep="live" status="complete" />

        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <PartyPopper className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Your campaign is live! 🎉</h2>
            <p className="text-muted-foreground">
              Your Meta Ads campaign for <strong>{pageInfo?.name}</strong> has been created
              and is now running on Brandfletch's ad account.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <Button onClick={() => navigate(`/campaigns/${id}`)}>
                View Campaign Details
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main onboarding flow ──────────────────────────────────────────
  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <button
        onClick={() => navigate(`/campaigns/${id}`)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to campaign
      </button>

      {/* Progress tracker */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <OnboardingProgress currentStep={step} status={status} />
        </CardContent>
      </Card>

      {/* Step content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            Facebook Onboarding
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          {/* Step 2: Page Selection (first post-payment step) */}
          {step === 'page_selection' && (
            <PageSelectionStep
              onboardingId={onboardingId}
              userId={user?.id}
              campaignId={id}
              initialPages={oauthCallbackDone ? oauthPages : undefined}
              initialBusinesses={oauthCallbackDone ? oauthBusinesses : undefined}
              onPageSelected={handlePageSelected}
              onError={handleError}
            />
          )}

          {/* Step 3: Connect Facebook (fallback / legacy) */}
          {/* Kept for backward compatibility with any in-flight onboarding
              records that were saved at step='connect_facebook' before the
              page_selection step existed. New flows start at page_selection. */}
          {step === 'connect_facebook' && (
            <ConnectFacebookStep
              onboardingId={onboardingId}
              onPageSelected={handlePageSelected}
              onError={handleError}
              initialPages={oauthCallbackDone ? oauthPages : undefined}
              initialBusinesses={oauthCallbackDone ? oauthBusinesses : undefined}
              skipConnect={oauthCallbackDone}
            />
          )}

          {/* Step 4: Verify Access */}
          {step === 'verify_access' && pageInfo && (
            <VerifyAccessStep
              onboardingId={onboardingId}
              pageInfo={pageInfo}
              businessInfo={businessInfo}
              onAccessGranted={handleAccessGranted}
              onError={handleError}
            />
          )}

          {/* Step 5: Campaign Creation */}
          {step === 'campaign_creation' && !isLive && (
            <CampaignCreationStep
              onboardingId={onboardingId}
              campaignId={id}
              pageInfo={pageInfo}
              businessInfo={businessInfo}
              campaign={campaign}
              onComplete={handleCampaignComplete}
              onError={handleError}
            />
          )}
        </CardContent>
      </Card>

      {/* Error banner */}
      {status === 'error' && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
          <p className="text-sm text-destructive">
            Something went wrong. You can try again or contact support if the issue persists.
          </p>
          <Button variant="outline" size="sm" onClick={loadState}>
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
