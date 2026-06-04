import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, Search, TrendingUp } from 'lucide-react';

const STAGES = {
  new_lead: { label: 'New Lead', color: 'bg-blue-100 text-blue-800' },
  contacted: { label: 'Contacted', color: 'bg-amber-100 text-amber-800' },
  qualified: { label: 'Qualified', color: 'bg-purple-100 text-purple-800' },
  proposal_sent: { label: 'Proposal Sent', color: 'bg-indigo-100 text-indigo-800' },
  negotiation: { label: 'Negotiation', color: 'bg-orange-100 text-orange-800' },
  won: { label: 'Won', color: 'bg-green-100 text-green-800' },
  lost: { label: 'Lost', color: 'bg-red-100 text-red-800' },
};

export default function AdminLeads() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: leads, isLoading } = useQuery({
    queryKey: ['adminLeads'],
    queryFn: () => base44.entities.Lead.list(),
  });

  const { data: forms } = useQuery({
    queryKey: ['adminLeadForms'],
    queryFn: () => base44.entities.LeadForm.list(),
  });

  const filteredLeads = leads?.filter(lead => {
    return lead.lead_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           lead.user_id?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const stats = {
    total: leads?.length || 0,
    newLeads: leads?.filter(l => l.stage === 'new_lead').length || 0,
    won: leads?.filter(l => l.stage === 'won').length || 0,
    active: leads?.filter(l => !['won', 'lost'].includes(l.stage)).length || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Leads Management</h1>
        <p className="text-muted-foreground">View all leads across the platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.newLeads}</p>
                <p className="text-xs text-muted-foreground">New Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.won}</p>
                <p className="text-xs text-muted-foreground">Won Deals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active Pipeline</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search leads by name, company, or user ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : filteredLeads?.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No leads found</p>
            </CardContent>
          </Card>
        ) : (
          filteredLeads?.map((lead) => (
            <Card key={lead.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{lead.lead_name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {lead.company || 'No company'} • {lead.lead_email || 'No email'}
                    </p>
                  </div>
                  <Badge className={STAGES[lead.stage]?.color}>
                    {STAGES[lead.stage]?.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <p>Form: {lead.form_name}</p>
                  <p>User ID: {lead.user_id}</p>
                  {lead.estimated_value && <p>Value: {lead.currency} {lead.estimated_value.toLocaleString()}</p>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Lead Forms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms?.map((form) => (
            <Card key={form.id}>
              <CardHeader>
                <CardTitle className="text-sm">{form.form_name}</CardTitle>
                <p className="text-xs text-muted-foreground">{form.form_type}</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Submissions</p>
                  <p className="text-lg font-bold">{form.total_submissions || 0}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}