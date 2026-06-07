import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, ChevronRight, X, Rocket } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const STEPS = [
  {
    id: 'profile',
    label: 'Complete your profile',
    description: 'Add your business name, phone, and country.',
    link: '/settings',
    linkLabel: 'Go to Settings',
    notifTitle: 'Profile setup started',
    notifMessage: 'A user has visited their profile setup step.',
  },
  {
    id: 'facebook_page',
    label: 'Connect a Facebook Page',
    description: 'Link your Facebook Business Page to run ads.',
    link: '/pages',
    linkLabel: 'Connect Page',
    notifTitle: 'Facebook page connection started',
    notifMessage: 'A user has started the Facebook page connection step.',
  },
  {
    id: 'first_campaign',
    label: 'Launch your first campaign',
    description: 'Create and submit a campaign for review.',
    link: '/campaigns/new',
    linkLabel: 'Create Campaign',
    notifTitle: 'First campaign started',
    notifMessage: 'A user has started creating their first campaign.',
  },
];

function getCompleted(user, pages, campaigns) {
  const done = new Set();
  if (user?.full_name && user?.business_name && user?.phone) done.add('profile');
  if (pages.some(p =>
    p.connection_status === 'connected' || p.connection_status === 'pending_verification'
  )) done.add('facebook_page');
  if (campaigns.length > 0) done.add('first_campaign');
  return done;
}

/**
 * Self-contained OnboardingChecklist — fetches its own data.
 * Accepts no required props; just drop it anywhere in the client layout.
 */
export default function OnboardingChecklist() {
  const { user } = useAuth();
  const [pages, setPages] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [notifying, setNotifying] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      base44.entities.FacebookPage.filter({ user_id: user.id }).catch(() => []),
      base44.entities.Campaign.filter({ user_id: user.id }, '-created_date', 10).catch(() => []),
    ]).then(([p, c]) => {
      setPages(p);
      setCampaigns(c);
      setReady(true);
    });
  }, [user?.id]);

  if (!ready || !user) return null;

  const completed = getCompleted(user, pages, campaigns);
  const allDone = STEPS.every(s => completed.has(s.id));

  if (dismissed || allDone) return null;

  async function handleStepClick(step) {
    if (notifying === step.id) return;
    setNotifying(step.id);
    try {
      const admins = await base44.entities.User.filter({ role: 'admin' }).catch(() => []);
      await Promise.all(admins.map(admin =>
        base44.entities.Notification.create({
          recipient_id: admin.id,
          recipient_role: 'admin',
          title: step.notifTitle,
          message: `${user?.full_name || user?.email || 'A user'} — ${step.notifMessage}`,
          type: 'page_connected',
          is_read: false,
        })
      ));
    } catch (err) {
      // Non-blocking
    } finally {
      setNotifying(null);
    }
  }

  const doneCount = STEPS.filter(s => completed.has(s.id)).length;

  return (
    <Card className="border-2 border-[hsl(var(--accent))]/25 bg-gradient-to-br from-[hsl(var(--accent))]/5 to-background shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[hsl(var(--accent))]/15 flex items-center justify-center flex-shrink-0">
              <Rocket className="w-5 h-5 text-[hsl(var(--accent))]" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Get started checklist</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{doneCount} of {STEPS.length} steps complete</p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground transition-colors mt-0.5 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="h-1.5 rounded-full bg-secondary mt-3 overflow-hidden">
          <div
            className="h-full bg-[hsl(var(--accent))] rounded-full transition-all duration-500"
            style={{ width: `${(doneCount / STEPS.length) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-1">
        {STEPS.map((step) => {
          const done = completed.has(step.id);
          return (
            <Link
              key={step.id}
              to={step.link}
              onClick={() => !done && handleStepClick(step)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                done
                  ? "opacity-60 cursor-default"
                  : "hover:bg-[hsl(var(--accent))]/10 cursor-pointer"
              )}
            >
              {done ? (
                <CheckCircle2 className="w-5 h-5 text-[hsl(var(--accent))] flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 group-hover:text-[hsl(var(--accent))] transition-colors" />
              )}
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium leading-tight", done && "line-through text-muted-foreground")}>
                  {step.label}
                </p>
                {!done && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{step.description}</p>
                )}
              </div>
              {!done && (
                <span className="text-xs font-medium text-[hsl(var(--accent))] flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {step.linkLabel} <ChevronRight className="w-3 h-3" />
                </span>
              )}
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
