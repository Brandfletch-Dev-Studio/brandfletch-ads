import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter,
  Target,
  Zap,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import AddLeadDialog from '@/components/leads/AddLeadDialog';
import LeadCard from '@/components/leads/LeadCard';
import KanbanBoard from '@/components/leads/KanbanBoard';

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
  const [viewMode, setViewMode] = useState('kanban');

  const { data: leads, isLoading, refetch } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return [];
      return base44.entities.Lead.filter({ user_id: user.id }, '-created_date');
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
      const lead = leads.find(l => l.id === leadId);
      await base44.entities.Lead.update(leadId, { stage: newStage });
      
      if (newStage === 'won') {
        await base44.entities.LeadStageChange.create({
          lead_id: leadId,
          user_id: user.id,
          from_stage: lead?.stage || 'unknown',
          to_stage: newStage,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
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

  const handleStageChange = (lead, newStage) => {
    updateStageMutation.mutate({ leadId: lead.id, newStage });
  };

  const handleExportCSV = () => {
    if (!filteredLeads || filteredLeads.length === 0) {
      toast.error('No leads to export');
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Company', 'Stage', 'Grade', 'Estimated Value', 'Source', 'Created Date'];
    const csvData = filteredLeads.map(lead => [
      lead.lead_name || '',
      lead.lead_email || '',
      lead.lead_phone || '',
      lead.company || '',
      lead.stage || '',
      lead.grade || '',
      lead.estimated_value || '',
      lead.lead_source || '',
      new Date(lead.created_date).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Leads exported successfully!');
  };

  return (
    <div className="p-[15px] space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-6 md:p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold font-heading mb-2" style={{ paddingLeft: '20px' }}>
            Lead Management
          </h1>
          <p className="text-white/90 mb-6 max-w-2xl" style={{ paddingLeft: '20px' }}>
            Track and manage your sales pipeline
          </p>
          <div style={{ paddingLeft: '20px' }}>
            <div className="flex flex-wrap gap-3">
              <AddLeadDialog onSuccess={refetch} />
              <Link to="/leads/forms">
                <Button variant="outline" className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30">
                  <Target className="w-4 h-4" />
                  Lead Forms
                </Button>
              </Link>

              <Button variant="outline" className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30" onClick={handleExportCSV}>
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <Card className="shadow-lg">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, company, or email..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <span className="text-sm text-gray-500">Filters:</span>
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
              <div className="border-l border-gray-300 h-6 mx-2" />
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 px-3 text-sm"
                >
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className="h-8 px-3 text-sm"
                >
                  Kanban
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredLeads.length === 0 ? (
        <Card className="py-16">
          <CardContent className="text-center">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {search || stageFilter !== 'all' ? 'No leads found' : 'No leads yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {search || stageFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start building your pipeline by adding your first lead'}
            </p>
            {!search && stageFilter === 'all' && (
              <AddLeadDialog onSuccess={refetch} />
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'kanban' ? (
        <KanbanBoard 
          leads={filteredLeads} 
          onStageChange={handleStageChange}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onStageChange={handleStageChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}