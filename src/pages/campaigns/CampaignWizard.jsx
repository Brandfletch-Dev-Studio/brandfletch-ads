import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ChevronRight, ChevronLeft, Check, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { isTestMode } from '@/lib/testMode';

import StepSelectPage from './wizard/StepSelectPage';
import StepCreative from './wizard/StepCreative';
import StepGoal from './wizard/StepGoal';
import StepAudience from './wizard/StepAudience';
import StepPackage from './wizard/StepPackage';
import StepSummary from './wizard/StepSummary';

const STEPS = [
  { id: 1, label: 'Page' },
  { id: 2, label: 'Creative' },
  { id: 3, label: 'Goal' },
  { id: 4, label: 'Audience' },
  { id: 5, label: 'Package' },
  { id: 6, label: 'Summary' },
];

export default function CampaignWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [data, setData] = useState({
    page_id: '', page_name: '',
    goal: '', promote_type: '', post_url: '', website_url: '', phone_number: '',
    creative_assets: [], creative_link: '', creative_type: 'existing_post', description: '',
    objective: '', whatsapp_number: '', messaging_platforms: [],
    audience_countries: [], audience_regions: [], audience_cities: [],
    audience_worldwide: false, audience_age_min: 18, audience_age_max: 65,
    audience_gender: 'all', save_audience: false, audience_name: '',
    package: '', duration: 'weekly',
    country: '', currency: 'USD', total_cost: 0,
    estimated_impressions: 0, estimated_reach: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      // Pre-fill country and currency from user profile
      if (u?.country) {
        setData(d => ({ ...d, country: u.country }));
      }
    });
  }, []);

  function update(fields) {
    setData(d => ({ ...d, ...fields }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    const testMode = isTestMode();
    const campaign = await base44.entities.Campaign.create({
      ...data,
      user_id: user.id,
      is_test: testMode,
      status: testMode ? 'draft' : 'awaiting_payment',
    });

    if (data.save_audience && data.audience_name) {
      await base44.entities.SavedAudience.create({
        user_id: user.id,
        name: data.audience_name,
        countries: data.audience_countries,
        regions: data.audience_regions,
        cities: data.audience_cities,
        worldwide: data.audience_worldwide,
        age_min: data.audience_age_min,
        age_max: data.audience_age_max,
        gender: data.audience_gender,
      });
    }

    toast.success('Campaign created! Proceed to payment.');
    navigate(`/campaigns/${campaign.id}/payment`);
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold font-heading">Create Campaign</h1>
            {isTestMode() && (
              <span className="flex items-center gap-1.5 text-xs bg-amber-100 text-amber-700 border border-amber-300 px-3 py-1 rounded-full font-semibold">
                <FlaskConical className="w-3.5 h-3.5" /> Test Mode — campaign won't require payment
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-1">Follow the steps to launch your campaign.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                  step > s.id ? "bg-[hsl(var(--accent))] text-white" :
                  step === s.id ? "bg-[hsl(var(--primary))] text-white" :
                  "bg-secondary text-muted-foreground"
                )}>
                  {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                </div>
                <span className={cn("text-xs mt-1 font-medium", step === s.id ? "text-foreground" : "text-muted-foreground")}>
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={cn("h-0.5 w-8 lg:w-12 mx-1 mb-5 transition-all", step > s.id ? "bg-[hsl(var(--accent))]" : "bg-border")} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 lg:p-8">
          {step === 1 && <StepSelectPage data={data} update={update} userId={user?.id} />}
          {step === 2 && <StepCreative data={data} update={update} />}
          {step === 3 && <StepGoal data={data} update={update} />}
          {step === 4 && <StepAudience data={data} update={update} userId={user?.id} />}
          {step === 5 && <StepPackage data={data} update={update} />}
          {step === 6 && <StepSummary data={data} update={update} />}
        </div>

        {/* Nav */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/campaigns')}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          {step < 6 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={
                (step === 1 && !data.page_id) ||
                (step === 2 && (data.creative_type === 'existing_post' || !data.creative_type) && !data.post_url) ||
                (step === 2 && data.creative_type === 'new_creative' && !data.description) ||
                (step === 3 && (
                  !data.goal ||
                  (data.goal === 'messages' && data.messaging_platforms?.length === 0) ||
                  (data.goal === 'website_traffic' && !data.website_url) ||
                  (data.goal === 'phone_calls' && !data.phone_number)
                )) ||
                (step === 5 && !data.package)
              }
              className="gap-2 bg-[hsl(var(--primary))] text-primary-foreground font-semibold"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-2 bg-[hsl(var(--accent))] hover:bg-[hsl(217,91%,48%)] text-white font-semibold"
            >
              {submitting ? 'Creating...' : 'Proceed to Payment'} <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}