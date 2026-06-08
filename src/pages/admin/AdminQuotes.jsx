import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText, Search, DollarSign, Clock, CheckCircle,
  TrendingUp, BarChart3, MessageSquare, Eye, ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useRoleGuard } from '@/hooks/useRoleGuard';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-amber-100 text-amber-700' },
  invoiced:  { label: 'Invoiced',  color: 'bg-blue-100 text-blue-700' },
  paid:      { label: 'Paid',      color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500' },
};

const SERVICE_LABELS = {
  meta_ads:       'Meta Ads Management',
  graphic_design: 'Graphic Design',
  social_media:   'Social Media Management',
  web_development:'Web Development',
};

function formatMoney(amount, currency) {
  if (!amount) return '—';
  if (currency === 'MWK') return `MK ${Number(amount).toLocaleString()}`;
  if (currency === 'USD') return `$${Number(amount).toFixed(2)}`;
  return `${currency} ${Number(amount).toLocaleString()}`;
}

export default function AdminQuotes() {
  useRoleGuard(null, 'campaigns.view');
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ['adminQuotes'],
    queryFn: () => base44.entities.QuoteRequest.list('-created_date', 500).catch(() => []),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.QuoteRequest.update(id, data),
  });

  // Stats
  const total    = quotes.length;
  const paid     = quotes.filter(q => q.status === 'paid').length;
  const pending  = quotes.filter(q => q.status === 'pending' || q.status === 'invoiced').length;
  const revenue  = quotes.filter(q => q.status === 'paid').reduce((s, q) => s + (q.amount || 0), 0);
  const serviceCounts = quotes.reduce((acc, q) => { acc[q.service_type] = (acc[q.service_type] || 0) + 1; return acc; }, {});
  const topService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  const filtered = quotes.filter(q => {
    const qL = search.toLowerCase();
    const matchSearch = !search || q.user_name?.toLowerCase().includes(qL) || q.business_name?.toLowerCase().includes(qL) || q.invoice_number?.toLowerCase().includes(qL);
    const matchStatus = statusFilter === 'all' || q.status === statusFilter;
    const matchService = serviceFilter === 'all' || q.service_type === serviceFilter;
    return matchSearch && matchStatus && matchService;
  });

  function contactWhatsApp(q) {
    const msg = encodeURIComponent(`Hello ${q.user_name || 'there'}, this is Brandfletch Media regarding your quote #${q.invoice_number || ''} for ${SERVICE_LABELS[q.service_type] || q.service_type}. How can we help?`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
          <FileText className="w-6 h-6 text-[hsl(var(--accent))]" /> Quote Management
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Track all quote requests, invoices, and conversions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Quotes',  value: total,   icon: FileText,   color: 'text-sky-600',    bg: 'bg-sky-50' },
          { label: 'Paid',          value: paid,    icon: CheckCircle,color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Pending',       value: pending, icon: Clock,      color: 'text-amber-600',  bg: 'bg-amber-50' },
          { label: 'Revenue (MWK)', value: `MK ${revenue.toLocaleString()}`, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Top Service',   value: topService ? SERVICE_LABELS[topService]?.split(' ')[0] : '—', icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground leading-tight">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, business, or invoice..." className="pl-9 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k,v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={serviceFilter} onValueChange={setServiceFilter}>
          <SelectTrigger className="w-44 h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {Object.entries(SERVICE_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-secondary rounded-lg animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No quotes found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Invoice','Client','Service','Package','Amount','Status','Date','Actions'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(q => {
                    const cfg = STATUS_CONFIG[q.status] || STATUS_CONFIG.pending;
                    return (
                      <tr key={q.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3">
                          <code className="text-xs bg-secondary px-2 py-0.5 rounded font-mono">{q.invoice_number || '—'}</code>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{q.user_name || '—'}</p>
                          <p className="text-xs text-muted-foreground">{q.business_name || q.user_email}</p>
                        </td>
                        <td className="px-4 py-3 text-sm">{SERVICE_LABELS[q.service_type] || q.service_type}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground capitalize">{q.selected_package || '—'}</td>
                        <td className="px-4 py-3 font-semibold text-green-600">{formatMoney(q.amount, q.currency)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {q.created_date ? format(new Date(q.created_date), 'MMM d, yyyy') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            {q.status === 'invoiced' && (
                              <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => updateMut.mutate({ id: q.id, data: { status: 'paid' } })}>
                                Mark Paid
                              </Button>
                            )}
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                              onClick={() => contactWhatsApp(q)}>
                              <MessageSquare className="w-3 h-3" /> Contact
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
