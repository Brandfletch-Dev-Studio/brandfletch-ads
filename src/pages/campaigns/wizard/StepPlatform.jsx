/**
 * Step Platform — Platform Selection
 *
 * First step of the campaign wizard. User picks which ad platform to run on.
 * Meta Ads is available; Google Ads and TikTok Ads are labelled "Coming Soon".
 *
 * Props: { data, update }
 */
import { Check, Lock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Official brand logos (inline SVG) ──────────────────────────────

function MetaLogo({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      {/* Meta infinity-style logo */}
      <path d="M6 7.5c-2.5 0-4.5 2.2-4.5 5s2 5 4.5 5c1.3 0 2.4-.6 3.3-1.7.4-.5.7-1 .9-1.3.2-.3.6-.5 1-.5s.8.2 1 .5c.2.3.5.8.9 1.3C13.1 16.4 14.2 17 15.5 17c2.5 0 4.5-2.2 4.5-5s-2-5-4.5-5c-1.3 0-2.4.6-3.3 1.7-.4.5-.7 1-.9 1.3-.2.3-.6.5-1 .5s-.8-.2-1-.5c-.2-.3-.5-.8-.9-1.3C8.9 8.1 7.8 7.5 6 7.5zm0 2c.8 0 1.3.4 1.9 1.2.3.4.6.9.9 1.3.5.7 1.3 1.5 2.4 1.5s1.9-.8 2.4-1.5c.3-.4.6-.9.9-1.3.6-.8 1.1-1.2 1.9-1.2 1.5 0 2.7 1.3 2.7 3s-1.2 3-2.7 3c-.8 0-1.3-.4-1.9-1.2-.3-.4-.6-.9-.9-1.3-.5-.7-1.3-1.5-2.4-1.5s-1.9.8-2.4 1.5c-.3.4-.6.9-.9 1.3-.6.8-1.1 1.2-1.9 1.2-1.5 0-2.7-1.3-2.7-3s1.2-3 2.7-3z"/>
    </svg>
  );
}

function GoogleAdsLogo({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      {/* Google Ads "A" shape with brand colors */}
      <path d="M12 3L3 20.5h3.5L12 8l5.5 12.5H21L12 3z" fill="#4285F4"/>
      <path d="M12 3L9.5 8.5l2.5 5 2.5-5L12 3z" fill="#34A853"/>
      <path d="M9.5 8.5L7.5 13l3 6.5 1.5-5.5-2.5-5.5z" fill="#FBBC04"/>
      <path d="M14.5 8.5L12 13.5l1.5 6 3-6.5-2-4.5z" fill="#EA4335"/>
    </svg>
  );
}

function TikTokLogo({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      {/* TikTok note logo */}
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43V8.66a8.16 8.16 0 0 0 4.77 1.52V6.69h-1.04z"/>
    </svg>
  );
}

// ── Platform cards config ──────────────────────────────────────────

const PLATFORMS = [
  {
    id: 'meta',
    name: 'Meta Ads',
    description: 'Facebook & Instagram advertising',
    Logo: MetaLogo,
    logoClass: 'text-blue-600',
    logoBg: 'bg-blue-50 dark:bg-blue-950/30',
    available: true,
    badge: null,
  },
  {
    id: 'google',
    name: 'Google Ads',
    description: 'Search, Display & YouTube advertising',
    Logo: GoogleAdsLogo,
    logoClass: '',
    logoBg: 'bg-gray-50 dark:bg-gray-900/30',
    available: false,
    badge: 'Coming Soon',
  },
  {
    id: 'tiktok',
    name: 'TikTok Ads',
    description: 'Short-form video advertising',
    Logo: TikTokLogo,
    logoClass: 'text-black dark:text-white',
    logoBg: 'bg-gray-50 dark:bg-gray-900/30',
    available: false,
    badge: 'Coming Soon',
  },
];

export default function StepPlatform({ data, update }) {
  const selected = data.platform || 'meta';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-heading">Choose your platform</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select where you'd like to run your ad campaign.
        </p>
      </div>

      <div className="space-y-3">
        {PLATFORMS.map(platform => {
          const isSelected = selected === platform.id;
          const { Logo } = platform;

          return (
            <button
              key={platform.id}
              disabled={!platform.available}
              onClick={() => platform.available && update({ platform: platform.id })}
              className={cn(
                'w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left',
                platform.available
                  ? isSelected
                    ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 cursor-pointer'
                    : 'border-border hover:border-[hsl(var(--primary))]/40 cursor-pointer'
                  : 'border-border opacity-60 cursor-not-allowed'
              )}
            >
              {/* Logo */}
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                platform.logoBg,
              )}>
                <Logo className={cn('w-7 h-7', platform.logoClass)} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{platform.name}</p>
                  {platform.badge && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                      <Lock className="w-2.5 h-2.5" />
                      {platform.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {platform.description}
                </p>
              </div>

              {/* Selected indicator */}
              {platform.available && (
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all',
                  isSelected
                    ? 'bg-[hsl(var(--primary))] text-primary-foreground'
                    : 'border-2 border-border'
                )}>
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground pt-2">
        <ArrowRight className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[hsl(var(--primary))]" />
        <p>
          More platforms coming soon. Meta Ads includes Facebook and Instagram campaigns
          managed by Brandfletch's team.
        </p>
      </div>
    </div>
  );
}
