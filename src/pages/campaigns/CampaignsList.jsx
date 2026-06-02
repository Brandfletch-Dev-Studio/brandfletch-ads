import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import StatusBadge from '@/components/ui/StatusBadge';
import { format } from 'date-fns';
import AdPlacement from '@/components/ads/AdPlacement';

export default function CampaignsList() {
  const [campaigns, setCampaigns] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

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

  const STATUSES = ['all', 'draft', 'awaiting_payment', 'pending_review', 'active', 'paused', 'completed', 'rejected'];

  const filtered = campaigns.filter(c => {
    const matchSearch = !search || c.page_name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || c.status === filter;
    return matchSearch && matchFilter;
  });

  const formatCost = (c) => {
    if (c.currency === 'MWK') return `MK${(c.total_cost || 0).toLocaleString()}`;
    return `$${(c.total_cost || 0).toFixed(2)}`;
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <AdPlacement placement="campaigns_top" userId={userId} hasCampaigns={campaigns.length > 0} />
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">My Campaigns</h1>
          <p className="text-muted-foreground text-sm mt-1">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link to="/campaigns/new">
          <Button className="gap-2 bg-[hsl(var(--primary))] text-primary-foreground font-semibold">
            <Plus className="w-4 h-4" /> New Campaign
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns..." className="pl-9" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUSES.slice(0, 5).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filter === s ? 'bg-[hsl(var(--primary))] text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}
            >
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
          <h3 className="font-semibold text-lg mb-2">No campaigns found</h3>
          <p className="text-muted-foreground text-sm mb-6">
            {campaigns.length === 0 ? "You haven't created any campaigns yet." : "No campaigns match your filters."}
          </p>
          {campaigns.length === 0 && (
            <Link to="/campaigns/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Create Campaign
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <Link key={c.id} to={`/campaigns/${c.id}`}>
              <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary))]/10 flex items-center justify-center flex-shrink-0">
                        <Megaphone className="w-5 h-5 text-[hsl(var(--primary))]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate group-hover:text-[hsl(var(--accent))] transition-colors">{c.page_name || 'Campaign'}</p>
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">
                          {c.package} · {c.duration} · {formatCost(c)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <StatusBadge status={c.status} />
                      <p className="text-xs text-muted-foreground">
                        {c.created_date ? format(new Date(c.created_date), 'MMM d, yyyy') : ''}
                      </p>
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