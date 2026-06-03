import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Upload, X, FileImage, CheckCircle2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

function isFacebookUrl(url) {
  return /^https?:\/\/(www\.)?(facebook\.com|fb\.com|fb\.watch)\//i.test((url || '').trim());
}

export default function StepCreative({ data, update }) {
  const [uploading, setUploading] = useState(false);
  const [urlTouched, setUrlTouched] = useState(false);

  // creative_type: 'existing_post' | 'new_creative'
  const creativeType = data.creative_type || 'existing_post';
  const postUrl = data.post_url || '';
  const postUrlValid = isFacebookUrl(postUrl);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    update({ creative_assets: [...(data.creative_assets || []), file_url] });
    toast.success('Asset uploaded!', { duration: 1500 });
    setUploading(false);
  }

  function removeAsset(i) {
    const updated = [...(data.creative_assets || [])];
    updated.splice(i, 1);
    update({ creative_assets: updated });
  }

  return (
    <div>
      <h2 className="text-xl font-bold font-heading mb-1">Ad Creative</h2>
      <p className="text-muted-foreground text-sm mb-5">
        Choose how you'd like to provide your ad creative.
      </p>

      {/* Option selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => update({ creative_type: 'existing_post', creative_assets: [], description: '' })}
          className={cn(
            "flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all",
            creativeType === 'existing_post'
              ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5"
              : "border-border hover:bg-secondary/50"
          )}
        >
          <div className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center",
            creativeType === 'existing_post' ? "bg-[hsl(var(--primary))] text-white" : "bg-secondary"
          )}>
            <FileImage className="w-4 h-4" />
          </div>
          <div>
            <p className={cn("font-semibold text-sm", creativeType === 'existing_post' && "text-[hsl(var(--primary))]")}>
              Use Existing Post
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Boost a post already on your Facebook page</p>
          </div>
        </button>

        <button
          onClick={() => update({ creative_type: 'new_creative', creative_link: '' })}
          className={cn(
            "flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all",
            creativeType === 'new_creative'
              ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5"
              : "border-border hover:bg-secondary/50"
          )}
        >
          <div className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center",
            creativeType === 'new_creative' ? "bg-[hsl(var(--primary))] text-white" : "bg-secondary"
          )}>
            <Upload className="w-4 h-4" />
          </div>
          <div>
            <p className={cn("font-semibold text-sm", creativeType === 'new_creative' && "text-[hsl(var(--primary))]")}>
              Create New Ad
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Write a description and upload images or video</p>
          </div>
        </button>
      </div>

      {/* Existing post URL */}
      {creativeType === 'existing_post' && (
        <div className="space-y-4">
          <div>
            <Label className="font-semibold mb-1.5 block">Post URL <span className="text-destructive">*</span></Label>
            <div className="relative">
              <Input
                value={postUrl}
                onChange={e => { update({ post_url: e.target.value }); setUrlTouched(true); }}
                onBlur={() => setUrlTouched(true)}
                placeholder="https://www.facebook.com/yourpage/posts/..."
                className={cn(
                  "h-11 pr-10",
                  urlTouched && postUrl && !postUrlValid && "border-destructive",
                  postUrlValid && "border-green-500"
                )}
              />
              {postUrlValid && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />}
              {urlTouched && postUrl && !postUrlValid && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />}
            </div>
            {urlTouched && postUrl && !postUrlValid && (
              <p className="text-xs text-destructive mt-1">Must be a valid Facebook URL (facebook.com, fb.com, or fb.watch)</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Paste the link to the Facebook post you want to boost.
            </p>
          </div>
        </div>
      )}

      {/* New creative: description + uploads */}
      {creativeType === 'new_creative' && (
        <div className="space-y-5">
          {/* Description */}
          <div>
            <Label className="font-semibold mb-1.5 block">
              Ad Description / Brief <span className="text-muted-foreground font-normal text-xs">(required)</span>
            </Label>
            <Textarea
              value={data.description || ''}
              onChange={e => update({ description: e.target.value })}
              placeholder="Describe what you want to advertise. Our team will write the ad copy based on this."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">{(data.description || '').length} characters</p>
          </div>

          {/* Upload */}
          <div>
            <Label className="font-semibold mb-1.5 block">
              Images / Video <span className="text-muted-foreground font-normal text-xs">(optional — our team can create if needed)</span>
            </Label>
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-secondary/40 transition-colors">
              <Upload className="w-5 h-5 text-muted-foreground mb-1" />
              <span className="text-sm text-muted-foreground">{uploading ? 'Uploading...' : 'Click to upload image or video'}</span>
              <input type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
            {data.creative_assets?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {data.creative_assets.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border" />
                    <button onClick={() => removeAsset(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}