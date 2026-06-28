import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Mail, Pencil, X, Check, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULTS = {
  pending_review:    { subject: 'Campaign Submitted — Pending Review',          heading: 'Campaign Submitted',              body_text: 'We\'ve received your campaign and it\'s now in our review queue. Our team verifies and launches campaigns within 1–2 hours. We\'ll notify you as soon as there\'s an update.', cta_label: 'View Campaign' },
  approved:          { subject: 'Your Campaign Has Been Approved',               heading: 'Campaign Approved! 🎉',            body_text: 'Great news — your campaign has been approved by our team and will begin running shortly. Keep an eye on your dashboard for live performance updates.', cta_label: 'View Campaign' },
  active:            { subject: 'Your Campaign Is Now Live',                     heading: 'Your Campaign Is Live 🚀',         body_text: 'Your campaign is now live and your ads are reaching your target audience. Performance data will begin accumulating — check your dashboard to track results in real time.', cta_label: 'View Performance' },
  completed:         { subject: 'Campaign Completed — View Your Results',        heading: 'Campaign Completed',              body_text: 'Your campaign has completed its full run. Here\'s a summary of your results below.', cta_label: 'View Full Report' },
  rejected:          { subject: 'Campaign Could Not Be Approved',               heading: 'Campaign Requires Changes',        body_text: 'After reviewing your campaign, our team was unable to approve it. Please review the feedback below and make the necessary adjustments.', cta_label: 'Edit Campaign' },
  changes_requested: { subject: 'Changes Requested for Your Campaign',          heading: 'Changes Requested',               body_text: 'We\'ve reviewed your campaign and would like to request some adjustments before we can proceed.', cta_label: 'Update Campaign' },
  refunded:          { subject: 'Refund Processed for Your Campaign',           heading: 'Refund Processed',                body_text: 'A refund has been issued for your campaign. Please allow a few business days for the funds to reflect depending on your payment method.', cta_label: 'View Campaign' },
  awaiting_payment:  { subject: 'Complete Your Payment to Launch Your Campaign', heading: 'Complete Your Payment',           body_text: 'Your campaign is configured and ready to go! Complete your payment to submit it for review and get your ads running.', cta_label: 'Complete Payment' },
  payment_submitted: { subject: 'Payment Proof Received — Pending Verification', heading: 'Payment Proof Received',          body_text: 'We\'ve received your payment proof. Our team verifies payments within 1–2 hours and will notify you once confirmed.', cta_label: 'View Campaign' },
  payment_confirmed: { subject: 'Payment Confirmed',                            heading: 'Payment Confirmed ✓',             body_text: 'We\'ve confirmed your payment and your campaign is now submitted for review. You\'ll receive another notification once the review is complete.', cta_label: 'View Campaign' },
  payment_rejected:  { subject: 'Payment Could Not Be Verified',                heading: 'Payment Could Not Be Verified',   body_text: 'We were unable to verify your payment. Please resubmit your payment proof or contact support for assistance.', cta_label: 'Resubmit Payment' },
};

const EVENT_LABELS = {
  pending_review: 'Campaign Submitted',
  approved: 'Campaign Approved',
  active: 'Campaign Active / Live',
  completed: 'Campaign Completed',
  rejected: 'Campaign Rejected',
  changes_requested: 'Changes Requested',
  refunded: 'Campaign Refunded',
  awaiting_payment: 'Awaiting Payment',
  payment_submitted: 'Payment Proof Submitted',
  payment_confirmed: 'Payment Confirmed',
  payment_rejected: 'Payment Rejected',
};

