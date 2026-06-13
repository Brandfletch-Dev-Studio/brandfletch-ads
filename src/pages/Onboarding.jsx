import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
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
  const { checkUserAuth } = useAuth(); // Fix #4: refresh auth context after onboarding
  const [loadingUser, setLoadingUser] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    full_name: '',
    business_name: '',
    business_category: '', // Fix #3: was business_type, schema uses business_category
    phone: '',
    country: '',
  });

  useEffect(() => {
    base44.auth.me()
      .then(u => {
        setForm(f => ({
          ...f,
          full_name: u.full_name || '',
          phone: u.phone || '',
          country: u.country || '',
          business_name: u.business_name || '',
          business_category: u.business_category || u.business_type || '', // Fix #3: support both field names
        }));
        setLoadingUser(false);
        detectCountry(u.country);
      })
      .catch(() => navigate('/login'));
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

  async function finish() {
    if (!form.full_name.trim()) { setError('Please enter your full name.'); return; }
    if (!form.country) { setError('Please select your country.'); return; }
    if (!form.business_name.trim()) { setError('Please enter your business name.'); return; }

    setError('');
    setSaving(true);
    try {
      // Fix #2: explicitly set role to 'user' (business client) on first onboard
      // Fix #3: save to business_category (correct field name in User schema)
      await base44.auth.updateMe({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        country: form.country,
        business_name: form.business_name.trim(),
        business_category: form.business_category,
        role: 'user', // Default client role — prevents null role issues
        onboarded: true,
      });

      // Fix #4: re-fetch user in AuthContext so Dashboard sees updated data immediately
      await checkUserAuth();

      navigate('/dashboard');
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setSaving(false);
    }
  }

  if (loadingUser) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[hsl(var(--primary))]/20 border-t-[hsl(var(--primary))] rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Setting up your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <BrandLogo size="md" dark />
        <button
          onClick={() => navigate('/dashboard')}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip for now →
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold font-heading text-foreground">Welcome to Brandfletch Ads 🎉</h1>
            <p className="text-muted-foreground mt-2 text-sm">Just a few quick details to personalise your experience</p>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-sm p-7 space-y-5">

            {/* Full Name */}
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

            {/* Phone */}
            <div>
              <Label className="mb-1.5 block">Phone Number <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
                placeholder="+265 999 000 000"
                className="h-11"
              />
            </div>

            {/* Country */}
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

            {/* Business Name */}
            <div>
              <Label className="mb-1.5 block">Business / Brand Name *</Label>
              <Input
                value={form.business_name}
                onChange={e => update('business_name', e.target.value)}
                placeholder="e.g. Chisomo's Boutique"
                className="h-11"
              />
            </div>

            {/* Business Category */}
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

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              onClick={finish}
              disabled={saving}
              className="w-full h-11 font-semibold bg-[hsl(var(--primary))] text-primary-foreground"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                : 'Go to Dashboard →'
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
