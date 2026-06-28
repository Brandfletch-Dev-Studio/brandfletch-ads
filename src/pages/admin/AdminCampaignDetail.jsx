import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Check, X, MessageSquare, Play, Pause, CheckCircle, MapPin, Users, Target, Package, CreditCard, FileImage, ExternalLink, Phone, Globe, Share2, RefreshCw } from 'lucide-react';
import CampaignStageTracker from '@/components/campaigns/CampaignStageTracker';
import CampaignMetricsPanel from '@/components/campaigns/CampaignMetricsPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/ui/StatusBadge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useAuth } from '@/lib/AuthContext';
import { useAuditLog } from '@/hooks/useAuditLog';
import { GOALS } from '@/lib/constants';

export default function AdminCampaignDetail() {
  useRoleGuard(['admin', 'campaign_manager']);
  const auditLog = useAuditLog();
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [notes, setNotes] = useState('');
  const [metrics, setMetrics] = useState({ impressions: 0, reach: 0, clicks: 0, messages: 0, leads: 0 });
  const [saving, setSaving] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    loadCampaign();
  }, [id]);

  async function loadCampaign() {
    try {
      // Fix: fetch only this campaign by ID, not the full table
      const results = await base44.entities.Campaign.filter({ id });
      const c = results?.[0] || null;
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
    } catch (err) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
    }
  }

  const VALID_TRANSITIONS = {
    pending_review: ['approved', 'rejected', 'changes_requested'],
    approved: ['active', 'rejected'],
    active: ['paused', 'completed', 'refunded'],
    paused: ['active', 'completed', 'refunded'],
    completed: ['refunded'],
    changes_requested: ['pending_review', 'rejected'],
    rejected: ['refunded'],
  };

  async function updateStatus(status) {
    try {
      const allowed = VALID_TRANSITIONS[campaign.status] || [];
      if (!allowed.includes(status)) {
        toast.error(`Cannot transition from "${campaign.status}" to "${status}"`);
        return;
      }
      setSaving(true);
      await base44.entities.Campaign.update(id, { status, manager_notes: notes, assigned_manager: user?.id });
      auditLog(`campaign_${status.replace('_', '_')}`, 'Campaign', id,
        `Campaign "${campaign.page_name}" → ${status}. Notes: ${notes || 'none'}`);
  
      const notifMap = {
        approved: { type: 'campaign_approved', title: '🎉 Campaign Approved!', msg: `Your campaign for ${campaign.page_name} has been approved and will be launched shortly.` },
        active: { type: 'campaign_approved', title: '🚀 Campaign is Live!', msg: `Your campaign for ${campaign.page_name} is now active.` },
        rejected: { type: 'campaign_rejected', title: '❌ Campaign Rejected', msg: `Your campaign for ${campaign.page_name} was rejected. Reason: ${notes}` },
        changes_requested: { type: 'changes_requested', title: '⚠️ Changes Requested', msg: `Your campaign for ${campaign.page_name} needs changes: ${notes}` },
        completed: { type: 'campaign_completed', title: '✅ Campaign Completed', msg: `Your campaign for ${campaign.page_name} has been completed. View your final report.` },
        refunded: { type: 'payment_rejected', title: '↩ Campaign Refunded', msg: `Your campaign for ${campaign.page_name} has been refunded. ${notes || ''}` },
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
        // Email the client
        const clientUsers = await base44.entities.User.list({});
        const clientUser = clientUsers.find(u => u.id === campaign.user_id);
        if (clientUser?.email) {
          base44.integrations.Core.SendEmail({
            to: clientUser.email,
            from_name: 'Brandfletch Media',
            subject: notif.title.replace(/[^\w\s\-!]/g, '').trim(),
            body: `Hi ${clientUser.full_name || 'there'},\n\n${notif.msg}\n\nLog in to your dashboard to view your campaign details.\n\nhttps://brandfletchads.base44.app/campaigns/${id}\n\n— Brandfletch Media Team`,
          }).catch(() => {});
        }
      }
  
      toast.success(`Campaign ${status.replace('_', ' ')}`);
      loadCampaign();
      setSaving(false);
    } catch (err) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
    }
  }

  async function saveMetrics() {
    try {
      setSaving(true);
      await base44.entities.Campaign.update(id, metrics);
      auditLog('campaign_metrics_updated', 'Campaign', id, `Metrics updated: ${JSON.stringify(metrics)}`);
      toast.success('Metrics updated!');
      setSaving(false);
    } catch (err) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
    }
  }

  if (!campaign) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  const formatCost = () => {
    const localAmt = campaign.total_cost || 0;
    const currency = campaign.currency || 'USD';
    if (currency === 'USD') return `$${localAmt.toFixed(2)}`;
    return `${currency} ${localAmt.toLocaleString()}`;
  };



  const goalConfig = GOALS.find(g => g.value === campaign.goal);
  const allLocations = [
    ...(campaign.audience_countries || []),
    ...(campaign.audience_regions || []),
    ...(campaign.audience_cities || []),
  ];

  // Check if an uploaded asset is an image
  const isImage = (url) => /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url);

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/admin/campaigns" className="p-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold font-heading">{campaign.page_name || 'Campaign'}</h1>
            <StatusBadge status={campaign.status} />
          </div>
          <p className="text-sm text-muted-foreground capitalize">
            {campaign.package} · {campaign.duration} · {formatCost()}
          </p>
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
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => updateStatus('paused')} disabled={saving} variant="outline" className="gap-2">
            <Pause className="w-4 h-4" /> Pause
          </Button>
          <Button onClick={() => updateStatus('completed')} disabled={saving} className="gap-2 bg-[hsl(var(--primary))] text-primary-foreground">
            <CheckCircle className="w-4 h-4" /> Mark Completed
          </Button>
          <Button onClick={() => updateStatus('refunded')} disabled={saving} variant="outline" className="gap-2 border-orange-400 text-orange-700">
            <RefreshCw className="w-4 h-4" /> Refund
          </Button>
        </div>
      )}

      {campaign.status === 'paused' && (
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => updateStatus('active')} disabled={saving} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
            <Play className="w-4 h-4" /> Resume
          </Button>
          <Button onClick={() => updateStatus('completed')} disabled={saving} className="gap-2 bg-[hsl(var(--primary))] text-primary-foreground">
            <CheckCircle className="w-4 h-4" /> Mark Completed
          </Button>
          <Button onClick={() => updateStatus('refunded')} disabled={saving} variant="outline" className="gap-2 border-orange-400 text-orange-700">
            <RefreshCw className="w-4 h-4" /> Refund
          </Button>
        </div>
      )}

      {['active','completed','rejected'].includes(campaign.status) && (campaign.status !== 'active') && (
        <Button onClick={() => updateStatus('refunded')} disabled={saving} variant="outline" className="gap-2 border-orange-400 text-orange-700">
          <RefreshCw className="w-4 h-4" /> Issue Refund
        </Button>
      )}

      {/* Manager Notes */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Manager Notes</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes for the client or internal team..." rows={3} />
        </CardContent>
      </Card>

      {/* Metrics preview */}
      <CampaignMetricsPanel campaign={{ ...campaign, ...metrics }} />

      {/* Update Campaign Metrics */}
      {!['draft', 'awaiting_payment', 'rejected', 'refunded'].includes(campaign.status) && (
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">Update Campaign Metrics</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
              {Object.entries(metrics).map(([key, val]) => (
                <div key={key}>
                  <Label className="mb-1.5 block capitalize text-xs">{key.replace('_', ' ')}</Label>
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

      {/* Campaign Goal */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4" /> Campaign Goal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{goalConfig?.icon}</span>
            <span className="font-semibold text-sm">{goalConfig?.label || campaign.goal?.replace(/_/g, ' ') || '—'}</span>
          </div>

          {/* Messaging platforms */}
          {campaign.goal === 'messages' && campaign.messaging_platforms?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Messaging Platforms</p>
              <div className="flex gap-2 flex-wrap">
                {campaign.messaging_platforms.map(p => (
                  <Badge key={p} variant="secondary" className="capitalize">{p}</Badge>
                ))}
              </div>
            </div>
          )}

          {campaign.whatsapp_number && (
            <Row icon={<MessageSquare className="w-4 h-4 text-green-600" />} label="WhatsApp Number" value={campaign.whatsapp_number} />
          )}
          {campaign.phone_number && (
            <Row icon={<Phone className="w-4 h-4" />} label="Phone Number" value={campaign.phone_number} />
          )}
          {campaign.website_url && (
            <Row icon={<Globe className="w-4 h-4" />} label="Website URL">
              <a href={campaign.website_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-[hsl(var(--accent))] hover:underline flex items-center gap-1 break-all">
                {campaign.website_url} <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </Row>
          )}
          {campaign.post_url && (
            <Row icon={<Share2 className="w-4 h-4" />} label="Facebook Post URL">
              <a href={campaign.post_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-[hsl(var(--accent))] hover:underline flex items-center gap-1 break-all">
                {campaign.post_url} <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </Row>
          )}
        </CardContent>
      </Card>

      {/* Ad Creative — full detail */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileImage className="w-4 h-4" /> Ad Creative
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Creative type */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Type:</span>
            <Badge variant="outline" className="capitalize">
              {campaign.creative_type === 'upload' || campaign.creative_assets?.length > 0
                ? 'Upload (new ad)'
                : campaign.creative_type === 'link' || campaign.creative_link || campaign.post_url
                ? 'Existing post / link'
                : 'Custom creative'}
            </Badge>
          </div>

          {/* Link / Post URL in creative context */}
          {(campaign.creative_link) && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Creative Link</p>
              <a href={campaign.creative_link} target="_blank" rel="noopener noreferrer"
                className="text-sm font-medium text-[hsl(var(--accent))] hover:underline flex items-center gap-1 break-all">
                {campaign.creative_link} <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          )}

          {/* Ad description */}
          {campaign.description && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Ad Description / Copy</p>
              <div className="bg-secondary/40 rounded-lg p-3 text-sm whitespace-pre-wrap leading-relaxed">
                {campaign.description}
              </div>
            </div>
          )}

          {/* Uploaded assets with previews */}
          {campaign.creative_assets?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Uploaded Creative Files ({campaign.creative_assets.length})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {campaign.creative_assets.map((url, i) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-border bg-secondary/30">
                    {isImage(url) ? (
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={`Asset ${i + 1}`} className="w-full aspect-video object-cover hover:opacity-90 transition-opacity" />
                        <p className="text-xs text-center text-muted-foreground py-1.5">Asset {i + 1}</p>
                      </a>
                    ) : (
                      <a href={url} target="_blank" rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center gap-2 p-4 hover:bg-secondary transition-colors">
                        <FileImage className="w-6 h-6 text-muted-foreground" />
                        <span className="text-xs text-[hsl(var(--accent))] hover:underline">Asset {i + 1} — View file</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!campaign.description && !campaign.creative_assets?.length && !campaign.creative_link && !campaign.post_url && (
            <p className="text-sm text-muted-foreground italic">No creative details provided — our team will create this.</p>
          )}
        </CardContent>
      </Card>

      {/* Audience Targeting */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" /> Audience Targeting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Row icon={<MapPin className="w-4 h-4" />} label="Location">
            {allLocations.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {allLocations.map(loc => (
                  <Badge key={loc} variant="secondary" className="text-xs">{loc}</Badge>
                ))}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Not specified</span>
            )}
          </Row>
          <Row icon={<Users className="w-4 h-4" />} label="Age Range" value={`${campaign.audience_age_min || 18} – ${campaign.audience_age_max || 65} years`} />
          <Row icon={null} label="Gender" value={
            campaign.audience_gender === 'male' ? 'Men only'
            : campaign.audience_gender === 'female' ? 'Women only'
            : 'All genders'
          } />
        </CardContent>
      </Card>

      {/* Package & Budget */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4" /> Package & Budget
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { label: 'Facebook Page', value: campaign.page_name },
            { label: 'Package', value: campaign.package ? campaign.package.charAt(0).toUpperCase() + campaign.package.slice(1) : null },
            { label: 'Duration', value: campaign.duration ? campaign.duration.charAt(0).toUpperCase() + campaign.duration.slice(1) : null },
            { label: 'Country', value: campaign.country },
            { label: 'Currency', value: campaign.currency },
            { label: 'Total Cost', value: formatCost() },
            { label: 'Submitted', value: campaign.created_date ? format(new Date(campaign.created_date), 'MMM d, yyyy HH:mm') : null },
          ].filter(r => r.value).map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm py-1.5 border-b border-border last:border-0">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-right ml-4">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payment */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { label: 'Method', value: campaign.payment_method },
            { label: 'Reference', value: campaign.payment_reference },
            { label: 'Notes', value: campaign.payment_notes },
            { label: 'Verified By', value: campaign.payment_verified_by },
          ].filter(r => r.value).map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm py-1.5 border-b border-border last:border-0">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-right ml-4">{value}</span>
            </div>
          ))}
          {campaign.payment_proof_url && (
            <div className="flex justify-between text-sm py-1.5">
              <span className="text-muted-foreground">Payment Proof</span>
              <a href={campaign.payment_proof_url} target="_blank" rel="noopener noreferrer"
                className="text-[hsl(var(--accent))] hover:underline font-medium flex items-center gap-1">
                View File <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
          {!campaign.payment_method && !campaign.payment_reference && !campaign.payment_proof_url && (
            <p className="text-sm text-muted-foreground italic">No payment details yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Small helper row component
function Row({ icon, label, value, children }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {icon && <span className="mt-0.5 text-muted-foreground shrink-0">{icon}</span>}
      <div className="flex-1">
        <span className="text-muted-foreground">{label}: </span>
        {value && <span className="font-medium">{value}</span>}
        {children}
      </div>
    </div>
  );
}