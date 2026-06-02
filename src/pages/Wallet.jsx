import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Wallet as WalletIcon, Plus, TrendingUp, TrendingDown,
  RefreshCw, Upload, CheckCircle2, Clock, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { COUNTRY_CURRENCY, formatLocalCurrency } from '@/lib/constants';

export default function Wallet() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [form, setForm] = useState({ amount: '', reference: '', proof: '' });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { init(); }, []);

  async function init() {
    const u = await base44.auth.me();
    setUser(u);
    const txns = await base44.entities.WalletTransaction.filter({ user_id: u.id }, '-created_date');
    setTransactions(txns);
  }

  const confirmed = transactions.filter(t => t.status === 'confirmed');
  const pending = transactions.filter(t => t.status === 'pending');

  const balance = confirmed.reduce((sum, t) => {
    if (t.type === 'top_up' || t.type === 'refund') return sum + (t.amount || 0);
    if (t.type === 'payment') return sum - (t.amount || 0);
    return sum;
  }, 0);

  const pendingAmount = pending
    .filter(t => t.type === 'top_up')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, proof: file_url }));
    setUploading(false);
    toast.success('Proof uploaded!');
  }

  async function handleSubmit() {
    if (!form.amount || !form.reference || !form.proof) {
      toast.error('Please fill in all fields and upload proof.');
      return;
    }
    setSubmitting(true);
    await base44.entities.WalletTransaction.create({
      user_id: user.id,
      type: 'top_up',
      amount: parseFloat(form.amount),
      payment_reference: form.reference,
      payment_proof_url: form.proof,
      status: 'pending',
      description: 'Wallet top-up',
    });
    toast.success('Top-up submitted! Our team will verify shortly.');
    setShowAddFunds(false);
    setForm({ amount: '', reference: '', proof: '' });
    const txns = await base44.entities.WalletTransaction.filter({ user_id: user.id }, '-created_date');
    setTransactions(txns);
    setSubmitting(false);
  }

  const statusConfig = {
    pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
    confirmed: { label: 'Confirmed', className: 'bg-green-100 text-green-700' },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
  };

  const typeConfig = {
    top_up: { icon: ArrowUpRight, color: 'text-green-600', bg: 'bg-green-50', prefix: '+' },
    payment: { icon: ArrowDownLeft, color: 'text-red-600', bg: 'bg-red-50', prefix: '-' },
    refund: { icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-50', prefix: '+' },
  };

  const currencyCfg = COUNTRY_CURRENCY[user?.country];
  const currencyLabel = currencyCfg ? `${currencyCfg.name} (${currencyCfg.code})` : 'USD';

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Wallet</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your advertising balance · {currencyLabel}</p>
        </div>
        <Button onClick={() => setShowAddFunds(true)} className="gap-2 bg-[hsl(var(--primary))] text-primary-foreground">
          <Plus className="w-4 h-4" /> Add Funds
        </Button>
      </div>

      {/* Balance cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--navy-light))] border-0 text-primary-foreground shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <WalletIcon className="w-4 h-4 opacity-70" />
              <span className="text-xs opacity-70 font-medium uppercase tracking-wide">Available Balance</span>
            </div>
            <p className="text-3xl font-bold font-heading">{formatLocalCurrency(balance, user?.country)}</p>
            <p className="text-xs opacity-50 mt-1">Ready to spend</p>
          </CardContent>
        </Card>

        {pendingAmount > 0 && (
          <Card className="bg-amber-50 border-amber-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-xs text-amber-700 font-medium uppercase tracking-wide">Pending Verification</span>
              </div>
              <p className="text-3xl font-bold font-heading text-amber-800">{formatLocalCurrency(pendingAmount, user?.country)}</p>
              <p className="text-xs text-amber-600 mt-1">Awaiting confirmation</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transaction History */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Transaction History</CardTitle>
            <span className="text-xs text-muted-foreground">{transactions.length} transactions</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="py-12 text-center">
              <WalletIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">No transactions yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add funds to get started</p>
              <Button size="sm" variant="outline" className="mt-4" onClick={() => setShowAddFunds(true)}>
                <Plus className="w-4 h-4 mr-1" /> Add Funds
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {transactions.map(t => {
                const tc = typeConfig[t.type] || typeConfig.top_up;
                const sc = statusConfig[t.status] || statusConfig.pending;
                const TIcon = tc.icon;
                return (
                  <div key={t.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl ${tc.bg} flex items-center justify-center flex-shrink-0`}>
                        <TIcon className={`w-4 h-4 ${tc.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{t.description || t.type.replace('_', ' ')}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.created_date ? format(new Date(t.created_date), 'MMM d, yyyy') : ''}
                          {t.payment_reference && ` · Ref: ${t.payment_reference}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 flex-shrink-0 ml-3">
                      <span className={`text-sm font-bold tabular-nums ${t.type === 'payment' ? 'text-red-600' : 'text-green-600'}`}>
                        {tc.prefix}{formatLocalCurrency(t.amount || 0, user?.country)}
                      </span>
                      <Badge className={`text-xs px-2 py-0.5 ${sc.className}`}>{sc.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Funds Dialog */}
      <Dialog open={showAddFunds} onOpenChange={setShowAddFunds}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <WalletIcon className="w-5 h-5" /> Add Funds to Wallet
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-1">
            <div className="p-3 rounded-xl bg-secondary/60 text-xs text-muted-foreground">
              Transfer funds to our account, then submit your reference and proof of payment below. Our team will verify and credit your wallet.
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Amount ({currencyCfg ? currencyCfg.code : 'USD'}) *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                  {currencyCfg ? currencyCfg.symbol : '$'}
                </span>
                <Input
                  type="number"
                  min="1"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                  className="pl-7 h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Transaction Reference *</Label>
              <Input
                value={form.reference}
                onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                placeholder="e.g. TXN-123456789"
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Proof of Payment *</Label>
              <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                form.proof ? 'border-green-400 bg-green-50' : 'border-border hover:bg-secondary/40 hover:border-[hsl(var(--accent))]/50'
              }`}>
                {form.proof ? (
                  <div className="text-center">
                    <CheckCircle2 className="w-7 h-7 text-green-600 mx-auto mb-1" />
                    <p className="text-sm text-green-700 font-medium">Proof uploaded</p>
                    <p className="text-xs text-green-600">Click to replace</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-1.5" />
                    <p className="text-sm font-medium text-muted-foreground">{uploading ? 'Uploading...' : 'Click to upload'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Image or PDF accepted</p>
                  </div>
                )}
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowAddFunds(false)} className="flex-1">Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !form.amount || !form.reference || !form.proof}
                className="flex-1 bg-[hsl(var(--primary))] text-primary-foreground"
              >
                {submitting ? 'Submitting...' : 'Submit Top-Up'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}