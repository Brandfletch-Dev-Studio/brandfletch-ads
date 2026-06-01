import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PROMOTE_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Upload, Link } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function StepPromote({ data, update }) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    update({ creative_assets: [...(data.creative_assets || []), file_url] });
    toast.success('Asset uploaded!');
    setUploading(false);
  }

  const needsUrl = data.promote_type === 'boost_post' || data.promote_type === 'website_traffic';
  const needsDescription = ['product', 'service', 'whatsapp_messages', 'messenger_messages'].includes(data.promote_type);

  return (
    <div>
      <h2 className="text-xl font-bold font-heading mb-1">What would you like us to promote?</h2>
      <p className="text-muted-foreground text-sm mb-6">Choose the type of promotion for your campaign.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {PROMOTE_TYPES.map(pt => (
          <button
            key={pt.value}
            onClick={() => update({ promote_type: pt.value })}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all",
              data.promote_type === pt.value
                ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5"
                : "border-border hover:border-[hsl(var(--primary))]/40 hover:bg-secondary/50"
            )}
          >
            <span className="text-2xl">{pt.icon}</span>
            <span className="text-sm font-medium leading-tight">{pt.label}</span>
          </button>
        ))}
      </div>

      {needsUrl && (
        <div className="mb-4">
          <Label className="flex items-center gap-1.5 mb-1.5">
            <Link className="w-3.5 h-3.5" />
            {data.promote_type === 'boost_post' ? 'Facebook Post URL' : 'Website URL'}
          </Label>
          <Input
            value={data.post_url}
            onChange={e => update({ post_url: e.target.value })}
            placeholder={data.promote_type === 'boost_post' ? 'https://facebook.com/...' : 'https://yourwebsite.com'}
          />
        </div>
      )}

      {needsDescription && (
        <div className="mb-4">
          <Label className="mb-1.5 block">Describe your {data.promote_type === 'product' ? 'product' : 'service'}</Label>
          <Textarea
            value={data.description}
            onChange={e => update({ description: e.target.value })}
            placeholder="Tell us what you'd like to promote..."
            rows={3}
          />
        </div>
      )}

      <div>
        <Label className="flex items-center gap-1.5 mb-1.5">
          <Upload className="w-3.5 h-3.5" /> Upload Creative Assets (optional)
        </Label>
        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-secondary/40 transition-colors">
          <Upload className="w-5 h-5 text-muted-foreground mb-1" />
          <span className="text-sm text-muted-foreground">{uploading ? 'Uploading...' : 'Click to upload image or video'}</span>
          <input type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
        {data.creative_assets?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {data.creative_assets.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}