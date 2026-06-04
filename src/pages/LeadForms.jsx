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
import { Plus, Edit2, Trash2, Eye, Share2, Settings, Globe, Lock, Copy, ExternalLink, Target, Wand2, Zap, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import FormBuilder from '@/components/lead-forms/FormBuilder';
import FormPreview from '@/components/lead-forms/FormPreview';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <FileText className="w-8 h-8" />
                </div>
                <h1 className="text-4xl font-bold">Lead Forms</h1>
              </div>
              <p className="text-xl text-blue-100 max-w-2xl">
                Create powerful, SEO-optimized lead capture forms with our intuitive form builder.
              </p>
              
              <div className="flex flex-wrap gap-3 mt-8">
                <Button onClick={() => setEditingForm({})} className="gap-2 bg-white text-blue-600 hover:bg-blue-50">
                  <Plus className="w-4 h-4" />
                  Create Form
                </Button>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : forms?.length === 0 ? (
          <Card className="py-16">
            <CardContent className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No forms yet</h3>
              <p className="text-gray-500 mb-6">Create your first lead capture form to start collecting leads</p>
              <Button onClick={() => setEditingForm({})} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Form
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms?.map((form) => (
              <Card key={form.id} className="hover:shadow-lg transition-shadow">
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
                      <p className="text-xs mt-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        SEO Configured
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => setViewingForm(form)}>
                      <Eye className="w-3 h-3 mr-1" /> View
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingForm(form)}>
                      <Edit2 className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleShare(form)}>
                      <Share2 className="w-3 h-3 mr-1" /> Share
                    </Button>
                    <Button
                      size="sm"
                      variant={form.is_active ? 'destructive' : 'outline'}
                      onClick={() => togglePublishMutation.mutate({ id: form.id, is_active: !form.is_active })}
                    >
                      {form.is_active ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}