export default function EmailTemplatesTab() {
  const [templates, setTemplates] = useState({});
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.EmailTemplate.list({}).then(list => {
      const map = {};
      list.forEach(t => { map[t.event_type] = t; });
      setTemplates(map);
    });
  }, []);

  function startEdit(eventType) {
    const existing = templates[eventType];
    setEditing(eventType);
    setEditData(existing ? { ...existing } : { event_type: eventType, is_active: true, ...DEFAULTS[eventType] });
  }

  async function saveTemplate() {
    try {
          setSaving(true);
          const existing = templates[editing];
          let saved;
          if (existing) {
            saved = await base44.entities.EmailTemplate.update(existing.id, editData);
          } else {
            saved = await base44.entities.EmailTemplate.create({ ...editData, event_type: editing });
          }
          setTemplates(t => ({ ...t, [editing]: saved }));
          setEditing(null);
          toast.success('Template saved!', { duration: 1500 });
          setSaving(false);
    } catch (err) {
      toast.error(err?.message || "Something went wrong. Please try again.");
    }
  }

  async function resetToDefault(eventType) {
    try {
          const existing = templates[eventType];
          const data = { event_type: eventType, is_active: true, ...DEFAULTS[eventType] };
          let saved;
          if (existing) {
            saved = await base44.entities.EmailTemplate.update(existing.id, data);
          } else {
            saved = await base44.entities.EmailTemplate.create(data);
          }
          setTemplates(t => ({ ...t, [eventType]: saved }));
          toast.success('Reset to default', { duration: 1500 });
    } catch (err) {
      toast.error(err?.message || "Something went wrong. Please try again.");
    }
  }

  async function toggleActive(eventType, is_active) {
    try {
          const existing = templates[eventType];
          if (existing) {
            await base44.entities.EmailTemplate.update(existing.id, { is_active });
            setTemplates(t => ({ ...t, [eventType]: { ...existing, is_active } }));
          }
    } catch (err) {
      toast.error(err?.message || "Something went wrong. Please try again.");
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Mail className="w-4 h-4" /> Email Templates
        </CardTitle>
        <p className="text-sm text-muted-foreground">Customize the subject, heading, and body text for each automated email. Use <code className="bg-secondary px-1 rounded text-xs">{'{{name}}'}</code>, <code className="bg-secondary px-1 rounded text-xs">{'{{campaign_name}}'}</code>, <code className="bg-secondary px-1 rounded text-xs">{'{{amount}}'}</code>, <code className="bg-secondary px-1 rounded text-xs">{'{{notes}}'}</code> as placeholders.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.keys(DEFAULTS).map(eventType => {
          const stored = templates[eventType];
          const display = stored || DEFAULTS[eventType];
          const isEditing = editing === eventType;

          return (
            <div key={eventType} className="border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-secondary/30">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-semibold">{EVENT_LABELS[eventType]}</span>
                  {stored && (
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">customized</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {stored && (
                    <Switch
                      checked={stored.is_active !== false}
                      onCheckedChange={v => toggleActive(eventType, v)}
                    />
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => isEditing ? setEditing(null) : startEdit(eventType)}>
                    {isEditing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" title="Reset to default" onClick={() => resetToDefault(eventType)}>
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {!isEditing && (
                <div className="px-4 py-3 space-y-1">
                  <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Subject:</span> {display.subject}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2"><span className="font-medium text-foreground">Body:</span> {display.body_text}</p>
                </div>
              )}

              {isEditing && (
                <div className="px-4 py-4 space-y-3 bg-background">
                  <div>
                    <Label className="text-xs mb-1 block">Subject Line</Label>
                    <Input value={editData.subject || ''} onChange={e => setEditData(d => ({ ...d, subject: e.target.value }))} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Email Heading</Label>
                    <Input value={editData.heading || ''} onChange={e => setEditData(d => ({ ...d, heading: e.target.value }))} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Body Text</Label>
                    <Textarea value={editData.body_text || ''} onChange={e => setEditData(d => ({ ...d, body_text: e.target.value }))} className="text-sm min-h-[80px] resize-none" />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">CTA Button Label</Label>
                    <Input value={editData.cta_label || ''} onChange={e => setEditData(d => ({ ...d, cta_label: e.target.value }))} className="h-8 text-sm" placeholder="e.g. View Campaign" />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="gap-1 h-8" onClick={saveTemplate} disabled={saving}>
                      <Check className="w-3 h-3" /> {saving ? 'Saving...' : 'Save Template'}
                    </Button>
                    <Button size="sm" variant="outline" className="h-8" onClick={() => setEditing(null)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}