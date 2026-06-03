import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Check, X, MessageSquare, Play, Pause, CheckCircle, LinkIcon, ImageIcon, MapPin, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import StatusBadge from '@/components/ui/StatusBadge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useAuditLog } from '@/hooks/useAuditLog';

export default function AdminCampaignDetail() {
  useRoleGuard(['admin', 'campaign_manager']);
  const auditLog = useAuditLog();
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState('');
  const [metrics, setMetrics] = useState({ impressions: 0, reach: 0, clicks: 0, messages: 0, leads: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser);
    loadCampaign();
  }, [id]);

  async function loadCampaign() {
    const all = await base44.entities.Campaign.list();
    const c = all.find(x => x.id === id);
    setCampaign(c);
    if (c) {
      setNotes(c.manager_notes || '');
      setMetrics({
        impressions: c.impressions || 0,
        reach: c.reach || 0,
        clicks: c.clicks || 0,
        messages: c.messages || 0,
        leads: c.leads || 0,
      });
    }
  }

  // Valid status transitions
  const VALID_TRANSITIONS = {
    pending_review: ['approved', 'rejected', 'changes_requested'],
    approved: ['active', 'rejected'],
    active: ['paused', 'completed'],
    paused: ['active', 'completed'],
    changes_requested: ['pending_review', 'rejected'],
  };

  async function updateStatus(status) {
    const allowed = VALID_TRANSITIONS[campaign.status] || [];
    if (!allowed.includes(status)) {
      toast.error(`Cannot transition from "${campaign.status}" to "${status}"`);
      return;
    }
    setSaving(true);
    await base44.entities.Campaign.update(id, { status, manager_notes: notes, assigned_manager: user?.id });
    auditLog(`campaign_${status.replace('_', '_')}`, 'Campaign', id,
      `Campaign "${campaign.page_name}" → ${status}. Notes: ${notes || 'none'}`);

    // Notify client
    const notifMap = {
      approved: { type: 'campaign_approved', title: '🎉 Campaign Approved!', msg: `Your campaign for ${campaign.page_name} has been approved and will be launched shortly.` },
      active: { type: 'campaign_approved', title: '🚀 Campaign is Live!', msg: `Your campaign for ${campaign.page_name} is now active.` },
      rejected: { type: 'campaign_rejected', title: '❌ Campaign Rejected', msg: `Your campaign for ${campaign.page_name} was rejected. Reason: ${notes}` },
      changes_requested: { type: 'changes_requested', title: '⚠️ Changes Requested', msg: `Your campaign for ${campaign.page_name} needs changes: ${notes}` },
      completed: { type: 'campaign_completed', title: '✅ Campaign Completed', msg: `Your campaign for ${campaign.page_name} has been completed. View your final report.` },
    };
    const notif = notifMap[status];
    if (notif && campaign.user_id) {
      await base44.entities.Notification.create({
        recipient_id: campaign.user_id,
        type: notif.type,
        title: notif.title,
        message: notif.msg,
        campaign_id: id,
        is_read: false,
      });
    }

    toast.success(`Campaign ${status.replace('_', ' ')}`);
    loadCampaign();
    setSaving(false);
  }

  async function saveMetrics() {
    setSaving(true);
    await base44.entities.Campaign.update(id, metrics);
    auditLog('campaign_metrics_updated', 'Campaign', id,
      `Metrics updated: ${JSON.stringify(metrics)}`);
    toast.success('Metrics updated!');
    setSaving(false);
  }

  if (!campaign) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  const formatCost = () => {
    if (campaign.currency === 'MWK') return `MK${(campaign.total_cost || 0).toLocaleString()}`;
    return `$${(campaign.total_cost || 0).toFixed(2)}`;
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/campaigns" className="p-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold font-heading">{campaign.page_name || 'Campaign'}</h1>
            <StatusBadge status={campaign.status} />
          </div>
          <p className="text-sm text-muted-foreground capitalize">{campaign.package} · {campaign.duration} · {formatCost()}</p>
        </div>
      </div>

      {/* Action buttons */}
      {campaign.status === 'pending_review' && (
        <Card className="shadow-sm border-amber-200 bg-amber-50">
          <CardContent className="p-5">
            <p className="font-semibold text-amber-800 mb-3">Campaign awaiting your review</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => updateStatus('approved')} disabled={saving} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                <Check className="w-4 h-4" /> Approve
              </Button>
              <Button onClick={() => updateStatus('changes_requested')} disabled={saving} variant="outline" className="gap-2 border-purple-400 text-purple-700">
                <MessageSquare className="w-4 h-4" /> Request Changes
              </Button>
              <Button onClick={() => updateStatus('rejected')} disabled={saving} variant="outline" className="gap-2 border-red-400 text-red-700">
                <X className="w-4 h-4" /> Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {campaign.status === 'approved' && (
        <div className="flex gap-2">
          <Button onClick={() => updateStatus('active')} disabled={saving} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
            <Play className="w-4 h-4" /> Set Active
          </Button>
        </div>
      )}

      {campaign.status === 'active' && (
        <div className="flex gap-2">
          <Button onClick={() => updateStatus('paused')} disabled={saving} variant="outline" className="gap-2">
            <Pause className="w-4 h-4" /> Pause
          </Button>
          <Button onClick={() => updateStatus('completed')} disabled={saving} className="gap-2 bg-[hsl(var(--primary))] text-primary-foreground">
            <CheckCircle className="w-4 h-4" /> Mark Completed
          </Button>
        </div>
      )}

      {campaign.status === 'paused' && (
        <Button onClick={() => updateStatus('active')} disabled={saving} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
          <Play className="w-4 h-4" /> Resume
        </Button>
      )}

      {/* Manager Notes */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Manager Notes</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes for the client or internal team..." rows={3} />
        </CardContent>
      </Card>

      {/* Live Metrics Update */}
      {['active', 'paused', 'completed'].includes(campaign.status) && (
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">Update Campaign Metrics</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
              {Object.entries(metrics).map(([key, val]) => (
                <div key={key}>
                  <Label className="mb-1.5 block capitalize text-xs">{key}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={val}
                    onChange={e => setMetrics(m => ({ ...m, [key]: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              ))}
            </div>
            <Button onClick={saveMetrics} disabled={saving} className="gap-2 bg-[hsl(var(--primary))] text-primary-foreground">
              Save Metrics
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Ad Creative */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Ad Creative</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {campaign.creative_type === 'link' || campaign.post_url || campaign.creative_link ? (
            <div className="flex items-start gap-3">
              <LinkIcon className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Post / Link to Boost</p>
                <a href={campaign.creative_link || campaign.post_url} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-medium text-[hsl(var(--accent))] hover:underline break-all">
                  {campaign.creative_link || campaign.post_url}
                </a>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <ImageIcon className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Creative Type</p>
                <p className="text-sm font-medium">Custom ad creative</p>
              </div>
            </div>
          )}
          {campaign.description && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Ad Description</p>
              <p className="text-sm bg-secondary/40 rounded-lg p-3">{campaign.description}</p>
            </div>
          )}
          {campaign.creative_assets?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Uploaded Assets ({campaign.creative_assets.length})</p>
              <div className="flex flex-wrap gap-2">
                {campaign.creative_assets.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-[hsl(var(--accent))] hover:underline bg-secondary px-3 py-1.5 rounded-lg">
                    Asset {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audience */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Audience Targeting</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <span className="text-muted-foreground">Location: </span>
              <span className="font-medium">
                {campaign.audience_worldwide
                  ? 'Worldwide'
                  : [
                      ...(campaign.audience_countries || []),
                      ...(campaign.audience_regions || []),
                      ...(campaign.audience_cities || []),
                    ].join(', ') || '—'}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <Users className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <span className="text-muted-foreground">Demographics: </span>
              <span className="font-medium">
                Age {campaign.audience_age_min || 18}–{campaign.audience_age_max || 65} · {campaign.audience_gender === 'all' || !campaign.audience_gender ? 'All genders' : campaign.audience_gender}
              </span>
            </div>
          </div>
          {campaign.whatsapp_number && (
            <div className="text-sm">
              <span className="text-muted-foreground">WhatsApp: </span>
              <span className="font-medium">{campaign.whatsapp_number}</span>
            </div>
          )}
          {campaign.phone_number && (
            <div className="text-sm">
              <span className="text-muted-foreground">Phone: </span>
              <span className="font-medium">{campaign.phone_number}</span>
            </div>
          )}
          {campaign.website_url && (
            <div className="text-sm">
              <span className="text-muted-foreground">Website: </span>
              <a href={campaign.website_url} target="_blank" rel="noopener noreferrer" className="font-medium text-[hsl(var(--accent))] hover:underline">{campaign.website_url}</a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaign Info */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Campaign Details</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'User ID', value: campaign.user_id },
            { label: 'Page', value: campaign.page_name },
            { label: 'Objective', value: campaign.objective?.replace(/_/g, ' ') },
            { label: 'Package', value: campaign.package },
            { label: 'Duration', value: campaign.duration },
            { label: 'Country', value: campaign.country },
            { label: 'Cost', value: formatCost() },
            { label: 'Payment Method', value: campaign.payment_method },
            { label: 'Payment Reference', value: campaign.payment_reference },
            { label: 'Created', value: campaign.created_date ? format(new Date(campaign.created_date), 'MMM d, yyyy HH:mm') : '—' },
          ].filter(r => r.value).map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm py-1 border-b border-border last:border-0">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-right ml-4 capitalize truncate max-w-[60%]">{value}</span>
            </div>
          ))}
          {campaign.payment_proof_url && (
            <div className="flex justify-between text-sm py-1">
              <span className="text-muted-foreground">Payment Proof</span>
              <a href={campaign.payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--accent))] hover:underline font-medium">View File</a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}