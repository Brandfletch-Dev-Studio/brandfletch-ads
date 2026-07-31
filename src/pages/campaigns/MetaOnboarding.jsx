/**
 * Meta Onboarding — Simplified (Agency-Powered)
 *
 * Route: /campaigns/:id/onboarding
 *
 * Flow:
 * 1. Payment → (entry point, shown as complete)
 * 2. Connect Facebook → User grants partner access in Meta Business Settings
 *    and enters their Facebook Page name/URL
 * 3. In Review → Campaign goes to admin dashboard for manual setup
 *
 * No OAuth, no token exchange, no API calls, no programmatic campaign creation.
 * The Brandfletch team manually sets up campaigns in Meta Ads Manager.
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PartyPopper } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

import OnboardingProgress from '@/components/meta/OnboardingProgress';
import ConnectFacebookStep from '@/components/meta/ConnectFacebookStep';

export default function MetaOnboarding() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [step, setStep] = useState('connect_facebook');
  const [done, setDone] = useState(false);

  // ── Load campaign ──────────────────────────────────────────────────
  const loadCampaign = useCallback(async () => {
    try {
      const results = await base44.entities.Campaign.filter({ id });
      const camp = results?.[0];
      if (!camp) {
        toast.error('Campaign not found');
        navigate('/campaigns');
        return;
      }
      setCampaign(camp);

      // If the user already connected their page (fb_page_name is set),
      // skip straight to the "In Review" state.
      if (camp.fb_page_name) {
        setStep('in_review');
        setDone(true);
      }
    } catch (err) {
      console.error('Failed to load campaign:', err);
      toast.error('Failed to load campaign');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { loadCampaign(); }, [loadCampaign]);

  // ── Handle page selected from ConnectFacebookStep ───────────────────
  async function handlePageSelected({ page_name, page_url }) {
    try {
      // Save the page info to the campaign so the admin knows which page to set up
      await base44.entities.Campaign.update(id, {
        fb_page_name: page_name,
        fb_page_url: page_url,
        onboarding_step: 'partner_access_granted',
        onboarding_status: 'access_granted',
      });

      // Also save/update the FacebookPage record for this user
      try {
        const existing = await base44.entities.FacebookPage.filter({ page_name });
        if (existing?.length > 0) {
          await base44.entities.FacebookPage.update(existing[0].id, {
            page_name,
            page_url,
            connection_status: 'connected',
          });
        } else {
          await base44.entities.FacebookPage.create({
            page_name,
            page_url,
            connection_status: 'connected',
          });
        }
      } catch (e) {
        // Non-fatal — the campaign record is the important one
        console.warn('FacebookPage save failed:', e.message);
      }

      setStep('in_review');
      setDone(true);
      toast.success('Page connected! Our team will set up your campaign.');
    } catch (err) {
      console.error('Failed to save page info:', err);
      toast.error('Failed to save — please try again');
    }
  }

  // ── Loading state ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-4 lg:p-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // ── Done / In Review state ──────────────────────────────────────────
  if (done) {
    return (
      <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
        <OnboardingProgress currentStep="in_review" status="complete" />

        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <PartyPopper className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold">You're all set! 🎉</h2>
            <p className="text-muted-foreground">
              Brandfletch's team now has partner access to your Facebook Page
              <strong> {campaign?.fb_page_name}</strong>. We'll set up your ad campaign
              and notify you when it goes live.
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

  // ── Main onboarding flow ────────────────────────────────────────────
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
          <OnboardingProgress currentStep={step} status="active" />
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
          <ConnectFacebookStep
            campaign={campaign}
            onPageSelected={handlePageSelected}
          />
        </CardContent>
      </Card>
    </div>
  );
}
