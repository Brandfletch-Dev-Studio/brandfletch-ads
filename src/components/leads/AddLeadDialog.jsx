import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';

const STAGES = [
  { value: 'new_lead', label: 'New Lead' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal_sent', label: 'Proposal Sent' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

const GRADES = [
  { value: 'A', label: 'A - Hot Lead' },
  { value: 'B', label: 'B - Warm Lead' },
  { value: 'C', label: 'C - Cool Lead' },
  { value: 'D', label: 'D - Cold Lead' },
];

export default function AddLeadDialog({ onSuccess }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [importMode, setImportMode] = useState(false);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    lead_name: '',
    lead_email: '',
    lead_phone: '',
    company: '',
    stage: 'new_lead',
    grade: 'B',
    lead_source: '',
    notes: '',
    estimated_value: '',
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.entities.Lead.create({
        ...data,
        user_id: user.id,
        estimated_value: data.estimated_value ? parseFloat(data.estimated_value) : null,
      });
    },
    onError: () => {
      toast.error('Failed to create lead');
    },
  });

  const importLeadsMutation = useMutation({
    mutationFn: async (fileData) => {
      const user = await base44.auth.me();
      const text = await fileData.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const leads = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const lead = { user_id: user.id };
        headers.forEach((header, idx) => {
          if (header === 'name' || header === 'lead_name') lead.lead_name = values[idx];
          else if (header === 'email' || header === 'lead_email') lead.lead_email = values[idx];
          else if (header === 'phone' || header === 'lead_phone') lead.lead_phone = values[idx];
          else if (header === 'company') lead.company = values[idx];
          else if (header === 'stage') lead.stage = values[idx] || 'new_lead';
          else if (header === 'grade') lead.grade = values[idx] || 'B';
          else if (header === 'source' || header === 'lead_source') lead.lead_source = values[idx];
          else if (header === 'notes') lead.notes = values[idx];
          else if (header === 'estimated_value') lead.estimated_value = parseFloat(values[idx]) || null;
        });
        if (lead.lead_name) leads.push(lead);
      }
      
      if (leads.length === 0) throw new Error('No valid leads found in file');
      await base44.entities.Lead.bulkCreate(leads);
      return leads.length;
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to import leads');
    },
  });

  const resetForm = () => {
    setFormData({
      lead_name: '',
      lead_email: '',
      lead_phone: '',
      company: '',
      stage: 'new_lead',
      grade: 'B',
      lead_source: '',
      notes: '',
      estimated_value: '',
    });
  };

  const handleSubmit = () => {
    if (!formData.lead_name) {
      toast.error('Lead name is required');
      return;
    }
    createLeadMutation.mutate(formData);
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile && (uploadedFile.name.endsWith('.csv') || uploadedFile.name.endsWith('.txt'))) {
      setFile(uploadedFile);
    } else {
      toast.error('Please upload a CSV or TXT file');
    }
  };

  const handleImport = () => {
    if (!file) {
      toast.error('Please select a file to import');
      return;
    }
    importLeadsMutation.mutate(file);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-lg">
          <Plus className="w-4 h-4" />
          Add Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {importMode ? 'Import Leads' : 'Add New Lead'}
          </DialogTitle>
        </DialogHeader>

        {!importMode ? (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button
                variant={!importMode ? 'default' : 'outline'}
                onClick={() => setImportMode(false)}
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                Manual Entry
              </Button>
              <Button
                variant={importMode ? 'default' : 'outline'}
                onClick={() => setImportMode(true)}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import File
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Lead Name *</Label>
                <Input
                  value={formData.lead_name}
                  onChange={(e) => setFormData({ ...formData, lead_name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <Label>Company</Label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Acme Corp"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.lead_email}
                  onChange={(e) => setFormData({ ...formData, lead_email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  type="tel"
                  value={formData.lead_phone}
                  onChange={(e) => setFormData({ ...formData, lead_phone: e.target.value })}
                  placeholder="+265 999 123 456"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Stage</Label>
                <Select value={formData.stage} onValueChange={(v) => setFormData({ ...formData, stage: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Grade</Label>
                <Select value={formData.grade} onValueChange={(v) => setFormData({ ...formData, grade: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADES.map((g) => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Lead Source</Label>
              <Input
                value={formData.lead_source}
                onChange={(e) => setFormData({ ...formData, lead_source: e.target.value })}
                placeholder="Website, Referral, Social Media, etc."
              />
            </div>

            <div>
              <Label>Estimated Value</Label>
              <Input
                type="number"
                value={formData.estimated_value}
                onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                placeholder="100000"
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this lead..."
                className="min-h-[80px]"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="flex-1" disabled={createLeadMutation.isPending}>
                {createLeadMutation.isPending ? 'Creating...' : 'Create Lead'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button
                variant={!importMode ? 'default' : 'outline'}
                onClick={() => setImportMode(false)}
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                Manual Entry
              </Button>
              <Button
                variant={importMode ? 'default' : 'outline'}
                onClick={() => setImportMode(true)}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import File
              </Button>
            </div>

            <Card className="border-dashed border-2">
              <CardContent className="p-6 text-center">
                <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="font-medium mb-2">Upload CSV or TXT file</p>
                <p className="text-sm text-gray-500 mb-4">
                  Required columns: name, email (optional), phone (optional), company (optional)
                </p>
                <Input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="max-w-xs mx-auto"
                />
                {file && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-sm text-green-600">
                    <FileText className="w-4 h-4" />
                    <span>{file.name}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => { setImportMode(false); setFile(null); }} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!file || importLeadsMutation.isPending} className="flex-1">
                {importLeadsMutation.isPending ? 'Importing...' : 'Import Leads'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}