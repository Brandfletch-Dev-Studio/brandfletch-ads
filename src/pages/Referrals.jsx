import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Gift, Copy, Check, Users, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function Referrals() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const referralCode = user?.referral_code || (user?.id ? `BF-${user.id.slice(-6).toUpperCase()}` : '');
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  useEffect(() => {
    if (!user?.id) return;
    base44.entities.Referral.filter({ referrer_id: user.id }, '-created_date')
      .then(data => setReferrals(data))
      .catch(() => setReferrals([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const totalEarned = referrals.reduce((sum, r) => sum + (r.reward_amount || 0), 0);
  const converted = referrals.filter(r => r.status === 'converted').length;
  const pending = referrals.filter(r => r.status === 'pending').length;

  function copyLink() {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function shareWhatsApp() {
    const msg = encodeURIComponent(
      `🚀 Grow your business with Facebook Ads — managed for you!\n\nJoin Brandfletch Ads and get your first campaign set up professionally.\n\nSign up here: ${referralLink}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  }

  function shareNative() {
    if (navigator.share) {
      navigator.share({
        title: 'Brandfletch Ads',
        text: 'Grow your business with professionally managed Facebook Ads.',
        url: referralLink,
      }).catch(() => {});
    } else {
      copyLink();
    }
  }

  const STATUS_CONFIG = {
    pending:   { label: 'Signed Up',  color: 'bg-amber-100 text-amber-700' },
    converted: { label: 'Converted',  color: 'bg-green-100 text-green-700' },
    expired:   { label: 'Expired',    color: 'bg-gray-100 text-gray-500' },
  };

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
          <Gift className="w-6 h-6 text-[hsl(var(--accent))]" /> Refer & Earn
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Invite businesses to Brandfletch Ads and earn rewards when they launch their first campaign.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{referrals.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Referrals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{converted}</p>
            <p className="text-xs text-muted-foreground mt-1">Converted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[hsl(var(--accent))]">{pending}</p>
            <p className="text-xs text-muted-foreground mt-1">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link */}
      <Card className="border-[hsl(var(--primary))]/20 bg-gradient-to-br from-[hsl(var(--primary))]/5 to-[hsl(var(--accent))]/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your Referral Link</CardTitle>
          <CardDescription>Share this link — when someone signs up and runs a campaign, you both benefit.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="text-sm font-mono bg-background"
            />
            <Button variant="outline" onClick={copyLink} className="flex-shrink-0 gap-2">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={shareWhatsApp}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share on WhatsApp
            </Button>
            <Button
              onClick={shareNative}
              variant="outline"
              className="flex-1 gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">How it works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Share your link', desc: 'Send your unique referral link to business owners.' },
              { step: '2', title: 'They sign up', desc: 'Your contact creates an account using your link.' },
              { step: '3', title: 'They launch a campaign', desc: 'When they pay for their first campaign, the referral converts.' },
              { step: '4', title: 'You both benefit', desc: 'You earn a reward and they get priority onboarding support.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary))] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {step}
                </div>
                <div>
                  <p className="font-medium text-sm">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Referral history */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" /> Your Referrals
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-secondary rounded-lg animate-pulse" />)}
            </div>
          ) : referrals.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium text-sm">No referrals yet</p>
              <p className="text-xs mt-1">Share your link to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {referrals.map(r => {
                const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
                return (
                  <div key={r.id} className="flex items-center justify-between px-4 py-3 gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{r.referred_email || r.referred_name || 'Anonymous'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.created_date ? new Date(r.created_date).toLocaleDateString() : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {r.reward_amount > 0 && (
                        <span className="text-xs font-semibold text-green-600">
                          +{r.reward_currency || ''} {r.reward_amount}
                        </span>
                      )}
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
