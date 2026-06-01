import { PACKAGES, DURATIONS, calculateEstimatedResults } from '@/lib/pricing';
import { OBJECTIVES, PROMOTE_TYPES } from '@/lib/constants';
import { Facebook, Globe, Users, Package, Clock, DollarSign, TrendingUp } from 'lucide-react';

function SummaryRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-sm font-semibold mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}

export default function StepSummary({ data }) {
  const objective = OBJECTIVES.find(o => o.value === data.objective);
  const promote = PROMOTE_TYPES.find(p => p.value === data.promote_type);
  const pkg = PACKAGES[data.package];
  const dur = DURATIONS[data.duration];
  const estimated = calculateEstimatedResults(data.package, data.duration);

  const audienceDesc = data.audience_worldwide
    ? 'Worldwide'
    : data.audience_countries?.length > 0
    ? data.audience_countries.join(', ')
    : 'Not specified';

  const formatCost = () => {
    if (data.currency === 'MWK') return `MK${(data.total_cost || 0).toLocaleString()}`;
    return `$${(data.total_cost || 0).toFixed(2)}`;
  };

  return (
    <div>
      <h2 className="text-xl font-bold font-heading mb-1">Campaign Summary</h2>
      <p className="text-muted-foreground text-sm mb-6">Review your campaign details before proceeding to payment.</p>

      <div className="bg-secondary/40 rounded-xl p-4 mb-5">
        <SummaryRow icon={Facebook} label="Facebook Page" value={data.page_name || '—'} />
        <SummaryRow icon={Package} label="Promotion Type" value={promote?.label || '—'} />
        <SummaryRow icon={TrendingUp} label="Campaign Objective" value={objective ? `${objective.icon} ${objective.label}` : '—'} />
        <SummaryRow icon={Globe} label="Audience Location" value={audienceDesc} />
        <SummaryRow icon={Users} label="Demographics" value={`Age ${data.audience_age_min}–${data.audience_age_max} · ${data.audience_gender === 'all' ? 'All genders' : data.audience_gender}`} />
        <SummaryRow icon={Package} label="Package" value={pkg?.label || '—'} />
        <SummaryRow icon={Clock} label="Duration" value={dur?.label || '—'} />
      </div>

      {/* Cost highlight */}
      <div className="bg-[hsl(var(--primary))] rounded-xl p-5 text-primary-foreground mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm opacity-80">Total Cost</p>
            <p className="text-3xl font-bold font-heading">{formatCost()}</p>
          </div>
          <DollarSign className="w-10 h-10 opacity-30" />
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