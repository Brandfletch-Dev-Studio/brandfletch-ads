import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Circle, ChevronRight, X, Rocket,
  User, Building2, Phone, Globe, Loader2, ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { base44, supabase } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { COUNTRIES } from '@/lib/constants';

const BUSINESS_TYPES = [
  'Retail & E-commerce', 'Food & Restaurant', 'Health & Beauty',
  'Professional Services', 'Education & Training', 'Real Estate',
  'Technology & Software', 'Entertainment & Events', 'Non-profit',
  'Travel & Tourism', 'Fashion & Apparel', 'Other',
];

// ── Which steps count as "done" based on user + data ──────────────────────────
function getCompleted(user, pages, campaigns) {
  const done = new Set();
  const profileDone =
    user?.full_name?.trim() &&
    user?.business_name?.trim() &&
    user?.country?.trim() &&
    user?.phone?.trim();
  if (profileDone) done.add('profile');
  if (pages?.length  > 0) done.add('facebook_page');
  if (campaigns?.length > 0) done.add('first_campaign');
  return done;
}

export default function CompleteProfileChecklist() {
  const { user, checkAppState } = useAuth();
  const navigate = useNavigate();

  const [ready, setReady]       = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [pages, setPages]       = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [expanded, setExpanded] = useState(false); // profile inline panel open

  // Profile form state
  const [form, setForm] = useState({ full_name:'', business_name:'', business_category:'', phone:'', country:'' });
  const [saving, setSaving] = useState(false);
  const [detectingLoc, setDetectingLoc] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    // Seed form from existing user data
    setForm({
      full_name:         user.full_name         || '',
      business_name:     user.business_name     || '',
      business_category: user.business_category || '',
      phone:             user.phone             || '',
      country:           user.country           || '',
    });
    // Load pages + campaigns in parallel
    Promise.all([
      base44.entities.FacebookPage.filter({ created_by: user.id }).catch(() => []),
      base44.entities.Campaign.filter({ created_by: user.id }, { sort: '-created_date', limit: 1 }).catch(() => []),
    ]).then(([pg, camp]) => {
      setPages(pg);
      setCampaigns(camp);
      setReady(true);
    });
    // Auto-detect country if missing
    if (!user.country) detectCountry();
  }, [user?.id]);

  async function detectCountry() {
    setDetectingLoc(true);
    try {
      const res  = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      if (data.country_name) {
        const matched = COUNTRIES.find(c => c.toLowerCase() === data.country_name.toLowerCase());
        if (matched) setForm(f => ({ ...f, country: matched }));
      }
    } catch {}
    setDetectingLoc(false);
  }

  async function saveProfile() {
    if (!form.full_name.trim())     { toast.error('Please enter your name.');          return; }
    if (!form.business_name.trim()) { toast.error('Please enter your business name.'); return; }
    if (!form.country)              { toast.error('Please select your country.');       return; }

    setSaving(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('User')
        .upsert(
          {
            id:                authUser.id,
            email:             authUser.email,
            full_name:         form.full_name.trim(),
            business_name:     form.business_name.trim(),
            business_category: form.business_category || null,
            phone:             form.phone.trim() || null,
            country:           form.country,
            onboarded:         true,
          },
          { onConflict: 'id' }
        );
      if (error) throw error;

      // Notify admin
      try {
        const admins = await base44.entities.User.filter({ role: 'admin' }).catch(() => []);
        await Promise.all(admins.map(admin =>
          base44.entities.Notification.create({
            recipient_id:   admin.id,
            recipient_role: 'admin',
            title:          'Profile completed',
            message:        `${form.full_name} has completed their profile setup.`,
            type:           'page_connected',
            is_read:        false,
          }).catch(() => {})
        ));
      } catch {}

      toast.success('Profile saved!');
      setExpanded(false);
      if (checkAppState) await checkAppState(); // refresh user in context
    } catch (err) {
      console.error('Profile save error:', err);
      toast.error('Failed to save — ' + (err.message || 'please try again'));
    } finally {
      setSaving(false);
    }
  }

  if (!ready || !user) return null;

  const completed = getCompleted(user, pages, campaigns);

  // Never show if all 3 are done AND profile was already complete when we loaded
  const allDone = ['profile','facebook_page','first_campaign'].every(s => completed.has(s));
  if (dismissed || allDone) return null;

  const doneCount = ['profile','facebook_page','first_campaign'].filter(s => completed.has(s)).length;
  const profileDone = completed.has('profile');

  return (
    <Card className="border-2 border-[hsl(var(--accent))]/25 bg-gradient-to-br from-[hsl(var(--accent))]/5 to-background shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[hsl(var(--accent))]/15 flex items-center justify-center flex-shrink-0">
              <Rocket className="w-5 h-5 text-[hsl(var(--accent))]" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Set up your account</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{doneCount} of 3 steps complete</p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground transition-colors mt-0.5 flex-shrink-0"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-secondary mt-3 overflow-hidden">
          <div
            className="h-full bg-[hsl(var(--accent))] rounded-full transition-all duration-500"
            style={{ width: `${(doneCount / 3) * 100}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-1">

        {/* ── Step 1: Complete Profile (inline) ─────────────────────────── */}
        <div className={cn(
          "rounded-xl border transition-all",
          profileDone
            ? "border-transparent bg-transparent"
            : expanded
              ? "border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent))]/5"
              : "border-transparent"
        )}>
          {/* Row */}
          <button
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group text-left",
              profileDone
                ? "opacity-60 cursor-default"
                : "hover:bg-[hsl(var(--accent))]/10 cursor-pointer"
            )}
            onClick={() => !profileDone && setExpanded(e => !e)}
            disabled={profileDone}
          >
            {profileDone ? (
              <CheckCircle2 className="w-5 h-5 text-[hsl(var(--accent))] flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 group-hover:text-[hsl(var(--accent))] transition-colors" />
            )}
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium leading-tight", profileDone && "line-through text-muted-foreground")}>
                Complete your profile
              </p>
              {!profileDone && !expanded && (
                <p className="text-xs text-muted-foreground mt-0.5">Add your name, business, phone &amp; country</p>
              )}
            </div>
            {!profileDone && (
              expanded
                ? <ChevronUp className="w-4 h-4 text-[hsl(var(--accent))] flex-shrink-0" />
                : <span className="text-xs font-medium text-[hsl(var(--accent))] flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    Fill in <ChevronRight className="w-3 h-3" />
                  </span>
            )}
          </button>

          {/* Inline form */}
          {expanded && !profileDone && (
            <div className="px-4 pb-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 flex items-center gap-1.5">
                    <User className="w-3 h-3" /> Your Name *
                  </Label>
                  <Input
                    value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    placeholder="e.g. Chisomo Banda"
                    className="h-9 text-sm"
                    autoFocus
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 flex items-center gap-1.5">
                    <Phone className="w-3 h-3" /> Phone
                  </Label>
                  <Input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+265 999 000 000"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3 h-3" /> Business Name *
                  </Label>
                  <Input
                    value={form.business_name}
                    onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))}
                    placeholder="e.g. Chisomo's Boutique"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 flex items-center gap-1.5">
                    <Globe className="w-3 h-3" /> Country *
                    {detectingLoc && <span className="text-muted-foreground animate-pulse">(detecting…)</span>}
                  </Label>
                  <Select value={form.country} onValueChange={v => setForm(f => ({ ...f, country: v }))}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3 h-3" /> Business Type
                  </Label>
                  <Select value={form.business_category} onValueChange={v => setForm(f => ({ ...f, business_category: v }))}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select type (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map(bt => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={saveProfile}
                disabled={saving}
                className="w-full h-9 text-sm font-semibold bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent))]/90"
              >
                {saving ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Saving…</> : 'Save Profile'}
              </Button>
            </div>
          )}
        </div>

        {/* ── Step 2: Connect Facebook Page ─────────────────────────────── */}
        {(() => {
          const done = completed.has('facebook_page');
          return (
            <Link
              to="/pages"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                done ? "opacity-60 cursor-default pointer-events-none" : "hover:bg-[hsl(var(--accent))]/10 cursor-pointer"
              )}
            >
              {done ? (
                <CheckCircle2 className="w-5 h-5 text-[hsl(var(--accent))] flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 group-hover:text-[hsl(var(--accent))] transition-colors" />
              )}
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium leading-tight", done && "line-through text-muted-foreground")}>
                  Connect a Facebook Page
                </p>
                {!done && <p className="text-xs text-muted-foreground mt-0.5">Link your Facebook Business Page to run ads</p>}
              </div>
              {!done && (
                <span className="text-xs font-medium text-[hsl(var(--accent))] flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  Connect <ChevronRight className="w-3 h-3" />
                </span>
              )}
            </Link>
          );
        })()}

        {/* ── Step 3: Launch First Campaign ─────────────────────────────── */}
        {(() => {
          const done = completed.has('first_campaign');
          return (
            <Link
              to="/campaigns/new"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                done ? "opacity-60 cursor-default pointer-events-none" : "hover:bg-[hsl(var(--accent))]/10 cursor-pointer"
              )}
            >
              {done ? (
                <CheckCircle2 className="w-5 h-5 text-[hsl(var(--accent))] flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 group-hover:text-[hsl(var(--accent))] transition-colors" />
              )}
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium leading-tight", done && "line-through text-muted-foreground")}>
                  Launch your first campaign
                </p>
                {!done && <p className="text-xs text-muted-foreground mt-0.5">Create and submit a campaign for review</p>}
              </div>
              {!done && (
                <span className="text-xs font-medium text-[hsl(var(--accent))] flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  Create <ChevronRight className="w-3 h-3" />
                </span>
              )}
            </Link>
          );
        })()}

      </CardContent>
    </Card>
  );
}
