import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PROMOTE_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Upload, Link, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

function isFacebookUrl(url) {
  return /^https?:\/\/(www\.)?(facebook\.com|fb\.com|fb\.watch)\//i.test(url.trim());
}

function isValidUrl(url) {
  try { new URL(url); return true; } catch { return false; }
}

export default function StepPromote({ data, update }) {
  const [uploading, setUploading] = useState(false);
  const [urlTouched, setUrlTouched] = useState(false);

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

  const needsFbUrl = data.promote_type === 'boost_post';
  const needsWebUrl = data.promote_type === 'website_traffic';
  const needsDescription = ['product', 'service', 'whatsapp_messages', 'messenger_messages'].includes(data.promote_type);

  const urlValue = data.post_url || '';
  const fbUrlValid = needsFbUrl ? isFacebookUrl(urlValue) : true;
  const webUrlValid = needsWebUrl ? isValidUrl(urlValue) : true;
  const urlValid = fbUrlValid && webUrlValid;
  const showUrlError = urlTouched && urlValue && !urlValid;
  const showUrlSuccess = urlValue && urlValid;

  return (
    <div>
      <div className="flex items-start gap-3 mb-5 p-4 rounded-xl bg-[hsl(var(--accent))]/10 border border-[hsl(var(--accent))]/20">
        <AlertCircle className="w-5 h-5 text-[hsl(var(--accent))] mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-[hsl(var(--accent))]">This step is important</p>
          <p className="text-xs text-muted-foreground mt-0.5">The information you provide here is used directly by our team to set up your ad. Be as specific as possible.</p>
        </div>
      </div>

      <h2 className="text-xl font-bold font-heading mb-1">What would you like us to promote?</h2>
      <p className="text-muted-foreground text-sm mb-5">Choose the type of promotion for your campaign.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {PROMOTE_TYPES.map(pt => (
          <button
            key={pt.value}
            onClick={() => { update({ promote_type: pt.value, post_url: '' }); setUrlTouched(false); }}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all",
              data.promote_type === pt.value
                ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5"
                : "border-border hover:border-[hsl(var(--primary))]/40 hover:bg-secondary/50"
            )}
          >
            <span className="text-2xl">{pt.icon}</span>
            <div>
              <p className="text-sm font-semibold leading-tight">{pt.label}</p>
              {pt.desc && <p className="text-xs text-muted-foreground mt-0.5">{pt.desc}</p>}
            </div>
          </button>
        ))}
      </div>

      {/* Facebook Post URL */}
      {needsFbUrl && (
        <div className="mb-5 p-4 rounded-xl border-2 border-[hsl(var(--primary))]/20 bg-[hsl(var(--primary))]/5">
          <Label className="flex items-center gap-1.5 mb-1 font-semibold">
            <Link className="w-3.5 h-3.5" /> Facebook Post URL <span className="text-destructive">*</span>
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            Go to your Facebook Page, open the post you want to boost, click the three dots → <strong>Copy link</strong>, and paste it below.
          </p>
          <div className="relative">
            <Input
              value={urlValue}
              onChange={e => { update({ post_url: e.target.value }); setUrlTouched(true); }}
              onBlur={() => setUrlTouched(true)}
              placeholder="https://facebook.com/yourpage/posts/..."
              className={cn("pr-10 h-11", showUrlError && "border-destructive focus-visible:ring-destructive", showUrlSuccess && "border-green-500 focus-visible:ring-green-500")}
            />
            {showUrlSuccess && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />}
            {showUrlError && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />}
          </div>
          {showUrlError && (
            <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Must be a valid Facebook URL (facebook.com, fb.com or fb.watch)
            </p>
          )}
          {showUrlSuccess && (
            <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Valid Facebook URL
            </p>
          )}
          <a href="https://facebook.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[hsl(var(--accent))] mt-2 hover:underline">
            <ExternalLink className="w-3 h-3" /> Open Facebook to find your post
          </a>
        </div>
      )}

      {/* Website URL */}
      {needsWebUrl && (
        <div className="mb-5 p-4 rounded-xl border-2 border-[hsl(var(--primary))]/20 bg-[hsl(var(--primary))]/5">
          <Label className="flex items-center gap-1.5 mb-1 font-semibold">
            <Link className="w-3.5 h-3.5" /> Website URL <span className="text-destructive">*</span>
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            Enter the full URL of the page you want to drive traffic to (e.g. your homepage, product page, or landing page).
          </p>
          <div className="relative">
            <Input
              value={urlValue}
              onChange={e => { update({ post_url: e.target.value }); setUrlTouched(true); }}
              onBlur={() => setUrlTouched(true)}
              placeholder="https://yourwebsite.com/product"
              className={cn("pr-10 h-11", showUrlError && "border-destructive focus-visible:ring-destructive", showUrlSuccess && "border-green-500 focus-visible:ring-green-500")}
            />
            {showUrlSuccess && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />}
            {showUrlError && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />}
          </div>
          {showUrlError && (
            <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Please enter a valid URL starting with https://
            </p>
          )}
          {showUrlSuccess && (
            <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Valid URL
            </p>
          )}
        </div>
      )}

      {/* Description */}
      {needsDescription && (
        <div className="mb-5 p-4 rounded-xl border-2 border-[hsl(var(--primary))]/20 bg-[hsl(var(--primary))]/5">
          <Label className="mb-1 font-semibold block">
            Describe your {data.promote_type === 'product' ? 'product' : data.promote_type === 'service' ? 'service' : 'promotion'} <span className="text-destructive">*</span>
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            Our team uses this to write your ad copy. Be specific — include key benefits, offers, and what makes you stand out.
          </p>
          <Textarea
            value={data.description}
            onChange={e => update({ description: e.target.value })}
            placeholder="e.g. We sell handmade African print dresses. Prices from MWK 15,000. Free delivery in Lilongwe. WhatsApp us to order..."
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1.5">{(data.description || '').length} characters — aim for at least 50</p>
        </div>
      )}

      {/* Creative Assets */}
      <div>
        <Label className="flex items-center gap-1.5 mb-1 font-semibold">
          <Upload className="w-3.5 h-3.5" /> Upload Creative Assets
          <span className="text-xs font-normal text-muted-foreground ml-1">(optional but recommended)</span>
        </Label>
        <p className="text-xs text-muted-foreground mb-2">Upload images or videos you want used in your ad. If none, our team will create visuals for you.</p>
        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-secondary/40 transition-colors">
          <Upload className="w-5 h-5 text-muted-foreground mb-1" />
          <span className="text-sm text-muted-foreground">{uploading ? 'Uploading...' : 'Click to upload image or video'}</span>
          <input type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
        {data.creative_assets?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {data.creative_assets.map((url, i) => (
              <div key={i} className="relative group">
                <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border" />
                <button
                  onClick={() => removeAsset(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}