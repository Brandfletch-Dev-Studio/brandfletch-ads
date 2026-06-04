import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit2, Copy, ExternalLink, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function FormPreview({ form, onClose, onEdit }) {
  const formUrl = `${window.location.origin}/forms/${form.id}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold">Form Preview</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEdit} className="gap-2">
            <Edit2 className="w-4 h-4" />
            Edit
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>{form.form_name}</CardTitle>
          <CardDescription>Live preview of your form</CardDescription>
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

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Form URL
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input value={formUrl} readOnly className="font-mono text-sm bg-muted/50" />
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
        <Card className="shadow-lg border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-green-800">
              <FileText className="w-4 h-4" />
              SEO Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-green-700 font-semibold mb-1">Meta Title</p>
              <p className="text-sm font-medium text-green-900">{form.meta_title}</p>
            </div>
            {form.meta_description && (
              <div>
                <p className="text-xs text-green-700 font-semibold mb-1">Meta Description</p>
                <p className="text-sm text-green-800">{form.meta_description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}