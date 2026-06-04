import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette, Plus, Clock, CheckCircle, AlertCircle, FileText } from 'lucide-react';
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

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-800' },
  revision_requested: { label: 'Revision Requested', color: 'bg-orange-100 text-orange-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  delivered: { label: 'Delivered', color: 'bg-purple-100 text-purple-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
};

export default function Designs() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    title: '',
    design_type: '',
    request_type: 'per_design',
    description: '',
    due_date: '',
  });

  const queryClient = useQueryClient();

  const { data: designRequests, isLoading } = useQuery({
    queryKey: ['designRequests'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return [];
      return base44.entities.DesignRequest.filter({ user_id: user.id });
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.DesignRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designRequests'] });
      setIsDialogOpen(false);
      setNewRequest({ title: '', design_type: '', request_type: 'per_design', description: '', due_date: '' });
      toast.success('Design request submitted!');
    },
  });

  const handleSubmit = () => {
    if (!newRequest.title || !newRequest.design_type) {
      toast.error('Please fill in required fields');
      return;
    }
    createRequestMutation.mutate({
      ...newRequest,
      status: 'submitted',
      submitted_date: new Date().toISOString(),
    });
  };

  const stats = {
    total: designRequests?.length || 0,
    inProgress: designRequests?.filter(r => r.status === 'in_progress').length || 0,
    completed: designRequests?.filter(r => r.status === 'completed' || r.status === 'delivered').length || 0,
    pending: designRequests?.filter(r => r.status === 'submitted' || r.status === 'draft').length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Design Requests</h1>
          <p className="text-muted-foreground">Request professional designs for your business</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Design Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Request Title *</Label>
                <Input
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                  placeholder="e.g., Instagram Post for Product Launch"
                />
              </div>
              <div>
                <Label>Design Type *</Label>
                <Select
                  value={newRequest.design_type}
                  onValueChange={(value) => setNewRequest({ ...newRequest, design_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select design type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DESIGN_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Request Type</Label>
                <Select
                  value={newRequest.request_type}
                  onValueChange={(value) => setNewRequest({ ...newRequest, request_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retainer">Design Retainer</SelectItem>
                    <SelectItem value="per_design">Per Design</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  placeholder="Describe your design requirements, brand guidelines, colors, etc."
                  className="h-24"
                />
              </div>
              <div>
                <Label>Due Date (Optional)</Label>
                <Input
                  type="date"
                  value={newRequest.due_date}
                  onChange={(e) => setNewRequest({ ...newRequest, due_date: e.target.value })}
                />
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={createRequestMutation.isPending}>
                Submit Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Palette className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Design Requests List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Your Requests</h2>
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : designRequests?.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Palette className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No design requests yet. Create your first request!</p>
            </CardContent>
          </Card>
        ) : (
          designRequests?.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{request.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {DESIGN_TYPES.find(t => t.value === request.design_type)?.label} • {request.request_type === 'retainer' ? 'Retainer' : 'Per Design'}
                    </p>
                  </div>
                  <Badge className={STATUS_CONFIG[request.status]?.color}>
                    {STATUS_CONFIG[request.status]?.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{request.description}</p>
                {request.due_date && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Due: {new Date(request.due_date).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}