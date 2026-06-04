import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Wand2, Check, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AIFormBuilder({ formType, onFieldsGenerated, onSkip }) {
  const [customRequest, setCustomRequest] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFields, setGeneratedFields] = useState(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await base44.functions.invoke('generateFormFields', {
        form_type: formType,
        custom_request: customRequest
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      setGeneratedFields(response.data.fields);
      toast.success('Fields generated successfully!');
    } catch (error) {
      console.error('Error generating fields:', error);
      toast.error('Failed to generate fields. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAccept = () => {
    if (generatedFields) {
      onFieldsGenerated(generatedFields);
    }
  };

  const handleRegenerate = () => {
    setGeneratedFields(null);
    setCustomRequest('');
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Wand2 className="w-5 h-5" />
          AI-Powered Form Builder
        </CardTitle>
        <CardDescription>
          Let AI suggest the best fields for your {formType?.replace('_', ' ')} form
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!generatedFields ? (
          <>
            <div>
              <Label htmlFor="custom_request">Describe Your Form (Optional)</Label>
              <Textarea
                id="custom_request"
                value={customRequest}
                onChange={(e) => setCustomRequest(e.target.value)}
                placeholder="e.g., I need a form for collecting event registrations with dietary requirements and t-shirt sizes..."
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                The more details you provide, the better the suggestions will be
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1 bg-purple-600 hover:bg-purple-700 gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Fields with AI
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onSkip}
              >
                Skip, Build Manually
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-purple-800">Generated Fields</h4>
                <span className="text-sm text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                  {generatedFields.length} fields
                </span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {generatedFields.map((field, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700">{field.label}</span>
                    <span className="text-xs text-gray-500">({field.field_type})</span>
                    {field.required && (
                      <span className="text-xs text-red-500">*</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleAccept}
                className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
              >
                <Check className="w-4 h-4" />
                Accept & Edit Fields
              </Button>
              <Button
                onClick={handleRegenerate}
                variant="outline"
                className="gap-2"
              >
                <Wand2 className="w-4 h-4" />
                Regenerate
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              You can edit, add, or remove fields after accepting
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}