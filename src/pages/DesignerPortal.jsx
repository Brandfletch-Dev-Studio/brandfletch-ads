import { useState } from 'react';
import { base44, supabase } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Palette, Clock, CheckCircle2, MessageSquare,
  Upload, ArrowLeft, Loader2, Image, Briefcase, Star
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useAuth } from '@/lib/AuthContext';
import DesignChatComponent from '@/components/designs/DesignChatComponent';
import DesignStatusTimeline from '@/components/designs/DesignStatusTimeline';
import DesignerPortfolioTab from '@/components/portfolio/DesignerPortfolioTab';

// Only designers + design dept head can access this portal
// creative_ops_director sees ALL design requests; designer sees only their own
const ALLOWED_ROLES = ['admin', 'super_admin', 'creative_ops_director', 'designer'];

const STATUS_OPTIONS = [
  { value: 'under_review',      label: 'Under Review' },
  { value: 'assigned',          label: 'Assigned' },
  { value: 'in_progress',       label: 'In Progress' },
  { value: 'awaiting_feedback', label: 'Awaiting Client Feedback' },
  { value: 'delivered',         label: 'Delivered' },
  { value: 'completed',         label: 'Completed' },
];

const STATUS_COLORS = {
  submitted:          'bg-blue-100 text-blue-700',
  under_review:       'bg-indigo-100 text-indigo-700',
  assigned:           'bg-purple-100 text-purple-700',
  in_progress:        'bg-amber-100 text-amber-700',
  awaiting_feedback:  'bg-orange-100 text-orange-700',
  revision_requested: 'bg-red-100 text-red-700',
  approved:           'bg-teal-100 text-teal-700',
  delivered:          'bg-green-100 text-green-700',
  completed:          'bg-green-100 text-green-700',
  cancelled:          'bg-gray-100 text-gray-500',
};

