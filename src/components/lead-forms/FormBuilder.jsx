import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Settings, Mail, Link as LinkIcon, Globe, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'date', label: 'Date' },
  { value: 'file', label: 'File Upload' },
];

const FORM_TYPES = [
  { value: 'contact', label: 'Contact Form' },
  { value: 'quote_request', label: 'Quote Request' },
  { value: 'consultation', label: 'Consultation Booking' },
  { value: 'lead_generation', label: 'Lead Generation' },
  { value: 'newsletter', label: 'Newsletter Signup' },
  { value: 'custom', label: 'Custom' },
];

export default function FormBuilder({ form, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    form_name: form?.form_name || '',
    form_type: form?.form_type || 'contact',
    is_active: form?.is_active ?? false,
    fields: form?.fields || [],
    success_message: form?.success_message || 'Thank you! Your submission has been received.',
    notification_email: form?.notification_email || '',
    meta_title: form?.meta_title || '',
    meta_description: form?.meta_description || '',
    meta_keywords: form?.meta_keywords || '',
    og_title: form?.og_title || '',
    og_description: form?.og_description || '',
    redirect_url: form?.redirect_url || '',
    webhook_url: form?.webhook_url || '',
    email_notifications: form?.email_notifications ?? true,
  });

  const addField = () => {
    setFormData({
      ...formData,
      fields: [
        ...formData.fields,
        {
          field_name: `field_${formData.fields.length + 1}`,
          field_type: 'text',
          label: 'New Field',
          placeholder: '',
          required: false,
          options: [],
        },
      ],
    });
  };

  const updateField = (index, updates) => {
    const newFields = [...formData.fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFormData({ ...formData, fields: newFields });
  };

  const removeField = (index) => {
    setFormData({
      ...formData,
      fields: formData.fields.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.form_name || formData.fields.length === 0) {
      toast.error('Please add a form name and at least one field');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Basic Information
          </CardTitle>
          <CardDescription>Configure the fundamental settings of your form</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="form_name">Form Name</Label>
            <Input
              id="form_name"
              value={formData.form_name}
              onChange={(e) => setFormData({ ...formData, form_name: e.target.value })}
              placeholder="e.g., Contact Us Form"
            />
          </div>
          <div>
            <Label htmlFor="form_type">Form Type</Label>
            <Select
              value={formData.form_type}
              onValueChange={(value) => setFormData({ ...formData, form_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORM_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Form Fields */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Form Fields
            </span>
            <Button type="button" size="sm" variant="outline" onClick={addField} className="gap-2">
              <Plus className="w-3 h-3" />
              Add Field
            </Button>
          </CardTitle>
          <CardDescription>Design the fields that users will fill out</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.fields.map((field, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Label</Label>
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(index, { label: e.target.value })}
                          placeholder="Field Label"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Field Type</Label>
                        <Select
                          value={field.field_type}
                          onValueChange={(value) => updateField(index, { field_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Required</Label>
                        <div className="flex items-center h-9">
                          <Switch
                            checked={field.required}
                            onCheckedChange={(checked) => updateField(index, { required: checked })}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Placeholder (optional)</Label>
                      <Input
                        value={field.placeholder}
                        onChange={(e) => updateField(index, { placeholder: e.target.value })}
                        placeholder="Placeholder text"
                      />
                    </div>
                    {(field.field_type === 'dropdown' || field.field_type === 'radio') && (
                      <div>
                        <Label className="text-xs">Options (comma-separated)</Label>
                        <Input
                          value={field.options?.join(', ')}
                          onChange={(e) => updateField(index, { options: e.target.value.split(',').map(o => o.trim()) })}
                          placeholder="Option 1, Option 2, Option 3"
                        />
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => removeField(index)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* SEO & Meta Tags */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-600" />
            SEO & Meta Tags
          </CardTitle>
          <CardDescription>Optimize your form for search engines and social sharing</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="meta_title">Meta Title</Label>
            <Input
              id="meta_title"
              value={formData.meta_title}
              onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
              placeholder="SEO title for search engines"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="meta_description">Meta Description</Label>
            <Textarea
              id="meta_description"
              value={formData.meta_description}
              onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
              placeholder="SEO description for search engines"
              className="min-h-[60px]"
            />
          </div>
          <div>
            <Label htmlFor="meta_keywords">Meta Keywords</Label>
            <Input
              id="meta_keywords"
              value={formData.meta_keywords}
              onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
              placeholder="keyword1, keyword2, keyword3"
            />
          </div>
          <div>
            <Label htmlFor="og_title">Open Graph Title</Label>
            <Input
              id="og_title"
              value={formData.og_title}
              onChange={(e) => setFormData({ ...formData, og_title: e.target.value })}
              placeholder="Title for social media sharing"
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-orange-600" />
            Form Actions
          </CardTitle>
          <CardDescription>Configure what happens after form submission</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="redirect_url">Redirect URL (after submission)</Label>
              <Input
                id="redirect_url"
                value={formData.redirect_url}
                onChange={(e) => setFormData({ ...formData, redirect_url: e.target.value })}
                placeholder="https://yoursite.com/thank-you"
              />
            </div>
            <div>
              <Label htmlFor="webhook_url">Webhook URL</Label>
              <Input
                id="webhook_url"
                value={formData.webhook_url}
                onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                placeholder="https://api.example.com/webhook"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="email_notifications"
              checked={formData.email_notifications}
              onCheckedChange={(checked) => setFormData({ ...formData, email_notifications: checked })}
            />
            <Label htmlFor="email_notifications">Enable email notifications</Label>
          </div>
          <div>
            <Label htmlFor="notification_email">Notification Email</Label>
            <Input
              id="notification_email"
              type="email"
              value={formData.notification_email}
              onChange={(e) => setFormData({ ...formData, notification_email: e.target.value })}
              placeholder="you@example.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="lg" className="gap-2">
          {form?.id ? 'Update Form' : 'Create Form'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}