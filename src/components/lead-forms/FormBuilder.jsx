import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from '@/components/ui/button';
import { Eye, Globe, Lock } from 'lucide-react';
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
    <Card>
      <CardHeader>
        <CardTitle>{form?.id ? 'Edit Form' : 'Create New Form'}</CardTitle>
        <CardDescription>Configure form fields, SEO settings, and actions</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Form Fields</h3>
              <Button type="button" size="sm" variant="outline" onClick={addField}>
                <Plus className="w-3 h-3 mr-2" />
                Add Field
              </Button>
            </div>

            <div className="space-y-3">
              {formData.fields.map((field, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                            <div className="flex items-center h-9 gap-2">
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
            </div>
          </div>

          {/* SEO Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold">SEO & Meta Tags</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  placeholder="SEO title for search engines"
                />
              </div>
              <div>
                <Label htmlFor="meta_description">Meta Description</Label>
                <Input
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  placeholder="SEO description"
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
                <Label htmlFor="og_title">Social Media Title (OG)</Label>
                <Input
                  id="og_title"
                  value={formData.og_title}
                  onChange={(e) => setFormData({ ...formData, og_title: e.target.value })}
                  placeholder="Title for social sharing"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="og_description">Social Media Description (OG)</Label>
              <Textarea
                id="og_description"
                value={formData.og_description}
                onChange={(e) => setFormData({ ...formData, og_description: e.target.value })}
                placeholder="Description for social sharing"
                className="min-h-[80px]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <h3 className="font-semibold">Form Actions</h3>
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
          </div>

          <div className="flex gap-4">
            <Button type="submit">
              {form?.id ? 'Update Form' : 'Create Form'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}