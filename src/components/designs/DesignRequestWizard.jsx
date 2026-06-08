import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useDesignAssign } from '@/hooks/useDesignAssign';
import {
  ImageIcon, Megaphone, Layout, CreditCard, Briefcase, Star, BookOpen, Presentation, Wand2,
  Upload, X, CheckCircle2, ChevronRight, Loader2, AlertCircle, FileText
} from 'lucide-react';

const DESIGN_TYPES = [
  { value: 'social_media_post', label: 'Social Media Post', icon: ImageIcon, desc: 'Posts for Facebook, Instagram, Twitter' },
  { value: 'flyer', label: 'Flyer', icon: FileText, desc: 'Print or digital flyers' },
  { value: 'poster', label: 'Poster', icon: Layout, desc: 'Large format posters' },
  { value: 'banner', label: 'Banner', icon: Megaphone, desc: 'Web or physical banners' },
  { value: 'business_card', label: 'Business Card', icon: CreditCard, desc: 'Professional business cards' },
  { value: 'logo', label: 'Logo', icon: Star, desc: 'Brand logo design' },
  { value: 'brochure', label: 'Brochure', icon: BookOpen, desc: 'Tri-fold or bi-fold brochures' },
  { value: 'presentation', label: 'Presentation', icon: Presentation, desc: 'Slide decks & pitch decks' },
  { value: 'custom', label: 'Custom Design', icon: Wand2, desc: 'Something else entirely' },
];

const STEPS = ['Design Type', 'Project Details', 'Upload Assets', 'Review & Submit'];

