import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Palette, Upload, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

const DESIGN_TYPES = {
  social_media_post: 'Social Media Post',
  facebook_ad: 'Facebook Ad',
  instagram_story: 'Instagram Story',
  logo: 'Logo Design',
  banner: 'Banner',
  flyer: 'Flyer',
  business_card: 'Business Card',
  other: 'Other',
};

export default function DesignerPortal() {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: requests, isLoading } = useQuery({
    queryKey: ['designerRequests'],
    queryFn: () => base44.entities.DesignRequest.filter({ designer_id: user?.id }),
    enabled: !!user,
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DesignRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designerRequests'] });
      toast.success('Updated!');
    },
  });

  const stats = {
    total: requests?.length || 0,
    inProgress: requests?.filter(r => r.status === 'in_progress').length || 0,
    pending: requests?.filter(r => r.status === 'submitted').length || 0,
    completed: requests?.filter(r => ['completed', 'delivered'].includes(r.status)).length || 0,
  };

  if (selectedRequest) {
    return (
      <RequestDetail
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onUpdate={(data) => updateRequestMutation.mutate({ id: selectedRequest.id, data })}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Designer Dashboard</h1>
        <p className="text-muted-foreground">Manage your design projects</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Palette className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Assigned</p>
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
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Palette className="w-5 h-5 text-blue-700" />
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
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : requests?.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Palette className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No design requests assigned to you</p>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id} className="cursor-pointer hover:shadow-md" onClick={() => setSelectedRequest(request)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{request.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {DESIGN_TYPES[request.design_type]} • Client: {request.user_id}
                    </p>
                  </div>
                  <Badge className={
                    request.status === 'completed' || request.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-amber-100 text-amber-800'
                  }>
                    {request.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>
                <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                  {request.due_date && <span>Due: {new Date(request.due_date).toLocaleDateString()}</span>}
                  {request.priority && <span>Priority: {request.priority}</span>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function RequestDetail({ request, onClose, onUpdate }) {
  const [notes, setNotes] = useState(request.designer_notes || '');
  const [deliverableUrl, setDeliverableUrl] = useState('');

  const handleSaveNotes = () => {
    onUpdate({ designer_notes: notes });
  };

  const handleDeliver = () => {
    if (!deliverableUrl) {
      toast.error('Please add a file URL');
      return;
    }
    onUpdate({
      deliverable_files: [...(request.deliverable_files || []), deliverableUrl],
      status: 'completed',
      completed_date: new Date().toISOString(),
    });
    setDeliverableUrl('');
  };

  const handleStartWork = () => {
    onUpdate({ status: 'in_progress' });
  };

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={onClose}>
        ← Back to Requests
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{request.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {DESIGN_TYPES[request.design_type]} • {request.request_type === 'retainer' ? 'Retainer' : 'Per Design'}
              </p>
            </div>
            <Badge className={
              request.status === 'completed' || request.status === 'delivered' ? 'bg-green-100 text-green-800' :
              request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
              'bg-amber-100 text-amber-800'
            }>
              {request.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-2">Description</h4>
            <p className="text-sm text-muted-foreground">{request.description}</p>
          </div>

          {request.client_notes && (
            <div>
              <h4 className="font-semibold mb-2">Client Notes</h4>
              <p className="text-sm text-muted-foreground">{request.client_notes}</p>
            </div>
          )}

          <div>
            <h4 className="font-semibold mb-2">Your Notes</h4>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
              placeholder="Add internal notes..."
            />
            <Button size="sm" className="mt-2" onClick={handleSaveNotes}>
              Save Notes
            </Button>
          </div>

          {request.status === 'submitted' && (
            <Button onClick={handleStartWork}>
              Start Working
            </Button>
          )}

          {request.status === 'in_progress' && (
            <div>
              <h4 className="font-semibold mb-2">Deliver File URL</h4>
              <div className="flex gap-2">
                <Input
                  value={deliverableUrl}
                  onChange={(e) => setDeliverableUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1"
                />
                <Button onClick={handleDeliver}>
                  <Upload className="w-4 h-4 mr-2" />
                  Deliver
                </Button>
              </div>
            </div>
          )}

          {request.deliverable_files && request.deliverable_files.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Delivered Files</h4>
              <div className="space-y-2">
                {request.deliverable_files.map((file, idx) => (
                  <a key={idx} href={file} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline block">
                    📄 Download File {idx + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Priority:</span>
              <span className="ml-2 font-medium">{request.priority}</span>
            </div>
            {request.due_date && (
              <div>
                <span className="text-muted-foreground">Due Date:</span>
                <span className="ml-2 font-medium">{new Date(request.due_date).toLocaleDateString()}</span>
              </div>
            )}
            {request.submitted_date && (
              <div>
                <span className="text-muted-foreground">Submitted:</span>
                <span className="ml-2 font-medium">{new Date(request.submitted_date).toLocaleDateString()}</span>
              </div>
            )}
            {request.completed_date && (
              <div>
                <span className="text-muted-foreground">Completed:</span>
                <span className="ml-2 font-medium">{new Date(request.completed_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}