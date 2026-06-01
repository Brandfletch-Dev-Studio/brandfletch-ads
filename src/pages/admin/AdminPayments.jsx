import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, X, ExternalLink, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AdminPayments() {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState({});
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const data = await base44.entities.WalletTransaction.list('-created_date', 200);
    setTransactions(data);
  }

  const staffUser = async () => base44.auth.me();

  async function verify(id, status, txn) {
    setProcessing(p => ({ ...p, [id]: true }));
    const user = await staffUser();
    await base44.entities.WalletTransaction.update(id, {
      status,
      verified_by: user.id,
      finance_notes: notes[id] || '',
    });

    // If confirming a campaign payment, update campaign status
    if (status === 'confirmed' && txn.campaign_id) {
      await base44.entities.Campaign.update(txn.campaign_id, { status: 'pending_review' });
      // Notify client
      if (txn.user_id) {
        await base44.entities.Notification.create({
          recipient_id: txn.user_id,
          type: 'payment_confirmed',
          title: '✅ Payment Confirmed!',
          message: 'Your payment has been verified. Your campaign is now under review.',
          campaign_id: txn.campaign_id,
          is_read: false,
        });
      }
    }

    if (status === 'rejected' && txn.user_id) {
      await base44.entities.Notification.create({
        recipient_id: txn.user_id,
        type: 'payment_rejected',
        title: '❌ Payment Rejected',
        message: `Your payment could not be verified. Reason: ${notes[id] || 'Please contact support.'}`,
        campaign_id: txn.campaign_id,
        is_read: false,
      });
    }

    toast.success(`Payment ${status}`);
    load();
    setProcessing(p => ({ ...p, [id]: false }));
  }

  const FILTERS = ['all', 'pending', 'confirmed', 'rejected'];
  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  const filtered = transactions.filter(t => {
    const matchFilter = filter === 'all' || t.status === filter;
    const matchSearch = !search || t.payment_reference?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Payment Verifications</h1>
        <p className="text-muted-foreground text-sm mt-1">{transactions.filter(t => t.status === 'pending').length} pending verifications</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by reference..." className="pl-9" />
        </div>
        <div className="flex gap-2">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                filter === f ? 'bg-[hsl(var(--primary))] text-primary-foreground' : 'bg-secondary text-muted-foreground'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map(t => (
          <Card key={t.id} className={`shadow-sm ${t.status === 'pending' ? 'border-amber-200' : ''}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{t.description || t.type.replace('_', ' ')}</p>
                    <Badge className={`text-xs ${statusColors[t.status]}`}>{t.status}</Badge>
                    <Badge variant="outline" className="text-xs capitalize">{t.type.replace('_', ' ')}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xl font-bold text-[hsl(var(--primary))]">
                      ${(t.amount || 0).toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">{t.payment_method || '—'}</span>
                    <span className="text-sm text-muted-foreground font-mono text-xs">{t.payment_reference}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.created_date ? format(new Date(t.created_date), 'MMM d, yyyy HH:mm') : ''}
                    {t.campaign_id ? ` · Campaign ID: ${t.campaign_id.slice(0, 8)}...` : ''}
                  </p>
                </div>
                {t.payment_proof_url && (
                  <a href={t.payment_proof_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-secondary transition-colors flex-shrink-0">
                    <ExternalLink className="w-3.5 h-3.5" /> View Proof
                  </a>
                )}
              </div>

              {t.status === 'pending' && (
                <div className="space-y-3 pt-3 border-t border-border">
                  <Textarea
                    value={notes[t.id] || ''}
                    onChange={e => setNotes(n => ({ ...n, [t.id]: e.target.value }))}
                    placeholder="Optional notes (shown to client on rejection)"
                    rows={2}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => verify(t.id, 'confirmed', t)}
                      disabled={processing[t.id]}
                      className="gap-2 bg-green-600 hover:bg-green-700 text-white flex-1"
                    >
                      <Check className="w-4 h-4" /> Confirm Payment
                    </Button>
                    <Button
                      onClick={() => verify(t.id, 'rejected', t)}
                      disabled={processing[t.id]}
                      variant="outline"
                      className="gap-2 border-red-400 text-red-600 hover:bg-red-50 flex-1"
                    >
                      <X className="w-4 h-4" /> Reject
                    </Button>
                  </div>
                </div>
              )}

              {t.finance_notes && (
                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border italic">{t.finance_notes}</p>
              )}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No transactions found</div>
        )}
      </div>
    </div>
  );
}