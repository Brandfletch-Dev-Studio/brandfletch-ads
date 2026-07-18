/**
 * Onboarding Progress Tracker
 *
 * Visual stepper showing the 5 stages of Meta onboarding:
 * Payment → Connect Facebook → Verify Access → Campaign Creation → Live
 *
 * Each step has an icon, label, and state (complete | active | pending | error).
 */
import { Check, CreditCard, Facebook, ShieldCheck, Rocket, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 'payment',             label: 'Payment',            icon: CreditCard },
  { id: 'connect_facebook',     label: 'Connect Facebook',  icon: Facebook },
  { id: 'verify_access',       label: 'Verify Access',      icon: ShieldCheck },
  { id: 'campaign_creation',   label: 'Campaign Creation', icon: Rocket },
  { id: 'live',                label: 'Live',               icon: Zap },
];

const STEP_ORDER = STEPS.map(s => s.id);

export default function OnboardingProgress({ currentStep, status }) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const isError = status === 'error';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-1 sm:gap-2">
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
                    'w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all',
                    isComplete && 'bg-[hsl(var(--primary))] border-[hsl(var(--primary))] text-primary-foreground',
                    isActive && !isError && 'bg-[hsl(var(--primary))]/10 border-[hsl(var(--primary))] text-[hsl(var(--primary))]',
                    isActive && isError && 'bg-destructive/10 border-destructive text-destructive',
                    isPending && 'bg-muted border-border text-muted-foreground'
                  )}
                >
                  {isComplete ? (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </div>
                <span className={cn(
                  'text-[10px] sm:text-xs font-medium text-center whitespace-nowrap',
                  isActive ? (isError ? 'text-destructive' : 'text-[hsl(var(--primary))]') : isComplete ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-1 sm:mx-2 rounded-full transition-all',
                  i < currentIndex ? 'bg-[hsl(var(--primary))]' : 'bg-border'
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
