import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LinkIcon } from 'lucide-react';

export default function FormAdvanced({ formData, onChange }) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-orange-600" />
          Advanced Settings
        </CardTitle>
        <CardDescription>Webhook and integration settings</CardDescription>
      </CardHeader>
      <CardContent>
        <div>
          <Label htmlFor="webhook_url">Webhook URL (Optional)</Label>
          <Input
            id="webhook_url"
            value={formData.webhook_url}
            onChange={(e) => onChange({ webhook_url: e.target.value })}
            placeholder="https://your-api.com/webhook"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Form submissions will be sent to this URL via POST request
          </p>
        </div>
      </CardContent>
    </Card>
  );
}