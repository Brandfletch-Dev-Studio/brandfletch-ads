import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OBJECTIVES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

export default function StepObjective({ data, update }) {
  return (
    <div>
      <h2 className="text-xl font-bold font-heading mb-1">Campaign Objective</h2>
      <p className="text-muted-foreground text-sm mb-6">What's the main goal of your campaign?</p>

      <div className="space-y-3 mb-6">
        {OBJECTIVES.map(obj => (
          <button
            key={obj.value}
            onClick={() => update({ objective: obj.value })}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
              data.objective === obj.value
                ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5"
                : "border-border hover:border-[hsl(var(--primary))]/40 hover:bg-secondary/50"
            )}
          >
            <span className="text-2xl">{obj.icon}</span>
            <div className="flex-1">
              <p className="font-semibold text-sm">{obj.label}</p>
              <p className="text-xs text-muted-foreground">{obj.desc}</p>
            </div>
            {data.objective === obj.value && (
              <CheckCircle2 className="w-5 h-5 text-[hsl(var(--primary))] flex-shrink-0" />
            )}
          </button>
        ))}
      </div>

      {data.objective === 'whatsapp_messages' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
          <Label className="font-semibold text-green-800 mb-2 block">WhatsApp Business Number *</Label>
          <Input
            value={data.whatsapp_number}
            onChange={e => update({ whatsapp_number: e.target.value })}
            placeholder="+265 999 000 000"
            className="bg-white border-green-300"
          />
          <p className="text-xs text-green-700 mt-1.5">Include country code (e.g. +265 for Malawi)</p>
        </div>
      )}
    </div>
  );
}