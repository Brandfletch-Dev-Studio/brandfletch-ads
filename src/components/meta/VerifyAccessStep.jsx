/**
 * Verify Access Step
 *
 * Two modes:
 * 1. Auto-granted: Brandfletch already has access → auto-continue.
 * 2. Manual grant: Shows a guided wizard with the Brandfletch Business ID
 *    auto-copied to clipboard, auto-opens Meta Business Settings,
 *    and polls for access. User taps "I've Granted Access" to verify.
 *
 * Props: { onboardingId, pageInfo, businessInfo, onAccessGranted, onError }
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldCheck, Copy, ExternalLink, Loader2, CheckCircle2, AlertCircle, Clock,
  ArrowRight, Info, ClipboardCheck, Facebook
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
  const [copied, setCopied] = useState(false);
  const [autoOpened, setAutoOpened] = useState(false);
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

  // ── Auto-copy Business ID + auto-open Meta Business Settings when manual grant needed ──
  useEffect(() => {
    if (accessResult && !accessResult.has_access && !autoOpened) {
      const bizId = accessResult.brandfletch_business_id || accessResult?.instructions?.business_id_to_copy;
      // Auto-copy to clipboard
      if (bizId && navigator.clipboard) {
        navigator.clipboard.writeText(bizId).then(() => {
          setCopied(true);
          toast.success('Brandfletch Business ID copied to clipboard!', { duration: 4000 });
        }).catch(() => {});
      }
      // Auto-open Meta Business Settings in new tab
      const url = accessResult.instructions?.meta_settings_url || 'https://business.facebook.com/settings/partners';
      window.open(url, '_blank', 'noopener,noreferrer');
      setAutoOpened(true);
    }
  }, [accessResult, autoOpened]);

  // Poll for access grant
  useEffect(() => {
    if (!polling || granted) return;

    const MAX_POLLS = 72; // 6 minutes at 5s intervals
    if (pollCount >= MAX_POLLS) {
      toast.error('Timed out waiting for access. You can still verify manually or contact support.');
      setPolling(false);
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
        toast.info("Access not detected yet. Make sure you completed all the steps — paste the Business ID, select your Page, and grant Advertise + Manage permissions.");
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
    if (!id) return;
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      toast.success('Business ID copied!');
    }).catch(() => toast.error('Copy failed — long-press the ID to select it'));
  }

  function openMetaSettings() {
    const url = accessResult?.instructions?.meta_settings_url || 'https://business.facebook.com/settings/partners';
    window.open(url, '_blank', 'noopener,noreferrer');
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
  const metaUrl = accessResult?.instructions?.meta_settings_url || 'https://business.facebook.com/settings/partners';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Status banner */}
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-400 text-sm">Additional permissions needed</p>
            <p className="text-sm text-amber-700 dark:text-amber-500 mt-0.5">
              Brandfletch needs access to manage ads for <strong>{pageInfo?.name}</strong>.
              We've copied our Business ID and opened Meta Business Settings for you — just follow the steps below.
            </p>
          </div>
        </div>
      </div>

      {/* Auto-actions confirmation */}
      {copied && autoOpened && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
          <ClipboardCheck className="w-4 h-4 flex-shrink-0" />
          <span>Business ID copied to clipboard ✓ · Meta Business Settings opened in a new tab ✓</span>
        </div>
      )}

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
            This is Brandfletch's Meta Business Portfolio ID. {copied ? 'It\'s already in your clipboard!' : 'Tap the copy button below.'}
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-3 rounded-lg bg-muted font-mono text-xs sm:text-sm select-all break-all">
              {businessId}
            </code>
            <Button variant="outline" size="icon" onClick={copyBusinessId} className="shrink-0">
              {copied ? <ClipboardCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Open Meta Business Settings — guided wizard */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Step 2</Badge>
            Grant Access in Meta Business Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {autoOpened ? 'Meta Business Settings should be open in a new tab. If not, click below to reopen it.' : 'Click below to open Meta Business Settings, then:'}
          </p>

          {/* Visual step guide */}
          <div className="space-y-2.5">
            {[
              { num: 1, text: 'Go to', bold: 'Partners', text2: 'in the left sidebar' },
              { num: 2, text: 'Click', bold: 'Add', text2: '→ Add a partner by Business ID' },
              { num: 3, text: 'Paste the Business ID above and click', bold: 'Next', text2: '' },
              { num: 4, text: 'Select', bold: pageInfo?.name || 'your Facebook Page', text2: 'from the list' },
              { num: 5, text: 'Grant', bold: 'Advertise + Manage', text2: 'permissions' },
              { num: 6, text: 'Click', bold: 'Save', text2: 'and come back here' },
            ].map(step => (
              <div key={step.num} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {step.num}
                </span>
                <p className="text-sm text-muted-foreground leading-snug pt-0.5">
                  {step.text} <strong className="text-foreground">{step.bold}</strong> {step.text2}
                </p>
              </div>
            ))}
          </div>

          <Button onClick={openMetaSettings} variant="outline" className="w-full gap-2">
            <ExternalLink className="w-4 h-4" /> {autoOpened ? 'Reopen' : 'Open'} Meta Business Settings
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
            Once you've granted access in Meta Business Settings, tap below. We'll verify it instantly.
          </p>

          {/* Polling indicator */}
          {polling && !checking && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-muted">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>Auto-checking for access… (attempt {pollCount + 1})</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
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
            <Button
              variant="outline"
              onClick={openMetaSettings}
              className="gap-2 sm:w-auto"
            >
              <ExternalLink className="w-4 h-4" /> Reopen Settings
            </Button>
          </div>

          {/* Help text */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <p>
              We're also auto-checking every 5 seconds — you don't need to stay on this screen.
              If you leave and come back, we'll pick up where you left off.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
