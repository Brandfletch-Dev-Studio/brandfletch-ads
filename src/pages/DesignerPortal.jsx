import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette, Clock, CheckCircle2, MessageSquare, Download, Upload, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import DesignChatComponent from '@/components/designs/DesignChatComponent';
import DesignStatusTimeline from '@/components/designs/DesignStatusTimeline';

const STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'awaiting_feedback', label: 'Awaiting Client Feedback' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
];

const STATUS_COLORS = {
  submitted: 'bg-blue-100 text-blue-700', under_review: 'bg-indigo-100 text-indigo-700',
  assigned: 'bg-purple-100 text-purple-700', in_progress: 'bg-amber-100 text-amber-700',
  awaiting_feedback: 'bg-orange-100 text-orange-700', revision_requested: 'bg-red-100 text-red-700',
  approved: 'bg-teal-100 text-teal-700', delivered: 'bg-green-100 text-green-700',
  completed: 'bg-green-100 text-green-700',
};

export default function DesignerPortal() {
  useRoleGuard(['admin', 'super_admin', 'ads_manager', 'campaign_manager', 'creative_ops_director', 'designer']);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [designerNotes, setDesignerNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: requests, isLoading } = useQuery({
    queryKey: ['designerRequests'],
    queryFn: () => base44.entities.DesignRequest.filter({ designer_id: user?.id }, '-created_date'),
    enabled: !!user,
    initialData: [],
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DesignRequest.update(id, data),
  });

  const handleStatusChange = (newStatus) => {
    updateMutation.mutate({ id: selectedRequest.id, data: { status: newStatus } });
  };

  const handleSaveNotes = () => {
    updateMutation.mutate({ id: selectedRequest.id, data: { designer_notes: designerNotes } });
  };

  const handleUploadFiles = async (e, type) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const results = await Promise.all(files.map(f => base44.integrations.Core.UploadFile({ file: f })));
    const urls = results.map(r => r.file_url);
    const field = type === 'draft' ? 'draft_files' : 'deliverable_files';
    const newStatus = type === 'deliverable' ? 'awaiting_feedback' : selectedRequest.status;
    const existing = selectedRequest[field] || [];
    updateMutation.mutate({ id: selectedRequest.id, data: { [field]: [...existing, ...urls], status: newStatus } });
    setUploading(false);
    toast.success(`${urls.length} file(s) uploaded`);
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'submitted').length,
    inProgress: requests.filter(r => ['in_progress', 'under_review', 'assigned'].includes(r.status)).length,
    awaitingFeedback: requests.filter(r => r.status === 'awaiting_feedback').length,
    completed: requests.filter(r => ['completed', 'delivered'].includes(r.status)).length,
  };

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  return (
    <div className="p-[15px] space-y-6">
      {!selectedRequest ? (
        <>
          <div>
            <h1 className="text-2xl font-bold font-heading">Designer Portal</h1>
            <p className="text-muted-foreground">Manage your design projects</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total', value: stats.total, color: 'bg-blue-100 text-blue-700' },
              { label: 'Pending', value: stats.pending, color: 'bg-amber-100 text-amber-700' },
              { label: 'In Progress', value: stats.inProgress, color: 'bg-purple-100 text-purple-700' },
              { label: 'Completed', value: stats.completed, color: 'bg-green-100 text-green-700' },
            ].map(s => (
              <Card key={s.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center`}>
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Assigned Projects</h2>
            {requests.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground"><Palette className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>No projects assigned yet</p></CardContent></Card>
            ) : (
              requests.map(request => (
                <Card key={request.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedRequest(request); setDesignerNotes(request.designer_notes || ''); }}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{request.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {request.design_type?.replace(/_/g, ' ')} • Priority: {request.priority}
                          {request.due_date && ` • Due ${new Date(request.due_date).toLocaleDateString()}`}
                        </p>
                      </div>
                      <Badge className={STATUS_COLORS[request.status] || 'bg-gray-100 text-gray-700'}>
                        {request.status?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Revisions: {request.revision_count || 0}/{request.max_revisions || 2}
                      {request.revision_comments && <span className="ml-2 text-red-600 font-medium">• Revision feedback pending</span>}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <Button variant="outline" onClick={() => setSelectedRequest(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Panel */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{selectedRequest.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{selectedRequest.design_type?.replace(/_/g, ' ')} • {selectedRequest.priority} priority</p>
                    </div>
                    <Select value={selectedRequest.status} onValueChange={handleStatusChange}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium text-sm mb-1">Description</p>
                    <p className="text-sm text-muted-foreground">{selectedRequest.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {selectedRequest.brand_name && <div><span className="text-muted-foreground">Brand:</span> <span className="font-medium">{selectedRequest.brand_name}</span></div>}
                    {selectedRequest.target_audience && <div><span className="text-muted-foreground">Audience:</span> <span className="font-medium">{selectedRequest.target_audience}</span></div>}
                    {selectedRequest.preferred_style && <div><span className="text-muted-foreground">Style:</span> <span className="font-medium">{selectedRequest.preferred_style}</span></div>}
                    {selectedRequest.preferred_dimensions && <div><span className="text-muted-foreground">Dimensions:</span> <span className="font-medium">{selectedRequest.preferred_dimensions}</span></div>}
                    {selectedRequest.due_date && <div><span className="text-muted-foreground">Due:</span> <span className="font-medium">{new Date(selectedRequest.due_date).toLocaleDateString()}</span></div>}
                  </div>
                  {selectedRequest.special_instructions && (
                    <div className="p-3 bg-muted/40 rounded-lg text-sm">
                      <p className="font-medium mb-1">Special Instructions</p>
                      <p className="text-muted-foreground">{selectedRequest.special_instructions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Revision Comments from client */}
              {selectedRequest.revision_comments && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <p className="font-medium text-red-900 mb-1">Client Revision Request</p>
                    <p className="text-sm text-red-700">{selectedRequest.revision_comments}</p>
                  </CardContent>
                </Card>
              )}

              {/* File Management */}
              <Card>
                <CardHeader><CardTitle className="text-base">File Management</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {selectedRequest.reference_files?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Client Reference Files</p>
                      {selectedRequest.reference_files.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline mb-1">
                          <Download className="w-3 h-3" /> Reference {i + 1}
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <label className="cursor-pointer">
                      <input type="file" multiple className="hidden" onChange={e => handleUploadFiles(e, 'draft')} />
                      <Button asChild variant="outline" size="sm" disabled={uploading}>
                        <span><Upload className="w-4 h-4 mr-2" />Upload Draft</span>
                      </Button>
                    </label>
                    <label className="cursor-pointer">
                      <input type="file" multiple className="hidden" onChange={e => handleUploadFiles(e, 'deliverable')} />
                      <Button asChild size="sm" disabled={uploading}>
                        <span><CheckCircle2 className="w-4 h-4 mr-2" />Deliver Final Files</span>
                      </Button>
                    </label>
                  </div>

                  {uploading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" />Uploading...</div>}

                  {selectedRequest.draft_files?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Draft Files ({selectedRequest.draft_files.length})</p>
                      {selectedRequest.draft_files.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline mb-1">
                          <Download className="w-3 h-3" /> Draft {i + 1}
                        </a>
                      ))}
                    </div>
                  )}

                  {selectedRequest.deliverable_files?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 text-green-700">Delivered Files ({selectedRequest.deliverable_files.length})</p>
                      {selectedRequest.deliverable_files.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-green-700 hover:underline mb-1">
                          <Download className="w-3 h-3" /> Final {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Designer Notes */}
              <Card>
                <CardHeader><CardTitle className="text-base">Designer Notes</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Textarea value={designerNotes} onChange={e => setDesignerNotes(e.target.value)} placeholder="Notes visible to client and admin..." className="min-h-[80px]" />
                  <Button size="sm" onClick={handleSaveNotes} disabled={updateMutation.isPending}>Save Notes</Button>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Project Timeline</CardTitle></CardHeader>
                <CardContent><DesignStatusTimeline currentStatus={selectedRequest.status} /></CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="w-4 h-4" />Project Chat</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setShowChat(!showChat)}>{showChat ? 'Hide' : 'Show'}</Button>
                  </div>
                </CardHeader>
                {showChat && <CardContent><DesignChatComponent designRequestId={selectedRequest.id} /></CardContent>}
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}