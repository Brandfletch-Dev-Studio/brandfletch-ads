import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Palette, Plus, ArrowLeft, ShoppingBag, MessageSquare, Loader2, Download, RotateCcw, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
import DesignSubscription from '@/components/designs/DesignSubscription';
import DesignChatComponent from '@/components/designs/DesignChatComponent';
import DesignRequestWizard from '@/components/designs/DesignRequestWizard';
import DesignStatusTimeline from '@/components/designs/DesignStatusTimeline';

const DESIGN_TYPE_LABELS = {
  social_media_post: 'Social Media Post', flyer: 'Flyer', poster: 'Poster', banner: 'Banner',
  business_card: 'Business Card', logo: 'Logo', brochure: 'Brochure', presentation: 'Presentation',
  custom: 'Custom Design', other: 'Other',
};

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-indigo-100 text-indigo-700',
  assigned: 'bg-purple-100 text-purple-700',
  in_progress: 'bg-amber-100 text-amber-700',
  awaiting_feedback: 'bg-orange-100 text-orange-700',
  revision_requested: 'bg-red-100 text-red-700',
  approved: 'bg-teal-100 text-teal-700',
  delivered: 'bg-green-100 text-green-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

export default function Designs() {
  const [view, setView] = useState('list'); // list | wizard | subscription | detail
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null); // paid design_order being fulfilled in the wizard
  const [verifying, setVerifying] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const txRef = urlParams.get('paychangu_tx');
    const paymentType = urlParams.get('payment_type');
    const subId = urlParams.get('sub_id');
    if (txRef && paymentType === 'design' && subId) {
      setVerifying(true);
      base44.functions.invoke('verifyPaychanguPayment', { tx_ref: txRef, subscription_id: subId, payment_type: 'design' })
        .then(res => {
          if (res.data?.verified) {
            toast.success('Payment verified! You can now submit your design brief.');
            queryClient.invalidateQueries({ queryKey: ['myDesignOrders'] });
          } else {
            toast.error('Payment could not be verified. Please contact support.');
          }
          window.history.replaceState({}, '', '/designs');
        })
        .finally(() => setVerifying(false));
    }
  }, []);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: requests, isLoading } = useQuery({
    queryKey: ['myDesignRequests'],
    queryFn: () => base44.entities.DesignRequest.filter({ user_id: user?.id }, '-created_date'),
    enabled: !!user,
    initialData: [],
  });

  // Paid-but-not-yet-submitted orders — a client bought a specific design
  // service from the catalog and paid, but hasn't filled in the brief yet.
  const { data: unusedOrders = [] } = useQuery({
    queryKey: ['myDesignOrders'],
    queryFn: () => base44.entities.PlatformSubscription.filter({
      user_id: user?.id, subscription_type: 'design_order', status: 'active', quota_used: 0,
    }),
    enabled: !!user,
  });

  const stats = {
    total: (requests || []).length,
    active: (requests || []).filter(r => ['submitted', 'under_review', 'assigned', 'in_progress', 'awaiting_feedback'].includes(r.status)).length,
    revision: (requests || []).filter(r => r.status === 'revision_requested').length,
    completed: (requests || []).filter(r => ['completed', 'delivered'].includes(r.status)).length,
  };

  // Always send clients to the catalog to buy a new design — there's no
  // recurring quota anymore, each order is paid for individually.
  const handleNewRequest = () => setView('subscription');

  const handleSubmitBrief = (order) => {
    setSelectedOrder(order);
    setView('wizard');
  };

  if (verifying) return (
    <div className="p-8 text-center flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Verifying your payment...</p>
    </div>
  );

  if (view === 'subscription') return (
    <div className="p-[15px] space-y-6">
      <Button variant="outline" onClick={() => setView('list')}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <DesignSubscription onSubscribe={() => { setView('list'); queryClient.invalidateQueries({ queryKey: ['userSubscription'] }); }} />
    </div>
  );

  if (view === 'wizard') return (
    <div className="p-[15px] space-y-6">
      <DesignRequestWizard
        order={selectedOrder}
        onSuccess={() => {
          setView('list');
          setSelectedOrder(null);
          queryClient.invalidateQueries({ queryKey: ['myDesignRequests'] });
          queryClient.invalidateQueries({ queryKey: ['myDesignOrders'] });
        }}
        onCancel={() => { setView('list'); setSelectedOrder(null); }}
      />
    </div>
  );

  if (view === 'detail' && selectedRequest) return (
    <RequestDetail
      request={selectedRequest}
      onClose={() => { setView('list'); setSelectedRequest(null); }}
      onUpdate={() => queryClient.invalidateQueries({ queryKey: ['myDesignRequests'] })}
    />
  );

  return (
    <div className="p-[15px] space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading" style={{ paddingLeft: '20px' }}>Design Studio</h1>
          <p className="text-muted-foreground" style={{ paddingLeft: '20px' }}>Pay per design — pick a service, no monthly commitment</p>
        </div>
        <Button onClick={handleNewRequest}>
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Paid orders awaiting a brief */}
      {unusedOrders.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-blue-900">Ready to Submit</h3>
                <p className="text-sm text-blue-800">You've paid for these designs — tell us what you need and we'll get started.</p>
              </div>
            </div>
            <div className="space-y-2">
              {unusedOrders.map(order => (
                <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-background border">
                  <div>
                    <p className="text-sm font-semibold">{order.service_name}</p>
                    <p className="text-xs text-muted-foreground">{order.currency} {(order.amount || 0).toLocaleString()} • paid</p>
                  </div>
                  <Button size="sm" onClick={() => handleSubmitBrief(order)}>Submit Brief</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'bg-blue-100 text-blue-700' },
          { label: 'Active', value: stats.active, color: 'bg-amber-100 text-amber-700' },
          { label: 'Revisions', value: stats.revision, color: 'bg-red-100 text-red-700' },
          { label: 'Completed', value: stats.completed, color: 'bg-green-100 text-green-700' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center`}>
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Request List */}
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : !requests?.length ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Palette className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-40" />
            <p className="text-muted-foreground mb-4">No design requests yet</p>
            <Button onClick={handleNewRequest}><Plus className="w-4 h-4 mr-2" />Create Your First Request</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map(request => (
            <Card key={request.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedRequest(request); setView('detail'); }}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{request.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {DESIGN_TYPE_LABELS[request.design_type] || request.design_type}
                      {request.due_date && <span className="ml-2">• Due {new Date(request.due_date).toLocaleDateString()}</span>}
                    </p>
                  </div>
                  <Badge className={STATUS_COLORS[request.status] || 'bg-gray-100 text-gray-700'}>
                    {request.status?.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </CardHeader>
              {request.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                    <span>Revision {request.revision_count || 0}/{request.max_revisions || 2}</span>
                    {request.submitted_date && <span>Submitted {new Date(request.submitted_date).toLocaleDateString()}</span>}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function RequestDetail({ request, subscription, onClose, onUpdate }) {
  const [showChat, setShowChat] = useState(false);
  const [revisionComment, setRevisionComment] = useState('');
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ data }) => base44.entities.DesignRequest.update(request.id, data),
  });

  const handleApprove = () => {
    updateMutation.mutate({ data: { status: 'approved' } });
  };

  const handleRequestRevision = () => {
    if (!revisionComment.trim()) { toast.error('Please describe the revisions needed'); return; }
    const revCount = (request.revision_count || 0) + 1;
    if (revCount > (request.max_revisions || 2)) {
      toast.error(`Maximum revisions (${request.max_revisions || 2}) reached`);
      return;
    }
    updateMutation.mutate({
      data: { status: 'revision_requested', revision_count: revCount, revision_comments: revisionComment },
    });
    setRevisionComment('');
    setShowRevisionForm(false);
  };

  return (
    <div className="p-[15px] space-y-6">
      <Button variant="outline" onClick={onClose}><ArrowLeft className="w-4 h-4 mr-2" />Back to Requests</Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{request.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{DESIGN_TYPE_LABELS[request.design_type]}</p>
                </div>
                <Badge className={STATUS_COLORS[request.status] || 'bg-gray-100'}>
                  {request.status?.replace(/_/g, ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">{request.description}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {request.brand_name && <div><span className="text-muted-foreground">Brand:</span> <span className="font-medium">{request.brand_name}</span></div>}
                {request.target_audience && <div><span className="text-muted-foreground">Audience:</span> <span className="font-medium">{request.target_audience}</span></div>}
                {request.preferred_style && <div><span className="text-muted-foreground">Style:</span> <span className="font-medium">{request.preferred_style}</span></div>}
                {request.preferred_dimensions && <div><span className="text-muted-foreground">Dimensions:</span> <span className="font-medium">{request.preferred_dimensions}</span></div>}
                {request.due_date && <div><span className="text-muted-foreground">Deadline:</span> <span className="font-medium">{new Date(request.due_date).toLocaleDateString()}</span></div>}
                <div><span className="text-muted-foreground">Revisions:</span> <span className="font-medium">{request.revision_count || 0} / {request.max_revisions || 2}</span></div>
              </div>
              {request.special_instructions && (
                <div className="p-3 bg-muted/40 rounded-lg text-sm">
                  <p className="font-medium mb-1">Special Instructions</p>
                  <p className="text-muted-foreground">{request.special_instructions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Designer Notes */}
          {request.designer_notes && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-blue-900 mb-1">Designer Notes</p>
                <p className="text-sm text-blue-700">{request.designer_notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Revision comments from designer */}
          {request.revision_comments && request.status === 'revision_requested' && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-red-900 mb-1">Revision Request</p>
                <p className="text-sm text-red-700">{request.revision_comments}</p>
              </CardContent>
            </Card>
          )}

          {/* Files */}
          {request.reference_files?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Reference Files</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {request.reference_files.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <Download className="w-3 h-3" /> Reference {i + 1}
                  </a>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Draft Files */}
          {request.draft_files?.length > 0 && (
            <Card className="border-purple-200">
              <CardHeader><CardTitle className="text-base">Design Drafts</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {request.draft_files.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <Download className="w-3 h-3" /> Draft {i + 1}
                  </a>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Delivered Files */}
          {request.deliverable_files?.length > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" />Delivered Files</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {request.deliverable_files.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-green-700 font-medium hover:underline">
                    <Download className="w-3 h-3" /> Final Design {i + 1}
                  </a>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Client Actions */}
          {(request.status === 'awaiting_feedback' || request.status === 'delivered') && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <p className="font-medium mb-3">Your feedback is needed</p>
                <div className="flex gap-3">
                  <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove}>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                  </Button>
                  <Button variant="outline" onClick={() => setShowRevisionForm(!showRevisionForm)}>
                    <RotateCcw className="w-4 h-4 mr-2" /> Request Revision ({(request.revision_count || 0)}/{request.max_revisions || 2})
                  </Button>
                </div>
                {showRevisionForm && (
                  <div className="mt-4 space-y-3">
                    <Label>Describe the changes needed</Label>
                    <Textarea value={revisionComment} onChange={e => setRevisionComment(e.target.value)} placeholder="What needs to be changed? Be as specific as possible..." className="min-h-[80px]" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleRequestRevision} disabled={updateMutation.isPending}>Submit Revision Request</Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowRevisionForm(false)}><X className="w-4 h-4" /></Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status Timeline */}
          <Card>
            <CardHeader><CardTitle className="text-base">Project Timeline</CardTitle></CardHeader>
            <CardContent><DesignStatusTimeline currentStatus={request.status} /></CardContent>
          </Card>

          {/* Chat */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="w-4 h-4" />Project Chat</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowChat(!showChat)}>{showChat ? 'Hide' : 'Show'}</Button>
              </div>
            </CardHeader>
            {showChat && (
              <CardContent>
                <DesignChatComponent designRequestId={request.id} />
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}