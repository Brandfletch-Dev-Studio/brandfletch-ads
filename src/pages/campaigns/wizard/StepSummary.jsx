import { PACKAGES, DURATIONS, calculateEstimatedResults, LOCAL_PRICES } from '@/lib/pricing';
import { GOALS } from '@/lib/constants';
import { Facebook, Globe, Users, Package, Clock, TrendingUp, Link as LinkIcon, ImageIcon, Phone, MessageCircle } from 'lucide-react';

function SummaryRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <div className="text-sm font-semibold mt-0.5 break-words">{children}</div>
      </div>
    </div>
  );
}

export default function StepSummary({ data }) {
  const goalConfig = GOALS.find(g => g.value === data.goal);
  const pkg = PACKAGES[data.package];
  const dur = DURATIONS[data.duration];
  const estimated = calculateEstimatedResults(data.package, data.duration);

  // Audience location
  const audienceDesc = data.audience_worldwide
    ? 'Worldwide'
    : data.audience_countries?.length > 0
    ? data.audience_countries.join(', ')
    : 'Not specified';

  // Cost formatting
  const formatCost = () => {
    const local = LOCAL_PRICES[data.country];
    if (local) return `${local.symbol}${(data.total_cost || 0).toLocaleString()}`;
    return `$${(data.total_cost || 0).toFixed(2)}`;
  };

  // Creative summary
  const isExistingPost = data.creative_type === 'existing_post' || !data.creative_type;
  const isBoostGoal = data.goal === 'boost_post';
  // post_url can come from StepCreative (existing_post) or StepGoal (boost_post)
  const postUrl = data.post_url;

  // Goal detail line
  const renderGoalDetail = () => {
    if (!data.goal) return null;
    const platforms = data.messaging_platforms || [];
    if (data.goal === 'messages') {
      const parts = [];
      if (platforms.includes('whatsapp')) parts.push(`💬 WhatsApp${data.whatsapp_number ? ` (${data.whatsapp_number})` : ''}`);
      if (platforms.includes('messenger')) parts.push('📨 Messenger');
      return parts.length > 0 ? parts.join(' · ') : null;
    }
    if (data.goal === 'website_traffic' && data.website_url) return data.website_url;
    if (data.goal === 'phone_calls' && data.phone_number) return data.phone_number;
    if (data.goal === 'boost_post' && postUrl) return postUrl;
    return null;
  };

  const goalDetail = renderGoalDetail();

  return (
    <div>
      <h2 className="text-xl font-bold font-heading mb-1">Campaign Summary</h2>
      <p className="text-muted-foreground text-sm mb-6">Review your campaign details before proceeding to payment.</p>

      <div className="bg-secondary/40 rounded-xl p-4 mb-5">

        {/* Facebook Page */}
        <SummaryRow icon={Facebook} label="Facebook Page">
          {data.page_name || '—'}
        </SummaryRow>

        {/* Campaign Goal */}
        <SummaryRow icon={TrendingUp} label="Campaign Goal">
          {goalConfig ? (
            <span>{goalConfig.icon} {goalConfig.label}</span>
          ) : '—'}
          {goalDetail && (
            <p className="text-xs font-normal text-muted-foreground mt-0.5 break-all">{goalDetail}</p>
          )}
        </SummaryRow>

        {/* Ad Creative */}
        <SummaryRow
          icon={isExistingPost && !isBoostGoal ? LinkIcon : ImageIcon}
          label="Ad Creative"
        >
          {isBoostGoal ? (
            // boost_post uses post_url from StepGoal — show it here
            postUrl
              ? <a href={postUrl} target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--accent))] hover:underline break-all">{postUrl}</a>
              : <span className="text-muted-foreground font-normal">No post URL provided</span>
          ) : isExistingPost ? (
            postUrl
              ? <a href={postUrl} target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--accent))] hover:underline break-all">{postUrl}</a>
              : <span className="text-muted-foreground font-normal">No post URL provided</span>
          ) : (
            // new_creative
            <>
              <span>New ad creative</span>
              {data.description && (
                <p className="text-xs font-normal text-muted-foreground mt-0.5 line-clamp-2">{data.description}</p>
              )}
              {data.creative_assets?.length > 0 && (
                <p className="text-xs font-normal text-muted-foreground">{data.creative_assets.length} file{data.creative_assets.length > 1 ? 's' : ''} uploaded</p>
              )}
            </>
          )}
        </SummaryRow>

        {/* Audience Location */}
        <SummaryRow icon={Globe} label="Audience Location">
          {audienceDesc}
          {(data.audience_regions?.length > 0 || data.audience_cities?.length > 0) && (
            <p className="text-xs font-normal text-muted-foreground mt-0.5">
              {[...(data.audience_regions || []), ...(data.audience_cities || [])].join(', ')}
            </p>
          )}
        </SummaryRow>

        {/* Demographics */}
        <SummaryRow icon={Users} label="Demographics">
          Age {data.audience_age_min}–{data.audience_age_max} · {data.audience_gender === 'all' ? 'All genders' : data.audience_gender === 'male' ? 'Male only' : 'Female only'}
        </SummaryRow>

        {/* Package */}
        <SummaryRow icon={Package} label="Package">
          {pkg?.label || '—'}
          {pkg?.desc && <p className="text-xs font-normal text-muted-foreground mt-0.5">{pkg.desc}</p>}
        </SummaryRow>

        {/* Duration */}
        <SummaryRow icon={Clock} label="Duration">
          {dur?.label || '—'}
        </SummaryRow>

      </div>

      {/* Cost highlight */}
      <div className="bg-[hsl(var(--primary))] rounded-xl p-5 text-primary-foreground mb-4">
        <div className="mb-3">
          <p className="text-sm opacity-80">Total Cost</p>
          <p className="text-3xl font-bold font-heading">{formatCost()}</p>
        </div>
        {estimated && (
          <div className="flex gap-4 pt-3 border-t border-white/20">
            <div>
              <p className="text-xs opacity-70">Est. Impressions</p>
              <p className="font-semibold">{estimated.impressions.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs opacity-70">Est. Reach</p>
              <p className="font-semibold">{estimated.reach.toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        * Results are estimates and are not guaranteed. Click "Proceed to Payment" to continue.
      </p>
    </div>
  );
}