import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Eye, Share2, BarChart3, Settings, Globe, Lock, Copy, ExternalLink, Target, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import FormAnalytics from '@/components/lead-forms/FormAnalytics';

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

export default function LeadForms() {
  const queryClient = useQueryClient();
  const [editingForm, setEditingForm] = useState(null);
  const [viewingForm, setViewingForm] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const { data: forms, isLoading } = useQuery({
    queryKey: ['myLeadForms'],
    queryFn: () => base44.entities.LeadForm.list(),
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const createFormMutation = useMutation({
    mutationFn: (formData) => base44.entities.LeadForm.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myLeadForms'] });
      setEditingForm(null);
      toast.success('Form created!');
    },
  });

  const updateFormMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LeadForm.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myLeadForms'] });
      setEditingForm(null);
      toast.success('Form updated!');
    },
  });

  const deleteFormMutation = useMutation({
    mutationFn: (id) => base44.entities.LeadForm.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myLeadForms'] });
      toast.success('Form deleted!');
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, is_active }) => 
      base44.entities.LeadForm.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myLeadForms'] });
      toast.success('Form status updated!');
    },
  });

  const handleSave = (formData) => {
    if (editingForm) {
      updateFormMutation.mutate({ id: editingForm.id, data: formData });
    } else {
      createFormMutation.mutate({ ...formData, user_id: user.id });
    }
  };

  const handleShare = async (form) => {
    const formUrl = `${window.location.origin}/forms/${form.id}`;
    await navigator.clipboard.writeText(formUrl);
    toast.success('Form URL copied to clipboard!');
  };

  const stats = {
    total: forms?.length || 0,
    active: forms?.filter(f => f.is_active).length || 0,
    totalSubmissions: forms?.reduce((sum, f) => sum + (f.total_submissions || 0), 0) || 0,
  };

  if (showAnalytics) {
    return <FormAnalytics forms={forms} onClose={() => setShowAnalytics(false)} />;
  }

  if (editingForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{editingForm?.id ? 'Edit Form' : 'Create New Form'}</h2>
          <Button variant="outline" onClick={() => setEditingForm(null)}>Cancel</Button>
        </div>
        <FormBuilder
          form={editingForm}
          onSave={handleSave}
          onCancel={() => setEditingForm(null)}
        />
      </div>
    );
  }

  if (viewingForm) {
    return (
      <FormPreview
        form={viewingForm}
        onClose={() => setViewingForm(null)}
        onEdit={() => {
          setViewingForm(null);
          setEditingForm(viewingForm);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Lead Forms</h1>
          <p className="text-muted-foreground">Create SEO-optimized lead capture forms</p>
        </div>
        <div className="flex gap-2">
          <Link to="/leads/forms/ai">
            <Button variant="outline">
              <Wand2 className="w-4 h-4 mr-2" />
              AI Builder
            </Button>
          </Link>
          <Button variant="outline" onClick={() => setShowAnalytics(true)}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button onClick={() => setEditingForm({})}>
            <Plus className="w-4 h-4 mr-2" />
            Create Form
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Plus className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Forms</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Globe className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
                <p className="text-xs text-muted-foreground">Total Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <p className="text-muted-foreground col-span-full">Loading...</p>
        ) : forms?.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No forms yet. Create your first lead capture form.</p>
              <Button onClick={() => setEditingForm({})}>
                <Plus className="w-4 h-4 mr-2" />
                Create Form
              </Button>
            </CardContent>
          </Card>
        ) : (
          forms?.map((form) => (
            <Card key={form.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{form.form_name}</CardTitle>
                    <CardDescription className="text-xs">{form.form_type}</CardDescription>
                  </div>
                  <Badge variant={form.is_active ? 'default' : 'secondary'}>
                    {form.is_active ? 'Published' : 'Draft'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <p>Submissions: {form.total_submissions || 0}</p>
                  <p>Fields: {form.fields?.length || 0}</p>
                  {form.meta_title && (
                    <p className="text-xs mt-1">SEO: ✓ Configured</p>
                  )}
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setViewingForm(form)}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingForm(form)}
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleShare(form)}
                  >
                    <Share2 className="w-3 h-3 mr-1" />
                    Share
                  </Button>
                  <Button
                    size="sm"
                    variant={form.is_active ? 'destructive' : 'outline'}
                    onClick={() => togglePublishMutation.mutate({ 
                      id: form.id, 
                      is_active: !form.is_active 
                    })}
                  >
                    {form.is_active ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function FormBuilder({ form, onSave, onCancel }) {
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
    og_image: form?.og_image || '',
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4" />
            SEO & Meta Tags
          </CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Form Fields</span>
            <Button type="button" size="sm" variant="outline" onClick={addField}>
              <Plus className="w-3 h-3 mr-2" />
              Add Field
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                        <div className="flex items-center h-9">
                          <Switch
                            checked={field.required}
                            onCheckedChange={(checked) => updateField(index, { required: checked })}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Placeholder</Label>
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

      <div className="flex gap-4">
        <Button type="submit">
          {form?.id ? 'Update Form' : 'Create Form'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function FormPreview({ form, onClose, onEdit }) {
  const formUrl = `${window.location.origin}/forms/${form.id}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Form Preview</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEdit}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{form.form_name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {form.fields.map((field) => (
              <div key={field.field_name}>
                <Label>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {field.field_type === 'textarea' ? (
                  <Textarea placeholder={field.placeholder} className="mt-1" />
                ) : field.field_type === 'dropdown' ? (
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input placeholder={field.placeholder} className="mt-1" />
                )}
              </div>
            ))}
            <Button className="w-full">Submit</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Form URL</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input value={formUrl} readOnly className="font-mono text-sm" />
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(formUrl);
                toast.success('URL copied!');
              }}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(formUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {form.meta_title && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">SEO Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <p className="text-xs text-muted-foreground">Meta Title</p>
              <p className="text-sm font-medium">{form.meta_title}</p>
            </div>
            {form.meta_description && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground">Meta Description</p>
                <p className="text-sm text-muted-foreground">{form.meta_description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}