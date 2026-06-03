import { PACKAGES, DURATIONS, calculateEstimatedResults, LOCAL_PRICES } from '@/lib/pricing';
import { GOALS } from '@/lib/constants';

export default function StepSummary({ data }) {
  const goalConfig = GOALS.find(g => g.value === data.goal);
  const pkg = PACKAGES[data.package];
  const dur = DURATIONS[data.duration];
  const estimated = calculateEstimatedResults(data.package, data.duration);

  const allLocations = [
    ...(data.audience_regions || []),
    ...(data.audience_cities || []),
    ...(data.audience_countries || []),
  ];
  const locationDesc = allLocations.length > 0 ? allLocations.join(', ') : 'not specified';

  // Goal detail text
  const getGoalText = () => {
    const platforms = data.messaging_platforms || [];
    if (data.goal === 'messages') {
      const parts = [];
      if (platforms.includes('whatsapp')) parts.push(`WhatsApp${data.whatsapp_number ? ` (${data.whatsapp_number})` : ''}`);
      if (platforms.includes('messenger')) parts.push('Messenger');
      return `getting messages via ${parts.join(' and ')}`;
    }
    if (data.goal === 'website_traffic') return `getting more website visitors`;
    if (data.goal === 'phone_calls') return `getting phone calls`;
    if (data.goal === 'boost_post') return `boosting your Facebook post`;
    if (data.goal === 'page_followers') return `gaining page followers`;
    if (data.goal === 'brand_awareness') return `building brand awareness`;
    return 'running a campaign';
  };

  const formatCost = () => {
    const local = LOCAL_PRICES[data.country];
    if (local) return `${local.symbol}${(data.total_cost || 0).toLocaleString()}`;
    return `$${(data.total_cost || 0).toFixed(2)}`;
  };

  return (
    <div>
      <h2 className="text-xl font-bold font-heading mb-1">Campaign Summary</h2>
      <p className="text-muted-foreground text-sm mb-6">Review your campaign before proceeding to payment.</p>

      <div className="space-y-4 mb-6">
        {/* Main summary paragraph */}
        <div className="bg-secondary/40 rounded-xl p-4 space-y-3">
          <p className="text-sm leading-relaxed text-foreground">
            You are running a Facebook ad campaign with the goal of <span className="font-semibold">{getGoalText()}</span>.
          </p>

          <p className="text-sm leading-relaxed text-foreground">
            Your target audience is located in <span className="font-semibold">{locationDesc}</span>, aged <span className="font-semibold">{data.audience_age_min}–{data.audience_age_max}</span>, and includes <span className="font-semibold">{data.audience_gender === 'all' ? 'all genders' : data.audience_gender === 'male' ? 'men only' : 'women only'}</span>.
          </p>

          <p className="text-sm leading-relaxed text-foreground">
            Your budget is <span className="font-semibold">{formatCost()}</span> on a <span className="font-semibold">{dur?.label || '—'}</span> basis using the <span className="font-semibold">{pkg?.label || '—'}</span> package.
          </p>

          {estimated && (
            <p className="text-sm leading-relaxed text-foreground">
              Based on these settings, you can expect an estimated <span className="font-semibold">{estimated.reach.toLocaleString()} people reached</span> with approximately <span className="font-semibold">{estimated.impressions.toLocaleString()} impressions</span>.
            </p>
          )}
        </div>
      </div>

      {/* Cost highlight */}
      <div className="bg-[hsl(var(--primary))] rounded-xl p-5 text-primary-foreground mb-4">
        <p className="text-sm opacity-80 mb-1">Total Cost</p>
        <p className="text-3xl font-bold font-heading">{formatCost()}</p>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        * Results are estimates and not guaranteed. Click "Proceed to Payment" to continue.
      </p>
    </div>
  );
}