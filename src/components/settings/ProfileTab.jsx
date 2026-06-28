import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { User, Mail, Phone, Globe, Shield, Camera, Upload, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function ProfileTab({ user, form, setForm }) {
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const initials = form.full_name
    ? form.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : (user?.email?.[0] || 'U').toUpperCase();

  async function handleSave() {
    try {
          setSaving(true);
          await base44.auth.updateMe({
            full_name: form.full_name,
            phone: form.phone,
          });
          toast.success('Profile saved!');
          setSaving(false);
    } catch (err) {
      toast.error(err?.message || "Something went wrong. Please try again.");
    }
  }

  async function handlePhotoUpload(e) {
    try {
          const file = e.target.files[0];
          if (!file) return;
          setUploadingPhoto(true);
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          setForm(f => ({ ...f, profile_photo: file_url }));
          await base44.auth.updateMe({ profile_photo: file_url });
          toast.success('Profile photo updated!');
          setUploadingPhoto(false);
    } catch (err) {
      toast.error(err?.message || "Something went wrong. Please try again.");
    }
  }

  async function handleCoverUpload(e) {
    try {
          const file = e.target.files[0];
          if (!file) return;
          setUploadingCover(true);
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          setForm(f => ({ ...f, cover_photo: file_url }));
          await base44.auth.updateMe({ cover_photo: file_url });
          toast.success('Cover photo updated!');
          setUploadingCover(false);
    } catch (err) {
      toast.error(err?.message || "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <Card className="shadow-sm overflow-hidden">
        <div className="relative h-28 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] overflow-hidden">
          {form.cover_photo && <img src={form.cover_photo} alt="Cover" className="w-full h-full object-cover" />}
          <label className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-white text-xs font-medium cursor-pointer transition-colors">
            <Camera className="w-3.5 h-3.5" />
            {uploadingCover ? 'Uploading...' : 'Change Cover'}
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadingCover} />
          </label>
        </div>
        <CardContent className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-[hsl(var(--primary))] border-4 border-card flex items-center justify-center shadow-lg overflow-hidden">
                {form.profile_photo
                  ? <img src={form.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                  : <span className="text-2xl font-bold text-primary-foreground">{initials}</span>
                }
              </div>
              <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[hsl(var(--accent))] text-white flex items-center justify-center cursor-pointer hover:bg-[hsl(217,91%,48%)] shadow-md">
                {uploadingPhoto ? <Upload className="w-3 h-3 animate-pulse" /> : <Camera className="w-3 h-3" />}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
              </label>
            </div>
            <div className="sm:pb-1 flex-1 min-w-0">
              <h2 className="text-xl font-bold font-heading truncate">{form.full_name || 'Your Name'}</h2>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              {user?.role && user.role !== 'user' && (
                <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  <Shield className="w-3 h-3" />
                  {user.role.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal info */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2 font-semibold">
            <User className="w-4 h-4 text-muted-foreground" /> Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Full Name</Label>
              <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Jane Doe" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+265 999 000 000" className="pl-9 h-10" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Country</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={form.country || 'Not set'} disabled className="pl-9 h-10 bg-secondary text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              To change your country, <a href="mailto:support@brandfletch.com" className="text-[hsl(var(--accent))] hover:underline">contact support</a>.
            </p>
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={user?.email || ''} disabled className="pl-9 h-10 bg-secondary text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Email address cannot be changed.</p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="gap-2 w-full sm:w-auto">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}