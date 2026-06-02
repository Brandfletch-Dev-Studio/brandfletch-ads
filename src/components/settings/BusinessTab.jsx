import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Building2, Globe, Briefcase, Save, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const INDUSTRIES = [
  { value: 'retail', label: 'Retail & E-commerce' },
  { value: 'food_beverage', label: 'Food & Beverage' },
  { value: 'health_beauty', label: 'Health & Beauty' },
  { value: 'technology', label: 'Technology' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'education', label: 'Education' },
  { value: 'finance', label: 'Finance & Banking' },
  { value: 'hospitality', label: 'Hospitality & Tourism' },
  { value: 'media_entertainment', label: 'Media & Entertainment' },
  { value: 'ngo', label: 'NGO / Non-profit' },
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'other', label: 'Other' },
];

const GOALS = [
  { value: 'brand_awareness', label: 'Build brand awareness' },
  { value: 'lead_generation', label: 'Generate leads' },
  { value: 'website_traffic', label: 'Drive website traffic' },
  { value: 'sales', label: 'Increase sales' },
  { value: 'messages', label: 'Get more messages / inquiries' },
  { value: 'app_installs', label: 'Grow app installs' },
  { value: 'page_followers', label: 'Grow page followers' },
];

export default function BusinessTab({ form, setForm }) {
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await base44.auth.updateMe({
      business_name: form.business_name,
      business_type: form.business_type,
      business_website: form.business_website,
      business_industry: form.business_industry,
      business_description: form.business_description,
      primary_goal: form.primary_goal,
    });
    toast.success('Business info saved!');
    setSaving(false);
  }

  const isComplete = form.business_name && form.business_industry && form.primary_goal;

  return (
    <div className="space-y-6">
      {isComplete && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Your business profile is complete. This helps us target your campaigns better.
        </div>
      )}

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2 font-semibold">
            <Building2 className="w-4 h-4 text-muted-foreground" /> Business Profile
          </CardTitle>
          <CardDescription>Help us understand your business so we can deliver better ad results.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Business / Brand Name *</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={form.business_name || ''}
                  onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))}
                  placeholder="Acme Corp"
                  className="pl-9 h-10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Industry *</Label>
              <Select value={form.business_industry || ''} onValueChange={v => setForm(f => ({ ...f, business_industry: v }))}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select industry..." />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={form.business_website || ''}
                  onChange={e => setForm(f => ({ ...f, business_website: e.target.value }))}
                  placeholder="https://yourbusiness.com"
                  className="pl-9 h-10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Primary Goal *</Label>
              <Select value={form.primary_goal || ''} onValueChange={v => setForm(f => ({ ...f, primary_goal: v }))}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="What's your main goal?" />
                </SelectTrigger>
                <SelectContent>
                  {GOALS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Business Description</Label>
            <Textarea
              value={form.business_description || ''}
              onChange={e => setForm(f => ({ ...f, business_description: e.target.value }))}
              placeholder="Tell us what your business does, who your customers are, and what makes you unique..."
              className="resize-none h-28"
            />
            <p className="text-xs text-muted-foreground">{(form.business_description || '').length}/500 characters</p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="gap-2 w-full sm:w-auto">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Business Info'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}