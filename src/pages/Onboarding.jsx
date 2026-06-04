import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES } from '@/lib/constants';
import { ChevronRight, Check, Loader2, Facebook } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { useQuery } from '@tanstack/react-query';

const BUSINESS_TYPES = [
  'Retail & E-commerce', 'Food & Restaurant', 'Health & Beauty',
  'Professional Services', 'Education & Training', 'Real Estate',
  'Technology & Software', 'Entertainment & Events', 'Non-profit',
  'Travel & Tourism', 'Fashion & Apparel', 'Other',
];

const GOALS = [
  { value: 'brand_awareness', label: 'Build brand awareness', icon: '📣' },
  { value: 'website_traffic', label: 'Drive website traffic', icon: '🌐' },
  { value: 'whatsapp_messages', label: 'Get WhatsApp leads', icon: '💬' },
  { value: 'sales', label: 'Increase sales', icon: '🛍️' },
  { value: 'messenger_conversations', label: 'Get Messenger enquiries', icon: '📨' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const [form, setForm] = useState({
    full_name: '', business_name: '', business_type: '',
    phone: '', country: '', primary_goal: '',
    fb_page_name: '', fb_page_url: '',
  });

  const { data: exchangeRates = [] } = useQuery({
    queryKey: ['exchange-rates-onboarding'],
    queryFn: () => base44.entities.ExchangeRate.filter({ is_active: true }),
  });

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setForm(f => ({ ...f, full_name: u.full_name || '' }));
      detectCountry();
    }).catch(() => navigate('/login'));
  }, []);

  async function detectCountry() {
    setDetectingLocation(true);
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      if (data.country_name) {
        const matched = COUNTRIES.find(c => c.toLowerCase() === data.country_name.toLowerCase());
        setForm(f => ({ ...f, country: matched || data.country_name }));
      }
    } catch {}
    setDetectingLocation(false);
  }

  function update(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function saveProfile() {
    await base44.auth.updateMe({
      full_name: form.full_name,
      business_name: form.business_name,
      business_type: form.business_type,
      phone: form.phone,
      country: form.country,
      primary_goal: form.primary_goal,
      fb_page_name: form.fb_page_name,
      fb_page_url: form.fb_page_url,
      onboarded: true,
    });
  }

  async function finish() {
    setSaving(true);
    await saveProfile();
    window.location.href = '/dashboard';
  }

  const steps = [
    { id: 1, title: 'Your Details' },
    { id: 2, title: 'Your Business' },
    { id: 3, title: 'Your Goal' },
    { id: 4, title: 'Facebook Page' },
  ];
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <BrandLogo size="md" dark />
        <span className="text-xs text-muted-foreground">Step {step} of {steps.length}</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step > s.id ? 'bg-green-500 text-white' :
                    step === s.id ? 'bg-[hsl(var(--primary))] text-white' :
                    'bg-secondary text-muted-foreground'
                  }`}>
                    {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                  </div>
                  <span className="text-[10px] mt-1 font-medium hidden sm:block" style={{ color: step === s.id ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}>
                    {s.title}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-4 transition-all ${step > s.id ? 'bg-green-400' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-sm p-7">

            {/* Step 1 */}
            {step === 1 && (
              <>
                <h2 className="text-xl font-bold font-heading mb-1">Your Details</h2>
                <p className="text-sm text-muted-foreground mb-6">Tell us about yourself</p>
                <div className="space-y-4">
                  <div>
                    <Label className="mb-1.5 block">Full Name *</Label>
                    <Input value={form.full_name} onChange={e => update('full_name', e.target.value)}
                      placeholder="Your full name" className="h-11" />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Phone Number</Label>
                    <Input value={form.phone} onChange={e => update('phone', e.target.value)}
                      placeholder="+265 999 000 000" className="h-11" />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">
                      Country *
                      {detectingLocation && <span className="text-xs text-muted-foreground ml-2 animate-pulse">(detecting...)</span>}
                    </Label>
                    <Select value={form.country} onValueChange={v => update('country', v)}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder={detectingLocation ? 'Detecting your location...' : 'Select your country'} />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {form.country && (
                      <p className="text-xs text-green-600 mt-1.5">Detected: {form.country} — tap to change if needed</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <>
                <h2 className="text-xl font-bold font-heading mb-1">Your Business</h2>
                <p className="text-sm text-muted-foreground mb-6">Help us personalise your experience</p>
                <div className="space-y-4">
                  <div>
                    <Label className="mb-1.5 block">Business / Brand Name *</Label>
                    <Input value={form.business_name} onChange={e => update('business_name', e.target.value)}
                      placeholder="e.g. Chisomo's Boutique" className="h-11" />
                  </div>
                  <div>
                    <Label className="mb-2 block">Business Type *</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {BUSINESS_TYPES.map(bt => (
                        <button key={bt} onClick={() => update('business_type', bt)}
                          className={`text-left px-3 py-2.5 rounded-xl border-2 text-sm transition-all ${
                            form.business_type === bt
                              ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 font-semibold text-[hsl(var(--primary))]'
                              : 'border-border hover:border-[hsl(var(--primary))]/30'
                          }`}>
                          {bt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <>
                <h2 className="text-xl font-bold font-heading mb-1">Your Goal</h2>
                <p className="text-sm text-muted-foreground mb-6">What do you want to achieve?</p>
                <div className="space-y-3">
                  {GOALS.map(g => (
                    <button key={g.value} onClick={() => update('primary_goal', g.value)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                        form.primary_goal === g.value
                          ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5'
                          : 'border-border hover:border-[hsl(var(--primary))]/30'
                      }`}>
                      <span className="text-2xl">{g.icon}</span>
                      <span className="font-medium text-sm">{g.label}</span>
                      {form.primary_goal === g.value && <Check className="w-4 h-4 text-[hsl(var(--primary))] ml-auto" />}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Step 4: Facebook Page */}
            {step === 4 && (
              <>
                <h2 className="text-xl font-bold font-heading mb-1">Your Facebook Page</h2>
                <p className="text-sm text-muted-foreground mb-6">Add your Facebook Page details so we can set up your campaigns.</p>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                    <Facebook className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-800">Don't worry about connecting your page now — we'll handle that after your first campaign payment is confirmed.</p>
                      <p className="text-xs text-blue-700 mt-2">You can always set up and connect your business page later.</p>
                    </div>
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Facebook Page Name *</Label>
                    <Input
                      value={form.fb_page_name}
                      onChange={e => update('fb_page_name', e.target.value)}
                      placeholder="e.g. Chisomo's Boutique"
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Facebook Page URL <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input
                      value={form.fb_page_url}
                      onChange={e => update('fb_page_url', e.target.value)}
                      placeholder="e.g. facebook.com/ChisomoBoutique"
                      className="h-11"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Don't have a Facebook Page yet? You can skip this for now and add it later from your dashboard.</p>
                </div>
              </>
            )}



          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-5">
            {step > 1 ? (
              <Button variant="outline" onClick={() => {
                setStep(s => s - 1);
              }}>Back</Button>
            ) : (
              <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-muted-foreground text-sm">
                Skip for now
              </Button>
            )}

            <div>
              {step < 4 && (
                <Button
                  onClick={() => setStep(s => s + 1)}
                  disabled={
                    (step === 1 && (!form.full_name || !form.country)) ||
                    (step === 2 && (!form.business_name || !form.business_type)) ||
                    (step === 3 && !form.primary_goal)
                  }
                  className="gap-2 bg-[hsl(var(--primary))] text-primary-foreground font-semibold"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </Button>
              )}

              {step === 4 && (
                <Button onClick={finish} disabled={saving}
                  className="gap-2 bg-[hsl(var(--accent))] hover:bg-[hsl(217,91%,48%)] text-white font-semibold">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting up...</> : <>Go to Dashboard <ChevronRight className="w-4 h-4" /></>}
                </Button>
              )}


            </div>
          </div>
        </div>
      </div>
    </div>
  );
}