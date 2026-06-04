import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette, Search } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'revision_requested', label: 'Revision Requested' },
  { value: 'completed', label: 'Completed' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

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

export default function AdminDesigns() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: designRequests, isLoading } = useQuery({
    queryKey: ['adminDesignRequests'],
    queryFn: () => base44.entities.DesignRequest.list(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.DesignRequest.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDesignRequests'] });
    },
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

  return (
    <div className="space-y-6">
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

      <div className="flex gap-4">
        <div className="flex-1 relative">
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
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{request.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {DESIGN_TYPES.find(t => t.value === request.design_type)?.label} • 
                      User: {request.user_id}
                    </p>
                  </div>
                  <Badge className={`px-2 py-1 rounded-full text-xs font-medium ${
                    request.status === 'completed' || request.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    request.status === 'submitted' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {request.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{request.description}</p>
                <div className="flex gap-2">
                  <Select
                    value={request.status}
                    onValueChange={(value) => updateStatusMutation.mutate({ id: request.id, status: value })}
                  >
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
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}