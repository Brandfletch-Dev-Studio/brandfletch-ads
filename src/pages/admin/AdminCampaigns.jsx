import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Search, Trash2, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  useEffect(() => {
    base44.entities.Campaign.list('-created_date', 200).then(c => {
      setCampaigns(c);
      setLoading(false);
    });
  }, []);

  async function deleteCampaign(e, id) {
    e.preventDefault();
    e.stopPropagation();
    if (deletingId === id) {
      await base44.entities.Campaign.delete(id);
      setCampaigns(cs => cs.filter(c => c.id !== id));
      setDeletingId(null);
      toast.success('Campaign deleted');
    } else {
      setDeletingId(id);
    }
  }

  async function deleteBulk() {
    const toDelete = filtered;
    for (const c of toDelete) {
      await base44.entities.Campaign.delete(c.id);
    }
    setCampaigns(cs => cs.filter(c => !toDelete.find(d => d.id === c.id)));
    setConfirmBulkDelete(false);
    toast.success(`${toDelete.length} campaigns deleted`);
  }

  const STATUSES = ['all', 'pending_review', 'awaiting_payment', 'active', 'approved', 'paused', 'completed', 'rejected'];

  const filtered = campaigns.filter(c => {
    const matchSearch = !search || c.page_name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || c.status === filter;
    return matchSearch && matchFilter;
  });

  const formatCost = (c) => {
    const amt = c.total_cost || 0;
    const currency = c.currency || 'USD';
    if (currency === 'USD') return `$${amt.toFixed(2)}`;
    return `${currency} ${amt.toLocaleString()}`;
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-heading">All Campaigns</h1>
          <p className="text-muted-foreground text-sm mt-1">{campaigns.length} total campaigns</p>
        </div>
        {filtered.length > 0 && filter !== 'all' && (
          confirmBulkDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-destructive font-medium">Delete all {filtered.length} {filter.replace(/_/g,' ')} campaigns?</span>
              <Button size="sm" variant="destructive" onClick={deleteBulk}>Yes, delete all</Button>
              <Button size="sm" variant="outline" onClick={() => setConfirmBulkDelete(false)}>Cancel</Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" className="text-destructive border-destructive/40 hover:bg-destructive/10 gap-1.5" onClick={() => setConfirmBulkDelete(true)}>
              <Trash2 className="w-3.5 h-3.5" /> Delete all {filtered.length} {filter.replace(/_/g,' ')}
            </Button>
          )
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by page name..." className="pl-9" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filter === s ? 'bg-[hsl(var(--primary))] text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}>
              {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-xl bg-secondary animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <Link key={c.id} to={`/admin/campaigns/${c.id}`}>
              <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{c.campaign_name || c.page_name || 'Campaign'}</p>
                        <p className="text-xs text-muted-foreground capitalize">{c.package} · {c.duration} · {formatCost(c)} · {c.country || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex flex-col items-end gap-1.5">
                        <StatusBadge status={c.status} />
                        <p className="text-xs text-muted-foreground">{c.created_date ? format(new Date(c.created_date), 'MMM d, yyyy') : ''}</p>
                      </div>
                      <button
                        onClick={(e) => deleteCampaign(e, c.id)}
                        title={deletingId === c.id ? 'Click again to confirm' : 'Delete campaign'}
                        className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${deletingId === c.id ? 'bg-destructive/10 text-destructive' : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'}`}
                      >
                        {deletingId === c.id ? <AlertTriangle className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}