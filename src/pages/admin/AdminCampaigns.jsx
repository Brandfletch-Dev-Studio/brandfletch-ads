import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Search, Trash2, FlaskConical, Wifi } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import { format } from 'date-fns';
import { isTestMode, setTestMode } from '@/lib/testMode';
import { toast } from 'sonner';

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [testMode, setTestModeState] = useState(isTestMode());
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const c = await base44.entities.Campaign.list('-created_date', 500);
    setCampaigns(c);
    setLoading(false);
  }

  function toggleMode() {
    const next = !testMode;
    setTestMode(next);
    setTestModeState(next);
  }

  async function handleDelete(id) {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    setDeletingId(id);
    setConfirmId(null);
    await base44.entities.Campaign.delete(id);
    setCampaigns(prev => prev.filter(c => c.id !== id));
    setDeletingId(null);
    toast.success('Campaign deleted');
  }

  const STATUSES = ['all', 'pending_review', 'awaiting_payment', 'active', 'approved', 'paused', 'completed', 'rejected'];

  const filtered = campaigns.filter(c => {
    const matchTest = testMode ? c.is_test === true : c.is_test !== true;
    const matchSearch = !search || c.page_name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || c.status === filter;
    return matchTest && matchSearch && matchFilter;
  });

  const formatCost = (c) => {
    const amt = c.total_cost || 0;
    const currency = c.currency || 'USD';
    if (currency === 'USD') return `$${amt.toFixed(2)}`;
    return `${currency} ${amt.toLocaleString()}`;
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-heading">All Campaigns</h1>
          <p className="text-muted-foreground text-sm mt-1">{filtered.length} {testMode ? 'test' : 'live'} campaigns</p>
        </div>
        {/* Test / Live toggle */}
        <button
          onClick={toggleMode}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
            testMode
              ? 'border-amber-400 bg-amber-50 text-amber-700'
              : 'border-green-400 bg-green-50 text-green-700'
          }`}
        >
          {testMode ? <FlaskConical className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
          {testMode ? 'Test Mode' : 'Live Mode'}
        </button>
      </div>

      {testMode && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-center gap-2">
          <FlaskConical className="w-4 h-4 shrink-0" />
          You are viewing <strong>test campaigns only</strong>. Switch to Live Mode to see real campaigns.
        </div>
      )}

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
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">No {testMode ? 'test' : 'live'} campaigns found</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <div key={c.id} className="relative group">
              <Link to={`/admin/campaigns/${c.id}`}>
                <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 pr-14">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm truncate">{c.page_name || 'Campaign'}</p>
                          {c.is_test && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold shrink-0">TEST</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">{c.package} · {c.duration} · {formatCost(c)} · {c.country || '—'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <StatusBadge status={c.status} />
                        <p className="text-xs text-muted-foreground">{c.created_date ? format(new Date(c.created_date), 'MMM d, yyyy') : ''}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              {/* Delete button */}
              <button
                onClick={e => { e.preventDefault(); handleDelete(c.id); }}
                disabled={deletingId === c.id}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                  confirmId === c.id
                    ? 'bg-red-500 text-white'
                    : 'opacity-0 group-hover:opacity-100 bg-red-50 text-red-500 hover:bg-red-100'
                }`}
                title={confirmId === c.id ? 'Click again to confirm delete' : 'Delete campaign'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dismiss confirm on outside click */}
      {confirmId && (
        <div className="fixed inset-0 z-0" onClick={() => setConfirmId(null)} />
      )}
    </div>
  );
}