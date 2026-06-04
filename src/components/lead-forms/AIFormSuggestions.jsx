import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function AIFormSuggestions({ formType, onSuggestionsReady }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [customRequest, setCustomRequest] = useState('');
  const [generatedFields, setGeneratedFields] = useState(null);

  const handleGenerateSuggestions = async () => {
    setIsGenerating(true);
    try {
      const response = await base44.functions.invoke('generateFormFields', {
        form_type: formType,
        custom_request: customRequest
      });
      
      if (response.data.fields && response.data.fields.length > 0) {
        setGeneratedFields(response.data.fields);
        toast.success('AI suggestions generated successfully!');
      } else {
        toast.error('No suggestions generated. Please try again.');
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast.error('Failed to generate suggestions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptSuggestions = () => {
    if (generatedFields) {
      onSuggestionsReady(generatedFields);
      toast.success('Suggestions applied to form!');
    }
  };

  const handleRejectSuggestions = () => {
    setGeneratedFields(null);
    setCustomRequest('');
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <Sparkles className="w-5 h-5 text-purple-600" />
          AI-Powered Field Suggestions
        </CardTitle>
        <CardDescription>
          Let AI suggest the best fields for your {formType.replace('_', ' ')} form
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!generatedFields ? (
          <>
            <div>
              <Label htmlFor="custom_request">Additional Requirements (Optional)</Label>
              <Textarea
                id="custom_request"
                value={customRequest}
                onChange={(e) => setCustomRequest(e.target.value)}
                placeholder="e.g., I need to collect business information, budget range, and preferred contact time..."
                rows={3}
                className="resize-none"
              />
            </div>
            <Button
              onClick={handleGenerateSuggestions}
              disabled={isGenerating}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Suggestions...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate AI Suggestions
                </>
              )}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-purple-200 p-4">
              <h4 className="font-medium text-purple-900 mb-3">
                Generated Fields ({generatedFields.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {generatedFields.map((field, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-purple-50 rounded">
                    <div>
                      <p className="font-medium text-sm">{field.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {field.field_type} {field.required && '• Required'}
                      </p>
                    </div>
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAcceptSuggestions}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Use These Fields
              </Button>
              <Button
                onClick={handleRejectSuggestions}
                variant="outline"
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}