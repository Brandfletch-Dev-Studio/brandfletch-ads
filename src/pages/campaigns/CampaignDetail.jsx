import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, ExternalLink, CreditCard, Package, Target, Users, MapPin, FileImage, MessageSquare, Phone, Globe, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/ui/StatusBadge';
import CampaignStageTracker from '@/components/campaigns/CampaignStageTracker';
import CampaignMetricsPanel from '@/components/campaigns/CampaignMetricsPanel';
import { format } from 'date-fns';
import { GOALS } from '@/lib/constants';

export default function CampaignDetail() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);

  useEffect(() => {
    base44.entities.Campaign.filter({}).then(all => {
      setCampaign(all.find(c => c.id === id));
    });
  }, [id]);

  if (!campaign) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  const formatCost = () => {
    const amt = campaign.total_cost || 0;
    const cur = campaign.currency || 'USD';
    if (cur === 'USD') return `$${amt.toFixed(2)}`;
    return `${cur} ${amt.toLocaleString()}`;
  };

  const goalConfig = GOALS.find(g => g.value === campaign.goal);
  const allLocations = [
    ...(campaign.audience_countries || []),
    ...(campaign.audience_regions || []),
    ...(campaign.audience_cities || []),
  ];

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/campaigns" className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold font-heading">{campaign.page_name || 'Campaign'}</h1>
            <StatusBadge status={campaign.status} />
          </div>
          <p className="text-sm text-muted-foreground capitalize">{campaign.package} package · {campaign.duration} · {formatCost()}</p>
        </div>
      </div>

      {/* Stage tracker */}
      {!['draft','awaiting_payment'].includes(campaign.status) && (
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <CampaignStageTracker status={campaign.status} />
          </CardContent>
        </Card>
      )}

      {/* Status banners */}
      {campaign.status === 'awaiting_payment' && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-yellow-800">Payment Required</p>
            <p className="text-sm text-yellow-700 mt-0.5">Complete your payment to activate this campaign.</p>
          </div>
          <Link to={`/campaigns/${id}/payment`}>
            <Button size="sm" variant="outline" className="border-yellow-400 text-yellow-700 flex-shrink-0">Pay Now</Button>
          </Link>
        </div>
      )}
      {campaign.status === 'pending_review' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="font-semibold text-amber-800">Under Review</p>
          <p className="text-sm text-amber-700 mt-0.5">Our team is verifying your payment and reviewing your campaign. This usually takes 1–2 business hours.</p>
        </div>
      )}
      {campaign.status === 'approved' && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="font-semibold text-blue-800">Campaign Approved — Launching Soon</p>
          <p className="text-sm text-blue-700 mt-0.5">Your campaign has been approved and will be set live shortly.</p>
        </div>
      )}
      {campaign.status === 'active' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="font-semibold text-green-800">🚀 Campaign is Live</p>
          <p className="text-sm text-green-700 mt-0.5">Your ads are running. Performance data updates below.</p>
        </div>
      )}
      {campaign.status === 'paused' && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <p className="font-semibold text-slate-700">Campaign Paused</p>
          <p className="text-sm text-slate-600 mt-0.5">Your campaign has been temporarily paused.</p>
        </div>
      )}
      {campaign.status === 'completed' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="font-semibold text-green-800">✅ Campaign Completed</p>
          <p className="text-sm text-green-700 mt-0.5">Your campaign has ended. See your final results below.</p>
        </div>
      )}
      {campaign.status === 'rejected' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="font-semibold text-red-800">Campaign Rejected</p>
          {campaign.manager_notes && <p className="text-sm text-red-700 mt-1">{campaign.manager_notes}</p>}
        </div>
      )}
      {campaign.status === 'refunded' && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <p className="font-semibold text-orange-800">Campaign Refunded</p>
          {campaign.manager_notes && <p className="text-sm text-orange-700 mt-1">{campaign.manager_notes}</p>}
        </div>
      )}
      {campaign.status === 'changes_requested' && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
          <p className="font-semibold text-purple-800">Changes Requested</p>
          {campaign.manager_notes && <p className="text-sm text-purple-700 mt-1">{campaign.manager_notes}</p>}
        </div>
      )}

      {/* Performance metrics — always shown (pending shows dashes) */}
      {!['draft', 'awaiting_payment'].includes(campaign.status) && (
        <CampaignMetricsPanel campaign={campaign} />
      )}

      {/* Campaign details */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4" /> Campaign Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { label: 'Facebook Page', value: campaign.page_name },
            { label: 'Goal', value: goalConfig?.label || campaign.goal?.replace(/_/g, ' ') },
            { label: 'Package', value: campaign.package },
            { label: 'Duration', value: campaign.duration },
            { label: 'Total Cost', value: formatCost() },
            ...(campaign.total_cost_usd && campaign.currency !== 'USD'
              ? [{ label: 'USD Equivalent', value: `≈ $${campaign.total_cost_usd.toFixed(2)}` }]
              : []),
            { label: 'Country', value: campaign.country },
            { label: 'Payment Method', value: campaign.payment_method },
            campaign.payment_reference ? { label: 'Reference', value: campaign.payment_reference } : null,
            { label: 'Submitted', value: campaign.created_date ? format(new Date(campaign.created_date), 'MMM d, yyyy') : null },
            campaign.start_date ? { label: 'Start Date', value: format(new Date(campaign.start_date), 'MMM d, yyyy') } : null,
            campaign.end_date   ? { label: 'End Date',   value: format(new Date(campaign.end_date),   'MMM d, yyyy') } : null,
          ].filter(r => r && r.value).map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm py-1.5 border-b border-border last:border-0">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium capitalize text-right ml-4">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Audience */}
      {allLocations.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" /> Audience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground mb-1.5">Locations</p>
              <div className="flex flex-wrap gap-1.5">
                {allLocations.map(l => <Badge key={l} variant="secondary" className="text-xs">{l}</Badge>)}
              </div>
            </div>
            <div className="flex justify-between py-1 border-t border-border">
              <span className="text-muted-foreground">Age Range</span>
              <span className="font-medium">{campaign.audience_age_min || 18} – {campaign.audience_age_max || 65}</span>
            </div>
            <div className="flex justify-between py-1 border-t border-border">
              <span className="text-muted-foreground">Gender</span>
              <span className="font-medium capitalize">{campaign.audience_gender === 'all' ? 'All genders' : campaign.audience_gender}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}