import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Search, 
  Filter,
  Star,
  Zap,
  Target,
  Briefcase,
  Plus,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import AddLeadDialog from '@/components/leads/AddLeadDialog';
import LeadCard from '@/components/leads/LeadCard';
import AdPlacement from '@/components/ads/AdPlacement';

const STAGES = [
  { value: 'all', label: 'All Stages' },
  { value: 'new_lead', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal_sent', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

const GRADES = [
  { value: 'all', label: 'All Grades' },
  { value: 'A', label: 'A - Hot' },
  { value: 'B', label: 'B - Warm' },
  { value: 'C', label: 'C - Cool' },
  { value: 'D', label: 'D - Cold' },
];

export default function Leads() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');

  const { data: leads, isLoading, refetch } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return [];
      return base44.entities.Lead.filter({ user_id: user.id }, '-created_date');
    },
  });

  const { data: forms } = useQuery({
    queryKey: ['leadForms'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return [];
      return base44.entities.LeadForm.filter({ user_id: user.id });
    },
  });

  const stats = {
    total: leads?.length || 0,
    newLeads: leads?.filter(l => l.stage === 'new_lead').length || 0,
    won: leads?.filter(l => l.stage === 'won').length || 0,
    hotLeads: leads?.filter(l => l.grade === 'A').length || 0,
    totalValue: leads?.reduce((sum, l) => sum + (l.estimated_value || 0), 0) || 0,
  };

  const updateStageMutation = useMutation({
    mutationFn: async ({ leadId, newStage }) => {
      const user = await base44.auth.me();
      await base44.entities.Lead.update(leadId, { stage: newStage });
      
      if (newStage === 'won') {
        await base44.entities.LeadStageChange.create({
          lead_id: leadId,
          user_id: user.id,
          from_stage: leads.find(l => l.id === leadId).stage,
          to_stage: newStage,
          won_date: new Date().toISOString(),
        });
      }
      toast.success('Lead updated!');
      refetch();
    },
    onError: () => {
      toast.error('Failed to update lead');
    },
  });

  const filteredLeads = leads?.filter(lead => {
    const matchSearch = !search || 
      lead.lead_name?.toLowerCase().includes(search.toLowerCase()) ||
      lead.company?.toLowerCase().includes(search.toLowerCase()) ||
      lead.lead_email?.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === 'all' || lead.stage === stageFilter;
    const matchGrade = gradeFilter === 'all' || lead.grade === gradeFilter;
    return matchSearch && matchStage && matchGrade;
  }) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Beautiful Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Users className="w-8 h-8" />
                </div>
                <h1 className="text-4xl font-bold">Leads & CRM</h1>
              </div>
              <p className="text-xl text-blue-100 max-w-2xl">
                Manage your sales pipeline, track leads, and close more deals with our powerful CRM system.
              </p>
              
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3 mt-8">
                <AddLeadDialog onSuccess={refetch} />
                <Link to="/leads/forms">
                  <Button variant="outline" className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30">
                    <Target className="w-4 h-4" />
                    Lead Forms
                  </Button>
                </Link>
                <Link to="/leads/forms/ai">
                  <Button variant="outline" className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30">
                    <Zap className="w-4 h-4" />
                    AI Form Builder
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white/10 backdrop-blur-sm border-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{stats.total}</p>
                      <p className="text-sm text-blue-100">Total Leads</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/30 rounded-lg">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{stats.won}</p>
                      <p className="text-sm text-blue-100">Won Deals</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/30 rounded-lg">
                      <Star className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{stats.hotLeads}</p>
                      <p className="text-sm text-blue-100">Hot Leads</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/30 rounded-lg">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{(stats.totalValue / 1000).toFixed(1)}K</p>
                      <p className="text-sm text-blue-100">Pipeline Value</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
        {/* Search and Filters */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, company, or email..."
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Filter className="w-4 h-4" />
                  <span>Filters:</span>
                </div>
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm hover:border-blue-500 transition-colors"
                >
                  {STAGES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm hover:border-blue-500 transition-colors"
                >
                  {GRADES.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leads Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="h-64 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredLeads.length === 0 ? (
          <Card className="py-16">
            <CardContent className="text-center">
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold mb-2">No leads found</h3>
              <p className="text-gray-500 mb-6">
                {leads?.length === 0 
                  ? "Start building your pipeline by adding your first lead!"
                  : "Try adjusting your filters to see more results."}
              </p>
              {leads?.length === 0 && <AddLeadDialog onSuccess={refetch} />}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLeads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} onStageChange={(l, ns) => updateStageMutation.mutate({ leadId: l.id, newStage: ns })} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}