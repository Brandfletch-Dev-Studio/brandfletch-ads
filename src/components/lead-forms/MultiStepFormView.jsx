import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Sparkles, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function MultiStepFormView({ form, onSubmit }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fields = form?.fields || [];
  const totalSteps = fields.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const currentField = fields[currentStep];

  const updateFieldValue = (value) => {
    setFormData({ ...formData, [currentField.field_name]: value });
  };

  const handleNext = async () => {
    if (currentField.required && !formData[currentField.field_name]) {
      toast.error(`${currentField.label} is required`);
      return;
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      toast.success('Form submitted successfully!');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = () => {
    if (!currentField) return null;

    const fieldProps = {
      value: formData[currentField.field_name] || '',
      onChange: (e) => updateFieldValue(e.target.value),
      placeholder: currentField.placeholder || '',
    };

    switch (currentField.field_type) {
      case 'textarea':
        return (
          <Textarea
            {...fieldProps}
            className="text-lg min-h-[120px]"
            autoFocus
          />
        );

      case 'dropdown':
        return (
          <Select
            value={formData[currentField.field_name] || ''}
            onValueChange={updateFieldValue}
          >
            <SelectTrigger className="text-lg py-6">
              <SelectValue placeholder={currentField.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {(currentField.options || []).map((option, idx) => (
                <SelectItem key={idx} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <div className="space-y-3">
            {(currentField.options || []).map((option, idx) => (
              <div key={idx} className="flex items-center space-x-3">
                <input
                  type="radio"
                  id={`radio-${idx}`}
                  name={currentField.field_name}
                  value={option}
                  checked={formData[currentField.field_name] === option}
                  onChange={(e) => updateFieldValue(e.target.value)}
                  className="w-5 h-5"
                />
                <Label htmlFor={`radio-${idx}`} className="text-base cursor-pointer flex-1">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-3">
            {(currentField.options || []).map((option, idx) => (
              <div key={idx} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id={`checkbox-${idx}`}
                  value={option}
                  checked={(formData[currentField.field_name] || []).includes(option)}
                  onChange={(e) => {
                    const current = formData[currentField.field_name] || [];
                    if (e.target.checked) {
                      updateFieldValue([...current, option]);
                    } else {
                      updateFieldValue(current.filter(o => o !== option));
                    }
                  }}
                  className="w-5 h-5"
                />
                <Label htmlFor={`checkbox-${idx}`} className="text-base cursor-pointer flex-1">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'date':
        return (
          <Input
            type="date"
            {...fieldProps}
            className="text-lg py-6"
            autoFocus
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            {...fieldProps}
            className="text-lg py-6"
            autoFocus
          />
        );

      case 'email':
        return (
          <Input
            type="email"
            {...fieldProps}
            className="text-lg py-6"
            autoFocus
          />
        );

      case 'phone':
        return (
          <Input
            type="tel"
            {...fieldProps}
            className="text-lg py-6"
            autoFocus
          />
        );

      case 'url':
        return (
          <Input
            type="url"
            {...fieldProps}
            className="text-lg py-6"
            autoFocus
          />
        );

      case 'file':
        return (
          <Input
            type="file"
            onChange={(e) => updateFieldValue(e.target.files[0])}
            className="text-lg"
          />
        );

      default:
        return (
          <Input
            {...fieldProps}
            className="text-lg py-6"
            autoFocus
          />
        );
    }
  };

  if (fields.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No fields available</p>
      </div>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-2xl border-2">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-muted-foreground">
              Question {currentStep + 1} of {totalSteps}
            </span>
          </div>
          <div className="text-sm font-medium text-purple-600">
            {Math.round(progress)}% Complete
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-xl font-semibold">
            {currentField?.label}
            {currentField?.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {renderField()}
        </div>

        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          <Button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting || (currentField.required && !formData[currentField.field_name])}
            className="gap-2 bg-purple-600 hover:bg-purple-700"
          >
            {currentStep === totalSteps - 1 ? (
              <>
                Submit
                <Check className="w-4 h-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}