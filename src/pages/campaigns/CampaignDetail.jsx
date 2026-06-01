import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, BarChart3, Eye, MousePointer, MessageSquare, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import { format } from 'date-fns';

export default function CampaignDetail() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);

  useEffect(() => {
    base44.entities.Campaign.filter({}).then(all => {
      setCampaign(all.find(c => c.id === id));
    });
  }, [id]);

  if (!campaign) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  const metrics = [
    { label: 'Impressions', value: campaign.impressions || 0, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Reach', value: campaign.reach || 0, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Clicks', value: campaign.clicks || 0, icon: MousePointer, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Messages', value: campaign.messages || 0, icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Leads', value: campaign.leads || 0, icon: TrendingUp, color: 'text-pink-600', bg: 'bg-pink-50' },
  ];

  const formatCost = () => {
    if (campaign.currency === 'MWK') return `MK${(campaign.total_cost || 0).toLocaleString()}`;
    return `$${(campaign.total_cost || 0).toFixed(2)}`;
  };

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/campaigns" className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold font-heading">{campaign.page_name || 'Campaign'}</h1>
            <StatusBadge status={campaign.status} />
          </div>
          <p className="text-sm text-muted-foreground capitalize">{campaign.package} package · {campaign.duration}</p>
        </div>
      </div>

      {/* Status message */}
      {campaign.status === 'awaiting_payment' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-amber-800">Payment Under Review</p>
            <p className="text-sm text-amber-700 mt-0.5">Our finance team is verifying your payment. This usually takes 1–2 business hours.</p>
          </div>
          <Link to={`/campaigns/${id}/payment`}>
            <Button size="sm" variant="outline" className="border-amber-400 text-amber-700 flex-shrink-0">Resubmit</Button>
          </Link>
        </div>
      )}

      {campaign.status === 'changes_requested' && campaign.manager_notes && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
          <p className="font-semibold text-purple-800">Changes Requested</p>
          <p className="text-sm text-purple-700 mt-1">{campaign.manager_notes}</p>
        </div>
      )}

      {campaign.status === 'rejected' && campaign.manager_notes && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="font-semibold text-red-800">Campaign Rejected</p>
          <p className="text-sm text-red-700 mt-1">{campaign.manager_notes}</p>
        </div>
      )}

      {/* Live metrics */}
      {['active', 'paused', 'completed'].includes(campaign.status) && (
        <div>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Campaign Performance
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {metrics.map(({ label, value, icon: Icon, color, bg }) => (
              <Card key={label} className="shadow-sm">
                <CardContent className="p-4 text-center">
                  <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mx-auto mb-2`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <p className="text-xl font-bold font-heading">{value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Campaign details */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Campaign Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'Facebook Page', value: campaign.page_name },
            { label: 'Objective', value: campaign.objective?.replace(/_/g, ' ') },
            { label: 'Package', value: campaign.package },
            { label: 'Duration', value: campaign.duration },
            { label: 'Total Cost', value: formatCost() },
            { label: 'Country', value: campaign.country },
            { label: 'Created', value: campaign.created_date ? format(new Date(campaign.created_date), 'MMM d, yyyy') : '—' },
            { label: 'Payment Method', value: campaign.payment_method || '—' },
            { label: 'Payment Reference', value: campaign.payment_reference || '—' },
          ].map(({ label, value }) => value && (
            <div key={label} className="flex justify-between text-sm py-1 border-b border-border last:border-0">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium capitalize text-right ml-4">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}