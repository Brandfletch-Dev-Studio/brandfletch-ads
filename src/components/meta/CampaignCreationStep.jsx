/**
 * Campaign Creation Step
 *
 * Calls the backend to create the Meta ad campaign using the Marketing API.
 * Shows progress and transitions to "Live" status on success.
 *
 * Props: { onboardingId, campaignId, pageInfo, onComplete, onError }
 */
import { useState, useEffect } from 'react';
import { Rocket, Loader2, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { metaClient } from '@/lib/metaClient';

export default function CampaignCreationStep({ onboardingId, campaignId, pageInfo, onComplete, onError }) {
  const [status, setStatus] = useState('creating'); // creating | success | error
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function create() {
      setStatus('creating');
      try {
        const res = await metaClient.createCampaign(campaignId, onboardingId, pageInfo.id);
        setResult(res);
        setStatus('success');
        toast.success('Campaign created successfully!');
        setTimeout(() => onComplete?.(res), 2000);
      } catch (err) {
        console.error('Campaign creation failed:', err);
        setError(err.message);
        setStatus('error');
        onError?.(err);
      }
    }
    create();
  }, []);

  if (status === 'creating') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="relative">
          <Rocket className="w-12 h-12 text-[hsl(var(--primary))] animate-bounce" />
        </div>
        <p className="text-lg font-semibold">Creating your ad campaign…</p>
        <p className="text-sm text-muted-foreground">
          Setting up your Meta Ads campaign for {pageInfo?.name} on Brandfletch's ad account.
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">This usually takes 5–10 seconds</span>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <p className="text-lg font-semibold">Campaign Created!</p>
        <p className="text-sm text-muted-foreground">Your ads are being prepared to go live.</p>
        {result?.ad_campaign_id && (
          <code className="text-xs text-muted-foreground mt-2">Campaign ID: {result.ad_campaign_id}</code>
        )}
      </div>
    );
  }

  // Error state
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="w-10 h-10 text-destructive" />
      </div>
      <p className="text-lg font-semibold">Campaign creation failed</p>
      <p className="text-sm text-muted-foreground max-w-md text-center">{error}</p>
      <Button
        variant="outline"
        onClick={() => {
          setStatus('creating');
          setError(null);
          metaClient.createCampaign(campaignId, onboardingId, pageInfo.id)
            .then(res => { setResult(res); setStatus('success'); onComplete?.(res); })
            .catch(err => { setError(err.message); setStatus('error'); });
        }}
        className="mt-2"
      >
        Try Again
      </Button>
    </div>
  );
}
