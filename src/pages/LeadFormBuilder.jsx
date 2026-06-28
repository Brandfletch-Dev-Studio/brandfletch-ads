import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit2, FileText } from 'lucide-react';
import { toast } from 'sonner';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio Buttons' },
];

const FORM_TYPES = [
  { value: 'contact', label: 'Contact Form' },
  { value: 'consultation', label: 'Consultation Booking' },
  { value: 'lead_generation', label: 'Lead Generation' },
  { value: 'custom', label: 'Custom' },
];

export default function LeadFormBuilder() {
  const queryClient = useQueryClient();
  const [editingForm, setEditingForm] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);

  const { data: forms, isLoading } = useQuery({
    queryKey: ['myLeadForms'],
    queryFn: () => base44.entities.LeadForm.list({}),
  });

  const createFormMutation = useMutation({
    mutationFn: (formData) => base44.entities.LeadForm.create(formData),
  });

  const updateFormMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LeadForm.update(id, data),
  });

  const deleteFormMutation = useMutation({
    mutationFn: (id) => base44.entities.LeadForm.delete(id),
  });

  const handleSave = (formData) => {
    if (editingForm) {
      updateFormMutation.mutate({ id: editingForm.id, data: formData });
    } else {
      createFormMutation.mutate(formData);
    }
  };

  if (showBuilder || editingForm) {
    return (
      <FormBuilder
        form={editingForm}
        onSave={handleSave}
        onCancel={() => {
          setShowBuilder(false);
          setEditingForm(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Lead Forms</h1>
          <p className="text-muted-foreground">Create custom forms to capture leads</p>
        </div>
        <Button onClick={() => setShowBuilder(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Form
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : forms?.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">No forms yet. Create your first lead capture form.</p>
              <Button onClick={() => setShowBuilder(true)}>
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
                  <div>
                    <CardTitle className="text-base">{form.form_name}</CardTitle>
                    <CardDescription className="text-xs">{form.form_type}</CardDescription>
                  </div>
                  <Badge variant={form.is_active ? 'default' : 'secondary'}>
                    {form.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  <p>Submissions: {form.total_submissions || 0}</p>
                  <p>Fields: {form.fields?.length || 0}</p>
                </div>
                <div className="flex gap-2">
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
                    variant="destructive"
                    onClick={() => {
                      if (confirm('Delete this form?')) {
                        deleteFormMutation.mutate(form.id);
                      }
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
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
    is_active: form?.is_active ?? true,
    fields: form?.fields || [],
    success_message: form?.success_message || 'Thank you! Your submission has been received.',
    notification_email: form?.notification_email || '',
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
        <CardTitle>{form ? 'Edit Form' : 'Create New Form'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div>
            <Label htmlFor="notification_email">Notification Email (optional)</Label>
            <Input
              id="notification_email"
              type="email"
              value={formData.notification_email}
              onChange={(e) => setFormData({ ...formData, notification_email: e.target.value })}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <Label>Form Fields</Label>
              <Button type="button" size="sm" variant="outline" onClick={addField}>
                <Plus className="w-3 h-3 mr-2" />
                Add Field
              </Button>
            </div>

            <div className="space-y-4">
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
                              <Checkbox
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

          <div className="flex gap-4">
            <Button type="submit">
              {form ? 'Update Form' : 'Create Form'}
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