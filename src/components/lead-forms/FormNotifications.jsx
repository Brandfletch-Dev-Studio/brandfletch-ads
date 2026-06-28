import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Mail } from 'lucide-react';

export default function FormNotifications({ formData, onChange }) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-green-600" />
          Notifications & Success
        </CardTitle>
        <CardDescription>Configure what happens after submission</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="success_message">Success Message</Label>
          <Textarea
            id="success_message"
            value={formData.success_message}
            onChange={(e) => onChange({ success_message: e.target.value })}
            placeholder="Thank you! Your submission has been received."
            rows={2}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="notification_email">Notification Email</Label>
            <Input
              id="notification_email"
              type="email"
              value={formData.notification_email}
              onChange={(e) => onChange({ notification_email: e.target.value })}
              placeholder="your@email.com"
            />
          </div>
          <div className="flex items-end">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.email_notifications}
                onCheckedChange={(checked) => onChange({ email_notifications: checked })}
              />
              <Label className="text-sm cursor-pointer">Enable Email Notifications</Label>
            </div>
          </div>
        </div>
        <div>
          <Label htmlFor="redirect_url">Redirect URL (Optional)</Label>
          <Input
            id="redirect_url"
            value={formData.redirect_url}
            onChange={(e) => onChange({ redirect_url: e.target.value })}
            placeholder="https://yoursite.com/thank-you"
          />
        </div>
      </CardContent>
    </Card>
  );
}