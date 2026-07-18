/**
 * Verify Access Step
 *
 * Two modes:
 * 1. Auto-granted: Brandfletch already has access → auto-continue.
 * 2. Manual grant: Shows a guided wizard with the Brandfletch Business ID
 *    to copy, opens Meta Business Settings, and polls for access.
 *
 * Props: { onboardingId, pageInfo, businessInfo, onAccessGranted, onError }
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldCheck, Copy, ExternalLink, Loader2, CheckCircle2, AlertCircle, Clock,
  ArrowRight, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { metaClient } from '@/lib/metaClient';

export default function VerifyAccessStep({ onboardingId, pageInfo, businessInfo, onAccessGranted, onError }) {
  const [checking, setChecking] = useState(true);
  const [accessResult, setAccessResult] = useState(null);
  const [polling, setPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [granted, setGranted] = useState(false);
  const pollRef = useRef(null);

  // Initial access check
  const checkAccess = useCallback(async () => {
    setChecking(true);
    try {
      const res = await metaClient.checkAccess(
        pageInfo.id,
        businessInfo?.id,
        onboardingId
      );
      setAccessResult(res);

      if (res.has_access) {
        setGranted(true);
        toast.success('Access confirmed! Creating your campaign…');
        setTimeout(() => onAccessGranted?.(res), 1500);
      } else {
        // Start polling
        setPolling(true);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to check access');
      onError?.(err);
    } finally {
      setChecking(false);
    }
  }, [pageInfo, businessInfo, onboardingId, onAccessGranted, onError]);

  useEffect(() => { checkAccess(); }, [checkAccess]);

  // Poll for access grant
  useEffect(() => {
    if (!polling || granted) return;

    const MAX_POLLS = 60; // 5 minutes at 5s intervals
    if (pollCount >= MAX_POLLS) {
      toast.error('Timed out waiting for access. Please try again.');
      return;
    }

    pollRef.current = setTimeout(async () => {
      try {
        const res = await metaClient.getStatus(onboardingId);
        if (res.permissions_granted || res.status === 'access_granted') {
          setGranted(true);
          setPolling(false);
          toast.success('Access confirmed! Creating your campaign…');
          setTimeout(() => onAccessGranted?.(res), 1500);
        } else {
          setPollCount(c => c + 1);
        }
      } catch (err) {
        console.error('Poll error:', err);
        setPollCount(c => c + 1);
      }
    }, 5000);

    return () => clearTimeout(pollRef.current);
  }, [polling, granted, pollCount, onboardingId, onAccessGranted]);

  // Manual "I've Granted Access" button
  async function handleManualCheck() {
    setChecking(true);
    try {
      const res = await metaClient.checkAccess(
        pageInfo.id,
        businessInfo?.id,
        onboardingId
      );
      setAccessResult(res);
      if (res.has_access) {
        setGranted(true);
        setPolling(false);
        toast.success('Access confirmed! Creating your campaign…');
        setTimeout(() => onAccessGranted?.(res), 1500);
      } else {
        toast.info('Access not detected yet. Make sure you completed all the steps in Meta Business Settings.');
        setPollCount(c => c + 1);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to check access');
    } finally {
      setChecking(false);
    }
  }

  function copyBusinessId() {
    const id = accessResult?.brandfletch_business_id || accessResult?.instructions?.business_id_to_copy;
    navigator.clipboard.writeText(id);
    toast.success('Business ID copied to clipboard!');
  }

  function openMetaSettings() {
    const url = accessResult?.instructions?.meta_settings_url || 'https://business.facebook.com/settings/partners';
    window.open(url, '_blank');
  }

  // ── Loading state ──────────────────────────────────────────────────
  if (checking && !accessResult) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
        <p className="text-muted-foreground">Checking permissions for {pageInfo?.name}…</p>
      </div>
    );
  }

  // ── Access granted ─────────────────────────────────────────────────
  if (granted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <CheckCircle2 className="w-12 h-12 text-green-500" />
        <p className="text-lg font-semibold">Access Confirmed!</p>
        <p className="text-sm text-muted-foreground">Brandfletch can now create ads for {pageInfo?.name}.</p>
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Manual grant wizard ────────────────────────────────────────────
  const businessId = accessResult?.brandfletch_business_id || accessResult?.instructions?.business_id_to_copy;

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-800 dark:text-amber-400">Additional permissions needed</p>
          <p className="text-sm text-amber-700 dark:text-amber-500 mt-0.5">
            Brandfletch needs access to manage ads for <strong>{pageInfo?.name}</strong>.
            Grant access in Meta Business Settings — it takes about 30 seconds.
          </p>
        </div>
      </div>

      {/* Step 1: Copy Business ID */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Step 1</Badge>
            Copy Brandfletch's Business ID
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            This is Brandfletch's Meta Business Portfolio ID. You'll paste it in Meta Business Settings.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-3 rounded-lg bg-muted font-mono text-sm select-all">
              {businessId}
            </code>
            <Button variant="outline" size="icon" onClick={copyBusinessId}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Open Meta Business Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Step 2</Badge>
            Open Meta Business Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Click below to open Meta Business Settings in a new tab, then:
          </p>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="font-semibold text-foreground">1.</span>
              Go to <strong>Partners</strong> in the left sidebar
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-foreground">2.</span>
              Click <strong>Add</strong> → <strong>Add by Business ID</strong>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-foreground">3.</span>
              Paste the Business ID above and click <strong>Next</strong>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-foreground">4.</span>
              Select <strong>{pageInfo?.name}</strong> and grant <strong>Advertise</strong> + <strong>Manage</strong>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-foreground">5.</span>
              Click <strong>Save</strong>
            </li>
          </ol>
          <Button onClick={openMetaSettings} variant="outline" className="w-full gap-2">
            <ExternalLink className="w-4 h-4" /> Open Meta Business Settings
          </Button>
        </CardContent>
      </Card>

      {/* Step 3: Confirm */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Step 3</Badge>
            Confirm Access Granted
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Once you've granted access in Meta Business Settings, click the button below.
            We'll verify it automatically.
          </p>

          {polling && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-muted">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>Auto-checking for access… (attempt {pollCount + 1})</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleManualCheck}
              disabled={checking}
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              {checking ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</>
              ) : (
                <><ShieldCheck className="w-4 h-4" /> I've Granted Access</>
              )}
            </Button>
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <p>
              We're also auto-checking every 5 seconds, so you can switch back
              here once you're done — we'll detect it automatically.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
