import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Palette, Target, Layout } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [designs, setDesigns] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { init(); }, []);

  async function init() {
    const u = await base44.auth.me();
    setUser(u);
    const [des, lds] = await Promise.all([
      base44.entities.DesignRequest.filter({ user_id: u.id }, '-created_date', 5),
      base44.entities.Lead.filter({ user_id: u.id }, '-created_date', 5),
    ]);
    setDesigns(des);
    setLeads(lds);
    setLoading(false);
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) return 'Good night';
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const activeDesigns = designs.filter(d => d.status === 'in_progress' || d.status === 'submitted').length;
  const activeLeads = leads.filter(l => !['won', 'lost'].includes(l.stage)).length;

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="p-[15px] space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] p-6 md:p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold font-heading mb-2">
            {getGreeting()}, {user?.full_name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-white/90 mb-6 max-w-2xl">
            Ready to grow your business with our powerful tools?
          </p>
        </div>
      </div>

      {/* Quick Stats - Only Designs and Leads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/designs">
          <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{activeDesigns}</p>
                  <p className="text-sm text-muted-foreground mt-1 font-medium">Designs in Progress</p>
                </div>
                <Palette className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/leads">
          <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{activeLeads}</p>
                  <p className="text-sm text-muted-foreground mt-1 font-medium">Active Leads</p>
                </div>
                <Target className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Featured Tools */}
      <div>
        <h2 className="text-xl font-bold font-heading mb-4">Growth Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href='/designs'}>
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center mb-2">
                <Palette className="w-6 h-6 text-purple-700" />
              </div>
              <CardTitle className="text-lg">Designs</CardTitle>
              <CardDescription className="text-sm">Professional design services</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">Order Design</Button>
            </CardContent>
          </Card>
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
          <Card className="hover:shadow-md transition-shadow opacity-50">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-2">
                <Layout className="w-6 h-6 text-blue-700" />
              </div>
              <CardTitle className="text-lg">Landing Pages</CardTitle>
              <CardDescription className="text-sm">Coming Soon</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" disabled>Coming Soon</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity - Only Designs and Leads */}
      <div>
        <h2 className="text-xl font-bold font-heading mb-4">Recent Activity</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          {leads.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent Leads</CardTitle>
                <Link to="/leads" className="text-xs text-[hsl(var(--accent))] hover:underline font-medium">View all</Link>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {leads.slice(0, 5).map(l => (
                    <Link
                      key={l.id}
                      to="/leads"
                      className="flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition-colors gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{l.lead_name}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{l.company || 'No company'}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          l.stage === 'won' ? 'bg-green-100 text-green-700' :
                          l.stage === 'lost' ? 'bg-red-100 text-red-700' :
                          l.stage === 'new_lead' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {l.stage.replace('_', ' ')}
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
      {designs.length === 0 && leads.length === 0 && (
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
    </div>
  );
}