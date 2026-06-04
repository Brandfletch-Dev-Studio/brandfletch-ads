import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, FileText, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const STAGES = [
  { value: 'new_lead', label: 'New Lead', color: 'bg-blue-100 text-blue-800' },
  { value: 'contacted', label: 'Contacted', color: 'bg-amber-100 text-amber-800' },
  { value: 'qualified', label: 'Qualified', color: 'bg-purple-100 text-purple-800' },
  { value: 'proposal_sent', label: 'Proposal Sent', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'negotiation', label: 'Negotiation', color: 'bg-orange-100 text-orange-800' },
  { value: 'won', label: 'Won', color: 'bg-green-100 text-green-800' },
  { value: 'lost', label: 'Lost', color: 'bg-red-100 text-red-800' },
];

export default function Leads() {
  const [user, setUser] = useState(null);
  const { data: leads, isLoading, refetch } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const u = await base44.auth.me();
      if (!u) return [];
      return base44.entities.Lead.filter({ user_id: u.id });
    },
  });

  const { data: forms } = useQuery({
    queryKey: ['leadForms'],
    queryFn: async () => {
      const u = await base44.auth.me();
      if (!u) return [];
      return base44.entities.LeadForm.filter({ user_id: u.id });
    },
  });

  const stats = {
    total: leads?.length || 0,
    newLeads: leads?.filter(l => l.stage === 'new_lead').length || 0,
    won: leads?.filter(l => l.stage === 'won').length || 0,
    active: leads?.filter(l => !['won', 'lost'].includes(l.stage)).length || 0,
  };

  const handleStageChange = async (lead, newStage) => {
    try {
      await base44.entities.Lead.update(lead.id, { stage: newStage });
      if (newStage === 'won') {
        await base44.entities.LeadStageChange.create({
          lead_id: lead.id,
          user_id: user.id,
          from_stage: lead.stage,
          to_stage: newStage,
          won_date: new Date().toISOString(),
        });
      }
      toast.success('Lead updated!');
      refetch();
    } catch (error) {
      toast.error('Failed to update lead');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Leads & CRM</h1>
          <p className="text-muted-foreground">Manage your leads and sales pipeline</p>
        </div>
        <Link to="/leads/forms">
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Manage Forms
          </Button>
        </Link>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> New Lead
        </Button>
      </div>

      {/* Stats */}
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
                <FileText className="w-5 h-5 text-amber-700" />
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

      {/* Pipeline Board */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Pipeline</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
          {STAGES.map((stage) => {
            const stageLeads = leads?.filter(l => l.stage === stage.value) || [];
            return (
              <div key={stage.value} className="space-y-3">
                <div className={`rounded-lg p-2 ${stage.color}`}>
                  <p className="text-sm font-semibold">{stage.label}</p>
                  <p className="text-xs">{stageLeads.length}</p>
                </div>
                <div className="space-y-2">
                  {stageLeads.map((lead) => (
                    <Card key={lead.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <p className="font-semibold text-sm">{lead.lead_name}</p>
                        <p className="text-xs text-muted-foreground">{lead.company || 'No company'}</p>
                        <div className="mt-2 flex gap-1 flex-wrap">
                          {STAGES.filter(s => s.value !== stage.value).map((s) => (
                            <button
                              key={s.value}
                              onClick={() => handleStageChange(lead, s.value)}
                              className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                            >
                              → {s.label}
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}