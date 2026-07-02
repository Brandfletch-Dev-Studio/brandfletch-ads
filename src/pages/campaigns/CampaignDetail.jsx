import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { ArrowLeft, ExternalLink, Package, Users, FileImage, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/ui/StatusBadge';
import CampaignStageTracker from '@/components/campaigns/CampaignStageTracker';
import CampaignMetricsPanel from '@/components/campaigns/CampaignMetricsPanel';
import { format } from 'date-fns';
import { GOALS } from '@/lib/constants';
import CampaignShareCard from '@/components/campaigns/CampaignShareCard';

export default function CampaignDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  async function loadCampaign() {
    try {
      // Fetch only this campaign by its ID — no privacy leak, no full-table scan
      const results = await base44.entities.Campaign.filter({ id });
      const found = results?.[0] || null;
      setCampaign(found);
    } catch (err) {
      console.error('Failed to load campaign:', err);
      toast.error('Could not load campaign.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCampaign();

    // Handle Paychangu return
    const urlParams = new URLSearchParams(window.location.search);
    const txRef = urlParams.get('paychangu_tx');
    const paymentType = urlParams.get('payment_type');
    if (txRef && paymentType === 'campaign') {
      setVerifying(true);
      base44.functions.invoke('verifyPaychanguPayment', { tx_ref: txRef, campaign_id: id, payment_type: 'campaign' })
        .then(res => {
          if (res?.verified) {
            toast.success('Payment verified! Your campaign is under review.');
            loadCampaign();
          } else {
            toast.error('Payment could not be verified. Please contact support.');
          }
          window.history.replaceState({}, '', `/campaigns/${id}`);
        })
        .finally(() => setVerifying(false));
    }
  }, [id]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-secondary animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-48 bg-secondary rounded animate-pulse" />
            <div className="h-4 w-64 bg-secondary rounded animate-pulse" />
          </div>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 rounded-xl bg-secondary animate-pulse" />
        ))}
      </div>
    );
  }

  if (verifying) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-3 min-h-[300px]">
        <div className="w-10 h-10 border-4 border-[hsl(var(--primary))]/20 border-t-[hsl(var(--primary))] rounded-full animate-spin" />
        <p className="text-muted-foreground font-medium">Verifying your payment...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground font-medium">Campaign not found.</p>
        <Link to="/campaigns" className="text-sm text-[hsl(var(--accent))] hover:underline mt-2 inline-block">
          Back to campaigns
        </Link>
      </div>
    );
  }

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
            <CampaignShareCard campaign={campaign} />
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
      {(allLocations.length > 0 || campaign.audience_worldwide) && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" /> Audience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {campaign.audience_worldwide ? (
              <p className="text-muted-foreground">Worldwide targeting</p>
            ) : (
              <div>
                <p className="text-muted-foreground mb-1.5">Locations</p>
                <div className="flex flex-wrap gap-1.5">
                  {allLocations.map(l => <Badge key={l} variant="secondary" className="text-xs">{l}</Badge>)}
                </div>
              </div>
            )}
            <div className="flex justify-between py-1 border-t border-border">
              <span className="text-muted-foreground">Age Range</span>
              <span className="font-medium">{campaign.audience_age_min || 18} – {campaign.audience_age_max || 65}</span>
            </div>
            <div className="flex justify-between py-1 border-t border-border">
              <span className="text-muted-foreground">Gender</span>
              <span className="font-medium capitalize">{campaign.audience_gender || 'All'}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Creative */}
      {(campaign.post_url || campaign.creative_link || campaign.description) && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileImage className="w-4 h-4" /> Creative
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {campaign.creative_type && (
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium capitalize">{campaign.creative_type.replace(/_/g, ' ')}</span>
              </div>
            )}
            {campaign.post_url && (
              <a href={campaign.post_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[hsl(var(--accent))] hover:underline">
                <ExternalLink className="w-3.5 h-3.5" /> View Post
              </a>
            )}
            {campaign.creative_link && (
              <a href={campaign.creative_link} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[hsl(var(--accent))] hover:underline">
                <ExternalLink className="w-3.5 h-3.5" /> View Creative
              </a>
            )}
            {campaign.description && (
              <p className="text-muted-foreground leading-relaxed">{campaign.description}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Renewal CTA — shown when campaign is completed */}
      {campaign.status === 'completed' && (
        <div className="rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))]/10 to-[hsl(var(--accent))]/10 border border-[hsl(var(--primary))]/20 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="w-4 h-4 text-[hsl(var(--primary))]" />
              <p className="font-semibold text-sm">Ready to run another campaign?</p>
            </div>
            <p className="text-sm text-muted-foreground">Keep the momentum going — launch a follow-up campaign with the same audience and settings.</p>
          </div>
          <button
            onClick={() => navigate('/campaigns/new')}
            className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-semibold hover:bg-[hsl(var(--primary))]/90 transition-colors whitespace-nowrap"
          >
            Renew Campaign
          </button>
        </div>
      )}

    </div>
  );
}
