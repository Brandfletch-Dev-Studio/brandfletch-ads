import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES } from '@/lib/constants';
import { Loader2 } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

const BUSINESS_TYPES = [
  'Retail & E-commerce', 'Food & Restaurant', 'Health & Beauty',
  'Professional Services', 'Education & Training', 'Real Estate',
  'Technology & Software', 'Entertainment & Events', 'Non-profit',
  'Travel & Tourism', 'Fashion & Apparel', 'Other',
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { checkAppState } = useAuth();
  const [saving, setSaving] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);

  const [form, setForm] = useState({
    full_name: '',
    business_name: '',
    business_category: '',
    phone: '',
    country: '',
  });

  useEffect(() => {
    // Get session — if none, go to login
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate('/login');
        return;
      }
      const u = session.user;
      setUserId(u.id);
      setForm(f => ({
        ...f,
        full_name: u.user_metadata?.full_name || u.email?.split('@')[0] || '',
        phone: u.user_metadata?.phone || '',
        country: u.user_metadata?.country || '',
        business_name: u.user_metadata?.business_name || '',
        business_category: u.user_metadata?.business_category || '',
      }));
      detectCountry(u.user_metadata?.country);
    });
  }, []);

  async function detectCountry(existingCountry) {
    if (existingCountry) return;
    setDetectingLocation(true);
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      if (data.country_name) {
        const matched = COUNTRIES.find(c => c.toLowerCase() === data.country_name.toLowerCase());
        if (matched) setForm(f => ({ ...f, country: matched }));
      }
    } catch {}
    setDetectingLocation(false);
  }

  function update(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function saveAndNavigate(payload) {
    setSaving(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upsert profile row
      const { error: dbErr } = await supabase
        .from('User')
        .upsert(
          { id: user.id, email: user.email, ...payload },
          { onConflict: 'id' }
        );
      if (dbErr) throw dbErr;

      // Update auth metadata
      await supabase.auth.updateUser({
        data: { full_name: payload.full_name, role: payload.role },
      });

      // Send welcome email (non-blocking)
      try {
        base44.functions.invoke('sendWelcomeEmail', { user_id: user.id }).catch(() => {});
      } catch (_) {}

      // Refresh AuthContext then navigate
      if (checkAppState) await checkAppState();
      navigate('/dashboard');
    } catch (err) {
      console.error('Onboarding save error:', err);
      setError('Something went wrong: ' + (err.message || 'Please try again.'));
      setSaving(false);
    }
  }

  async function finish() {
    if (!form.full_name.trim()) { setError('Please enter your full name.'); return; }
    if (!form.country) { setError('Please select your country.'); return; }
    if (!form.business_name.trim()) { setError('Please enter your business name.'); return; }

    await saveAndNavigate({
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      country: form.country,
      business_name: form.business_name.trim(),
      business_category: form.business_category,
      role: 'user',
      onboarded: true,
    });
  }

  async function handleSkip() {
    await saveAndNavigate({
      full_name: form.full_name.trim() || form.full_name,
      role: 'user',
      onboarded: true,
    });
  }

  // Always render the form — no blocking white screen
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <BrandLogo size="md" dark />
        <button
          onClick={handleSkip}
          disabled={saving}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          Skip for now →
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold font-heading text-foreground">Welcome to Brandfletch Ads 🎉</h1>
            <p className="text-muted-foreground mt-2 text-sm">Just a few quick details to personalise your experience</p>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-sm p-7 space-y-5">
            <div>
              <Label className="mb-1.5 block">Your Name *</Label>
              <Input
                value={form.full_name}
                onChange={e => update('full_name', e.target.value)}
                placeholder="e.g. Chisomo Banda"
                className="h-11"
                autoFocus
              />
            </div>

            <div>
              <Label className="mb-1.5 block">Phone Number <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
                placeholder="+265 999 000 000"
                className="h-11"
              />
            </div>

            <div>
              <Label className="mb-1.5 block">
                Country *
                {detectingLocation && <span className="text-xs text-muted-foreground ml-2 animate-pulse">(detecting...)</span>}
              </Label>
              <Select value={form.country} onValueChange={v => update('country', v)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={detectingLocation ? 'Detecting location...' : 'Select your country'} />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 block">Business / Brand Name *</Label>
              <Input
                value={form.business_name}
                onChange={e => update('business_name', e.target.value)}
                placeholder="e.g. Chisomo's Boutique"
                className="h-11"
              />
            </div>

            <div>
              <Label className="mb-1.5 block">Business Type <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Select value={form.business_category} onValueChange={v => update('business_category', v)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map(bt => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={finish}
              disabled={saving}
              className="w-full h-11 font-semibold bg-[hsl(var(--primary))] text-primary-foreground"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
                : 'Go to Dashboard →'
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
