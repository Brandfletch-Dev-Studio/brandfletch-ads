import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tag } from 'lucide-react';

export default function StepName({ data, update }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-heading mb-1">Name Your Campaign</h2>
        <p className="text-muted-foreground text-sm">Give your campaign a name to identify it easily.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="campaign-name">Campaign Name</Label>
        <div className="relative">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="campaign-name"
            className="pl-9"
            placeholder="e.g. June Sales Promo, New Product Launch..."
            value={data.campaign_name || ''}
            onChange={e => update({ campaign_name: e.target.value })}
            autoFocus
            maxLength={80}
          />
        </div>
        {data.campaign_name && (
          <p className="text-xs text-muted-foreground text-right">{data.campaign_name.length}/80</p>
        )}
      </div>
    </div>
  );
}