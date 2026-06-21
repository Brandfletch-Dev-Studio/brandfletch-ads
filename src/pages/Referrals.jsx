import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import {
  LayoutDashboard, Link2, Users, DollarSign, Wallet,
  Image, UserCircle, Copy, Check, Share2,
  TrendingUp, Clock, CheckCircle, XCircle, AlertCircle,
  Download, MessageSquare, ChevronRight, QrCode, Loader2,
  Phone, Mail, Bell, CreditCard, Building2
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
  meta_ads:        'Meta Ads',
  graphic_design:  'Graphic Design',
  social_media:    'Social Media',
  web_dev:         'Web Development',
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
  const totalEarnings = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + (c.commission_amount || 0), 0);
  const pendingComm   = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + (c.commission_amount || 0), 0);
  const paidComm      = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + (c.commission_amount || 0), 0);
  const paidOut       = payouts.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0);
  const availableBalance = paidComm - paidOut;
  const converted     = referrals.filter(r => r.status === 'converted').length;
  const convRate      = referrals.length > 0 ? Math.round((converted / referrals.length) * 100) : 0;
  const minPayout     = affiliateSettings?.minimum_payout || 5000;
  const currency      = affiliateSettings?.minimum_payout_currency || 'MWK';

  const stats = [
    { label: 'Total Earnings',      value: `${currency} ${compactNum(totalEarnings)}`,          color: 'text-green-600', bg: 'bg-green-50',  icon: TrendingUp },
    { label: 'Pending Commissions', value: `${currency} ${compactNum(pendingComm)}`,            color: 'text-amber-600', bg: 'bg-amber-50',  icon: Clock },
    { label: 'Paid Commissions',    value: `${currency} ${compactNum(paidComm)}`,               color: 'text-blue-600',  bg: 'bg-blue-50',   icon: CheckCircle },
    { label: 'Available Balance',   value: `${currency} ${compactNum(Math.max(0, availableBalance))}`, color: 'text-purple-600', bg: 'bg-purple-50', icon: Wallet },
    { label: 'Total Referrals',     value: compactNum(referrals.length),                       color: 'text-sky-600',   bg: 'bg-sky-50',    icon: Users },
    { label: 'Conversion Rate',     value: `${convRate}%`,                                     color: 'text-rose-600',  bg: 'bg-rose-50',   icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Program info banner */}
      {affiliateSettings && (
        <Card className="bg-gradient-to-br from-[hsl(var(--primary))]/10 to-[hsl(var(--accent))]/10 border-[hsl(var(--primary))]/20">
          <CardContent className="p-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[hsl(var(--primary))] mb-2">Commission Structure</p>
              <div className="space-y-1">
                {Object.entries(SERVICE_LABELS).map(([key, label]) => {
                  const typeField  = `${key}_commission_type`;
                  const fixedField = `${key}_fixed_amount`;
                  const pctField   = `${key}_percentage`;
                  const type = affiliateSettings[typeField] || 'global';
                  let rate;
                  if (type === 'global') {
                    rate = affiliateSettings.default_commission_type === 'fixed'
                      ? `${currency} ${(affiliateSettings.default_fixed_amount || 0).toLocaleString()}`
                      : `${affiliateSettings.default_percentage || 0}%`;
                  } else if (type === 'fixed') {
                    rate = `${currency} ${(affiliateSettings[fixedField] || 0).toLocaleString()}`;
                  } else {
                    rate = `${affiliateSettings[pctField] || 0}%`;
                  }
                  return (
                    <div key={key} className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold tabular-nums">{rate} <span className="text-xs text-muted-foreground font-normal">per sale</span></span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="h-px sm:h-12 sm:w-px bg-border" />
            <div>
              <p className="text-sm font-semibold">Minimum Payout</p>
              <p className="text-3xl font-bold mt-0.5">{currency} {minPayout.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Minimum balance needed to request withdrawal</p>
            </div>
            <div className="h-px sm:h-12 sm:w-px bg-border" />
            {affiliateSettings?.recurring_enabled && (
              <>
                <div>
                  <p className="text-sm font-semibold text-green-600">Recurring Commissions</p>
                  <p className="text-xl font-bold mt-0.5">
                    {affiliateSettings.recurring_type === 'fixed'
                      ? `${currency} ${(affiliateSettings.recurring_fixed_amount || 0).toLocaleString()}`
                      : `${affiliateSettings.recurring_percentage || 0}%`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Per renewal payment
                    {affiliateSettings.recurring_max_months > 0 ? ` · up to ${affiliateSettings.recurring_max_months} months` : ' · unlimited'}
                  </p>
                </div>
                <div className="h-px sm:h-12 sm:w-px bg-border" />
              </>
            )}
            <div>
              <p className="text-sm font-semibold">Program Status</p>
              <Badge className={affiliateSettings.program_enabled ? 'bg-green-100 text-green-700 mt-1' : 'bg-red-100 text-red-700 mt-1'}>
                {affiliateSettings.program_enabled ? 'Active' : 'Paused'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(({ label, value, color, bg, icon: Icon }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-4 flex flex-col items-start gap-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className={`text-xl font-bold leading-tight ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground leading-tight">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* How You Earn */}
      {affiliateSettings && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" /> How You Earn
            </CardTitle>
            <CardDescription className="text-xs">Commission rates per service type</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-border">
              {Object.entries(SERVICE_LABELS).map(([key, label]) => {
                const typeField  = `${key}_commission_type`;
                const fixedField = `${key}_fixed_amount`;
                const pctField   = `${key}_percentage`;
                const type = affiliateSettings[typeField] || 'global';
                let rateLabel, subLabel;
                if (type === 'global') {
                  if (affiliateSettings.default_commission_type === 'fixed') {
                    rateLabel = `${currency} ${(affiliateSettings.default_fixed_amount || 0).toLocaleString()}`;
                    subLabel  = 'Fixed per sale';
                  } else {
                    rateLabel = `${affiliateSettings.default_percentage || 0}%`;
                    subLabel  = 'Of sale amount';
                  }
                } else if (type === 'fixed') {
                  rateLabel = `${currency} ${(affiliateSettings[fixedField] || 0).toLocaleString()}`;
                  subLabel  = 'Fixed per sale';
                } else {
                  rateLabel = `${affiliateSettings[pctField] || 0}%`;
                  subLabel  = 'Of sale amount';
                }
                // Recurring badge
                const recurringApplies = !affiliateSettings.recurring_applies_to?.length
                  || affiliateSettings.recurring_applies_to.includes(key);
                return (
                  <div key={key} className="flex items-center justify-between py-3 gap-3">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{subLabel}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">{rateLabel}</p>
                      {affiliateSettings.recurring_enabled && recurringApplies && (
                        <p className="text-xs text-blue-600 mt-0.5">
                          + {affiliateSettings.recurring_type === 'fixed'
                            ? `${currency} ${(affiliateSettings.recurring_fixed_amount || 0).toLocaleString()}`
                            : `${affiliateSettings.recurring_percentage || 0}%`} recurring
                          {affiliateSettings.recurring_max_months > 0 ? ` (${affiliateSettings.recurring_max_months}mo)` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent referrals */}
      {referrals.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Recent Referrals</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {referrals.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{r.referred_name || r.referred_email || 'Anonymous'}</p>
                    <p className="text-xs text-muted-foreground">{r.created_date ? format(new Date(r.created_date), 'MMM d, yyyy') : ''}</p>
                  </div>
                  <Badge className={r.status === 'converted' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                    {r.status === 'converted' ? 'Converted' : 'Signed Up'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── TAB: Referral Links ───────────────────────────────────────────────
function LinksTab({ user }) {
  const { copied, copy } = useCopyClipboard();
  const code = user?.referral_code || (user?.id ? `BF-${user.id.slice(-6).toUpperCase()}` : '');
  const baseLink = `${window.location.origin}/register?ref=${code}`;

  const links = [
    { label: 'Default Referral Link',              url: baseLink,                              desc: 'Works for any new signup' },
    { label: 'Campaign Referral Link',              url: `${baseLink}&type=campaign`,           desc: 'For businesses interested in ad campaigns' },
    { label: 'Design Retainer Referral Link',       url: `${baseLink}&type=design`,             desc: 'For businesses needing design services' },
  ];

  function shareWA(url) {
    const msg = encodeURIComponent(
      `🚀 Grow your business with professionally managed Facebook Ads!\n\nJoin Brandfletch Ads today:\n${url}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  }

  function shareNative(url, label) {
    if (navigator.share) {
      navigator.share({ title: label, url }).catch(() => {});
    } else {
      copy(url, label);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">Your Referral Code</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Use this code or the links below to refer new clients</p>
        <div className="mt-3 inline-flex items-center gap-3 bg-secondary px-4 py-2 rounded-xl">
          <code className="text-lg font-bold font-mono tracking-widest">{code}</code>
          <button onClick={() => copy(code, 'code')} className="text-muted-foreground hover:text-foreground transition-colors">
            {copied === 'code' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* QR code */}
      <Card className="border-dashed">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-28 h-28 bg-secondary rounded-xl flex items-center justify-center flex-shrink-0">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(baseLink)}&color=000000&bgcolor=ffffff`}
              alt="QR Code"
              className="w-24 h-24 rounded"
            />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="font-medium text-sm">Your QR Code</p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">Print or share this QR code — scanning it opens your referral signup link</p>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(baseLink)}`, '_blank')}
            >
              <Download className="w-3.5 h-3.5" /> Download QR
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Link cards */}
      <div className="space-y-3">
        {links.map(({ label, url, desc }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Input value={url} readOnly className="text-xs font-mono bg-secondary h-8 flex-1" />
                <Button size="sm" variant="outline" className="h-8 px-3 gap-1.5" onClick={() => copy(url, label)}>
                  {copied === label ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === label ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" className="h-8 bg-green-500 hover:bg-green-600 text-white gap-1.5 flex-1" onClick={() => shareWA(url)}>
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                </Button>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 flex-1" onClick={() => shareNative(url, label)}>
                  <Share2 className="w-3.5 h-3.5" /> Share
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── TAB: Referrals ───────────────────────────────────────────────────
function ReferralsTab({ referrals = [], loading }) {
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
                        {r.reward_amount ? `${r.reward_currency || 'MWK'} ${r.reward_amount.toLocaleString()}` : '—'}
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
function CommissionsTab({ commissions = [], loading }) {
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
                            {c.commission_currency || 'MWK'} {(c.commission_amount || 0).toLocaleString()}
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

  const currency = affiliateSettings?.minimum_payout_currency || 'MWK';
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
    base44.entities.AffiliateMarketingMaterial.filter({ is_active: true }, 'sort_order')
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
        base44.entities.Referral.filter({ referrer_id: user.id }, '-created_date').then(async (byId) => {
          // Also catch old records that only stored the referral code (pre-fix registrations)
          const code = user.referral_code || (user.id ? `BF-${user.id.slice(-6).toUpperCase()}` : '');
          const byCode = code ? await base44.entities.Referral.filter({ referral_code: code }, '-created_date').catch(() => []) : [];
          // Merge deduplicated
          const seen = new Set(byId.map(r => r.id));
          return [...byId, ...byCode.filter(r => !seen.has(r.id))];
        }).catch(() => []),
        base44.entities.AffiliateCommission.filter({ affiliate_id: user.id }, '-created_date').catch(() => []),
        base44.entities.AffiliatePayout.filter({ affiliate_id: user.id }, '-created_date').catch(() => []),
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