export default function DesignRequestWizard({ subscription, onSuccess, onCancel }) {
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    design_type: '',
    title: '',
    description: '',
    target_audience: '',
    brand_name: '',
    preferred_dimensions: '',
    preferred_style: '',
    due_date: '',
    special_instructions: '',
    reference_files: [],
    priority: 'medium',
  });

  const queryClient = useQueryClient();
  const { assignDesign } = useDesignAssign();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const quotaRemaining = (subscription?.monthly_quota || 0) - (subscription?.quota_used || 0);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const request = await base44.entities.DesignRequest.create({
        ...data,
        user_id: user.id,
        request_type: 'retainer',
        status: 'submitted',
        revision_count: 0,
        submitted_date: new Date().toISOString(),
      });
      // Increment quota_used on subscription
      await base44.entities.PlatformSubscription.update(subscription.id, {
        quota_used: (subscription.quota_used || 0) + 1,
      });
      return request;
    },
  });

  const handleFileUpload = async (files) => {
    if (!files.length) return;
    setUploading(true);
    const uploads = await Promise.all(Array.from(files).map(f => base44.integrations.Core.UploadFile({ file: f })));
    const urls = uploads.map(r => r.file_url);
    setFormData(prev => ({ ...prev, reference_files: [...prev.reference_files, ...urls] }));
    setUploading(false);
    toast.success(`${urls.length} file(s) uploaded`);
  };

  const removeFile = (idx) => {
    setFormData(prev => ({ ...prev, reference_files: prev.reference_files.filter((_, i) => i !== idx) }));
  };

  const canProceed = () => {
    if (step === 0) return !!formData.design_type;
    if (step === 1) return !!formData.title && !!formData.description;
    return true;
  };

  const handleSubmit = () => {
    createMutation.mutate(formData);
  };

  const selectedType = DESIGN_TYPES.find(t => t.value === formData.design_type);

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
              {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-green-500' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>

      {/* Step 0: Design Type */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>What do you need designed?</CardTitle>
            <CardDescription>Select the type of design you'd like to request</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {DESIGN_TYPES.map((type) => {
                const Icon = type.icon;
                const selected = formData.design_type === type.value;
                return (
                  <button
                    key={type.value}
                    onClick={() => setFormData(prev => ({ ...prev, design_type: type.value }))}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${selected ? 'bg-primary text-white' : 'bg-muted'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="font-semibold text-sm">{type.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{type.desc}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Project Details */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>Help us understand exactly what you need</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Project Title *</Label>
                <Input value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="e.g., Product Launch Instagram Post" />
              </div>
              <div className="md:col-span-2">
                <Label>Description *</Label>
                <Textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="What should the design convey? What's the goal?" className="min-h-[100px]" />
              </div>
              <div>
                <Label>Brand / Business Name</Label>
                <Input value={formData.brand_name} onChange={e => setFormData(p => ({ ...p, brand_name: e.target.value }))} placeholder="Your business name" />
              </div>
              <div>
                <Label>Target Audience</Label>
                <Input value={formData.target_audience} onChange={e => setFormData(p => ({ ...p, target_audience: e.target.value }))} placeholder="e.g., Young adults 18-35" />
              </div>
              <div>
                <Label>Preferred Dimensions</Label>
                <Input value={formData.preferred_dimensions} onChange={e => setFormData(p => ({ ...p, preferred_dimensions: e.target.value }))} placeholder="e.g., 1080x1080px, A4" />
              </div>
              <div>
                <Label>Preferred Style</Label>
                <Input value={formData.preferred_style} onChange={e => setFormData(p => ({ ...p, preferred_style: e.target.value }))} placeholder="e.g., Modern, Minimalist, Bold" />
              </div>
              <div>
                <Label>Deadline (optional)</Label>
                <Input type="date" value={formData.due_date} onChange={e => setFormData(p => ({ ...p, due_date: e.target.value }))} />
              </div>
              <div>
                <Label>Priority</Label>
                <select value={formData.priority} onChange={e => setFormData(p => ({ ...p, priority: e.target.value }))} className="w-full border border-input rounded-md px-3 py-2 text-sm">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Label>Special Instructions</Label>
                <Textarea value={formData.special_instructions} onChange={e => setFormData(p => ({ ...p, special_instructions: e.target.value }))} placeholder="Brand colors, fonts, do's and don'ts, any specific requirements..." className="min-h-[80px]" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Upload Assets */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Reference Assets</CardTitle>
            <CardDescription>Upload logos, images, brand guidelines, or reference designs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
              <input type="file" multiple className="hidden" onChange={e => handleFileUpload(e.target.files)} accept="image/*,.pdf,.doc,.docx,.ai,.psd,.xd" />
              {uploading ? (
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              ) : (
                <Upload className="w-8 h-8 text-muted-foreground" />
              )}
              <div className="text-center">
                <p className="font-medium">Click to upload files</p>
                <p className="text-xs text-muted-foreground mt-1">Images, PDFs, brand guidelines, AI/PSD files</p>
              </div>
            </label>

            {formData.reference_files.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">{formData.reference_files.length} file(s) uploaded</p>
                {formData.reference_files.map((url, i) => (
                  <div key={i} className="flex items-center justify-between p-2 border rounded-lg text-sm">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate flex-1">
                      Reference {i + 1}
                    </a>
                    <button onClick={() => removeFile(i)} className="ml-2 text-muted-foreground hover:text-destructive">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-sm text-muted-foreground">Asset uploads are optional. You can also skip this step.</p>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-4">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-sm font-medium">
                This request will consume <strong>1 design credit</strong> from your retainer plan.
                You have <strong>{quotaRemaining}</strong> credit{quotaRemaining !== 1 ? 's' : ''} remaining.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Review Your Request</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Design Type</p><p className="font-semibold">{selectedType?.label}</p></div>
                <div><p className="text-muted-foreground">Priority</p><p className="font-semibold capitalize">{formData.priority}</p></div>
                <div className="col-span-2"><p className="text-muted-foreground">Title</p><p className="font-semibold">{formData.title}</p></div>
                <div className="col-span-2"><p className="text-muted-foreground">Description</p><p>{formData.description}</p></div>
                {formData.brand_name && <div><p className="text-muted-foreground">Brand Name</p><p className="font-semibold">{formData.brand_name}</p></div>}
                {formData.target_audience && <div><p className="text-muted-foreground">Target Audience</p><p className="font-semibold">{formData.target_audience}</p></div>}
                {formData.preferred_dimensions && <div><p className="text-muted-foreground">Dimensions</p><p className="font-semibold">{formData.preferred_dimensions}</p></div>}
                {formData.preferred_style && <div><p className="text-muted-foreground">Style</p><p className="font-semibold">{formData.preferred_style}</p></div>}
                {formData.due_date && <div><p className="text-muted-foreground">Deadline</p><p className="font-semibold">{new Date(formData.due_date).toLocaleDateString()}</p></div>}
                {formData.reference_files.length > 0 && <div><p className="text-muted-foreground">Assets Uploaded</p><p className="font-semibold">{formData.reference_files.length} file(s)</p></div>}
                {formData.special_instructions && <div className="col-span-2"><p className="text-muted-foreground">Special Instructions</p><p>{formData.special_instructions}</p></div>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={step === 0 ? onCancel : () => setStep(s => s - 1)}>
          {step === 0 ? 'Cancel' : '← Back'}
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : 'Submit Request'}
          </Button>
        )}
      </div>
    </div>
  );
}