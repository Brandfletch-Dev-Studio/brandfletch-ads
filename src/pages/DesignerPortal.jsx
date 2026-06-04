import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette, Clock, CheckCircle2, MessageSquare, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import DesignChatComponent from '@/components/designs/DesignChatComponent';

export default function DesignerPortal() {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: requests, isLoading } = useQuery({
    queryKey: ['designerRequests'],
    queryFn: () => base44.entities.DesignRequest.filter({ designer_id: user?.id }, '-created_date'),
    enabled: !!user,
    initialData: [],
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DesignRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designerRequests'] });
      toast.success('Updated!');
    },
  });

  const handleStatusUpdate = (request, newStatus) => {
    updateRequestMutation.mutate({
      id: request.id,
      data: { status: newStatus },
    });
  };

  const handleDeliverFiles = async (e, request) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const uploadPromises = files.map(f => base44.integrations.Core.UploadFile({ file: f }));
    const results = await Promise.all(uploadPromises);
    const fileUrls = results.map(r => r.file_url);

    updateRequestMutation.mutate({
      id: request.id,
      data: {
        deliverable_files: [...(request.deliverable_files || []), ...fileUrls],
        status: 'delivered',
      },
    });
    toast.success('Files delivered!');
  };

  const stats = {
    total: requests.length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => ['completed', 'delivered'].includes(r.status)).length,
    pending: requests.filter(r => r.status === 'submitted').length,
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-[15px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Designer Portal</h1>
          <p className="text-muted-foreground">Manage your design projects</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Palette className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
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
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Palette className="w-5 h-5 text-purple-700" />
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
                <CheckCircle2 className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      {!selectedRequest ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Assigned Projects</h2>
          {requests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Palette className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No projects assigned yet</p>
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
                        {request.design_type.replace('_', ' ')} • Priority: {request.priority}
                      </p>
                    </div>
                    <Badge className={
                      request.status === 'completed' || request.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      request.status === 'submitted' ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {request.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>
                  <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                    {request.due_date && <span>Due: {new Date(request.due_date).toLocaleDateString()}</span>}
                    {request.revision_count !== undefined && <span>Revisions: {request.revision_count}/{request.max_revisions}</span>}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <Button variant="outline" onClick={() => setSelectedRequest(null)}>
            ← Back to Projects
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedRequest.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Priority:</span>
                    <span className="ml-2 font-medium">{selectedRequest.priority}</span>
                  </div>
                  {selectedRequest.due_date && (
                    <div>
                      <span className="text-muted-foreground">Due:</span>
                      <span className="ml-2 font-medium">{new Date(selectedRequest.due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                {selectedRequest.reference_files?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Reference Files</h4>
                    <div className="space-y-1">
                      {selectedRequest.reference_files.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block text-sm text-primary hover:underline">
                          Reference {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {selectedRequest.deliverable_files?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Delivered Files</h4>
                    <div className="space-y-1">
                      {selectedRequest.deliverable_files.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block text-sm text-primary hover:underline">
                          Delivery {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {selectedRequest.status === 'submitted' && (
                    <Button onClick={() => handleStatusUpdate(selectedRequest, 'in_progress')}>
                      Start Working
                    </Button>
                  )}
                  {selectedRequest.status === 'in_progress' && (
                    <>
                      <Button onClick={() => handleStatusUpdate(selectedRequest, 'revision_requested')}>
                        Request Revision
                      </Button>
                      <label className="cursor-pointer">
                        <input type="file" multiple className="hidden" onChange={(e) => handleDeliverFiles(e, selectedRequest)} />
                        <Button asChild>
                          <span>Deliver Files</span>
                        </Button>
                      </label>
                    </>
                  )}
                  {selectedRequest.status === 'revision_requested' && (
                    <Button onClick={() => handleStatusUpdate(selectedRequest, 'in_progress')}>
                      Mark as In Progress
                    </Button>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowChat(!showChat)}
                  className="w-full"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {showChat ? 'Hide Chat' : 'Open Project Chat'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Chat */}
          {showChat && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Project Chat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DesignChatComponent designRequestId={selectedRequest.id} />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}