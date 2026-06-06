import { CheckCircle2, Circle, Clock } from 'lucide-react';

const TIMELINE = [
  { status: 'submitted', label: 'Submitted' },
  { status: 'under_review', label: 'Under Review' },
  { status: 'assigned', label: 'Assigned to Designer' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'awaiting_feedback', label: 'Awaiting Client Feedback' },
  { status: 'revision_requested', label: 'Revision Requested' },
  { status: 'approved', label: 'Approved' },
  { status: 'delivered', label: 'Delivered' },
  { status: 'completed', label: 'Completed' },
];

const STATUS_ORDER = TIMELINE.map(t => t.status);

export default function DesignStatusTimeline({ currentStatus }) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className="space-y-2">
      {TIMELINE.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isPending = i > currentIndex;
        return (
          <div key={step.status} className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {isDone ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : isCurrent ? (
                <Clock className="w-5 h-5 text-primary animate-pulse" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground/30" />
              )}
            </div>
            <div className={`text-sm ${isDone ? 'text-green-600 font-medium' : isCurrent ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
              {step.label}
              {isCurrent && <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Current</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}