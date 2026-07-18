/**
 * Meta Onboarding — Main Orchestrator
 *
 * Route: /campaigns/:id/onboarding
 *
 * Orchestrates the full Facebook onboarding flow:
 * 1. Payment → (entry point, shown as complete)
 * 2. Connect Facebook → Facebook Login for Business + Page selection
 * 3. Verify Access → Auto-check or guided manual grant wizard
 * 4. Campaign Creation → Meta Marketing API campaign setup
 * 5. Live → Success state
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
  const [step, setStep] = useState('connect_facebook');
  const [status, setStatus] = useState('pending');
  const [pageInfo, setPageInfo] = useState(null);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [isLive, setIsLive] = useState(false);

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

      // Check if onboarding already exists for this campaign
      try {
        const existing = await metaClient.getStatusByCampaign(id);
        if (existing) {
          setOnboardingId(existing.id);
          setStep(existing.step || 'connect_facebook');
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
        // No existing onboarding — start fresh
      }

      // Handle OAuth callback (code + state in URL)
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      if (code && state) {
        // Clean URL
        window.history.replaceState({}, '', `/campaigns/${id}/onboarding`);
        // Trigger callback handler
        if (window.__metaOnboardingCallback) {
          setOnboardingId(state);
          setStep('connect_facebook');
          setStatus('awaiting_page_selection');
          window.__metaOnboardingCallback(code, state);
        }
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
          {/* Step 2: Connect Facebook */}
          {step === 'connect_facebook' && (
            <ConnectFacebookStep
              onboardingId={onboardingId}
              onPageSelected={handlePageSelected}
              onError={handleError}
            />
          )}

          {/* Step 3: Verify Access */}
          {step === 'verify_access' && pageInfo && (
            <VerifyAccessStep
              onboardingId={onboardingId}
              pageInfo={pageInfo}
              businessInfo={businessInfo}
              onAccessGranted={handleAccessGranted}
              onError={handleError}
            />
          )}

          {/* Step 4: Campaign Creation */}
          {step === 'campaign_creation' && !isLive && (
            <CampaignCreationStep
              onboardingId={onboardingId}
              campaignId={id}
              pageInfo={pageInfo}
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
