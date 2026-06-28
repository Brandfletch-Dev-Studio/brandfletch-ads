import { Check, Clock, X } from 'lucide-react';

const STAGES = [
  { key: 'pending_review', label: 'Under Review' },
  { key: 'approved',       label: 'Approved' },
  { key: 'active',         label: 'Running' },
  { key: 'completed',      label: 'Completed' },
];

const STATUS_ORDER = {
  pending_review: 0,
  approved: 1,
  active: 2,
  paused: 2,
  completed: 3,
};

export default function CampaignStageTracker({ status }) {
  if (['draft', 'awaiting_payment'].includes(status)) return null;

  const isTerminal = ['rejected', 'refunded', 'changes_requested'].includes(status);
  const currentIdx = STATUS_ORDER[status] ?? -1;

  if (isTerminal) {
    const colors = {
      rejected: 'bg-red-50 border-red-200 text-red-700',
      refunded: 'bg-orange-50 border-orange-200 text-orange-700',
      changes_requested: 'bg-purple-50 border-purple-200 text-purple-700',
    };
    const labels = {
      rejected: '❌ Campaign Rejected',
      refunded: '↩ Campaign Refunded',
      changes_requested: '⚠️ Changes Requested',
    };
    return (
      <div className={`p-3 rounded-xl border text-sm font-medium ${colors[status]}`}>
        {labels[status]}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0">
      {STAGES.map((stage, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const upcoming = i > currentIdx;

        return (
          <div key={stage.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                ${done    ? 'bg-green-500 border-green-500 text-white'    : ''}
                ${active  ? 'bg-[hsl(var(--primary))] border-[hsl(var(--primary))] text-white' : ''}
                ${upcoming? 'bg-background border-border text-muted-foreground' : ''}
              `}>
                {done    ? <Check className="w-4 h-4" /> :
                 active  ? (status === 'paused' ? <Clock className="w-3 h-3" /> : <div className="w-2 h-2 rounded-full bg-white" />) :
                           <div className="w-2 h-2 rounded-full bg-border" />}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap
                ${done    ? 'text-green-600' : ''}
                ${active  ? 'text-[hsl(var(--primary))]' : ''}
                ${upcoming? 'text-muted-foreground' : ''}
              `}>
                {stage.label}{active && status === 'paused' ? ' (Paused)' : ''}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-5 rounded-full transition-colors
                ${i < currentIdx ? 'bg-green-400' : 'bg-border'}
              `} />
            )}
          </div>
        );
      })}
    </div>
  );
}