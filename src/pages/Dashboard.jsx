import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Palette, Target, Layout, Megaphone, Wallet, Clock, Plus, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [designs, setDesigns] = useState([]);
  const [leads, setLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLandingPageOrder, setShowLandingPageOrder] = useState(false);

  useEffect(() => { init(); }, []);

  async function init() {
    const u = await base44.auth.me();
    setUser(u);
    const [des, lds, camps, wallets] = await Promise.all([
      base44.entities.DesignRequest.filter({ user_id: u.id }, '-created_date', 5),
      base44.entities.Lead.filter({ user_id: u.id }, '-created_date', 5),
      base44.entities.Campaign.filter({ user_id: u.id }, '-created_date', 5),
      base44.entities.Wallet.filter({ user_id: u.id }).then(r => r[0]),
    ]);
    setDesigns(des);
    setLeads(lds);
    setCampaigns(camps);
    setWallet(wallets);
    setLoading(false);
  }

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
  const walletBalance = wallet?.balance || 0;

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="p-[15px] space-y-6">
      {/* Hero Section with Campaign CTA */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] p-6 md:p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold font-heading mb-2" style={{ paddingLeft: '20px' }}>
            {getGreeting()}, {user?.full_name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-white/90 mb-6 max-w-2xl" style={{ paddingLeft: '20px' }}>
            Ready to grow your business with high-performing Facebook ad campaigns?
          </p>
          <div style={{ paddingLeft: '20px' }}>
            <Link to="/campaigns/new">
              <Button size="lg" className="bg-white text-[hsl(var(--primary))] hover:bg-white/90">
                <Megaphone className="w-5 h-5 mr-2" />
                Create Ad Campaign
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats - Column Form */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Link to="/campaigns">
          <Card className="hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold">{activeCampaigns}</p>
                  <p className="text-sm text-white/90 mt-1 font-medium">Active Campaigns</p>
                </div>
                <Megaphone className="w-10 h-10 text-white/80" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/campaigns">
          <Card className="hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold">{pendingCampaigns}</p>
                  <p className="text-sm text-white/90 mt-1 font-medium">Pending</p>
                </div>
                <Clock className="w-10 h-10 text-white/80" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/wallet">
          <Card className="hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold">{walletBalance.toLocaleString()}</p>
                  <p className="text-sm text-white/90 mt-1 font-medium">Wallet</p>
                </div>
                <Wallet className="w-10 h-10 text-white/80" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/designs">
          <Card className="hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold">{activeDesigns}</p>
                  <p className="text-sm text-white/90 mt-1 font-medium">Designs</p>
                </div>
                <Palette className="w-10 h-10 text-white/80" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/leads">
          <Card className="hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold">{activeLeads}</p>
                  <p className="text-sm text-white/90 mt-1 font-medium">Leads</p>
                </div>
                <Target className="w-10 h-10 text-white/80" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Featured Tools */}
      <div>
        <h2 className="text-xl font-bold font-heading mb-4" style={{ paddingLeft: '20px' }}>Growth Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Design Services */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href='/designs'}>
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
          {/* Landing Pages */}
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
          {/* Leads & CRM */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href='/leads'}>
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
      <div>
        <h2 className="text-xl font-bold font-heading mb-4" style={{ paddingLeft: '20px' }}>Recent Activity</h2>
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
                        <p className="text-sm font-medium truncate">{c.campaign_name}</p>
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">{c.objective?.replace('_', ' ')}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          c.status === 'active' ? 'bg-green-100 text-green-700' :
                          c.status === 'pending_review' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {c.status.replace('_', ' ')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {designs.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Design Requests</CardTitle>
                <Link to="/designs" className="text-xs text-[hsl(var(--accent))] hover:underline font-medium">View all</Link>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {designs.slice(0, 5).map(d => (
                    <Link
                      key={d.id}
                      to="/designs"
                      className="flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition-colors gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{d.title}</p>
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">{d.design_type.replace('_', ' ')}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          d.status === 'completed' || d.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          d.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {d.status.replace('_', ' ')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Empty states */}
      {campaigns.length === 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-8 text-center">
            <Megaphone className="w-12 h-12 mx-auto text-blue-600 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Start Your First Campaign</h3>
            <p className="text-muted-foreground mb-4">Create high-performing Facebook ads to grow your business</p>
            <Link to="/campaigns/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {designs.length === 0 && leads.length === 0 && campaigns.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No design requests yet</p>
              <Link to="/designs">
                <Button variant="outline">Request Design</Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No leads yet</p>
              <Link to="/leads/forms">
                <Button variant="outline">Create Lead Form</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Landing Page Order Dialog */}
      <Dialog open={showLandingPageOrder} onOpenChange={setShowLandingPageOrder}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Landing Page</DialogTitle>
            <DialogDescription>
              Request a custom landing page design. Our team will contact you with details and pricing.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            await base44.entities.ServiceOrder.create({
              user_id: user.id,
              service_id: 'landing_page',
              service_name: 'Landing Page Design',
              notes: formData.get('requirements'),
              status: 'pending'
            });
            setShowLandingPageOrder(false);
            alert('Your landing page order has been submitted! Our team will contact you soon.');
          }} className="space-y-4">
            <div>
              <Label htmlFor="requirements">Project Requirements</Label>
              <Textarea
                id="requirements"
                name="requirements"
                placeholder="Describe your landing page needs (purpose, sections, features, etc.)"
                className="h-32"
                required
              />
            </div>
            <div>
              <Label htmlFor="timeline">Timeline</Label>
              <Input
                id="timeline"
                name="timeline"
                placeholder="When do you need this completed?"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowLandingPageOrder(false)}>Cancel</Button>
              <Button type="submit">Submit Order</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}