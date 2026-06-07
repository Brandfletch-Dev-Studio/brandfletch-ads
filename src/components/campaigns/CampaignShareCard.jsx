import { useState } from 'react';
import { Share2, Download, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/**
 * CampaignShareCard
 * Shows a shareable results summary card for a completed/active campaign.
 * Lets clients share their campaign win on WhatsApp, socials, or download it.
 */
export default function CampaignShareCard({ campaign }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!['active', 'completed'].includes(campaign?.status)) return null;

  const impressions = campaign.impressions || campaign.estimated_impressions || 0;
  const reach = campaign.reach || campaign.estimated_reach || 0;
  const clicks = campaign.clicks || 0;

  const formatNum = (n) => {
    if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n/1000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  const shareText = `🚀 My Facebook Ad campaign just went live with Brandfletch Ads!\n\n📊 Results:\n👁️ ${formatNum(impressions)} Impressions\n👥 ${formatNum(reach)} Reach${clicks > 0 ? `\n🔗 ${formatNum(clicks)} Clicks` : ''}\n\nReady to grow your business? 👉 ${window.location.origin}`;

  function shareWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  }

  function copyText() {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function shareNative() {
    if (navigator.share) {
      navigator.share({ title: 'My Campaign Results', text: shareText }).catch(() => {});
    } else {
      copyText();
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <Share2 className="w-4 h-4" />
        Share Results
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Share Your Campaign Results</DialogTitle>
          </DialogHeader>

          {/* Results card preview */}
          <div className="rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] p-5 text-white space-y-4 my-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold text-sm">Campaign {campaign.status === 'active' ? 'Live' : 'Completed'}</span>
            </div>
            <div>
              <p className="text-lg font-bold truncate">{campaign.page_name || campaign.campaign_name}</p>
              <p className="text-white/70 text-xs capitalize">{campaign.package} package · {campaign.duration}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-1">
              {[
                { label: 'Impressions', value: formatNum(impressions) },
                { label: 'Reach', value: formatNum(reach) },
                { label: 'Clicks', value: formatNum(clicks) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/15 rounded-xl p-2.5 text-center">
                  <p className="text-base font-bold">{value}</p>
                  <p className="text-white/70 text-[10px] mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            <p className="text-white/60 text-[10px] text-right">Powered by Brandfletch Ads</p>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={shareWhatsApp} className="bg-green-500 hover:bg-green-600 text-white gap-2 w-full">
              <Share2 className="w-4 h-4" /> Share on WhatsApp
            </Button>
            <Button onClick={shareNative} variant="outline" className="gap-2 w-full">
              <Share2 className="w-4 h-4" /> Share
            </Button>
            <Button onClick={copyText} variant="ghost" className="gap-2 w-full text-muted-foreground">
              {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Download className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Text'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
