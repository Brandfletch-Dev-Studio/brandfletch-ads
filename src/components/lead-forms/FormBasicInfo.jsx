import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Settings } from 'lucide-react';

const FORM_CATEGORIES = [
  { value: 'contact', label: 'Contact Form' },
  { value: 'quote_request', label: 'Quote Request' },
  { value: 'consultation', label: 'Consultation Booking' },
  { value: 'lead_generation', label: 'Lead Generation' },
  { value: 'newsletter', label: 'Newsletter Signup' },
  { value: 'custom', label: 'Custom' },
];

export default function FormBasicInfo({ formData, onChange }) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          Basic Information
        </CardTitle>
        <CardDescription>Configure the fundamental settings of your form</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="form_name">Form Name *</Label>
          <Input
            id="form_name"
            value={formData.form_name}
            onChange={(e) => onChange({ form_name: e.target.value })}
            placeholder="e.g., Contact Us Form"
            required
          />
        </div>
        <div>
          <Label htmlFor="form_type">Form Type</Label>
          <Select
            value={formData.form_type}
            onValueChange={(value) => onChange({ form_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORM_CATEGORIES.map((type) => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}