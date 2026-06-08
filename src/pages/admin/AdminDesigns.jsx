import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Palette, Search, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'awaiting_feedback', label: 'Awaiting Feedback' },
  { value: 'revision_requested', label: 'Revision Requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const DESIGN_TYPES = [
  { value: 'social_media_post', label: 'Social Media Post' },
  { value: 'flyer', label: 'Flyer' },
  { value: 'poster', label: 'Poster' },
  { value: 'logo', label: 'Logo Design' },
  { value: 'banner', label: 'Banner' },
  { value: 'business_card', label: 'Business Card' },
  { value: 'brochure', label: 'Brochure' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'custom', label: 'Custom Design' },
  { value: 'other', label: 'Other' },
];

export default function AdminDesigns() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const queryClient = useQueryClient();

  const { data: designRequests, isLoading } = useQuery({
    queryKey: ['adminDesignRequests'],
    queryFn: () => base44.entities.DesignRequest.list(),
  });

  const { data: designers } = useQuery({
    queryKey: ['designers'],
    queryFn: () => base44.entities.User.filter({ role: 'designer' }),
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DesignRequest.update(id, data),
  });

  const filteredRequests = designRequests?.filter(request => {
    const matchesSearch = request.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.user_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: designRequests?.length || 0,
    submitted: designRequests?.filter(r => r.status === 'submitted').length || 0,
    inProgress: designRequests?.filter(r => r.status === 'in_progress').length || 0,
    completed: designRequests?.filter(r => r.status === 'completed' || r.status === 'delivered').length || 0,
  };

  if (selectedRequest) {
    return (
      <RequestDetail
        request={selectedRequest}
        designers={designers || []}
        onClose={() => setSelectedRequest(null)}
        onUpdate={(data) => updateRequestMutation.mutate({ id: selectedRequest.id, data })}
      />
    );
  }

  return (
    <div className="p-[15px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Design Requests</h1>
        <p className="text-muted-foreground">Manage all design requests from clients</p>
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
                <p className="text-xs text-muted-foreground">Total Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Palette className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.submitted}</p>
                <p className="text-xs text-muted-foreground">Pending Assignment</p>
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
                <Palette className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or user ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : filteredRequests?.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Palette className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No design requests found</p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests?.map((request) => (
            <Card key={request.id} className="cursor-pointer hover:shadow-md" onClick={() => setSelectedRequest(request)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{request.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {DESIGN_TYPES.find(t => t.value === request.design_type)?.label} • 
                      User: {request.user_id}
                    </p>
                  </div>
                  <Badge className={
                    request.status === 'completed' || request.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    request.status === 'submitted' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {request.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{request.description}</p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {request.due_date && <span>Due: {new Date(request.due_date).toLocaleDateString()}</span>}
                  {request.designer_id && <span>Designer: {request.designer_id}</span>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function RequestDetail({ request, designers, onClose, onUpdate }) {
  const [designerId, setDesignerId] = useState(request.designer_id || '');
  const [adminNotes, setAdminNotes] = useState(request.admin_notes || '');
  const [status, setStatus] = useState(request.status);

  const handleAssign = () => {
    onUpdate({
      designer_id: designerId,
      status: designerId && status === 'submitted' ? 'in_progress' : status,
    });
  };

  const handleSaveNotes = () => {
    onUpdate({ admin_notes: adminNotes });
  };

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    onUpdate({ status: newStatus });
  };

  return (
    <div className="p-[15px] space-y-6">
      <Button variant="outline" onClick={onClose}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to List
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{request.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {DESIGN_TYPES.find(t => t.value === request.design_type)?.label}
              </p>
            </div>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-2">Description</h4>
            <p className="text-sm text-muted-foreground">{request.description}</p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Client Notes</h4>
            <p className="text-sm text-muted-foreground">{request.client_notes}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="designer">Assign Designer</Label>
              <Select value={designerId} onValueChange={setDesignerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a designer" />
                </SelectTrigger>
                <SelectContent>
                  {designers.map((designer) => (
                    <SelectItem key={designer.id} value={designer.id}>
                      {designer.full_name || designer.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="mt-3" onClick={handleAssign} disabled={!designerId}>
                {request.designer_id ? 'Reassign' : 'Assign'} Designer
              </Button>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Request Details</h4>
              <div className="text-sm space-y-2">
                <p><span className="text-muted-foreground">Priority:</span> {request.priority}</p>
                {request.due_date && <p><span className="text-muted-foreground">Due:</span> {new Date(request.due_date).toLocaleDateString()}</p>}
                {request.submitted_date && <p><span className="text-muted-foreground">Submitted:</span> {new Date(request.submitted_date).toLocaleDateString()}</p>}
                {request.designer_id && <p><span className="text-muted-foreground">Designer:</span> {request.designer_id}</p>}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="admin_notes">Admin Notes</Label>
            <Textarea
              id="admin_notes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="min-h-[80px]"
              placeholder="Internal notes..."
            />
            <Button size="sm" className="mt-2" onClick={handleSaveNotes}>
              Save Notes
            </Button>
          </div>

          {request.designer_notes && (
            <div>
              <h4 className="font-semibold mb-2">Designer Notes</h4>
              <p className="text-sm text-muted-foreground">{request.designer_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}