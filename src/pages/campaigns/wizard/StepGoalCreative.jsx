import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GOALS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Upload, Link2, CheckCircle2, AlertCircle, ExternalLink, Phone, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

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

export default function StepGoalCreative({ data, update }) {
  const [uploading, setUploading] = useState(false);
  const [urlTouched, setUrlTouched] = useState(false);

  const goal = data.goal || '';
  const platforms = data.messaging_platforms || [];

  function selectGoal(value) {
    update({ goal: value, messaging_platforms: [], post_url: '', website_url: '', phone_number: '', whatsapp_number: '', creative_assets: [], creative_link: '', description: '' });
    setUrlTouched(false);
  }

  function togglePlatform(p) {
    const next = platforms.includes(p) ? platforms.filter(x => x !== p) : [...platforms, p];
    update({ messaging_platforms: next });
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    update({ creative_assets: [...(data.creative_assets || []), file_url] });
    toast.success('Asset uploaded!');
    setUploading(false);
  }

  function removeAsset(i) {
    const updated = [...(data.creative_assets || [])];
    updated.splice(i, 1);
    update({ creative_assets: updated });
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
      {/* Info banner */}
      <div className="flex items-start gap-3 mb-5 p-4 rounded-xl bg-[hsl(var(--accent))]/10 border border-[hsl(var(--accent))]/20">
        <AlertCircle className="w-5 h-5 text-[hsl(var(--accent))] mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-[hsl(var(--accent))]">This step is important</p>
          <p className="text-xs text-muted-foreground mt-0.5">Our team uses this information to set up your ad campaign.</p>
        </div>
      </div>

      {/* Goal selection */}
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

      {/* ── Goal-specific fields ── */}

      {/* MESSAGES — platform picker first, then number(s) */}
      {isMessages && (
        <div className="mb-5 space-y-4">
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

      {/* WEBSITE — URL input */}
      {isWebsite && (
        <div className="mb-5 p-4 rounded-xl border-2 border-[hsl(var(--primary))]/20 bg-[hsl(var(--primary))]/5">
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

      {/* PHONE CALLS — phone number */}
      {isPhone && (
        <div className="mb-5 p-4 rounded-xl border-2 border-[hsl(var(--primary))]/20 bg-[hsl(var(--primary))]/5">
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

      {/* BOOST POST — Facebook URL */}
      {isBoost && (
        <div className="mb-5 p-4 rounded-xl border-2 border-[hsl(var(--primary))]/20 bg-[hsl(var(--primary))]/5">
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

      {/* ── Ad Creative section (shown once a goal is selected) ── */}
      {goal && (
        <div className="mt-2 border-t border-border pt-5">
          <h3 className="text-base font-bold font-heading mb-0.5">Ad Creative</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {isBoost
              ? 'Our team will use your existing post. You can also upload additional assets below.'
              : 'Upload images/videos for us to create your ad, or share a link to existing creative.'}
          </p>

          {/* Description / brief */}
          {!isBoost && (
            <div className="mb-4">
              <Label className="font-semibold mb-1 block">Ad Description / Brief <span className="text-muted-foreground font-normal text-xs">(recommended)</span></Label>
              <Textarea
                value={data.description || ''}
                onChange={e => update({ description: e.target.value })}
                placeholder={
                  isMessages ? "e.g. We sell handmade African dresses, prices from MWK 15,000. Chat with us on WhatsApp..."
                  : isWebsite ? "e.g. Our new website sells organic honey. Highlight the health benefits and discount offer..."
                  : isPhone ? "e.g. We're a plumbing company in Lilongwe. Available 24/7 for emergency repairs..."
                  : "Describe what you want to advertise. Our team will write the ad copy."
                }
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">{(data.description || '').length} characters</p>
            </div>
          )}

          {/* Creative type toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => update({ creative_type: 'upload', creative_link: '' })}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-medium transition-all",
                data.creative_type !== 'link'
                  ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 text-[hsl(var(--primary))]"
                  : "border-border hover:bg-secondary/50"
              )}
            >
              <Upload className="w-4 h-4" /> Upload Images / Video
            </button>
            <button
              onClick={() => update({ creative_type: 'link', creative_assets: [] })}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-medium transition-all",
                data.creative_type === 'link'
                  ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 text-[hsl(var(--primary))]"
                  : "border-border hover:bg-secondary/50"
              )}
            >
              <Link2 className="w-4 h-4" /> Share a Link
            </button>
          </div>

          {/* Upload */}
          {data.creative_type !== 'link' && (
            <div>
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-secondary/40 transition-colors">
                <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                <span className="text-sm text-muted-foreground">{uploading ? 'Uploading...' : 'Click to upload image or video'}</span>
                <input type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
              {data.creative_assets?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.creative_assets.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border" />
                      <button onClick={() => removeAsset(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">No assets? No problem — our team can create your ad from your description above.</p>
            </div>
          )}

          {/* Link */}
          {data.creative_type === 'link' && (
            <div>
              <Label className="font-semibold mb-1 block">Link to existing creative <span className="text-destructive">*</span></Label>
              <Input
                value={data.creative_link || ''}
                onChange={e => update({ creative_link: e.target.value })}
                placeholder="https://drive.google.com/... or Canva link, Dropbox, etc."
                className="h-11"
              />
              <p className="text-xs text-muted-foreground mt-1">Share a Google Drive, Dropbox, or Canva link with your image/video.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}