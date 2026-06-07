import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Palette, Target, Megaphone, Clock, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import OnboardingChecklist from '@/components/dashboard/OnboardingChecklist';

export default function Dashboard() {
  // Fix #6: use AuthContext user instead of calling base44.auth.me() again
  const { user } = useAuth();
  const navigate = useNavigate();

  const [designs, setDesigns] = useState([]);
  const [leads, setLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLandingPageOrder, setShowLandingPageOrder] = useState(false);
  const [landingForm, setLandingForm] = useState({ name: '', description: '', url: '' });
  const [submittingOrder, setSubmittingOrder] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    async function loadData() {
      try {
        const [des, lds, camps] = await Promise.all([
          base44.entities.DesignRequest.filter({ user_id: user.id }, '-created_date', 5),
          base44.entities.Lead.filter({ user_id: user.id }, '-created_date', 5),
          base44.entities.Campaign.filter({ user_id: user.id }, '-created_date', 5),
        ]);
        setDesigns(des);
        setLeads(lds);
        setCampaigns(camps);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.id]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) return 'Good night';
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const pendingCampaigns = campaigns.filter(c => ['pending_review', 'awaiting_payment', 'draft'].includes(c.status)).length;
  const activeDesigns = designs.filter(d => d.status === 'in_progress' || d.status === 'submitted').length;
  const activeLeads = leads.filter(l => !['won', 'lost'].includes(l.stage)).length;

  const formatCost = (c) => {
    const cost = c.total_cost || 0;
    const currency = c.currency || 'USD';
    if (currency === 'MWK') return `MK${cost.toLocaleString()}`;
    if (currency === 'KES') return `KSh${cost.toLocaleString()}`;
    if (currency === 'ZMW') return `ZK${cost.toLocaleString()}`;
    if (currency === 'ZAR') return `R${cost.toLocaleString()}`;
    if (currency === 'TZS') return `TSh${cost.toLocaleString()}`;
    if (currency === 'USD') return `$${cost.toFixed(2)}`;
    return `${currency} ${cost.toLocaleString()}`;
  };

  const CAMPAIGN_STATUS_LABELS = {
    draft: 'Draft', awaiting_payment: 'Awaiting Payment',
    pending_review: 'Pending Review', approved: 'Approved',
    active: 'Active', paused: 'Paused', completed: 'Completed',
    rejected: 'Rejected', refunded: 'Refunded',
  };

  async function handleLandingPageOrder(e) {
    e.preventDefault();
    setSubmittingOrder(true);
    try {
      await base44.entities.ServiceOrder.create({
        user_id: user.id,
        user_name: user.full_name,
        user_email: user.email,
        service_type: 'landing_page',
        ...landingForm,
        status: 'pending',
      });
      toast.success('Landing page order submitted! We\'ll be in touch shortly.');
      setShowLandingPageOrder(false);
      setLandingForm({ name: '', description: '', url: '' });
    } catch (err) {
      toast.error('Failed to submit order. Please try again.');
    } finally {
      setSubmittingOrder(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="p-4 lg:p-8 space-y-6">
        <div className="h-40 rounded-2xl bg-secondary animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-xl bg-secondary animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-40 rounded-xl bg-secondary animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] p-6 md:p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold font-heading mb-2 pl-5">
            {getGreeting()}, {user?.full_name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-white/90 mb-6 max-w-2xl pl-5">
            Ready to grow your business with high-performing Facebook ad campaigns?
          </p>
          <div className="pl-5">
            <Link to="/campaigns/new">
              <Button size="lg" className="bg-white text-[hsl(var(--primary))] hover:bg-white/90">
                <Megaphone className="w-5 h-5 mr-2" />
                Create Ad Campaign
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Onboarding Checklist — shown to new users until all steps complete */}
      <OnboardingChecklist user={user} />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/campaigns">
          <Card className="hover:shadow-lg transition-all cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeCampaigns}</p>
                  <p className="text-xs text-muted-foreground">Active Campaigns</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/campaigns">
          <Card className="hover:shadow-lg transition-all cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingCampaigns}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/designs">
          <Card className="hover:shadow-lg transition-all cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Palette className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeDesigns}</p>
                  <p className="text-xs text-muted-foreground">Designs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/leads">
          <Card className="hover:shadow-lg transition-all cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-orange-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeLeads}</p>
                  <p className="text-xs text-muted-foreground">Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Growth Tools */}
      <div>
        <h2 className="text-xl font-bold font-heading mb-4 pl-5">Growth Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Fix #7: replace window.location.href with navigate() */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/designs')}>
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center mb-2">
                <Palette className="w-6 h-6 text-purple-700" />
              </div>
              <CardTitle className="text-lg">Design Services</CardTitle>
              <CardDescription className="text-sm">Professional ad creatives</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">Order Design</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-lg bg-pink-50 flex items-center justify-center mb-2">
                <Globe className="w-6 h-6 text-pink-700" />
              </div>
              <CardTitle className="text-lg">Landing Pages</CardTitle>
              <CardDescription className="text-sm">Custom landing page design</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => setShowLandingPageOrder(true)} variant="outline">Order Now</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/leads')}>
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center mb-2">
                <Target className="w-6 h-6 text-orange-700" />
              </div>
              <CardTitle className="text-lg">Leads & CRM</CardTitle>
              <CardDescription className="text-sm">Manage your sales pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">View Leads</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      {(campaigns.length > 0 || designs.length > 0) && (
        <div>
          <h2 className="text-xl font-bold font-heading mb-4 pl-5">Recent Activity</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {campaigns.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Campaigns</CardTitle>
                  <Link to="/campaigns" className="text-xs text-[hsl(var(--accent))] hover:underline font-medium">View all</Link>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {campaigns.slice(0, 5).map(c => (
                      <Link
                        key={c.id}
                        to={`/campaigns/${c.id}`}
                        className="flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition-colors gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{c.campaign_name || c.page_name || 'Campaign'}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                            {c.package} · {c.duration}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground capitalize flex-shrink-0">
                          {CAMPAIGN_STATUS_LABELS[c.status] || c.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {designs.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Designs</CardTitle>
                  <Link to="/designs" className="text-xs text-[hsl(var(--accent))] hover:underline font-medium">View all</Link>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {designs.slice(0, 5).map(d => (
                      <div key={d.id} className="flex items-center justify-between px-4 py-3 gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{d.title || d.design_type || 'Design Request'}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 capitalize">{d.design_type}</p>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground capitalize flex-shrink-0">{d.status}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Landing Page Order Dialog */}
      <Dialog open={showLandingPageOrder} onOpenChange={setShowLandingPageOrder}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Order a Landing Page</DialogTitle>
            <DialogDescription>Tell us about your landing page requirements and we'll get back to you with a quote.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLandingPageOrder} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lp-name">Business / Page Name</Label>
              <Input
                id="lp-name"
                value={landingForm.name}
                onChange={e => setLandingForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Your business name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lp-url">Existing Website URL (optional)</Label>
              <Input
                id="lp-url"
                value={landingForm.url}
                onChange={e => setLandingForm(f => ({ ...f, url: e.target.value }))}
                placeholder="https://yourbusiness.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lp-desc">Description & Requirements</Label>
              <Textarea
                id="lp-desc"
                value={landingForm.description}
                onChange={e => setLandingForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe what you need — goal, style, sections, etc."
                className="min-h-[100px]"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowLandingPageOrder(false)}>Cancel</Button>
              <Button type="submit" disabled={submittingOrder}>
                {submittingOrder ? 'Submitting...' : 'Submit Order'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