export default function DesignerPortal() {
  // Access: design dept only
  useRoleGuard(ALLOWED_ROLES);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [designerNotes, setDesignerNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('projects');

  const isDesigner = user?.role === 'designer';
  const isCOD = user?.role === 'creative_ops_director' || user?.role === 'admin' || user?.role === 'super_admin';

  // Designers see only their assigned projects.
  // COD and admins see all design requests.
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['designerRequests', user?.id, isDesigner],
    queryFn: () => isDesigner
      ? base44.entities.DesignRequest.filter({ designer_id: user?.id }, { sort: '-created_date' })
      : base44.entities.DesignRequest.list({ sort: '-created_date', limit: 200 }),
    enabled: !!user?.id,
  });

  // Portfolio: completed work by this designer
  const portfolio = requests.filter(r =>
    ['completed', 'delivered'].includes(r.status) &&
    (r.deliverable_files?.length > 0 || r.draft_files?.length > 0)
  );

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DesignRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designerRequests'] });
      toast.success('Updated');
    },
    onError: () => toast.error('Update failed'),
  });

  const handleStatusChange = (newStatus) => {
    if (!selectedRequest) return;
    updateMutation.mutate({ id: selectedRequest.id, data: { status: newStatus } });
    setSelectedRequest(r => ({ ...r, status: newStatus }));
  };

  const handleSaveNotes = () => {
    if (!selectedRequest) return;
    updateMutation.mutate({ id: selectedRequest.id, data: { designer_notes: designerNotes } });
  };

  const handleUploadFiles = async (e, type) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const results = await Promise.all(files.map(async (f) => {
        const path = `designer-uploads/${Date.now()}-${Math.random().toString(36).slice(2)}-${f.name}`;
        const { error } = await supabase.storage.from('designs').upload(path, f, { upsert: true });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('designs').getPublicUrl(path);
        return { file_url: publicUrl };
      }));
      const urls = results.map(r => r.file_url);
      const field = type === 'draft' ? 'draft_files' : 'deliverable_files';
      const newStatus = type === 'deliverable' ? 'awaiting_feedback' : selectedRequest.status;
      const existing = selectedRequest[field] || [];
      updateMutation.mutate({
        id: selectedRequest.id,
        data: { [field]: [...existing, ...urls], status: newStatus }
      });
      setSelectedRequest(r => ({ ...r, [field]: [...(r[field] || []), ...urls] }));
      toast.success(`${urls.length} file(s) uploaded`);
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const stats = {
    total:            requests.length,
    pending:          requests.filter(r => r.status === 'submitted').length,
    inProgress:       requests.filter(r => ['in_progress', 'under_review', 'assigned'].includes(r.status)).length,
    awaitingFeedback: requests.filter(r => r.status === 'awaiting_feedback').length,
    completed:        requests.filter(r => ['completed', 'delivered'].includes(r.status)).length,
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Project detail view ────────────────────────────────────────────────────
  if (selectedRequest) {
    return (
      <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
        <Button variant="outline" onClick={() => { setSelectedRequest(null); setShowChat(false); }}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: main details */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">{selectedRequest.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedRequest.design_type?.replace(/_/g, ' ')}
                      {selectedRequest.priority && ` · Priority: ${selectedRequest.priority}`}
                      {selectedRequest.due_date && ` · Due ${format(new Date(selectedRequest.due_date), 'MMM d, yyyy')}`}
                    </p>
                  </div>
                  <Badge className={STATUS_COLORS[selectedRequest.status] || 'bg-gray-100 text-gray-700'}>
                    {selectedRequest.status?.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedRequest.description}</p>

                {selectedRequest.revision_comments && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-xs font-semibold text-red-700 mb-1">Revision Requested</p>
                    <p className="text-sm text-red-800">{selectedRequest.revision_comments}</p>
                  </div>
                )}

                {/* Status update */}
                <div>
                  <Label className="mb-1.5 block text-sm">Update Status</Label>
                  <Select value={selectedRequest.status} onValueChange={handleStatusChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Designer notes */}
                <div>
                  <Label className="mb-1.5 block text-sm">Designer Notes (internal)</Label>
                  <Textarea
                    value={designerNotes}
                    onChange={e => setDesignerNotes(e.target.value)}
                    placeholder="Notes visible to the team only..."
                    rows={3}
                    className="text-sm"
                  />
                  <Button size="sm" variant="outline" className="mt-2" onClick={handleSaveNotes}>
                    Save Notes
                  </Button>
                </div>

                {/* File uploads */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1.5 block text-sm">Upload Draft</Label>
                    <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-3 cursor-pointer hover:bg-secondary/50 transition-colors">
                      <Upload className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Choose files</span>
                      <input type="file" multiple className="hidden" onChange={e => handleUploadFiles(e, 'draft')} disabled={uploading} />
                    </label>
                    {selectedRequest.draft_files?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">{selectedRequest.draft_files.length} draft file(s)</p>
                    )}
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-sm">Upload Final Delivery</Label>
                    <label className="flex items-center justify-center gap-2 border-2 border-dashed border-[hsl(var(--accent))]/40 rounded-lg p-3 cursor-pointer hover:bg-[hsl(var(--accent))]/5 transition-colors">
                      <Upload className="w-4 h-4 text-[hsl(var(--accent))]" />
                      <span className="text-xs text-[hsl(var(--accent))]">Final files</span>
                      <input type="file" multiple className="hidden" onChange={e => handleUploadFiles(e, 'deliverable')} disabled={uploading} />
                    </label>
                    {selectedRequest.deliverable_files?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">{selectedRequest.deliverable_files.length} deliverable(s)</p>
                    )}
                  </div>
                </div>
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <DesignStatusTimeline request={selectedRequest} />
          </div>

          {/* Right: client chat */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Client Chat
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <DesignChatComponent
                  requestId={selectedRequest.id}
                  currentUser={user}
                  isStaff={true}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ── Portal home ────────────────────────────────────────────────────────────
  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
          <Palette className="w-6 h-6 text-[hsl(var(--primary))]" />
          {isDesigner ? 'My Designer Portal' : 'Design Portal'}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isDesigner
            ? 'Your assigned projects, upload work, and communicate with clients'
            : 'All design requests — manage your team\'s work queue'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total',     value: stats.total,            color: 'bg-blue-100 text-blue-700',   icon: Briefcase },
          { label: 'Pending',   value: stats.pending,          color: 'bg-amber-100 text-amber-700', icon: Clock },
          { label: 'In Progress', value: stats.inProgress,     color: 'bg-purple-100 text-purple-700', icon: Palette },
          { label: 'Completed', value: stats.completed,        color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center flex-shrink-0`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs: Projects | Portfolio */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-fit">
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Projects
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="flex items-center gap-2">
            <Star className="w-4 h-4" /> Showcase
            {portfolio.length > 0 && (
              <span className="ml-1 bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))] text-xs rounded-full px-1.5 py-0.5 font-semibold">
                {portfolio.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="my-portfolio" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Portfolio
          </TabsTrigger>
        </TabsList>

        {/* ── Projects tab ── */}
        <TabsContent value="projects" className="mt-4 space-y-3">
          {requests.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center">
                <Palette className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="font-semibold text-muted-foreground">No projects assigned yet</p>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  {isDesigner ? 'Your manager will assign design requests to you.' : 'No design requests in the system yet.'}
                </p>
              </CardContent>
            </Card>
          ) : requests.map(request => (
            <Card key={request.id}
              className="cursor-pointer hover:shadow-md transition-all border hover:border-[hsl(var(--primary))]/30"
              onClick={() => { setSelectedRequest(request); setDesignerNotes(request.designer_notes || ''); }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold truncate">{request.title}</p>
                      <Badge className={`text-xs flex-shrink-0 ${STATUS_COLORS[request.status] || 'bg-gray-100 text-gray-700'}`}>
                        {request.status?.replace(/_/g, ' ')}
                      </Badge>
                      {request.priority === 'urgent' && (
                        <Badge className="text-xs bg-red-100 text-red-700 flex-shrink-0">Urgent</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {request.design_type?.replace(/_/g, ' ')}
                      {request.due_date && ` · Due ${format(new Date(request.due_date), 'MMM d, yyyy')}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{request.description}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Revisions: {request.revision_count || 0}/{request.max_revisions || 2}
                      {request.revision_comments && (
                        <span className="ml-2 text-red-600 font-medium">· Revision feedback pending</span>
                      )}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {request.client_name && (
                      <p className="text-xs text-muted-foreground">{request.client_name}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {request.created_date ? format(new Date(request.created_date), 'MMM d') : ''}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ── Work showcase (from design requests) ── */}
        <TabsContent value="portfolio" className="mt-4">
          {portfolio.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center">
                <Image className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="font-semibold text-muted-foreground">No portfolio items yet</p>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  Completed projects with deliverables will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portfolio.map(request => (
                <Card key={request.id}
                  className="cursor-pointer hover:shadow-md transition-all"
                  onClick={() => { setSelectedRequest(request); setDesignerNotes(request.designer_notes || ''); }}
                >
                  <CardContent className="p-4">
                    {/* Show first deliverable as preview if it's an image */}
                    {request.deliverable_files?.[0] && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(request.deliverable_files[0]) && (
                      <div className="w-full h-36 rounded-lg overflow-hidden bg-secondary mb-3">
                        <img src={request.deliverable_files[0]} alt={request.title}
                          className="w-full h-full object-cover" />
                      </div>
                    )}
                    <p className="font-semibold text-sm">{request.title}</p>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">
                      {request.design_type?.replace(/_/g, ' ')}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge className="text-xs bg-green-100 text-green-700">Completed</Badge>
                      <span className="text-xs text-muted-foreground">
                        {request.deliverable_files?.length || 0} file(s)
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        {/* ── Portfolio management tab ── */}
        <TabsContent value="my-portfolio" className="mt-4">
          <DesignerPortfolioTab user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
