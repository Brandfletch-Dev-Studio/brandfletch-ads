import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES } from '@/lib/constants';
import { ChevronRight, Check, Loader2, CheckCircle2, Facebook, Briefcase, Wrench } from 'lucide-react';
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
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fbPageChoice, setFbPageChoice] = useState(null); // 'yes' | 'no'
  const [setupChoice, setSetupChoice] = useState(null);   // 'hire' | 'diy'

  const [form, setForm] = useState({
    full_name: '', business_name: '', business_type: '',
    phone: '', country: '', primary_goal: '',
  });

  const [setupForm, setSetupForm] = useState({
    business_name: '', products_services: '', business_location: '',
    whatsapp_number: '', email: '', additional_notes: '',
    logo_urls: [],
    payment_method_id: '', payment_reference: '', payment_proof_url: '',
  });

  const { data: pageSetupService } = useQuery({
    queryKey: ['service-page-setup'],
    queryFn: () => base44.entities.Service.filter({ category: 'page_setup', is_active: true }),
    select: data => data[0],
  });

  const { data: exchangeRates = [] } = useQuery({
    queryKey: ['exchange-rates-onboarding'],
    queryFn: () => base44.entities.ExchangeRate.filter({ is_active: true }),
  });

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['payment-methods', form.country],
    queryFn: () => base44.entities.PaymentMethod.filter({ country: form.country, is_active: true }),
    enabled: !!form.country,
  });

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setForm(f => ({ ...f, full_name: u.full_name || '' }));
      setSetupForm(f => ({ ...f, email: u.email || '' }));
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
  function updateSetup(key, val) { setSetupForm(f => ({ ...f, [key]: val })); }

  async function uploadFile(file) {
    setUploadingFile(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploadingFile(false);
    return file_url;
  }

  async function handleLogoUpload(e) {
    const files = Array.from(e.target.files);
    for (const file of files) {
      const url = await uploadFile(file);
      setSetupForm(f => ({ ...f, logo_urls: [...f.logo_urls, url] }));
    }
  }

  async function handleProofUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const url = await uploadFile(file);
    updateSetup('payment_proof_url', url);
  }

  async function saveProfile() {
    await base44.auth.updateMe({
      full_name: form.full_name,
      business_name: form.business_name,
      business_type: form.business_type,
      phone: form.phone,
      country: form.country,
      primary_goal: form.primary_goal,
      onboarded: true,
    });
  }

  async function finish() {
    setSaving(true);
    await saveProfile();
    navigate('/dashboard');
    setSaving(false);
  }

  async function submitHireRequest() {
    setSaving(true);
    await saveProfile();
    const selectedMethod = paymentMethods.find(m => m.id === setupForm.payment_method_id);
    await base44.entities.PageSetupRequest.create({
      user_id: user?.id,
      country: form.country,
      business_name: setupForm.business_name,
      products_services: setupForm.products_services,
      business_location: setupForm.business_location,
      whatsapp_number: setupForm.whatsapp_number,
      email: setupForm.email,
      logo_urls: setupForm.logo_urls,
      additional_notes: setupForm.additional_notes,
      payment_method: selectedMethod?.method_name || '',
      payment_reference: setupForm.payment_reference,
      payment_proof_url: setupForm.payment_proof_url,
      status: setupForm.payment_proof_url ? 'paid' : 'pending_payment',
    });
    navigate('/dashboard');
    setSaving(false);
  }

  const isHireFlow = setupChoice === 'hire';
  const baseSteps = [
    { id: 1, title: 'Your Details' },
    { id: 2, title: 'Your Business' },
    { id: 3, title: 'Your Goal' },
    { id: 4, title: 'Facebook Page' },
  ];
  const hireSteps = [
    ...baseSteps,
    { id: 5, title: 'Page Details' },
    { id: 6, title: 'Payment' },
  ];
  const steps = isHireFlow ? hireSteps : baseSteps;
  const selectedPaymentMethod = paymentMethods.find(m => m.id === setupForm.payment_method_id);
  const servicePrice = pageSetupService?.price_usd ?? 25;
  const LOCAL_CURRENCIES = { Malawi: { code: 'MWK', symbol: 'MK' }, Zambia: { code: 'ZMW', symbol: 'ZK' }, 'South Africa': { code: 'ZAR', symbol: 'R' }, Kenya: { code: 'KES', symbol: 'KSh' }, Tanzania: { code: 'TZS', symbol: 'TSh' } };

  function localPrice(usdAmount) {
    const cc = LOCAL_CURRENCIES[form.country];
    const rate = exchangeRates.find(r => r.country === form.country);
    if (!cc || !rate) return `$${usdAmount.toFixed(2)}`;
    const local = usdAmount * rate.rate_to_usd;
    const fmt = local >= 1000 ? local.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : local.toFixed(2);
    return `${cc.symbol} ${fmt} (~$${usdAmount})`;
  }

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
                <h2 className="text-xl font-bold font-heading mb-1">Facebook Page</h2>
                <p className="text-sm text-muted-foreground mb-6">Does your business have a Facebook Page?</p>

                {fbPageChoice === null && (
                  <div className="space-y-3">
                    <button onClick={() => setFbPageChoice('yes')}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-green-400 text-left transition-all">
                      <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">Yes, I have a Facebook Page</p>
                        <p className="text-xs text-muted-foreground mt-0.5">I'm ready to start advertising</p>
                      </div>
                    </button>
                    <button onClick={() => setFbPageChoice('no')}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-[hsl(var(--primary))]/40 text-left transition-all">
                      <Facebook className="w-6 h-6 text-[hsl(var(--primary))] flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">No, I don't have one yet</p>
                        <p className="text-xs text-muted-foreground mt-0.5">I need help setting one up</p>
                      </div>
                    </button>
                  </div>
                )}

                {fbPageChoice === 'yes' && (
                  <div className="text-center py-4">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="font-semibold">You're all set!</p>
                    <p className="text-sm text-muted-foreground mt-1">You can connect your Facebook Page from the dashboard.</p>
                  </div>
                )}

                {fbPageChoice === 'no' && setupChoice === null && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium mb-3">How would you like to proceed?</p>
                    <button onClick={() => setSetupChoice('hire')}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-[hsl(var(--primary))]/50 text-left transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary))]/10 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-5 h-5 text-[hsl(var(--primary))]" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Hire Brandfletch</p>
                        <p className="text-xs text-muted-foreground mt-0.5">We'll professionally create and set up your Facebook Page for you</p>
                        <p className="text-xs font-semibold text-[hsl(var(--primary))] mt-1">{localPrice(servicePrice)}</p>
                      </div>
                    </button>
                    <button onClick={() => { setSetupChoice('diy'); finish(); }}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-border/60 text-left transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                        <Wrench className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">I'll do it myself (DIY)</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Go to the dashboard and connect your page when it's ready</p>
                      </div>
                    </button>
                  </div>
                )}

                {fbPageChoice === 'no' && setupChoice === 'hire' && (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center mx-auto mb-3">
                      <Briefcase className="w-6 h-6 text-[hsl(var(--primary))]" />
                    </div>
                    <p className="font-semibold">Great choice!</p>
                    <p className="text-sm text-muted-foreground mt-1">Fill in your business details and we'll get started on your Facebook Page.</p>
                  </div>
                )}
              </>
            )}

            {/* Step 5: Business Details */}
            {step === 5 && (
              <>
                <h2 className="text-xl font-bold font-heading mb-1">Business Details</h2>
                <p className="text-sm text-muted-foreground mb-6">We need these to create your Facebook Page</p>
                <div className="space-y-4">
                  <div>
                    <Label className="mb-1.5 block">Business Name *</Label>
                    <Input value={setupForm.business_name} onChange={e => updateSetup('business_name', e.target.value)}
                      placeholder="Your business name" className="h-11" />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Products / Services You Offer *</Label>
                    <Textarea value={setupForm.products_services} onChange={e => updateSetup('products_services', e.target.value)}
                      placeholder="e.g. Women's clothing, accessories, custom orders..." rows={3} />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Business Location *</Label>
                    <Input value={setupForm.business_location} onChange={e => updateSetup('business_location', e.target.value)}
                      placeholder="e.g. Area 18, Lilongwe" className="h-11" />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">WhatsApp Business Number *</Label>
                    <Input value={setupForm.whatsapp_number} onChange={e => updateSetup('whatsapp_number', e.target.value)}
                      placeholder="+265 999 000 000" className="h-11" />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Email Address *</Label>
                    <Input value={setupForm.email} onChange={e => updateSetup('email', e.target.value)}
                      placeholder="business@example.com" className="h-11" />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Logo or Business Pictures</Label>
                    <input type="file" accept="image/*" multiple onChange={handleLogoUpload}
                      className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-secondary file:text-foreground hover:file:bg-secondary/80 cursor-pointer" />
                    {uploadingFile && <p className="text-xs text-muted-foreground mt-1 animate-pulse">Uploading...</p>}
                    {setupForm.logo_urls.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {setupForm.logo_urls.map((url, i) => (
                          <img key={i} src={url} alt="" className="w-14 h-14 rounded-lg object-cover border border-border" />
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Anything else you'd like customers to know?</Label>
                    <Textarea value={setupForm.additional_notes} onChange={e => updateSetup('additional_notes', e.target.value)}
                      placeholder="Opening hours, tagline, website, special offers..." rows={3} />
                  </div>
                </div>
              </>
            )}

            {/* Step 6: Payment */}
            {step === 6 && (
              <>
                <h2 className="text-xl font-bold font-heading mb-1">Payment</h2>
                <p className="text-sm text-muted-foreground mb-6">Pay for your Facebook Page setup service</p>

                {paymentMethods.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    <p>No payment methods available for {form.country} yet.</p>
                    <p className="mt-1">Contact us at support@brandfletch.com</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-2 block">Select Payment Method *</Label>
                      <div className="space-y-2">
                        {paymentMethods.map(m => (
                          <button key={m.id} onClick={() => updateSetup('payment_method_id', m.id)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                              setupForm.payment_method_id === m.id
                                ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5'
                                : 'border-border hover:border-[hsl(var(--primary))]/30'
                            }`}>
                            <p className="font-semibold text-sm">{m.method_name}</p>
                            {m.account_number && <p className="text-xs text-muted-foreground mt-0.5">Account: {m.account_number}</p>}
                            {m.account_name && <p className="text-xs text-muted-foreground">Name: {m.account_name}</p>}
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedPaymentMethod?.instructions && (
                      <div className="bg-secondary/60 rounded-xl p-4 text-sm border border-border">
                        <p className="font-medium mb-1 text-xs uppercase tracking-wide text-muted-foreground">Payment Instructions</p>
                        <p className="whitespace-pre-wrap">{selectedPaymentMethod.instructions}</p>
                      </div>
                    )}

                    <div>
                      <Label className="mb-1.5 block">Payment Reference / Transaction ID</Label>
                      <Input value={setupForm.payment_reference} onChange={e => updateSetup('payment_reference', e.target.value)}
                        placeholder="e.g. TXN123456" className="h-11" />
                    </div>

                    <div>
                      <Label className="mb-1.5 block">Upload Payment Proof</Label>
                      <input type="file" accept="image/*,application/pdf" onChange={handleProofUpload}
                        className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-secondary file:text-foreground hover:file:bg-secondary/80 cursor-pointer" />
                      {uploadingFile && <p className="text-xs text-muted-foreground mt-1 animate-pulse">Uploading...</p>}
                      {setupForm.payment_proof_url && (
                        <p className="text-xs text-green-600 mt-1.5">Proof uploaded successfully</p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-5">
            {step > 1 ? (
              <Button variant="outline" onClick={() => {
                if (step === 4) { setFbPageChoice(null); setSetupChoice(null); }
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

              {step === 4 && fbPageChoice === 'yes' && (
                <Button onClick={finish} disabled={saving}
                  className="gap-2 bg-[hsl(var(--accent))] hover:bg-[hsl(217,91%,48%)] text-white font-semibold">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting up...</> : <>Go to Dashboard <ChevronRight className="w-4 h-4" /></>}
                </Button>
              )}

              {step === 4 && fbPageChoice === 'no' && setupChoice === 'hire' && (
                <Button onClick={() => setStep(5)}
                  className="gap-2 bg-[hsl(var(--primary))] text-primary-foreground font-semibold">
                  Continue <ChevronRight className="w-4 h-4" />
                </Button>
              )}

              {step === 5 && (
                <Button
                  onClick={() => setStep(6)}
                  disabled={!setupForm.business_name || !setupForm.products_services || !setupForm.business_location || !setupForm.whatsapp_number || !setupForm.email}
                  className="gap-2 bg-[hsl(var(--primary))] text-primary-foreground font-semibold">
                  Continue <ChevronRight className="w-4 h-4" />
                </Button>
              )}

              {step === 6 && (
                <Button onClick={submitHireRequest} disabled={saving || uploadingFile || !setupForm.payment_method_id}
                  className="gap-2 bg-[hsl(var(--accent))] hover:bg-[hsl(217,91%,48%)] text-white font-semibold">
                  {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                    : <>Submit &amp; Go to Dashboard <ChevronRight className="w-4 h-4" /></>
                  }
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}