import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import {
  LayoutDashboard, Link2, Users, DollarSign, Wallet,
  Image, UserCircle, Copy, Check, Share2,
  TrendingUp, Clock, CheckCircle, XCircle, AlertCircle,
  Download, MessageSquare, Loader2,
  Phone, Mail, Bell, CreditCard,
  Gift, ArrowRight, Zap, RefreshCw, BookOpen,
  Megaphone, Video, Palette, Globe, Layers
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

function compactNum(val) {
  const n = Number(val);
  if (isNaN(n)) return val;
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toLocaleString();
}



// Resolve the effective commission for a given service key
function resolveServiceCommission(settings, serviceKey, currency) {
  if (!settings) return null;
  const typeField  = `${serviceKey}_commission_type`;
  const fixedField = `${serviceKey}_fixed_amount`;
  const pctField   = `${serviceKey}_percentage`;
  const type = settings[typeField] || 'global';
  if (type === 'global') {
    return settings.default_commission_type === 'fixed'
      ? `${currency} ${(settings.default_fixed_amount || 0).toLocaleString()} fixed`
      : `${settings.default_percentage || 0}% of sale`;
  }
  if (type === 'fixed') return `${currency} ${(settings[fixedField] || 0).toLocaleString()} fixed`;
  return `${settings[pctField] || 0}% of sale`;
}

const SERVICE_LABELS = {
  meta_ads:       'Meta Ads',
  ugc_ads:        'UGC Ads',
  graphic_design: 'Graphic Design',
  social_media:   'Social Media',
  web_dev:        'Web Development',
  branding:       'Branding',
};

const TABS = [
  { id: 'dashboard',   label: 'Dashboard',          icon: LayoutDashboard },
  { id: 'links',       label: 'Referral Links',      icon: Link2 },
  { id: 'referrals',   label: 'Referrals',           icon: Users },
  { id: 'commissions', label: 'Commissions',         icon: DollarSign },
  { id: 'payouts',     label: 'Payouts',             icon: Wallet },
  { id: 'materials',   label: 'Marketing Materials', icon: Image },
  { id: 'profile',     label: 'Profile & Payment',   icon: UserCircle },
];

const COMMISSION_STATUS = {
  pending:  { label: 'Pending',  color: 'bg-amber-100 text-amber-700',  icon: Clock },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700',    icon: CheckCircle },
  paid:     { label: 'Paid',     color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700',      icon: XCircle },
};

const PAYOUT_STATUS = {
  pending:    { label: 'Pending',    color: 'bg-amber-100 text-amber-700' },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700'  },
  completed:  { label: 'Completed',  color: 'bg-green-100 text-green-700'},
  rejected:   { label: 'Rejected',   color: 'bg-red-100 text-red-700'    },
};

function useCopyClipboard() {
  const [copied, setCopied] = useState('');
  function copy(text, key) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      toast.success('Copied!');
      setTimeout(() => setCopied(''), 2000);
    });
  }
  return { copied, copy };
}

