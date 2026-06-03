import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Megaphone, Trash2, FlaskConical, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import StatusBadge from '@/components/ui/StatusBadge';
import { format } from 'date-fns';
import AdPlacement from '@/components/ads/AdPlacement';
import { isTestMode, setTestMode } from '@/lib/testMode';
import { toast } from 'sonner';

export default function CampaignsList() {
  const [campaigns, setCampaigns] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [testMode, setTestModeState] = useState(isTestMode());
  const [confirmId, setConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const user = await base44.auth.me();
    setUserId(user.id);
    const data = await base44.entities.Campaign.filter({ user_id: user.id }, '-created_date');
    setCampaigns(data);
    setLoading(false);
  }

  function toggleMode() {
    const next = !testMode;
    setTestMode(next);
    setTestModeState(next);
  }

  async function handleDelete(id) {
    const campaign = campaigns.find(c => c.id === id);
    // Only allow deleting drafts or test campaigns
    if (!campaign?.is_test && campaign?.status !== 'draft') {
      toast.error('Only draft or test campaigns can be deleted.');
      return;
    }
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

  const STATUSES = ['all', 'draft', 'awaiting_payment', 'pending_review', 'active', 'paused', 'completed', 'rejected'];

  const filtered = campaigns.filter(c => {
    const matchTest = testMode ? c.is_test === true : c.is_test !== true;
    const matchSearch = !search || c.page_name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || c.status === filter;
    return matchTest && matchSearch && matchFilter;
  });

  const formatCost = (c) => {
    const amt = c.total_cost || 0;
    const cur = c.currency || 'USD';
    if (cur === 'USD') return `$${amt.toFixed(2)}`;
    return `${cur} ${amt.toLocaleString()}`;
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <AdPlacement placement="campaigns_top" userId={userId} hasCampaigns={campaigns.length > 0} />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-heading">My Campaigns</h1>
          <p className="text-muted-foreground text-sm mt-1">{filtered.length} {testMode ? 'test' : 'live'} campaign{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Test / Live toggle */}
          <button
            onClick={toggleMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
              testMode
                ? 'border-amber-400 bg-amber-50 text-amber-700'
                : 'border-green-400 bg-green-50 text-green-700'
            }`}
          >
            {testMode ? <FlaskConical className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            {testMode ? 'Test' : 'Live'}
          </button>
          <Link to="/campaigns/new">
            <Button className="gap-2 bg-[hsl(var(--primary))] text-primary-foreground font-semibold">
              <Plus className="w-4 h-4" /> New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {testMode && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-center gap-2">
          <FlaskConical className="w-4 h-4 shrink-0" />
          <span><strong>Test Mode:</strong> Showing test campaigns. Switch to Live to see real campaigns.</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns..." className="pl-9" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUSES.slice(0, 5).map(s => (
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
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-secondary animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No {testMode ? 'test' : ''} campaigns found</h3>
          <p className="text-muted-foreground text-sm mb-6">
            {campaigns.filter(c => testMode ? c.is_test : !c.is_test).length === 0
              ? `You haven't created any ${testMode ? 'test ' : ''}campaigns yet.`
              : 'No campaigns match your filters.'}
          </p>
          <Link to="/campaigns/new">
            <Button className="gap-2"><Plus className="w-4 h-4" /> Create Campaign</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <div key={c.id} className="relative group">
              <Link to={`/campaigns/${c.id}`}>
                <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer group/card">
                  <CardContent className="p-5 pr-14">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary))]/10 flex items-center justify-center flex-shrink-0">
                          <Megaphone className="w-5 h-5 text-[hsl(var(--primary))]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold truncate group-hover/card:text-[hsl(var(--accent))] transition-colors">{c.page_name || 'Campaign'}</p>
                            {c.is_test && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold shrink-0">TEST</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground capitalize mt-0.5">{c.package} · {c.duration} · {formatCost(c)}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <StatusBadge status={c.status} />
                        <p className="text-xs text-muted-foreground">{c.created_date ? format(new Date(c.created_date), 'MMM d, yyyy') : ''}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              {/* Delete — only for draft or test campaigns */}
              {(c.is_test || c.status === 'draft') && (
                <button
                  onClick={e => { e.preventDefault(); handleDelete(c.id); }}
                  disabled={deletingId === c.id}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                    confirmId === c.id
                      ? 'bg-red-500 text-white'
                      : 'opacity-0 group-hover:opacity-100 bg-red-50 text-red-500 hover:bg-red-100'
                  }`}
                  title={confirmId === c.id ? 'Click again to confirm' : 'Delete campaign'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {confirmId && (
        <div className="fixed inset-0 z-0" onClick={() => setConfirmId(null)} />
      )}
    </div>
  );
}