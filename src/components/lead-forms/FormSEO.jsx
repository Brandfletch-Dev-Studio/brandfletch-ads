import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Globe } from 'lucide-react';

export default function FormSEO({ formData, onChange }) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" />
          SEO & Social Media
        </CardTitle>
        <CardDescription>Optimize your form for search engines and social sharing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="meta_title">Meta Title</Label>
            <Input
              id="meta_title"
              value={formData.meta_title}
              onChange={(e) => onChange({ meta_title: e.target.value })}
              placeholder="Form title for search engines"
            />
          </div>
          <div>
            <Label htmlFor="meta_keywords">Meta Keywords</Label>
            <Input
              id="meta_keywords"
              value={formData.meta_keywords}
              onChange={(e) => onChange({ meta_keywords: e.target.value })}
              placeholder="keyword1, keyword2, keyword3"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="meta_description">Meta Description</Label>
          <Textarea
            id="meta_description"
            value={formData.meta_description}
            onChange={(e) => onChange({ meta_description: e.target.value })}
            placeholder="Brief description for search engines"
            rows={2}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="og_title">Social Media Title</Label>
            <Input
              id="og_title"
              value={formData.og_title}
              onChange={(e) => onChange({ og_title: e.target.value })}
              placeholder="Title for social sharing"
            />
          </div>
          <div>
            <Label htmlFor="og_description">Social Media Description</Label>
            <Textarea
              id="og_description"
              value={formData.og_description}
              onChange={(e) => onChange({ og_description: e.target.value })}
              placeholder="Description for social sharing"
              rows={2}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}