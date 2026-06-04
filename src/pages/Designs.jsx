import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, Plus, ArrowLeft, Lock } from 'lucide-react';
import { toast } from 'sonner';
import DesignRequestForm from '@/components/designs/DesignRequestForm';
import DesignSubscription from '@/components/designs/DesignSubscription';

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

export default function Designs() {
  const [showNewForm, setShowNewForm] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: requests, isLoading } = useQuery({
    queryKey: ['myDesignRequests'],
    queryFn: () => base44.entities.DesignRequest.filter({ user_id: user?.id }),
    enabled: !!user,
    initialData: [],
  });

  const { data: subscription } = useQuery({
    queryKey: ['userSubscription'],
    queryFn: () => base44.entities.PlatformSubscription.filter({ user_id: user?.id, subscription_type: 'design_retainer', status: 'active' }).then(r => r[0]),
    enabled: !!user,
  });

  const { data: designPricing } = useQuery({
    queryKey: ['designPricing'],
    queryFn: () => base44.entities.DesignPricing.filter({ pricing_type: 'per_design', is_active: true }).then(r => r[0]),
  });

  const designQuota = subscription?.monthly_quota || 0;
  const designsUsed = (requests || []).filter(r => r.status === 'completed' || r.status === 'delivered').length;
  const designsRemaining = designQuota > 0 ? designQuota - designsUsed : null;
  const hasActiveSubscription = !!subscription;

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DesignRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDesignRequests'] });
      toast.success('Updated!');
    },
  });

  const stats = {
    total: (requests || []).length,
    draft: (requests || []).filter(r => r.status === 'draft').length,
    inProgress: (requests || []).filter(r => ['in_progress', 'submitted'].includes(r.status)).length,
    completed: (requests || []).filter(r => ['completed', 'delivered'].includes(r.status)).length,
  };

  const handleNewRequest = () => {
    if (!hasActiveSubscription) {
      setShowSubscription(true);
    } else {
      setShowNewForm(true);
    }
  };

  if (showSubscription) {
    return (
      <div className="p-[15px] space-y-6">
        <Button variant="outline" onClick={() => setShowSubscription(false)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Designs
        </Button>
        <DesignSubscription onSubscribe={() => setShowSubscription(false)} />
      </div>
    );
  }

  if (showNewForm) {
    return (
      <div className="p-[15px] space-y-6">
        <Button variant="outline" onClick={() => setShowNewForm(false)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Designs
        </Button>
        <DesignRequestForm onSuccess={() => setShowNewForm(false)} />
      </div>
    );
  }

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
    <div className="p-[15px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading" style={{ paddingLeft: '20px' }}>Design Requests</h1>
          <p className="text-muted-foreground" style={{ paddingLeft: '20px' }}>Manage your design projects</p>
        </div>
        <Button onClick={handleNewRequest}>
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Subscription Status */}
      {hasActiveSubscription ? (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Design Retainer Plan Active</p>
                  <p className="text-xs text-muted-foreground">
                    {designsUsed} of {designQuota} designs used
                    {designsRemaining !== null && designsRemaining > 0 && (
                      <span className="ml-2 text-green-600 font-medium">
                        ({designsRemaining} remaining)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-700">
                  {designQuota > 0 ? Math.round((designsUsed / designQuota) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">Used</p>
              </div>
            </div>
            <div className="mt-3 w-full bg-purple-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${designQuota > 0 ? (designsUsed / designQuota) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Lock className="w-6 h-6 text-amber-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-amber-900 mb-2">Subscribe to Order Designs</h3>
                <p className="text-sm text-amber-800 mb-4">
                  You need an active design subscription to request new designs. Choose between our monthly retainer plan or pay-per-design option.
                </p>
                <div className="flex gap-3">
                  <Button onClick={handleNewRequest}>
                    View Subscription Plans
                  </Button>
                  <Link to="/marketplace">
                    <Button variant="outline">Browse Services</Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <Palette className="w-5 h-5 text-amber-700" />
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

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : !requests || requests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Palette className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">No design requests yet</p>
            <Button onClick={handleNewRequest}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Request
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(requests || []).map((request) => (
            <Card key={request.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedRequest(request)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{request.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {DESIGN_TYPES[request.design_type]} • {request.request_type === 'retainer' ? 'Retainer' : 'Per Design'}
                    </p>
                  </div>
                  <Badge className={
                    request.status === 'completed' || request.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    request.status === 'in_progress' || request.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                    request.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    'bg-orange-100 text-orange-800'
                  }>
                    {request.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>
                <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                  {request.due_date && <span>Due: {new Date(request.due_date).toLocaleDateString()}</span>}
                  {request.submitted_date && <span>Submitted: {new Date(request.submitted_date).toLocaleDateString()}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function RequestDetail({ request, onClose, onUpdate }) {
  const [notes, setNotes] = useState(request.client_notes || '');

  const handleSaveNotes = () => {
    onUpdate({ client_notes: notes });
  };

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={onClose}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Requests
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
              request.status === 'in_progress' || request.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
              request.status === 'draft' ? 'bg-gray-100 text-gray-800' :
              'bg-orange-100 text-orange-800'
            }>
              {request.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Description</h4>
            <p className="text-sm text-muted-foreground">{request.description}</p>
          </div>

          {request.designer_notes && (
            <div>
              <h4 className="font-semibold mb-2">Designer Notes</h4>
              <p className="text-sm text-muted-foreground">{request.designer_notes}</p>
            </div>
          )}

          <div>
            <h4 className="font-semibold mb-2">Your Notes</h4>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
            />
            <Button size="sm" className="mt-2" onClick={handleSaveNotes}>
              Save Notes
            </Button>
          </div>

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