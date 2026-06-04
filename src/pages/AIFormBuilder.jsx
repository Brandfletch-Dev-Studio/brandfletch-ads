import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Wand2, Loader2, CheckCircle, AlertCircle, User, Mail, Phone, FileText, Building2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function AIFormBuilder() {
  const [prompt, setPrompt] = useState('');
  const [generatedForm, setGeneratedForm] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateFormMutation = useMutation({
    mutationFn: async (userPrompt) => {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert form builder. Based on this user request, generate a complete lead capture form with appropriate fields.
        
User Request: "${userPrompt}"

Generate a JSON response with this exact structure:
{
  "form_name": "Appropriate form name",
  "form_type": "contact|quote_request|consultation|lead_generation|custom",
  "fields": [
    {
      "field_name": "field_1",
      "field_type": "text|email|phone|textarea|dropdown|checkbox|radio",
      "label": "Field Label",
      "placeholder": "Placeholder text",
      "required": true|false,
      "options": ["option1", "option2"] // only for dropdown/radio
    }
  ],
  "success_message": "Thank you message"
}

Rules:
- Include only relevant fields for the requested form type
- Use appropriate field types (email for email, phone for phone numbers, etc.)
- Make required fields truly necessary
- Keep it concise but comprehensive

Respond with ONLY the JSON, no explanation.`,
        response_json_schema: {
          type: "object",
          properties: {
            form_name: { type: "string" },
            form_type: { type: "string" },
            fields: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field_name: { type: "string" },
                  field_type: { type: "string" },
                  label: { type: "string" },
                  placeholder: { type: "string" },
                  required: { type: "boolean" },
                  options: { type: "array", items: { type: "string" } }
                },
                required: ["field_name", "field_type", "label", "required"]
              }
            },
            success_message: { type: "string" }
          },
          required: ["form_name", "form_type", "fields", "success_message"]
        }
      });
      return response.data;
    },
    onSuccess: (data) => {
      setGeneratedForm(data);
      toast.success('Form generated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to generate form. Please try again.');
      console.error(error);
    }
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error('Please describe the form you need');
      return;
    }
    setLoading(true);
    generateFormMutation.mutate(prompt, {
      onSettled: () => setLoading(false)
    });
  };

  const handleSave = async () => {
    try {
      const user = await base44.auth.me();
      await base44.entities.LeadForm.create({
        ...generatedForm,
        user_id: user.id,
        is_active: true
      });
      toast.success('Form created successfully!');
      setGeneratedForm(null);
      setPrompt('');
    } catch (error) {
      toast.error('Failed to save form');
      console.error(error);
    }
  };

  const FIELD_ICONS = {
    text: User,
    email: Mail,
    phone: Phone,
    textarea: FileText,
    dropdown: Building2,
    checkbox: CheckCircle,
    radio: Sparkles,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white rounded-b-3xl shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Wand2 className="w-8 h-8" />
                </div>
                <h1 className="text-4xl font-bold">AI Form Builder</h1>
              </div>
              <p className="text-xl text-purple-100 max-w-2xl">
                Describe your ideal form in plain English, and our AI will build it instantly with smart field suggestions.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white/10 backdrop-blur-sm border-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/30 rounded-lg">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">AI</p>
                      <p className="text-sm text-purple-100">Powered</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/30 rounded-lg">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">Fast</p>
                      <p className="text-sm text-purple-100">Generation</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
        {!generatedForm ? (
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Wand2 className="w-5 h-5 text-purple-600" />
                Describe Your Form
              </CardTitle>
              <CardDescription>
                Tell us what kind of form you need. Be specific about the information you want to collect.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="prompt">Form Description</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., I need a form to collect leads for my real estate business. I want to capture their name, email, phone number, property type they're interested in, budget range, and when they're looking to buy."
                  className="min-h-[120px]"
                />
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={loading || !prompt.trim()}
                className="gap-2 min-w-[150px]"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Form
                  </>
                )}
              </Button>

              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                <h4 className="font-semibold mb-2 text-sm flex items-center gap-2 text-purple-800">
                  <Sparkles className="w-4 h-4" />
                  Examples:
                </h4>
                <ul className="text-sm text-purple-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>"I need a school admission form with student details, parent information, and grade selection"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>"Create a consultation booking form for my law firm with case type, preferred date, and description"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>"I need an event registration form with attendee info, ticket type, and dietary requirements"</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Form Generated: {generatedForm.form_name}
                    </CardTitle>
                    <CardDescription>Review and customize before saving</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setGeneratedForm(null)}>
                      Start Over
                    </Button>
                    <Button onClick={handleSave} size="lg" className="gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Save Form
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Form Type</Label>
                    <p className="font-medium capitalize">{generatedForm.form_type.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Total Fields</Label>
                    <p className="font-medium">{generatedForm.fields.length}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">Form Fields</Label>
                  <div className="space-y-2">
                    {generatedForm.fields.map((field, index) => {
                      const Icon = FIELD_ICONS[field.field_type] || FileText;
                      return (
                        <Card key={index} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Icon className="w-4 h-4 text-purple-600" />
                                  <span className="font-medium">{field.label}</span>
                                  {field.required && (
                                    <Badge variant="destructive" className="text-xs">Required</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Type: <span className="capitalize">{field.field_type.replace('_', ' ')}</span>
                                  {field.placeholder && ` • Placeholder: "${field.placeholder}"`}
                                </p>
                                {field.options && field.options.length > 0 && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Options: {field.options.join(', ')}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs font-mono bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                {field.field_type}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {generatedForm.success_message && (
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Success Message</Label>
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-3">
                        <p className="text-sm text-green-800">{generatedForm.success_message}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Tip: You can further customize this form after saving</p>
                    <p>Once saved, you can edit fields, add SEO meta tags, configure webhooks, and set up email notifications from the Lead Forms dashboard.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}