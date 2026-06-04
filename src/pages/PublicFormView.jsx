import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PublicFormView() {
  const { formId } = useParams();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({});

  const { data: form, isLoading, error } = useQuery({
    queryKey: ['publicForm', formId],
    queryFn: () => base44.entities.LeadForm.get(formId),
  });

  const submitMutation = useMutation({
    mutationFn: async (data) => {
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

      await base44.entities.LeadForm.update(form.id, {
        total_submissions: (form.total_submissions || 0) + 1,
      });

      if (form.webhook_url) {
        await fetch(form.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
    },
    onSuccess: () => {
      setSubmitted(true);
      if (form.redirect_url) {
        window.location.href = form.redirect_url;
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const requiredFields = form.fields.filter(f => f.required);
    const missing = requiredFields.filter(f => !formData[f.field_name]);
    
    if (missing.length > 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    submitMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Form Not Found</h2>
            <p className="text-muted-foreground">This form may have been removed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!form.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Form Unavailable</h2>
            <p className="text-muted-foreground">This form is not accepting submissions.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <Card className="max-w-lg w-full mx-4">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
            <p className="text-muted-foreground mb-6">{form.success_message}</p>
            {!form.redirect_url && (
              <Button onClick={() => window.location.href = '/'}>
                Return Home
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{form.form_name}</CardTitle>
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
                    <Textarea
                      id={field.field_name}
                      placeholder={field.placeholder}
                      value={formData[field.field_name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.field_name]: e.target.value })}
                      required={field.required}
                      className="mt-1"
                    />
                  ) : field.field_type === 'dropdown' ? (
                    <Select
                      value={formData[field.field_name] || ''}
                      onValueChange={(value) => setFormData({ ...formData, [field.field_name]: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder={field.placeholder || 'Select'} />
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
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={field.field_name}
                            value={opt}
                            checked={formData[field.field_name] === opt}
                            onChange={(e) => setFormData({ ...formData, [field.field_name]: e.target.value })}
                            className="w-4 h-4"
                            required={field.required}
                          />
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : field.field_type === 'checkbox' ? (
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
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
                      className="mt-1"
                    />
                  )}
                </div>
              ))}
              
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? 'Submitting...' : 'Submit'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}