// ─── TAB: Dashboard ───────────────────────────────────────────────────
function DashboardTab({ user, affiliateSettings, referrals = [], commissions = [], payouts = [] }) {
  const { copied, copy } = useCopyClipboard();

  const totalEarnings    = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + (c.commission_amount || 0), 0);
  const pendingComm      = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + (c.commission_amount || 0), 0);
  const paidComm         = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + (c.commission_amount || 0), 0);
  const paidOut          = payouts.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0);
  const availableBalance = Math.max(0, paidComm - paidOut);
  const converted        = referrals.filter(r => r.status === 'converted').length;
  const convRate         = referrals.length > 0 ? Math.round((converted / referrals.length) * 100) : 0;
  const minPayout        = affiliateSettings?.minimum_payout || 5000;
  const currency         = affiliateSettings?.minimum_payout_currency || affiliateSettings?.default_currency || 'MWK';

  const code     = user?.referral_code || (user?.id ? `BF-${user.id.slice(-6).toUpperCase()}` : '');
  const baseLink = typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${code}` : '';

  // ── Commission rows — reads flat/percentage/fixed from affiliateSettings ──
  const commRows = Object.entries(SERVICE_LABELS).map(([key, label]) => {
    if (!affiliateSettings) return { key, label, rate: '—', sub: 'Set by admin', type: 'tbc' };
    const typeField  = `${key}_commission_type`;
    const fixedField = `${key}_fixed_amount`;
    const pctField   = `${key}_percentage`;
    const type = affiliateSettings[typeField] || 'global';
    let rate, sub, commType;
    if (type === 'global') {
      if (affiliateSettings.default_commission_type === 'fixed') {
        rate = `${currency} ${(affiliateSettings.default_fixed_amount || 0).toLocaleString()}`;
        sub  = 'Fixed per sale';
        commType = 'fixed';
      } else {
        rate = `${affiliateSettings.default_percentage || 0}%`;
        sub  = 'Of sale value';
        commType = 'percentage';
      }
    } else if (type === 'fixed') {
      rate = `${currency} ${(affiliateSettings[fixedField] || 0).toLocaleString()}`;
      sub  = 'Fixed per sale';
      commType = 'fixed';
    } else {
      rate = `${affiliateSettings[pctField] || 0}%`;
      sub  = 'Of sale value';
      commType = 'percentage';
    }
    const recurringApplies = !affiliateSettings?.recurring_applies_to?.length || affiliateSettings.recurring_applies_to.includes(key);
    const recurring = affiliateSettings?.recurring_enabled && recurringApplies
      ? (affiliateSettings.recurring_type === 'fixed'
          ? `+ ${currency} ${(affiliateSettings.recurring_fixed_amount || 0).toLocaleString()} /renewal`
          : `+ ${affiliateSettings.recurring_percentage || 0}% /renewal`)
      : null;
    return { key, label, rate, sub, commType, recurring };
  });

  // ── Per-service referral links with prefilled WhatsApp messages ──
  const SERVICE_LINK_META = {
    meta_ads: {
      icon: Megaphone, gradient: 'from-blue-500 to-blue-600',
      cta: 'Get clients with Facebook & Instagram Ads',
      message: (link) =>
        `🚀 *Grow your business with Meta Ads!*\n\nAre you spending money on ads but not seeing results? Brandfletch Media creates and manages high-converting Facebook & Instagram campaigns for businesses.\n\n✅ Done-for-you campaigns\n✅ Real results tracked\n✅ Affordable MWK pricing\n\nSign up here 👇\n${link}`,
    },
    ugc_ads: {
      icon: Video, gradient: 'from-purple-500 to-purple-600',
      cta: 'Video ads that actually convert',
      message: (link) =>
        `🎬 *Need video ads that actually convert?*\n\nBrandfletch Media creates UGC-style video creatives that work on Facebook & Instagram — designed to make customers take action.\n\n✅ Meta Ads-ready format\n✅ Real creators, authentic feel\n✅ Affordable pricing\n\nCheck it out 👇\n${link}`,
    },
    graphic_design: {
      icon: Palette, gradient: 'from-pink-500 to-pink-600',
      cta: 'Professional design — monthly retainer',
      message: (link) =>
        `🎨 *Tired of inconsistent graphics?*\n\nBrandfletch Media offers professional graphic design on a monthly retainer — social posts, flyers, banners, motion graphics and more.\n\n✅ Fast turnaround\n✅ Unlimited revisions\n✅ MWK pricing\n\nGet started 👇\n${link}`,
    },
    social_media: {
      icon: Share2, gradient: 'from-green-500 to-green-600',
      cta: 'Full social media management',
      message: (link) =>
        `📱 *Let us run your social media!*\n\nBrandfletch Media handles everything — content creation, scheduling, captions, Reels, and community management.\n\n✅ Consistent posting\n✅ Branded content\n✅ Affordable monthly packages\n\nLearn more 👇\n${link}`,
    },
    web_dev: {
      icon: Globe, gradient: 'from-orange-500 to-orange-600',
      cta: 'Websites built to convert',
      message: (link) =>
        `🌐 *Your business needs a proper website!*\n\nBrandfletch Designs builds mobile-first, conversion-focused websites for African businesses — fast, professional, and affordable.\n\n✅ Mobile responsive\n✅ WhatsApp integration\n✅ SEO-ready\n\nSee packages 👇\n${link}`,
    },
    branding: {
      icon: Layers, gradient: 'from-amber-500 to-amber-600',
      cta: 'Logo & brand identity packages',
      message: (link) =>
        `✨ *Make your brand stand out!*\n\nBrandfletch Media creates professional logos, brand identities, and full brand systems for businesses ready to look the part.\n\n✅ Multiple concepts\n✅ All file formats included\n✅ Social media templates\n\nSee packages 👇\n${link}`,
    },
  };

  const serviceLinks = Object.entries(SERVICE_LABELS).map(([key, label]) => {
    const meta  = SERVICE_LINK_META[key] || { icon: Gift, gradient: 'from-gray-500 to-gray-600', cta: label, message: (l) => `Sign up via my link:\n${l}` };
    const url   = `${baseLink}&service=${key}`;
    const waMsg = encodeURIComponent(meta.message(url));
    const commRow = commRows.find(r => r.key === key);
    return { key, label, url, waMsg, meta, commRow };
  });

  function shareWA(waMsg) { window.open(`https://wa.me/?text=${waMsg}`, '_blank'); }
  function shareNative(url, label) {
    if (navigator.share) navigator.share({ title: label, url }).catch(() => {});
    else copy(url, label);
  }

  return (
    <div className="space-y-8">

      {/* ── 1. HERO ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
        <div className="bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(var(--primary))]/90 to-[hsl(var(--accent))]/80 px-6 py-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                  <Gift className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest opacity-70">Affiliate Program</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-heading leading-tight">
                Welcome, {user?.full_name?.split(' ')[0] || 'Affiliate'} 👋
              </h1>
              <p className="text-white/70 text-sm mt-2 max-w-md leading-relaxed">
                Refer businesses to Brandfletch Media and earn a commission for every client you bring in. The more you refer, the more you earn.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5 text-sm font-medium border border-white/15">
                  <code className="font-mono text-base font-black tracking-widest">{code}</code>
                </div>
                <button
                  onClick={() => copy(code, 'hero-code')}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-1.5 text-sm font-medium border border-white/15 transition-colors"
                >
                  {copied === 'hero-code' ? <><Check className="w-3.5 h-3.5 text-green-300" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy code</>}
                </button>
                <button
                  onClick={() => copy(baseLink, 'hero-link')}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-1.5 text-sm font-medium border border-white/15 transition-colors"
                >
                  {copied === 'hero-link' ? <><Check className="w-3.5 h-3.5 text-green-300" /> Copied</> : <><Link2 className="w-3.5 h-3.5" /> Copy link</>}
                </button>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-center gap-2 bg-white/10 border border-white/15 rounded-2xl p-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(baseLink)}&color=ffffff&bgcolor=00000000`}
                alt="QR Code"
                className="w-20 h-20 rounded-lg"
              />
              <p className="text-xs opacity-60">Your QR code</p>
            </div>
          </div>
        </div>
        {/* Status strip */}
        <div className="bg-card px-6 py-3 flex flex-wrap gap-4 text-xs border-t border-border">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <div className={cn('w-2 h-2 rounded-full', affiliateSettings?.program_enabled ? 'bg-emerald-500' : 'bg-red-400')} />
            <span>{affiliateSettings?.program_enabled ? 'Program active' : 'Program paused'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Wallet className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
            <span>Min. payout: <strong className="text-foreground">{currency} {minPayout.toLocaleString()}</strong></span>
          </div>
          {affiliateSettings?.cookie_duration_days > 0 && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Cookie window: <strong className="text-foreground">{affiliateSettings.cookie_duration_days} days</strong></span>
            </div>
          )}
          {affiliateSettings?.recurring_enabled && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
              <span>Recurring commissions enabled</span>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. COMMISSION RATES ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h2 className="font-bold text-base font-heading">Your Commission Rates</h2>
            <p className="text-xs text-muted-foreground">Earn on every service your referrals purchase</p>
          </div>
          {affiliateSettings && (
            <div className="ml-auto shrink-0">
              <Badge className={cn('text-xs font-semibold',
                affiliateSettings.default_commission_type === 'fixed'
                  ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
              )}>
                {affiliateSettings.default_commission_type === 'fixed' ? 'Flat Rate' : 'Percentage'} structure
              </Badge>
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {commRows.map(({ key, label, rate, sub, commType, recurring }) => {
              const meta = SERVICE_LINK_META[key];
              const Icon = meta?.icon || Gift;
              return (
                <div key={key}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 hover:border-[hsl(var(--primary))]/30 transition-colors">
                  <div className={cn('w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0', meta?.gradient || 'from-gray-500 to-gray-600')}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                    {recurring && <p className="text-[11px] text-blue-500 font-medium mt-0.5">{recurring}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('text-base font-bold tabular-nums',
                      commType === 'percentage' ? 'text-emerald-600' : 'text-[hsl(var(--primary))]'
                    )}>{rate}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      {commType === 'percentage' ? 'per sale' : 'fixed'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {affiliateSettings?.recurring_enabled && (
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-blue-500/5 border border-blue-500/15 px-4 py-3">
              <RefreshCw className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Recurring Commissions</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You also earn on renewal payments —{' '}
                  <strong className="text-foreground">
                    {affiliateSettings.recurring_type === 'fixed'
                      ? `${currency} ${(affiliateSettings.recurring_fixed_amount || 0).toLocaleString()} per renewal`
                      : `${affiliateSettings.recurring_percentage || 0}% per renewal`}
                  </strong>
                  {affiliateSettings.recurring_max_months > 0
                    ? ` for up to ${affiliateSettings.recurring_max_months} months`
                    : ' with no limit'}
                  .
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. STAT CARDS ───────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-bold font-heading mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[hsl(var(--primary))]" /> Your Performance
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: 'Total Earnings',      value: `${currency} ${compactNum(totalEarnings)}`,          sub: 'All paid commissions',   color: 'text-emerald-600', bg: 'bg-emerald-500/10', icon: TrendingUp },
            { label: 'Available Balance',   value: `${currency} ${compactNum(availableBalance)}`,       sub: 'Ready to withdraw',      color: 'text-[hsl(var(--primary))]', bg: 'bg-[hsl(var(--primary))]/10', icon: Wallet },
            { label: 'Pending Commissions', value: `${currency} ${compactNum(pendingComm)}`,            sub: 'Awaiting approval',      color: 'text-amber-600',   bg: 'bg-amber-500/10',   icon: Clock },
            { label: 'Total Referrals',     value: compactNum(referrals.length),                       sub: `${converted} converted`, color: 'text-sky-600',     bg: 'bg-sky-500/10',     icon: Users },
            { label: 'Conversion Rate',     value: `${convRate}%`,                                     sub: 'Signups → clients',      color: 'text-violet-600',  bg: 'bg-violet-500/10',  icon: ArrowRight },
            { label: 'Paid Out',            value: `${currency} ${compactNum(paidOut)}`,               sub: 'Withdrawn to date',      color: 'text-teal-600',    bg: 'bg-teal-500/10',    icon: CheckCircle },
          ].map(({ label, value, sub, color, bg, icon: Icon }) => (
            <div key={label} className="bg-card rounded-2xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', bg)}>
                <Icon className={cn('w-4 h-4', color)} />
              </div>
              <p className={cn('text-xl font-bold font-heading leading-tight tabular-nums', color)}>{value}</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. HOW TO REFER & EARN ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[hsl(var(--primary))]/10 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-[hsl(var(--primary))]" />
          </div>
          <div>
            <h2 className="font-bold text-base font-heading">How to Refer &amp; Earn</h2>
            <p className="text-xs text-muted-foreground">4 simple steps to start earning</p>
          </div>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              step: '01', icon: Link2, color: 'bg-blue-500/10 text-blue-600',
              title: 'Copy your referral link',
              desc: 'Pick a service link below — each one has your tracking code pre-built in and a ready-made WhatsApp message.',
            },
            {
              step: '02', icon: Share2, color: 'bg-purple-500/10 text-purple-600',
              title: 'Share with businesses',
              desc: 'Send via WhatsApp, social media, email, or face-to-face. Target businesses that need digital marketing help.',
            },
            {
              step: '03', icon: Users, color: 'bg-amber-500/10 text-amber-600',
              title: 'They sign up & subscribe',
              desc: 'When someone clicks your link and purchases any Brandfletch service, the referral is automatically linked to your account.',
            },
            {
              step: '04', icon: Wallet, color: 'bg-emerald-500/10 text-emerald-600',
              title: 'Withdraw your earnings',
              desc: `Once your balance hits ${currency} ${minPayout.toLocaleString()}, go to the Payouts tab and request a withdrawal via mobile money or bank.`,
            },
          ].map(({ step, icon: Icon, title, desc, color }) => (
            <div key={step} className="flex gap-4 p-4 rounded-xl bg-muted/30 border border-border/40 hover:border-[hsl(var(--primary))]/25 transition-colors">
              <div className="shrink-0 flex flex-col items-center gap-2">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-muted-foreground/40 tracking-widest">{step}</span>
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mx-5 mb-5 flex items-start gap-3 rounded-xl bg-[hsl(var(--primary))]/5 border border-[hsl(var(--primary))]/20 px-4 py-3">
          <Zap className="w-4 h-4 text-[hsl(var(--primary))] shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Pro tip:</strong> Use the service-specific links below — they pre-select the right service for the business you're talking to, making it easier for them to place an order.
          </p>
        </div>
      </div>

      {/* ── 5. PER-SERVICE REFERRAL LINKS ────────────────────────────────── */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-bold font-heading flex items-center gap-2">
            <Link2 className="w-4 h-4 text-[hsl(var(--primary))]" /> Your Referral Links
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Each link is pre-tagged with your tracking code. Tap WhatsApp to send with a prefilled message.</p>
        </div>
        <div className="space-y-3">
          {serviceLinks.map(({ key, label, url, waMsg, meta, commRow }) => {
            const Icon = meta.icon;
            const linkKey = `link-${key}`;
            const msgKey  = `msg-${key}`;
            const rawMsg  = decodeURIComponent(waMsg);
            return (
              <div key={key} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden hover:border-[hsl(var(--primary))]/30 transition-colors">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60">
                  <div className={cn('w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0', meta.gradient)}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">{meta.cta}</p>
                  </div>
                  {commRow && (
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-emerald-600">{commRow.rate}</p>
                      <p className="text-[10px] text-muted-foreground">your commission</p>
                    </div>
                  )}
                </div>

                {/* Link row */}
                <div className="px-4 pt-3 pb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Referral link</p>
                  <div className="flex gap-2">
                    <div className="flex-1 min-w-0 bg-muted rounded-lg px-3 py-1.5 font-mono text-xs text-muted-foreground truncate select-all">
                      {url}
                    </div>
                    <button
                      onClick={() => copy(url, linkKey)}
                      className="shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-background hover:bg-secondary text-xs font-medium transition-colors"
                    >
                      {copied === linkKey ? <><Check className="w-3 h-3 text-green-500" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                    </button>
                  </div>
                </div>

                {/* Prefilled message preview */}
                <div className="px-4 pb-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Prefilled message</p>
                  <div className="bg-muted/50 rounded-xl px-3 py-2.5 text-xs text-muted-foreground whitespace-pre-line leading-relaxed border border-border/40 max-h-24 overflow-hidden relative">
                    {rawMsg.split('\n').slice(0, 5).join('\n')}
                    {rawMsg.split('\n').length > 5 && (
                      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-muted/50 to-transparent rounded-b-xl" />
                    )}
                  </div>
                  <button
                    onClick={() => copy(rawMsg, msgKey)}
                    className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copied === msgKey ? <><Check className="w-3 h-3 text-green-500" /> Message copied</> : <><Copy className="w-3 h-3" /> Copy message</>}
                  </button>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 px-4 pb-4">
                  <button
                    onClick={() => shareWA(waMsg)}
                    className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" /> Send on WhatsApp
                  </button>
                  <button
                    onClick={() => shareNative(url, label)}
                    className="flex items-center justify-center gap-2 h-9 px-4 rounded-xl border border-border bg-background hover:bg-secondary text-sm font-medium transition-colors"
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

function LinksTab({ user }) {
  const { copied, copy } = useCopyClipboard();
  const code     = user?.referral_code || (user?.id ? `BF-${user.id.slice(-6).toUpperCase()}` : '');
  const baseLink = typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${code}` : '';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold font-heading">Your Referral Code</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Use this code or the links below to refer new clients</p>
        <div className="mt-3 inline-flex items-center gap-3 bg-secondary px-4 py-2 rounded-xl">
          <code className="text-lg font-bold font-mono tracking-widest">{code}</code>
          <button onClick={() => copy(code, 'code')} className="text-muted-foreground hover:text-foreground transition-colors">
            {copied === 'code' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <Card className="border-dashed">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-28 h-28 bg-secondary rounded-xl flex items-center justify-center flex-shrink-0">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(baseLink)}&color=000000&bgcolor=ffffff`}
              alt="QR Code" className="w-24 h-24 rounded"
            />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="font-medium text-sm">Your QR Code</p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">Print or share this QR code — scanning it opens your referral signup link</p>
            <Button size="sm" variant="outline" className="gap-2"
              onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(baseLink)}`, '_blank')}>
              <Download className="w-3.5 h-3.5" /> Download QR
            </Button>
          </div>
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground">For service-specific links with prefilled messages, see the <strong>Dashboard</strong> tab.</p>
    </div>
  );
}

function ReferralsTab({ referrals = [], loading, affiliateSettings }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = referrals.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !search || r.referred_name?.toLowerCase().includes(q) || r.referred_email?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search referrals..." className="pl-3 h-9 text-sm" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Signed Up</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-secondary rounded-lg animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium text-sm">No referrals found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Name / Email','Registered','Enrollment','Payment','Commission'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(r => (
                    <tr key={r.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{r.referred_name || '—'}</p>
                        <p className="text-xs text-muted-foreground">{r.referred_email || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {r.created_date ? format(new Date(r.created_date), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={r.status === 'converted' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                          {r.status === 'converted' ? 'Active' : 'Registered'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={r.status === 'converted' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                          {r.status === 'converted' ? 'Paid' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-semibold text-green-600">
                        {r.reward_amount ? `${r.reward_currency || affiliateSettings?.minimum_payout_currency || affiliateSettings?.default_currency || 'MWK'} ${r.reward_amount.toLocaleString()}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── TAB: Commissions ─────────────────────────────────────────────────
function CommissionsTab({ commissions = [], loading, affiliateSettings }) {
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = commissions.filter(c => statusFilter === 'all' || c.status === statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(COMMISSION_STATUS).map(([k,v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-secondary rounded-lg animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium text-sm">No commissions yet</p>
              <p className="text-xs mt-1">Commissions are created when your referrals make purchases</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Date','Referral','Product','Commission Amount','Status'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(c => {
                    const cfg = COMMISSION_STATUS[c.status] || COMMISSION_STATUS.pending;
                    return (
                      <tr key={c.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {c.created_date ? format(new Date(c.created_date), 'MMM d, yyyy') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{c.referred_user_name || '—'}</p>
                          <p className="text-xs text-muted-foreground">{c.referred_user_email || ''}</p>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-1.5">
                            <span>{c.product_name || (c.service_type || '—').replace(/_/g,' ')}</span>
                            {c.is_recurring && (
                              <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium">Recurring</span>
                            )}
                          </div>
                          {c.is_recurring && c.recurring_month && (
                            <p className="text-xs text-muted-foreground mt-0.5">Month {c.recurring_month}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-green-600">
                            {c.commission_currency || affiliateSettings?.minimum_payout_currency || affiliateSettings?.default_currency || 'MWK'} {(c.commission_amount || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {c.commission_type === 'percentage'
                              ? `${c.commission_rate || 0}% of ${c.commission_currency || 'MWK'} ${(c.sale_amount || 0).toLocaleString()}`
                              : `Fixed amount`}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── TAB: Payouts ──────────────────────────────────────────────────────
function PayoutsTab({ user, affiliateSettings, commissions = [], payouts = [], loading, onPayoutRequested }) {
  const [showRequest, setShowRequest] = useState(false);
  const [method, setMethod] = useState('airtel_money');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currency = affiliateSettings?.minimum_payout_currency || affiliateSettings?.default_currency || 'MWK';
  const minPayout = affiliateSettings?.minimum_payout || 5000;
  const paidComm = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + (c.commission_amount || 0), 0);
  const paidOut  = payouts.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0);
  const available = Math.max(0, paidComm - paidOut);
  const canWithdraw = available >= minPayout;
  const hasPending = payouts.some(p => p.status === 'pending' || p.status === 'processing');

  async function requestPayout() {
    if (!details.trim()) { toast.error('Please enter your payment details'); return; }
    setSubmitting(true);
    try {
      await base44.entities.AffiliatePayout.create({
        affiliate_id: user.id,
        affiliate_name: user.full_name || user.email,
        amount: available,
        currency,
        payment_method: method,
        payment_details: details,
        status: 'pending',
      });
      toast.success('Payout request submitted! We\'ll process it within 2–3 business days.');
      setShowRequest(false);
      onPayoutRequested();
    } catch {
      toast.error('Failed to submit payout request');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Balance card */}
      <Card className="bg-gradient-to-br from-[hsl(var(--primary))]/10 to-[hsl(var(--accent))]/10 border-[hsl(var(--primary))]/20">
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">Available Balance</p>
          <p className="text-4xl font-bold mt-1">{currency} {available.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Minimum to withdraw: <strong>{currency} {minPayout.toLocaleString()}</strong>
          </p>
          {!canWithdraw && (
            <div className="flex items-center gap-2 mt-3 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              You need {currency} {(minPayout - available).toLocaleString()} more to request a payout
            </div>
          )}
          {hasPending && (
            <div className="flex items-center gap-2 mt-3 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              You have a pending payout request being processed
            </div>
          )}
          <Button
            className="mt-4 gap-2"
            disabled={!canWithdraw || hasPending || !affiliateSettings?.program_enabled}
            onClick={() => setShowRequest(true)}
          >
            <Wallet className="w-4 h-4" /> Request Withdrawal
          </Button>
        </CardContent>
      </Card>

      {/* Payout request form */}
      {showRequest && (
        <Card className="border-[hsl(var(--primary))]/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Request Payout — {currency} {available.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">Payment Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="airtel_money">Airtel Money</SelectItem>
                  <SelectItem value="tnm_mpamba">TNM Mpamba</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">
                {method === 'bank_transfer' ? 'Bank Account Details (Account Name, Number, Bank)' : 'Mobile Money Number'}
              </Label>
              <Input
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder={method === 'bank_transfer' ? 'Account Name / 1234567890 / National Bank' : '+265 99X XXX XXX'}
                className="mt-1.5"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={requestPayout} disabled={submitting} className="flex-1 gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
              <Button variant="outline" onClick={() => setShowRequest(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payout history */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Payout History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{[1,2].map(i => <div key={i} className="h-14 bg-secondary rounded-lg animate-pulse" />)}</div>
          ) : payouts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Wallet className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No payout history yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {payouts.map(p => {
                const cfg = PAYOUT_STATUS[p.status] || PAYOUT_STATUS.pending;
                return (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3 gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{p.currency} {(p.amount || 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground capitalize">{(p.payment_method || '').replace(/_/g,' ')} • {p.created_date ? format(new Date(p.created_date), 'MMM d, yyyy') : ''}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
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

// ─── TAB: Marketing Materials ──────────────────────────────────────────
function MaterialsTab({ user }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const { copied, copy } = useCopyClipboard();

  const code = user?.referral_code || (user?.id ? `BF-${user.id.slice(-6).toUpperCase()}` : '');
  const refLink = `${window.location.origin}/register?ref=${code}`;

  useEffect(() => {
    base44.entities.AffiliateMarketingMaterial.filter({ is_active: true }, { sort: 'sort_order' })
      .then(setMaterials).catch(() => setMaterials([]))
      .finally(() => setLoading(false));
  }, []);

  const MATERIAL_TYPES = {
    banner:            { label: 'Banner',              icon: Image },
    social_graphic:    { label: 'Social Graphic',      icon: Image },
    whatsapp_message:  { label: 'WhatsApp Message',    icon: MessageSquare },
    promotional_image: { label: 'Promo Image',         icon: Image },
    video:             { label: 'Video',               icon: Image },
    other:             { label: 'Other',               icon: Download },
  };

  const filtered = materials.filter(m => typeFilter === 'all' || m.material_type === typeFilter);

  function shareWA(text) {
    const msg = encodeURIComponent(text.replace('{link}', refLink).replace('{code}', code));
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-3 flex-wrap">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Materials</SelectItem>
            {Object.entries(MATERIAL_TYPES).map(([k,v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-48 bg-secondary rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
          <Image className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No marketing materials yet</p>
          <p className="text-xs mt-1">Check back soon — we'll add banners and templates here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(m => (
            <Card key={m.id} className="shadow-sm overflow-hidden">
              {m.thumbnail_url && (
                <img src={m.thumbnail_url} alt={m.title} className="w-full h-40 object-cover" />
              )}
              {!m.thumbnail_url && m.material_type !== 'whatsapp_message' && (
                <div className="w-full h-32 bg-secondary flex items-center justify-center">
                  <Image className="w-8 h-8 text-muted-foreground opacity-30" />
                </div>
              )}
              <CardContent className="p-4">
                <p className="font-semibold text-sm">{m.title}</p>
                {m.description && <p className="text-xs text-muted-foreground mt-1">{m.description}</p>}
                {m.dimensions && <p className="text-xs text-muted-foreground mt-0.5">Size: {m.dimensions}</p>}

                {m.material_type === 'whatsapp_message' && m.whatsapp_text && (
                  <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-xs text-green-800 whitespace-pre-line leading-relaxed">
                      {m.whatsapp_text.replace('{link}', refLink).replace('{code}', code)}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" className="h-7 text-xs bg-green-500 hover:bg-green-600 text-white gap-1 flex-1" onClick={() => shareWA(m.whatsapp_text)}>
                        <MessageSquare className="w-3 h-3" /> Send on WhatsApp
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => copy(m.whatsapp_text.replace('{link}', refLink).replace('{code}', code), m.id)}>
                        {copied === m.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />} Copy
                      </Button>
                    </div>
                  </div>
                )}

                {m.file_url && m.material_type !== 'whatsapp_message' && (
                  <Button size="sm" variant="outline" className="mt-3 h-8 text-xs gap-1.5 w-full" onClick={() => window.open(m.file_url, '_blank')}>
                    <Download className="w-3.5 h-3.5" /> Download
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TAB: Profile & Payment Settings ──────────────────────────────────
function ProfileTab({ user }) {
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    whatsapp_number: user?.whatsapp_number || '',
    payout_method: user?.affiliate_payout_method || user?.payout_method || 'airtel_money',
    payout_details: user?.affiliate_payout_number || user?.payout_details || '',
    payout_name: user?.affiliate_payout_name || '',
    notify_email: user?.notify_email ?? true,
    notify_inapp: user?.notify_inapp ?? true,
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        full_name: form.full_name,
        phone: form.phone,
        whatsapp_number: form.whatsapp_number,
        payout_method: form.payout_method,
        affiliate_payout_method: form.payout_method,
        payout_details: form.payout_details,
        affiliate_payout_number: form.payout_details,
        affiliate_payout_name: form.payout_name,
        notify_email: form.notify_email,
        notify_inapp: form.notify_inapp,
      });
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 max-w-xl">
      {/* Personal info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCircle className="w-4 h-4" /> Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'full_name', label: 'Full Name', icon: UserCircle, type: 'text' },
            { key: 'email', label: 'Email Address', icon: Mail, type: 'email', disabled: true },
            { key: 'phone', label: 'Phone Number', icon: Phone, type: 'tel' },
            { key: 'whatsapp_number', label: 'WhatsApp Number', icon: MessageSquare, type: 'tel' },
          ].map(({ key, label, icon: Icon, type, disabled }) => (
            <div key={key}>
              <Label className="text-sm">{label}</Label>
              <div className="relative mt-1.5">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={type}
                  value={form[key]}
                  onChange={e => !disabled && setForm(f => ({ ...f, [key]: e.target.value }))}
                  disabled={disabled}
                  className="pl-9"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payment settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Default Payment Method
          </CardTitle>
          <CardDescription className="text-xs">Used for payout withdrawals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm">Payment Method</Label>
            <Select value={form.payout_method} onValueChange={v => setForm(f => ({ ...f, payout_method: v }))}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="airtel_money">📱 Airtel Money</SelectItem>
                <SelectItem value="tnm_mpamba">📱 TNM Mpamba</SelectItem>
                <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">
              {form.payout_method === 'bank_transfer' ? 'Bank Account Details' : 'Mobile Money Number'}
            </Label>
            <Input
              value={form.payout_details}
              onChange={e => setForm(f => ({ ...f, payout_details: e.target.value }))}
              placeholder={form.payout_method === 'bank_transfer' ? 'Account Name / 1234567890 / Bank Name' : '+265 9XX XXX XXX'}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label className="text-sm">Account / Full Name <span className="text-xs text-muted-foreground font-normal">(for verification)</span></Label>
            <Input
              value={form.payout_name}
              onChange={e => setForm(f => ({ ...f, payout_name: e.target.value }))}
              placeholder="e.g. John Banda"
              className="mt-1.5"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification preferences */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'notify_email', label: 'Email Notifications', desc: 'Get emails for new referrals, commission updates, and payouts' },
            { key: 'notify_inapp', label: 'In-App Notifications', desc: 'See notifications inside the platform' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch
                checked={!!form[key]}
                onCheckedChange={v => setForm(f => ({ ...f, [key]: v }))}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving} className="w-full gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────
export default function Referrals() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [referrals, setReferrals] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [affiliateSettings, setAffiliateSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    if (!user?.id) return;
    try {
      const [refs, comms, pays, settings] = await Promise.all([
        base44.entities.Referral.filter({ referrer_id: user.id }, { sort: '-created_date' }).then(async (byId) => {
          // Also catch old records that only stored the referral code (pre-fix registrations)
          const code = user.referral_code || (user.id ? `BF-${user.id.slice(-6).toUpperCase()}` : '');
          const byCode = code ? await base44.entities.Referral.filter({ referral_code: code }, { sort: '-created_date' }).catch(() => []) : [];
          // Merge deduplicated
          const seen = new Set(byId.map(r => r.id));
          return [...byId, ...byCode.filter(r => !seen.has(r.id))];
        }).catch(() => []),
        base44.entities.AffiliateCommission.filter({ affiliate_id: user.id }, { sort: '-created_date' }).catch(() => []),
        base44.entities.AffiliatePayout.filter({ affiliate_id: user.id }, { sort: '-created_date' }).catch(() => []),
        base44.entities.AffiliateSettings.list({ limit: 1 }).catch(() => []),
      ]);
      setReferrals(refs);
      setCommissions(comms);
      setPayouts(pays);
      setAffiliateSettings(settings?.[0] || null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [user?.id]);

  const tabProps = { user, affiliateSettings, referrals, commissions, payouts, loading, onPayoutRequested: loadData };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background sticky top-0 z-10">
        <div className="px-4 lg:px-8 pt-5 pb-0 max-w-5xl mx-auto">
          <h1 className="text-xl font-bold font-heading mb-4">Affiliate Program</h1>
          {/* Tab nav — horizontal scroll on mobile */}
          <div className="flex gap-1 overflow-x-auto pb-px hide-scrollbar">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0",
                  activeTab === id
                    ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))]"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 lg:px-8 py-6 max-w-5xl mx-auto">
        {activeTab === 'dashboard'   && <DashboardTab {...tabProps} />}
        {activeTab === 'links'       && <LinksTab {...tabProps} />}
        {activeTab === 'referrals'   && <ReferralsTab {...tabProps} />}
        {activeTab === 'commissions' && <CommissionsTab {...tabProps} />}
        {activeTab === 'payouts'     && <PayoutsTab {...tabProps} />}
        {activeTab === 'materials'   && <MaterialsTab {...tabProps} />}
        {activeTab === 'profile'     && <ProfileTab {...tabProps} />}
      </div>
    </div>
  );
}

