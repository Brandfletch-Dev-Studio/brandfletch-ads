import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Upload, Link2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function StepCreative({ data, update }) {
  const [uploading, setUploading] = useState(false);

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
        Upload images/videos for your ad, share a link to existing creative, or just describe what you want.
      </p>

      {/* Creative type toggle */}
      <div className="flex gap-2 mb-5">
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
        <div className="mb-5">
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
          <p className="text-xs text-muted-foreground mt-2">No assets? No problem — our team can create your ad from your description below.</p>
        </div>
      )}

      {/* Link */}
      {data.creative_type === 'link' && (
        <div className="mb-5">
          <Label className="font-semibold mb-1 block">Link to existing creative</Label>
          <Input
            value={data.creative_link || ''}
            onChange={e => update({ creative_link: e.target.value })}
            placeholder="https://drive.google.com/... or Canva link, Dropbox, etc."
            className="h-11"
          />
          <p className="text-xs text-muted-foreground mt-1">Share a Google Drive, Dropbox, or Canva link with your image/video.</p>
        </div>
      )}

      {/* Description / brief */}
      <div>
        <Label className="font-semibold mb-1 block">
          Ad Description / Brief <span className="text-muted-foreground font-normal text-xs">(recommended)</span>
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
    </div>
  );
}