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
  const locationDesc = allLocations.length > 0 ? allLocations.join(', ') : 'all locations';
  const genderDesc = data.audience_gender === 'all' ? 'all genders' : data.audience_gender === 'male' ? 'men' : 'women';

  // Goal detail
  const getGoalDetail = () => {
    const platforms = data.messaging_platforms || [];
    if (data.goal === 'messages') {
      const parts = [];
      if (platforms.includes('whatsapp')) parts.push(`WhatsApp${data.whatsapp_number ? ` (${data.whatsapp_number})` : ''}`);
      if (platforms.includes('messenger')) parts.push('Messenger');
      return parts.length > 0 ? `via ${parts.join(' and ')}` : '';
    }
    if (data.goal === 'website_traffic' && data.website_url) return `— ${data.website_url}`;
    if (data.goal === 'phone_calls' && data.phone_number) return `— ${data.phone_number}`;
    if (data.goal === 'boost_post' && data.post_url) return `— ${data.post_url}`;
    return '';
  };

  // Creative sentence
  const getCreativeSentence = () => {
    if (data.creative_type === 'new_creative') {
      const hasAssets = data.creative_assets?.length > 0;
      const hasDesc = !!data.description;
      if (hasDesc && hasAssets) return `A new ad creative has been prepared with a description and ${data.creative_assets.length} uploaded file${data.creative_assets.length > 1 ? 's' : ''}.`;
      if (hasDesc) return `A new ad creative will be created based on your description by our team.`;
      if (hasAssets) return `${data.creative_assets.length} creative file${data.creative_assets.length > 1 ? 's have' : ' has'} been uploaded for your ad.`;
      return `Our team will create the ad creative for you.`;
    }
    // existing_post
    if (data.post_url) return `This campaign will boost your existing Facebook post.`;
    return `This campaign will promote your Facebook page.`;
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

        {/* Overview paragraph */}
        <div className="bg-secondary/40 rounded-xl p-4">
          <p className="text-sm leading-relaxed text-foreground">
            <span className="font-semibold">{data.page_name || 'Your page'}</span> will run a{' '}
            <span className="font-semibold">{goalConfig ? `${goalConfig.icon} ${goalConfig.label}` : 'campaign'}</span>{' '}
            campaign{getGoalDetail() ? ` ${getGoalDetail()}` : ''}, targeting{' '}
            <span className="font-semibold">{genderDesc}</span>{' '}
            aged <span className="font-semibold">{data.audience_age_min}–{data.audience_age_max}</span>{' '}
            in <span className="font-semibold">{locationDesc}</span>.
          </p>
        </div>

        {/* Creative paragraph */}
        <div className="bg-secondary/40 rounded-xl p-4">
          <p className="text-sm leading-relaxed text-foreground">
            {getCreativeSentence()}
          </p>
        </div>

        {/* Package & duration paragraph */}
        <div className="bg-secondary/40 rounded-xl p-4">
          <p className="text-sm leading-relaxed text-foreground">
            The campaign will run on the{' '}
            <span className="font-semibold">{pkg?.label || '—'}</span> package{' '}
            on a <span className="font-semibold">{dur?.label || '—'}</span> basis.
            {estimated && (
              <> You can expect an estimated <span className="font-semibold">{estimated.reach.toLocaleString()} people reached</span> and up to <span className="font-semibold">{estimated.impressions.toLocaleString()} impressions</span>.</>
            )}
          </p>
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