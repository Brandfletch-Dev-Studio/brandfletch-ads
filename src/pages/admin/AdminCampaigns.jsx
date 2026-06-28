import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Search, Trash2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [selected, setSelected] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    base44.entities.Campaign.list({ sort: '-created_date', limit: 200 }).then(c => {
      setCampaigns(c);
      setLoading(false);
    });
  }, []);

  async function deleteCampaign(e, id) {
    try {
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
    } catch (err) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
    }
  }

  async function deleteBulk() {
    try {
      const toDelete = filtered;
      for (const c of toDelete) {
        await base44.entities.Campaign.delete(c.id);
      }
      setCampaigns(cs => cs.filter(c => !toDelete.find(d => d.id === c.id)));
      setConfirmBulkDelete(false);
      toast.success(`${toDelete.length} campaigns deleted`);
    } catch (err) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
    }
  }

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(c => c.id)));
    }
  }

  async function bulkAction(action) {
    try {
      setBulkLoading(true);
      const ids = [...selected];
      const statusMap = { approve: 'approved', reject: 'rejected' };
      for (const id of ids) {
        if (action === 'delete') {
          await base44.entities.Campaign.delete(id);
        } else {
          await base44.entities.Campaign.update(id, { status: statusMap[action] });
        }
      }
      if (action === 'delete') {
        setCampaigns(cs => cs.filter(c => !selected.has(c.id)));
        toast.success(`${ids.length} campaigns deleted`);
      } else {
        setCampaigns(cs => cs.map(c => selected.has(c.id) ? { ...c, status: statusMap[action] } : c));
        toast.success(`${ids.length} campaigns ${action}d`);
      }
      setSelected(new Set());
      setBulkLoading(false);
    } catch (err) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
    }
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

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20 flex-wrap">
          <span className="text-sm font-semibold text-primary mr-1">{selected.size} selected</span>
          <Button size="sm" variant="outline" className="gap-1.5 text-green-700 border-green-300 hover:bg-green-50" disabled={bulkLoading} onClick={() => bulkAction('approve')}>
            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50" disabled={bulkLoading} onClick={() => bulkAction('reject')}>
            <XCircle className="w-3.5 h-3.5" /> Reject
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10" disabled={bulkLoading} onClick={() => { if (confirm(`Delete ${selected.size} campaigns?`)) bulkAction('delete'); }}>
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </Button>
          <Button size="sm" variant="ghost" className="ml-auto text-muted-foreground" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-xl bg-secondary animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {/* Select all row */}
          {filtered.length > 0 && (
            <div className="flex items-center gap-2 px-1 pb-1">
              <Checkbox
                checked={selected.size === filtered.length && filtered.length > 0}
                onCheckedChange={toggleSelectAll}
                id="select-all"
              />
              <label htmlFor="select-all" className="text-xs text-muted-foreground cursor-pointer select-none">
                {selected.size === filtered.length ? 'Deselect all' : `Select all ${filtered.length}`}
              </label>
            </div>
          )}
          {filtered.map(c => (
            <div key={c.id} className="flex items-center gap-2">
              <Checkbox
                checked={selected.has(c.id)}
                onCheckedChange={() => toggleSelect(c.id)}
                onClick={e => e.stopPropagation()}
              />
              <Link to={`/admin/campaigns/${c.id}`} className="flex-1 min-w-0">
                <Card className={`shadow-sm hover:shadow-md transition-shadow cursor-pointer ${selected.has(c.id) ? 'ring-2 ring-primary/30' : ''}`}>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}