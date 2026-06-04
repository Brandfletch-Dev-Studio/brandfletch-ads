import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Settings, FileText, Layers, MessageSquare, Save, Globe, LinkIcon, Sparkles, Mail, Plus, Wand2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import FieldEditor from './FieldEditor';
import AIFormSuggestions from './AIFormSuggestions';

const FORM_CATEGORIES = [
  { value: 'contact', label: 'Contact Form' },
  { value: 'quote_request', label: 'Quote Request' },
  { value: 'consultation', label: 'Consultation Booking' },
  { value: 'lead_generation', label: 'Lead Generation' },
  { value: 'newsletter', label: 'Newsletter Signup' },
  { value: 'registration', label: 'Registration' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'custom', label: 'Custom' },
];

const FORM_BUILD_TYPES = [
  { value: 'traditional', label: 'Traditional', icon: FileText, description: 'Single-page form with all fields visible' },
  { value: 'multi_step', label: 'Multi-Step', icon: Layers, description: 'Break form into multiple pages/steps' },
  { value: 'conversational', label: 'Conversational', icon: MessageSquare, description: 'Chat-like one-question-at-a-time' },
];

export default function FormBuilder({ form, onSave, onCancel }) {
  const [selectedFormType, setSelectedFormType] = useState(form?.form_build_type || 'traditional');
  const [showAIBuilder, setShowAIBuilder] = useState(!form?.id && !form?.fields?.length);
  const [formData, setFormData] = useState({
    form_name: form?.form_name || '',
    form_type: form?.form_type || 'contact',
    form_build_type: form?.form_build_type || 'traditional',
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

  const updateField = (index, updates) => {
    const newFields = [...formData.fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFormData({ ...formData, fields: newFields });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.form_name) {
      toast.error('Please add a form name');
      return;
    }
    if (formData.fields.length === 0) {
      toast.error('Please add at least one field');
      return;
    }
    onSave({ ...formData, form_build_type: selectedFormType });
  };

  const handleAIFieldsGenerated = (fields) => {
    setFormData({ ...formData, fields });
    setShowAIBuilder(false);
    toast.success('AI fields added! You can now edit them below.');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* AI Form Builder */}
      {showAIBuilder && (
        <AIFormSuggestions
          formType={formData.form_type}
          onFieldsGenerated={handleAIFieldsGenerated}
          onSkip={() => setShowAIBuilder(false)}
        />
      )}

      {!showAIBuilder && formData.fields.length === 0 && (
        <div className="text-center p-6 bg-muted/50 rounded-lg border-2 border-dashed">
          <Sparkles className="w-12 h-12 mx-auto mb-3 text-purple-400" />
          <h3 className="text-lg font-medium mb-2">Start with AI or Build Manually</h3>
          <p className="text-muted-foreground mb-4">Let AI generate optimized fields for your form type</p>
          <Button
            type="button"
            onClick={() => setShowAIBuilder(true)}
            className="gap-2 bg-purple-600 hover:bg-purple-700"
          >
            <Wand2 className="w-4 h-4" />
            Launch AI Form Builder
          </Button>
        </div>
      )}

      {/* Form Type Selection */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Form Experience Type
          </CardTitle>
          <CardDescription>Choose how users will interact with your form</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FORM_BUILD_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSelectedFormType(type.value)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedFormType === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${
                      selectedFormType === type.value ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        selectedFormType === type.value ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <span className="font-medium">{type.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
            <Label htmlFor="form_name">Form Name *</Label>
            <Input
              id="form_name"
              value={formData.form_name}
              onChange={(e) => setFormData({ ...formData, form_name: e.target.value })}
              placeholder="e.g., Contact Us Form"
              required
            />
          </div>
          <div>
            <Label htmlFor="form_type">Form Category</Label>
            <Select
              value={formData.form_type}
              onValueChange={(value) => setFormData({ ...formData, form_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORM_CATEGORIES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Field Editor */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Form Fields
            </span>
            <Button type="button" size="sm" variant="outline" onClick={() => {
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
            }} className="gap-2">
              <Plus className="w-3 h-3" />
              Add Field
            </Button>
          </CardTitle>
          <CardDescription>Design the fields that users will fill out</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.fields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No fields yet. Click "Add Field" to get started.</p>
            </div>
          ) : (
            formData.fields.map((field, index) => (
              <FieldEditor
                key={index}
                field={field}
                index={index}
                onUpdate={updateField}
                onRemove={(idx) => {
                  const newFields = formData.fields.filter((_, i) => i !== idx);
                  setFormData({ ...formData, fields: newFields });
                }}
                onMove={(idx, dir) => {
                  const newFields = [...formData.fields];
                  const target = dir === 'up' ? idx - 1 : idx + 1;
                  if (target < 0 || target >= newFields.length) return;
                  [newFields[idx], newFields[target]] = [newFields[target], newFields[idx]];
                  setFormData({ ...formData, fields: newFields });
                }}
                onAddOption={(fieldIdx) => {
                  const newFields = [...formData.fields];
                  if (!newFields[fieldIdx].options) newFields[fieldIdx].options = [];
                  newFields[fieldIdx].options.push(`Option ${newFields[fieldIdx].options.length + 1}`);
                  setFormData({ ...formData, fields: newFields });
                }}
                onUpdateOption={(fieldIdx, optIdx, value) => {
                  const newFields = [...formData.fields];
                  newFields[fieldIdx].options[optIdx] = value;
                  setFormData({ ...formData, fields: newFields });
                }}
                onRemoveOption={(fieldIdx, optIdx) => {
                  const newFields = [...formData.fields];
                  newFields[fieldIdx].options = newFields[fieldIdx].options.filter((_, i) => i !== optIdx);
                  setFormData({ ...formData, fields: newFields });
                }}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-green-600" />
            Notifications & Success
          </CardTitle>
          <CardDescription>Configure what happens after submission</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="success_message">Success Message</Label>
            <Textarea
              id="success_message"
              value={formData.success_message}
              onChange={(e) => setFormData({ ...formData, success_message: e.target.value })}
              placeholder="Thank you! Your submission has been received."
              rows={2}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="notification_email">Notification Email</Label>
              <Input
                id="notification_email"
                type="email"
                value={formData.notification_email}
                onChange={(e) => setFormData({ ...formData, notification_email: e.target.value })}
                placeholder="your@email.com"
              />
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.email_notifications}
                  onCheckedChange={(checked) => setFormData({ ...formData, email_notifications: checked })}
                />
                <Label className="text-sm cursor-pointer">Enable Email Notifications</Label>
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="redirect_url">Redirect URL (Optional)</Label>
            <Input
              id="redirect_url"
              value={formData.redirect_url}
              onChange={(e) => setFormData({ ...formData, redirect_url: e.target.value })}
              placeholder="https://yoursite.com/thank-you"
            />
          </div>
        </CardContent>
      </Card>

      {/* SEO Settings */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            SEO & Social Media
          </CardTitle>
          <CardDescription>Optimize your form for search engines and social sharing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="meta_title">Meta Title</Label>
              <Input
                id="meta_title"
                value={formData.meta_title}
                onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                placeholder="Form title for search engines"
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
          </div>
          <div>
            <Label htmlFor="meta_description">Meta Description</Label>
            <Textarea
              id="meta_description"
              value={formData.meta_description}
              onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
              placeholder="Brief description for search engines"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="og_title">Social Media Title</Label>
              <Input
                id="og_title"
                value={formData.og_title}
                onChange={(e) => setFormData({ ...formData, og_title: e.target.value })}
                placeholder="Title for social sharing"
              />
            </div>
            <div>
              <Label htmlFor="og_description">Social Media Description</Label>
              <Textarea
                id="og_description"
                value={formData.og_description}
                onChange={(e) => setFormData({ ...formData, og_description: e.target.value })}
                placeholder="Description for social sharing"
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-orange-600" />
            Advanced Settings
          </CardTitle>
          <CardDescription>Webhook and integration settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="webhook_url">Webhook URL (Optional)</Label>
            <Input
              id="webhook_url"
              value={formData.webhook_url}
              onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
              placeholder="https://your-api.com/webhook"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Form submissions will be sent to this URL via POST request
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="gap-2">
          <Save className="w-4 h-4" />
          {form?.id ? 'Update Form' : 'Create Form'}
        </Button>
      </div>
    </form>
  );
}