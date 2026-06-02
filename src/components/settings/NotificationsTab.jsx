import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, Mail, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const NOTIFICATION_OPTIONS = [
  { key: 'notify_campaign_approved', label: 'Campaign Approved', description: 'When your campaign is approved and goes live.' },
  { key: 'notify_campaign_rejected', label: 'Campaign Rejected or Changes Requested', description: 'When your campaign needs attention or is rejected.' },
  { key: 'notify_payment_confirmed', label: 'Payment Confirmed', description: 'When your payment is verified by our team.' },
  { key: 'notify_campaign_completed', label: 'Campaign Completed', description: 'When a running campaign finishes.' },
  { key: 'notify_messages', label: 'New Messages', description: 'When your account manager sends you a message.' },
];

export default function NotificationsTab({ form, setForm }) {
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await base44.auth.updateMe({
      notify_campaign_approved: form.notify_campaign_approved,
      notify_campaign_rejected: form.notify_campaign_rejected,
      notify_payment_confirmed: form.notify_payment_confirmed,
      notify_campaign_completed: form.notify_campaign_completed,
      notify_messages: form.notify_messages,
    });
    toast.success('Notification preferences saved!');
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2 font-semibold">
            <Bell className="w-4 h-4 text-muted-foreground" /> In-App Notifications
          </CardTitle>
          <CardDescription>Choose which events trigger in-app notifications for your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          {NOTIFICATION_OPTIONS.map((opt, idx) => (
            <div key={opt.key}>
              <div className="flex items-center justify-between py-4">
                <div className="flex-1 pr-4">
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                </div>
                <Switch
                  checked={form[opt.key] !== false}
                  onCheckedChange={val => setForm(f => ({ ...f, [opt.key]: val }))}
                />
              </div>
              {idx < NOTIFICATION_OPTIONS.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="gap-2 w-full sm:w-auto">
        <Save className="w-4 h-4" />
        {saving ? 'Saving...' : 'Save Preferences'}
      </Button>
    </div>
  );
}