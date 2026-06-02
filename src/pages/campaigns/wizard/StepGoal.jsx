import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GOALS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Link2, CheckCircle2, AlertCircle, ExternalLink, Phone } from 'lucide-react';

function isValidUrl(url) {
  try { new URL(url); return true; } catch { return false; }
}
function isFacebookUrl(url) {
  return /^https?:\/\/(www\.)?(facebook\.com|fb\.com|fb\.watch)\//i.test(url.trim());
}

const MESSAGING_PLATFORMS = [
  { value: 'whatsapp', label: 'WhatsApp', icon: '💬', color: 'border-green-400 bg-green-50 text-green-800' },
  { value: 'messenger', label: 'Messenger', icon: '📨', color: 'border-blue-400 bg-blue-50 text-blue-800' },
];

export default function StepGoal({ data, update }) {
  const [urlTouched, setUrlTouched] = useState(false);

  const goal = data.goal || '';
  const platforms = data.messaging_platforms || [];

  function selectGoal(value) {
    update({ goal: value, messaging_platforms: [], post_url: '', website_url: '', phone_number: '', whatsapp_number: '' });
    setUrlTouched(false);
  }

  function togglePlatform(p) {
    const next = platforms.includes(p) ? platforms.filter(x => x !== p) : [...platforms, p];
    update({ messaging_platforms: next });
  }

  const isMessages = goal === 'messages';
  const isWebsite = goal === 'website_traffic';
  const isPhone = goal === 'phone_calls';
  const isBoost = goal === 'boost_post';

  const webUrl = data.website_url || '';
  const webUrlValid = webUrl ? isValidUrl(webUrl) : false;
  const postUrl = data.post_url || '';
  const postUrlValid = postUrl ? isFacebookUrl(postUrl) : false;

  return (
    <div>
      <h2 className="text-xl font-bold font-heading mb-1">What's your campaign goal?</h2>
      <p className="text-muted-foreground text-sm mb-4">Choose what you want to achieve with this campaign.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {GOALS.map(g => (
          <button
            key={g.value}
            onClick={() => selectGoal(g.value)}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all",
              goal === g.value
                ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5"
                : "border-border hover:border-[hsl(var(--primary))]/40 hover:bg-secondary/50"
            )}
          >
            <span className="text-2xl">{g.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold leading-tight">{g.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{g.desc}</p>
            </div>
            {goal === g.value && <CheckCircle2 className="w-5 h-5 text-[hsl(var(--primary))] flex-shrink-0" />}
          </button>
        ))}
      </div>

      {/* MESSAGES */}
      {isMessages && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold mb-2">Which platform(s)? <span className="text-destructive">*</span></p>
            <div className="flex gap-3">
              {MESSAGING_PLATFORMS.map(mp => (
                <button
                  key={mp.value}
                  onClick={() => togglePlatform(mp.value)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-medium text-sm transition-all",
                    platforms.includes(mp.value)
                      ? mp.color + " border-current"
                      : "border-border hover:bg-secondary/50"
                  )}
                >
                  <span>{mp.icon}</span> {mp.label}
                  {platforms.includes(mp.value) && <CheckCircle2 className="w-4 h-4 ml-1" />}
                </button>
              ))}
            </div>
          </div>
          {platforms.includes('whatsapp') && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <Label className="font-semibold text-green-800 mb-1 block">WhatsApp Business Number <span className="text-destructive">*</span></Label>
              <Input
                value={data.whatsapp_number || ''}
                onChange={e => update({ whatsapp_number: e.target.value })}
                placeholder="+265 999 000 000"
                className="bg-white border-green-300"
              />
              <p className="text-xs text-green-700 mt-1">Include country code (e.g. +265 for Malawi)</p>
            </div>
          )}
        </div>
      )}

      {/* WEBSITE */}
      {isWebsite && (
        <div className="p-4 rounded-xl border-2 border-[hsl(var(--primary))]/20 bg-[hsl(var(--primary))]/5">
          <Label className="flex items-center gap-1.5 mb-1 font-semibold">
            <Link2 className="w-3.5 h-3.5" /> Website URL <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              value={webUrl}
              onChange={e => { update({ website_url: e.target.value }); setUrlTouched(true); }}
              onBlur={() => setUrlTouched(true)}
              placeholder="https://yourwebsite.com"
              className={cn("pr-10 h-11", urlTouched && webUrl && !webUrlValid && "border-destructive", webUrlValid && "border-green-500")}
            />
            {webUrlValid && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />}
            {urlTouched && webUrl && !webUrlValid && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />}
          </div>
          {urlTouched && webUrl && !webUrlValid && <p className="text-xs text-destructive mt-1.5">Please enter a valid URL starting with https://</p>}
        </div>
      )}

      {/* PHONE CALLS */}
      {isPhone && (
        <div className="p-4 rounded-xl border-2 border-[hsl(var(--primary))]/20 bg-[hsl(var(--primary))]/5">
          <Label className="flex items-center gap-1.5 mb-1 font-semibold">
            <Phone className="w-3.5 h-3.5" /> Business Phone Number <span className="text-destructive">*</span>
          </Label>
          <Input
            value={data.phone_number || ''}
            onChange={e => update({ phone_number: e.target.value })}
            placeholder="+265 999 000 000"
            className="h-11"
          />
          <p className="text-xs text-muted-foreground mt-1">Include country code — this is the number people will call.</p>
        </div>
      )}

      {/* BOOST POST */}
      {isBoost && (
        <div className="p-4 rounded-xl border-2 border-[hsl(var(--primary))]/20 bg-[hsl(var(--primary))]/5">
          <Label className="flex items-center gap-1.5 mb-1 font-semibold">
            <Link2 className="w-3.5 h-3.5" /> Facebook Post URL <span className="text-destructive">*</span>
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            Open the post on your Page → click three dots → <strong>Copy link</strong> → paste below.
          </p>
          <div className="relative">
            <Input
              value={postUrl}
              onChange={e => { update({ post_url: e.target.value }); setUrlTouched(true); }}
              onBlur={() => setUrlTouched(true)}
              placeholder="https://facebook.com/yourpage/posts/..."
              className={cn("pr-10 h-11", urlTouched && postUrl && !postUrlValid && "border-destructive", postUrlValid && "border-green-500")}
            />
            {postUrlValid && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />}
            {urlTouched && postUrl && !postUrlValid && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />}
          </div>
          {urlTouched && postUrl && !postUrlValid && <p className="text-xs text-destructive mt-1.5">Must be a valid Facebook URL</p>}
          <a href="https://facebook.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[hsl(var(--accent))] mt-2 hover:underline">
            <ExternalLink className="w-3 h-3" /> Open Facebook
          </a>
        </div>
      )}
    </div>
  );
}