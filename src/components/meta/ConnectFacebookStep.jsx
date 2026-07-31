/**
 * Connect Facebook Step — Simplified (Agency-Powered)
 *
 * No OAuth, no token exchange, no API calls.
 * Just shows Brandfletch's Business ID, a link to Meta Business Settings,
 * and simple instructions for the user to grant partner access.
 *
 * After granting, the user enters their Facebook Page name/URL so the
 * agency team knows which page to set up ads for.
 *
 * Props: { onPageSelected, campaign }
 */
import React, { useState } from 'react';
import {
  Facebook, Copy, ExternalLink, CheckCircle2, ArrowRight,
  ClipboardCheck, Building2, Link as LinkIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Brandfletch's Meta Business Portfolio ID.
// Set VITE_META_BUSINESS_ID in your .env to match the server-side META_BUSINESS_ID.
const BRANDFLETCH_BUSINESS_ID = import.meta.env.VITE_META_BUSINESS_ID || '';
const META_BUSINESS_SETTINGS_URL = 'https://business.facebook.com/settings/partners';

export default function ConnectFacebookStep({ onPageSelected, campaign }) {
  const [copied, setCopied] = useState(false);
  const [pageName, setPageName] = useState(campaign?.page_name || '');
  const [pageUrl, setPageUrl] = useState(campaign?.page_url || '');

  function copyBusinessId() {
    if (!BRANDFLETCH_BUSINESS_ID) {
      toast.error('Business ID not configured. Contact support.');
      return;
    }
    navigator.clipboard.writeText(BRANDFLETCH_BUSINESS_ID).then(() => {
      setCopied(true);
      toast.success('Business ID copied to clipboard!');
    }).catch(() => toast.error('Copy failed — long-press the ID to select it'));
  }

  function handleContinue() {
    if (!pageName.trim()) {
      toast.error('Please enter your Facebook Page name');
      return;
    }
    onPageSelected({
      page_name: pageName.trim(),
      page_url: pageUrl.trim() || `https://facebook.com/${pageName.trim().replace(/\s+/g, '')}`,
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-2">
        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
          <Facebook className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold">Connect your Facebook Page</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Grant Brandfletch partner access to your Facebook Business so our team
          can set up and manage your ads.
        </p>
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
            This is Brandfletch's Meta Business Portfolio ID. {copied ? "It's already in your clipboard!" : 'Tap the copy button below.'}
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-3 rounded-lg bg-muted font-mono text-xs sm:text-sm select-all break-all">
              {BRANDFLETCH_BUSINESS_ID || 'Not configured — contact support'}
            </code>
            <Button variant="outline" size="icon" onClick={copyBusinessId} className="shrink-0">
              {copied ? <ClipboardCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Open Meta Business Settings & grant access */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Step 2</Badge>
            Grant Access in Meta Business Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click below to open Meta Business Settings, then follow these steps:
          </p>

          <div className="space-y-2.5">
            {[
              { num: 1, text: 'Go to', bold: 'Partners', text2: 'in the left sidebar' },
              { num: 2, text: 'Click', bold: 'Add', text2: '→ Give a partner access to your assets' },
              { num: 3, text: 'Paste the Business ID above and click', bold: 'Next', text2: '' },
              { num: 4, text: 'Select your Facebook Page and grant', bold: 'Advertise', text2: 'permission' },
              { num: 5, text: 'Click', bold: 'Save', text2: 'and come back here' },
            ].map(step => (
              <div key={step.num} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {step.num}
                </div>
                <p className="text-sm text-muted-foreground">
                  {step.text} <span className="font-semibold text-foreground">{step.bold}</span>{step.text2 && ` ${step.text2}`}
                </p>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={() => window.open(META_BUSINESS_SETTINGS_URL, '_blank', 'noopener,noreferrer')}
            className="w-full gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Open Meta Business Settings
          </Button>
        </CardContent>
      </Card>

      {/* Step 3: Enter your Facebook Page info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Step 3</Badge>
            Tell us your Facebook Page
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Which Facebook Page did you grant access to? Our team needs this to set up your ads.
          </p>

          <div className="space-y-3">
            <div>
              <Label className="text-sm font-semibold flex items-center gap-2 mb-1.5">
                <Building2 className="w-3.5 h-3.5" /> Facebook Page Name
              </Label>
              <Input
                value={pageName}
                onChange={e => setPageName(e.target.value)}
                placeholder="e.g. My Business Page"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold flex items-center gap-2 mb-1.5">
                <LinkIcon className="w-3.5 h-3.5" /> Page URL (optional)
              </Label>
              <Input
                value={pageUrl}
                onChange={e => setPageUrl(e.target.value)}
                placeholder="https://facebook.com/yourpage"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Continue */}
      <Button
        onClick={handleContinue}
        disabled={!pageName.trim()}
        className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
      >
        <CheckCircle2 className="w-4 h-4" />
        I've Granted Access — Continue
        <ArrowRight className="w-4 h-4" />
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Brandfletch's team will set up and manage your ads manually.
        You'll receive a notification when your campaign goes live.
      </p>
    </div>
  );
}
