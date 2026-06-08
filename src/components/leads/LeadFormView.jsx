import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, CheckCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function LeadFormView({ formId }) {
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({});

  const { data: form, isLoading } = useQuery({
    queryKey: ['leadForm', formId],
    queryFn: () => base44.entities.LeadForm.get(formId),
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      // Create lead record
      await base44.entities.Lead.create({
        user_id: form.user_id,
        form_id: form.id,
        form_name: form.form_name,
        lead_name: data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
        lead_email: data.email,
        lead_phone: data.phone,
        company: data.company,
        lead_data: data,
        stage: 'new_lead',
      });

      // Update form submission count
      await base44.entities.LeadForm.update(form.id, {
        total_submissions: (form.total_submissions || 0) + 1,
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const requiredFields = form.fields.filter(f => f.required);
    const missing = requiredFields.filter(f => !formData[f.field_name]);
    
    if (missing.length > 0) {
      toast.error(`Please fill in all required fields: ${missing.map(f => f.label).join(', ')}`);
      return;
    }

    submitMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading form...</div>;
  }

  if (!form) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Form not found</p>
        </CardContent>
      </Card>
    );
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Thank You!</h3>
          <p className="text-muted-foreground">{form.success_message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{form.form_name}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {form.fields.map((field) => (
            <div key={field.field_name}>
              <Label htmlFor={field.field_name}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              
              {field.field_type === 'textarea' ? (
                <textarea
                  id={field.field_name}
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  placeholder={field.placeholder}
                  value={formData[field.field_name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.field_name]: e.target.value })}
                  required={field.required}
                />
              ) : field.field_type === 'dropdown' ? (
                <Select
                  value={formData[field.field_name] || ''}
                  onValueChange={(value) => setFormData({ ...formData, [field.field_name]: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder || 'Select an option'} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.field_type === 'radio' ? (
                <div className="space-y-2 mt-2">
                  {field.options?.map((opt) => (
                    <label key={opt} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={field.field_name}
                        value={opt}
                        checked={formData[field.field_name] === opt}
                        onChange={(e) => setFormData({ ...formData, [field.field_name]: e.target.value })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              ) : field.field_type === 'checkbox' ? (
                <label className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={formData[field.field_name] || false}
                    onChange={(e) => setFormData({ ...formData, [field.field_name]: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{field.label}</span>
                </label>
              ) : (
                <Input
                  id={field.field_name}
                  type={field.field_type}
                  placeholder={field.placeholder}
                  value={formData[field.field_name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.field_name]: e.target.value })}
                  required={field.required}
                />
              )}
            </div>
          ))}
          
          <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
            {submitMutation.isPending ? 'Submitting...' : 'Submit'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}