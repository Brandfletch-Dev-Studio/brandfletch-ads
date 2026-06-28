import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const DESIGN_TYPES = [
  { value: 'social_media_post', label: 'Social Media Post' },
  { value: 'facebook_ad', label: 'Facebook Ad' },
  { value: 'instagram_story', label: 'Instagram Story' },
  { value: 'logo', label: 'Logo Design' },
  { value: 'banner', label: 'Banner' },
  { value: 'flyer', label: 'Flyer' },
  { value: 'business_card', label: 'Business Card' },
  { value: 'other', label: 'Other' },
];

export default function DesignRequestForm({ onSuccess }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    design_type: 'social_media_post',
    request_type: 'per_design',
    priority: 'medium',
    due_date: '',
    client_notes: '',
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data) => {
      const request = await base44.entities.DesignRequest.create({
        ...data,
        user_id: user.id,
        status: 'draft',
        revision_count: 0,
        currency: 'USD',
      });
      return request;
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error('Please fill in title and description');
      return;
    }
    createRequestMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Design Request</CardTitle>
        <CardDescription>Fill in the details below to request a design</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Instagram Post for Product Launch"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what you need designed..."
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="design_type">Design Type</Label>
              <Select
                value={formData.design_type}
                onValueChange={(value) => setFormData({ ...formData, design_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DESIGN_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="request_type">Request Type</Label>
              <Select
                value={formData.request_type}
                onValueChange={(value) => setFormData({ ...formData, request_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_design">Per Design</SelectItem>
                  <SelectItem value="retainer">Retainer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="due_date">Due Date (optional)</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="client_notes">Additional Notes</Label>
            <Textarea
              id="client_notes"
              value={formData.client_notes}
              onChange={(e) => setFormData({ ...formData, client_notes: e.target.value })}
              placeholder="Any specific requirements, brand guidelines, or inspiration..."
              className="min-h-[80px]"
            />
          </div>

          <Button type="submit" disabled={createRequestMutation.isPending}>
            {createRequestMutation.isPending ? 'Creating...' : 'Create Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}