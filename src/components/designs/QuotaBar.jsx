import { Card, CardContent } from '@/components/ui/card';
import { Palette, Calendar } from 'lucide-react';

export default function QuotaBar({ subscription }) {
  const quota = subscription?.monthly_quota || 0;
  const used = subscription?.quota_used || 0;
  const remaining = Math.max(0, quota - used);
  const pct = quota > 0 ? Math.round((used / quota) * 100) : 0;
  const resetDate = subscription?.quota_reset_date
    ? new Date(subscription.quota_reset_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-purple-600';

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Palette className="w-4 h-4 text-purple-700" />
            </div>
            <div>
              <p className="text-sm font-semibold">Design Retainer Plan</p>
              <p className="text-xs text-muted-foreground">Active subscription</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-purple-700">{remaining}</p>
            <p className="text-xs text-muted-foreground">credits left</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3 text-center">
          <div className="bg-white/60 rounded-lg p-2">
            <p className="text-lg font-bold">{quota}</p>
            <p className="text-xs text-muted-foreground">Total Quota</p>
          </div>
          <div className="bg-white/60 rounded-lg p-2">
            <p className="text-lg font-bold text-purple-700">{used}</p>
            <p className="text-xs text-muted-foreground">Used</p>
          </div>
          <div className="bg-white/60 rounded-lg p-2">
            <p className="text-lg font-bold text-green-600">{remaining}</p>
            <p className="text-xs text-muted-foreground">Remaining</p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{used} of {quota} requests used</span>
            <span>{pct}%</span>
          </div>
          <div className="w-full bg-purple-200 rounded-full h-2">
            <div className={`${barColor} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
          </div>
          {resetDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Calendar className="w-3 h-3" />
              <span>Quota resets on {resetDate}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}