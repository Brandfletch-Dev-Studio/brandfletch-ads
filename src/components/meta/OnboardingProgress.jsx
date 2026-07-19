/**
 * Onboarding Progress Tracker
 *
 * Visual stepper showing the 5 stages of Meta onboarding:
 * Payment → Connect Facebook → Verify Access → Campaign Creation → Live
 *
 * Each step has an icon, label, and state (complete | active | pending | error).
 * Responsive: horizontal on desktop, scrollable on mobile.
 */
import { Check, CreditCard, Facebook, ShieldCheck, Rocket, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 'payment',             label: 'Payment',            icon: CreditCard, short: 'Payment' },
  { id: 'connect_facebook',    label: 'Connect Facebook',  icon: Facebook,   short: 'Connect' },
  { id: 'verify_access',       label: 'Verify Access',      icon: ShieldCheck, short: 'Verify' },
  { id: 'campaign_creation',   label: 'Campaign Creation', icon: Rocket,     short: 'Create' },
  { id: 'live',                label: 'Live',               icon: Zap,        short: 'Live' },
];

const STEP_ORDER = STEPS.map(s => s.id);

export default function OnboardingProgress({ currentStep, status }) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const isError = status === 'error';

  return (
    <div className="w-full">
      {/* Desktop: horizontal stepper */}
      <div className="hidden sm:flex items-center justify-between gap-2">
        {STEPS.map((step, i) => {
          const isComplete = i < currentIndex;
          const isActive = i === currentIndex;
          const isPending = i > currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                    isComplete && 'bg-[hsl(var(--primary))] border-[hsl(var(--primary))] text-primary-foreground',
                    isActive && !isError && 'bg-[hsl(var(--primary))]/10 border-[hsl(var(--primary))] text-[hsl(var(--primary))]',
                    isActive && isError && 'bg-destructive/10 border-destructive text-destructive',
                    isPending && 'bg-muted border-border text-muted-foreground'
                  )}
                >
                  {isComplete ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={cn(
                  'text-xs font-medium text-center whitespace-nowrap',
                  isActive ? (isError ? 'text-destructive' : 'text-[hsl(var(--primary))]') : isComplete ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-2 rounded-full transition-all',
                  i < currentIndex ? 'bg-[hsl(var(--primary))]' : 'bg-border'
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: compact horizontal with short labels */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between gap-1">
          {STEPS.map((step, i) => {
            const isComplete = i < currentIndex;
            const isActive = i === currentIndex;
            const isPending = i > currentIndex;
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1 min-w-0">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                      isComplete && 'bg-[hsl(var(--primary))] border-[hsl(var(--primary))] text-primary-foreground',
                      isActive && !isError && 'bg-[hsl(var(--primary))]/10 border-[hsl(var(--primary))] text-[hsl(var(--primary))]',
                      isActive && isError && 'bg-destructive/10 border-destructive text-destructive',
                      isPending && 'bg-muted border-border text-muted-foreground'
                    )}
                  >
                    {isComplete ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  <span className={cn(
                    'text-[9px] font-medium text-center leading-tight',
                    isActive ? (isError ? 'text-destructive' : 'text-[hsl(var(--primary))]') : isComplete ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {step.short}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    'flex-1 h-0.5 mx-0.5 rounded-full transition-all',
                    i < currentIndex ? 'bg-[hsl(var(--primary))]' : 'bg-border'
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
